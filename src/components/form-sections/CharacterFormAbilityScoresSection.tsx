
'use client';

import *as React from 'react';
import type { AbilityName, AbilityScores, DetailedAbilityScores, Character, GenericBreakdownItem, DndClassId } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dices, Info, Calculator, Loader2 } from 'lucide-react';
import { calculateAbilityModifier } from '@/lib/dnd-utils';
import { cn } from '@/lib/utils';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { AbilityScoreRollerDialog } from '@/components/AbilityScoreRollerDialog';
import { AbilityScorePointBuyDialog } from '@/components/AbilityScorePointBuyDialog';
import { RollDialog, type RollDialogProps } from '@/components/RollDialog';
import { useDefinitionsStore } from '@/lib/definitions-store';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { useToast } from '@/hooks/use-toast';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper';
import { parseAndRenderUIString } from '@/lib/utils';

const DEBOUNCE_DELAY = 400; // ms

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

  abilityKeys.forEach(key => {
    const baseScoreCallback = React.useCallback((value: number) => onBaseAbilityScoreChange(key, value), [onBaseAbilityScoreChange, key]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    debouncedStates[key] = useDebouncedFormField(
      abilityScoresData.abilityScores[key] || 0,
      baseScoreCallback,
      DEBOUNCE_DELAY
    );
    
    const tempModCallback = React.useCallback((value: number) => onAbilityScoreTempCustomModifierChange(key, value), [onAbilityScoreTempCustomModifierChange, key]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    debouncedStates[`${key}TempMod`] = useDebouncedFormField(
      abilityScoresData.abilityScoreTempCustomModifiers?.[key] || 0,
      tempModCallback,
      DEBOUNCE_DELAY
    );
  });


  let numericPointBuyBudget: number;
  if (typeof rawPointBuyBudgetFromStore === 'number' && !isNaN(rawPointBuyBudgetFromStore)) {
    numericPointBuyBudget = rawPointBuyBudgetFromStore;
  } else if (typeof rawPointBuyBudgetFromStore === 'string') {
    const parsed = parseFloat(rawPointBuyBudgetFromStore);
    numericPointBuyBudget = !isNaN(parsed) ? parsed : 25;
  } else {
    numericPointBuyBudget = 25;
  }
  const pointBuyBudget = numericPointBuyBudget;


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
    const abilityName = abilityLabelInfo?.label || ability;
    const finalModifier = calculateAbilityModifier(detailedAbilityScores[ability].finalScore);

    const breakdown: GenericBreakdownItem[] = [
      { label: (translations.UI_STRINGS.rollDialogAbilityModifierLabel || "Ability Modifier ({abilityAbbr})").replace("{abilityAbbr}", abilityLabelInfo?.abbr || ability.toUpperCase().substring(0,3)), value: finalModifier, isBold: true }
    ];

    setRollAbilityDialogData({
      dialogTitle: (translations.UI_STRINGS.rollDialogTitleAbilityCheck).replace("{abilityName}", abilityName),
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


  if (translationsLoading || !translations) {
    return (
       <LockablePanelWrapper
        title={translations?.UI_STRINGS.abilityScoresSectionTitle}
        icon={Dices}
        cardContentClassName="pt-2"
        initialLockedState={false}
       >
        {() => (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3">
            {abilityKeys.map(ability => (
              <div key={ability} className="flex flex-col items-center space-y-1.5 p-3 border rounded-md bg-card shadow-sm">
                <Skeleton className="h-6 w-12 mb-1" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-20 mt-1" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        )}
      </LockablePanelWrapper>
    );
  }
  const { ABILITY_LABELS, UI_STRINGS } = translations;


  return (
    <>
      <LockablePanelWrapper
        title={UI_STRINGS.abilityScoresSectionTitle}
        icon={Dices}
        cardContentClassName="pt-2"
        initialLockedState={false}
      >
        {({ isLocked: panelIsLocked }) => (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3">
              {abilityKeys.map(ability => {
                const [baseScoreValue, setBaseScoreValue] = debouncedStates[key];
                const [tempCustomModValue, setTempCustomModValue] = debouncedStates[`${key}TempMod`];

                const actualScoreData = detailedAbilityScores ? detailedAbilityScores[ability] : null;
                const displayTotalScore = actualScoreData
                  ? actualScoreData.finalScore
                  : (abilityScoresData.abilityScores[ability] || 0) +
                    (abilityScoresData.abilityScoreTempCustomModifiers?.[ability] || 0);

                const displayModifier = calculateAbilityModifier(displayTotalScore);

                const abilityLabelInfo = ABILITY_LABELS.find(al => al.id === ability);
                const abilityDisplayName = abilityLabelInfo?.label || ability;
                const abilityAbbr = abilityLabelInfo?.abbr || ability.substring(0,3).toUpperCase();


                return (
                  <div key={ability} className="flex flex-col items-center space-y-1.5 p-3 border rounded-md bg-card shadow-sm">
                    <Label htmlFor={!panelIsLocked ? `base-score-${ability}`: undefined} className="text-center text-md font-medium flex flex-col items-center">
                      <span>{abilityAbbr}</span>
                      <span className="text-xs text-muted-foreground">{abilityDisplayName}</span>
                    </Label>

                    <div className="flex items-center justify-center flex-wrap gap-x-1 gap-y-1 mb-1">
                      <span className="text-xl font-bold text-accent">{displayTotalScore}</span>
                      <span className="text-xl text-accent font-normal">({displayModifier >= 0 ? '+' : ''}{displayModifier})</span>
                      <div className="flex items-center">
                        {actualScoreData && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-primary self-center"
                            onClick={() => onOpenAbilityScoreBreakdownDialog(ability)}
                            aria-label={(UI_STRINGS.infoDialogAbilityBreakdownAriaLabel).replace("{abilityName}", abilityDisplayName)}
                          >
                            <Info className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-primary self-center"
                            onClick={() => handleOpenRollDialog(ability)}
                            aria-label={(UI_STRINGS.rollDialogAbilityCheckAriaLabel || "Roll {abilityName} Check").replace("{abilityName}", abilityDisplayName)}
                          >
                            <Dices className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {!panelIsLocked && (
                      <>
                        <div className="w-full space-y-0.5">
                          <Label htmlFor={`base-score-${ability}`} className="text-xs text-muted-foreground text-center block">{UI_STRINGS.abilityScoresBaseScoreLabel}</Label>
                          <NumberSpinnerInput
                            id={`base-score-${ability}`}
                            value={baseScoreValue}
                            onChange={setBaseScoreValue}
                            min={1}
                            inputClassName="h-8 text-base text-center"
                            buttonSize="icon"
                            buttonClassName="h-8 w-8"
                            className="w-full justify-center"
                            disabled={panelIsLocked}
                          />
                        </div>

                        <div className="w-full space-y-0.5 pt-1">
                          <Label htmlFor={`temp-mod-${ability}`} className="text-xs text-muted-foreground text-center block">{UI_STRINGS.abilityScoresTempModLabel}</Label>
                          <NumberSpinnerInput
                            id={`temp-mod-${ability}`}
                            value={tempCustomModValue}
                            onChange={setTempCustomModValue}
                            inputClassName="h-8 text-base text-center"
                            buttonSize="icon"
                            buttonClassName="h-8 w-8"
                            className="w-full justify-center"
                            disabled={panelIsLocked}
                          />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {!panelIsLocked && (
              <>
                <div className="flex justify-end gap-2 mt-4 mb-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsRollerDialogOpen(true)} className="w-full sm:w-auto">
                        <Dices className="mr-2 h-4 w-4" /> {UI_STRINGS.abilityScoresRollButton}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsPointBuyDialogOpen(true)} className="w-full sm:w-auto">
                        <Calculator className="mr-2 h-4 w-4" /> {UI_STRINGS.abilityScoresPointBuyButton}
                    </Button>
                </div>
                
                <p className="text-sm text-muted-foreground mt-4 pt-2 border-t border-border/30">
                  {parseAndRenderUIString(UI_STRINGS.abilityScoresNote_full)}
                </p>
              </>
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
          weaponDamageDiceString={rollAbilityDialogData.weaponDamageDiceString || ""}
          weaponCriticalMultiplier={rollAbilityDialogData.weaponCriticalMultiplier || 1}
          onRoll={handleAbilityRollResult}
          rerollTwentiesForChecks={rollAbilityDialogData.rerollTwentiesForChecks}
        />
      )}
    </>
  );
};
CharacterFormAbilityScoresSectionComponent.displayName = 'CharacterFormAbilityScoresSectionComponent';
export const CharacterFormAbilityScoresSection = React.memo(CharacterFormAbilityScoresSectionComponent);
