'use client';

import type { AbilityName, AbilityScores } from '@/types/character';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateAbilityModifier } from '@/lib/dnd-utils';
import { Dices } from 'lucide-react';

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
            const score = abilityScores[ability];
            const modifier = calculateAbilityModifier(score);
            return (
              <div key={ability} className="space-y-1">
                <Label htmlFor={ability} className="capitalize text-sm font-medium">
                  {ability.substring(0, 3).toUpperCase()}
                </Label>
                <Input
                  id={ability}
                  name={ability}
                  type="number"
                  value={score}
                  onChange={(e) => onAbilityScoreChange(ability, parseInt(e.target.value, 10) || 0)}
                  className="w-full text-lg text-center appearance-none"
                  min="0" max="99"
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
