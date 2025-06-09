
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
    (value) => onCharacterUpdate('hp', Math.min(value, calculatedMaxHp + (localTemporaryHp || 0) )),
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
  const actualCurrentHpForBar = Math.max(0, localHp); 
  const effectiveTotalHpForBar = Math.max(1, calculatedMaxHp); 

  const tempHpBarWidthPercentage = ((actualCurrentHpForBar + localTemporaryHp) / effectiveTotalHpForBar) * 100;
  const currentHpBarWidthPercentage = (actualCurrentHpForBar / effectiveTotalHpForBar) * 100;
  const nonlethalDamageBarWidthPercentage = (localNonlethalDamage / effectiveTotalHpForBar) * 100;

  const healthBarIndicatorColor = "bg-emerald-600";


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
  
  if (localHp > -10) { 
    if (localNonlethalDamage > 0 && localNonlethalDamage >= localHp) {
      if (localHp > 0) { 
        statusText = UI_STRINGS.healthStatusStaggered || "Staggered";
        statusColorClass = "text-amber-600";
        if (localNonlethalDamage > localHp) { 
            statusText = UI_STRINGS.healthStatusUnconscious || "Unconscious";
            statusColorClass = "text-destructive";
        }
      } else { 
        statusText = UI_STRINGS.healthStatusUnconscious || "Unconscious";
        statusColorClass = "text-destructive";
      }
    }
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

        <div className="my-4 space-y-1">
          <div className="relative w-full h-6 bg-muted rounded-full overflow-hidden border border-border">
            {localTemporaryHp > 0 && (
              <div
                className="absolute top-0 left-0 h-full bg-sky-500 rounded-full z-10 transition-all duration-300 ease-out"
                style={{ width: `${Math.min(tempHpBarWidthPercentage, 100)}%` }}
              />
            )}
            <div
              className={cn(
                "absolute top-0 left-0 h-full rounded-full z-20 transition-all duration-300 ease-out",
                healthBarIndicatorColor
              )}
              style={{ width: `${Math.min(currentHpBarWidthPercentage, 100)}%` }}
            />
            {localNonlethalDamage > 0 && (
              <div
                className="absolute top-0 right-0 h-full bg-destructive/70 rounded-full z-30 transition-all duration-300 ease-out"
                style={{ width: `${Math.min(nonlethalDamageBarWidthPercentage, 100)}%` }}
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span>
              {localHp} / {calculatedMaxHp} {UI_STRINGS.hpLabel || "Hit Points"}
              {localTemporaryHp > 0 && ` (+${localTemporaryHp} ${UI_STRINGS.tempHpLabel || "Temporary"})`}
            </span>
            {localNonlethalDamage > 0 && <span>{localNonlethalDamage} {UI_STRINGS.nonlethalDamageLabel || "Nonlethal"}</span>}
          </div>
        </div>

        <div className="text-center">
          <span className="text-sm font-medium">{UI_STRINGS.healthPanelStatusLabel || "Status:"} </span>
          <span className={cn("font-semibold", statusColorClass)}>{statusText}</span>
        </div>

        <Separator className="my-6" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-1">
            <Label htmlFor="current-hp-input" className="text-sm font-medium block w-full text-center">
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
            <Label htmlFor="nonlethal-damage-input" className="text-sm font-medium block w-full text-center">
                {UI_STRINGS.healthPanelNonlethalDamageLabel || "Nonlethal Damage"}
            </Label>
            <NumberSpinnerInput
                id="nonlethal-damage-input"
                value={localNonlethalDamage}
                onChange={setLocalNonlethalDamage}
                min={0}
                inputClassName={cn(
                  "w-full h-10 text-lg text-center font-bold",
                  localNonlethalDamage > 0 ? "text-destructive" : "text-muted-foreground"
                )}
                buttonClassName="h-10 w-10"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="temporary-hp-input" className="text-sm font-medium block w-full text-center">
                {UI_STRINGS.healthPanelTemporaryHitPointsLabel || "Temporary Hit Points"}
            </Label>
            <NumberSpinnerInput
                id="temporary-hp-input"
                value={localTemporaryHp}
                onChange={setLocalTemporaryHp}
                min={0}
                inputClassName={cn(
                  "w-full h-10 text-lg text-center font-bold", 
                  localTemporaryHp > 0 ? "text-sky-500" : "text-muted-foreground"
                )}
                buttonClassName="h-10 w-10"
            />
          </div>
        </div>
        
        <Separator className="my-2" />
            
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
            <Separator className="my-2" />
            <div className="flex items-center justify-between pt-1">
                <Label className="font-semibold">{UI_STRINGS.healthPanelMaxHpLabel || "Maximum Hit Points"}</Label>
                 <div className="w-36 text-center">
                    <span className="text-2xl font-bold text-accent">
                        {calculatedMaxHp}
                    </span>
                </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                {UI_STRINGS.healthPanelMissingHpLabel || "Missing Hit Points"}
              </Label>
              <div className="w-36 text-center">
                <span className="text-lg font-bold text-muted-foreground">
                    {missingHp}
                </span>
              </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

HealthPanel.displayName = 'HealthPanel';


    
