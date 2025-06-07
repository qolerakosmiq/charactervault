
'use client';

import *as React from 'react';
import type { Character, DndRaceId, AbilityScores, LanguageId, LanguageOption, Skill } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ComboboxPrimitive } from '@/components/ui/combobox';
import { Badge } from '@/components/ui/badge';
import { Languages as LanguagesIcon, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { useI18n } from '@/context/I18nProvider';
import { calculateAbilityModifier } from '@/lib/dnd-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LanguagesPanelProps {
  characterLanguages: LanguageId[];
  onLanguagesChange: (updatedLanguages: LanguageId[]) => void;
  characterRaceId: DndRaceId | '';
  characterIntelligenceScore: number;
  speakLanguageSkillRanks: number;
}

export const LanguagesPanel: React.FC<LanguagesPanelProps> = ({
  characterLanguages,
  onLanguagesChange,
  characterRaceId,
  characterIntelligenceScore,
  speakLanguageSkillRanks,
}) => {
  const { translations, isLoading: translationsLoading } = useI18n();
  const [selectedLanguageToAdd, setSelectedLanguageToAdd] = React.useState<string>('');

  if (translationsLoading || !translations) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <LanguagesIcon className="h-8 w-8 text-primary" />
            <Skeleton className="h-7 w-32" />
          </div>
          <Skeleton className="h-4 w-3/4 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-1/2 mb-2" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const { LANGUAGES, DND_RACES, UI_STRINGS } = translations;

  const raceData = DND_RACES.find(r => r.value === characterRaceId);
  const automaticLanguages: LanguageId[] = ['common', ...(raceData?.automaticLanguages || [])];
  
  const knownAutomaticLanguagesToDisplay = LANGUAGES.filter(lang => automaticLanguages.includes(lang.value));

  const intBonusLanguages = Math.max(0, calculateAbilityModifier(characterIntelligenceScore));
  const skillBonusLanguages = speakLanguageSkillRanks;
  const raceBonusLanguages = raceData?.bonusLanguageChoices && raceData.bonusLanguageChoices.length > 0 ? 1 : 0; // Simplified: if choices exist, 1 slot
  
  const totalBonusLanguageSlots = intBonusLanguages + skillBonusLanguages + raceBonusLanguages;

  const chosenPlayerLanguages = characterLanguages.filter(lang => !automaticLanguages.includes(lang));
  const slotsUsed = chosenPlayerLanguages.length;
  const slotsRemaining = totalBonusLanguageSlots - slotsUsed;

  const allKnownLanguageIds = Array.from(new Set([...automaticLanguages, ...characterLanguages]));
  const allKnownLanguagesToDisplay = LANGUAGES.filter(lang => allKnownLanguageIds.includes(lang.value))
    .sort((a,b) => a.label.localeCompare(b.label));


  const availableLanguagesForAdding = LANGUAGES.filter(
    lang => !allKnownLanguageIds.includes(lang.value) && lang.value !== 'druidic' // Exclude Druidic from general selection
  ).sort((a,b) => a.label.localeCompare(b.label));

  const handleAddLanguage = () => {
    if (selectedLanguageToAdd && !allKnownLanguageIds.includes(selectedLanguageToAdd)) {
      onLanguagesChange([...characterLanguages, selectedLanguageToAdd]);
      setSelectedLanguageToAdd('');
    }
  };

  const handleRemoveLanguage = (languageIdToRemove: LanguageId) => {
    if (automaticLanguages.includes(languageIdToRemove)) return; // Cannot remove automatic languages
    onLanguagesChange(characterLanguages.filter(langId => langId !== languageIdToRemove));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <LanguagesIcon className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl font-serif">{UI_STRINGS.languagesPanelTitle || "Languages"}</CardTitle>
        </div>
        <CardDescription>{UI_STRINGS.languagesPanelDescription || "Manage your character's known languages."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">{UI_STRINGS.languagesPanelKnownAutomatic || "Automatic:"}</Label>
          {knownAutomaticLanguagesToDisplay.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-1">
              {knownAutomaticLanguagesToDisplay.map(lang => (
                <Badge key={`auto-${lang.value}`} variant="secondary">{lang.label}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">{UI_STRINGS.infoDialogNone || "None"}</p>
          )}
        </div>

        <div>
          <Label className="text-sm font-medium text-muted-foreground">{UI_STRINGS.languagesPanelSlotsAvailable || "Bonus Language Slots:"}</Label>
          <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
            {raceBonusLanguages > 0 && <p>{raceBonusLanguages} {UI_STRINGS.languagesPanelSlotsFromRace || "from Race"}</p>}
            <p>{intBonusLanguages} {UI_STRINGS.languagesPanelSlotsFromInt || "from Intelligence"}</p>
            <p>{skillBonusLanguages} {UI_STRINGS.languagesPanelSlotsFromSkill || "from Speak Language skill"}</p>
            <p className="font-semibold">{UI_STRINGS.languagesPanelSlotsTotal || "Total Slots:"} <span className="text-primary">{totalBonusLanguageSlots}</span></p>
            <p>{UI_STRINGS.languagesPanelSlotsUsed || "Slots Used:"} <span className="text-primary">{slotsUsed}</span></p>
             <p className="font-semibold">{UI_STRINGS.languagesPanelSlotsRemaining || "Slots Remaining:"} <span className={cn(slotsRemaining < 0 ? "text-destructive" : "text-emerald-600")}>{slotsRemaining}</span></p>
          </div>
        </div>
        
        <div>
          <Label className="text-sm font-medium text-muted-foreground">{UI_STRINGS.languagesPanelChosenByPlayer || "Chosen by Player:"}</Label>
          {chosenPlayerLanguages.length > 0 ? (
            <div className="space-y-1 mt-1">
              {chosenPlayerLanguages.map(langId => {
                const langObj = LANGUAGES.find(l => l.value === langId);
                return (
                  <div key={`chosen-${langId}`} className="flex items-center justify-between p-1.5 border rounded-md bg-background text-sm">
                    <span>{langObj?.label || langId}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive/80"
                      onClick={() => handleRemoveLanguage(langId)}
                      aria-label={(UI_STRINGS.languagesPanelRemoveAriaLabel || "Remove {languageName}").replace("{languageName}", langObj?.label || langId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
             <p className="text-xs text-muted-foreground italic mt-1">{UI_STRINGS.infoDialogNone || "None"}</p>
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
            />
            <Button type="button" onClick={handleAddLanguage} size="sm" disabled={!selectedLanguageToAdd}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
