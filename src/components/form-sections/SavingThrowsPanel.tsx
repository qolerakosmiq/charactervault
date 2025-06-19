
'use client';

import *as React from 'react';
import type { AbilityScores, SavingThrows, SavingThrowType, SingleSavingThrow, Character, AbilityName, InfoDialogContentType, AggregatedFeatEffects, GenericBreakdownItem } from '@/types/character';
import { getAbilityModifierByName, getBaseSaves, SAVING_THROW_ABILITIES } from '@/lib/dnd-utils';
import { Zap, Loader2, Info, Dices } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { renderModifierValue, sectionHeadingClass } from '@/components/info-dialog-content/dialog-utils';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { DualBadge } from '@/components/ui/DualBadge'; 
import { Badge } from '@/components/ui/badge'; // Ensured Badge is imported
import type { RollDialogProps } from '@/components/RollDialog';
import { useDefinitionsStore } from '@/lib/definitions-store'; 
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper';

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

  const calculateCalculatedTotalMiscBonusForSave = React.useCallback((saveType: SavingThrowType): number => {
    if (!aggregatedFeatEffects) return 0;
    let totalMiscBonus = savingThrowsData.savingThrows[saveType].magicMod || 0;
    
    if (aggregatedFeatEffects.savingThrowBonuses) {
      aggregatedFeatEffects.savingThrowBonuses.forEach(effect => {
        if (effect.isActive && (effect.save === saveType || effect.save === 'all')) {
          if (typeof effect.value === 'number') {
            totalMiscBonus += effect.value;
          } else if (effect.value === 'CHA' && abilityScores) { // Paladin Divine Grace
             totalMiscBonus += getAbilityModifierByName(abilityScores, 'charisma');
          }
        }
      });
    }
    return totalMiscBonus;
  }, [aggregatedFeatEffects, savingThrowsData.savingThrows, abilityScores]);


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
      weaponDamageDiceString: "", 
      weaponCriticalMultiplier: 1, 
    });
  }, [translations, abilityScores, savingThrowsData, aggregatedFeatEffects, onOpenRollDialog, calculateCalculatedTotalMiscBonusForSave, debouncedTemporaryMods, rerollTwentiesForChecks]);


  if (translationsLoading || !translations || !aggregatedFeatEffects) {
    return (
      <LockablePanelWrapper
        title={translations?.UI_STRINGS.savingThrowsPanelTitle || "Saving Throws"}
        icon={Zap}
        initialLockedState={false}
        cardContentClassName="pt-4"
      >
        {() => (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">
              {translations?.UI_STRINGS.savingThrowsPanelLoading || "Loading saving throw details..."}
            </p>
          </div>
        )}
      </LockablePanelWrapper>
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
        setLocalTemporaryMod?: (val: number) => void,
        panelIsLocked?: boolean
    ) => React.ReactNode;
    rowKey: string;
  }> = [
    {
      labelKey: "savingThrowsRowLabelTotal",
      getValue: (localTemporaryMod, baseSave, abilityMod, calculatedTotalMiscBonus, totalCalculated, saveType, setLocalTemporaryMod, panelIsLocked) => (
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
                  disabled={panelIsLocked && (dataRow.rowKey !== 'total')}
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
                  disabled={panelIsLocked && (dataRow.rowKey !== 'total')}
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
      getValue: (localTemporaryMod, baseSave, abilityMod, calculatedTotalMiscBonus, totalCalculated, saveType?: SavingThrowType, setLocalTemporaryMod?: (val: number) => void, panelIsLocked?: boolean) => {
        if (!saveType) return renderModifierValue(abilityMod); 
        const abilityKey = SAVING_THROW_ABILITIES[saveType];
        const abilityLabelInfo = ABILITY_LABELS.find(al => al.id === abilityKey);
        const abilityAbbr = abilityLabelInfo?.abbr || abilityKey.substring(0,3).toUpperCase();
        
        let leftBorderColorClass = "border-border"; // Border for the value (left)
        let rightBgClass = "bg-muted";      // Background for the abbreviation (right)
        let rightTextClass = "text-muted-foreground"; // Text for the abbreviation (right)
        let rightBorderColorClass = "border-border"; // Border for the abbreviation (right)

        if (abilityMod > 0) {
          leftBorderColorClass = "border-emerald-600";
          rightBgClass = "bg-emerald-600";
          rightTextClass = "text-emerald-50";
          rightBorderColorClass = "border-emerald-600";
        } else if (abilityMod < 0) {
          leftBorderColorClass = "border-destructive";
          rightBgClass = "bg-destructive";
          rightTextClass = "text-destructive-foreground";
          rightBorderColorClass = "border-destructive";
        }
        
        return (
          <DualBadge
            leftLabel={abilityAbbr} // Abbreviation on left with solid background
            rightLabel={renderModifierValue(abilityMod)} // Value on right with colored border
            leftClassName={cn(
              "border-2 rounded-l-full !px-2 !py-0.5 !h-auto",
              rightBgClass, rightTextClass, rightBorderColorClass 
            )}
            rightClassName={cn(
              "bg-transparent text-foreground border-2 rounded-r-full -ml-[2px] !px-2 !py-0.5 !h-auto",
              leftBorderColorClass 
            )}
            className="text-sm"
          />
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
      getValue: (localTemporaryMod, baseSave, abilityMod, calculatedTotalMiscBonus, totalCalculated, saveType?: SavingThrowType, setLocalTemporaryMod?: (val: number) => void, panelIsLocked?: boolean) => (
        <div className="flex justify-center">
          <NumberSpinnerInput
            value={localTemporaryMod}
            onChange={(newValue) => setLocalTemporaryMod && setLocalTemporaryMod(newValue)}
            min={-20}
            max={20}
            inputClassName="w-16 h-8 text-sm"
            buttonSize="icon"
            buttonClassName="h-8 w-8"
            disabled={panelIsLocked}
          />
        </div>
      ),
      rowKey: 'temporaryModInput',
    },
  ];


  return (
    <LockablePanelWrapper
      title={UI_STRINGS.savingThrowsPanelTitle || "Saving Throws"}
      icon={Zap}
      initialLockedState={false}
      cardContentClassName="space-y-2"
    >
      {({ isLocked: panelIsLocked }) => (
        <>
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
                  if (panelIsLocked && dataRow.rowKey !== 'total') {
                    return null; 
                  }
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
                            {dataRow.getValue(localTemporaryMod, baseSaveValue, abilityModifier, calculatedTotalMiscBonusForSave, totalSaveCalculatedValue, saveType, setLocalTemporaryMod, panelIsLocked)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!panelIsLocked && (
            <p className="text-sm text-muted-foreground pt-2">
              <span dangerouslySetInnerHTML={{ __html: UI_STRINGS.savingThrowsPanelMiscModInfoNote_prefix }} />
              <Badge variant="outline">{UI_STRINGS.savingThrowsRowLabelMiscModifier || "Misc Modifier"}</Badge>
              <span dangerouslySetInnerHTML={{ __html: UI_STRINGS.savingThrowsPanelMiscModInfoNote_suffix }}/>
            </p>
          )}
        </>
      )}
    </LockablePanelWrapper>
  );
};

SavingThrowsPanelComponent.displayName = 'SavingThrowsPanelComponent';
export const SavingThrowsPanel = React.memo(SavingThrowsPanelComponent);

    
