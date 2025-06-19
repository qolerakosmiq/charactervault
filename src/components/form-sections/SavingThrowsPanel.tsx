
'use client';

import * as React from 'react';
import type { AbilityScores, SavingThrows, SavingThrowType, Character, AbilityName, InfoDialogContentType, AggregatedFeatEffects, GenericBreakdownItem } from '@/types/character';
import { getAbilityModifierByName, getBaseSaves, SAVING_THROW_ABILITIES } from '@/lib/dnd-utils';
import { Zap, Loader2, Info, Dices, Lock, Unlock, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // CardTitle might not be used directly in the loop
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { renderModifierValue, sectionHeadingClass } from '@/components/info-dialog-content/dialog-utils';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { DualBadge } from '@/components/ui/DualBadge';
import { Badge } from '@/components/ui/badge';
import type { RollDialogProps } from '@/components/RollDialog';
import { useDefinitionsStore } from '@/lib/definitions-store';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
          } else if (effect.value === 'CHA' && abilityScores) {
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

  return (
    <LockablePanelWrapper
      title={UI_STRINGS.savingThrowsPanelTitle || "Saving Throws"}
      icon={Zap}
      initialLockedState={false}
      cardContentClassName="pt-4"
    >
      {({ isLocked: panelIsLocked }) => (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SAVE_TYPES.map((saveType) => {
              const [localTemporaryMod, setLocalTemporaryMod] = debouncedTemporaryMods[saveType];
              const baseSaveValue = calculatedBaseSaves[saveType];
              const abilityKey = SAVING_THROW_ABILITIES[saveType];
              const abilityModifier = getAbilityModifierByName(abilityScores, abilityKey);
              const calculatedTotalMiscBonusForSaveVal = calculateCalculatedTotalMiscBonusForSave(saveType);
              const totalCalculatedValue = baseSaveValue + abilityModifier + calculatedTotalMiscBonusForSaveVal + localTemporaryMod;
              const saveTypeLabel = SAVING_THROW_LABELS.find(stl => stl.id === saveType)?.label || saveType;
              const abilityLabelInfo = ABILITY_LABELS.find(al => al.id === abilityKey);
              const abilityAbbr = abilityLabelInfo?.abbr || abilityKey.substring(0,3).toUpperCase();

              let valueBorderColorClass = "border-border";
              let valueBgClass = "bg-muted";
              let valueTextClass = "text-muted-foreground";

              if (abilityModifier > 0) {
                valueBorderColorClass = "border-emerald-600";
                valueBgClass = "bg-emerald-600";
                valueTextClass = "text-emerald-50";
              } else if (abilityModifier < 0) {
                valueBorderColorClass = "border-destructive";
                valueBgClass = "bg-destructive";
                valueTextClass = "text-destructive-foreground";
              }

              return (
                <Card key={saveType} className="shadow-sm">
                  <CardHeader className="p-4 flex flex-col items-center space-y-1 text-center">
                    <span className="text-lg font-semibold">{saveTypeLabel}</span>
                    <div className="flex items-center justify-center space-x-1">
                        <p className={cn("text-3xl font-bold", totalCalculatedValue >= 0 ? "text-accent" : "text-destructive")}>
                            {totalCalculatedValue >= 0 ? '+' : ''}{totalCalculatedValue}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={() => onOpenInfoDialog({ type: 'savingThrowBreakdown', saveType: saveType })}
                          aria-label={(UI_STRINGS.infoDialogSavingThrowBreakdownAriaLabel || "Info for {saveTypeLabel} Save").replace("{saveTypeLabel}", saveTypeLabel)}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-primary"
                          onClick={() => handleOpenSavingThrowRollDialog(saveType)}
                          aria-label={(UI_STRINGS.rollDialogSavingThrowAriaLabel || "Roll {saveTypeLabel} Save").replace("{saveTypeLabel}", saveTypeLabel)}
                        >
                          <Dices className="h-4 w-4" />
                        </Button>
                    </div>
                  </CardHeader>
                  {!panelIsLocked && (
                    <CardContent className="p-4 pt-0 space-y-3">
                      <div className="space-y-1 text-center">
                        <Label className="text-xs text-muted-foreground">{UI_STRINGS.savingThrowsRowLabelBase || "Base"}</Label>
                        <p className="font-semibold text-md">{baseSaveValue}</p>
                      </div>
                      <div className="space-y-1 text-center">
                        <Label className="text-xs text-muted-foreground">{UI_STRINGS.savingThrowsRowLabelAbilityModifier || "Ability Modifier"}</Label>
                        <div className="mt-1 flex justify-center">
                            <DualBadge
                                leftLabel={abilityAbbr}
                                rightLabel={renderModifierValue(abilityModifier)}
                                leftClassName={cn("border-2 rounded-l-full border-r-0 !px-1.5 !py-0.5 !h-auto", valueBgClass, valueTextClass, valueBorderColorClass)}
                                rightClassName={cn("bg-transparent text-foreground border-2 rounded-r-full -ml-[2px] !px-1.5 !py-0.5 !h-auto", valueBorderColorClass)}
                            />
                        </div>
                      </div>
                      <div className="space-y-1 text-center">
                        <Label className="text-xs text-muted-foreground inline-flex items-center">
                          {UI_STRINGS.savingThrowsRowLabelMiscModifier || "Misc Modifier"}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3 w-3 ml-1 text-muted-foreground/70 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="text-xs">
                                  <span dangerouslySetInnerHTML={{ __html: UI_STRINGS.savingThrowsPanelMiscModInfoNote_prefix }} />
                                  <Badge variant="outline" className="text-xs">{UI_STRINGS.savingThrowsRowLabelMiscModifier || "Misc Modifier"}</Badge>
                                  <span dangerouslySetInnerHTML={{ __html: UI_STRINGS.savingThrowsPanelMiscModInfoNote_suffix }}/>
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Label>
                        <p className="font-semibold text-md">{renderModifierValue(calculatedTotalMiscBonusForSaveVal)}</p>
                      </div>
                      <div className="space-y-1 text-center">
                        <Label htmlFor={`temp-mod-${saveType}`} className="text-xs text-muted-foreground">
                            {UI_STRINGS.savingThrowsRowLabelTemporaryModifier || "Temporary Modifier"}
                        </Label>
                        <div className="mt-1 w-full">
                          <NumberSpinnerInput
                            id={`temp-mod-${saveType}`}
                            value={localTemporaryMod}
                            onChange={setLocalTemporaryMod}
                            min={-20}
                            max={20}
                            inputClassName="w-full h-8 text-sm text-center"
                            buttonSize="sm"
                            buttonClassName="h-8 w-8"
                            className="w-full justify-between"
                            disabled={panelIsLocked}
                          />
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
          {!panelIsLocked && (
            <p className="text-xs text-muted-foreground pt-3 text-center border-t border-border/30 mt-4">
              <span dangerouslySetInnerHTML={{ __html: UI_STRINGS.savingThrowsPanelMiscModInfoNote_prefix }} />
              <Badge variant="outline" className="text-xs">{UI_STRINGS.savingThrowsRowLabelMiscModifier || "Misc Modifier"}</Badge>
              <span dangerouslySetInnerHTML={{ __html: UI_STRINGS.savingThrowsPanelMiscModInfoNote_suffix }} />
            </p>
          )}
        </>
      )}
    </LockablePanelWrapper>
  );
};

SavingThrowsPanelComponent.displayName = 'SavingThrowsPanelComponent';
export const SavingThrowsPanel = React.memo(SavingThrowsPanelComponent);
    
