
'use client';

import * as React from 'react';
import type { AbilityName, AbilityScores, DetailedAbilityScores } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dices, Info, Calculator } from 'lucide-react';
import { calculateAbilityModifier } from '@/lib/dnd-utils';
import { cn } from '@/lib/utils';
// AbilityScorePointBuyDialog import removed as it's no longer rendered here
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';

const abilityNames: Exclude<AbilityName, 'none'>[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

interface CharacterFormAbilityScoresSectionProps {
  baseAbilityScores: AbilityScores;
  detailedAbilityScores: DetailedAbilityScores | null;
  onBaseAbilityScoreChange: (ability: Exclude<AbilityName, 'none'>, value: number) => void;
  onMultipleBaseAbilityScoresChange: (newScores: AbilityScores) => void;
  onOpenAbilityScoreBreakdownDialog: (ability: Exclude<AbilityName, 'none'>) => void;
  onOpenRollerDialog: () => void;
  onOpenPointBuyDialog: () => void; // New prop to open dialog in parent
  isCreating: boolean;
}

export function CharacterFormAbilityScoresSection({
  baseAbilityScores,
  detailedAbilityScores,
  onBaseAbilityScoreChange,
  onMultipleBaseAbilityScoresChange,
  onOpenAbilityScoreBreakdownDialog,
  onOpenRollerDialog,
  onOpenPointBuyDialog, // Destructure new prop
  isCreating,
}: CharacterFormAbilityScoresSectionProps) {
  // Local state for PointBuyDialog (isPointBuyDialogOpen) is removed

  // handleApplyPointBuyScores is removed as dialog is handled by parent

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
                <Button type="button" variant="outline" size="sm" onClick={onOpenPointBuyDialog}> {/* Use prop here */}
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
      {/* AbilityScorePointBuyDialog instance removed from here */}
    </>
  );
}
