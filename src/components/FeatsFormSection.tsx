
'use client';

import * as React from 'react';
import type {
  FeatDefinitionJsonData, CharacterFeatInstance, Character, AbilityScores, Skill,
  SkillDefinitionJsonData
} from '@/types/character';
import {
  DND_FEATS_DEFINITIONS, DND_RACES, SKILL_DEFINITIONS, DND_CLASSES,
  checkFeatPrerequisites, calculateAvailableFeats
} from '@/types/character';
import type { CustomSkillDefinition } from '@/lib/definitions-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, PlusCircle, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeatSelectionDialog } from './FeatSelectionDialog';
// AddCustomFeatDialog import removed
import { useToast } from "@/hooks/use-toast";

interface FeatsFormSectionProps {
  character: Character;
  allAvailableFeatDefinitions: readonly (FeatDefinitionJsonData & { isCustom?: boolean })[];
  chosenFeatInstances: CharacterFeatInstance[];
  onFeatInstancesChange: (updatedInstances: CharacterFeatInstance[]) => void;
  onEditCustomFeatDefinition: (featDefId: string) => void; // Callback to CharacterFormCore
  abilityScores: AbilityScores;
  skills: Skill[];
  allPredefinedSkillDefinitions: readonly SkillDefinitionJsonData[];
  allCustomSkillDefinitions: readonly CustomSkillDefinition[];
}

export function FeatsFormSection({
  character,
  allAvailableFeatDefinitions,
  chosenFeatInstances,
  onFeatInstancesChange,
  onEditCustomFeatDefinition,
  abilityScores,
  skills,
  allPredefinedSkillDefinitions,
  allCustomSkillDefinitions,
}: FeatsFormSectionProps) {
  const characterLevel = character.classes.reduce((sum, cls) => sum + cls.level, 0) || 1;
  const { toast } = useToast();

  const [isFeatDialogOpen, setIsFeatDialogOpen] = React.useState(false);
  // State for AddCustomFeatDialog moved to CharacterFormCore

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

  const characterForPrereqCheck = React.useMemo(() => ({
    ...character,
    abilityScores,
    skills,
  }), [character, abilityScores, skills]);


  const handleAddOrUpdateChosenFeatInstance = (definitionId: string, specializationDetail?: string) => {
    const definition = allAvailableFeatDefinitions.find(def => def.value === definitionId);
    if (!definition) {
      toast({ title: "Error", description: "Selected feat definition not found.", variant: "destructive" });
      return;
    }

    const existingInstancesOfThisDef = chosenFeatInstances.filter(inst => inst.definitionId === definitionId);
    const isGranted = chosenFeatInstances.some(inst => inst.definitionId === definitionId && inst.isGranted);

    if (!definition.canTakeMultipleTimes && existingInstancesOfThisDef.some(inst => !inst.isGranted)) {
      toast({ title: "Duplicate Feat", description: `"${definition.label}" cannot be taken multiple times.`, variant: "destructive" });
      return;
    }
    if(isGranted && !definition.canTakeMultipleTimes && existingInstancesOfThisDef.some(inst => !inst.isGranted)){
       toast({ title: "Feat Already Granted", description: `"${definition.label}" is already granted and cannot be chosen again.`, variant: "destructive" });
       return;
    }

    let newInstanceId = definitionId;
    if (definition.canTakeMultipleTimes) {
      newInstanceId = `${definitionId}-MULTI-INSTANCE-${crypto.randomUUID()}`;
    } else if (existingInstancesOfThisDef.length > 0 && !isGranted) {
      toast({ title: "Duplicate Feat", description: `"${definition.label}" cannot be taken multiple times.`, variant: "destructive" });
      return;
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

  const handleOpenEditDialog = (definitionId: string) => {
    const defToEdit = allAvailableFeatDefinitions.find(def => def.value === definitionId && def.isCustom);
    if (defToEdit) {
      onEditCustomFeatDefinition(definitionId);
    } else {
      toast({ title: "Error", description: "Could not find custom feat definition to edit.", variant: "destructive" });
    }
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
              if (!definition) return null;

              const prereqMessages = checkFeatPrerequisites(definition, characterForPrereqCheck, allAvailableFeatDefinitions, allPredefinedSkillDefinitions, allCustomSkillDefinitions);
              const isCustomDefinition = definition.isCustom;

              return (
                <div key={instance.instanceId} className="group flex items-start justify-between py-2 px-3 border-b border-border/50 hover:bg-muted/10 transition-colors">
                  <div className="flex-grow mr-2">
                    <h4 className="font-medium text-foreground">
                      {definition.label}
                      {instance.isGranted && instance.grantedNote && <span className="text-xs text-muted-foreground ml-1 italic">{instance.grantedNote}</span>}
                      {definition.requiresSpecialization && instance.specializationDetail && <span className="text-xs text-muted-foreground ml-1">({instance.specializationDetail})</span>}
                      {isCustomDefinition && <span className="text-xs text-primary/70 ml-1">(Custom)</span>}
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
                    {isCustomDefinition && ( 
                      <Button
                        type="button" variant="ghost" size="icon"
                        onClick={() => handleOpenEditDialog(instance.definitionId)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-50 group-hover:opacity-100 transition-opacity"
                        aria-label={`Edit custom feat definition ${definition.label}`}
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
            {/* "Add New Custom Feat Definition" button removed from here */}
          </div>
        </CardContent>
      </Card>
      <FeatSelectionDialog
        isOpen={isFeatDialogOpen}
        onOpenChange={setIsFeatDialogOpen}
        onFeatSelected={handleAddOrUpdateChosenFeatInstance}
        allFeats={allAvailableFeatDefinitions}
        character={characterForPrereqCheck}
        allPredefinedSkillDefinitions={allPredefinedSkillDefinitions}
        allCustomSkillDefinitions={allCustomSkillDefinitions}
      />
      {/* AddCustomFeatDialog rendering removed from here */}
    </>
  );
}
