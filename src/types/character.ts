


// This file now delegates data processing and constant definitions to the i18n system.
// It retains core type definitions and utility functions that operate on those types,
// assuming the data (like DND_RACES, DND_CLASSES from context) is passed to them.

import type {
  CharacterClass,
  AbilityName,
  AbilityScores,
  DndRaceId,
  DndClassId,
  Skill,
  FeatDefinitionJsonData,
  CharacterFeatInstance,
  PrerequisiteMessage,
  RaceSpecialQualities,
  AgingEffectsDetails,
  DetailedAbilityScores,
  CharacterSizeObject,
  CharacterAlignmentObject,
  DndRaceOption,
  DndClassOption,
  SkillDefinitionJsonData,
  CharacterSize,
  SpeedType,
  SpeedBreakdownDetails,
  CharacterAlignment,
  AbilityScoreComponentValue
} from './character-core';
import type { CustomSkillDefinition } from '@/lib/definitions-store';
import { getBab } from '@/lib/dnd-utils';


// Utility Functions (many will now need translated data passed in)
// These functions are kept here if they perform logic based on character data,
// but the data structures (like DND_RACES, SKILL_DEFINITIONS) are now from context.

export const ABILITY_ORDER_INTERNAL: Exclude<AbilityName, 'none'>[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

export function getRaceSkillPointsBonusPerLevel(
  raceId: DndRaceId | string,
  DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA: Record<string, number>
): number {
  return DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA[raceId] || 0;
}

export function getInitialCharacterSkills(
  characterClasses: CharacterClass[],
  SKILL_DEFINITIONS: readonly SkillDefinitionJsonData[],
  CLASS_SKILLS: Record<string, string[]>
): Skill[] {
  const firstClassValue = characterClasses[0]?.className;
  const classSkillsForCurrentClass = firstClassValue ? (CLASS_SKILLS[firstClassValue as keyof typeof CLASS_SKILLS] || []) : [];

  return SKILL_DEFINITIONS.map(def => ({
    id: def.value,
    ranks: 0,
    miscModifier: 0,
    isClassSkill: classSkillsForCurrentClass.includes(def.value),
  })).sort((a, b) => {
    const nameA = SKILL_DEFINITIONS.find(d => d.value === a.id)?.label || '';
    const nameB = SKILL_DEFINITIONS.find(d => d.value === b.id)?.label || '';
    return nameA.localeCompare(nameB);
  });
}


export function getNetAgingEffects(
  raceId: DndRaceId | '',
  age: number,
  DND_RACE_BASE_MAX_AGE_DATA: Record<string, number>,
  RACE_TO_AGING_CATEGORY_MAP_DATA: Record<string, string>, // string is RaceAgingCategoryKey
  DND_RACE_AGING_EFFECTS_DATA: Record<string, { categories: Array<{ categoryName: string; ageFactor: number; effects: Record<string, number> }> }>, // string is RaceAgingCategoryKey
  ABILITY_LABELS: readonly { value: Exclude<AbilityName, 'none'>; label: string; abbr: string }[]
): AgingEffectsDetails {
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
      highestAttainedCategoryEffects = category.effects as Partial<Record<Exclude<AbilityName, 'none'>, number>>;
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
  return { categoryName: currentCategoryLabel, effects: appliedEffects };
}

export function getRaceSpecialQualities(
  raceId: DndRaceId | '',
  DND_RACES: readonly DndRaceOption[],
  DND_RACE_ABILITY_MODIFIERS_DATA: Record<string, Partial<Record<Exclude<AbilityName, 'none'>, number>>>,
  SKILL_DEFINITIONS: readonly SkillDefinitionJsonData[],
  DND_FEATS_DEFINITIONS: readonly FeatDefinitionJsonData[],
  ABILITY_LABELS: readonly { value: Exclude<AbilityName, 'none'>; label: string; abbr: string }[]
): RaceSpecialQualities {
  if (!raceId) return { abilityEffects: [], skillBonuses: [], grantedFeats: [], bonusFeatSlots: 0, speeds: {} };
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

  const appliedSkillBonuses: Array<{ skillId: string; skillName: string; bonus: number }> = [];
  if (raceData?.racialSkillBonuses) {
    for (const [skillId_kebab, bonus] of Object.entries(raceData.racialSkillBonuses)) {
      const skillDef = SKILL_DEFINITIONS.find(sd => sd.value === skillId_kebab);
      if (skillDef && bonus !== 0) {
        appliedSkillBonuses.push({ skillId: skillDef.value, skillName: skillDef.label, bonus });
      }
    }
    appliedSkillBonuses.sort((a, b) => a.skillName.localeCompare(b.skillName));
  }

  const formattedGrantedFeats = raceData?.grantedFeats?.map(gf => {
    const featDef = DND_FEATS_DEFINITIONS.find(f => f.value === gf.featId);
    return { ...gf, name: featDef?.label || gf.featId };
  }) || [];

  return {
    abilityEffects: appliedAbilityEffects,
    skillBonuses: appliedSkillBonuses.length > 0 ? appliedSkillBonuses : undefined,
    grantedFeats: formattedGrantedFeats.length > 0 ? formattedGrantedFeats : undefined,
    bonusFeatSlots: raceData?.bonusFeatSlots || 0,
    speeds: raceData?.speeds || {},
  };
}

export function calculateTotalSynergyBonus(
  targetSkillId: string,
  currentCharacterSkills: Skill[],
  ALL_SKILL_DEFINITIONS: readonly SkillDefinitionJsonData[], // Combined predefined and custom definitions
  SKILL_SYNERGIES: Record<string, Array<{ targetSkill: string; ranksRequired: number; bonus: number }>>,
  allCustomSkillDefinitions: readonly CustomSkillDefinition[]
): number {
  let totalBonus = 0;

  if (SKILL_SYNERGIES) {
    for (const providingSkillDefId in SKILL_SYNERGIES) {
      const synergiesProvidedByThisDefinition = SKILL_SYNERGIES[providingSkillDefId];
      if (synergiesProvidedByThisDefinition) {
        for (const synergy of synergiesProvidedByThisDefinition) {
          if (synergy.targetSkill === targetSkillId) {
            const providingSkillInCharacter = currentCharacterSkills.find(s => s.id === providingSkillDefId);
            if (providingSkillInCharacter && (providingSkillInCharacter.ranks || 0) >= synergy.ranksRequired) {
              totalBonus += synergy.bonus;
            }
          }
        }
      }
    }
  }

  for (const charSkillInstance of currentCharacterSkills) {
    const customSkillDef = allCustomSkillDefinitions.find(csd => csd.id === charSkillInstance.id);
    if (customSkillDef?.providesSynergies) {
      for (const customRule of customSkillDef.providesSynergies) {
        if (customRule.targetSkillName === targetSkillId) {
          if ((charSkillInstance.ranks || 0) >= customRule.ranksInThisSkillRequired) {
            totalBonus += customRule.bonusGranted;
          }
        }
      }
    }
  }
  return totalBonus;
}

export function calculateFeatBonusesForSkill(
  skillId_kebab: string,
  characterFeatInstances: CharacterFeatInstance[],
  allFeatDefinitions: (FeatDefinitionJsonData & { isCustom?: boolean })[]
): number {
  let totalBonus = 0;
  for (const instance of characterFeatInstances) {
    const definition = allFeatDefinitions.find(def => def.value === instance.definitionId);
    if (definition?.effects?.skills && definition.effects.skills[skillId_kebab]) {
      totalBonus += definition.effects.skills[skillId_kebab];
    }
  }
  return totalBonus;
}

export function calculateRacialSkillBonus(
  skillId_kebab: string,
  raceId: DndRaceId | string,
  DND_RACES: readonly DndRaceOption[]
): number {
  if (!raceId) return 0;
  const raceData = DND_RACES.find(r => r.value === raceId);
  if (raceData?.racialSkillBonuses && raceData.racialSkillBonuses[skillId_kebab] !== undefined) {
    return raceData.racialSkillBonuses[skillId_kebab];
  }
  return 0;
}

export function calculateSizeSpecificSkillBonus(
  skillId_kebab: string,
  sizeId: CharacterSize | '',
  SIZES: readonly CharacterSizeObject[]
): number {
  if (!sizeId) return 0;
  const sizeData = SIZES.find(s => s.value === sizeId);
  if (sizeData?.skillModifiers && sizeData.skillModifiers[skillId_kebab] !== undefined) {
    return sizeData.skillModifiers[skillId_kebab];
  }
  return 0;
}

export interface AvailableFeatSlotsBreakdown {
  total: number;
  base: number;
  racial: number;
  levelProgression: number;
  classBonus: number;
}

export function calculateAvailableFeats(
  characterRaceId: DndRaceId | string,
  level: number,
  characterClasses: CharacterClass[],
  DND_RACES: readonly DndRaceOption[]
): AvailableFeatSlotsBreakdown {
  let baseFeat = 0;
  if (level >= 1) baseFeat = 1;

  let racialBonus = 0;
  const raceData = DND_RACES.find(r => r.value === characterRaceId);
  if (raceData?.bonusFeatSlots) {
    racialBonus = raceData.bonusFeatSlots;
  }

  const levelProgressionFeats = Math.floor(level / 3);

  let classBonusFeats = 0;
  characterClasses.forEach(charClass => {
    if (charClass.className === 'fighter') {
      if (charClass.level >= 1) classBonusFeats += 1;
      for (let i = 2; i <= charClass.level; i += 2) {
        classBonusFeats += 1;
      }
    }
    // Note: Monk bonus feats are typically specific choices, not generic slots.
    // Handling specific monk bonus feats would require knowing which feat they picked.
    // For now, this calculator focuses on general feat slots.
  });

  const totalFeats = baseFeat + racialBonus + levelProgressionFeats + classBonusFeats;
  return {
    total: totalFeats,
    base: baseFeat,
    racial: racialBonus,
    levelProgression: levelProgressionFeats,
    classBonus: classBonusFeats,
  };
}

export function getGrantedFeatsForCharacter(
  characterRaceId: DndRaceId | string,
  characterClasses: CharacterClass[],
  characterLevel: number,
  allFeatDefinitions: readonly FeatDefinitionJsonData[],
  DND_RACES: readonly DndRaceOption[],
  DND_CLASSES: readonly DndClassOption[]
): CharacterFeatInstance[] {
  const grantedInstances: CharacterFeatInstance[] = [];
  const addedDefinitionIds = new Set<string>();

  const addGrantedInstance = (featDefId: string, note: string | undefined, source: string, levelAcquired?: number) => {
    if (!featDefId || (levelAcquired !== undefined && levelAcquired > characterLevel)) {
      return;
    }
    const featDef = allFeatDefinitions.find(f => f.value === featDefId);
    if (featDef) {
      const instanceId = featDef.value;
      if (addedDefinitionIds.has(instanceId) && !featDef.canTakeMultipleTimes) return;

      grantedInstances.push({
        definitionId: featDef.value,
        instanceId: featDef.canTakeMultipleTimes ? `${featDef.value}-GRANTED-${crypto.randomUUID()}` : instanceId,
        isGranted: true,
        grantedNote: note ? `${note}` : undefined,
      });
      if (!featDef.canTakeMultipleTimes) {
        addedDefinitionIds.add(instanceId);
      }
    }
  };

  const raceData = DND_RACES.find(r => r.value === characterRaceId);
  if (raceData?.grantedFeats) {
    raceData.grantedFeats.forEach(gf => {
      addGrantedInstance(gf.featId, gf.note, raceData.label, gf.levelAcquired);
    });
  }

  characterClasses.forEach(charClass => {
    if (!charClass.className) return;
    const classData = DND_CLASSES.find(c => c.value === charClass.className);
    if (classData?.grantedFeats) {
      classData.grantedFeats.forEach(gf => {
        if (gf.levelAcquired === undefined || gf.levelAcquired <= charClass.level) {
          addGrantedInstance(gf.featId, gf.note, classData.label, gf.levelAcquired);
        }
      });
    }
  });
  return grantedInstances;
}

export const PREREQ_ORDER_MAP: Record<string, number> = {
  race: 1, classLevel: 2, alignment: 3, bab: 4, casterLevel: 5,
  ability: 6, skill: 7, feat: 8, special: 9,
};

export function checkFeatPrerequisites(
  featDefinitionToCheck: FeatDefinitionJsonData,
  character: Pick<Character, 'abilityScores' | 'skills' | 'feats' | 'classes' | 'race' | 'age' | 'alignment'>,
  allFeatDefinitions: readonly (FeatDefinitionJsonData & { isCustom?: boolean })[],
  ALL_SKILL_DEFINITIONS: readonly SkillDefinitionJsonData[], // Combined predefined and custom
  allCustomSkillDefinitions: readonly CustomSkillDefinition[], // For custom skills from store
  DND_CLASSES: readonly DndClassOption[],
  DND_RACES: readonly DndRaceOption[],
  ABILITY_LABELS: readonly { value: Exclude<AbilityName, 'none'>; label: string; abbr: string }[],
  ALIGNMENT_PREREQUISITE_OPTIONS: readonly { value: string; label: string }[],
  uiStrings: Record<string, string>
): PrerequisiteMessage[] {
  const { prerequisites } = featDefinitionToCheck;
  const messages: PrerequisiteMessage[] = [];

  if (!prerequisites || Object.keys(prerequisites).length === 0) {
    return [];
  }

  const getCombinedSkillDefsForPrereq = () => {
    const combined: Array<{id: string; label: string}> = ALL_SKILL_DEFINITIONS.map(sd => ({id: sd.value, label: sd.label}));
    allCustomSkillDefinitions.forEach(csd => {
      if (!combined.find(s => s.id === csd.id)) {
        combined.push({id: csd.id, label: csd.name});
      }
    });
    return combined;
  };
  const combinedSkillDefsForPrereq = getCombinedSkillDefsForPrereq();


  if (prerequisites.raceId !== undefined && prerequisites.raceId !== "") {
    const raceDef = DND_RACES.find(r => r.value === prerequisites!.raceId);
    const raceName = raceDef?.label || prerequisites.raceId;
    const isMet = character.race === prerequisites.raceId;
    messages.push({ text: `Race: ${raceName}`, isMet, orderKey: 'race', originalText: raceName });
  }

  if (prerequisites.classLevel && prerequisites.classLevel.classId && prerequisites.classLevel.classId !== "") {
    const { classId, level: requiredClassLevel } = prerequisites.classLevel;
    const charClass = character.classes.find(c => c.className === classId);
    const classDef = DND_CLASSES.find(cd => cd.value === classId);
    const className = classDef?.label || classId;
    const isMet = charClass ? charClass.level >= requiredClassLevel : false;
    messages.push({ text: `${className} Level ${requiredClassLevel}`, isMet, orderKey: `classLevel_${classId}`, originalText: className });
  }

  if (prerequisites.alignment && prerequisites.alignment !== "") {
    const reqAlign = prerequisites.alignment;
    const charAlign = character.alignment;
    let isMet = false;
    const requiredAlignmentLabel = ALIGNMENT_PREREQUISITE_OPTIONS.find(opt => opt.value === reqAlign)?.label || reqAlign;

    if (charAlign === '') { // If character has no alignment, they don't meet any alignment prereq
        isMet = false;
    } else if (reqAlign.includes('-')) { // Specific alignment like "lawful-good"
        isMet = charAlign === reqAlign;
    } else { // Generic alignment like "lawful", "good", "neutral-lc", "neutral-ge"
        const charParts = charAlign.split('-'); // e.g., ['lawful', 'good']
        if (charParts.length === 2) {
            if (reqAlign === 'lawful' && charParts[0] === 'lawful') isMet = true;
            else if (reqAlign === 'chaotic' && charParts[0] === 'chaotic') isMet = true;
            else if (reqAlign === 'good' && charParts[1] === 'good') isMet = true;
            else if (reqAlign === 'evil' && charParts[1] === 'evil') isMet = true;
            else if (reqAlign === 'neutral-lc' && charParts[0] === 'neutral') isMet = true; // Neutral on Law/Chaos axis
            else if (reqAlign === 'neutral-ge' && charParts[1] === 'neutral') isMet = true; // Neutral on Good/Evil axis
        } else if (charAlign === 'true-neutral') { // Special case for "true-neutral"
            if (reqAlign === 'neutral-lc' || reqAlign === 'neutral-ge' || reqAlign === 'true-neutral') isMet = true;
        }
    }
    messages.push({ text: `Alignment: ${requiredAlignmentLabel}`, isMet, orderKey: 'alignment', originalText: requiredAlignmentLabel });
  }

  if (prerequisites.bab !== undefined) {
    const characterBab = getBab(character.classes, DND_CLASSES)[0];
    const isMet = characterBab >= prerequisites.bab;
    const babLabel = uiStrings.prereqBabLabel || 'BAB';
    messages.push({ text: `${babLabel} +${prerequisites.bab}`, isMet, orderKey: 'bab', originalText: babLabel });
  }

  if (prerequisites.casterLevel !== undefined) {
    let calculatedCharacterCasterLevel = 0;
    character.classes.forEach(charClass => {
      if (!charClass.className) return;
      const classDef = DND_CLASSES.find(c => c.value === charClass.className);
      if (classDef?.casting) {
        if (classDef.casting.type === 'full') {
          calculatedCharacterCasterLevel += charClass.level;
        } else if (classDef.casting.type === 'partial' && classDef.casting.startsAtLevel !== undefined && classDef.casting.levelOffset !== undefined) {
          if (charClass.level >= classDef.casting.startsAtLevel) {
            const clContribution = charClass.level + classDef.casting.levelOffset;
            calculatedCharacterCasterLevel += Math.max(0, clContribution);
          }
        }
      }
    });
    const isMet = calculatedCharacterCasterLevel >= prerequisites.casterLevel;
    const casterLevelLabel = uiStrings.prereqCasterLevelLabel || 'Caster Level';
    messages.push({ text: `${casterLevelLabel} ${prerequisites.casterLevel}`, isMet, orderKey: 'casterLevel', originalText: casterLevelLabel });
  }

  if (prerequisites.abilities) {
    for (const [abilityKey, requiredScore] of Object.entries(prerequisites.abilities)) {
      if (requiredScore === undefined) continue;
      const ability = abilityKey as Exclude<AbilityName, 'none'>;
      const charScore = character.abilityScores[ability];
      const isMet = charScore >= requiredScore!;
      const abilityLabelFull = ABILITY_LABELS.find(al => al.value === ability)?.label || ability.charAt(0).toUpperCase() + ability.slice(1);
      messages.push({ text: `${abilityLabelFull} ${requiredScore}`, isMet, orderKey: `ability_${abilityKey}`, originalText: abilityLabelFull });
    }
  }

  if (prerequisites.skills) {
    const formatString = uiStrings.skillRankPrereqFormat || "{skillName} {ranksValue} {ranksLabel}";
    const ranksLabel = uiStrings.prereqSkillRanksLabel || "Ranks";
    for (const skillReq of prerequisites.skills) {
      const charSkillInstance = character.skills.find(s => s.id === skillReq.id);
      const skillDef = combinedSkillDefsForPrereq.find(sd => sd.id === skillReq.id);
      const skillName = skillDef?.label || skillReq.id;
      const isMet = charSkillInstance ? charSkillInstance.ranks >= skillReq.ranks : false;
      
      const messageText = formatString
        .replace("{skillName}", skillName)
        .replace("{ranksValue}", String(skillReq.ranks))
        .replace("{ranksLabel}", ranksLabel);
      
      messages.push({ text: messageText, isMet, orderKey: `skill_${skillReq.id}`, originalText: skillName });
    }
  }

  if (prerequisites.feats) {
    const characterTakenFeatDefinitionIds = character.feats.map(f => f.definitionId);
    for (const requiredFeatDefId of prerequisites.feats) {
      const featDef = allFeatDefinitions.find(f => f.value === requiredFeatDefId);
      const featName = featDef?.label || requiredFeatDefId;
      const isMet = characterTakenFeatDefinitionIds.includes(requiredFeatDefId);
      messages.push({ text: featName, isMet, orderKey: `feat_${requiredFeatDefId}`, originalText: featName });
    }
  }

  if (prerequisites.special) {
    messages.push({ text: prerequisites.special, isMet: true, orderKey: 'special', originalText: prerequisites.special });
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

export function calculateDetailedAbilityScores(
  character: Pick<Character, 'abilityScores' | 'race' | 'age' | 'feats' | 'abilityScoreTempCustomModifiers'>,
  globalCustomFeatDefs: (FeatDefinitionJsonData & { isCustom: true })[],
  DND_RACES: readonly DndRaceOption[],
  DND_RACE_ABILITY_MODIFIERS_DATA: Record<string, Partial<Record<Exclude<AbilityName, 'none'>, number>>>,
  DND_RACE_BASE_MAX_AGE_DATA: Record<string, number>,
  RACE_TO_AGING_CATEGORY_MAP_DATA: Record<string, string>,
  DND_RACE_AGING_EFFECTS_DATA: Record<string, { categories: Array<{ categoryName: string; ageFactor: number; effects: Record<string, number> }> }>,
  DND_FEATS_DEFINITIONS: readonly FeatDefinitionJsonData[], // Predefined feats
  ABILITY_LABELS: readonly { value: Exclude<AbilityName, 'none'>; label: string; abbr: string }[]
): DetailedAbilityScores {
  const result: Partial<DetailedAbilityScores> = {};
  const racialQualities = getRaceSpecialQualities(character.race, DND_RACES, DND_RACE_ABILITY_MODIFIERS_DATA, [], DND_FEATS_DEFINITIONS, ABILITY_LABELS); // Empty skills/feats for this specific call context
  const agingDetails = getNetAgingEffects(character.race, character.age, DND_RACE_BASE_MAX_AGE_DATA, RACE_TO_AGING_CATEGORY_MAP_DATA, DND_RACE_AGING_EFFECTS_DATA, ABILITY_LABELS);
  const tempCustomModifiers = character.abilityScoreTempCustomModifiers || 
    ABILITY_ORDER_INTERNAL.reduce((acc, key) => { acc[key] = 0; return acc; }, {} as AbilityScores);


  const allFeatDefs: (FeatDefinitionJsonData & { isCustom?: boolean })[] = [
    ...DND_FEATS_DEFINITIONS,
    ...globalCustomFeatDefs,
  ];

  for (const ability of ABILITY_ORDER_INTERNAL) {
    const baseScore = character.abilityScores[ability] || 0;
    const components: AbilityScoreComponentValue[] = [];
    let currentScore = baseScore;

    const racialModObj = racialQualities.abilityEffects.find(eff => eff.ability === ability);
    if (racialModObj && racialModObj.change !== 0) {
      currentScore += racialModObj.change;
      const raceLabel = DND_RACES.find(r => r.value === character.race)?.label || character.race || 'Unknown Race';
      components.push({ source: `Race (${raceLabel})`, value: racialModObj.change }); // source is already dynamic and potentially translated
    }

    const agingModObj = agingDetails.effects.find(eff => eff.ability === ability);
    if (agingModObj && agingModObj.change !== 0) {
      currentScore += agingModObj.change;
      components.push({ source: `Aging (${agingDetails.categoryName})`, value: agingModObj.change }); // source is already dynamic
    }

    const tempCustomModValue = tempCustomModifiers[ability];
    if (tempCustomModValue !== 0 && tempCustomModValue !== undefined) {
      currentScore += tempCustomModValue;
      components.push({ source: "tempMod", value: tempCustomModValue }); // Use key for translation
    }

    let featTotalMod = 0;
    for (const featInstance of character.feats) {
      const definition = allFeatDefs.find(def => def.value === featInstance.definitionId);
      if (definition?.effects?.abilities && definition.effects.abilities[ability]) {
        const featModVal = definition.effects.abilities[ability]!;
        if (featModVal !== 0) {
          featTotalMod += featModVal;
        }
      }
    }
    if (featTotalMod !== 0) {
      currentScore += featTotalMod;
      components.push({ source: "feats", value: featTotalMod }); // Use key for translation
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
  'true-neutral': 1, // Will be handled by parseAlignment
};

function getAlignmentAxisValue(part: string): number {
  if (part === 'neutral' && alignmentAxisMap[part] === undefined) return 1; // default for neutral part
  if (part === 'true' && alignmentAxisMap[part] === undefined) return 1; // part of 'true-neutral'
  return alignmentAxisMap[part] ?? 1; // default to neutral if not found
}

export function isAlignmentCompatible(
  characterAlignment: CharacterAlignment | '',
  deityAlignmentString: CharacterAlignment
): boolean {
  if (!characterAlignment || !deityAlignmentString) {
    return true; // No alignment or no deity alignment means compatible by default
  }

  const parseAlignment = (alignStr: CharacterAlignment) => {
    if (alignStr === 'true-neutral') {
      return { lc: 1, ge: 1 }; // Law/Chaos axis, Good/Evil axis
    }
    const parts = alignStr.split('-'); // e.g., "lawful-good" -> ["lawful", "good"]
    return {
      lc: getAlignmentAxisValue(parts[0]),
      ge: getAlignmentAxisValue(parts[1]),
    };
  };

  const charAlignNumeric = parseAlignment(characterAlignment as CharacterAlignment);
  const deityAlignNumeric = parseAlignment(deityAlignmentString);

  const lcDiff = Math.abs(charAlignNumeric.lc - deityAlignNumeric.lc);
  const geDiff = Math.abs(charAlignNumeric.ge - deityAlignNumeric.ge);

  // Within one step on each axis
  return lcDiff <= 1 && geDiff <= 1;
}

export function calculateSpeedBreakdown(
  speedType: SpeedType,
  character: Pick<Character, 'race' | 'size' | 'classes' | 'landSpeed' | 'burrowSpeed' | 'climbSpeed' | 'flySpeed' | 'swimSpeed' | 'armorSpeedPenalty_base' | 'armorSpeedPenalty_miscModifier' | 'loadSpeedPenalty_base' | 'loadSpeedPenalty_miscModifier'>,
  DND_RACES: readonly DndRaceOption[],
  DND_CLASSES: readonly DndClassOption[],
  SIZES: readonly CharacterSizeObject[],
  uiStrings: Record<string, string>
): SpeedBreakdownDetails {
  const components: { source: string; value: number | string }[] = [];
  let currentTotal = 0;

  const raceData = DND_RACES.find(r => r.value === character.race);
  const raceLabel = raceData?.label || character.race || 'Unknown Race';
  let baseSpeedFromRace = 0;

  if (raceData?.speeds && raceData.speeds[speedType] !== undefined) {
    baseSpeedFromRace = raceData.speeds[speedType] as number;
  } else if (speedType === 'land') { 
    const sizeData = SIZES.find(s => s.value === character.size);
    baseSpeedFromRace = (sizeData?.value === 'small' || sizeData?.value === 'tiny' || sizeData?.value === 'diminutive' || sizeData?.value === 'fine') ? 20 : 30;
  }
  
  const baseLabelText = uiStrings.savingThrowsRowLabelBase || "Base"; 
  components.push({ source: `${baseLabelText} (${raceLabel})`, value: baseSpeedFromRace });
  currentTotal += baseSpeedFromRace;

  const charSpeedDetails = character[`${speedType}Speed` as keyof Pick<Character, 'landSpeed' | 'burrowSpeed' | 'climbSpeed' | 'flySpeed' | 'swimSpeed'>];
  if (charSpeedDetails?.miscModifier && charSpeedDetails.miscModifier !== 0) {
    components.push({ source: uiStrings.infoDialogSpeedMiscModifierLabel || "Misc Modifier", value: charSpeedDetails.miscModifier });
    currentTotal += charSpeedDetails.miscModifier;
  }

  if (speedType === 'land') {
    const monkClass = character.classes.find(c => c.className === 'monk');
    if (monkClass) {
      const monkLevel = monkClass.level;
      let monkSpeedBonus = 0;
      if (monkLevel >= 18) monkSpeedBonus = 60;
      else if (monkLevel >= 15) monkSpeedBonus = 50;
      else if (monkLevel >= 12) monkSpeedBonus = 40;
      else if (monkLevel >= 9) monkSpeedBonus = 30;
      else if (monkLevel >= 6) monkSpeedBonus = 20;
      else if (monkLevel >= 3) monkSpeedBonus = 10;
      if (monkSpeedBonus > 0) {
        components.push({ source: uiStrings.infoDialogSpeedMonkLabel || "Monk Unarmored Speed", value: monkSpeedBonus });
        currentTotal += monkSpeedBonus;
      }
    }

    const barbarianClass = character.classes.find(c => c.className === 'barbarian');
    if (barbarianClass && barbarianClass.level >= 1) {
        components.push({ source: uiStrings.infoDialogSpeedBarbarianLabel || "Barbarian Fast Movement", value: 10 });
        currentTotal += 10;
    }

    const effectiveArmorPenalty = (character.armorSpeedPenalty_base || 0) - (character.armorSpeedPenalty_miscModifier || 0);
    if (effectiveArmorPenalty > 0) { 
        components.push({ source: uiStrings.infoDialogSpeedArmorPenaltyLabel || "Armor Penalty", value: -effectiveArmorPenalty });
        currentTotal -= effectiveArmorPenalty;
    }
    
    const effectiveLoadPenalty = (character.loadSpeedPenalty_base || 0) - (character.loadSpeedPenalty_miscModifier || 0);
    if (effectiveLoadPenalty > 0) {
        components.push({ source: uiStrings.infoDialogSpeedLoadPenaltyLabel || "Load Penalty", value: -effectiveLoadPenalty });
        currentTotal -= effectiveLoadPenalty;
    }
  }
  
  const speedTypeToLabelKey: Record<SpeedType, string> = {
    land: 'speedLabelLand',
    burrow: 'speedLabelBurrow',
    climb: 'speedLabelClimb',
    fly: 'speedLabelFly',
    swim: 'speedLabelSwim',
  };
  const speedName = uiStrings[speedTypeToLabelKey[speedType]] || speedType.charAt(0).toUpperCase() + speedType.slice(1);

  return {
    name: speedName,
    components,
    total: Math.max(0, currentTotal), 
  };
}

// Helper structure for default character values
export const DEFAULT_ABILITIES_DATA: AbilityScores = {
  strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10,
};

export const DEFAULT_SAVING_THROWS_DATA = {
  fortitude: { base: 0, magicMod: 0, miscMod: 0 },
  reflex: { base: 0, magicMod: 0, miscMod: 0 },
  will: { base: 0, magicMod: 0, miscMod: 0 },
};

export const DEFAULT_SPEED_DETAILS_DATA = { base: 0, miscModifier: 0 };
export const DEFAULT_SPEED_PENALTIES_DATA = { 
  armorSpeedPenalty_base: 0, armorSpeedPenalty_miscModifier: 0, 
  loadSpeedPenalty_base: 0, loadSpeedPenalty_miscModifier: 0 
};
export const DEFAULT_RESISTANCE_VALUE_DATA = { base: 0, customMod: 0 };

// It's recommended to also export core types from character-core.ts if they are needed elsewhere
export * from './character-core';

// Re-export selected constants only if they are defined solely in character-core.ts and NOT i18n-dependent
// For example, if SIZES or ALIGNMENTS were truly static and not i18n, they could be re-exported.
// However, given the current setup, they are i18n-dependent and sourced via useI18n.
// export { SIZES, ALIGNMENTS } from './character-core'; 








    