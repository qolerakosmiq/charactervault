
'use client';

import *as React from 'react';
import type { AbilityScores, CharacterClass, SavingThrows, SavingThrowType, SingleSavingThrow, Character, AbilityName, InfoDialogContentType, AggregatedFeatEffects } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAbilityModifierByName, getBaseSaves, SAVING_THROW_ABILITIES } from '@/lib/dnd-utils';
import { Zap, Loader2, Info } from 'lucide-react'; // Added Info
import { cn } from '@/lib/utils';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { renderModifierValue } from '@/components/info-dialog-content/dialog-utils';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';

const DEBOUNCE_DELAY = 400;

interface SavingThrowsPanelProps {
  savingThrowsData: Pick<Character, 'savingThrows' | 'classes'>;
  abilityScores: AbilityScores;
  aggregatedFeatEffects: AggregatedFeatEffects | null; // Added
  onSavingThrowMiscModChange: (saveType: SavingThrowType, value: number) => void;
  onOpenInfoDialog: (contentType: InfoDialogContentType) => void;
}

const SAVE_TYPES: SavingThrowType[] = ['fortitude', 'reflex', 'will'];

export const SavingThrowsPanel = ({
  savingThrowsData,
  abilityScores,
  aggregatedFeatEffects, // Added
  onSavingThrowMiscModChange,
  onOpenInfoDialog,
}: SavingThrowsPanelProps) => {
  const { translations, isLoading: translationsLoading } = useI18n();

  const debouncedMiscMods = {} as Record<SavingThrowType, [number, (val: number) => void]>;

  SAVE_TYPES.forEach(saveType => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    debouncedMiscMods[saveType] = useDebouncedFormField(
      savingThrowsData.savingThrows[saveType].miscMod || 0,
      (value) => onSavingThrowMiscModChange(saveType, value),
      DEBOUNCE_DELAY
    );
  });

  const calculateFeatBonusForSave = React.useCallback((saveType: SavingThrowType): number => {
    if (!aggregatedFeatEffects?.savingThrowBonuses) return 0;
    return aggregatedFeatEffects.savingThrowBonuses.reduce((acc, effect) => {
      if (effect.save === saveType || effect.save === 'all') {
        // Assuming effect.value is numeric for direct summation.
        // Conditional effects are listed in breakdown, but for panel total, we sum potential.
        // A more advanced system might check active conditions here if available.
        if (typeof effect.value === 'number') {
          return acc + effect.value;
        }
      }
      return acc;
    }, 0);
  }, [aggregatedFeatEffects]);


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

  const calculatedBaseSaves = getBaseSaves(savingThrowsData.classes, DND_CLASSES);

  const dataRows: Array<{
    labelKey: keyof typeof UI_STRINGS;
    getValue: (
        saveDataFromProp: SingleSavingThrow,
        localMiscModValue: number,
        baseSave: number,
        abilityMod: number,
        featBonus: number, // Added featBonus
        totalCalculatedFromProp: number,
        saveType?: SavingThrowType,
        setLocalMiscMod?: (val: number) => void
    ) => React.ReactNode;
    rowKey: string;
  }> = [
    {
      labelKey: "savingThrowsRowLabelTotal",
      getValue: (saveDataProp, localMiscMod, baseSave, abilityMod, featBonus, totalFromProp, saveType) => (
        <div className="flex items-center justify-center">
            <span className={cn("text-lg font-bold", totalFromProp >= 0 ? "text-accent" : "text-destructive")}>
              {totalFromProp >= 0 ? '+' : ''}{totalFromProp}
            </span>
            {saveType && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground"
                onClick={() => onOpenInfoDialog({ type: 'savingThrowBreakdown', saveType: saveType })}
              >
                <Info className="h-4 w-4" />
              </Button>
            )}
        </div>
      ),
      rowKey: 'total',
    },
    {
      labelKey: "savingThrowsRowLabelBase",
      getValue: (saveDataProp, localMiscMod, baseSave) => baseSave,
      rowKey: 'base',
    },
    {
      labelKey: "savingThrowsRowLabelAbilityModifier",
      getValue: (saveDataProp, localMiscMod, baseSave, abilityMod, featBonus, totalFromProp, saveType?: SavingThrowType) => {
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
      labelKey: "savingThrowsRowLabelMagicModifier",
      getValue: (saveDataProp) => renderModifierValue(saveDataProp.magicMod),
      rowKey: 'magicMod',
    },
    // This row is for display only if feats contribute; input is separate
    {
      labelKey: "savingThrowsFeatContributionsLabel", // New label for Feat Contributions
      getValue: (saveDataProp, localMiscMod, baseSave, abilityMod, featBonus) => renderModifierValue(featBonus),
      rowKey: 'featBonusDisplay',
    },
    {
      labelKey: "savingThrowsRowLabelTemporaryModifier",
      getValue: (saveDataProp, localMiscMod, baseSave, abilityMod, featBonus, totalFromProp, saveType?: SavingThrowType, setLocalMiscMod?: (val: number) => void) => (
        <div className="flex justify-center">
          <NumberSpinnerInput
            value={localMiscMod}
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
                const rowLabel = UI_STRINGS[dataRow.labelKey] || dataRow.labelKey.replace('savingThrowsRowLabel', '');
                // Skip rendering feat bonus display row if no feats contribute at all to any save for cleaner UI
                if (dataRow.rowKey === 'featBonusDisplay' && !SAVE_TYPES.some(st => calculateFeatBonusForSave(st) !== 0)) {
                    return null;
                }
                return (
                  <tr key={dataRow.rowKey} className="border-b last:border-b-0 transition-colors">
                    <td className="py-3 px-1 text-left text-sm font-medium text-muted-foreground align-middle whitespace-normal md:whitespace-nowrap">
                      {rowLabel}
                    </td>
                    {SAVE_TYPES.map((saveType) => {
                      const [localMiscMod, setLocalMiscMod] = debouncedMiscMods[saveType];
                      const currentSaveDataFromProp = savingThrowsData.savingThrows[saveType];
                      const baseSaveValue = calculatedBaseSaves[saveType];
                      const abilityKey = SAVING_THROW_ABILITIES[saveType];
                      const abilityModifier = getAbilityModifierByName(abilityScores, abilityKey);
                      const featBonusForThisSave = calculateFeatBonusForSave(saveType);

                      const totalSaveCalculatedFromProp = baseSaveValue + abilityModifier + currentSaveDataFromProp.miscMod + (currentSaveDataFromProp.magicMod || 0) + featBonusForThisSave;

                      return (
                        <td key={`${saveType}-${dataRow.rowKey}`} className="py-3 px-1 text-center text-sm text-foreground align-middle">
                          {dataRow.getValue(currentSaveDataFromProp, localMiscMod, baseSaveValue, abilityModifier, featBonusForThisSave, totalSaveCalculatedFromProp, saveType, setLocalMiscMod)}
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
};

