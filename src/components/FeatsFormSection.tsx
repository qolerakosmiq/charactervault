
'use client';

import * as React from 'react';
import type { Feat as FeatType, DndRaceId, CharacterClass, FeatDefinitionJsonData } from '@/types/character';
import { DND_FEATS, calculateAvailableFeats } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Info } from 'lucide-react';
import { ComboboxPrimitive, type ComboboxOption } from '@/components/ui/combobox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label'; // Added import

interface FeatsFormSectionProps {
  characterRace: DndRaceId | string;
  characterClasses: CharacterClass[];
  selectedFeats: FeatType[];
  onFeatSelectionChange: (selectedFeats: FeatType[]) => void;
}

const featOptions: ComboboxOption[] = DND_FEATS.map(feat => ({
  value: feat.value, // kebab-case ID
  label: feat.label, // Human-readable name
}));

export function FeatsFormSection({
  characterRace,
  characterClasses,
  selectedFeats,
  onFeatSelectionChange,
}: FeatsFormSectionProps) {
  const characterLevel = characterClasses.reduce((sum, cls) => sum + cls.level, 0) || 1;
  const availableFeatSlots = calculateAvailableFeats(characterRace, characterLevel);

  // Initialize local state for selected feats in each slot
  const [featSelections, setFeatSelections] = React.useState<Array<string | undefined>>(() => {
    const initialSelections = Array(availableFeatSlots).fill(undefined);
    selectedFeats.forEach((feat, index) => {
      if (index < availableFeatSlots) {
        initialSelections[index] = feat.id; // Store feat ID
      }
    });
    return initialSelections;
  });

  // Update local state if availableFeatSlots or selectedFeats prop changes
  React.useEffect(() => {
    const newSelections = Array(availableFeatSlots).fill(undefined);
    selectedFeats.forEach((feat, index) => {
      if (index < availableFeatSlots) {
        newSelections[index] = feat.id;
      }
    });
    // Only update if the array content actually differs to avoid infinite loops
    if (JSON.stringify(newSelections) !== JSON.stringify(featSelections)) {
      setFeatSelections(newSelections);
    }
  }, [availableFeatSlots, selectedFeats, featSelections]);


  const handleFeatChange = (slotIndex: number, featId: string | undefined) => {
    const newSelections = [...featSelections];
    newSelections[slotIndex] = featId;
    setFeatSelections(newSelections);

    // Convert selected IDs back to FeatType objects for the parent component
    const updatedFeats: FeatType[] = newSelections
      .map(id => {
        if (!id) return undefined;
        const featDef = DND_FEATS.find(f => f.value === id);
        if (!featDef) return undefined;
        return {
          id: featDef.value,
          name: featDef.label,
          description: featDef.description,
          prerequisites: featDef.prerequisites,
        };
      })
      .filter(feat => feat !== undefined) as FeatType[];
    onFeatSelectionChange(updatedFeats);
  };

  const getFeatDetails = (featId: string | undefined): FeatDefinitionJsonData | undefined => {
    return DND_FEATS.find(f => f.value === featId);
  };

  const getAvailableOptionsForSlot = (currentSlotIndex: number) => {
    const selectedInOtherSlots = featSelections.filter((id, index) => id && index !== currentSlotIndex);
    return featOptions.filter(option => !selectedInOtherSlots.includes(option.value));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Award className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-serif">Feats</CardTitle>
            <CardDescription>
              Select your character's feats. Available Slots: {availableFeatSlots}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {availableFeatSlots > 0 ? (
          <ScrollArea className="max-h-[400px] pr-3">
            <div className="space-y-4">
              {Array.from({ length: availableFeatSlots }).map((_, index) => {
                const selectedFeatId = featSelections[index];
                const featDetails = getFeatDetails(selectedFeatId);
                const availableOptions = getAvailableOptionsForSlot(index);

                return (
                  <div key={`feat-slot-${index}`} className="p-3 border rounded-md bg-muted/10 space-y-2">
                    <Label htmlFor={`feat-select-${index}`}>Feat Slot {index + 1}</Label>
                    <ComboboxPrimitive
                      options={availableOptions}
                      value={selectedFeatId}
                      onChange={(value) => handleFeatChange(index, value === "---unselect---" ? undefined : value)}
                      placeholder="Select a feat..."
                      searchPlaceholder="Search feats..."
                      emptyPlaceholder="No feat found."
                      triggerClassName="w-full"
                    />
                    {featDetails && (
                      <div className="text-xs text-muted-foreground p-2 border-t mt-2 space-y-1">
                        <p><strong className="text-foreground">Description:</strong> {featDetails.description}</p>
                        {featDetails.prerequisites && (
                           <p><strong className="text-foreground">Prerequisites:</strong> {featDetails.prerequisites}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground">No feat slots available at this level/race combination.</p>
        )}
      </CardContent>
    </Card>
  );
}

    
