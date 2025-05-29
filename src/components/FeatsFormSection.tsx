
'use client';

import * as React from 'react';
import type { Feat as FeatType, DndRaceId, CharacterClass, FeatDefinitionJsonData } from '@/types/character';
import { DND_FEATS, calculateAvailableFeats, DND_RACES } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, PlusCircle, Trash2 } from 'lucide-react';
import { ComboboxPrimitive, type ComboboxOption } from '@/components/ui/combobox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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

  // Stores the IDs of selected feats for currently displayed slots
  const [featSelections, setFeatSelections] = React.useState<(string | undefined)[]>(() => {
    return selectedFeats.map(f => f.id).slice(0, availableFeatSlots);
  });

  React.useEffect(() => {
    // Sync with external changes to selectedFeats or availableFeatSlots
    const newDerivedSelections = selectedFeats.map(f => f.id).slice(0, availableFeatSlots);
    if (JSON.stringify(featSelections) !== JSON.stringify(newDerivedSelections)) {
      setFeatSelections(newDerivedSelections);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFeats, availableFeatSlots]);


  const convertSelectionsToFeatTypes = (selections: (string | undefined)[]): FeatType[] => {
    return selections
      .map(id => {
        if (!id) return undefined;
        const featDef = DND_FEATS.find(f => f.value === id);
        if (!featDef) return undefined;
        return {
          id: featDef.value,
          name: featDef.label,
          description: featDef.description,
          prerequisites: featDef.prerequisites,
        } as FeatType;
      })
      .filter(feat => feat !== undefined) as FeatType[];
  };

  const handleAddSlot = () => {
    if (featSelections.length < availableFeatSlots) {
      setFeatSelections(prev => [...prev, undefined]);
      // Parent is updated when a feat is actually selected or removed
    }
  };

  const handleRemoveSlot = (indexToRemove: number) => {
    const newSelections = featSelections.filter((_, i) => i !== indexToRemove);
    setFeatSelections(newSelections);
    onFeatSelectionChange(convertSelectionsToFeatTypes(newSelections));
  };

  const handleFeatChangeInSlot = (slotIndex: number, featId: string | undefined) => {
    const newSelections = [...featSelections];
    newSelections[slotIndex] = featId === "---unselect---" ? undefined : featId;
    setFeatSelections(newSelections);
    onFeatSelectionChange(convertSelectionsToFeatTypes(newSelections));
  };

  const getFeatDetails = (featId: string | undefined): FeatDefinitionJsonData | undefined => {
    return DND_FEATS.find(f => f.value === featId);
  };

  const getAvailableOptionsForSlot = (currentSlotIndex: number) => {
    const selectedInOtherSlots = featSelections.filter((id, index) => id && index !== currentSlotIndex);
    return featOptions.filter(option => !selectedInOtherSlots.includes(option.value));
  };

  const selectedFeatsCount = featSelections.filter(Boolean).length;
  const featSlotsLeft = availableFeatSlots - selectedFeatsCount;

  const baseFeat = 1;
  const humanBonus = DND_RACES.find(r => r.value === characterRace)?.value === 'human' ? 1 : 0;
  const levelProgressionFeats = Math.floor(characterLevel / 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Award className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-serif">Feats</CardTitle>
            <CardDescription>
              Select your character's feats.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 border rounded-md bg-muted/30">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">
              Total Feat Slots: <span className="text-lg font-bold text-primary">{availableFeatSlots}</span>
            </p>
            <p className="text-sm font-medium">
              Selected Feats: <span className={cn(
                "text-lg font-bold",
                featSelections.filter(Boolean).length <= availableFeatSlots ? "text-emerald-500" : "text-destructive"
              )}>{featSelections.filter(Boolean).length}</span>
            </p>
          </div>
           <p className="text-xs text-muted-foreground mt-1">
            Base [<strong className="font-bold text-primary">{baseFeat}</strong>]
            + Human Bonus [<strong className="font-bold text-primary">+{humanBonus}</strong>]
            + Level Progression [<strong className="font-bold text-primary">+{levelProgressionFeats}</strong>]
          </p>
        </div>

        {availableFeatSlots > 0 ? (
          <ScrollArea className="max-h-[400px] pr-3">
            <div className="space-y-4">
              {featSelections.map((selectedFeatId, index) => {
                const featDetails = getFeatDetails(selectedFeatId);
                const availableOptions = getAvailableOptionsForSlot(index);

                return (
                  <div key={`feat-slot-${index}`} className="p-3 border rounded-md bg-muted/10 space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor={`feat-select-${index}`}>Feat Slot {index + 1}</Label>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveSlot(index)}
                        className="h-7 w-7 text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove Feat Slot</span>
                      </Button>
                    </div>
                    <ComboboxPrimitive
                      options={availableOptions}
                      value={selectedFeatId}
                      onChange={(value) => handleFeatChangeInSlot(index, value)}
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

        {featSelections.length < availableFeatSlots && (
          <Button onClick={handleAddSlot} variant="outline" size="sm" className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Feat Slot
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
