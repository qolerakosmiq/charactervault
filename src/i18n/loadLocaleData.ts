
import type { LocaleDataBundle } from './i18n-data';
import type { LanguageCode } from './config';

export async function loadLocaleData(lang: LanguageCode): Promise<LocaleDataBundle> {
  const [
    alignments, base, classes, deities, feats, races, skills, languages, // Added languages
    customAlignments, customBase, customClasses, customDeities, customFeats, customRaces, customSkills, customLanguages, // Added customLanguages
    uiStrings, customUiStrings
  ] = await Promise.all([
    import(`../data/dnd-alignments${lang === 'en' ? '' : '-fr'}.json`),
    import(`../data/dnd-base${lang === 'en' ? '' : '-fr'}.json`),
    import(`../data/dnd-classes${lang === 'en' ? '' : '-fr'}.json`),
    import(`../data/dnd-deities${lang === 'en' ? '' : '-fr'}.json`),
    import(`../data/dnd-feats${lang === 'en' ? '' : '-fr'}.json`),
    import(`../data/dnd-races${lang === 'en' ? '' : '-fr'}.json`),
    import(`../data/dnd-skills${lang === 'en' ? '' : '-fr'}.json`),
    import(`../data/dnd-languages${lang === 'en' ? '' : '-fr'}.json`), // Added
    import(`../data/custom-alignments${lang === 'en' ? '' : '-fr'}.json`).catch(() => ({ ALIGNMENTS_DATA: [] })),
    import(`../data/custom-base${lang === 'en' ? '' : '-fr'}.json`).catch(() => ({})),
    import(`../data/custom-classes${lang === 'en' ? '' : '-fr'}.json`).catch(() => ({ DND_CLASSES_DATA: [] })),
    import(`../data/custom-deities${lang === 'en' ? '' : '-fr'}.json`).catch(() => ({ DND_DEITIES_DATA: [] })),
    import(`../data/custom-feats${lang === 'en' ? '' : '-fr'}.json`).catch(() => ({ DND_FEATS_DATA: [], FEAT_TYPES_DATA: [] })),
    import(`../data/custom-races${lang === 'en' ? '' : '-fr'}.json`).catch(() => ({ DND_RACES_DATA: [] })),
    import(`../data/custom-skills${lang === 'en' ? '' : '-fr'}.json`).catch(() => ({ SKILL_DEFINITIONS_DATA: [], CLASS_SKILLS_DATA: {}, CLASS_SKILL_POINTS_BASE_DATA: {}, SKILL_SYNERGIES_DATA: {} })),
    import(`../data/custom-languages${lang === 'en' ? '' : '-fr'}.json`).catch(() => ({ LANGUAGES_DATA: [] })), // Added
    import(`../data/ui-strings${lang === 'en' ? '' : '-fr'}.json`).catch(() => ({ UI_STRINGS_DATA: {} })),
    import(`../data/custom-ui-strings${lang === 'en' ? '' : '-fr'}.json`).catch(() => ({ UI_STRINGS_DATA: {} })),
  ]);

  return {
    alignments: alignments.default || alignments,
    base: base.default || base,
    classes: classes.default || classes,
    deities: deities.default || deities,
    feats: feats.default || feats,
    races: races.default || races,
    skills: skills.default || skills,
    languages: languages.default || languages, // Added
    uiStrings: uiStrings.default || uiStrings,
    customAlignments: customAlignments.default || customAlignments,
    customBase: customBase.default || customBase,
    customClasses: customClasses.default || customClasses,
    customDeities: customDeities.default || customDeities,
    customFeats: customFeats.default || customFeats,
    customRaces: customRaces.default || customRaces,
    customSkills: customSkills.default || customSkills,
    customLanguages: customLanguages.default || customLanguages, // Added
    customUiStrings: customUiStrings.default || customUiStrings,
  };
}
