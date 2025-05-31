
'use client';

import * as React from 'react';
import type { Feat as FeatType, DndRaceId, CharacterClass, FeatDefinitionJsonData, Character, AbilityScores, Skill, DndClassOption, DndRaceOption, CharacterAlignment, PrerequisiteMessage } from '@/types/character';
import { DND_FEATS, DND_RACES, SKILL_DEFINITIONS, DND_CLASSES, checkFeatPrerequisites, calculateAvailableFeats } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, PlusCircle, Trash2, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeatSelectionDialog } from './FeatSelectionDialog';
import { AddCustomFeatDialog } from './AddCustomFeatDialog';
import { useToast } from "@/hooks/use-toast";

interface FeatsFormSectionProps {
  characterRace: DndRaceId | string;
  characterClasses: CharacterClass[];
  characterAlignment: CharacterAlignment;
  selectedFeats: FeatType[]; // This is the character.feats array
  onFeatSelectionChange: (updatedFeats: FeatType[]) => void;
  abilityScores: AbilityScores;
  skills: Skill[];
}

export function FeatsFormSection({
  characterRace,
  characterClasses,
  characterAlignment,
  selectedFeats,
  onFeatSelectionChange,
  abilityScores,
  skills,
}: FeatsFormSectionProps) {
  const characterLevel = characterClasses.reduce((sum, cls) => sum + cls.level, 0) || 1;
  const { toast } = useToast();

  const [isFeatDialogOpen, setIsFeatDialogOpen] = React.useState(false);
  const [isCustomFeatDialogOpen, setIsCustomFeatDialogOpen] = React.useState(false);
  const [editingCustomFeat, setEditingCustomFeat] = React.useState<FeatType | null>(null);

  const { availableFeatSlots, baseFeat, racialBonus, levelProgressionFeats } = React.useMemo(() => {
    const slots = calculateAvailableFeats(characterRace, characterLevel);
    const raceData = DND_RACES.find(r => r.value === characterRace);
    const bonus = raceData?.bonusFeatSlots || 0;
    const base = 1; // At level 1
    const progression = Math.floor(characterLevel / 3);
    return { availableFeatSlots: slots, baseFeat: base, racialBonus: bonus, levelProgressionFeats: progression };
  }, [characterRace, characterLevel]);

  const userAddedFeatsCount = selectedFeats.filter(f => !f.isGranted).length;
  const featSlotsLeft = availableFeatSlots - userAddedFeatsCount;

  const characterForPrereqCheck = React.useMemo(() => ({
    abilityScores,
    skills,
    feats: selectedFeats,
    classes: characterClasses,
    race: characterRace,
    alignment: characterAlignment,
    name: '', 
    size: 'medium', 
    age: 20, 
    hp: 0, maxHp: 0, armorBonus: 0, shieldBonus: 0, sizeModifierAC: 0, naturalArmor: 0,
    deflectionBonus: 0, dodgeBonus: 0, acMiscModifier: 0, initiativeMiscModifier: 0,
    savingThrows: { fortitude: {base:0,magicMod:0,miscMod:0}, reflex: {base:0,magicMod:0,miscMod:0}, will: {base:0,magicMod:0,miscMod:0} },
    inventory: [], portraitDataUrl: '', personalStory: ''
  }), [abilityScores, skills, selectedFeats, characterClasses, characterRace, characterAlignment]);

  const allFeatsForDialog = React.useMemo(() => {
    const predefinedFeatsAsDefinitions: FeatDefinitionJsonData[] = DND_FEATS.map(f => ({
      ...f, // Spread all properties from DND_FEATS definition
      isCustom: false, // Explicitly mark as not custom
    }));

    const customFeatDefinitions = selectedFeats
      .filter(feat => feat.isCustom && !feat.id.includes("-MULTI-INSTANCE-")) 
      .map(feat => ({ // This is FeatType being mapped to FeatDefinitionJsonData for the dialog
        value: feat.id, 
        label: feat.name,
        description: feat.description,
        prerequisites: feat.prerequisites,
        effects: feat.effects, 
        effectsText: feat.effectsText,
        canTakeMultipleTimes: feat.canTakeMultipleTimes,
        requiresSpecialization: feat.requiresSpecialization,
        isCustom: true, // Mark this for later identification
      }));
    
    const combinedMap = new Map<string, FeatDefinitionJsonData & { isCustom?: boolean }>();
    predefinedFeatsAsDefinitions.forEach(f => combinedMap.set(f.value, f));
    customFeatDefinitions.forEach(f => combinedMap.set(f.value, f)); 

    return Array.from(combinedMap.values());
  }, [selectedFeats]);


  const handleFeatSelectedFromDialog = (featIdFromDialog: string) => {
    // featIdFromDialog is the base ID (value from DND_FEATS or base UUID of a custom feat definition)
    const sourceDefinition = allFeatsForDialog.find(f => f.value === featIdFromDialog);
    if (!sourceDefinition) {
        toast({ title: "Error", description: `Feat definition ${featIdFromDialog} not found.`, variant: "destructive" });
        return;
    }

    // Check against all instances of this feat (including granted ones if any)
    const existingInstancesAndGranted = selectedFeats.filter(sf =>
        sf.id.split('-MULTI-INSTANCE-')[0] === featIdFromDialog
    );

    if (!sourceDefinition.canTakeMultipleTimes && existingInstancesAndGranted.length > 0) {
      toast({ title: "Duplicate Feat", description: `"${sourceDefinition.label}" is already selected or granted and cannot be taken multiple times.`, variant: "destructive" });
      setIsFeatDialogOpen(false);
      return;
    }

    let newFeatInstanceId = featIdFromDialog; 

    if (sourceDefinition.canTakeMultipleTimes) {
      // For custom feats that can be taken multiple times, ALWAYS generate a multi-instance ID for the *taken* instance.
      // The original definition object (with base UUID) remains as a template.
      // For predefined feats, generate multi-instance ID if it's not the first user-chosen one.
      if (sourceDefinition.isCustom || existingInstancesAndGranted.some(inst => !inst.isGranted)) { // if custom, or if predefined and already have a user-chosen instance
          newFeatInstanceId = `${featIdFromDialog}-MULTI-INSTANCE-${crypto.randomUUID()}`;
      } else if (existingInstancesAndGranted.some(inst => inst.isGranted) && !existingInstancesAndGranted.some(inst => !inst.isGranted)) {
          // If only granted instances exist, the first user-chosen one can use the base ID
          // unless it's a custom feat (covered by sourceDefinition.isCustom)
      }
    }
    
    const newFeatToAdd: FeatType = {
      id: newFeatInstanceId,
      name: sourceDefinition.label,
      description: sourceDefinition.description,
      prerequisites: sourceDefinition.prerequisites,
      effects: sourceDefinition.effects,
      effectsText: (sourceDefinition as any).effectsText, // If it's a custom def, it will have this
      canTakeMultipleTimes: sourceDefinition.canTakeMultipleTimes,
      requiresSpecialization: sourceDefinition.requiresSpecialization,
      specializationDetail: '', 
      isGranted: false,
      isCustom: !!sourceDefinition.isCustom, 
    };

    onFeatSelectionChange([...selectedFeats, newFeatToAdd].sort((a,b) => a.name.localeCompare(b.name)));
    setIsFeatDialogOpen(false);
  };

  const handleSaveCustomFeat = (featData: Partial<FeatType> & { name: string }) => {
    let updatedFullFeatsList;
    const baseCustomFeatId = featData.id; 

    if (baseCustomFeatId) { // Editing an existing custom feat definition
      updatedFullFeatsList = selectedFeats.map(f => {
        if (f.id === baseCustomFeatId && f.isCustom && !f.id.includes("-MULTI-INSTANCE-")) { 
          // This is the definition itself
          return { ...f, ...featData, isCustom: true, isGranted: false } as FeatType;
        }
        // If this feat 'f' is an *instance* of the custom feat being edited
        if (f.isCustom && f.id.startsWith(`${baseCustomFeatId}-MULTI-INSTANCE-`)) {
          return {
            ...f, 
            name: featData.name, 
            description: featData.description,
            prerequisites: featData.prerequisites,
            effects: featData.effects,
            effectsText: featData.effectsText,
            canTakeMultipleTimes: featData.canTakeMultipleTimes,
            requiresSpecialization: featData.requiresSpecialization,
          };
        }
        return f;
      });
    } else { // Adding a brand new custom feat definition
      const newCustomFeatDefinition: FeatType = {
        id: crypto.randomUUID(), 
        name: featData.name,
        description: featData.description,
        prerequisites: featData.prerequisites,
        effects: featData.effects,
        effectsText: featData.effectsText,
        canTakeMultipleTimes: featData.canTakeMultipleTimes,
        requiresSpecialization: featData.requiresSpecialization,
        isCustom: true,
        isGranted: false,
      };
      updatedFullFeatsList = [...selectedFeats, newCustomFeatDefinition];
    }
    onFeatSelectionChange(updatedFullFeatsList.sort((a,b) => a.name.localeCompare(b.name)));
    setEditingCustomFeat(null); 
    setIsCustomFeatDialogOpen(false);
  };

  const handleRemoveFeatSlot = (featIdToRemove: string) => {
    const newFeatsList = selectedFeats.filter(f => f.id !== featIdToRemove);
    onFeatSelectionChange(newFeatsList.sort((a,b) => a.name.localeCompare(b.name)));
  };

  const handleOpenEditCustomFeatDialog = (featInstance: FeatType) => {
    const baseFeatId = featInstance.id.split('-MULTI-INSTANCE-')[0];
    const featDefinitionToEdit = selectedFeats.find(f => f.id === baseFeatId && f.isCustom && !f.id.includes("-MULTI-INSTANCE-"));
    
    if (featDefinitionToEdit) {
      setEditingCustomFeat(featDefinitionToEdit);
      setIsCustomFeatDialogOpen(true);
    } else {
        toast({title:"Error", description: "Could not find custom feat definition to edit.", variant: "destructive"});
    }
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
                Base <strong className="font-bold text-primary">[{baseFeat}]</strong>
                {racialBonus > 0 && (
                    <>
                    {' + '}Racial Bonus <strong className="font-bold text-primary">[{racialBonus}]</strong>
                    </>
                )}
                {' + '}Level Progression <strong className="font-bold text-primary">[{levelProgressionFeats}]</strong>
            </p>
          </div>

          <div className="space-y-2 mb-4">
            {selectedFeats.filter(f => f.isGranted || !f.id.includes("MULTI-INSTANCE-") || selectedFeats.find(def => def.id === f.id.split("-MULTI-INSTANCE-")[0] && def.isCustom)).length === 0 && ( // Filter out definition-only custom feats unless they are also instances
                 <p className="text-sm text-muted-foreground text-center py-2">No feats selected or granted yet.</p>
            )}
            {selectedFeats
              .filter(featInstance => {
                  // Display granted feats
                  if (featInstance.isGranted) return true;
                  // Display chosen predefined feats
                  if (!featInstance.isCustom) return true;
                  // Display chosen custom feat instances (multi-instance IDs)
                  if (featInstance.isCustom && featInstance.id.includes("-MULTI-INSTANCE-")) return true;
                  // For custom feat definitions (base UUID, not multi-instance):
                  // Only display them if they represent a chosen instance of a non-multi-take feat.
                  // This prevents showing the definition itself if only multi-take instances of it exist.
                  if (featInstance.isCustom && !featInstance.id.includes("-MULTI-INSTANCE-")) {
                      const definition = allFeatsForDialog.find(def => def.value === featInstance.id);
                      if (definition && !definition.canTakeMultipleTimes) return true; // Show if it's a single-take chosen instance
                      // If it can be taken multiple times, the definition itself shouldn't be listed as "taken"
                      // unless it's the *only* way it's represented (which handleFeatSelectedFromDialog tries to avoid)
                      return false; // Avoids listing definition if multi-take instances exist
                  }
                  return false;
              })
              .map((featInstance) => {
              const baseFeatIdForDisplay = featInstance.id.split('-MULTI-INSTANCE-')[0];
              // Find the definition (predefined or custom) from allFeatsForDialog for display details
              let featDisplayDefinition: (FeatDefinitionJsonData & { isCustom?: boolean }) | undefined = allFeatsForDialog.find(f => f.value === baseFeatIdForDisplay);
              
              if (!featDisplayDefinition) { 
                  // Fallback if somehow not in allFeatsForDialog (shouldn't happen for valid feats)
                  featDisplayDefinition = {
                      value: featInstance.id,
                      label: featInstance.name,
                      description: featInstance.description,
                      prerequisites: featInstance.prerequisites,
                      effects: featInstance.effects,
                      effectsText: featInstance.effectsText,
                      canTakeMultipleTimes: featInstance.canTakeMultipleTimes,
                      requiresSpecialization: featInstance.requiresSpecialization,
                      isCustom: featInstance.isCustom,
                  };
              }

              const prereqMessages: PrerequisiteMessage[] = checkFeatPrerequisites(featDisplayDefinition, characterForPrereqCheck as Character, allFeatsForDialog);

              return (
                <div key={`feat-${featInstance.id}`} className="group flex items-start justify-between py-2 px-3 border-b border-border/50 hover:bg-muted/10 transition-colors">
                  <div className="flex-grow mr-2">
                    <h4 className="font-medium text-foreground">
                      {featInstance.name} 
                      {featInstance.isGranted && featInstance.grantedNote && <span className="text-xs text-muted-foreground ml-1 italic">{featInstance.grantedNote}</span>}
                      {featInstance.requiresSpecialization && featInstance.specializationDetail && <span className="text-xs text-muted-foreground ml-1">({featInstance.specializationDetail})</span>}
                      {featInstance.isCustom && featInstance.id.includes("-MULTI-INSTANCE-") && <span className="text-xs text-muted-foreground ml-1">(Instance)</span>}
                    </h4>
                    
                    {featDisplayDefinition.description && <div className="text-xs text-muted-foreground mt-0.5 whitespace-normal" dangerouslySetInnerHTML={{ __html: featDisplayDefinition.description }} />}
                    
                    {featDisplayDefinition.effectsText && <p className="text-xs text-muted-foreground mt-0.5 whitespace-normal">Effects: {featDisplayDefinition.effectsText}</p>}


                    {prereqMessages.length > 0 ? (
                       <div className="text-xs mt-0.5 whitespace-normal text-muted-foreground">
                       Prerequisites:{' '}
                       {prereqMessages.map((msg, idx, arr) => (
                         <React.Fragment key={idx}>
                           <span
                             className={cn(!msg.isMet ? 'text-destructive' : 'text-muted-foreground')}
                             dangerouslySetInnerHTML={{ __html: msg.text }}
                           />
                           {idx < arr.length - 1 && ', '}
                         </React.Fragment>
                       ))}
                     </div>
                    ) : (
                        <p className="text-xs mt-0.5 whitespace-normal text-muted-foreground">Prerequisites: None</p>
                    )}
                  </div>
                  
                  <div className="flex items-center shrink-0">
                    {featInstance.isCustom && ( // Show edit for any custom feat (definition or instance)
                      <Button
                        type="button" variant="ghost" size="icon"
                        onClick={() => handleOpenEditCustomFeatDialog(featInstance)} 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-50 group-hover:opacity-100 transition-opacity"
                        aria-label={`Edit custom feat ${featInstance.name}`}
                      ><Edit3 className="h-4 w-4" /></Button>
                    )}
                    {!featInstance.isGranted && ( // Can only remove non-granted feats
                      <Button
                        type="button" variant="ghost" size="icon"
                        onClick={() => handleRemoveFeatSlot(featInstance.id)} 
                        className="h-8 w-8 text-destructive hover:text-destructive/80 opacity-50 group-hover:opacity-100 transition-opacity"
                        aria-label={`Remove feat instance`}
                      ><Trash2 className="h-4 w-4" /></Button>
                    )}
                  </div>
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
        allFeats={allFeatsForDialog} 
        character={characterForPrereqCheck as Character}
      />
      <AddCustomFeatDialog
        isOpen={isCustomFeatDialogOpen}
        onOpenChange={setIsCustomFeatDialogOpen}
        onSave={handleSaveCustomFeat}
        initialFeatData={editingCustomFeat || undefined}
        allFeats={DND_FEATS} 
        allSkills={allSkillOptionsForDialog}
        allClasses={DND_CLASSES}
        allRaces={DND_RACES}
      />
    </>
  );
}
