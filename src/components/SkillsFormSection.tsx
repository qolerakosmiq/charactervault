
'use client';

import * as React from 'react';
import type { AbilityScores, CharacterClass, Skill as SkillType, AbilityName, DndClass } from '@/types/character';
import { SKILL_DEFINITIONS, CLASS_SKILLS, CLASS_SKILL_POINTS_BASE } from '@/types/character';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollText, PlusCircle, Trash2 } from 'lucide-react';
import { calculateAbilityModifier, getAbilityModifierByName } from '@/lib/dnd-utils';
import { calculateMaxRanks } from '@/lib/constants'; 
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';


interface SkillsFormSectionProps {
  skills: SkillType[];
  abilityScores: AbilityScores;
  characterClasses: CharacterClass[];
  onSkillChange: (skillId: string, ranks: number, miscModifier: number) => void;
  onCustomSkillAdd: (skillName: string) => void;
  onCustomSkillRemove: (skillId: string) => void;
}

export function SkillsFormSection({
  skills,
  abilityScores,
  characterClasses,
  onSkillChange,
  onCustomSkillAdd,
  onCustomSkillRemove,
}: SkillsFormSectionProps) {
  const [newCustomSkillName, setNewCustomSkillName] = React.useState('');

  const firstClass = characterClasses[0];
  const characterLevel = firstClass?.level || 1;
  const intelligenceModifier = getAbilityModifierByName(abilityScores, 'intelligence');

  const baseSkillPointsForClass = firstClass?.className ? CLASS_SKILL_POINTS_BASE[firstClass.className as keyof typeof CLASS_SKILL_POINTS_BASE] || 0 : 0;
  
  const totalSkillPointsAvailable = (baseSkillPointsForClass + intelligenceModifier) * 4;
  const totalSkillPointsSpent = skills.reduce((acc, skill) => acc + (skill.ranks || 0), 0);
  const skillPointsLeft = totalSkillPointsAvailable - totalSkillPointsSpent;

  const handleAddCustomSkill = () => {
    if (newCustomSkillName.trim()) {
      onCustomSkillAdd(newCustomSkillName.trim());
      setNewCustomSkillName('');
    }
  };

  return (
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
              Skill Points Available (Level 1): <span className="text-lg font-bold text-primary">{totalSkillPointsAvailable}</span>
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
           <p className="text-xs text-muted-foreground mt-1">
            Calculation: (Class Base ({baseSkillPointsForClass}) + INT Mod ({intelligenceModifier})) * 4. Human bonus not included yet.
          </p>
        </div>

        <ScrollArea className="h-[400px] pr-3">
          <div className="space-y-1 -mx-1">
            {/* Header Row - Adjusted grid-cols for better alignment */}
            <div className="grid grid-cols-[1fr_repeat(6,minmax(0,auto))] gap-x-2 px-1 py-2 items-center font-semibold border-b bg-background sticky top-0 z-10 text-xs">
              <span className="pl-1">Skill</span>
              <span className="text-center w-10">Total</span>
              <span className="text-center w-10">Key</span>
              <span className="text-center w-10">Mod</span>
              <span className="text-center w-12">Ranks</span>
              <span className="text-center w-10">Max</span>
              <span className="text-center w-10">Class?</span>
            </div>

            {skills.map(skill => {
              const skillDef = SKILL_DEFINITIONS.find(sd => sd.name === skill.name);
              const keyAbility = skill.keyAbility || skillDef?.keyAbility as AbilityName | undefined;
              const keyAbilityShort = keyAbility ? keyAbility.substring(0, 3).toUpperCase() : 'N/A';
              const abilityMod = keyAbility && keyAbility !== 'none' ? getAbilityModifierByName(abilityScores, keyAbility) : 0;
              
              const totalBonus = (skill.ranks || 0) + abilityMod + (skill.miscModifier || 0);
              const maxRanksValue = calculateMaxRanks(characterLevel, skill.isClassSkill || false, intelligenceModifier);
              
              return (
                <div key={skill.id} className="grid grid-cols-[1fr_repeat(6,minmax(0,auto))] gap-x-2 px-1 py-1.5 items-center border-b border-border/50 hover:bg-muted/10 transition-colors text-sm">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`skill_ranks_${skill.id}`} className="text-xs truncate pr-1 leading-tight pl-1">
                      {skill.name}
                    </Label>
                    {!skillDef && ( 
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
                    )}
                  </div>
                  <span className="font-bold text-accent text-center w-10">{totalBonus >= 0 ? '+' : ''}{totalBonus}</span>
                  <span className="text-xs text-muted-foreground text-center w-10">{keyAbilityShort}</span>
                  <span className="text-xs text-center w-10">{abilityMod >= 0 ? '+' : ''}{abilityMod}</span>
                  <Input
                    id={`skill_ranks_${skill.id}`}
                    type="number"
                    step="0.5" 
                    value={skill.ranks || 0}
                    onChange={(e) => onSkillChange(skill.id, parseFloat(e.target.value) || 0, skill.miscModifier || 0)}
                    className="h-7 w-12 text-xs text-center p-1"
                    max={maxRanksValue}
                    min="0"
                  />
                  <span className="text-xs text-muted-foreground text-center w-10">{maxRanksValue}</span>
                  <div className="flex justify-center w-10">
                    <Checkbox
                      id={`skill_class_${skill.id}`}
                      checked={skill.isClassSkill}
                      disabled 
                      className="h-3.5 w-3.5"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        
        <Separator className="my-4" />

        <div>
          <h4 className="text-md font-semibold mb-2">Add Custom Skill</h4>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Custom Skill Name"
              value={newCustomSkillName}
              onChange={(e) => setNewCustomSkillName(e.target.value)}
              className="h-9"
            />
            <Button onClick={handleAddCustomSkill} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Skill
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
