
'use client';

import * as React from 'react';
import type { AbilityScores, CharacterClass, SavingThrows, SavingThrowType, SingleSavingThrow, Character, AbilityName } from '@/types/character';
// DND_CLASSES, SAVING_THROW_LABELS, ABILITY_LABELS will come from useI18n
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAbilityModifierByName, getBaseSaves, SAVING_THROW_ABILITIES } from '@/lib/dnd-utils';
import { Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/context/I18nProvider'; // Import useI18n
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { renderModifierValue } from '@/components/info-dialog-content/dialog-utils';


interface SavingThrowsPanelProps {
  character: Pick<Character, 'savingThrows' | 'classes'>;
  abilityScores: AbilityScores; // This should be actualAbilityScores from parent
  onSavingThrowMiscModChange: (saveType: SavingThrowType, value: number) => void;
}

const SAVE_TYPES: SavingThrowType[] = ['fortitude', 'reflex', 'will'];

export function SavingThrowsPanel({
  character,
  abilityScores,
  onSavingThrowMiscModChange,
}: SavingThrowsPanelProps) {
  const { translations, isLoading: translationsLoading } = useI18n();

  const savingThrows = character.savingThrows;
  const characterClasses = character.classes;

  if (translationsLoading || !translations) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Zap className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-serif">
              {translations?.UI_STRINGS.savingThrowsPanelTitle || "Saving Throws"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">
              {translations?.UI_STRINGS.savingThrowsPanelLoading || "Loading saving throw details..."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { DND_CLASSES, SAVING_THROW_LABELS, ABILITY_LABELS, UI_STRINGS } = translations;
  
  const calculatedBaseSaves = getBaseSaves(characterClasses, DND_CLASSES);
  
  const dataRows: Array<{
    label: React.ReactNode;
    getValue: (saveData: SingleSavingThrow, baseSave: number, abilityMod: number, total: number, saveType?: SavingThrowType, onMiscChange?: (type: SavingThrowType, val: number) => void) => React.ReactNode;
    rowKey: string;
  }> = [
    {
      label: UI_STRINGS.savingThrowsRowLabelTotal || "Total",
      getValue: (saveData, baseSave, abilityMod, total) => (
        <span className={cn("text-lg font-bold", total >= 0 ? "text-accent" : "text-destructive")}>
          {total >= 0 ? '+' : ''}{total}
        </span>
      ),
      rowKey: 'total',
    },
    {
      label: UI_STRINGS.savingThrowsRowLabelBase || "Base",
      getValue: (saveData, baseSave) => baseSave,
      rowKey: 'base',
    },
    {
      label: <span dangerouslySetInnerHTML={{ __html: UI_STRINGS.savingThrowsRowLabelAbilityModifier || "Ability<br />Modifier" }} />,
      getValue: (saveData, baseSave, abilityMod, total, saveType?: SavingThrowType) => {
        if (!saveType) return abilityMod >= 0 ? `+${abilityMod}` : abilityMod;
        const abilityKey = SAVING_THROW_ABILITIES[saveType];
        const abilityLabelInfo = ABILITY_LABELS.find(al => al.value === abilityKey);
        const abilityAbbr = abilityLabelInfo?.abbr || abilityKey.substring(0,3).toUpperCase();
        return (
          <div className="flex flex-col items-center -my-1">
            <span className="text-xs leading-tight">{abilityAbbr}</span>
            <span className="leading-tight">{renderModifierValue(abilityMod)}</span>
          </div>
        );
      },
      rowKey: 'abilityMod',
    },
    {
      label: <span dangerouslySetInnerHTML={{ __html: UI_STRINGS.savingThrowsRowLabelMagicModifier || "Magic<br />Modifier" }} />,
      getValue: (saveData) => renderModifierValue(saveData.magicMod),
      rowKey: 'magicMod',
    },
    {
      label: <span dangerouslySetInnerHTML={{ __html: UI_STRINGS.savingThrowsRowLabelMiscModifier || "Misc<br />Modifier" }} />,
      getValue: (saveData) => renderModifierValue(saveData.miscMod),
      rowKey: 'miscModDisplay',
    },
    {
      label: <span dangerouslySetInnerHTML={{ __html: UI_STRINGS.savingThrowsRowLabelTemporaryModifier || "Temp.<br />Modifier" }} />,
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
      rowKey: 'temporaryModInput',
    },
  ];


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Zap className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl font-serif">{UI_STRINGS.savingThrowsPanelTitle || "Saving Throws"}</CardTitle>
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

