

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
  DomainDefinition,
  Character, // Import full Character type
  AggregatedFeatEffectBase,
  GrantsAbilityEffectUses,
  MagicSchoolId,
  DamageReductionFeatEffect,
  CharacterFavoredEnemy,
  FeatChoiceFilter, // Added for data-driven feat choices
  LocalizedString,
  DndDeityOption,
  ItemDefinition, // Added
  ItemInstance, // Added
  GearSlotId // Added
} from './character-core';
import type { CustomSkillDefinition } from '@/lib/definitions-store';
// Import calculateLevelFromXp and other used utilities directly
import { getBab, calculateSumOfClassLevels, calculateAbilityModifier, getXpRequiredForLevel, calculateLevelFromXp, SAVING_THROW_ABILITIES, getAbilityModifierByName as getAbilityModifierByNameUtil } from '@/lib/dnd-utils';
import { getLocalizedString, type ProcessedSiteData } from '@/i18n/i18n-data';


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
    id: def.id,
    ranks: 0,
    miscModifier: 0,
    isClassSkill: classSkillsForCurrentClass.includes(def.id),
  })).sort((a, b) => {
    const nameA = SKILL_DEFINITIONS.find(d => d.id === a.id)?.label || '';
    const nameB = SKILL_DEFINITIONS.find(d => d.id === b.id)?.label || '';
    return String(nameA).localeCompare(String(nameB));
  });
}


export function getNetAgingEffects(
  raceId: DndRaceId | '',
  age: number,
  DND_RACE_BASE_MAX_AGE_DATA: Record<string, number>,
  RACE_TO_AGING_CATEGORY_MAP_DATA: Record<string, string>, // string is RaceAgingCategoryKey
  DND_RACE_AGING_EFFECTS_DATA: Record<string, { categories: Array<{ categoryName: string; ageFactor: number; effects: Record<string, number> }> }>, // string is RaceAgingCategoryKey, categoryName is now string
  ABILITY_LABELS: readonly { id: Exclude<AbilityName, 'none'>; label: string; abbr: string }[]
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
      currentCategoryLabel = category.categoryName; // categoryName is already localized string
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
  SKILL_DEFINITIONS: readonly {id: string; label: string; keyAbility: AbilityName | string; description?: string}[],
  DND_FEATS_DEFINITIONS: readonly FeatDefinitionJsonData[],
  ABILITY_LABELS: readonly { id: Exclude<AbilityName, 'none'>; label: string; abbr: string }[]
): RaceSpecialQualities {
  if (!Array.isArray(DND_RACES)) {
    console.warn("getRaceSpecialQualities called with invalid DND_RACES. Data might not be fully loaded.");
    return { abilityEffects: [], skillBonuses: [], grantedFeats: [], bonusFeatSlots: 0, speeds: {} };
  }
  if (!raceId) return { abilityEffects: [], skillBonuses: [], grantedFeats: [], bonusFeatSlots: 0, speeds: {} };
  const raceData = DND_RACES.find(r => r.id === raceId);
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
      const skillDef = SKILL_DEFINITIONS.find(sd => sd.id === skillId_kebab);
      if (skillDef && bonus !== 0) {
        appliedSkillBonuses.push({ skillId: skillDef.id, skillName: skillDef.label, bonus });
      }
    }
    appliedSkillBonuses.sort((a, b) => a.skillName.localeCompare(b.skillName));
  }

  const formattedGrantedFeats = raceData?.grantedFeats?.map(gf => {
    const featDef = DND_FEATS_DEFINITIONS.find(f => f.id === gf.featId);
    return { ...gf, name: featDef?.label || gf.featId, note: gf.note };
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
  ALL_SKILL_DEFINITIONS: readonly SkillDefinitionJsonData[],
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
  DND_RACES: readonly DndRaceOption[],
  SKILL_DEFINITIONS_UNUSED?: readonly {id: string; label: string; keyAbility: AbilityName | string; description?: string}[],
): number {
  if (!raceId) return 0;
  const raceData = DND_RACES.find(r => r.id === raceId);
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
  const sizeData = SIZES.find(s => s.id === sizeId);
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

  if (!Array.isArray(DND_RACES) || !Array.isArray(allFeatDefinitions)) {
    console.warn("calculateAvailableFeats called with invalid DND_RACES or allFeatDefinitions. Data might not be fully loaded.");
    return { total: 0, base: 0, racial: 0, classBonus: 0, classBonusDetails: [] };
  }

  const characterLevel = calculateLevelFromXp(character.experiencePoints || 0, XP_TABLE, EPIC_LEVEL_XP_INCREASE);

  let baseFeatSlots = 0;
  if (characterLevel >= 1) baseFeatSlots = 1;
  baseFeatSlots += Math.floor(characterLevel / 3);

  let racialBonusSlots = 0;
  const raceData = DND_RACES.find(r => r.id === character.race);
  if (raceData?.bonusFeatSlots) {
    racialBonusSlots = raceData.bonusFeatSlots;
  }

  let classBonusFeatSlotsTotal = 0;
  const classBonusDetailsMap = new Map<string, { category: string; count: number; sourceFeatLabel?: string }>();

  if (character.feats) {
    for (const featInstance of character.feats) {
      if (featInstance.isGranted) {
        const featDef = allFeatDefinitions.find(def => def.id === featInstance.definitionId);
        if (featDef?.effects) {
          for (const effect of featDef.effects) {
            if (effect.type === 'bonusFeatSlot') {
              const slotEffect = effect as BonusFeatSlotEffect;
              let isActive = true;
              if (slotEffect.condition && featInstance.conditionalEffectStates) {
                isActive = !!featInstance.conditionalEffectStates[slotEffect.condition];
              }
              if (isActive) {
                classBonusFeatSlotsTotal += slotEffect.count;
                const featLabelString = featDef.label as string; // Assume label is always string post-processing
                const key = `${slotEffect.category}-${featLabelString}`;
                const existingDetail = classBonusDetailsMap.get(key);
                if (existingDetail) {
                  existingDetail.count += slotEffect.count;
                } else {
                  classBonusDetailsMap.set(key, { category: slotEffect.category, count: slotEffect.count, sourceFeatLabel: featLabelString });
                }
              }
            }
          }
        }
      }
    }
  }

  const classBonusDetails = Array.from(classBonusDetailsMap.values());
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
  character: Pick<Character, 'race' | 'classes' | 'experiencePoints' | 'chosenCombatStyle' | 'chosenDomains' | 'deity'>,
  allFeatDefinitions: readonly (FeatDefinitionJsonData & { isCustom?: boolean })[],
  DND_RACES: readonly DndRaceOption[],
  DND_CLASSES: readonly DndClassOption[],
  DND_DOMAINS: readonly DomainDefinition[],
  DND_DEITIES: readonly DndDeityOption[],
  XP_TABLE: readonly { level: number; xpRequired: number }[],
  EPIC_LEVEL_XP_INCREASE: number,
  UI_STRINGS: Record<string, string>
): CharacterFeatInstance[] {
  if (!Array.isArray(DND_RACES) || !Array.isArray(DND_CLASSES) || !Array.isArray(allFeatDefinitions) || !Array.isArray(DND_DOMAINS) || !Array.isArray(DND_DEITIES) || !UI_STRINGS) {
    console.warn("getGrantedFeatsForCharacter called with invalid data. Data might not be fully loaded.");
    return [];
  }

  let grantedInstances: CharacterFeatInstance[] = [];
  const characterLevel = calculateLevelFromXp(character.experiencePoints || 0, XP_TABLE, EPIC_LEVEL_XP_INCREASE);
  const currentLang = UI_STRINGS.currentLangCodeForNotesFallback as 'en' | 'fr' || 'en';


  const addGrantedInstance = (
    featDefId: string,
    rawNote: LocalizedString | undefined,
    sourceContext: string,
    levelAcquired?: number,
    specializationDetail?: string,
    chosenSpecializationCategory?: string
  ) => {
    if (!featDefId || (levelAcquired !== undefined && levelAcquired > characterLevel)) {
      return;
    }
    const featDef = allFeatDefinitions.find(f => f.id === featDefId);
    if (!featDef) {
      return;
    }

    const baseInstanceId = featDef.id;
    const finalInstanceId = (featDef.canTakeMultipleTimes || specializationDetail)
      ? `${baseInstanceId}-GRANTED-${specializationDetail ? specializationDetail.toLowerCase().replace(/\s+/g, '-') + '-' : ''}${crypto.randomUUID().substring(0, 4)}`
      : baseInstanceId;

    if (!featDef.canTakeMultipleTimes && !specializationDetail && grantedInstances.some(inst => inst.definitionId === featDef.id)) {
      return;
    }
    
    const localizedNote = rawNote ? getLocalizedString(rawNote, currentLang, undefined, `grantedFeats.${featDefId}.note`) : undefined;
    const fullGrantedNote = localizedNote ? `${localizedNote} ${sourceContext}` : sourceContext;


    const newInstance: CharacterFeatInstance = {
      definitionId: featDef.id,
      instanceId: finalInstanceId,
      isGranted: true,
      grantedNote: fullGrantedNote,
      specializationDetail: specializationDetail,
      chosenSpecializationCategory: chosenSpecializationCategory,
      conditionalEffectStates: {},
    };

    if (featDef.permanentEffect && featDef.effects) {
      newInstance.conditionalEffectStates = newInstance.conditionalEffectStates || {};
      featDef.effects.forEach(eff => {
        if (eff.condition) {
          newInstance.conditionalEffectStates![eff.condition] = true;
        }
      });
    }
    grantedInstances.push(newInstance);
  };

  const raceData = DND_RACES.find(r => r.id === character.race);
  if (raceData?.grantedFeats) {
    raceData.grantedFeats.forEach(gf => {
      addGrantedInstance(gf.featId, gf.note as LocalizedString | undefined, `(${raceData.label})`, gf.levelAcquired);
    });
  }

  character.classes.forEach(charClass => {
    if (!charClass.className) return;
    const classData = DND_CLASSES.find(c => c.id === charClass.className);
    if (!classData) return;

    const classContext = `(${classData.label})`;

    if (classData.grantedFeats) {
      classData.grantedFeats.forEach(gf => {
        if (gf.levelAcquired === undefined || gf.levelAcquired <= charClass.level) {
          addGrantedInstance(gf.featId, gf.note as LocalizedString | undefined, classContext, gf.levelAcquired);
        }
      });
    }

    if (classData.id === 'ranger' && character.chosenCombatStyle) {
      const rangerLevel = charClass.level;
      const styleName = character.chosenCombatStyle === 'archery'
        ? (UI_STRINGS.rangerCombatStyleArchery || "Archery")
        : (UI_STRINGS.rangerCombatStyleTwoWeapon || "Two-Weapon Fighting");
      const noteFormat = UI_STRINGS.rangerCombatStyleFeatNoteFormat || "{styleName} (L{level})";

      if (rangerLevel >= 2) {
        const featIdL2 = character.chosenCombatStyle === 'archery' ? 'rapid-shot' : 'two-weapon-fighting';
        const noteL2 = noteFormat.replace("{styleName}", styleName).replace("{level}", "2");
        addGrantedInstance(featIdL2, { en: noteL2, fr: noteL2 }, classContext, 2);
      }
      if (rangerLevel >= 6) {
        const featIdL6 = character.chosenCombatStyle === 'archery' ? 'manyshot' : 'improved-two-weapon-fighting';
        const noteL6 = noteFormat.replace("{styleName}", styleName).replace("{level}", "6");
        addGrantedInstance(featIdL6, { en: noteL6, fr: noteL6 }, classContext, 6);
      }
      if (rangerLevel >= 11) {
        const featIdL11 = character.chosenCombatStyle === 'archery' ? 'improved-precise-shot' : 'greater-two-weapon-fighting';
        const noteL11 = noteFormat.replace("{styleName}", styleName).replace("{level}", "11");
        addGrantedInstance(featIdL11, { en: noteL11, fr: noteL11 }, classContext, 11);
      }
    }

    if (classData.id === 'cleric' && character.chosenDomains) {
      const domainNoteFormat = UI_STRINGS.clericDomainPowerFeatNoteFormat || "Granted by {domainName} Domain";
      character.chosenDomains.forEach(domainId => {
        if (domainId) {
          const domainDef = DND_DOMAINS.find(d => d.id === domainId);
          if (domainDef?.grantedPowerFeatId) {
            const domainName = domainDef.label;
            const note = domainNoteFormat.replace("{domainName}", domainName);
            let specializationDetail: string | undefined = undefined;
            let specializationCategory: string | undefined = undefined;

            if (domainDef.grantedPowerFeatId === "weapon-focus" && character.deity) {
              const deityDef = DND_DEITIES.find(deity => deity.id === character.deity);
              const favoredWeaponAttrKey = UI_STRINGS.favoredWeaponLabel || "Favored Weapon";
              const favoredWeaponAttr = deityDef?.attributes.find(attr => attr.key === favoredWeaponAttrKey);
              if (favoredWeaponAttr?.value) {
                specializationDetail = favoredWeaponAttr.value;
                specializationCategory = "weaponFocusFeats";
              }
            }
            addGrantedInstance(domainDef.grantedPowerFeatId, { en: note, fr: note }, classContext, 1, specializationDetail, specializationCategory);
          }
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
  character: Pick<Character, 'abilityScores' | 'skills' | 'feats' | 'classes' | 'race' | 'age' | 'alignment' | 'experiencePoints'>,
  allFeatDefinitions: readonly (FeatDefinitionJsonData & { isCustom?: boolean })[],
  ALL_SKILL_DEFINITIONS: readonly {id: string; label: string; keyAbility: AbilityName | string; description?: string}[],
  allCustomSkillDefinitions: readonly CustomSkillDefinition[],
  DND_CLASSES: readonly DndClassOption[],
  DND_RACES: readonly DndRaceOption[],
  ABILITY_LABELS: readonly { id: Exclude<AbilityName, 'none'>; label: string; abbr: string }[],
  ALIGNMENT_PREREQUISITE_OPTIONS: readonly { id: string; label: string }[],
  uiStrings: Record<string, string>
): PrerequisiteMessage[] {
  const { prerequisites } = featDefinitionToCheck;
  const messages: PrerequisiteMessage[] = [];

  if (!prerequisites || Object.keys(prerequisites).length === 0) {
    return [];
  }

  const getCombinedSkillDefsForPrereq = () => {
    const combined: Array<{id: string; label: string}> = ALL_SKILL_DEFINITIONS.map(sd => ({id: sd.id, label: sd.label}));
    allCustomSkillDefinitions.forEach(csd => {
      if (!combined.find(s => s.id === csd.id)) {
        combined.push({id: csd.id, label: csd.name});
      }
    });
    return combined;
  };
  const combinedSkillDefsForPrereq = getCombinedSkillDefsForPrereq();

  const characterLevel = calculateLevelFromXp(character.experiencePoints || 0, [], 0); // XP table not needed if we only need current level

  if (prerequisites.raceId !== undefined && prerequisites.raceId !== "") {
    const raceDef = DND_RACES.find(r => r.id === prerequisites!.raceId);
    const raceName = raceDef?.label || prerequisites.raceId;
    const isMet = character.race === prerequisites.raceId;
    messages.push({ text: `${uiStrings.raceLabel || 'Race'}: ${raceName}`, isMet, orderKey: 'race', originalText: raceName });
  }

  if (prerequisites.classLevel && prerequisites.classLevel.classId && prerequisites.classLevel.classId !== "") {
    const { classId, level: requiredClassLevel } = prerequisites.classLevel;
    const charClass = character.classes.find(c => c.className === classId);
    const classDef = DND_CLASSES.find(cd => cd.id === classId);
    const className = classDef?.label || classId;
    const isMet = charClass ? charClass.level >= requiredClassLevel : false;
    messages.push({ text: `${className} ${uiStrings.levelLabel || 'Level'} ${requiredClassLevel}`, isMet, orderKey: `classLevel_${classId}`, originalText: className });
  }

  if (prerequisites.alignment && prerequisites.alignment !== "") {
    const reqAlign = prerequisites.alignment;
    const charAlign = character.alignment;
    let isMet = isAlignmentValidForRequirement(charAlign, reqAlign);

    const requiredAlignmentLabel = ALIGNMENT_PREREQUISITE_OPTIONS.find(opt => opt.id === reqAlign)?.label || reqAlign;

    messages.push({ text: `${uiStrings.alignmentLabel || 'Alignment'}: ${requiredAlignmentLabel}`, isMet, orderKey: 'alignment', originalText: requiredAlignmentLabel });
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
      const classDef = DND_CLASSES.find(c => c.id === charClass.className);
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
      const abilityLabelFull = ABILITY_LABELS.find(al => al.id === ability)?.label || ability.charAt(0).toUpperCase() + ability.slice(1);
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
      const featDef = allFeatDefinitions.find(f => f.id === requiredFeatDefId);
      const featName = featDef?.label ? getLocalizedString(featDef.label, uiStrings.currentLangCodeForNotesFallback || 'en') : requiredFeatDefId;
      const isMet = characterTakenFeatDefinitionIds.includes(requiredFeatDefId);
      messages.push({ text: featName, isMet, orderKey: `feat_${requiredFeatDefId}`, originalText: featName });
    }
  }

  // The 'special' prerequisite text is handled in the rendering component (FeatsFormSection)
  // after these structured messages are generated and sorted.

  messages.sort((a, b) => {
    const orderA = PREREQ_ORDER_MAP[a.orderKey.split('_')[0]] || 99;
    const orderB = PREREQ_ORDER_MAP[b.orderKey.split('_')[0]] || 99;
    if (orderA !== orderB) return orderA - orderB;

    const originalTextA = String(a.originalText);
    const originalTextB = String(b.originalText);

    return originalTextA.localeCompare(originalTextB);
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
  ABILITY_LABELS: readonly { id: Exclude<AbilityName, 'none'>; label: string; abbr: string }[]
): DetailedAbilityScores {
  const result: Partial<DetailedAbilityScores> = {};
  const currentLang = 'en'; // Assuming English for internal sourceDetail processing if UI_STRINGS not available here
  const racialQualities = getRaceSpecialQualities(character.race, DND_RACES, DND_RACE_ABILITY_MODIFIERS_DATA, [], [], ABILITY_LABELS);
  const agingDetails = getNetAgingEffects(character.race, character.age, DND_RACE_BASE_MAX_AGE_DATA, RACE_TO_AGING_CATEGORY_MAP_DATA, DND_RACE_AGING_EFFECTS_DATA, ABILITY_LABELS);
  const tempCustomModifiers = character.abilityScoreTempCustomModifiers ||
    ABILITY_ORDER_INTERNAL.reduce((acc, key) => { acc[key] = 0; return acc; }, {} as AbilityScores);

  for (const ability of ABILITY_ORDER_INTERNAL) {
    const baseScore = character.abilityScores[ability] || 0;
    const components: AbilityScoreComponentValue[] = [];
    let currentScore = baseScore;

    const racialModObj = racialQualities.abilityEffects.find(eff => eff.ability === ability);
    if (racialModObj && racialModObj.change !== 0) {
      const raceLabel = DND_RACES.find(r => r.id === character.race)?.label || character.race || 'Unknown Race';
      components.push({ sourceLabel: "Race", sourceDetail: raceLabel, value: racialModObj.change, isActive: true });
      currentScore += racialModObj.change;
    }

    const agingModObj = agingDetails.effects.find(eff => eff.ability === ability);
    if (agingModObj && agingModObj.change !== 0) {
      components.push({ sourceLabel: "Aging", sourceDetail: agingDetails.categoryName, value: agingModObj.change, isActive: true });
      currentScore += agingModObj.change;
    }

    if (aggregatedFeatEffects.abilityScoreBonuses) {
      for (const featEffect of aggregatedFeatEffects.abilityScoreBonuses) {
        if (featEffect.ability === ability && typeof featEffect.value === 'number') {
          const sourceFeatName = featEffect.sourceFeat ? getLocalizedString(featEffect.sourceFeat, currentLang) : "Unknown Feat";
          components.push({
            sourceLabel: "Feat",
            sourceDetail: sourceFeatName,
            value: featEffect.value,
            condition: featEffect.condition,
            isActive: featEffect.isActive,
          });
          if(featEffect.isActive) {
            currentScore += featEffect.value;
          }
        }
      }
    }

    const tempCustomModValue = tempCustomModifiers[ability];
    if (tempCustomModValue !== 0 && tempCustomModValue !== undefined) {
      components.push({ sourceLabel: "Temporary Modifier", value: tempCustomModValue, isActive: true });
      currentScore += tempCustomModValue;
    }

    result[ability] = {
      ability, base: baseScore, components, finalScore: currentScore,
    };
  }
  return result as DetailedAbilityScores;
}

export function calculateFeatEffects(
  character: Character,
  allFeatDefinitions: readonly (FeatDefinitionJsonData & { isCustom?: boolean })[],
  processedSiteData: ProcessedSiteData
): AggregatedFeatEffects {

  if (!processedSiteData || !processedSiteData.UI_STRINGS || typeof processedSiteData.UI_STRINGS.currentLangCodeForNotesFallback === 'undefined') {
    console.error("calculateFeatEffects called with incomplete processedSiteData or missing UI_STRINGS.currentLangCodeForNotesFallback.", { 
      characterId: character.id, 
      processedSiteDataExists: !!processedSiteData,
      uiStringsExists: !!processedSiteData?.UI_STRINGS,
      currentLangCodeExists: !!processedSiteData?.UI_STRINGS?.currentLangCodeForNotesFallback
    });
    // Return a default/empty AggregatedFeatEffects to prevent further errors
    return {
      skillBonuses: {}, allSkillEffectDetails: [], favoredEnemyBonuses: { skillBonus: 0, damageBonus: 0 }, favoredEnemySlots: 0,
      abilityScoreBonuses: [], savingThrowBonuses: [], attackRollBonuses: [], damageRollBonuses: [], acBonuses: [],
      hpBonus: 0, hpBonusSources: [], initiativeBonus: 0, speedBonuses: [], resistanceBonuses: [], damageReductions: [], casterLevelCheckBonuses: [], spellSaveDcBonuses: [],
      turnUndeadBonuses: [], grantedAbilities: [], modifiedMechanics: {}, proficienciesGranted: [], bonusFeatSlots: [], languagesGranted: { count: 0, specific: [] }, descriptiveNotes: [],
      classLevels: character.classes.reduce((acc, cur) => { if (cur.className) acc[cur.className] = cur.level; return acc; }, {} as Record<DndClassId, number>)
    };
  }

  const { DND_CLASSES, ABILITY_LABELS, UI_STRINGS, DND_RACES, DND_RACE_ABILITY_MODIFIERS_DATA, DND_RACE_BASE_MAX_AGE_DATA, RACE_TO_AGING_CATEGORY_MAP_DATA, DND_RACE_AGING_EFFECTS_DATA } = processedSiteData;
  const allItemDefinitions = [
    ...(processedSiteData.ITEM_DEFINITIONS_WEAPONS || []),
    ...(processedSiteData.ITEM_DEFINITIONS_ARMOR || []),
    ...(processedSiteData.ITEM_DEFINITIONS_SHIELDS || []),
    ...(processedSiteData.ITEM_DEFINITIONS_MAGIC_ITEMS || []),
  ];

  const currentLang = UI_STRINGS.currentLangCodeForNotesFallback as 'en' | 'fr' || 'en';

  // Initial empty state for aggregated effects
  const newAggregatedEffects: AggregatedFeatEffects = {
    skillBonuses: {}, allSkillEffectDetails: [], favoredEnemyBonuses: { skillBonus: 0, damageBonus: 0 }, favoredEnemySlots: 0,
    abilityScoreBonuses: [], savingThrowBonuses: [], attackRollBonuses: [], damageRollBonuses: [], acBonuses: [],
    hpBonus: 0, hpBonusSources: [], initiativeBonus: 0, speedBonuses: [], resistanceBonuses: [], damageReductions: [], casterLevelCheckBonuses: [], spellSaveDcBonuses: [],
    turnUndeadBonuses: [], grantedAbilities: [], modifiedMechanics: {}, proficienciesGranted: [], bonusFeatSlots: [], languagesGranted: { count: 0, specific: [] }, descriptiveNotes: [],
    classLevels: character.classes.reduce((acc, cur) => { if (cur.className) acc[cur.className] = cur.level; return acc; }, {} as Record<DndClassId, number>)
  };

  // --- First pass to get detailed ability scores based *only* on inherent bonuses (race, age, initial temp mods) for accurate mod calculations for other effects ---
  const initialAbilityAggEffects: AggregatedFeatEffects = { ...newAggregatedEffects, abilityScoreBonuses: [] };

  const sourcesForAbilityAggregation: Array<{ definition: FeatDefinitionJsonData | ItemDefinition, instance?: CharacterFeatInstance | ItemInstance, sourceName: LocalizedString, conditionalEffectStates?: Record<string, boolean> }> = [];

  character.feats.forEach(featInstance => {
    const definition = allFeatDefinitions.find(def => def.id === featInstance.definitionId);
    if (definition) {
      sourcesForAbilityAggregation.push({ definition, instance: featInstance, sourceName: definition.label, conditionalEffectStates: featInstance.conditionalEffectStates });
    }
  });

  if (character.equippedGear) {
    for (const slotId in character.equippedGear) {
      const instanceId = character.equippedGear[slotId as GearSlotId];
      if (instanceId) {
        const itemInstance = character.inventory.find(invItem => invItem.instanceId === instanceId);
        if (itemInstance) {
          const itemDef = allItemDefinitions.find(def => def.definitionId === itemInstance.definitionId);
          if (itemDef) {
            sourcesForAbilityAggregation.push({ definition: itemDef, instance: itemInstance, sourceName: itemDef.label });
          }
        }
      }
    }
  }

  sourcesForAbilityAggregation.forEach(source => {
    if (source.definition.effects) {
      source.definition.effects.forEach(effect => {
        if (effect.type === 'abilityScore') {
          let isActive = true;
          // Assuming FeatDefinitionJsonData has permanentEffect, ItemDefinition does not
          const permanentEffect = (source.definition as FeatDefinitionJsonData).permanentEffect;

          if (permanentEffect) { 
            isActive = true;
          } else if (effect.condition && source.instance && 'conditionalEffectStates' in source.instance && source.instance.conditionalEffectStates) {
            isActive = !!source.instance.conditionalEffectStates[effect.condition];
          } else if (effect.condition && !source.instance) { 
             isActive = false; 
          }
          if (isActive) {
            initialAbilityAggEffects.abilityScoreBonuses.push({
              ...effect,
              sourceFeat: source.sourceName, 
              isActive: true,
            } as AbilityScoreEffect & AggregatedFeatEffectBase);
          }
        }
      });
    }
  });

  const detailedAbilityScores = calculateDetailedAbilityScores(
    character, initialAbilityAggEffects, DND_RACES, DND_RACE_ABILITY_MODIFIERS_DATA, DND_RACE_BASE_MAX_AGE_DATA,
    RACE_TO_AGING_CATEGORY_MAP_DATA, DND_RACE_AGING_EFFECTS_DATA, ABILITY_LABELS
  );
  // --- End of first pass for detailedAbilityScores ---


  // Now, process all effects from feats and items
  const allSources: Array<{ definition: FeatDefinitionJsonData | ItemDefinition, instance?: CharacterFeatInstance | ItemInstance, sourceName: LocalizedString, conditionalEffectStates?: Record<string, boolean>, isItemSource?: boolean }> = [];
  character.feats.forEach(featInstance => {
    const definition = allFeatDefinitions.find(def => def.id === featInstance.definitionId);
    if (definition) {
      allSources.push({ definition, instance: featInstance, sourceName: definition.label, conditionalEffectStates: featInstance.conditionalEffectStates, isItemSource: false });
    }
  });

  if (character.equippedGear) {
    for (const slotId in character.equippedGear) {
      const instanceId = character.equippedGear[slotId as GearSlotId];
      if (instanceId) {
        const itemInstance = character.inventory.find(invItem => invItem.instanceId === instanceId);
        if (itemInstance) {
          const itemDef = allItemDefinitions.find(def => def.definitionId === itemInstance.definitionId);
          if (itemDef) {
            allSources.push({ definition: itemDef, instance: itemInstance, sourceName: itemDef.label, isItemSource: true });
          }
        }
      }
    }
  }


  // Process Power Attack / Combat Expertise as global effects before individual item/feat effects
  if (character.powerAttackValue && character.powerAttackValue > 0 && character.feats.some(f => f.definitionId === 'power-attack')) {
    const powerAttackActive = true;
    newAggregatedEffects.attackRollBonuses.push({
      type: "attackRoll", value: -character.powerAttackValue, appliesTo: "melee", sourceFeat: {en: "Power Attack Effect", fr: "Effet Attaque en Puissance"}, isActive: powerAttackActive
    });
    newAggregatedEffects.damageRollBonuses.push({
      type: "damageRoll", value: character.powerAttackValue, appliesTo: "melee", sourceFeat: {en: "Power Attack Effect", fr: "Effet Attaque en Puissance"}, isActive: powerAttackActive
    });
  }
  if (character.combatExpertiseValue && character.combatExpertiseValue > 0 && character.feats.some(f => f.definitionId === 'combat-expertise')) {
    const combatExpertiseActive = true;
    newAggregatedEffects.attackRollBonuses.push({
      type: "attackRoll", value: -character.combatExpertiseValue, appliesTo: "melee", sourceFeat: {en: "Combat Expertise Effect", fr: "Effet Expertise du Combat"}, isActive: combatExpertiseActive
    });
    newAggregatedEffects.acBonuses.push({
      type: "armorClass", value: character.combatExpertiseValue, acType: "dodge", bonusType: "dodge", sourceFeat: {en: "Combat Expertise Effect", fr: "Effet Expertise du Combat"}, isActive: combatExpertiseActive
    });
  }


  for (const source of allSources) {
    const { definition, instance, sourceName, conditionalEffectStates, isItemSource } = source;

    if (!definition.effects || !Array.isArray(definition.effects)) {
      continue;
    }

    for (const originalEffect of definition.effects) {
      let effectToPush: FeatEffectDetail & AggregatedFeatEffectBase = JSON.parse(JSON.stringify(originalEffect));
      effectToPush.sourceFeat = sourceName; // sourceName is already localized

      let effectIsActive = true;
      const permanentEffect = (definition as FeatDefinitionJsonData).permanentEffect; // Feat specific
      if (permanentEffect) { 
        effectIsActive = true;
        if (effectToPush.condition && conditionalEffectStates) {
           conditionalEffectStates[effectToPush.condition] = true;
        }
      } else if (effectToPush.condition && effectToPush.condition.trim() !== "") {
        if (isItemSource) {
          effectIsActive = true; 
        } else if (conditionalEffectStates) {
           effectIsActive = !!conditionalEffectStates[effectToPush.condition];
        } else {
           effectIsActive = false; 
        }
      }
      effectToPush.isActive = effectIsActive;


      let resolvedValue: any = (effectToPush as any).value;

      if (effectToPush.scaleWithClassLevel && effectToPush.scaleWithClassLevel.specificLevels) {
        const classLevel = newAggregatedEffects.classLevels[effectToPush.scaleWithClassLevel.classId] || 0;
        let foundLevelValue: any = undefined;
        const sortedSpecificLevels = [...effectToPush.scaleWithClassLevel.specificLevels].sort((a, b) => b.level - a.level);
        for (const levelEntry of sortedSpecificLevels) {
          if (classLevel >= levelEntry.level) {
            foundLevelValue = levelEntry.value;
            break;
          }
        }
        if (foundLevelValue !== undefined) {
          resolvedValue = foundLevelValue;
        } else if ((effectToPush as any).value === undefined && effectToPush.scaleWithClassLevel.specificLevels.length > 0) {
           resolvedValue = [...effectToPush.scaleWithClassLevel.specificLevels].sort((a,b) => a.level - b.level)[0].value;
        }
      }

      if (typeof resolvedValue === 'string') {
        const abilityKey = resolvedValue.toUpperCase() as Exclude<AbilityName, 'none'>;
        if (ABILITY_ORDER_INTERNAL.includes(abilityKey.toLowerCase() as Exclude<AbilityName, 'none'>)) {
            resolvedValue = getAbilityModifierByNameUtil(detailedAbilityScores, abilityKey.toLowerCase() as Exclude<AbilityName, 'none'>);
        } else if (resolvedValue.startsWith("classLevel:")) {
            const classIdForLevel = resolvedValue.split(":")[1];
            resolvedValue = newAggregatedEffects.classLevels[classIdForLevel] || 0;
        }
      }


      if (resolvedValue !== undefined && effectToPush.hasOwnProperty('value')) {
        (effectToPush as any).value = resolvedValue;
      }

      if (effectToPush.type === 'grantsAbility') {
          const grantsAbilityEffect = effectToPush as GrantsAbilityEffect & AggregatedFeatEffectBase;
          if (grantsAbilityEffect.uses) {
            grantsAbilityEffect.uses.isActive = effectIsActive;
            if (grantsAbilityEffect.uses.value === "scaled" && grantsAbilityEffect.uses.scaleWithClassLevel?.specificLevels) {
                const classIdForScaling = grantsAbilityEffect.uses.scaleWithClassLevel.classId;
                const classLevel = newAggregatedEffects.classLevels[classIdForScaling] || 0;
                let foundUsesValue: number | undefined;
                const sortedUsesLevels = [...grantsAbilityEffect.uses.scaleWithClassLevel.specificLevels].sort((a,b) => b.level - a.level);

                for (const lvlEntry of sortedUsesLevels) {
                    if (classLevel >= lvlEntry.level) {
                        foundUsesValue = lvlEntry.value as number;
                        break;
                    }
                }

                if (foundUsesValue !== undefined) {
                    grantsAbilityEffect.uses.value = foundUsesValue;
                } else if (grantsAbilityEffect.uses.scaleWithClassLevel.specificLevels.length > 0) {
                    grantsAbilityEffect.uses.value = [...grantsAbilityEffect.uses.scaleWithClassLevel.specificLevels].sort((a, b) => a.level - b.level)[0].value as number;
                } else {
                    grantsAbilityEffect.uses.value = 0;
                }
            }
          }
      }

      if ((effectToPush.type === "attackRoll" || effectToPush.type === "damageRoll") &&
          (effectToPush as AttackRollEffect | DamageRollEffect).appliesTo === "SPEC" &&
          (instance as CharacterFeatInstance)?.specializationDetail && (definition as FeatDefinitionJsonData).requiresSpecialization === "weapon") {
        (effectToPush as AttackRollEffect | DamageRollEffect).appliesTo = `weaponName:${(instance as CharacterFeatInstance).specializationDetail}`;
      } else if (effectToPush.type === "skill" && (effectToPush as SkillEffectDetail).skillId === "SPEC" &&
                 (instance as CharacterFeatInstance)?.specializationDetail && (definition as FeatDefinitionJsonData).requiresSpecialization === "skill") {
        (effectToPush as SkillEffectDetail).skillId = (instance as CharacterFeatInstance).specializationDetail!;
      }


      switch (effectToPush.type) {
        case "note":
          newAggregatedEffects.descriptiveNotes.push(effectToPush as NoteEffectDetail & AggregatedFeatEffectBase);
          break;
        case "skill":
          const skillEffect = effectToPush as SkillEffectDetail & AggregatedFeatEffectBase;
          newAggregatedEffects.allSkillEffectDetails.push(skillEffect);
          if (skillEffect.isActive && typeof skillEffect.value === 'number' && skillEffect.skillId && skillEffect.skillId !== "SPEC") {
            if (skillEffect.condition === "vs_favored_enemy") {
                if (skillEffect.value > (newAggregatedEffects.favoredEnemyBonuses?.skillBonus || 0)) {
                    newAggregatedEffects.favoredEnemyBonuses!.skillBonus = skillEffect.value;
                }
            } else {
                newAggregatedEffects.skillBonuses[skillEffect.skillId] = (newAggregatedEffects.skillBonuses[skillEffect.skillId] || 0) + skillEffect.value;
            }
          }
          break;
        case "abilityScore":
          if (!isItemSource) { // Ability score bonuses from items already handled in detailedAbilityScores first pass
            newAggregatedEffects.abilityScoreBonuses.push(effectToPush as AbilityScoreEffect & AggregatedFeatEffectBase);
          }
          break;
        case "savingThrow":
          newAggregatedEffects.savingThrowBonuses.push(effectToPush as SavingThrowEffect & AggregatedFeatEffectBase);
          break;
        case "attackRoll":
          newAggregatedEffects.attackRollBonuses.push(effectToPush as AttackRollEffect & AggregatedFeatEffectBase);
          break;
        case "damageRoll":
          const damageEffect = effectToPush as DamageRollEffect & AggregatedFeatEffectBase;
           if (damageEffect.isActive && typeof damageEffect.value === 'number') {
             if (damageEffect.condition === "vs_favored_enemy") {
                if (newAggregatedEffects.favoredEnemyBonuses && typeof damageEffect.value === 'number') {
                    newAggregatedEffects.favoredEnemyBonuses.damageBonus = (newAggregatedEffects.favoredEnemyBonuses.damageBonus || 0) + damageEffect.value;
                }
             } else {
                newAggregatedEffects.damageRollBonuses.push(damageEffect);
             }
           } else if (damageEffect.isActive && typeof damageEffect.value === 'string') {
             newAggregatedEffects.damageRollBonuses.push(damageEffect);
           }
          break;
        case "armorClass":
          newAggregatedEffects.acBonuses.push(effectToPush as ArmorClassEffect & AggregatedFeatEffectBase);
          break;
        case "hitPoints":
          const hpEffect = effectToPush as HitPointsEffect & AggregatedFeatEffectBase;
          if (hpEffect.isActive && typeof hpEffect.value === 'number') {
              newAggregatedEffects.hpBonus += hpEffect.value;
          }
          newAggregatedEffects.hpBonusSources.push({
              sourceFeatName: sourceName,
              value: typeof hpEffect.value === 'number' ? hpEffect.value : 0,
              condition: hpEffect.condition,
              isActive: effectIsActive,
          });
          break;
        case "initiative":
          const initEffect = effectToPush as InitiativeEffect & AggregatedFeatEffectBase;
          if (effectIsActive && typeof initEffect.value === 'number') {
              newAggregatedEffects.initiativeBonus += initEffect.value;
          }
          break;
        case "speed":
          newAggregatedEffects.speedBonuses.push(effectToPush as SpeedEffect & AggregatedFeatEffectBase);
          break;
        case "resistance":
          newAggregatedEffects.resistanceBonuses.push(effectToPush as ResistanceEffect & AggregatedFeatEffectBase);
          break;
        case "damageReduction":
          newAggregatedEffects.damageReductions.push(effectToPush as DamageReductionFeatEffect & AggregatedFeatEffectBase);
          break;
        case "casterLevelCheck":
          newAggregatedEffects.casterLevelCheckBonuses.push(effectToPush as CasterLevelCheckEffect & AggregatedFeatEffectBase);
          break;
        case "spellSaveDc":
          newAggregatedEffects.spellSaveDcBonuses.push(effectToPush as SpellSaveDcEffect & AggregatedFeatEffectBase);
          break;
        case "turnUndead":
          newAggregatedEffects.turnUndeadBonuses.push(effectToPush as TurnUndeadEffect & AggregatedFeatEffectBase);
          break;
        case "grantsAbility":
          newAggregatedEffects.grantedAbilities.push(effectToPush as GrantsAbilityEffect & AggregatedFeatEffectBase & { uses?: GrantsAbilityEffectUses });
          break;
        case "modifiesMechanic":
           const mechEffect = effectToPush as ModifiesMechanicEffect & AggregatedFeatEffectBase;
           if (mechEffect.isActive && mechEffect.mechanicKey) {
             const existingMechanic = newAggregatedEffects.modifiedMechanics[mechEffect.mechanicKey];
             if (mechEffect.mechanicKey === "favoredEnemySlots" && typeof mechEffect.value === "number") {
                newAggregatedEffects.favoredEnemySlots = (newAggregatedEffects.favoredEnemySlots || 0) + mechEffect.value;
             } else if (existingMechanic && typeof existingMechanic.value === 'number' && typeof mechEffect.value === 'number' && mechEffect.change === 'adds') {
                newAggregatedEffects.modifiedMechanics[mechEffect.mechanicKey] = {
                    ...mechEffect,
                    value: existingMechanic.value + mechEffect.value,
                };
             } else {
                newAggregatedEffects.modifiedMechanics[mechEffect.mechanicKey] = {
                    ...mechEffect,
                    value: (mechEffect as any).value,
                };
             }
           }
          break;
        case "grantsProficiency":
          newAggregatedEffects.proficienciesGranted.push(effectToPush as GrantsProficiencyEffect & AggregatedFeatEffectBase);
          break;
        case "bonusFeatSlot":
          newAggregatedEffects.bonusFeatSlots.push(effectToPush as BonusFeatSlotEffect & AggregatedFeatEffectBase);
          break;
        case "language":
          const langEffect = effectToPush as LanguageEffect & AggregatedFeatEffectBase;
          if(effectIsActive && langEffect.count && typeof langEffect.count === 'number') newAggregatedEffects.languagesGranted.count += langEffect.count;
          if(langEffect.specific) newAggregatedEffects.languagesGranted.specific.push({languageId: langEffect.specific, note: langEffect.note as string | undefined, sourceFeat: sourceName, condition: langEffect.condition, isActive: langEffect.isActive});
          break;
      }
    }
  }
  return newAggregatedEffects;
}

export function isAlignmentValidForRequirement(
  characterAlignment: CharacterAlignment | '',
  requiredAlignment: string // Can be specific like "lawful-good" or generic like "any-good", "lawful"
): boolean {
  if (!characterAlignment || !requiredAlignment || requiredAlignment === 'any') return true;

  const charLcPart = characterAlignment.startsWith('true-') ? 'neutral' : characterAlignment.split('-')[0];
  const charGePart = characterAlignment.endsWith('-neutral') && !characterAlignment.startsWith('true-') ? 'neutral' :
                     characterAlignment.startsWith('true-') ? 'neutral' :
                     characterAlignment.split('-')[1];

  if (requiredAlignment === characterAlignment) return true;

  if (requiredAlignment.startsWith('any-')) {
    const genericType = requiredAlignment.substring(4); // "good", "evil", "lawful", "chaotic", "neutral"
    if (genericType === 'good' && charGePart === 'good') return true;
    if (genericType === 'evil' && charGePart === 'evil') return true;
    if (genericType === 'lawful' && charLcPart === 'lawful') return true;
    if (genericType === 'chaotic' && charLcPart === 'chaotic') return true;
    if (genericType === 'neutral' && (charLcPart === 'neutral' || charGePart === 'neutral')) return true;
    if (genericType === 'nonlawful' && charLcPart !== 'lawful') return true;
    if (genericType === 'nongood' && charGePart !== 'good') return true;
    if (genericType === 'nonchaotic' && charLcPart !== 'chaotic') return true;
    if (genericType === 'nonevil' && charGePart !== 'evil') return true;
    return false;
  }

  // Single word requirements like "lawful", "good", "neutral"
  if (requiredAlignment === 'lawful' && charLcPart === 'lawful') return true;
  if (requiredAlignment === 'chaotic' && charLcPart === 'chaotic') return true;
  if (requiredAlignment === 'good' && charGePart === 'good') return true;
  if (requiredAlignment === 'evil' && charGePart === 'evil') return true;
  if (requiredAlignment === 'neutral' && (charLcPart === 'neutral' || charGePart === 'neutral')) return true;

  return false;
}


export function isAlignmentCompatibleWithDeity(
  characterAlignment: CharacterAlignment | '',
  deityAlignment: CharacterAlignment | ''
): boolean {
  if (!deityAlignment) return true; // No deity selected or deity has no alignment restriction (should not happen for SRD deities)
  if (!characterAlignment) return false; // Character must have an alignment

  if (characterAlignment === 'true-neutral') {
    return deityAlignment === 'true-neutral';
  }

  const lcMap: Record<string, number> = { lawful: 0, neutral: 1, chaotic: 2 };
  const geMap: Record<string, number> = { good: 0, neutral: 1, evil: 2 };

  const getLc = (align: CharacterAlignment) => align === 'true-neutral' ? 'neutral' : align.split('-')[0];
  const getGe = (align: CharacterAlignment) => align === 'true-neutral' ? 'neutral' : align.split('-')[1];

  const charLcVal = lcMap[getLc(characterAlignment)];
  const charGeVal = geMap[getGe(characterAlignment)];
  const deityLcVal = lcMap[getLc(deityAlignment)];
  const deityGeVal = geMap[getGe(deityAlignment)];

  if (charLcVal === undefined || charGeVal === undefined || deityLcVal === undefined || deityGeVal === undefined) {
    return false;
  }

  const lcDiff = Math.abs(charLcVal - deityLcVal);
  const geDiff = Math.abs(charGeVal - deityGeVal);

  return (lcDiff <= 1 && geDiff <= 1 && (lcDiff + geDiff) <= 1);
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
