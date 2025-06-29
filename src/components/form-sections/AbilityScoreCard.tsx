'use client';

import *as React from 'react';
import type { AbilityName } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dices, Info } from 'lucide-react';
import { calculateAbilityModifier } from '@/lib/dnd-utils';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/context/I18nProvider';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import {
  debounceDelayFormInput,
  panelContentPadding,
  panelFieldHorizontalGap,
  panelFieldVerticalGap,
  textStyleCardTitle,
  textStyleInput,
  textStyleLabel,
  textStyleModifier,
  textStyleValueBig,
  inputWidthFull,
} from '@/config/layout';
import { Badge } from '@/components/ui/badge';

interface AbilityScoreCardProps {
  abilityKey: Exclude<AbilityName, 'none'>;
  finalScore: number;
  baseScoreValue: number;
  onBaseScoreChange: (ability: Exclude<AbilityName, 'none'>, value: number) => void;
  tempModValue: number;
  onTempModChange: (ability: Exclude<AbilityName, 'none'>, value: number) => void;
  panelIsLocked: boolean;
  translations: {
    ABILITY_LABELS: ReturnType<typeof useI18n>['translations']['ABILITY_LABELS'],
    UI_STRINGS: ReturnType<typeof useI18n>['translations']['UI_STRINGS']
  };
  onOpenBreakdownDialog: (ability: Exclude<AbilityName, 'none'>) => void;
  onTriggerRollDialog: (ability: Exclude<AbilityName, 'none'>) => void;
}

export const AbilityScoreCard = React.memo((({
  abilityKey,
  finalScore,
  baseScoreValue,
  onBaseScoreChange,
  tempModValue,
  onTempModChange,
  panelIsLocked,
  translations,
  onOpenBreakdownDialog,
  onTriggerRollDialog,
}: AbilityScoreCardProps) => {

  const handleBaseScoreDebounced = React.useCallback((value: number) => {
    onBaseScoreChange(abilityKey, value);
  }, [abilityKey, onBaseScoreChange]);

  const handleTempModDebounced = React.useCallback((value: number) => {
    onTempModChange(abilityKey, value);
  }, [abilityKey, onTempModChange]);

  const [localBaseScore, setLocalBaseScore] = useDebouncedFormField(
    baseScoreValue,
    handleBaseScoreDebounced,
    debounceDelayFormInput
  );
  
  const [localTempMod, setLocalTempMod] = useDebouncedFormField(
    tempModValue,
    handleTempModDebounced,
    debounceDelayFormInput
  );
  
  const finalModifier = calculateAbilityModifier(finalScore);
  const modifierColorClass = cn(
    textStyleModifier,
    finalModifier > 0 ? "text-emerald-500" : finalModifier < 0 ? "text-destructive" : "text-muted-foreground"
  );

  const { ABILITY_LABELS, UI_STRINGS } = translations;
  
  const handleOpenBreakdown = React.useCallback(() => {
    onOpenBreakdownDialog(abilityKey);
  }, [onOpenBreakdownDialog, abilityKey]);
  
  const handleTriggerRoll = React.useCallback(() => {
    onTriggerRollDialog(abilityKey);
  }, [onTriggerRollDialog, abilityKey]);


  return (
    <div className={cn("flex flex-col border rounded-md bg-card", panelContentPadding, panelFieldVerticalGap)}>
      <Label htmlFor={!panelIsLocked ? `base-score-${abilityKey}` : undefined} className="text-center flex flex-col items-center">
        <span className={textStyleCardTitle}>{ABILITY_LABELS.find(al => al.id === abilityKey)?.abbr}</span>
        <span className="text-xs text-muted-foreground font-normal">{ABILITY_LABELS.find(al => al.id === abilityKey)?.label}</span>
      </Label>
      <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
        <p className={textStyleValueBig}>{finalScore}</p>
        <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-primary self-center" onClick={handleOpenBreakdown} aria-label={(UI_STRINGS.infoDialogAbilityBreakdownAriaLabel).replace("{abilityName}", ABILITY_LABELS.find(al => al.id === abilityKey)?.label || abilityKey)}><Info /></Button>
      </div>
      <div className="flex flex-col items-center">
        <Label className={textStyleLabel}>{UI_STRINGS.abilityScoresFinalModifierLabel}</Label>
        <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
          <p className={cn(modifierColorClass, "self-center")}>{finalModifier >= 0 ? '+' : ''}{finalModifier}</p>
          <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-primary self-center" onClick={handleTriggerRoll} aria-label={(UI_STRINGS.rollDialogAbilityCheckAriaLabel).replace("{abilityName}", ABILITY_LABELS.find(al => al.id === abilityKey)?.label || abilityKey)}><Dices /></Button>
        </div>
      </div>
      {!panelIsLocked && (
        <>
          <div className={cn("w-full flex flex-col items-center", panelFieldVerticalGap)}>
            <Label htmlFor={`base-score-${abilityKey}`} className={cn(textStyleLabel, "text-center block")}>{UI_STRINGS.abilityScoresBaseScoreLabel}</Label>
            <div className={cn("flex justify-center", inputWidthFull)}>
              <Input id={`base-score-${abilityKey}`} type="number" value={localBaseScore} onChange={(e) => setLocalBaseScore(parseInt(e.target.value, 10) || 1)} min={1} className={cn(textStyleInput)} disabled={panelIsLocked} />
            </div>
          </div>
          <div className={cn("w-full flex flex-col items-center", panelFieldVerticalGap)}>
            <Label htmlFor={`temp-mod-${abilityKey}`} className={cn(textStyleLabel, "text-center block")}>{UI_STRINGS.abilityScoresTempModLabel}</Label>
            <div className={cn("flex justify-center", inputWidthFull)}>
              <Input id={`temp-mod-${abilityKey}`} type="number" value={localTempMod} onChange={(e) => setLocalTempMod(parseInt(e.target.value, 10) || 0)} className={cn(textStyleInput)} disabled={panelIsLocked} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}));
AbilityScoreCard.displayName = 'AbilityScoreCard';