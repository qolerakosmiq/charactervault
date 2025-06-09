
'use client';

import *as React from 'react';
import type { Character, AbilityScores } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Heart, Activity, Loader2 } from 'lucide-react';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { calculateAbilityModifier } from '@/lib/dnd-utils';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';


const DEBOUNCE_DELAY_HEALTH = 400;

type HealthPanelData = Pick<Character, 
  'hp' | 'baseMaxHp' | 'miscMaxHpModifier' | 
  'nonlethalDamage' | 'temporaryHp' | 'abilityScores'
>;

interface HealthPanelProps {
  healthData: HealthPanelData;
  calculatedMaxHp: number; 
  onCharacterUpdate: (
    field: keyof Pick<Character, 'hp' | 'baseMaxHp' | 'miscMaxHpModifier' | 'nonlethalDamage' | 'temporaryHp'>, 
    value: number
  ) => void;
}

export const HealthPanel = ({ healthData, calculatedMaxHp, onCharacterUpdate }: HealthPanelProps) => {
  const { translations, isLoading: translationsLoading } = useI18n();

  const [localHp, setLocalHp] = useDebouncedFormField(
    healthData.hp,
    (value) => onCharacterUpdate('hp', Math.min(value, calculatedMaxHp + (healthData.temporaryHp || 0) )),
    DEBOUNCE_DELAY_HEALTH
  );
  const [localBaseMaxHp, setLocalBaseMaxHp] = useDebouncedFormField(
    healthData.baseMaxHp,
    (value) => onCharacterUpdate('baseMaxHp', value),
    DEBOUNCE_DELAY_HEALTH
  );
  const [localMiscMaxHpModifier, setLocalMiscMaxHpModifier] = useDebouncedFormField(
    healthData.miscMaxHpModifier,
    (value) => onCharacterUpdate('miscMaxHpModifier', value),
    DEBOUNCE_DELAY_HEALTH
  );
  const [localNonlethalDamage, setLocalNonlethalDamage] = useDebouncedFormField(
    healthData.nonlethalDamage,
    (value) => onCharacterUpdate('nonlethalDamage', value),
    DEBOUNCE_DELAY_HEALTH
  );
  const [localTemporaryHp, setLocalTemporaryHp] = useDebouncedFormField(
    healthData.temporaryHp,
    (value) => onCharacterUpdate('temporaryHp', value),
    DEBOUNCE_DELAY_HEALTH
  );

  React.useEffect(() => {
    const currentMaxWithTemp = calculatedMaxHp + localTemporaryHp;
    if(localHp > currentMaxWithTemp) {
        setLocalHp(currentMaxWithTemp);
    }
  }, [calculatedMaxHp, localHp, setLocalHp, localTemporaryHp]);


  if (translationsLoading || !translations) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Heart className="h-8 w-8 text-primary" />
            <Skeleton className="h-7 w-24" />
          </div>
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  const { UI_STRINGS, ABILITY_LABELS } = translations;
  const conModifier = calculateAbilityModifier(healthData.abilityScores.constitution || 10);
  const conAbbr = ABILITY_LABELS.find(al => al.value === 'constitution')?.abbr || 'CON';
  
  const missingHp = Math.max(0, calculatedMaxHp - localHp);

  // Health Bar Calculations
  const actualCurrentHpForBar = Math.max(0, localHp); // Current HP, but not less than 0 for bar width
  const effectiveTotalHpForBar = Math.max(1, calculatedMaxHp); // Denominator, at least 1 to avoid division by zero

  // Percentage for the blue bar (Temporary HP extending beyond current HP, capped at Max HP)
  const tempHpBarWidthPercentage = ((actualCurrentHpForBar + localTemporaryHp) / effectiveTotalHpForBar) * 100;
  
  // Percentage for the green bar (Current HP)
  const currentHpBarWidthPercentage = (actualCurrentHpForBar / effectiveTotalHpForBar) * 100;
  
  // Percentage for the red bar (Nonlethal Damage) from the right
  const nonlethalDamageBarWidthPercentage = (localNonlethalDamage / effectiveTotalHpForBar) * 100;


  // Status Calculation
  let statusText = UI_STRINGS.healthStatusNormal || "Normal";
  let statusColorClass = "text-emerald-600";

  if (localHp <= -10) {
    statusText = UI_STRINGS.healthStatusDead || "Dead";
    statusColorClass = "text-destructive";
  } else if (localHp < 0) {
    statusText = UI_STRINGS.healthStatusDying || "Dying";
    statusColorClass = "text-destructive";
  } else if (localHp === 0) {
    statusText = UI_STRINGS.healthStatusDisabled || "Disabled";
    statusColorClass = "text-amber-600";
  }
  
  // Nonlethal damage effects
  if (localHp > -10) { // Only apply if not already dead
    if (localNonlethalDamage > 0 && localNonlethalDamage >= localHp) {
      // If NL damage meets or exceeds current HP, character is Unconscious (unless already dead/dying)
      statusText = UI_STRINGS.healthStatusUnconscious || "Unconscious";
      statusColorClass = "text-destructive"; // Unconscious is a critical state
    } else if (localHp > 0 && localNonlethalDamage > 0 && localNonlethalDamage === (localHp -1) && localNonlethalDamage < localHp ) {
      // This covers a specific house rule condition; for PHB Staggered, see below.
      // This would be a narrow case where NL is exactly 1 less than current HP, and HP > 0.
      // Let's ensure this doesn't override a more severe state.
      // statusText = "About to Pass Out (Staggered)";
      // statusColorClass = "text-amber-600";
    }
  }

  // PHB p.146: "When your nonlethal damage equals your current hit points, you’re staggered."
  // This applies IF the character is not already unconscious or worse due to HP.
  if (localHp > 0 && localNonlethalDamage === localHp) {
      statusText = UI_STRINGS.healthStatusStaggered || "Staggered";
      statusColorClass = "text-amber-600";
  }


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Heart className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl font-serif">{UI_STRINGS.healthPanelTitle || "Health & Vitality"}</CardTitle>
        </div>
        <CardDescription>{UI_STRINGS.healthPanelDescription || "Manage hit points, damage, and related attributes."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Stacked Health Bar */}
        <div className="my-4 space-y-1">
          <div className="relative w-full h-6 bg-muted rounded-full overflow-hidden border border-border">
            {/* Temporary HP Bar (Blue) */}
            {localTemporaryHp > 0 && (
              <div
                className="absolute top-0 left-0 h-full bg-sky-500 rounded-full z-10 transition-all duration-300 ease-out"
                style={{ width: `${Math.min(tempHpBarWidthPercentage, 100)}%` }}
              />
            )}
            {/* Current HP Bar (Green) */}
            <div
              className="absolute top-0 left-0 h-full bg-emerald-600 rounded-full z-20 transition-all duration-300 ease-out"
              style={{ width: `${Math.min(currentHpBarWidthPercentage, 100)}%` }}
            />
            {/* Nonlethal Damage Bar (Red) */}
            {localNonlethalDamage > 0 && (
              <div
                className="absolute top-0 right-0 h-full bg-destructive/70 rounded-full z-30 transition-all duration-300 ease-out"
                style={{ width: `${Math.min(nonlethalDamageBarWidthPercentage, 100)}%` }}
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span>
              {localHp} / {calculatedMaxHp} {UI_STRINGS.hpLabelShort || "HP"}
              {localTemporaryHp > 0 && ` (+${localTemporaryHp} ${UI_STRINGS.tempHpLabelShort || "Temp"})`}
            </span>
            {localNonlethalDamage > 0 && <span>{localNonlethalDamage} {UI_STRINGS.nonlethalDamageLabelShort || "NL"}</span>}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="text-center">
          <span className="text-sm font-medium">{UI_STRINGS.healthPanelStatusLabel || "Status:"} </span>
          <span className={cn("font-semibold", statusColorClass)}>{statusText}</span>
        </div>

        <Separator className="my-6" />
        
        {/* Inputs and Readouts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-1">
            <Label htmlFor="current-hp-input" className="text-sm font-medium">
              {UI_STRINGS.healthPanelCurrentHpLabel || "Current Hit Points"}
            </Label>
            <NumberSpinnerInput
              id="current-hp-input"
              value={localHp}
              onChange={setLocalHp}
              min={-999} 
              max={calculatedMaxHp + localTemporaryHp}
              inputClassName={cn(
                "w-full h-10 text-lg text-center font-bold",
                localHp <= 0 && localHp > -10 && "text-amber-600",
                localHp <= -10 && "text-destructive", 
                localHp > 0 && "text-emerald-600"
              )}
              buttonClassName="h-10 w-10"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nonlethal-damage-input" className="text-sm font-medium">
                {UI_STRINGS.healthPanelNonlethalDamageLabel || "Nonlethal Damage"}
            </Label>
            <NumberSpinnerInput
                id="nonlethal-damage-input"
                value={localNonlethalDamage}
                onChange={setLocalNonlethalDamage}
                min={0}
                inputClassName={cn(
                  "w-20 h-10 text-lg text-center font-bold", // w-20 from previous change
                  localNonlethalDamage > 0 ? "text-destructive" : "text-muted-foreground"
                )}
                buttonClassName="h-10 w-10"
                className="justify-center sm:justify-start"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="temporary-hp-input" className="text-sm font-medium">
                {UI_STRINGS.healthPanelTemporaryHitPointsLabel || "Temporary Hit Points"}
            </Label>
            <NumberSpinnerInput
                id="temporary-hp-input"
                value={localTemporaryHp}
                onChange={setLocalTemporaryHp}
                min={0}
                inputClassName={cn(
                  "w-20 h-10 text-lg text-center font-bold", // w-20 from previous change
                  localTemporaryHp > 0 ? "text-sky-500" : "text-muted-foreground"
                )}
                buttonClassName="h-10 w-10"
                className="justify-center sm:justify-start"
            />
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <Label className="text-sm font-medium">
              {UI_STRINGS.healthPanelMissingHpLabel || "Missing Hit Points"}
            </Label>
            <p className="text-2xl font-bold text-muted-foreground h-10 flex items-center justify-center sm:justify-start">
                {missingHp}
            </p>
          </div>
        </div>
        
        <Separator className="my-6" />
            
        <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
                <Label htmlFor="base-max-hp">{UI_STRINGS.healthPanelBaseMaxHpLabel || "Base Hit Points"}</Label>
                <div className="w-36 flex justify-center">
                    <NumberSpinnerInput
                        id="base-max-hp"
                        value={localBaseMaxHp}
                        onChange={setLocalBaseMaxHp}
                        min={0}
                        inputClassName="w-20 h-8"
                        buttonClassName="h-8 w-8"
                    />
                </div>
            </div>
            <div className="flex items-center justify-between">
                <Label>
                    {UI_STRINGS.healthPanelAbilityModLabel || "Ability Modifier"}
                    <span className="text-xs text-muted-foreground ml-1">({conAbbr})</span>
                </Label>
                 <div className="w-36 text-center">
                    <span className={cn("font-semibold", conModifier >= 0 ? "text-emerald-600" : "text-destructive")}>
                        {conModifier >= 0 ? `+${conModifier}` : conModifier}
                    </span>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <Label htmlFor="misc-max-hp-mod">{UI_STRINGS.healthPanelMiscModLabel || "Misc Modifier"}</Label>
                <div className="w-36 flex justify-center">
                    <NumberSpinnerInput
                        id="misc-max-hp-mod"
                        value={localMiscMaxHpModifier}
                        onChange={setLocalMiscMaxHpModifier}
                        inputClassName="w-20 h-8"
                        buttonClassName="h-8 w-8"
                    />
                </div>
            </div>
            <div className="flex items-center justify-between pt-1">
                <Label className="font-semibold">{UI_STRINGS.healthPanelMaxHpLabel || "Maximum Hit Points"}</Label>
                 <div className="w-36 text-center">
                    <span className="text-2xl font-bold text-accent">
                        {calculatedMaxHp}
                    </span>
                </div>
            </div>
        </div>

      </CardContent>
    </Card>
  );
};

HealthPanel.displayName = 'HealthPanel';
