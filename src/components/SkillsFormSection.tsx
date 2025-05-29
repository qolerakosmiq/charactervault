
'use client';

import * as React from 'react';
import type { AbilityScores, CharacterClass, Skill as SkillType, AbilityName, DndClass, DndRace, SkillDefinitionData } from '@/types/character';
import { CLASS_SKILL_POINTS_BASE, SKILL_DEFINITIONS, getRaceSkillPointsBonusPerLevel, calculateTotalSynergyBonus } from '@/types/character';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollText, PlusCircle, Trash2, Pencil } from 'lucide-react';
import { getAbilityModifierByName } from '@/lib/dnd-utils';
import { calculateMaxRanks } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AddCustomSkillDialog } from '@/components/AddCustomSkillDialog';


interface SkillsFormSectionProps {
  skills: SkillType[];
  abilityScores: AbilityScores;
  characterClasses: CharacterClass[];
  characterRace: DndRace | string;
  onSkillChange: (skillId: string, ranks: number) => void; // Misc modifier removed
  onCustomSkillAdd: (skillData: { name: string; keyAbility: AbilityName; isClassSkill: boolean }) => void;
  onCustomSkillUpdate: (skillData: { id: string; name: string; keyAbility: AbilityName; isClassSkill: boolean }) => void;
  onCustomSkillRemove: (skillId: string) => void;
}

export function SkillsFormSection({
  skills,
  abilityScores,
  characterClasses,
  characterRace,
  onSkillChange,
  onCustomSkillAdd,
  onCustomSkillUpdate,
  onCustomSkillRemove,
}: SkillsFormSectionProps) {
  const [isAddOrEditSkillDialogOpen, setIsAddOrEditSkillDialogOpen] = React.useState(false);
  const [skillToEdit, setSkillToEdit] = React.useState<SkillType | undefined>(undefined);


  const firstClass = characterClasses[0];
  const characterLevel = firstClass?.level || 1; // Character creation always at level 1 for now
  const intelligenceModifier = getAbilityModifierByName(abilityScores, 'intelligence');

  const baseSkillPointsForClass = firstClass?.className ? CLASS_SKILL_POINTS_BASE[firstClass.className as keyof typeof CLASS_SKILL_POINTS_BASE] || 0 : 0;
  const racialBonus = getRaceSkillPointsBonusPerLevel(characterRace as DndRace | string);

  const totalSkillPointsAvailable = (baseSkillPointsForClass + intelligenceModifier + racialBonus) * 4;

  const totalSkillPointsSpent = skills.reduce((acc, skill) => {
    const costMultiplier = skill.isClassSkill ? 1 : 2;
    return acc + (skill.ranks || 0) * costMultiplier;
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
  
  const handleSaveCustomSkill = (skillData: { id?: string; name: string; keyAbility: AbilityName; isClassSkill: boolean }) => {
    if (skillData.id && skillToEdit?.id === skillData.id) { // Editing existing skill
      onCustomSkillUpdate({
        id: skillData.id,
        name: skillData.name,
        keyAbility: skillData.keyAbility,
        isClassSkill: skillData.isClassSkill,
      });
    } else { // Adding new skill
      onCustomSkillAdd({
        name: skillData.name,
        keyAbility: skillData.keyAbility,
        isClassSkill: skillData.isClassSkill,
      });
    }
    setIsAddOrEditSkillDialogOpen(false);
    setSkillToEdit(undefined);
  };


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
                skillPointsLeft >= 0 && "text-emerald-500", // Use >= 0 for green if 0 is acceptable
                skillPointsLeft < 0 && "text-destructive"
                // skillPointsLeft === 0 && "text-accent" // Keeping 0 as green or emerald
              )}>{skillPointsLeft}</span>
            </p>
          </div>
           <p className="text-xs text-muted-foreground mt-1">
            (Class Base <strong className="font-bold text-primary">[{baseSkillPointsForClass}]</strong> + Intelligence Modifier <strong className="font-bold text-primary">[{intelligenceModifier}]</strong> + Racial Bonus <strong className="font-bold text-primary">[{racialBonus}]</strong>) * <strong className="font-bold text-primary">4</strong>
          </p>
        </div>

        <ScrollArea className="h-[400px] pr-3">
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
              const skillDef = SKILL_DEFINITIONS.find(sd => sd.name === skill.name);
              const keyAbility = skill.keyAbility || (skillDef?.keyAbility as AbilityName | undefined);
              const keyAbilityShort = keyAbility ? keyAbility.substring(0, 3).toUpperCase() : 'N/A';
              
              let baseAbilityMod = 0;
              if (keyAbility && keyAbility !== 'none') {
                baseAbilityMod = getAbilityModifierByName(abilityScores, keyAbility);
              }
              
              const synergyBonus = calculateTotalSynergyBonus(skill.name, skills);
              const totalAbilityMod = baseAbilityMod + synergyBonus;


              const totalBonus = (skill.ranks || 0) + totalAbilityMod + (skill.miscModifier || 0); // Include miscModifier here
              const maxRanksValue = calculateMaxRanks(characterLevel, skill.isClassSkill || false, intelligenceModifier);
              const skillCost = skill.isClassSkill ? 1 : 2;
              const isCustomSkill = !skillDef;

              return (
                <div key={skill.id} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto] gap-x-2 px-1 py-1.5 items-center border-b border-border/50 hover:bg-muted/10 transition-colors text-sm">
                  <div className="flex justify-center w-10">
                    <Checkbox
                      id={`skill_class_${skill.id}`}
                      checked={skill.isClassSkill}
                      disabled // Class skills are determined by class/custom skill setup.
                      className="h-3.5 w-3.5"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`skill_ranks_${skill.id}`} className="text-xs truncate pr-1 leading-tight pl-1">
                      {skill.name}
                    </Label>
                    {isCustomSkill && (
                      <div className="flex items-center">
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                               <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                onClick={() => handleOpenEditSkillDialog(skill)}
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
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-destructive/70 hover:text-destructive"
                                  onClick={() => onCustomSkillRemove(skill.id)}
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
                  <span className="text-xs text-muted-foreground text-center w-10">{keyAbilityShort}</span>
                  <span className="text-xs text-center w-10">{totalAbilityMod >= 0 ? '+' : ''}{totalAbilityMod}</span>
                  <Input
                    id={`skill_ranks_${skill.id}`}
                    type="number"
                    step={skill.isClassSkill ? "1" : "0.5"}
                    value={skill.ranks || 0}
                    onChange={(e) => onSkillChange(skill.id, parseFloat(e.target.value) || 0)}
                    className="h-7 w-12 text-xs text-center p-1"
                    max={maxRanksValue}
                    min="0"
                  />
                  <span className="text-xs text-muted-foreground text-center w-12">{skillCost}</span>
                  <span className="text-xs text-muted-foreground text-center w-10">{maxRanksValue}</span>
                </div>
              );
            })}
          </div>
        </ScrollArea>

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
    />
    </>
  );
}
