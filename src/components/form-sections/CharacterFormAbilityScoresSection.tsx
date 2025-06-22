
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
import { panelGridGap, panelFieldVerticalGap, panelFieldHorizontalGap, DEBOUNCE_DELAY_FORM_INPUT, panelContentPadding, textStyleValueBig, textStyleValueMedium, textStyleSubtle } from '@/config/layout';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';

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
            {parseAndRenderUIString(UI_STRINGS.abilityScoresNote_full)}
          </p>
        }
      >
        {({ isLocked: panelIsLocked }) => (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className={cn("flex flex-col border rounded-md bg-card", panelContentPadding, panelFieldVerticalGap)}>
                <Label htmlFor={!panelIsLocked ? `base-score-strength` : undefined} className="text-center text-md font-medium flex flex-col items-center">
                  <span>{ABILITY_LABELS.find(al => al.id === 'strength')?.abbr}</span>
                  <span className={textStyleSubtle}>{ABILITY_LABELS.find(al => al.id === 'strength')?.label}</span>
                </Label>
                <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                  <p className={textStyleValueBig}>{detailedAbilityScores.strength.finalScore}</p>
                  <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-primary self-center" onClick={() => onOpenAbilityScoreBreakdownDialog('strength')} aria-label={UI_STRINGS.infoDialogAbilityBreakdownAriaLabel.replace("{abilityName}", ABILITY_LABELS.find(al => al.id === 'strength')?.label)}><Info /></Button>
                </div>
                <div className="flex flex-col items-center">
                  <Label className={textStyleSubtle}>{UI_STRINGS.abilityScoresFinalModifierLabel}</Label>
                  <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                    <p className={textStyleValueMedium}>{detailedAbilityScores.strength.finalScore >= 10 ? '+' : ''}{calculateAbilityModifier(detailedAbilityScores.strength.finalScore)}</p>
                    <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-primary self-center" onClick={() => handleOpenRollDialog('strength')} aria-label={UI_STRINGS.rollDialogAbilityCheckAriaLabel.replace("{abilityName}", ABILITY_LABELS.find(al => al.id === 'strength')?.label)}><Dices /></Button>
                  </div>
                </div>
                {!panelIsLocked && (
                  <div className={cn("w-full mt-auto", panelFieldVerticalGap)}>
                    <div className={cn("w-full", panelFieldVerticalGap)}>
                      <Label htmlFor="base-score-strength" className={cn(textStyleSubtle, "text-center block")}>{UI_STRINGS.abilityScoresBaseScoreLabel}</Label>
                      <Input id="base-score-strength" type="number" value={str} onChange={(e) => setStr(parseInt(e.target.value, 10) || 1)} min={1} className="text-base text-center" disabled={panelIsLocked} />
                    </div>
                    <div className={cn("w-full", panelFieldVerticalGap)}>
                      <Label htmlFor="temp-mod-strength" className={cn(textStyleSubtle, "text-center block")}>{UI_STRINGS.abilityScoresTempModLabel}</Label>
                      <Input id="temp-mod-strength" type="number" value={strMod} onChange={(e) => setStrMod(parseInt(e.target.value, 10) || 0)} className="text-base text-center" disabled={panelIsLocked} />
                    </div>
                  </div>
                )}
              </div>
              <div className={cn("flex flex-col border rounded-md bg-card", panelContentPadding, panelFieldVerticalGap)}>
                <Label htmlFor={!panelIsLocked ? `base-score-dexterity` : undefined} className="text-center text-md font-medium flex flex-col items-center">
                  <span>{ABILITY_LABELS.find(al => al.id === 'dexterity')?.abbr}</span>
                  <span className={textStyleSubtle}>{ABILITY_LABELS.find(al => al.id === 'dexterity')?.label}</span>
                </Label>
                <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                  <p className={textStyleValueBig}>{detailedAbilityScores.dexterity.finalScore}</p>
                  <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-primary self-center" onClick={() => onOpenAbilityScoreBreakdownDialog('dexterity')} aria-label={UI_STRINGS.infoDialogAbilityBreakdownAriaLabel.replace("{abilityName}", ABILITY_LABELS.find(al => al.id === 'dexterity')?.label)}><Info /></Button>
                </div>
                <div className="flex flex-col items-center">
                  <Label className={textStyleSubtle}>{UI_STRINGS.abilityScoresFinalModifierLabel}</Label>
                  <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                    <p className={textStyleValueMedium}>{detailedAbilityScores.dexterity.finalScore >= 10 ? '+' : ''}{calculateAbilityModifier(detailedAbilityScores.dexterity.finalScore)}</p>
                    <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-primary self-center" onClick={() => handleOpenRollDialog('dexterity')} aria-label={UI_STRINGS.rollDialogAbilityCheckAriaLabel.replace("{abilityName}", ABILITY_LABELS.find(al => al.id === 'dexterity')?.label)}><Dices /></Button>
                  </div>
                </div>
                {!panelIsLocked && (
                  <div className={cn("w-full mt-auto", panelFieldVerticalGap)}>
                    <div className={cn("w-full", panelFieldVerticalGap)}>
                      <Label htmlFor="base-score-dexterity" className={cn(textStyleSubtle, "text-center block")}>{UI_STRINGS.abilityScoresBaseScoreLabel}</Label>
                      <Input id="base-score-dexterity" type="number" value={dex} onChange={(e) => setDex(parseInt(e.target.value, 10) || 1)} min={1} className="text-base text-center" disabled={panelIsLocked} />
                    </div>
                    <div className={cn("w-full", panelFieldVerticalGap)}>
                      <Label htmlFor="temp-mod-dexterity" className={cn(textStyleSubtle, "text-center block")}>{UI_STRINGS.abilityScoresTempModLabel}</Label>
                      <Input id="temp-mod-dexterity" type="number" value={dexMod} onChange={(e) => setDexMod(parseInt(e.target.value, 10) || 0)} className="text-base text-center" disabled={panelIsLocked} />
                    </div>
                  </div>
                )}
              </div>
              <div className={cn("flex flex-col border rounded-md bg-card", panelContentPadding, panelFieldVerticalGap)}>
                <Label htmlFor={!panelIsLocked ? `base-score-constitution` : undefined} className="text-center text-md font-medium flex flex-col items-center">
                  <span>{ABILITY_LABELS.find(al => al.id === 'constitution')?.abbr}</span>
                  <span className={textStyleSubtle}>{ABILITY_LABELS.find(al => al.id === 'constitution')?.label}</span>
                </Label>
                <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                  <p className={textStyleValueBig}>{detailedAbilityScores.constitution.finalScore}</p>
                  <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-primary self-center" onClick={() => onOpenAbilityScoreBreakdownDialog('constitution')} aria-label={UI_STRINGS.infoDialogAbilityBreakdownAriaLabel.replace("{abilityName}", ABILITY_LABELS.find(al => al.id === 'constitution')?.label)}><Info /></Button>
                </div>
                <div className="flex flex-col items-center">
                  <Label className={textStyleSubtle}>{UI_STRINGS.abilityScoresFinalModifierLabel}</Label>
                  <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                    <p className={textStyleValueMedium}>{detailedAbilityScores.constitution.finalScore >= 10 ? '+' : ''}{calculateAbilityModifier(detailedAbilityScores.constitution.finalScore)}</p>
                    <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-primary self-center" onClick={() => handleOpenRollDialog('constitution')} aria-label={UI_STRINGS.rollDialogAbilityCheckAriaLabel.replace("{abilityName}", ABILITY_LABELS.find(al => al.id === 'constitution')?.label)}><Dices /></Button>
                  </div>
                </div>
                {!panelIsLocked && (
                  <div className={cn("w-full mt-auto", panelFieldVerticalGap)}>
                    <div className={cn("w-full", panelFieldVerticalGap)}>
                      <Label htmlFor="base-score-constitution" className={cn(textStyleSubtle, "text-center block")}>{UI_STRINGS.abilityScoresBaseScoreLabel}</Label>
                      <Input id="base-score-constitution" type="number" value={con} onChange={(e) => setCon(parseInt(e.target.value, 10) || 1)} min={1} className="text-base text-center" disabled={panelIsLocked} />
                    </div>
                    <div className={cn("w-full", panelFieldVerticalGap)}>
                      <Label htmlFor="temp-mod-constitution" className={cn(textStyleSubtle, "text-center block")}>{UI_STRINGS.abilityScoresTempModLabel}</Label>
                      <Input id="temp-mod-constitution" type="number" value={conMod} onChange={(e) => setConMod(parseInt(e.target.value, 10) || 0)} className="text-base text-center" disabled={panelIsLocked} />
                    </div>
                  </div>
                )}
              </div>
              <div className={cn("flex flex-col border rounded-md bg-card", panelContentPadding, panelFieldVerticalGap)}>
                <Label htmlFor={!panelIsLocked ? `base-score-intelligence` : undefined} className="text-center text-md font-medium flex flex-col items-center">
                  <span>{ABILITY_LABELS.find(al => al.id === 'intelligence')?.abbr}</span>
                  <span className={textStyleSubtle}>{ABILITY_LABELS.find(al => al.id === 'intelligence')?.label}</span>
                </Label>
                <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                  <p className={textStyleValueBig}>{detailedAbilityScores.intelligence.finalScore}</p>
                  <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-primary self-center" onClick={() => onOpenAbilityScoreBreakdownDialog('intelligence')} aria-label={UI_STRINGS.infoDialogAbilityBreakdownAriaLabel.replace("{abilityName}", ABILITY_LABELS.find(al => al.id === 'intelligence')?.label)}><Info /></Button>
                </div>
                <div className="flex flex-col items-center">
                  <Label className={textStyleSubtle}>{UI_STRINGS.abilityScoresFinalModifierLabel}</Label>
                  <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                    <p className={textStyleValueMedium}>{detailedAbilityScores.intelligence.finalScore >= 10 ? '+' : ''}{calculateAbilityModifier(detailedAbilityScores.intelligence.finalScore)}</p>
                    <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-primary self-center" onClick={() => handleOpenRollDialog('intelligence')} aria-label={UI_STRINGS.rollDialogAbilityCheckAriaLabel.replace("{abilityName}", ABILITY_LABELS.find(al => al.id === 'intelligence')?.label)}><Dices /></Button>
                  </div>
                </div>
                {!panelIsLocked && (
                  <div className={cn("w-full mt-auto", panelFieldVerticalGap)}>
                    <div className={cn("w-full", panelFieldVerticalGap)}>
                      <Label htmlFor="base-score-intelligence" className={cn(textStyleSubtle, "text-center block")}>{UI_STRINGS.abilityScoresBaseScoreLabel}</Label>
                      <Input id="base-score-intelligence" type="number" value={int} onChange={(e) => setInt(parseInt(e.target.value, 10) || 1)} min={1} className="text-base text-center" disabled={panelIsLocked} />
                    </div>
                    <div className={cn("w-full", panelFieldVerticalGap)}>
                      <Label htmlFor="temp-mod-intelligence" className={cn(textStyleSubtle, "text-center block")}>{UI_STRINGS.abilityScoresTempModLabel}</Label>
                      <Input id="temp-mod-intelligence" type="number" value={intMod} onChange={(e) => setIntMod(parseInt(e.target.value, 10) || 0)} className="text-base text-center" disabled={panelIsLocked} />
                    </div>
                  </div>
                )}
              </div>
              <div className={cn("flex flex-col border rounded-md bg-card", panelContentPadding, panelFieldVerticalGap)}>
                <Label htmlFor={!panelIsLocked ? `base-score-wisdom` : undefined} className="text-center text-md font-medium flex flex-col items-center">
                  <span>{ABILITY_LABELS.find(al => al.id === 'wisdom')?.abbr}</span>
                  <span className={textStyleSubtle}>{ABILITY_LABELS.find(al => al.id === 'wisdom')?.label}</span>
                </Label>
                <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                  <p className={textStyleValueBig}>{detailedAbilityScores.wisdom.finalScore}</p>
                  <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-primary self-center" onClick={() => onOpenAbilityScoreBreakdownDialog('wisdom')} aria-label={UI_STRINGS.infoDialogAbilityBreakdownAriaLabel.replace("{abilityName}", ABILITY_LABELS.find(al => al.id === 'wisdom')?.label)}><Info /></Button>
                </div>
                <div className="flex flex-col items-center">
                  <Label className={textStyleSubtle}>{UI_STRINGS.abilityScoresFinalModifierLabel}</Label>
                  <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                    <p className={textStyleValueMedium}>{detailedAbilityScores.wisdom.finalScore >= 10 ? '+' : ''}{calculateAbilityModifier(detailedAbilityScores.wisdom.finalScore)}</p>
                    <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-primary self-center" onClick={() => handleOpenRollDialog('wisdom')} aria-label={UI_STRINGS.rollDialogAbilityCheckAriaLabel.replace("{abilityName}", ABILITY_LABELS.find(al => al.id === 'wisdom')?.label)}><Dices /></Button>
                  </div>
                </div>
                {!panelIsLocked && (
                  <div className={cn("w-full mt-auto", panelFieldVerticalGap)}>
                    <div className={cn("w-full", panelFieldVerticalGap)}>
                      <Label htmlFor="base-score-wisdom" className={cn(textStyleSubtle, "text-center block")}>{UI_STRINGS.abilityScoresBaseScoreLabel}</Label>
                      <Input id="base-score-wisdom" type="number" value={wis} onChange={(e) => setWis(parseInt(e.target.value, 10) || 1)} min={1} className="text-base text-center" disabled={panelIsLocked} />
                    </div>
                    <div className={cn("w-full", panelFieldVerticalGap)}>
                      <Label htmlFor="temp-mod-wisdom" className={cn(textStyleSubtle, "text-center block")}>{UI_STRINGS.abilityScoresTempModLabel}</Label>
                      <Input id="temp-mod-wisdom" type="number" value={wisMod} onChange={(e) => setWisMod(parseInt(e.target.value, 10) || 0)} className="text-base text-center" disabled={panelIsLocked} />
                    </div>
                  </div>
                )}
              </div>
              <div className={cn("flex flex-col border rounded-md bg-card", panelContentPadding, panelFieldVerticalGap)}>
                <Label htmlFor={!panelIsLocked ? `base-score-charisma` : undefined} className="text-center text-md font-medium flex flex-col items-center">
                  <span>{ABILITY_LABELS.find(al => al.id === 'charisma')?.abbr}</span>
                  <span className={textStyleSubtle}>{ABILITY_LABELS.find(al => al.id === 'charisma')?.label}</span>
                </Label>
                <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                  <p className={textStyleValueBig}>{detailedAbilityScores.charisma.finalScore}</p>
                  <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-primary self-center" onClick={() => onOpenAbilityScoreBreakdownDialog('charisma')} aria-label={UI_STRINGS.infoDialogAbilityBreakdownAriaLabel.replace("{abilityName}", ABILITY_LABELS.find(al => al.id === 'charisma')?.label)}><Info /></Button>
                </div>
                <div className="flex flex-col items-center">
                  <Label className={textStyleSubtle}>{UI_STRINGS.abilityScoresFinalModifierLabel}</Label>
                  <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                    <p className={textStyleValueMedium}>{detailedAbilityScores.charisma.finalScore >= 10 ? '+' : ''}{calculateAbilityModifier(detailedAbilityScores.charisma.finalScore)}</p>
                    <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-primary self-center" onClick={() => handleOpenRollDialog('charisma')} aria-label={UI_STRINGS.rollDialogAbilityCheckAriaLabel.replace("{abilityName}", ABILITY_LABELS.find(al => al.id === 'charisma')?.label)}><Dices /></Button>
                  </div>
                </div>
                {!panelIsLocked && (
                  <div className={cn("w-full mt-auto", panelFieldVerticalGap)}>
                    <div className={cn("w-full", panelFieldVerticalGap)}>
                      <Label htmlFor="base-score-charisma" className={cn(textStyleSubtle, "text-center block")}>{UI_STRINGS.abilityScoresBaseScoreLabel}</Label>
                      <Input id="base-score-charisma" type="number" value={cha} onChange={(e) => setCha(parseInt(e.target.value, 10) || 1)} min={1} className="text-base text-center" disabled={panelIsLocked} />
                    </div>
                    <div className={cn("w-full", panelFieldVerticalGap)}>
                      <Label htmlFor="temp-mod-charisma" className={cn(textStyleSubtle, "text-center block")}>{UI_STRINGS.abilityScoresTempModLabel}</Label>
                      <Input id="temp-mod-charisma" type="number" value={chaMod} onChange={(e) => setChaMod(parseInt(e.target.value, 10) || 0)} className="text-base text-center" disabled={panelIsLocked} />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {!panelIsLocked && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => setIsRollerDialogOpen(true)}
                  disabled={panelIsLocked}
                  className="w-full lg:col-start-5"
                >
                  <Dices /> {UI_STRINGS.abilityScoresRollButton}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => setIsPointBuyDialogOpen(true)}
                  disabled={panelIsLocked || typeof pointBuyBudget !== 'number'}
                  className="w-full"
                >
                  <Calculator /> {UI_STRINGS.abilityScoresPointBuyButton}
                </Button>
              </div>
            )}
          </>
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
