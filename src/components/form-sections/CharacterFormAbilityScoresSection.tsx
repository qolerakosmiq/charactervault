
'use client';

import *as React from 'react';
import type { AbilityName, AbilityScores, DetailedAbilityScores, Character } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dices, Info, Calculator, Loader2 } from 'lucide-react';
import { calculateAbilityModifier } from '@/lib/dnd-utils';
import { cn } from '@/lib/utils';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { AbilityScoreRollerDialog } from '@/components/AbilityScoreRollerDialog';
import { AbilityScorePointBuyDialog } from '@/components/AbilityScorePointBuyDialog';
import { useDefinitionsStore } from '@/lib/definitions-store';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';

const DEBOUNCE_DELAY = 400; // ms

const abilityKeys: Exclude<AbilityName, 'none'>[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

export interface CharacterFormAbilityScoresSectionProps {
  abilityScoresData: Pick<Character, 'abilityScores' | 'abilityScoreTempCustomModifiers'>;
  detailedAbilityScores: DetailedAbilityScores | null;
  onBaseAbilityScoreChange: (ability: Exclude<AbilityName, 'none'>, value: number) => void;
  onAbilityScoreTempCustomModifierChange: (ability: Exclude<AbilityName, 'none'>, value: number) => void;
  onMultipleBaseAbilityScoresChange: (newScores: AbilityScores) => void;
  onOpenAbilityScoreBreakdownDialog: (ability: Exclude<AbilityName, 'none'>) => void;
}

const CharacterFormAbilityScoresSectionComponent = ({
  abilityScoresData,
  detailedAbilityScores,
  onBaseAbilityScoreChange,
  onAbilityScoreTempCustomModifierChange,
  onMultipleBaseAbilityScoresChange,
  onOpenAbilityScoreBreakdownDialog,
}: CharacterFormAbilityScoresSectionProps) => {
  const [isRollerDialogOpen, setIsRollerDialogOpen] = React.useState(false);
  const [isPointBuyDialogOpen, setIsPointBuyDialogOpen] = React.useState(false);
  const { translations, isLoading: translationsLoading } = useI18n();

  const { rerollOnesForAbilityScores, pointBuyBudget: rawPointBuyBudgetFromStore } = useDefinitionsStore(state => ({
    rerollOnesForAbilityScores: state.rerollOnesForAbilityScores,
    pointBuyBudget: state.pointBuyBudget,
  }));
  
  const debouncedStates = {} as Record<Exclude<AbilityName, 'none'>, [number, (val: number) => void]> & 
                                Record<`${Exclude<AbilityName, 'none'>}TempMod`, [number, (val: number) => void]>;

  abilityKeys.forEach(key => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    debouncedStates[key] = useDebouncedFormField(
      abilityScoresData.abilityScores[key] || 0,
      (value) => onBaseAbilityScoreChange(key, value),
      DEBOUNCE_DELAY
    );
    // eslint-disable-next-line react-hooks/rules-of-hooks
    debouncedStates[`${key}TempMod`] = useDebouncedFormField(
      abilityScoresData.abilityScoreTempCustomModifiers?.[key] || 0,
      (value) => onAbilityScoreTempCustomModifierChange(key, value),
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


  const handleApplyRolledScores = (newScores: AbilityScores) => {
    onMultipleBaseAbilityScoresChange(newScores);
    abilityKeys.forEach(key => {
      debouncedStates[key][1](newScores[key]); 
    });
    setIsRollerDialogOpen(false);
  };

  const handleApplyPointBuyScores = (newScores: AbilityScores) => {
    onMultipleBaseAbilityScoresChange(newScores);
    abilityKeys.forEach(key => {
      debouncedStates[key][1](newScores[key]);
    });
    setIsPointBuyDialogOpen(false);
  };
  
  if (translationsLoading || !translations) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <div className="flex items-center space-x-3">
              <Dices className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl font-serif">Ability Scores</CardTitle>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-3 sm:mt-0">
              <Skeleton className="h-9 w-full sm:w-28" />
              <Skeleton className="h-9 w-full sm:w-28" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
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
        </CardContent>
      </Card>
    );
  }
  const { ABILITY_LABELS, UI_STRINGS } = translations;


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <div className="flex items-center space-x-3">
              <Dices className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl font-serif">{UI_STRINGS.abilityScoresSectionTitle || "Ability Scores"}</CardTitle>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-3 sm:mt-0">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsRollerDialogOpen(true)} className="w-full sm:w-auto">
                <Dices className="mr-2 h-4 w-4" /> {UI_STRINGS.abilityScoresRollButton || "Roll Scores"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsPointBuyDialogOpen(true)} className="w-full sm:w-auto">
                <Calculator className="mr-2 h-4 w-4" /> {UI_STRINGS.abilityScoresPointBuyButton || "Point Buy"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {abilityKeys.map(ability => {
              const [baseScoreValue, setBaseScoreValue] = debouncedStates[ability];
              const [tempCustomModValue, setTempCustomModValue] = debouncedStates[`${ability}TempMod`];

              const actualScoreData = detailedAbilityScores ? detailedAbilityScores[ability] : null;
              const displayTotalScore = actualScoreData 
                ? actualScoreData.finalScore 
                : (abilityScoresData.abilityScores[ability] || 0) + 
                  (abilityScoresData.abilityScoreTempCustomModifiers?.[ability] || 0) +
                  (actualScoreData?.components.find(c => c.sourceLabel === "Race")?.value || 0) +
                  (actualScoreData?.components.find(c => c.sourceLabel === "Aging")?.value || 0) +
                  (actualScoreData?.components.find(c => c.sourceLabel === "Feat")?.value || 0);
              
              const displayModifier = calculateAbilityModifier(displayTotalScore);

              const abilityLabelInfo = ABILITY_LABELS.find(al => al.value === ability);
              const abilityDisplayName = abilityLabelInfo?.label || ability;
              const abilityAbbr = abilityLabelInfo?.abbr || ability.substring(0,3).toUpperCase();


              return (
                <div key={ability} className="flex flex-col items-center space-y-1.5 p-3 border rounded-md bg-card shadow-sm">
                  <Label htmlFor={`base-score-${ability}`} className="text-center text-md font-medium flex flex-col items-center">
                    <span>{abilityAbbr}</span>
                    <span className="text-xs font-normal text-muted-foreground">{abilityDisplayName}</span>
                  </Label>

                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <span className="text-3xl font-bold text-accent">{displayTotalScore}</span>
                    <span className="text-xl text-accent">({displayModifier >= 0 ? '+' : ''}{displayModifier})</span>
                    {actualScoreData && (
                       <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-primary self-center ml-0.5 mt-0.5"
                        onClick={() => onOpenAbilityScoreBreakdownDialog(ability)}
                      >
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="w-full space-y-0.5">
                    <Label htmlFor={`base-score-${ability}`} className="text-xs text-muted-foreground text-center block">{UI_STRINGS.abilityScoresBaseScoreLabel || "Base Score"}</Label>
                    <NumberSpinnerInput
                      id={`base-score-${ability}`}
                      value={baseScoreValue} 
                      onChange={setBaseScoreValue}
                      min={1}
                      inputClassName="h-8 text-base text-center"
                      buttonSize="icon"
                      buttonClassName="h-8 w-8"
                      className="w-full justify-center"
                    />
                  </div>

                  <div className="w-full space-y-0.5 pt-1">
                    <Label htmlFor={`temp-mod-${ability}`} className="text-xs text-muted-foreground text-center block">{UI_STRINGS.abilityScoresTempModLabel || "Temporary Modifier"}</Label>
                    <NumberSpinnerInput
                      id={`temp-mod-${ability}`}
                      value={tempCustomModValue} 
                      onChange={setTempCustomModValue}
                      inputClassName="h-8 text-base text-center"
                      buttonSize="icon"
                      buttonClassName="h-8 w-8"
                      className="w-full justify-center"
                    />
                  </div>
                </div>
              );
            })}
          </div>
           <p className="text-sm text-muted-foreground mt-4 pt-2 border-t border-border/30">
            <span dangerouslySetInnerHTML={{ __html: UI_STRINGS.abilityScoresNote_prefix || "<strong>Note:</strong> The " }} />
            <Badge variant="outline" className="text-xs font-normal px-1 py-0.5 align-baseline mx-0.5">
              {UI_STRINGS.abilityScoresNote_badge0_text || "Temporary Modifier"}
            </Badge>
            {UI_STRINGS.abilityScoresNote_text_after_badge0 || " field adjusts the "}
            <Badge variant="outline" className="text-xs font-normal px-1 py-0.5 align-baseline mx-0.5">
              {UI_STRINGS.abilityScoresNote_badge1_text || "Base Score"}
            </Badge>
            {UI_STRINGS.abilityScoresNote_suffix || ", not the ability modifier derived from the base score. Other bonuses from race, aging, or feats are applied automatically to the total score."}
           </p>
        </CardContent>
      </Card>
      <AbilityScoreRollerDialog
        isOpen={isRollerDialogOpen}
        onOpenChange={setIsRollerDialogOpen}
        onScoresApplied={handleApplyRolledScores}
        rerollOnes={rerollOnesForAbilityScores}
      />
      <AbilityScorePointBuyDialog
          isOpen={isPointBuyDialogOpen}
          onOpenChange={setIsPointBuyDialogOpen}
          onScoresApplied={handleApplyPointBuyScores}
          totalPointsBudget={pointBuyBudget}
      />
    </>
  );
};
CharacterFormAbilityScoresSectionComponent.displayName = 'CharacterFormAbilityScoresSectionComponent';
export const CharacterFormAbilityScoresSection = React.memo(CharacterFormAbilityScoresSectionComponent);

