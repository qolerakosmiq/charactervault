
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

const DEBOUNCE_DELAY_HEALTH = 400;

type HealthPanelData = Pick<Character, 
  'hp' | 'baseMaxHp' | 'miscMaxHpModifier' | 
  'nonlethalDamage' | 'temporaryHp' | 'abilityScores'
>;

interface HealthPanelProps {
  healthData: HealthPanelData;
  calculatedMaxHp: number; // This will be passed down from CharacterFormCore
  onCharacterUpdate: (
    field: keyof Pick<Character, 'hp' | 'baseMaxHp' | 'miscMaxHpModifier' | 'nonlethalDamage' | 'temporaryHp'>, 
    value: number
  ) => void;
}

export const HealthPanel = ({ healthData, calculatedMaxHp, onCharacterUpdate }: HealthPanelProps) => {
  const { translations, isLoading: translationsLoading } = useI18n();

  const [localHp, setLocalHp] = useDebouncedFormField(
    healthData.hp,
    (value) => onCharacterUpdate('hp', Math.min(value, calculatedMaxHp + (healthData.temporaryHp || 0) )), // Cap current HP by calculated max + temp
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
    if(localHp > (calculatedMaxHp + localTemporaryHp)) { // Consider temp HP when capping current HP
        setLocalHp(calculatedMaxHp + localTemporaryHp);
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
        {/* Current HP */}
        <div className="flex flex-col items-center space-y-1">
          <Label htmlFor="current-hp" className="text-sm font-medium text-muted-foreground">
            {UI_STRINGS.healthPanelCurrentHpLabel || "Current Hit Points"}
          </Label>
          <NumberSpinnerInput
            id="current-hp"
            value={localHp}
            onChange={setLocalHp}
            min={-999} // Allow negative for dead but not disintegrated
            max={calculatedMaxHp + localTemporaryHp} // Current HP can exceed Max HP due to Temp HP
            inputClassName={cn(
              "w-28 h-12 text-2xl text-center font-bold",
              localHp <= 0 && "text-destructive",
              localHp > 0 && "text-emerald-600"
            )}
            buttonClassName="h-12 w-12"
          />
        </div>
        
        {/* Nonlethal and Temporary HP */}
         <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center space-y-1">
                <Label htmlFor="nonlethal-damage" className="text-xs text-muted-foreground">
                    {UI_STRINGS.healthPanelNonlethalDamageLabel || "Nonlethal Damage"}
                </Label>
                <NumberSpinnerInput
                    id="nonlethal-damage"
                    value={localNonlethalDamage}
                    onChange={setLocalNonlethalDamage}
                    min={0}
                    inputClassName={cn(
                      "w-24 h-9 text-base",
                      localNonlethalDamage > 0 && "text-destructive"
                    )}
                    buttonClassName="h-9 w-9"
                />
            </div>
            <div className="flex flex-col items-center space-y-1">
                <Label htmlFor="temporary-hp" className="text-xs text-muted-foreground">
                    {UI_STRINGS.healthPanelTemporaryHitPointsLabel || "Temporary Hit Points"}
                </Label>
                <NumberSpinnerInput
                    id="temporary-hp"
                    value={localTemporaryHp}
                    onChange={setLocalTemporaryHp}
                    min={0}
                     inputClassName={cn(
                      "w-24 h-9 text-base",
                      localTemporaryHp > 0 && "text-emerald-600"
                    )}
                    buttonClassName="h-9 w-9"
                />
            </div>
        </div>

        {/* Max HP Display and Components */}
        <div className="pt-3 border-t border-border/60">
            <div className="text-center mb-3">
                <Label className="text-sm font-medium text-muted-foreground">
                    {UI_STRINGS.healthPanelMaxHpLabel || "Maximum Hit Points"}
                </Label>
                <p className="text-2xl font-bold text-accent">{calculatedMaxHp}</p>
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                    <Label htmlFor="base-max-hp">{UI_STRINGS.healthPanelBaseMaxHpLabel || "Base Hit Points"}</Label>
                    <NumberSpinnerInput
                        id="base-max-hp"
                        value={localBaseMaxHp}
                        onChange={setLocalBaseMaxHp}
                        min={0}
                        inputClassName="w-24 h-8"
                        buttonClassName="h-8 w-8"
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label>
                        {UI_STRINGS.healthPanelAbilityModLabel || "Ability Modifier"}
                        <span className="text-xs text-muted-foreground ml-1">({conAbbr})</span>
                    </Label>
                    <span className={cn("font-semibold", conModifier >= 0 ? "text-emerald-600" : "text-destructive")}>
                        {conModifier >= 0 ? `+${conModifier}` : conModifier}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <Label htmlFor="misc-max-hp-mod">{UI_STRINGS.healthPanelMiscModLabel || "Misc Modifier"}</Label>
                    <NumberSpinnerInput
                        id="misc-max-hp-mod"
                        value={localMiscMaxHpModifier}
                        onChange={setLocalMiscMaxHpModifier}
                        inputClassName="w-24 h-8"
                        buttonClassName="h-8 w-8"
                    />
                </div>
            </div>
        </div>

      </CardContent>
    </Card>
  );
};

HealthPanel.displayName = 'HealthPanel';
