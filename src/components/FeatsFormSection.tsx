
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
  
  const [featSelections, setFeatSelections] = React.useState<string[]>([]);
  
  const userChosenFeatsCount = featSelections.filter(id => {
    const featDef = DND_FEATS.find(f => f.value === id);
    return featDef && !selectedFeats.find(sf => sf.id === id && sf.isGranted);
  }).length;

  const featSlotsLeft = selectableSlotsAvailable - userChosenFeatsCount;

  const [isFeatDialogOpen, setIsFeatDialogOpen] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    const propUserChosenFeatIds = selectedFeats
      .filter(f => !f.isGranted)
      .map(f => f.id)
      .filter((id): id is string => typeof id === 'string');

    const currentInternalSelectionsSorted = [...featSelections].sort();
    const propUserChosenFeatIdsSorted = [...propUserChosenFeatIds].sort();

    if (JSON.stringify(currentInternalSelectionsSorted) !== JSON.stringify(propUserChosenFeatIdsSorted)) {
      setFeatSelections(propUserChosenFeatIds);
    }
  }, [selectedFeats]);


  const convertSelectionsToFeatTypes = (ids: string[]): FeatType[] => {
    return ids.map((id, index) => {
      // For feats that can be taken multiple times, we need unique IDs for each instance.
      // The base ID is the feat's value. Subsequent instances append a unique suffix.
      // This logic assumes `ids` might contain multiple occurrences of the same base feat ID if it's multi-take.
      const featDef = DND_FEATS.find(f => f.value === id.split('-MULTI-INSTANCE-')[0]);
      let uniqueId = id;
      if (featDef?.canTakeMultipleTimes) {
          // Count how many times this base feat ID has appeared before this index
          const occurrences = ids.slice(0, index).filter(prevId => prevId.split('-MULTI-INSTANCE-')[0] === featDef.value).length;
          if (occurrences > 0 || ids.filter(checkId => checkId.split('-MULTI-INSTANCE-')[0] === featDef.value).length > 1) {
            // If it's not the first instance or if there are multiple instances overall, generate a unique ID
             // Ensure the ID passed in `id` from `featSelections` is used, which already contains the UUID for multiple instances
            if (!id.includes('-MULTI-INSTANCE-')) { // if it's a newly added multiple instance
                uniqueId = `${featDef.value}-MULTI-INSTANCE-${crypto.randomUUID()}`;
            }
          } else {
            uniqueId = featDef.value; // First instance of a potentially multi-take feat uses base ID
          }
      } else {
        uniqueId = featDef?.value || id; // For non-multi-take, or if somehow id doesn't have suffix yet
      }


      return {
        id: uniqueId,
        name: featDef?.label || id,
        description: featDef?.description,
        prerequisites: featDef?.prerequisites,
        effects: featDef?.effects,
        canTakeMultipleTimes: featDef?.canTakeMultipleTimes,
        requiresSpecialization: featDef?.requiresSpecialization,
        isGranted: false, 
      };
    });
  };

  const handleFeatSelectedFromDialog = (featId: string) => { // featId is the base value from DND_FEATS
    const featDef = DND_FEATS.find(f => f.value === featId);
    if (!featDef) return;

    const isAlreadyChosen = featSelections.some(selId => selId.split('-MULTI-INSTANCE-')[0] === featId);
    
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
    
    // For multi-take feats, generate a unique ID for this instance
    const idToAdd = featDef.canTakeMultipleTimes ? `${featId}-MULTI-INSTANCE-${crypto.randomUUID()}` : featId;
    const newSelections = [...featSelections, idToAdd];
    setFeatSelections(newSelections);
    onFeatSelectionChange(convertSelectionsToFeatTypes(newSelections));
    setIsFeatDialogOpen(false);
  };

  const handleRemoveSlot = (idToRemove: string) => { // idToRemove is the unique ID from featSelections
    const newSelections = featSelections.filter(id => id !== idToRemove);
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
    feats: selectedFeats, 
    classes: characterClasses,
    race: characterRace,
    age: 0, name: '', alignment: 'true-neutral' as const, size: 'medium' as const,
    hp: 0, maxHp: 0, armorBonus: 0, shieldBonus: 0, sizeModifierAC: 0, naturalArmor: 0,
    deflectionBonus: 0, dodgeBonus: 0, acMiscModifier: 0, initiativeMiscModifier: 0,
    savingThrows: { fortitude: {base:0,magicMod:0,miscMod:0}, reflex: {base:0,magicMod:0,miscMod:0}, will: {base:0,magicMod:0,miscMod:0} },
    inventory: [],
    portraitDataUrl: '',
    personalStory: ''
  }), [abilityScores, skills, selectedFeats, characterClasses, characterRace]);

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
            {selectedFeats.filter(f => f.isGranted).map((feat) => {
                const featDetails = DND_FEATS.find(fDef => fDef.value === feat.id.split('-MULTI-INSTANCE-')[0]);
                if (!featDetails) return null;
                const prereqStatus = checkFeatPrerequisites(featDetails, characterForPrereqCheck as Character, DND_FEATS);
                const allPrereqMessages = [
                    ...prereqStatus.metMessages.map(msg => ({ text: msg, type: 'met' as const })),
                    ...prereqStatus.unmetMessages.map(msg => ({ text: msg, type: 'unmet' as const }))
                ];

                return (
                    <div key={`granted-feat-${feat.id}`} className="py-2 px-3 border rounded-md bg-muted/50">
                        <h4 className="font-medium text-foreground">
                          {feat.name}
                          {feat.grantedNote && <span className="text-xs text-muted-foreground ml-1 italic">{feat.grantedNote}</span>}
                        </h4>
                        {featDetails.description && (
                          <div
                            className="text-xs text-muted-foreground mt-0.5 whitespace-normal"
                            dangerouslySetInnerHTML={{ __html: featDetails.description }}
                          />
                        )}
                        {(allPrereqMessages.length > 0 || (featDetails.prerequisites && Object.keys(featDetails.prerequisites).length > 0 && !featDetails.prerequisites.special)) || (featDetails.prerequisites?.special) ? (
                          <div className="text-xs mt-0.5 whitespace-normal">
                            Prerequisites:{' '}
                            {allPrereqMessages.length > 0 ?
                              allPrereqMessages.map((msg, idx) => (
                                <React.Fragment key={idx}>
                                  <span 
                                    className={cn(msg.type === 'unmet' ? 'text-destructive' : 'text-muted-foreground')}
                                    dangerouslySetInnerHTML={{ __html: msg.text }}
                                  />
                                  {idx < allPrereqMessages.length - 1 && ', '}
                                </React.Fragment>
                              ))
                              : <span className="text-muted-foreground">None</span>
                            }
                          </div>
                        ) : null
                      }
                    </div>
                );
            })}

            {featSelections.map((selectedFeatInstanceId) => {
              const baseFeatId = selectedFeatInstanceId.split('-MULTI-INSTANCE-')[0];
              const featDetails = DND_FEATS.find(f => f.value === baseFeatId);
              if (!featDetails) { 
                return (
                  <div key={`chosen-feat-error-${selectedFeatInstanceId}`} className="flex items-center justify-between py-2 px-3 border-b border-border/50 hover:bg-muted/10 transition-colors text-destructive">
                    Error: Invalid feat ID.
                    <Button
                      type="button" variant="ghost" size="icon"
                      onClick={() => handleRemoveSlot(selectedFeatInstanceId)}
                      className="h-8 w-8 text-destructive hover:text-destructive/80 shrink-0 mt-0.5"
                      aria-label={`Remove feat slot`}
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
                <div key={`chosen-feat-slot-${selectedFeatInstanceId}`} className="flex items-start justify-between py-2 px-3 border-b border-border/50 hover:bg-muted/10 transition-colors group">
                  <div className="flex-grow mr-2">
                    <h4 className="font-medium text-foreground">
                      {featDetails.label}
                    </h4>
                    {featDetails.description && (
                       <div
                        className="text-xs text-muted-foreground mt-0.5 whitespace-normal"
                        dangerouslySetInnerHTML={{ __html: featDetails.description }}
                      />
                    )}
                    {(allPrereqMessages.length > 0 || (featDetails.prerequisites && Object.keys(featDetails.prerequisites).length > 0 && !featDetails.prerequisites.special)) || (featDetails.prerequisites?.special) ? (
                       <div className="text-xs mt-0.5 whitespace-normal">
                        Prerequisites:{' '}
                        {allPrereqMessages.length > 0 ?
                          allPrereqMessages.map((msg, idx) => (
                            <React.Fragment key={idx}>
                              <span 
                                className={cn(msg.type === 'unmet' ? 'text-destructive' : 'text-muted-foreground')}
                                dangerouslySetInnerHTML={{ __html: msg.text }}
                              />
                              {idx < allPrereqMessages.length - 1 && ', '}
                            </React.Fragment>
                          ))
                          : <span className="text-muted-foreground">None</span>
                        }
                      </div>
                    ) : null }
                  </div>
                  <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSlot(selectedFeatInstanceId)}
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
        allFeats={DND_FEATS} // Pass all feats to the dialog
        character={characterForPrereqCheck as Character}
      />
    </>
  );
}
