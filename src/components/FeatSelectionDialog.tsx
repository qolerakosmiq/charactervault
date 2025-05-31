
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
import type { FeatDefinitionJsonData, Character, PrerequisiteMessage } from '@/types/character';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpenText } from 'lucide-react';
import { checkFeatPrerequisites } from '@/types/character'; // DND_FEATS is not directly used here for check
import { cn } from '@/lib/utils';

interface FeatSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFeatSelected: (featId: string) => void;
  allFeats: readonly (FeatDefinitionJsonData & { isCustom?: boolean })[];
  character: Character;
}

// Simple HTML stripper for search purposes
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
  allFeats, // This now includes custom feat definitions
  character,
}: FeatSelectionDialogProps) {

  const [searchTerm, setSearchTerm] = React.useState('');
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  const sortedFeats = React.useMemo(() => {
    return [...allFeats].sort((a, b) => a.label.localeCompare(b.label));
  }, [allFeats]);

  React.useEffect(() => {
    if (!isOpen) {
      setSearchTerm(''); // Clear search term when dialog closes
    }
    // Scroll to top when dialog opens or search term changes
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = 0;
      }
    }
  }, [isOpen, searchTerm]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl flex flex-col h-[75vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif">
            <BookOpenText className="mr-2 h-6 w-6 text-primary" /> Select a Feat
          </DialogTitle>
          <DialogDescription>
            Search and choose a feat from the list. Descriptions and prerequisites are shown below each feat.
          </DialogDescription>
        </DialogHeader>
        <Command className="rounded-lg border shadow-md flex-grow min-h-0 flex flex-col">
          <CommandInput
            placeholder="Search feats by name or description..."
            value={searchTerm}
            onValueChange={setSearchTerm} // This will trigger the useEffect for scrolling
          />
          <ScrollArea ref={scrollAreaRef} className="flex-grow min-h-0">
            <CommandList className="max-h-none">
              <CommandEmpty>No feats found.</CommandEmpty>
              <CommandGroup>
                {sortedFeats.map((feat) => {
                  // Pass allFeats (which includes custom defs) to checkFeatPrerequisites
                  const prereqMessages: PrerequisiteMessage[] = checkFeatPrerequisites(feat, character, allFeats);

                  return (
                    <CommandItem
                      key={feat.value}
                      value={`${feat.label} ${stripHtml(feat.description || '')}`} // Search value
                      onSelect={() => {
                        onFeatSelected(feat.value); // feat.value is the base ID
                        onOpenChange(false);
                      }}
                      className="flex flex-col items-start p-3 hover:bg-accent/10 cursor-pointer data-[selected=true]:bg-accent/20"
                    >
                      <div className="font-medium text-sm text-foreground">{feat.label}</div>
                      {feat.description && (
                        <div
                          className="text-xs text-muted-foreground mt-0.5 whitespace-normal"
                          dangerouslySetInnerHTML={{ __html: feat.description }}
                        />
                      )}
                      {prereqMessages.length > 0 ? (
                          <p className="text-xs mt-0.5 whitespace-normal">
                            Prerequisites:{' '}
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
                           <p className="text-xs mt-0.5 whitespace-normal text-muted-foreground/80">Prerequisites: None</p>
                        )
                      }
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </ScrollArea>
        </Command>
        <DialogFooter className="mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => { onOpenChange(false); }}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
