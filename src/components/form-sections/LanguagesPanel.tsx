
'use client';

import *as React from 'react';
import type { Character, DndRaceId, AbilityScores, LanguageId, LanguageOption, Skill } from '@/types/character';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ComboboxPrimitive } from '@/components/ui/combobox';
import { Badge } from '@/components/ui/badge';
import { Languages as LanguagesIcon, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { useI18n } from '@/context/I18nProvider';
import { calculateAbilityModifier } from '@/lib/dnd-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper';
import { cn } from '@/lib/utils';

export interface LanguagesPanelProps {
  characterLanguages: LanguageId[];
  onLanguagesChange: (updatedLanguages: LanguageId[]) => void;
  characterRaceId: DndRaceId | '';
  characterIntelligenceScore: number;
  speakLanguageSkillRanks: number;
}

const LanguagesPanelComponent: React.FC<LanguagesPanelProps> = ({
  characterLanguages,
  onLanguagesChange,
  characterRaceId,
  characterIntelligenceScore,
  speakLanguageSkillRanks,
}) => {
  const { translations, isLoading: translationsLoading } = useI18n();
  const [selectedLanguageToAdd, setSelectedLanguageToAdd] = React.useState<string>('');

  const { LANGUAGES, DND_RACES, UI_STRINGS } = translations || {};

  const automaticLanguages = React.useMemo(() => {
    if (!DND_RACES) return ['common'];
    const raceData = DND_RACES.find(r => r.id === characterRaceId);
    return ['common', ...(raceData?.automaticLanguages || [])];
  }, [DND_RACES, characterRaceId]);
  
  const intBonusLanguages = React.useMemo(() => Math.max(0, calculateAbilityModifier(characterIntelligenceScore)), [characterIntelligenceScore]);
  const skillBonusLanguages = React.useMemo(() => speakLanguageSkillRanks, [speakLanguageSkillRanks]);
  
  const totalBonusLanguageSlots = React.useMemo(() => intBonusLanguages + skillBonusLanguages, [intBonusLanguages, skillBonusLanguages]);

  const chosenPlayerLanguages = React.useMemo(() => characterLanguages.filter(lang => !automaticLanguages.includes(lang)), [characterLanguages, automaticLanguages]);
  const slotsUsed = React.useMemo(() => chosenPlayerLanguages.length, [chosenPlayerLanguages]);
  const slotsRemaining = React.useMemo(() => totalBonusLanguageSlots - slotsUsed, [totalBonusLanguageSlots, slotsUsed]);

  const allKnownLanguageIds = React.useMemo(() => Array.from(new Set([...automaticLanguages, ...characterLanguages])), [automaticLanguages, characterLanguages]);
  
  const allKnownLanguagesToDisplay = React.useMemo(() => {
    if (!LANGUAGES) return [];
    return LANGUAGES
      .filter(lang => allKnownLanguageIds.includes(lang.id))
      .sort((a, b) => {
        const isAAutomatic = automaticLanguages.includes(a.id);
        const isBAutomatic = automaticLanguages.includes(b.id);
        if (isAAutomatic && !isBAutomatic) return -1;
        if (!isAAutomatic && isBAutomatic) return 1;
        return a.label.localeCompare(b.label);
      });
  }, [LANGUAGES, allKnownLanguageIds, automaticLanguages]);


  const availableLanguagesForAdding = React.useMemo(() => {
    if (!LANGUAGES) return [];
    return LANGUAGES.filter(
      lang => !allKnownLanguageIds.includes(lang.id) && lang.id !== 'druidic' // Druidic is secret
    ).sort((a,b) => a.label.localeCompare(b.label))
    .map(lang => ({ value: lang.id, label: lang.label }));
  }, [LANGUAGES, allKnownLanguageIds]);

  const handleAddLanguage = React.useCallback(() => {
    if (selectedLanguageToAdd && !allKnownLanguageIds.includes(selectedLanguageToAdd)) {
      onLanguagesChange([...characterLanguages, selectedLanguageToAdd]);
      setSelectedLanguageToAdd('');
    }
  }, [selectedLanguageToAdd, allKnownLanguageIds, characterLanguages, onLanguagesChange]);

  const handleRemoveLanguage = React.useCallback((languageIdToRemove: LanguageId) => {
    if (automaticLanguages.includes(languageIdToRemove)) return; 
    onLanguagesChange(characterLanguages.filter(langId => langId !== languageIdToRemove));
  }, [automaticLanguages, characterLanguages, onLanguagesChange]);

  if (translationsLoading || !UI_STRINGS || !LANGUAGES || !DND_RACES) {
    return (
      <LockablePanelWrapper
        title={UI_STRINGS?.languagesPanelTitle || "Languages"}
        description={UI_STRINGS?.languagesPanelDescription || "Manage your character's known languages."}
        icon={LanguagesIcon}
        initialLockedState={false}
      >
        {() => (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full mb-2" /> 
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
      </LockablePanelWrapper>
    );
  }


  return (
    <LockablePanelWrapper
      title={UI_STRINGS.languagesPanelTitle || "Languages"}
      description={UI_STRINGS.languagesPanelDescription || "Manage your character's known languages."}
      icon={LanguagesIcon}
      initialLockedState={false}
      cardContentClassName="space-y-4"
    >
      {({ isLocked: panelIsLocked }) => (
        <>
          <div className="mb-4 p-3 border rounded-md bg-muted/30">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">
                {UI_STRINGS.languagesPanelSlotsAvailableLabel || "Languages Available: "}<span className="text-xl font-bold text-primary">{totalBonusLanguageSlots}</span>
              </p>
              <p className="text-sm font-medium">
                {UI_STRINGS.languagesPanelSlotsLeftLabel || "Languages Left: "}<span className={cn(
                  "text-xl font-bold",
                  slotsRemaining > 0 && "text-emerald-500",
                  slotsRemaining < 0 && "text-destructive",
                  slotsRemaining === 0 && "text-accent"
                )}>{slotsRemaining}</span>
              </p>
            </div>
             <p className="text-xs text-muted-foreground mt-1">
                {UI_STRINGS.languagesPanelFormulaIntModLabel || "Intelligence Modifier"}{'\u00A0'}<Badge variant="outline">{intBonusLanguages}</Badge>
                {' + '}{UI_STRINGS.languagesPanelFormulaSkillRanksLabel || "Speak Language Ranks"}{'\u00A0'}<Badge variant="outline">{skillBonusLanguages}</Badge>
                {' = '}<span className="font-bold text-primary">{totalBonusLanguageSlots}</span>
              </p>
          </div>

          <div>
            {allKnownLanguagesToDisplay.length > 0 ? (
              <div className="mt-1"> 
                {allKnownLanguagesToDisplay.map(langObj => {
                  const isAutomatic = automaticLanguages.includes(langObj.id);
                  return (
                    <div key={`known-${langObj.id}`} className="flex items-center justify-between py-1 px-1.5 rounded-md text-sm"> 
                      <span>
                        {langObj.label}
                        {isAutomatic && <>{'\u00A0'}<Badge variant="outline" className="text-muted-foreground border-muted-foreground/50">{UI_STRINGS.languagesPanelAutomaticBadgeLabel || "Automatic"}</Badge></>}
                      </span>
                      {!isAutomatic && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive/80"
                          onClick={() => handleRemoveLanguage(langObj.id)}
                          aria-label={(UI_STRINGS.languagesPanelRemoveAriaLabel || "Remove {languageName}").replace("{languageName}", langObj.label)}
                          disabled={panelIsLocked}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
               <p className="text-xs text-muted-foreground italic mt-1">{UI_STRINGS.languagesPanelNoLanguagesKnown || "No languages currently known."}</p>
            )}
          </div>

          <div className="mt-4 pt-4 border-t">
            <Label htmlFor="add-language-combobox" className="text-sm font-medium">{UI_STRINGS.languagesPanelAddButton || "Add Language"}</Label>
            <div className="flex items-center gap-2 mt-1">
              <ComboboxPrimitive
                options={availableLanguagesForAdding}
                value={selectedLanguageToAdd}
                onChange={setSelectedLanguageToAdd}
                placeholder={UI_STRINGS.languagesPanelComboboxPlaceholder || "Select language..."}
                searchPlaceholder={UI_STRINGS.languagesPanelComboboxSearch || "Search languages..."}
                emptyPlaceholder={UI_STRINGS.languagesPanelComboboxEmpty || "No language found."}
                triggerClassName="h-9 text-sm"
                disabled={panelIsLocked || slotsRemaining <= 0}
              />
              <Button type="button" onClick={handleAddLanguage} size="sm" disabled={!selectedLanguageToAdd || panelIsLocked || slotsRemaining <= 0}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add
              </Button>
            </div>
          </div>
        </>
      )}
    </LockablePanelWrapper>
  );
};
LanguagesPanelComponent.displayName = "LanguagesPanelComponent";
export const LanguagesPanel = React.memo(LanguagesPanelComponent);
