
'use client';

import *as React from 'react';
import type { AbilityName, AbilityScores, DetailedAbilityScores, Character, GenericBreakdownItem, DndClassId } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dices, Info, Calculator } from 'lucide-react';
import { calculateAbilityModifier } from '@/lib/dnd-utils';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { AbilityScoreRollerDialog } from '@/components/AbilityScoreRollerDialog';
import { AbilityScorePointBuyDialog } from '@/components/AbilityScorePointBuyDialog';
import { RollDialog, type RollDialogProps } from '@/components/RollDialog';
import { useDefinitionsStore } from '@/lib/definitions-store';
import { useI18n } from '@/context/I18nProvider';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper';
import { parseAndRenderUIString } from '@/lib/utils';
import {
  debounceDelayFormInput,
  panelContentPadding,
  panelFieldHorizontalGap,
  panelGridGap,
  panelFieldVerticalGap,
  textStyleModifier,
  textStyleSubtle,
  textStyleValueBig,
  textStyleSubLabelTitle,
  textStyleCardTitle,
  textStyleInput,
  textStyleDescription,
  inputWidthStandard,
} from '@/config/layout';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { Badge } from '@/components/ui/badge';

const abilityKeys: Exclude<AbilityName, 'none'>[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

interface AbilityScoreInputGroupProps {
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

const AbilityScoreInputGroup = React.memo((({
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
}: AbilityScoreInputGroupProps) => {

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
        <Label className={textStyleSubLabelTitle}>{UI_STRINGS.abilityScoresFinalModifierLabel}</Label>
        <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
          <p className={cn(modifierColorClass, "self-center")}>{finalModifier >= 0 ? '+' : ''}{finalModifier}</p>
          <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-primary self-center" onClick={handleTriggerRoll} aria-label={(UI_STRINGS.rollDialogAbilityCheckAriaLabel).replace("{abilityName}", ABILITY_LABELS.find(al => al.id === abilityKey)?.label || abilityKey)}><Dices /></Button>
        </div>
      </div>
      {!panelIsLocked && (
        <>
          <div className={cn("w-full flex flex-col items-center", panelFieldVerticalGap)}>
            <Label htmlFor={`base-score-${abilityKey}`} className={cn(textStyleSubLabelTitle, "text-center block")}>{UI_STRINGS.abilityScoresBaseScoreLabel}</Label>
            <div className={cn("flex justify-center", inputWidthStandard)}>
              <Input id={`base-score-${abilityKey}`} type="number" value={localBaseScore} onChange={(e) => setLocalBaseScore(parseInt(e.target.value, 10) || 1)} min={1} className={cn(textStyleInput)} disabled={panelIsLocked} />
            </div>
          </div>
          <div className={cn("w-full flex flex-col items-center", panelFieldVerticalGap)}>
            <Label htmlFor={`temp-mod-${abilityKey}`} className={cn(textStyleSubLabelTitle, "text-center block")}>{UI_STRINGS.abilityScoresTempModLabel}</Label>
            <div className={cn("flex justify-center", inputWidthStandard)}>
              <Input id={`temp-mod-${abilityKey}`} type="number" value={localTempMod} onChange={(e) => setLocalTempMod(parseInt(e.target.value, 10) || 0)} className={cn(textStyleInput)} disabled={panelIsLocked} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}));
AbilityScoreInputGroup.displayName = 'AbilityScoreInputGroup';


export interface CharacterFormAbilityScoresSectionProps {
  abilityScoresData: Pick<Character, 'abilityScores' | 'abilityScoreTempCustomModifiers'>;
  detailedAbilityScores: DetailedAbilityScores | null;
  onBaseAbilityScoreChange: (ability: Exclude<AbilityName, 'none'>, value: number) => void;
  onAbilityScoreTempCustomModifierChange: (ability: Exclude<AbilityName, 'none'>, value: number) => void;
  onMultipleBaseAbilityScoresChange: (newScores: AbilityScores) => void;
  onOpenAbilityScoreBreakdownDialog: (ability: Exclude<AbilityName, 'none'>) => void;
  characterClassId: DndClassId | '';
}

const CharacterFormAbilityScoresSectionComponent = ({
  abilityScoresData,
  detailedAbilityScores,
  onBaseAbilityScoreChange,
  onAbilityScoreTempCustomModifierChange,
  onMultipleBaseAbilityScoresChange,
  onOpenAbilityScoreBreakdownDialog,
  characterClassId,
}: CharacterFormAbilityScoresSectionProps) => {
  const [isRollerDialogOpen, setIsRollerDialogOpen] = React.useState(false);
  const [isPointBuyDialogOpen, setIsPointBuyDialogOpen] = React.useState(false);
  const [isRollAbilityDialogOpen, setIsRollAbilityDialogOpen] = React.useState(false);
  const [abilityForRollDialog, setAbilityForRollDialog] = React.useState<Exclude<AbilityName, 'none'> | null>(null);
  const [rollAbilityDialogData, setRollAbilityDialogData] = React.useState<Omit<RollDialogProps, 'isOpen' | 'onOpenChange' | 'onRoll'> | null>(null);

  const { translations, isLoading: translationsLoading } = useI18n();

  const { rerollOnesForAbilityScores, pointBuyBudget, rerollTwentiesForChecks } = useDefinitionsStore(state => ({
    rerollOnesForAbilityScores: state.rerollOnesForAbilityScores,
    pointBuyBudget: state.pointBuyBudget,
    rerollTwentiesForChecks: state.rerollTwentiesForChecks,
  }));
  
  const handleApplyRolledScores = React.useCallback((newScores: AbilityScores) => {
    onMultipleBaseAbilityScoresChange(newScores);
    setIsRollerDialogOpen(false);
  }, [onMultipleBaseAbilityScoresChange]);

  const handleApplyPointBuyScores = React.useCallback((newScores: AbilityScores) => {
    onMultipleBaseAbilityScoresChange(newScores);
    setIsPointBuyDialogOpen(false);
  }, [onMultipleBaseAbilityScoresChange]);

  const handleTriggerRollDialog = React.useCallback((ability: Exclude<AbilityName, 'none'>) => {
    setAbilityForRollDialog(ability);
    setIsRollAbilityDialogOpen(true);
  }, []);

  React.useEffect(() => {
    if (isRollAbilityDialogOpen && abilityForRollDialog) {
      if (!detailedAbilityScores || !translations) return;

      const abilityLabelInfo = translations.ABILITY_LABELS.find(al => al.id === abilityForRollDialog);
      const abilityName = abilityLabelInfo?.label || abilityForRollDialog;
      const finalModifier = calculateAbilityModifier(detailedAbilityScores[abilityForRollDialog].finalScore);

      const breakdown: GenericBreakdownItem[] = [
        { label: (translations.UI_STRINGS.rollDialogAbilityModifierLabel).replace("{abilityAbbr}", abilityLabelInfo?.abbr || abilityForRollDialog.toUpperCase().substring(0,3)), value: finalModifier, isBold: true }
      ];

      setRollAbilityDialogData({
        dialogTitle: (translations.UI_STRINGS.rollDialogTitleAbilityCheck).replace("{abilityName}", abilityName || ''),
        rollType: `ability_check_${abilityForRollDialog}`,
        baseModifier: finalModifier,
        calculationBreakdown: breakdown,
        rerollTwentiesForChecks: rerollTwentiesForChecks,
        weaponDamageDiceString: "", 
        weaponCriticalMultiplier: 1,
      });
    }
  }, [isRollAbilityDialogOpen, abilityForRollDialog, detailedAbilityScores, translations, rerollTwentiesForChecks]);


  const handleAbilityRollResult = React.useCallback((diceResult: number, totalBonus: number, finalResult: number) => {
    // This is a no-op currently, but could be used to show a toast or log the result.
  }, []);

  const translationSubsetForChild = React.useMemo(() => {
    if (!translations) return null;
    return { ABILITY_LABELS: translations.ABILITY_LABELS, UI_STRINGS: translations.UI_STRINGS };
  }, [translations]);

  if (!detailedAbilityScores || !translationSubsetForChild) {
    return null;
  }
  const { UI_STRINGS } = translationSubsetForChild;

  return (
    <>
      <LockablePanelWrapper
        title={UI_STRINGS.abilityScoresPanelTitle}
        description={UI_STRINGS.abilityScoresPanelDescription}
        icon={Dices}
        headerClassName="bg-muted/20"
        initialLockedState={false}
        footer={
          <p className={textStyleDescription}>
            {parseAndRenderUIString(UI_STRINGS.abilityScoresNoteFull, {
              badge: (children: React.ReactNode) => <Badge variant="outline">{children}</Badge>
            })}
          </p>
        }
      >
        {({ isLocked: panelIsLocked }) => (
          <div className={cn("grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6", panelGridGap)}>
            {abilityKeys.map(ability => (
              <AbilityScoreInputGroup
                key={ability}
                abilityKey={ability}
                finalScore={detailedAbilityScores[ability].finalScore}
                baseScoreValue={abilityScoresData.abilityScores[ability]}
                onBaseScoreChange={onBaseAbilityScoreChange}
                tempModValue={abilityScoresData.abilityScoreTempCustomModifiers[ability]}
                onTempModChange={onAbilityScoreTempCustomModifierChange}
                panelIsLocked={panelIsLocked}
                translations={translationSubsetForChild}
                onOpenBreakdownDialog={onOpenAbilityScoreBreakdownDialog}
                onTriggerRollDialog={handleTriggerRollDialog}
              />
            ))}
            {!panelIsLocked && (
              <div className={cn("contents")}>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => setIsRollerDialogOpen(true)}
                  className="w-full sm:col-start-2 lg:col-start-5"
                >
                  <Dices /> {UI_STRINGS.abilityScoresRollButton}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => setIsPointBuyDialogOpen(true)}
                  disabled={typeof pointBuyBudget !== 'number'}
                  className="w-full sm:col-start-auto lg:col-start-auto"
                >
                  <Calculator /> {UI_STRINGS.abilityScoresPointBuyButton}
                </Button>
              </div>
            )}
          </div>
        )}
      </LockablePanelWrapper>
      <AbilityScoreRollerDialog
        isOpen={isRollerDialogOpen}
        onOpenChange={setIsRollerDialogOpen}
        onScoresApplied={handleApplyRolledScores}
        rerollOnes={rerollOnesForAbilityScores}
        characterClassId={characterClassId}
      />
      <AbilityScorePointBuyDialog
          isOpen={isPointBuyDialogOpen}
          onOpenChange={setIsPointBuyDialogOpen}
          onScoresApplied={handleApplyPointBuyScores}
          totalPointsBudget={pointBuyBudget}
          characterClassId={characterClassId}
      />
      {rollAbilityDialogData && (
        <RollDialog
          isOpen={isRollAbilityDialogOpen}
          onOpenChange={setIsRollAbilityDialogOpen}
          dialogTitle={rollAbilityDialogData.dialogTitle}
          rollType={rollAbilityDialogData.rollType}
          baseModifier={rollAbilityDialogData.baseModifier}
          calculationBreakdown={rollAbilityDialogData.calculationBreakdown}
          rerollTwentiesForChecks={rerollTwentiesForChecks}
          weaponDamageDiceString={rollAbilityDialogData.weaponDamageDiceString || ""}
          weaponCriticalMultiplier={rollAbilityDialogData.weaponCriticalMultiplier || 1}
          onRoll={handleAbilityRollResult}
        />
      )}
    </>
  );
};
CharacterFormAbilityScoresSectionComponent.displayName = 'CharacterFormAbilityScoresSectionComponent';
export const CharacterFormAbilityScoresSection = React.memo(CharacterFormAbilityScoresSectionComponent);
