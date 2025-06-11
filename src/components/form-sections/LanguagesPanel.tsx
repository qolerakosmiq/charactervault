
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
          <Skeleton className="h-12 w-full mb-2" /> 
          <Skeleton className="h-8 w-1/2 mb-2" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const { LANGUAGES, DND_RACES, UI_STRINGS } = translations;
  const badgeClassName = "text-primary border-primary whitespace-nowrap";

  const raceData = DND_RACES.find(r => r.value === characterRaceId);
  const automaticLanguages: LanguageId[] = ['common', ...(raceData?.automaticLanguages || [])];
  
  const intBonusLanguages = Math.max(0, calculateAbilityModifier(characterIntelligenceScore));
  const skillBonusLanguages = speakLanguageSkillRanks;
  
  const totalBonusLanguageSlots = intBonusLanguages + skillBonusLanguages;

  const chosenPlayerLanguages = characterLanguages.filter(lang => !automaticLanguages.includes(lang));
  const slotsUsed = chosenPlayerLanguages.length;
  const slotsRemaining = totalBonusLanguageSlots - slotsUsed;

  const allKnownLanguageIds = Array.from(new Set([...automaticLanguages, ...characterLanguages]));
  
  const allKnownLanguagesToDisplay = LANGUAGES
    .filter(lang => allKnownLanguageIds.includes(lang.value))
    .sort((a, b) => {
      const isAAutomatic = automaticLanguages.includes(a.value);
      const isBAutomatic = automaticLanguages.includes(b.value);
      if (isAAutomatic && !isBAutomatic) return -1;
      if (!isAAutomatic && isBAutomatic) return 1;
      return a.label.localeCompare(b.label);
    });


  const availableLanguagesForAdding = LANGUAGES.filter(
    lang => !allKnownLanguageIds.includes(lang.value) && lang.value !== 'druidic' 
  ).sort((a,b) => a.label.localeCompare(b.label));

  const handleAddLanguage = () => {
    if (selectedLanguageToAdd && !allKnownLanguageIds.includes(selectedLanguageToAdd)) {
      onLanguagesChange([...characterLanguages, selectedLanguageToAdd]);
      setSelectedLanguageToAdd('');
    }
  };

  const handleRemoveLanguage = (languageIdToRemove: LanguageId) => {
    if (automaticLanguages.includes(languageIdToRemove)) return; 
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
        <div className="mb-4 p-3 border rounded-md bg-muted/30">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">
              {UI_STRINGS.languagesPanelSlotsAvailableLabel || "Languages Available:"}{\u00A0}<span className="text-xl font-bold text-primary">{totalBonusLanguageSlots}</span>
            </p>
            <p className="text-sm font-medium">
              {UI_STRINGS.languagesPanelSlotsLeftLabel || "Languages Left:"}{\u00A0}<span className={cn(
                "text-xl font-bold",
                slotsRemaining > 0 && "text-emerald-500",
                slotsRemaining < 0 && "text-destructive",
                slotsRemaining === 0 && "text-accent"
              )}>{slotsRemaining}</span>
            </p>
          </div>
           <p className="text-xs text-muted-foreground mt-1">
              {UI_STRINGS.languagesPanelFormulaIntModLabel || "Intelligence Modifier"}{\u00A0}<Badge variant="outline" className={badgeClassName}>{intBonusLanguages}</Badge>
              {' + '}{UI_STRINGS.languagesPanelFormulaSkillRanksLabel || "Speak Language Ranks"}{\u00A0}<Badge variant="outline" className={badgeClassName}>{skillBonusLanguages}</Badge>
              {' = '}<span className="font-bold text-primary">{totalBonusLanguageSlots}</span>
            </p>
        </div>

        <div>
          {allKnownLanguagesToDisplay.length > 0 ? (
            <div className="mt-1"> 
              {allKnownLanguagesToDisplay.map(langObj => {
                const isAutomatic = automaticLanguages.includes(langObj.value);
                return (
                  <div key={`known-${langObj.value}`} className="flex items-center justify-between py-1 px-1.5 rounded-md text-sm"> 
                    <span>
                      {langObj.label}
                      {isAutomatic && <Badge variant="outline" className="ml-2 text-muted-foreground border-muted-foreground/50">{UI_STRINGS.languagesPanelAutomaticBadgeLabel || "Automatic"}</Badge>}
                    </span>
                    {!isAutomatic && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive/80"
                        onClick={() => handleRemoveLanguage(langObj.value)}
                        aria-label={(UI_STRINGS.languagesPanelRemoveAriaLabel || "Remove {languageName}").replace("{languageName}", langObj.label)}
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
LanguagesPanelComponent.displayName = "LanguagesPanelComponent";
export const LanguagesPanel = React.memo(LanguagesPanelComponent);

    
    