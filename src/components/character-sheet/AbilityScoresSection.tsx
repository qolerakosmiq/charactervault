
'use client';

import type { AbilityName, AbilityScores } from '@/types/character';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateAbilityModifier } from '@/lib/dnd-utils';
import { Dices } from 'lucide-react';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput'; // Added import

interface AbilityScoresSectionProps {
  abilityScores: AbilityScores;
  onAbilityScoreChange: (ability: AbilityName, value: number) => void;
}

const abilityNames: AbilityName[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

export function AbilityScoresSection({ abilityScores, onAbilityScoreChange }: AbilityScoresSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Dices className="h-6 w-6 text-primary" />
          <CardTitle className="font-serif">Ability Scores</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-6">
          {abilityNames.map(ability => {
            if (ability === 'none') return null;
            const score = abilityScores[ability];
            const modifier = calculateAbilityModifier(score);
            return (
              <div key={ability} className="space-y-1">
                <Label htmlFor={ability} className="capitalize text-sm font-medium">
                  {ability.substring(0, 3).toUpperCase()}
                </Label>
                <NumberSpinnerInput
                  id={ability}
                  value={score}
                  onChange={(newValue) => onAbilityScoreChange(ability, newValue)}
                  min={0} // Practical min, can be adjusted
                  max={99} // Practical max
                  inputClassName="w-20 h-10 text-lg" // Adjusted width
                  buttonClassName="h-10 w-10"
                />
                <p className="text-center text-lg font-semibold text-accent">
                  {modifier >= 0 ? '+' : ''}{modifier}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
