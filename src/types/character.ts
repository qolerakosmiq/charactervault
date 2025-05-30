
import baseDataJson from '@/data/dnd-base.json';
import customBaseDataJson from '@/data/custom-base.json';
import racesDataJson from '@/data/dnd-races.json';
import customRacesDataJson from '@/data/custom-races.json';
import classesDataJson from '@/data/dnd-classes.json';
import customClassesDataJson from '@/data/custom-classes.json';
import alignmentsDataJson from '@/data/dnd-alignments.json';
import customAlignmentsDataJson from '@/data/custom-alignments.json';
import deitiesDataJson from '@/data/dnd-deities.json';
import customDeitiesDataJson from '@/data/custom-deities.json';
import skillsDataJson from '@/data/dnd-skills.json';
import customSkillsDataJson from '@/data/custom-skills.json';
import featsDataJson from '@/data/dnd-feats.json';
import customFeatsDataJson from '@/data/custom-feats.json';

import { getBab } from '@/lib/dnd-utils';

export interface CharacterClass {
  id: string;
  className: DndClassId | ''; // kebab-case ID
  level: number;
}

export interface CustomSynergyRule {
  id: string; 
  targetSkillName: string; 
  ranksInThisSkillRequired: number; 
  bonusGranted: number;
}

export interface Skill {
  id: string; 
  name: string; 
  keyAbility?: AbilityName;
  isClassSkill?: boolean;
  ranks: number;
  miscModifier: number;
  description?: string;
  providesSynergies?: CustomSynergyRule[];
}

export interface FeatPrerequisiteDetails {
  bab?: number;
  abilities?: Partial<Record<Exclude<AbilityName, 'none'>, number>>;
  skills?: Array<{ id: string; ranks: number }>; 
  feats?: string[]; 
  casterLevel?: number;
  classLevel?: { classId: DndClassId | string; level: number };
  raceId?: DndRaceId | string;
  alignment?: string; 
  special?: string; 
}

export interface FeatEffectDetails {
  skills?: Record<string, number>; 
  abilities?: Partial<Record<Exclude<AbilityName, 'none'>, number>>;
}

export type FeatDefinitionJsonData = {
  value: string; 
  label: string; 
  description?: string;
  prerequisites?: FeatPrerequisiteDetails;
  effects?: FeatEffectDetails;
  canTakeMultipleTimes?: boolean;
  requiresSpecialization?: string;
};

export interface Feat {
  id: string; 
  name: string;
  description?: string;
  prerequisites?: FeatPrerequisiteDetails;
  effects?: FeatEffectDetails;
  effectsText?: string; 
  canTakeMultipleTimes?: boolean;
  requiresSpecialization?: string;
  specializationDetail?: string;
  isGranted?: boolean;
  grantedNote?: string;
  isCustom?: boolean; 
}


export interface Item {
  id: string;
  name: string;
  quantity: number;
  description?: string;
  weight?: number;
}

export type AbilityName = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma' | 'none';
const ABILITY_ORDER_INTERNAL: Exclude<AbilityName, 'none'>[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

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
  race: DndRaceId | '';
  alignment: CharacterAlignment;
  deity?: DndDeityId | string;
  size: CharacterSize;
  age: number;
  gender: GenderId | string | '';
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

// Helper function to merge array data, replacing items with the same 'value' ID
function mergeArrayData<T extends { value: string }>(base: T[], custom: T[]): T[] {
  const combinedMap = new Map<string, T>();
  base.forEach(item => combinedMap.set(item.value, item));
  custom.forEach(item => combinedMap.set(item.value, item)); // Custom overrides base
  return Array.from(combinedMap.values());
}

// Helper function to merge object data (simple shallow merge, custom overrides base)
function mergeObjectData<T extends Record<string, any>>(base: T, custom: T): T {
  return { ...base, ...custom };
}


// --- Base Data Merging ---
const baseDefaultAbilities = (baseDataJson as any).DEFAULT_ABILITIES || {};
const customDefaultAbilities = (customBaseDataJson as any).DEFAULT_ABILITIES || {};
export const DEFAULT_ABILITIES: AbilityScores = mergeObjectData(baseDefaultAbilities, customDefaultAbilities);

const baseDefaultSavingThrows = (baseDataJson as any).DEFAULT_SAVING_THROWS || {};
const customDefaultSavingThrows = (customBaseDataJson as any).DEFAULT_SAVING_THROWS || {};
export const DEFAULT_SAVING_THROWS: SavingThrows = mergeObjectData(baseDefaultSavingThrows, customDefaultSavingThrows);

const baseSizesData = (baseDataJson as any).SIZES_DATA || [];
const customSizesData = (customBaseDataJson as any).SIZES_DATA || [];
export const SIZES: ReadonlyArray<CharacterSizeObject> = mergeArrayData(baseSizesData, customSizesData);
export type CharacterSizeObject = { value: CharacterSize; label: string; };
export type CharacterSize = "fine" | "diminutive" | "tiny" | "small" | "medium" | "large" | "huge" | "gargantuan" | "colossal";


const baseGendersData = (baseDataJson as any).GENDERS_DATA || [];
const customGendersData = (customBaseDataJson as any).GENDERS_DATA || [];
export const GENDERS: ReadonlyArray<{value: string; label: string}> = mergeArrayData(baseGendersData, customGendersData);
export type GenderId = typeof GENDERS[number]['value'];

const baseRaceMinAdultAge = (baseDataJson as any).DND_RACE_MIN_ADULT_AGE_DATA || {};
const customRaceMinAdultAge = (customBaseDataJson as any).DND_RACE_MIN_ADULT_AGE_DATA || {};
export const DND_RACE_MIN_ADULT_AGE_DATA: Readonly<Record<string, number>> = mergeObjectData(baseRaceMinAdultAge, customRaceMinAdultAge);


const baseRaceMaxAge = (baseDataJson as any).DND_RACE_BASE_MAX_AGE_DATA || {};
const customRaceMaxAge = (customBaseDataJson as any).DND_RACE_BASE_MAX_AGE_DATA || {};
const DND_RACE_BASE_MAX_AGE_DATA: Readonly<Record<string, number>> = mergeObjectData(baseRaceMaxAge, customRaceMaxAge);

const baseRaceToAgingMap = (baseDataJson as any).RACE_TO_AGING_CATEGORY_MAP_DATA || {};
const customRaceToAgingMap = (customBaseDataJson as any).RACE_TO_AGING_CATEGORY_MAP_DATA || {};
const RACE_TO_AGING_CATEGORY_MAP_DATA: Readonly<Record<string, RaceAgingCategoryKey>> = mergeObjectData(baseRaceToAgingMap, customRaceToAgingMap);

const baseRaceAgingEffects = (baseDataJson as any).DND_RACE_AGING_EFFECTS_DATA || {};
const customRaceAgingEffects = (customBaseDataJson as any).DND_RACE_AGING_EFFECTS_DATA || {};
const DND_RACE_AGING_EFFECTS_DATA: Readonly<Record<RaceAgingCategoryKey, RaceAgingInfoData>> = mergeObjectData(baseRaceAgingEffects, customRaceAgingEffects);

const baseSizeAbilityModifiers = (baseDataJson as any).DND_SIZE_ABILITY_MODIFIERS_DATA || {};
const customSizeAbilityModifiers = (customBaseDataJson as any).DND_SIZE_ABILITY_MODIFIERS_DATA || {};
const DND_SIZE_ABILITY_MODIFIERS_DATA: Readonly<Record<string, Partial<Record<Exclude<AbilityName, 'none'>, number>>>> = mergeObjectData(baseSizeAbilityModifiers, customSizeAbilityModifiers);

const baseRaceAbilityModifiers = (baseDataJson as any).DND_RACE_ABILITY_MODIFIERS_DATA || {};
const customRaceAbilityModifiers = (customBaseDataJson as any).DND_RACE_ABILITY_MODIFIERS_DATA || {};
const DND_RACE_ABILITY_MODIFIERS_DATA: Readonly<Record<string, Partial<Record<Exclude<AbilityName, 'none'>, number>>>> = mergeObjectData(baseRaceAbilityModifiers, customRaceAbilityModifiers);

const baseRaceSkillPointsBonus = (baseDataJson as any).DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA || {};
const customRaceSkillPointsBonus = (customBaseDataJson as any).DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA || {};
const DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA: Readonly<Record<string, number>> = mergeObjectData(baseRaceSkillPointsBonus, customRaceSkillPointsBonus);


// --- Alignments Data Merging ---
const baseAlignmentsData = (alignmentsDataJson as any).ALIGNMENTS_DATA || [];
const customAlignmentsDataFile = (customAlignmentsDataJson as any).ALIGNMENTS_DATA || [];
export const ALIGNMENTS: ReadonlyArray<CharacterAlignmentObject> = mergeArrayData(baseAlignmentsData, customAlignmentsDataFile);
export type CharacterAlignmentObject = { value: CharacterAlignment; label: string; description: string; };
export type CharacterAlignment =
  | "lawful-good" | "neutral-good" | "chaotic-good"
  | "lawful-neutral" | "true-neutral" | "chaotic-neutral"
  | "lawful-evil" | "neutral-evil" | "chaotic-evil";

export const ALIGNMENT_PREREQUISITE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  ...ALIGNMENTS.map(a => ({ value: a.value, label: a.label })),
  { value: 'lawful', label: 'Any Lawful' },
  { value: 'neutral-lc', label: 'Any Neutral (Law/Chaos Axis)' },
  { value: 'chaotic', label: 'Any Chaotic' },
  { value: 'good', label: 'Any Good' },
  { value: 'neutral-ge', label: 'Any Neutral (Good/Evil Axis)' },
  { value: 'evil', label: 'Any Evil' },
];


// --- Races Data Merging ---
const baseRacesData = (racesDataJson as any).DND_RACES_DATA || [];
const customRacesDataFile = (customRacesDataJson as any).DND_RACES_DATA || [];
export const DND_RACES: ReadonlyArray<DndRaceOption> = mergeArrayData(baseRacesData, customRacesDataFile);
export type DndRaceOption = {
  value: DndRaceId;
  label: string;
  description?: string;
  bonusFeatSlots?: number;
  racialSkillBonuses?: Record<string, number>; 
  grantedFeats?: Array<{ featId: string; note?: string; levelAcquired?: number }>;
};
export type DndRaceId = "human" | "elf" | "dwarf" | "halfling" | "gnome" | "half-elf" | "half-orc" | string;


// --- Classes Data Merging ---
const baseClassesData = (classesDataJson as any).DND_CLASSES_DATA || [];
const customClassesDataFile = (customClassesDataJson as any).DND_CLASSES_DATA || [];
export const DND_CLASSES: ReadonlyArray<DndClassOption> = mergeArrayData(baseClassesData, customClassesDataFile);
export type DndClassOption = {
  value: DndClassId;
  label: string;
  hitDice: string;
  description: string;
  isCaster?: boolean;
  grantedFeats?: Array<{ featId: string; note?: string; levelAcquired?: number }>;
};
export type DndClassId = "barbarian" | "bard" | "cleric" | "druid" | "fighter" | "monk" | "paladin" | "ranger" | "rogue" | "sorcerer" | "wizard" | string;


// --- Deities Data Merging ---
const baseDeitiesData = (deitiesDataJson as any).DND_DEITIES_DATA || [];
const customDeitiesDataFile = (customDeitiesDataJson as any).DND_DEITIES_DATA || [];
export const DND_DEITIES: ReadonlyArray<DndDeityOption> = mergeArrayData(baseDeitiesData, customDeitiesDataFile);
export type DndDeityOption = {
  value: DndDeityId;
  label: string;
  alignment: CharacterAlignment;
  description?: string;
};
export type DndDeityId = typeof DND_DEITIES[number]['value'];


// --- Feats Data Merging ---
const baseFeatsData = (featsDataJson as any).DND_FEATS_DATA || [];
const customFeatsDataFile = (customFeatsDataJson as any).DND_FEATS_DATA || [];
export const DND_FEATS: readonly FeatDefinitionJsonData[] = mergeArrayData(baseFeatsData, customFeatsDataFile);


// --- Skills Data Merging ---
const baseSkillDefinitions = (skillsDataJson as any).SKILL_DEFINITIONS_DATA || [];
const customSkillDefinitions = (customSkillsDataJson as any).SKILL_DEFINITIONS_DATA || [];
export const SKILL_DEFINITIONS: readonly SkillDefinitionJsonData[] = mergeArrayData(baseSkillDefinitions, customSkillDefinitions);
export type SkillDefinitionJsonData = {
  value: string; 
  label: string; 
  keyAbility: AbilityName | string; 
  description?: string;
};

const baseClassSkills = (skillsDataJson as any).CLASS_SKILLS_DATA || {};
const customClassSkills = (customSkillsDataJson as any).CLASS_SKILLS_DATA || {};
export type ClassSkillsJsonData = Record<string, string[]>; 
export const CLASS_SKILLS: Readonly<ClassSkillsJsonData> = mergeObjectData(baseClassSkills, customClassSkills);

const baseClassSkillPoints = (skillsDataJson as any).CLASS_SKILL_POINTS_BASE_DATA || {};
const customClassSkillPoints = (customSkillsDataJson as any).CLASS_SKILL_POINTS_BASE_DATA || {};
export type ClassSkillPointsBaseJsonData = Record<string, number>; 
export const CLASS_SKILL_POINTS_BASE: Readonly<ClassSkillPointsBaseJsonData> = mergeObjectData(baseClassSkillPoints, customClassSkillPoints);

const baseSkillSynergies = (skillsDataJson as any).SKILL_SYNERGIES_DATA || {};
const customSkillSynergies = (customSkillsDataJson as any).SKILL_SYNERGIES_DATA || {};
export type SynergyEffectJsonData = { targetSkill: string; ranksRequired: number; bonus: number }; 
export type SkillSynergiesJsonData = Record<string, SynergyEffectJsonData[]>; 
export const SKILL_SYNERGIES: Readonly<SkillSynergiesJsonData> = mergeObjectData(baseSkillSynergies, customSkillSynergies);

// Helper function using data from dnd-base.json
export function getRaceSkillPointsBonusPerLevel(raceId: DndRaceId | string): number {
    return (DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA as Record<string, number>)[raceId] || 0;
}

export function getInitialCharacterSkills(characterClasses: CharacterClass[]): Skill[] {
  const firstClassValue = characterClasses[0]?.className;
  const classSkillsForCurrentClass = firstClassValue ? (CLASS_SKILLS[firstClassValue as keyof ClassSkillsJsonData] || []) : [];

  return SKILL_DEFINITIONS.map(def => {
    let isClassSkill = classSkillsForCurrentClass.includes(def.value);
    return {
      id: def.value,
      name: def.label,
      keyAbility: def.keyAbility as AbilityName,
      ranks: 0,
      miscModifier: 0,
      isClassSkill: isClassSkill,
      providesSynergies: [],
      description: def.description || ""
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

export type RaceAgingCategoryKey = keyof typeof DND_RACE_AGING_EFFECTS_DATA;

interface AgeCategoryEffectData {
  categoryName: RaceAgingCategoryKey | string; 
  ageFactor: number;
  effects: Partial<Record<Exclude<AbilityName, 'none'>, number>>;
}

interface RaceAgingInfoData {
  categories: AgeCategoryEffectData[];
}

export interface AgingEffectsDetails {
  categoryName: string; 
  effects: Array<{ ability: Exclude<AbilityName, 'none'>; change: number }>;
}

export function getNetAgingEffects(raceId: DndRaceId | '', age: number): AgingEffectsDetails {
  if (!raceId) return { categoryName: "Adult", effects: [] };

  const raceMaxAge = DND_RACE_BASE_MAX_AGE_DATA[raceId as DndRaceId];
  if (raceMaxAge === undefined) return { categoryName: "Adult", effects: [] };

  const agingCategoryKey = RACE_TO_AGING_CATEGORY_MAP_DATA[raceId as DndRaceId];
  if (!agingCategoryKey) return { categoryName: "Adult", effects: [] };

  const raceAgingPattern = DND_RACE_AGING_EFFECTS_DATA[agingCategoryKey];
  if (!raceAgingPattern) return { categoryName: "Adult", effects: [] };

  let currentCategoryLabel: string = "Adult";
  let highestAttainedCategoryEffects: Partial<Record<Exclude<AbilityName, 'none'>, number>> | null = null;
  const sortedCategories = [...raceAgingPattern.categories].sort((a, b) => a.ageFactor - b.ageFactor);

  for (const category of sortedCategories) {
    const ageThresholdForCategory = Math.floor(category.ageFactor * raceMaxAge);
    if (age >= ageThresholdForCategory) {
      currentCategoryLabel = category.categoryName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      highestAttainedCategoryEffects = category.effects;
    } else {
      break;
    }
  }

  const appliedEffects: Array<{ ability: Exclude<AbilityName, 'none'>; change: number }> = [];
  if (highestAttainedCategoryEffects) {
    const abilitiesToProcess = ABILITY_ORDER_INTERNAL.filter(
      ability => highestAttainedCategoryEffects && highestAttainedCategoryEffects[ability] !== undefined && highestAttainedCategoryEffects[ability] !== 0
    );

    
    abilitiesToProcess.sort((aAbility, bAbility) => {
        const changeA = highestAttainedCategoryEffects![aAbility]!;
        const changeB = highestAttainedCategoryEffects![bAbility]!;
        const signA = Math.sign(changeA);
        const signB = Math.sign(changeB);
        if (signA !== signB) return signA - signB; 
        return ABILITY_ORDER_INTERNAL.indexOf(aAbility) - ABILITY_ORDER_INTERNAL.indexOf(bAbility);
    });

    for (const ability of abilitiesToProcess) {
        appliedEffects.push({ ability, change: highestAttainedCategoryEffects![ability]! });
    }
  }
  return {
    categoryName: currentCategoryLabel,
    effects: appliedEffects,
  };
}

export interface RaceSpecialQualities {
  abilityEffects: Array<{ ability: Exclude<AbilityName, 'none'>; change: number }>;
  skillBonuses?: Array<{ skillName: string; bonus: number }>;
  grantedFeats?: Array<{ featId: string; name: string; note?: string; levelAcquired?: number }>;
  bonusFeatSlots?: number;
}

export function getRaceSpecialQualities(raceId: DndRaceId | ''): RaceSpecialQualities {
  if (!raceId) return { abilityEffects: [], skillBonuses: [], grantedFeats: [], bonusFeatSlots: 0 };

  const raceData = DND_RACES.find(r => r.value === raceId);
  const abilityModifiers = raceId ? DND_RACE_ABILITY_MODIFIERS_DATA[raceId as DndRaceId] : undefined;

  const appliedAbilityEffects: Array<{ ability: Exclude<AbilityName, 'none'>; change: number }> = [];
  if (abilityModifiers) {
    const abilitiesToProcess = ABILITY_ORDER_INTERNAL.filter(
      ability => abilityModifiers[ability] !== undefined && abilityModifiers[ability] !== 0
    );
     abilitiesToProcess.sort((aAbility, bAbility) => {
        const changeA = abilityModifiers![aAbility]!;
        const changeB = abilityModifiers![bAbility]!;
        const signA = Math.sign(changeA);
        const signB = Math.sign(changeB);
        if (signA !== signB) return signA - signB;
        return ABILITY_ORDER_INTERNAL.indexOf(aAbility) - ABILITY_ORDER_INTERNAL.indexOf(bAbility);
    });
    for (const ability of abilitiesToProcess) {
      appliedAbilityEffects.push({ ability, change: abilityModifiers[ability]! });
    }
  }

  const appliedSkillBonuses: Array<{ skillName: string; bonus: number }> = [];
  if (raceData?.racialSkillBonuses) {
    for (const [skillId_kebab, bonus] of Object.entries(raceData.racialSkillBonuses)) {
      const skillDef = SKILL_DEFINITIONS.find(sd => sd.value === skillId_kebab);
      if (skillDef && bonus !== 0) appliedSkillBonuses.push({ skillName: skillDef.label, bonus });
    }
    appliedSkillBonuses.sort((a, b) => a.skillName.localeCompare(b.skillName));
  }

  const formattedGrantedFeats = raceData?.grantedFeats?.map(gf => {
    const featDef = DND_FEATS.find(f => f.value === gf.featId);
    return { ...gf, name: featDef?.label || gf.featId };
  }) || [];

  return {
    abilityEffects: appliedAbilityEffects,
    skillBonuses: appliedSkillBonuses.length > 0 ? appliedSkillBonuses : undefined,
    grantedFeats: formattedGrantedFeats.length > 0 ? formattedGrantedFeats : undefined,
    bonusFeatSlots: raceData?.bonusFeatSlots || 0,
  };
}

export interface SizeAbilityEffectsDetails {
  effects: Array<{ ability: Exclude<AbilityName, 'none'>; change: number }>;
}

export function getSizeAbilityEffects(sizeId: CharacterSize | ''): SizeAbilityEffectsDetails {
   if (!sizeId) return { effects: [] };
  const mods = DND_SIZE_ABILITY_MODIFIERS_DATA[sizeId as CharacterSize];
  const appliedEffects: Array<{ ability: Exclude<AbilityName, 'none'>; change: number }> = [];
  if (mods) {
    const abilitiesToProcess = ABILITY_ORDER_INTERNAL.filter(
      ability => mods[ability] !== undefined && mods[ability] !== 0
    );
    abilitiesToProcess.sort((aAbility, bAbility) => {
        const changeA = mods![aAbility]!;
        const changeB = mods![bAbility]!;
        const signA = Math.sign(changeA);
        const signB = Math.sign(changeB);
        if (signA !== signB) return signA - signB;
        return ABILITY_ORDER_INTERNAL.indexOf(aAbility) - ABILITY_ORDER_INTERNAL.indexOf(bAbility);
    });
    for (const ability of abilitiesToProcess) {
      appliedEffects.push({ ability, change: mods[ability]! });
    }
  }
  return { effects: appliedEffects };
}

export function calculateTotalSynergyBonus(targetSkillId: string, currentCharacterSkills: Skill[]): number {
  let totalBonus = 0;
  // Check predefined synergies
  if (SKILL_SYNERGIES) {
    for (const providingSkillId_kebab in SKILL_SYNERGIES) {
      const synergiesProvidedByThisDefinition = (SKILL_SYNERGIES as SkillSynergiesJsonData)[providingSkillId_kebab];
      if (synergiesProvidedByThisDefinition) {
        for (const synergy of synergiesProvidedByThisDefinition) {
          if (synergy.targetSkill === targetSkillId) {
            const providingSkillInCharacter = currentCharacterSkills.find(s => s.id === providingSkillId_kebab);
            if (providingSkillInCharacter && (providingSkillInCharacter.ranks || 0) >= synergy.ranksRequired) {
              totalBonus += synergy.bonus;
            }
          }
        }
      }
    }
  }
  // Check custom synergies defined on skills
  for (const providingSkill of currentCharacterSkills) {
    if (providingSkill.providesSynergies) {
      for (const customRule of providingSkill.providesSynergies) {
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


export function calculateFeatBonusesForSkill(skillId_kebab: string, selectedFeats: Feat[]): number {
  let totalBonus = 0;
  for (const feat of selectedFeats) {
    if (feat.effects?.skills && feat.effects.skills[skillId_kebab]) {
      totalBonus += feat.effects.skills[skillId_kebab];
    }
  }
  return totalBonus;
}

export function calculateRacialSkillBonus(skillId_kebab: string, raceId: DndRaceId | string, dndRacesData: readonly DndRaceOption[], skillDefinitionsData: readonly SkillDefinitionJsonData[]): number {
  if (!raceId) return 0;
  const raceData = dndRacesData.find(r => r.value === raceId);
  if (raceData?.racialSkillBonuses && raceData.racialSkillBonuses[skillId_kebab] !== undefined) {
    return raceData.racialSkillBonuses[skillId_kebab];
  }
  return 0;
}


export function calculateAvailableFeats(characterRaceId: DndRaceId | string, level: number): number {
  let availableFeats = 0;
  if (level >= 1) availableFeats += 1; 

  const raceData = DND_RACES.find(r => r.value === characterRaceId);
  if (raceData?.bonusFeatSlots) {
    availableFeats += raceData.bonusFeatSlots;
  }

  availableFeats += Math.floor(level / 3); 
  return availableFeats;
}

export function getGrantedFeatsForCharacter(characterRaceId: DndRaceId | string, characterClasses: CharacterClass[], characterLevel: number): Feat[] {
  const grantedFeatsMap = new Map<string, Feat>();

  const addGrantedFeat = (featId_kebab: string, note: string | undefined, source: string, levelAcquired?: number) => {
    if (!featId_kebab || (levelAcquired !== undefined && levelAcquired > characterLevel)) return;

    const featDef = DND_FEATS.find(f => f.value === featId_kebab);
    if (featDef && !grantedFeatsMap.has(featId_kebab)) {
      grantedFeatsMap.set(featId_kebab, {
        id: featDef.value, name: featDef.label, description: featDef.description,
        prerequisites: featDef.prerequisites, effects: featDef.effects,
        canTakeMultipleTimes: featDef.canTakeMultipleTimes, requiresSpecialization: featDef.requiresSpecialization,
        isGranted: true, grantedNote: note ? `${note} (${source})` : `(${source})`,
      });
    }
  };

  const raceData = DND_RACES.find(r => r.value === characterRaceId);
  if (raceData?.grantedFeats) {
    raceData.grantedFeats.forEach(gf => {
      addGrantedFeat(gf.featId, gf.note, raceData.label, gf.levelAcquired);
    });
  }

  characterClasses.forEach(charClass => {
    if (!charClass.className) return;
    const classData = DND_CLASSES.find(c => c.value === charClass.className);
    if (classData?.grantedFeats) {
      classData.grantedFeats.forEach(gf => {
        if (gf.levelAcquired === undefined || gf.levelAcquired <= charClass.level) {
            addGrantedFeat(gf.featId, gf.note, classData.label);
        }
      });
    }
  });
  return Array.from(grantedFeatsMap.values());
}

export interface PrerequisiteMessage {
  text: string;
  isMet: boolean;
  orderKey: string; 
  originalText?: string; 
}

const PREREQ_ORDER_MAP: Record<string, number> = {
  race: 1,
  classLevel: 2,
  alignment: 3,
  bab: 4,
  casterLevel: 5,
  ability: 6,
  skill: 7,
  feat: 8,
  special: 9,
};

export function checkFeatPrerequisites(
  featDefinition: FeatDefinitionJsonData,
  character: Pick<Character, 'abilityScores' | 'skills' | 'feats' | 'classes' | 'race' | 'age' | 'alignment'>,
  allFeatDefinitions: readonly FeatDefinitionJsonData[]
): PrerequisiteMessage[] {
  const { prerequisites } = featDefinition;
  const messages: PrerequisiteMessage[] = [];

  if (!prerequisites || Object.keys(prerequisites).length === 0) {
    return [];
  }

  if (prerequisites.raceId !== undefined && prerequisites.raceId !== "") {
    const raceDef = DND_RACES.find(r => r.value === prerequisites!.raceId);
    const raceName = raceDef?.label || prerequisites.raceId;
    const isMet = character.race === prerequisites.raceId;
    messages.push({ text: `Race: ${raceName}`, isMet, orderKey: 'race' });
  }

  if (prerequisites.classLevel && prerequisites.classLevel.classId && prerequisites.classLevel.classId !== "") {
    const { classId, level: requiredClassLevel } = prerequisites.classLevel;
    const charClass = character.classes.find(c => c.className === classId);
    const classDef = DND_CLASSES.find(cd => cd.value === classId);
    const className = classDef?.label || classId;
    const isMet = charClass ? charClass.level >= requiredClassLevel : false;
    messages.push({ text: `${className} level ${requiredClassLevel}`, isMet, orderKey: 'classLevel', originalText: className });
  }

  if (prerequisites.alignment && prerequisites.alignment !== "") {
    const reqAlign = prerequisites.alignment;
    const charAlign = character.alignment;
    let isMet = false;
    const requiredAlignmentLabel = ALIGNMENT_PREREQUISITE_OPTIONS.find(opt => opt.value === reqAlign)?.label || reqAlign;

    if (reqAlign.includes('-')) { 
        isMet = charAlign === reqAlign;
    } else { 
        const charParts = charAlign.split('-');
        if (reqAlign === 'lawful' && charParts[0] === 'lawful') isMet = true;
        else if (reqAlign === 'chaotic' && charParts[0] === 'chaotic') isMet = true;
        else if (reqAlign === 'good' && charParts[1] === 'good') isMet = true;
        else if (reqAlign === 'evil' && charParts[1] === 'evil') isMet = true;
        else if (reqAlign === 'neutral-lc' && (charParts[0] === 'neutral' || charAlign === 'true-neutral')) isMet = true;
        else if (reqAlign === 'neutral-ge' && (charParts[1] === 'neutral' || charAlign === 'true-neutral')) isMet = true;
    }
    messages.push({ text: `Alignment: ${requiredAlignmentLabel}`, isMet, orderKey: 'alignment' });
  }


  if (prerequisites.bab !== undefined) {
    const characterBab = getBab(character.classes)[0];
    const isMet = characterBab >= prerequisites.bab;
    messages.push({ text: `BAB +${prerequisites.bab}`, isMet, orderKey: 'bab' });
  }

  if (prerequisites.casterLevel !== undefined) {
    let calculatedCharacterCasterLevel = 0;
    character.classes.forEach(charClass => {
      if (!charClass.className) return;
      const classDef = DND_CLASSES.find(c => c.value === charClass.className);
      if (classDef?.isCaster) {
        calculatedCharacterCasterLevel += charClass.level;
      } else if (charClass.className === 'paladin' || charClass.className === 'ranger') {
        if (charClass.level >= 4) {
          calculatedCharacterCasterLevel += (charClass.level - 3);
        }
      }
    });
    const isMet = calculatedCharacterCasterLevel >= prerequisites.casterLevel;
    messages.push({ text: `Caster Level ${prerequisites.casterLevel}`, isMet, orderKey: 'casterLevel' });
  }

  if (prerequisites.abilities) {
    for (const [abilityKey, requiredScore] of Object.entries(prerequisites.abilities)) {
      if (requiredScore === undefined) continue;
      const ability = abilityKey as Exclude<AbilityName, 'none'>;
      const isMet = character.abilityScores[ability] >= requiredScore!;
      const abilityLabel = ability.charAt(0).toUpperCase() + ability.slice(1);
      messages.push({ text: `${abilityLabel} ${requiredScore}`, isMet, orderKey: `ability_${abilityKey}`, originalText: abilityLabel });
    }
  }
  if (prerequisites.skills) {
    for (const skillReq of prerequisites.skills) {
      const charSkill = character.skills.find(s => s.id === skillReq.id);
      const skillDef = SKILL_DEFINITIONS.find(sd => sd.value === skillReq.id);
      const skillName = skillDef?.label || skillReq.id;
      const isMet = charSkill ? charSkill.ranks >= skillReq.ranks : false;
      messages.push({ text: `${skillName} ${skillReq.ranks} ranks`, isMet, orderKey: `skill_${skillReq.id}`, originalText: skillName });
    }
  }
  if (prerequisites.feats) {
    const characterFeatIds = character.feats.map(f => f.id.split('-MULTI-INSTANCE-')[0]);
    for (const requiredFeatId_kebab of prerequisites.feats) {
      const featDef = allFeatDefinitions.find(f => f.value === requiredFeatId_kebab);
      const featName = featDef?.label || requiredFeatId_kebab;
      const isMet = characterFeatIds.includes(requiredFeatId_kebab);
      messages.push({ text: featName, isMet, orderKey: `feat_${requiredFeatId_kebab}`, originalText: featName });
    }
  }

  if (prerequisites.special) {
    messages.push({ text: prerequisites.special, isMet: true, orderKey: 'special' });
  }

  messages.sort((a, b) => {
    const orderA = PREREQ_ORDER_MAP[a.orderKey.split('_')[0]] || 99;
    const orderB = PREREQ_ORDER_MAP[b.orderKey.split('_')[0]] || 99;
    if (orderA !== orderB) return orderA - orderB;
    if (a.originalText && b.originalText) {
        return a.originalText.localeCompare(b.originalText);
    }
    return a.text.localeCompare(b.text);
  });

  return messages;
}


export interface AbilityScoreComponentValue {
  source: string;
  value: number;
}

export interface AbilityScoreBreakdown {
  ability: Exclude<AbilityName, 'none'>;
  base: number;
  components: AbilityScoreComponentValue[];
  finalScore: number;
}

export type DetailedAbilityScores = Record<Exclude<AbilityName, 'none'>, AbilityScoreBreakdown>;

export function calculateDetailedAbilityScores(character: Character): DetailedAbilityScores {
  const result: Partial<DetailedAbilityScores> = {};
  const racialQualities = getRaceSpecialQualities(character.race);
  const agingDetails = getNetAgingEffects(character.race, character.age);
  const sizeDetails = getSizeAbilityEffects(character.size);

  for (const ability of ABILITY_ORDER_INTERNAL) {
    const baseScore = character.abilityScores[ability] || 0;
    const components: AbilityScoreComponentValue[] = [];
    let currentScore = baseScore;

    const racialModObj = racialQualities.abilityEffects.find(eff => eff.ability === ability);
    if (racialModObj && racialModObj.change !== 0) {
      currentScore += racialModObj.change;
      const raceLabel = DND_RACES.find(r => r.value === character.race)?.label || character.race || 'Unknown Race';
      components.push({ source: `Race (${raceLabel})`, value: racialModObj.change });
    }

    const agingModObj = agingDetails.effects.find(eff => eff.ability === ability);
    if (agingModObj && agingModObj.change !== 0) {
      currentScore += agingModObj.change;
      components.push({ source: `Aging (${agingDetails.categoryName})`, value: agingModObj.change });
    }

    const sizeModObj = sizeDetails.effects.find(eff => eff.ability === ability);
    if (sizeModObj && sizeModObj.change !== 0) {
      currentScore += sizeModObj.change;
      const sizeLabel = SIZES.find(s => s.value === character.size)?.label || character.size || 'Unknown Size';
      components.push({ source: `Size (${sizeLabel})`, value: sizeModObj.change });
    }

    let featTotalMod = 0;
    for (const feat of character.feats) {
      if (feat.effects?.abilities && feat.effects.abilities[ability]) {
        const featModVal = feat.effects.abilities[ability]!;
        if (featModVal !== 0) {
          featTotalMod += featModVal;
        }
      }
    }
    if (featTotalMod !== 0) {
        currentScore += featTotalMod;
        components.push({ source: `Feats`, value: featTotalMod });
    }


    result[ability] = {
      ability, base: baseScore, components, finalScore: currentScore,
    };
  }
  return result as DetailedAbilityScores;
}

const alignmentAxisMap: Record<string, number> = {
  lawful: 0, chaotic: 2,
  good: 0, evil: 2,
  neutral: 1,
  'true-neutral': 1,
};

function getAlignmentAxisValue(part: string): number {
  if(part === 'neutral') return 1; 
  return alignmentAxisMap[part] ?? 1; 
}

export function isAlignmentCompatible(
  characterAlignment: CharacterAlignment | '',
  deityAlignment: CharacterAlignment
): boolean {
  if (!characterAlignment || !deityAlignment) {
    return true; 
  }

  const parse = (alignStr: CharacterAlignment) => {
    if (alignStr === 'true-neutral') {
      return { lc: 1, ge: 1 }; 
    }
    const parts = alignStr.split('-');
    return {
      lc: getAlignmentAxisValue(parts[0]),
      ge: getAlignmentAxisValue(parts[1]),
    };
  };

  const charAlign = parse(characterAlignment as CharacterAlignment);
  const deityAlign = parse(deityAlignment);

  const lcDiff = Math.abs(charAlign.lc - deityAlign.lc);
  const geDiff = Math.abs(charAlign.ge - deityAlign.ge);

  return lcDiff <= 1 && geDiff <= 1;
}
