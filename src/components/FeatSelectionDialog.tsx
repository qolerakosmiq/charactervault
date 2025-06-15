
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
  DndClassOption, DndRaceOption, AbilityName, LocalizedString, NoteEffectDetail
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

const stripHtml = (html: string): string => {
  let text = html.replace(/<br\s*\/?>/gi, ' ');
  text = text.replace(/<\/?b>/gi, '');
  text = text.replace(/<\/?i>/gi, '');
  text = text.replace(/<\/?p>/gi, ' ');
  text = text.replace(/<[^>]+>/g, '');
  return text.replace(/\s\s+/g, ' ').trim();
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
              ? `${UI_STRINGS.featSelectionDialogDescriptionCategoryFilter || "Choose a feat from the filtered list. Showing feats for category:"} ${filterByCategory}`
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
                  const featDefDescription = featDef.description ? getLocalizedString(featDef.description, currentLang, undefined, `feats.${featDef.id}.description`) : "";
                  
                  let benefitContentText = "";
                  if (featDef.effectsText) {
                    benefitContentText = getLocalizedString(featDef.effectsText, currentLang, undefined, `feats.${featDef.id}.effectsText`);
                  }
                  const noteEffects = (featDef.effects?.filter(e => e.type === 'note') as NoteEffectDetail[] | undefined) || [];
                  if (noteEffects.length > 0) {
                    const noteText = noteEffects.map(ne => ne.text).join(' '); // text is already localized string
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
                  const localizedSpecialPrereqText = (featDef.prerequisites?.special && typeof featDef.prerequisites.special === 'object')
                    ? getLocalizedString(featDef.prerequisites.special as LocalizedString, currentLang, undefined, `feats.${featDef.id}.prereq.special`)
                    : (typeof featDef.prerequisites?.special === 'string' ? featDef.prerequisites.special : undefined);

                  const hasStructuralPrereqs = prereqMessages.length > 0;
                  const hasTextualPrereqs = !!(localizedSpecialPrereqText && localizedSpecialPrereqText.trim() !== "");
                  const showPrerequisitesLine = hasStructuralPrereqs || hasTextualPrereqs;


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
                      <div className="font-medium text-sm text-foreground">
                        {featDef.label}
                        {featDef.isCustom && <Badge variant="outline" className="ml-1 text-primary/70 border-primary/50 whitespace-nowrap">{UI_STRINGS.badgeCustomLabel || "Custom"}</Badge>}
                        {featDef.category && <Badge variant="secondary" className="ml-1 whitespace-nowrap">{featDef.category}</Badge>}
                      </div>
                      {featDefDescription && (
                        <div
                          className="text-xs text-muted-foreground mt-0.5 whitespace-normal"
                          dangerouslySetInnerHTML={{ __html: featDefDescription }}
                        />
                      )}
                      {showBenefitLine && (
                         <p className="text-xs mt-0.5 whitespace-normal">
                          <strong className="text-muted-foreground">{UI_STRINGS.featBenefitLabel || "Benefit:"}</strong>{' '}
                          <span dangerouslySetInnerHTML={{ __html: benefitContentText }} />
                        </p>
                      )}
                      {showPrerequisitesLine && (
                        <p className="text-xs mt-0.5 whitespace-normal">
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

