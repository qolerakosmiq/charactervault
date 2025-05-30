
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
  targetSkillName: string; // Stores the ID of the target skill (kebab-case or UUID)
  ranksInThisSkillRequired: number;
  bonusGranted: number;
}

export interface Skill {
  id: string; // Kebab-case ID for predefined, UUID for custom
  name: string; // Display name
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
  skills?: Array<{ id: string; ranks: number }>; // Skill ID (kebab-case)
  feats?: string[]; // Feat IDs (kebab-case)
  casterLevel?: number;
  special?: string;
}

export interface FeatEffectDetails {
  skills?: Record<string, number>; // skillId (kebab-case): bonus
  abilities?: Partial<Record<Exclude<AbilityName, 'none'>, number>>;
}

export type FeatDefinitionJsonData = {
  value: string; // kebab-case ID
  label: string; // Display name
  description?: string;
  prerequisites?: FeatPrerequisiteDetails;
  effects?: FeatEffectDetails;
  canTakeMultipleTimes?: boolean;
  requiresSpecialization?: string;
};

export interface Feat {
  id: string; // kebab-case ID for single-take, kebab-case-ID-UUID for multi-take
  name: string;
  description?: string;
  prerequisites?: FeatPrerequisiteDetails;
  effects?: FeatEffectDetails;
  canTakeMultipleTimes?: boolean;
  requiresSpecialization?: string;
  specializationDetail?: string;
  isGranted?: boolean;
  grantedNote?: string;
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

// --- Base Data Merging ---
const baseDefaultAbilities = (baseDataJson as any).DEFAULT_ABILITIES || {};
const customDefaultAbilities = (customBaseDataJson as any).DEFAULT_ABILITIES || {};
export const DEFAULT_ABILITIES: AbilityScores = { ...baseDefaultAbilities, ...customDefaultAbilities };

const baseDefaultSavingThrows = (baseDataJson as any).DEFAULT_SAVING_THROWS || {};
const customDefaultSavingThrows = (customBaseDataJson as any).DEFAULT_SAVING_THROWS || {};
export const DEFAULT_SAVING_THROWS: SavingThrows = { ...baseDefaultSavingThrows, ...customDefaultSavingThrows };

const baseSizesData = (baseDataJson as any).SIZES_DATA || [];
const customSizesData = (customBaseDataJson as any).SIZES_DATA || [];
const combinedSizesMap = new Map<string, CharacterSizeObject>();
baseSizesData.forEach((size: CharacterSizeObject) => combinedSizesMap.set(size.value, size));
customSizesData.forEach((size: CharacterSizeObject) => combinedSizesMap.set(size.value, size));
export const SIZES: ReadonlyArray<CharacterSizeObject> = Array.from(combinedSizesMap.values());
export type CharacterSizeObject = typeof SIZES[number];
export type CharacterSize = CharacterSizeObject['value'];

const baseGendersData = (baseDataJson as any).GENDERS_DATA || [];
const customGendersData = (customBaseDataJson as any).GENDERS_DATA || [];
const combinedGendersMap = new Map<string, { value: string; label: string }>();
baseGendersData.forEach((gender: { value: string; label: string }) => combinedGendersMap.set(gender.value, gender));
customGendersData.forEach((gender: { value: string; label: string }) => combinedGendersMap.set(gender.value, gender));
export const GENDERS: ReadonlyArray<{value: string; label: string}> = Array.from(combinedGendersMap.values());
export type GenderId = typeof GENDERS[number]['value'];

const baseRaceMinAdultAge = (baseDataJson as any).DND_RACE_MIN_ADULT_AGE_DATA || {};
const customRaceMinAdultAge = (customBaseDataJson as any).DND_RACE_MIN_ADULT_AGE_DATA || {};
export const DND_RACE_MIN_ADULT_AGE_DATA: Readonly<Record<DndRaceId, number>> = { ...baseRaceMinAdultAge, ...customRaceMinAdultAge };

const baseRaceMaxAge = (baseDataJson as any).DND_RACE_BASE_MAX_AGE_DATA || {};
const customRaceMaxAge = (customBaseDataJson as any).DND_RACE_BASE_MAX_AGE_DATA || {};
const DND_RACE_BASE_MAX_AGE_DATA: Readonly<Record<DndRaceId, number>> = { ...baseRaceMaxAge, ...customRaceMaxAge };

const baseRaceToAgingMap = (baseDataJson as any).RACE_TO_AGING_CATEGORY_MAP_DATA || {};
const customRaceToAgingMap = (customBaseDataJson as any).RACE_TO_AGING_CATEGORY_MAP_DATA || {};
const RACE_TO_AGING_CATEGORY_MAP_DATA: Readonly<Record<DndRaceId, RaceAgingCategoryKey>> = { ...baseRaceToAgingMap, ...customRaceToAgingMap };

const baseRaceAgingEffects = (baseDataJson as any).DND_RACE_AGING_EFFECTS_DATA || {};
const customRaceAgingEffects = (customBaseDataJson as any).DND_RACE_AGING_EFFECTS_DATA || {};
const DND_RACE_AGING_EFFECTS_DATA: Readonly<Record<RaceAgingCategoryKey, RaceAgingInfoData>> = { ...baseRaceAgingEffects, ...customRaceAgingEffects };

const baseSizeAbilityModifiers = (baseDataJson as any).DND_SIZE_ABILITY_MODIFIERS_DATA || {};
const customSizeAbilityModifiers = (customBaseDataJson as any).DND_SIZE_ABILITY_MODIFIERS_DATA || {};
const DND_SIZE_ABILITY_MODIFIERS_DATA: Readonly<Record<CharacterSize, Partial<Record<Exclude<AbilityName, 'none'>, number>>>> = { ...baseSizeAbilityModifiers, ...customSizeAbilityModifiers };

const baseRaceAbilityModifiers = (baseDataJson as any).DND_RACE_ABILITY_MODIFIERS_DATA || {};
const customRaceAbilityModifiers = (customBaseDataJson as any).DND_RACE_ABILITY_MODIFIERS_DATA || {};
const DND_RACE_ABILITY_MODIFIERS_DATA: Readonly<Record<DndRaceId, Partial<Record<Exclude<AbilityName, 'none'>, number>>>> = { ...baseRaceAbilityModifiers, ...customRaceAbilityModifiers };

const baseRaceSkillPointsBonus = (baseDataJson as any).DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA || {};
const customRaceSkillPointsBonus = (customBaseDataJson as any).DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA || {};
const DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA: Readonly<Record<string, number>> = { ...baseRaceSkillPointsBonus, ...customRaceSkillPointsBonus };


// --- Alignments Data Merging ---
const baseAlignmentsData = (alignmentsDataJson as any).ALIGNMENTS_DATA || [];
const customAlignmentsData = (customAlignmentsDataJson as any).ALIGNMENTS_DATA || []; // Corrected: Use customAlignmentsDataJson
const combinedAlignmentsMap = new Map<string, CharacterAlignmentObject>();
baseAlignmentsData.forEach((align: CharacterAlignmentObject) => combinedAlignmentsMap.set(align.value, align));
customAlignmentsData.forEach((align: CharacterAlignmentObject) => combinedAlignmentsMap.set(align.value, align));
export const ALIGNMENTS: ReadonlyArray<CharacterAlignmentObject> = Array.from(combinedAlignmentsMap.values());
export type CharacterAlignmentObject = { value: string; label: string; description: string; };
export type CharacterAlignment = CharacterAlignmentObject['value'];


// --- Races Data Merging ---
const baseRacesData = (racesDataJson as any).DND_RACES_DATA || [];
const customRacesData = (customRacesDataJson as any).DND_RACES_DATA || [];
const combinedRacesMap = new Map<string, DndRaceOption>();
baseRacesData.forEach((race: DndRaceOption) => combinedRacesMap.set(race.value, race));
customRacesData.forEach((race: DndRaceOption) => combinedRacesMap.set(race.value, race));
export const DND_RACES: ReadonlyArray<DndRaceOption> = Array.from(combinedRacesMap.values());
export type DndRaceOption = {
  value: string; // kebab-case ID
  label: string; // Display name
  description?: string;
  bonusFeatSlots?: number;
  racialSkillBonuses?: Record<string, number>;
  grantedFeats?: Array<{ featId: string; note?: string; levelAcquired?: number }>;
};
export type DndRaceId = typeof DND_RACES[number]['value'];


// --- Classes Data Merging ---
const baseClassesData = (classesDataJson as any).DND_CLASSES_DATA || [];
const customClassesData = (customClassesDataJson as any).DND_CLASSES_DATA || [];
const combinedClassesMap = new Map<string, DndClassOption>();
baseClassesData.forEach((cls: DndClassOption) => combinedClassesMap.set(cls.value, cls));
customClassesData.forEach((cls: DndClassOption) => combinedClassesMap.set(cls.value, cls));
export const DND_CLASSES: ReadonlyArray<DndClassOption> = Array.from(combinedClassesMap.values());
export type DndClassOption = {
  value: string; // kebab-case ID
  label: string; // Display name
  hitDice: string;
  description: string;
  grantedFeats?: Array<{ featId: string; note?: string; levelAcquired?: number }>;
};
export type DndClassId = typeof DND_CLASSES[number]['value'];


// --- Deities Data Merging ---
const baseDeitiesData = (deitiesDataJson as any).DND_DEITIES_DATA || [];
const customDeitiesData = (customDeitiesDataJson as any).DND_DEITIES_DATA || [];
const combinedDeitiesMap = new Map<string, DndDeityOption>();
baseDeitiesData.forEach((deity: DndDeityOption) => combinedDeitiesMap.set(deity.value, deity));
customDeitiesData.forEach((deity: DndDeityOption) => combinedDeitiesMap.set(deity.value, deity));
export const DND_DEITIES: ReadonlyArray<DndDeityOption> = Array.from(combinedDeitiesMap.values());
export type DndDeityOption = {
  value: string; // kebab-case ID
  label: string; // Display name
  alignment: CharacterAlignment;
  description: string;
};
export type DndDeityId = typeof DND_DEITIES[number]['value'];


// --- Feats Data Merging ---
const baseFeatsData = (featsDataJson as any).DND_FEATS_DATA || [];
const customFeatsData = (customFeatsDataJson as any).DND_FEATS_DATA || [];
const combinedFeatsMap = new Map<string, FeatDefinitionJsonData>();
baseFeatsData.forEach((feat: FeatDefinitionJsonData) => combinedFeatsMap.set(feat.value, feat));
customFeatsData.forEach((feat: FeatDefinitionJsonData) => combinedFeatsMap.set(feat.value, feat));
export const DND_FEATS: readonly FeatDefinitionJsonData[] = Array.from(combinedFeatsMap.values());


// --- Skills Data Merging ---
const baseSkillDefinitions = (skillsDataJson as any).SKILL_DEFINITIONS_DATA || [];
const customSkillDefinitions = (customSkillsDataJson as any).SKILL_DEFINITIONS_DATA || [];
const combinedSkillDefinitionsMap = new Map<string, SkillDefinitionJsonData>();
baseSkillDefinitions.forEach((skillDef: SkillDefinitionJsonData) => combinedSkillDefinitionsMap.set(skillDef.value, skillDef));
customSkillDefinitions.forEach((skillDef: SkillDefinitionJsonData) => combinedSkillDefinitionsMap.set(skillDef.value, skillDef));
export const SKILL_DEFINITIONS: readonly SkillDefinitionJsonData[] = Array.from(combinedSkillDefinitionsMap.values());
export type SkillDefinitionJsonData = {
  value: string; // kebab-case ID
  label: string; // Display name
  keyAbility: AbilityName | string; // string for "none"
  description: string;
};

const baseClassSkills = (skillsDataJson as any).CLASS_SKILLS_DATA || {};
const customClassSkills = (customSkillsDataJson as any).CLASS_SKILLS_DATA || {};
export type ClassSkillsJsonData = Record<string, string[]>;
export const CLASS_SKILLS: Readonly<ClassSkillsJsonData> = { ...baseClassSkills, ...customClassSkills };

const baseClassSkillPoints = (skillsDataJson as any).CLASS_SKILL_POINTS_BASE_DATA || {};
const customClassSkillPoints = (customSkillsDataJson as any).CLASS_SKILL_POINTS_BASE_DATA || {};
export type ClassSkillPointsBaseJsonData = Record<string, number>;
export const CLASS_SKILL_POINTS_BASE: Readonly<ClassSkillPointsBaseJsonData> = { ...baseClassSkillPoints, ...customClassSkillPoints };

const baseSkillSynergies = (skillsDataJson as any).SKILL_SYNERGIES_DATA || {};
const customSkillSynergies = (customSkillsDataJson as any).SKILL_SYNERGIES_DATA || {};
export type SynergyEffectJsonData = { targetSkill: string; ranksRequired: number; bonus: number };
export type SkillSynergiesJsonData = Record<string, SynergyEffectJsonData[]>;
export const SKILL_SYNERGIES: Readonly<SkillSynergiesJsonData> = { ...baseSkillSynergies, ...customSkillSynergies };

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
  categoryName: RaceAgingCategoryKey;
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

  const raceVenerableAge = DND_RACE_BASE_MAX_AGE_DATA[raceId as DndRaceId];
  if (raceVenerableAge === undefined) return { categoryName: "Adult", effects: [] };

  const agingCategoryKey = RACE_TO_AGING_CATEGORY_MAP_DATA[raceId as DndRaceId];
  if (!agingCategoryKey) return { categoryName: "Adult", effects: [] };

  const raceAgingPattern = DND_RACE_AGING_EFFECTS_DATA[agingCategoryKey];
  if (!raceAgingPattern) return { categoryName: "Adult", effects: [] };

  let currentCategoryLabel: string = "Adult";
  let highestAttainedCategoryEffects: Partial<Record<Exclude<AbilityName, 'none'>, number>> | null = null;
  const sortedCategories = [...raceAgingPattern.categories].sort((a, b) => a.ageFactor - b.ageFactor);

  for (const category of sortedCategories) {
    const ageThresholdForCategory = Math.floor(category.ageFactor * raceVenerableAge);
    if (age >= ageThresholdForCategory) {
      currentCategoryLabel = category.categoryName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      highestAttainedCategoryEffects = category.effects;
    } else {
      break;
    }
  }

  const appliedEffects: Array<{ ability: Exclude<AbilityName, 'none'>; change: number }> = [];
  if (highestAttainedCategoryEffects) {
    const abilitiesToProcess = (Object.keys(highestAttainedCategoryEffects) as Exclude<AbilityName, 'none'>[])
      .filter(ability => highestAttainedCategoryEffects && highestAttainedCategoryEffects[ability] !== undefined && highestAttainedCategoryEffects[ability] !== 0 );

    abilitiesToProcess.sort((aAbility, bAbility) => {
        const changeA = highestAttainedCategoryEffects![aAbility]!;
        const changeB = highestAttainedCategoryEffects![bAbility]!;
        const signA = Math.sign(changeA);
        const signB = Math.sign(changeB);
        if (signA !== signB) return signA - signB; 
        const indexA = ABILITY_ORDER_INTERNAL.indexOf(aAbility);
        const indexB = ABILITY_ORDER_INTERNAL.indexOf(bAbility);
        return indexA - indexB; 
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
    const abilitiesToProcess = (Object.keys(abilityModifiers) as Exclude<AbilityName, 'none'>[])
      .filter(ability => abilityModifiers[ability] !== undefined && abilityModifiers[ability] !== 0 );
     abilitiesToProcess.sort((aAbility, bAbility) => {
        const changeA = abilityModifiers![aAbility]!;
        const changeB = abilityModifiers![bAbility]!;
        const signA = Math.sign(changeA);
        const signB = Math.sign(changeB);
        if (signA !== signB) return signA - signB; 
        const indexA = ABILITY_ORDER_INTERNAL.indexOf(aAbility);
        const indexB = ABILITY_ORDER_INTERNAL.indexOf(bAbility);
        return indexA - indexB; 
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
    const abilitiesToProcess = (Object.keys(mods) as Exclude<AbilityName, 'none'>[])
      .filter(ability => mods[ability] !== undefined && mods[ability] !== 0 );
    abilitiesToProcess.sort((aAbility, bAbility) => {
        const changeA = mods![aAbility]!;
        const changeB = mods![bAbility]!;
        const signA = Math.sign(changeA);
        const signB = Math.sign(changeB);
        if (signA !== signB) return signA - signB; 
        const indexA = ABILITY_ORDER_INTERNAL.indexOf(aAbility);
        const indexB = ABILITY_ORDER_INTERNAL.indexOf(bAbility);
        return indexA - indexB; 
    });
    for (const ability of abilitiesToProcess) {
      appliedEffects.push({ ability, change: mods[ability]! });
    }
  }
  return { effects: appliedEffects };
}

export function calculateTotalSynergyBonus(targetSkillId: string, currentCharacterSkills: Skill[]): number {
  let totalBonus = 0;
  if (SKILL_SYNERGIES) {
    for (const providingSkillId_kebab in SKILL_SYNERGIES) {
      const synergiesProvidedByThisDefinition = (SKILL_SYNERGIES as Record<string, SynergyEffectJsonData[]>)[providingSkillId_kebab];
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


export function calculateAvailableFeats(raceId: DndRaceId | string, level: number): number {
  let availableFeats = 0;
  if (level >= 1) availableFeats += 1; 

  const raceData = DND_RACES.find(r => r.value === raceId);
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

export function checkFeatPrerequisites(featDefinition: FeatDefinitionJsonData, character: Pick<Character, 'abilityScores' | 'skills' | 'feats' | 'classes' | 'race' | 'age'>, allFeatDefinitions: readonly FeatDefinitionJsonData[]): { met: boolean; metMessages: string[]; unmetMessages: string[]; } {
  const { prerequisites } = featDefinition;
  const unmetMessages: string[] = [];
  const metMessages: string[] = [];

  if (!prerequisites || Object.keys(prerequisites).length === 0) {
    return { met: true, unmetMessages: [], metMessages: [] };
  }

  if (prerequisites.bab !== undefined) {
    const characterBab = getBab(character.classes)[0]; 
    if (characterBab < prerequisites.bab) unmetMessages.push(`BAB +${prerequisites.bab}`);
    else metMessages.push(`BAB +${prerequisites.bab}`);
  }
  if (prerequisites.abilities) {
    for (const [abilityKey, requiredScore] of Object.entries(prerequisites.abilities)) {
      const ability = abilityKey as Exclude<AbilityName, 'none'>;
      if (character.abilityScores[ability] < requiredScore!) unmetMessages.push(`${ability.charAt(0).toUpperCase() + ability.slice(1)} ${requiredScore}`);
      else metMessages.push(`${ability.charAt(0).toUpperCase() + ability.slice(1)} ${requiredScore}`);
    }
  }
  if (prerequisites.skills) {
    for (const skillReq of prerequisites.skills) {
      const charSkill = character.skills.find(s => s.id === skillReq.id);
      const skillDef = SKILL_DEFINITIONS.find(sd => sd.value === skillReq.id);
      if (!charSkill || charSkill.ranks < skillReq.ranks) unmetMessages.push(`${skillDef?.label || skillReq.id} ${skillReq.ranks} ranks`);
      else metMessages.push(`${skillDef?.label || skillReq.id} ${skillReq.ranks} ranks`);
    }
  }
  if (prerequisites.feats) {
    const characterFeatIds = character.feats.map(f => f.id.split('-MULTI-INSTANCE-')[0]); 
    for (const requiredFeatId_kebab of prerequisites.feats) {
      const featDef = allFeatDefinitions.find(f => f.value === requiredFeatId_kebab);
      if (!characterFeatIds.includes(requiredFeatId_kebab)) unmetMessages.push(featDef?.label || requiredFeatId_kebab);
      else metMessages.push(featDef?.label || requiredFeatId_kebab);
    }
  }
  
  const totalLevel = character.classes.reduce((sum, c) => sum + (c.level || 0), 0) || 1;
  if (prerequisites.casterLevel !== undefined) {
    if (totalLevel < prerequisites.casterLevel) unmetMessages.push(`Caster Level ${prerequisites.casterLevel}`);
    else metMessages.push(`Caster Level ${prerequisites.casterLevel}`);
  }
  if (prerequisites.special) {
    let specialMet = true; 
    const specialText = prerequisites.special.toLowerCase();

    const fighterLevelMatch = specialText.match(/fighter level (\d+)/);
    if (fighterLevelMatch) {
        const requiredLevel = parseInt(fighterLevelMatch[1], 10);
        const fighterClass = character.classes.find(c => c.className === 'fighter');
        if (!fighterClass || fighterClass.level < requiredLevel) specialMet = false;
    }

    const wizardLevelMatch = specialText.match(/wizard level (\d+)/);
     if (wizardLevelMatch) {
        const requiredLevel = parseInt(wizardLevelMatch[1], 10);
        const wizardClass = character.classes.find(c => c.className === 'wizard');
        if (!wizardClass || wizardClass.level < requiredLevel) specialMet = false;
    }
    
    if (specialText.includes("wild shape ability")) {
        const hasWildShapeClass = character.classes.some(c => c.className === 'druid'); 
        if (!hasWildShapeClass) specialMet = false;
    }
    
    if (specialMet) metMessages.push(prerequisites.special);
    else unmetMessages.push(prerequisites.special);
  }
  return { met: unmetMessages.length === 0, unmetMessages, metMessages };
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
