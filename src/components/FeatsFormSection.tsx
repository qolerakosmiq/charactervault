
'use client';

import * as React from 'react';
import type { Feat as FeatType, DndRaceId, CharacterClass, FeatDefinitionJsonData, DndClassId } from '@/types/character';
import { DND_FEATS, calculateAvailableFeats, DND_RACES } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Info } from 'lucide-react';
import { ComboboxPrimitive, type ComboboxOption } from '@/components/ui/combobox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

  const [featSelections, setFeatSelections] = React.useState<Array<string | undefined>>(() => {
    const initialSelections = Array(availableFeatSlots).fill(undefined);
    selectedFeats.forEach((feat, index) => {
      if (index < availableFeatSlots) {
        initialSelections[index] = feat.id;
      }
    });
    return initialSelections;
  });

  React.useEffect(() => {
    const newSelections = Array(availableFeatSlots).fill(undefined);
    selectedFeats.forEach((feat, index) => {
      if (index < availableFeatSlots) {
        newSelections[index] = feat.id;
      }
    });
    if (JSON.stringify(newSelections) !== JSON.stringify(featSelections)) {
      setFeatSelections(newSelections);
    }
  }, [availableFeatSlots, selectedFeats, featSelections]);

  const handleFeatChange = (slotIndex: number, featId: string | undefined) => {
    const newSelections = [...featSelections];
    newSelections[slotIndex] = featId;
    setFeatSelections(newSelections);

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

  const selectedFeatsCount = featSelections.filter(Boolean).length;
  const featSlotsLeft = availableFeatSlots - selectedFeatsCount;

  const baseFeat = 1;
  const humanBonus = DND_RACES.find(r => r.value === characterRace)?.value === 'human' ? 1 : 0;
  const levelProgressionFeats = Math.floor(characterLevel / 3);
  // Note: Class specific bonus feats (e.g. Fighter) are not yet included in this specific display breakdown
  // but are part of the `calculateAvailableFeats` function if it's enhanced later.
  // For now, `availableFeatSlots` might be higher if those are implemented there.
  // This display focuses on general progression.

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Award className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-serif">Feats</CardTitle>
            <CardDescription>
              Select your character's feats based on available slots.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 border rounded-md bg-muted/30">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">
              Feats Slots Available: <span className="text-lg font-bold text-primary">{availableFeatSlots}</span>
            </p>
            <p className="text-sm font-medium">
              Feats Slots Left: <span className={cn(
                "text-lg font-bold",
                featSlotsLeft > 0 && "text-emerald-500",
                featSlotsLeft < 0 && "text-destructive",
                featSlotsLeft === 0 && "text-accent"
              )}>{featSlotsLeft}</span>
            </p>
          </div>
           <p className="text-xs text-muted-foreground mt-1">
            (Base [<strong className="font-bold text-primary">{baseFeat}</strong>]
            + Human Bonus [<strong className="font-bold text-primary">+{humanBonus}</strong>]
            + Level Progression [<strong className="font-bold text-primary">+{levelProgressionFeats}</strong>])
          </p>
        </div>

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
