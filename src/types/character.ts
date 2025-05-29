
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
  race: DndRaceId | '';
  alignment: CharacterAlignment | '';
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

export const DEFAULT_ABILITIES: AbilityScores = constantsData.DEFAULT_ABILITIES as AbilityScores;
export const DEFAULT_SAVING_THROWS: SavingThrows = constantsData.DEFAULT_SAVING_THROWS as SavingThrows;

export type CharacterSizeObject = typeof constantsData.SIZES_DATA[number];
export type CharacterSize = CharacterSizeObject['value'];
export const SIZES: ReadonlyArray<CharacterSizeObject> = constantsData.SIZES_DATA as ReadonlyArray<CharacterSizeObject>;

export type CharacterAlignmentObject = typeof constantsData.ALIGNMENTS_DATA[number];
export type CharacterAlignment = CharacterAlignmentObject['value'];
export const ALIGNMENTS: ReadonlyArray<CharacterAlignmentObject> = constantsData.ALIGNMENTS_DATA as ReadonlyArray<CharacterAlignmentObject>;


export type GenderId = typeof constantsData.GENDERS_DATA[number]['value'];
export const GENDERS: ReadonlyArray<{value: GenderId, label: string}> = constantsData.GENDERS_DATA as ReadonlyArray<{value: GenderId, label: string}>;

export type DndRaceOption = typeof constantsData.DND_RACES_DATA[number] & {
  description?: string;
  racialSkillBonuses?: Record<string, number>;
  grantedFeats?: Array<{ featId: string; note?: string; levelAcquired?: number }>;
  bonusFeatSlots?: number;
};
export type DndRaceId = DndRaceOption['value'];
export const DND_RACES: ReadonlyArray<DndRaceOption> = constantsData.DND_RACES_DATA as ReadonlyArray<DndRaceOption>;


export type DndClassOption = typeof constantsData.DND_CLASSES_DATA[number] & {
  grantedFeats?: Array<{ featId: string; note?: string; levelAcquired?: number }>;
};
export type DndClassId = DndClassOption['value'];
export const DND_CLASSES: ReadonlyArray<DndClassOption> = constantsData.DND_CLASSES_DATA as ReadonlyArray<DndClassOption>;

export type DndDeityId = typeof constantsData.DND_DEITIES_DATA[number]['value'];
export const DND_DEITIES: ReadonlyArray<{value: DndDeityId, label: string}> = constantsData.DND_DEITIES_DATA as ReadonlyArray<{value: DndDeityId, label: string}>;


export const DND_FEATS: readonly FeatDefinitionJsonData[] = constantsData.DND_FEATS_DATA as ReadonlyArray<FeatDefinitionJsonData>;


export type SkillDefinitionJsonData = typeof constantsData.SKILL_DEFINITIONS_DATA[number] & {description?: string};
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

export interface RaceSpecialQualities {
  abilityEffects: Array<{ ability: AbilityName; change: number }>;
  skillBonuses?: Array<{ skillName: string; bonus: number }>;
  grantedFeats?: Array<{ featId: string; note?: string; levelAcquired?: number }>;
  bonusFeatSlots?: number;
}


export function getRaceSpecialQualities(raceId: DndRaceId): RaceSpecialQualities {
  const raceData = DND_RACES.find(r => r.value === raceId);
  const abilityModifiers = (constantsData.DND_RACE_ABILITY_MODIFIERS_DATA as Record<DndRaceId, Partial<Record<AbilityName, number>>>)[raceId];

  const appliedAbilityEffects: Array<{ ability: AbilityName; change: number }> = [];
  if (abilityModifiers) {
    const abilitiesToProcess = (Object.keys(abilityModifiers) as AbilityName[])
      .filter(ability => abilityModifiers[ability] !== undefined && abilityModifiers[ability] !== 0);

     abilitiesToProcess.sort((aAbility, bAbility) => {
        const changeA = abilityModifiers![aAbility]!;
        const changeB = abilityModifiers![bAbility]!;
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
      appliedAbilityEffects.push({ ability, change: abilityModifiers[ability]! });
    }
  }

  const appliedSkillBonuses: Array<{ skillName: string; bonus: number }> = [];
  if (raceData?.racialSkillBonuses) {
    for (const [skillId, bonus] of Object.entries(raceData.racialSkillBonuses)) {
      const skillDef = SKILL_DEFINITIONS.find(sd => sd.value === skillId);
      if (skillDef) {
        appliedSkillBonuses.push({ skillName: skillDef.label, bonus });
      }
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

export interface SynergyEffectJsonData {
  targetSkill: string;
  ranksRequired: number;
  bonus: number;
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

export function calculateAvailableFeats(raceId: DndRaceId | string, level: number): number {
  let availableFeats = 0;
  if (level >= 1) {
    availableFeats += 1;
  }

  const raceData = DND_RACES.find(r => r.value === raceId);
  if (raceData?.bonusFeatSlots) {
    availableFeats += raceData.bonusFeatSlots;
  }

  availableFeats += Math.floor(level / 3);
  return availableFeats;
}

export function getGrantedFeatsForCharacter(
  characterRaceId: DndRaceId | string,
  characterClasses: CharacterClass[],
  characterLevel: number
): Feat[] {
  const grantedFeatsMap = new Map<string, Feat>();

  const addGrantedFeat = (featId: string, note: string | undefined) => {
    if (!featId) return;
    const featDef = DND_FEATS.find(f => f.value === featId);
    if (featDef && !grantedFeatsMap.has(featId)) {
      grantedFeatsMap.set(featId, {
        id: featDef.value,
        name: featDef.label,
        description: featDef.description,
        prerequisites: featDef.prerequisites,
        effects: featDef.effects,
        canTakeMultipleTimes: featDef.canTakeMultipleTimes,
        requiresSpecialization: featDef.requiresSpecialization,
        isGranted: true,
        grantedNote: note,
      });
    }
  };

  const raceData = DND_RACES.find(r => r.value === characterRaceId);
  if (raceData?.grantedFeats) {
    raceData.grantedFeats.forEach(gf => {
      if (gf.levelAcquired === undefined || gf.levelAcquired <= characterLevel) {
        addGrantedFeat(gf.featId, gf.note || "(Racial)");
      }
    });
  }

  characterClasses.forEach(charClass => {
    if (!charClass.className) return;
    const classData = DND_CLASSES.find(c => c.value === charClass.className);
    if (classData?.grantedFeats) {
      classData.grantedFeats.forEach(gf => {
        if (gf.levelAcquired === undefined || gf.levelAcquired <= charClass.level) {
          addGrantedFeat(gf.featId, gf.note || `(${classData.label})`);
        }
      });
    }
  });

  return Array.from(grantedFeatsMap.values());
}


export function checkFeatPrerequisites(
  featDefinition: FeatDefinitionJsonData,
  character: Pick<Character, 'abilityScores' | 'skills' | 'feats' | 'classes' | 'race' | 'age'>,
  allFeatDefinitions: readonly FeatDefinitionJsonData[]
): { met: boolean; metMessages: string[]; unmetMessages: string[]; } {
  const { prerequisites } = featDefinition;
  const unmetMessages: string[] = [];
  const metMessages: string[] = [];

  if (!prerequisites) {
    return { met: true, unmetMessages: [], metMessages: [] };
  }

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

  const totalLevel = character.classes.reduce((sum, c) => sum + c.level, 0) || 1;
  if (prerequisites.casterLevel !== undefined) {
    if (totalLevel < prerequisites.casterLevel) {
      unmetMessages.push(`Caster Level ${prerequisites.casterLevel}`);
    } else {
      metMessages.push(`Caster Level ${prerequisites.casterLevel}`);
    }
  }

  if (prerequisites.special) {
    let specialMet = true;
    if (prerequisites.special.toLowerCase().includes("fighter level")) {
        const requiredLevel = parseInt(prerequisites.special.toLowerCase().replace(/[^0-9]/g, ''), 10);
        const fighterClass = character.classes.find(c => c.className === 'fighter');
        if (!fighterClass || fighterClass.level < requiredLevel) {
            specialMet = false;
        }
    } else if (prerequisites.special.toLowerCase().includes("wizard level")) {
        const requiredLevel = parseInt(prerequisites.special.toLowerCase().replace(/[^0-9]/g, ''), 10);
        const wizardClass = character.classes.find(c => c.className === 'wizard');
        if (!wizardClass || wizardClass.level < requiredLevel) {
            specialMet = false;
        }
    } else if (prerequisites.special.toLowerCase().includes("wild shape ability")) {
        const hasWildShapeClass = character.classes.some(c => c.className === 'druid');
        if (!hasWildShapeClass) {
            specialMet = false;
        }
    } else if (prerequisites.special.toLowerCase().includes("proficiency with weapon")){
        // This is a general check, specific weapon proficiency would need more complex logic.
        // For now, assume it's met or let the user decide.
        // This would need integration with weapon selection if implemented fully.
    }


    if (specialMet) {
        metMessages.push(prerequisites.special);
    } else {
        unmetMessages.push(prerequisites.special);
    }
  }

  return { met: unmetMessages.length === 0, unmetMessages, metMessages };
}
