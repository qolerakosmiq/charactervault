
'use client';

import *as React from 'react';
import type {
  FeatDefinitionJsonData, CharacterFeatInstance, Character, AbilityScores, Skill as SkillType,
  SkillDefinitionJsonData, FeatTypeString, AvailableFeatSlotsBreakdown, AggregatedFeatEffects, ComboboxOption, NoteEffectDetail, LocalizedString, DndClassOption,
  DndRaceId, CharacterSize
} from '@/types/character-core';
import {
  checkFeatPrerequisites,
  calculateAvailableFeats,
  calculateTotalSynergyBonus,
  calculateRacialSkillBonus,
  calculateSizeSpecificSkillBonus,
  getRaceSkillPointsBonusPerLevel
} from '@/types/character';
import type { CustomSkillDefinition, CustomSynergyRule } from '@/lib/definitions-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollText, Info, Loader2, Dices, Lock, Unlock } from 'lucide-react';
import { getAbilityModifierByName } from '@/lib/dnd-utils';
import { calculateMaxRanks } from '@/lib/constants';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn, parseAndRenderUIString } from '@/lib/utils';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import type { RollDialogProps } from '@/components/RollDialog';
import type { GenericBreakdownItem } from '@/types/character-core';
import type { AggregatedFeatEffects as AggFeatsType } from '@/types/character-core';
import { useDefinitionsStore } from '@/lib/definitions-store';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper';


const DEBOUNCE_DELAY_SKILLS = 500; // ms

interface SkillDisplayInfo extends SkillType {
  name: string;
  keyAbility: AbilityName;
  description?: string;
  isCustom: boolean;
  definitionProvidesSynergies?: CustomSynergyRule[];
}

export interface SkillModifierBreakdownDetails {
  skillName: string;
  keyAbilityName?: string;
  keyAbilityModifier: number;
  ranks: number;
  synergyBonus: number;
  featBonus: number;
  racialBonus: number;
  sizeSpecificBonus: number;
  miscModifier: number;
  totalBonus: number;
}

export interface SkillsFormSectionProps {
  skillsData: Pick<Character, 'skills' | 'classes' | 'race' | 'size' | 'feats'>;
  actualAbilityScores: AbilityScores;
  allFeatDefinitions: (FeatDefinitionJsonData & {isCustom?: boolean})[];
  allPredefinedSkillDefinitions: readonly SkillDefinitionJsonData[];
  allCustomSkillDefinitions: readonly CustomSkillDefinition[];
  onSkillChange: (skillId: string, ranks: number, isClassSkill?: boolean) => void;
  onEditCustomSkillDefinition: (skillDefId: string) => void;
  onOpenSkillInfoDialog: (skillId: string) => void;
  onOpenRollDialog: (data: Omit<RollDialogProps, 'isOpen' | 'onOpenChange' | 'onRoll'>) => void;
  characterLevel: number;
  aggregatedFeatEffects: AggFeatsType | null;
}


// Helper component for a single skill row to encapsulate its debounced field
const DebouncedSkillRankInput: React.FC<{
  skillProp: SkillType; 
  onDebouncedRankChange: (newRank: number) => void; 
  currentStepForInput: number;
  maxRanksValue: number;
  disabled?: boolean;
}> = ({ skillProp, onDebouncedRankChange, currentStepForInput, maxRanksValue, disabled }) => {

  const [localRank, setLocalRank] = useDebouncedFormField(
    skillProp.ranks || 0,
    onDebouncedRankChange,
    DEBOUNCE_DELAY_SKILLS
  );

  return (
    <NumberSpinnerInput
      id={`skill_ranks_${skillProp.id}`}
      value={localRank}
      onChange={setLocalRank}
      min={0}
      step={currentStepForInput}
      inputClassName="w-14 h-7 text-sm"
      buttonSize="sm"
      buttonClassName="h-7 w-7"
      disabled={disabled}
    />
  );
};


const SkillsFormSectionComponent = ({
  skillsData,
  actualAbilityScores,
  allFeatDefinitions,
  allPredefinedSkillDefinitions,
  allCustomSkillDefinitions,
  onSkillChange,
  onEditCustomSkillDefinition,
  onOpenSkillInfoDialog,
  onOpenRollDialog,
  characterLevel,
  aggregatedFeatEffects,
}: SkillsFormSectionProps) => {
  const { translations, isLoading: translationsLoading } = useI18n();
  const { rerollTwentiesForChecks } = useDefinitionsStore(state => ({
    rerollTwentiesForChecks: state.rerollTwentiesForChecks,
  }));
  
  const characterSkillInstances = skillsData.skills;
  const characterClasses = skillsData.classes;
  const characterRace = skillsData.race as DndRaceId;
  const characterSize = skillsData.size as CharacterSize;

  const firstClass = characterClasses[0];

  const skillPointCalcData = React.useMemo(() => {
    if (translationsLoading || !translations) {
      return { totalSkillPointsAvailable: 0, skillPointsLeft: 0, classLabel: "", baseSkillPointsForClass: 0, racialBonusSkillPoints: 0, intelligenceModifier: 0, pointsForFirstLevel: 0, pointsFromLevelProgression: 0, totalSkillPointsSpent: 0, progressionLevels: 0, intelligenceAbilityLabel: "INT" };
    }

    const { CLASS_SKILL_POINTS_BASE, DND_CLASSES, DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA, UI_STRINGS, ABILITY_LABELS } = translations;
    const currentClassDef = firstClass?.className ? DND_CLASSES.find(c => c.id === firstClass.className) : undefined;
    const currentClassLabel = currentClassDef?.label || (firstClass?.className || "");
    const intelligenceAbilityLabel = ABILITY_LABELS.find(al => al.id === 'intelligence')?.label || 'Intelligence';

    const currentIntMod = (actualAbilityScores && actualAbilityScores.intelligence !== undefined)
      ? getAbilityModifierByName(actualAbilityScores, 'intelligence')
      : 0;
    const currentBaseSkillPoints = firstClass?.className ? (CLASS_SKILL_POINTS_BASE[firstClass.className as keyof typeof CLASS_SKILL_POINTS_BASE] || 0) : 0;
    const currentRacialBonus = characterRace ? getRaceSkillPointsBonusPerLevel(characterRace, DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA) : 0;

    const pointsPerLevelBeforeMin = currentBaseSkillPoints + currentIntMod + currentRacialBonus;
    const pointsPerRegularLevel = Math.max(1, pointsPerLevelBeforeMin);

    const currentPointsForFirstLevel = characterLevel >= 1 ? pointsPerRegularLevel * 4 : 0;
    const progressionLevelsCalc = characterLevel > 1 ? (characterLevel - 1) : 0;
    const currentPointsFromLevelProgression = progressionLevelsCalc * pointsPerRegularLevel;
    const currentTotalSkillPointsAvailable = currentPointsForFirstLevel + currentPointsFromLevelProgression;

    const currentTotalSkillPointsSpent = characterSkillInstances.reduce((acc, currentSkill) => {
      let costMultiplier = 1;
      if (!currentSkill.isClassSkill) {
        costMultiplier = 2;
      }
      const rankForCalc = currentSkill.ranks || 0;
      return acc + (rankForCalc * costMultiplier);
    }, 0);
    const currentSkillPointsLeft = currentTotalSkillPointsAvailable - currentTotalSkillPointsSpent;

    return {
      totalSkillPointsAvailable: currentTotalSkillPointsAvailable,
      skillPointsLeft: currentSkillPointsLeft,
      classLabel: currentClassLabel,
      baseSkillPointsForClass: currentBaseSkillPoints,
      racialBonusSkillPoints: currentRacialBonus,
      intelligenceModifier: currentIntMod,
      intelligenceAbilityLabel, 
      pointsForFirstLevel: currentPointsForFirstLevel,
      pointsFromLevelProgression: currentPointsFromLevelProgression,
      totalSkillPointsSpent: currentTotalSkillPointsSpent,
      progressionLevels: progressionLevelsCalc,
    };
  }, [
    translationsLoading,
    translations,
    firstClass?.className,
    characterRace,
    actualAbilityScores,
    characterLevel,
    characterSkillInstances,
  ]);


  const allCombinedSkillDefinitions = React.useMemo(() => {
    if (translationsLoading || !translations) return [];
    const { SKILL_SYNERGIES } = translations;
    const predefined = allPredefinedSkillDefinitions.map(sd => ({
      id: sd.id,
      name: sd.label,
      keyAbility: sd.keyAbility as AbilityName,
      description: sd.description,
      isCustom: false,
      providesSynergies: SKILL_SYNERGIES[sd.id as keyof typeof SKILL_SYNERGIES] || [],
    }));
    const custom = allCustomSkillDefinitions.map(csd => ({
      ...csd,
      isCustom: true,
    }));
    return [...predefined, ...custom].sort((a,b) => a.name.localeCompare(b.name));
  }, [translationsLoading, translations, allPredefinedSkillDefinitions, allCustomSkillDefinitions]);

  const skillsForDisplay: SkillDisplayInfo[] = React.useMemo(() => {
    return characterSkillInstances.map(instance => {
      const definition = allCombinedSkillDefinitions.find(def => def.id === instance.id);
      return {
        ...instance,
        name: definition?.name || 'Unknown Skill',
        keyAbility: definition?.keyAbility || 'none',
        description: definition?.description,
        isCustom: definition?.isCustom || false,
        providesSynergies: definition?.providesSynergies,
      };
    }).sort((a,b) => a.name.localeCompare(b.name));
  }, [characterSkillInstances, allCombinedSkillDefinitions]);

  const validSkillsForDisplay = React.useMemo(() => {
    return skillsForDisplay.filter(skill => skill && typeof skill.id === 'string' && skill.id.trim() !== '');
  }, [skillsForDisplay]);


  const handleTriggerSkillInfoDialog = (skillId: string) => {
    onOpenSkillInfoDialog(skillId);
  };

  const handleTriggerSkillRollDialog = (skillId: string) => {
    if (!translations || !actualAbilityScores || !aggregatedFeatEffects) {
        throw new Error("Translations, ability scores, or feat effects not loaded for skill roll dialog.");
    }
    const skillDef = allCombinedSkillDefinitions.find(def => def.id === skillId);
    const skillInstance = characterSkillInstances.find(s => s.id === skillId);
    if (!skillDef || !skillInstance) {
      throw new Error(`Skill definition or instance not found for ID: ${skillId}`);
    }

    const { UI_STRINGS, ABILITY_LABELS, DND_RACES, SKILL_DEFINITIONS, SKILL_SYNERGIES, SIZES } = translations;

    const keyAbility = skillDef.keyAbility;
    const abilityMod = (keyAbility && keyAbility !== 'none') ? getAbilityModifierByName(actualAbilityScores, keyAbility) : 0;
    const synergyBonus = calculateTotalSynergyBonus(skillDef.id, characterSkillInstances, SKILL_DEFINITIONS, SKILL_SYNERGIES, allCustomSkillDefinitions);
    const featSkillBonus = aggregatedFeatEffects.skillBonuses[skillDef.id] || 0;
    const currentRacialBonus = calculateRacialSkillBonus(skillDef.id, characterRace, DND_RACES, SKILL_DEFINITIONS);
    const currentSizeSpecificBonus = calculateSizeSpecificSkillBonus(skillDef.id, characterSize, SIZES);
    const userMiscMod = skillInstance.miscModifier || 0;

    const totalBonus = (skillInstance.ranks || 0) + abilityMod + synergyBonus + featSkillBonus + currentRacialBonus + currentSizeSpecificBonus + userMiscMod;
    const keyAbilityName = keyAbility && keyAbility !== 'none' ? (ABILITY_LABELS.find(al => al.id === keyAbility)?.abbr || keyAbility.toUpperCase()) : 'N/A';

    const breakdown: GenericBreakdownItem[] = [
      { label: UI_STRINGS.rollDialogSkillRanksLabel, value: skillInstance.ranks || 0 },
    ];
    if (keyAbility !== 'none') {
      breakdown.push({ label: UI_STRINGS.rollDialogSkillKeyAbilityLabel.replace("{abilityAbbr}", keyAbilityName), value: abilityMod });
    }
    if (synergyBonus !== 0) breakdown.push({ label: UI_STRINGS.rollDialogSkillSynergyBonusLabel, value: synergyBonus });
    if (featSkillBonus !== 0) breakdown.push({ label: UI_STRINGS.rollDialogSkillFeatBonusLabel, value: featSkillBonus });
    if (currentRacialBonus !== 0) breakdown.push({ label: UI_STRINGS.rollDialogSkillRacialBonusLabel, value: currentRacialBonus });
    if (currentSizeSpecificBonus !== 0) breakdown.push({ label: UI_STRINGS.rollDialogSkillSizeBonusLabel, value: currentSizeSpecificBonus });
    if (userMiscMod !== 0) breakdown.push({ label: UI_STRINGS.rollDialogSkillUserMiscModLabel, value: userMiscMod });

    breakdown.push({ label: UI_STRINGS.infoDialogTotalLabel, value: totalBonus, isBold: true });

    onOpenRollDialog({
      dialogTitle: UI_STRINGS.rollDialogTitleSkillCheck.replace("{skillName}", skillDef.name),
      rollType: `skill_check_${skillDef.id}`,
      baseModifier: totalBonus,
      calculationBreakdown: breakdown,
      rerollTwentiesForChecks: rerollTwentiesForChecks,
    });
  };


  if (translationsLoading || !translations || !aggregatedFeatEffects) {
    return (
      <LockablePanelWrapper
        title={translations?.UI_STRINGS.skillsPanelTitle || "Skills"}
        description={translations?.UI_STRINGS.skillsPanelDescription || "Allocate skill points based on your class and Intelligence."}
        icon={ScrollText}
        initialLockedState={false}
      >
        {() => (
          <CardContent>
            <Skeleton className="h-16 w-full mb-4" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-8 w-full mb-1" />
            <Skeleton className="h-8 w-full mb-1" />
            <Skeleton className="h-8 w-full mb-1" />
          </CardContent>
        )}
      </LockablePanelWrapper>
    );
  }
  const { DND_CLASSES, DND_RACES, SKILL_DEFINITIONS, CLASS_SKILLS, SKILL_SYNERGIES, SIZES, UI_STRINGS, ABILITY_LABELS } = translations;
  
  const racialBonusPartForContext = skillPointCalcData.racialBonusSkillPoints !== 0
    ? UI_STRINGS.skillPointRacialBonusPartFormat // Pass the raw string with placeholder
    : "";

  const formulaContextLine1 = {
      classLabel: skillPointCalcData.classLabel,
      baseSkillPointsForClass: skillPointCalcData.baseSkillPointsForClass,
      intelligenceAbilityLabel: skillPointCalcData.intelligenceAbilityLabel,
      intelligenceModifier: skillPointCalcData.intelligenceModifier,
      racialBonusPart: racialBonusPartForContext,
      racialBonusSkillPoints: skillPointCalcData.racialBonusSkillPoints, // Also provide the raw number for the badge in racialBonusPart
      pointsForFirstLevel: skillPointCalcData.pointsForFirstLevel,
  };
  const formulaContextLine2 = {
      classLabel: skillPointCalcData.classLabel,
      baseSkillPointsForClass: skillPointCalcData.baseSkillPointsForClass,
      intelligenceAbilityLabel: skillPointCalcData.intelligenceAbilityLabel,
      intelligenceModifier: skillPointCalcData.intelligenceModifier,
      racialBonusPart: racialBonusPartForContext,
      racialBonusSkillPoints: skillPointCalcData.racialBonusSkillPoints, // Also provide the raw number
      progressionLevels: skillPointCalcData.progressionLevels,
      pointsFromLevelProgression: skillPointCalcData.pointsFromLevelProgression,
  };


  return (
    <LockablePanelWrapper
      title={UI_STRINGS.skillsPanelTitle || "Skills"}
      description={UI_STRINGS.skillsPanelDescription || "Allocate skill points based on your class and Intelligence."}
      icon={ScrollText}
      initialLockedState={false}
    >
      {({ isLocked: panelIsLocked }) => (
        <CardContent>
          <div className="mb-4 p-3 border rounded-md bg-muted/30">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">
                {UI_STRINGS.skillPointsAvailableLabel}<span className="text-xl font-bold text-primary">{skillPointCalcData.totalSkillPointsAvailable}</span>
              </p>
              <p className="text-sm font-medium">
                {UI_STRINGS.skillPointsLeftLabel}<span className={cn(
                  "text-xl font-bold",
                  skillPointCalcData.skillPointsLeft > 0 && "text-emerald-500",
                  skillPointCalcData.skillPointsLeft < 0 && "text-destructive",
                  skillPointCalcData.skillPointsLeft === 0 && "text-accent"
                )}>{skillPointCalcData.skillPointsLeft}</span>
              </p>
            </div>
            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
              {firstClass?.className && skillPointCalcData.classLabel ? (
                <>
                  <p>{parseAndRenderUIString(UI_STRINGS.skillPointFormulaLine1, formulaContextLine1)}</p>
                  <p>{parseAndRenderUIString(UI_STRINGS.skillPointFormulaLine2, formulaContextLine2)}</p>
                  <p className="italic">{UI_STRINGS.skillPointFormulaMinOneNote}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {UI_STRINGS.skillPointFormulaSelectClassPrompt}
                </p>
              )}
            </div>
          </div>
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-muted scrollbar-thumb-rounded-md scrollbar-track-rounded-md">
            <div className="space-y-1 min-w-[720px]">
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto_auto_auto] gap-x-2 px-1 py-2 items-center font-semibold border-b bg-background sticky top-0 z-10 text-sm">
                <span className="text-center w-10" dangerouslySetInnerHTML={{ __html: UI_STRINGS.skillsTableClassHeader }} />
                <span className="pl-1">{UI_STRINGS.skillsTableSkillHeader}</span>
                <span className="text-right w-10 pr-1">{UI_STRINGS.skillsTableTotalBonusHeader}</span>
                <span className="w-14"></span>
                <span className="text-center w-10" dangerouslySetInnerHTML={{ __html: UI_STRINGS.skillsTableKeyAbilityHeader }} />
                <span className="text-center w-12">{UI_STRINGS.skillsTableAbilityModHeader}</span>
                <span className="text-center w-12">{UI_STRINGS.skillsTableMiscModHeader}</span>
                <span className="text-center w-32">{UI_STRINGS.skillsTableRanksHeader}</span>
                <span className="text-center w-12">{UI_STRINGS.skillsTableCostHeader}</span>
                <span className="text-center w-10">{UI_STRINGS.skillsTableMaxHeader}</span>
              </div>

              {validSkillsForDisplay.map(skillInstanceProp => {
                const skillDef = allCombinedSkillDefinitions.find(def => def.id === skillInstanceProp.id);
                if (!skillDef) throw new Error(`Skill definition for ID '${skillInstanceProp.id}' not found in allCombinedSkillDefinitions.`);

                const keyAbility = skillDef.keyAbility;
                const abilityLabelInfo = ABILITY_LABELS.find(al => al.id === keyAbility);

                let keyAbilityDisplay = '';
                if (keyAbility && keyAbility !== 'none' && abilityLabelInfo) {
                  keyAbilityDisplay = abilityLabelInfo.abbr;
                } else if (keyAbility === 'none') {
                  keyAbilityDisplay = ''; 
                }

                const baseAbilityMod = (keyAbility && keyAbility !== 'none')
                  ? getAbilityModifierByName(actualAbilityScores, keyAbility)
                  : 0;

                const synergyBonus = calculateTotalSynergyBonus(skillDef.id, characterSkillInstances, SKILL_DEFINITIONS, SKILL_SYNERGIES, allCustomSkillDefinitions);
                const featSkillBonus = aggregatedFeatEffects.skillBonuses[skillDef.id] || 0;
                const currentRacialBonus = calculateRacialSkillBonus(skillDef.id, characterRace, DND_RACES, SKILL_DEFINITIONS);
                const currentSizeSpecificBonus = calculateSizeSpecificSkillBonus(skillDef.id, characterSize, SIZES);
                const calculatedMiscModifier = synergyBonus + featSkillBonus + currentRacialBonus + currentSizeSpecificBonus;
                const committedRankValue = skillInstanceProp.ranks || 0;
                const totalBonus = committedRankValue + baseAbilityMod + calculatedMiscModifier + (skillInstanceProp.miscModifier || 0);
                const maxRanksValue = calculateMaxRanks(characterLevel, skillInstanceProp.isClassSkill || false, skillPointCalcData.intelligenceModifier);
                const skillCostDisplay = (skillDef.keyAbility === 'none' || skillInstanceProp.isClassSkill) ? 1 : 2;
                const currentStepForInput = (skillDef.keyAbility === 'none' || skillInstanceProp.isClassSkill) ? 1 : 0.5;

                return (
                  <div key={skillInstanceProp.id} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto_auto_auto] gap-x-2 px-1 py-1.5 items-center border-b border-border/50 transition-colors text-sm">
                    <div className="flex justify-center w-10">
                      <Checkbox
                        id={`skill_class_${skillInstanceProp.id}`}
                        checked={skillInstanceProp.isClassSkill}
                        onCheckedChange={(checked) => {
                            onSkillChange(skillInstanceProp.id, skillInstanceProp.ranks || 0, !!checked);
                        }}
                        className="h-3.5 w-3.5"
                        disabled={panelIsLocked}
                      />
                    </div>
                    <div className="flex items-center">
                        <Label htmlFor={`skill_ranks_${skillInstanceProp.id}`} className="text-sm pr-1 leading-tight flex-grow flex items-center">
                            {skillDef.name}
                            {skillDef.isCustom && (<>{'\u00A0'}<Badge variant="outline">{UI_STRINGS.badgeCustomLabel}</Badge></>)}
                        </Label>
                    </div>
                    <span className="font-bold text-accent text-xl w-10 text-right pr-1">{totalBonus >= 0 ? '+' : ''}{totalBonus}</span>
                    <div className="flex items-center justify-start w-14">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => handleTriggerSkillInfoDialog(skillInstanceProp.id)}
                        aria-label={UI_STRINGS.skillsTableTooltipInfoForSkill.replace("{skillName}", skillDef.name)}
                        disabled={panelIsLocked}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                       <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-primary"
                          onClick={() => handleTriggerSkillRollDialog(skillInstanceProp.id)}
                          aria-label={UI_STRINGS.rollDialogSkillCheckAriaLabel.replace("{skillName}", skillDef.name)}
                          disabled={panelIsLocked}
                        >
                          <Dices className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-sm text-muted-foreground text-center w-10">
                      {keyAbilityDisplay ? <Badge variant="outline" className="font-normal">{keyAbilityDisplay}</Badge> : ''}
                    </span>
                    <span className="text-sm text-center w-12">{baseAbilityMod >= 0 ? '+' : ''}{baseAbilityMod}</span>
                    <span className="text-sm text-center w-12">{calculatedMiscModifier >= 0 ? '+' : ''}{calculatedMiscModifier}</span>
                    <div className="w-32 flex justify-center">
                      <DebouncedSkillRankInput
                        skillProp={skillInstanceProp}
                        currentStepForInput={currentStepForInput}
                        maxRanksValue={maxRanksValue}
                        onDebouncedRankChange={(newRank) => onSkillChange(skillInstanceProp.id, newRank, skillInstanceProp.isClassSkill)}
                        disabled={panelIsLocked}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground text-center w-12">{skillCostDisplay}</span>
                    <span className={cn(
                        "text-sm text-center w-10",
                        (skillInstanceProp.ranks || 0) > maxRanksValue ? "text-destructive font-bold" : "text-muted-foreground"
                      )}>
                        {maxRanksValue}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      )}
    </LockablePanelWrapper>
  );
};
SkillsFormSectionComponent.displayName = 'SkillsFormSectionComponent';

export const SkillsFormSection = React.memo(SkillsFormSectionComponent);

    
    
    


