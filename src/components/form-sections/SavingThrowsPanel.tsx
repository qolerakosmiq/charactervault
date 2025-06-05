
'use client';

import * as React from 'react';
import type { AbilityScores, CharacterClass, SavingThrows, SavingThrowType, DndClassOption, SingleSavingThrow, Character, AbilityName } from '@/types/character';
import { DND_CLASSES }
from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAbilityModifierByName, getBaseSaves, SAVING_THROW_ABILITIES } from '@/lib/dnd-utils';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Label } from '@/components/ui/label'; // Added Label for consistency

interface SavingThrowsPanelProps {
  character: Pick<Character, 'savingThrows' | 'classes'>;
  abilityScores: AbilityScores; // This should be actualAbilityScores from parent
  onSavingThrowMiscModChange: (saveType: SavingThrowType, value: number) => void;
}

const SAVE_TYPES: SavingThrowType[] = ['fortitude', 'reflex', 'will'];
const SAVE_DISPLAY_NAMES: Record<SavingThrowType, string> = {
  fortitude: 'Fortitude',
  reflex: 'Reflex',
  will: 'Will',
};

const ABILITY_FULL_NAMES: Record<Exclude<AbilityName, 'none'>, string> = {
  strength: 'Strength',
  dexterity: 'Dexterity',
  constitution: 'Constitution',
  intelligence: 'Intelligence',
  wisdom: 'Wisdom',
  charisma: 'Charisma',
};


export function SavingThrowsPanel({
  character,
  abilityScores,
  onSavingThrowMiscModChange,
}: SavingThrowsPanelProps) {
  const savingThrows = character.savingThrows;
  const characterClasses = character.classes;

  const calculatedBaseSaves = getBaseSaves(characterClasses, DND_CLASSES);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Zap className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl font-serif">Saving Throws</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px]"> {/* Adjusted min-width for new layout */}
            <thead>
              <tr className="border-b">
                <th className="py-2 px-1 text-left text-sm font-medium text-muted-foreground w-[100px]">
                  {/* Empty, was "Save" */}
                </th>
                <th className="py-2 px-1 text-center text-sm font-medium text-muted-foreground w-[60px]">
                  Total
                </th>
                <th className="py-2 px-1 text-center text-sm font-medium text-muted-foreground w-[60px]">
                  Base
                </th>
                <th className="py-2 px-1 text-center text-sm font-medium text-muted-foreground w-[120px]">
                  <div className="flex flex-col items-center">
                    <span>Ability</span>
                    <span>Modifier</span>
                  </div>
                </th>
                <th className="py-2 px-1 text-center text-sm font-medium text-muted-foreground w-[120px]">
                  <div className="flex flex-col items-center">
                    <span>Custom</span>
                    <span>Modifier</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {SAVE_TYPES.map((saveType) => {
                const currentSaveData = savingThrows[saveType];
                const baseSaveValue = calculatedBaseSaves[saveType];
                const abilityKey = SAVING_THROW_ABILITIES[saveType];
                const abilityModifier = getAbilityModifierByName(abilityScores, abilityKey);
                const totalSave = baseSaveValue + abilityModifier + currentSaveData.miscMod + (currentSaveData.magicMod || 0);
                const abilityFullName = ABILITY_FULL_NAMES[abilityKey as Exclude<AbilityName, 'none'>];

                return (
                  <tr key={saveType} className="border-b last:border-b-0 hover:bg-muted/10 transition-colors">
                    <td className="py-3 px-1 text-sm font-medium text-foreground align-middle whitespace-nowrap capitalize">
                      {SAVE_DISPLAY_NAMES[saveType]}
                    </td>
                    <td className="py-3 px-1 text-center text-sm text-muted-foreground align-middle">
                      <span className={cn("text-lg font-bold", totalSave >= 0 ? "text-accent" : "text-destructive")}>
                        {totalSave >= 0 ? '+' : ''}{totalSave}
                      </span>
                    </td>
                    <td className="py-3 px-1 text-center text-sm text-muted-foreground align-middle">
                      {baseSaveValue}
                    </td>
                    <td className="py-3 px-1 text-center text-sm text-muted-foreground align-middle">
                      <div className="flex flex-col items-center -my-1">
                        <span className="text-xs leading-tight">{abilityFullName}</span>
                        <span className="leading-tight">{abilityModifier >= 0 ? '+' : ''}{abilityModifier}</span>
                      </div>
                    </td>
                    <td className="py-3 px-1 text-center text-sm text-muted-foreground align-middle">
                      <div className="flex justify-center">
                        <NumberSpinnerInput
                          value={currentSaveData.miscMod}
                          onChange={(newValue) => onSavingThrowMiscModChange(saveType, newValue)}
                          min={-20}
                          max={20}
                          inputClassName="w-16 h-8 text-sm" // Adjusted width
                          buttonSize="icon" // Using icon size for buttons
                          buttonClassName="h-8 w-8" // Matched button height to input
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
