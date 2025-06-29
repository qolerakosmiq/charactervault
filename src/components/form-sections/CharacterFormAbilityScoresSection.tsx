'use client';

import *as React from 'react';
import type { AbilityName, AbilityScores, DetailedAbilityScores, Character, GenericBreakdownItem, DndClassId } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Dices, Calculator } from 'lucide-react';
import { calculateAbilityModifier } from '@/lib/dnd-utils';
import { cn } from '@/lib/utils';
import { AbilityScoreRollerDialog } from '@/components/AbilityScoreRollerDialog';
import { AbilityScorePointBuyDialog } from '@/components/AbilityScorePointBuyDialog';
import { RollDialog, type RollDialogProps } from '@/components/RollDialog';
import { useDefinitionsStore } from '@/lib/definitions-store';
import { useI18n } from '@/context/I18nProvider';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper';
import { parseAndRenderUIString } from '@/lib/utils';
import {
  panelGridGap,
  textStyleDescription,
} from '@/config/layout';
import { Badge } from '@/components/ui/badge';
import { AbilityScoreCard } from './AbilityScoreCard';

const abilityKeys: Exclude<AbilityName, 'none'>[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

export interface CharacterFormAbilityScoresSectionProps {
  abilityScoresData: Pick<Character, 'abilityScores' | 'abilityScoreTempCustomModifiers'>;
  detailedAbilityScores: DetailedAbilityScores | null;
  onBaseAbilityScoreChange: (ability: Exclude<AbilityName, 'none'>, value: number) => void;
  onAbilityScoreTempCustomModifierChange: (ability: Exclude<AbilityName, 'none'>, value: number) => void;
  onMultipleBaseAbilityScoresChange: (newScores: AbilityScores) => void;
  onOpenAbilityScoreBreakdownDialog: (ability: Exclude<AbilityName, 'none'>) => void;
  characterClassId: DndClassId | '';
}

const CharacterFormAbilityScoresSectionContent = React.memo(({
  panelIsLocked,
  abilityScoresData,
  detailedAbilityScores,
  onBaseAbilityScoreChange,
  onAbilityScoreTempCustomModifierChange,
  onOpenAbilityScoreBreakdownDialog,
  translations,
  handleTriggerRollDialog,
  setIsRollerDialogOpen,
  setIsPointBuyDialogOpen,
  pointBuyBudget
}: Omit<CharacterFormAbilityScoresSectionProps, 'onMultipleBaseAbilityScoresChange'> & { 
  panelIsLocked: boolean,
  translations: NonNullable<ReturnType<typeof useI18n>['translations']>,
  handleTriggerRollDialog: (ability: Exclude<AbilityName, 'none'>) => void,
  setIsRollerDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setIsPointBuyDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  pointBuyBudget: number,
}) => {
  if (!detailedAbilityScores || !translations) return null;
  const translationSubsetForChild = { ABILITY_LABELS: translations.ABILITY_LABELS, UI_STRINGS: translations.UI_STRINGS };

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6", panelGridGap)}>
      {abilityKeys.map(ability => (
        <AbilityScoreCard
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
            <Dices /> {translationSubsetForChild.UI_STRINGS.abilityScoresRollButton}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => setIsPointBuyDialogOpen(true)}
            disabled={typeof pointBuyBudget !== 'number'}
            className="w-full sm:col-start-auto lg:col-start-auto"
          >
            <Calculator /> {translationSubsetForChild.UI_STRINGS.abilityScoresPointBuyButton}
          </Button>
        </div>
      )}
    </div>
  );
});
CharacterFormAbilityScoresSectionContent.displayName = 'CharacterFormAbilityScoresSectionContent';

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
  }, []);
  
  if (translationsLoading || !translations || !detailedAbilityScores) return null;

  return (
    <>
      <LockablePanelWrapper
        title={translations.UI_STRINGS.abilityScoresPanelTitle}
        description={translations.UI_STRINGS.abilityScoresPanelDescription}
        icon={Dices}
        initialLockedState={false}
        footer={
          <p className={textStyleDescription}>
            {parseAndRenderUIString(translations.UI_STRINGS.abilityScoresNoteFull, {
              badge: (children: React.ReactNode) => <Badge variant="outline">{children}</Badge>
            })}
          </p>
        }
      >
        {({ isLocked: panelIsLocked }) => (
          <CharacterFormAbilityScoresSectionContent
            panelIsLocked={panelIsLocked}
            abilityScoresData={abilityScoresData}
            detailedAbilityScores={detailedAbilityScores}
            onBaseAbilityScoreChange={onBaseAbilityScoreChange}
            onAbilityScoreTempCustomModifierChange={onAbilityScoreTempCustomModifierChange}
            onOpenAbilityScoreBreakdownDialog={onOpenAbilityScoreBreakdownDialog}
            characterClassId={characterClassId}
            translations={translations}
            handleTriggerRollDialog={handleTriggerRollDialog}
            setIsRollerDialogOpen={setIsRollerDialogOpen}
            setIsPointBuyDialogOpen={setIsPointBuyDialogOpen}
            pointBuyBudget={pointBuyBudget}
          />
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