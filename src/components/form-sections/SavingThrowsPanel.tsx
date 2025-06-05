
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
import { Label } from '@/components/ui/label';

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

const ABILITY_ABBREVIATIONS: Record<Exclude<AbilityName, 'none'>, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  constitution: 'CON',
  intelligence: 'INT',
  wisdom: 'WIS',
  charisma: 'CHA',
};


const dataRows: Array<{
  label: React.ReactNode; // Allow JSX for multi-line headers
  getValue: (saveData: SingleSavingThrow, baseSave: number, abilityMod: number, total: number) => React.ReactNode;
  rowKey: string;
}> = [
  {
    label: "Total",
    getValue: (saveData, baseSave, abilityMod, total) => (
      <span className={cn("text-lg font-bold", total >= 0 ? "text-accent" : "text-destructive")}>
        {total >= 0 ? '+' : ''}{total}
      </span>
    ),
    rowKey: 'total',
  },
  {
    label: "Base",
    getValue: (saveData, baseSave) => baseSave,
    rowKey: 'base',
  },
  {
    label: (
      <>
        Ability
        <br />
        Modifier
      </>
    ),
    getValue: (saveData, baseSave, abilityMod, total, saveType?: SavingThrowType) => {
      if (!saveType) return abilityMod >= 0 ? `+${abilityMod}` : abilityMod;
      const abilityKey = SAVING_THROW_ABILITIES[saveType];
      const abilityAbbr = ABILITY_ABBREVIATIONS[abilityKey as Exclude<AbilityName, 'none'>];
      return (
        <div className="flex flex-col items-center -my-1">
          <span className="text-xs leading-tight">{abilityAbbr}</span>
          <span className="leading-tight">{abilityMod >= 0 ? '+' : ''}{abilityMod}</span>
        </div>
      );
    },
    rowKey: 'abilityMod',
  },
  {
    label: (
      <>
        Custom
        <br />
        Modifier
      </>
    ),
    getValue: (saveData, baseSave, abilityMod, total, saveType?: SavingThrowType, onMiscChange?: (type: SavingThrowType, val: number) => void) => (
      <div className="flex justify-center">
        <NumberSpinnerInput
          value={saveData.miscMod}
          onChange={(newValue) => onMiscChange && saveType && onMiscChange(saveType, newValue)}
          min={-20}
          max={20}
          inputClassName="w-16 h-8 text-sm"
          buttonSize="icon"
          buttonClassName="h-8 w-8"
        />
      </div>
    ),
    rowKey: 'customMod',
  },
];


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
          <table className="w-full min-w-[400px]">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-1 text-left text-sm font-medium text-muted-foreground w-[100px]"></th>
                {SAVE_TYPES.map((saveType) => (
                  <th key={saveType} className="py-2 px-1 text-center text-sm font-medium text-muted-foreground capitalize">
                    {SAVE_DISPLAY_NAMES[saveType]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((dataRow) => {
                return (
                  <tr key={dataRow.rowKey} className="border-b last:border-b-0 hover:bg-muted/10 transition-colors">
                    <td className="py-3 px-1 text-left text-sm font-medium text-foreground align-middle whitespace-nowrap">
                      {dataRow.label}
                    </td>
                    {SAVE_TYPES.map((saveType) => {
                      const currentSaveData = savingThrows[saveType];
                      const baseSaveValue = calculatedBaseSaves[saveType];
                      const abilityKey = SAVING_THROW_ABILITIES[saveType];
                      const abilityModifier = getAbilityModifierByName(abilityScores, abilityKey);
                      const totalSave = baseSaveValue + abilityModifier + currentSaveData.miscMod + (currentSaveData.magicMod || 0);
                      return (
                        <td key={`${saveType}-${dataRow.rowKey}`} className="py-3 px-1 text-center text-sm text-muted-foreground align-middle">
                          {dataRow.getValue(currentSaveData, baseSaveValue, abilityModifier, totalSave, saveType, onSavingThrowMiscModChange)}
                        </td>
                      );
                    })}
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
