
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
  id: string;
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
  GENDERS: readonly { id: GenderId | string; label: string }[];
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
  fallbackLang: LanguageCode = DEFAULT_LANGUAGE
): string {
  if (entry === undefined || entry === null) return '';
  if (typeof entry === 'string') return entry;

  const langSpecific = entry[lang];
  if (langSpecific !== undefined) return langSpecific;

  const fallbackSpecific = entry[fallbackLang];
  if (fallbackSpecific !== undefined) return fallbackSpecific;

  if (entry.en !== undefined) return entry.en;

  const firstKey = Object.keys(entry).find(k => SUPPORTED_LANGUAGES.some(supLang => supLang.code === k)) as LanguageCode | undefined;
  if (firstKey && entry[firstKey] !== undefined) return entry[firstKey]!;

  return '';
}


function processLocalizedArray<T extends { id: string; label: LocalizedString; [key: string]: any }, R extends { id: string; label: string; [key: string]: any }>(
  items: T[] | undefined,
  lang: LanguageCode,
  otherFieldsToLocalize?: Array<keyof T>
): R[] {
  if (!items || !Array.isArray(items)) {
    return [];
  }
  return items.map(item_raw => {
    const newItem: any = { ...item_raw }; 
    newItem.id = item_raw.id; 
    newItem.label = getLocalizedString(item_raw.label, lang);

    if (otherFieldsToLocalize) {
      otherFieldsToLocalize.forEach(fieldKey => {
        const rawFieldValue = item_raw[fieldKey];
        if (rawFieldValue && typeof rawFieldValue === 'object' && !Array.isArray(rawFieldValue)) {
          newItem[fieldKey] = getLocalizedString(rawFieldValue as LocalizedString, lang) || ''; // Ensure empty string for undefined
        } else if (typeof rawFieldValue === 'string') {
           newItem[fieldKey] = rawFieldValue;
        } else if (rawFieldValue === undefined && (fieldKey === 'generalDescription' || fieldKey === 'description')) {
            newItem[fieldKey] = '';
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
  const ALIGNMENTS = processLocalizedArray<AlignmentDataEntry, CharacterAlignmentObject>(bundle.alignments?.ALIGNMENTS_DATA, lang, ['description']);
  const LANGUAGES = processLocalizedArray<LanguageDataEntry, LanguageOption>(bundle.languages?.LANGUAGES_DATA, lang);
  const XP_TABLE = bundle.xpTable?.XP_TABLE_DATA?.sort((a, b) => a.level - b.level) || [];
  const EPIC_LEVEL_XP_INCREASE = bundle.xpTable?.EPIC_LEVEL_XP_INCREASE || 0;

  const SIZES = processLocalizedArray<SizeDataEntry, CharacterSizeObject>(bundle.base?.SIZES_DATA, lang);
  const GENDERS = processLocalizedArray<GenderDataEntry, { id: GenderId | string; label: string }>(bundle.base?.GENDERS_DATA, lang);

  
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
    label: getLocalizedString(feat_raw.label, lang),
    description: getLocalizedString(feat_raw.description, lang) || '',
    effectsText: getLocalizedString(feat_raw.effectsText, lang) || '',
    prerequisites: feat_raw.prerequisites ? {
      ...feat_raw.prerequisites,
      special: getLocalizedString(feat_raw.prerequisites.special, lang) || undefined
    } : undefined,
    effects: feat_raw.effects?.map(effect => {
      const localizedEffect = {...effect};
      if ('text' in localizedEffect && typeof localizedEffect.text === 'object' && localizedEffect.text !== null) {
        (localizedEffect as any).text = getLocalizedString(localizedEffect.text as LocalizedString, lang);
      }
      if ('sourceFeat' in localizedEffect && typeof localizedEffect.sourceFeat === 'object' && localizedEffect.sourceFeat !== null) {
        (localizedEffect as any).sourceFeat = getLocalizedString(localizedEffect.sourceFeat as LocalizedString, lang);
      }
      if ('name' in localizedEffect && typeof localizedEffect.name === 'object' && localizedEffect.name !== null) {
        (localizedEffect as any).name = getLocalizedString(localizedEffect.name as LocalizedString, lang);
      }
       if ('details' in localizedEffect && typeof localizedEffect.details === 'object' && localizedEffect.details !== null) {
        (localizedEffect as any).details = getLocalizedString(localizedEffect.details as LocalizedString, lang);
      }
      if ('note' in localizedEffect && typeof localizedEffect.note === 'object' && localizedEffect.note !== null) {
        (localizedEffect as any).note = getLocalizedString(localizedEffect.note as LocalizedString, lang);
      }
      return localizedEffect;
    })
  })).sort((a,b) => a.label.localeCompare(b.label));

  const DND_RACES_RAW = bundle.races?.DND_RACES_DATA || [];
  const DND_RACES = DND_RACES_RAW.map(r_raw => {
    const { 
      id, label, generalDescription, description, loreAttributes, 
      bonusFeatSlots, racialSkillBonuses, grantedFeats: rawGrantedFeats, speeds, automaticLanguages, bonusLanguages 
    } = r_raw;
    
    const localizedRace: DndRaceOption = {
      id: id,
      label: getLocalizedString(label, lang),
      generalDescription: getLocalizedString(generalDescription || description, lang) || '',
      loreAttributes: (loreAttributes || []).map(la => ({
        key: getLocalizedString(la.key, lang),
        value: getLocalizedString(la.value, lang)
      })),
      bonusFeatSlots: bonusFeatSlots,
      racialSkillBonuses: racialSkillBonuses,
      grantedFeats: (rawGrantedFeats || []).map(gf_raw => {
        let displayName = '';
        const featDef = DND_FEATS_DEFINITIONS.find(f => f.id === gf_raw.featId);

        if (featDef && featDef.label && featDef.label.trim() !== '') {
          displayName = featDef.label;
        }
        
        if (displayName === '' && gf_raw.name) {
          const localizedName = getLocalizedString(gf_raw.name, lang);
          if (localizedName && localizedName.trim() !== '') {
            displayName = localizedName;
          }
        }
        
        if (displayName === '' && gf_raw.note) {
          const localizedNoteAsName = getLocalizedString(gf_raw.note, lang);
          if (localizedNoteAsName && localizedNoteAsName.trim() !== '') {
            displayName = localizedNoteAsName;
          }
        }
        
        if (displayName === '') {
          displayName = gf_raw.featId;
        }

        const noteText = getLocalizedString(gf_raw.note, lang);
        const finalNote = (displayName !== noteText && noteText && noteText.trim() !== '') ? noteText : undefined;

        return {
          featId: gf_raw.featId,
          name: displayName,
          note: finalNote,
          levelAcquired: gf_raw.levelAcquired
        };
      }),
      speeds: speeds,
      automaticLanguages: automaticLanguages,
      // bonusLanguages: bonusLanguages, // This field is not on DndRaceOption
    };
    return localizedRace;
  }).sort((a, b) => a.label.localeCompare(b.label));


  const DND_CLASSES_RAW = bundle.allClasses || [];
  const DND_CLASSES = DND_CLASSES_RAW.map(c_raw => {
    const {
      id, label, hitDice, babProgression, generalDescription, loreAttributes,
      saves, spellcasting, grantedFeats: rawGrantedFeats, uiSections, featChoiceFilters, classSpecificFeats
    } = c_raw;

    const localizedClass: DndClassOption = {
      id: id,
      label: getLocalizedString(label, lang),
      hitDice: hitDice,
      babProgression: babProgression,
      generalDescription: getLocalizedString(generalDescription, lang) || '',
      loreAttributes: (loreAttributes || []).map(la => ({
        key: getLocalizedString(la.key, lang),
        value: getLocalizedString(la.value, lang)
      })),
      saves: saves,
      spellcasting: spellcasting,
      grantedFeats: (rawGrantedFeats || []).map(gf_raw => {
        let displayName = '';
        const featDef = DND_FEATS_DEFINITIONS.find(f => f.id === gf_raw.featId);

        if (featDef && featDef.label && featDef.label.trim() !== '') {
          displayName = featDef.label;
        }
        
        if (displayName === '' && gf_raw.name) {
          const localizedName = getLocalizedString(gf_raw.name, lang);
          if (localizedName && localizedName.trim() !== '') {
            displayName = localizedName;
          }
        }
        
        if (displayName === '' && gf_raw.note) {
          const localizedNoteAsName = getLocalizedString(gf_raw.note, lang);
          if (localizedNoteAsName && localizedNoteAsName.trim() !== '') {
            displayName = localizedNoteAsName;
          }
        }
        
        if (displayName === '') {
          displayName = gf_raw.featId;
        }

        const noteText = getLocalizedString(gf_raw.note, lang);
        const finalNote = (displayName !== noteText && noteText && noteText.trim() !== '') ? noteText : undefined;
        
        return {
          featId: gf_raw.featId,
          name: displayName,
          note: finalNote,
          levelAcquired: gf_raw.levelAcquired
        };
      }),
      uiSections: uiSections,
      featChoiceFilters: featChoiceFilters ? featChoiceFilters.map(fcf => ({
        ...fcf,
        filterCases: fcf.filterCases.map(fc => ({
          ...fc,
          noteMustContain: getLocalizedString(fc.noteMustContain, lang)
        }))
      })) : undefined,
      classSpecificFeats: (classSpecificFeats || []).map(csf_raw => ({
        ...csf_raw,
        id: csf_raw.id, 
        label: getLocalizedString(csf_raw.label, lang), 
        description: getLocalizedString(csf_raw.description, lang) || '',
        effectsText: getLocalizedString(csf_raw.effectsText, lang) || '',
        effects: csf_raw.effects?.map(effect => {
          const localizedEffect = {...effect};
          if ('text' in localizedEffect && typeof localizedEffect.text === 'object' && localizedEffect.text !== null) {
            (localizedEffect as any).text = getLocalizedString(localizedEffect.text as LocalizedString, lang);
          }
          if ('sourceFeat' in localizedEffect && typeof localizedEffect.sourceFeat === 'object' && localizedEffect.sourceFeat !== null) {
            (localizedEffect as any).sourceFeat = getLocalizedString(localizedEffect.sourceFeat as LocalizedString, lang);
          }
          if ('name' in localizedEffect && typeof localizedEffect.name === 'object' && localizedEffect.name !== null) {
            (localizedEffect as any).name = getLocalizedString(localizedEffect.name as LocalizedString, lang);
          }
           if ('details' in localizedEffect && typeof localizedEffect.details === 'object' && localizedEffect.details !== null) {
            (localizedEffect as any).details = getLocalizedString(localizedEffect.details as LocalizedString, lang);
          }
          if ('note' in localizedEffect && typeof localizedEffect.note === 'object' && localizedEffect.note !== null) {
            (localizedEffect as any).note = getLocalizedString(localizedEffect.note as LocalizedString, lang);
          }
          return localizedEffect;
        })
      }))
    };
    return localizedClass;
  }).sort((a,b) => a.label.localeCompare(b.label));


  const DND_DEITIES_RAW = bundle.deities?.DND_DEITIES_DATA || [];
  const DND_DEITIES = DND_DEITIES_RAW.map(d_raw => ({
    id: d_raw.id,
    label: getLocalizedString(d_raw.label, lang),
    alignment: d_raw.alignment,
    fullName: getLocalizedString(d_raw.fullName, lang),
    attributes: (d_raw.attributes || []).map(attr => ({ 
        key: getLocalizedString(attr.key, lang), 
        value: getLocalizedString(attr.value, lang) 
    }))
  })).sort((a,b) => a.label.localeCompare(b.label));


  const DND_DOMAINS_RAW = bundle.domains?.DND_DOMAINS_DATA || [];
  const DND_DOMAINS = DND_DOMAINS_RAW.map(d_raw => ({
      id: d_raw.id,
      label: getLocalizedString(d_raw.label, lang),
      description: getLocalizedString(d_raw.description, lang),
      grantedPowerDescription: getLocalizedString(d_raw.grantedPowerDescription, lang),
      grantedPowerFeatId: d_raw.grantedPowerFeatId,
      domainSpells: (d_raw.domainSpells || []).map(ds => ({
          ...ds, 
          spellName: getLocalizedString(ds.spellName, lang) || ds.spellId 
      })),
      deityAlignmentRestrictions: d_raw.deityAlignmentRestrictions
  })).sort((a,b) => a.label.localeCompare(b.label));


  const DND_MAGIC_SCHOOLS_RAW = bundle.magicSchools?.DND_MAGIC_SCHOOLS_DATA || [];
  const DND_MAGIC_SCHOOLS = DND_MAGIC_SCHOOLS_RAW.map(ms_raw => ({
    id: ms_raw.id,
    label: getLocalizedString(ms_raw.label, lang),
    description: getLocalizedString(ms_raw.description, lang) || ''
  })).sort((a,b) => a.label.localeCompare(b.label));

  const SKILL_DEFINITIONS_RAW = bundle.skills?.SKILL_DEFINITIONS_DATA || [];
  const SKILL_DEFINITIONS = SKILL_DEFINITIONS_RAW.map(sd_raw => ({
    id: sd_raw.id,
    label: getLocalizedString(sd_raw.label, lang),
    keyAbility: sd_raw.keyAbility as AbilityName,
    description: getLocalizedString(sd_raw.description, lang) || ''
  })).sort((a,b) => a.label.localeCompare(b.label));


  const FEAT_TYPES_RAW = bundle.commonFeats?.FEAT_TYPES_DATA || [];
  const FEAT_TYPES = FEAT_TYPES_RAW.map(ft_raw => ({
     id: ft_raw.id, label: getLocalizedString(ft_raw.label, lang)
  })).sort((a,b) => a.label.localeCompare(b.label));

  const ABILITY_LABELS_RAW = bundle.base?.ABILITY_LABELS_DATA || [];
  const ABILITY_LABELS = ABILITY_LABELS_RAW.map(al_raw => ({
    id: al_raw.id, label: getLocalizedString(al_raw.label, lang), abbr: al_raw.abbr
  })); 

  const SAVING_THROW_LABELS_RAW = bundle.base?.SAVING_THROW_LABELS_DATA || [];
  const SAVING_THROW_LABELS = SAVING_THROW_LABELS_RAW.map(stl_raw => ({
    id: stl_raw.id, label: getLocalizedString(stl_raw.label, lang)
  })); 

  const DAMAGE_REDUCTION_TYPES_RAW = bundle.base?.DAMAGE_REDUCTION_TYPES_DATA || [];
  const DAMAGE_REDUCTION_TYPES = DAMAGE_REDUCTION_TYPES_RAW.map(drt_raw => ({
    id: drt_raw.id, label: getLocalizedString(drt_raw.label, lang)
  })).sort((a,b) => a.label.localeCompare(b.label));

  const DAMAGE_REDUCTION_RULES_OPTIONS_RAW = bundle.base?.DAMAGE_REDUCTION_RULES_OPTIONS_DATA || [];
  const DAMAGE_REDUCTION_RULES_OPTIONS = DAMAGE_REDUCTION_RULES_OPTIONS_RAW.map(drr_raw => ({
    id: drr_raw.id, label: getLocalizedString(drr_raw.label, lang)
  })).sort((a,b) => a.label.localeCompare(b.label));

  const specificAlignmentOptions = ALIGNMENTS.map(a => ({ id: a.id, label: a.label }));
  const genericAlignmentOptions_RAW = bundle.base?.ALIGNMENT_PREREQUISITE_GENERIC_LABELS_DATA || [];
  const genericAlignmentOptions = genericAlignmentOptions_RAW.map(ago_raw => ({
    id: ago_raw.id, label: getLocalizedString(ago_raw.label, lang)
  })).sort((a,b) => a.label.localeCompare(b.label));
  const ALIGNMENT_PREREQUISITE_OPTIONS = [...specificAlignmentOptions, ...genericAlignmentOptions].sort((a,b) => a.label.localeCompare(b.label));

  const UI_STRINGS: Record<string, string> = {};
  const uiStringsBundle = bundle.uiStrings || {};
  for (const key in uiStringsBundle) {
    UI_STRINGS[key] = getLocalizedString(uiStringsBundle[key], lang);
  }
  UI_STRINGS.currentLangCodeForNotesFallback = lang; 


  const DND_RACE_AGING_EFFECTS_DATA_PROCESSED: ProcessedSiteData['DND_RACE_AGING_EFFECTS_DATA'] = {};
  const rawAgingEffects = bundle.base?.DND_RACE_AGING_EFFECTS_DATA || {};
  for(const key in rawAgingEffects) {
    DND_RACE_AGING_EFFECTS_DATA_PROCESSED[key] = {
      categories: rawAgingEffects[key].categories.map(cat => ({
        ...cat,
        categoryName: getLocalizedString(cat.categoryName, lang)
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


    