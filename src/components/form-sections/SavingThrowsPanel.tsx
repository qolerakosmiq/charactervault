
'use client';

import *as React from 'react';
import type { AbilityScores, SavingThrows, SavingThrowType, Character, AbilityName, InfoDialogContentType, AggregatedFeatEffects, GenericBreakdownItem } from '@/types/character';
import { getAbilityModifierByName, getBaseSaves, SAVING_THROW_ABILITIES } from '@/lib/dnd-utils';
import { Zap, Info, Dices } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nProvider';
import { renderModifierValue, sectionHeadingClass } from '@/components/info-dialog-content/dialog-utils';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { DualBadge, type DualBadgeProps } from '@/components/ui/DualBadge';
import type { RollDialogProps } from '@/components/RollDialog';
import { useDefinitionsStore } from '@/lib/definitions-store';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper';
import { Input } from '@/components/ui/input';
import { DEBOUNCE_DELAY_FORM_INPUT, panelContentPadding, panelFieldHorizontalGap, panelFieldVerticalGap, panelGridGap, textStyleSubtle, textStyleValueBig } from '@/config/layout';
import { Badge } from '@/components/ui/badge';
import { parseAndRenderUIString } from '@/lib/utils';

export interface SavingThrowsPanelProps {
  savingThrowsData: Pick<Character, 'savingThrows' | 'classes' | 'feats'>;
  abilityScores: AbilityScores;
  aggregatedFeatEffects: AggregatedFeatEffects | null;
  onSavingThrowTemporaryModChange: (saveType: SavingThrowType, value: number) => void;
  onOpenInfoDialog: (contentType: InfoDialogContentType) => void;
  onOpenRollDialog: (data: Omit<RollDialogProps, 'isOpen' | 'onOpenChange' | 'onRoll'>) => void;
}

const SAVE_TYPES: SavingThrowType[] = ['fortitude', 'reflex', 'will'];

interface SavingThrowCardProps {
  saveType: SavingThrowType;
  saveTypeLabel: string;
  totalValue: number;
  baseValue: number;
  abilityModifier: number;
  abilityAbbr: string;
  miscBonus: number;
  tempModValue: number;
  onTempModChange: (saveType: SavingThrowType, value: number) => void;
  panelIsLocked: boolean;
  onOpenInfoDialog: (saveType: SavingThrowType) => void;
  onOpenRollDialog: (saveType: SavingThrowType) => void;
  uiStrings: Record<string, string>;
}

const SavingThrowCard = React.memo(({
  saveType,
  saveTypeLabel,
  totalValue,
  baseValue,
  abilityModifier,
  abilityAbbr,
  miscBonus,
  tempModValue,
  onTempModChange,
  panelIsLocked,
  onOpenInfoDialog,
  onOpenRollDialog,
  uiStrings,
}: SavingThrowCardProps) => {

  const handleDebouncedChange = React.useCallback((value: number) => {
    onTempModChange(saveType, value);
  }, [onTempModChange, saveType]);

  const [localTemporaryMod, setLocalTemporaryMod] = useDebouncedFormField(
    tempModValue, handleDebouncedChange, DEBOUNCE_DELAY_FORM_INPUT
  );

  let badgeColor: DualBadgeProps['color'] = 'default';
  if (abilityModifier > 0) badgeColor = 'emerald';
  else if (abilityModifier < 0) badgeColor = 'destructive';

  return (
    <div className={cn("flex flex-col border rounded-md bg-card", panelContentPadding, panelFieldVerticalGap)}>
      <Label className="text-center text-md font-medium">{saveTypeLabel}</Label>
      <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
        <p className={textStyleValueBig}>{renderModifierValue(totalValue)}</p>
        <Button
          type="button" variant="ghost" size="icon-xs"
          className="text-muted-foreground hover:text-primary self-center"
          onClick={() => onOpenInfoDialog(saveType)}
          aria-label={(uiStrings.infoDialogSavingThrowBreakdownAriaLabel || "Detailed breakdown for {saveTypeLabel} save").replace("{saveTypeLabel}", saveTypeLabel)}
        > <Info /> </Button>
        <Button
          type="button" variant="ghost" size="icon-xs"
          className="text-muted-foreground hover:text-primary self-center"
          onClick={() => onOpenRollDialog(saveType)}
          aria-label={(uiStrings.rollDialogSavingThrowAriaLabel || "Roll {saveTypeLabel} Save").replace("{saveTypeLabel}", saveTypeLabel)}
        > <Dices /> </Button>
      </div>

      {!panelIsLocked && (
        <div className="w-full mt-auto pt-2 space-y-2 text-center">
          <div className="space-y-1">
            <Label className={textStyleSubtle}>{uiStrings.savingThrowsRowLabelBase}</Label>
            <p className="font-bold text-accent text-lg">{baseValue}</p>
          </div>
          <div className="space-y-1">
            <Label className={textStyleSubtle}>{uiStrings.savingThrowsRowLabelAbilityModifier}</Label>
            <div className="flex justify-center">
              <DualBadge leftLabel={abilityAbbr} rightLabel={renderModifierValue(abilityModifier)} color={badgeColor} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className={textStyleSubtle}>{uiStrings.savingThrowsRowLabelMiscModifier}</Label>
            <p className="font-semibold">{renderModifierValue(miscBonus)}</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`temp-mod-${saveType}`} className={textStyleSubtle}>
              {uiStrings.savingThrowsRowLabelTemporaryModifier}
            </Label>
            <Input
              id={`temp-mod-${saveType}`}
              type="number"
              value={localTemporaryMod}
              onChange={(e) => setLocalTemporaryMod(parseInt(e.target.value, 10) || 0)}
              className="h-8 w-20 text-center mx-auto text-base"
              disabled={panelIsLocked}
            />
          </div>
        </div>
      )}
    </div>
  );
});
SavingThrowCard.displayName = 'SavingThrowCard';


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
    const baseSaves = getBaseSaves(savingThrowsData.classes, DND_CLASSES);
    const abilityKey = SAVING_THROW_ABILITIES[saveType];
    
    const breakdown: GenericBreakdownItem[] = [
      { label: UI_STRINGS.savingThrowsRowLabelBase, value: baseSaves[saveType] },
      { label: (UI_STRINGS.rollDialogAbilityModifierLabel).replace("{abilityAbbr}", ABILITY_LABELS.find(al => al.id === abilityKey)?.abbr || ''), value: getAbilityModifierByName(abilityScores, abilityKey) },
    ];
    const miscBonus = calculateCalculatedTotalMiscBonusForSave(saveType);
    if(miscBonus !== 0) breakdown.push({ label: UI_STRINGS.savingThrowsRowLabelMiscModifier, value: miscBonus });
    const tempMod = savingThrowsData.savingThrows[saveType].miscMod || 0;
    if(tempMod !== 0) breakdown.push({ label: UI_STRINGS.savingThrowsRowLabelTemporaryModifier, value: tempMod });
    
    const totalModifier = breakdown.reduce((sum, item) => sum + (typeof item.value === 'number' ? item.value : 0), 0);

    onOpenRollDialog({
      dialogTitle: (UI_STRINGS.rollDialogTitleSavingThrow).replace("{saveTypeLabel}", SAVING_THROW_LABELS.find(stl => stl.id === saveType)?.label || saveType),
      rollType: `saving_throw_${saveType}`,
      baseModifier: totalModifier,
      calculationBreakdown: breakdown,
      rerollTwentiesForChecks: rerollTwentiesForChecks,
      weaponDamageDiceString: "",
      weaponCriticalMultiplier: 1,
    });
  }, [translations, savingThrowsData, abilityScores, aggregatedFeatEffects, calculateCalculatedTotalMiscBonusForSave, rerollTwentiesForChecks, onOpenRollDialog]);

  const handleOpenInfo = React.useCallback((saveType: SavingThrowType) => {
    onOpenInfoDialog({ type: 'savingThrowBreakdown', saveType });
  }, [onOpenInfoDialog]);

  if (translationsLoading || !translations || !aggregatedFeatEffects) {
    return null;
  }

  const { DND_CLASSES, SAVING_THROW_LABELS, ABILITY_LABELS, UI_STRINGS } = translations;
  const calculatedBaseSaves = getBaseSaves(savingThrowsData.classes, DND_CLASSES);

  return (
    <LockablePanelWrapper
      title={UI_STRINGS.savingThrowsPanelTitle}
      description={UI_STRINGS.savingThrowsPanelDescription}
      icon={Zap}
      headerClassName="bg-muted/20"
      initialLockedState={false}
      footer={
        <p className="text-sm text-muted-foreground">
          {parseAndRenderUIString(UI_STRINGS.savingThrowsPanelMiscModInfoNote_full, {
            badge: (children: React.ReactNode) => <Badge variant="outline">{children}</Badge>
          })}
        </p>
      }
    >
      {({ isLocked: panelIsLocked }) => (
        <div className={cn("grid grid-cols-1 md:grid-cols-3", panelGridGap)}>
          {SAVE_TYPES.map((saveType) => {
            const baseSaveValue = calculatedBaseSaves[saveType];
            const abilityKey = SAVING_THROW_ABILITIES[saveType];
            const abilityModifier = getAbilityModifierByName(abilityScores, abilityKey);
            const calculatedTotalMiscBonusForSaveVal = calculateCalculatedTotalMiscBonusForSave(saveType);
            const tempModValue = savingThrowsData.savingThrows[saveType].miscMod || 0;
            const totalCalculatedValue = baseSaveValue + abilityModifier + calculatedTotalMiscBonusForSaveVal + tempModValue;
            const saveTypeLabel = SAVING_THROW_LABELS.find(stl => stl.id === saveType)?.label || saveType;
            const abilityLabelInfo = ABILITY_LABELS.find(al => al.id === abilityKey);
            const abilityAbbr = abilityLabelInfo?.abbr || abilityKey.substring(0,3).toUpperCase();

            return (
              <SavingThrowCard
                key={saveType}
                saveType={saveType}
                saveTypeLabel={saveTypeLabel}
                totalValue={totalCalculatedValue}
                baseValue={baseSaveValue}
                abilityModifier={abilityModifier}
                abilityAbbr={abilityAbbr}
                miscBonus={calculatedTotalMiscBonusForSaveVal}
                tempModValue={tempModValue}
                onTempModChange={onSavingThrowTemporaryModChange}
                panelIsLocked={panelIsLocked}
                onOpenInfoDialog={handleOpenInfo}
                onOpenRollDialog={handleOpenSavingThrowRollDialog}
                uiStrings={UI_STRINGS}
              />
            );
          })}
        </div>
      )}
    </LockablePanelWrapper>
  );
};

SavingThrowsPanelComponent.displayName = 'SavingThrowsPanelComponent';
export const SavingThrowsPanel = React.memo(SavingThrowsPanelComponent);
