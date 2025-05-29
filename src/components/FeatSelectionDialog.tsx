
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
import { checkFeatPrerequisites, DND_FEATS } from '@/types/character'; // DND_FEATS needed for check

interface FeatSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFeatSelected: (featId: string) => void;
  allFeats: readonly FeatDefinitionJsonData[];
  character: Character; // Pass the full character or relevant parts for prerequisite checking
}

export function FeatSelectionDialog({
  isOpen,
  onOpenChange,
  onFeatSelected,
  allFeats,
  character,
}: FeatSelectionDialogProps) {
  
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredFeats = React.useMemo(() => {
    if (!searchTerm) return allFeats;
    return allFeats.filter(feat => 
      feat.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feat.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (feat.prerequisitesText && feat.prerequisitesText.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allFeats, searchTerm]);

  React.useEffect(() => {
    if (!isOpen) {
      setSearchTerm(''); 
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
            placeholder="Search feats by name, description, or prerequisite..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <ScrollArea className="flex-grow min-h-0">
            <CommandList className="max-h-none"> 
              <CommandEmpty>No feats found.</CommandEmpty>
              <CommandGroup>
                {filteredFeats.map((feat) => {
                  const prereqStatus = checkFeatPrerequisites(feat, character, DND_FEATS);
                  return (
                    <CommandItem
                      key={feat.value}
                      value={feat.label} 
                      onSelect={() => {
                        onFeatSelected(feat.value);
                        onOpenChange(false);
                      }}
                      className="flex flex-col items-start p-3 hover:bg-accent/50 cursor-pointer"
                    >
                      <div className="font-medium text-sm text-foreground">{feat.label}</div>
                      <p className="text-xs text-muted-foreground mt-0.5 whitespace-normal">{feat.description}</p>
                      {(prereqStatus.originalPrerequisitesText || prereqStatus.unmetMessages.length > 0 || prereqStatus.metMessages.length > 0) && (
                          <p className="text-xs mt-0.5 whitespace-normal">
                              Prerequisites: {' '}
                              {prereqStatus.metMessages.map((msg, i) => (
                                  <span key={`met-${i}`} className="text-muted-foreground">{msg}{i < prereqStatus.metMessages.length -1 + prereqStatus.unmetMessages.length ? ', ' : ''}</span>
                              ))}
                              {prereqStatus.unmetMessages.map((msg, i) => (
                                  <span key={`unmet-${i}`} className="text-destructive">{msg}{i < prereqStatus.unmetMessages.length - 1 ? ', ' : ''}</span>
                              ))}
                               {!prereqStatus.met && prereqStatus.metMessages.length === 0 && prereqStatus.unmetMessages.length === 0 && prereqStatus.originalPrerequisitesText && (
                                <span className="text-muted-foreground">{prereqStatus.originalPrerequisitesText}</span>
                               )}
                          </p>
                      )}
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

