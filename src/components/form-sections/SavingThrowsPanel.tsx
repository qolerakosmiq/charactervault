
'use client';

import *as React from 'react';
import type { AbilityScores, SavingThrows, SavingThrowType, SingleSavingThrow, Character, AbilityName, InfoDialogContentType, AggregatedFeatEffects, GenericBreakdownItem } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAbilityModifierByName, getBaseSaves, SAVING_THROW_ABILITIES } from '@/lib/dnd-utils';
import { Zap, Loader2, Info, Dices, Lock, Unlock } from 'lucide-react';
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
  const [isLocked, setIsLocked] = React.useState(false);
  const toggleLock = () => setIsLocked(prev => !prev);

  const debouncedTemporaryMods = {} as Record<SavingThrowType, [number, (val: number) => void]>;

  SAVE_TYPES.forEach(saveType => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    debouncedTemporaryMods[saveType] = useDebouncedFormField(
      savingThrowsData.savingThrows[saveType].miscMod || 0,
      React.useCallback((value) => onSavingThrowTemporaryModChange(saveType, value), [onSavingThrowTemporaryModChange, saveType]),
      DEBOUNCE_DELAY
    );
  });

  const calculateCalculatedTotalMiscBonusForSave = React.useCallback((saveType: SavingThrowType): number => {
    if (!aggregatedFeatEffects) return 0;
    let totalMiscBonus = savingThrowsData.savingThrows[saveType].magicMod || 0;
    
    if (aggregatedFeatEffects.savingThrowBonuses) {
      aggregatedFeatEffects.savingThrowBonuses.forEach(effect => {
        if (effect.isActive && (effect.save === saveType || effect.save === 'all')) {
          if (typeof effect.value === 'number') {
            totalMiscBonus += effect.value;
          }
        }
      });
    }
    return totalMiscBonus;
  }, [aggregatedFeatEffects, savingThrowsData.savingThrows]);


  const handleOpenSavingThrowRollDialog = React.useCallback((saveType: SavingThrowType) => {
    if (!translations || !abilityScores || !aggregatedFeatEffects) return;
    const { DND_CLASSES, SAVING_THROW_LABELS, ABILITY_LABELS, UI_STRINGS } = translations;
    
    const calculatedBaseSaves = getBaseSaves(savingThrowsData.classes, DND_CLASSES);
    const baseSaveValue = calculatedBaseSaves[saveType];
    const abilityKey = SAVING_THROW_ABILITIES[saveType];
    const abilityModifier = getAbilityModifierByName(abilityScores, abilityKey);
    const calculatedTotalMiscBonus = calculateCalculatedTotalMiscBonusForSave(saveType);
    const [localTemporaryMod] = debouncedTemporaryMods[saveType];
    
    const totalSaveModifier = baseSaveValue + abilityModifier + calculatedTotalMiscBonus + localTemporaryMod;
    const saveTypeLabel = SAVING_THROW_LABELS.find(stl => stl.id === saveType)?.label || saveType;
    const abilityLabelInfo = ABILITY_LABELS.find(al => al.id === abilityKey);

    const breakdown: GenericBreakdownItem[] = [
      { label: UI_STRINGS.savingThrowsRowLabelBase || "Base", value: baseSaveValue, isRawValue: true },
      { label: `${UI_STRINGS.savingThrowsRowLabelAbilityModifier || "Ability Modifier"} (${abilityLabelInfo?.abbr || abilityKey.toUpperCase()})`, value: abilityModifier },
    ];
    if (calculatedTotalMiscBonus !== 0) {
      breakdown.push({ label: UI_STRINGS.savingThrowsRowLabelMiscModifier || "Misc Modifier", value: calculatedTotalMiscBonus });
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
  }, [translations, abilityScores, savingThrowsData, aggregatedFeatEffects, onOpenRollDialog, calculateCalculatedTotalMiscBonusForSave, debouncedTemporaryMods, rerollTwentiesForChecks]);


  if (translationsLoading || !translations || !aggregatedFeatEffects) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <Zap className="h-8 w-8 text-primary" />
              <Skeleton className="h-7 w-1/2" />
            </div>
            <Skeleton className="h-8 w-8" />
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
        localTemporaryModValue: number,
        baseSave: number,
        abilityMod: number,
        calculatedTotalMiscBonusValue: number, 
        totalCalculatedValue: number,
        saveType?: SavingThrowType,
        setLocalTemporaryMod?: (val: number) => void
    ) => React.ReactNode;
    rowKey: string;
  }> = [
    {
      labelKey: "savingThrowsRowLabelTotal",
      getValue: (localTemporaryMod, baseSave, abilityMod, calculatedTotalMiscBonus, totalCalculated, saveType) => (
        <div className="flex items-center justify-center">
            <span className={cn("text-lg font-bold", totalCalculated >= 0 ? "text-accent" : "text-destructive")}>
              {totalCalculated >= 0 ? '+' : ''}{totalCalculated}
            </span>
            {saveType && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground"
                  onClick={() => onOpenInfoDialog({ type: 'savingThrowBreakdown', saveType: saveType })}
                  aria-label={(UI_STRINGS.infoDialogSavingThrowBreakdownAriaLabel || "Info for {saveTypeLabel} Save").replace("{saveTypeLabel}", SAVING_THROW_LABELS.find(stl => stl.id === saveType)?.label || saveType)}
                >
                  <Info className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-primary"
                  onClick={() => handleOpenSavingThrowRollDialog(saveType)}
                  aria-label={(UI_STRINGS.rollDialogSavingThrowAriaLabel || "Roll {saveTypeLabel} Save").replace("{saveTypeLabel}", SAVING_THROW_LABELS.find(stl => stl.id === saveType)?.label || saveType)}
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
      getValue: (localTemporaryMod, baseSave) => <span className="font-bold">{baseSave}</span>,
      rowKey: 'base',
    },
    {
      labelKey: "savingThrowsRowLabelAbilityModifier",
      getValue: (localTemporaryMod, baseSave, abilityMod, calculatedTotalMiscBonus, totalCalculated, saveType?: SavingThrowType) => {
        if (!saveType) return renderModifierValue(abilityMod);
        const abilityKey = SAVING_THROW_ABILITIES[saveType];
        const abilityLabelInfo = ABILITY_LABELS.find(al => al.id === abilityKey);
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
      labelKey: "savingThrowsRowLabelMiscModifier",
      getValue: (localTemporaryMod, baseSave, abilityMod, calculatedTotalMiscBonus) => renderModifierValue(calculatedTotalMiscBonus),
      rowKey: 'miscModDisplay',
    },
    {
      labelKey: "savingThrowsRowLabelTemporaryModifier",
      getValue: (localTemporaryMod, baseSave, abilityMod, calculatedTotalMiscBonus, totalCalculated, saveType?: SavingThrowType, setLocalTemporaryMod?: (val: number) => void) => (
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
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <Zap className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-serif">{UI_STRINGS.savingThrowsPanelTitle || "Saving Throws"}</CardTitle>
          </div>
          <Button
            variant={isLocked ? "ghost" : "secondary"}
            size="icon"
            className="text-muted-foreground hover:text-foreground shrink-0"
            onClick={toggleLock}
            aria-pressed={!isLocked}
            aria-label={isLocked ? UI_STRINGS.lockButtonAriaLabelLocked : UI_STRINGS.lockButtonAriaLabelUnlocked}
          >
            {isLocked ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-muted scrollbar-thumb-rounded-md scrollbar-track-rounded-md">
          <table className="w-full min-w-[400px]">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-1 text-left text-sm font-medium text-muted-foreground w-[100px]"></th>
                {SAVE_TYPES.map((saveType) => (
                  <th key={saveType} className="py-2 px-1 text-center text-sm font-medium text-foreground capitalize">
                    {SAVING_THROW_LABELS.find(stl => stl.id === saveType)?.label || saveType}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((dataRow) => {
                const rowLabel = UI_STRINGS[dataRow.labelKey] || dataRow.labelKey.replace('savingThrowsRowLabel', '');
                return (
                  <tr key={dataRow.rowKey} className="border-b last:border-b-0 transition-colors hover:bg-muted/10">
                    <td className="py-3 px-1 text-left text-sm font-medium text-muted-foreground align-middle whitespace-nowrap">
                      {rowLabel}
                    </td>
                    {SAVE_TYPES.map((saveType) => {
                      const [localTemporaryMod, setLocalTemporaryMod] = debouncedTemporaryMods[saveType];
                      const baseSaveValue = calculatedBaseSaves[saveType];
                      const abilityKey = SAVING_THROW_ABILITIES[saveType];
                      const abilityModifier = getAbilityModifierByName(abilityScores, abilityKey);
                      const calculatedTotalMiscBonusForSave = calculateCalculatedTotalMiscBonusForSave(saveType);
                      const totalSaveCalculatedValue = baseSaveValue + abilityModifier + calculatedTotalMiscBonusForSave + localTemporaryMod;

                      return (
                        <td key={`${saveType}-${dataRow.rowKey}`} className="py-3 px-1 text-center text-sm text-foreground align-middle">
                          {dataRow.getValue(localTemporaryMod, baseSaveValue, abilityModifier, calculatedTotalMiscBonusForSave, totalSaveCalculatedValue, saveType, setLocalTemporaryMod)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground pt-2">
          <span dangerouslySetInnerHTML={{ __html: UI_STRINGS.savingThrowsPanelMiscModInfoNote_prefix }} />
          <Badge variant="outline">{UI_STRINGS.savingThrowsRowLabelMiscModifier || "Misc Modifier"}</Badge>
          <span dangerouslySetInnerHTML={{ __html: UI_STRINGS.savingThrowsPanelMiscModInfoNote_suffix }}/>
        </p>
      </CardContent>
    </Card>
  );
};

SavingThrowsPanelComponent.displayName = 'SavingThrowsPanelComponent';
export const SavingThrowsPanel = React.memo(SavingThrowsPanelComponent);

    
