
'use client';

import * as React from 'react';
import type { AbilityScores, CharacterClass, SavingThrows, SavingThrowType, DndClassOption, SingleSavingThrow, Character } from '@/types/character';
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

export function SavingThrowsPanel({
  character,
  abilityScores, // This is actualAbilityScores (final scores with all mods)
  onSavingThrowMiscModChange,
}: SavingThrowsPanelProps) {
  const savingThrows = character.savingThrows;
  const characterClasses = character.classes;

  const calculatedBaseSaves = getBaseSaves(characterClasses, DND_CLASSES);

  const dataRows = [
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
        const abilityKey = SAVING_THROW_ABILITIES[saveType];
        const abilityModifier = getAbilityModifierByName(abilityScores, abilityKey);
        return (
          <>
            {abilityModifier >= 0 ? '+' : ''}{abilityModifier}
            <span className="ml-1 text-xs">({abilityKey.substring(0, 3).toUpperCase()})</span>
          </>
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
            <thead><tr className="border-b">
                <th className="py-2 px-1 text-left text-sm font-medium text-muted-foreground"></th>
                {SAVE_TYPES.map((saveType) => (<th key={saveType} className="py-2 px-1 text-center text-sm font-medium text-muted-foreground capitalize">
                    {SAVE_DISPLAY_NAMES[saveType]}
                  </th>))}
              </tr></thead>
            <tbody>{
              dataRows.map((row) => {
                const labelKey = typeof row.label === 'string' ? row.label.replace(/\s+/g, '-') : Math.random().toString();
                return (<tr key={labelKey} className="border-b last:border-b-0 hover:bg-muted/10 transition-colors">
                  <td className="py-2 px-1 text-sm font-medium text-foreground align-top whitespace-normal">
                    <span className="inline-block w-full">{row.label}</span>
                  </td>
                  {SAVE_TYPES.map((saveType) => (<td key={`${labelKey}-${saveType}`} className="py-2 px-0.5 text-center text-sm text-muted-foreground">{row.getValue(saveType)}</td>))}
                </tr>);
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
