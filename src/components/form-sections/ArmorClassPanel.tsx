
'use client';

import *as React from 'react';
import type { Character, InfoDialogContentType, AggregatedFeatEffects } from '@/types/character';
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
import { cn } from '@/lib/utils'; // Added import

const DEBOUNCE_DELAY = 400;

export type ArmorClassPanelData = Pick<Character, 'abilityScores' | 'size' | 'armorBonus' | 'shieldBonus' | 'naturalArmor' | 'deflectionBonus' | 'dodgeBonus' | 'acMiscModifier'>;

export interface ArmorClassPanelProps {
  acData?: ArmorClassPanelData;
  aggregatedFeatEffects?: AggregatedFeatEffects | null; // Added
  onCharacterUpdate?: (field: keyof ArmorClassPanelData, value: any) => void;
  onOpenAcBreakdownDialog?: (contentType: InfoDialogContentType) => void; // Changed to accept contentType
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
    featAcType: "dodge" | "armor" | "shield" | "natural" | "deflection" | "insight" | "circumstance" | "untyped" | "monk_wisdom" | "monkScaling" | "other_feat_bonus" // Added monkScaling
  ): number => {
    let total = baseValue || 0;
    if (aggregatedFeatEffects?.acBonuses) {
      aggregatedFeatEffects.acBonuses.forEach(effect => {
        if (effect.acType === featAcType && typeof effect.value === 'number') {
          let isEffectActive = !effect.condition;
          if (effect.condition && aggregatedFeatEffects && acData?.feats) { // Assuming acData has feats for condition check
             const featInstance = acData.feats.find(f => f.definitionId === effect.sourceFeat?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
             isEffectActive = !!featInstance?.conditionalEffectStates?.[effect.condition];
          }
          if(isEffectActive) total += effect.value;
        } else if (featAcType === "other_feat_bonus" && effect.acType !== "dodge" && effect.acType !== "armor" && effect.acType !== "shield" && effect.acType !== "natural" && effect.acType !== "deflection" && effect.acType !== "monk_wisdom" && effect.acType !== "monkScaling" && typeof effect.value === 'number' ) {
            total += effect.value;
        }
      });
    }
    return total;
  }, [aggregatedFeatEffects, acData?.feats]);


  if (translationsLoading || !translations || !acData || !aggregatedFeatEffects) { // Added aggregatedFeatEffects check
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
  const wisModifier = getAbilityModifierByName(currentAbilityScores, 'wisdom'); // For Monk
  const sizeModAC = getSizeModifierAC(currentSize, SIZES);

  const totalArmorBonus = calculateTotalAcComponent(acData.armorBonus, "armor");
  const totalShieldBonus = calculateTotalAcComponent(acData.shieldBonus, "shield");
  const totalNaturalArmor = calculateTotalAcComponent(acData.naturalArmor, "natural");
  const totalDeflectionBonus = calculateTotalAcComponent(acData.deflectionBonus, "deflection");
  const totalDodgeBonus = calculateTotalAcComponent(acData.dodgeBonus, "dodge");
  
  let monkWisdomAcBonus = 0;
  let monkScalingAcBonus = 0;

  if (aggregatedFeatEffects?.acBonuses) {
    const monkWisEffect = aggregatedFeatEffects.acBonuses.find(eff => eff.acType === "monk_wisdom" && eff.value === "WIS");
    if (monkWisEffect) {
        monkWisdomAcBonus = wisModifier > 0 ? wisModifier : 0;
    }
    const monkScalingEffect = aggregatedFeatEffects.acBonuses.find(eff => eff.acType === "monkScaling" && typeof eff.value === 'number');
    if (monkScalingEffect && typeof monkScalingEffect.value === 'number') {
        monkScalingAcBonus = monkScalingEffect.value;
    }
  }

  const calculatedFeatMiscAcBonus = calculateTotalAcComponent(0, "other_feat_bonus") + monkWisdomAcBonus + monkScalingAcBonus;

  const normalAC = 10 + totalArmorBonus + totalShieldBonus + dexModifier + sizeModAC + totalNaturalArmor + totalDeflectionBonus + totalDodgeBonus + calculatedFeatMiscAcBonus + (acData.acMiscModifier || 0);
  const touchAC = 10 + dexModifier + sizeModAC + totalDeflectionBonus + totalDodgeBonus + calculatedFeatMiscAcBonus + (acData.acMiscModifier || 0); // Armor, shield, natural do not apply
  const flatFootedAC = 10 + totalArmorBonus + totalShieldBonus + sizeModAC + totalNaturalArmor + totalDeflectionBonus + calculatedFeatMiscAcBonus + (acData.acMiscModifier || 0); // Dex, dodge do not apply


  const handleShowAcBreakdown = (acType: 'Normal' | 'Touch' | 'Flat-Footed') => {
    if (onOpenAcBreakdownDialog) {
      onOpenAcBreakdownDialog({ type: 'acBreakdown', acType }); // Pass the full contentType object
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
