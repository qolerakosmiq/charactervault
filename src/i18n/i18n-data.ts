
import type {
  CharacterAlignment, CharacterSize, AbilityName, DndRaceId, DndClassId, DndDeityId,
  FeatDefinitionJsonData, SkillDefinitionJsonData, ClassSkillsJsonData, ClassSkillPointsBaseJsonData,
  SkillSynergiesJsonData, GenderId, SavingThrowType, DamageReductionTypeValue, DamageReductionRuleValue,
  FeatTypeString, ClassCastingDetails, CharacterSizeObject, CharacterAlignmentObject,
  DndRaceOption, DndClassOption, DndDeityOption, DeityAttribute, AbilityScores, SavingThrows,
  ResistanceValue, SpeedDetails, CharacterClass, LanguageId, LanguageOption, ClassAttribute,
  DomainDefinition, DomainId, MagicSchoolId, MagicSchoolDefinition, SpeedType, LocalizedString
} from '@/types/character-core';
import type { LanguageCode } from './config';
import { DEFAULT_LANGUAGE } from './config';

// Define types for the structure of each JSON file's data

export interface AlignmentDataEntry {
  value: CharacterAlignment;
  label: LocalizedString;
  description: LocalizedString;
}
export interface AlignmentsJson {
  ALIGNMENTS_DATA: AlignmentDataEntry[];
}

export interface LanguageDataEntry {
  value: LanguageId;
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
  spellName?: LocalizedString; // Optional, name will be looked up if not provided
}
export interface DomainDefinitionJson {
  value: DomainId;
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


export interface MagicSchoolsJson {
  DND_MAGIC_SCHOOLS_DATA: Array<{
    value: MagicSchoolId;
    label: LocalizedString;
    description?: LocalizedString;
  }>;
}


export interface SizeDataEntry {
  value: CharacterSize;
  label: LocalizedString;
  acModifier: number;
  skillModifiers?: Record<string, number>;
  grappleDamage?: string;
}
export interface GenderDataEntry {
  value: string;
  label: LocalizedString;
}
export interface AbilityLabelEntry {
  value: Exclude<AbilityName, 'none'>;
  label: LocalizedString;
  abbr: string;
}
export interface SavingThrowLabelEntry {
  value: SavingThrowType;
  label: LocalizedString;
}
export interface DamageReductionTypeEntry {
  value: DamageReductionTypeValue;
  label: LocalizedString;
}
export interface DamageReductionRuleEntry {
  value: DamageReductionRuleValue;
  label: LocalizedString;
}
export interface AlignmentPrerequisiteGenericLabelEntry {
  value: string;
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
  value: DndClassId | string;
  label: LocalizedString;
  hitDice: string;
  babProgression: "good" | "average" | "poor";
  generalDescription: LocalizedString;
  loreAttributes?: Array<{key: LocalizedString, value: LocalizedString}>;
  saves: { fortitude: 'good' | 'poor'; reflex: 'good' | 'poor'; will: 'good' | 'poor' };
  spellcasting?: ClassCastingDetails;
  grantedFeats?: Array<{ featId: string; note?: LocalizedString; levelAcquired?: number }>;
  uiSections?: ClassSpecificUIBlock[]; // from character-core
  featChoiceFilters?: FeatChoiceFilter[]; // from character-core
  classSpecificFeats?: FeatDefinitionJsonData[]; // Feats defined in this file
}
// No ClassesJson, as each class is its own file.

export interface RawDeityDataEntry {
  value: DndDeityId | string;
  label: LocalizedString;
  alignment: CharacterAlignment | '';
  fullName: LocalizedString;
  attributes: Array<{key: LocalizedString, value: LocalizedString}>;
}
export interface DeitiesJson { // For the single common deities file
  DND_DEITIES_DATA: RawDeityDataEntry[];
}

export interface RawFeatTypeDataEntry {
  value: FeatTypeString;
  label: LocalizedString;
}
export interface CommonFeatsJson { // For data/feats/common-feats.json
  DND_FEATS_DATA: FeatDefinitionJsonData[];
  FEAT_TYPES_DATA: RawFeatTypeDataEntry[];
}

export interface RawRaceDataEntry {
  value: DndRaceId;
  label: LocalizedString;
  description?: LocalizedString;
  generalDescription?: LocalizedString; // Ensure this is used consistently.
  loreAttributes?: Array<{key: LocalizedString, value: LocalizedString}>;
  bonusFeatSlots?: number;
  racialSkillBonuses?: Record<string, number>;
  grantedFeats?: Array<{ featId: string; note?: LocalizedString; name?: LocalizedString; levelAcquired?: number }>;
  speeds?: Partial<Record<SpeedType, number>>;
  automaticLanguages?: LanguageId[];
}
export interface RacesJson { // For data/common/races.json
  DND_RACES_DATA: RawRaceDataEntry[];
}


export interface RawSkillDefinitionDataEntry {
  value: string;
  label: LocalizedString;
  keyAbility: AbilityName | string;
  description?: LocalizedString;
}
export interface SkillsJson { // For data/common/skills.json
  SKILL_DEFINITIONS_DATA: RawSkillDefinitionDataEntry[];
  CLASS_SKILLS_DATA: ClassSkillsJsonData;
  CLASS_SKILL_POINTS_BASE_DATA: ClassSkillPointsBaseJsonData;
  SKILL_SYNERGIES_DATA: SkillSynergiesJsonData;
}

// No specific UiStringsJson, as UI strings are now merged from multiple files directly into a Record<string, LocalizedString>
export type RawUiStringsData = Record<string, LocalizedString>;


// Bundle structure after loadLocaleData has aggregated files
export interface LocaleDataBundle {
  alignments: AlignmentsJson;
  base: BaseJson;
  allClasses: RawClassDataEntry[]; // Array of all loaded class objects
  deities: DeitiesJson;
  commonFeats: CommonFeatsJson; // Contains common feats and feat types
  races: RacesJson;
  skills: SkillsJson;
  languages: LanguagesJson;
  xpTable: XpJson;
  domains: DomainJson;
  magicSchools: MagicSchoolsJson;
  uiStrings: RawUiStringsData; // Merged UI strings
}

// Interface for the final processed data consumed by the app
export interface ProcessedSiteData {
  ALIGNMENTS: readonly CharacterAlignmentObject[];
  LANGUAGES: readonly LanguageOption[];
  XP_TABLE: readonly XpDataEntry[];
  EPIC_LEVEL_XP_INCREASE: number;
  SIZES: readonly CharacterSizeObject[];
  GENDERS: readonly { value: GenderId | string; label: string }[]; // Label is now string
  DND_RACES: readonly DndRaceOption[];
  DND_CLASSES: readonly DndClassOption[];
  DND_DEITIES: readonly DndDeityOption[];
  DND_DOMAINS: readonly DomainDefinition[];
  DND_MAGIC_SCHOOLS: readonly MagicSchoolDefinition[];
  SKILL_DEFINITIONS: readonly SkillDefinitionJsonData[];
  DND_FEATS_DEFINITIONS: readonly FeatDefinitionJsonData[]; // All feats (common + class-specific)
  FEAT_TYPES: readonly { value: FeatTypeString; label: string }[]; // Label is now string
  ABILITY_LABELS: readonly { value: Exclude<AbilityName, 'none'>; label: string; abbr: string }[]; // Label is now string
  SAVING_THROW_LABELS: readonly { value: SavingThrowType; label: string }[]; // Label is now string
  DAMAGE_REDUCTION_TYPES: readonly { value: DamageReductionTypeValue; label: string }[]; // Label is now string
  DAMAGE_REDUCTION_RULES_OPTIONS: readonly { value: DamageReductionRuleValue; label: string }[]; // Label is now string
  ALIGNMENT_PREREQUISITE_OPTIONS: readonly { value: string; label: string }[]; // Label is now string
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
  UI_STRINGS: Record<string, string>; // Final UI strings for the current language
}


export function getLocalizedString(
  entry: LocalizedString | undefined,
  lang: LanguageCode,
  fallbackLang: LanguageCode = DEFAULT_LANGUAGE
): string {
  if (entry === undefined || entry === null) return '';
  if (typeof entry === 'string') return entry;

  const langSpecific = entry[lang];
  if (langSpecific !== undefined) return langSpecific;

  const fallbackSpecific = entry[fallbackLang];
  if (fallbackSpecific !== undefined) return fallbackSpecific;

  if (entry.en !== undefined) return entry.en; // Default to 'en' if primary and fallback fail

  // As a last resort, take the first available language defined in the object
  const firstKey = Object.keys(entry).find(k => k !== 'en' && SUPPORTED_LANGUAGES.some(supLang => supLang.code === k)) as LanguageCode | undefined;
  if (firstKey && entry[firstKey] !== undefined) return entry[firstKey]!;

  return ''; // Or throw an error, or return a placeholder like '[no translation]'
}


// Helper to process arrays of items with LocalizedString fields
function processLocalizedArray<T extends { label: LocalizedString, description?: LocalizedString, [key: string]: any }, R extends { label: string, description?: string, [key: string]: any }>(
  items: T[],
  lang: LanguageCode,
  otherFieldsToLocalize?: Array<keyof T>
): R[] {
  return items.map(item => {
    const newItem: any = { ...item };
    newItem.label = getLocalizedString(item.label, lang);
    if (item.description) {
      newItem.description = getLocalizedString(item.description, lang);
    }
    if (otherFieldsToLocalize) {
      otherFieldsToLocalize.forEach(fieldKey => {
        if (item[fieldKey]) {
          newItem[fieldKey] = getLocalizedString(item[fieldKey] as LocalizedString, lang);
        }
      });
    }
    return newItem as R;
  }).sort((a, b) => (a.label).localeCompare(b.label));
}


export function processRawDataBundle(bundle: LocaleDataBundle, lang: LanguageCode): ProcessedSiteData {
  const ALIGNMENTS = processLocalizedArray<AlignmentDataEntry, CharacterAlignmentObject>(bundle.alignments.ALIGNMENTS_DATA, lang);
  const LANGUAGES = processLocalizedArray<LanguageDataEntry, LanguageOption>(bundle.languages.LANGUAGES_DATA, lang);
  const XP_TABLE = bundle.xpTable.XP_TABLE_DATA.sort((a, b) => a.level - b.level);
  const EPIC_LEVEL_XP_INCREASE = bundle.xpTable.EPIC_LEVEL_XP_INCREASE;

  const SIZES = processLocalizedArray<SizeDataEntry, CharacterSizeObject>(bundle.base.SIZES_DATA, lang);
  const GENDERS = processLocalizedArray<GenderDataEntry, { value: GenderId | string; label: string }>(bundle.base.GENDERS_DATA, lang);

  const DND_RACES = processLocalizedArray<RawRaceDataEntry, DndRaceOption>(
    bundle.races.DND_RACES_DATA.map(r => ({...r, generalDescription: r.description || r.generalDescription })), // Ensure generalDescription
    lang,
    ['generalDescription']
  ).map(r => ({
      ...r,
      grantedFeats: r.grantedFeats?.map(gf => ({...gf, name: getLocalizedString(gf.name, lang), note: getLocalizedString(gf.note, lang)})),
      loreAttributes: r.loreAttributes?.map(la => ({key: getLocalizedString(la.key, lang), value: getLocalizedString(la.value, lang)}))
  }));

  const DND_CLASSES_RAW = bundle.allClasses;
  const DND_CLASSES = processLocalizedArray<RawClassDataEntry, DndClassOption>(
    DND_CLASSES_RAW,
    lang,
    ['generalDescription']
  ).map(c => ({
    ...c,
    loreAttributes: c.loreAttributes?.map(la => ({key: getLocalizedString(la.key, lang), value: getLocalizedString(la.value, lang)})),
    grantedFeats: c.grantedFeats?.map(gf => ({...gf, note: getLocalizedString(gf.note, lang)})),
    // uiSections and featChoiceFilters don't typically have localizable strings within their core structure, but their labelKeys point to UI_STRINGS
  }));


  const DND_DEITIES = processLocalizedArray<RawDeityDataEntry, DndDeityOption>(
    bundle.deities.DND_DEITIES_DATA,
    lang,
    ['fullName']
  ).map(d => ({
    ...d,
    attributes: d.attributes.map(attr => ({ key: getLocalizedString(attr.key, lang), value: getLocalizedString(attr.value, lang) }))
  }));


  const DND_DOMAINS = processLocalizedArray<DomainDefinitionJson, DomainDefinition>(
      bundle.domains.DND_DOMAINS_DATA,
      lang,
      ['description', 'grantedPowerDescription']
  ).map(d => ({
      ...d,
      domainSpells: d.domainSpells.map(ds => ({...ds, spellName: getLocalizedString(ds.spellName, lang)}))
  }));


  const DND_MAGIC_SCHOOLS = processLocalizedArray<{value: MagicSchoolId, label: LocalizedString, description?: LocalizedString}, MagicSchoolDefinition>(
    bundle.magicSchools.DND_MAGIC_SCHOOLS_DATA,
    lang,
    ['description']
  );

  const SKILL_DEFINITIONS = processLocalizedArray<RawSkillDefinitionDataEntry, SkillDefinitionJsonData>(
    bundle.skills.SKILL_DEFINITIONS_DATA,
    lang,
    ['description']
  );


  const commonFeats = bundle.commonFeats.DND_FEATS_DATA;
  const classSpecificFeats = bundle.allClasses.reduce((acc, cls) => {
    if (cls.classSpecificFeats) {
      acc.push(...cls.classSpecificFeats);
    }
    return acc;
  }, [] as FeatDefinitionJsonData[]);

  const ALL_FEATS_RAW = [...commonFeats, ...classSpecificFeats];
  // Deduplicate feats by value, class-specific can override common
  const featMap = new Map<string, FeatDefinitionJsonData>();
  commonFeats.forEach(f => featMap.set(f.value, f));
  classSpecificFeats.forEach(f => featMap.set(f.value, f)); // Override if duplicate

  const DND_FEATS_DEFINITIONS = processLocalizedArray<FeatDefinitionJsonData, FeatDefinitionJsonData>(
    Array.from(featMap.values()),
    lang,
    ['description', 'effectsText'] // Ensure other LocalizedString fields are processed
  ).map(feat => ({
    ...feat,
    effects: feat.effects?.map(effect => {
      const localizedEffect = {...effect};
      if ('text' in localizedEffect && typeof localizedEffect.text === 'object') {
        (localizedEffect as any).text = getLocalizedString(localizedEffect.text as LocalizedString, lang);
      }
      if ('sourceFeat' in localizedEffect && typeof localizedEffect.sourceFeat === 'object') {
        (localizedEffect as any).sourceFeat = getLocalizedString(localizedEffect.sourceFeat as LocalizedString, lang);
      }
      if ('name' in localizedEffect && typeof localizedEffect.name === 'object') {
        (localizedEffect as any).name = getLocalizedString(localizedEffect.name as LocalizedString, lang);
      }
      if ('details' in localizedEffect && typeof localizedEffect.details === 'object') {
        (localizedEffect as any).details = getLocalizedString(localizedEffect.details as LocalizedString, lang);
      }
      if ('note' in localizedEffect && typeof localizedEffect.note === 'object') {
        (localizedEffect as any).note = getLocalizedString(localizedEffect.note as LocalizedString, lang);
      }
      return localizedEffect;
    })
  }));

  const FEAT_TYPES = processLocalizedArray<RawFeatTypeDataEntry, { value: FeatTypeString; label: string }>(bundle.commonFeats.FEAT_TYPES_DATA, lang);
  const ABILITY_LABELS = processLocalizedArray<AbilityLabelEntry, { value: Exclude<AbilityName, 'none'>; label: string; abbr: string }>(bundle.base.ABILITY_LABELS_DATA, lang);
  const SAVING_THROW_LABELS = processLocalizedArray<SavingThrowLabelEntry, { value: SavingThrowType; label: string }>(bundle.base.SAVING_THROW_LABELS_DATA, lang);
  const DAMAGE_REDUCTION_TYPES = processLocalizedArray<DamageReductionTypeEntry, { value: DamageReductionTypeValue; label: string }>(bundle.base.DAMAGE_REDUCTION_TYPES_DATA, lang);
  const DAMAGE_REDUCTION_RULES_OPTIONS = processLocalizedArray<DamageReductionRuleEntry, { value: DamageReductionRuleValue; label: string }>(bundle.base.DAMAGE_REDUCTION_RULES_OPTIONS_DATA, lang);

  const specificAlignmentOptions = ALIGNMENTS.map(a => ({ value: a.value, label: a.label }));
  const genericAlignmentOptions = processLocalizedArray<AlignmentPrerequisiteGenericLabelEntry, { value: string; label: string }>(bundle.base.ALIGNMENT_PREREQUISITE_GENERIC_LABELS_DATA, lang);
  const ALIGNMENT_PREREQUISITE_OPTIONS = [...specificAlignmentOptions, ...genericAlignmentOptions].sort((a,b) => a.label.localeCompare(b.label));

  const UI_STRINGS: Record<string, string> = {};
  for (const key in bundle.uiStrings) {
    UI_STRINGS[key] = getLocalizedString(bundle.uiStrings[key], lang);
  }
  
  const DND_RACE_AGING_EFFECTS_DATA_PROCESSED: ProcessedSiteData['DND_RACE_AGING_EFFECTS_DATA'] = {};
  for(const key in bundle.base.DND_RACE_AGING_EFFECTS_DATA) {
    DND_RACE_AGING_EFFECTS_DATA_PROCESSED[key] = {
      categories: bundle.base.DND_RACE_AGING_EFFECTS_DATA[key].categories.map(cat => ({
        ...cat,
        categoryName: getLocalizedString(cat.categoryName, lang)
      }))
    };
  }

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
    DEFAULT_ABILITIES: bundle.base.DEFAULT_ABILITIES_DATA,
    DEFAULT_SAVING_THROWS: bundle.base.DEFAULT_SAVING_THROWS_DATA,
    DEFAULT_RESISTANCE_VALUE: bundle.base.DEFAULT_RESISTANCE_VALUE_DATA,
    DEFAULT_SPEED_DETAILS: bundle.base.DEFAULT_SPEED_DETAILS_DATA,
    DEFAULT_SPEED_PENALTIES: bundle.base.DEFAULT_SPEED_PENALTIES_DATA,
    DND_RACE_MIN_ADULT_AGE_DATA: bundle.base.DND_RACE_MIN_ADULT_AGE_DATA,
    DND_RACE_BASE_MAX_AGE_DATA: bundle.base.DND_RACE_BASE_MAX_AGE_DATA,
    RACE_TO_AGING_CATEGORY_MAP_DATA: bundle.base.RACE_TO_AGING_CATEGORY_MAP_DATA,
    DND_RACE_AGING_EFFECTS_DATA: DND_RACE_AGING_EFFECTS_DATA_PROCESSED,
    DND_RACE_ABILITY_MODIFIERS_DATA: bundle.base.DND_RACE_ABILITY_MODIFIERS_DATA,
    DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA: bundle.base.DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA,
    CLASS_SKILLS: bundle.skills.CLASS_SKILLS_DATA,
    CLASS_SKILL_POINTS_BASE: bundle.skills.CLASS_SKILL_POINTS_BASE_DATA,
    SKILL_SYNERGIES: bundle.skills.SKILL_SYNERGIES_DATA,
    UI_STRINGS,
  };
}
