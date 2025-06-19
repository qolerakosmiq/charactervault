
import type {
  CharacterAlignment, CharacterSize, AbilityName, DndRaceId, DndClassId, DndDeityId,
  FeatDefinitionJsonData, SkillDefinitionJsonData, ClassSkillsJsonData, ClassSkillPointsBaseJsonData,
  SkillSynergiesJsonData, GenderId, SavingThrowType, DamageReductionTypeValue, DamageReductionRuleValue,
  FeatTypeString, ClassCastingDetails, CharacterSizeObject, CharacterAlignmentObject,
  DndRaceOption, DndClassOption, DndDeityOption, DeityAttribute, AbilityScores, SavingThrows,
  ResistanceValue, SpeedDetails, CharacterClass, LanguageId, LanguageOption, ClassAttribute,
  DomainDefinition, DomainId, MagicSchoolId, MagicSchoolDefinition, SpeedType, LocalizedString,
  ClassSpecificUIBlock, FeatChoiceFilter, GearSlot, GearSlotId, ItemDefinition, ItemDefinitionId
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
  PREFERRED_DEFAULT_ALIGNMENT_IDS_DATA?: readonly CharacterAlignment[];
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

export interface CreatureTypeDataEntry {
  id: string; // Creature type ID (e.g., "humanoid-orc", "undead")
  label: LocalizedString;
  description?: LocalizedString; // Added for brief descriptions
}
export interface CreatureTypesJson {
  DND_CREATURE_TYPES_DATA: CreatureTypeDataEntry[];
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

export interface GearSlotsJson {
  GEAR_SLOTS_DATA: GearSlot[];
}

export interface ItemsWeaponsJson { ITEM_DEFINITIONS_WEAPONS_DATA: ItemDefinition[]; }
export interface ItemsArmorJson { ITEM_DEFINITIONS_ARMOR_DATA: ItemDefinition[]; }
export interface ItemsShieldsJson { ITEM_DEFINITIONS_SHIELDS_DATA: ItemDefinition[]; }
export interface ItemsMagicItemsJson { ITEM_DEFINITIONS_MAGIC_ITEMS_DATA: ItemDefinition[]; }
// Add more item types as needed

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
  creatureTypes: CreatureTypesJson;
  gearSlots: GearSlotsJson;
  item_definitions_weapons: ItemsWeaponsJson;
  item_definitions_armor: ItemsArmorJson;
  item_definitions_shields: ItemsShieldsJson;
  item_definitions_magic_items: ItemsMagicItemsJson;
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
  DND_CREATURE_TYPES: readonly { id: string; label: string; description?: string }[];
  SKILL_DEFINITIONS: readonly SkillDefinitionJsonData[];
  DND_FEATS_DEFINITIONS: readonly FeatDefinitionJsonData[];
  FEAT_TYPES: readonly { id: FeatTypeString; label: string }[];
  ABILITY_LABELS: readonly { id: Exclude<AbilityName, 'none'>; label: string; abbr: string }[];
  SAVING_THROW_LABELS: readonly { id: SavingThrowType; label: string }[];
  DAMAGE_REDUCTION_TYPES: readonly { id: DamageReductionTypeValue; label: string }[];
  DAMAGE_REDUCTION_RULES_OPTIONS: readonly { id: string; label: string }[];
  ALIGNMENT_PREREQUISITE_OPTIONS: readonly { id: string; label: string }[];
  PREFERRED_DEFAULT_ALIGNMENT_IDS: readonly CharacterAlignment[];
  GEAR_SLOTS: readonly GearSlot[];
  ITEM_DEFINITIONS_WEAPONS: readonly ItemDefinition[];
  ITEM_DEFINITIONS_ARMOR: readonly ItemDefinition[];
  ITEM_DEFINITIONS_SHIELDS: readonly ItemDefinition[];
  ITEM_DEFINITIONS_MAGIC_ITEMS: readonly ItemDefinition[];
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
  debugKeyPath: string = "UNKNOWN_KEY_PATH"
): string {
  if (entry === undefined || entry === null) {
    throw new Error(`[I18N_ERROR] Missing translation entry object for key: ${debugKeyPath}`);
  }
  if (typeof entry === 'string') {
    if (entry.trim() === "") {
        // Allow empty strings if they come from the source JSON as such (e.g. empty description)
        // but still log a warning for potential data issue.
        // console.warn(`[I18N_WARNING] Translation for key '${debugKeyPath}' resolved to an EMPTY STRING (from direct string entry).`);
        return "";
    }
    return entry; // Assumed to be pre-localized or a non-localizable identifier
  }
  if (typeof entry !== 'object' || Object.keys(entry).length === 0) {
    throw new Error(`[I18N_ERROR] Invalid translation entry (empty object or not an object) for key: ${debugKeyPath}. Value: ${JSON.stringify(entry)}`);
  }

  const languagesToTry: LanguageCode[] = [];
  languagesToTry.push(lang);
  if (fallbackLang !== lang) languagesToTry.push(fallbackLang);
  
  const englishAvailable = SUPPORTED_LANGUAGES.some(l => l.code === 'en');
  if (englishAvailable && lang !== 'en' && fallbackLang !== 'en') {
    languagesToTry.push('en');
  }
  
  const uniqueLanguagesToTry = [...new Set(languagesToTry)];

  for (const tryLang of uniqueLanguagesToTry) {
    const translation = entry[tryLang];
    if (translation !== undefined && translation !== null) {
      if (typeof translation !== 'string') {
        throw new Error(`[I18N_ERROR] Translation for key '${debugKeyPath}' in language '${tryLang}' is NOT A STRING. Value: ${JSON.stringify(translation)}`);
      }
      if (translation.trim() === "") {
         // console.warn(`[I18N_WARNING] Translation for key '${debugKeyPath}' in language '${tryLang}' resolved to an EMPTY STRING.`);
        return ""; // Allow empty string if explicitly defined as such for a language.
      }
      return translation;
    }
  }

  throw new Error(`[I18N_ERROR] No valid translation found for key: ${debugKeyPath} after trying languages: ${uniqueLanguagesToTry.join(', ')}. Original entry: ${JSON.stringify(entry)}`);
}


function processLocalizedArray<
  T extends { id?: ItemDefinitionId | DndClassId | DndRaceId | DomainId | MagicSchoolId | FeatTypeString | LanguageId | GearSlotId | string; definitionId?: ItemDefinitionId; label: LocalizedString; [key: string]: any }, // Ensure id is generic enough, or use definitionId
  R extends { id?: ItemDefinitionId | DndClassId | DndRaceId | DomainId | MagicSchoolId | FeatTypeString | LanguageId | GearSlotId | string; definitionId?: ItemDefinitionId; label: string; [key: string]: any }
>(
  items: T[] | undefined,
  lang: LanguageCode,
  itemTypeForDebug: string,
  otherFieldsToLocalize?: Array<keyof T>,
  idFieldName: keyof T = ('id' as keyof T) // Default to 'id', but allow override (like 'definitionId' for ItemDefinition)
): R[] {
  if (!items || !Array.isArray(items)) {
    throw new Error(`[DATA_ERROR] Expected an array for ${itemTypeForDebug} but received: ${JSON.stringify(items)}`);
  }
  return items.map(item_raw => {
    const itemId = item_raw[idFieldName] as string;
    if (typeof itemId !== 'string' || !itemId) {
        throw new Error(`[DATA_ERROR] Invalid or missing ID (using field '${String(idFieldName)}') for item in ${itemTypeForDebug}: ${JSON.stringify(item_raw)}`);
    }
    const newItem: any = { ...item_raw };
    newItem[idFieldName] = itemId; // Ensure the correct ID field is preserved
    newItem.label = getLocalizedString(item_raw.label, lang, DEFAULT_LANGUAGE, `${itemTypeForDebug}.${itemId}.label`);

    if (otherFieldsToLocalize) {
      otherFieldsToLocalize.forEach(fieldKey => {
        const rawFieldValue = item_raw[fieldKey];
        if (rawFieldValue !== undefined && rawFieldValue !== null) { 
            if (typeof rawFieldValue === 'object' && !Array.isArray(rawFieldValue) && (rawFieldValue.hasOwnProperty('en') || rawFieldValue.hasOwnProperty(lang) || SUPPORTED_LANGUAGES.some(l => rawFieldValue.hasOwnProperty(l.code)))) {
                 newItem[fieldKey] = getLocalizedString(rawFieldValue as LocalizedString, lang, DEFAULT_LANGUAGE, `${itemTypeForDebug}.${itemId}.${String(fieldKey)}`);
            } else if (typeof rawFieldValue === 'string') {
                 // Allow empty strings for descriptions, etc.
                 // if (rawFieldValue.trim() === "") throw new Error(`[I18N_ERROR] Field '${String(fieldKey)}' for '${itemTypeForDebug}.${itemId}' is an empty string.`);
                 newItem[fieldKey] = rawFieldValue; 
            }
        }
      });
    }
    return newItem as R;
  }).sort((a, b) => (a.label || '').localeCompare(b.label || ''));
}

const HARDCODED_DEFAULT_ABILITIES: AbilityScores = {
  strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10,
};

export function processRawDataBundle(bundle: LocaleDataBundle, lang: LanguageCode): ProcessedSiteData {
  if (!bundle) throw new Error("[DATA_ERROR] LocaleDataBundle is undefined.");

  const getAndValidateArray = <T>(data: T[] | undefined, name: string): T[] => {
    if (!data || !Array.isArray(data)) throw new Error(`[DATA_ERROR] ${name} data is missing or not an array.`);
    return data;
  };
  const getAndValidateObject = <T>(data: T | undefined, name: string): T => {
    if (data === undefined) throw new Error(`[DATA_ERROR] ${name} data is missing (undefined).`);
    if (data === null) throw new Error(`[DATA_ERROR] ${name} data is missing (null).`);
    if (typeof data !== 'object') throw new Error(`[DATA_ERROR] ${name} data is not an object.`);
    return data;
  }

  const ALIGNMENTS = processLocalizedArray<AlignmentDataEntry, CharacterAlignmentObject>(getAndValidateArray(bundle.alignments?.ALIGNMENTS_DATA, 'Alignments'), lang, 'alignments', ['description']);
  const LANGUAGES = processLocalizedArray<LanguageDataEntry, LanguageOption>(getAndValidateArray(bundle.languages?.LANGUAGES_DATA, 'Languages'), lang, 'languages');
  const DND_CREATURE_TYPES = processLocalizedArray<CreatureTypeDataEntry, { id: string; label: string; description?: string }>(getAndValidateArray(bundle.creatureTypes?.DND_CREATURE_TYPES_DATA, 'Creature Types'), lang, 'creatureTypes', ['description']);
  const XP_TABLE = getAndValidateArray(bundle.xpTable?.XP_TABLE_DATA, 'XP Table').sort((a, b) => a.level - b.level);
  const EPIC_LEVEL_XP_INCREASE = bundle.xpTable?.EPIC_LEVEL_XP_INCREASE;
  if (typeof EPIC_LEVEL_XP_INCREASE !== 'number') throw new Error("[DATA_ERROR] EPIC_LEVEL_XP_INCREASE is missing or not a number.");


  const SIZES_RAW = getAndValidateArray(bundle.base?.SIZES_DATA, 'Sizes');
  const SIZES = SIZES_RAW.map(s_raw => {
    if (!s_raw || typeof s_raw.id !== 'string') throw new Error(`[DATA_ERROR] Invalid size definition: ${JSON.stringify(s_raw)}`);
    return {
        ...s_raw,
        label: getLocalizedString(s_raw.label, lang, DEFAULT_LANGUAGE, `sizes.${s_raw.id}.label`)
    } as CharacterSizeObject;
  }); 

  const GENDERS_RAW = getAndValidateArray(bundle.base?.GENDERS_DATA, 'Genders');
  const GENDERS = GENDERS_RAW.map(g_raw => {
      if (!g_raw || typeof g_raw.id !== 'string') throw new Error(`[DATA_ERROR] Invalid gender definition: ${JSON.stringify(g_raw)}`);
      return {
          id: g_raw.id as GenderId,
          label: getLocalizedString(g_raw.label, lang, DEFAULT_LANGUAGE, `genders.${g_raw.id}.label`)
      };
  }).sort((a, b) => {
      const order = ['unspecified', 'male', 'female', 'other'];
      const indexA = order.indexOf(a.id);
      const indexB = order.indexOf(b.id);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.label.localeCompare(b.label);
  });


  const commonFeatsRaw = getAndValidateArray(bundle.commonFeats?.DND_FEATS_DATA, 'Common Feats');
  const allClassesRaw = getAndValidateArray(bundle.allClasses, 'All Classes');
  const classSpecificFeatsFromBundleRaw = allClassesRaw.reduce((acc, cls_raw) => {
    if (!cls_raw || typeof cls_raw.id !== 'string') throw new Error(`[DATA_ERROR] Invalid class structure in allClasses: ${JSON.stringify(cls_raw)}`);
    if (cls_raw.classSpecificFeats) {
      acc.push(...cls_raw.classSpecificFeats);
    }
    return acc;
  }, [] as FeatDefinitionJsonData[]);

  const ALL_FEATS_RAW = [...commonFeatsRaw, ...classSpecificFeatsFromBundleRaw];
  const featMap = new Map<string, FeatDefinitionJsonData>();
  ALL_FEATS_RAW.forEach(f_raw => {
    if (!f_raw || typeof f_raw.id !== 'string') throw new Error(`[DATA_ERROR] Invalid feat definition encountered: ${JSON.stringify(f_raw)}`);
    if (featMap.has(f_raw.id)) throw new Error(`[DATA_ERROR] Duplicate feat ID found: ${f_raw.id}`);
    featMap.set(f_raw.id, f_raw);
  });

  const DND_FEATS_DEFINITIONS = Array.from(featMap.values()).map(feat_raw => {
    const debugKeyPrefix = `feats.${feat_raw.id}`;
    return {
    ...feat_raw,
    id: feat_raw.id, 
    label: getLocalizedString(feat_raw.label, lang, DEFAULT_LANGUAGE, `${debugKeyPrefix}.label`),
    description: (feat_raw.description !== undefined && feat_raw.description !== null) ? getLocalizedString(feat_raw.description, lang, DEFAULT_LANGUAGE, `${debugKeyPrefix}.description`) : undefined,
    effectsText: (feat_raw.effectsText !== undefined && feat_raw.effectsText !== null) ? getLocalizedString(feat_raw.effectsText, lang, DEFAULT_LANGUAGE, `${debugKeyPrefix}.effectsText`) : undefined,
    prerequisites: feat_raw.prerequisites ? {
      ...feat_raw.prerequisites,
      special: (feat_raw.prerequisites.special !== undefined && feat_raw.prerequisites.special !== null && (typeof feat_raw.prerequisites.special === 'string' || typeof feat_raw.prerequisites.special === 'object'))
               ? getLocalizedString(feat_raw.prerequisites.special as LocalizedString, lang, DEFAULT_LANGUAGE, `${debugKeyPrefix}.prereq.special`)
               : undefined
    } : undefined,
    effects: feat_raw.effects?.map((effect, index) => {
      const localizedEffect = {...effect};
      const effectDebugKeyBase = `${debugKeyPrefix}.effects[${index}]`;
      if ('text' in localizedEffect && (localizedEffect.text !== undefined && localizedEffect.text !== null)) {
        (localizedEffect as any).text = getLocalizedString(localizedEffect.text as LocalizedString, lang, DEFAULT_LANGUAGE, `${effectDebugKeyBase}.text`);
      }
      if ('sourceFeat' in localizedEffect && (localizedEffect.sourceFeat !== undefined && localizedEffect.sourceFeat !== null)) {
        (localizedEffect as any).sourceFeat = getLocalizedString(localizedEffect.sourceFeat as LocalizedString, lang, DEFAULT_LANGUAGE, `${effectDebugKeyBase}.sourceFeat`);
      }
      if ('name' in localizedEffect && (localizedEffect.name !== undefined && localizedEffect.name !== null)) {
        (localizedEffect as any).name = getLocalizedString(localizedEffect.name as LocalizedString, lang, DEFAULT_LANGUAGE, `${effectDebugKeyBase}.name`);
      }
       if ('details' in localizedEffect && (localizedEffect.details !== undefined && localizedEffect.details !== null)) {
        (localizedEffect as any).details = getLocalizedString(localizedEffect.details as LocalizedString, lang, DEFAULT_LANGUAGE, `${effectDebugKeyBase}.details`);
      }
      if ('note' in localizedEffect && (localizedEffect.note !== undefined && localizedEffect.note !== null)) {
        (localizedEffect as any).note = getLocalizedString(localizedEffect.note as LocalizedString, lang, DEFAULT_LANGUAGE, `${effectDebugKeyBase}.note`);
      }
      return localizedEffect;
    })
  }}).sort((a,b) => a.label.localeCompare(b.label));

  const DND_RACES_RAW = getAndValidateArray(bundle.races?.DND_RACES_DATA, 'Races');
  const DND_RACES = DND_RACES_RAW.map(r_raw => {
    if (!r_raw || typeof r_raw.id !== 'string') throw new Error(`[DATA_ERROR] Invalid race definition: ${JSON.stringify(r_raw)}`);
    const {
      id, label, generalDescription, description, loreAttributes,
      bonusFeatSlots, racialSkillBonuses, grantedFeats: rawGrantedFeats, speeds, automaticLanguages, bonusLanguages, genderOptions: rawGenderOptions
    } = r_raw;

    const localizedGrantedFeats = (rawGrantedFeats || []).map(gf_raw => {
        if (!DND_FEATS_DEFINITIONS.find(f => f.id === gf_raw.featId)) throw new Error(`[DATA_ERROR] Feat definition for ID '${gf_raw.featId}' referenced by race '${id}' not found.`);
        return {
            featId: gf_raw.featId,
            name: (gf_raw.name !== undefined && gf_raw.name !== null) ? getLocalizedString(gf_raw.name, lang, DEFAULT_LANGUAGE, `races.${id}.grantedFeats.${gf_raw.featId}.name`) : DND_FEATS_DEFINITIONS.find(f => f.id === gf_raw.featId)!.label,
            note: (gf_raw.note !== undefined && gf_raw.note !== null) ? getLocalizedString(gf_raw.note, lang, DEFAULT_LANGUAGE, `races.${id}.grantedFeats.${gf_raw.featId}.note`) : undefined,
            levelAcquired: gf_raw.levelAcquired
        };
    });

    const localizedGenderOptions = (rawGenderOptions || []).map(go_raw => ({
      id: go_raw.id as GenderId,
      label: getLocalizedString(go_raw.label, lang, DEFAULT_LANGUAGE, `races.${id}.genderOptions.${go_raw.id}.label`)
    }));

    const localizedRace: DndRaceOption = {
      id: id,
      label: getLocalizedString(label, lang, DEFAULT_LANGUAGE, `races.${id}.label`),
      generalDescription: getLocalizedString(generalDescription || description, lang, DEFAULT_LANGUAGE, `races.${id}.generalDescription`),
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


  const DND_CLASSES = allClassesRaw.map(c_raw => {
    if (!c_raw || typeof c_raw.id !== 'string') throw new Error(`[DATA_ERROR] Invalid class definition (in allClasses): ${JSON.stringify(c_raw)}`);
    const {
      id, label, hitDice, babProgression, generalDescription, loreAttributes,
      saves, spellcasting, grantedFeats: rawGrantedFeats, uiSections, featChoiceFilters,
      classSpecificFeats, alignmentRestriction, deityAlignmentRestriction, abilityScorePriorities
    } = c_raw;

    const localizedGrantedFeats = (rawGrantedFeats || []).map(gf_raw => {
        if (!DND_FEATS_DEFINITIONS.find(f => f.id === gf_raw.featId)) throw new Error(`[DATA_ERROR] Feat definition for ID '${gf_raw.featId}' referenced by class '${id}' not found.`);
        return {
            featId: gf_raw.featId,
            name: (gf_raw.name !== undefined && gf_raw.name !== null) ? getLocalizedString(gf_raw.name, lang, DEFAULT_LANGUAGE, `classes.${id}.grantedFeats.${gf_raw.featId}.name`) : DND_FEATS_DEFINITIONS.find(f => f.id === gf_raw.featId)!.label,
            note: (gf_raw.note !== undefined && gf_raw.note !== null) ? getLocalizedString(gf_raw.note, lang, DEFAULT_LANGUAGE, `classes.${id}.grantedFeats.${gf_raw.featId}.note`) : undefined,
            levelAcquired: gf_raw.levelAcquired
        };
    });
    
    const localizedClassSpecificFeats = (classSpecificFeats || []).map(csf_raw => {
      if (!csf_raw || typeof csf_raw.id !== 'string') throw new Error(`[DATA_ERROR] Invalid class-specific feat definition in class '${id}': ${JSON.stringify(csf_raw)}`);
      const csfDebugKeyPrefix = `classes.${id}.classSpecificFeats.${csf_raw.id}`;
      return {
      ...csf_raw,
      id: csf_raw.id,
      label: getLocalizedString(csf_raw.label, lang, DEFAULT_LANGUAGE, `${csfDebugKeyPrefix}.label`),
      description: (csf_raw.description !== undefined && csf_raw.description !== null) ? getLocalizedString(csf_raw.description, lang, DEFAULT_LANGUAGE, `${csfDebugKeyPrefix}.description`) : undefined,
      effectsText: (csf_raw.effectsText !== undefined && csf_raw.effectsText !== null) ? getLocalizedString(csf_raw.effectsText, lang, DEFAULT_LANGUAGE, `${csfDebugKeyPrefix}.effectsText`) : undefined,
      effects: csf_raw.effects?.map((effect, index) => {
          const localizedEffect = {...effect};
          const effectDebugKeyBase = `${csfDebugKeyPrefix}.effects[${index}]`;
          if ('text' in localizedEffect && (localizedEffect.text !== undefined && localizedEffect.text !== null)) {
            (localizedEffect as any).text = getLocalizedString(localizedEffect.text as LocalizedString, lang, DEFAULT_LANGUAGE, `${effectDebugKeyBase}.text`);
          }
          if ('sourceFeat' in localizedEffect && (localizedEffect.sourceFeat !== undefined && localizedEffect.sourceFeat !== null)) {
            (localizedEffect as any).sourceFeat = getLocalizedString(localizedEffect.sourceFeat as LocalizedString, lang, DEFAULT_LANGUAGE, `${effectDebugKeyBase}.sourceFeat`);
          }
          if ('name' in localizedEffect && (localizedEffect.name !== undefined && localizedEffect.name !== null)) {
            (localizedEffect as any).name = getLocalizedString(localizedEffect.name as LocalizedString, lang, DEFAULT_LANGUAGE, `${effectDebugKeyBase}.name`);
          }
           if ('details' in localizedEffect && (localizedEffect.details !== undefined && localizedEffect.details !== null)) {
            (localizedEffect as any).details = getLocalizedString(localizedEffect.details as LocalizedString, lang, DEFAULT_LANGUAGE, `${effectDebugKeyBase}.details`);
          }
          if ('note' in localizedEffect && (localizedEffect.note !== undefined && localizedEffect.note !== null)) {
            (localizedEffect as any).note = getLocalizedString(localizedEffect.note as LocalizedString, lang, DEFAULT_LANGUAGE, `${effectDebugKeyBase}.note`);
          }
          return localizedEffect;
        })
    }});

    const localizedUiSections = uiSections?.map((uiBlock, uiIndex) => {
      const uiBlockDebugKeyPrefix = `classes.${id}.uiSections[${uiIndex}]`;
      const localizedBlock: ClassSpecificUIBlock = { ...uiBlock };

      if (uiBlock.label) localizedBlock.label = getLocalizedString(uiBlock.label, lang, DEFAULT_LANGUAGE, `${uiBlockDebugKeyPrefix}.label`);
      if (uiBlock.description) localizedBlock.description = getLocalizedString(uiBlock.description, lang, DEFAULT_LANGUAGE, `${uiBlockDebugKeyPrefix}.description`);
      if (uiBlock.infoDialogTitle) localizedBlock.infoDialogTitle = getLocalizedString(uiBlock.infoDialogTitle, lang, DEFAULT_LANGUAGE, `${uiBlockDebugKeyPrefix}.infoDialogTitle`);
      if (uiBlock.infoDialogContent) localizedBlock.infoDialogContent = getLocalizedString(uiBlock.infoDialogContent, lang, DEFAULT_LANGUAGE, `${uiBlockDebugKeyPrefix}.infoDialogContent`);
      if (uiBlock.inputPlaceholder) localizedBlock.inputPlaceholder = getLocalizedString(uiBlock.inputPlaceholder, lang, DEFAULT_LANGUAGE, `${uiBlockDebugKeyPrefix}.inputPlaceholder`);
      if (uiBlock.slotLabel) localizedBlock.slotLabel = getLocalizedString(uiBlock.slotLabel, lang, DEFAULT_LANGUAGE, `${uiBlockDebugKeyPrefix}.slotLabel`);
      if (uiBlock.note) localizedBlock.note = getLocalizedString(uiBlock.note, lang, DEFAULT_LANGUAGE, `${uiBlockDebugKeyPrefix}.note`);
      
      if (uiBlock.customOptions) {
        localizedBlock.customOptions = uiBlock.customOptions.map((opt, optIndex) => ({
          ...opt,
          label: getLocalizedString(opt.label, lang, DEFAULT_LANGUAGE, `${uiBlockDebugKeyPrefix}.customOptions[${optIndex}].label`),
          description: opt.description ? getLocalizedString(opt.description, lang, DEFAULT_LANGUAGE, `${uiBlockDebugKeyPrefix}.customOptions[${optIndex}].description`) : undefined,
        }));
      }
      if (uiBlock.grantsFeats) {
        localizedBlock.grantsFeats = uiBlock.grantsFeats.map((gf, gfIndex) => ({
          ...gf,
          note: gf.note ? getLocalizedString(gf.note, lang, DEFAULT_LANGUAGE, `${uiBlockDebugKeyPrefix}.grantsFeats[${gfIndex}].note`) : undefined
        }));
      }
      return localizedBlock;
    });

    const localizedClass: DndClassOption = {
      id: id,
      label: getLocalizedString(label, lang, DEFAULT_LANGUAGE, `classes.${id}.label`),
      hitDice: hitDice,
      babProgression: babProgression,
      generalDescription: getLocalizedString(generalDescription, lang, DEFAULT_LANGUAGE, `classes.${id}.generalDescription`),
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
      uiSections: localizedUiSections,
      featChoiceFilters: featChoiceFilters ? featChoiceFilters.map(fcf => ({
        ...fcf,
        filterCases: fcf.filterCases.map(fc => ({
          ...fc,
          noteMustContain: getLocalizedString(fc.noteMustContain, lang, DEFAULT_LANGUAGE, `classes.${id}.featChoiceFilters.${fcf.classSpecificChoiceKey}.${fc.choiceValue}.note`)
        }))
      })) : undefined,
      classSpecificFeats: localizedClassSpecificFeats,
    };
    return localizedClass;
  }).sort((a,b) => a.label.localeCompare(b.label));


  const DND_DEITIES_RAW = getAndValidateArray(bundle.deities?.DND_DEITIES_DATA, 'Deities');
  const DND_DEITIES = DND_DEITIES_RAW.map(d_raw => {
    if (!d_raw || typeof d_raw.id !== 'string') throw new Error(`[DATA_ERROR] Invalid deity definition: ${JSON.stringify(d_raw)}`);
    return {
        id: d_raw.id,
        label: getLocalizedString(d_raw.label, lang, DEFAULT_LANGUAGE, `deities.${d_raw.id}.label`),
        alignment: d_raw.alignment,
        fullName: getLocalizedString(d_raw.fullName, lang, DEFAULT_LANGUAGE, `deities.${d_raw.id}.fullName`),
        attributes: (d_raw.attributes || []).map((attr, idx) => ({
            key: getLocalizedString(attr.key, lang, DEFAULT_LANGUAGE, `deities.${d_raw.id}.attributes[${idx}].key`),
            value: getLocalizedString(attr.value, lang, DEFAULT_LANGUAGE, `deities.${d_raw.id}.attributes[${idx}].value`)
        }))
  }}).sort((a,b) => a.label.localeCompare(b.label));


  const DND_DOMAINS_RAW = getAndValidateArray(bundle.domains?.DND_DOMAINS_DATA, 'Domains');
  const DND_DOMAINS = DND_DOMAINS_RAW.map(d_raw => {
    if (!d_raw || typeof d_raw.id !== 'string') throw new Error(`[DATA_ERROR] Invalid domain definition: ${JSON.stringify(d_raw)}`);
    return {
      id: d_raw.id,
      label: getLocalizedString(d_raw.label, lang, DEFAULT_LANGUAGE, `domains.${d_raw.id}.label`),
      description: getLocalizedString(d_raw.description, lang, DEFAULT_LANGUAGE, `domains.${d_raw.id}.description`),
      grantedPowerDescription: getLocalizedString(d_raw.grantedPowerDescription, lang, DEFAULT_LANGUAGE, `domains.${d_raw.id}.grantedPowerDescription`),
      grantedPowerFeatId: d_raw.grantedPowerFeatId,
      domainSpells: (d_raw.domainSpells || []).map((ds, idx) => ({
          ...ds,
          spellName: (ds.spellName !== undefined && ds.spellName !== null) ? getLocalizedString(ds.spellName, lang, DEFAULT_LANGUAGE, `domains.${d_raw.id}.domainSpells[${idx}].spellName`) : ds.spellId
      })),
      deityAlignmentRestrictions: d_raw.deityAlignmentRestrictions
  }}).sort((a,b) => a.label.localeCompare(b.label));


  const DND_MAGIC_SCHOOLS_RAW = getAndValidateArray(bundle.magicSchools?.DND_MAGIC_SCHOOLS_DATA, 'Magic Schools');
  const DND_MAGIC_SCHOOLS = DND_MAGIC_SCHOOLS_RAW.map(ms_raw => {
    if (!ms_raw || typeof ms_raw.id !== 'string') throw new Error(`[DATA_ERROR] Invalid magic school definition: ${JSON.stringify(ms_raw)}`);
    return {
    id: ms_raw.id,
    label: getLocalizedString(ms_raw.label, lang, DEFAULT_LANGUAGE, `magicSchools.${ms_raw.id}.label`),
    description: (ms_raw.description !== undefined && ms_raw.description !== null) ? getLocalizedString(ms_raw.description, lang, DEFAULT_LANGUAGE, `magicSchools.${ms_raw.id}.description`) : undefined,
  }}).sort((a,b) => a.label.localeCompare(b.label));

  const SKILL_DEFINITIONS_RAW = getAndValidateArray(bundle.skills?.SKILL_DEFINITIONS_DATA, 'Skill Definitions');
  const SKILL_DEFINITIONS = SKILL_DEFINITIONS_RAW.map(sd_raw => {
    if (!sd_raw || typeof sd_raw.id !== 'string') throw new Error(`[DATA_ERROR] Invalid skill definition: ${JSON.stringify(sd_raw)}`);
    return {
    id: sd_raw.id,
    label: getLocalizedString(sd_raw.label, lang, DEFAULT_LANGUAGE, `skills.${sd_raw.id}.label`),
    keyAbility: sd_raw.keyAbility as AbilityName, 
    description: (sd_raw.description !== undefined && sd_raw.description !== null) ? getLocalizedString(sd_raw.description, lang, DEFAULT_LANGUAGE, `skills.${sd_raw.id}.description`) : undefined,
  }}).sort((a,b) => a.label.localeCompare(b.label));


  const FEAT_TYPES_RAW = getAndValidateArray(bundle.commonFeats?.FEAT_TYPES_DATA, 'Feat Types');
  const FEAT_TYPES = FEAT_TYPES_RAW.map(ft_raw => {
    if (!ft_raw || typeof ft_raw.id !== 'string') throw new Error(`[DATA_ERROR] Invalid feat type definition: ${JSON.stringify(ft_raw)}`);
     return { id: ft_raw.id, label: getLocalizedString(ft_raw.label, lang, DEFAULT_LANGUAGE, `featTypes.${ft_raw.id}.label`) }
  }).sort((a,b) => a.label.localeCompare(b.label));

  const ABILITY_LABELS_RAW = getAndValidateArray(bundle.base?.ABILITY_LABELS_DATA, 'Ability Labels');
  const ABILITY_LABELS = ABILITY_LABELS_RAW.map(al_raw => {
    if (!al_raw || typeof al_raw.id !== 'string') throw new Error(`[DATA_ERROR] Invalid ability label definition: ${JSON.stringify(al_raw)}`);
    return {
    id: al_raw.id, label: getLocalizedString(al_raw.label, lang, DEFAULT_LANGUAGE, `abilityLabels.${al_raw.id}.label`), abbr: al_raw.abbr
  }}); 

  const SAVING_THROW_LABELS_RAW = getAndValidateArray(bundle.base?.SAVING_THROW_LABELS_DATA, 'Saving Throw Labels');
  const SAVING_THROW_LABELS = SAVING_THROW_LABELS_RAW.map(stl_raw => {
    if (!stl_raw || typeof stl_raw.id !== 'string') throw new Error(`[DATA_ERROR] Invalid saving throw label definition: ${JSON.stringify(stl_raw)}`);
    return {
    id: stl_raw.id, label: getLocalizedString(stl_raw.label, lang, DEFAULT_LANGUAGE, `savingThrowLabels.${stl_raw.id}.label`)
  }}); 

  const DAMAGE_REDUCTION_TYPES_RAW = getAndValidateArray(bundle.base?.DAMAGE_REDUCTION_TYPES_DATA, 'Damage Reduction Types');
  const DAMAGE_REDUCTION_TYPES = DAMAGE_REDUCTION_TYPES_RAW.map(drt_raw => {
    if (!drt_raw || typeof drt_raw.id !== 'string') throw new Error(`[DATA_ERROR] Invalid DR type definition: ${JSON.stringify(drt_raw)}`);
    return {
    id: drt_raw.id, label: getLocalizedString(drt_raw.label, lang, DEFAULT_LANGUAGE, `damageReductionTypes.${drt_raw.id}.label`)
  }}).sort((a,b) => a.label.localeCompare(b.label));

  const DAMAGE_REDUCTION_RULES_OPTIONS_RAW = getAndValidateArray(bundle.base?.DAMAGE_REDUCTION_RULES_OPTIONS_DATA, 'Damage Reduction Rules');
  const DAMAGE_REDUCTION_RULES_OPTIONS = DAMAGE_REDUCTION_RULES_OPTIONS_RAW.map(drr_raw => {
    if (!drr_raw || typeof drr_raw.id !== 'string') throw new Error(`[DATA_ERROR] Invalid DR rule definition: ${JSON.stringify(drr_raw)}`);
    return {
    id: drr_raw.id, label: getLocalizedString(drr_raw.label, lang, DEFAULT_LANGUAGE, `damageReductionRules.${drr_raw.id}.label`)
  }}).sort((a,b) => a.label.localeCompare(b.label));

  const specificAlignmentOptions = ALIGNMENTS.map(a => ({ id: a.id, label: a.label }));
  const genericAlignmentOptions_RAW = getAndValidateArray(bundle.base?.ALIGNMENT_PREREQUISITE_GENERIC_LABELS_DATA, 'Alignment Prereq Generic Labels');
  const genericAlignmentOptions = genericAlignmentOptions_RAW.map(ago_raw => {
    if (!ago_raw || typeof ago_raw.id !== 'string') throw new Error(`[DATA_ERROR] Invalid generic alignment label: ${JSON.stringify(ago_raw)}`);
    return {
    id: ago_raw.id, label: getLocalizedString(ago_raw.label, lang, DEFAULT_LANGUAGE, `alignmentPrereqGenericLabels.${ago_raw.id}.label`)
  }}).sort((a,b) => a.label.localeCompare(b.label));
  const ALIGNMENT_PREREQUISITE_OPTIONS = [...specificAlignmentOptions, ...genericAlignmentOptions].sort((a,b) => a.label.localeCompare(b.label));

  const rawPreferredDefaults = bundle.alignments?.PREFERRED_DEFAULT_ALIGNMENT_IDS_DATA;
  let PREFERRED_DEFAULT_ALIGNMENT_IDS: readonly CharacterAlignment[];

  if (!rawPreferredDefaults || !Array.isArray(rawPreferredDefaults) || rawPreferredDefaults.length === 0) {
    console.warn("[DATA_WARNING] PREFERRED_DEFAULT_ALIGNMENT_IDS_DATA is missing or empty in alignments.json. Using hardcoded fallback ['true-neutral'].");
    const fallbackTrueNeutral = ALIGNMENTS.find(a => a.id === 'true-neutral')?.id;
    if (!fallbackTrueNeutral) throw new Error("[DATA_ERROR] 'true-neutral' alignment ID not found for fallback preferred default.");
    PREFERRED_DEFAULT_ALIGNMENT_IDS = [fallbackTrueNeutral];
  } else {
    const validIds = rawPreferredDefaults.filter(id => ALIGNMENTS.some(a => a.id === id));
    if (validIds.length === 0) {
      console.warn(`[DATA_WARNING] No valid alignment IDs found in PREFERRED_DEFAULT_ALIGNMENT_IDS_DATA from alignments.json. Raw: ${JSON.stringify(rawPreferredDefaults)}. Defaulting to ['true-neutral'].`);
      const fallbackTrueNeutral = ALIGNMENTS.find(a => a.id === 'true-neutral')?.id;
      if (!fallbackTrueNeutral) throw new Error("[DATA_ERROR] 'true-neutral' alignment ID not found for fallback preferred default after invalid list.");
      PREFERRED_DEFAULT_ALIGNMENT_IDS = [fallbackTrueNeutral];
    } else {
      PREFERRED_DEFAULT_ALIGNMENT_IDS = validIds as CharacterAlignment[];
    }
  }


  const GEAR_SLOTS = processLocalizedArray<GearSlot, GearSlot>(
    getAndValidateArray(bundle.gearSlots?.GEAR_SLOTS_DATA, 'Gear Slots'),
    lang,
    'gearSlots',
    ['description']
  );

  const ITEM_DEFINITIONS_WEAPONS = processLocalizedArray<ItemDefinition, ItemDefinition>(
    getAndValidateArray(bundle.item_definitions_weapons?.ITEM_DEFINITIONS_WEAPONS_DATA, 'Weapon Item Definitions'),
    lang,
    'item_definitions_weapons',
    ['description', 'damageType', 'specialProperties'],
    'definitionId'
  );
  const ITEM_DEFINITIONS_ARMOR = processLocalizedArray<ItemDefinition, ItemDefinition>(
    getAndValidateArray(bundle.item_definitions_armor?.ITEM_DEFINITIONS_ARMOR_DATA, 'Armor Item Definitions'),
    lang,
    'item_definitions_armor',
    ['description'],
    'definitionId'
  );
  const ITEM_DEFINITIONS_SHIELDS = processLocalizedArray<ItemDefinition, ItemDefinition>(
    getAndValidateArray(bundle.item_definitions_shields?.ITEM_DEFINITIONS_SHIELDS_DATA, 'Shield Item Definitions'),
    lang,
    'item_definitions_shields',
    ['description'],
    'definitionId'
  );
  const ITEM_DEFINITIONS_MAGIC_ITEMS = processLocalizedArray<ItemDefinition, ItemDefinition>(
    getAndValidateArray(bundle.item_definitions_magic_items?.ITEM_DEFINITIONS_MAGIC_ITEMS_DATA, 'Magic Item Definitions'),
    lang,
    'item_definitions_magic_items',
    ['description', 'specialProperties'],
    'definitionId'
  );

  const UI_STRINGS_RAW = getAndValidateObject(bundle.uiStrings, 'UI Strings');
  const UI_STRINGS: Record<string, string> = {};
  for (const key in UI_STRINGS_RAW) {
    if (Object.prototype.hasOwnProperty.call(UI_STRINGS_RAW, key)) {
      UI_STRINGS[key] = getLocalizedString(UI_STRINGS_RAW[key], lang, DEFAULT_LANGUAGE, `uiStrings.${key}`);
    }
  }
  UI_STRINGS.currentLangCodeForNotesFallback = lang;


  const DND_RACE_AGING_EFFECTS_DATA_PROCESSED: ProcessedSiteData['DND_RACE_AGING_EFFECTS_DATA'] = {};
  const rawAgingEffects = getAndValidateObject(bundle.base?.DND_RACE_AGING_EFFECTS_DATA, 'Aging Effects Data');
  for(const key in rawAgingEffects) {
    if (!rawAgingEffects[key] || !Array.isArray(rawAgingEffects[key].categories)) throw new Error(`[DATA_ERROR] Invalid aging effect data for category key '${key}'`);
    DND_RACE_AGING_EFFECTS_DATA_PROCESSED[key] = {
      categories: rawAgingEffects[key].categories.map((cat, idx) => {
        if (!cat || typeof cat.categoryName !== 'object') throw new Error(`[DATA_ERROR] Invalid categoryName in aging effects for ${key}[${idx}]`);
        return {
          ...cat,
          categoryName: getLocalizedString(cat.categoryName, lang, DEFAULT_LANGUAGE, `agingEffects.${key}.categories[${idx}].categoryName`)
        };
      })
    };
  }

  const processedDefaultAbilities = (bundle.base?.DEFAULT_ABILITIES_DATA && Object.keys(bundle.base.DEFAULT_ABILITIES_DATA).length === 6)
    ? { ...bundle.base.DEFAULT_ABILITIES_DATA }
    : { ...HARDCODED_DEFAULT_ABILITIES };

  const baseData = getAndValidateObject(bundle.base, 'Base Data');
  const skillsData = getAndValidateObject(bundle.skills, 'Skills Data');

  return {
    ALIGNMENTS,
    LANGUAGES,
    DND_CREATURE_TYPES,
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
    PREFERRED_DEFAULT_ALIGNMENT_IDS,
    GEAR_SLOTS,
    ITEM_DEFINITIONS_WEAPONS,
    ITEM_DEFINITIONS_ARMOR,
    ITEM_DEFINITIONS_SHIELDS,
    ITEM_DEFINITIONS_MAGIC_ITEMS,
    DEFAULT_ABILITIES: processedDefaultAbilities,
    DEFAULT_SAVING_THROWS: getAndValidateObject(baseData.DEFAULT_SAVING_THROWS_DATA, 'Default Saving Throws'),
    DEFAULT_RESISTANCE_VALUE: getAndValidateObject(baseData.DEFAULT_RESISTANCE_VALUE_DATA, 'Default Resistance Value'),
    DEFAULT_SPEED_DETAILS: getAndValidateObject(baseData.DEFAULT_SPEED_DETAILS_DATA, 'Default Speed Details'),
    DEFAULT_SPEED_PENALTIES: getAndValidateObject(baseData.DEFAULT_SPEED_PENALTIES_DATA, 'Default Speed Penalties'),
    DND_RACE_MIN_ADULT_AGE_DATA: getAndValidateObject(baseData.DND_RACE_MIN_ADULT_AGE_DATA, 'Min Adult Age Data'),
    DND_RACE_BASE_MAX_AGE_DATA: getAndValidateObject(baseData.DND_RACE_BASE_MAX_AGE_DATA, 'Base Max Age Data'),
    RACE_TO_AGING_CATEGORY_MAP_DATA: getAndValidateObject(baseData.RACE_TO_AGING_CATEGORY_MAP_DATA, 'Race to Aging Category Map'),
    DND_RACE_AGING_EFFECTS_DATA: DND_RACE_AGING_EFFECTS_DATA_PROCESSED,
    DND_RACE_ABILITY_MODIFIERS_DATA: getAndValidateObject(baseData.DND_RACE_ABILITY_MODIFIERS_DATA, 'Race Ability Modifiers'),
    DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA: getAndValidateObject(baseData.DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA, 'Race Skill Points Bonus'),
    CLASS_SKILLS: getAndValidateObject(skillsData.CLASS_SKILLS_DATA, 'Class Skills'),
    CLASS_SKILL_POINTS_BASE: getAndValidateObject(skillsData.CLASS_SKILL_POINTS_BASE_DATA, 'Class Skill Points Base'),
    SKILL_SYNERGIES: getAndValidateObject(skillsData.SKILL_SYNERGIES_DATA, 'Skill Synergies'),
    UI_STRINGS,
  };
}

    
    