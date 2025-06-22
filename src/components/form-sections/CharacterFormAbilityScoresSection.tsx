
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
import { useToast } from '@/hooks/use-toast';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper';
import { parseAndRenderUIString } from '@/lib/utils';
import { panelGridGap, panelFieldVerticalGap, panelFieldHorizontalGap, DEBOUNCE_DELAY_FORM_INPUT, panelContentPadding, textStyleValueBig, textStyleValueMedium, textStyleSubtle } from '@/config/layout';

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
  const [rollAbilityDialogData, setRollAbilityDialogData] = React.useState<Omit<RollDialogProps, 'isOpen' | 'onOpenChange' | 'onRoll'> | null>(null);
  const { toast } = useToast();

  const { translations, isLoading: translationsLoading } = useI18n();

  const { rerollOnesForAbilityScores, pointBuyBudget: rawPointBuyBudgetFromStore, rerollTwentiesForChecks } = useDefinitionsStore(state => ({
    rerollOnesForAbilityScores: state.rerollOnesForAbilityScores,
    pointBuyBudget: state.pointBuyBudget,
    rerollTwentiesForChecks: state.rerollTwentiesForChecks,
  }));

  const debouncedStates = {} as Record<Exclude<AbilityName, 'none'>, [number, (val: number) => void]> &
                                Record<`${Exclude<AbilityName, 'none'>}TempMod`, [number, (val: number) => void]>;

  abilityKeys.forEach(ability => {
    const baseScoreCallback = React.useCallback((value: number) => onBaseAbilityScoreChange(ability, value), [onBaseAbilityScoreChange, ability]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    debouncedStates[ability] = useDebouncedFormField(
      abilityScoresData.abilityScores[ability] || 0,
      baseScoreCallback,
      DEBOUNCE_DELAY_FORM_INPUT
    );
    
    const tempModCallback = React.useCallback((value: number) => onAbilityScoreTempCustomModifierChange(ability, value), [onAbilityScoreTempCustomModifierChange, ability]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    debouncedStates[`${ability}TempMod`] = useDebouncedFormField(
      abilityScoresData.abilityScoreTempCustomModifiers?.[ability] || 0,
      tempModCallback,
      DEBOUNCE_DELAY_FORM_INPUT
    );
  });
  
  if (typeof rawPointBuyBudgetFromStore !== 'number') {
    throw new Error("Point buy budget is not a valid number. Check definitions-store.");
  }
  const pointBuyBudget = rawPointBuyBudgetFromStore;


  const handleApplyRolledScores = React.useCallback((newScores: AbilityScores) => {
    onMultipleBaseAbilityScoresChange(newScores);
    abilityKeys.forEach(key => {
      debouncedStates[key][1](newScores[key]);
    });
    setIsRollerDialogOpen(false);
  }, [onMultipleBaseAbilityScoresChange, debouncedStates]);

  const handleApplyPointBuyScores = React.useCallback((newScores: AbilityScores) => {
    onMultipleBaseAbilityScoresChange(newScores);
    abilityKeys.forEach(key => {
      debouncedStates[key][1](newScores[key]);
    });
    setIsPointBuyDialogOpen(false);
  }, [onMultipleBaseAbilityScoresChange, debouncedStates]);

  const handleOpenRollDialog = React.useCallback((ability: Exclude<AbilityName, 'none'>) => {
    if (!detailedAbilityScores || !translations) return;
    const abilityLabelInfo = translations.ABILITY_LABELS.find(al => al.id === ability);
    const abilityName = abilityLabelInfo?.label;
    const finalModifier = calculateAbilityModifier(detailedAbilityScores[ability].finalScore);

    const breakdown: GenericBreakdownItem[] = [
      { label: translations.UI_STRINGS.rollDialogAbilityModifierLabel.replace("{abilityAbbr}", abilityLabelInfo?.abbr || ability.toUpperCase().substring(0,3)), value: finalModifier, isBold: true }
    ];

    setRollAbilityDialogData({
      dialogTitle: translations.UI_STRINGS.rollDialogTitleAbilityCheck.replace("{abilityName}", abilityName),
      rollType: `ability_check_${ability}`,
      baseModifier: finalModifier,
      calculationBreakdown: breakdown,
      rerollTwentiesForChecks: rerollTwentiesForChecks,
      weaponDamageDiceString: "", 
      weaponCriticalMultiplier: 1,
    });
    setIsRollAbilityDialogOpen(true);
  }, [detailedAbilityScores, translations, rerollTwentiesForChecks]);

  const handleAbilityRollResult = React.useCallback((diceResult: number, totalBonus: number, finalResult: number) => {
  }, []);

  if (translationsLoading || !translations || !detailedAbilityScores) {
    return null;
  }
  const { ABILITY_LABELS, UI_STRINGS } = translations;


  return (
    <>
      <LockablePanelWrapper
        title={UI_STRINGS.abilityScoresSectionTitle}
        description={UI_STRINGS.abilityScoresPanelDescription}
        icon={Dices}
        headerClassName="bg-muted/20"
        initialLockedState={false}
        footer={
          <p className="text-sm text-muted-foreground">
            {parseAndRenderUIString(UI_STRINGS.abilityScoresNote_full)}
          </p>
        }
      >
        {({ isLocked: panelIsLocked }) => (
          <>
            <div className={cn("grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6", panelGridGap)}>
              {abilityKeys.map(ability => {
                const [baseScoreValue, setBaseScoreValue] = debouncedStates[ability];
                const [tempCustomModValue, setTempCustomModValue] = debouncedStates[`${ability}TempMod`];

                const actualScoreData = detailedAbilityScores![ability];
                const displayTotalScore = actualScoreData.finalScore;
                const displayModifier = calculateAbilityModifier(displayTotalScore);

                const abilityLabelInfo = ABILITY_LABELS.find(al => al.id === ability);
                const abilityDisplayName = abilityLabelInfo?.label;
                const abilityAbbr = abilityLabelInfo?.abbr;


                return (
                  <div key={ability} className={cn("flex flex-col border rounded-md bg-card", panelContentPadding, panelFieldVerticalGap)}>
                    <Label htmlFor={!panelIsLocked ? `base-score-${ability}` : undefined} className="text-center text-md font-medium flex flex-col items-center">
                      <span>{abilityAbbr}</span>
                      <span className={textStyleSubtle}>{abilityDisplayName}</span>
                    </Label>

                    <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                      <p className={textStyleValueBig}>{displayTotalScore}</p>
                      {actualScoreData && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:text-primary self-center"
                          onClick={() => onOpenAbilityScoreBreakdownDialog(ability)}
                          aria-label={UI_STRINGS.infoDialogAbilityBreakdownAriaLabel.replace("{abilityName}", abilityDisplayName)}
                        >
                          <Info />
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-center">
                        <Label className={textStyleSubtle}>{UI_STRINGS.abilityScoresFinalModifierLabel}</Label>
                        <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                            <p className={textStyleValueMedium}>{displayModifier >= 0 ? '+' : ''}{displayModifier}</p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="text-muted-foreground hover:text-primary self-center"
                              onClick={() => handleOpenRollDialog(ability)}
                              aria-label={UI_STRINGS.rollDialogAbilityCheckAriaLabel.replace("{abilityName}", abilityDisplayName)}
                            >
                              <Dices />
                            </Button>
                        </div>
                    </div>

                    {!panelIsLocked && (
                      <div className={cn("w-full mt-auto", panelFieldVerticalGap)}>
                        <div className={cn("w-full", panelFieldVerticalGap)}>
                          <Label htmlFor={`base-score-${ability}`} className={cn(textStyleSubtle, "text-center block")}>{UI_STRINGS.abilityScoresBaseScoreLabel}</Label>
                          <Input
                            id={`base-score-${ability}`}
                            type="number"
                            value={baseScoreValue}
                            onChange={(e) => setBaseScoreValue(parseInt(e.target.value, 10) || 1)}
                            min={1}
                            className="text-base text-center"
                            disabled={panelIsLocked}
                          />
                        </div>

                        <div className={cn("w-full", panelFieldVerticalGap)}>
                          <Label htmlFor={`temp-mod-${ability}`} className={cn(textStyleSubtle, "text-center block")}>{UI_STRINGS.abilityScoresTempModLabel}</Label>
                          <Input
                            id={`temp-mod-${ability}`}
                            type="number"
                            value={tempCustomModValue}
                            onChange={(e) => setTempCustomModValue(parseInt(e.target.value, 10) || 0)}
                            className="text-base text-center"
                            disabled={panelIsLocked}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!panelIsLocked && (
              <div className={cn("grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6", panelGridGap)}>
                <div className="lg:col-start-5 sm:col-span-3">
                  <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={() => setIsRollerDialogOpen(true)}
                      disabled={panelIsLocked}
                      className="w-full"
                  >
                      <Dices /> {UI_STRINGS.abilityScoresRollButton}
                  </Button>
                </div>
                <div className="lg:col-start-6 sm:col-span-3">
                  <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={() => setIsPointBuyDialogOpen(true)}
                      disabled={panelIsLocked || typeof pointBuyBudget !== 'number'}
                      className="w-full"
                  >
                      <Calculator /> {UI_STRINGS.abilityScoresPointBuyButton}
                  </Button>
                </div>
              </div>
            )}
          </>
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
