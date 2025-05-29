
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
  // currentFeatId?: string; // Optional: to pre-select or highlight current feat
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif">
            <BookOpenText className="mr-2 h-6 w-6 text-primary" /> Select a Feat
          </DialogTitle>
          <DialogDescription>
            Search and choose a feat from the list. Descriptions and prerequisites are shown below each feat.
          </DialogDescription>
        </DialogHeader>
        <Command className="rounded-lg border shadow-md">
          <CommandInput 
            placeholder="Search feats by name, description, or prerequisite..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <ScrollArea className="h-[50vh]">
            <CommandList>
              <CommandEmpty>No feats found.</CommandEmpty>
              <CommandGroup>
                {filteredFeats.map((feat) => (
                  <CommandItem
                    key={feat.value}
                    value={feat.label} // cmdk uses this for internal matching if not providing custom filter
                    onSelect={() => {
                      onFeatSelected(feat.value);
                      onOpenChange(false);
                      setSearchTerm(''); // Reset search term on select
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
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => { onOpenChange(false); setSearchTerm(''); }}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
