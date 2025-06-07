
'use client';

import *as React from 'react';
import type { AbilityScores, CharacterClass, SavingThrows, SavingThrowType, SingleSavingThrow, Character, AbilityName } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAbilityModifierByName, getBaseSaves, SAVING_THROW_ABILITIES } from '@/lib/dnd-utils';
import { Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/context/I18nProvider'; 
import { Skeleton } from '@/components/ui/skeleton'; 
import { renderModifierValue } from '@/components/info-dialog-content/dialog-utils';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';

const DEBOUNCE_DELAY = 400;

interface SavingThrowsPanelProps {
  character: Pick<Character, 'savingThrows' | 'classes'>;
  abilityScores: AbilityScores; 
  onSavingThrowMiscModChange: (saveType: SavingThrowType, value: number) => void;
}

const SAVE_TYPES: SavingThrowType[] = ['fortitude', 'reflex', 'will'];

export function SavingThrowsPanel({
  character,
  abilityScores,
  onSavingThrowMiscModChange,
}: SavingThrowsPanelProps) {
  const { translations, isLoading: translationsLoading } = useI18n();

  const debouncedMiscMods = {} as Record<SavingThrowType, [number, (val: number) => void]>;

  SAVE_TYPES.forEach(saveType => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    debouncedMiscMods[saveType] = useDebouncedFormField(
      character.savingThrows[saveType].miscMod || 0,
      (value) => onSavingThrowMiscModChange(saveType, value),
      DEBOUNCE_DELAY
    );
  });


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
  
  const calculatedBaseSaves = getBaseSaves(character.classes, DND_CLASSES);
  
  const dataRows: Array<{
    label: string; 
    getValue: (
        saveDataFromProp: SingleSavingThrow, // Use prop for display of non-editable parts
        localMiscModValue: number,       // Use local state for spinner value
        baseSave: number, 
        abilityMod: number, 
        totalCalculatedFromProp: number,  // Total calculated using prop's miscMod
        saveType?: SavingThrowType, 
        setLocalMiscMod?: (val: number) => void
    ) => React.ReactNode;
    rowKey: string;
  }> = [
    {
      label: UI_STRINGS.savingThrowsRowLabelTotal || "Total",
      getValue: (saveDataProp, localMiscMod, baseSave, abilityMod, totalFromProp) => (
        <span className={cn("text-lg font-bold", totalFromProp >= 0 ? "text-accent" : "text-destructive")}>
          {totalFromProp >= 0 ? '+' : ''}{totalFromProp}
        </span>
      ),
      rowKey: 'total',
    },
    {
      label: UI_STRINGS.savingThrowsRowLabelBase || "Base",
      getValue: (saveDataProp, localMiscMod, baseSave) => baseSave,
      rowKey: 'base',
    },
    {
      label: UI_STRINGS.savingThrowsRowLabelAbilityModifier || "Ability Modifier",
      getValue: (saveDataProp, localMiscMod, baseSave, abilityMod, totalFromProp, saveType?: SavingThrowType) => {
        if (!saveType) return renderModifierValue(abilityMod);
        const abilityKey = SAVING_THROW_ABILITIES[saveType];
        const abilityLabelInfo = ABILITY_LABELS.find(al => al.value === abilityKey);
        const abilityAbbr = abilityLabelInfo?.abbr || abilityKey.substring(0,3).toUpperCase();
        return (
          <span className="inline-flex items-baseline">
            {renderModifierValue(abilityMod)}
            <span className="ml-1 text-xs text-muted-foreground">({abilityAbbr})</span>
          </span>
        );
      },
      rowKey: 'abilityMod',
    },
     {
      label: UI_STRINGS.savingThrowsRowLabelMagicModifier || "Magic Modifier",
      getValue: (saveDataProp) => renderModifierValue(saveDataProp.magicMod), // Display from prop
      rowKey: 'magicMod',
    },
    {
      label: UI_STRINGS.savingThrowsRowLabelMiscModifier || "Misc Modifier",
      getValue: (saveDataProp) => renderModifierValue(saveDataProp.miscMod), // Display from prop
      rowKey: 'miscModDisplay',
    },
    {
      label: UI_STRINGS.savingThrowsRowLabelTemporaryModifier || "Temp. Modifier",
      getValue: (saveDataProp, localMiscMod, baseSave, abilityMod, totalFromProp, saveType?: SavingThrowType, setLocalMiscMod?: (val: number) => void) => (
        <div className="flex justify-center">
          <NumberSpinnerInput
            value={localMiscMod} // Input uses local (immediately updated) value
            onChange={(newValue) => setLocalMiscMod && setLocalMiscMod(newValue)}
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
                  <tr key={dataRow.rowKey} className="border-b last:border-b-0 transition-colors">
                    <td className="py-3 px-1 text-left text-sm font-medium text-muted-foreground align-middle whitespace-normal md:whitespace-nowrap">
                      {dataRow.label}
                    </td>
                    {SAVE_TYPES.map((saveType) => {
                      const [localMiscMod, setLocalMiscMod] = debouncedMiscMods[saveType];
                      const currentSaveDataFromProp = character.savingThrows[saveType];
                      const baseSaveValue = calculatedBaseSaves[saveType];
                      const abilityKey = SAVING_THROW_ABILITIES[saveType];
                      const abilityModifier = getAbilityModifierByName(abilityScores, abilityKey);
                      
                      // Total calculated using the prop's miscMod for display consistency after debounce
                      const totalSaveCalculatedFromProp = baseSaveValue + abilityModifier + currentSaveDataFromProp.miscMod + (currentSaveDataFromProp.magicMod || 0);
                      
                      return (
                        <td key={`${saveType}-${dataRow.rowKey}`} className="py-3 px-1 text-center text-sm text-foreground align-middle">
                          {dataRow.getValue(currentSaveDataFromProp, localMiscMod, baseSaveValue, abilityModifier, totalSaveCalculatedFromProp, saveType, setLocalMiscMod)}
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
