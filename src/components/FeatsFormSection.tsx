
'use client';

import * as React from 'react';
import type { Feat as FeatType, DndRaceId, CharacterClass, FeatDefinitionJsonData, Character, AbilityScores, Skill } from '@/types/character';
import { DND_FEATS, calculateAvailableFeats, checkFeatPrerequisites, DND_RACES } from '@/types/character'; // Added DND_RACES import
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, PlusCircle, Trash2, Edit3, ScrollArea } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeatSelectionDialog } from './FeatSelectionDialog';
import { AddCustomFeatDialog } from './AddCustomFeatDialog';
import { useToast } from "@/hooks/use-toast";

interface FeatsFormSectionProps {
  characterRace: DndRaceId | string;
  characterClasses: CharacterClass[];
  selectedFeats: FeatType[];
  onFeatSelectionChange: (updatedFeats: FeatType[]) => void;
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
  const { toast } = useToast();

  const [featSelections, setFeatSelections] = React.useState<(string | undefined)[]>([]);
  const [isFeatDialogOpen, setIsFeatDialogOpen] = React.useState(false);
  const [isCustomFeatDialogOpen, setIsCustomFeatDialogOpen] = React.useState(false);
  const [editingCustomFeat, setEditingCustomFeat] = React.useState<FeatType | null>(null);

  const selectableSlotsAvailable = calculateAvailableFeats(characterRace, characterLevel);
  const userChosenFeatsCount = selectedFeats.filter(f => !f.isGranted).length;
  const featSlotsLeft = selectableSlotsAvailable - userChosenFeatsCount;

  const baseFeat = 1;
  const raceData = DND_RACES.find(r => r.value === characterRace); // Corrected to DND_RACES
  const racialBonus = raceData?.bonusFeatSlots || 0;
  const levelProgressionFeats = Math.floor(characterLevel / 3);

  const characterForPrereqCheck = React.useMemo(() => ({
    abilityScores,
    skills,
    feats: selectedFeats,
    classes: characterClasses,
    race: characterRace,
    name: '', alignment: 'true-neutral', size: 'medium', age: 20,
    hp: 0, maxHp: 0, armorBonus: 0, shieldBonus: 0, sizeModifierAC: 0, naturalArmor: 0,
    deflectionBonus: 0, dodgeBonus: 0, acMiscModifier: 0, initiativeMiscModifier: 0,
    savingThrows: { fortitude: {base:0,magicMod:0,miscMod:0}, reflex: {base:0,magicMod:0,miscMod:0}, will: {base:0,magicMod:0,miscMod:0} },
    inventory: [], portraitDataUrl: '', personalStory: ''
  }), [abilityScores, skills, selectedFeats, characterClasses, characterRace]);

  const convertSelectionsToFeatTypes = React.useCallback((currentSelections: (string | undefined)[]): FeatType[] => {
    const granted = selectedFeats.filter(f => f.isGranted);
    const chosenAndCustom = currentSelections
      .filter((id): id is string => !!id)
      .map(idOrUuid => {
        const existingCustom = selectedFeats.find(sf => sf.id === idOrUuid && sf.isCustom);
        if (existingCustom) return existingCustom;

        const featDef = DND_FEATS.find(f => f.value === idOrUuid.split('-MULTI-INSTANCE-')[0]);
        if (featDef) {
          return {
            id: idOrUuid, // This preserves the unique ID for multi-instance feats
            name: featDef.label,
            description: featDef.description,
            prerequisites: featDef.prerequisites,
            effects: featDef.effects,
            canTakeMultipleTimes: featDef.canTakeMultipleTimes,
            requiresSpecialization: featDef.requiresSpecialization,
            isGranted: false,
            isCustom: false,
          };
        }
        // If it's not predefined and not an existing custom feat, it might be an error or an old ID. Filter it out.
        return null;
      })
      .filter((f): f is FeatType => f !== null);
    return [...granted, ...chosenAndCustom];
  }, [selectedFeats]);


  React.useEffect(() => {
    // Sync internal featSelections (IDs) with external selectedFeats (FeatType objects)
    // This ensures that if feats are loaded or changed externally, our UI reflects it.
    const userChosenFeatIds = selectedFeats.filter(f => !f.isGranted).map(f => f.id);
    // Only update if the actual IDs have changed, to prevent infinite loops.
    if (JSON.stringify(userChosenFeatIds.sort()) !== JSON.stringify(featSelections.filter(id => id !== undefined).sort())) {
      setFeatSelections(userChosenFeatIds);
    }
  }, [selectedFeats]);


  const handleFeatSelectedFromDialog = (featId: string) => {
    const featDef = DND_FEATS.find(f => f.value === featId);
    if (!featDef) return;

    const isAlreadySelected = featSelections.some(
      selectedId => selectedId?.split('-MULTI-INSTANCE-')[0] === featId
    );

    if (isAlreadySelected && !featDef.canTakeMultipleTimes) {
      toast({
        title: "Duplicate Feat",
        description: `You have already selected "${featDef.label}". It cannot be taken multiple times.`,
        variant: "destructive",
      });
      setIsFeatDialogOpen(false);
      return;
    }

    const uniqueId = (featDef.canTakeMultipleTimes && isAlreadySelected)
      ? `${featId}-MULTI-INSTANCE-${crypto.randomUUID()}`
      : featId;

    const newSelections = [...featSelections, uniqueId];
    setFeatSelections(newSelections);
    onFeatSelectionChange(convertSelectionsToFeatTypes(newSelections));
    setIsFeatDialogOpen(false);
  };


  const handleSaveCustomFeat = (featData: Partial<Feat> & { name: string }) => {
    let updatedFullFeatsList;
    if (featData.id) { // Editing existing custom feat
      updatedFullFeatsList = selectedFeats.map(f =>
        f.id === featData.id ? { ...f, ...featData, isCustom: true } : f
      );
    } else { // Adding new custom feat
      const newCustomFeat: Feat = {
        id: crypto.randomUUID(),
        ...featData,
        isCustom: true,
        isGranted: false, // Ensure not granted by default
      };
      updatedFullFeatsList = [...selectedFeats, newCustomFeat];
    }
    onFeatSelectionChange(updatedFullFeatsList);
    setEditingCustomFeat(null);
    // No need to update featSelections directly here, useEffect will sync from selectedFeats prop
  };


  const handleRemoveFeatSlot = (indexToRemove: number) => {
    const newSelections = featSelections.filter((_, index) => index !== indexToRemove);
    setFeatSelections(newSelections);
    onFeatSelectionChange(convertSelectionsToFeatTypes(newSelections));
  };

  const handleOpenEditCustomFeatDialog = (feat: Feat) => {
    setEditingCustomFeat(feat);
    setIsCustomFeatDialogOpen(true);
  };

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
          </div>

          <div className="space-y-2 mb-4">
            {/* Display Granted Feats */}
            {selectedFeats.filter(f => f.isGranted).map((feat) => {
              const featDetails = DND_FEATS.find(fDef => fDef.value === feat.id.split('-MULTI-INSTANCE-')[0]);
              const prereqStatus = featDetails ? checkFeatPrerequisites(featDetails, characterForPrereqCheck as Character, DND_FEATS) : { met: true, metMessages: [], unmetMessages: []};
              const allPrereqMessages = [...prereqStatus.metMessages, ...prereqStatus.unmetMessages];

              return (
                <div key={`granted-feat-${feat.id}`} className="py-2 px-3 border rounded-md bg-muted/50">
                  <h4 className="font-medium text-foreground">
                    {feat.name}
                    {feat.grantedNote && <span className="text-xs text-muted-foreground ml-1 italic">{feat.grantedNote}</span>}
                  </h4>
                  {feat.description && (
                    <div
                      className="text-xs text-muted-foreground mt-0.5 whitespace-normal"
                      dangerouslySetInnerHTML={{ __html: feat.description }}
                    />
                  )}
                  {(allPrereqMessages.length > 0 || (featDetails?.prerequisites?.special)) && (
                    <div className="text-xs mt-0.5 whitespace-normal text-muted-foreground">
                      Prerequisites:{' '}
                      {allPrereqMessages.length > 0 ?
                        allPrereqMessages.map((msg, idx) => (
                          <React.Fragment key={idx}>
                            <span
                              className={cn(prereqStatus.unmetMessages.includes(msg) ? 'text-destructive' : 'text-muted-foreground')}
                              dangerouslySetInnerHTML={{ __html: msg }}
                            />
                            {idx < allPrereqMessages.length - 1 && ', '}
                          </React.Fragment>
                        ))
                        : <span>None</span>
                      }
                    </div>
                  )}
                </div>
              );
            })}

            {/* Display User Chosen / Custom Feats */}
            {featSelections.map((featId, index) => {
              const currentFeat = selectedFeats.find(f => f.id === featId && !f.isGranted);
              const featDetails = currentFeat ? DND_FEATS.find(fDef => fDef.value === currentFeat.id.split('-MULTI-INSTANCE-')[0]) : null;
              const prereqStatus = featDetails ? checkFeatPrerequisites(featDetails, characterForPrereqCheck as Character, DND_FEATS) : null;

              return (
                <div key={`chosen-slot-${index}`} className="group flex items-start justify-between py-2 px-3 border-b border-border/50 hover:bg-muted/10 transition-colors">
                  <div className="flex-grow mr-2">
                    <h4 className="font-medium text-foreground">{currentFeat?.name || "No feat selected"}</h4>
                    {currentFeat?.isCustom ? (
                      <>
                        {currentFeat.description && <div className="text-xs text-muted-foreground mt-0.5 whitespace-normal" dangerouslySetInnerHTML={{ __html: currentFeat.description }}/>}
                        {currentFeat.prerequisitesText && <p className="text-xs mt-0.5 whitespace-normal text-muted-foreground">Prerequisites: {currentFeat.prerequisitesText}</p>}
                        {currentFeat.effectsText && <p className="text-xs mt-0.5 whitespace-normal text-muted-foreground">Effects: {currentFeat.effectsText}</p>}
                      </>
                    ) : featDetails ? (
                      <>
                        {featDetails.description && <div className="text-xs text-muted-foreground mt-0.5 whitespace-normal" dangerouslySetInnerHTML={{ __html: featDetails.description }}/>}
                        {prereqStatus && (prereqStatus.metMessages.length > 0 || prereqStatus.unmetMessages.length > 0 || featDetails.prerequisites?.special) && (
                          <div className="text-xs mt-0.5 whitespace-normal text-muted-foreground">
                            Prerequisites:{' '}
                            {[...prereqStatus.metMessages, ...prereqStatus.unmetMessages].length > 0 ?
                              [...prereqStatus.metMessages, ...prereqStatus.unmetMessages].map((msg, idx, arr) => (
                                <React.Fragment key={idx}>
                                  <span
                                    className={cn(prereqStatus.unmetMessages.includes(msg) ? 'text-destructive' : 'text-muted-foreground')}
                                    dangerouslySetInnerHTML={{ __html: msg }}
                                  />
                                  {idx < arr.length - 1 && ', '}
                                </React.Fragment>
                              ))
                              : <span>None</span>
                            }
                             {featDetails.prerequisites?.special && ![...prereqStatus.metMessages, ...prereqStatus.unmetMessages].some(m => m.includes(featDetails.prerequisites!.special!)) && (
                                <>
                                  {([...prereqStatus.metMessages, ...prereqStatus.unmetMessages].length > 0 ? ', ' : '')}
                                  <span className="text-muted-foreground">{featDetails.prerequisites.special}</span>
                                </>
                              )}
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                  <div className="flex items-center shrink-0">
                    {currentFeat?.isCustom && (
                      <Button
                        type="button" variant="ghost" size="icon"
                        onClick={() => handleOpenEditCustomFeatDialog(currentFeat)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-50 group-hover:opacity-100 transition-opacity"
                        aria-label={`Edit custom feat ${currentFeat.name}`}
                      ><Edit3 className="h-4 w-4" /></Button>
                    )}
                    <Button
                      type="button" variant="ghost" size="icon"
                      onClick={() => handleRemoveFeatSlot(index)}
                      className="h-8 w-8 text-destructive hover:text-destructive/80 opacity-50 group-hover:opacity-100 transition-opacity"
                      aria-label={`Remove feat slot`}
                    ><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              );
            })}
            {featSelections.length === 0 && selectedFeats.filter(f => !f.isGranted).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">No feats selected or added yet.</p>
            )}
          </div>

          <div className="mt-2 flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFeatDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Feat
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => { setEditingCustomFeat(null); setIsCustomFeatDialogOpen(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Custom Feat
            </Button>
          </div>
        </CardContent>
      </Card>
      <FeatSelectionDialog
        isOpen={isFeatDialogOpen}
        onOpenChange={setIsFeatDialogOpen}
        onFeatSelected={handleFeatSelectedFromDialog}
        allFeats={DND_FEATS}
        character={characterForPrereqCheck as Character}
      />
      <AddCustomFeatDialog
        isOpen={isCustomFeatDialogOpen}
        onOpenChange={setIsCustomFeatDialogOpen}
        onSave={handleSaveCustomFeat}
        initialFeatData={editingCustomFeat || undefined}
      />
    </>
  );
}
