
'use client';

import * as React from 'react';
import type { Feat as FeatType, DndRaceId, CharacterClass, FeatDefinitionJsonData, Character, AbilityScores, Skill } from '@/types/character';
import { DND_FEATS, calculateAvailableFeats, checkFeatPrerequisites } from '@/types/character';
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
  
  const totalGrantedFeatsCount = selectedFeats.filter(f => f.isGranted).length;
  const userChosenFeatsCount = selectedFeats.filter(f => !f.isGranted).length;
  
  const selectableSlotsAvailable = calculateAvailableFeats(characterRace, characterLevel);
  const featSlotsLeft = selectableSlotsAvailable - userChosenFeatsCount;


  const [isFeatDialogOpen, setIsFeatDialogOpen] = React.useState(false);
  const { toast } = useToast();

  const convertFeatIdToFeatType = (featId: string, isGranted = false, grantedNote?: string): FeatType | undefined => {
    const featDef = DND_FEATS.find(f => f.value === featId);
    if (!featDef) return undefined;
    return {
      id: featDef.value,
      name: featDef.label,
      description: featDef.description,
      prerequisites: featDef.prerequisites,
      effects: featDef.effects,
      canTakeMultipleTimes: featDef.canTakeMultipleTimes,
      requiresSpecialization: featDef.requiresSpecialization,
      isGranted: isGranted,
      grantedNote: grantedNote,
    };
  };

  const handleAddFeatClick = () => {
    setIsFeatDialogOpen(true);
  };

  const handleFeatSelectedFromDialog = (featId: string) => {
    const featDef = DND_FEATS.find(f => f.value === featId);
    if (!featDef) return;

    const alreadyChosenByUser = selectedFeats.some(f => !f.isGranted && f.id === featId);
    const alreadyGranted = selectedFeats.some(f => f.isGranted && f.id === featId);

    if (alreadyGranted && !featDef.canTakeMultipleTimes) {
      toast({
        title: "Feat Already Granted",
        description: `The feat "${featDef.label}" is already granted to your character and cannot be chosen again.`,
        variant: "destructive",
      });
      setIsFeatDialogOpen(false);
      return;
    }
    
    if (alreadyChosenByUser && !featDef.canTakeMultipleTimes) {
      toast({
        title: "Duplicate Feat",
        description: `You have already selected the feat "${featDef.label}". It cannot be taken more than once.`,
        variant: "destructive",
      });
      setIsFeatDialogOpen(false);
      return;
    }

    const newFeat = convertFeatIdToFeatType(featId, false);
    if (newFeat) {
      const updatedFeats = [...selectedFeats.filter(f => f.isGranted), ...selectedFeats.filter(f => !f.isGranted), newFeat];
      onFeatSelectionChange(updatedFeats);
    }
    setIsFeatDialogOpen(false);
  };

  const handleRemoveUserFeat = (featIdToRemove: string, indexToRemove: number) => {
    // We need a more robust way to remove a specific instance if a feat can be taken multiple times
    // For now, if a feat can be taken multiple times, this removes the *last* instance of it among user-chosen ones.
    // This logic needs refinement if order of multiple selections or specific specializations become important.
    
    let removed = false;
    const userChosenFeats = selectedFeats.filter(f => !f.isGranted);
    const grantedFeats = selectedFeats.filter(f => f.isGranted);

    // Find the specific instance to remove based on its position in the userChosenFeats array if possible
    // This simple index approach might not be perfect if granted feats shift the overall index
    const newChosenFeats = userChosenFeats.filter((feat, idx) => {
      // This logic is tricky if featSelections is not perfectly synced or if order matters.
      // A more robust approach might be to pass the actual feat object or a unique instance ID.
      // For now, this removes the first user-chosen feat with this ID.
      if (feat.id === featIdToRemove && !removed) {
        removed = true;
        return false;
      }
      return true;
    });
    
    onFeatSelectionChange([...grantedFeats, ...newChosenFeats]);
  };

  const baseFeat = 1;
  const racialBonus = characterRace === 'human' ? 1 : 0; 
  const levelProgressionFeats = Math.floor(characterLevel / 3);

  const characterForPrereqCheck = React.useMemo(() => ({
    abilityScores,
    skills,
    feats: selectedFeats, 
    classes: characterClasses,
    race: characterRace,
    age: 0, 
    name: '', 
    alignment: 'true-neutral' as const, 
    size: 'medium' as const, 
    hp: 0, maxHp: 0, 
    armorBonus: 0, shieldBonus: 0, sizeModifierAC: 0, naturalArmor: 0, deflectionBonus: 0, dodgeBonus: 0, acMiscModifier: 0, 
    initiativeMiscModifier: 0, 
    savingThrows: { fortitude: {base:0,magicMod:0,miscMod:0}, reflex: {base:0,magicMod:0,miscMod:0}, will: {base:0,magicMod:0,miscMod:0} }, 
    inventory: [] 
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
              {characterRace === 'human' && (
                <>
                  {' + '}Racial Bonus <strong className="font-bold text-primary">[{racialBonus}]</strong>
                </>
              )}
              {' + '}Level Progression <strong className="font-bold text-primary">[{levelProgressionFeats}]</strong>
            </p>
            {totalGrantedFeatsCount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                    + Granted by Class/Race <strong className="font-bold text-primary">[{totalGrantedFeatsCount}]</strong>
                </p>
            )}
          </div>

          <div className="mb-4">
            {selectedFeats.length > 0 ? (
              <div className="space-y-2">
                {selectedFeats.map((feat, index) => {
                  if (!feat) return null; 
                  const featDetails = DND_FEATS.find(f => f.value === feat.id);
                  if (!featDetails) {
                    return (
                         <div key={`feat-display-${index}-error`} className="flex items-center justify-between py-2 px-3 border-b border-border/50 hover:bg-muted/10 transition-colors">
                            <p className="text-sm text-muted-foreground">Error: Feat data not found for ID: {feat.id}</p>
                         </div>
                    );
                  }

                  const prereqStatus = checkFeatPrerequisites(featDetails, characterForPrereqCheck as Character, DND_FEATS);
                  const allPrereqMessages = [
                    ...prereqStatus.metMessages.map(msg => ({ text: msg, type: 'met' as const })),
                    ...prereqStatus.unmetMessages.map(msg => ({ text: msg, type: 'unmet' as const }))
                  ];

                  return (
                    <div key={`feat-display-${feat.id}-${index}`} className="flex items-start justify-between py-2 px-3 border-b border-border/50 hover:bg-muted/10 transition-colors">
                      <div className="flex-grow mr-2">
                        <h4 className="font-medium text-foreground">
                          {feat.name}
                          {feat.isGranted && feat.grantedNote && <span className="text-xs text-muted-foreground ml-1">{feat.grantedNote}</span>}
                        </h4>
                        {featDetails.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 whitespace-normal">
                            {featDetails.description}
                          </p>
                        )}
                         { (allPrereqMessages.length > 0 || (featDetails.prerequisites && Object.keys(featDetails.prerequisites).length > 0)) && !feat.isGranted && (
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
                      {!feat.isGranted && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveUserFeat(feat.id, index)}
                          className="h-8 w-8 text-destructive hover:text-destructive/80 shrink-0 mt-0.5"
                          aria-label={`Remove feat ${feat.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                No feats selected or granted. Click "Add Feat" to begin.
              </p>
            )}
          </div>

          <Button onClick={handleAddFeatClick} type="button" variant="outline" size="sm" className="mt-2">
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

    