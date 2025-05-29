
import constantsData from '@/data/dnd-constants.json';

export interface CharacterClass {
  id: string;
  className: string;
  level: number;
}

// New interface for custom-defined synergy rules
export interface CustomSynergyRule {
  id: string;
  targetSkillName: string;
  ranksInThisSkillRequired: number;
  bonusGranted: number;
  description?: string;
}

export interface Skill {
  id: string;
  name: string;
  ranks: number;
  miscModifier: number;
  keyAbility?: AbilityName;
  isClassSkill?: boolean;
  providesSynergies?: CustomSynergyRule[]; // New: Synergies this skill provides
}

export interface Feat {
  id: string;
  name: string;
  description?: string;
}

export interface Item {
  id: string;
  name: string;
  quantity: number;
  description?: string;
  weight?: number;
}

export type AbilityName = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma' | 'none';
const ABILITY_ORDER: AbilityName[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];


export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface SavingThrows {
  fortitude: { base: number; magicMod: number; miscMod: number; total?: number, abilityMod?: number };
  reflex: { base: number; magicMod: number; miscMod: number; total?: number, abilityMod?: number };
  will: { base: number; magicMod: number; miscMod: number; total?: number, abilityMod?: number };
}

export interface Character {
  id: string;
  name: string;
  race: string;
  alignment: string;
  deity?: string;
  size: string;
  age: number;
  gender: string;

  abilityScores: AbilityScores;
  hp: number;
  maxHp: number;

  armorBonus: number;
  shieldBonus: number;
  sizeModifierAC: number;
  naturalArmor: number;
  deflectionBonus: number;
  dodgeBonus: number;
  acMiscModifier: number;

  initiativeMiscModifier: number;
  savingThrows: SavingThrows;

  classes: CharacterClass[];
  skills: Skill[];
  feats: Feat[];
  inventory: Item[];
  personalStory?: string;
  portraitDataUrl?: string;
}

export const DEFAULT_ABILITIES: AbilityScores = constantsData.DEFAULT_ABILITIES as AbilityScores;

export const DEFAULT_SAVING_THROWS: SavingThrows = constantsData.DEFAULT_SAVING_THROWS as SavingThrows;

// --- Types derived from JSON structure ---
export type CharacterSize = typeof constantsData.SIZES_DATA[number];
export const SIZES: readonly CharacterSize[] = constantsData.SIZES_DATA;

export type CharacterAlignment = typeof constantsData.ALIGNMENTS_DATA[number];
export const ALIGNMENTS: readonly CharacterAlignment[] = constantsData.ALIGNMENTS_DATA;

export type DndRace = typeof constantsData.DND_RACES_DATA[number]['value'];
export const DND_RACES: ReadonlyArray<{value: DndRace, label: string}> = constantsData.DND_RACES_DATA as ReadonlyArray<{value: DndRace, label: string}>;

export type DndClass = typeof constantsData.DND_CLASSES_DATA[number]['value'];
export const DND_CLASSES: ReadonlyArray<{value: DndClass, label: string, hitDice: string}> = constantsData.DND_CLASSES_DATA as ReadonlyArray<{value: DndClass, label: string, hitDice: string}>;

export const GENDERS: ReadonlyArray<{value: string, label: string}> = constantsData.GENDERS_DATA;
export const DND_DEITIES: ReadonlyArray<{value: string, label: string}> = constantsData.DND_DEITIES_DATA;

// --- Skill Definitions from JSON ---
export type SkillDefinitionData = typeof constantsData.SKILL_DEFINITIONS_DATA[number];
export const SKILL_DEFINITIONS: readonly SkillDefinitionData[] = constantsData.SKILL_DEFINITIONS_DATA as ReadonlyArray<SkillDefinitionData>;

export type ClassSkillsData = typeof constantsData.CLASS_SKILLS_DATA;
export const CLASS_SKILLS: Readonly<ClassSkillsData> = constantsData.CLASS_SKILLS_DATA as Readonly<ClassSkillsData>;

export type ClassSkillPointsBaseData = typeof constantsData.CLASS_SKILL_POINTS_BASE_DATA;
export const CLASS_SKILL_POINTS_BASE: Readonly<ClassSkillPointsBaseData> = constantsData.CLASS_SKILL_POINTS_BASE_DATA as Readonly<ClassSkillPointsBaseData>;

export type RaceSkillPointsBonusPerLevelData = typeof constantsData.DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA;
export const RACE_SKILL_POINTS_BONUS_PER_LEVEL: Readonly<RaceSkillPointsBonusPerLevelData> = constantsData.DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA as Readonly<RaceSkillPointsBonusPerLevelData>;

export function getRaceSkillPointsBonusPerLevel(race: DndRace | string): number {
    return (RACE_SKILL_POINTS_BONUS_PER_LEVEL as Record<string, number>)[race] || 0;
}


export function getInitialCharacterSkills(characterClasses: CharacterClass[]): Skill[] {
  const firstClass = characterClasses[0]?.className as DndClass | undefined;
  const classSkillsForCurrentClass = firstClass ? (CLASS_SKILLS[firstClass as keyof ClassSkillsData] || []) : [];

  return SKILL_DEFINITIONS.map(def => {
    let isClassSkill = classSkillsForCurrentClass.includes(def.name);
    if (!isClassSkill) {
        // Handle generic "Craft (Any)" or "Knowledge (all skills, taken individually)"
        if (def.name.startsWith("Craft (") && classSkillsForCurrentClass.includes("Craft (Any)")) {
            isClassSkill = true;
        } else if (def.name.startsWith("Knowledge (") && (classSkillsForCurrentClass.includes("Knowledge (Any)") || classSkillsForCurrentClass.includes("Knowledge (all skills, taken individually)"))) {
            isClassSkill = true;
        } else if (def.name.startsWith("Perform (") && classSkillsForCurrentClass.includes("Perform (Any)")) {
            isClassSkill = true;
        } else if (def.name.startsWith("Profession (") && classSkillsForCurrentClass.includes("Profession (Any)")) {
            isClassSkill = true;
        }
    }
    const skillId = `skill-${def.name.toLowerCase().replace(/\W+/g, '-')}`;
    return {
      id: skillId,
      name: def.name,
      keyAbility: def.keyAbility as AbilityName,
      ranks: 0,
      miscModifier: 0,
      isClassSkill: isClassSkill,
      providesSynergies: [] // Initialize with empty array
    };
  });
}


// --- Aging Effects ---
export type RaceCategory = keyof typeof constantsData.DND_RACE_AGING_EFFECTS_DATA;

interface AgeCategoryEffectData {
  categoryName: string;
  ageFactor: number;
  effects: Partial<Record<AbilityName, number>>;
}

interface RaceAgingInfoData {
  categories: AgeCategoryEffectData[];
}

export interface AgingEffectsDetails {
  categoryName: string;
  effects: Array<{ ability: AbilityName; change: number }>;
}

export function getNetAgingEffects(raceValue: DndRace, age: number): AgingEffectsDetails {
  const raceVenerableAge = (constantsData.DND_RACE_BASE_MAX_AGE_DATA as Record<DndRace, number>)[raceValue];
  if (raceVenerableAge === undefined) return { categoryName: "Adult", effects: [] };

  const agingCategoryKey = (constantsData.RACE_TO_AGING_CATEGORY_MAP_DATA as Record<DndRace, RaceCategory>)[raceValue];
  if (!agingCategoryKey) return { categoryName: "Adult", effects: [] };

  const raceAgingPattern = (constantsData.DND_RACE_AGING_EFFECTS_DATA as Record<RaceCategory, RaceAgingInfoData>)[agingCategoryKey];
  if (!raceAgingPattern) return { categoryName: "Adult", effects: [] };

  let currentCategoryName: string = "Adult";
  let highestAttainedCategoryEffects: Partial<Record<AbilityName, number>> | null = null;

  const sortedCategories = [...raceAgingPattern.categories].sort((a, b) => a.ageFactor - b.ageFactor);


  for (const category of sortedCategories) {
    const ageThresholdForCategory = Math.floor(category.ageFactor * raceVenerableAge);
    if (age >= ageThresholdForCategory) {
      currentCategoryName = category.categoryName;
      highestAttainedCategoryEffects = category.effects;
    } else {
      break; 
    }
  }
  
  if (!highestAttainedCategoryEffects && (sortedCategories.length === 0 || age < Math.floor(sortedCategories[0].ageFactor * raceVenerableAge))) {
     currentCategoryName = "Adult";
     highestAttainedCategoryEffects = {}; // Ensure it's an empty object for "Adult" if no other category matched
  }


  const appliedEffects: Array<{ ability: AbilityName; change: number }> = [];
  if (highestAttainedCategoryEffects) {
    const abilitiesToProcess = (Object.keys(highestAttainedCategoryEffects) as AbilityName[])
      .filter(ability => highestAttainedCategoryEffects && highestAttainedCategoryEffects[ability] !== undefined && highestAttainedCategoryEffects[ability] !== 0);
    
    abilitiesToProcess.sort((aAbility, bAbility) => {
        const changeA = highestAttainedCategoryEffects![aAbility]!;
        const changeB = highestAttainedCategoryEffects![bAbility]!;
        const signA = Math.sign(changeA);
        const signB = Math.sign(changeB);

        if (signA !== signB) {
            return signA - signB; // Negative (-1) comes before positive (1)
        }
        const indexA = ABILITY_ORDER.indexOf(aAbility);
        const indexB = ABILITY_ORDER.indexOf(bAbility);
        return indexA - indexB;
    });


    for (const ability of abilitiesToProcess) {
        appliedEffects.push({ ability, change: highestAttainedCategoryEffects![ability]! });
    }
  }

  return {
    categoryName: currentCategoryName,
    effects: appliedEffects,
  };
}


// --- Size Ability Score Modifiers ---
export interface SizeAbilityEffectsDetails {
  effects: Array<{ ability: AbilityName; change: number }>;
}

export function getSizeAbilityEffects(size: CharacterSize): SizeAbilityEffectsDetails {
  const mods = (constantsData.DND_SIZE_ABILITY_MODIFIERS_DATA as Record<CharacterSize, Partial<Record<AbilityName, number>>>)[size];
  const appliedEffects: Array<{ ability: AbilityName; change: number }> = [];

  if (mods) {
    const abilitiesToProcess = (Object.keys(mods) as AbilityName[])
      .filter(ability => mods[ability] !== undefined && mods[ability] !== 0);

    abilitiesToProcess.sort((aAbility, bAbility) => {
        const changeA = mods![aAbility]!;
        const changeB = mods![bAbility]!;
        const signA = Math.sign(changeA);
        const signB = Math.sign(changeB);

        if (signA !== signB) {
            return signA - signB; // Negative first
        }
        const indexA = ABILITY_ORDER.indexOf(aAbility);
        const indexB = ABILITY_ORDER.indexOf(bAbility);
        return indexA - indexB;
    });

    for (const ability of abilitiesToProcess) {
      appliedEffects.push({ ability, change: mods[ability]! });
    }
  }
  return { effects: appliedEffects };
}

// --- Race Ability Score Modifiers ---
export interface RaceAbilityEffectsDetails {
  effects: Array<{ ability: AbilityName; change: number }>;
}

export function getRaceAbilityEffects(raceValue: DndRace): RaceAbilityEffectsDetails {
  const modifiers = (constantsData.DND_RACE_ABILITY_MODIFIERS_DATA as Record<DndRace, Partial<Record<AbilityName, number>>>)[raceValue];
  const appliedEffects: Array<{ ability: AbilityName; change: number }> = [];

  if (modifiers) {
    const abilitiesToProcess = (Object.keys(modifiers) as AbilityName[])
      .filter(ability => modifiers[ability] !== undefined && modifiers[ability] !== 0);

     abilitiesToProcess.sort((aAbility, bAbility) => {
        const changeA = modifiers![aAbility]!;
        const changeB = modifiers![bAbility]!;
        const signA = Math.sign(changeA);
        const signB = Math.sign(changeB);

        if (signA !== signB) {
            return signA - signB; // Negative first
        }
        const indexA = ABILITY_ORDER.indexOf(aAbility);
        const indexB = ABILITY_ORDER.indexOf(bAbility);
        return indexA - indexB;
    });

    for (const ability of abilitiesToProcess) {
      appliedEffects.push({ ability, change: modifiers[ability]! });
    }
  }
  return { effects: appliedEffects };
}

// --- Skill Synergies (Predefined) ---
export interface SynergyEffect {
  targetSkill: string;
  ranksRequired: number;
  bonus: number;
  description?: string;
}

export type SkillSynergiesData = Record<string, SynergyEffect[]>;

export const SKILL_SYNERGIES: Readonly<SkillSynergiesData> = constantsData.SKILL_SYNERGIES_DATA as Readonly<SkillSynergiesData>;

export function calculateTotalSynergyBonus(targetSkillName: string, currentCharacterSkills: Skill[]): number {
  let totalBonus = 0;
  
  // 1. Check predefined synergies from SKILL_SYNERGIES_DATA
  if (SKILL_SYNERGIES) {
    for (const providingSkillName in SKILL_SYNERGIES) {
      const synergiesProvidedByThisDefinition = SKILL_SYNERGIES[providingSkillName];
      if (synergiesProvidedByThisDefinition) {
        for (const synergy of synergiesProvidedByThisDefinition) {
          if (synergy.targetSkill === targetSkillName) {
            const providingSkillInCharacter = currentCharacterSkills.find(s => s.name === providingSkillName);
            if (providingSkillInCharacter && (providingSkillInCharacter.ranks || 0) >= synergy.ranksRequired) {
              totalBonus += synergy.bonus;
            }
          }
        }
      }
    }
  }

  // 2. Check custom synergies defined on skills within currentCharacterSkills
  for (const providingSkill of currentCharacterSkills) {
    if (providingSkill.providesSynergies) {
      for (const customRule of providingSkill.providesSynergies) {
        if (customRule.targetSkillName === targetSkillName) {
          if ((providingSkill.ranks || 0) >= customRule.ranksInThisSkillRequired) {
            totalBonus += customRule.bonusGranted;
          }
        }
      }
    }
  }
  
  return totalBonus;
}

