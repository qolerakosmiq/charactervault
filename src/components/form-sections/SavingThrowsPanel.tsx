
'use client';

import * as React from 'react';
import type { AbilityScores, CharacterClass, SavingThrows, SavingThrowType, DndClassOption, SingleSavingThrow, Character, AbilityName } from '@/types/character';
import { DND_CLASSES, SAVING_THROW_LABELS, ABILITY_LABELS }
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

const dataRows: Array<{
  label: React.ReactNode; // Allow JSX for multi-line headers
  getValue: (saveData: SingleSavingThrow, baseSave: number, abilityMod: number, total: number, saveType?: SavingThrowType, onMiscChange?: (type: SavingThrowType, val: number) => void) => React.ReactNode;
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
      const abilityLabelInfo = ABILITY_LABELS.find(al => al.value === abilityKey);
      const abilityAbbr = abilityLabelInfo?.abbr || abilityKey.substring(0,3).toUpperCase();
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
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-muted scrollbar-thumb-rounded-md scrollbar-track-rounded-md">
          <table className="w-full min-w-[400px]">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-1 text-left text-sm font-medium text-muted-foreground w-[100px]"></th>
                {SAVE_TYPES.map((saveType) => (
                  <th key={saveType} className="py-2 px-1 text-center text-sm font-medium text-foreground capitalize">
                    {SAVING_THROW_LABELS.find(stl => stl.value === saveType)?.label || saveType}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((dataRow) => {
                return (
                  <tr key={dataRow.rowKey} className="border-b last:border-b-0 hover:bg-muted/10 transition-colors">
                    <td className="py-3 px-1 text-left text-sm font-medium text-muted-foreground align-middle whitespace-nowrap">
                      {dataRow.label}
                    </td>
                    {SAVE_TYPES.map((saveType) => {
                      const currentSaveData = savingThrows[saveType];
                      const baseSaveValue = calculatedBaseSaves[saveType];
                      const abilityKey = SAVING_THROW_ABILITIES[saveType];
                      const abilityModifier = getAbilityModifierByName(abilityScores, abilityKey);
                      const totalSave = baseSaveValue + abilityModifier + currentSaveData.miscMod + (currentSaveData.magicMod || 0);
                      return (
                        <td key={`${saveType}-${dataRow.rowKey}`} className="py-3 px-1 text-center text-sm text-foreground align-middle">
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

