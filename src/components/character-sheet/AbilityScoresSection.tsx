
'use client';

import type { AbilityName, AbilityScores } from '@/types/character';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateAbilityModifier } from '@/lib/dnd-utils';
import { Dices, Loader2 } from 'lucide-react';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';

interface AbilityScoresSectionProps {
  abilityScores: AbilityScores;
  onAbilityScoreChange: (ability: AbilityName, value: number) => void;
}

const abilityKeys: Exclude<AbilityName, 'none'>[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

export function AbilityScoresSection({ abilityScores, onAbilityScoreChange }: AbilityScoresSectionProps) {
  const { translations, isLoading: translationsLoading } = useI18n();

  if (translationsLoading || !translations) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Dices className="h-6 w-6 text-primary" />
            <Skeleton className="h-6 w-32" />
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-6 pt-2">
          {abilityKeys.map(ability => (
            <div key={`skel-${ability}`} className="space-y-1 text-center">
              <Skeleton className="h-4 w-8 mx-auto mb-1" />
              <Skeleton className="h-10 w-20 mx-auto" />
              <Skeleton className="h-6 w-10 mx-auto mt-1" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  const { ABILITY_LABELS, UI_STRINGS } = translations;


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Dices className="h-6 w-6 text-primary" />
          <CardTitle className="font-serif">{UI_STRINGS.abilityScoresSectionTitle || "Ability Scores"}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-6">
          {abilityKeys.map(ability => {
            if (ability === 'none') return null;
            const score = abilityScores[ability];
            const modifier = calculateAbilityModifier(score);
            const abilityLabelInfo = ABILITY_LABELS.find(al => al.value === ability);
            const abilityAbbr = abilityLabelInfo?.abbr || ability.substring(0, 3).toUpperCase();
            const abilityFullName = abilityLabelInfo?.label || ability.charAt(0).toUpperCase() + ability.slice(1);

            return (
              <div key={ability} className="space-y-1 text-center">
                <Label htmlFor={ability} className="capitalize text-sm font-medium" title={abilityFullName}>
                  {abilityAbbr}
                </Label>
                <NumberSpinnerInput
                  id={ability}
                  value={score}
                  onChange={(newValue) => onAbilityScoreChange(ability, newValue)}
                  min={0} 
                  max={99} 
                  inputClassName="w-20 h-10 text-lg" 
                  buttonClassName="h-10 w-10"
                  className="justify-center"
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

