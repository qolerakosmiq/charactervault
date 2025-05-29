
import constantsData from '@/data/dnd-constants.json';

export interface CharacterClass {
  id: string;
  className: string; // Stores kebab-case ID
  level: number;
}

export interface CustomSynergyRule {
  id: string; 
  targetSkillName: string; // Stores ID of target skill (kebab-case or UUID for custom)
  ranksInThisSkillRequired: number; 
  bonusGranted: number;
}

export interface Skill {
  id: string; // Kebab-case for predefined, UUID for custom
  name: string; // Human-readable name
  ranks: number;
  miscModifier: number;
  keyAbility?: AbilityName;
  isClassSkill?: boolean;
  providesSynergies?: CustomSynergyRule[];
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
  race: string; // Stores kebab-case ID
  alignment: string; // Stores raw alignment string
  deity?: string; // Stores kebab-case ID or custom string
  size: string; // Stores raw size string
  age: number;
  gender: string; // Stores kebab-case ID or custom string

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

// DndRace, DndClass etc. will now be string, representing the kebab-case ID
export type DndRaceId = typeof constantsData.DND_RACES_DATA[number]['value'];
export const DND_RACES: ReadonlyArray<{value: DndRaceId, label: string}> = constantsData.DND_RACES_DATA as ReadonlyArray<{value: DndRaceId, label: string}>;

export type DndClassId = typeof constantsData.DND_CLASSES_DATA[number]['value'];
export const DND_CLASSES: ReadonlyArray<{value: DndClassId, label: string, hitDice: string}> = constantsData.DND_CLASSES_DATA as ReadonlyArray<{value: DndClassId, label: string, hitDice: string}>;

export const GENDERS: ReadonlyArray<{value: string, label: string}> = constantsData.GENDERS_DATA;
export const DND_DEITIES: ReadonlyArray<{value: string, label: string}> = constantsData.DND_DEITIES_DATA as ReadonlyArray<{value: string, label: string}>;

// --- Skill Definitions from JSON ---
export type SkillDefinitionJsonData = typeof constantsData.SKILL_DEFINITIONS_DATA[number]; // {value: string, label: string, keyAbility: string}
export const SKILL_DEFINITIONS: readonly SkillDefinitionJsonData[] = constantsData.SKILL_DEFINITIONS_DATA as ReadonlyArray<SkillDefinitionJsonData>;

export type ClassSkillsJsonData = typeof constantsData.CLASS_SKILLS_DATA; // Record<DndClassId, DndSkillId[]>
export const CLASS_SKILLS: Readonly<ClassSkillsJsonData> = constantsData.CLASS_SKILLS_DATA as Readonly<ClassSkillsJsonData>;

export type ClassSkillPointsBaseJsonData = typeof constantsData.CLASS_SKILL_POINTS_BASE_DATA; // Record<DndClassId, number>
export const CLASS_SKILL_POINTS_BASE: Readonly<ClassSkillPointsBaseJsonData> = constantsData.CLASS_SKILL_POINTS_BASE_DATA as Readonly<ClassSkillPointsBaseJsonData>;

export type RaceSkillPointsBonusPerLevelJsonData = typeof constantsData.DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA; // Record<DndRaceId, number>
export const RACE_SKILL_POINTS_BONUS_PER_LEVEL: Readonly<RaceSkillPointsBonusPerLevelJsonData> = constantsData.DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA as Readonly<RaceSkillPointsBonusPerLevelJsonData>;

export function getRaceSkillPointsBonusPerLevel(raceId: DndRaceId | string): number {
    return (RACE_SKILL_POINTS_BONUS_PER_LEVEL as Record<string, number>)[raceId] || 0;
}

export function getInitialCharacterSkills(characterClasses: CharacterClass[]): Skill[] {
  const firstClassId = characterClasses[0]?.className as DndClassId | undefined;
  const classSkillsForCurrentClass = firstClassId ? (CLASS_SKILLS[firstClassId as keyof ClassSkillsJsonData] || []) : [];

  return SKILL_DEFINITIONS.map(def => {
    let isClassSkill = classSkillsForCurrentClass.includes(def.value);
    // Handle generic "craft-any" or "perform-any" etc.
    if (!isClassSkill) {
        const skillId = def.value;
        if (skillId.startsWith("craft-") && classSkillsForCurrentClass.includes("craft-any")) {
            isClassSkill = true;
        } else if (skillId.startsWith("knowledge-") && (classSkillsForCurrentClass.includes("knowledge-any") || classSkillsForCurrentClass.includes("knowledge-all"))) {
            isClassSkill = true;
        } else if (skillId.startsWith("perform-") && classSkillsForCurrentClass.includes("perform-any")) {
            isClassSkill = true;
        } else if (skillId.startsWith("profession-") && classSkillsForCurrentClass.includes("profession-any")) {
            isClassSkill = true;
        }
    }
    return {
      id: def.value, // Use kebab-case ID from JSON
      name: def.label, // Use human-readable label from JSON
      keyAbility: def.keyAbility as AbilityName,
      ranks: 0,
      miscModifier: 0,
      isClassSkill: isClassSkill,
      providesSynergies: [] 
    };
  });
}

// --- Aging Effects ---
export type RaceAgingCategoryKey = keyof typeof constantsData.DND_RACE_AGING_EFFECTS_DATA;

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

export function getNetAgingEffects(raceId: DndRaceId, age: number): AgingEffectsDetails {
  const raceVenerableAge = (constantsData.DND_RACE_BASE_MAX_AGE_DATA as Record<DndRaceId, number>)[raceId];
  if (raceVenerableAge === undefined) return { categoryName: "Adult", effects: [] };

  const agingCategoryKey = (constantsData.RACE_TO_AGING_CATEGORY_MAP_DATA as Record<DndRaceId, RaceAgingCategoryKey>)[raceId];
  if (!agingCategoryKey) return { categoryName: "Adult", effects: [] };

  const raceAgingPattern = (constantsData.DND_RACE_AGING_EFFECTS_DATA as Record<RaceAgingCategoryKey, RaceAgingInfoData>)[agingCategoryKey];
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
     highestAttainedCategoryEffects = {};
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
            return signA - signB; 
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
            return signA - signB;
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

export function getRaceAbilityEffects(raceId: DndRaceId): RaceAbilityEffectsDetails {
  const modifiers = (constantsData.DND_RACE_ABILITY_MODIFIERS_DATA as Record<DndRaceId, Partial<Record<AbilityName, number>>>)[raceId];
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
            return signA - signB; 
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
export interface SynergyEffectJsonData {
  targetSkill: string; // Kebab-case skill ID
  ranksRequired: number;
  bonus: number;
}

export type SkillSynergiesJsonData = Record<string, SynergyEffectJsonData[]>; // Key is kebab-case providing skill ID

export const SKILL_SYNERGIES: Readonly<SkillSynergiesJsonData> = constantsData.SKILL_SYNERGIES_DATA as Readonly<SkillSynergiesJsonData>;

export function calculateTotalSynergyBonus(targetSkillId: string, currentCharacterSkills: Skill[]): number {
  let totalBonus = 0;
  
  // 1. Check predefined synergies from SKILL_SYNERGIES_DATA
  if (SKILL_SYNERGIES) {
    for (const providingSkillId in SKILL_SYNERGIES) {
      const synergiesProvidedByThisDefinition = SKILL_SYNERGIES[providingSkillId];
      if (synergiesProvidedByThisDefinition) {
        for (const synergy of synergiesProvidedByThisDefinition) {
          if (synergy.targetSkill === targetSkillId) {
            const providingSkillInCharacter = currentCharacterSkills.find(s => s.id === providingSkillId);
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
        // customRule.targetSkillName stores the ID of the target skill
        if (customRule.targetSkillName === targetSkillId) { 
          if ((providingSkill.ranks || 0) >= customRule.ranksInThisSkillRequired) {
            totalBonus += customRule.bonusGranted;
          }
        }
      }
    }
  }
  
  return totalBonus;
}

  