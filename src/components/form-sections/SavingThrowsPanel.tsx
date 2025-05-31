
'use client';

import * as React from 'react';
import type { AbilityScores, CharacterClass, SavingThrows, SavingThrowType, DndClassOption, SingleSavingThrow } from '@/types/character';
import { DND_CLASSES } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
          <table className="w-full min-w-[360px]">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-1 text-left text-sm font-medium text-muted-foreground">Saving Throw</th>
                <th className="py-2 px-1 text-center text-sm font-medium text-muted-foreground">Total</th>
                <th className="py-2 px-1 text-center text-sm font-medium text-muted-foreground">Base</th>
                <th className="py-2 px-1 text-center text-sm font-medium text-muted-foreground">Ability Mod</th>
                <th className="py-2 px-1 text-center text-sm font-medium text-muted-foreground">Custom Mod</th>
              </tr>
            </thead>
            <tbody>
              {SAVE_TYPES.map((saveType) => {
                const currentSaveData: SingleSavingThrow = savingThrows[saveType];
                const baseSaveValue = calculatedBaseSaves[saveType];
                const abilityKey = SAVING_THROW_ABILITIES[saveType];
                const abilityModifier = getAbilityModifierByName(abilityScores, abilityKey);
                const totalSave = baseSaveValue + abilityModifier + currentSaveData.miscMod + (currentSaveData.magicMod || 0);

                return (
                  <tr key={saveType} className="border-b last:border-b-0 hover:bg-muted/10 transition-colors">
                    <td className="py-3 px-0.5 text-sm font-medium text-foreground">{SAVE_DISPLAY_NAMES[saveType]}</td>
                    <td className={cn("py-3 px-0.5 text-center text-lg font-bold", totalSave >= 0 ? "text-accent" : "text-destructive")}>
                      {totalSave >= 0 ? '+' : ''}{totalSave}
                    </td>
                    <td className="py-3 px-0.5 text-center text-sm text-muted-foreground">{baseSaveValue}</td>
                    <td className="py-3 px-0.5 text-center text-sm text-muted-foreground">
                      {abilityModifier >= 0 ? '+' : ''}{abilityModifier}
                      <span className="ml-1 text-xs">({abilityKey.substring(0, 3).toUpperCase()})</span>
                    </td>
                    <td className="py-3 px-0.5 text-center">
                      <Input
                        type="number"
                        value={currentSaveData.miscMod}
                        onChange={(e) => onSavingThrowMiscModChange(saveType, parseInt(e.target.value, 10) || 0)}
                        className="h-8 w-12 text-sm text-center mx-auto"
                      />
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
