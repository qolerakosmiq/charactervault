
'use client';

import * as React from 'react';
import type { Feat as FeatType, DndRaceId, CharacterClass, FeatDefinitionJsonData, Character, AbilityScores, Skill } from '@/types/character';
import { DND_FEATS, calculateAvailableFeats, DND_RACES, checkFeatPrerequisites } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    const currentFeatIds = selectedFeats.map(f => f.id);
    if (JSON.stringify(featSelections.slice().sort()) !== JSON.stringify(currentFeatIds.slice().sort())) {
        setFeatSelections(currentFeatIds);
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
          effects: featDef.effects,
          canTakeMultipleTimes: featDef.canTakeMultipleTimes,
          requiresSpecialization: featDef.requiresSpecialization,
        } as FeatType;
      })
      .filter(feat => feat !== undefined) as FeatType[];
  };

  const handleAddFeatClick = () => {
    setIsFeatDialogOpen(true);
  };

  const handleFeatSelectedFromDialog = (featId: string) => {
    const featDef = DND_FEATS.find(f => f.value === featId);
    if (!featDef) return; 

    if (!featDef.canTakeMultipleTimes && featSelections.includes(featId)) {
      toast({
        title: "Duplicate Feat",
        description: `The feat "${featDef.label}" cannot be taken more than once.`,
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
    feats: convertSelectionsToFeatTypes(featSelections), 
    classes: characterClasses,
    race: characterRace,
    age: 0, 
    // Dummy values for fields not directly used by prerequisite checks but part of Character
    name: '',
    alignment: '',
    size: 'medium',
    hp: 0, maxHp: 0,
    armorBonus: 0, shieldBonus: 0, sizeModifierAC: 0, naturalArmor: 0, deflectionBonus: 0, dodgeBonus: 0, acMiscModifier: 0,
    initiativeMiscModifier: 0,
    savingThrows: { fortitude: {base:0,magicMod:0,miscMod:0}, reflex: {base:0,magicMod:0,miscMod:0}, will: {base:0,magicMod:0,miscMod:0} },
    inventory: []
  }), [abilityScores, skills, featSelections, characterClasses, characterRace]);


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Award className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl font-serif">Feats</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col">
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

          <ScrollArea className="flex-grow min-h-0 max-h-[400px] pr-1 mb-4">
            <div className="space-y-2">
              {featSelections.length > 0 ? (
                featSelections.map((selectedFeatId, index) => {
                  const featDetails = getFeatDetails(selectedFeatId);
                  if (!featDetails) return null;

                  const prereqStatus = checkFeatPrerequisites(featDetails, characterForPrereqCheck as Character, DND_FEATS);
                  const allPrereqMessages = [
                    ...prereqStatus.metMessages.map(msg => ({ text: msg, type: 'met' as const })),
                    ...prereqStatus.unmetMessages.map(msg => ({ text: msg, type: 'unmet' as const }))
                  ];

                  return (
                    <div key={`feat-slot-${index}-${selectedFeatId}`} className="flex items-start justify-between py-2 px-3 border rounded-md bg-background hover:bg-muted/20">
                      <div className="flex-grow mr-2">
                        <h4 className="font-medium text-foreground">{featDetails.label}</h4>
                        {featDetails.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 whitespace-normal">
                            {featDetails.description}
                          </p>
                        )}
                        { (allPrereqMessages.length > 0 || (featDetails.prerequisites && Object.keys(featDetails.prerequisites).length > 0)) && (
                          <p className="text-xs mt-0.5 whitespace-normal">
                            Prerequisites:{' '}
                            {allPrereqMessages.length > 0 ? 
                              allPrereqMessages.map((msg, idx) => (
                                <React.Fragment key={idx}>
                                  <span className={msg.type === 'unmet' ? 'text-destructive' : 'text-muted-foreground'}>
                                    {msg.text}
                                  </span>
                                  {idx < allPrereqMessages.length - 1 && ', '}
                                </React.Fragment>
                              ))
                              : "None"
                            }
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
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">No feats selected. Click "Add Feat" to begin.</p>
              )}
            </div>
          </ScrollArea>

          <Button onClick={handleAddFeatClick} type="button" variant="outline" size="sm" className="mt-2 self-start">
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

