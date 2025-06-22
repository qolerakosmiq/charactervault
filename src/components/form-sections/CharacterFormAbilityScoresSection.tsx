
'use client';

import *as React from 'react';
import type { AbilityName, AbilityScores, DetailedAbilityScores, Character, GenericBreakdownItem, DndClassId } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dices, Info, Calculator } from 'lucide-react';
import { calculateAbilityModifier } from '@/lib/dnd-utils';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { AbilityScoreRollerDialog } from '@/components/AbilityScoreRollerDialog';
import { AbilityScorePointBuyDialog } from '@/components/AbilityScorePointBuyDialog';
import { RollDialog, type RollDialogProps } from '@/components/RollDialog';
import { useDefinitionsStore } from '@/lib/definitions-store';
import { useI18n } from '@/context/I18nProvider';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper';
import { parseAndRenderUIString } from '@/lib/utils';
import { DEBOUNCE_DELAY_FORM_INPUT, panelContentPadding, panelFieldHorizontalGap, panelFieldVerticalGap, panelGridGap, textStyleModifier, textStyleSubtle, textStyleValueBig, textStyleValueMedium } from '@/config/layout';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { Badge } from '@/components/ui/badge';


const abilityKeys: Exclude<AbilityName, 'none'>[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

interface AbilityScoreInputGroupProps {
  abilityKey: Exclude<AbilityName, 'none'>;
  detailedScore: DetailedAbilityScores[keyof DetailedAbilityScores];
  baseScoreValue: number;
  onBaseScoreChange: (value: number) => void;
  tempModValue: number;
  onTempModChange: (value: number) => void;
  panelIsLocked: boolean;
  translations: {
    ABILITY_LABELS: ReturnType<typeof useI18n>['translations']['ABILITY_LABELS'],
    UI_STRINGS: ReturnType<typeof useI18n>['translations']['UI_STRINGS']
  };
  onOpenBreakdownDialog: (ability: Exclude<AbilityName, 'none'>) => void;
  onOpenRollDialog: (ability: Exclude<AbilityName, 'none'>) => void;
}

const AbilityScoreInputGroup = ({
  abilityKey,
  detailedScore,
  baseScoreValue,
  onBaseScoreChange,
  tempModValue,
  onTempModChange,
  panelIsLocked,
  translations,
  onOpenBreakdownDialog,
  onOpenRollDialog,
}: AbilityScoreInputGroupProps) => {
  const finalModifier = calculateAbilityModifier(detailedScore.finalScore);
  const modifierColorClass = finalModifier > 0 ? "text-emerald-500" : finalModifier < 0 ? "text-destructive" : "text-muted-foreground";

  const { ABILITY_LABELS, UI_STRINGS } = translations;

  return (
    <div className={cn("flex flex-col border rounded-md bg-card", panelContentPadding, panelFieldVerticalGap)}>
      <Label htmlFor={!panelIsLocked ? `base-score-${abilityKey}` : undefined} className="text-center text-md font-medium flex flex-col items-center">
        <span>{ABILITY_LABELS.find(al => al.id === abilityKey)?.abbr}</span>
        <span className={textStyleSubtle}>{ABILITY_LABELS.find(al => al.id === abilityKey)?.label}</span>
      </Label>
      <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
        <p className={textStyleValueBig}>{detailedScore.finalScore}</p>
        <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-primary self-center" onClick={() => onOpenBreakdownDialog(abilityKey)} aria-label={UI_STRINGS.infoDialogAbilityBreakdownAriaLabel.replace("{abilityName}", ABILITY_LABELS.find(al => al.id === abilityKey)?.label)}><Info /></Button>
      </div>
      <div className="flex flex-col items-center">
        <Label className={textStyleSubtle}>{UI_STRINGS.abilityScoresFinalModifierLabel}</Label>
        <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
          <p className={cn(textStyleModifier, modifierColorClass)}>{finalModifier >= 0 ? '+' : ''}{finalModifier}</p>
          <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-primary self-center" onClick={() => onOpenRollDialog(abilityKey)} aria-label={UI_STRINGS.rollDialogAbilityCheckAriaLabel.replace("{abilityName}", ABILITY_LABELS.find(al => al.id === abilityKey)?.label)}><Dices /></Button>
        </div>
      </div>
      {!panelIsLocked && (
        <div className={cn("w-full mt-auto", panelFieldVerticalGap)}>
          <div className={cn("w-full", panelFieldVerticalGap)}>
            <Label htmlFor={`base-score-${abilityKey}`} className={cn(textStyleSubtle, "text-center block")}>{UI_STRINGS.abilityScoresBaseScoreLabel}</Label>
            <Input id={`base-score-${abilityKey}`} type="number" value={baseScoreValue} onChange={(e) => onBaseScoreChange(parseInt(e.target.value, 10) || 1)} min={1} className="text-base text-center" disabled={panelIsLocked} />
          </div>
          <div className={cn("w-full", panelFieldVerticalGap)}>
            <Label htmlFor={`temp-mod-${abilityKey}`} className={cn(textStyleSubtle, "text-center block")}>{UI_STRINGS.abilityScoresTempModLabel}</Label>
            <Input id={`temp-mod-${abilityKey}`} type="number" value={tempModValue} onChange={(e) => onTempModChange(parseInt(e.target.value, 10) || 0)} className="text-base text-center" disabled={panelIsLocked} />
          </div>
        </div>
      )}
    </div>
  )
};
const MemoizedAbilityScoreInputGroup = React.memo(AbilityScoreInputGroup);


export interface CharacterFormAbilityScoresSectionProps {
  abilityScoresData: Pick<Character, 'abilityScores' | 'abilityScoreTempCustomModifiers'>;
  detailedAbilityScores: DetailedAbilityScores | null;
  onBaseAbilityScoreChange: (ability: Exclude<AbilityName, 'none'>, value: number) => void;
  onAbilityScoreTempCustomModifierChange: (ability: Exclude<AbilityName, 'none'>, value: number) => void;
  onMultipleBaseAbilityScoresChange: (newScores: AbilityScores) => void;
  onOpenAbilityScoreBreakdownDialog: (ability: Exclude<AbilityName, 'none'>) => void;
  characterClassId: DndClassId | '';
}

const CharacterFormAbilityScoresSectionComponent = ({
  abilityScoresData,
  detailedAbilityScores,
  onBaseAbilityScoreChange,
  onAbilityScoreTempCustomModifierChange,
  onMultipleBaseAbilityScoresChange,
  onOpenAbilityScoreBreakdownDialog,
  characterClassId,
}: CharacterFormAbilityScoresSectionProps) => {
  const [isRollerDialogOpen, setIsRollerDialogOpen] = React.useState(false);
  const [isPointBuyDialogOpen, setIsPointBuyDialogOpen] = React.useState(false);
  const [isRollAbilityDialogOpen, setIsRollAbilityDialogOpen] = React.useState(false);
  const [rollAbilityDialogData, setRollAbilityDialogData] = React.useState<Omit<RollDialogProps, 'isOpen' | 'onOpenChange' | 'onRoll'> | null>(null);

  const { translations, isLoading: translationsLoading } = useI18n();

  const { rerollOnesForAbilityScores, pointBuyBudget, rerollTwentiesForChecks } = useDefinitionsStore(state => ({
    rerollOnesForAbilityScores: state.rerollOnesForAbilityScores,
    pointBuyBudget: state.pointBuyBudget,
    rerollTwentiesForChecks: state.rerollTwentiesForChecks,
  }));

  const handleBaseScoreChange = React.useCallback((ability: Exclude<AbilityName, 'none'>) => (value: number) => {
    onBaseAbilityScoreChange(ability, value);
  }, [onBaseAbilityScoreChange]);

  const handleTempModChange = React.useCallback((ability: Exclude<AbilityName, 'none'>) => (value: number) => {
    onAbilityScoreTempCustomModifierChange(ability, value);
  }, [onAbilityScoreTempCustomModifierChange]);

  const debouncedStateSetters = {
    strength: useDebouncedFormField(abilityScoresData.abilityScores.strength, handleBaseScoreChange('strength'), DEBOUNCE_DELAY_FORM_INPUT),
    dexterity: useDebouncedFormField(abilityScoresData.abilityScores.dexterity, handleBaseScoreChange('dexterity'), DEBOUNCE_DELAY_FORM_INPUT),
    constitution: useDebouncedFormField(abilityScoresData.abilityScores.constitution, handleBaseScoreChange('constitution'), DEBOUNCE_DELAY_FORM_INPUT),
    intelligence: useDebouncedFormField(abilityScoresData.abilityScores.intelligence, handleBaseScoreChange('intelligence'), DEBOUNCE_DELAY_FORM_INPUT),
    wisdom: useDebouncedFormField(abilityScoresData.abilityScores.wisdom, handleBaseScoreChange('wisdom'), DEBOUNCE_DELAY_FORM_INPUT),
    charisma: useDebouncedFormField(abilityScoresData.abilityScores.charisma, handleBaseScoreChange('charisma'), DEBOUNCE_DELAY_FORM_INPUT),
  };

  const debouncedTempModSetters = {
    strength: useDebouncedFormField(abilityScoresData.abilityScoreTempCustomModifiers?.strength, handleTempModChange('strength'), DEBOUNCE_DELAY_FORM_INPUT),
    dexterity: useDebouncedFormField(abilityScoresData.abilityScoreTempCustomModifiers?.dexterity, handleTempModChange('dexterity'), DEBOUNCE_DELAY_FORM_INPUT),
    constitution: useDebouncedFormField(abilityScoresData.abilityScoreTempCustomModifiers?.constitution, handleTempModChange('constitution'), DEBOUNCE_DELAY_FORM_INPUT),
    intelligence: useDebouncedFormField(abilityScoresData.abilityScoreTempCustomModifiers?.intelligence, handleTempModChange('intelligence'), DEBOUNCE_DELAY_FORM_INPUT),
    wisdom: useDebouncedFormField(abilityScoresData.abilityScoreTempCustomModifiers?.wisdom, handleTempModChange('wisdom'), DEBOUNCE_DELAY_FORM_INPUT),
    charisma: useDebouncedFormField(abilityScoresData.abilityScoreTempCustomModifiers?.charisma, handleTempModChange('charisma'), DEBOUNCE_DELAY_FORM_INPUT),
  };


  const handleApplyRolledScores = React.useCallback((newScores: AbilityScores) => {
    onMultipleBaseAbilityScoresChange(newScores);
    setIsRollerDialogOpen(false);
  }, [onMultipleBaseAbilityScoresChange]);

  const handleApplyPointBuyScores = React.useCallback((newScores: AbilityScores) => {
    onMultipleBaseAbilityScoresChange(newScores);
    setIsPointBuyDialogOpen(false);
  }, [onMultipleBaseAbilityScoresChange]);

  const handleOpenRollDialog = React.useCallback((ability: Exclude<AbilityName, 'none'>) => {
    if (!detailedAbilityScores || !translations) return;
    const abilityLabelInfo = translations.ABILITY_LABELS.find(al => al.id === ability);
    const abilityName = abilityLabelInfo?.label;
    const finalModifier = calculateAbilityModifier(detailedAbilityScores[ability].finalScore);

    const breakdown: GenericBreakdownItem[] = [
      { label: translations.UI_STRINGS.rollDialogAbilityModifierLabel.replace("{abilityAbbr}", abilityLabelInfo?.abbr || ability.toUpperCase().substring(0,3)), value: finalModifier, isBold: true }
    ];

    setRollAbilityDialogData({
      dialogTitle: translations.UI_STRINGS.rollDialogTitleAbilityCheck.replace("{abilityName}", abilityName || ''),
      rollType: `ability_check_${ability}`,
      baseModifier: finalModifier,
      calculationBreakdown: breakdown,
      rerollTwentiesForChecks: rerollTwentiesForChecks,
      weaponDamageDiceString: "", 
      weaponCriticalMultiplier: 1,
    });
    setIsRollAbilityDialogOpen(true);
  }, [detailedAbilityScores, translations, rerollTwentiesForChecks]);

  const handleAbilityRollResult = React.useCallback((diceResult: number, totalBonus: number, finalResult: number) => {
    // This is a no-op currently, but could be used to show a toast or log the result.
  }, []);

  if (translationsLoading || !translations || !detailedAbilityScores) {
    return null;
  }
  const { ABILITY_LABELS, UI_STRINGS } = translations;

  const translationSubsetForChild = { ABILITY_LABELS, UI_STRINGS };


  return (
    <>
      <LockablePanelWrapper
        title={UI_STRINGS.abilityScoresPanelTitle}
        description={UI_STRINGS.abilityScoresPanelDescription}
        icon={Dices}
        headerClassName="bg-muted/20"
        initialLockedState={false}
        footer={
          <p className="text-sm text-muted-foreground">
            {parseAndRenderUIString(UI_STRINGS.abilityScoresNote_full, {
              badge: (children: React.ReactNode) => <Badge variant="outline">{children}</Badge>
            })}
          </p>
        }
      >
        {({ isLocked: panelIsLocked }) => (
          <div className={cn("grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6", panelGridGap)}>
            {abilityKeys.map(ability => (
              <MemoizedAbilityScoreInputGroup
                key={ability}
                abilityKey={ability}
                detailedScore={detailedAbilityScores[ability]}
                baseScoreValue={debouncedStateSetters[ability][0]}
                onBaseScoreChange={debouncedStateSetters[ability][1]}
                tempModValue={debouncedTempModSetters[ability][0]}
                onTempModChange={debouncedTempModSetters[ability][1]}
                panelIsLocked={panelIsLocked}
                translations={translationSubsetForChild}
                onOpenBreakdownDialog={onOpenAbilityScoreBreakdownDialog}
                onOpenRollDialog={handleOpenRollDialog}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => setIsRollerDialogOpen(true)}
              disabled={panelIsLocked}
              className="w-full sm:col-start-2 lg:col-start-5"
            >
              <Dices /> {UI_STRINGS.abilityScoresRollButton}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => setIsPointBuyDialogOpen(true)}
              disabled={panelIsLocked || typeof pointBuyBudget !== 'number'}
              className="w-full sm:col-start-auto lg:col-start-auto"
            >
              <Calculator /> {UI_STRINGS.abilityScoresPointBuyButton}
            </Button>
          </div>
        )}
      </LockablePanelWrapper>
      <AbilityScoreRollerDialog
        isOpen={isRollerDialogOpen}
        onOpenChange={setIsRollerDialogOpen}
        onScoresApplied={handleApplyRolledScores}
        rerollOnes={rerollOnesForAbilityScores}
        characterClassId={characterClassId}
      />
      <AbilityScorePointBuyDialog
          isOpen={isPointBuyDialogOpen}
          onOpenChange={setIsPointBuyDialogOpen}
          onScoresApplied={handleApplyPointBuyScores}
          totalPointsBudget={pointBuyBudget}
          characterClassId={characterClassId}
      />
      {rollAbilityDialogData && (
        <RollDialog
          isOpen={isRollAbilityDialogOpen}
          onOpenChange={setIsRollAbilityDialogOpen}
          dialogTitle={rollAbilityDialogData.dialogTitle}
          rollType={rollAbilityDialogData.rollType}
          baseModifier={rollAbilityDialogData.baseModifier}
          calculationBreakdown={rollAbilityDialogData.calculationBreakdown}
          rerollTwentiesForChecks={rerollTwentiesForChecks}
          weaponDamageDiceString={rollAbilityDialogData.weaponDamageDiceString || ""}
          weaponCriticalMultiplier={rollAbilityDialogData.weaponCriticalMultiplier || 1}
          onRoll={handleAbilityRollResult}
        />
      )}
    </>
  );
};
CharacterFormAbilityScoresSectionComponent.displayName = 'CharacterFormAbilityScoresSectionComponent';
export const CharacterFormAbilityScoresSection = React.memo(CharacterFormAbilityScoresSectionComponent);
