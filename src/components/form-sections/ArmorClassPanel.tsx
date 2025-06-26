
'use client';

import *as React from 'react';
import type { Character, InfoDialogContentType, AggregatedFeatEffects, ItemDefinition, ItemInstance, GearSlotId } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { getAbilityModifierByName, getSizeModifierAC } from '@/lib/dnd-utils';
import { useI18n } from '@/context/I18nProvider';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { cn, parseAndRenderUIString } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { renderModifierValue } from '@/components/info-dialog-content/dialog-utils';
import { getLocalizedString } from '@/i18n/i18n-data';
import { DEFAULT_LANGUAGE, type LanguageCode } from '@/i18n/config';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper';
import {
  debounceDelayFormInput,
  panelContentPadding,
  panelFieldHorizontalGap,
  panelGridGap,
  textStyleValueBig,
  textStyleCardTitle,
  textStyleInput,
  textStyleDescription,
  panelFieldVerticalGap,
  inputWidthStandard,
  textStyleLabel,
} from '@/config/layout';
import { Input } from '@/components/ui/input';

export interface ArmorClassPanelProps {
  character: Character;
  aggregatedFeatEffects?: AggregatedFeatEffects | null;
  onCharacterUpdate?: (field: keyof Pick<Character, 'acMiscModifier' | 'armorBonus' | 'shieldBonus' | 'naturalArmor' | 'deflectionBonus' | 'dodgeBonus'>, value: number) => void;
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
    debounceDelayFormInput
  );

  const dexModifier = React.useMemo(() => {
    const scores = character.abilityScores;
    if (!scores) return 0;
    return getAbilityModifierByName(scores, 'dexterity');
  }, [character.abilityScores.dexterity]);

  const sizeModAC = React.useMemo(() => {
    if (!translations) return 0;
    return getSizeModifierAC(character.size, translations.SIZES);
  }, [character.size, translations]);
  
  const { physicalArmorBonus, physicalShieldBonus } = React.useMemo(() => {
    if (!translations) {
      return { physicalArmorBonus: 0, physicalShieldBonus: 0 };
    }
    const { ITEM_DEFINITIONS_ARMOR, ITEM_DEFINITIONS_SHIELDS, ITEM_DEFINITIONS_MAGIC_ITEMS } = translations;
    const allItemDefinitions = [...(ITEM_DEFINITIONS_ARMOR || []), ...(ITEM_DEFINITIONS_SHIELDS || []), ...(ITEM_DEFINITIONS_MAGIC_ITEMS || [])];

    const equippedArmorInstanceId = character.equippedGear?.['armor-body'];
    const equippedArmorInstance = equippedArmorInstanceId ? character.inventory.find(i => i.instanceId === equippedArmorInstanceId) : undefined;
    const equippedArmorDefinition = equippedArmorInstance ? allItemDefinitions.find(def => def.definitionId === equippedArmorInstance.definitionId && def.itemType === 'armor') : undefined;
    
    const equippedShieldInstanceId = character.equippedGear?.['shield'];
    const equippedShieldInstance = equippedShieldInstanceId ? character.inventory.find(i => i.instanceId === equippedShieldInstanceId) : undefined;
    const equippedShieldDefinition = equippedShieldInstance ? allItemDefinitions.find(def => def.definitionId === equippedShieldInstance.definitionId && def.itemType === 'shield') : undefined;

    return {
      physicalArmorBonus: equippedArmorDefinition?.armorBonus || 0,
      physicalShieldBonus: equippedShieldDefinition?.shieldBonus || 0,
    };
  }, [character.equippedGear, character.inventory, translations]);


  const calculateTotalAcComponent = React.useCallback((
    baseCharacterValue: number | undefined,
    featAcType: "dodge" | "armor" | "shield" | "natural" | "deflection" | "other_feat_bonus",
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
          const mainAcTypes = ["dodge", "armor", "shield", "natural", "deflection"];
          const isMainTypeMatch = mainAcTypes.includes(effect.acType) && effect.acType === featAcType;
          const isOtherType = featAcType === 'other_feat_bonus' && !mainAcTypes.includes(effect.acType);

          if (isMainTypeMatch || isOtherType) {
            if (typeof effect.value === 'number') {
              valueToAdd = effect.value;
            } else if ((effect.value === "WIS" || effect.value === "INT" || effect.value === "CHA") && character?.abilityScores) {
              const abilityKey = effect.value.toLowerCase() as 'wisdom' | 'intelligence' | 'charisma';
              const abilityMod = getAbilityModifierByName(character.abilityScores, abilityKey);
              if (effect.valueConstraint === 'positive' && abilityMod > 0) {
                  valueToAdd = abilityMod;
              } else if (!effect.valueConstraint) {
                 valueToAdd = abilityMod;
              }
            }
            total += valueToAdd;
          }
        }
      });
    }
    return total;
  }, [
    aggregatedFeatEffects, 
    character.abilityScores.wisdom, 
    character.abilityScores.intelligence, 
    character.abilityScores.charisma
  ]);


  const normalAC = React.useMemo(() => {
    const totalArmorBonus = calculateTotalAcComponent(character.armorBonus, "armor", physicalArmorBonus, "Normal");
    const totalShieldBonus = calculateTotalAcComponent(character.shieldBonus, "shield", physicalShieldBonus, "Normal");
    const totalNaturalArmor = calculateTotalAcComponent(character.naturalArmor, "natural", 0, "Normal");
    const totalDeflectionBonus = calculateTotalAcComponent(character.deflectionBonus, "deflection", 0, "Normal");
    const totalDodgeBonus = calculateTotalAcComponent(character.dodgeBonus, "dodge", 0, "Normal");
    const calculatedFeatMiscAcBonus = calculateTotalAcComponent(0, "other_feat_bonus", 0, "Normal");
    return 10 + totalArmorBonus + totalShieldBonus + dexModifier + sizeModAC + totalNaturalArmor + totalDeflectionBonus + totalDodgeBonus + calculatedFeatMiscAcBonus + (character.acMiscModifier || 0);
  }, [calculateTotalAcComponent, character.armorBonus, character.shieldBonus, character.naturalArmor, character.deflectionBonus, character.dodgeBonus, character.acMiscModifier, physicalArmorBonus, physicalShieldBonus, dexModifier, sizeModAC]);

  const touchAC = React.useMemo(() => {
    const totalDeflectionBonus = calculateTotalAcComponent(character.deflectionBonus, "deflection", 0, "Touch");
    const totalDodgeBonus = calculateTotalAcComponent(character.dodgeBonus, "dodge", 0, "Touch");
    const calculatedFeatMiscAcBonus = calculateTotalAcComponent(0, "other_feat_bonus", 0, "Touch");
    return 10 + dexModifier + sizeModAC + totalDeflectionBonus + totalDodgeBonus + calculatedFeatMiscAcBonus + (character.acMiscModifier || 0);
  }, [calculateTotalAcComponent, character.deflectionBonus, character.dodgeBonus, character.acMiscModifier, dexModifier, sizeModAC]);

  const flatFootedAC = React.useMemo(() => {
    const totalArmorBonus = calculateTotalAcComponent(character.armorBonus, "armor", physicalArmorBonus, "Flat-Footed");
    const totalShieldBonus = calculateTotalAcComponent(character.shieldBonus, "shield", physicalShieldBonus, "Flat-Footed");
    const totalNaturalArmor = calculateTotalAcComponent(character.naturalArmor, "natural", 0, "Flat-Footed");
    const totalDeflectionBonus = calculateTotalAcComponent(character.deflectionBonus, "deflection", 0, "Flat-Footed");
    const calculatedFeatMiscAcBonus = calculateTotalAcComponent(0, "other_feat_bonus", 0, "Flat-Footed");
    return 10 + totalArmorBonus + totalShieldBonus + sizeModAC + totalNaturalArmor + totalDeflectionBonus + calculatedFeatMiscAcBonus + (character.acMiscModifier || 0);
  }, [calculateTotalAcComponent, character.armorBonus, character.shieldBonus, character.naturalArmor, character.deflectionBonus, character.acMiscModifier, physicalArmorBonus, physicalShieldBonus, sizeModAC]);

  const handleShowAcBreakdown = React.useCallback((acType: 'Normal' | 'Touch' | 'Flat-Footed') => {
    if (onOpenAcBreakdownDialog) {
      onOpenAcBreakdownDialog({ type: 'acBreakdown', acType });
    }
  }, [onOpenAcBreakdownDialog]);


  if (translationsLoading || !translations) {
    return null;
  }

  const { UI_STRINGS } = translations;

  return (
    <LockablePanelWrapper
      title={UI_STRINGS.armorClassPanelTitle}
      description={UI_STRINGS.armorClassPanelDescription}
      icon={Shield}
      headerClassName="bg-muted/20"
      initialLockedState={false}
      cardContentClassName={panelGridGap}
      footer={
        <p className={textStyleDescription}>
          {parseAndRenderUIString(UI_STRINGS.armorClassPanelTempModInfoNoteFull, {
            badge: (children: React.ReactNode) => <Badge variant="outline">{children}</Badge>
          })}
        </p>
      }
    >
      {({ isLocked: panelIsLocked }) => (
        <>
          <div className={cn("grid grid-cols-1 md:grid-cols-3", panelGridGap)}>
            <div className={cn("flex flex-col border rounded-md bg-card items-center text-center", panelContentPadding, panelFieldVerticalGap)}>
              <Label htmlFor="normal-ac-display" className={textStyleCardTitle}>{UI_STRINGS.armorClassNormalLabel}</Label>
              <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                <p id="normal-ac-display" className={textStyleValueBig}>{Math.max(0, normalAC)}</p>
                <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleShowAcBreakdown('Normal')}><Info /></Button>
              </div>
            </div>
            <div className={cn("flex flex-col border rounded-md bg-card items-center text-center", panelContentPadding, panelFieldVerticalGap)}>
              <Label htmlFor="touch-ac-display" className={textStyleCardTitle}>{UI_STRINGS.armorClassTouchLabel}</Label>
              <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                <p id="touch-ac-display" className={textStyleValueBig}>{Math.max(0, touchAC)}</p>
                <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleShowAcBreakdown('Touch')}><Info /></Button>
              </div>
            </div>
            <div className={cn("flex flex-col border rounded-md bg-card items-center text-center", panelContentPadding, panelFieldVerticalGap)}>
              <Label htmlFor="flat-footed-ac-display" className={textStyleCardTitle}>{UI_STRINGS.armorClassFlatFootedLabel}</Label>
              <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                <p id="flat-footed-ac-display" className={textStyleValueBig}>{Math.max(0, flatFootedAC)}</p>
                <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleShowAcBreakdown('Flat-Footed')}><Info /></Button>
              </div>
            </div>
          </div>
          
          {!panelIsLocked && (
            <div className={cn("flex items-center justify-center", panelGridGap)}>
              <Label htmlFor="temporary-ac-modifier-input" className={textStyleLabel}>
                {UI_STRINGS.armorClassMiscModifierLabel}
              </Label>
              <div className={cn("flex justify-center", inputWidthStandard)}>
               <Input
                  id="temporary-ac-modifier-input"
                  type="number"
                  value={localTemporaryAcModifier}
                  onChange={(e) => setLocalTemporaryAcModifier(parseInt(e.target.value, 10) || 0)}
                  disabled={!onCharacterUpdate || panelIsLocked}
                  className={cn(textStyleInput)}
                />
              </div>
            </div>
          )}
        </>
      )}
    </LockablePanelWrapper>
  );
};
ArmorClassPanelComponent.displayName = 'ArmorClassPanelComponent';
export const ArmorClassPanel = React.memo(ArmorClassPanelComponent);
