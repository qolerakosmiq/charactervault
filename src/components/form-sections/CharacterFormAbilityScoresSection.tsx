
'use client';

import * as React from 'react';
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

const abilityNames: Exclude<AbilityName, 'none'>[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

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
    numericPointBuyBudget = 25; // Default if store value is invalid or not string/number
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
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {abilityNames.map(ability => {
              const baseScore = baseAbilityScores[ability];
              const baseModifier = calculateAbilityModifier(baseScore);
              const tempCustomMod = abilityScoreTempCustomModifiers?.[ability] ?? 0;
              const actualScoreData = detailedAbilityScores ? detailedAbilityScores[ability] : null;
              const actualModifier = actualScoreData ? calculateAbilityModifier(actualScoreData.finalScore) : baseModifier + tempCustomMod;

              return (
                <div key={ability} className="space-y-1 flex flex-col items-center">
                  <Label htmlFor={ability} className="capitalize text-sm font-semibold">
                    {ability.substring(0, 3).toUpperCase()}
                  </Label>
                  <p className="text-xs text-muted-foreground capitalize mb-0.5">
                    {ability}
                  </p>
                  <NumberSpinnerInput
                    id={ability}
                    value={baseScore}
                    onChange={(newValue) => onBaseAbilityScoreChange(ability, newValue)}
                    min={1}
                    inputClassName="flex-1 h-8 text-base text-center"
                    buttonSize="icon"
                    buttonClassName="h-8 w-8"
                    className="w-full justify-center"
                  />
                  <p className="text-center text-sm mt-1">
                    <span className="text-accent">Modifier: </span>
                    <span className={cn("font-bold", baseModifier > 0 && "text-emerald-500", baseModifier < 0 && "text-destructive", baseModifier === 0 && "text-accent")}>
                      {baseModifier >= 0 ? '+' : ''}{baseModifier}
                    </span>
                  </p>
                  
                  <div className="mt-1 w-full">
                    <Label htmlFor={`temp-mod-${ability}`} className="text-xs text-muted-foreground text-center block mb-0.5">Custom Temp Mod</Label>
                    <NumberSpinnerInput
                      id={`temp-mod-${ability}`}
                      value={tempCustomMod}
                      onChange={(newValue) => onAbilityScoreTempCustomModifierChange(ability, newValue)}
                      min={-20}
                      max={20}
                      inputClassName="flex-1 h-7 text-sm text-center"
                      buttonSize="icon"
                      buttonClassName="h-7 w-7"
                      className="w-full justify-center"
                    />
                  </div>

                  {actualScoreData && (
                    <div className="text-center text-sm mt-1.5 flex items-center justify-center gap-1">
                      <span className="text-accent">Actual: </span>
                      <span className={cn(
                        "font-bold",
                        actualModifier > 0 && "text-emerald-500",
                        actualModifier < 0 && "text-destructive",
                        actualModifier === 0 && "text-accent"
                      )}>
                        {actualModifier >= 0 ? '+' : ''}{actualModifier}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-primary"
                        onClick={() => onOpenAbilityScoreBreakdownDialog(ability)}
                      >
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
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
