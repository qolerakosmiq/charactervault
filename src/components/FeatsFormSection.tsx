
'use client';

import * as React from 'react';
import type { Feat as FeatType, DndRaceId, CharacterClass, FeatDefinitionJsonData } from '@/types/character';
import { DND_FEATS, calculateAvailableFeats, DND_RACES } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, PlusCircle, Trash2, Edit3 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { FeatSelectionDialog } from './FeatSelectionDialog'; // New Dialog

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

  // Stores the IDs of selected feats for currently displayed slots
  const [featSelections, setFeatSelections] = React.useState<(string | undefined)[]>([]);
  const [isFeatDialogOpen, setIsFeatDialogOpen] = React.useState(false);
  const [editingSlotIndex, setEditingSlotIndex] = React.useState<number | null>(null);


  React.useEffect(() => {
    const newDerivedSelections = selectedFeats.map(f => f.id);
    if (JSON.stringify(featSelections) !== JSON.stringify(newDerivedSelections)) {
      setFeatSelections(newDerivedSelections.length > 0 ? newDerivedSelections : (featSelections.length > 0 && newDerivedSelections.length === 0 ? [] : newDerivedSelections));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFeats]);


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
    setFeatSelections(prev => [...prev, undefined]);
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
      // Check if this featId is already selected in *another* slot
      const isAlreadySelectedElsewhere = newSelections.some(
        (id, index) => id === featId && index !== editingSlotIndex
      );
      if (isAlreadySelectedElsewhere) {
        // Optionally, show a toast or alert here
        console.warn("This feat is already selected in another slot.");
        setIsFeatDialogOpen(false); // Close dialog even if not changing
        return;
      }

      newSelections[editingSlotIndex] = featId;
      setFeatSelections(newSelections);
      onFeatSelectionChange(convertSelectionsToFeatTypes(newSelections));
    }
    setIsFeatDialogOpen(false);
    setEditingSlotIndex(null);
  };


  const getFeatDetails = (featId: string | undefined): FeatDefinitionJsonData | undefined => {
    return DND_FEATS.find(f => f.value === featId);
  };

  // Filter out feats already selected in OTHER slots for the dialog
  const getFeatsForDialog = (): FeatDefinitionJsonData[] => {
    const selectedInOtherSlots = featSelections.filter((id, index) => id && index !== editingSlotIndex);
    return DND_FEATS.filter(featDef => !selectedInOtherSlots.includes(featDef.value));
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
          <div className="mb-4 p-3 border rounded-md bg-muted/30">
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
              Base [<strong className="font-bold text-primary">{baseFeat}</strong>]
              + Human Bonus [<strong className="font-bold text-primary">+{humanBonus}</strong>]
              + Level Progression [<strong className="font-bold text-primary">+{levelProgressionFeats}</strong>]
            </p>
          </div>

          {featSelections.length > 0 ? (
            <ScrollArea className="max-h-[400px] pr-3">
              <div className="space-y-4">
                {featSelections.map((selectedFeatId, index) => {
                  const featDetails = getFeatDetails(selectedFeatId);
                  return (
                    <div key={`feat-slot-${index}`} className="p-3 border rounded-md bg-muted/10 space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Feat Slot {index + 1}</Label>
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
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-auto py-2"
                        onClick={() => handleOpenFeatDialog(index)}
                      >
                        <div className="flex-grow">
                          <div className="flex items-center">
                             <Edit3 className="mr-2 h-4 w-4 text-muted-foreground" />
                            {featDetails ? (
                              <span className="text-foreground">{featDetails.label}</span>
                            ) : (
                              <span className="text-muted-foreground">Click to select feat...</span>
                            )}
                          </div>
                          {featDetails?.description && (
                            <p className="text-xs text-muted-foreground mt-1 whitespace-normal">
                              {featDetails.description}
                            </p>
                          )}
                           {featDetails?.prerequisites && (
                            <p className="text-xs text-destructive mt-1 whitespace-normal">
                              Prerequisites: {featDetails.prerequisites}
                            </p>
                          )}
                        </div>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground">No feat slots added yet. Click "Add Feat Slot" to begin.</p>
          )}

          <Button onClick={handleAddSlot} variant="outline" size="sm" className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Feat Slot
          </Button>
        </CardContent>
      </Card>
      <FeatSelectionDialog
        isOpen={isFeatDialogOpen}
        onOpenChange={setIsFeatDialogOpen}
        onFeatSelected={handleFeatSelectedFromDialog}
        allFeats={DND_FEATS} // Pass all feats; dialog can implement its own filtering if needed, or we pass getFeatsForDialog()
        // currentFeatId={editingSlotIndex !== null ? featSelections[editingSlotIndex] : undefined}
      />
    </>
  );
}
