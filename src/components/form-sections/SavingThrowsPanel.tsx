
'use client';

import *as React from 'react';
import type { AbilityScores, SavingThrows, SavingThrowType, SingleSavingThrow, Character, AbilityName, InfoDialogContentType, AggregatedFeatEffects, GenericBreakdownItem } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAbilityModifierByName, getBaseSaves, SAVING_THROW_ABILITIES } from '@/lib/dnd-utils';
import { Zap, Loader2, Info, Dices } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { renderModifierValue } from '@/components/info-dialog-content/dialog-utils';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { Badge } from '@/components/ui/badge';
import type { RollDialogProps } from '@/components/RollDialog';
import { useDefinitionsStore } from '@/lib/definitions-store'; 

const DEBOUNCE_DELAY = 400;

export interface SavingThrowsPanelProps {
  savingThrowsData: Pick<Character, 'savingThrows' | 'classes' | 'feats'>;
  abilityScores: AbilityScores;
  aggregatedFeatEffects: AggregatedFeatEffects | null;
  onSavingThrowTemporaryModChange: (saveType: SavingThrowType, value: number) => void;
  onOpenInfoDialog: (contentType: InfoDialogContentType) => void;
  onOpenRollDialog: (data: Omit<RollDialogProps, 'isOpen' | 'onOpenChange' | 'onRoll'>) => void;
}

const SAVE_TYPES: SavingThrowType[] = ['fortitude', 'reflex', 'will'];

const SavingThrowsPanelComponent = ({
  savingThrowsData,
  abilityScores,
  aggregatedFeatEffects,
  onSavingThrowTemporaryModChange,
  onOpenInfoDialog,
  onOpenRollDialog,
}: SavingThrowsPanelProps) => {
  const { translations, isLoading: translationsLoading } = useI18n();
  const { rerollTwentiesForChecks } = useDefinitionsStore(state => ({ 
    rerollTwentiesForChecks: state.rerollTwentiesForChecks,
  }));

  const debouncedTemporaryMods = {} as Record<SavingThrowType, [number, (val: number) => void]>;

  SAVE_TYPES.forEach(saveType => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    debouncedTemporaryMods[saveType] = useDebouncedFormField(
      savingThrowsData.savingThrows[saveType].miscMod || 0,
      React.useCallback((value) => onSavingThrowTemporaryModChange(saveType, value), [onSavingThrowTemporaryModChange, saveType]),
      DEBOUNCE_DELAY
    );
  });

  const calculateCalculatedTotalFeatBonusForSave = React.useCallback((saveType: SavingThrowType): number => {
    if (!aggregatedFeatEffects?.savingThrowBonuses) return 0;
    let totalFeatBonus = 0;
    aggregatedFeatEffects.savingThrowBonuses.forEach(effect => {
      if (effect.isActive && (effect.save === saveType || effect.save === 'all')) {
        if (typeof effect.value === 'number') {
          totalFeatBonus += effect.value;
        }
      }
    });
    return totalFeatBonus;
  }, [aggregatedFeatEffects]);


  const handleOpenSavingThrowRollDialog = React.useCallback((saveType: SavingThrowType) => {
    if (!translations || !abilityScores) return;
    const { DND_CLASSES, SAVING_THROW_LABELS, ABILITY_LABELS, UI_STRINGS } = translations;
    const currentSaveDataFromProp = savingThrowsData.savingThrows[saveType];
    const calculatedBaseSaves = getBaseSaves(savingThrowsData.classes, DND_CLASSES);
    const baseSaveValue = calculatedBaseSaves[saveType];
    const abilityKey = SAVING_THROW_ABILITIES[saveType];
    const abilityModifier = getAbilityModifierByName(abilityScores, abilityKey);
    const calculatedFeatBonusForThisSave = calculateCalculatedTotalFeatBonusForSave(saveType);
    const [localTemporaryMod] = debouncedTemporaryMods[saveType];
    const magicModifier = currentSaveDataFromProp.magicMod || 0;

    const totalSaveModifier = baseSaveValue + abilityModifier + magicModifier + calculatedFeatBonusForThisSave + localTemporaryMod;
    const saveTypeLabel = SAVING_THROW_LABELS.find(stl => stl.value === saveType)?.label || saveType;
    const abilityLabelInfo = ABILITY_LABELS.find(al => al.value === abilityKey);

    const breakdown: GenericBreakdownItem[] = [
      { label: UI_STRINGS.savingThrowsRowLabelBase || "Base", value: baseSaveValue },
      { label: `${UI_STRINGS.savingThrowsRowLabelAbilityModifier || "Ability Modifier"} (${abilityLabelInfo?.abbr || abilityKey.toUpperCase()})`, value: abilityModifier },
    ];
    if (magicModifier !== 0) {
      breakdown.push({ label: UI_STRINGS.savingThrowsRowLabelMagicModifier || "Magic Modifier", value: magicModifier });
    }
    if (calculatedFeatBonusForThisSave !== 0) {
      breakdown.push({ label: UI_STRINGS.savingThrowsFeatsModifierLabel || "Feats Modifier", value: calculatedFeatBonusForThisSave });
    }
    if (localTemporaryMod !== 0) {
      breakdown.push({ label: UI_STRINGS.savingThrowsRowLabelTemporaryModifier || "Temporary Modifier", value: localTemporaryMod });
    }
    breakdown.push({ label: UI_STRINGS.infoDialogTotalLabel || "Total", value: totalSaveModifier, isBold: true });

    onOpenRollDialog({
      dialogTitle: (UI_STRINGS.rollDialogTitleSavingThrow || "{saveTypeLabel} Save").replace("{saveTypeLabel}", saveTypeLabel),
      rollType: `saving_throw_${saveType}`, 
      baseModifier: totalSaveModifier,
      calculationBreakdown: breakdown,
      rerollTwentiesForChecks: rerollTwentiesForChecks, 
    });
  }, [translations, abilityScores, savingThrowsData, aggregatedFeatEffects, onOpenRollDialog, calculateCalculatedTotalFeatBonusForSave, debouncedTemporaryMods, rerollTwentiesForChecks]);


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
        localTemporaryModValue: number,
        baseSave: number,
        abilityMod: number,
        calculatedTotalFeatBonus: number,
        totalCalculatedFromProp: number,
        saveType?: SavingThrowType,
        setLocalTemporaryMod?: (val: number) => void
    ) => React.ReactNode;
    rowKey: string;
  }> = [
    {
      labelKey: "savingThrowsRowLabelTotal",
      getValue: (saveDataProp, localTemporaryMod, baseSave, abilityMod, calculatedTotalFeatBonus, totalFromProp, saveType) => (
        <div className="flex items-center justify-center">
            <span className={cn("text-lg font-bold", totalFromProp >= 0 ? "text-accent" : "text-destructive")}>
              {totalFromProp >= 0 ? '+' : ''}{totalFromProp}
            </span>
            {saveType && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground"
                  onClick={() => onOpenInfoDialog({ type: 'savingThrowBreakdown', saveType: saveType })}
                >
                  <Info className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-primary"
                  onClick={() => handleOpenSavingThrowRollDialog(saveType)}
                  aria-label={(UI_STRINGS.rollDialogSavingThrowAriaLabel || "Roll {saveTypeLabel} Save").replace("{saveTypeLabel}", SAVING_THROW_LABELS.find(stl => stl.value === saveType)?.label || saveType)}
                >
                  <Dices className="h-4 w-4" />
                </Button>
              </>
            )}
        </div>
      ),
      rowKey: 'total',
    },
    {
      labelKey: "savingThrowsRowLabelBase",
      getValue: (saveDataProp, localTemporaryMod, baseSave) => baseSave,
      rowKey: 'base',
    },
    {
      labelKey: "savingThrowsRowLabelAbilityModifier",
      getValue: (saveDataProp, localTemporaryMod, baseSave, abilityMod, calculatedTotalFeatBonus, totalFromProp, saveType?: SavingThrowType) => {
        if (!saveType) return renderModifierValue(abilityMod);
        const abilityKey = SAVING_THROW_ABILITIES[saveType];
        const abilityLabelInfo = ABILITY_LABELS.find(al => al.value === abilityKey);
        const abilityAbbr = abilityLabelInfo?.abbr || abilityKey.substring(0,3).toUpperCase();
        return (
          <span className="inline-flex items-baseline">
            {renderModifierValue(abilityMod)}
            <Badge variant="outline" className="ml-1.5">{abilityAbbr}</Badge>
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
    {
      labelKey: "savingThrowsFeatsModifierLabel",
      getValue: (saveDataProp, localTemporaryMod, baseSave, abilityMod, calculatedTotalFeatBonus) => renderModifierValue(calculatedTotalFeatBonus),
      rowKey: 'calculatedTotalFeatBonusDisplay',
    },
    {
      labelKey: "savingThrowsRowLabelTemporaryModifier",
      getValue: (saveDataProp, localTemporaryMod, baseSave, abilityMod, calculatedTotalFeatBonus, totalFromProp, saveType?: SavingThrowType, setLocalTemporaryMod?: (val: number) => void) => (
        <div className="flex justify-center">
          <NumberSpinnerInput
            value={localTemporaryMod}
            onChange={(newValue) => setLocalTemporaryMod && setLocalTemporaryMod(newValue)}
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
                return (
                  <tr key={dataRow.rowKey} className="border-b last:border-b-0 transition-colors">
                    <td className="py-3 px-1 text-left text-sm font-medium text-muted-foreground align-middle whitespace-normal md:whitespace-nowrap">
                      {rowLabel}
                    </td>
                    {SAVE_TYPES.map((saveType) => {
                      const [localTemporaryMod, setLocalTemporaryMod] = debouncedTemporaryMods[saveType];
                      const currentSaveDataFromProp = savingThrowsData.savingThrows[saveType];
                      const baseSaveValue = calculatedBaseSaves[saveType];
                      const abilityKey = SAVING_THROW_ABILITIES[saveType];
                      const abilityModifier = getAbilityModifierByName(abilityScores, abilityKey);
                      const calculatedTotalFeatBonusForThisSave = calculateCalculatedTotalFeatBonusForSave(saveType);

                      const totalSaveCalculatedFromProp = baseSaveValue + abilityModifier + (currentSaveDataFromProp.magicMod || 0) + calculatedTotalFeatBonusForThisSave + localTemporaryMod;

                      return (
                        <td key={`${saveType}-${dataRow.rowKey}`} className="py-3 px-1 text-center text-sm text-foreground align-middle">
                          {dataRow.getValue(currentSaveDataFromProp, localTemporaryMod, baseSaveValue, abilityModifier, calculatedTotalFeatBonusForThisSave, totalSaveCalculatedFromProp, saveType, setLocalTemporaryMod)}
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

SavingThrowsPanelComponent.displayName = 'SavingThrowsPanelComponent';
export const SavingThrowsPanel = React.memo(SavingThrowsPanelComponent);
