
import type { LocaleDataBundle, RawClassDataEntry, RawUiStringsData, LocalizedString } from './i18n-data';
import type { LanguageCode } from './config';
import loaderManifest from '@/data/loader.json';

async function loadJson(path: string, isArrayDataFile: boolean = false, expectedKey?: string) {
  try {
    const module = await import(`@/data/${path}.json`);
    return module.default || module;
  } catch (e) {
    console.warn(`Could not load ${path}.json, returning fallback.`);
    if (isArrayDataFile && expectedKey) {
        return { [expectedKey]: [] };
    }
    return {};
  }
}

export async function loadLocaleData(lang: LanguageCode): Promise<LocaleDataBundle> {
  const { commonDataFileConfigs, classFileNames, itemDataFileConfigs, uiStringFiles } = loaderManifest;

  const commonDataPromises = commonDataFileConfigs.map(config =>
    loadJson(config.path, config.isArrayDataFile, config.key)
  );
  const classPromises = classFileNames.map(className => loadJson(`classes/${className}`));
  const itemDataPromises = itemDataFileConfigs.map(config =>
    loadJson(config.path, config.isArrayDataFile, config.key)
  );
  const uiStringPromises = uiStringFiles.map(filePath => loadJson(filePath)); // filePath is already "ui/filename"

  const [
    commonDataResults,
    classDataResults,
    itemDataResults,
    uiStringResults
  ] = await Promise.all([
    Promise.all(commonDataPromises),
    Promise.all(classPromises),
    Promise.all(itemDataPromises),
    Promise.all(uiStringPromises)
  ]);

  const bundle: Partial<LocaleDataBundle> = {};

  commonDataFileConfigs.forEach((config, index) => {
    (bundle as any)[config.bundleKey] = commonDataResults[index];
  });

  bundle.allClasses = classDataResults.filter(c => c && typeof c === 'object' && (c as any).id) as RawClassDataEntry[];

  itemDataFileConfigs.forEach((config, index) => {
    (bundle as any)[config.bundleKey] = itemDataResults[index] as any;
  });

  const mergedUiStrings: RawUiStringsData = uiStringResults.reduce((acc, currentFileContent) => {
    if (currentFileContent && typeof currentFileContent === 'object' && !Array.isArray(currentFileContent)) {
        for (const key in currentFileContent) {
            if (Object.prototype.hasOwnProperty.call(currentFileContent, key)) {
                 acc[key] = currentFileContent[key] as LocalizedString;
            }
        }
    }
    return acc;
  }, {});
  bundle.uiStrings = mergedUiStrings;

  // Ensure all expected keys exist on the bundle, even if files were missing
  const finalBundle: LocaleDataBundle = {
    alignments: bundle.alignments || { ALIGNMENTS_DATA: [] },
    base: bundle.base || {
        SIZES_DATA: [], GENDERS_DATA: [], DEFAULT_ABILITIES_DATA: {} as any, DEFAULT_SAVING_THROWS_DATA: {} as any,
        DEFAULT_RESISTANCE_VALUE_DATA: {} as any, DEFAULT_SPEED_DETAILS_DATA: {} as any, DEFAULT_SPEED_PENALTIES_DATA: {} as any,
        DND_RACE_MIN_ADULT_AGE_DATA: {}, DND_RACE_BASE_MAX_AGE_DATA: {}, RACE_TO_AGING_CATEGORY_MAP_DATA: {},
        DND_RACE_AGING_EFFECTS_DATA: {}, DND_RACE_ABILITY_MODIFIERS_DATA: {}, DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA: {},
        ABILITY_LABELS_DATA: [], SAVING_THROW_LABELS_DATA: [], DAMAGE_REDUCTION_TYPES_DATA: [],
        DAMAGE_REDUCTION_RULES_OPTIONS_DATA: [], ALIGNMENT_PREREQUISITE_GENERIC_LABELS_DATA: []
    },
    allClasses: bundle.allClasses || [],
    deities: bundle.deities || { DND_DEITIES_DATA: [] },
    commonFeats: bundle.commonFeats || { DND_FEATS_DATA: [], FEAT_TYPES_DATA: [] },
    races: bundle.races || { DND_RACES_DATA: [] },
    skills: bundle.skills || { SKILL_DEFINITIONS_DATA: [], CLASS_SKILLS_DATA: {}, CLASS_SKILL_POINTS_BASE_DATA: {}, SKILL_SYNERGIES_DATA: {} },
    languages: bundle.languages || { LANGUAGES_DATA: [] },
    xpTable: bundle.xpTable || { XP_TABLE_DATA: [], EPIC_LEVEL_XP_INCREASE: 0 },
    domains: bundle.domains || { DND_DOMAINS_DATA: [] },
    magicSchools: bundle.magicSchools || { DND_MAGIC_SCHOOLS_DATA: [] },
    gearSlots: bundle.gearSlots || { GEAR_SLOTS_DATA: [] },
    item_definitions_weapons: bundle.item_definitions_weapons || { ITEM_DEFINITIONS_WEAPONS_DATA: [] },
    item_definitions_armor: bundle.item_definitions_armor || { ITEM_DEFINITIONS_ARMOR_DATA: [] },
    item_definitions_shields: bundle.item_definitions_shields || { ITEM_DEFINITIONS_SHIELDS_DATA: [] },
    item_definitions_magic_items: bundle.item_definitions_magic_items || { ITEM_DEFINITIONS_MAGIC_ITEMS_DATA: [] },
    uiStrings: bundle.uiStrings || {},
  };

  return finalBundle;
}
    