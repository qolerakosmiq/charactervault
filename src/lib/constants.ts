import type { Skill, AbilityName } from "@/types/character";

export type SkillDefinition = {
  name: string;
  keyAbility: AbilityName;
  isClassSkillFor?: string[]; // List of classes for which this is a class skill
};

// This is a sample, expand with all D&D 3.5 skills and class skill mappings
export const SKILL_DEFINITIONS: SkillDefinition[] = [
  { name: "Appraise", keyAbility: "intelligence", isClassSkillFor: ["Bard", "Rogue", "Wizard"] },
  { name: "Balance", keyAbility: "dexterity", isClassSkillFor: ["Monk", "Rogue"] },
  { name: "Bluff", keyAbility: "charisma", isClassSkillFor: ["Bard", "Rogue", "Sorcerer"] },
  { name: "Climb", keyAbility: "strength", isClassSkillFor: ["Barbarian", "Fighter", "Monk", "Ranger", "Rogue"] },
  { name: "Concentration", keyAbility: "constitution", isClassSkillFor: ["Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Wizard"] },
  { name: "Craft (Alchemy)", keyAbility: "intelligence", isClassSkillFor: ["Wizard"] },
  { name: "Craft (Varies)", keyAbility: "intelligence", isClassSkillFor: [] }, // Generic craft
  { name: "Decipher Script", keyAbility: "intelligence", isClassSkillFor: ["Bard", "Rogue", "Wizard"] },
  { name: "Diplomacy", keyAbility: "charisma", isClassSkillFor: ["Bard", "Cleric", "Druid", "Paladin", "Rogue"] },
  { name: "Disable Device", keyAbility: "intelligence", isClassSkillFor: ["Rogue"] },
  { name: "Disguise", keyAbility: "charisma", isClassSkillFor: ["Bard", "Rogue"] },
  { name: "Escape Artist", keyAbility: "dexterity", isClassSkillFor: ["Bard", "Monk", "Rogue"] },
  { name: "Forgery", keyAbility: "intelligence", isClassSkillFor: ["Rogue"] },
  { name: "Gather Information", keyAbility: "charisma", isClassSkillFor: ["Bard", "Rogue"] },
  { name: "Handle Animal", keyAbility: "charisma", isClassSkillFor: ["Barbarian", "Druid", "Paladin", "Ranger"] },
  { name: "Heal", keyAbility: "wisdom", isClassSkillFor: ["Cleric", "Druid", "Paladin", "Ranger"] },
  { name: "Hide", keyAbility: "dexterity", isClassSkillFor: ["Bard", "Monk", "Ranger", "Rogue"] },
  { name: "Intimidate", keyAbility: "charisma", isClassSkillFor: ["Barbarian", "Fighter", "Rogue"] },
  { name: "Jump", keyAbility: "strength", isClassSkillFor: ["Barbarian", "Fighter", "Monk", "Ranger", "Rogue"] },
  { name: "Knowledge (Arcana)", keyAbility: "intelligence", isClassSkillFor: ["Bard", "Cleric", "Sorcerer", "Wizard"] },
  { name: "Knowledge (Religion)", keyAbility: "intelligence", isClassSkillFor: ["Cleric", "Monk", "Paladin", "Wizard"] },
  { name: "Knowledge (Nature)", keyAbility: "intelligence", isClassSkillFor: ["Barbarian", "Druid", "Ranger", "Wizard"] },
  // Add all other Knowledges
  { name: "Listen", keyAbility: "wisdom", isClassSkillFor: ["Barbarian", "Bard", "Druid", "Monk", "Ranger", "Rogue"] },
  { name: "Move Silently", keyAbility: "dexterity", isClassSkillFor: ["Bard", "Monk", "Ranger", "Rogue"] },
  { name: "Open Lock", keyAbility: "dexterity", isClassSkillFor: ["Rogue"] },
  { name: "Perform (Varies)", keyAbility: "charisma", isClassSkillFor: ["Bard", "Rogue"] },
  { name: "Profession (Varies)", keyAbility: "wisdom", isClassSkillFor: [] },
  { name: "Ride", keyAbility: "dexterity", isClassSkillFor: ["Barbarian", "Cleric", "Druid", "Fighter", "Paladin", "Ranger"] },
  { name: "Search", keyAbility: "intelligence", isClassSkillFor: ["Ranger", "Rogue"] },
  { name: "Sense Motive", keyAbility: "wisdom", isClassSkillFor: ["Bard", "Cleric", "Monk", "Paladin", "Rogue"] },
  { name: "Sleight of Hand", keyAbility: "dexterity", isClassSkillFor: ["Bard", "Rogue"] },
  { name: "Spellcraft", keyAbility: "intelligence", isClassSkillFor: ["Bard", "Cleric", "Druid", "Sorcerer", "Wizard"] },
  { name: "Spot", keyAbility: "wisdom", isClassSkillFor: ["Barbarian", "Druid", "Monk", "Ranger", "Rogue"] },
  { name: "Survival", keyAbility: "wisdom", isClassSkillFor: ["Barbarian", "Druid", "Ranger"] },
  { name: "Swim", keyAbility: "strength", isClassSkillFor: ["Barbarian", "Fighter", "Monk", "Ranger", "Rogue"] },
  { name: "Tumble", keyAbility: "dexterity", isClassSkillFor: ["Bard", "Monk", "Rogue"] },
  { name: "Use Magic Device", keyAbility: "charisma", isClassSkillFor: ["Bard", "Rogue", "Sorcerer"] },
  { name: "Use Rope", keyAbility: "dexterity", isClassSkillFor: ["Ranger", "Rogue"] },
];

export function getInitialSkillsForCharacter(characterClasses: string[]): Skill[] {
  const characterLevel = 1; // Simplified for initial skill creation logic
  return SKILL_DEFINITIONS.map(def => ({
    id: crypto.randomUUID(), // Generate unique ID for each skill instance
    name: def.name,
    keyAbility: def.keyAbility,
    ranks: 0,
    miscModifier: 0,
    isClassSkill: def.isClassSkillFor?.some(cls => characterClasses.includes(cls)) || false,
  }));
}

export const CLASS_SKILL_POINTS_MODIFIER: Record<string, number> = {
  "Barbarian": 4,
  "Bard": 6,
  "Cleric": 2,
  "Druid": 4,
  "Fighter": 2,
  "Monk": 4,
  "Paladin": 2,
  "Ranger": 6,
  "Rogue": 8,
  "Sorcerer": 2,
  "Wizard": 2,
  // Add other base classes
};

export function calculateMaxRanks(level: number, isClassSkill: boolean, intelligenceModifier: number): number {
  // Simplified: this should be total character level.
  const effectiveLevel = level; // In a multiclass scenario, this is total character level.
  if (isClassSkill) {
    return effectiveLevel + 3;
  }
  return (effectiveLevel + 3) / 2;
}
