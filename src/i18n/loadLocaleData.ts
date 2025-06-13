
import type { LocaleDataBundle, RawClassDataEntry, RawUiStringsData, LocalizedString } from './i18n-data';
import type { LanguageCode } from './config';

// Helper for dynamic imports, assuming files are in 'src/data/'
// In a real Node.js/Next.js build environment, you might use 'fs' to list files.
// For this prototype, we'll simulate by listing expected files.

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

const commonDataFileConfigs = [
  { path: 'common/alignments', key: 'ALIGNMENTS_DATA', isArray: true },
  { path: 'common/base', isArray: false },
  { path: 'common/deities', key: 'DND_DEITIES_DATA', isArray: true },
  { path: 'common/domains', key: 'DND_DOMAINS_DATA', isArray: true },
  { path: 'common/languages', key: 'LANGUAGES_DATA', isArray: true },
  { path: 'common/magic-schools', key: 'DND_MAGIC_SCHOOLS_DATA', isArray: true },
  { path: 'common/races', key: 'DND_RACES_DATA', isArray: true },
  { path: 'common/skills', isArray: false },
  { path: 'common/xp', isArray: false },
  { path: 'feats/common-feats', isArray: false }
];


const classFileNames = [
  'barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk',
  'paladin', 'ranger', 'rogue', 'sorcerer', 'soulknife', 'wizard'
];

const uiStringFiles = [
  'ui/character-sheet', 'ui/dashboard', 'ui/dialogs', 'ui/forms', 'ui/general'
];


export async function loadLocaleData(lang: LanguageCode): Promise<LocaleDataBundle> {
  const commonDataPromises = commonDataFileConfigs.map(config => loadJson(config.path, config.isArray, config.key));
  const classPromises = classFileNames.map(className => loadJson(`classes/${className}`));
  const uiStringPromises = uiStringFiles.map(fileKey => loadJson(fileKey));

  const commonDataResults = await Promise.all(commonDataPromises);
  const classDataResults = await Promise.all(classPromises);
  const uiStringResults = await Promise.all(uiStringPromises);
  
  const bundle: Partial<LocaleDataBundle> = {};

  bundle.alignments = commonDataResults[0] as LocaleDataBundle['alignments'];
  bundle.base = commonDataResults[1] as LocaleDataBundle['base'];
  bundle.deities = commonDataResults[2] as LocaleDataBundle['deities'];
  bundle.domains = commonDataResults[3] as LocaleDataBundle['domains'];
  bundle.languages = commonDataResults[4] as LocaleDataBundle['languages'];
  bundle.magicSchools = commonDataResults[5] as LocaleDataBundle['magicSchools'];
  bundle.races = commonDataResults[6] as LocaleDataBundle['races'];
  bundle.skills = commonDataResults[7] as LocaleDataBundle['skills'];
  bundle.xpTable = commonDataResults[8] as LocaleDataBundle['xpTable'];
  bundle.commonFeats = commonDataResults[9] as LocaleDataBundle['commonFeats'];


  bundle.allClasses = classDataResults.filter(c => c && typeof c === 'object' && c.id) as RawClassDataEntry[]; // Check for 'id' now

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
    uiStrings: bundle.uiStrings || {},
  };

  return finalBundle;
}
