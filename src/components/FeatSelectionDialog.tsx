
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
import type { FeatDefinitionJsonData, Character } from '@/types/character';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpenText } from 'lucide-react';
import { checkFeatPrerequisites, DND_FEATS } from '@/types/character';
import { cn } from '@/lib/utils';

interface FeatSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFeatSelected: (featId: string) => void;
  allFeats: readonly FeatDefinitionJsonData[];
  character: Character;
}

// Simple HTML stripper for search purposes
const stripHtml = (html: string): string => {
  // Replace <br> tags with spaces, then remove other common tags like <b>, <i>, <p>
  let text = html.replace(/<br\s*\/?>/gi, ' ');
  text = text.replace(/<\/?b>/gi, '');
  text = text.replace(/<\/?i>/gi, '');
  text = text.replace(/<\/?p>/gi, ' ');
  // Remove any remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');
  // Replace multiple spaces with a single space and trim
  return text.replace(/\s\s+/g, ' ').trim();
};


export function FeatSelectionDialog({
  isOpen,
  onOpenChange,
  onFeatSelected,
  allFeats,
  character,
}: FeatSelectionDialogProps) {

  const [searchTerm, setSearchTerm] = React.useState('');

  // CMDK will filter based on CommandItem's value prop, so pre-filtering here is not needed
  // and was preventing description search.
  // const filteredFeats = React.useMemo(() => {
  //   if (!searchTerm.trim()) return allFeats;
  //   const lowerSearchTerm = searchTerm.toLowerCase();
  //   return allFeats.filter(feat =>
  //     feat.label.toLowerCase().includes(lowerSearchTerm) ||
  //     stripHtml(feat.description.toLowerCase()).includes(lowerSearchTerm)
  //   );
  // }, [allFeats, searchTerm]);

  React.useEffect(() => {
    if (!isOpen) {
      setSearchTerm(''); // Reset search term when dialog closes
    }
  }, [isOpen]);

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
            onValueChange={setSearchTerm} // Update searchTerm for CMDK to use
          />
          <ScrollArea className="flex-grow min-h-0">
            <CommandList className="max-h-none"> {/* Ensure list can expand */}
              <CommandEmpty>No feats found.</CommandEmpty>
              <CommandGroup>
                {allFeats.map((feat) => { // Iterate over allFeats, CMDK will handle filtering
                  const prereqStatus = checkFeatPrerequisites(feat, character, DND_FEATS);
                  const allPrereqMessages = [
                    ...prereqStatus.metMessages.map(msg => ({ text: msg, type: 'met' as const })),
                    ...prereqStatus.unmetMessages.map(msg => ({ text: msg, type: 'unmet' as const }))
                  ];

                  return (
                    <CommandItem
                      key={feat.value}
                      // CMDK filters based on this 'value'. Include label and stripped description.
                      value={`${feat.label} ${stripHtml(feat.description)}`}
                      onSelect={() => {
                        onFeatSelected(feat.value);
                        onOpenChange(false);
                      }}
                      className="flex flex-col items-start p-3 hover:bg-accent/10 cursor-pointer data-[selected=true]:bg-accent/20"
                    >
                      <div className="font-medium text-sm text-foreground">{feat.label}</div>
                      <div
                        className="text-xs text-muted-foreground mt-0.5 whitespace-normal"
                        dangerouslySetInnerHTML={{ __html: feat.description }}
                      />
                      {(allPrereqMessages.length > 0 || (feat.prerequisites && Object.keys(feat.prerequisites).length > 0 && !feat.prerequisites.special)) || (feat.prerequisites?.special) ? (
                          <p className="text-xs mt-0.5 whitespace-normal">
                            Prerequisites:{' '}
                            {allPrereqMessages.length > 0 ?
                              allPrereqMessages.map((msg, index) => (
                                <React.Fragment key={index}>
                                  <span className={cn("text-xs", msg.type === 'unmet' ? 'text-destructive' : 'text-muted-foreground/80')}>
                                    {msg.text}
                                  </span>
                                  {index < allPrereqMessages.length - 1 && ', '}
                                </React.Fragment>
                              ))
                              : <span className="text-muted-foreground/80">None</span>
                            }
                          </p>
                        ) : null
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
