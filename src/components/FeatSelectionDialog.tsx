
'use client';

import *as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type {
  FeatDefinitionJsonData, Character, PrerequisiteMessage, SkillDefinitionJsonData,
  DndClassOption, DndRaceOption, AbilityName, LocalizedString, NoteEffectDetail, DndClassId
} from '@/types/character';
import type { CustomSkillDefinition } from '@/lib/definitions-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpenText, Loader2 } from 'lucide-react';
import { checkFeatPrerequisites } from '@/types/character';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nProvider';
import { Badge } from '@/components/ui/badge';
import { getLocalizedString } from '@/i18n/i18n-data';

interface FeatSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFeatSelected: (featDefinitionId: string) => void;
  allFeats: readonly (FeatDefinitionJsonData & { isCustom?: boolean })[]; // FeatDefinitionJsonData uses 'id'
  character: Character;
  allPredefinedSkillDefinitions: readonly SkillDefinitionJsonData[]; // Uses 'id'
  allCustomSkillDefinitions: readonly CustomSkillDefinition[]; // Uses 'id'
  allClasses: readonly DndClassOption[]; // Uses 'id'
  allRaces: readonly DndRaceOption[]; // Uses 'id'
  abilityLabels: readonly { id: Exclude<AbilityName, 'none'>; label: string; abbr: string }[]; // Uses 'id'
  alignmentPrereqOptions: readonly { id: string; label: string }[]; // Uses 'id'
  filterByCategory?: string;
  isLoadingTranslations?: boolean;
}

const getFeatSourceClassNameFromDialog = (featId: string, allClasses: readonly DndClassOption[]): string | null => {
  if (featId.startsWith('class-')) {
    const parts = featId.split('-');
    if (parts.length > 1) {
      const classIdCandidate = parts[1];
      const classDef = allClasses.find(c => c.id === classIdCandidate);
      return classDef ? classDef.label : null;
    }
  }
  return null;
};

const stripHtml = (html: string): string => {
  let text = html.replace(/<br\s*\/?>/gi, ' ');
  text = text.replace(/<\/?b>/gi, '');
  text = text.replace(/<\/?i>/gi, '');
  text = text.replace(/<\/?p>/gi, ' ');
  text = text.replace(/<[^>]+>/g, '');
  return text.replace(/\s\s+/g, ' ').trim();
};

const getCategoryBadgeVariant = (
  featCategory: string,
  characterPrimaryClassId?: DndClassId | string
): "secondary" | "outline" => {
  const classSpecificCategoryPatterns: Record<string, string[]> = {
    "fighterBonusFeat": ["fighter"],
    "wizardBonusFeat": ["wizard"],
    "monkBonusFeatL1": ["monk"],
    "monkBonusFeatL2": ["monk"],
    "monkBonusFeatL6": ["monk"],
    "rogueSpecialAbility": ["rogue"],
    // Add other class-specific feat categories here if they arise
  };

  for (const categoryPatternKey in classSpecificCategoryPatterns) {
    if (featCategory === categoryPatternKey) {
      const associatedClasses = classSpecificCategoryPatterns[categoryPatternKey];
      if (characterPrimaryClassId && associatedClasses.includes(characterPrimaryClassId)) {
        return "secondary"; // Match: current class matches the feat's intended class
      }
      return "outline"; // Mismatch: current class does not match, or no character class
    }
  }
  return "secondary"; // Default for non-class-specific categories or if characterClassId is undefined
};


export function FeatSelectionDialog({
  isOpen,
  onOpenChange,
  onFeatSelected,
  allFeats,
  character,
  allPredefinedSkillDefinitions,
  allCustomSkillDefinitions,
  allClasses,
  allRaces,
  abilityLabels,
  alignmentPrereqOptions,
  filterByCategory,
  isLoadingTranslations: propIsLoadingTranslations = false,
}: FeatSelectionDialogProps) {
  const { translations, isLoading: i18nIsLoading, language: currentLang } = useI18n();
  const [searchTerm, setSearchTerm] = React.useState('');
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  const isLoadingEffective = propIsLoadingTranslations || i18nIsLoading;

  const baseSortedAndFilteredFeats = React.useMemo(() => {
    if (isLoadingEffective) return [];
    let featsToProcess = [...allFeats].filter(featDef => featDef.isClassFeature !== true);

    if (filterByCategory) {
      featsToProcess = featsToProcess.filter(featDef =>
        !featDef.category || featDef.category === filterByCategory
      );
    }
    return featsToProcess.sort((a, b) => a.label.localeCompare(b.label));
  }, [allFeats, isLoadingEffective, filterByCategory]);


  const displayedFeats = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return baseSortedAndFilteredFeats;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return baseSortedAndFilteredFeats.filter(featDef => {
      const labelMatch = featDef.label.toLowerCase().includes(lowerSearchTerm);
      const descriptionMatch = (featDef.description ? stripHtml(getLocalizedString(featDef.description, currentLang)).toLowerCase() : '').includes(lowerSearchTerm);
      const categoryMatch = (featDef.category ? featDef.category.toLowerCase() : '').includes(lowerSearchTerm);
      const typeMatch = (featDef.type ? featDef.type.toLowerCase() : '').includes(lowerSearchTerm);
      const benefitMatch = (featDef.effectsText ? stripHtml(getLocalizedString(featDef.effectsText, currentLang)).toLowerCase() : '').includes(lowerSearchTerm);
      return labelMatch || descriptionMatch || categoryMatch || typeMatch || benefitMatch;
    });
  }, [baseSortedAndFilteredFeats, searchTerm, currentLang]);

  React.useEffect(() => {
    if (isOpen) {
      if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
        if (viewport) {
          setTimeout(() => {
            viewport.scrollTop = 0;
          }, 0);
        }
      }
    }
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  if (isLoadingEffective || !translations) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl md:max-w-2xl flex flex-col h-[75vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center font-serif">
              <BookOpenText className="mr-2 h-6 w-6 text-primary" />
              {translations?.UI_STRINGS.featSelectionDialogTitle || "Select a Feat"}
            </DialogTitle>
            <DialogDescription>
              {translations?.UI_STRINGS.featSelectionDialogLoadingDescription || "Loading feat information..."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
          <DialogFooter className="mt-4 pt-0">
            <Button variant="outline" onClick={() => { onOpenChange(false); }}>
              {translations?.UI_STRINGS.featSelectionDialogCancelButton || "Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  const { UI_STRINGS } = translations;
  const characterPrimaryClassId = character.classes[0]?.className;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl flex flex-col h-[75vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif">
            <BookOpenText className="mr-2 h-6 w-6 text-primary" />
            {UI_STRINGS.featSelectionDialogTitle || "Select a Feat"}
          </DialogTitle>
          <DialogDescription>
            {filterByCategory
              ? `${UI_STRINGS.featSelectionDialogDescriptionCategoryFilter || "Choose a feat from the filtered list. Showing feats for category:"} ${UI_STRINGS[`featCategory_${filterByCategory}` as keyof typeof UI_STRINGS] || filterByCategory}`
              : UI_STRINGS.featSelectionDialogDescription || "Search and choose a feat from the list. Descriptions and prerequisites are shown below each feat."
            }
          </DialogDescription>
        </DialogHeader>
        <Command
          shouldFilter={false}
          className="rounded-lg border shadow-md flex-grow min-h-0 flex flex-col"
        >
          <CommandInput
            placeholder={UI_STRINGS.featSelectionDialogSearchPlaceholder || "Search feats by name or description..."}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <ScrollArea ref={scrollAreaRef} className="flex-grow min-h-0">
            <CommandList className="max-h-none">
              <CommandEmpty>{UI_STRINGS.featSelectionDialogEmpty || "No feats found."}</CommandEmpty>
              <CommandGroup>
                {displayedFeats
                  .filter(featDef => featDef && typeof featDef.id === 'string' && featDef.id.length > 0 && typeof featDef.label === 'string')
                  .map((featDef) => {
                  const featDefDescription = getLocalizedString(featDef.description, currentLang, undefined, `feats.${featDef.id}.description`);
                  
                  let benefitContentText = "";
                  if (featDef.effectsText) {
                     benefitContentText = getLocalizedString(featDef.effectsText, currentLang, undefined, `feats.${featDef.id}.effectsText`);
                  }
                  const noteEffects = (featDef.effects?.filter(e => e.type === 'note') as NoteEffectDetail[] | undefined) || [];
                  if (noteEffects.length > 0) {
                    const noteText = noteEffects.map(ne => getLocalizedString(ne.text, currentLang)).join(' '); 
                    if (noteText.trim() !== "") {
                      if (benefitContentText.trim() !== "") benefitContentText += " ";
                      benefitContentText += noteText.trim();
                    }
                  }
                  const showBenefitLine = benefitContentText.trim() !== "";

                  const prereqMessages: PrerequisiteMessage[] = checkFeatPrerequisites(
                    featDef,
                    character,
                    allFeats,
                    allPredefinedSkillDefinitions,
                    allCustomSkillDefinitions,
                    allClasses,
                    allRaces,
                    abilityLabels,
                    alignmentPrereqOptions,
                    UI_STRINGS
                  );
                  const localizedSpecialPrereqText = (featDef.prerequisites?.special)
                    ? getLocalizedString(featDef.prerequisites.special, currentLang, undefined, `feats.${featDef.id}.prereq.special`)
                    : undefined;

                  const hasStructuralPrereqs = prereqMessages.length > 0;
                  const hasTextualPrereqs = !!(localizedSpecialPrereqText && localizedSpecialPrereqText.trim() !== "");
                  const showPrerequisitesLine = hasStructuralPrereqs || hasTextualPrereqs;

                  const featSourceClassName = (featDef.isClassFeature && featDef.id.startsWith('class-')) ? getFeatSourceClassNameFromDialog(featDef.id, allClasses) : null;
                  
                  const categoryBadgeVariant = featDef.category ? getCategoryBadgeVariant(featDef.category, characterPrimaryClassId) : "secondary";
                  const categoryDisplayLabel = featDef.category ? (UI_STRINGS[`featCategory_${featDef.category}` as keyof typeof UI_STRINGS] || featDef.category) : null;


                  return (
                    <CommandItem
                      key={featDef.id} 
                      value={featDef.label} 
                      onSelect={() => {
                        onFeatSelected(featDef.id); 
                        onOpenChange(false);
                      }}
                      className="flex flex-col items-start p-3 hover:bg-accent/10 cursor-pointer data-[selected=true]:bg-accent/20"
                    >
                      <div className="font-medium text-sm text-foreground mb-0.5">
                        {featDef.label}
                        {featDef.isCustom && <Badge variant="outline" className="ml-1 text-primary/70 border-primary/50 whitespace-nowrap">{UI_STRINGS.badgeCustomLabel || "Custom"}</Badge>}
                        {categoryDisplayLabel && !featSourceClassName && (
                           <Badge variant={categoryBadgeVariant} className="ml-1 whitespace-nowrap">
                            {categoryDisplayLabel}
                          </Badge>
                        )}
                        {featSourceClassName && <Badge variant="secondary" className="ml-1 whitespace-nowrap">{featSourceClassName}</Badge>}
                      </div>
                      {featDefDescription && (
                        <p
                          className="text-xs text-muted-foreground whitespace-normal"
                          dangerouslySetInnerHTML={{ __html: featDefDescription }}
                        />
                      )}
                      {showBenefitLine && (
                         <p className="text-xs whitespace-normal mt-0.5">
                          <strong className="text-muted-foreground">{UI_STRINGS.featBenefitLabel || "Benefit:"}</strong>{' '}
                          <span className="text-foreground" dangerouslySetInnerHTML={{ __html: benefitContentText }} />
                        </p>
                      )}
                      {showPrerequisitesLine && (
                        <p className="text-xs whitespace-normal mt-0.5">
                          <strong className="text-muted-foreground">{UI_STRINGS.featPrerequisitesLabel || "Prerequisites:"}</strong>{' '}
                          <>
                            {hasStructuralPrereqs && prereqMessages.map((msg, index) => (
                              <React.Fragment key={index}>
                                <span className={cn("text-xs", !msg.isMet ? 'text-destructive' : 'text-muted-foreground/80')}
                                  dangerouslySetInnerHTML={{ __html: msg.text }}
                                >
                                </span>
                                {index < prereqMessages.length - 1 && ', '}
                              </React.Fragment>
                            ))}
                            {hasStructuralPrereqs && hasTextualPrereqs && ', '}
                            {hasTextualPrereqs && (
                              <span className="text-xs text-muted-foreground/80" dangerouslySetInnerHTML={{ __html: localizedSpecialPrereqText! }} />
                            )}
                          </>
                        </p>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </ScrollArea>
        </Command>
        <DialogFooter className="mt-4 pt-0">
          <Button variant="outline" onClick={() => { onOpenChange(false); }}>
            {UI_STRINGS.featSelectionDialogCancelButton || "Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    
