
'use client';

import *as React from 'react';
import type { AbilityScores, SavingThrows, SavingThrowType, Character, AbilityName, InfoDialogContentType, AggregatedFeatEffects, GenericBreakdownItem } from '@/types/character';
import { getAbilityModifierByName, getBaseSaves, SAVING_THROW_ABILITIES } from '@/lib/dnd-utils';
import { Zap } from 'lucide-react';
import { cn, parseAndRenderUIString } from '@/lib/utils';
import type { RollDialogProps } from '@/components/RollDialog';
import { useDefinitionsStore } from '@/lib/definitions-store';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper';
import {
  panelGridGap,
  textStyleDescription,
} from '@/config/layout';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/context/I18nProvider';
import { SavingThrowCard } from './SavingThrowCard'; // New import

export interface SavingThrowsPanelProps {
  savingThrowsData: Pick<Character, 'savingThrows' | 'classes' | 'feats'>;
  abilityScores: AbilityScores;
  aggregatedFeatEffects: AggregatedFeatEffects | null;
  onSavingThrowTemporaryModChange: (saveType: SavingThrowType, value: number) => void;
  onOpenInfoDialog: (contentType: InfoDialogContentType) => void;
  onOpenRollDialog: (data: Omit<RollDialogProps, 'isOpen' | 'onOpenChange' | 'onRoll'>) => void;
}

const SAVE_TYPES: SavingThrowType[] = ['fortitude', 'reflex', 'will'];

const SavingThrowsPanelContent = React.memo(({
  savingThrowsData,
  abilityScores,
  aggregatedFeatEffects,
  onSavingThrowTemporaryModChange,
  onOpenInfoDialog,
  onOpenRollDialog,
  panelIsLocked,
  translations,
}: SavingThrowsPanelProps & { panelIsLocked: boolean; translations: NonNullable<ReturnType<typeof useI18n>['translations']>}) => {
  const { DND_CLASSES, SAVING_THROW_LABELS, ABILITY_LABELS, UI_STRINGS } = translations;

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

  const calculatedBaseSaves = React.useMemo(() => getBaseSaves(savingThrowsData.classes, DND_CLASSES || []), [savingThrowsData.classes, DND_CLASSES]);
  
  const savingThrowCardsData = React.useMemo(() => {
    if (!translations || !abilityScores || !aggregatedFeatEffects) return [];
    
    return SAVE_TYPES.map(saveType => {
        const baseSaveValue = calculatedBaseSaves[saveType];
        const abilityKey = SAVING_THROW_ABILITIES[saveType];
        const abilityModifier = getAbilityModifierByName(abilityScores, abilityKey);
        const calculatedTotalMiscBonusForSaveVal = calculateCalculatedTotalMiscBonusForSave(saveType);
        const tempModValue = savingThrowsData.savingThrows[saveType].miscMod || 0;
        const totalCalculatedValue = baseSaveValue + abilityModifier + calculatedTotalMiscBonusForSaveVal + tempModValue;
        const saveTypeLabel = SAVING_THROW_LABELS.find(stl => stl.id === saveType)?.label || saveType;
        const abilityLabelInfo = ABILITY_LABELS.find(al => al.id === abilityKey);
        const abilityAbbr = abilityLabelInfo?.abbr || abilityKey.substring(0,3).toUpperCase();
        
        return {
          saveType,
          saveTypeLabel,
          totalValue: totalCalculatedValue,
          baseValue: baseSaveValue,
          abilityModifier,
          abilityAbbr,
          miscBonus: calculatedTotalMiscBonusForSaveVal,
          tempModValue,
        };
    });
  }, [
    translations, 
    abilityScores, 
    aggregatedFeatEffects, 
    calculatedBaseSaves, 
    SAVING_THROW_LABELS, 
    ABILITY_LABELS,
    calculateCalculatedTotalMiscBonusForSave,
    savingThrowsData.savingThrows
  ]);

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3", panelGridGap)}>
      {savingThrowCardsData.map((cardData) => (
          <SavingThrowCard
            key={cardData.saveType}
            {...cardData}
            onTempModChange={onSavingThrowTemporaryModChange}
            panelIsLocked={panelIsLocked}
            onOpenInfoDialog={saveType => onOpenInfoDialog({type: 'savingThrowBreakdown', saveType})}
            onOpenRollDialog={onOpenRollDialog as any} // Cast as any to avoid complex type issues here
            uiStrings={UI_STRINGS}
          />
        )
      )}
    </div>
  );
});
SavingThrowsPanelContent.displayName = 'SavingThrowsPanelContent';

const SavingThrowsPanelComponent = ({
  savingThrowsData,
  abilityScores,
  aggregatedFeatEffects,
  onSavingThrowTemporaryModChange,
  onOpenInfoDialog,
  onOpenRollDialog,
}: SavingThrowsPanelProps) => {
  const { translations, isLoading: translationsLoading } = useI18n();

  const handleOpenSavingThrowRollDialog = React.useCallback((saveType: SavingThrowType) => {
    if (!translations || !abilityScores || !aggregatedFeatEffects) return;
    const { DND_CLASSES, SAVING_THROW_LABELS, ABILITY_LABELS, UI_STRINGS } = translations;
    const baseSaves = getBaseSaves(savingThrowsData.classes, DND_CLASSES);
    const abilityKey = SAVING_THROW_ABILITIES[saveType];
    
    const breakdown: GenericBreakdownItem[] = [
      { label: UI_STRINGS.savingThrowsRowLabelBase, value: baseSaves[saveType] },
      { label: (UI_STRINGS.rollDialogAbilityModifierLabel).replace("{abilityAbbr}", ABILITY_LABELS.find(al => al.id === abilityKey)?.abbr || ''), value: getAbilityModifierByName(abilityScores, abilityKey) },
    ];
    // This is re-calculating logic from the content component, which is not ideal but necessary to pass to the dialog
    let miscBonus = savingThrowsData.savingThrows[saveType].magicMod || 0;
    if (aggregatedFeatEffects.savingThrowBonuses) {
      aggregatedFeatEffects.savingThrowBonuses.forEach(effect => {
        if (effect.isActive && (effect.save === saveType || effect.save === 'all')) {
          if (typeof effect.value === 'number') miscBonus += effect.value;
          else if (effect.value === 'CHA') miscBonus += getAbilityModifierByName(abilityScores, 'charisma');
        }
      });
    }

    if(miscBonus !== 0) breakdown.push({ label: UI_STRINGS.savingThrowsRowLabelMiscModifier, value: miscBonus });
    const tempMod = savingThrowsData.savingThrows[saveType].miscMod || 0;
    if(tempMod !== 0) breakdown.push({ label: UI_STRINGS.savingThrowsRowLabelTemporaryModifier, value: tempMod });
    
    const totalModifier = breakdown.reduce((sum, item) => sum + (typeof item.value === 'number' ? item.value : 0), 0);

    onOpenRollDialog({
      dialogTitle: (UI_STRINGS.rollDialogTitleSavingThrow).replace("{saveTypeLabel}", SAVING_THROW_LABELS.find(stl => stl.id === saveType)?.label || saveType),
      rollType: `saving_throw_${saveType}`,
      baseModifier: totalModifier,
      calculationBreakdown: breakdown,
      rerollTwentiesForChecks: useDefinitionsStore.getState().rerollTwentiesForChecks,
      weaponDamageDiceString: "",
      weaponCriticalMultiplier: 1,
    });
  }, [translations, savingThrowsData, abilityScores, aggregatedFeatEffects, onOpenRollDialog]);


  const footerContent = React.useMemo(() => {
    if (!translations) return null;
    return (
      <p className={textStyleDescription}>
        {parseAndRenderUIString(translations.UI_STRINGS.savingThrowsPanelMiscModInfoNoteFull, {
          badge: (children: React.ReactNode) => <Badge variant="outline">{children}</Badge>
        })}
      </p>
    )
  }, [translations]);

  if (translationsLoading || !translations || !aggregatedFeatEffects) {
    return null;
  }
  const { UI_STRINGS } = translations;

  return (
    <LockablePanelWrapper
      title={UI_STRINGS.savingThrowsPanelTitle}
      description={UI_STRINGS.savingThrowsPanelDescription}
      icon={Zap}
      initialLockedState={false}
      footer={footerContent}
    >
      {({ isLocked: panelIsLocked }) => (
        <SavingThrowsPanelContent 
          panelIsLocked={panelIsLocked}
          savingThrowsData={savingThrowsData}
          abilityScores={abilityScores}
          aggregatedFeatEffects={aggregatedFeatEffects}
          onSavingThrowTemporaryModChange={onSavingThrowTemporaryModChange}
          onOpenInfoDialog={saveType => onOpenInfoDialog({type: 'savingThrowBreakdown', saveType})}
          onOpenRollDialog={handleOpenSavingThrowRollDialog}
          translations={translations}
        />
      )}
    </LockablePanelWrapper>
  );
};
SavingThrowsPanelComponent.displayName = 'SavingThrowsPanelComponent';
export const SavingThrowsPanel = React.memo(SavingThrowsPanelComponent);
