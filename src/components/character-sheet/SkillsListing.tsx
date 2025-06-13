
'use client';

import type { Character, Skill as SkillType, AbilityScores, AggregatedFeatEffects, DetailedAbilityScores } from '@/types/character'; // Added AggregatedFeatEffects, DetailedAbilityScores
import type { AbilityName } from '@/types/character-core'; // Explicitly from core
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scroll, Loader2 } from 'lucide-react';
import { getAbilityModifierByName } from '@/lib/dnd-utils'; // calculateSumOfClassLevels removed as XP is now used for level
import { calculateMaxRanks } from '@/lib/constants';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { calculateLevelFromXp, calculateTotalSynergyBonus, calculateRacialSkillBonus, calculateSizeSpecificSkillBonus } from '@/types/character'; // Import relevant calculators
import React from 'react'; // Added React for useMemo

interface SkillsListingProps {
  skills: SkillType[];
  abilityScores: AbilityScores; // Base scores for editing ranks/misc
  characterClasses: Character['classes'];
  characterExperiencePoints: number;
  detailedAbilityScores: DetailedAbilityScores | null; // For accurate ability mod
  aggregatedFeatEffects: AggregatedFeatEffects | null; // For feat bonuses
  onSkillChange: (skillId: string, ranks: number, miscModifier: number, isClassSkill?: boolean) => void;
}

export const SkillsListing: React.FC<SkillsListingProps> = ({
  skills,
  abilityScores, // This is the base abilityScores from character state, NOT detailedAbilityScores
  characterClasses,
  characterExperiencePoints,
  detailedAbilityScores, // This is the one with all effects applied
  aggregatedFeatEffects,
  onSkillChange,
}) => {
  const { translations, isLoading: translationsLoading } = useI18n();

  const overallLevel = React.useMemo(() => {
    if (translationsLoading || !translations?.XP_TABLE) return 1; // Fallback level if data not ready
    return calculateLevelFromXp(characterExperiencePoints, translations.XP_TABLE, translations.EPIC_LEVEL_XP_INCREASE);
  }, [characterExperiencePoints, translations, translationsLoading]);

  // Use detailedAbilityScores for intelligenceModifier if available, otherwise fallback to base
  const intelligenceModifier = React.useMemo(() => {
    if (detailedAbilityScores) {
      return getAbilityModifierByName(detailedAbilityScores, 'intelligence');
    }
    return getAbilityModifierByName(abilityScores, 'intelligence');
  }, [abilityScores, detailedAbilityScores]);


  if (translationsLoading || !translations?.UI_STRINGS || !translations.SKILL_DEFINITIONS || !detailedAbilityScores || !aggregatedFeatEffects) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Scroll className="h-6 w-6 text-primary" />
            <CardTitle className="font-serif">{translations?.UI_STRINGS?.skillsPanelTitle || "Skills"}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">{translations?.UI_STRINGS?.skillsPanelLoadingSkills || "Loading skills..."}</p>
          </div>
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }
  const { SKILL_DEFINITIONS, UI_STRINGS, ABILITY_LABELS, DND_RACES, SIZES, SKILL_SYNERGIES } = translations;
  const characterRaceId = 'human'; // Placeholder, should come from character prop if available
  const characterSizeId = 'medium'; // Placeholder

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

          {skills.map(skillInstance => {
            const skillDef = SKILL_DEFINITIONS.find(sd => sd.value === skillInstance.id);
            if (!skillDef) return null;

            const keyAbility = skillDef.keyAbility as Exclude<AbilityName, 'none'> | 'none';
            const keyAbilityShort = keyAbility !== 'none' ? (ABILITY_LABELS.find(al => al.value === keyAbility)?.abbr || keyAbility.substring(0, 3).toUpperCase()) : 'N/A';
            
            const abilityMod = keyAbility !== 'none' && detailedAbilityScores
              ? getAbilityModifierByName(detailedAbilityScores, keyAbility)
              : 0;
            
            const synergyBonus = calculateTotalSynergyBonus(skillDef.value, skills, SKILL_DEFINITIONS, SKILL_SYNERGIES, []); // Assuming no custom skills on sheet display for now
            const featSkillBonus = aggregatedFeatEffects.skillBonuses[skillDef.value] || 0;
            const racialBonus = calculateRacialSkillBonus(skillDef.value, characterRaceId, DND_RACES, SKILL_DEFINITIONS);
            const sizeSpecificBonus = calculateSizeSpecificSkillBonus(skillDef.value, characterSizeId, SIZES);
            const userMiscMod = skillInstance.miscModifier || 0;
            
            const totalBonus = (skillInstance.ranks || 0) + abilityMod + synergyBonus + featSkillBonus + racialBonus + sizeSpecificBonus + userMiscMod;
            const maxRanks = calculateMaxRanks(overallLevel, skillInstance.isClassSkill || false, intelligenceModifier);
            
            return (
              <div key={`cs-skill-listing-${skillInstance.id}`} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-x-2 px-2 py-2 items-center border-b border-border/50 hover:bg-muted/20 transition-colors">
                <Label htmlFor={`cs_form_skill_ranks_${skillInstance.id}_listing`} className="text-sm truncate pr-1">{skillDef.label}</Label>
                <span className="text-lg font-bold text-accent text-center w-10">{totalBonus >= 0 ? '+' : ''}{totalBonus}</span>
                <span className="text-xs text-muted-foreground text-center w-10">{keyAbilityShort}</span>
                <span className="text-sm text-center w-10">{abilityMod >= 0 ? '+' : ''}{abilityMod}</span>
                <div className="flex justify-center w-32">
                  <NumberSpinnerInput
                    id={`cs_form_skill_ranks_${skillInstance.id}_listing`} 
                    value={skillInstance.ranks || 0}
                    onChange={(newValue) => onSkillChange(skillInstance.id, newValue, skillInstance.miscModifier || 0, skillInstance.isClassSkill)}
                    step={(skillInstance.isClassSkill || keyAbility === 'none') ? 1 : 0.5}
                    min={0}
                    inputClassName="w-14 h-7 text-sm"
                    buttonClassName="h-7 w-7"
                    buttonSize="sm"
                  />
                </div>
                <div className="flex justify-center w-16">
                  <NumberSpinnerInput
                    id={`cs_form_skill_misc_${skillInstance.id}_listing`} 
                    value={skillInstance.miscModifier || 0}
                    onChange={(newValue) => onSkillChange(skillInstance.id, skillInstance.ranks || 0, newValue, skillInstance.isClassSkill)}
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
                            id={`cs_form_skill_class_${skillInstance.id}_listing`} 
                            checked={skillInstance.isClassSkill}
                            onCheckedChange={(checked) => onSkillChange(skillInstance.id, skillInstance.ranks || 0, skillInstance.miscModifier || 0, !!checked)}
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

    