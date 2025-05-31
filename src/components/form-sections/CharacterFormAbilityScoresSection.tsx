
'use client';

import * as React from 'react';
import type { AbilityName, AbilityScores, DetailedAbilityScores } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dices, Info, Calculator } from 'lucide-react'; // Added Calculator
import { calculateAbilityModifier } from '@/lib/dnd-utils';
import { cn } from '@/lib/utils';
import { AbilityScorePointBuyDialog } from '@/components/AbilityScorePointBuyDialog'; // Added import

const abilityNames: Exclude<AbilityName, 'none'>[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

interface CharacterFormAbilityScoresSectionProps {
  baseAbilityScores: AbilityScores;
  detailedAbilityScores: DetailedAbilityScores | null;
  onBaseAbilityScoreChange: (ability: Exclude<AbilityName, 'none'>, value: number) => void;
  onMultipleBaseAbilityScoresChange: (newScores: AbilityScores) => void; // New prop for point buy / roller
  onOpenAbilityScoreBreakdownDialog: (ability: Exclude<AbilityName, 'none'>) => void;
  onOpenRollerDialog: () => void;
  isCreating: boolean;
}

export function CharacterFormAbilityScoresSection({
  baseAbilityScores,
  detailedAbilityScores,
  onBaseAbilityScoreChange,
  onMultipleBaseAbilityScoresChange, // New prop
  onOpenAbilityScoreBreakdownDialog,
  onOpenRollerDialog,
  isCreating,
}: CharacterFormAbilityScoresSectionProps) {
  const [isPointBuyDialogOpen, setIsPointBuyDialogOpen] = React.useState(false);

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
                <Button type="button" variant="outline" size="sm" onClick={onOpenRollerDialog}>
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
              const actualScoreData = detailedAbilityScores ? detailedAbilityScores[ability] : null;
              const actualModifier = actualScoreData ? calculateAbilityModifier(actualScoreData.finalScore) : baseModifier;

              return (
                <div key={ability} className="space-y-1 flex flex-col items-center">
                  <Label htmlFor={ability} className="capitalize text-sm font-semibold">
                    {ability.substring(0, 3).toUpperCase()}
                  </Label>
                  <p className="text-xs text-muted-foreground capitalize mb-0.5">
                    {ability}
                  </p>
                  <Input
                    id={ability}
                    name={ability}
                    type="number"
                    value={baseScore}
                    onChange={(e) => onBaseAbilityScoreChange(ability, parseInt(e.target.value, 10) || 0)}
                    className="text-center w-16"
                    min="1"
                  />
                  <p className="text-center text-sm mt-1">
                    <span className="text-accent">Modifier: </span>
                    <span className={cn("font-bold", baseModifier > 0 && "text-emerald-500", baseModifier < 0 && "text-destructive", baseModifier === 0 && "text-accent")}>
                      {baseModifier >= 0 ? '+' : ''}{baseModifier}
                    </span>
                  </p>
                  {actualScoreData && (
                    <div className="text-center text-sm mt-1 flex items-center justify-center gap-1">
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
        <AbilityScorePointBuyDialog
            isOpen={isPointBuyDialogOpen}
            onOpenChange={setIsPointBuyDialogOpen}
            onScoresApplied={handleApplyPointBuyScores}
        />
      )}
    </>
  );
}
