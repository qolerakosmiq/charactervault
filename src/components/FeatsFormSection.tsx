
'use client';

import * as React from 'react';
import type {
  FeatDefinitionJsonData, CharacterFeatInstance, Character, AbilityScores, Skill,
  DndClassOption, DndRaceOption, CharacterAlignment, PrerequisiteMessage
} from '@/types/character';
import {
  DND_FEATS_DEFINITIONS, DND_RACES, SKILL_DEFINITIONS, DND_CLASSES,
  checkFeatPrerequisites, calculateAvailableFeats
} from '@/types/character';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, PlusCircle, Trash2, Edit3, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeatSelectionDialog } from './FeatSelectionDialog';
import { AddCustomFeatDialog } from './AddCustomFeatDialog';
import { useToast } from "@/hooks/use-toast";

interface FeatsFormSectionProps {
  character: Character; // Pass the whole character for prerequisite checks
  allAvailableFeatDefinitions: (FeatDefinitionJsonData & { isCustom?: boolean })[]; // Predefined + character's custom definitions
  chosenFeatInstances: CharacterFeatInstance[];
  customFeatDefinitions: (FeatDefinitionJsonData & { isCustom: true })[]; // Just the custom definitions for editing
  onFeatInstancesChange: (updatedInstances: CharacterFeatInstance[]) => void;
  onCustomFeatDefinitionsChange: (updatedDefinitions: (FeatDefinitionJsonData & { isCustom: true })[]) => void;
  abilityScores: AbilityScores; // Final scores after all modifiers
  skills: Skill[];
}

export function FeatsFormSection({
  character,
  allAvailableFeatDefinitions,
  chosenFeatInstances,
  customFeatDefinitions,
  onFeatInstancesChange,
  onCustomFeatDefinitionsChange,
  abilityScores,
  skills,
}: FeatsFormSectionProps) {
  const characterLevel = character.classes.reduce((sum, cls) => sum + cls.level, 0) || 1;
  const { toast } = useToast();

  const [isFeatDialogOpen, setIsFeatDialogOpen] = React.useState(false);
  const [isCustomFeatDialogOpen, setIsCustomFeatDialogOpen] = React.useState(false);
  const [editingCustomFeatDefinition, setEditingCustomFeatDefinition] = React.useState<(FeatDefinitionJsonData & { isCustom: true }) | null>(null);

  const { availableFeatSlots, baseFeat, racialBonus, levelProgressionFeats } = React.useMemo(() => {
    const slots = calculateAvailableFeats(character.race, characterLevel);
    const raceData = DND_RACES.find(r => r.value === character.race);
    const bonus = raceData?.bonusFeatSlots || 0;
    const base = 1;
    const progression = Math.floor(characterLevel / 3);
    return { availableFeatSlots: slots, baseFeat: base, racialBonus: bonus, levelProgressionFeats: progression };
  }, [character.race, characterLevel]);

  const userChosenFeatInstancesCount = chosenFeatInstances.filter(f => !f.isGranted).length;
  const featSlotsLeft = availableFeatSlots - userChosenFeatInstancesCount;

  // Character object for prerequisite check should use the passed character prop
  const characterForPrereqCheck = React.useMemo(() => ({
    ...character, // Includes chosenFeatInstances (as character.feats) and customFeatDefinitions
    abilityScores, // Use final scores for checks
    skills,
  }), [character, abilityScores, skills]);


  const handleAddChosenFeatInstance = (definitionId: string, specializationDetail?: string) => {
    const definition = allAvailableFeatDefinitions.find(def => def.value === definitionId);
    if (!definition) {
      toast({ title: "Error", description: "Selected feat definition not found.", variant: "destructive" });
      return;
    }

    const existingInstancesOfThisDef = chosenFeatInstances.filter(
      inst => inst.definitionId === definitionId && !inst.isGranted
    );

    if (!definition.canTakeMultipleTimes && existingInstancesOfThisDef.length > 0) {
      toast({ title: "Duplicate Feat", description: `"${definition.label}" cannot be taken multiple times.`, variant: "destructive" });
      return;
    }
    // Check if it's a granted feat that cannot be taken multiple times
    const isGrantedAndNotMultiTake = chosenFeatInstances.some(
        inst => inst.definitionId === definitionId && inst.isGranted && !definition.canTakeMultipleTimes
    );
    if(isGrantedAndNotMultiTake && existingInstancesOfThisDef.length > 0){
        toast({ title: "Feat Already Granted", description: `"${definition.label}" is already granted and cannot be chosen again.`, variant: "destructive" });
        return;
    }


    let newInstanceId = definitionId;
    if (definition.canTakeMultipleTimes) {
      newInstanceId = `${definitionId}-MULTI-INSTANCE-${crypto.randomUUID()}`;
    }

    const newInstance: CharacterFeatInstance = {
      definitionId: definition.value,
      instanceId: newInstanceId,
      specializationDetail: specializationDetail || '',
      isGranted: false,
    };

    onFeatInstancesChange([...chosenFeatInstances, newInstance].sort((a, b) => {
      const defA = allAvailableFeatDefinitions.find(d => d.value === a.definitionId);
      const defB = allAvailableFeatDefinitions.find(d => d.value === b.definitionId);
      return (defA?.label || '').localeCompare(defB?.label || '');
    }));
    setIsFeatDialogOpen(false);
  };

  const handleRemoveChosenFeatInstance = (instanceIdToRemove: string) => {
    const updatedInstances = chosenFeatInstances.filter(inst => inst.instanceId !== instanceIdToRemove);
    onFeatInstancesChange(updatedInstances);
  };

  const handleSaveCustomFeatDefinition = (featDefData: (FeatDefinitionJsonData & { isCustom: true })) => {
    let updatedDefinitions;
    const existingDefIndex = customFeatDefinitions.findIndex(def => def.value === featDefData.value);

    if (existingDefIndex > -1) { // Editing existing
      updatedDefinitions = [...customFeatDefinitions];
      const oldDef = updatedDefinitions[existingDefIndex];
      updatedDefinitions[existingDefIndex] = featDefData;

      // If changed from multi-take to single-take, prune extra instances
      if (oldDef.canTakeMultipleTimes && !featDefData.canTakeMultipleTimes) {
        const instancesOfThisFeat = chosenFeatInstances.filter(inst => inst.definitionId === featDefData.value && !inst.isGranted);
        if (instancesOfThisFeat.length > 1) {
          const firstInstance = instancesOfThisFeat[0];
          const newChosenInstances = chosenFeatInstances.filter(
            inst => inst.isGranted || inst.definitionId !== featDefData.value || inst.instanceId === firstInstance.instanceId
          );
          onFeatInstancesChange(newChosenInstances);
        }
      }

    } else { // Adding new
      updatedDefinitions = [...customFeatDefinitions, featDefData];
    }
    onCustomFeatDefinitionsChange(updatedDefinitions.sort((a,b) => a.label.localeCompare(b.label)));
    setEditingCustomFeatDefinition(null);
    setIsCustomFeatDialogOpen(false);
  };

  const handleOpenEditCustomFeatDialog = (definitionId: string) => {
    const defToEdit = customFeatDefinitions.find(def => def.value === definitionId);
    if (defToEdit) {
      setEditingCustomFeatDefinition(defToEdit);
      setIsCustomFeatDialogOpen(true);
    } else {
      toast({ title: "Error", description: "Could not find custom feat definition to edit.", variant: "destructive" });
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
              {racialBonus > 0 && (<> {' + '}Racial Bonus <strong className="font-bold text-primary">[{racialBonus}]</strong></>)}
              {' + '}Level Progression <strong className="font-bold text-primary">[{levelProgressionFeats}]</strong>
            </p>
          </div>

          <div className="space-y-2 mb-4">
            {chosenFeatInstances.map((instance) => {
              const definition = allAvailableFeatDefinitions.find(def => def.value === instance.definitionId);
              if (!definition) return null; // Should not happen if data is consistent

              const prereqMessages: PrerequisiteMessage[] = checkFeatPrerequisites(definition, characterForPrereqCheck, allAvailableFeatDefinitions);
              const isCustomDefinition = allAvailableFeatDefinitions.find(d => d.value === instance.definitionId)?.isCustom;

              return (
                <div key={instance.instanceId} className="group flex items-start justify-between py-2 px-3 border-b border-border/50 hover:bg-muted/10 transition-colors">
                  <div className="flex-grow mr-2">
                    <h4 className="font-medium text-foreground">
                      {definition.label}
                      {instance.isGranted && instance.grantedNote && <span className="text-xs text-muted-foreground ml-1 italic">{instance.grantedNote}</span>}
                      {definition.requiresSpecialization && instance.specializationDetail && <span className="text-xs text-muted-foreground ml-1">({instance.specializationDetail})</span>}
                    </h4>
                    {definition.description && <div className="text-xs text-muted-foreground mt-0.5 whitespace-normal" dangerouslySetInnerHTML={{ __html: definition.description }} />}
                    {definition.effectsText && <p className="text-xs text-muted-foreground mt-0.5 whitespace-normal">Effects: {definition.effectsText}</p>}
                    {prereqMessages.length > 0 ? (
                      <div className="text-xs mt-0.5 whitespace-normal text-muted-foreground">
                        Prerequisites:{' '}
                        {prereqMessages.map((msg, idx, arr) => (
                          <React.Fragment key={idx}>
                            <span className={cn(!msg.isMet ? 'text-destructive' : 'text-muted-foreground')} dangerouslySetInnerHTML={{ __html: msg.text }} />
                            {idx < arr.length - 1 && ', '}
                          </React.Fragment>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs mt-0.5 whitespace-normal text-muted-foreground">Prerequisites: None</p>
                    )}
                  </div>
                  <div className="flex items-center shrink-0">
                    {isCustomDefinition && !instance.isGranted && (
                      <Button
                        type="button" variant="ghost" size="icon"
                        onClick={() => handleOpenEditCustomFeatDialog(instance.definitionId)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-50 group-hover:opacity-100 transition-opacity"
                        aria-label={`Edit custom feat ${definition.label}`}
                      ><Pencil className="h-4 w-4" /></Button>
                    )}
                    {!instance.isGranted && (
                      <Button
                        type="button" variant="ghost" size="icon"
                        onClick={() => handleRemoveChosenFeatInstance(instance.instanceId)}
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
            <Button type="button" variant="outline" size="sm" onClick={() => { setEditingCustomFeatDefinition(null); setIsCustomFeatDialogOpen(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Custom Feat Definition
            </Button>
          </div>
        </CardContent>
      </Card>
      <FeatSelectionDialog
        isOpen={isFeatDialogOpen}
        onOpenChange={setIsFeatDialogOpen}
        onFeatSelected={handleAddChosenFeatInstance} // Passes definitionId
        allFeats={allAvailableFeatDefinitions}
        character={characterForPrereqCheck}
      />
      <AddCustomFeatDialog
        isOpen={isCustomFeatDialogOpen}
        onOpenChange={setIsCustomFeatDialogOpen}
        onSave={handleSaveCustomFeatDefinition}
        initialFeatData={editingCustomFeatDefinition || undefined} // Pass FeatDefinitionJsonData
        allFeats={DND_FEATS_DEFINITIONS}
        allSkills={allSkillOptionsForDialog}
        allClasses={DND_CLASSES}
        allRaces={DND_RACES}
      />
    </>
  );
}
