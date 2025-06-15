
'use client';

import *as React from 'react';
import type { Character, InfoDialogContentType, AggregatedFeatEffects, CharacterFeatInstance, ItemDefinition, ItemInstance, GearSlotId } from '@/types/character';
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

const DEBOUNCE_DELAY = 400;

export interface ArmorClassPanelProps {
  character: Character;
  aggregatedFeatEffects?: AggregatedFeatEffects | null;
  onCharacterUpdate?: (field: keyof Pick<Character, 'armorBonus' | 'shieldBonus' | 'naturalArmor' | 'deflectionBonus' | 'dodgeBonus' | 'acMiscModifier'>, value: any) => void;
  onOpenAcBreakdownDialog?: (contentType: InfoDialogContentType) => void;
}

const ArmorClassPanelComponent = ({ character, aggregatedFeatEffects, onCharacterUpdate, onOpenAcBreakdownDialog }: ArmorClassPanelProps) => {
  const { translations, isLoading: translationsLoading } = useI18n();
  const acData = character; // Use character directly for clarity within this component's scope

  const handleUpdateCallback = React.useCallback((fieldName: keyof Pick<Character, 'acMiscModifier' | 'armorBonus' | 'shieldBonus' | 'naturalArmor' | 'deflectionBonus' | 'dodgeBonus'>) => (value: number) => {
    if (onCharacterUpdate) {
      onCharacterUpdate(fieldName, value);
    }
  }, [onCharacterUpdate]);

  const [localTemporaryAcModifier, setLocalTemporaryAcModifier] = useDebouncedFormField(
    acData?.acMiscModifier || 0,
    handleUpdateCallback('acMiscModifier'),
    DEBOUNCE_DELAY
  );

  const [localArmorBonus, setLocalArmorBonus] = useDebouncedFormField(acData.armorBonus || 0, handleUpdateCallback('armorBonus'), DEBOUNCE_DELAY);
  const [localShieldBonus, setLocalShieldBonus] = useDebouncedFormField(acData.shieldBonus || 0, handleUpdateCallback('shieldBonus'), DEBOUNCE_DELAY);
  const [localNaturalArmor, setLocalNaturalArmor] = useDebouncedFormField(acData.naturalArmor || 0, handleUpdateCallback('naturalArmor'), DEBOUNCE_DELAY);
  const [localDeflectionBonus, setLocalDeflectionBonus] = useDebouncedFormField(acData.deflectionBonus || 0, handleUpdateCallback('deflectionBonus'), DEBOUNCE_DELAY);
  const [localDodgeBonus, setLocalDodgeBonus] = useDebouncedFormField(acData.dodgeBonus || 0, handleUpdateCallback('dodgeBonus'), DEBOUNCE_DELAY);


  const calculateTotalAcComponent = React.useCallback((
    baseValue: number | undefined,
    featAcType: "dodge" | "armor" | "shield" | "natural" | "deflection" | "insight" | "circumstance" | "untyped" | "monk_wisdom" | "monkScaling" | "other_feat_bonus",
    acTypeForScope?: 'Normal' | 'Touch' | 'Flat-Footed'
  ): number => {
    let total = baseValue || 0;
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
            } else if ((effect.value === "WIS" || effect.value === "INT" || effect.value === "CHA") && acData?.abilityScores) {
              const abilityKey = effect.value.toLowerCase() as 'wisdom' | 'intelligence' | 'charisma';
              const abilityMod = getAbilityModifierByName(acData.abilityScores, abilityKey);
              if (featAcType === "monk_wisdom" && abilityMod > 0) {
                valueToAdd = abilityMod;
              } else if (featAcType !== "monk_wisdom") {
                 valueToAdd = abilityMod;
              }
            }
          } else if (featAcType === "other_feat_bonus" &&
                     effect.acType !== "dodge" && effect.acType !== "armor" &&
                     effect.acType !== "shield" && effect.acType !== "natural" &&
                     effect.acType !== "deflection" && effect.acType !== "monk_wisdom" &&
                     effect.acType !== "monkScaling") {
            if (typeof effect.value === 'number') {
              valueToAdd = effect.value;
            }
          }
          total += valueToAdd;
        }
      });
    }
    return total;
  }, [aggregatedFeatEffects, acData?.abilityScores]);


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
          {translationsLoading || !translations ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">{translations?.UI_STRINGS.armorClassPanelLoading || "Loading AC details..."}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
                <Label htmlFor="normal-ac-display" className="text-sm font-medium">{translations?.UI_STRINGS.armorClassNormalLabel || "Normal"}</Label>
                <div className="flex items-center">
                  <Skeleton className="h-8 w-12" />
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" disabled>
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
                <Label htmlFor="touch-ac-display" className="text-sm font-medium">{translations?.UI_STRINGS.armorClassTouchLabel || "Touch"}</Label>
                <div className="flex items-center">
                  <Skeleton className="h-8 w-12" />
                   <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" disabled>
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
                <Label htmlFor="flat-footed-ac-display" className="text-sm font-medium">{translations?.UI_STRINGS.armorClassFlatFootedLabel || "Flat-Footed"}</Label>
                <div className="flex items-center">
                  <Skeleton className="h-8 w-12" />
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" disabled>
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Separator className="my-3" />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="armorBonus">Base Armor Bonus</Label>
                    <Skeleton className="h-9 w-full" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="shieldBonus">Base Shield Bonus</Label>
                    <Skeleton className="h-9 w-full" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="naturalArmor">Base Natural Armor</Label>
                    <Skeleton className="h-9 w-full" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="deflectionBonus">Base Deflection Bonus</Label>
                    <Skeleton className="h-9 w-full" />
                  </div>
                   <div className="space-y-1">
                    <Label htmlFor="dodgeBonus">Base Dodge Bonus</Label>
                    <Skeleton className="h-9 w-full" />
                  </div>
                  <div className="space-y-1">
                     <Label htmlFor="custom-ac-mod-display">Temporary Modifier</Label>
                     <Skeleton className="h-9 w-full" />
                  </div>
              </div>
              <Skeleton className="h-5 w-3/4 mt-2" />
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  const { DEFAULT_ABILITIES, SIZES, UI_STRINGS, ITEM_DEFINITIONS_ARMOR, ITEM_DEFINITIONS_SHIELDS } = translations;
  const currentAbilityScores = character.abilityScores || DEFAULT_ABILITIES;
  const currentSize = character.size || 'medium';

  const dexModifier = getAbilityModifierByName(currentAbilityScores, 'dexterity');
  const sizeModAC = getSizeModifierAC(currentSize, SIZES);

  const equippedArmorInstanceId = character.equippedGear?.['armor-body'];
  const equippedArmorInstance = equippedArmorInstanceId ? character.inventory.find(i => i.instanceId === equippedArmorInstanceId) : undefined;
  const equippedArmorDefinition = equippedArmorInstance ? ITEM_DEFINITIONS_ARMOR.find(def => def.definitionId === equippedArmorInstance.definitionId) : undefined;
  const physicalArmorBonus = equippedArmorDefinition?.armorBonus || 0;

  const equippedShieldInstanceId = character.equippedGear?.['shield'];
  const equippedShieldInstance = equippedShieldInstanceId ? character.inventory.find(i => i.instanceId === equippedShieldInstanceId) : undefined;
  const equippedShieldDefinition = equippedShieldInstance ? ITEM_DEFINITIONS_SHIELDS.find(def => def.definitionId === equippedShieldInstance.definitionId) : undefined;
  const physicalShieldBonus = equippedShieldDefinition?.shieldBonus || 0;


  const totalArmorBonusNormal = calculateTotalAcComponent(character.armorBonus, "armor", "Normal") + physicalArmorBonus;
  const totalShieldBonusNormal = calculateTotalAcComponent(character.shieldBonus, "shield", "Normal") + physicalShieldBonus;
  const totalNaturalArmorNormal = calculateTotalAcComponent(character.naturalArmor, "natural", "Normal");
  const totalDeflectionBonusNormal = calculateTotalAcComponent(character.deflectionBonus, "deflection", "Normal");
  const totalDodgeBonusNormal = calculateTotalAcComponent(character.dodgeBonus, "dodge", "Normal");
  const calculatedFeatMiscAcBonusNormal = calculateTotalAcComponent(0, "other_feat_bonus", "Normal") + calculateTotalAcComponent(0, "monk_wisdom", "Normal") + calculateTotalAcComponent(0, "monkScaling", "Normal");
  const normalAC = 10 + totalArmorBonusNormal + totalShieldBonusNormal + dexModifier + sizeModAC + totalNaturalArmorNormal + totalDeflectionBonusNormal + totalDodgeBonusNormal + calculatedFeatMiscAcBonusNormal + (character.acMiscModifier || 0);

  const totalDeflectionBonusTouch = calculateTotalAcComponent(character.deflectionBonus, "deflection", "Touch");
  const totalDodgeBonusTouch = calculateTotalAcComponent(character.dodgeBonus, "dodge", "Touch");
  const calculatedFeatMiscAcBonusTouch = calculateTotalAcComponent(0, "other_feat_bonus", "Touch") + calculateTotalAcComponent(0, "monk_wisdom", "Touch") + calculateTotalAcComponent(0, "monkScaling", "Touch");
  const touchAC = 10 + dexModifier + sizeModAC + totalDeflectionBonusTouch + totalDodgeBonusTouch + calculatedFeatMiscAcBonusTouch + (character.acMiscModifier || 0);

  const totalArmorBonusFlat = calculateTotalAcComponent(character.armorBonus, "armor", "Flat-Footed") + physicalArmorBonus;
  const totalShieldBonusFlat = calculateTotalAcComponent(character.shieldBonus, "shield", "Flat-Footed") + physicalShieldBonus;
  const totalNaturalArmorFlat = calculateTotalAcComponent(character.naturalArmor, "natural", "Flat-Footed");
  const totalDeflectionBonusFlat = calculateTotalAcComponent(character.deflectionBonus, "deflection", "Flat-Footed");
  const calculatedFeatMiscAcBonusFlat = calculateTotalAcComponent(0, "other_feat_bonus", "Flat-Footed") + calculateTotalAcComponent(0, "monk_wisdom", "Flat-Footed") + calculateTotalAcComponent(0, "monkScaling", "Flat-Footed");
  const flatFootedAC = 10 + totalArmorBonusFlat + totalShieldBonusFlat + sizeModAC + totalNaturalArmorFlat + totalDeflectionBonusFlat + calculatedFeatMiscAcBonusFlat + (character.acMiscModifier || 0);


  const handleShowAcBreakdown = React.useCallback((acType: 'Normal' | 'Touch' | 'Flat-Footed') => {
    if (onOpenAcBreakdownDialog) {
      onOpenAcBreakdownDialog({ type: 'acBreakdown', acType });
    }
  }, [onOpenAcBreakdownDialog]);

  const isEditable = !!onCharacterUpdate;

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
          <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
            <Label htmlFor="normal-ac-display" className="text-sm font-medium">{UI_STRINGS.armorClassNormalLabel || "Normal"}</Label>
            <div className="flex items-center">
              <p id="normal-ac-display" className="text-xl font-bold text-accent">{normalAC}</p>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={() => handleShowAcBreakdown('Normal')} disabled={!onOpenAcBreakdownDialog}>
                <Info className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
             <Label htmlFor="touch-ac-display" className="text-sm font-medium">{UI_STRINGS.armorClassTouchLabel || "Touch"}</Label>
            <div className="flex items-center">
              <p id="touch-ac-display" className="text-xl font-bold text-accent">{touchAC}</p>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={() => handleShowAcBreakdown('Touch')} disabled={!onOpenAcBreakdownDialog}>
                <Info className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
            <Label htmlFor="flat-footed-ac-display" className="text-sm font-medium">{UI_STRINGS.armorClassFlatFootedLabel || "Flat-Footed"}</Label>
            <div className="flex items-center">
              <p id="flat-footed-ac-display" className="text-xl font-bold text-accent">{flatFootedAC}</p>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={() => handleShowAcBreakdown('Flat-Footed')} disabled={!onOpenAcBreakdownDialog}>
                <Info className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator className="my-3" />
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="armorBonusInput">{UI_STRINGS.acBreakdownBaseArmorBonusLabel || "Base Armor Bonus (Other)"}</Label>
                <NumberSpinnerInput
                  id="armorBonusInput"
                  value={localArmorBonus}
                  onChange={setLocalArmorBonus}
                  disabled={!isEditable}
                  inputClassName="w-full h-9 text-base" buttonClassName="h-9 w-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="shieldBonusInput">{UI_STRINGS.acBreakdownBaseShieldBonusLabel || "Base Shield Bonus (Other)"}</Label>
                <NumberSpinnerInput
                  id="shieldBonusInput"
                  value={localShieldBonus}
                  onChange={setLocalShieldBonus}
                  disabled={!isEditable}
                  inputClassName="w-full h-9 text-base" buttonClassName="h-9 w-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="naturalArmorInput">{UI_STRINGS.acBreakdownNaturalArmorLabel || "Base Natural Armor"}</Label>
                <NumberSpinnerInput
                  id="naturalArmorInput"
                  value={localNaturalArmor}
                  onChange={setLocalNaturalArmor}
                  disabled={!isEditable}
                  inputClassName="w-full h-9 text-base" buttonClassName="h-9 w-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="deflectionBonusInput">{UI_STRINGS.acBreakdownDeflectionBonusLabel || "Base Deflection Bonus"}</Label>
                <NumberSpinnerInput
                  id="deflectionBonusInput"
                  value={localDeflectionBonus}
                  onChange={setLocalDeflectionBonus}
                  disabled={!isEditable}
                  inputClassName="w-full h-9 text-base" buttonClassName="h-9 w-9"
                />
              </div>
               <div className="space-y-1">
                <Label htmlFor="dodgeBonusInput">{UI_STRINGS.acBreakdownDodgeBonusLabel || "Base Dodge Bonus"}</Label>
                <NumberSpinnerInput
                  id="dodgeBonusInput"
                  value={localDodgeBonus}
                  onChange={setLocalDodgeBonus}
                  disabled={!isEditable}
                  inputClassName="w-full h-9 text-base" buttonClassName="h-9 w-9"
                />
              </div>
              <div className="space-y-1">
                 <Label htmlFor="temporary-ac-modifier-input">{UI_STRINGS.armorClassMiscModifierLabel || "Temporary Modifier"}</Label>
                 <NumberSpinnerInput
                  id="temporary-ac-modifier-input"
                  value={localTemporaryAcModifier}
                  onChange={setLocalTemporaryAcModifier}
                  disabled={!isEditable}
                  min={-20}
                  max={20}
                  inputClassName="w-full h-9 text-base"
                  buttonClassName="h-9 w-9"
                />
              </div>
          </div>
          <p className="text-sm text-muted-foreground pt-2">
            <span dangerouslySetInnerHTML={{ __html: UI_STRINGS.armorClassPanelTempModInfoNote_prefix }} />
            <Badge variant="outline">{UI_STRINGS.armorClassMiscModifierLabel || "Temporary Modifier"}</Badge>
            <span dangerouslySetInnerHTML={{ __html: UI_STRINGS.armorClassPanelTempModInfoNote_suffix }} />
          </p>
        </CardContent>
      </Card>
    </>
  );
};
ArmorClassPanelComponent.displayName = 'ArmorClassPanelComponent';
export const ArmorClassPanel = React.memo(ArmorClassPanelComponent);
