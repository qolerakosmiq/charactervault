
import racesData from '@/data/dnd-races.json';
import classesData from '@/data/dnd-classes.json';
import alignmentsData from '@/data/dnd-alignments.json';
import deitiesData from '@/data/dnd-deities.json';
import skillsData from '@/data/dnd-skills.json';
import featsData from '@/data/dnd-feats.json';
import baseData from '@/data/dnd-base.json';

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
  miscModifier: number; // Retain for direct user adjustments
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
  description: string;
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
const ABILITY_ORDER: Exclude<AbilityName, 'none'>[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

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
  alignment: CharacterAlignment | '';
  deity?: DndDeityId | string;
  size: CharacterSize | '';
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

// Base Constants from dnd-base.json
export const DEFAULT_ABILITIES: AbilityScores = baseData.DEFAULT_ABILITIES as AbilityScores;
export const DEFAULT_SAVING_THROWS: SavingThrows = baseData.DEFAULT_SAVING_THROWS as SavingThrows;
export type CharacterSizeObject = typeof baseData.SIZES_DATA[number];
export type CharacterSize = CharacterSizeObject['value'];
export const SIZES: ReadonlyArray<CharacterSizeObject> = baseData.SIZES_DATA as ReadonlyArray<CharacterSizeObject>;
export type GenderId = typeof baseData.GENDERS_DATA[number]['value'];
export const GENDERS: ReadonlyArray<{value: GenderId, label: string}> = baseData.GENDERS_DATA as ReadonlyArray<{value: GenderId, label: string}>;

// Alignments from dnd-alignments.json
export type CharacterAlignmentObject = typeof alignmentsData.ALIGNMENTS_DATA[number] & { description: string };
export type CharacterAlignment = CharacterAlignmentObject['value'];
export const ALIGNMENTS: ReadonlyArray<CharacterAlignmentObject> = alignmentsData.ALIGNMENTS_DATA as ReadonlyArray<CharacterAlignmentObject>;

// Races from dnd-races.json
export type DndRaceOption = typeof racesData.DND_RACES_DATA[number] & {
  description: string;
  racialSkillBonuses?: Record<string, number>;
  grantedFeats?: Array<{ featId: string; note?: string; levelAcquired?: number }>;
  bonusFeatSlots?: number;
  abilityModifiers?: Partial<Record<Exclude<AbilityName, 'none'>, number>>;
};
export type DndRaceId = DndRaceOption['value'];
export const DND_RACES: ReadonlyArray<DndRaceOption> = racesData.DND_RACES_DATA as ReadonlyArray<DndRaceOption>;

// Classes from dnd-classes.json
export type DndClassOption = typeof classesData.DND_CLASSES_DATA[number] & {
  hitDice: string;
  description: string;
  grantedFeats?: Array<{ featId: string; note?: string; levelAcquired?: number }>;
};
export type DndClassId = DndClassOption['value'];
export const DND_CLASSES: ReadonlyArray<DndClassOption> = classesData.DND_CLASSES_DATA as ReadonlyArray<DndClassOption>;

// Deities from dnd-deities.json
export type DndDeityId = typeof deitiesData.DND_DEITIES_DATA[number]['value'];
export const DND_DEITIES: ReadonlyArray<{value: DndDeityId, label: string}> = deitiesData.DND_DEITIES_DATA as ReadonlyArray<{value: DndDeityId, label: string}>;

// Feats from dnd-feats.json
export const DND_FEATS: readonly FeatDefinitionJsonData[] = featsData.DND_FEATS_DATA as ReadonlyArray<FeatDefinitionJsonData>;

// Skills from dnd-skills.json
export type SkillDefinitionJsonData = typeof skillsData.SKILL_DEFINITIONS_DATA[number] & {description?: string};
export const SKILL_DEFINITIONS: readonly SkillDefinitionJsonData[] = skillsData.SKILL_DEFINITIONS_DATA as ReadonlyArray<SkillDefinitionJsonData>;
export type ClassSkillsJsonData = typeof skillsData.CLASS_SKILLS_DATA;
export const CLASS_SKILLS: Readonly<ClassSkillsJsonData> = skillsData.CLASS_SKILLS_DATA as Readonly<ClassSkillsJsonData>;
export type ClassSkillPointsBaseJsonData = typeof skillsData.CLASS_SKILL_POINTS_BASE_DATA;
export const CLASS_SKILL_POINTS_BASE: Readonly<ClassSkillPointsBaseJsonData> = skillsData.CLASS_SKILL_POINTS_BASE_DATA as Readonly<ClassSkillPointsBaseJsonData>;
export type SkillSynergiesJsonData = typeof skillsData.SKILL_SYNERGIES_DATA;
export const SKILL_SYNERGIES: Readonly<SkillSynergiesJsonData> = skillsData.SKILL_SYNERGIES_DATA as Readonly<SkillSynergiesJsonData>;


// Helper function using data from dnd-base.json
export function getRaceSkillPointsBonusPerLevel(raceId: DndRaceId | string): number {
    return (baseData.DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA as Record<string, number>)[raceId] || 0;
}

export function getInitialCharacterSkills(characterClasses: CharacterClass[]): Skill[] {
  const firstClassValue = characterClasses[0]?.className;
  const classSkillsForCurrentClass = firstClassValue ? (CLASS_SKILLS[firstClassValue as keyof ClassSkillsJsonData] || []) : [];

  return SKILL_DEFINITIONS.map(def => {
    let isClassSkill = classSkillsForCurrentClass.includes(def.value);
    if (!isClassSkill && def.value) {
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

export type RaceAgingCategoryKey = keyof typeof baseData.DND_RACE_AGING_EFFECTS_DATA;

interface AgeCategoryEffectData {
  categoryName: string;
  ageFactor: number;
  effects: Partial<Record<Exclude<AbilityName, 'none'>, number>>;
}

interface RaceAgingInfoData {
  categories: AgeCategoryEffectData[];
}

export interface AgingEffectsDetails {
  categoryName: string;
  effects: Array<{ ability: AbilityName; change: number }>;
}

export function getNetAgingEffects(raceId: DndRaceId | '', age: number): AgingEffectsDetails {
  if (!raceId) return { categoryName: "Adult", effects: [] };
  const raceVenerableAge = (baseData.DND_RACE_BASE_MAX_AGE_DATA as Record<DndRaceId, number>)[raceId];
  if (raceVenerableAge === undefined) return { categoryName: "Adult", effects: [] };
  const agingCategoryKey = (baseData.RACE_TO_AGING_CATEGORY_MAP_DATA as Record<DndRaceId, RaceAgingCategoryKey>)[raceId];
  if (!agingCategoryKey) return { categoryName: "Adult", effects: [] };
  const raceAgingPattern = (baseData.DND_RACE_AGING_EFFECTS_DATA as Record<RaceAgingCategoryKey, RaceAgingInfoData>)[agingCategoryKey];
  if (!raceAgingPattern) return { categoryName: "Adult", effects: [] };

  let currentCategoryKey: string = "adult";
  let highestAttainedCategoryEffects: Partial<Record<Exclude<AbilityName, 'none'>, number>> | null = null;
  const sortedCategories = [...raceAgingPattern.categories].sort((a, b) => a.ageFactor - b.ageFactor);

  for (const category of sortedCategories) {
    const ageThresholdForCategory = Math.floor(category.ageFactor * raceVenerableAge);
    if (age >= ageThresholdForCategory) {
      currentCategoryKey = category.categoryName;
      highestAttainedCategoryEffects = category.effects;
    } else {
      break;
    }
  }

  if (!highestAttainedCategoryEffects && (sortedCategories.length === 0 || age < Math.floor(sortedCategories[0].ageFactor * raceVenerableAge))) {
     currentCategoryKey = "adult";
     highestAttainedCategoryEffects = {};
  }

  const appliedEffects: Array<{ ability: AbilityName; change: number }> = [];
  if (highestAttainedCategoryEffects) {
    const abilitiesToProcess = (Object.keys(highestAttainedCategoryEffects) as Exclude<AbilityName, 'none'>[])
      .filter(ability => highestAttainedCategoryEffects && highestAttainedCategoryEffects[ability] !== undefined && highestAttainedCategoryEffects[ability] !== 0);
    abilitiesToProcess.sort((aAbility, bAbility) => {
        const changeA = highestAttainedCategoryEffects![aAbility]!;
        const changeB = highestAttainedCategoryEffects![bAbility]!;
        const signA = Math.sign(changeA);
        const signB = Math.sign(changeB);
        if (signA !== signB) return signA - signB;
        const indexA = ABILITY_ORDER.indexOf(aAbility);
        const indexB = ABILITY_ORDER.indexOf(bAbility);
        return indexA - indexB;
    });
    for (const ability of abilitiesToProcess) {
        appliedEffects.push({ ability, change: highestAttainedCategoryEffects![ability]! });
    }
  }
  const categoryLabelMap: Record<string, string> = { "middle-age": "Middle Age", "old": "Old", "venerable": "Venerable", "adult": "Adult" };
  return {
    categoryName: categoryLabelMap[currentCategoryKey] || currentCategoryKey.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    effects: appliedEffects,
  };
}

export interface RaceSpecialQualities {
  abilityEffects: Array<{ ability: AbilityName; change: number }>;
  skillBonuses?: Array<{ skillName: string; bonus: number }>;
  grantedFeats?: Array<{ featId: string; note?: string; levelAcquired?: number }>;
  bonusFeatSlots?: number;
}

export function getRaceSpecialQualities(raceId: DndRaceId | ''): RaceSpecialQualities {
  if (!raceId) return { abilityEffects: [], skillBonuses: [], grantedFeats: [], bonusFeatSlots: 0 };
  const raceData = DND_RACES.find(r => r.value === raceId);
  const abilityModifiers = (baseData.DND_RACE_ABILITY_MODIFIERS_DATA as Record<DndRaceId, Partial<Record<Exclude<AbilityName, 'none'>, number>>>)[raceId];
  const appliedAbilityEffects: Array<{ ability: AbilityName; change: number }> = [];
  if (abilityModifiers) {
    const abilitiesToProcess = (Object.keys(abilityModifiers) as Exclude<AbilityName, 'none'>[])
      .filter(ability => abilityModifiers[ability] !== undefined && abilityModifiers[ability] !== 0 );
     abilitiesToProcess.sort((aAbility, bAbility) => {
        const changeA = abilityModifiers![aAbility]!;
        const changeB = abilityModifiers![bAbility]!;
        const signA = Math.sign(changeA);
        const signB = Math.sign(changeB);
        if (signA !== signB) return signA - signB;
        const indexA = ABILITY_ORDER.indexOf(aAbility);
        const indexB = ABILITY_ORDER.indexOf(bAbility);
        return indexA - indexB;
    });
    for (const ability of abilitiesToProcess) {
      appliedAbilityEffects.push({ ability, change: abilityModifiers[ability]! });
    }
  }
  const appliedSkillBonuses: Array<{ skillName: string; bonus: number }> = [];
  if (raceData?.racialSkillBonuses) {
    for (const [skillId, bonus] of Object.entries(raceData.racialSkillBonuses)) {
      const skillDef = SKILL_DEFINITIONS.find(sd => sd.value === skillId);
      if (skillDef && bonus !== 0) appliedSkillBonuses.push({ skillName: skillDef.label, bonus });
    }
    appliedSkillBonuses.sort((a, b) => a.skillName.localeCompare(b.skillName));
  }
  return {
    abilityEffects: appliedAbilityEffects,
    skillBonuses: appliedSkillBonuses.length > 0 ? appliedSkillBonuses : undefined,
    grantedFeats: raceData?.grantedFeats,
    bonusFeatSlots: raceData?.bonusFeatSlots || 0,
  };
}

export interface SizeAbilityEffectsDetails {
  effects: Array<{ ability: AbilityName; change: number }>;
}

export function getSizeAbilityEffects(sizeId: CharacterSize | ''): SizeAbilityEffectsDetails {
   if (!sizeId) return { effects: [] };
  const mods = (baseData.DND_SIZE_ABILITY_MODIFIERS_DATA as Record<CharacterSize, Partial<Record<Exclude<AbilityName, 'none'>, number>>>)[sizeId];
  const appliedEffects: Array<{ ability: AbilityName; change: number }> = [];
  if (mods) {
    const abilitiesToProcess = (Object.keys(mods) as Exclude<AbilityName, 'none'>[])
      .filter(ability => mods[ability] !== undefined && mods[ability] !== 0 );
    abilitiesToProcess.sort((aAbility, bAbility) => {
        const changeA = mods![aAbility]!;
        const changeB = mods![bAbility]!;
        const signA = Math.sign(changeA);
        const signB = Math.sign(changeB);
        if (signA !== signB) return signA - signB;
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

export function calculateFeatBonusesForSkill(skillId: string, selectedFeats: Feat[]): number {
  let totalBonus = 0;
  for (const feat of selectedFeats) {
    if (feat.effects?.skills && feat.effects.skills[skillId]) {
      totalBonus += feat.effects.skills[skillId];
    }
  }
  return totalBonus;
}

export function calculateRacialSkillBonus(skillId: string, raceId: DndRaceId | string): number {
  if (!raceId) return 0;
  const raceData = DND_RACES.find(r => r.value === raceId);
  if (raceData?.racialSkillBonuses && raceData.racialSkillBonuses[skillId] !== undefined) {
    return raceData.racialSkillBonuses[skillId];
  }
  return 0;
}

export function calculateAvailableFeats(raceId: DndRaceId | string, level: number): number {
  let availableFeats = 0;
  if (level >= 1) availableFeats += 1;
  const raceData = DND_RACES.find(r => r.value === raceId);
  if (raceData?.bonusFeatSlots) availableFeats += raceData.bonusFeatSlots;
  availableFeats += Math.floor(level / 3);
  return availableFeats;
}

export function getGrantedFeatsForCharacter(characterRaceId: DndRaceId | string, characterClasses: CharacterClass[], characterLevel: number): Feat[] {
  const grantedFeatsMap = new Map<string, Feat>();
  const addGrantedFeat = (featId: string, note: string | undefined, source: string) => {
    if (!featId) return;
    const featDef = DND_FEATS.find(f => f.value === featId);
    if (featDef && !grantedFeatsMap.has(featId)) {
      grantedFeatsMap.set(featId, {
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
      if (gf.levelAcquired === undefined || gf.levelAcquired <= characterLevel) {
        addGrantedFeat(gf.featId, gf.note, raceData.label);
      }
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
  if (!prerequisites || Object.keys(prerequisites).length === 0) return { met: true, unmetMessages: [], metMessages: [] };
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
    for (const requiredFeatId of prerequisites.feats) {
      const featDef = allFeatDefinitions.find(f => f.value === requiredFeatId);
      if (!characterFeatIds.includes(requiredFeatId)) unmetMessages.push(featDef?.label || requiredFeatId);
      else metMessages.push(featDef?.label || requiredFeatId);
    }
  }
  const totalLevel = character.classes.reduce((sum, c) => sum + c.level, 0) || 1;
  if (prerequisites.casterLevel !== undefined) {
    if (totalLevel < prerequisites.casterLevel) unmetMessages.push(`Caster Level ${prerequisites.casterLevel}`);
    else metMessages.push(`Caster Level ${prerequisites.casterLevel}`);
  }
  if (prerequisites.special) {
    let specialMet = true;
    const specialText = prerequisites.special.toLowerCase();
    const requiredLevelMatch = specialText.match(/(\w+) level (\d+)/);
    if (requiredLevelMatch) {
        const className = requiredLevelMatch[1];
        const requiredLevel = parseInt(requiredLevelMatch[2], 10);
        const matchingClass = character.classes.find(c => c.className === className);
        if (!matchingClass || matchingClass.level < requiredLevel) specialMet = false;
    } else if (specialText.includes("wild shape ability")) {
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

  for (const ability of ABILITY_ORDER) {
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
        featTotalMod += featModVal;
        if (featModVal !== 0) {
          components.push({ source: `Feat (${feat.name})`, value: featModVal });
        }
      }
    }
    currentScore += featTotalMod;

    result[ability] = {
      ability, base: baseScore, components, finalScore: currentScore,
    };
  }
  return result as DetailedAbilityScores;
}

    