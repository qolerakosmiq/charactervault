
'use client';

import * as React from 'react';
import type { AbilityScores, CharacterClass, Skill as SkillType, AbilityName, DndRaceId, CustomSynergyRule, CharacterFeatInstance, DndRaceOption, SkillDefinitionJsonData, FeatDefinitionJsonData, CharacterSize } from '@/types/character';
import { CLASS_SKILL_POINTS_BASE, getRaceSkillPointsBonusPerLevel, calculateTotalSynergyBonus, calculateFeatBonusesForSkill, calculateRacialSkillBonus, DND_RACES, SKILL_DEFINITIONS, CLASS_SKILLS, SKILL_SYNERGIES, DND_CLASSES, SIZES, calculateSizeSpecificSkillBonus } from '@/types/character';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollText, Pencil, Info } from 'lucide-react';
import { getAbilityModifierByName } from '@/lib/dnd-utils';
import { calculateMaxRanks } from '@/lib/constants';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { CustomSkillDefinition } from '@/lib/definitions-store';
import { InfoDisplayDialog } from '@/components/InfoDisplayDialog';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Badge } from '@/components/ui/badge';

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
  sizeSpecificBonus: number; // Added for size-specific skill modifiers
  miscModifier: number;
  totalBonus: number;
}

interface SkillsFormSectionProps {
  skills: SkillType[];
  abilityScores: AbilityScores;
  actualAbilityScores: AbilityScores;
  characterClasses: CharacterClass[];
  characterRace: DndRaceId | string;
  characterSize: CharacterSize | ''; // Added for size-specific skill modifiers
  selectedFeats: CharacterFeatInstance[];
  allFeatDefinitions: (FeatDefinitionJsonData & {isCustom?: boolean})[];
  allPredefinedSkillDefinitions: readonly SkillDefinitionJsonData[];
  allCustomSkillDefinitions: readonly CustomSkillDefinition[];
  onSkillChange: (skillId: string, ranks: number, isClassSkill?: boolean) => void;
  onEditCustomSkillDefinition: (skillDefId: string) => void;
}

export function SkillsFormSection({
  skills: characterSkillInstances,
  abilityScores,
  actualAbilityScores,
  characterClasses,
  characterRace,
  characterSize, // Destructure characterSize
  selectedFeats,
  allFeatDefinitions,
  allPredefinedSkillDefinitions,
  allCustomSkillDefinitions,
  onSkillChange,
  onEditCustomSkillDefinition,
}: SkillsFormSectionProps) {
  const [isInfoDialogOpen, setIsInfoDialogOpen] = React.useState(false);
  const [currentSkillInfo, setCurrentSkillInfo] = React.useState<{ title: string; content?: string; skillModifierBreakdown?: SkillModifierBreakdownDetails } | null>(null);

  const firstClass = characterClasses[0];
  const characterLevel = firstClass?.level || 1;
  const classLabel = firstClass?.className ? DND_CLASSES.find(c => c.value === firstClass.className)?.label || firstClass.className : "";


  const intelligenceModifier = (actualAbilityScores && actualAbilityScores.intelligence !== undefined)
    ? getAbilityModifierByName(actualAbilityScores, 'intelligence')
    : 0;

  const baseSkillPointsForClass = firstClass?.className ? (CLASS_SKILL_POINTS_BASE[firstClass.className as keyof typeof CLASS_SKILL_POINTS_BASE] || 0) : 0;
  const racialBonus = characterRace ? getRaceSkillPointsBonusPerLevel(characterRace as DndRaceId) : 0;

  const pointsPerLevelBeforeMin = baseSkillPointsForClass + intelligenceModifier + (racialBonus || 0);
  const pointsPerRegularLevel = Math.max(1, pointsPerLevelBeforeMin);


  const pointsForFirstLevel = pointsPerRegularLevel * 4;
  const pointsFromLevelProgression = characterLevel > 1 ? pointsPerRegularLevel * (characterLevel - 1) : 0;
  const totalSkillPointsAvailable = pointsForFirstLevel + pointsFromLevelProgression;

  const allCombinedSkillDefinitions = React.useMemo(() => {
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
  }, [allPredefinedSkillDefinitions, allCustomSkillDefinitions]);

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


  const totalSkillPointsSpent = skillsForDisplay.reduce((acc, currentSkill) => {
    let costMultiplier = 1;
    if (currentSkill.keyAbility === 'none') {
      costMultiplier = 1;
    } else if (!currentSkill.isClassSkill) {
      costMultiplier = 2;
    }
    return acc + ((currentSkill.ranks || 0) * costMultiplier);
  }, 0);
  const skillPointsLeft = totalSkillPointsAvailable - totalSkillPointsSpent;

  const handleOpenEditDialog = (skillDisplayInfo: SkillDisplayInfo) => {
    if (skillDisplayInfo.isCustom) {
      onEditCustomSkillDefinition(skillDisplayInfo.id);
    }
  };


  const handleOpenSkillInfoDialog = (skill: SkillDisplayInfo) => {
    const keyAbility = skill.keyAbility;
    const currentKeyAbilityModifier = (keyAbility && keyAbility !== 'none') ? getAbilityModifierByName(actualAbilityScores, keyAbility) : 0;

    const currentSynergyBonus = calculateTotalSynergyBonus(skill.id, characterSkillInstances, allPredefinedSkillDefinitions, allCustomSkillDefinitions);
    const currentFeatSkillBonus = calculateFeatBonusesForSkill(skill.id, selectedFeats, allFeatDefinitions);
    const currentRacialSkillBonus = calculateRacialSkillBonus(skill.id, characterRace, DND_RACES, allPredefinedSkillDefinitions);
    const currentSizeSpecificBonus = calculateSizeSpecificSkillBonus(skill.id, characterSize); // Calculate size bonus
    const currentMiscModifier = skill.miscModifier || 0;
    const currentRanks = skill.ranks || 0;

    const totalDisplayedModifierInTable = currentKeyAbilityModifier + currentSynergyBonus + currentFeatSkillBonus + currentRacialSkillBonus + currentSizeSpecificBonus; // Add size bonus
    const totalSkillBonus = currentRanks + totalDisplayedModifierInTable + currentMiscModifier;

    const breakdown: SkillModifierBreakdownDetails = {
      skillName: skill.name,
      keyAbilityName: (keyAbility && keyAbility !== 'none') ? (keyAbility.charAt(0).toUpperCase() + keyAbility.slice(1)) : undefined,
      keyAbilityModifier: currentKeyAbilityModifier,
      ranks: currentRanks,
      synergyBonus: currentSynergyBonus,
      featBonus: currentFeatSkillBonus,
      racialBonus: currentRacialSkillBonus,
      sizeSpecificBonus: currentSizeSpecificBonus, // Add to breakdown
      miscModifier: currentMiscModifier,
      totalBonus: totalSkillBonus,
    };

    setCurrentSkillInfo({
      title: skill.name,
      content: skill.description || "No description available for this skill.",
      skillModifierBreakdown: breakdown,
    });
    setIsInfoDialogOpen(true);
  };

  const badgeClassName = "text-primary border-primary font-bold px-1.5 py-0 text-xs";

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <ScrollText className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-serif">Skills</CardTitle>
            <CardDescription>
              Invest points in your character's abilities.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 border rounded-md bg-muted/30">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">
              Skill Points Available: <span className="text-lg font-bold text-primary">{totalSkillPointsAvailable}</span>
            </p>
            <p className="text-sm font-medium">
              Skill Points Left: <span className={cn(
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
                    ({classLabel} Base <Badge variant="outline" className={badgeClassName}>{baseSkillPointsForClass}</Badge>
                    {' + '}Intelligence Modifier <Badge variant="outline" className={badgeClassName}>{intelligenceModifier}</Badge>
                    {(racialBonus || 0) !== 0 && (
                        <>
                        {' + '}Racial Modifier <Badge variant="outline" className={badgeClassName}>{racialBonus || 0}</Badge>
                        </>
                    )}
                    , Minimum 1) × <Badge variant="outline" className={badgeClassName}>4</Badge> First Level
                    {' = '} <span className="font-bold text-primary">{pointsForFirstLevel}</span>
                  </p>
                  <p>
                    + ({classLabel} Base <Badge variant="outline" className={badgeClassName}>{baseSkillPointsForClass}</Badge>
                    {' + '}Intelligence Modifier <Badge variant="outline" className={badgeClassName}>{intelligenceModifier}</Badge>
                    {(racialBonus || 0) !== 0 && (
                        <>
                        {' + '}Racial Modifier <Badge variant="outline" className={badgeClassName}>{racialBonus || 0}</Badge>
                        </>
                    )}
                    , Minimum 1) × <Badge variant="outline" className={badgeClassName}>{characterLevel > 1 ? (characterLevel -1) : 0}</Badge> Level Progression
                    {' = '} <span className="font-bold text-primary">{pointsFromLevelProgression}</span>
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a class to see available skill points.
                </p>
              )}
           </div>
        </div>

        <div className="space-y-1 -mx-1">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto] gap-x-2 px-1 py-2 items-center font-semibold border-b bg-background sticky top-0 z-10 text-xs">
            <span className="text-center w-10">Class?</span>
            <span className="pl-1">Skill</span>
            <span className="text-center w-10">Total</span>
            <span className="text-center w-10">Key</span>
            <span className="text-center w-10">Mod</span>
            <span className="text-center w-32">Ranks</span>
            <span className="text-center w-12">Cost</span>
            <span className="text-center w-10">Max</span>
          </div>

          {skillsForDisplay.map(skill => {
            const keyAbility = skill.keyAbility;
            const keyAbilityDisplay = (keyAbility && keyAbility !== 'none') ? keyAbility.substring(0, 3).toUpperCase() : 'N/A';

            const baseAbilityMod = (keyAbility && keyAbility !== 'none')
              ? getAbilityModifierByName(actualAbilityScores, keyAbility)
              : 0;

            const synergyBonus = calculateTotalSynergyBonus(skill.id, characterSkillInstances, allPredefinedSkillDefinitions, allCustomSkillDefinitions);
            const featSkillBonus = calculateFeatBonusesForSkill(skill.id, selectedFeats, allFeatDefinitions);
            const currentRacialBonus = calculateRacialSkillBonus(skill.id, characterRace, DND_RACES, allPredefinedSkillDefinitions);
            const currentSizeSpecificBonus = calculateSizeSpecificSkillBonus(skill.id, characterSize); // Calculate size bonus

            const totalDisplayedModifier = baseAbilityMod + synergyBonus + featSkillBonus + currentRacialBonus + currentSizeSpecificBonus; // Add size bonus
            const totalBonus = (skill.ranks || 0) + totalDisplayedModifier + (skill.miscModifier || 0);
            const maxRanksValue = calculateMaxRanks(characterLevel, skill.isClassSkill || false, intelligenceModifier);
            const skillCostDisplay = (skill.keyAbility === 'none' || skill.isClassSkill) ? 1 : 2;
            const currentStepForInput = (skill.keyAbility === 'none' || skill.isClassSkill) ? 1 : 0.5;

            return (
              <div key={skill.id} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto] gap-x-2 px-1 py-1.5 items-center border-b border-border/50 hover:bg-muted/10 transition-colors text-sm">
                <div className="flex justify-center w-10">
                  <Checkbox
                    id={`skill_class_${skill.id}`}
                    checked={skill.isClassSkill}
                    onCheckedChange={(checked) => {
                        onSkillChange(skill.id, skill.ranks, !!checked);
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
                        onClick={() => handleOpenSkillInfoDialog(skill)}
                        aria-label={`Info for ${skill.name}`}
                      >
                        <Info className="h-3 w-3" />
                      </Button>
                    <Label htmlFor={`skill_ranks_${skill.id}`} className="text-xs pr-1 leading-tight flex-grow">
                          {skill.name} {skill.isCustom && <span className="text-primary/70 text-xs">(Custom)</span>}
                    </Label>
                  {skill.isCustom && (
                    <div className="flex items-center ml-auto">
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenEditDialog(skill)}
                              aria-label={`Edit custom skill definition ${skill.name}`}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="p-1 text-xs">
                            <p>Edit Custom Skill Definition</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                     </div>
                  )}
                </div>
                <span className="font-bold text-accent text-center w-10">{totalBonus >= 0 ? '+' : ''}{totalBonus}</span>
                <span className="text-xs text-muted-foreground text-center w-10">{keyAbilityDisplay}</span>
                <span className="text-xs text-center w-10">{totalDisplayedModifier >= 0 ? '+' : ''}{totalDisplayedModifier}</span>
                <div className="w-32 flex justify-center"> {/* Increased width for the spinner container */}
                  <NumberSpinnerInput
                    id={`skill_ranks_${skill.id}`}
                    value={skill.ranks || 0}
                    onChange={(newValue) => onSkillChange(skill.id, newValue, skill.isClassSkill)}
                    min={0}
                    // max={maxRanksValue} // Max validation is visual via max column
                    step={currentStepForInput}
                    inputClassName="w-14 h-7 text-xs" 
                    buttonSize="sm"
                    buttonClassName="h-7 w-7"
                  />
                </div>
                <span className="text-xs text-muted-foreground text-center w-12">{skillCostDisplay}</span>
                <span className={cn(
                    "text-xs text-center w-10",
                    (skill.ranks || 0) > maxRanksValue ? "text-destructive font-bold" : "text-muted-foreground"
                  )}>
                    {maxRanksValue}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
    {currentSkillInfo && (
      <InfoDisplayDialog
        isOpen={isInfoDialogOpen}
        onOpenChange={setIsInfoDialogOpen}
        title={currentSkillInfo.title}
        content={currentSkillInfo.content}
        skillModifierBreakdown={currentSkillInfo.skillModifierBreakdown}
      />
    )}
    </>
  );
}

