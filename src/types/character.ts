
import constantsData from '@/data/dnd-constants.json';
import { getBab } from '@/lib/dnd-utils'; 

export interface CharacterClass {
  id: string;
  className: DndClassId | string; 
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
  ranks: number;
  miscModifier: number;
  keyAbility?: AbilityName;
  isClassSkill?: boolean;
  providesSynergies?: CustomSynergyRule[];
  description?: string;
}

export interface FeatPrerequisiteDetails {
  bab?: number;
  abilities?: Partial<Record<AbilityName, number>>;
  skills?: Array<{ id: string; ranks: number }>;
  feats?: string[]; 
  casterLevel?: number;
  special?: string;
}

export interface FeatEffectDetails {
  skills?: Record<string, number>; 
}

export type FeatDefinitionJsonData = {
  value: string; 
  label: string; 
  description: string;
  prerequisitesText?: string; 
  prerequisites?: FeatPrerequisiteDetails; 
  effects?: FeatEffectDetails;
};

export interface Feat {
  id: string; 
  name: string; 
  description?: string;
  prerequisites?: FeatPrerequisiteDetails;
  prerequisitesText?: string;
  effects?: FeatEffectDetails;
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
  race: DndRaceId; 
  alignment: CharacterAlignment;
  deity?: DndDeityId | string; 
  size: CharacterSize;
  age: number;
  gender: GenderId | string; 

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

export type CharacterSize = typeof constantsData.SIZES_DATA[number]['value'];
export const SIZES: ReadonlyArray<{value: CharacterSize, label: string}> = constantsData.SIZES_DATA as ReadonlyArray<{value: CharacterSize, label: string}>;

export type CharacterAlignment = typeof constantsData.ALIGNMENTS_DATA[number]['value'];
export const ALIGNMENTS: ReadonlyArray<{value: CharacterAlignment, label: string}> = constantsData.ALIGNMENTS_DATA as ReadonlyArray<{value: CharacterAlignment, label: string}>;

export type GenderId = typeof constantsData.GENDERS_DATA[number]['value'];
export const GENDERS: ReadonlyArray<{value: GenderId, label: string}> = constantsData.GENDERS_DATA as ReadonlyArray<{value: GenderId, label: string}>;

export type DndRaceId = typeof constantsData.DND_RACES_DATA[number]['value'];
export const DND_RACES: ReadonlyArray<{value: DndRaceId, label: string}> = constantsData.DND_RACES_DATA as ReadonlyArray<{value: DndRaceId, label: string}>;

export type DndClassId = typeof constantsData.DND_CLASSES_DATA[number]['value'];
export const DND_CLASSES: ReadonlyArray<{value: DndClassId, label: string, hitDice: string}> = constantsData.DND_CLASSES_DATA as ReadonlyArray<{value: DndClassId, label: string, hitDice: string}>;

export type DndDeityId = typeof constantsData.DND_DEITIES_DATA[number]['value'];
export const DND_DEITIES: ReadonlyArray<{value: DndDeityId, label: string}> = constantsData.DND_DEITIES_DATA as ReadonlyArray<{value: DndDeityId, label: string}>;


export const DND_FEATS: readonly FeatDefinitionJsonData[] = constantsData.DND_FEATS_DATA as ReadonlyArray<FeatDefinitionJsonData>;


export type SkillDefinitionJsonData = typeof constantsData.SKILL_DEFINITIONS_DATA[number] & { description?: string };
export const SKILL_DEFINITIONS: readonly SkillDefinitionJsonData[] = constantsData.SKILL_DEFINITIONS_DATA as ReadonlyArray<SkillDefinitionJsonData>;

export type ClassSkillsJsonData = typeof constantsData.CLASS_SKILLS_DATA;
export const CLASS_SKILLS: Readonly<ClassSkillsJsonData> = constantsData.CLASS_SKILLS_DATA as Readonly<ClassSkillsJsonData>;

export type ClassSkillPointsBaseJsonData = typeof constantsData.CLASS_SKILL_POINTS_BASE_DATA;
export const CLASS_SKILL_POINTS_BASE: Readonly<ClassSkillPointsBaseJsonData> = constantsData.CLASS_SKILL_POINTS_BASE_DATA as Readonly<ClassSkillPointsBaseJsonData>;

export type RaceSkillPointsBonusPerLevelJsonData = typeof constantsData.DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA;
export const RACE_SKILL_POINTS_BONUS_PER_LEVEL: Readonly<RaceSkillPointsBonusPerLevelJsonData> = constantsData.DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA as Readonly<RaceSkillPointsBonusPerLevelJsonData>;

export function getRaceSkillPointsBonusPerLevel(raceId: DndRaceId | string): number {
    return (RACE_SKILL_POINTS_BONUS_PER_LEVEL as Record<string, number>)[raceId] || 0;
}

export function getInitialCharacterSkills(characterClasses: CharacterClass[]): Skill[] {
  const firstClassId = characterClasses[0]?.className as DndClassId | undefined;
  const classSkillsForCurrentClass = firstClassId ? (CLASS_SKILLS[firstClassId as keyof ClassSkillsJsonData] || []) : [];

  return SKILL_DEFINITIONS.map(def => {
    let isClassSkill = classSkillsForCurrentClass.includes(def.value); 
    if (!isClassSkill) {
        const skillCategory = def.value.split('-')[0]; 
        if (classSkillsForCurrentClass.includes(`${skillCategory}-any`) || classSkillsForCurrentClass.includes(`${skillCategory}-all`)) {
            isClassSkill = true;
        }
    }
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
  if (raceVenerableAge === undefined) return { categoryName: "adult", effects: [] }; 

  const agingCategoryKey = (constantsData.RACE_TO_AGING_CATEGORY_MAP_DATA as Record<DndRaceId, RaceAgingCategoryKey>)[raceId];
  if (!agingCategoryKey) return { categoryName: "adult", effects: [] };

  const raceAgingPattern = (constantsData.DND_RACE_AGING_EFFECTS_DATA as Record<RaceAgingCategoryKey, RaceAgingInfoData>)[agingCategoryKey];
  if (!raceAgingPattern) return { categoryName: "adult", effects: [] };

  let currentCategoryName: string = "adult"; 
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
     currentCategoryName = "adult";
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
            return signB - signA; 
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

export interface SizeAbilityEffectsDetails {
  effects: Array<{ ability: AbilityName; change: number }>;
}

export function getSizeAbilityEffects(sizeId: CharacterSize): SizeAbilityEffectsDetails {
  const mods = (constantsData.DND_SIZE_ABILITY_MODIFIERS_DATA as Record<CharacterSize, Partial<Record<AbilityName, number>>>)[sizeId]; 
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
            return signB - signA; 
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
            return signB - signA; 
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

export interface SynergyEffectJsonData {
  targetSkill: string; 
  ranksRequired: number;
  bonus: number;
  description?: string;
}

export type SkillSynergiesJsonData = Record<string, SynergyEffectJsonData[]>; 

export const SKILL_SYNERGIES: Readonly<SkillSynergiesJsonData> = constantsData.SKILL_SYNERGIES_DATA as Readonly<SkillSynergiesJsonData>;

export function calculateTotalSynergyBonus(targetSkillId: string, currentCharacterSkills: Skill[]): number {
  let totalBonus = 0;

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

export function calculateFeatBonusesForSkill(skillId: string, selectedFeats: Feat[]): number {
  let totalBonus = 0;
  for (const feat of selectedFeats) {
    if (feat.effects?.skills && feat.effects.skills[skillId]) {
      totalBonus += feat.effects.skills[skillId];
    }
  }
  return totalBonus;
}

export function calculateAvailableFeats(race: DndRaceId, level: number): number {
  let availableFeats = 0;
  if (level >= 1) {
    availableFeats += 1; 
  }
  if (race === 'human') {
    availableFeats += 1; 
  }
  
  availableFeats += Math.floor(level / 3);
  return availableFeats;
}

export function checkFeatPrerequisites(
  featDefinition: FeatDefinitionJsonData,
  character: Pick<Character, 'abilityScores' | 'skills' | 'feats' | 'classes'>,
  allFeatDefinitions: readonly FeatDefinitionJsonData[]
): { met: boolean; metMessages: string[]; unmetMessages: string[]; originalPrerequisitesText?: string } {
  const { prerequisites, prerequisitesText } = featDefinition;
  if (!prerequisites) {
    return { met: true, unmetMessages: [], metMessages: [], originalPrerequisitesText: prerequisitesText || "" };
  }

  const unmetMessages: string[] = [];
  const metMessages: string[] = [];

  if (prerequisites.bab !== undefined) {
    const characterBab = getBab(character.classes)[0]; 
    if (characterBab < prerequisites.bab) {
      unmetMessages.push(`BAB +${prerequisites.bab}`);
    } else {
      metMessages.push(`BAB +${prerequisites.bab}`);
    }
  }

  if (prerequisites.abilities) {
    for (const [ability, requiredScore] of Object.entries(prerequisites.abilities)) {
      if (character.abilityScores[ability as AbilityName] < requiredScore!) {
        unmetMessages.push(`${ability.charAt(0).toUpperCase() + ability.slice(1)} ${requiredScore}`);
      } else {
        metMessages.push(`${ability.charAt(0).toUpperCase() + ability.slice(1)} ${requiredScore}`);
      }
    }
  }

  if (prerequisites.skills) {
    for (const skillReq of prerequisites.skills) {
      const charSkill = character.skills.find(s => s.id === skillReq.id);
      if (!charSkill || charSkill.ranks < skillReq.ranks) {
        const skillDef = SKILL_DEFINITIONS.find(sd => sd.value === skillReq.id);
        unmetMessages.push(`${skillDef?.label || skillReq.id} ${skillReq.ranks} ranks`);
      } else {
        const skillDef = SKILL_DEFINITIONS.find(sd => sd.value === skillReq.id);
        metMessages.push(`${skillDef?.label || skillReq.id} ${skillReq.ranks} ranks`);
      }
    }
  }

  if (prerequisites.feats) {
    const characterFeatIds = character.feats.map(f => f.id);
    for (const requiredFeatId of prerequisites.feats) {
      if (!characterFeatIds.includes(requiredFeatId)) {
        const featDef = allFeatDefinitions.find(f => f.value === requiredFeatId);
        unmetMessages.push(featDef?.label || requiredFeatId);
      } else {
         const featDef = allFeatDefinitions.find(f => f.value === requiredFeatId);
        metMessages.push(featDef?.label || requiredFeatId);
      }
    }
  }
  
  if (prerequisites.casterLevel !== undefined) {
    const totalLevel = character.classes.reduce((sum, c) => sum + c.level, 0) || 1; 
    if (totalLevel < prerequisites.casterLevel) { 
      unmetMessages.push(`Caster Level ${prerequisites.casterLevel}`);
    } else {
      metMessages.push(`Caster Level ${prerequisites.casterLevel}`);
    }
  }
  
  if (prerequisites.special) {
    metMessages.push(prerequisites.special);
  }

  return { met: unmetMessages.length === 0, unmetMessages, metMessages, originalPrerequisitesText: prerequisitesText };
}

    