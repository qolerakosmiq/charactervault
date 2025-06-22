
'use client';

import *as React from 'react';
import type { MouseEvent } from 'react';
import type { Character, AbilityScores, InfoDialogContentType } from '@/types/character';
import { Label } from '@/components/ui/label';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Heart, Activity, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper'; // Added
import { debounceDelayFormInput } from '@/config/layout';

export type HealthPanelData = Pick<Character,
  'hp' | 'baseMaxHp' | 'customMaxHpModifier' |
  'nonlethalDamage' | 'temporaryHp' | 'abilityScores' | 'numberOfWounds'
>;

export interface HealthPanelProps {
  healthData: HealthPanelData;
  calculatedMaxHp: number;
  finalConstitutionModifier: number;
  calculatedMiscMaxHpBonus: number;
  onCharacterUpdate: (
    field: keyof Pick<Character, 'hp' | 'baseMaxHp' | 'customMaxHpModifier' | 'nonlethalDamage' | 'temporaryHp' | 'numberOfWounds'>,
    value: number
  ) => void;
  onOpenHealthInfoDialog: (contentType: InfoDialogContentType) => void;
}

const HealthPanelComponent = ({
  healthData,
  calculatedMaxHp,
  finalConstitutionModifier,
  calculatedMiscMaxHpBonus,
  onCharacterUpdate,
  onOpenHealthInfoDialog
}: HealthPanelProps) => {
  const { translations, isLoading: translationsLoading } = useI18n();

  const [localHp, setLocalHp] = useDebouncedFormField(
    healthData.hp,
    React.useCallback((value) => onCharacterUpdate('hp', Math.min(value, calculatedMaxHp > 0 ? calculatedMaxHp : value)), [onCharacterUpdate, calculatedMaxHp]),
    debounceDelayFormInput
  );
  const [localBaseMaxHp, setLocalBaseMaxHp] = useDebouncedFormField(
    healthData.baseMaxHp,
    React.useCallback((value) => onCharacterUpdate('baseMaxHp', value), [onCharacterUpdate]),
    debounceDelayFormInput
  );
  const [localCustomMaxHpModifier, setLocalCustomMaxHpModifier] = useDebouncedFormField(
    healthData.customMaxHpModifier,
    React.useCallback((value) => onCharacterUpdate('customMaxHpModifier', value), [onCharacterUpdate]),
    debounceDelayFormInput
  );
  const [localNonlethalDamage, setLocalNonlethalDamage] = useDebouncedFormField(
    healthData.nonlethalDamage,
    React.useCallback((value) => onCharacterUpdate('nonlethalDamage', value), [onCharacterUpdate]),
    debounceDelayFormInput
  );
  const [localTemporaryHp, setLocalTemporaryHp] = useDebouncedFormField(
    healthData.temporaryHp,
    React.useCallback((value) => onCharacterUpdate('temporaryHp', value), [onCharacterUpdate]),
    debounceDelayFormInput
  );
  const [localNumberOfWounds, setLocalNumberOfWounds] = useDebouncedFormField(
    healthData.numberOfWounds || 0,
    React.useCallback((value) => onCharacterUpdate('numberOfWounds', value), [onCharacterUpdate]),
    debounceDelayFormInput
  );


  React.useEffect(() => {
    if (calculatedMaxHp > 0 && localHp > calculatedMaxHp) {
        setLocalHp(calculatedMaxHp);
    }
  }, [calculatedMaxHp, localHp, setLocalHp]);


  if (translationsLoading || !translations) {
    return (
      <LockablePanelWrapper
        title={translations?.UI_STRINGS.healthPanelTitle || "Health & Vitality"}
        description={translations?.UI_STRINGS.healthPanelDescription || "Manage hit points, damage, and related attributes."}
        icon={Heart}
        initialLockedState={false}
        cardContentClassName="space-y-3"
      >
        {() => (
          <>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </>
        )}
      </LockablePanelWrapper>
    );
  }

  const { UI_STRINGS, ABILITY_LABELS } = translations;
  const conAbbr = ABILITY_LABELS.find(al => al.id === 'constitution')?.abbr || 'CON';

  const missingHp = Math.max(0, calculatedMaxHp - localHp);

  const actualCurrentHpForBar = Math.max(0, localHp);
  const effectiveTotalHpForBar = Math.max(1, calculatedMaxHp);

  const tempHpBarWidthPercentage = ((actualCurrentHpForBar + localTemporaryHp) / effectiveTotalHpForBar) * 100;
  const currentHpBarWidthPercentage = (actualCurrentHpForBar / effectiveTotalHpForBar) * 100;
  const nonlethalDamageBarWidthPercentage = (localNonlethalDamage / effectiveTotalHpForBar) * 100;

  const healthBarIndicatorColor = "bg-emerald-600";


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

  const displayMaxHp = localBaseMaxHp + finalConstitutionModifier + calculatedMiscMaxHpBonus + localCustomMaxHpModifier;


  return (
    <LockablePanelWrapper
      title={UI_STRINGS.healthPanelTitle || "Health & Vitality"}
      description={UI_STRINGS.healthPanelDescription || "Manage hit points, damage, and related attributes."}
      icon={Heart}
      initialLockedState={false}
      cardContentClassName="space-y-4"
    >
      {({ isLocked: panelIsLocked }) => (
        <>
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
                {localHp} / {calculatedMaxHp} {UI_STRINGS.healthBarLabelHitPoints || "Hit Points"}
                {localTemporaryHp > 0 && ` (+${localTemporaryHp} ${UI_STRINGS.healthBarLabelTemporary || "Temporary"})`}
              </span>
              {localNonlethalDamage > 0 && <span>{localNonlethalDamage} {UI_STRINGS.healthBarLabelNonlethal || "Nonlethal"}</span>}
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
                max={calculatedMaxHp > 0 ? calculatedMaxHp : 999}
                inputClassName={cn(
                  "w-full h-10 text-lg text-center font-bold",
                  localHp <= 0 && localHp > -10 && "text-amber-600",
                  localHp <= -10 && "text-destructive",
                  localHp > 0 && "text-emerald-600"
                )}
                buttonClassName="h-10 w-10"
                disabled={panelIsLocked}
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
                  disabled={panelIsLocked}
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
                  disabled={panelIsLocked}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="number-of-wounds-input" className="text-sm font-medium block w-full text-center">
                  {UI_STRINGS.healthPanelNumberOfWoundsLabel || "Number of Wounds"}
              </Label>
              <NumberSpinnerInput
                  id="number-of-wounds-input"
                  value={localNumberOfWounds}
                  onChange={setLocalNumberOfWounds}
                  min={0}
                  inputClassName={cn(
                    "w-full h-10 text-lg text-center font-bold",
                    localNumberOfWounds > 0 ? "text-destructive" : "text-muted-foreground"
                  )}
                  buttonClassName="h-10 w-10"
                  disabled={panelIsLocked}
              />
            </div>
          </div>

          <div className="space-y-2 text-sm mt-4">
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
                          disabled={panelIsLocked}
                      />
                  </div>
              </div>
              <div className="flex items-center justify-between">
                  <Label className="inline-flex items-baseline">
                      {UI_STRINGS.healthPanelAbilityModLabel || "Ability Modifier"}
                      <Badge variant="outline" className="ml-1.5 font-normal px-1.5 py-0.5 whitespace-nowrap">{conAbbr}</Badge>
                  </Label>
                   <div className="w-36 text-center">
                      <span className={cn(
                          "font-semibold font-bold",
                          finalConstitutionModifier === 0 && "text-muted-foreground",
                          finalConstitutionModifier > 0 && "text-emerald-600",
                          finalConstitutionModifier < 0 && "text-destructive"
                      )}>
                          {finalConstitutionModifier >= 0 ? `+${finalConstitutionModifier}` : finalConstitutionModifier}
                      </span>
                  </div>
              </div>
               <div className="flex items-center justify-between">
                  <Label>
                      {UI_STRINGS.healthPanelMiscMaxHpLabel || "Misc Modifier"}
                  </Label>
                   <div className="w-36 text-center">
                      <span className={cn(
                          "font-semibold font-bold",
                          calculatedMiscMaxHpBonus === 0 && "text-muted-foreground",
                          calculatedMiscMaxHpBonus > 0 && "text-emerald-600",
                          calculatedMiscMaxHpBonus < 0 && "text-destructive"
                      )}>
                          {calculatedMiscMaxHpBonus >= 0 ? `+${calculatedMiscMaxHpBonus}` : calculatedMiscMaxHpBonus}
                      </span>
                  </div>
              </div>
              <div className="flex items-center justify-between">
                  <Label htmlFor="custom-max-hp-mod">{UI_STRINGS.healthPanelCustomModLabel || "Custom Modifier"}</Label>
                  <div className="w-36 flex justify-center">
                      <NumberSpinnerInput
                          id="custom-max-hp-mod"
                          value={localCustomMaxHpModifier}
                          onChange={setLocalCustomMaxHpModifier}
                          inputClassName="w-20 h-8"
                          buttonClassName="h-8 w-8"
                          disabled={panelIsLocked}
                      />
                  </div>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center justify-between pt-1">
                  <Label className="font-semibold">{UI_STRINGS.healthPanelMaxHpLabel || "Maximum Hit Points"}</Label>
                   <div className="w-36 text-center flex items-center justify-center">
                      <span className="text-xl font-bold text-accent">
                          {displayMaxHp}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground"
                        onClick={() => onOpenHealthInfoDialog({ type: 'maxHpBreakdown' })}
                        disabled={panelIsLocked}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
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
              <p className="text-sm text-muted-foreground pt-2">
                <span dangerouslySetInnerHTML={{ __html: UI_STRINGS.healthPanelMaxHpMiscModInfoNote_prefix }} />
                <Badge variant="outline">{UI_STRINGS.healthPanelMiscMaxHpLabel || "Misc Modifier"}</Badge>
                <span dangerouslySetInnerHTML={{ __html: UI_STRINGS.healthPanelMaxHpMiscModInfoNote_suffix }}/>
              </p>
          </div>
        </>
      )}
    </LockablePanelWrapper>
  );
};
HealthPanelComponent.displayName = 'HealthPanelComponent';
export const HealthPanel = React.memo(HealthPanelComponent);
