'use client';

import * as React from 'react';
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

const DEBOUNCE_DELAY = 400;

export interface ArmorClassPanelProps {
  character: Character;
  aggregatedFeatEffects?: AggregatedFeatEffects | null;
  onCharacterUpdate?: (field: keyof Pick<Character, 'acMiscModifier'>, value: number) => void; // Updated prop
  onOpenAcBreakdownDialog?: (contentType: InfoDialogContentType) => void;
}

const ArmorClassPanelComponent = ({ character, aggregatedFeatEffects, onCharacterUpdate, onOpenAcBreakdownDialog }: ArmorClassPanelProps) => {
  const { translations, isLoading: translationsLoading } = useI18n();

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
    baseCharacterValue: number | undefined, // e.g., character.armorBonus
    featAcType: "dodge" | "armor" | "shield" | "natural" | "deflection" | "insight" | "circumstance" | "untyped" | "monk_wisdom" | "monkScaling" | "other_feat_bonus",
    physicalItemBonus: number, // e.g., bonus from equipped armor or shield item
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
            effectAppliesToCurrentAcScope = true; // If no scope specified for component, assume it applies generally before specific AC type calc
        }

        if (effect.isActive && effectAppliesToCurrentAcScope) {
          let valueToAdd = 0;
          if (effect.acType === featAcType) {
            if (typeof effect.value === 'number') {
              valueToAdd = effect.value;
            } else if ((effect.value === "WIS" || effect.value === "INT" || effect.value === "CHA") && character?.abilityScores) {
              const abilityKey = effect.value.toLowerCase() as 'wisdom' | 'intelligence' | 'charisma';
              const abilityMod = getAbilityModifierByName(character.abilityScores, abilityKey);
              if (featAcType === "monk_wisdom" && abilityMod > 0) { // Monk Wis bonus is usually not negative
                valueToAdd = abilityMod;
              } else if (featAcType !== "monk_wisdom") { // Other ability-to-AC bonuses might be negative
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
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-serif">{translations?.UI_STRINGS.armorClassPanelTitle || "Armor Class"}</CardTitle>
          </div>
          <CardDescription>{translations?.UI_STRINGS.armorClassPanelDescription || "Details about your character's defenses."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">{translations?.UI_STRINGS.armorClassPanelLoading || "Loading AC details..."}</p>
            </div>
        </CardContent>
      </Card>
    );
  }

  const { DEFAULT_ABILITIES, SIZES, UI_STRINGS, ITEM_DEFINITIONS_ARMOR, ITEM_DEFINITIONS_SHIELDS, ABILITY_LABELS } = translations;
  const currentAbilityScores = character.abilityScores || DEFAULT_ABILITIES;
  const currentSize = character.size || 'medium';

  const dexModifier = getAbilityModifierByName(currentAbilityScores, 'dexterity');
  const wisModifier = getAbilityModifierByName(currentAbilityScores, 'wisdom');
  const sizeModAC = getSizeModifierAC(currentSize, SIZES);

  const equippedArmorInstanceId = character.equippedGear?.['armor-body'];
  const equippedArmorInstance = equippedArmorInstanceId ? character.inventory.find(i => i.instanceId === equippedArmorInstanceId) : undefined;
  const allArmorDefs = [...(ITEM_DEFINITIONS_ARMOR || []), ...(translations.ITEM_DEFINITIONS_MAGIC_ITEMS || []).filter(item => item.itemType === 'armor')];
  const equippedArmorDefinition = equippedArmorInstance ? allArmorDefs.find(def => def.definitionId === equippedArmorInstance.definitionId) : undefined;
  const physicalArmorBonus = equippedArmorDefinition?.armorBonus || 0;

  const equippedShieldInstanceId = character.equippedGear?.['shield'];
  const equippedShieldInstance = equippedShieldInstanceId ? character.inventory.find(i => i.instanceId === equippedShieldInstanceId) : undefined;
  const allShieldDefs = [...(ITEM_DEFINITIONS_SHIELDS || []), ...(translations.ITEM_DEFINITIONS_MAGIC_ITEMS || []).filter(item => item.itemType === 'shield')];
  const equippedShieldDefinition = equippedShieldInstance ? allShieldDefs.find(def => def.definitionId === equippedShieldInstance.definitionId) : undefined;
  const physicalShieldBonus = equippedShieldDefinition?.shieldBonus || 0;

  const totalArmorBonusNormal = calculateTotalAcComponent(character.armorBonus, "armor", physicalArmorBonus, "Normal");
  const totalShieldBonusNormal = calculateTotalAcComponent(character.shieldBonus, "shield", physicalShieldBonus, "Normal");
  const totalNaturalArmorNormal = calculateTotalAcComponent(character.naturalArmor, "natural", 0, "Normal");
  const totalDeflectionBonusNormal = calculateTotalAcComponent(character.deflectionBonus, "deflection", 0, "Normal");
  const totalDodgeBonusNormal = calculateTotalAcComponent(character.dodgeBonus, "dodge", 0, "Normal");
  const calculatedFeatMiscAcBonusNormal = calculateTotalAcComponent(0, "other_feat_bonus", 0, "Normal") + calculateTotalAcComponent(0, "monk_wisdom", 0, "Normal") + calculateTotalAcComponent(0, "monkScaling", 0, "Normal");
  const normalAC = 10 + totalArmorBonusNormal + totalShieldBonusNormal + dexModifier + sizeModAC + totalNaturalArmorNormal + totalDeflectionBonusNormal + totalDodgeBonusNormal + calculatedFeatMiscAcBonusNormal + (character.acMiscModifier || 0);

  const totalDeflectionBonusTouch = calculateTotalAcComponent(character.deflectionBonus, "deflection", 0, "Touch");
  const totalDodgeBonusTouch = calculateTotalAcComponent(character.dodgeBonus, "dodge", 0, "Touch");
  const calculatedFeatMiscAcBonusTouch = calculateTotalAcComponent(0, "other_feat_bonus", 0, "Touch") + calculateTotalAcComponent(0, "monk_wisdom", 0, "Touch") + calculateTotalAcComponent(0, "monkScaling", 0, "Touch");
  const touchAC = 10 + dexModifier + sizeModAC + totalDeflectionBonusTouch + totalDodgeBonusTouch + calculatedFeatMiscAcBonusTouch + (character.acMiscModifier || 0);

  const totalArmorBonusFlat = calculateTotalAcComponent(character.armorBonus, "armor", physicalArmorBonus, "Flat-Footed");
  const totalShieldBonusFlat = calculateTotalAcComponent(character.shieldBonus, "shield", physicalShieldBonus, "Flat-Footed");
  const totalNaturalArmorFlat = calculateTotalAcComponent(character.naturalArmor, "natural", 0, "Flat-Footed");
  const totalDeflectionBonusFlat = calculateTotalAcComponent(character.deflectionBonus, "deflection", 0, "Flat-Footed");
  const calculatedFeatMiscAcBonusFlat = calculateTotalAcComponent(0, "other_feat_bonus", 0, "Flat-Footed") + calculateTotalAcComponent(0, "monk_wisdom", 0, "Flat-Footed") + calculateTotalAcComponent(0, "monkScaling", 0, "Flat-Footed");
  const flatFootedAC = 10 + totalArmorBonusFlat + totalShieldBonusFlat + sizeModAC + totalNaturalArmorFlat + totalDeflectionBonusFlat + calculatedFeatMiscAcBonusFlat + (character.acMiscModifier || 0);


  const handleShowAcBreakdown = React.useCallback((acType: 'Normal' | 'Touch' | 'Flat-Footed') => {
    if (onOpenAcBreakdownDialog) {
      onOpenAcBreakdownDialog({ type: 'acBreakdown', acType });
    }
  }, [onOpenAcBreakdownDialog]);

  const acComponentDisplayConfig = [
    { labelKey: 'acBreakdownArmorBonusLabel', value: totalArmorBonusNormal, note: equippedArmorDefinition?.label ? getLocalizedString(equippedArmorDefinition.label, UI_STRINGS.currentLangCodeForNotesFallback as 'en' | 'fr' || 'en') : (physicalArmorBonus > 0 ? UI_STRINGS.acItemBonusDefaultEquippedLabel || 'Equipped Item' : undefined) },
    { labelKey: 'acBreakdownShieldBonusLabel', value: totalShieldBonusNormal, note: equippedShieldDefinition?.label ? getLocalizedString(equippedShieldDefinition.label, UI_STRINGS.currentLangCodeForNotesFallback as 'en' | 'fr' || 'en') : (physicalShieldBonus > 0 ? UI_STRINGS.acItemBonusDefaultEquippedLabel || 'Equipped Item' : undefined) },
    { labelKey: 'acBreakdownNaturalArmorLabel', value: totalNaturalArmorNormal },
    { labelKey: 'acBreakdownDeflectionBonusLabel', value: totalDeflectionBonusNormal },
    { labelKey: 'acBreakdownDodgeBonusLabel', value: totalDodgeBonusNormal }
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-serif">{UI_STRINGS.armorClassPanelTitle || "Armor Class"}</CardTitle>
          </div>
          <CardDescription>{UI_STRINGS.armorClassPanelDescription || "Details about your character's defenses."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main AC Types Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-center">
            <div className="p-2 border rounded-md bg-muted/10">
              <Label htmlFor="normal-ac-display" className="text-sm font-medium">{UI_STRINGS.armorClassNormalLabel || "Normal"}</Label>
              <div className="flex items-center justify-center">
                <p id="normal-ac-display" className="text-xl font-bold text-accent">{normalAC}</p>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={() => handleShowAcBreakdown('Normal')} disabled={!onOpenAcBreakdownDialog}>
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-2 border rounded-md bg-muted/10">
              <Label htmlFor="touch-ac-display" className="text-sm font-medium">{UI_STRINGS.armorClassTouchLabel || "Touch"}</Label>
              <div className="flex items-center justify-center">
                <p id="touch-ac-display" className="text-xl font-bold text-accent">{touchAC}</p>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={() => handleShowAcBreakdown('Touch')} disabled={!onOpenAcBreakdownDialog}>
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-2 border rounded-md bg-muted/10">
              <Label htmlFor="flat-footed-ac-display" className="text-sm font-medium">{UI_STRINGS.armorClassFlatFootedLabel || "Flat-Footed"}</Label>
              <div className="flex items-center justify-center">
                <p id="flat-footed-ac-display" className="text-xl font-bold text-accent">{flatFootedAC}</p>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={() => handleShowAcBreakdown('Flat-Footed')} disabled={!onOpenAcBreakdownDialog}>
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Separator className="my-3" />

          {/* Individual AC Components Display */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {acComponentDisplayConfig.map(config => (
              <div key={config.labelKey} className="p-2 border rounded-md bg-card space-y-0.5 text-center">
                <Label className="text-xs font-medium text-muted-foreground">{UI_STRINGS[config.labelKey] || config.labelKey}</Label>
                <p className="text-lg font-semibold text-foreground">{renderModifierValue(config.value)}</p>
                {config.note && <p className="text-xs text-muted-foreground/70 truncate" title={config.note}>{config.note}</p>}
              </div>
            ))}
             {/* Dexterity and Size Modifiers */}
            <div className="p-2 border rounded-md bg-card space-y-0.5 text-center">
                <Label className="text-xs font-medium text-muted-foreground">{UI_STRINGS.infoDialogAcAbilityLabel || "Ability Modifier"} <Badge variant="outline" className="ml-1">{ABILITY_LABELS.find(al => al.id === 'dexterity')?.abbr || 'DEX'}</Badge></Label>
                <p className="text-lg font-semibold text-foreground">{renderModifierValue(dexModifier)}</p>
            </div>
             <div className="p-2 border rounded-md bg-card space-y-0.5 text-center">
                <Label className="text-xs font-medium text-muted-foreground">{UI_STRINGS.infoDialogSizeModifierLabel || "Size Modifier"} <Badge variant="outline" className="ml-1">{SIZES.find(s => s.id === currentSize)?.label || currentSize}</Badge></Label>
                <p className="text-lg font-semibold text-foreground">{renderModifierValue(sizeModAC)}</p>
            </div>
            {/* Other Misc bonuses from Feats, etc. (like Monk Wisdom/Scaling) */}
            {(calculatedFeatMiscAcBonusNormal !== 0 || (character.acMiscModifier || 0) !== 0) && (
                 <div className="p-2 border rounded-md bg-card space-y-0.5 text-center md:col-span-1">
                    <Label className="text-xs font-medium text-muted-foreground">{UI_STRINGS.acBreakdownOtherBonusesLabel || "Other Bonuses"}</Label>
                    <p className="text-lg font-semibold text-foreground">{renderModifierValue(calculatedFeatMiscAcBonusNormal + (character.acMiscModifier || 0))}</p>
                </div>
            )}
          </div>


          {/* Temporary Modifier Input */}
          <div className="pt-3">
            <Label htmlFor="temporary-ac-modifier-input" className="text-sm font-medium">
              {UI_STRINGS.armorClassMiscModifierLabel || "Temporary Modifier"}
            </Label>
            <NumberSpinnerInput
              id="temporary-ac-modifier-input"
              value={localTemporaryAcModifier}
              onChange={setLocalTemporaryAcModifier}
              disabled={!onCharacterUpdate}
              min={-20}
              max={20}
              inputClassName="w-full h-9 text-base"
              buttonClassName="h-9 w-9"
            />
             <p className="text-xs text-muted-foreground pt-1">
              <span dangerouslySetInnerHTML={{ __html: UI_STRINGS.armorClassPanelTempModInfoNote_prefix }} />
              <Badge variant="outline">{UI_STRINGS.armorClassMiscModifierLabel || "Temporary Modifier"}</Badge>
              <span dangerouslySetInnerHTML={{ __html: UI_STRINGS.armorClassPanelTempModInfoNote_suffix }} />
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
ArmorClassPanelComponent.displayName = 'ArmorClassPanelComponent';
export const ArmorClassPanel = React.memo(ArmorClassPanelComponent);
