
// This file defines the structure of our raw locale data and how to process it.
import type {
  CharacterAlignment,
  CharacterSize,
  AbilityName,
  DndRaceId,
  DndClassId,
  DndDeityId,
  FeatDefinitionJsonData,
  SkillDefinitionJsonData,
  ClassSkillsJsonData,
  ClassSkillPointsBaseJsonData,
  SkillSynergiesJsonData,
  GenderId,
  SavingThrowType,
  DamageReductionTypeValue,
  DamageReductionRuleValue,
  FeatTypeString,
  ClassCastingDetails,
  CharacterSizeObject, // Assuming this will be used for processed sizes
  CharacterAlignmentObject, // Assuming this will be used for processed alignments
  DndRaceOption,
  DndClassOption,
  DndDeityOption
} from '@/types/character-core'; // We'll move core types here

// Define types for the structure of each JSON file's data
// These should match the *_DATA keys in your JSON files

// From dnd-alignments.json
export interface AlignmentDataEntry {
  value: CharacterAlignment;
  label: string;
  description: string;
}
export interface AlignmentsJson {
  ALIGNMENTS_DATA: AlignmentDataEntry[];
}

// From dnd-base.json
export interface SizeDataEntry {
  value: CharacterSize;
  label: string;
  acModifier: number;
  skillModifiers?: Record<string, number>;
  grappleDamage?: string;
}
export interface GenderDataEntry {
  value: string; // GenderId is a string
  label: string;
}
export interface AbilityLabelEntry {
  value: Exclude<AbilityName, 'none'>;
  label: string;
  abbr: string;
}
export interface SavingThrowLabelEntry {
  value: SavingThrowType;
  label: string;
}
export interface DamageReductionTypeEntry {
  value: DamageReductionTypeValue;
  label: string;
}
export interface DamageReductionRuleEntry {
  value: DamageReductionRuleValue;
  label: string;
}
export interface AlignmentPrerequisiteGenericLabelEntry {
  value: string;
  label: string;
}
export interface BaseJson {
  SIZES_DATA: SizeDataEntry[];
  GENDERS_DATA: GenderDataEntry[];
  DEFAULT_ABILITIES: Record<Exclude<AbilityName, 'none'>, number>;
  DEFAULT_SAVING_THROWS: Record<SavingThrowType, { base: number; magicMod: number; miscMod: number }>;
  DEFAULT_SPEED_DETAILS: { base: number; miscModifier: number };
  DEFAULT_SPEED_PENALTIES: { armorSpeedPenalty: number; loadSpeedPenalty: number };
  DND_RACE_MIN_ADULT_AGE_DATA: Record<string, number>;
  DND_RACE_BASE_MAX_AGE_DATA: Record<string, number>;
  RACE_TO_AGING_CATEGORY_MAP_DATA: Record<string, string>;
  DND_RACE_AGING_EFFECTS_DATA: Record<string, { categories: Array<{ categoryName: string; ageFactor: number; effects: Record<string, number> }> }>;
  DND_RACE_ABILITY_MODIFIERS_DATA: Record<string, Record<string, number>>;
  DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA: Record<string, number>;
  ABILITY_LABELS_DATA: AbilityLabelEntry[];
  SAVING_THROW_LABELS_DATA: SavingThrowLabelEntry[];
  DAMAGE_REDUCTION_TYPES_DATA: DamageReductionTypeEntry[];
  DAMAGE_REDUCTION_RULES_OPTIONS_DATA: DamageReductionRuleEntry[];
  ALIGNMENT_PREREQUISITE_GENERIC_LABELS_DATA: AlignmentPrerequisiteGenericLabelEntry[];
}

// From dnd-classes.json
export interface ClassDataEntry {
  value: DndClassId | string;
  label: string;
  hitDice: string;
  saves: { fortitude: 'good' | 'poor'; reflex: 'good' | 'poor'; will: 'good' | 'poor' };
  description: string;
  casting?: ClassCastingDetails;
  grantedFeats?: Array<{ featId: string; note?: string; levelAcquired?: number }>;
}
export interface ClassesJson {
  DND_CLASSES_DATA: ClassDataEntry[];
}

// From dnd-deities.json
export interface DeityDataEntry {
  value: DndDeityId | string;
  label: string;
  alignment: CharacterAlignment;
  description: string;
}
export interface DeitiesJson {
  DND_DEITIES_DATA: DeityDataEntry[];
}

// From dnd-feats.json
export interface FeatDataEntry extends FeatDefinitionJsonData {} // Assuming FeatDefinitionJsonData is suitable
export interface FeatTypeDataEntry {
  value: FeatTypeString;
  label: string;
}
export interface FeatsJson {
  DND_FEATS_DATA: FeatDataEntry[];
  FEAT_TYPES_DATA: FeatTypeDataEntry[];
}

// From dnd-races.json
export interface RaceDataEntry extends DndRaceOption {} // Assuming DndRaceOption is suitable
export interface RacesJson {
  DND_RACES_DATA: RaceDataEntry[];
}

// From dnd-skills.json
export interface SkillDefinitionDataEntry extends SkillDefinitionJsonData {} // Assuming SkillDefinitionJsonData is suitable
export interface SkillsJson {
  SKILL_DEFINITIONS_DATA: SkillDefinitionDataEntry[];
  CLASS_SKILLS_DATA: ClassSkillsJsonData;
  CLASS_SKILL_POINTS_BASE_DATA: ClassSkillPointsBaseJsonData;
  SKILL_SYNERGIES_DATA: SkillSynergiesJsonData;
}

// Bundle of all raw locale data (content of JSON files)
export interface LocaleDataBundle {
  alignments: AlignmentsJson;
  base: BaseJson;
  classes: ClassesJson;
  deities: DeitiesJson;
  feats: FeatsJson;
  races: RacesJson;
  skills: SkillsJson;
  // Custom data files (can be optional or empty if not always present/translated)
  customAlignments?: AlignmentsJson; // Assuming same structure
  customBase?: Partial<BaseJson>; // Could be partial if only overriding some base values
  customClasses?: ClassesJson;
  customDeities?: DeitiesJson;
  customFeats?: FeatsJson;
  customRaces?: RacesJson;
  customSkills?: SkillsJson;
}

// Fully processed data structures that components will use
export interface ProcessedSiteData {
  ALIGNMENTS: readonly CharacterAlignmentObject[];
  SIZES: readonly CharacterSizeObject[];
  GENDERS: readonly { value: GenderId | string; label: string }[];
  DND_RACES: readonly DndRaceOption[];
  DND_CLASSES: readonly DndClassOption[];
  DND_DEITIES: readonly DndDeityOption[];
  SKILL_DEFINITIONS: readonly SkillDefinitionJsonData[];
  DND_FEATS_DEFINITIONS: readonly FeatDefinitionJsonData[];
  FEAT_TYPES: readonly { value: FeatTypeString; label: string }[];
  ABILITY_LABELS: readonly AbilityLabelEntry[];
  SAVING_THROW_LABELS: readonly SavingThrowLabelEntry[];
  DAMAGE_REDUCTION_TYPES: readonly DamageReductionTypeEntry[];
  DAMAGE_REDUCTION_RULES_OPTIONS: readonly DamageReductionRuleEntry[];
  ALIGNMENT_PREREQUISITE_OPTIONS: readonly { value: string; label: string }[];
  // Also include raw data parts needed for lookups, e.g.:
  DND_RACE_MIN_ADULT_AGE_DATA: BaseJson['DND_RACE_MIN_ADULT_AGE_DATA'];
  DND_RACE_BASE_MAX_AGE_DATA: BaseJson['DND_RACE_BASE_MAX_AGE_DATA'];
  RACE_TO_AGING_CATEGORY_MAP_DATA: BaseJson['RACE_TO_AGING_CATEGORY_MAP_DATA'];
  DND_RACE_AGING_EFFECTS_DATA: BaseJson['DND_RACE_AGING_EFFECTS_DATA'];
  DND_RACE_ABILITY_MODIFIERS_DATA: BaseJson['DND_RACE_ABILITY_MODIFIERS_DATA'];
  DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA: BaseJson['DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA'];
  CLASS_SKILLS: SkillsJson['CLASS_SKILLS_DATA'];
  CLASS_SKILL_POINTS_BASE: SkillsJson['CLASS_SKILL_POINTS_BASE_DATA'];
  SKILL_SYNERGIES: SkillsJson['SKILL_SYNERGIES_DATA'];
}

// Helper to merge base and custom data
function mergeArrayData<T extends { value: string }>(base: T[] = [], custom?: T[]): T[] {
  if (!custom) return base;
  const combinedMap = new Map<string, T>();
  base.forEach(item => combinedMap.set(item.value, item));
  custom.forEach(item => combinedMap.set(item.value, item));
  return Array.from(combinedMap.values()).sort((a, b) => a.label.localeCompare(b.label || ''));
}

function mergeObjectData<T extends Record<string, any>>(base: T, custom?: Partial<T>): T {
  return { ...base, ...custom };
}

// Processing function
export function processRawDataBundle(bundle: LocaleDataBundle): ProcessedSiteData {
  const baseAlignments = bundle.alignments.ALIGNMENTS_DATA;
  const customAlignments = bundle.customAlignments?.ALIGNMENTS_DATA;
  const ALIGNMENTS = mergeArrayData(baseAlignments, customAlignments);

  const baseSizes = bundle.base.SIZES_DATA;
  const customSizes = bundle.customBase?.SIZES_DATA;
  const SIZES = mergeArrayData(baseSizes, customSizes);

  const baseGenders = bundle.base.GENDERS_DATA;
  const customGenders = bundle.customBase?.GENDERS_DATA;
  const GENDERS = mergeArrayData(baseGenders, customGenders);

  const baseRaces = bundle.races.DND_RACES_DATA;
  const customRaces = bundle.customRaces?.DND_RACES_DATA;
  const DND_RACES = mergeArrayData(baseRaces, customRaces);

  const baseClasses = bundle.classes.DND_CLASSES_DATA;
  const customClasses = bundle.customClasses?.DND_CLASSES_DATA;
  const DND_CLASSES = mergeArrayData(baseClasses, customClasses);

  const baseDeities = bundle.deities.DND_DEITIES_DATA;
  const customDeities = bundle.customDeities?.DND_DEITIES_DATA;
  const DND_DEITIES = mergeArrayData(baseDeities, customDeities);

  const baseSkills = bundle.skills.SKILL_DEFINITIONS_DATA;
  const customSkills = bundle.customSkills?.SKILL_DEFINITIONS_DATA;
  const SKILL_DEFINITIONS = mergeArrayData(baseSkills, customSkills);

  const baseFeats = bundle.feats.DND_FEATS_DATA;
  const customFeats = bundle.customFeats?.DND_FEATS_DATA;
  const DND_FEATS_DEFINITIONS = mergeArrayData(baseFeats, customFeats);

  const FEAT_TYPES = bundle.feats.FEAT_TYPES_DATA;
  const ABILITY_LABELS = bundle.base.ABILITY_LABELS_DATA;
  const SAVING_THROW_LABELS = bundle.base.SAVING_THROW_LABELS_DATA;
  const DAMAGE_REDUCTION_TYPES = bundle.base.DAMAGE_REDUCTION_TYPES_DATA;
  const DAMAGE_REDUCTION_RULES_OPTIONS = bundle.base.DAMAGE_REDUCTION_RULES_OPTIONS_DATA;
  
  const specificAlignmentOptions = ALIGNMENTS.map(a => ({ value: a.value, label: a.label }));
  const genericAlignmentOptions = bundle.base.ALIGNMENT_PREREQUISITE_GENERIC_LABELS_DATA;
  const ALIGNMENT_PREREQUISITE_OPTIONS = [...specificAlignmentOptions, ...genericAlignmentOptions].sort((a,b) => a.label.localeCompare(b.label));

  return {
    ALIGNMENTS,
    SIZES,
    GENDERS,
    DND_RACES,
    DND_CLASSES,
    DND_DEITIES,
    SKILL_DEFINITIONS,
    DND_FEATS_DEFINITIONS,
    FEAT_TYPES,
    ABILITY_LABELS,
    SAVING_THROW_LABELS,
    DAMAGE_REDUCTION_TYPES,
    DAMAGE_REDUCTION_RULES_OPTIONS,
    ALIGNMENT_PREREQUISITE_OPTIONS,
    // Raw data passthrough
    DND_RACE_MIN_ADULT_AGE_DATA: mergeObjectData(bundle.base.DND_RACE_MIN_ADULT_AGE_DATA, bundle.customBase?.DND_RACE_MIN_ADULT_AGE_DATA),
    DND_RACE_BASE_MAX_AGE_DATA: mergeObjectData(bundle.base.DND_RACE_BASE_MAX_AGE_DATA, bundle.customBase?.DND_RACE_BASE_MAX_AGE_DATA),
    RACE_TO_AGING_CATEGORY_MAP_DATA: mergeObjectData(bundle.base.RACE_TO_AGING_CATEGORY_MAP_DATA, bundle.customBase?.RACE_TO_AGING_CATEGORY_MAP_DATA),
    DND_RACE_AGING_EFFECTS_DATA: mergeObjectData(bundle.base.DND_RACE_AGING_EFFECTS_DATA, bundle.customBase?.DND_RACE_AGING_EFFECTS_DATA),
    DND_RACE_ABILITY_MODIFIERS_DATA: mergeObjectData(bundle.base.DND_RACE_ABILITY_MODIFIERS_DATA, bundle.customBase?.DND_RACE_ABILITY_MODIFIERS_DATA),
    DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA: mergeObjectData(bundle.base.DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA, bundle.customBase?.DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA),
    CLASS_SKILLS: mergeObjectData(bundle.skills.CLASS_SKILLS_DATA, bundle.customSkills?.CLASS_SKILLS_DATA),
    CLASS_SKILL_POINTS_BASE: mergeObjectData(bundle.skills.CLASS_SKILL_POINTS_BASE_DATA, bundle.customSkills?.CLASS_SKILL_POINTS_BASE_DATA),
    SKILL_SYNERGIES: mergeObjectData(bundle.skills.SKILL_SYNERGIES_DATA, bundle.customSkills?.SKILL_SYNERGIES_DATA),
  };
}
