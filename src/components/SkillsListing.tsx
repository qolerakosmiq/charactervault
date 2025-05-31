
'use client';

import type { Character, Skill as SkillType, AbilityScores } from '@/types/character';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scroll } from 'lucide-react';
import { getAbilityModifierByName, calculateSkillTotal, getCharacterOverallLevel } from '@/lib/dnd-utils';
import { calculateMaxRanks } from '@/lib/constants';
import { SKILL_DEFINITIONS } from '@/types/character'; 
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput'; // Added import

interface SkillsListingProps {
  skills: SkillType[];
  abilityScores: AbilityScores;
  characterClasses: Character['classes'];
  onSkillChange: (skillId: string, ranks: number, miscModifier: number, isClassSkill?: boolean) => void;
}

export function SkillsListing({ skills, abilityScores, characterClasses, onSkillChange }: SkillsListingProps) {
  const overallLevel = getCharacterOverallLevel(characterClasses);
  const intelligenceModifier = getAbilityModifierByName(abilityScores, 'intelligence');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Scroll className="h-6 w-6 text-primary" />
          <CardTitle className="font-serif">Skills</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 -mx-2">
          {/* Header Row */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-x-2 px-2 py-2 items-center font-semibold border-b">
            <span className="text-sm">Skill Name</span>
            <span className="text-sm text-center">Total</span>
            <span className="text-sm text-center">Ability</span>
            <span className="text-sm text-center">Mod</span>
            <span className="text-sm text-center">Ranks</span>
            <span className="text-sm text-center">Misc</span>
            <span className="text-sm text-center">Class?</span>
          </div>

          {skills.map(skill => {
            const skillDef = SKILL_DEFINITIONS.find(sd => sd.value === skill.id); // Match by 'value' which is skill ID
            const keyAbilityShort = skillDef?.keyAbility ? skillDef.keyAbility.substring(0, 3).toUpperCase() : 'N/A';
            const abilityMod = skillDef?.keyAbility ? getAbilityModifierByName(abilityScores, skillDef.keyAbility as AbilityName) : 0;
            const totalBonus = (skill.ranks || 0) + abilityMod + (skill.miscModifier || 0); // Ensure ranks and miscMod are numbers
            const maxRanks = calculateMaxRanks(overallLevel, skill.isClassSkill || false, intelligenceModifier);
            
            return (
              <div key={skill.id} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-x-2 px-2 py-2 items-center border-b border-border/50 hover:bg-muted/20 transition-colors">
                <Label htmlFor={`skill_ranks_${skill.id}`} className="text-sm truncate pr-1">{skillDef?.label || skill.id}</Label>
                <span className="text-lg font-bold text-accent text-center w-10">{totalBonus >= 0 ? '+' : ''}{totalBonus}</span>
                <span className="text-xs text-muted-foreground text-center w-10">{keyAbilityShort}</span>
                <span className="text-sm text-center w-10">{abilityMod >= 0 ? '+' : ''}{abilityMod}</span>
                <div className="flex justify-center w-32"> {/* Increased width for the spinner container */}
                  <NumberSpinnerInput
                    id={`skill_ranks_${skill.id}`}
                    value={skill.ranks || 0}
                    onChange={(newValue) => onSkillChange(skill.id, newValue, skill.miscModifier || 0, skill.isClassSkill)}
                    step={(skill.isClassSkill || skillDef?.keyAbility === 'none') ? 1 : 0.5}
                    min={0}
                    max={maxRanks} // Spinner will respect this max
                    inputClassName="w-14 h-7 text-sm" {/* Increased input width */}
                    buttonClassName="h-7 w-7"
                    buttonSize="sm"
                  />
                </div>
                <div className="flex justify-center w-16">
                  <NumberSpinnerInput
                    id={`skill_misc_${skill.id}`}
                    value={skill.miscModifier || 0}
                    onChange={(newValue) => onSkillChange(skill.id, skill.ranks || 0, newValue, skill.isClassSkill)}
                    min={-20} max={20} // Arbitrary reasonable range for misc mods
                    inputClassName="w-10 h-7 text-sm"
                    buttonClassName="h-7 w-7"
                    buttonSize="sm"
                  />
                </div>
                <div className="flex justify-center w-10">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <Checkbox
                            id={`skill_class_${skill.id}`}
                            checked={skill.isClassSkill}
                            onCheckedChange={(checked) => onSkillChange(skill.id, skill.ranks || 0, skill.miscModifier || 0, !!checked)}
                          />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Max Ranks: {maxRanks}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
