
import type { Skill, AbilityName } from "@/types/character";

// SKILL_DEFINITIONS and getInitialSkillsForCharacter are now primarily managed in types/character.ts using dnd-constants.json
// CLASS_SKILL_POINTS_MODIFIER is replaced by CLASS_SKILL_POINTS_BASE_DATA in dnd-constants.json

export type SkillDefinition = {
  name: string;
  keyAbility: AbilityName;
  // isClassSkillFor is now handled by CLASS_SKILLS_DATA in dnd-constants.json
};


export function calculateMaxRanks(level: number, isClassSkill: boolean, intelligenceModifier: number): number {
  // This function logic depends on total character level which is simplified to first class level here.
  // For character creation at level 1, this will typically be:
  // Class Skill: 1 + 3 = 4
  // Cross-Class Skill: (1 + 3) / 2 = 2
  // This needs to be adjusted if character creation can start at higher levels or for multiclassing.
  const effectiveLevel = level > 0 ? level : 1; // Ensure level is at least 1 for calculation
  if (isClassSkill) {
    return effectiveLevel + 3;
  }
  // PHB p.61 "Cross-Class Skills": Max ranks = (Character Level + 3) / 2. Round down.
  return Math.floor((effectiveLevel + 3) / 2);
}

