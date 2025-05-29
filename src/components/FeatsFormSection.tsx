
'use client';

import * as React from 'react';
import type { Feat as FeatType, DndRaceId, CharacterClass, FeatDefinitionJsonData, Character, AbilityScores, Skill } from '@/types/character';
import { DND_FEATS, calculateAvailableFeats, DND_RACES, checkFeatPrerequisites } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, PlusCircle, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { FeatSelectionDialog } from './FeatSelectionDialog';
import { useToast } from "@/hooks/use-toast";

interface FeatsFormSectionProps {
  characterRace: DndRaceId | string;
  characterClasses: CharacterClass[];
  selectedFeats: FeatType[];
  onFeatSelectionChange: (selectedFeats: FeatType[]) => void;
  // Props needed for prerequisite checking
  abilityScores: AbilityScores;
  skills: Skill[];
}

export function FeatsFormSection({
  characterRace,
  characterClasses,
  selectedFeats,
  onFeatSelectionChange,
  abilityScores,
  skills,
}: FeatsFormSectionProps) {
  const characterLevel = characterClasses.reduce((sum, cls) => sum + cls.level, 0) || 1;
  const availableFeatSlots = calculateAvailableFeats(characterRace, characterLevel);

  const [featSelections, setFeatSelections] = React.useState<string[]>([]); 
  const [isFeatDialogOpen, setIsFeatDialogOpen] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    const newDerivedSelections = selectedFeats.map(f => f.id);
    if (JSON.stringify(featSelections) !== JSON.stringify(newDerivedSelections)) {
       setFeatSelections(newDerivedSelections);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFeats]);


  const convertSelectionsToFeatTypes = (selections: string[]): FeatType[] => {
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
          prerequisitesText: featDef.prerequisitesText,
          effects: featDef.effects // Ensure effects are copied
        } as FeatType;
      })
      .filter(feat => feat !== undefined) as FeatType[];
  };

  const handleAddFeatClick = () => {
    setIsFeatDialogOpen(true);
  };

  const handleFeatSelectedFromDialog = (featId: string) => {
    if (featSelections.includes(featId)) {
      toast({
        title: "Duplicate Feat",
        description: "This feat has already been selected.",
        variant: "destructive",
      });
      setIsFeatDialogOpen(false);
      return;
    }

    const newSelections = [...featSelections, featId];
    setFeatSelections(newSelections);
    onFeatSelectionChange(convertSelectionsToFeatTypes(newSelections));
    setIsFeatDialogOpen(false);
  };

  const handleRemoveSlot = (indexToRemove: number) => {
    const newSelections = featSelections.filter((_, i) => i !== indexToRemove);
    setFeatSelections(newSelections);
    onFeatSelectionChange(convertSelectionsToFeatTypes(newSelections));
  };

  const getFeatDetails = (featId: string | undefined): FeatDefinitionJsonData | undefined => {
    return DND_FEATS.find(f => f.value === featId);
  };

  const selectedFeatsCount = featSelections.length;
  const featSlotsLeft = availableFeatSlots - selectedFeatsCount;

  const baseFeat = 1;
  const humanBonus = DND_RACES.find(r => r.value === characterRace)?.value === 'human' ? 1 : 0;
  const levelProgressionFeats = Math.floor(characterLevel / 3);
  
  const characterForPrereqCheck = React.useMemo(() => ({
    abilityScores,
    skills,
    feats: selectedFeats, // Use the prop directly for checking, as it's the source of truth
    classes: characterClasses,
    race: characterRace, // Add race for prerequisites if needed
    level: characterLevel, // Add level for prerequisites if needed
  }), [abilityScores, skills, selectedFeats, characterClasses, characterRace, characterLevel]);


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
                  if (!featDetails) return null; 

                  const prereqStatus = checkFeatPrerequisites(featDetails, characterForPrereqCheck as Character, DND_FEATS);

                  return (
                    <div key={`feat-slot-${index}-${selectedFeatId}`} className="flex items-start justify-between py-2 px-3 border rounded-md bg-background hover:bg-muted/20">
                      <div className="flex-grow mr-2">
                        <h4 className="font-medium text-foreground">{featDetails.label}</h4>
                        {featDetails.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 whitespace-normal">
                            {featDetails.description}
                          </p>
                        )}
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
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSlot(index)}
                        className="h-8 w-8 text-destructive hover:text-destructive/80 shrink-0 mt-0.5"
                        aria-label={`Remove feat ${featDetails.label}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
           {featSelections.length === 0 && (
             <p className="text-sm text-muted-foreground mb-4 text-center py-2">No feats selected. Click "Add Feat" to begin.</p>
           )}

          <Button onClick={handleAddFeatClick} variant="outline" size="sm" className="mt-2">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Feat
          </Button>
        </CardContent>
      </Card>
      <FeatSelectionDialog
        isOpen={isFeatDialogOpen}
        onOpenChange={setIsFeatDialogOpen}
        onFeatSelected={handleFeatSelectedFromDialog}
        allFeats={DND_FEATS}
        character={characterForPrereqCheck as Character}
      />
    </>
  );
}

