
'use client';

import * as React from 'react';
import type { MouseEvent } from 'react';
import type { Character, AbilityScores, InfoDialogContentType } from '@/types/character';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Heart, Activity, Loader2, Info, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { cn, parseAndRenderUIString } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper';
import { DualBadge, type DualBadgeProps } from '@/components/ui/DualBadge';
import {
  debounceDelayFormInput,
  panelGridGap,
  panelContentPadding,
  panelFieldHorizontalGap,
  panelFieldVerticalGap,
  textStyleValueBig,
  textStyleSubLabelTitle,
  textStyleInput,
  textStyleDescription,
  inputWidthStandard,
} from '@/config/layout';

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
        headerClassName="bg-muted/20"
        initialLockedState={false}
        cardContentClassName={panelGridGap}
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
  
  let conModBadgeColor: DualBadgeProps['color'] = 'default';
  if (finalConstitutionModifier > 0) conModBadgeColor = 'emerald';
  if (finalConstitutionModifier < 0) conModBadgeColor = 'destructive';

  return (
    <LockablePanelWrapper
      title={UI_STRINGS.healthPanelTitle}
      description={UI_STRINGS.healthPanelDescription}
      icon={Heart}
      headerClassName="bg-muted/20"
      initialLockedState={false}
      cardContentClassName={cn("flex flex-col", panelGridGap)}
      footer={
        <p className={textStyleDescription}>
          {parseAndRenderUIString(UI_STRINGS.healthPanelMaxHpMiscModInfoNoteFull, {
            badge: (children: React.ReactNode) => <Badge variant="outline">{children}</Badge>
          })}
        </p>
      }
    >
      {({ isLocked: panelIsLocked }) => (
        <>
          <div className="text-center">
            <span className="text-sm font-medium">{UI_STRINGS.healthPanelStatusLabel} </span>
            <span className={cn("font-semibold", statusColorClass)}>{statusText}</span>
          </div>

          <div className={cn("flex flex-col", panelFieldVerticalGap)}>
            <div className="relative w-full h-6 bg-muted rounded-full overflow-hidden border border-border">
              {localTemporaryHp > 0 && (
                <div
                  className="absolute top-0 left-0 h-full bg-sky-500 rounded-full z-10"
                  style={{ width: `${Math.min(tempHpBarWidthPercentage, 100)}%` }}
                />
              )}
              <div
                className={cn(
                  "absolute top-0 left-0 h-full rounded-full z-20",
                  healthBarIndicatorColor
                )}
                style={{ width: `${Math.min(currentHpBarWidthPercentage, 100)}%` }}
              />
              {localNonlethalDamage > 0 && (
                <div
                  className="absolute top-0 right-0 h-full bg-destructive/70 rounded-full z-30"
                  style={{ width: `${Math.min(nonlethalDamageBarWidthPercentage, 100)}%` }}
                />
              )}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>
                {localHp} / {calculatedMaxHp} {UI_STRINGS.healthBarLabelHitPoints}
                {localTemporaryHp > 0 && ` (+${localTemporaryHp} ${UI_STRINGS.healthBarLabelTemporary})`}
              </span>
              {localNonlethalDamage > 0 && <span>{localNonlethalDamage} {UI_STRINGS.healthBarLabelNonlethal}</span>}
            </div>
          </div>

          <div className={cn("flex w-full", panelGridGap)}>
            <Button variant="secondary" className="w-1/2">
              <Heart className="mr-2 h-4 w-4" />
              {UI_STRINGS.healthPanelHealButton}
            </Button>
            <Button variant="default" className="w-1/2">
              <Swords className="mr-2 h-4 w-4" />
              {UI_STRINGS.healthPanelDamageButton}
            </Button>
          </div>

          {!panelIsLocked && (
            <>
              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className={cn("flex flex-col", panelFieldVerticalGap)}>
                  <Label htmlFor="current-hp-input" className="text-sm font-medium block w-full text-center">
                    {UI_STRINGS.healthPanelCurrentHpLabel}
                  </Label>
                  <Input
                    id="current-hp-input"
                    type="number"
                    value={localHp}
                    onChange={(e) => setLocalHp(parseInt(e.target.value, 10) || 0)}
                    className={cn(
                      textStyleInput, "h-10 text-lg font-bold",
                      localHp <= 0 && localHp > -10 && "text-amber-600",
                      localHp <= -10 && "text-destructive",
                      localHp > 0 && "text-emerald-600"
                    )}
                    disabled={panelIsLocked}
                  />
                </div>
                <div className={cn("flex flex-col", panelFieldVerticalGap)}>
                  <Label htmlFor="nonlethal-damage-input" className="text-sm font-medium block w-full text-center">
                      {UI_STRINGS.healthPanelNonlethalDamageLabel}
                  </Label>
                  <Input
                      id="nonlethal-damage-input"
                      type="number"
                      value={localNonlethalDamage}
                      onChange={(e) => setLocalNonlethalDamage(parseInt(e.target.value, 10) || 0)}
                      min={0}
                      className={cn(
                        textStyleInput, "h-10 text-lg font-bold",
                        localNonlethalDamage > 0 ? "text-destructive" : "text-muted-foreground"
                      )}
                      disabled={panelIsLocked}
                  />
                </div>

                <div className={cn("flex flex-col", panelFieldVerticalGap)}>
                  <Label htmlFor="temporary-hp-input" className="text-sm font-medium block w-full text-center">
                      {UI_STRINGS.healthPanelTemporaryHitPointsLabel}
                  </Label>
                  <Input
                      id="temporary-hp-input"
                      type="number"
                      value={localTemporaryHp}
                      onChange={(e) => setLocalTemporaryHp(parseInt(e.target.value, 10) || 0)}
                      min={0}
                      className={cn(
                        textStyleInput, "h-10 text-lg font-bold",
                        localTemporaryHp > 0 ? "text-sky-500" : "text-muted-foreground"
                      )}
                      disabled={panelIsLocked}
                  />
                </div>
                <div className={cn("flex flex-col", panelFieldVerticalGap)}>
                  <Label htmlFor="number-of-wounds-input" className="text-sm font-medium block w-full text-center">
                      {UI_STRINGS.healthPanelNumberOfWoundsLabel}
                  </Label>
                  <Input
                      id="number-of-wounds-input"
                      type="number"
                      value={localNumberOfWounds}
                      onChange={(e) => setLocalNumberOfWounds(parseInt(e.target.value, 10) || 0)}
                      min={0}
                      className={cn(
                        textStyleInput, "h-10 text-lg font-bold",
                        localNumberOfWounds > 0 ? "text-destructive" : "text-muted-foreground"
                      )}
                      disabled={panelIsLocked}
                  />
                </div>

                <div className="flex items-center justify-start">
                  <Label htmlFor="base-max-hp">{UI_STRINGS.healthPanelBaseMaxHpLabel}</Label>
                </div>
                <div className="flex justify-end">
                  <Input
                    id="base-max-hp"
                    type="number"
                    value={localBaseMaxHp}
                    onChange={(e) => setLocalBaseMaxHp(parseInt(e.target.value, 10) || 0)}
                    min={0}
                    className={cn(textStyleInput, "h-10")}
                    disabled={panelIsLocked}
                  />
                </div>

                <div className="flex items-center justify-start">
                  <Label>{UI_STRINGS.healthPanelAbilityModLabel}</Label>
                </div>
                <div className="flex justify-end">
                  <DualBadge leftLabel={conAbbr} rightLabel={`${finalConstitutionModifier >= 0 ? '+' : ''}${finalConstitutionModifier}`} color={conModBadgeColor} />
                </div>

                <div className="flex items-center justify-start">
                  <Label>{UI_STRINGS.healthPanelMiscMaxHpLabel}</Label>
                </div>
                <div className="flex justify-end">
                  <span className={cn(
                      "font-semibold font-bold",
                      calculatedMiscMaxHpBonus === 0 && "text-muted-foreground",
                      calculatedMiscMaxHpBonus > 0 && "text-emerald-600",
                      calculatedMiscMaxHpBonus < 0 && "text-destructive"
                  )}>
                      {calculatedMiscMaxHpBonus >= 0 ? `+${calculatedMiscMaxHpBonus}` : calculatedMiscMaxHpBonus}
                  </span>
                </div>

                <div className="flex items-center justify-start">
                  <Label htmlFor="custom-max-hp-mod">{UI_STRINGS.healthPanelCustomModLabel}</Label>
                </div>
                <div className="flex justify-end">
                  <Input
                    id="custom-max-hp-mod"
                    type="number"
                    value={localCustomMaxHpModifier}
                    onChange={(e) => setLocalCustomMaxHpModifier(parseInt(e.target.value, 10) || 0)}
                    className={cn(textStyleInput, "h-10")}
                    disabled={panelIsLocked}
                  />
                </div>
              </div>
              
              <Separator className="my-2" />
              
              <div className="grid grid-cols-2 col-span-2">
                <div className="flex items-center justify-start col-span-1">
                  <Label className="font-semibold">{UI_STRINGS.healthPanelMaxHpLabel}</Label>
                </div>
                <div className="flex items-center justify-end col-span-1">
                    <span className={textStyleValueBig}>
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
              <div className="flex items-center justify-between col-span-2">
                <Label className="font-medium">{UI_STRINGS.healthPanelMissingHpLabel}</Label>
                <span className="font-bold text-lg text-muted-foreground">
                  {missingHp}
                </span>
              </div>
            </>
          )}
        </>
      )}
    </LockablePanelWrapper>
  );
};
HealthPanelComponent.displayName = 'HealthPanelComponent';
export const HealthPanel = React.memo(HealthPanelComponent);
