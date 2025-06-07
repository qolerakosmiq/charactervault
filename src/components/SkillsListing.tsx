
'use client';

import type { Character, Skill as SkillType, AbilityScores } from '@/types/character';
import type { AbilityName } from '@/types/character-core';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scroll, Loader2 } from 'lucide-react';
import { getAbilityModifierByName, calculateCharacterTotalLevel } from '@/lib/dnd-utils'; // Updated import
import { calculateMaxRanks } from '@/lib/constants';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';

interface SkillsListingProps {
  skills: SkillType[];
  abilityScores: AbilityScores;
  characterClasses: Character['classes'];
  onSkillChange: (skillId: string, ranks: number, miscModifier: number, isClassSkill?: boolean) => void;
}

export const SkillsListing: React.FC<SkillsListingProps> = ({ skills, abilityScores, characterClasses, onSkillChange }) => {
  const { translations, isLoading: translationsLoading } = useI18n();

  const overallLevel = calculateCharacterTotalLevel(characterClasses); // Updated usage
  const intelligenceModifier = getAbilityModifierByName(abilityScores, 'intelligence');

  if (translationsLoading || !translations) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Scroll className="h-6 w-6 text-primary" />
            <CardTitle className="font-serif">Skills</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Loading skill definitions...</p>
          </div>
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }
  const { SKILL_DEFINITIONS, UI_STRINGS } = translations;


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Scroll className="h-6 w-6 text-primary" />
          <CardTitle className="font-serif">{UI_STRINGS.skillsPanelTitle || "Skills"}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 -mx-2">
          {/* Header Row */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-x-2 px-2 py-2 items-center font-semibold border-b">
            <span className="text-sm">{UI_STRINGS.skillsTableHeaderSkillLabel || "Skill Name"}</span>
            <span className="text-sm text-center">{UI_STRINGS.skillsTableHeaderSkillModLabel || "Total"}</span>
            <span className="text-sm text-center">{UI_STRINGS.skillsTableHeaderKeyAbilityLabel || "Ability"}</span>
            <span className="text-sm text-center">{UI_STRINGS.skillsTableHeaderAbilityModLabel || "Mod"}</span>
            <span className="text-sm text-center">{UI_STRINGS.skillsTableHeaderRanksLabel || "Ranks"}</span>
            <span className="text-sm text-center">{UI_STRINGS.skillsTableHeaderMiscModLabel || "Misc"}</span>
            <span className="text-sm text-center">{UI_STRINGS.skillsTableHeaderClassLabel || "Class?"}</span>
          </div>

          {skills.map(skill => {
            const skillDef = SKILL_DEFINITIONS.find(sd => sd.value === skill.id);
            const keyAbilityShort = skillDef?.keyAbility ? (skillDef.keyAbility as string).substring(0, 3).toUpperCase() : 'N/A';
            const abilityMod = skillDef?.keyAbility ? getAbilityModifierByName(abilityScores, skillDef.keyAbility as AbilityName) : 0;
            const totalBonus = (skill.ranks || 0) + abilityMod + (skill.miscModifier || 0);
            const maxRanks = calculateMaxRanks(overallLevel, skill.isClassSkill || false, intelligenceModifier);
            
            return (
              <div key={`skill-listing-${skill.id}`} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-x-2 px-2 py-2 items-center border-b border-border/50 hover:bg-muted/20 transition-colors">
                <Label htmlFor={`form_skill_ranks_${skill.id}_listing`} className="text-sm truncate pr-1">{skillDef?.label || skill.id}</Label>
                <span className="text-lg font-bold text-accent text-center w-10">{totalBonus >= 0 ? '+' : ''}{totalBonus}</span>
                <span className="text-xs text-muted-foreground text-center w-10">{keyAbilityShort}</span>
                <span className="text-sm text-center w-10">{abilityMod >= 0 ? '+' : ''}{abilityMod}</span>
                <div className="flex justify-center w-32">
                  <NumberSpinnerInput
                    id={`form_skill_ranks_${skill.id}_listing`} 
                    value={skill.ranks || 0}
                    onChange={(newValue) => onSkillChange(skill.id, newValue, skill.miscModifier || 0, skill.isClassSkill)}
                    step={(skill.isClassSkill || skillDef?.keyAbility === 'none') ? 1 : 0.5}
                    min={0}
                    inputClassName="w-14 h-7 text-sm"
                    buttonClassName="h-7 w-7"
                    buttonSize="sm"
                  />
                </div>
                <div className="flex justify-center w-16">
                  <NumberSpinnerInput
                    id={`form_skill_misc_${skill.id}_listing`} 
                    value={skill.miscModifier || 0}
                    onChange={(newValue) => onSkillChange(skill.id, skill.ranks || 0, newValue, skill.isClassSkill)}
                    min={-20} max={20}
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
                            id={`form_skill_class_${skill.id}_listing`} 
                            checked={skill.isClassSkill}
                            onCheckedChange={(checked) => onSkillChange(skill.id, skill.ranks || 0, skill.miscModifier || 0, !!checked)}
                          />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{(UI_STRINGS.skillsTableTooltipMaxRanks || "Max Ranks: {maxRanksValue}").replace("{maxRanksValue}", String(maxRanks))}</p>
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
};

SkillsListing.displayName = "SkillsListingComponent";
