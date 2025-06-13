
import type { LocaleDataBundle, RawClassDataEntry, RawUiStringsData } from './i18n-data';
import type { LanguageCode } from './config';

// Helper for dynamic imports, assuming files are in 'src/data/'
// In a real Node.js/Next.js build environment, you might use 'fs' to list files.
// For this prototype, we'll simulate by listing expected files.

async function loadJson(path: string) {
  try {
    const module = await import(`@/data/${path}.json`);
    return module.default || module;
  } catch (e) {
    console.warn(`Could not load ${path}.json, returning empty object/array as fallback.`);
    if (path.includes("CLASSES_DATA") || path.includes("FEATS_DATA") || path.includes("DATA") || path.includes("TABLE_DATA") || path.includes("RULES_OPTIONS_DATA") || path.includes("SCHOOLS_DATA") || path.endsWith("_DATA")) { // Heuristic for arrays
        const key = path.split('/').pop()?.toUpperCase() || 'DATA';
        if (key.endsWith("_DATA")) return { [key]: [] }; // e.g. { DND_CLASSES_DATA: [] }
        return []; // Fallback for direct array files if any
    }
    return {}; // Fallback for object files
  }
}

// List of common data files (excluding class-specific files and UI string files)
const commonDataFiles = [
  'common/alignments', 'common/base', 'common/deities', 'common/domains',
  'common/languages', 'common/magic-schools', 'common/races', 'common/skills', 'common/xp',
  'feats/common-feats'
];

const classFileNames = [
  'barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk',
  'paladin', 'ranger', 'rogue', 'sorcerer', 'soulknife', 'wizard'
];

const uiStringFiles = [
  'ui/character-sheet', 'ui/dashboard', 'ui/dialogs', 'ui/forms', 'ui/general'
];


export async function loadLocaleData(lang: LanguageCode): Promise<LocaleDataBundle> {
  const dataPromises = commonDataFiles.map(fileKey => loadJson(fileKey));
  const classPromises = classFileNames.map(className => loadJson(`classes/${className}`));
  const uiStringPromises = uiStringFiles.map(fileKey => loadJson(fileKey));

  const [
    alignments, base, deities, domains, languages, magicSchools, races, skills, xpTable, commonFeatsData,
    ...classDataResults // This will be an array of class data objects
  ] = await Promise.all(dataPromises.concat(classPromises));

  const uiStringResults = await Promise.all(uiStringPromises);

  const allLoadedClasses: RawClassDataEntry[] = classDataResults.filter(c => c && c.value); // Filter out any failed loads

  const mergedUiStrings: RawUiStringsData = uiStringResults.reduce((acc, current) => {
    // Ensure current is an object and not an array or undefined
    if (current && typeof current === 'object' && !Array.isArray(current)) {
        // Assuming each UI file has a top-level object with string keys
        // For example, general.json might be { general: { save: "Save", ... } }
        // Or it might be directly { save: "Save" }
        // We need to merge these intelligently. If keys clash, last one wins.
        // A simple shallow merge for now.
        for (const key in current) {
            if (Object.prototype.hasOwnProperty.call(current, key) && typeof current[key] === 'object') {
                 acc[key] = { ...acc[key], ...current[key] }; // If ui files have sub-objects
            } else {
                 acc[key] = current[key]; // If ui files are flat
            }
        }
    }
    return acc;
  }, {});


  return {
    alignments,
    base,
    allClasses: allLoadedClasses, // Array of class definitions
    deities,
    commonFeats: commonFeatsData, // Contains DND_FEATS_DATA and FEAT_TYPES_DATA
    races,
    skills,
    languages,
    xpTable,
    domains,
    magicSchools,
    uiStrings: mergedUiStrings, // Merged UI strings
  };
}
