
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
import type { FeatDefinitionJsonData } from '@/types/character';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpenText } from 'lucide-react';

interface FeatSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFeatSelected: (featId: string) => void;
  allFeats: readonly FeatDefinitionJsonData[];
}

export function FeatSelectionDialog({
  isOpen,
  onOpenChange,
  onFeatSelected,
  allFeats,
}: FeatSelectionDialogProps) {
  
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredFeats = React.useMemo(() => {
    if (!searchTerm) return allFeats;
    return allFeats.filter(feat => 
      feat.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feat.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (feat.prerequisites && feat.prerequisites.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allFeats, searchTerm]);

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
            placeholder="Search feats by name, description, or prerequisite..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <ScrollArea className="flex-grow min-h-0">
            <CommandList className="max-h-none"> {/* Override default max-h */}
              <CommandEmpty>No feats found.</CommandEmpty>
              <CommandGroup>
                {filteredFeats.map((feat) => (
                  <CommandItem
                    key={feat.value}
                    value={feat.label} // cmdk uses this for internal matching if not providing custom filter
                    onSelect={() => {
                      onFeatSelected(feat.value);
                      onOpenChange(false);
                    }}
                    className="flex flex-col items-start p-3 hover:bg-accent/50 cursor-pointer"
                  >
                    <div className="font-medium text-sm text-foreground">{feat.label}</div>
                    <p className="text-xs text-muted-foreground mt-0.5 whitespace-normal">{feat.description}</p>
                    {feat.prerequisites && (
                      <p className="text-xs text-destructive/80 mt-0.5 whitespace-normal">
                        Prerequisites: {feat.prerequisites}
                      </p>
                    )}
                  </CommandItem>
                ))}
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

