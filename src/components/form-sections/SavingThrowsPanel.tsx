
'use client';

import * as React from 'react';
import type { AbilityScores, CharacterClass, SavingThrows, SavingThrowType, DndClassOption, SingleSavingThrow } from '@/types/character';
import { DND_CLASSES }
from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Label might not be directly used in this pivoted table structure for row headers
import { getAbilityModifierByName, getBaseSaves, SAVING_THROW_ABILITIES } from '@/lib/dnd-utils';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SavingThrowsPanelProps {
  savingThrows: SavingThrows;
  abilityScores: AbilityScores; // Expecting detailed/final scores for ability mods
  characterClasses: CharacterClass[];
  onSavingThrowMiscModChange: (saveType: SavingThrowType, value: number) => void;
}

const SAVE_TYPES: SavingThrowType[] = ['fortitude', 'reflex', 'will'];
const SAVE_DISPLAY_NAMES: Record<SavingThrowType, string> = {
  fortitude: 'Fortitude',
  reflex: 'Reflex',
  will: 'Will',
};

export function SavingThrowsPanel({
  savingThrows,
  abilityScores,
  characterClasses,
  onSavingThrowMiscModChange,
}: SavingThrowsPanelProps) {
  const calculatedBaseSaves = getBaseSaves(characterClasses, DND_CLASSES);

  const dataRows = [
    {
      label: 'Total',
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
      label: 'Base',
      getValue: (saveType: SavingThrowType) => calculatedBaseSaves[saveType],
    },
    {
      label: 'Ability Mod',
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
      label: 'Custom Mod',
      getValue: (saveType: SavingThrowType) => (
        <Input
          type="number"
          value={savingThrows[saveType].miscMod}
          onChange={(e) => onSavingThrowMiscModChange(saveType, parseInt(e.target.value, 10) || 0)}
          className="h-8 w-16 text-sm text-center mx-auto" // w-16 might be too wide, adjust if needed
        />
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
          <table className="w-full min-w-[300px]"> {/* Adjusted min-width */}
            <thead>
              <tr className="border-b">
                <th className="py-2 px-2 text-left text-sm font-medium text-muted-foreground">Save Detail</th>
                {SAVE_TYPES.map((saveType) => (
                  <th key={saveType} className="py-2 px-2 text-center text-sm font-medium text-muted-foreground capitalize">
                    {SAVE_DISPLAY_NAMES[saveType]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row) => (
                <tr key={row.label} className="border-b last:border-b-0 hover:bg-muted/10 transition-colors">
                  <td className="py-2 px-2 text-sm font-medium text-foreground">{row.label}</td>
                  {SAVE_TYPES.map((saveType) => (
                    <td key={`${row.label}-${saveType}`} className="py-2 px-2 text-center text-sm text-muted-foreground">
                      {row.getValue(saveType)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
