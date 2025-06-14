
import type {
  CharacterAlignment, CharacterSize, AbilityName, DndRaceId, DndClassId, DndDeityId,
  FeatDefinitionJsonData, SkillDefinitionJsonData, ClassSkillsJsonData, ClassSkillPointsBaseJsonData,
  SkillSynergiesJsonData, GenderId, SavingThrowType, DamageReductionTypeValue, DamageReductionRuleValue,
  FeatTypeString, ClassCastingDetails, CharacterSizeObject, CharacterAlignmentObject,
  DndRaceOption, DndClassOption, DndDeityOption, DeityAttribute, AbilityScores, SavingThrows,
  ResistanceValue, SpeedDetails, CharacterClass, LanguageId, LanguageOption, ClassAttribute,
  DomainDefinition, DomainId, MagicSchoolId, MagicSchoolDefinition, SpeedType, LocalizedString,
  ClassSpecificUIBlock, FeatChoiceFilter
} from '@/types/character-core';
import type { LanguageCode } from './config';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './config';

// Define types for the structure of each JSON file's data

export interface AlignmentDataEntry {
  id: CharacterAlignment;
  label: LocalizedString;
  description: LocalizedString;
}
export interface AlignmentsJson {
  ALIGNMENTS_DATA: AlignmentDataEntry[];
}

export interface LanguageDataEntry {
  id: LanguageId;
  label: LocalizedString;
}
export interface LanguagesJson {
  LANGUAGES_DATA: LanguageDataEntry[];
}

export interface XpDataEntry {
  level: number;
  xpRequired: number;
}
export interface XpJson {
  XP_TABLE_DATA: XpDataEntry[];
  EPIC_LEVEL_XP_INCREASE: number;
}

export interface DomainSpellJson {
  level: number;
  spellId: string;
  spellName?: LocalizedString;
}
export interface DomainDefinitionJson {
  id: DomainId;
  label: LocalizedString;
  description: LocalizedString;
  grantedPowerDescription: LocalizedString;
  grantedPowerFeatId?: string;
  domainSpells: DomainSpellJson[];
  deityAlignmentRestrictions?: CharacterAlignment[];
}
export interface DomainJson {
  DND_DOMAINS_DATA: DomainDefinitionJson[];
}


export interface RawMagicSchoolDefinition {
  id: MagicSchoolId;
  label: LocalizedString;
  description?: LocalizedString;
}
export interface MagicSchoolsJson {
  DND_MAGIC_SCHOOLS_DATA: RawMagicSchoolDefinition[];
}


export interface SizeDataEntry {
  id: CharacterSize;
  label: LocalizedString;
  acModifier: number;
  grappleModifier: number; // Added from CharacterSizeObject definition consistency
  skillModifiers?: Record<string, number>;
  grappleDamage?: string;
}
export interface GenderDataEntry {
  id: GenderId; // Ensure GenderId is used for id
  label: LocalizedString;
}
export interface AbilityLabelEntry {
  id: Exclude<AbilityName, 'none'>;
  label: LocalizedString;
  abbr: string;
}
export interface SavingThrowLabelEntry {
  id: SavingThrowType;
  label: LocalizedString;
}
export interface DamageReductionTypeEntry {
  id: DamageReductionTypeValue;
  label: LocalizedString;
}
export interface DamageReductionRuleEntry {
  id: DamageReductionRuleValue;
  label: LocalizedString;
}
export interface AlignmentPrerequisiteGenericLabelEntry {
  id: string;
  label: LocalizedString;
}
export interface BaseJson {
  SIZES_DATA: SizeDataEntry[];
  GENDERS_DATA: GenderDataEntry[];
  DEFAULT_ABILITIES_DATA: AbilityScores;
  DEFAULT_SAVING_THROWS_DATA: SavingThrows;
  DEFAULT_RESISTANCE_VALUE_DATA: ResistanceValue;
  DEFAULT_SPEED_DETAILS_DATA: SpeedDetails;
  DEFAULT_SPEED_PENALTIES_DATA: { armorSpeedPenalty_base: number; armorSpeedPenalty_miscModifier: number; loadSpeedPenalty_base: number; loadSpeedPenalty_miscModifier: number };
  DND_RACE_MIN_ADULT_AGE_DATA: Record<string, number>;
  DND_RACE_BASE_MAX_AGE_DATA: Record<string, number>;
  RACE_TO_AGING_CATEGORY_MAP_DATA: Record<string, string>;
  DND_RACE_AGING_EFFECTS_DATA: Record<string, { categories: Array<{ categoryName: LocalizedString; ageFactor: number; effects: Record<string, number> }> }>;
  DND_RACE_ABILITY_MODIFIERS_DATA: Record<string, Record<string, number>>;
  DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA: Record<string, number>;
  ABILITY_LABELS_DATA: AbilityLabelEntry[];
  SAVING_THROW_LABELS_DATA: SavingThrowLabelEntry[];
  DAMAGE_REDUCTION_TYPES_DATA: DamageReductionTypeEntry[];
  DAMAGE_REDUCTION_RULES_OPTIONS_DATA: DamageReductionRuleEntry[];
  ALIGNMENT_PREREQUISITE_GENERIC_LABELS_DATA: AlignmentPrerequisiteGenericLabelEntry[];
}

export interface RawClassDataEntry {
  id: DndClassId | string;
  label: LocalizedString;
  hitDice: string;
  babProgression: "good" | "average" | "poor";
  generalDescription: LocalizedString;
  loreAttributes?: Array<{key: LocalizedString, value: LocalizedString}>;
  saves: { fortitude: 'good' | 'poor'; reflex: 'good' | 'poor'; will: 'good' | 'poor' };
  spellcasting?: ClassCastingDetails;
  grantedFeats?: Array<{ featId: string; name?: LocalizedString; note?: LocalizedString; levelAcquired?: number }>;
  alignmentRestriction?: string;
  deityAlignmentRestriction?: string;
  abilityScorePriorities?: Array<Exclude<AbilityName, 'none'>>;
  uiSections?: ClassSpecificUIBlock[];
  featChoiceFilters?: FeatChoiceFilter[];
  classSpecificFeats?: FeatDefinitionJsonData[];
}

export interface RawDeityDataEntry {
  id: DndDeityId | string;
  label: LocalizedString;
  alignment: CharacterAlignment | '';
  fullName: LocalizedString;
  attributes: Array<{key: LocalizedString, value: LocalizedString}>;
}
export interface DeitiesJson {
  DND_DEITIES_DATA: RawDeityDataEntry[];
}

export interface RawFeatTypeDataEntry {
  id: FeatTypeString;
  label: LocalizedString;
}
export interface CommonFeatsJson {
  DND_FEATS_DATA: FeatDefinitionJsonData[];
  FEAT_TYPES_DATA: RawFeatTypeDataEntry[];
}

export interface RawRaceDataEntry {
  id: DndRaceId;
  label: LocalizedString;
  description?: LocalizedString; // Fallback
  generalDescription?: LocalizedString; // Preferred
  loreAttributes?: Array<{key: LocalizedString, value: LocalizedString}>;
  bonusFeatSlots?: number;
  racialSkillBonuses?: Record<string, number>;
  grantedFeats?: Array<{ featId: string; name?: LocalizedString; note?: LocalizedString; levelAcquired?: number }>;
  speeds?: Partial<Record<SpeedType, number>>;
  automaticLanguages?: LanguageId[];
  bonusLanguages?: LanguageId[];
  genderOptions?: Array<{ id: GenderId; label: LocalizedString }>;
}
export interface RacesJson {
  DND_RACES_DATA: RawRaceDataEntry[];
}


export interface RawSkillDefinitionDataEntry {
  id: string;
  label: LocalizedString;
  keyAbility: AbilityName | string;
  description?: LocalizedString;
}
export interface SkillsJson {
  SKILL_DEFINITIONS_DATA: RawSkillDefinitionDataEntry[];
  CLASS_SKILLS_DATA: ClassSkillsJsonData;
  CLASS_SKILL_POINTS_BASE_DATA: ClassSkillPointsBaseJsonData;
  SKILL_SYNERGIES_DATA: SkillSynergiesJsonData;
}

export type RawUiStringsData = Record<string, LocalizedString>;


export interface LocaleDataBundle {
  alignments: AlignmentsJson;
  base: BaseJson;
  allClasses: RawClassDataEntry[];
  deities: DeitiesJson;
  commonFeats: CommonFeatsJson;
  races: RacesJson;
  skills: SkillsJson;
  languages: LanguagesJson;
  xpTable: XpJson;
  domains: DomainJson;
  magicSchools: MagicSchoolsJson;
  uiStrings: RawUiStringsData;
}

export interface ProcessedSiteData {
  ALIGNMENTS: readonly CharacterAlignmentObject[];
  LANGUAGES: readonly LanguageOption[];
  XP_TABLE: readonly XpDataEntry[];
  EPIC_LEVEL_XP_INCREASE: number;
  SIZES: readonly CharacterSizeObject[];
  GENDERS: readonly { id: GenderId; label: string }[];
  DND_RACES: readonly DndRaceOption[];
  DND_CLASSES: readonly DndClassOption[];
  DND_DEITIES: readonly DndDeityOption[];
  DND_DOMAINS: readonly DomainDefinition[];
  DND_MAGIC_SCHOOLS: readonly MagicSchoolDefinition[];
  SKILL_DEFINITIONS: readonly SkillDefinitionJsonData[];
  DND_FEATS_DEFINITIONS: readonly FeatDefinitionJsonData[];
  FEAT_TYPES: readonly { id: FeatTypeString; label: string }[];
  ABILITY_LABELS: readonly { id: Exclude<AbilityName, 'none'>; label: string; abbr: string }[];
  SAVING_THROW_LABELS: readonly { id: SavingThrowType; label: string }[];
  DAMAGE_REDUCTION_TYPES: readonly { id: DamageReductionTypeValue; label: string }[];
  DAMAGE_REDUCTION_RULES_OPTIONS: readonly { id: string; label: string }[];
  ALIGNMENT_PREREQUISITE_OPTIONS: readonly { id: string; label: string }[];
  DEFAULT_ABILITIES: AbilityScores;
  DEFAULT_SAVING_THROWS: SavingThrows;
  DEFAULT_RESISTANCE_VALUE: ResistanceValue;
  DEFAULT_SPEED_DETAILS: SpeedDetails;
  DEFAULT_SPEED_PENALTIES: { armorSpeedPenalty_base: number; armorSpeedPenalty_miscModifier: number; loadSpeedPenalty_base: number; loadSpeedPenalty_miscModifier: number };
  DND_RACE_MIN_ADULT_AGE_DATA: BaseJson['DND_RACE_MIN_ADULT_AGE_DATA'];
  DND_RACE_BASE_MAX_AGE_DATA: BaseJson['DND_RACE_BASE_MAX_AGE_DATA'];
  RACE_TO_AGING_CATEGORY_MAP_DATA: BaseJson['RACE_TO_AGING_CATEGORY_MAP_DATA'];
  DND_RACE_AGING_EFFECTS_DATA: Record<string, { categories: Array<{ categoryName: string; ageFactor: number; effects: Record<string, number> }> }>;
  DND_RACE_ABILITY_MODIFIERS_DATA: BaseJson['DND_RACE_ABILITY_MODIFIERS_DATA'];
  DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA: BaseJson['DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA'];
  CLASS_SKILLS: SkillsJson['CLASS_SKILLS_DATA'];
  CLASS_SKILL_POINTS_BASE: SkillsJson['CLASS_SKILL_POINTS_BASE_DATA'];
  SKILL_SYNERGIES: SkillsJson['SKILL_SYNERGIES_DATA'];
  UI_STRINGS: Record<string, string>;
}


export function getLocalizedString(
  entry: LocalizedString | undefined,
  lang: LanguageCode,
  fallbackLang: LanguageCode = DEFAULT_LANGUAGE,
  debugKeyPath?: string // For more informative error messages
): string {
  if (typeof entry === 'string') {
    return entry; // Already localized or a non-localizable string
  }
  const keyForError = debugKeyPath || 'UNKNOWN_KEY_PATH';

  if (!entry || typeof entry !== 'object' || Object.keys(entry).length === 0) {
    return `[MISSING_I18N_OBJ:${keyForError}]`;
  }

  let text: string | undefined;

  // Order of preference:
  // 1. Requested language
  // 2. Fallback language (if different from requested)
  // 3. Default language (if different from requested and fallback)
  // 4. English ('en') (if different from all above)

  const languagesToTry: LanguageCode[] = [];
  languagesToTry.push(lang);
  if (fallbackLang !== lang) {
    languagesToTry.push(fallbackLang);
  }
  if (DEFAULT_LANGUAGE !== lang && DEFAULT_LANGUAGE !== fallbackLang) {
    languagesToTry.push(DEFAULT_LANGUAGE);
  }
  if ('en' !== lang && 'en' !== fallbackLang && 'en' !== DEFAULT_LANGUAGE) {
    languagesToTry.push('en' as LanguageCode);
  }
  // Remove duplicates just in case
  const uniqueLanguagesToTry = [...new Set(languagesToTry)];


  for (const tryLang of uniqueLanguagesToTry) {
    if (entry[tryLang] !== undefined && entry[tryLang] !== null) {
      text = entry[tryLang];
      break; 
    }
  }
  
  if (text === undefined) {
    // If after all attempts, no translation is found, return a clear error message.
    return `[NO_TRSL_DEF:${keyForError}:${uniqueLanguagesToTry.join(',')}]`;
  }

  return text;
}


function processLocalizedArray<T extends { id: string; label: LocalizedString; [key: string]: any }, R extends { id: string; label: string; [key: string]: any }>(
  items: T[] | undefined,
  lang: LanguageCode,
  itemTypeForDebug: string,
  otherFieldsToLocalize?: Array<keyof T>
): R[] {
  if (!items || !Array.isArray(items)) {
    return [];
  }
  return items.map(item_raw => {
    const newItem: any = { ...item_raw };
    newItem.id = item_raw.id;
    newItem.label = getLocalizedString(item_raw.label, lang, DEFAULT_LANGUAGE, `${itemTypeForDebug}.${item_raw.id}.label`);

    if (otherFieldsToLocalize) {
      otherFieldsToLocalize.forEach(fieldKey => {
        const rawFieldValue = item_raw[fieldKey];
        if (typeof rawFieldValue === 'object' && rawFieldValue !== null && !Array.isArray(rawFieldValue)) {
          newItem[fieldKey] = getLocalizedString(rawFieldValue as LocalizedString, lang, DEFAULT_LANGUAGE, `${itemTypeForDebug}.${item_raw.id}.${String(fieldKey)}`) || '';
        } else if (typeof rawFieldValue === 'string') {
           newItem[fieldKey] = rawFieldValue;
        } else if (rawFieldValue === undefined && (fieldKey === 'generalDescription' || fieldKey === 'description')) {
            newItem[fieldKey] = ''; // Keep empty for descriptions
        }
      });
    }
    return newItem as R;
  }).sort((a, b) => (a.label).localeCompare(b.label));
}

const HARDCODED_DEFAULT_ABILITIES: AbilityScores = {
  strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10,
};

export function processRawDataBundle(bundle: LocaleDataBundle, lang: LanguageCode): ProcessedSiteData {
  const ALIGNMENTS = processLocalizedArray<AlignmentDataEntry, CharacterAlignmentObject>(bundle.alignments?.ALIGNMENTS_DATA, lang, 'alignments', ['description']);
  const LANGUAGES = processLocalizedArray<LanguageDataEntry, LanguageOption>(bundle.languages?.LANGUAGES_DATA, lang, 'languages');
  const XP_TABLE = bundle.xpTable?.XP_TABLE_DATA?.sort((a, b) => a.level - b.level) || [];
  const EPIC_LEVEL_XP_INCREASE = bundle.xpTable?.EPIC_LEVEL_XP_INCREASE || 0;

  const SIZES = processLocalizedArray<SizeDataEntry, CharacterSizeObject>(bundle.base?.SIZES_DATA, lang, 'sizes');
  const GENDERS_RAW = bundle.base?.GENDERS_DATA || [];
  const GENDERS = GENDERS_RAW.map(g_raw => ({
      id: g_raw.id as GenderId,
      label: getLocalizedString(g_raw.label, lang, DEFAULT_LANGUAGE, `genders.${g_raw.id}.label`)
  })).sort((a, b) => {
      const order = ['unspecified', 'male', 'female', 'other'];
      const indexA = order.indexOf(a.id);
      const indexB = order.indexOf(b.id);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.label.localeCompare(b.label);
  });


  const commonFeats = bundle.commonFeats?.DND_FEATS_DATA || [];
  const classSpecificFeatsFromBundleRaw = (bundle.allClasses || []).reduce((acc, cls_raw) => {
    if (cls_raw.classSpecificFeats) {
      acc.push(...cls_raw.classSpecificFeats);
    }
    return acc;
  }, [] as FeatDefinitionJsonData[]);

  const ALL_FEATS_RAW = [...commonFeats, ...classSpecificFeatsFromBundleRaw];
  const featMap = new Map<string, FeatDefinitionJsonData>();
  ALL_FEATS_RAW.forEach(f_raw => {
    if (f_raw && typeof f_raw.id === 'string') {
      featMap.set(f_raw.id, f_raw);
    }
  });

  const DND_FEATS_DEFINITIONS = Array.from(featMap.values()).map(feat_raw => ({
    ...feat_raw,
    id: feat_raw.id,
    label: getLocalizedString(feat_raw.label, lang, DEFAULT_LANGUAGE, `feats.${feat_raw.id}.label`),
    description: getLocalizedString(feat_raw.description, lang, DEFAULT_LANGUAGE, `feats.${feat_raw.id}.description`) || '',
    effectsText: getLocalizedString(feat_raw.effectsText, lang, DEFAULT_LANGUAGE, `feats.${feat_raw.id}.effectsText`) || '',
    prerequisites: feat_raw.prerequisites ? {
      ...feat_raw.prerequisites,
      special: getLocalizedString(feat_raw.prerequisites.special, lang, DEFAULT_LANGUAGE, `feats.${feat_raw.id}.prereq.special`) || undefined
    } : undefined,
    effects: feat_raw.effects?.map((effect, index) => {
      const localizedEffect = {...effect};
      const effectDebugKeyBase = `feats.${feat_raw.id}.effects[${index}]`;
      if ('text' in localizedEffect && typeof localizedEffect.text === 'object' && localizedEffect.text !== null) {
        (localizedEffect as any).text = getLocalizedString(localizedEffect.text as LocalizedString, lang, DEFAULT_LANGUAGE, `${effectDebugKeyBase}.text`);
      }
      if ('sourceFeat' in localizedEffect && typeof localizedEffect.sourceFeat === 'object' && localizedEffect.sourceFeat !== null) {
        (localizedEffect as any).sourceFeat = getLocalizedString(localizedEffect.sourceFeat as LocalizedString, lang, DEFAULT_LANGUAGE, `${effectDebugKeyBase}.sourceFeat`);
      }
      if ('name' in localizedEffect && typeof localizedEffect.name === 'object' && localizedEffect.name !== null) {
        (localizedEffect as any).name = getLocalizedString(localizedEffect.name as LocalizedString, lang, DEFAULT_LANGUAGE, `${effectDebugKeyBase}.name`);
      }
       if ('details' in localizedEffect && typeof localizedEffect.details === 'object' && localizedEffect.details !== null) {
        (localizedEffect as any).details = getLocalizedString(localizedEffect.details as LocalizedString, lang, DEFAULT_LANGUAGE, `${effectDebugKeyBase}.details`);
      }
      if ('note' in localizedEffect && typeof localizedEffect.note === 'object' && localizedEffect.note !== null) {
        (localizedEffect as any).note = getLocalizedString(localizedEffect.note as LocalizedString, lang, DEFAULT_LANGUAGE, `${effectDebugKeyBase}.note`);
      }
      return localizedEffect;
    })
  })).sort((a,b) => a.label.localeCompare(b.label));

  const DND_RACES_RAW = bundle.races?.DND_RACES_DATA || [];
  const DND_RACES = DND_RACES_RAW.map(r_raw => {
    const {
      id, label, generalDescription, description, loreAttributes,
      bonusFeatSlots, racialSkillBonuses, grantedFeats: rawGrantedFeats, speeds, automaticLanguages, bonusLanguages, genderOptions: rawGenderOptions
    } = r_raw;

    const localizedGrantedFeats = (rawGrantedFeats || []).map(gf_raw => ({
        featId: gf_raw.featId,
        name: getLocalizedString(gf_raw.name, lang, DEFAULT_LANGUAGE, `races.${id}.grantedFeats.${gf_raw.featId}.name`) || DND_FEATS_DEFINITIONS.find(f => f.id === gf_raw.featId)?.label || gf_raw.featId,
        note: getLocalizedString(gf_raw.note, lang, DEFAULT_LANGUAGE, `races.${id}.grantedFeats.${gf_raw.featId}.note`) || undefined,
        levelAcquired: gf_raw.levelAcquired
    }));

    const localizedGenderOptions = (rawGenderOptions || []).map(go_raw => ({
      id: go_raw.id as GenderId,
      label: getLocalizedString(go_raw.label, lang, DEFAULT_LANGUAGE, `races.${id}.genderOptions.${go_raw.id}.label`)
    }));

    const localizedRace: DndRaceOption = {
      id: id,
      label: getLocalizedString(label, lang, DEFAULT_LANGUAGE, `races.${id}.label`),
      generalDescription: getLocalizedString(generalDescription || description, lang, DEFAULT_LANGUAGE, `races.${id}.generalDescription`) || '',
      loreAttributes: (loreAttributes || []).map((la, idx) => ({
        key: getLocalizedString(la.key, lang, DEFAULT_LANGUAGE, `races.${id}.loreAttributes[${idx}].key`),
        value: getLocalizedString(la.value, lang, DEFAULT_LANGUAGE, `races.${id}.loreAttributes[${idx}].value`)
      })),
      bonusFeatSlots: bonusFeatSlots,
      racialSkillBonuses: racialSkillBonuses,
      grantedFeats: localizedGrantedFeats,
      speeds: speeds,
      automaticLanguages: automaticLanguages,
      genderOptions: localizedGenderOptions.length > 0 ? localizedGenderOptions : undefined,
    };
    return localizedRace;
  }).sort((a, b) => a.label.localeCompare(b.label));


  const DND_CLASSES_RAW = bundle.allClasses || [];
  const DND_CLASSES = DND_CLASSES_RAW.map(c_raw => {
    const {
      id, label, hitDice, babProgression, generalDescription, loreAttributes,
      saves, spellcasting, grantedFeats: rawGrantedFeats, uiSections, featChoiceFilters,
      classSpecificFeats, alignmentRestriction, deityAlignmentRestriction, abilityScorePriorities
    } = c_raw;

    const localizedGrantedFeats = (rawGrantedFeats || []).map(gf_raw => ({
        featId: gf_raw.featId,
        name: getLocalizedString(gf_raw.name, lang, DEFAULT_LANGUAGE, `classes.${id}.grantedFeats.${gf_raw.featId}.name`) || DND_FEATS_DEFINITIONS.find(f => f.id === gf_raw.featId)?.label || gf_raw.featId,
        note: getLocalizedString(gf_raw.note, lang, DEFAULT_LANGUAGE, `classes.${id}.grantedFeats.${gf_raw.featId}.note`) || undefined,
        levelAcquired: gf_raw.levelAcquired
    }));
    
    const localizedClassSpecificFeats = (classSpecificFeats || []).map(csf_raw => ({
      ...csf_raw,
      id: csf_raw.id,
      label: getLocalizedString(csf_raw.label, lang, DEFAULT_LANGUAGE, `classes.${id}.classSpecificFeats.${csf_raw.id}.label`),
      description: getLocalizedString(csf_raw.description, lang, DEFAULT_LANGUAGE, `classes.${id}.classSpecificFeats.${csf_raw.id}.description`) || '',
      effectsText: getLocalizedString(csf_raw.effectsText, lang, DEFAULT_LANGUAGE, `classes.${id}.classSpecificFeats.${csf_raw.id}.effectsText`) || '',
      effects: csf_raw.effects?.map((effect, index) => {
          const localizedEffect = {...effect};
          const effectDebugKeyBase = `classes.${id}.classSpecificFeats.${csf_raw.id}.effects[${index}]`;
          if ('text' in localizedEffect && typeof localizedEffect.text === 'object' && localizedEffect.text !== null) {
            (localizedEffect as any).text = getLocalizedString(localizedEffect.text as LocalizedString, lang, DEFAULT_LANGUAGE, `${effectDebugKeyBase}.text`);
          }
          if ('sourceFeat' in localizedEffect && typeof localizedEffect.sourceFeat === 'object' && localizedEffect.sourceFeat !== null) {
            (localizedEffect as any).sourceFeat = getLocalizedString(localizedEffect.sourceFeat as LocalizedString, lang, DEFAULT_LANGUAGE, `${effectDebugKeyBase}.sourceFeat`);
          }
          if ('name' in localizedEffect && typeof localizedEffect.name === 'object' && localizedEffect.name !== null) {
            (localizedEffect as any).name = getLocalizedString(localizedEffect.name as LocalizedString, lang, DEFAULT_LANGUAGE, `${effectDebugKeyBase}.name`);
          }
           if ('details' in localizedEffect && typeof localizedEffect.details === 'object' && localizedEffect.details !== null) {
            (localizedEffect as any).details = getLocalizedString(localizedEffect.details as LocalizedString, lang, DEFAULT_LANGUAGE, `${effectDebugKeyBase}.details`);
          }
          if ('note' in localizedEffect && typeof localizedEffect.note === 'object' && localizedEffect.note !== null) {
            (localizedEffect as any).note = getLocalizedString(localizedEffect.note as LocalizedString, lang, DEFAULT_LANGUAGE, `${effectDebugKeyBase}.note`);
          }
          return localizedEffect;
        })
    }));

    const localizedClass: DndClassOption = {
      id: id,
      label: getLocalizedString(label, lang, DEFAULT_LANGUAGE, `classes.${id}.label`),
      hitDice: hitDice,
      babProgression: babProgression,
      generalDescription: getLocalizedString(generalDescription, lang, DEFAULT_LANGUAGE, `classes.${id}.generalDescription`) || '',
      loreAttributes: (loreAttributes || []).map((la, idx) => ({
        key: getLocalizedString(la.key, lang, DEFAULT_LANGUAGE, `classes.${id}.loreAttributes[${idx}].key`),
        value: getLocalizedString(la.value, lang, DEFAULT_LANGUAGE, `classes.${id}.loreAttributes[${idx}].value`)
      })),
      saves: saves,
      spellcasting: spellcasting,
      grantedFeats: localizedGrantedFeats,
      alignmentRestriction: alignmentRestriction,
      deityAlignmentRestriction: deityAlignmentRestriction,
      abilityScorePriorities: abilityScorePriorities,
      uiSections: uiSections,
      featChoiceFilters: featChoiceFilters ? featChoiceFilters.map(fcf => ({
        ...fcf,
        filterCases: fcf.filterCases.map(fc => ({
          ...fc,
          noteMustContain: getLocalizedString(fc.noteMustContain, lang, DEFAULT_LANGUAGE, `classes.${id}.featChoiceFilters.${fcf.characterField}.${fc.choiceValue}.note`)
        }))
      })) : undefined,
      classSpecificFeats: localizedClassSpecificFeats,
    };
    return localizedClass;
  }).sort((a,b) => a.label.localeCompare(b.label));


  const DND_DEITIES_RAW = bundle.deities?.DND_DEITIES_DATA || [];
  const DND_DEITIES = DND_DEITIES_RAW.map(d_raw => ({
    id: d_raw.id,
    label: getLocalizedString(d_raw.label, lang, DEFAULT_LANGUAGE, `deities.${d_raw.id}.label`),
    alignment: d_raw.alignment,
    fullName: getLocalizedString(d_raw.fullName, lang, DEFAULT_LANGUAGE, `deities.${d_raw.id}.fullName`),
    attributes: (d_raw.attributes || []).map((attr, idx) => ({
        key: getLocalizedString(attr.key, lang, DEFAULT_LANGUAGE, `deities.${d_raw.id}.attributes[${idx}].key`),
        value: getLocalizedString(attr.value, lang, DEFAULT_LANGUAGE, `deities.${d_raw.id}.attributes[${idx}].value`)
    }))
  })).sort((a,b) => a.label.localeCompare(b.label));


  const DND_DOMAINS_RAW = bundle.domains?.DND_DOMAINS_DATA || [];
  const DND_DOMAINS = DND_DOMAINS_RAW.map(d_raw => ({
      id: d_raw.id,
      label: getLocalizedString(d_raw.label, lang, DEFAULT_LANGUAGE, `domains.${d_raw.id}.label`),
      description: getLocalizedString(d_raw.description, lang, DEFAULT_LANGUAGE, `domains.${d_raw.id}.description`),
      grantedPowerDescription: getLocalizedString(d_raw.grantedPowerDescription, lang, DEFAULT_LANGUAGE, `domains.${d_raw.id}.grantedPowerDescription`),
      grantedPowerFeatId: d_raw.grantedPowerFeatId,
      domainSpells: (d_raw.domainSpells || []).map((ds, idx) => ({
          ...ds,
          spellName: getLocalizedString(ds.spellName, lang, DEFAULT_LANGUAGE, `domains.${d_raw.id}.domainSpells[${idx}].spellName`) || ds.spellId
      })),
      deityAlignmentRestrictions: d_raw.deityAlignmentRestrictions
  })).sort((a,b) => a.label.localeCompare(b.label));


  const DND_MAGIC_SCHOOLS_RAW = bundle.magicSchools?.DND_MAGIC_SCHOOLS_DATA || [];
  const DND_MAGIC_SCHOOLS = DND_MAGIC_SCHOOLS_RAW.map(ms_raw => ({
    id: ms_raw.id,
    label: getLocalizedString(ms_raw.label, lang, DEFAULT_LANGUAGE, `magicSchools.${ms_raw.id}.label`),
    description: getLocalizedString(ms_raw.description, lang, DEFAULT_LANGUAGE, `magicSchools.${ms_raw.id}.description`) || ''
  })).sort((a,b) => a.label.localeCompare(b.label));

  const SKILL_DEFINITIONS_RAW = bundle.skills?.SKILL_DEFINITIONS_DATA || [];
  const SKILL_DEFINITIONS = SKILL_DEFINITIONS_RAW.map(sd_raw => ({
    id: sd_raw.id,
    label: getLocalizedString(sd_raw.label, lang, DEFAULT_LANGUAGE, `skills.${sd_raw.id}.label`),
    keyAbility: sd_raw.keyAbility as AbilityName,
    description: getLocalizedString(sd_raw.description, lang, DEFAULT_LANGUAGE, `skills.${sd_raw.id}.description`) || ''
  })).sort((a,b) => a.label.localeCompare(b.label));


  const FEAT_TYPES_RAW = bundle.commonFeats?.FEAT_TYPES_DATA || [];
  const FEAT_TYPES = FEAT_TYPES_RAW.map(ft_raw => ({
     id: ft_raw.id, label: getLocalizedString(ft_raw.label, lang, DEFAULT_LANGUAGE, `featTypes.${ft_raw.id}.label`)
  })).sort((a,b) => a.label.localeCompare(b.label));

  const ABILITY_LABELS_RAW = bundle.base?.ABILITY_LABELS_DATA || [];
  const ABILITY_LABELS = ABILITY_LABELS_RAW.map(al_raw => ({
    id: al_raw.id, label: getLocalizedString(al_raw.label, lang, DEFAULT_LANGUAGE, `abilityLabels.${al_raw.id}.label`), abbr: al_raw.abbr
  })); // Keep original order

  const SAVING_THROW_LABELS_RAW = bundle.base?.SAVING_THROW_LABELS_DATA || [];
  const SAVING_THROW_LABELS = SAVING_THROW_LABELS_RAW.map(stl_raw => ({
    id: stl_raw.id, label: getLocalizedString(stl_raw.label, lang, DEFAULT_LANGUAGE, `savingThrowLabels.${stl_raw.id}.label`)
  })); // Keep original order

  const DAMAGE_REDUCTION_TYPES_RAW = bundle.base?.DAMAGE_REDUCTION_TYPES_DATA || [];
  const DAMAGE_REDUCTION_TYPES = DAMAGE_REDUCTION_TYPES_RAW.map(drt_raw => ({
    id: drt_raw.id, label: getLocalizedString(drt_raw.label, lang, DEFAULT_LANGUAGE, `damageReductionTypes.${drt_raw.id}.label`)
  })).sort((a,b) => a.label.localeCompare(b.label));

  const DAMAGE_REDUCTION_RULES_OPTIONS_RAW = bundle.base?.DAMAGE_REDUCTION_RULES_OPTIONS_DATA || [];
  const DAMAGE_REDUCTION_RULES_OPTIONS = DAMAGE_REDUCTION_RULES_OPTIONS_RAW.map(drr_raw => ({
    id: drr_raw.id, label: getLocalizedString(drr_raw.label, lang, DEFAULT_LANGUAGE, `damageReductionRules.${drr_raw.id}.label`)
  })).sort((a,b) => a.label.localeCompare(b.label));

  const specificAlignmentOptions = ALIGNMENTS.map(a => ({ id: a.id, label: a.label }));
  const genericAlignmentOptions_RAW = bundle.base?.ALIGNMENT_PREREQUISITE_GENERIC_LABELS_DATA || [];
  const genericAlignmentOptions = genericAlignmentOptions_RAW.map(ago_raw => ({
    id: ago_raw.id, label: getLocalizedString(ago_raw.label, lang, DEFAULT_LANGUAGE, `alignmentPrereqGenericLabels.${ago_raw.id}.label`)
  })).sort((a,b) => a.label.localeCompare(b.label));
  const ALIGNMENT_PREREQUISITE_OPTIONS = [...specificAlignmentOptions, ...genericAlignmentOptions].sort((a,b) => a.label.localeCompare(b.label));

  const UI_STRINGS: Record<string, string> = {};
  const uiStringsBundle = bundle.uiStrings || {};
  for (const key in uiStringsBundle) {
    UI_STRINGS[key] = getLocalizedString(uiStringsBundle[key], lang, DEFAULT_LANGUAGE, `uiStrings.${key}`);
  }
  UI_STRINGS.currentLangCodeForNotesFallback = lang;


  const DND_RACE_AGING_EFFECTS_DATA_PROCESSED: ProcessedSiteData['DND_RACE_AGING_EFFECTS_DATA'] = {};
  const rawAgingEffects = bundle.base?.DND_RACE_AGING_EFFECTS_DATA || {};
  for(const key in rawAgingEffects) {
    DND_RACE_AGING_EFFECTS_DATA_PROCESSED[key] = {
      categories: rawAgingEffects[key].categories.map((cat, idx) => ({
        ...cat,
        categoryName: getLocalizedString(cat.categoryName, lang, DEFAULT_LANGUAGE, `agingEffects.${key}.categories[${idx}].categoryName`)
      }))
    };
  }

  const processedDefaultAbilities = (bundle.base?.DEFAULT_ABILITIES_DATA && Object.keys(bundle.base.DEFAULT_ABILITIES_DATA).length === 6)
    ? { ...bundle.base.DEFAULT_ABILITIES_DATA }
    : { ...HARDCODED_DEFAULT_ABILITIES };


  return {
    ALIGNMENTS,
    LANGUAGES,
    XP_TABLE,
    EPIC_LEVEL_XP_INCREASE,
    SIZES,
    GENDERS,
    DND_RACES,
    DND_CLASSES,
    DND_DEITIES,
    DND_DOMAINS,
    DND_MAGIC_SCHOOLS,
    SKILL_DEFINITIONS,
    DND_FEATS_DEFINITIONS,
    FEAT_TYPES,
    ABILITY_LABELS,
    SAVING_THROW_LABELS,
    DAMAGE_REDUCTION_TYPES,
    DAMAGE_REDUCTION_RULES_OPTIONS,
    ALIGNMENT_PREREQUISITE_OPTIONS,
    DEFAULT_ABILITIES: processedDefaultAbilities,
    DEFAULT_SAVING_THROWS: bundle.base?.DEFAULT_SAVING_THROWS_DATA || { fortitude: {base:0,magicMod:0,miscMod:0}, reflex:{base:0,magicMod:0,miscMod:0}, will:{base:0,magicMod:0,miscMod:0}},
    DEFAULT_RESISTANCE_VALUE: bundle.base?.DEFAULT_RESISTANCE_VALUE_DATA || {base:0, customMod:0},
    DEFAULT_SPEED_DETAILS: bundle.base?.DEFAULT_SPEED_DETAILS_DATA || {base:0, miscModifier:0},
    DEFAULT_SPEED_PENALTIES: bundle.base?.DEFAULT_SPEED_PENALTIES_DATA || {armorSpeedPenalty_base:0, armorSpeedPenalty_miscModifier:0, loadSpeedPenalty_base:0, loadSpeedPenalty_miscModifier:0},
    DND_RACE_MIN_ADULT_AGE_DATA: bundle.base?.DND_RACE_MIN_ADULT_AGE_DATA || {},
    DND_RACE_BASE_MAX_AGE_DATA: bundle.base?.DND_RACE_BASE_MAX_AGE_DATA || {},
    RACE_TO_AGING_CATEGORY_MAP_DATA: bundle.base?.RACE_TO_AGING_CATEGORY_MAP_DATA || {},
    DND_RACE_AGING_EFFECTS_DATA: DND_RACE_AGING_EFFECTS_DATA_PROCESSED,
    DND_RACE_ABILITY_MODIFIERS_DATA: bundle.base?.DND_RACE_ABILITY_MODIFIERS_DATA || {},
    DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA: bundle.base?.DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA || {},
    CLASS_SKILLS: bundle.skills?.CLASS_SKILLS_DATA || {},
    CLASS_SKILL_POINTS_BASE: bundle.skills?.CLASS_SKILL_POINTS_BASE_DATA || {},
    SKILL_SYNERGIES: bundle.skills?.SKILL_SYNERGIES_DATA || {},
    UI_STRINGS,
  };
}

    
