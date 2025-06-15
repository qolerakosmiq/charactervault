
'use client';

import *as React from 'react';
import type { Character, InfoDialogContentType, AggregatedFeatEffects, ItemDefinition, ItemInstance, GearSlotId } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Info, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { getAbilityModifierByName, getSizeModifierAC } from '@/lib/dnd-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/context/I18nProvider';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { renderModifierValue } from '@/components/info-dialog-content/dialog-utils';
import { getLocalizedString } from '@/i18n/i18n-data';
import { DEFAULT_LANGUAGE, type LanguageCode } from '@/i18n/config';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper'; // Added

const DEBOUNCE_DELAY = 400;

export interface ArmorClassPanelProps {
  character: Character;
  aggregatedFeatEffects?: AggregatedFeatEffects | null;
  onCharacterUpdate?: (field: keyof Pick<Character, 'acMiscModifier' | 'armorBonus' | 'shieldBonus' | 'naturalArmor' | 'deflectionBonus' | 'dodgeBonus'>, value: number) => void;
  onOpenAcBreakdownDialog?: (contentType: InfoDialogContentType) => void;
}

const ArmorClassPanelComponent = ({ character, aggregatedFeatEffects, onCharacterUpdate, onOpenAcBreakdownDialog }: ArmorClassPanelProps) => {
  const { translations, isLoading: translationsLoading, language: currentLang } = useI18n();

  const handleUpdateCallback = React.useCallback((fieldName: keyof Pick<Character, 'acMiscModifier'>) => (value: number) => {
    if (onCharacterUpdate) {
      onCharacterUpdate(fieldName, value);
    }
  }, [onCharacterUpdate]);

  const [localTemporaryAcModifier, setLocalTemporaryAcModifier] = useDebouncedFormField(
    character?.acMiscModifier || 0,
    handleUpdateCallback('acMiscModifier'),
    DEBOUNCE_DELAY
  );

  const calculateTotalAcComponent = React.useCallback((
    baseCharacterValue: number | undefined,
    featAcType: "dodge" | "armor" | "shield" | "natural" | "deflection" | "insight" | "circumstance" | "untyped" | "monk_wisdom" | "monkScaling" | "other_feat_bonus",
    physicalItemBonus: number,
    acTypeForScope?: 'Normal' | 'Touch' | 'Flat-Footed'
  ): number => {
    let total = (baseCharacterValue || 0) + physicalItemBonus;
    if (aggregatedFeatEffects?.acBonuses) {
      aggregatedFeatEffects.acBonuses.forEach(effect => {
        let effectAppliesToCurrentAcScope = false;
        if (!effect.appliesToScope || effect.appliesToScope.length === 0) {
            effectAppliesToCurrentAcScope = true;
        } else if (acTypeForScope) {
            if (acTypeForScope === 'Normal' && effect.appliesToScope.includes('normal')) effectAppliesToCurrentAcScope = true;
            if (acTypeForScope === 'Touch' && effect.appliesToScope.includes('touch')) effectAppliesToCurrentAcScope = true;
            if (acTypeForScope === 'Flat-Footed' && effect.appliesToScope.includes('flatFooted')) effectAppliesToCurrentAcScope = true;
        } else {
            effectAppliesToCurrentAcScope = true;
        }

        if (effect.isActive && effectAppliesToCurrentAcScope) {
          let valueToAdd = 0;
          if (effect.acType === featAcType) {
            if (typeof effect.value === 'number') {
              valueToAdd = effect.value;
            } else if ((effect.value === "WIS" || effect.value === "INT" || effect.value === "CHA") && character?.abilityScores) {
              const abilityKey = effect.value.toLowerCase() as 'wisdom' | 'intelligence' | 'charisma';
              const abilityMod = getAbilityModifierByName(character.abilityScores, abilityKey);
              if (featAcType === "monk_wisdom" && abilityMod > 0) {
                valueToAdd = abilityMod;
              } else if (featAcType !== "monk_wisdom") {
                 valueToAdd = abilityMod;
              }
            }
          } else if (featAcType === "other_feat_bonus" &&
                     !["dodge", "armor", "shield", "natural", "deflection", "monk_wisdom", "monkScaling"].includes(effect.acType)) {
            if (typeof effect.value === 'number') {
              valueToAdd = effect.value;
            }
          }
          total += valueToAdd;
        }
      });
    }
    return total;
  }, [aggregatedFeatEffects, character?.abilityScores]);


  if (translationsLoading || !translations || !character || !aggregatedFeatEffects) {
    return (
      <LockablePanelWrapper
        title={translations?.UI_STRINGS.armorClassPanelTitle || "Armor Class"}
        description={translations?.UI_STRINGS.armorClassPanelDescription || "Details about your character's defenses."}
        icon={Shield}
        initialLockedState={false}
      >
        {() => (
           <div className="space-y-4">
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">{translations?.UI_STRINGS.armorClassPanelLoading || "Loading AC details..."}</p>
            </div>
          </div>
        )}
      </LockablePanelWrapper>
    );
  }

  const { DEFAULT_ABILITIES, SIZES, UI_STRINGS, ITEM_DEFINITIONS_ARMOR, ITEM_DEFINITIONS_SHIELDS, ABILITY_LABELS, ITEM_DEFINITIONS_MAGIC_ITEMS } = translations;
  const currentAbilityScores = character.abilityScores || DEFAULT_ABILITIES;
  const currentSize = character.size || 'medium';

  const dexModifier = getAbilityModifierByName(currentAbilityScores, 'dexterity');
  const wisModifier = getAbilityModifierByName(currentAbilityScores, 'wisdom');
  const sizeModAC = getSizeModifierAC(currentSize, SIZES);

  const allItemDefinitions = React.useMemo(() => [
    ...(ITEM_DEFINITIONS_ARMOR || []),
    ...(ITEM_DEFINITIONS_SHIELDS || []),
    ...(ITEM_DEFINITIONS_MAGIC_ITEMS || [])
  ], [ITEM_DEFINITIONS_ARMOR, ITEM_DEFINITIONS_SHIELDS, ITEM_DEFINITIONS_MAGIC_ITEMS]);


  const equippedArmorInstanceId = character.equippedGear?.['armor-body'];
  const equippedArmorInstance = equippedArmorInstanceId ? character.inventory.find(i => i.instanceId === equippedArmorInstanceId) : undefined;
  const equippedArmorDefinition = equippedArmorInstance ? allItemDefinitions.find(def => def.definitionId === equippedArmorInstance.definitionId && def.itemType === 'armor') : undefined;
  const physicalArmorBonus = equippedArmorDefinition?.armorBonus || 0;

  const equippedShieldInstanceId = character.equippedGear?.['shield'];
  const equippedShieldInstance = equippedShieldInstanceId ? character.inventory.find(i => i.instanceId === equippedShieldInstanceId) : undefined;
  const equippedShieldDefinition = equippedShieldInstance ? allItemDefinitions.find(def => def.definitionId === equippedShieldInstance.definitionId && def.itemType === 'shield') : undefined;
  const physicalShieldBonus = equippedShieldDefinition?.shieldBonus || 0;

  const totalArmorBonusNormal = calculateTotalAcComponent(0, "armor", physicalArmorBonus, "Normal");
  const totalShieldBonusNormal = calculateTotalAcComponent(0, "shield", physicalShieldBonus, "Normal");
  const totalNaturalArmorNormal = calculateTotalAcComponent(character.naturalArmor, "natural", 0, "Normal");
  const totalDeflectionBonusNormal = calculateTotalAcComponent(character.deflectionBonus, "deflection", 0, "Normal");
  const totalDodgeBonusNormal = calculateTotalAcComponent(character.dodgeBonus, "dodge", 0, "Normal");
  const calculatedFeatMiscAcBonusNormal = calculateTotalAcComponent(0, "other_feat_bonus", 0, "Normal") + calculateTotalAcComponent(0, "monk_wisdom", 0, "Normal") + calculateTotalAcComponent(0, "monkScaling", 0, "Normal");
  const normalAC = 10 + totalArmorBonusNormal + totalShieldBonusNormal + dexModifier + sizeModAC + totalNaturalArmorNormal + totalDeflectionBonusNormal + totalDodgeBonusNormal + calculatedFeatMiscAcBonusNormal + (character.acMiscModifier || 0);

  const totalDeflectionBonusTouch = calculateTotalAcComponent(character.deflectionBonus, "deflection", 0, "Touch");
  const totalDodgeBonusTouch = calculateTotalAcComponent(character.dodgeBonus, "dodge", 0, "Touch");
  const calculatedFeatMiscAcBonusTouch = calculateTotalAcComponent(0, "other_feat_bonus", 0, "Touch") + calculateTotalAcComponent(0, "monk_wisdom", 0, "Touch") + calculateTotalAcComponent(0, "monkScaling", 0, "Touch");
  const touchAC = 10 + dexModifier + sizeModAC + totalDeflectionBonusTouch + totalDodgeBonusTouch + calculatedFeatMiscAcBonusTouch + (character.acMiscModifier || 0);

  const totalArmorBonusFlat = calculateTotalAcComponent(0, "armor", physicalArmorBonus, "Flat-Footed");
  const totalShieldBonusFlat = calculateTotalAcComponent(0, "shield", physicalShieldBonus, "Flat-Footed");
  const totalNaturalArmorFlat = calculateTotalAcComponent(character.naturalArmor, "natural", 0, "Flat-Footed");
  const totalDeflectionBonusFlat = calculateTotalAcComponent(character.deflectionBonus, "deflection", 0, "Flat-Footed");
  const calculatedFeatMiscAcBonusFlat = calculateTotalAcComponent(0, "other_feat_bonus", 0, "Flat-Footed") + calculateTotalAcComponent(0, "monk_wisdom", 0, "Flat-Footed") + calculateTotalAcComponent(0, "monkScaling", 0, "Flat-Footed");
  const flatFootedAC = 10 + totalArmorBonusFlat + totalShieldBonusFlat + sizeModAC + totalNaturalArmorFlat + totalDeflectionBonusFlat + calculatedFeatMiscAcBonusFlat + (character.acMiscModifier || 0);


  const handleShowAcBreakdown = React.useCallback((acType: 'Normal' | 'Touch' | 'Flat-Footed') => {
    if (onOpenAcBreakdownDialog) {
      onOpenAcBreakdownDialog({ type: 'acBreakdown', acType });
    }
  }, [onOpenAcBreakdownDialog]);


  return (
    <LockablePanelWrapper
      title={UI_STRINGS.armorClassPanelTitle || "Armor Class"}
      description={UI_STRINGS.armorClassPanelDescription || "Details about your character's defenses."}
      icon={Shield}
      initialLockedState={false}
      cardContentClassName="space-y-4"
    >
      {({ isLocked: panelIsLocked }) => (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-center">
            <div className="p-2 border rounded-md bg-muted/10">
              <Label htmlFor="normal-ac-display" className="text-sm font-medium">{UI_STRINGS.armorClassNormalLabel || "Normal"}</Label>
              <div className="flex items-center justify-center">
                <p id="normal-ac-display" className="text-xl font-bold text-accent">{normalAC}</p>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={() => handleShowAcBreakdown('Normal')} disabled={!onOpenAcBreakdownDialog || panelIsLocked}>
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-2 border rounded-md bg-muted/10">
              <Label htmlFor="touch-ac-display" className="text-sm font-medium">{UI_STRINGS.armorClassTouchLabel || "Touch"}</Label>
              <div className="flex items-center justify-center">
                <p id="touch-ac-display" className="text-xl font-bold text-accent">{touchAC}</p>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={() => handleShowAcBreakdown('Touch')} disabled={!onOpenAcBreakdownDialog || panelIsLocked}>
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-2 border rounded-md bg-muted/10">
              <Label htmlFor="flat-footed-ac-display" className="text-sm font-medium">{UI_STRINGS.armorClassFlatFootedLabel || "Flat-Footed"}</Label>
              <div className="flex items-center justify-center">
                <p id="flat-footed-ac-display" className="text-xl font-bold text-accent">{flatFootedAC}</p>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={() => handleShowAcBreakdown('Flat-Footed')} disabled={!onOpenAcBreakdownDialog || panelIsLocked}>
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Separator className="mt-3 mb-1" />
          
          <div className="flex items-center justify-between">
            <Label htmlFor="temporary-ac-modifier-input" className="text-sm font-medium">
              {UI_STRINGS.armorClassMiscModifierLabel || "Temporary Modifier"}
            </Label>
            <NumberSpinnerInput
              id="temporary-ac-modifier-input"
              value={localTemporaryAcModifier}
              onChange={setLocalTemporaryAcModifier}
              disabled={!onCharacterUpdate || panelIsLocked}
              min={-20}
              max={20}
              inputClassName="w-20 h-9 text-base"
              buttonClassName="h-9 w-9"
            />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            <span dangerouslySetInnerHTML={{ __html: UI_STRINGS.armorClassPanelTempModInfoNote_prefix }} />
            <Badge variant="outline">{UI_STRINGS.armorClassMiscModifierLabel || "Temporary Modifier"}</Badge>
            <span dangerouslySetInnerHTML={{ __html: UI_STRINGS.armorClassPanelTempModInfoNote_suffix }} />
          </p>
        </>
      )}
    </LockablePanelWrapper>
  );
};
ArmorClassPanelComponent.displayName = 'ArmorClassPanelComponent';
export const ArmorClassPanel = React.memo(ArmorClassPanelComponent);
