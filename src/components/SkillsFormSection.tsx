
'use client';

import * as React from 'react';
import type { AbilityScores, CharacterClass, Skill as SkillType, AbilityName, DndRaceId, CustomSynergyRule, CharacterFeatInstance, DndRaceOption, SkillDefinitionJsonData, FeatDefinitionJsonData } from '@/types/character';
import { CLASS_SKILL_POINTS_BASE, getRaceSkillPointsBonusPerLevel, calculateTotalSynergyBonus, calculateFeatBonusesForSkill, calculateRacialSkillBonus, DND_RACES, SKILL_DEFINITIONS } from '@/types/character';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollText, PlusCircle, Trash2, Pencil, Info } from 'lucide-react';
import { getAbilityModifierByName } from '@/lib/dnd-utils';
import { calculateMaxRanks } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AddCustomSkillDialog } from '@/components/AddCustomSkillDialog';
import { InfoDisplayDialog, type SkillModifierBreakdownDetails } from '@/components/InfoDisplayDialog';


interface SkillsFormSectionProps {
  skills: SkillType[];
  abilityScores: AbilityScores; 
  actualAbilityScores: AbilityScores; 
  characterClasses: CharacterClass[];
  characterRace: DndRaceId | string;
  selectedFeats: CharacterFeatInstance[]; // Changed from Feat[] to CharacterFeatInstance[]
  allFeatDefinitions: (FeatDefinitionJsonData & {isCustom?: boolean})[]; // Needed for skill bonus calculation
  onSkillChange: (skillId: string, ranks: number) => void;
  onCustomSkillAdd: (skillData: { name: string; keyAbility: AbilityName; isClassSkill: boolean; providesSynergies: CustomSynergyRule[]; description?: string; }) => void;
  onCustomSkillUpdate: (skillData: { id: string; name: string; keyAbility: AbilityName; isClassSkill: boolean; providesSynergies: CustomSynergyRule[]; description?: string; }) => void;
  onCustomSkillRemove: (skillId: string) => void;
}

export function SkillsFormSection({
  skills,
  abilityScores,
  actualAbilityScores,
  characterClasses,
  characterRace,
  selectedFeats, // Now CharacterFeatInstance[]
  allFeatDefinitions, // Pass this down
  onSkillChange,
  onCustomSkillAdd,
  onCustomSkillUpdate,
  onCustomSkillRemove,
}: SkillsFormSectionProps) {
  const [isAddOrEditSkillDialogOpen, setIsAddOrEditSkillDialogOpen] = React.useState(false);
  const [skillToEdit, setSkillToEdit] = React.useState<SkillType | undefined>(undefined);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = React.useState(false);
  const [currentSkillInfo, setCurrentSkillInfo] = React.useState<{ title: string; content?: string; skillModifierBreakdown?: SkillModifierBreakdownDetails } | null>(null);

  const firstClass = characterClasses[0];
  const characterLevel = firstClass?.level || 1;
  
  const intelligenceModifier = (actualAbilityScores && actualAbilityScores.intelligence !== undefined)
    ? getAbilityModifierByName(actualAbilityScores, 'intelligence')
    : 0; 

  const baseSkillPointsForClass = firstClass?.className ? (CLASS_SKILL_POINTS_BASE[firstClass.className as keyof typeof CLASS_SKILL_POINTS_BASE] || 0) : 0;
  const racialBonus = characterRace ? getRaceSkillPointsBonusPerLevel(characterRace as DndRaceId) : 0;

  const pointsForFirstLevel = (baseSkillPointsForClass + intelligenceModifier + (racialBonus || 0)) * 4;
  const pointsFromLevelProgression = characterLevel > 1 ? (baseSkillPointsForClass + intelligenceModifier + (racialBonus || 0)) * (characterLevel - 1) : 0;
  const totalSkillPointsAvailable = pointsForFirstLevel + pointsFromLevelProgression;

  const totalSkillPointsSpent = skills.reduce((acc, currentSkill) => {
    let costMultiplier = 1;
    if (currentSkill.keyAbility === 'none') {
      costMultiplier = 1; 
    } else if (!currentSkill.isClassSkill) {
      costMultiplier = 2; 
    }
    return acc + ((currentSkill.ranks || 0) * costMultiplier);
  }, 0);

  const skillPointsLeft = totalSkillPointsAvailable - totalSkillPointsSpent;

  const handleOpenAddSkillDialog = () => {
    setSkillToEdit(undefined);
    setIsAddOrEditSkillDialogOpen(true);
  };

  const handleOpenEditSkillDialog = (skill: SkillType) => {
    setSkillToEdit(skill);
    setIsAddOrEditSkillDialogOpen(true);
  };

  const handleOpenSkillInfoDialog = (skill: SkillType) => {
    const skillDef = SKILL_DEFINITIONS.find(sd => sd.value === skill.id);
    const keyAbility = skill.keyAbility || (skillDef?.keyAbility as AbilityName | undefined);
    
    const currentKeyAbilityModifier = (keyAbility && keyAbility !== 'none') ? getAbilityModifierByName(actualAbilityScores, keyAbility) : 0;
    const currentSynergyBonus = calculateTotalSynergyBonus(skill.id, skills);
    // Use allFeatDefinitions to look up feat effects for skill bonuses
    const currentFeatSkillBonus = calculateFeatBonusesForSkill(skill.id, selectedFeats, allFeatDefinitions);
    const currentRacialSkillBonus = calculateRacialSkillBonus(skill.id, characterRace, DND_RACES, SKILL_DEFINITIONS);
    const currentMiscModifier = skill.miscModifier || 0;
    const currentRanks = skill.ranks || 0;

    const totalDisplayedModifierInTable = currentKeyAbilityModifier + currentSynergyBonus + currentFeatSkillBonus + currentRacialSkillBonus; 
    const totalSkillBonus = currentRanks + totalDisplayedModifierInTable + currentMiscModifier; 

    const breakdown: SkillModifierBreakdownDetails = {
      skillName: skill.name,
      keyAbilityName: (keyAbility && keyAbility !== 'none') ? (keyAbility.charAt(0).toUpperCase() + keyAbility.slice(1)) : undefined,
      keyAbilityModifier: currentKeyAbilityModifier,
      ranks: currentRanks,
      synergyBonus: currentSynergyBonus,
      featBonus: currentFeatSkillBonus,
      racialBonus: currentRacialSkillBonus,
      miscModifier: currentMiscModifier,
      totalBonus: totalSkillBonus,
    };

    setCurrentSkillInfo({ 
      title: skill.name, 
      content: skill.description || skillDef?.description || "No description available for this skill.",
      skillModifierBreakdown: breakdown,
    });
    setIsInfoDialogOpen(true);
  };

  const handleSaveCustomSkill = (skillData: { id?: string; name: string; keyAbility: AbilityName; isClassSkill: boolean; providesSynergies: CustomSynergyRule[]; description?: string; }) => {
    if (skillData.id && skillToEdit?.id === skillData.id) {
      onCustomSkillUpdate({
        id: skillData.id,
        name: skillData.name,
        keyAbility: skillData.keyAbility,
        isClassSkill: skillData.isClassSkill,
        providesSynergies: skillData.providesSynergies,
        description: skillData.description,
      });
    } else {
      onCustomSkillAdd({
        name: skillData.name,
        keyAbility: skillData.keyAbility,
        isClassSkill: skillData.isClassSkill,
        providesSynergies: skillData.providesSynergies,
        description: skillData.description,
      });
    }
    setIsAddOrEditSkillDialogOpen(false);
    setSkillToEdit(undefined);
  };

  const allSkillOptionsForDialog = React.useMemo(() => {
    return skills.map(s => ({ value: s.id, label: s.name }));
  }, [skills]);

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
             <p>
                 (Class Base per Level <strong className="font-bold text-primary">[{baseSkillPointsForClass}]</strong>
                 {' + '}Intelligence Modifier <strong className="font-bold text-primary">[{intelligenceModifier}]</strong>
                 {(racialBonus || 0) !== 0 && (
                   <>
                     {' + '}Racial Bonus per Level <strong className="font-bold text-primary">[{racialBonus || 0}]</strong>
                   </>
                 )}
                 ) × First Level <strong className="font-bold text-primary">[4]</strong>
             </p>
             <p>
                 + (Class Base per Level <strong className="font-bold text-primary">[{baseSkillPointsForClass}]</strong>
                 {' + '}Intelligence Modifier <strong className="font-bold text-primary">[{intelligenceModifier}]</strong>
                 {(racialBonus || 0) !== 0 && (
                    <>
                     {' + '}Racial Bonus per Level <strong className="font-bold text-primary">[{racialBonus || 0}]</strong>
                   </>
                 )}
                 ) × Level Progression <strong className="font-bold text-primary">[{characterLevel > 1 ? (characterLevel -1) : 0}]</strong>
             </p>
           </div>
        </div>

        <div className="space-y-1 -mx-1">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto] gap-x-2 px-1 py-2 items-center font-semibold border-b bg-background sticky top-0 z-10 text-xs">
            <span className="text-center w-10">Class?</span>
            <span className="pl-1">Skill</span>
            <span className="text-center w-10">Total</span>
            <span className="text-center w-10">Key</span>
            <span className="text-center w-10">Mod</span>
            <span className="text-center w-12">Ranks</span>
            <span className="text-center w-12">Cost</span>
            <span className="text-center w-10">Max</span>
          </div>

          {skills.map(skill => {
            const skillDef = SKILL_DEFINITIONS.find(sd => sd.value === skill.id);
            const keyAbility = skill.keyAbility || (skillDef?.keyAbility as AbilityName | undefined);
            const keyAbilityDisplay = (keyAbility && keyAbility !== 'none') ? keyAbility.substring(0, 3).toUpperCase() : '';

            const baseAbilityMod = (keyAbility && keyAbility !== 'none')
              ? getAbilityModifierByName(actualAbilityScores, keyAbility)
              : 0;

            const synergyBonus = calculateTotalSynergyBonus(skill.id, skills);
            const featSkillBonus = calculateFeatBonusesForSkill(skill.id, selectedFeats, allFeatDefinitions);
            const currentRacialBonus = calculateRacialSkillBonus(skill.id, characterRace, DND_RACES, SKILL_DEFINITIONS);
            
            const totalDisplayedModifier = baseAbilityMod + synergyBonus + featSkillBonus + currentRacialBonus;

            const totalBonus = (skill.ranks || 0) + totalDisplayedModifier + (skill.miscModifier || 0);
            const baseIntelligenceModifierForMaxRanks = getAbilityModifierByName(abilityScores, 'intelligence'); 
            const maxRanksValue = calculateMaxRanks(characterLevel, skill.isClassSkill || false, baseIntelligenceModifierForMaxRanks); 
            
            const skillCostDisplay = (skill.keyAbility === 'none' || skill.isClassSkill) ? 1 : 2;
            const isCustomSkill = !skillDef;
            const currentStepForInput = (skill.keyAbility === 'none' || skill.isClassSkill) ? 1 : 0.5;

            return (
              <div key={skill.id} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto] gap-x-2 px-1 py-1.5 items-center border-b border-border/50 hover:bg-muted/10 transition-colors text-sm">
                <div className="flex justify-center w-10">
                  <Checkbox
                    id={`skill_class_${skill.id}`}
                    checked={skill.isClassSkill}
                    disabled={!isCustomSkill || skill.keyAbility === 'none'} 
                    onCheckedChange={(checked) => {
                        if (isCustomSkill && skill.keyAbility && skill.keyAbility !== 'none' && skill.providesSynergies !== undefined) { 
                            onCustomSkillUpdate({
                                id: skill.id,
                                name: skill.name,
                                keyAbility: skill.keyAbility,
                                isClassSkill: !!checked,
                                providesSynergies: skill.providesSynergies || [],
                                description: skill.description || ''
                            });
                        }
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
                    <Label htmlFor={`skill_ranks_${skill.id}`} className="text-xs truncate pr-1 leading-tight flex-grow">
                          {skill.name}
                    </Label>
                  {isCustomSkill && (
                    <div className="flex items-center ml-auto">
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenEditSkillDialog(skill)}
                              aria-label={`Edit ${skill.name}`}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="p-1 text-xs">
                            <p>Edit Custom Skill</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-destructive/70 hover:text-destructive"
                                onClick={() => onCustomSkillRemove(skill.id)}
                                aria-label={`Remove ${skill.name}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="p-1 text-xs">
                            <p>Remove Custom Skill</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                     </div>
                  )}
                </div>
                <span className="font-bold text-accent text-center w-10">{totalBonus >= 0 ? '+' : ''}{totalBonus}</span>
                <span className="text-xs text-muted-foreground text-center w-10">{keyAbilityDisplay}</span>
                <span className="text-xs text-center w-10">{totalDisplayedModifier >= 0 ? '+' : ''}{totalDisplayedModifier}</span>
                <Input
                  id={`skill_ranks_${skill.id}`}
                  type="number"
                  step={currentStepForInput}
                  value={skill.ranks || 0}
                  onChange={(e) => onSkillChange(skill.id, parseFloat(e.target.value) || 0)}
                  className="h-7 w-12 text-xs text-center p-1"
                  min="0"
                />
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

        <Separator className="my-4" />

        <div>
          <Button type="button" onClick={handleOpenAddSkillDialog} size="sm" variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Custom Skill
          </Button>
        </div>
      </CardContent>
    </Card>
    <AddCustomSkillDialog
        isOpen={isAddOrEditSkillDialogOpen}
        onOpenChange={setIsAddOrEditSkillDialogOpen}
        onSave={handleSaveCustomSkill}
        initialSkillData={skillToEdit}
        allSkills={allSkillOptionsForDialog}
    />
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
