
'use client';

import *as React from 'react';
import type { AbilityScores, SavingThrows, SavingThrowType, Character, AbilityName, InfoDialogContentType, AggregatedFeatEffects, GenericBreakdownItem } from '@/types/character';
import { getAbilityModifierByName, getBaseSaves, SAVING_THROW_ABILITIES } from '@/lib/dnd-utils';
import { Zap, Info, Dices } from 'lucide-react';
import { cn, parseAndRenderUIString } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { renderModifierValue, sectionHeadingClass } from '@/components/info-dialog-content/dialog-utils';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { DualBadge, type DualBadgeProps } from '@/components/ui/DualBadge';
import type { RollDialogProps } from '@/components/RollDialog';
import { useDefinitionsStore } from '@/lib/definitions-store';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper';
import { Input } from '@/components/ui/input';
import { DEBOUNCE_DELAY_FORM_INPUT, panelContentPadding, panelFieldHorizontalGap, textStyleSubtle, panelFieldVerticalGap, panelGridGap, textStyleValueMedium } from '@/config/layout';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/context/I18nProvider';

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
  translations: ReturnType<typeof useI18n>['translations'];
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
  translations,
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
  
  const { UI_STRINGS } = translations || { UI_STRINGS: {} };

  return (
    <div className={cn("flex flex-col border rounded-md bg-card items-center text-center", panelContentPadding, panelGridGap)}>
      <Label className="text-center text-md font-medium flex flex-col items-center">
        <span>{saveTypeLabel}</span>
        <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
          <p className={cn("text-lg font-bold text-accent", 'text-center')}>{baseValue}</p>
          <Button
            type="button" variant="ghost" size="icon-xs"
            className="text-muted-foreground hover:text-primary self-center"
            onClick={() => onOpenInfoDialog(saveType)}
            aria-label={UI_STRINGS.infoDialogSavingThrowBreakdownAriaLabel.replace("{saveTypeLabel}", saveTypeLabel)}
          >
            <Info />
          </Button>
        </div>
      </Label>

      <div className="flex flex-col items-center">
        <Label className={cn(textStyleSubtle, "font-bold")}>{uiStrings.savingThrowsRowLabelFinalModifier}</Label>
        <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
          <p className={cn('text-xl font-bold', 'text-center')}>{renderModifierValue(totalValue)}</p>
           <Button
            type="button" variant="ghost" size="icon-xs"
            className="text-muted-foreground hover:text-primary self-center"
            onClick={() => onOpenRollDialog(saveType)}
            aria-label={UI_STRINGS.rollDialogSavingThrowAriaLabel.replace("{saveTypeLabel}", saveTypeLabel)}
          >
            <Dices />
          </Button>
        </div>
      </div>

      {!panelIsLocked && (
        <div className={cn("w-full mt-auto flex flex-col", panelGridGap)}>
          <div className={cn("flex flex-col items-center", panelFieldVerticalGap)}>
            <Label className={cn(textStyleSubtle, "font-bold")}>{uiStrings.savingThrowsRowLabelAbilityModifier}</Label>
            <DualBadge leftLabel={abilityAbbr} rightLabel={renderModifierValue(abilityModifier)} color={badgeColor} />
          </div>

          <div className={cn("flex flex-col items-center", panelFieldVerticalGap)}>
            <Label className={cn(textStyleSubtle, "font-bold")}>
              {uiStrings.savingThrowsRowLabelMiscModifier}
            </Label>
            <p className={cn(textStyleSubtle)}>{renderModifierValue(miscBonus)}</p>
          </div>
          
          <div className={cn("flex flex-col items-center", panelFieldVerticalGap)}>
              <Label htmlFor={`temp-mod-${saveType}`} className={cn("font-bold", textStyleSubtle)}>
                {uiStrings.savingThrowsRowLabelTemporaryModifier}
              </Label>
              <div className="flex justify-center w-full">
                <Input
                  id={`temp-mod-${saveType}`}
                  type="number"
                  value={localTemporaryMod}
                  onChange={(e) => setLocalTemporaryMod(parseInt(e.target.value, 10) || 0)}
                  className="text-center"
                  disabled={panelIsLocked}
                />
              </div>
          </div>
        </div>
      )}
    </div>
  )
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
      dialogTitle: UI_STRINGS.rollDialogTitleSavingThrow.replace("{saveTypeLabel}", SAVING_THROW_LABELS.find(stl => stl.id === saveType)?.label || saveType),
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
                translations={translations}
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
