
import type { LocaleDataBundle, RawClassDataEntry, RawUiStringsData, LocalizedString } from './i18n-data';
import type { LanguageCode } from './config';
import loaderManifest from '@/data/loader.json';

async function loadJson(path: string) {
  // Removed try-catch; if import fails, it will now throw an error and crash.
  const module = await import(`@/data/${path}.json`);
  return module.default || module;
}

export async function loadLocaleData(lang: LanguageCode): Promise<LocaleDataBundle> {
  const { commonDataFileConfigs, classFileNames, itemDataFileConfigs, uiStringFiles } = loaderManifest;

  const commonDataPromises = commonDataFileConfigs.map(config =>
    loadJson(config.path)
  );
  const classPromises = classFileNames.map(className => loadJson(`classes/${className}`));
  const itemDataPromises = itemDataFileConfigs.map(config =>
    loadJson(config.path)
  );
  const uiStringPromises = uiStringFiles.map(filePath => loadJson(filePath));

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

  // Ensure classDataResults is an array of RawClassDataEntry; if not, this will error, which is intended.
  bundle.allClasses = classDataResults as RawClassDataEntry[];

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

  // The bundle properties will now directly reflect what was loaded.
  // If a file was missing and loadJson crashed, we wouldn't reach here.
  // If a file was empty/malformed, subsequent processing in processRawDataBundle will likely fail.
  return bundle as LocaleDataBundle;
}
    