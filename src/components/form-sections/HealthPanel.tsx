
'use client';

import *as React from 'react';
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

  // --- Ref for stable callback ---
  const calculatedMaxHpRef = React.useRef(calculatedMaxHp);
  React.useEffect(() => {
    calculatedMaxHpRef.current = calculatedMaxHp;
  }, [calculatedMaxHp]);


  // --- Debounced Field Handlers ---
  const handleHpUpdate = React.useCallback((value: number) => {
    const maxHp = calculatedMaxHpRef.current;
    onCharacterUpdate('hp', Math.min(value, maxHp > 0 ? maxHp : value));
  }, [onCharacterUpdate]);

  const handleBaseMaxHpUpdate = React.useCallback((value: number) => onCharacterUpdate('baseMaxHp', value), [onCharacterUpdate]);
  const handleCustomMaxHpModifierUpdate = React.useCallback((value: number) => onCharacterUpdate('customMaxHpModifier', value), [onCharacterUpdate]);
  const handleNonlethalDamageUpdate = React.useCallback((value: number) => onCharacterUpdate('nonlethalDamage', value), [onCharacterUpdate]);
  const handleTemporaryHpUpdate = React.useCallback((value: number) => onCharacterUpdate('temporaryHp', value), [onCharacterUpdate]);
  const handleNumberOfWoundsUpdate = React.useCallback((value: number) => onCharacterUpdate('numberOfWounds', value), [onCharacterUpdate]);

  const [localHp, setLocalHp] = useDebouncedFormField(healthData.hp, handleHpUpdate, debounceDelayFormInput);
  const [localBaseMaxHp, setLocalBaseMaxHp] = useDebouncedFormField(healthData.baseMaxHp, handleBaseMaxHpUpdate, debounceDelayFormInput);
  const [localCustomMaxHpModifier, setLocalCustomMaxHpModifier] = useDebouncedFormField(healthData.customMaxHpModifier, handleCustomMaxHpModifierUpdate, debounceDelayFormInput);
  const [localNonlethalDamage, setLocalNonlethalDamage] = useDebouncedFormField(healthData.nonlethalDamage, handleNonlethalDamageUpdate, debounceDelayFormInput);
  const [localTemporaryHp, setLocalTemporaryHp] = useDebouncedFormField(healthData.temporaryHp, handleTemporaryHpUpdate, debounceDelayFormInput);
  const [localNumberOfWounds, setLocalNumberOfWounds] = useDebouncedFormField(healthData.numberOfWounds || 0, handleNumberOfWoundsUpdate, debounceDelayFormInput);

  // Clamp HP if max HP changes from other effects
  React.useEffect(() => {
    if (calculatedMaxHp > 0 && localHp > calculatedMaxHp) {
        setLocalHp(calculatedMaxHp);
    }
  }, [calculatedMaxHp, localHp, setLocalHp]);

  // --- Memoized Derived Values ---
  const missingHp = React.useMemo(() => Math.max(0, calculatedMaxHp - localHp), [calculatedMaxHp, localHp]);
  
  const { UI_STRINGS, ABILITY_LABELS } = translations || {};

  const { statusText, statusColorClass } = React.useMemo(() => {
    if (!UI_STRINGS) return { statusText: "Loading...", statusColorClass: "" };
    
    let text = UI_STRINGS.healthStatusNormal || "Normal";
    let color = "text-emerald-600";

    if (localHp <= -10) { text = UI_STRINGS.healthStatusDead || "Dead"; color = "text-destructive"; }
    else if (localHp < 0) { text = UI_STRINGS.healthStatusDying || "Dying"; color = "text-destructive"; }
    else if (localHp === 0) { text = UI_STRINGS.healthStatusDisabled || "Disabled"; color = "text-amber-600"; }
    
    if (localHp > -10 && localNonlethalDamage > 0 && localNonlethalDamage >= localHp) {
      if (localHp > 0) {
        text = UI_STRINGS.healthStatusStaggered || "Staggered";
        color = "text-amber-600";
        if (localNonlethalDamage > localHp) {
          text = UI_STRINGS.healthStatusUnconscious || "Unconscious";
          color = "text-destructive";
        }
      } else {
        text = UI_STRINGS.healthStatusUnconscious || "Unconscious";
        color = "text-destructive";
      }
    }
    return { statusText: text, statusColorClass: color };
  }, [localHp, localNonlethalDamage, UI_STRINGS]);

  const { tempHpBarWidthPercentage, currentHpBarWidthPercentage, nonlethalDamageBarWidthPercentage } = React.useMemo(() => {
    const actualCurrentHpForBar = Math.max(0, localHp);
    const effectiveTotalHpForBar = Math.max(1, calculatedMaxHp);
    
    return {
      tempHpBarWidthPercentage: ((actualCurrentHpForBar + localTemporaryHp) / effectiveTotalHpForBar) * 100,
      currentHpBarWidthPercentage: (actualCurrentHpForBar / effectiveTotalHpForBar) * 100,
      nonlethalDamageBarWidthPercentage: (localNonlethalDamage / effectiveTotalHpForBar) * 100,
    };
  }, [localHp, localTemporaryHp, localNonlethalDamage, calculatedMaxHp]);
  
  const conAbbr = React.useMemo(() => ABILITY_LABELS?.find(al => al.id === 'constitution')?.abbr || 'CON', [ABILITY_LABELS]);
  
  const conModBadgeColor = React.useMemo((): DualBadgeProps['color'] => {
    if (finalConstitutionModifier > 0) return 'emerald';
    if (finalConstitutionModifier < 0) return 'destructive';
    return 'default';
  }, [finalConstitutionModifier]);

  // --- Memoized Event Handlers ---
  const handleHealClick = React.useCallback((e: MouseEvent<HTMLButtonElement>) => { e.preventDefault(); /* Logic to be implemented */ }, []);
  const handleDamageClick = React.useCallback((e: MouseEvent<HTMLButtonElement>) => { e.preventDefault(); /* Logic to be implemented */ }, []);
  const handleOpenInfoDialog = React.useCallback(() => onOpenHealthInfoDialog({ type: 'maxHpBreakdown' }), [onOpenHealthInfoDialog]);


  if (translationsLoading || !UI_STRINGS || !ABILITY_LABELS) {
    return null;
  }
  
  const healthBarIndicatorColor = "bg-emerald-600";

  const footerContent = React.useMemo(() => {
    if (!UI_STRINGS) return null;
    return (
        <p className={textStyleDescription}>
          {parseAndRenderUIString(UI_STRINGS.healthPanelMaxHpMiscModInfoNoteFull, {
            badge: (children: React.ReactNode) => <Badge variant="outline">{children}</Badge>
          })}
        </p>
    );
  }, [UI_STRINGS]);

  return (
    <LockablePanelWrapper
      title={UI_STRINGS.healthPanelTitle}
      description={UI_STRINGS.healthPanelDescription}
      icon={Heart}
      headerClassName="bg-muted/20"
      initialLockedState={false}
      cardContentClassName={cn("flex flex-col", panelGridGap)}
      footer={footerContent}
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
            <Button variant="secondary" className="w-1/2" onClick={handleHealClick}>
              <Heart className="mr-2 h-4 w-4" />
              {UI_STRINGS.healthPanelHealButton}
            </Button>
            <Button variant="default" className="w-1/2" onClick={handleDamageClick}>
              <Swords className="mr-2 h-4 w-4" />
              {UI_STRINGS.healthPanelDamageButton}
            </Button>
          </div>
          
          {!panelIsLocked && (
            <>
              <Separator />
              <div className={cn("grid grid-cols-2", panelGridGap)}>
                {/* Row 1 */}
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
                        "h-10 text-lg font-bold", textStyleInput,
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
                        "h-10 text-lg font-bold", textStyleInput,
                        localNonlethalDamage > 0 ? "text-destructive" : "text-muted-foreground"
                      )}
                      disabled={panelIsLocked}
                  />
                </div>

                {/* Row 2 */}
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
                        "h-10 text-lg font-bold", textStyleInput,
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
                        "h-10 text-lg font-bold", textStyleInput,
                        localNumberOfWounds > 0 ? "text-destructive" : "text-muted-foreground"
                      )}
                      disabled={panelIsLocked}
                  />
                </div>

                {/* Row 3 */}
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
                    className={cn("h-10 w-full", textStyleInput)}
                    disabled={panelIsLocked}
                  />
                </div>

                {/* Row 4 */}
                <div className="flex items-center justify-start">
                  <Label>{UI_STRINGS.healthPanelAbilityModLabel}</Label>
                </div>
                <div className="flex justify-end">
                  <DualBadge leftLabel={conAbbr} rightLabel={`${finalConstitutionModifier >= 0 ? '+' : ''}${finalConstitutionModifier}`} color={conModBadgeColor} />
                </div>
                
                {/* Row 5 */}
                <div className="flex items-center justify-start">
                  <Label>{UI_STRINGS.healthPanelMiscMaxHpLabel}</Label>
                </div>
                <div className="flex items-center justify-end">
                  <span className={cn(
                      "font-semibold",
                      calculatedMiscMaxHpBonus === 0 && "text-muted-foreground",
                      calculatedMiscMaxHpBonus > 0 && "text-emerald-600",
                      calculatedMiscMaxHpBonus < 0 && "text-destructive"
                  )}>
                      {calculatedMiscMaxHpBonus >= 0 ? `+${calculatedMiscMaxHpBonus}` : calculatedMiscMaxHpBonus}
                  </span>
                </div>

                {/* Row 6 */}
                <div className="flex items-center justify-start">
                  <Label htmlFor="custom-max-hp-mod">{UI_STRINGS.healthPanelCustomModLabel}</Label>
                </div>
                <div className="flex justify-end">
                  <Input
                    id="custom-max-hp-mod"
                    type="number"
                    value={localCustomMaxHpModifier}
                    onChange={(e) => setLocalCustomMaxHpModifier(parseInt(e.target.value, 10) || 0)}
                    className={cn("h-10 w-full", textStyleInput)}
                    disabled={panelIsLocked}
                  />
                </div>
                
                {/* Row 7 - Total */}
                <div className="col-span-2"><Separator className="my-2" /></div>
                 <div className="flex items-center justify-start">
                  <Label className="font-semibold">{UI_STRINGS.healthPanelMaxHpLabel}</Label>
                </div>
                <div className="flex items-center justify-end">
                    <span className={textStyleValueBig}>
                        {calculatedMaxHp}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground"
                      onClick={handleOpenInfoDialog}
                      disabled={panelIsLocked}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex items-center justify-start">
                  <Label className="font-medium">{UI_STRINGS.healthPanelMissingHpLabel}</Label>
                </div>
                <div className="flex items-center justify-end">
                  <span className="font-bold text-lg text-muted-foreground">
                    {missingHp}
                  </span>
                </div>
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
