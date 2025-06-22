
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
import { useToast } from '@/hooks/use-toast';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper';
import { parseAndRenderUIString } from '@/lib/utils';
import { DEBOUNCE_DELAY_FORM_INPUT, panelContentPadding, panelFieldHorizontalGap, panelFieldVerticalGap, panelGridGap, textStyleModifier, textStyleSubtle, textStyleValueBig, textStyleValueMedium } from '@/config/layout';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { Badge } from '@/components/ui/badge';


const abilityKeys: Exclude<AbilityName, 'none'>[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

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
  const { toast } = useToast();

  const { translations, isLoading: translationsLoading } = useI18n();

  const { rerollOnesForAbilityScores, pointBuyBudget, rerollTwentiesForChecks } = useDefinitionsStore(state => ({
    rerollOnesForAbilityScores: state.rerollOnesForAbilityScores,
    pointBuyBudget: state.pointBuyBudget,
    rerollTwentiesForChecks: state.rerollTwentiesForChecks,
  }));
  
  const [str, setStr] = useDebouncedFormField(
    abilityScoresData.abilityScores.strength,
    React.useCallback((value: number) => onBaseAbilityScoreChange('strength', value), [onBaseAbilityScoreChange]),
    DEBOUNCE_DELAY_FORM_INPUT
  );
  const [strMod, setStrMod] = useDebouncedFormField(
    abilityScoresData.abilityScoreTempCustomModifiers?.strength,
    React.useCallback((value: number) => onAbilityScoreTempCustomModifierChange('strength', value), [onAbilityScoreTempCustomModifierChange]),
    DEBOUNCE_DELAY_FORM_INPUT
  );

  const [dex, setDex] = useDebouncedFormField(
    abilityScoresData.abilityScores.dexterity,
    React.useCallback((value: number) => onBaseAbilityScoreChange('dexterity', value), [onBaseAbilityScoreChange]),
    DEBOUNCE_DELAY_FORM_INPUT
  );
  const [dexMod, setDexMod] = useDebouncedFormField(
    abilityScoresData.abilityScoreTempCustomModifiers?.dexterity,
    React.useCallback((value: number) => onAbilityScoreTempCustomModifierChange('dexterity', value), [onAbilityScoreTempCustomModifierChange]),
    DEBOUNCE_DELAY_FORM_INPUT
  );

  const [con, setCon] = useDebouncedFormField(
    abilityScoresData.abilityScores.constitution,
    React.useCallback((value: number) => onBaseAbilityScoreChange('constitution', value), [onBaseAbilityScoreChange]),
    DEBOUNCE_DELAY_FORM_INPUT
  );
  const [conMod, setConMod] = useDebouncedFormField(
    abilityScoresData.abilityScoreTempCustomModifiers?.constitution,
    React.useCallback((value: number) => onAbilityScoreTempCustomModifierChange('constitution', value), [onAbilityScoreTempCustomModifierChange]),
    DEBOUNCE_DELAY_FORM_INPUT
  );

  const [int, setInt] = useDebouncedFormField(
    abilityScoresData.abilityScores.intelligence,
    React.useCallback((value: number) => onBaseAbilityScoreChange('intelligence', value), [onBaseAbilityScoreChange]),
    DEBOUNCE_DELAY_FORM_INPUT
  );
  const [intMod, setIntMod] = useDebouncedFormField(
    abilityScoresData.abilityScoreTempCustomModifiers?.intelligence,
    React.useCallback((value: number) => onAbilityScoreTempCustomModifierChange('intelligence', value), [onAbilityScoreTempCustomModifierChange]),
    DEBOUNCE_DELAY_FORM_INPUT
  );

  const [wis, setWis] = useDebouncedFormField(
    abilityScoresData.abilityScores.wisdom,
    React.useCallback((value: number) => onBaseAbilityScoreChange('wisdom', value), [onBaseAbilityScoreChange]),
    DEBOUNCE_DELAY_FORM_INPUT
  );
  const [wisMod, setWisMod] = useDebouncedFormField(
    abilityScoresData.abilityScoreTempCustomModifiers?.wisdom,
    React.useCallback((value: number) => onAbilityScoreTempCustomModifierChange('wisdom', value), [onAbilityScoreTempCustomModifierChange]),
    DEBOUNCE_DELAY_FORM_INPUT
  );

  const [cha, setCha] = useDebouncedFormField(
    abilityScoresData.abilityScores.charisma,
    React.useCallback((value: number) => onBaseAbilityScoreChange('charisma', value), [onBaseAbilityScoreChange]),
    DEBOUNCE_DELAY_FORM_INPUT
  );
  const [chaMod, setChaMod] = useDebouncedFormField(
    abilityScoresData.abilityScoreTempCustomModifiers?.charisma,
    React.useCallback((value: number) => onAbilityScoreTempCustomModifierChange('charisma', value), [onAbilityScoreTempCustomModifierChange]),
    DEBOUNCE_DELAY_FORM_INPUT
  );

  const handleApplyRolledScores = React.useCallback((newScores: AbilityScores) => {
    onMultipleBaseAbilityScoresChange(newScores);
    setStr(newScores.strength);
    setDex(newScores.dexterity);
    setCon(newScores.constitution);
    setInt(newScores.intelligence);
    setWis(newScores.wisdom);
    setCha(newScores.charisma);
    setIsRollerDialogOpen(false);
  }, [onMultipleBaseAbilityScoresChange, setStr, setDex, setCon, setInt, setWis, setCha]);

  const handleApplyPointBuyScores = React.useCallback((newScores: AbilityScores) => {
    onMultipleBaseAbilityScoresChange(newScores);
    setStr(newScores.strength);
    setDex(newScores.dexterity);
    setCon(newScores.constitution);
    setInt(newScores.intelligence);
    setWis(newScores.wisdom);
    setCha(newScores.charisma);
    setIsPointBuyDialogOpen(false);
  }, [onMultipleBaseAbilityScoresChange, setStr, setDex, setCon, setInt, setWis, setCha]);

  const handleOpenRollDialog = React.useCallback((ability: Exclude<AbilityName, 'none'>) => {
    if (!detailedAbilityScores || !translations) return;
    const abilityLabelInfo = translations.ABILITY_LABELS.find(al => al.id === ability);
    const abilityName = abilityLabelInfo?.label;
    const finalModifier = calculateAbilityModifier(detailedAbilityScores[ability].finalScore);

    const breakdown: GenericBreakdownItem[] = [
      { label: translations.UI_STRINGS.rollDialogAbilityModifierLabel.replace("{abilityAbbr}", abilityLabelInfo?.abbr || ability.toUpperCase().substring(0,3)), value: finalModifier, isBold: true }
    ];

    setRollAbilityDialogData({
      dialogTitle: translations.UI_STRINGS.rollDialogTitleAbilityCheck.replace("{abilityName}", abilityName),
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
  }, []);

  if (translationsLoading || !translations || !detailedAbilityScores) {
    return null;
  }
  const { ABILITY_LABELS, UI_STRINGS } = translations;


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
            {abilityKeys.map(ability => {
              const finalModifier = calculateAbilityModifier(detailedAbilityScores[ability].finalScore);
              const modifierColorClass = finalModifier > 0 ? "text-emerald-500" : finalModifier < 0 ? "text-destructive" : "text-muted-foreground";

              return (
              <div key={ability} className={cn("flex flex-col border rounded-md bg-card", panelContentPadding, panelFieldVerticalGap)}>
                <Label htmlFor={!panelIsLocked ? `base-score-${ability}` : undefined} className="text-center text-md font-medium flex flex-col items-center">
                  <span>{ABILITY_LABELS.find(al => al.id === ability)?.abbr}</span>
                  <span className={textStyleSubtle}>{ABILITY_LABELS.find(al => al.id === ability)?.label}</span>
                </Label>
                <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                  <p className={textStyleValueBig}>{detailedAbilityScores[ability].finalScore}</p>
                  <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-primary self-center" onClick={() => onOpenAbilityScoreBreakdownDialog(ability)} aria-label={UI_STRINGS.infoDialogAbilityBreakdownAriaLabel.replace("{abilityName}", ABILITY_LABELS.find(al => al.id === ability)?.label)}><Info /></Button>
                </div>
                <div className="flex flex-col items-center">
                  <Label className={textStyleSubtle}>{UI_STRINGS.abilityScoresFinalModifierLabel}</Label>
                  <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                    <p className={cn(textStyleModifier, modifierColorClass)}>{finalModifier >= 0 ? '+' : ''}{finalModifier}</p>
                    <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-primary self-center" onClick={() => handleOpenRollDialog(ability)} aria-label={UI_STRINGS.rollDialogAbilityCheckAriaLabel.replace("{abilityName}", ABILITY_LABELS.find(al => al.id === ability)?.label)}><Dices /></Button>
                  </div>
                </div>
                {!panelIsLocked && (
                  <div className={cn("w-full mt-auto", panelFieldVerticalGap)}>
                    <div className={cn("w-full", panelFieldVerticalGap)}>
                      <Label htmlFor={`base-score-${ability}`} className={cn(textStyleSubtle, "text-center block")}>{UI_STRINGS.abilityScoresBaseScoreLabel}</Label>
                      <Input id={`base-score-${ability}`} type="number" value={
                        ability === 'strength' ? str : ability === 'dexterity' ? dex : ability === 'constitution' ? con :
                        ability === 'intelligence' ? int : ability === 'wisdom' ? wis : cha
                      } onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 1;
                        if (ability === 'strength') setStr(val); else if (ability === 'dexterity') setDex(val);
                        else if (ability === 'constitution') setCon(val); else if (ability === 'intelligence') setInt(val);
                        else if (ability === 'wisdom') setWis(val); else if (ability === 'charisma') setCha(val);
                      }} min={1} className="text-base text-center" disabled={panelIsLocked} />
                    </div>
                    <div className={cn("w-full", panelFieldVerticalGap)}>
                      <Label htmlFor={`temp-mod-${ability}`} className={cn(textStyleSubtle, "text-center block")}>{UI_STRINGS.abilityScoresTempModLabel}</Label>
                      <Input id={`temp-mod-${ability}`} type="number" value={
                        ability === 'strength' ? strMod : ability === 'dexterity' ? dexMod : ability === 'constitution' ? conMod :
                        ability === 'intelligence' ? intMod : ability === 'wisdom' ? wisMod : chaMod
                      } onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        if (ability === 'strength') setStrMod(val); else if (ability === 'dexterity') setDexMod(val);
                        else if (ability === 'constitution') setConMod(val); else if (ability === 'intelligence') setIntMod(val);
                        else if (ability === 'wisdom') setWisMod(val); else if (ability === 'charisma') setChaMod(val);
                      }} className="text-base text-center" disabled={panelIsLocked} />
                    </div>
                  </div>
                )}
              </div>
            )})}
            
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
