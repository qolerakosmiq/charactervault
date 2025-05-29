
'use client';

import * as React from 'react';
import type { Feat as FeatType, DndRaceId, CharacterClass, FeatDefinitionJsonData } from '@/types/character';
import { DND_FEATS, calculateAvailableFeats, DND_RACES } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, PlusCircle, Trash2, Edit3 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { FeatSelectionDialog } from './FeatSelectionDialog';

interface FeatsFormSectionProps {
  characterRace: DndRaceId | string;
  characterClasses: CharacterClass[];
  selectedFeats: FeatType[];
  onFeatSelectionChange: (selectedFeats: FeatType[]) => void;
}

export function FeatsFormSection({
  characterRace,
  characterClasses,
  selectedFeats,
  onFeatSelectionChange,
}: FeatsFormSectionProps) {
  const characterLevel = characterClasses.reduce((sum, cls) => sum + cls.level, 0) || 1;
  const availableFeatSlots = calculateAvailableFeats(characterRace, characterLevel);

  const [featSelections, setFeatSelections] = React.useState<(string | undefined)[]>([]);
  const [isFeatDialogOpen, setIsFeatDialogOpen] = React.useState(false);
  const [editingSlotIndex, setEditingSlotIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    const newDerivedSelections = selectedFeats.map(f => f.id);
    // Only update if the derived selections actually differ or if the number of available slots differs from current selections
    // This helps avoid unnecessary re-renders and preserves the order of `undefined` slots if they exist
    if (JSON.stringify(featSelections) !== JSON.stringify(newDerivedSelections)) {
       setFeatSelections(newDerivedSelections);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFeats]);


  const convertSelectionsToFeatTypes = (selections: (string | undefined)[]): FeatType[] => {
    return selections
      .map(id => {
        if (!id) return undefined;
        const featDef = DND_FEATS.find(f => f.value === id);
        if (!featDef) return undefined; // Should not happen if selection is from dialog
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
    // Allow adding slots even beyond 'available'
    const newSelections = [...featSelections, undefined];
    setFeatSelections(newSelections);
    // Note: We don't call onFeatSelectionChange here, as no feat is actually selected yet.
    // It will be called when a feat is chosen for this new slot.
  };

  const handleRemoveSlot = (indexToRemove: number) => {
    const newSelections = featSelections.filter((_, i) => i !== indexToRemove);
    setFeatSelections(newSelections);
    onFeatSelectionChange(convertSelectionsToFeatTypes(newSelections));
  };

  const handleOpenFeatDialog = (slotIndex: number) => {
    setEditingSlotIndex(slotIndex);
    setIsFeatDialogOpen(true);
  };

  const handleFeatSelectedFromDialog = (featId: string) => {
    if (editingSlotIndex !== null) {
      const newSelections = [...featSelections];
      const isAlreadySelectedElsewhere = newSelections.some(
        (id, index) => id === featId && index !== editingSlotIndex
      );
      if (isAlreadySelectedElsewhere) {
        console.warn("This feat is already selected in another slot.");
        // Optionally show a toast or alert here
      } else {
        newSelections[editingSlotIndex] = featId;
        setFeatSelections(newSelections);
        onFeatSelectionChange(convertSelectionsToFeatTypes(newSelections));
      }
    }
    setIsFeatDialogOpen(false);
    setEditingSlotIndex(null);
  };


  const getFeatDetails = (featId: string | undefined): FeatDefinitionJsonData | undefined => {
    return DND_FEATS.find(f => f.value === featId);
  };

  const selectedFeatsCount = featSelections.filter(Boolean).length;
  const featSlotsLeft = availableFeatSlots - selectedFeatsCount;

  const baseFeat = 1;
  const humanBonus = DND_RACES.find(r => r.value === characterRace)?.value === 'human' ? 1 : 0;
  const levelProgressionFeats = Math.floor(characterLevel / 3);

  return (
    <>
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
          <div className="mb-6 p-3 border rounded-md bg-muted/30">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">
                Feats Available: <span className="text-lg font-bold text-primary">{availableFeatSlots}</span>
              </p>
              <p className="text-sm font-medium">
                Feats Left: <span className={cn(
                  "text-lg font-bold",
                  featSlotsLeft >= 0 ? "text-emerald-500" : "text-destructive"
                )}>{featSlotsLeft}</span>
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Base [{baseFeat}]
              + Human Bonus [+{humanBonus}]
              + Level Progression [+{levelProgressionFeats}]
            </p>
          </div>

          {featSelections.length > 0 && (
            <ScrollArea className="max-h-[400px] pr-1 mb-4">
              <div className="space-y-2">
                {featSelections.map((selectedFeatId, index) => {
                  const featDetails = getFeatDetails(selectedFeatId);
                  return (
                    <div key={`feat-slot-${index}`} className="flex items-center justify-between py-2 border-b border-border/30 last:border-b-0">
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-auto py-2 mr-2 flex-grow"
                        onClick={() => handleOpenFeatDialog(index)}
                      >
                        <div className="flex-grow">
                          <div className="flex items-center">
                             <Edit3 className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                            {featDetails ? (
                              <span className="text-foreground">{featDetails.label}</span>
                            ) : (
                              <span className="text-muted-foreground">Click to select feat... (Slot {index + 1})</span>
                            )}
                          </div>
                          {featDetails?.description && (
                            <p className="text-xs text-muted-foreground mt-1 whitespace-normal">
                              {featDetails.description}
                            </p>
                          )}
                           {featDetails?.prerequisites && (
                            <p className="text-xs text-destructive/80 mt-1 whitespace-normal">
                              Prerequisites: {featDetails.prerequisites}
                            </p>
                          )}
                        </div>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSlot(index)}
                        className="h-8 w-8 text-destructive hover:text-destructive/80 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove Feat Slot</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
           {featSelections.length === 0 && (
             <p className="text-sm text-muted-foreground mb-4 text-center py-2">No feat slots added yet. Click "Add Feat Slot" to begin.</p>
           )}


          <Button onClick={handleAddSlot} variant="outline" size="sm" className="mt-2">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Feat Slot
          </Button>
        </CardContent>
      </Card>
      <FeatSelectionDialog
        isOpen={isFeatDialogOpen}
        onOpenChange={setIsFeatDialogOpen}
        onFeatSelected={handleFeatSelectedFromDialog}
        allFeats={DND_FEATS}
      />
    </>
  );
}

