
'use client';

import * as React from 'react';
import type { Feat as FeatType, DndRaceId, CharacterClass, FeatDefinitionJsonData, Character, AbilityScores, Skill } from '@/types/character';
import { DND_FEATS, calculateAvailableFeats, checkFeatPrerequisites, getGrantedFeatsForCharacter, DND_RACES } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, PlusCircle, Trash2 } from 'lucide-react';
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

  const selectableSlotsAvailable = calculateAvailableFeats(characterRace, characterLevel);
  
  // Internal state for just the IDs of user-chosen feats
  const [featSelections, setFeatSelections] = React.useState<string[]>(() =>
    selectedFeats.filter(f => !f.isGranted).map(f => f.id)
  );
  
  const userChosenFeatsCount = featSelections.length;
  const featSlotsLeft = selectableSlotsAvailable - userChosenFeatsCount;

  const [isFeatDialogOpen, setIsFeatDialogOpen] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    // Extract only the IDs of *user-chosen* feats from the prop
    const propUserChosenFeatIds = selectedFeats
      .filter(f => !f.isGranted)
      .map(f => f.id)
      .filter((id): id is string => typeof id === 'string'); // Ensure all are strings

    // Deep comparison to avoid unnecessary re-renders if arrays are equivalent
    // Sort copies to avoid mutating the original arrays during comparison
    const currentInternalSelectionsSorted = [...featSelections].sort();
    const propUserChosenFeatIdsSorted = [...propUserChosenFeatIds].sort();

    if (JSON.stringify(currentInternalSelectionsSorted) !== JSON.stringify(propUserChosenFeatIdsSorted)) {
      setFeatSelections(propUserChosenFeatIds);
    }
  }, [selectedFeats]); // Only depend on selectedFeats prop


  const convertSelectionsToFeatTypes = (ids: string[]): FeatType[] => {
    return ids.map(id => {
      const featDef = DND_FEATS.find(f => f.value === id);
      return {
        id: id,
        name: featDef?.label || id, // Fallback to ID if label not found (shouldn't happen with valid data)
        description: featDef?.description,
        prerequisites: featDef?.prerequisites,
        effects: featDef?.effects, // Make sure effects are copied
        canTakeMultipleTimes: featDef?.canTakeMultipleTimes,
        requiresSpecialization: featDef?.requiresSpecialization,
        isGranted: false, // These are user-chosen slots
      };
    });
  };

  const handleFeatSelectedFromDialog = (featId: string) => {
    const featDef = DND_FEATS.find(f => f.value === featId);
    if (!featDef) return;

    const isAlreadyChosen = featSelections.includes(featId);
    // Also check against granted feats that cannot be taken multiple times
    const isAlreadyGrantedAndNotMultiple = selectedFeats.some(
      f => f.isGranted && f.id === featId && !featDef.canTakeMultipleTimes
    );

    if (isAlreadyGrantedAndNotMultiple) {
         toast({
            title: "Feat Already Granted",
            description: `The feat "${featDef.label}" is already granted to you and cannot be taken again.`,
            variant: "destructive",
        });
        setIsFeatDialogOpen(false);
        return;
    }
    
    if (isAlreadyChosen && !featDef.canTakeMultipleTimes) {
        toast({
            title: "Duplicate Feat",
            description: `You have already selected "${featDef.label}". It cannot be taken multiple times.`,
            variant: "destructive",
        });
        setIsFeatDialogOpen(false);
        return;
    }

    const newSelections = [...featSelections, featId];
    setFeatSelections(newSelections);

    // Granted feats are managed by CharacterFormCore, so we only pass user-chosen ones up
    onFeatSelectionChange(convertSelectionsToFeatTypes(newSelections));
    setIsFeatDialogOpen(false);
  };

  const handleRemoveSlot = (indexToRemove: number) => {
    const newSelections = featSelections.filter((_, index) => index !== indexToRemove);
    setFeatSelections(newSelections);
    onFeatSelectionChange(convertSelectionsToFeatTypes(newSelections));
  };

  const baseFeat = 1;
  const raceData = DND_RACES.find(r => r.value === characterRace);
  const racialBonus = raceData?.bonusFeatSlots || 0;
  const levelProgressionFeats = Math.floor(characterLevel / 3);

  const characterForPrereqCheck = React.useMemo(() => ({
    abilityScores,
    skills,
    feats: selectedFeats, // Pass the full list including granted for accurate checking
    classes: characterClasses,
    race: characterRace,
    // Dummy values for parts of Character not relevant to prereq check here
    age: 0, name: '', alignment: 'true-neutral' as const, size: 'medium' as const,
    hp: 0, maxHp: 0, armorBonus: 0, shieldBonus: 0, sizeModifierAC: 0, naturalArmor: 0,
    deflectionBonus: 0, dodgeBonus: 0, acMiscModifier: 0, initiativeMiscModifier: 0,
    savingThrows: { fortitude: {base:0,magicMod:0,miscMod:0}, reflex: {base:0,magicMod:0,miscMod:0}, will: {base:0,magicMod:0,miscMod:0} },
    inventory: []
  }), [abilityScores, skills, selectedFeats, characterClasses, characterRace]);

  // Filtered list of feats that can be added (all feats for now, dialog handles search)
  // Prerequisite checks are done in the dialog for display, and can be re-checked upon selection if needed.
  const availableFeatOptionsForDialog = DND_FEATS;


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
        <CardContent>
          <div className="mb-6 p-3 border rounded-md bg-muted/30">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">
                Feats Available: <span className="text-lg font-bold text-primary">{selectableSlotsAvailable}</span>
              </p>
              <p className="text-sm font-medium">
                Feats Left: <span className={cn(
                  "text-lg font-bold",
                  featSlotsLeft >= 0 ? "text-emerald-500" : "text-destructive"
                )}>{featSlotsLeft}</span>
              </p>
            </div>
             <p className="text-xs text-muted-foreground mt-1">
              Base <strong className="font-bold text-primary">[{baseFeat}]</strong>
              {racialBonus > 0 && (
                <>
                  {' + '}Racial Bonus <strong className="font-bold text-primary">[{racialBonus}]</strong>
                </>
              )}
              {' + '}Level Progression <strong className="font-bold text-primary">[{levelProgressionFeats}]</strong>
            </p>
          </div>
          
          <div className="mb-4 space-y-2">
            {/* Display Granted Feats First (Read-only) */}
            {selectedFeats.filter(f => f.isGranted).map((feat) => {
                const featDetails = DND_FEATS.find(fDef => fDef.value === feat.id);
                if (!featDetails) return null;
                const prereqStatus = checkFeatPrerequisites(featDetails, characterForPrereqCheck as Character, DND_FEATS);
                const allPrereqMessages = [
                    ...prereqStatus.metMessages.map(msg => ({ text: msg, type: 'met' as const })),
                    ...prereqStatus.unmetMessages.map(msg => ({ text: msg, type: 'unmet' as const }))
                ];

                return (
                    <div key={`granted-feat-${feat.id}`} className="py-2 px-3 border-b border-border/50 bg-muted/50 rounded-md">
                        <h4 className="font-medium text-foreground">
                          {feat.name}
                          {feat.grantedNote && <span className="text-xs text-muted-foreground ml-1">{feat.grantedNote}</span>}
                        </h4>
                        {featDetails.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 whitespace-normal">
                            {featDetails.description}
                          </p>
                        )}
                        {(allPrereqMessages.length > 0 || (featDetails.prerequisites && Object.keys(featDetails.prerequisites).length > 0)) && (
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
                              : <span className="text-muted-foreground">None</span>
                            }
                          </p>
                        )}
                    </div>
                );
            })}

            {/* Display User-Chosen Feats */}
            {featSelections.map((selectedFeatId, index) => {
              const featDetails = DND_FEATS.find(f => f.value === selectedFeatId);
              if (!featDetails) { // Should not happen if featSelections only contains valid IDs
                return (
                  <div key={`chosen-feat-error-${index}`} className="flex items-center justify-between py-2 px-3 border-b border-border/50 hover:bg-muted/10 transition-colors text-destructive">
                    Error: Invalid feat ID.
                    <Button
                      type="button" variant="ghost" size="icon"
                      onClick={() => handleRemoveSlot(index)}
                      className="h-8 w-8 text-destructive hover:text-destructive/80 shrink-0 mt-0.5"
                      aria-label={`Remove feat slot ${index + 1}`}
                    ><Trash2 className="h-4 w-4" /></Button>
                  </div>
                );
              }

              const prereqStatus = checkFeatPrerequisites(featDetails, characterForPrereqCheck as Character, DND_FEATS);
              const allPrereqMessages = [
                ...prereqStatus.metMessages.map(msg => ({ text: msg, type: 'met' as const })),
                ...prereqStatus.unmetMessages.map(msg => ({ text: msg, type: 'unmet' as const }))
              ];

              return (
                <div key={`chosen-feat-slot-${selectedFeatId}-${index}`} className="flex items-start justify-between py-2 px-3 border-b border-border/50 hover:bg-muted/10 transition-colors group">
                  <div className="flex-grow mr-2">
                    <h4 className="font-medium text-foreground">
                      {featDetails.label}
                    </h4>
                    {featDetails.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 whitespace-normal">
                        {featDetails.description}
                      </p>
                    )}
                    {(allPrereqMessages.length > 0 || (featDetails.prerequisites && Object.keys(featDetails.prerequisites).length > 0)) && (
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
                          : <span className="text-muted-foreground">None</span>
                        }
                      </p>
                    )}
                  </div>
                  <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSlot(index)}
                      className="h-8 w-8 text-destructive hover:text-destructive/80 shrink-0 mt-0.5 opacity-50 group-hover:opacity-100 transition-opacity"
                      aria-label={`Remove feat ${featDetails.label}`}
                    >
                      <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            {featSelections.length === 0 && selectedFeats.filter(f => !f.isGranted).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                    No feats selected yet. Click "Add Feat" to choose.
                </p>
            )}
          </div>

          <Button onClick={() => setIsFeatDialogOpen(true)} type="button" variant="outline" size="sm" className="mt-2">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Feat
          </Button>
        </CardContent>
      </Card>
      <FeatSelectionDialog
        isOpen={isFeatDialogOpen}
        onOpenChange={setIsFeatDialogOpen}
        onFeatSelected={handleFeatSelectedFromDialog}
        allFeats={availableFeatOptionsForDialog}
        character={characterForPrereqCheck as Character}
      />
    </>
  );
}
