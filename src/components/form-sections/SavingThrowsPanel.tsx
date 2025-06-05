
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
  abilityScores, // This is actualAbilityScores (final scores with all mods)
  onSavingThrowMiscModChange,
}: SavingThrowsPanelProps) {
  const savingThrows = character.savingThrows;
  const characterClasses = character.classes;

  const calculatedBaseSaves = getBaseSaves(characterClasses, DND_CLASSES);

  const dataColumns = [
    {
      label: "Total",
      getValue: (saveType: SavingThrowType) => {
        const currentSaveData: SingleSavingThrow = savingThrows[saveType];
        const baseSaveValue = calculatedBaseSaves[saveType];
        const abilityKey = SAVING_THROW_ABILITIES[saveType];
        const abilityModifier = getAbilityModifierByName(abilityScores, abilityKey);
        const totalSave = baseSaveValue + abilityModifier + currentSaveData.miscMod + (currentSaveData.magicMod || 0);
        return <span className={cn("text-lg font-bold", totalSave >= 0 ? "text-accent" : "text-destructive")}>{totalSave >= 0 ? '+' : ''}{totalSave}</span>;
      },
    },
    {
      label: "Base",
      getValue: (saveType: SavingThrowType) => calculatedBaseSaves[saveType],
    },
    {
      label: "Ability Modifier",
      getValue: (saveType: SavingThrowType) => {
        const abilityKey = SAVING_THROW_ABILITIES[saveType] as Exclude<AbilityName, 'none'>;
        const abilityModifier = getAbilityModifierByName(abilityScores, abilityKey);
        const fullAbilityName = ABILITY_FULL_NAMES[abilityKey];
        return (
          <div className="flex flex-col items-center -my-1">
            <span className="text-xs leading-tight">{fullAbilityName}</span>
            <span className="leading-tight">{abilityModifier >= 0 ? '+' : ''}{abilityModifier}</span>
          </div>
        );
      },
    },
    {
      label: "Custom Modifier",
      getValue: (saveType: SavingThrowType) => (
        <div className="flex justify-center">
          <NumberSpinnerInput
            value={savingThrows[saveType].miscMod}
            onChange={(newValue) => onSavingThrowMiscModChange(saveType, newValue)}
            min={-20}
            max={20}
            inputClassName="w-10 h-7 text-sm"
            buttonSize="sm"
            buttonClassName="h-7 w-7"
          />
        </div>
      ),
    },
  ];


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
          <table className="w-full min-w-[300px]">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-1 text-left text-sm font-medium text-muted-foreground">Save</th>
                {dataColumns.map((col) => (
                  <th key={col.label} className="py-2 px-1 text-center text-sm font-medium text-muted-foreground capitalize">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAVE_TYPES.map((saveType) => {
                return (
                  <tr key={saveType} className="border-b last:border-b-0 hover:bg-muted/10 transition-colors">
                    <td className="py-2 px-1 text-sm font-medium text-foreground align-middle whitespace-nowrap capitalize">
                      {SAVE_DISPLAY_NAMES[saveType]}
                    </td>
                    {dataColumns.map((col) => (
                      <td key={`${saveType}-${col.label}`} className="py-2 px-0.5 text-center text-sm text-muted-foreground align-middle">
                        {col.getValue(saveType)}
                      </td>
                    ))}
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

