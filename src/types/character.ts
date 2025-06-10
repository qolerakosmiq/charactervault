

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
  AbilityScoreComponentValue,
  AggregatedFeatEffects,
  FeatEffectDetail,
  SkillEffectDetail,
  NoteEffectDetail,
  AbilityScoreEffect,
  SavingThrowEffect,
  AttackRollEffect,
  DamageRollEffect,
  ArmorClassEffect,
  HitPointsEffect,
  InitiativeEffect,
  SpeedEffect,
  ResistanceEffect,
  CasterLevelCheckEffect,
  SpellSaveDcEffect,
  TurnUndeadEffect,
  GrantsAbilityEffect,
  ModifiesMechanicEffect,
  GrantsProficiencyEffect,
  BonusFeatSlotEffect,
  LanguageEffect,
  LanguageId,
  LanguageOption,
  DescriptiveEffectDetail,
  FeatEffectScalingSpecificLevel,
  AvailableFeatSlotsBreakdown
} from './character-core';
import type { CustomSkillDefinition } from '@/lib/definitions-store';
// Import calculateLevelFromXp and other used utilities directly
import { getBab, calculateSumOfClassLevels, calculateAbilityModifier, getXpRequiredForLevel, calculateLevelFromXp as calculateLevelFromXpUtil, SAVING_THROW_ABILITIES } from '@/lib/dnd-utils';


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


export function calculateAvailableFeats(
  character: Pick<Character, 'race' | 'classes' | 'feats' | 'experiencePoints'>,
  allFeatDefinitions: readonly (FeatDefinitionJsonData & { isCustom?: boolean })[],
  DND_RACES: readonly DndRaceOption[],
  XP_TABLE: readonly { level: number; xpRequired: number }[],
  EPIC_LEVEL_XP_INCREASE: number
): AvailableFeatSlotsBreakdown {

  const characterLevel = calculateLevelFromXpUtil(character.experiencePoints || 0, XP_TABLE, EPIC_LEVEL_XP_INCREASE);

  let baseFeatSlots = 0;
  if (characterLevel >= 1) baseFeatSlots = 1; // 1st level
  baseFeatSlots += Math.floor(characterLevel / 3); // +1 every 3 levels (3, 6, 9, etc.)

  let racialBonusSlots = 0;
  const raceData = DND_RACES.find(r => r.value === character.race);
  if (raceData?.bonusFeatSlots) {
    racialBonusSlots = raceData.bonusFeatSlots;
  }

  let classBonusFeatSlotsTotal = 0;
  const classBonusDetails: Array<{ category: string; count: number; sourceFeatLabel?: string }> = [];

  if (character.feats) {
    for (const featInstance of character.feats) {
      if (featInstance.isGranted) { // Only consider granted feats for bonus slots
        const featDef = allFeatDefinitions.find(def => def.value === featInstance.definitionId);
        if (featDef?.effects) {
          for (const effect of featDef.effects) {
            if (effect.type === 'bonusFeatSlot') {
              const slotEffect = effect as BonusFeatSlotEffect;
              classBonusFeatSlotsTotal += slotEffect.count;
              const existingDetail = classBonusDetails.find(d => d.category === slotEffect.category && d.sourceFeatLabel === featDef.label);
              if (existingDetail) {
                existingDetail.count += slotEffect.count;
              } else {
                classBonusDetails.push({ category: slotEffect.category, count: slotEffect.count, sourceFeatLabel: featDef.label });
              }
            }
          }
        }
      }
    }
  }

  const totalFeats = baseFeatSlots + racialBonusSlots + classBonusFeatSlotsTotal;

  return {
    total: totalFeats,
    base: baseFeatSlots,
    racial: racialBonusSlots,
    classBonus: classBonusFeatSlotsTotal,
    classBonusDetails,
  };
}

export function getGrantedFeatsForCharacter(
  characterRaceId: DndRaceId | string,
  characterClasses: CharacterClass[],
  characterLevel: number, // This should be the XP-derived character level
  allFeatDefinitions: readonly (FeatDefinitionJsonData & { isCustom?: boolean })[],
  DND_RACES: readonly DndRaceOption[],
  DND_CLASSES: readonly DndClassOption[],
  characterChosenCombatStyle?: Character['chosenCombatStyle']
): CharacterFeatInstance[] {
  const grantedInstances: CharacterFeatInstance[] = [];
  const addedDefinitionIds = new Set<string>();

  const addGrantedInstance = (featDefId: string, note: string | undefined, source: string, levelAcquired?: number, specializationDetail?: string, chosenSpecializationCategory?: string) => {
    if (!featDefId || (levelAcquired !== undefined && levelAcquired > characterLevel)) {
      return;
    }
    const featDef = allFeatDefinitions.find(f => f.value === featDefId);
    if (featDef) {
      const instanceId = featDef.value; // For granted feats, instanceId can just be definitionId if not repeatable.
      if (addedDefinitionIds.has(instanceId) && !featDef.canTakeMultipleTimes) return;

      grantedInstances.push({
        definitionId: featDef.value,
        instanceId: featDef.canTakeMultipleTimes ? `${featDef.value}-GRANTED-${crypto.randomUUID()}` : instanceId,
        isGranted: true,
        grantedNote: note ? `${note}` : undefined,
        specializationDetail: specializationDetail,
        chosenSpecializationCategory: chosenSpecializationCategory,
        conditionalEffectStates: {},
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

    // Ranger Combat Style Feat Granting
    if (classData?.value === 'ranger' && characterChosenCombatStyle) {
      const rangerLevel = charClass.level; // Current level in Ranger class
      if (characterChosenCombatStyle === 'archery') {
        if (rangerLevel >= 2) addGrantedInstance('rapid-shot', 'Ranger Archery Style', 'Ranger', 2);
        if (rangerLevel >= 6) addGrantedInstance('manyshot', 'Ranger Archery Style', 'Ranger', 6);
        if (rangerLevel >= 11) addGrantedInstance('improved-precise-shot', 'Ranger Archery Style', 'Ranger', 11);
      } else if (characterChosenCombatStyle === 'twoWeaponFighting') {
        if (rangerLevel >= 2) addGrantedInstance('two-weapon-fighting', 'Ranger TWF Style', 'Ranger', 2);
        if (rangerLevel >= 6) addGrantedInstance('improved-two-weapon-fighting', 'Ranger TWF Style', 'Ranger', 6);
        if (rangerLevel >= 11) addGrantedInstance('greater-two-weapon-fighting', 'Ranger TWF Style', 'Ranger', 11);
      }
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
  character: Pick<Character, 'abilityScores' | 'skills' | 'feats' | 'classes' | 'race' | 'age' | 'alignment' | 'experiencePoints'>,
  allFeatDefinitions: readonly (FeatDefinitionJsonData & { isCustom?: boolean })[],
  ALL_SKILL_DEFINITIONS: readonly SkillDefinitionJsonData[],
  allCustomSkillDefinitions: readonly CustomSkillDefinition[],
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

    if (charAlign === '') {
        isMet = false;
    } else if (reqAlign.includes('-')) {
        isMet = charAlign === reqAlign;
    } else {
        const charParts = charAlign.split('-');
        if (charParts.length === 2) {
            if (reqAlign === 'lawful' && charParts[0] === 'lawful') isMet = true;
            else if (reqAlign === 'chaotic' && charParts[0] === 'chaotic') isMet = true;
            else if (reqAlign === 'good' && charParts[1] === 'good') isMet = true;
            else if (reqAlign === 'evil' && charParts[1] === 'evil') isMet = true;
            else if (reqAlign === 'neutral-lc' && charParts[0] === 'neutral') isMet = true;
            else if (reqAlign === 'neutral-ge' && charParts[1] === 'neutral') isMet = true;
        } else if (charAlign === 'true-neutral') {
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
      if (classDef?.spellcasting) { 
        if (classDef.spellcasting.type === 'full') {
          calculatedCharacterCasterLevel += charClass.level;
        } else if (classDef.spellcasting.type === 'partial' && classDef.spellcasting.startsAtLevel !== undefined && classDef.spellcasting.levelOffset !== undefined) {
          if (charClass.level >= classDef.spellcasting.startsAtLevel) {
            const clContribution = charClass.level + classDef.spellcasting.levelOffset;
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
    let isMetSpecial = true; 
    let specialText = prerequisites.special;
    messages.push({ text: specialText, isMet: isMetSpecial, orderKey: 'special', originalText: specialText });
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
  character: Pick<Character, 'abilityScores' | 'race' | 'age' | 'feats' | 'abilityScoreTempCustomModifiers' | 'classes'>,
  aggregatedFeatEffects: AggregatedFeatEffects,
  DND_RACES: readonly DndRaceOption[],
  DND_RACE_ABILITY_MODIFIERS_DATA: Record<string, Partial<Record<Exclude<AbilityName, 'none'>, number>>>,
  DND_RACE_BASE_MAX_AGE_DATA: Record<string, number>,
  RACE_TO_AGING_CATEGORY_MAP_DATA: Record<string, string>,
  DND_RACE_AGING_EFFECTS_DATA: Record<string, { categories: Array<{ categoryName: string; ageFactor: number; effects: Record<string, number> }> }>,
  ABILITY_LABELS: readonly { value: Exclude<AbilityName, 'none'>; label: string; abbr: string }[]
): DetailedAbilityScores {
  const result: Partial<DetailedAbilityScores> = {};
  const racialQualities = getRaceSpecialQualities(character.race, DND_RACES, DND_RACE_ABILITY_MODIFIERS_DATA, [], [], ABILITY_LABELS); // Pass empty skills/feats defs as not needed here
  const agingDetails = getNetAgingEffects(character.race, character.age, DND_RACE_BASE_MAX_AGE_DATA, RACE_TO_AGING_CATEGORY_MAP_DATA, DND_RACE_AGING_EFFECTS_DATA, ABILITY_LABELS);
  const tempCustomModifiers = character.abilityScoreTempCustomModifiers ||
    ABILITY_ORDER_INTERNAL.reduce((acc, key) => { acc[key] = 0; return acc; }, {} as AbilityScores);

  for (const ability of ABILITY_ORDER_INTERNAL) {
    const baseScore = character.abilityScores[ability] || 0;
    const components: AbilityScoreComponentValue[] = [];
    let currentScore = baseScore;

    const racialModObj = racialQualities.abilityEffects.find(eff => eff.ability === ability);
    if (racialModObj && racialModObj.change !== 0) {
      const raceLabel = DND_RACES.find(r => r.value === character.race)?.label || character.race || 'Unknown Race';
      components.push({ sourceLabel: "Race", sourceDetail: raceLabel, value: racialModObj.change });
      currentScore += racialModObj.change;
    }

    const agingModObj = agingDetails.effects.find(eff => eff.ability === ability);
    if (agingModObj && agingModObj.change !== 0) {
      components.push({ sourceLabel: "Aging", sourceDetail: agingDetails.categoryName, value: agingModObj.change });
      currentScore += agingModObj.change;
    }

    if (aggregatedFeatEffects.abilityScoreBonuses) {
      for (const featEffect of aggregatedFeatEffects.abilityScoreBonuses) {
        if (featEffect.ability === ability) {
          let effectIsActive = true;
          if (featEffect.condition && featEffect.condition.trim() !== "") {
            const featInstance = character.feats.find(fi => fi.definitionId === featEffect.sourceFeat?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')); // Approximation
            effectIsActive = !!featInstance?.conditionalEffectStates?.[featEffect.condition];
          }
          if(effectIsActive && typeof featEffect.value === 'number') { 
            components.push({
              sourceLabel: "Feat",
              sourceDetail: featEffect.sourceFeat || 'Unknown Feat',
              value: featEffect.value,
              condition: featEffect.condition,
            });
            currentScore += featEffect.value;
          } 
        }
      }
    }

    const tempCustomModValue = tempCustomModifiers[ability];
    if (tempCustomModValue !== 0 && tempCustomModValue !== undefined) {
      components.push({ sourceLabel: "Temporary Modifier", value: tempCustomModValue });
      currentScore += tempCustomModValue;
    }

    result[ability] = {
      ability, base: baseScore, components, finalScore: currentScore,
    };
  }
  return result as DetailedAbilityScores;
}

export function calculateFeatEffects(
  characterFeats: CharacterFeatInstance[],
  allFeatDefinitions: readonly (FeatDefinitionJsonData & { isCustom?: boolean })[],
  characterClasses: CharacterClass[]
): AggregatedFeatEffects {
  const newAggregatedEffects: AggregatedFeatEffects = {
    skillBonuses: {},
    favoredEnemyBonuses: { skillBonus: 0, damageBonus: 0 },
    favoredEnemySlots: 0,
    abilityScoreBonuses: [],
    savingThrowBonuses: [],
    attackRollBonuses: [],
    damageRollBonuses: [],
    acBonuses: [],
    hpBonus: 0,
    hpBonusSources: [],
    initiativeBonus: 0,
    speedBonuses: [],
    resistanceBonuses: [],
    casterLevelCheckBonuses: [],
    spellSaveDcBonuses: [],
    turnUndeadBonuses: [],
    grantedAbilities: [],
    modifiedMechanics: [],
    proficienciesGranted: [],
    bonusFeatSlots: [],
    languagesGranted: { count: 0, specific: [] },
    descriptiveNotes: [],
    classLevels: characterClasses.reduce((acc, cur) => {
      if (cur.className) acc[cur.className] = cur.level;
      return acc;
    }, {} as Record<DndClassId, number>),
  };

  for (const featInstance of characterFeats) {
    const definition = allFeatDefinitions.find(def => def.value === featInstance.definitionId);
    if (!definition || !definition.effects || !Array.isArray(definition.effects)) {
      continue;
    }

    for (const originalEffect of definition.effects) {
      const sourceFeatName = definition.label || definition.value;
      
      // Create a deep copy of the effect to modify if needed for scaling
      let effectToProcess: FeatEffectDetail & { sourceFeat?: string } = JSON.parse(JSON.stringify(originalEffect));
      effectToProcess.sourceFeat = sourceFeatName;


      let effectIsActive = true;
      if (effectToProcess.condition && effectToProcess.condition.trim() !== "") {
        effectIsActive = !!featInstance.conditionalEffectStates?.[effectToProcess.condition];
      }
      
      let resolvedValue: any = (effectToProcess as any).value; // Default to the effect's base value
      
      if (effectToProcess.scaleWithClassLevel && effectToProcess.scaleWithClassLevel.specificLevels) {
        const classLevel = newAggregatedEffects.classLevels[effectToProcess.scaleWithClassLevel.classId] || 0;
        let foundLevelValue: any = undefined;
        for (const levelEntry of [...effectToProcess.scaleWithClassLevel.specificLevels].sort((a, b) => b.level - a.level)) {
          if (classLevel >= levelEntry.level) {
            foundLevelValue = levelEntry.value;
            break; 
          }
        }
        if (foundLevelValue !== undefined) {
          resolvedValue = foundLevelValue;
        } else if ((effectToProcess as any).value === undefined && effectToProcess.scaleWithClassLevel.specificLevels.length > 0) {
           resolvedValue = [...effectToProcess.scaleWithClassLevel.specificLevels].sort((a,b) => a.level - b.level)[0].value;
        }
      }
      
      if (resolvedValue !== undefined && effectToProcess.hasOwnProperty('value')) {
        (effectToProcess as any).value = resolvedValue;
      }

      if (effectToProcess.type === 'grantsAbility' && effectToProcess.uses?.scaleWithClassLevel?.specificLevels) {
          const grantsAbilityEffect = effectToProcess as GrantsAbilityEffect & { sourceFeat?: string };
          if (grantsAbilityEffect.uses && grantsAbilityEffect.uses.scaleWithClassLevel) { 
              const classLevel = newAggregatedEffects.classLevels[grantsAbilityEffect.uses.scaleWithClassLevel.classId] || 0;
              let foundUsesValue: number | undefined;
              for (const lvlEntry of [...grantsAbilityEffect.uses.scaleWithClassLevel.specificLevels].sort((a,b) => b.level - a.level)) {
                  if (classLevel >= lvlEntry.level) {
                      foundUsesValue = lvlEntry.value as number;
                      break;
                  }
              }
              if (foundUsesValue !== undefined) {
                  grantsAbilityEffect.uses.value = foundUsesValue;
              } else if (grantsAbilityEffect.uses.scaleWithClassLevel.specificLevels.length > 0) {
                  grantsAbilityEffect.uses.value = [...grantsAbilityEffect.uses.scaleWithClassLevel.specificLevels].sort((a, b) => a.level - b.level)[0].value as number;
              }
          }
      }


      if (effectIsActive) {
        switch (effectToProcess.type) {
          case "skill":
            const skillEffect = effectToProcess as SkillEffectDetail;
            let actualSkillId = skillEffect.skillId;
            if (actualSkillId === null && definition.requiresSpecialization === 'skill' && featInstance.specializationDetail) {
              actualSkillId = featInstance.specializationDetail;
            }
            if (actualSkillId) {
              if (definition.value === 'class-ranger-favored-enemy' && newAggregatedEffects.favoredEnemyBonuses && typeof skillEffect.value === 'number') {
                newAggregatedEffects.favoredEnemyBonuses.skillBonus = Math.max(newAggregatedEffects.favoredEnemyBonuses.skillBonus, skillEffect.value);
              } else if(typeof skillEffect.value === 'number') {
                newAggregatedEffects.skillBonuses[actualSkillId] =
                  (newAggregatedEffects.skillBonuses[actualSkillId] || 0) + skillEffect.value;
              }
            }
            break;
          case "abilityScore":
            newAggregatedEffects.abilityScoreBonuses.push(effectToProcess as AbilityScoreEffect & { sourceFeat?: string });
            break;
          case "savingThrow":
            newAggregatedEffects.savingThrowBonuses.push(effectToProcess as SavingThrowEffect & { sourceFeat?: string });
            break;
          case "attackRoll":
            newAggregatedEffects.attackRollBonuses.push(effectToProcess as AttackRollEffect & { sourceFeat?: string });
            break;
          case "damageRoll":
            const damageEffect = effectToProcess as DamageRollEffect;
            if (definition.value === 'class-ranger-favored-enemy' && newAggregatedEffects.favoredEnemyBonuses && typeof damageEffect.value === 'number') { 
              newAggregatedEffects.favoredEnemyBonuses.damageBonus = Math.max(newAggregatedEffects.favoredEnemyBonuses.damageBonus, damageEffect.value);
            } else {
              newAggregatedEffects.damageRollBonuses.push(damageEffect);
            }
            break;
          case "armorClass":
            newAggregatedEffects.acBonuses.push(effectToProcess as ArmorClassEffect & { sourceFeat?: string });
            break;
          case "hitPoints":
            const hpEffect = effectToProcess as HitPointsEffect;
            if (typeof hpEffect.value === 'number') {
                newAggregatedEffects.hpBonus += hpEffect.value;
                newAggregatedEffects.hpBonusSources.push({
                sourceFeatName: sourceFeatName,
                value: hpEffect.value,
                condition: hpEffect.condition,
                });
            }
            break;
          case "initiative":
            const initEffect = effectToProcess as InitiativeEffect;
            if (typeof initEffect.value === 'number') {
                newAggregatedEffects.initiativeBonus += initEffect.value;
            }
            break;
          case "speed":
            newAggregatedEffects.speedBonuses.push(effectToProcess as SpeedEffect & { sourceFeat?: string });
            break;
          case "resistance":
            newAggregatedEffects.resistanceBonuses.push(effectToProcess as ResistanceEffect & { sourceFeat?: string });
            break;
          case "casterLevelCheck":
            newAggregatedEffects.casterLevelCheckBonuses.push(effectToProcess as CasterLevelCheckEffect & { sourceFeat?: string });
            break;
          case "spellSaveDc":
            newAggregatedEffects.spellSaveDcBonuses.push(effectToProcess as SpellSaveDcEffect & { sourceFeat?: string });
            break;
          case "turnUndead":
            newAggregatedEffects.turnUndeadBonuses.push(effectToProcess as TurnUndeadEffect & { sourceFeat?: string });
            break;
          case "grantsAbility":
            newAggregatedEffects.grantedAbilities.push(effectToProcess as GrantsAbilityEffect & { sourceFeat?: string });
            break;
          case "modifiesMechanic":
            const mechEffect = effectToProcess as ModifiesMechanicEffect;
            if (mechEffect.mechanicKey === "favoredEnemySlots" && typeof mechEffect.value === 'number') {
              newAggregatedEffects.favoredEnemySlots = (newAggregatedEffects.favoredEnemySlots || 0) + mechEffect.value;
            } else {
              newAggregatedEffects.modifiedMechanics.push(mechEffect);
            }
            break;
          case "grantsProficiency":
            newAggregatedEffects.proficienciesGranted.push(effectToProcess as GrantsProficiencyEffect & { sourceFeat?: string });
            break;
          case "bonusFeatSlot":
            newAggregatedEffects.bonusFeatSlots.push(effectToProcess as BonusFeatSlotEffect & { sourceFeat?: string });
            break;
          case "language":
            const langEffect = effectToProcess as LanguageEffect;
            if(langEffect.count && typeof langEffect.count === 'number') newAggregatedEffects.languagesGranted.count += langEffect.count;
            if(langEffect.specific) newAggregatedEffects.languagesGranted.specific.push({languageId: langEffect.specific, note: langEffect.note, sourceFeat: sourceFeatName});
            break;
          case "note":
          case "descriptive":
            newAggregatedEffects.descriptiveNotes.push(effectToProcess as (NoteEffectDetail | DescriptiveEffectDetail) & { sourceFeat?: string });
            break;
        }
      } else if (effectToProcess.type === 'note' || effectToProcess.type === 'descriptive') {
           newAggregatedEffects.descriptiveNotes.push(effectToProcess as (NoteEffectDetail | DescriptiveEffectDetail) & { sourceFeat?: string });
      } else if (effectToProcess.condition) { // If conditional and NOT active, still aggregate if it's a core stat bonus for UI awareness
          switch (effectToProcess.type) {
            case "abilityScore": newAggregatedEffects.abilityScoreBonuses.push(effectToProcess as AbilityScoreEffect & { sourceFeat?: string }); break;
            case "savingThrow": newAggregatedEffects.savingThrowBonuses.push(effectToProcess as SavingThrowEffect & { sourceFeat?: string }); break;
            case "attackRoll": newAggregatedEffects.attackRollBonuses.push(effectToProcess as AttackRollEffect & { sourceFeat?: string }); break;
            case "damageRoll": newAggregatedEffects.damageRollBonuses.push(effectToProcess as DamageRollEffect & { sourceFeat?: string }); break;
            case "armorClass": newAggregatedEffects.acBonuses.push(effectToProcess as ArmorClassEffect & { sourceFeat?: string }); break;
            default: break;
          }
      }
    }
  }
  return newAggregatedEffects;
}

export function calculateSpeedBreakdown(
  speedType: SpeedType,
  character: Pick<Character, 'race' | 'size' | 'classes' | `${SpeedType}Speed` | 'armorSpeedPenalty_base' | 'armorSpeedPenalty_miscModifier' | 'loadSpeedPenalty_base' | 'loadSpeedPenalty_miscModifier' | 'feats'>, // Added feats
  aggregatedFeatEffects: AggregatedFeatEffects | null,
  DND_RACES: readonly DndRaceOption[],
  DND_CLASSES: readonly DndClassOption[],
  SIZES: readonly CharacterSizeObject[],
  UI_STRINGS: Record<string, string>
): SpeedBreakdownDetails {
  const components: { source: string; value: number }[] = [];
  let currentSpeed = 0;

  const charRaceData = DND_RACES.find(r => r.value === character.race);
  const raceLabel = charRaceData?.label || character.race || 'Unknown Race';

  const racialSpeed = charRaceData?.speeds?.[speedType];
  if (racialSpeed !== undefined && racialSpeed > 0) {
    components.push({ source: (UI_STRINGS.infoDialogSpeedBaseRaceLabel || "Base ({raceName})").replace("{raceName}", raceLabel), value: racialSpeed });
    currentSpeed = racialSpeed;
  } else if (speedType === 'land' && racialSpeed === undefined) {
    const defaultLandSpeed = (SIZES.find(s => s.value === character.size)?.label === "Small" || SIZES.find(s => s.value === character.size)?.label === "Gnome") ? 20 : 30;
    components.push({ source: (UI_STRINGS.infoDialogSpeedBaseRaceLabel || "Base ({raceName})").replace("{raceName}", raceLabel), value: defaultLandSpeed });
    currentSpeed = defaultLandSpeed;
  }

  if (aggregatedFeatEffects?.speedBonuses) {
    aggregatedFeatEffects.speedBonuses.forEach(effect => {
      let effectIsActive = true; 
      if (effect.condition && effect.sourceFeat) {
          const featInstance = character.feats.find(fi => fi.definitionId === effect.sourceFeat?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
          effectIsActive = !!featInstance?.conditionalEffectStates?.[effect.condition];
      }
      if (effectIsActive && (effect.speedType === speedType || effect.speedType === 'all')) {
        if (effect.modification === 'bonus' && typeof effect.value === 'number') {
          components.push({ source: effect.sourceFeat || (UI_STRINGS.infoDialogFeatBonusLabel || "Feat Bonus"), value: effect.value });
          currentSpeed += effect.value;
        } else if (effect.modification === 'setAbsolute' && typeof effect.value === 'number') {
          components.push({ source: `${effect.sourceFeat || 'Feat'} (Set to)`, value: effect.value - currentSpeed }); 
          currentSpeed = effect.value;
        }
      }
    });
  }


  const speedFieldKey = `${speedType}Speed` as keyof Pick<Character, 'landSpeed' | 'burrowSpeed' | 'climbSpeed' | 'flySpeed' | 'swimSpeed'>;
  const miscModForThisSpeed = character[speedFieldKey]?.miscModifier || 0;
  if (miscModForThisSpeed !== 0) {
    components.push({ source: UI_STRINGS.infoDialogSpeedMiscModifierLabel || "Misc Modifier", value: miscModForThisSpeed });
    currentSpeed += miscModForThisSpeed;
  }

  if (currentSpeed > 0) { 
    const armorPenaltyVal = (character.armorSpeedPenalty_miscModifier || 0) - (character.armorSpeedPenalty_base || 0);
    if (armorPenaltyVal !== 0) {
      components.push({ source: UI_STRINGS.infoDialogSpeedArmorPenaltyLabel || "Armor Penalty", value: armorPenaltyVal });
      currentSpeed = Math.max(0, currentSpeed + armorPenaltyVal);
    }

    const loadPenaltyVal = (character.loadSpeedPenalty_miscModifier || 0) - (character.loadSpeedPenalty_base || 0);
    if (loadPenaltyVal !== 0) {
       components.push({ source: UI_STRINGS.infoDialogSpeedLoadPenaltyLabel || "Load Penalty", value: loadPenaltyVal });
       currentSpeed = Math.max(0, currentSpeed + loadPenaltyVal);
    }
  }

  const speedTypeLabelKey = `speedLabel${speedType.charAt(0).toUpperCase() + speedType.slice(1)}` as keyof typeof UI_STRINGS;
  const speedName = UI_STRINGS[speedTypeLabelKey] || speedType;

  return {
    name: speedName,
    components,
    total: Math.max(0, currentSpeed), 
  };
}

export function isAlignmentCompatible(
  characterAlignment: CharacterAlignment | '',
  itemAlignment: CharacterAlignment | '' | 'any' | 'any-good' | 'any-evil' | 'any-lawful' | 'any-chaotic' | 'any-neutral'
): boolean {
  if (itemAlignment === 'any' || !itemAlignment) return true;
  if (!characterAlignment) return false;

  const charParts = characterAlignment.split('-');

  if (itemAlignment.startsWith('any-')) {
    const requiredGeneric = itemAlignment.split('-')[1];
    if (requiredGeneric === 'good' && charParts.includes('good')) return true;
    if (requiredGeneric === 'evil' && charParts.includes('evil')) return true;
    if (requiredGeneric === 'lawful' && charParts.includes('lawful')) return true;
    if (requiredGeneric === 'chaotic' && charParts.includes('chaotic')) return true;
    if (requiredGeneric === 'neutral' && (charParts.includes('neutral') || characterAlignment === 'true-neutral')) return true;
    return false;
  }

  if (characterAlignment === itemAlignment) return true;

  const itemAlignLower = (itemAlignment as string).toLowerCase();

  if (itemAlignLower === 'lawful' && charParts[0] === 'lawful') return true;
  if (itemAlignLower === 'chaotic' && charParts[0] === 'chaotic') return true;
  if (itemAlignLower === 'good' && charParts.length > 1 && charParts[1] === 'good') return true;
  if (itemAlignLower === 'evil' && charParts.length > 1 && charParts[1] === 'evil') return true;

  if (itemAlignLower === 'neutral-lc' && (charParts[0] === 'neutral' || characterAlignment === 'true-neutral')) return true;
  if (itemAlignLower === 'neutral-ge' && ((charParts.length > 1 && charParts[1] === 'neutral') || characterAlignment === 'true-neutral')) return true;

  return false;
}


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

export * from './character-core';

