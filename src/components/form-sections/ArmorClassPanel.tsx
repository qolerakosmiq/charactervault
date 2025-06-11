
'use client';

import *as React from 'react';
import type { Character, InfoDialogContentType, AggregatedFeatEffects, CharacterFeatInstance } from '@/types/character';
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

const DEBOUNCE_DELAY = 400;

// Ensure acData includes feats if needed for conditional checks, or pass feats separately
export type ArmorClassPanelData = Pick<Character, 'abilityScores' | 'size' | 'armorBonus' | 'shieldBonus' | 'naturalArmor' | 'deflectionBonus' | 'dodgeBonus' | 'acMiscModifier' | 'feats'>;

export interface ArmorClassPanelProps {
  acData?: ArmorClassPanelData;
  aggregatedFeatEffects?: AggregatedFeatEffects | null;
  onCharacterUpdate?: (field: keyof Omit<ArmorClassPanelData, 'feats'>, value: any) => void; // Exclude feats from onCharacterUpdate field type
  onOpenAcBreakdownDialog?: (contentType: InfoDialogContentType) => void;
}

const ArmorClassPanelComponent = ({ acData, aggregatedFeatEffects, onCharacterUpdate, onOpenAcBreakdownDialog }: ArmorClassPanelProps) => {
  const { translations, isLoading: translationsLoading } = useI18n();

  const [localTemporaryAcModifier, setLocalTemporaryAcModifier] = useDebouncedFormField(
    acData?.acMiscModifier || 0,
    (value) => { if (onCharacterUpdate) onCharacterUpdate('acMiscModifier', value); },
    DEBOUNCE_DELAY
  );

  const calculateTotalAcComponent = React.useCallback((
    baseValue: number | undefined,
    featAcType: "dodge" | "armor" | "shield" | "natural" | "deflection" | "insight" | "circumstance" | "untyped" | "monk_wisdom" | "monkScaling" | "other_feat_bonus",
    acTypeForScope?: 'Normal' | 'Touch' | 'Flat-Footed' // For checking appliesToScope
  ): number => {
    let total = baseValue || 0;
    if (aggregatedFeatEffects?.acBonuses) {
      aggregatedFeatEffects.acBonuses.forEach(effect => {
        let effectAppliesToThisAcType = false;
        if (!effect.appliesToScope || effect.appliesToScope.length === 0) {
            effectAppliesToThisAcType = true; // Applies to all if scope is undefined/empty
        } else if (acTypeForScope) {
            if (acTypeForScope === 'Normal' && effect.appliesToScope.includes('normal')) effectAppliesToThisAcType = true;
            if (acTypeForScope === 'Touch' && effect.appliesToScope.includes('touch')) effectAppliesToThisAcType = true;
            if (acTypeForScope === 'Flat-Footed' && effect.appliesToScope.includes('flatFooted')) effectAppliesToThisAcType = true;
        } else {
            effectAppliesToThisAcType = true; // If acTypeForScope isn't provided, assume it applies for general calculation
        }


        if (effectAppliesToThisAcType && effect.acType === featAcType) {
          let isEffectActive = true;
          if (effect.condition && effect.sourceFeat && acData?.feats) {
            const featInstance = acData.feats.find(f => f.definitionId === effect.sourceFeat);
            isEffectActive = !!featInstance?.conditionalEffectStates?.[effect.condition];
          }
          if (isEffectActive) {
            if (typeof effect.value === 'number') {
              total += effect.value;
            } else if (effect.value === "WIS" && acData?.abilityScores) { // Handle Monk Wisdom to AC
              const wisMod = getAbilityModifierByName(acData.abilityScores, 'wisdom');
              if (wisMod > 0) total += wisMod; // Monk AC bonus doesn't apply if Wis mod is negative
            }
          }
        } else if (featAcType === "other_feat_bonus" && effectAppliesToThisAcType && effect.acType !== "dodge" && effect.acType !== "armor" && effect.acType !== "shield" && effect.acType !== "natural" && effect.acType !== "deflection" && effect.acType !== "monk_wisdom" && effect.acType !== "monkScaling") {
            let isEffectActive = true;
            if (effect.condition && effect.sourceFeat && acData?.feats) {
              const featInstance = acData.feats.find(f => f.definitionId === effect.sourceFeat);
              isEffectActive = !!featInstance?.conditionalEffectStates?.[effect.condition];
            }
            if (isEffectActive && typeof effect.value === 'number') {
              total += effect.value;
            }
        }
      });
    }
    return total;
  }, [aggregatedFeatEffects, acData?.feats, acData?.abilityScores]);


  if (translationsLoading || !translations || !acData || !aggregatedFeatEffects) {
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
              <div className="flex items-center justify-between">
                <Label htmlFor="custom-ac-mod-display" className="text-sm font-medium">{translations?.UI_STRINGS.armorClassMiscModifierLabel || "Temporary Modifier"}</Label>
                <NumberSpinnerInput
                  id="custom-ac-mod-display"
                  value={0}
                  onChange={() => {}}
                  disabled={true}
                  inputClassName="w-24 h-9 text-base"
                  buttonClassName="h-9 w-9"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  const { DEFAULT_ABILITIES, SIZES, UI_STRINGS } = translations;
  const currentAbilityScores = acData.abilityScores || DEFAULT_ABILITIES;
  const currentSize = acData.size || 'medium';

  const dexModifier = getAbilityModifierByName(currentAbilityScores, 'dexterity');
  const sizeModAC = getSizeModifierAC(currentSize, SIZES);

  // Calculate total contributions for each AC component, considering current AC type scope
  const totalArmorBonusNormal = calculateTotalAcComponent(acData.armorBonus, "armor", "Normal");
  const totalShieldBonusNormal = calculateTotalAcComponent(acData.shieldBonus, "shield", "Normal");
  const totalNaturalArmorNormal = calculateTotalAcComponent(acData.naturalArmor, "natural", "Normal");
  const totalDeflectionBonusNormal = calculateTotalAcComponent(acData.deflectionBonus, "deflection", "Normal");
  const totalDodgeBonusNormal = calculateTotalAcComponent(acData.dodgeBonus, "dodge", "Normal");
  const calculatedFeatMiscAcBonusNormal = calculateTotalAcComponent(0, "other_feat_bonus", "Normal") + calculateTotalAcComponent(0, "monk_wisdom", "Normal") + calculateTotalAcComponent(0, "monkScaling", "Normal");

  const normalAC = 10 + totalArmorBonusNormal + totalShieldBonusNormal + dexModifier + sizeModAC + totalNaturalArmorNormal + totalDeflectionBonusNormal + totalDodgeBonusNormal + calculatedFeatMiscAcBonusNormal + (acData.acMiscModifier || 0);

  const totalDeflectionBonusTouch = calculateTotalAcComponent(acData.deflectionBonus, "deflection", "Touch");
  const totalDodgeBonusTouch = calculateTotalAcComponent(acData.dodgeBonus, "dodge", "Touch");
  const calculatedFeatMiscAcBonusTouch = calculateTotalAcComponent(0, "other_feat_bonus", "Touch") + calculateTotalAcComponent(0, "monk_wisdom", "Touch") + calculateTotalAcComponent(0, "monkScaling", "Touch");
  const touchAC = 10 + dexModifier + sizeModAC + totalDeflectionBonusTouch + totalDodgeBonusTouch + calculatedFeatMiscAcBonusTouch + (acData.acMiscModifier || 0);

  const totalArmorBonusFlat = calculateTotalAcComponent(acData.armorBonus, "armor", "Flat-Footed");
  const totalShieldBonusFlat = calculateTotalAcComponent(acData.shieldBonus, "shield", "Flat-Footed");
  const totalNaturalArmorFlat = calculateTotalAcComponent(acData.naturalArmor, "natural", "Flat-Footed");
  const totalDeflectionBonusFlat = calculateTotalAcComponent(acData.deflectionBonus, "deflection", "Flat-Footed");
  const calculatedFeatMiscAcBonusFlat = calculateTotalAcComponent(0, "other_feat_bonus", "Flat-Footed") + calculateTotalAcComponent(0, "monk_wisdom", "Flat-Footed") + calculateTotalAcComponent(0, "monkScaling", "Flat-Footed");
  const flatFootedAC = 10 + totalArmorBonusFlat + totalShieldBonusFlat + sizeModAC + totalNaturalArmorFlat + totalDeflectionBonusFlat + calculatedFeatMiscAcBonusFlat + (acData.acMiscModifier || 0);


  const handleShowAcBreakdown = (acType: 'Normal' | 'Touch' | 'Flat-Footed') => {
    if (onOpenAcBreakdownDialog) {
      onOpenAcBreakdownDialog({ type: 'acBreakdown', acType });
    }
  };

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
          <div className="flex items-center justify-between">
            <Label htmlFor="temporary-ac-modifier-input" className="text-sm font-medium">{UI_STRINGS.armorClassMiscModifierLabel || "Temporary Modifier"}</Label>
            <NumberSpinnerInput
              id="temporary-ac-modifier-input"
              value={localTemporaryAcModifier}
              onChange={setLocalTemporaryAcModifier}
              disabled={!isEditable}
              min={-20}
              max={20}
              inputClassName="w-24 h-9 text-base"
              buttonClassName="h-9 w-9"
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
};
ArmorClassPanelComponent.displayName = 'ArmorClassPanelComponent';
export const ArmorClassPanel = React.memo(ArmorClassPanelComponent);

    