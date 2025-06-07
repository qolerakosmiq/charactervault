
'use client';

import *as React from 'react';
import type { AbilityScores, CharacterClass, Skill as SkillType, AbilityName, DndRaceId, CustomSynergyRule, CharacterFeatInstance, DndRaceOption, SkillDefinitionJsonData, FeatDefinitionJsonData, CharacterSize, InfoDialogContentType, Character } from '@/types/character';
import { getRaceSkillPointsBonusPerLevel, calculateTotalSynergyBonus, calculateFeatBonusesForSkill, calculateRacialSkillBonus, calculateSizeSpecificSkillBonus } from '@/types/character';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollText, Pencil, Info, Loader2 } from 'lucide-react';
import { getAbilityModifierByName } from '@/lib/dnd-utils';
import { calculateMaxRanks } from '@/lib/constants';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { CustomSkillDefinition } from '@/lib/definitions-store';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';

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

interface SkillsFormSectionProps {
  character: Pick<Character, 'skills' | 'abilityScores' | 'classes' | 'race' | 'size' | 'feats'>;
  actualAbilityScores: AbilityScores;
  allFeatDefinitions: (FeatDefinitionJsonData & {isCustom?: boolean})[];
  allPredefinedSkillDefinitions: readonly SkillDefinitionJsonData[];
  allCustomSkillDefinitions: readonly CustomSkillDefinition[];
  onSkillChange: (skillId: string, ranks: number, isClassSkill?: boolean) => void;
  onEditCustomSkillDefinition: (skillDefId: string) => void;
  onOpenSkillInfoDialog: (skillId: string) => void;
}


// Helper component for a single skill row to encapsulate its debounced field
const DebouncedSkillRankInput: React.FC<{
  skillProp: SkillType; // Renamed to avoid conflict
  onDebouncedRankChange: (newRank: number) => void; // Callback for debounced change
  currentStepForInput: number;
  maxRanksValue: number;
}> = ({ skillProp, onDebouncedRankChange, currentStepForInput, maxRanksValue }) => {
  
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
      max={maxRanksValue}
      step={currentStepForInput}
      inputClassName="w-14 h-7 text-sm"
      buttonSize="sm"
      buttonClassName="h-7 w-7"
    />
  );
};


export function SkillsFormSection({
  character,
  actualAbilityScores,
  allFeatDefinitions,
  allPredefinedSkillDefinitions,
  allCustomSkillDefinitions,
  onSkillChange,
  onEditCustomSkillDefinition,
  onOpenSkillInfoDialog,
}: SkillsFormSectionProps) {
  const { translations, isLoading: translationsLoading } = useI18n();

  const characterSkillInstances = character.skills;
  const characterClasses = character.classes;
  const characterRace = character.race as DndRaceId;
  const characterSize = character.size as CharacterSize;
  const selectedFeats = character.feats;

  const firstClass = characterClasses[0];
  const characterLevel = firstClass?.level || 1;

  const {
    totalSkillPointsAvailable,
    skillPointsLeft,
    classLabel,
    baseSkillPointsForClass,
    racialBonusSkillPoints,
    intelligenceModifier,
    pointsForFirstLevel,
    pointsFromLevelProgression,
  } = React.useMemo(() => {
    if (translationsLoading || !translations) {
      return { totalSkillPointsAvailable: 0, skillPointsLeft: 0, classLabel: "", baseSkillPointsForClass: 0, racialBonusSkillPoints: 0, intelligenceModifier: 0, pointsForFirstLevel: 0, pointsFromLevelProgression: 0, totalSkillPointsSpent: 0 };
    }

    const { CLASS_SKILL_POINTS_BASE, DND_CLASSES, DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA } = translations;

    const currentClassLabel = firstClass?.className ? DND_CLASSES.find(c => c.value === firstClass.className)?.label || firstClass.className : "";
    const currentIntMod = (actualAbilityScores && actualAbilityScores.intelligence !== undefined)
      ? getAbilityModifierByName(actualAbilityScores, 'intelligence')
      : 0;
    const currentBaseSkillPoints = firstClass?.className ? (CLASS_SKILL_POINTS_BASE[firstClass.className as keyof typeof CLASS_SKILL_POINTS_BASE] || 0) : 0;
    const currentRacialBonus = characterRace ? getRaceSkillPointsBonusPerLevel(characterRace, DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA) : 0;

    const pointsPerLevelBeforeMin = currentBaseSkillPoints + currentIntMod + currentRacialBonus;
    const pointsPerRegularLevel = Math.max(1, pointsPerLevelBeforeMin);

    const currentPointsForFirstLevel = pointsPerRegularLevel * 4;
    const currentPointsFromLevelProgression = characterLevel > 1 ? pointsPerRegularLevel * (characterLevel - 1) : 0;
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
      pointsForFirstLevel: currentPointsForFirstLevel,
      pointsFromLevelProgression: currentPointsFromLevelProgression,
      totalSkillPointsSpent: currentTotalSkillPointsSpent,
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
      id: sd.value,
      name: sd.label,
      keyAbility: sd.keyAbility as AbilityName,
      description: sd.description,
      isCustom: false,
      providesSynergies: SKILL_SYNERGIES[sd.value as keyof typeof SKILL_SYNERGIES] || [],
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
        definitionProvidesSynergies: definition?.providesSynergies,
      };
    }).sort((a,b) => a.name.localeCompare(b.name));
  }, [characterSkillInstances, allCombinedSkillDefinitions]);


  const handleOpenEditDialog = (skillDisplayInfo: SkillDisplayInfo) => {
    if (skillDisplayInfo.isCustom) {
      onEditCustomSkillDefinition(skillDisplayInfo.id);
    }
  };

  const handleTriggerSkillInfoDialog = (skillId: string) => {
    onOpenSkillInfoDialog(skillId);
  };

  const badgeClassName = "text-primary border-primary font-bold px-1.5 py-0 text-xs whitespace-nowrap";

  if (translationsLoading || !translations) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <ScrollText className="h-8 w-8 text-primary" />
            <div><Skeleton className="h-7 w-20 mb-1" /><Skeleton className="h-4 w-48" /></div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full mb-4" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-8 w-full mb-1" />
          <Skeleton className="h-8 w-full mb-1" />
          <Skeleton className="h-8 w-full mb-1" />
        </CardContent>
      </Card>
    );
  }
  const { DND_CLASSES, DND_RACES, SKILL_DEFINITIONS, CLASS_SKILLS, SKILL_SYNERGIES, SIZES, UI_STRINGS, ABILITY_LABELS } = translations;

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <ScrollText className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-serif">{UI_STRINGS.skillsPanelTitle || "Skills"}</CardTitle>
            <CardDescription>
              {UI_STRINGS.skillsPanelDescription || "Invest points in your character's abilities."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 border rounded-md bg-muted/30">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">
              {UI_STRINGS.skillPointsAvailableLabel || "Skill Points Available:"} <span className="text-lg font-bold text-primary">{totalSkillPointsAvailable}</span>
            </p>
            <p className="text-sm font-medium">
              {UI_STRINGS.skillPointsLeftLabel || "Skill Points Left:"} <span className={cn(
                "text-lg font-bold",
                skillPointsLeft > 0 && "text-emerald-500",
                skillPointsLeft < 0 && "text-destructive",
                skillPointsLeft === 0 && "text-accent"
              )}>{skillPointsLeft}</span>
            </p>
          </div>
           <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
             {firstClass?.className && classLabel ? (
                <>
                  <p>
                    ({(UI_STRINGS.skillPointFormulaClassBaseLabel || "{classLabel} Base").replace("{classLabel}", classLabel)} <Badge variant="outline" className={badgeClassName}>{baseSkillPointsForClass}</Badge>
                    {' + '} {UI_STRINGS.skillPointFormulaIntModLabel || "Intelligence Modifier"} <Badge variant="outline" className={badgeClassName}>{intelligenceModifier}</Badge>
                    {(racialBonusSkillPoints || 0) !== 0 && (
                        <>
                        {' + '} {UI_STRINGS.skillPointFormulaRacialModLabel || "Racial Modifier"} <Badge variant="outline" className={badgeClassName}>{racialBonusSkillPoints || 0}</Badge>
                        </>
                    )}
                    {UI_STRINGS.skillPointFormulaMinOneLabel || ", Minimum 1"}) × <Badge variant="outline" className={badgeClassName}>4</Badge> {UI_STRINGS.skillPointFormulaFirstLevelFactor || "First Level"}
                    {' = '} <span className="font-bold text-primary">{pointsForFirstLevel}</span>
                  </p>
                  <p>
                    + ({(UI_STRINGS.skillPointFormulaClassBaseLabel || "{classLabel} Base").replace("{classLabel}", classLabel)} <Badge variant="outline" className={badgeClassName}>{baseSkillPointsForClass}</Badge>
                    {' + '} {UI_STRINGS.skillPointFormulaIntModLabel || "Intelligence Modifier"} <Badge variant="outline" className={badgeClassName}>{intelligenceModifier}</Badge>
                    {(racialBonusSkillPoints || 0) !== 0 && (
                        <>
                        {' + '} {UI_STRINGS.skillPointFormulaRacialModLabel || "Racial Modifier"} <Badge variant="outline" className={badgeClassName}>{racialBonusSkillPoints || 0}</Badge>
                        </>
                    )}
                    {UI_STRINGS.skillPointFormulaMinOneLabel || ", Minimum 1"}) × <Badge variant="outline" className={badgeClassName}>{characterLevel > 1 ? (characterLevel -1) : 0}</Badge> {UI_STRINGS.skillPointFormulaLevelProgressionFactor || "Level Progression"}
                    {' = '} <span className="font-bold text-primary">{pointsFromLevelProgression}</span>
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {UI_STRINGS.skillPointFormulaSelectClassPrompt || "Select a class to see available skill points."}
                </p>
              )}
           </div>
        </div>
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-muted scrollbar-thumb-rounded-md scrollbar-track-rounded-md">
          <div className="space-y-1 min-w-[680px]">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto_auto] gap-x-2 px-1 py-2 items-center font-semibold border-b bg-background sticky top-0 z-10 text-sm">
              <span className="text-center w-10" dangerouslySetInnerHTML={{ __html: UI_STRINGS.skillsTableHeaderClassLabel || "Class?" }} />
              <span className="pl-1">{UI_STRINGS.skillsTableHeaderSkillLabel || "Skill"}</span>
              <span className="text-center w-12" dangerouslySetInnerHTML={{ __html: UI_STRINGS.skillsTableHeaderSkillModLabel || "Skill<br/>Mod" }} />
              <span className="text-center w-10" dangerouslySetInnerHTML={{ __html: UI_STRINGS.skillsTableHeaderKeyAbilityLabel || "Key<br/>Ability" }} />
              <span className="text-center w-12" dangerouslySetInnerHTML={{ __html: UI_STRINGS.skillsTableHeaderAbilityModLabel || "Ability<br/>Mod" }} />
              <span className="text-center w-12">{UI_STRINGS.skillsTableHeaderMiscModLabel || "Misc<br/>Mod"}</span>
              <span className="text-center w-32">{UI_STRINGS.skillsTableHeaderRanksLabel || "Ranks"}</span>
              <span className="text-center w-12">{UI_STRINGS.skillsTableHeaderCostLabel || "Cost"}</span>
              <span className="text-center w-10">{UI_STRINGS.skillsTableHeaderMaxLabel || "Max"}</span>
            </div>

            {skillsForDisplay.map(skillInstanceProp => { 
              const skillDef = allCombinedSkillDefinitions.find(def => def.id === skillInstanceProp.id);
              if (!skillDef) return null; // Should not happen if data is consistent

              const keyAbility = skillDef.keyAbility;
              const abilityLabelInfo = ABILITY_LABELS.find(al => al.value === keyAbility);
              
              let keyAbilityDisplay = 'N/A';
              if (keyAbility && keyAbility !== 'none' && abilityLabelInfo) {
                keyAbilityDisplay = abilityLabelInfo.abbr;
              } else if (keyAbility === 'none') {
                keyAbilityDisplay = ''; 
              }

              const baseAbilityMod = (keyAbility && keyAbility !== 'none')
                ? getAbilityModifierByName(actualAbilityScores, keyAbility)
                : 0;

              const synergyBonus = calculateTotalSynergyBonus(skillDef.id, characterSkillInstances, SKILL_DEFINITIONS, SKILL_SYNERGIES, allCustomSkillDefinitions);
              const featSkillBonus = calculateFeatBonusesForSkill(skillDef.id, selectedFeats, allFeatDefinitions);
              const currentRacialBonus = calculateRacialSkillBonus(skillDef.id, characterRace, DND_RACES, SKILL_DEFINITIONS);
              const currentSizeSpecificBonus = calculateSizeSpecificSkillBonus(skillDef.id, characterSize, SIZES);

              const calculatedMiscModifier = synergyBonus + featSkillBonus + currentRacialBonus + currentSizeSpecificBonus;
              
              const committedRankValue = skillInstanceProp.ranks || 0; 
              const totalBonus = committedRankValue + baseAbilityMod + calculatedMiscModifier + (skillInstanceProp.miscModifier || 0);
              
              const maxRanksValue = calculateMaxRanks(characterLevel, skillInstanceProp.isClassSkill || false, intelligenceModifier);
              const skillCostDisplay = (skillDef.keyAbility === 'none' || skillInstanceProp.isClassSkill) ? 1 : 2;
              const currentStepForInput = (skillDef.keyAbility === 'none' || skillInstanceProp.isClassSkill) ? 1 : 0.5;

              return (
                <div key={skillInstanceProp.id} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto_auto] gap-x-2 px-1 py-1.5 items-center border-b border-border/50 transition-colors text-sm">
                  <div className="flex justify-center w-10">
                    <Checkbox
                      id={`skill_class_${skillInstanceProp.id}`}
                      checked={skillInstanceProp.isClassSkill}
                      onCheckedChange={(checked) => {
                          onSkillChange(skillInstanceProp.id, skillInstanceProp.ranks || 0, !!checked);
                      }}
                      className="h-3.5 w-3.5"
                    />
                  </div>
                  <div className="flex items-center">
                       <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 mr-1 text-muted-foreground hover:text-foreground"
                          onClick={() => handleTriggerSkillInfoDialog(skillInstanceProp.id)}
                          aria-label={(UI_STRINGS.skillsTableTooltipInfoForSkill || "Info for {skillName}").replace("{skillName}", skillDef.name)}
                        >
                          <Info className="h-3 w-3" />
                        </Button>
                      <Label htmlFor={`skill_ranks_${skillInstanceProp.id}`} className="text-sm pr-1 leading-tight flex-grow flex items-center">
                          {skillDef.name}
                          {skillDef.isCustom && (
                              <Badge variant="outline" className="text-xs text-primary/70 border-primary/50 h-5 ml-1.5 font-normal whitespace-nowrap">{UI_STRINGS.badgeCustomLabel || "Custom"}</Badge>
                          )}
                      </Label>
                    {skillDef.isCustom && (
                      <div className="flex items-center ml-auto">
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                               <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                onClick={() => handleOpenEditDialog(skillInstanceProp as SkillDisplayInfo)}
                                aria-label={(UI_STRINGS.skillsTableTooltipEditCustom || "Edit Custom Skill Definition").replace("{skillName}", skillDef.name)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="p-1 text-xs">
                              <p>{UI_STRINGS.skillsTableTooltipEditCustom || "Edit Custom Skill Definition"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                       </div>
                    )}
                  </div>
                  <span className="font-bold text-accent text-lg text-center w-12">{totalBonus >= 0 ? '+' : ''}{totalBonus}</span>
                  <span className="text-sm text-muted-foreground text-center w-10">{keyAbilityDisplay}</span>
                  <span className="text-sm text-center w-12">{baseAbilityMod >= 0 ? '+' : ''}{baseAbilityMod}</span>
                  <span className="text-sm text-center w-12">{calculatedMiscModifier >= 0 ? '+' : ''}{calculatedMiscModifier}</span>
                  <div className="w-32 flex justify-center">
                    <DebouncedSkillRankInput
                      skillProp={skillInstanceProp}
                      currentStepForInput={currentStepForInput}
                      maxRanksValue={maxRanksValue}
                      onDebouncedRankChange={(newRank) => onSkillChange(skillInstanceProp.id, newRank, skillInstanceProp.isClassSkill)}
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
    </Card>
    </>
  );
}

