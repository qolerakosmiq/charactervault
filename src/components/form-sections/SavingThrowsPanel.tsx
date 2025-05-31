
'use client';

import * as React from 'react';
import type { AbilityScores, CharacterClass, SavingThrows, SavingThrowType, DndClassOption, SingleSavingThrow } from '@/types/character';
import { DND_CLASSES }
from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
// Label import removed as it's not directly used for row headers now
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
      label: <span className="inline-block w-full whitespace-normal">Total</span>,
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
      label: <span className="inline-block w-full whitespace-normal">Base</span>,
      getValue: (saveType: SavingThrowType) => calculatedBaseSaves[saveType],
    },
    {
      label: <span className="inline-block w-full whitespace-normal">Ability Modifier</span>,
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
      label: <span className="inline-block w-full whitespace-normal">Custom Modifier</span>,
      getValue: (saveType: SavingThrowType) => (
        <Input
          type="number"
          value={savingThrows[saveType].miscMod}
          onChange={(e) => onSavingThrowMiscModChange(saveType, parseInt(e.target.value, 10) || 0)}
          className="h-8 w-12 text-sm text-center mx-auto"
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
          <table className="w-full min-w-[300px]">
            <thead><tr className="border-b">
                <th className="py-2 px-1 text-left text-sm font-medium text-muted-foreground"></th> {/* Removed "Save Detail" */}
                {SAVE_TYPES.map((saveType) => (
                  <th key={saveType} className="py-2 px-1 text-center text-sm font-medium text-muted-foreground capitalize whitespace-normal">
                    <span className="inline-block w-full">{SAVE_DISPLAY_NAMES[saveType]}</span>
                  </th>
                ))}
              </tr></thead>
            <tbody>
              {dataRows.map((row) => (
                <tr key={(typeof row.label.props.children === 'string' ? row.label.props.children : Math.random().toString())} className="border-b last:border-b-0 hover:bg-muted/10 transition-colors">
                  <td className="py-2 px-1 text-sm font-medium text-foreground align-top whitespace-normal">
                    {row.label}
                  </td>
                  {SAVE_TYPES.map((saveType) => (
                    <td key={`${(typeof row.label.props.children === 'string' ? row.label.props.children : Math.random().toString())}-${saveType}`} className="py-2 px-0.5 text-center text-sm text-muted-foreground">
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
    
