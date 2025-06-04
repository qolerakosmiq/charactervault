
'use client';

import *as React from 'react';
import type { AbilityName, AbilityScores, DetailedAbilityScores } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dices, Info, Calculator } from 'lucide-react';
import { calculateAbilityModifier } from '@/lib/dnd-utils';
import { cn } from '@/lib/utils';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { AbilityScoreRollerDialog } from '@/components/AbilityScoreRollerDialog';
import { AbilityScorePointBuyDialog } from '@/components/AbilityScorePointBuyDialog';
import { useDefinitionsStore } from '@/lib/definitions-store';

const abilityKeys: Exclude<AbilityName, 'none'>[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

const ABILITY_DISPLAY_NAMES_FULL: Record<Exclude<AbilityName, 'none'>, string> = {
  strength: 'Strength',
  dexterity: 'Dexterity',
  constitution: 'Constitution',
  intelligence: 'Intelligence',
  wisdom: 'Wisdom',
  charisma: 'Charisma',
};

interface CharacterFormAbilityScoresSectionProps {
  baseAbilityScores: AbilityScores;
  detailedAbilityScores: DetailedAbilityScores | null;
  abilityScoreTempCustomModifiers: AbilityScores;
  onBaseAbilityScoreChange: (ability: Exclude<AbilityName, 'none'>, value: number) => void;
  onAbilityScoreTempCustomModifierChange: (ability: Exclude<AbilityName, 'none'>, value: number) => void;
  onMultipleBaseAbilityScoresChange: (newScores: AbilityScores) => void;
  onOpenAbilityScoreBreakdownDialog: (ability: Exclude<AbilityName, 'none'>) => void;
  isCreating: boolean;
}

export function CharacterFormAbilityScoresSection({
  baseAbilityScores,
  detailedAbilityScores,
  abilityScoreTempCustomModifiers,
  onBaseAbilityScoreChange,
  onAbilityScoreTempCustomModifierChange,
  onMultipleBaseAbilityScoresChange,
  onOpenAbilityScoreBreakdownDialog,
  isCreating,
}: CharacterFormAbilityScoresSectionProps) {
  const [isRollerDialogOpen, setIsRollerDialogOpen] = React.useState(false);
  const [isPointBuyDialogOpen, setIsPointBuyDialogOpen] = React.useState(false);

  const { rerollOnesForAbilityScores, pointBuyBudget: rawPointBuyBudgetFromStore } = useDefinitionsStore(state => ({
    rerollOnesForAbilityScores: state.rerollOnesForAbilityScores,
    pointBuyBudget: state.pointBuyBudget,
  }));

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
    setIsRollerDialogOpen(false);
  };

  const handleApplyPointBuyScores = (newScores: AbilityScores) => {
    onMultipleBaseAbilityScoresChange(newScores);
    setIsPointBuyDialogOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Dices className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl font-serif">Ability Scores</CardTitle>
            </div>
            {isCreating && (
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsRollerDialogOpen(true)}>
                  <Dices className="mr-2 h-4 w-4" /> Roll Scores
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setIsPointBuyDialogOpen(true)}>
                  <Calculator className="mr-2 h-4 w-4" /> Point Buy
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {abilityKeys.map(ability => {
              const baseScore = baseAbilityScores[ability];
              const tempCustomMod = abilityScoreTempCustomModifiers?.[ability] ?? 0;
              
              const actualScoreData = detailedAbilityScores ? detailedAbilityScores[ability] : null;
              const totalScore = actualScoreData ? actualScoreData.finalScore : baseScore + tempCustomMod;
              const actualModifier = calculateAbilityModifier(totalScore);
              const abilityDisplayName = ABILITY_DISPLAY_NAMES_FULL[ability];

              return (
                <div key={ability} className="flex flex-col items-center space-y-1.5 p-3 border rounded-md bg-card shadow-sm">
                  <Label htmlFor={`base-score-${ability}`} className="text-center text-md font-medium">
                    {ability.substring(0, 3).toUpperCase()}{' '}
                    <span className="text-xs font-normal text-muted-foreground">{abilityDisplayName}</span>
                  </Label>

                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <span className="text-3xl font-bold text-accent">{totalScore}</span>
                    <span className="text-xl text-accent">({actualModifier >= 0 ? '+' : ''}{actualModifier})</span>
                    {actualScoreData && (
                       <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-primary self-center ml-0.5"
                        onClick={() => onOpenAbilityScoreBreakdownDialog(ability)}
                      >
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="w-full space-y-0.5">
                    <Label htmlFor={`base-score-${ability}`} className="text-xs text-muted-foreground text-center block">Base Score</Label>
                    <NumberSpinnerInput
                      id={`base-score-${ability}`}
                      value={baseScore}
                      onChange={(newValue) => onBaseAbilityScoreChange(ability, newValue)}
                      min={1}
                      inputClassName="h-8 text-base text-center"
                      buttonSize="icon"
                      buttonClassName="h-8 w-8"
                      className="w-full justify-center"
                    />
                  </div>
                  
                  <div className="w-full space-y-0.5 pt-1">
                    <Label htmlFor={`temp-mod-${ability}`} className="text-xs text-muted-foreground text-center block">Custom Temp Mod</Label>
                    <NumberSpinnerInput
                      id={`temp-mod-${ability}`}
                      value={tempCustomMod}
                      onChange={(newValue) => onAbilityScoreTempCustomModifierChange(ability, newValue)}
                      min={-20}
                      max={20}
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
        </CardContent>
      </Card>
      {isCreating && (
        <AbilityScoreRollerDialog
          isOpen={isRollerDialogOpen}
          onOpenChange={setIsRollerDialogOpen}
          onScoresApplied={handleApplyRolledScores}
          rerollOnes={rerollOnesForAbilityScores}
        />
      )}
      {isCreating && (
        <AbilityScorePointBuyDialog
            isOpen={isPointBuyDialogOpen}
            onOpenChange={setIsPointBuyDialogOpen}
            onScoresApplied={handleApplyPointBuyScores}
            totalPointsBudget={pointBuyBudget}
        />
      )}
    </>
  );
}

