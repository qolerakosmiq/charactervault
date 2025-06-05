
'use client';

import * as React from 'react';
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
  DndClassOption, DndRaceOption, AbilityName
} from '@/types/character';
import type { CustomSkillDefinition } from '@/lib/definitions-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpenText, Loader2 } from 'lucide-react';
import { checkFeatPrerequisites } from '@/types/character';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nProvider';
import { Badge } from '@/components/ui/badge';

interface FeatSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFeatSelected: (featDefinitionId: string) => void;
  allFeats: readonly (FeatDefinitionJsonData & { isCustom?: boolean })[];
  character: Character;
  allPredefinedSkillDefinitions: readonly SkillDefinitionJsonData[];
  allCustomSkillDefinitions: readonly CustomSkillDefinition[];
  allClasses: readonly DndClassOption[];
  allRaces: readonly DndRaceOption[];
  abilityLabels: readonly { value: Exclude<AbilityName, 'none'>; label: string; abbr: string }[];
  alignmentPrereqOptions: readonly { value: string; label: string }[];
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
  isLoadingTranslations: propIsLoadingTranslations = false,
}: FeatSelectionDialogProps) {
  const { translations, isLoading: i18nIsLoading } = useI18n();
  const [searchTerm, setSearchTerm] = React.useState('');
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  const isLoadingEffective = propIsLoadingTranslations || i18nIsLoading;

  const sortedAndFilteredFeats = React.useMemo(() => {
    if (isLoadingEffective) return [];
    return [...allFeats]
      .filter(featDef => featDef.isClassFeature !== true)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allFeats, isLoadingEffective]);

  React.useEffect(() => {
    if (isOpen && scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = 0;
      }
    }
    if(!isOpen) setSearchTerm('');
  }, [isOpen, searchTerm]);

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
            {UI_STRINGS.featSelectionDialogDescription || "Search and choose a feat from the list. Descriptions and prerequisites are shown below each feat."}
          </DialogDescription>
        </DialogHeader>
        <Command className="rounded-lg border shadow-md flex-grow min-h-0 flex flex-col">
          <CommandInput
            placeholder={UI_STRINGS.featSelectionDialogSearchPlaceholder || "Search feats by name or description..."}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <ScrollArea ref={scrollAreaRef} className="flex-grow min-h-0">
            <CommandList className="max-h-none">
              <CommandEmpty>{UI_STRINGS.featSelectionDialogEmpty || "No feats found."}</CommandEmpty>
              <CommandGroup>
                {sortedAndFilteredFeats.map((featDef) => {
                  const prereqMessages: PrerequisiteMessage[] = checkFeatPrerequisites(
                    featDef,
                    character,
                    allFeats,
                    allPredefinedSkillDefinitions,
                    allCustomSkillDefinitions,
                    allClasses,
                    allRaces,
                    abilityLabels,
                    alignmentPrereqOptions
                  );
                  return (
                    <CommandItem
                      key={featDef.value}
                      value={`${featDef.label} ${stripHtml(featDef.description || '')}`}
                      onSelect={() => {
                        onFeatSelected(featDef.value);
                        onOpenChange(false);
                      }}
                      className="flex flex-col items-start p-3 hover:bg-accent/10 cursor-pointer data-[selected=true]:bg-accent/20"
                    >
                      <div className="font-medium text-sm text-foreground">
                        {featDef.label} 
                        {featDef.isCustom && <Badge variant="outline" className="text-xs text-primary/70 border-primary/50 h-5 ml-1.5 font-normal">{UI_STRINGS.badgeCustomLabel || "Custom"}</Badge>}
                      </div>
                      {featDef.description && (
                        <div
                          className="text-xs text-muted-foreground mt-0.5 whitespace-normal"
                          dangerouslySetInnerHTML={{ __html: featDef.description }}
                        />
                      )}
                      {prereqMessages.length > 0 ? (
                        <p className="text-xs mt-0.5 whitespace-normal">
                          <b className="text-muted-foreground">{UI_STRINGS.featPrerequisitesLabel || "Prerequisites:"}</b>{' '}
                          {prereqMessages.map((msg, index) => (
                            <React.Fragment key={index}>
                              <span className={cn("text-xs", !msg.isMet ? 'text-destructive' : 'text-muted-foreground/80')}
                                dangerouslySetInnerHTML={{ __html: msg.text }}
                              >
                              </span>
                              {index < prereqMessages.length - 1 && ', '}
                            </React.Fragment>
                          ))}
                        </p>
                      ) : (
                         <p className="text-xs mt-0.5 whitespace-normal text-muted-foreground/80"><b className="text-muted-foreground">{UI_STRINGS.featPrerequisitesLabel || "Prerequisites:"}</b> {UI_STRINGS.featPrerequisitesNoneLabel || "None"}</p>
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
