
'use client';

import * as React from 'react';
import type { Feat as FeatType, DndRaceId, CharacterClass, FeatDefinitionJsonData, Character, AbilityScores, Skill } from '@/types/character';
import { DND_FEATS, DND_RACES, SKILL_DEFINITIONS, checkFeatPrerequisites } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, PlusCircle, Trash2, Edit3 } from 'lucide-react'; // Removed ScrollArea import
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

  const baseFeat = 1;
  const raceData = DND_RACES.find(r => r.value === characterRace);
  const racialBonus = raceData?.bonusFeatSlots || 0;
  const levelProgressionFeats = Math.floor(characterLevel / 3);
  const selectableSlotsAvailable = baseFeat + racialBonus + levelProgressionFeats;

  const userChosenFeats = selectedFeats.filter(f => !f.isGranted && !f.isCustom);
  const customFeats = selectedFeats.filter(f => f.isCustom);
  const userAddedFeatsCount = userChosenFeats.length + customFeats.length;
  const featSlotsLeft = selectableSlotsAvailable - userAddedFeatsCount;

  const characterForPrereqCheck = React.useMemo(() => ({
    abilityScores,
    skills,
    feats: selectedFeats,
    classes: characterClasses,
    race: characterRace,
    // Minimal other fields needed for checkFeatPrerequisites
    name: '', alignment: 'true-neutral', size: 'medium', age: 20,
    hp: 0, maxHp: 0, armorBonus: 0, shieldBonus: 0, sizeModifierAC: 0, naturalArmor: 0,
    deflectionBonus: 0, dodgeBonus: 0, acMiscModifier: 0, initiativeMiscModifier: 0,
    savingThrows: { fortitude: {base:0,magicMod:0,miscMod:0}, reflex: {base:0,magicMod:0,miscMod:0}, will: {base:0,magicMod:0,miscMod:0} },
    inventory: [], portraitDataUrl: '', personalStory: ''
  }), [abilityScores, skills, selectedFeats, characterClasses, characterRace]);

  const convertSelectionsToFeatTypes = React.useCallback((currentSelections: (string | undefined)[]): FeatType[] => {
    const granted = selectedFeats.filter(f => f.isGranted);
    const currentCustomFeats = selectedFeats.filter(f => f.isCustom); // Preserve all existing custom feats

    const chosenPredefined = currentSelections
      .filter((id): id is string => !!id && !currentCustomFeats.some(cf => cf.id === id)) // Ensure it's not a custom feat's ID
      .map(idOrUuid => {
        const featDef = DND_FEATS.find(f => f.value === idOrUuid.split('-MULTI-INSTANCE-')[0]);
        if (featDef) {
          return {
            id: idOrUuid,
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
        return null;
      })
      .filter((f): f is FeatType => f !== null);
    return [...granted, ...chosenPredefined, ...currentCustomFeats];
  }, [selectedFeats]);

  React.useEffect(() => {
    const userChosenPredefinedFeatIds = selectedFeats
      .filter(f => !f.isGranted && !f.isCustom)
      .map(f => f.id);
    
    // Only update if the actual IDs of *predefined chosen feats* have changed.
    // Custom feats are managed separately via AddCustomFeatDialog.
    const currentInternalPredefinedIds = featSelections.filter(id => id !== undefined && !selectedFeats.some(sf => sf.isCustom && sf.id === id));

    if (JSON.stringify(userChosenPredefinedFeatIds.sort()) !== JSON.stringify(currentInternalPredefinedIds.sort())) {
      setFeatSelections(userChosenPredefinedFeatIds);
    }
  }, [selectedFeats, featSelections]);

  const handleFeatSelectedFromDialog = (featId: string) => {
    const featDef = DND_FEATS.find(f => f.value === featId);
    if (!featDef) return;

    const isAlreadySelected = featSelections.some(
      selectedId => selectedId?.split('-MULTI-INSTANCE-')[0] === featId
    );
    const isAlreadyGranted = selectedFeats.some(sf => sf.isGranted && sf.id.split('-MULTI-INSTANCE-')[0] === featId);


    if (isAlreadySelected && !featDef.canTakeMultipleTimes) {
      toast({ title: "Duplicate Feat", description: `You have already selected "${featDef.label}". It cannot be taken multiple times.`, variant: "destructive" });
      setIsFeatDialogOpen(false);
      return;
    }
    if (isAlreadyGranted && !featDef.canTakeMultipleTimes) {
       toast({ title: "Feat Already Granted", description: `"${featDef.label}" is already granted to you and cannot be selected again.`, variant: "destructive" });
       setIsFeatDialogOpen(false);
       return;
    }


    const uniqueId = (featDef.canTakeMultipleTimes && (isAlreadySelected || isAlreadyGranted))
      ? `${featId}-MULTI-INSTANCE-${crypto.randomUUID()}`
      : featId;

    const newSelections = [...featSelections, uniqueId];
    setFeatSelections(newSelections);
    onFeatSelectionChange(convertSelectionsToFeatTypes(newSelections));
    setIsFeatDialogOpen(false);
  };

  const handleSaveCustomFeat = (featData: Partial<Feat> & { name: string }) => {
    let updatedFullFeatsList;
    if (featData.id && selectedFeats.some(f => f.id === featData.id && f.isCustom)) { // Editing existing custom feat
      updatedFullFeatsList = selectedFeats.map(f =>
        f.id === featData.id ? { ...f, ...featData, isCustom: true, isGranted: false } : f
      );
    } else { // Adding new custom feat
      const newCustomFeat: FeatType = {
        id: crypto.randomUUID(),
        name: featData.name,
        description: featData.description,
        prerequisites: featData.prerequisites,
        effects: featData.effects, // Assuming custom feats might have textual effects defined
        effectsText: featData.effectsText,
        canTakeMultipleTimes: featData.canTakeMultipleTimes,
        requiresSpecialization: featData.requiresSpecialization,
        isCustom: true,
        isGranted: false,
      };
      updatedFullFeatsList = [...selectedFeats, newCustomFeat];
    }
    onFeatSelectionChange(updatedFullFeatsList);
    setEditingCustomFeat(null);
  };

  const handleRemoveFeat = (featIdToRemove: string) => {
    // If it's a predefined chosen feat, update featSelections
    const newSelections = featSelections.filter(id => id !== featIdToRemove);
    if (newSelections.length !== featSelections.length) {
      setFeatSelections(newSelections);
      onFeatSelectionChange(convertSelectionsToFeatTypes(newSelections));
    } else {
      // If it's a custom feat, or a granted feat (though remove should be disabled for granted)
      const updatedFullList = selectedFeats.filter(f => f.id !== featIdToRemove);
      onFeatSelectionChange(updatedFullList);
    }
  };

  const handleOpenEditCustomFeatDialog = (feat: FeatType) => {
    setEditingCustomFeat(feat);
    setIsCustomFeatDialogOpen(true);
  };
  
  const allSkillOptionsForDialog = React.useMemo(() => {
    return skills.map(s => ({ value: s.id, label: s.name }));
  }, [skills]);


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
              {characterRace && racialBonus > 0 && (
                <>
                  {' + '}Racial Bonus <strong className="font-bold text-primary">[{racialBonus}]</strong>
                </>
              )}
              {' + '}Level Progression <strong className="font-bold text-primary">[{levelProgressionFeats}]</strong>
            </p>
          </div>

          <div className="space-y-2 mb-4">
            {selectedFeats.length === 0 && (
                 <p className="text-sm text-muted-foreground text-center py-2">No feats selected or granted yet.</p>
            )}
            {selectedFeats.map((feat) => {
              const featDetails = feat.isCustom ? null : DND_FEATS.find(fDef => fDef.value === feat.id.split('-MULTI-INSTANCE-')[0]);
              const prereqStatus = feat.isCustom && feat.prerequisites 
                ? checkFeatPrerequisites(feat as FeatDefinitionJsonData, characterForPrereqCheck as Character, DND_FEATS) 
                : featDetails 
                ? checkFeatPrerequisites(featDetails, characterForPrereqCheck as Character, DND_FEATS) 
                : null;

              const displayPrereqs = prereqStatus?.metMessages.concat(prereqStatus.unmetMessages) || [];

              return (
                <div key={`feat-${feat.id}`} className="group flex items-start justify-between py-2 px-3 border-b border-border/50 hover:bg-muted/10 transition-colors">
                  <div className="flex-grow mr-2">
                    <h4 className="font-medium text-foreground">
                      {feat.name}
                      {feat.isGranted && feat.grantedNote && <span className="text-xs text-muted-foreground ml-1 italic">{feat.grantedNote}</span>}
                    </h4>
                    {(feat.description) && (
                      <div
                        className="text-xs text-muted-foreground mt-0.5 whitespace-normal"
                        dangerouslySetInnerHTML={{ __html: feat.description }}
                      />
                    )}
                    {feat.isCustom && feat.effectsText && (
                       <p className="text-xs mt-0.5 whitespace-normal text-muted-foreground">Effects: {feat.effectsText}</p>
                    )}
                    {displayPrereqs.length > 0 ? (
                      <div className="text-xs mt-0.5 whitespace-normal text-muted-foreground">
                        Prerequisites:{' '}
                        {displayPrereqs.map((msg, idx, arr) => (
                          <React.Fragment key={idx}>
                            <span
                              className={cn(prereqStatus?.unmetMessages.includes(msg) ? 'text-destructive' : 'text-muted-foreground')}
                              dangerouslySetInnerHTML={{ __html: msg }}
                            />
                            {idx < arr.length - 1 && ', '}
                          </React.Fragment>
                        ))}
                      </div>
                    ) : (feat.isCustom && !feat.prerequisites) ? (
                         <p className="text-xs mt-0.5 whitespace-normal text-muted-foreground">Prerequisites: None (Custom)</p>
                    ) : (featDetails && !featDetails.prerequisites) ? (
                         <p className="text-xs mt-0.5 whitespace-normal text-muted-foreground">Prerequisites: None</p>
                    ) : null}
                  </div>
                  {!feat.isGranted && (
                    <div className="flex items-center shrink-0">
                      {feat.isCustom && (
                        <Button
                          type="button" variant="ghost" size="icon"
                          onClick={() => handleOpenEditCustomFeatDialog(feat)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-50 group-hover:opacity-100 transition-opacity"
                          aria-label={`Edit custom feat ${feat.name}`}
                        ><Edit3 className="h-4 w-4" /></Button>
                      )}
                      <Button
                        type="button" variant="ghost" size="icon"
                        onClick={() => handleRemoveFeat(feat.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive/80 opacity-50 group-hover:opacity-100 transition-opacity"
                        aria-label={`Remove feat`}
                      ><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  )}
                </div>
              );
            })}
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
        allFeats={DND_FEATS}
        allSkills={allSkillOptionsForDialog}
      />
    </>
  );
}
