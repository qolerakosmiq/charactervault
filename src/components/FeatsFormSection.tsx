
'use client';

import * as React from 'react';
import type {
  FeatDefinitionJsonData, CharacterFeatInstance, Character, AbilityScores, Skill,
  SkillDefinitionJsonData, FeatTypeString
} from '@/types/character';
import {
  DND_FEATS_DEFINITIONS, DND_RACES, SKILL_DEFINITIONS, DND_CLASSES,
  checkFeatPrerequisites, calculateAvailableFeats, FEAT_TYPES
} from '@/types/character';
import type { CustomSkillDefinition } from '@/lib/definitions-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, PlusCircle, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeatSelectionDialog } from './FeatSelectionDialog';
// AddCustomFeatDialog import removed
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge'; 

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

  const featSlotsBreakdown = React.useMemo(() => {
    return calculateAvailableFeats(character.race, characterLevel, character.classes);
  }, [character.race, characterLevel, character.classes]);

  const { total: availableFeatSlots, base: baseFeat, racial: racialBonus, levelProgression: levelProgressionFeats, classBonus: classBonusFeats } = featSlotsBreakdown;


  const userChosenFeatInstancesCount = chosenFeatInstances.filter(f => !f.isGranted).length;
  const featSlotsLeft = availableFeatSlots - userChosenFeatInstancesCount;

  const characterForPrereqCheck = React.useMemo(() => ({
    ...character,
    abilityScores,
    skills,
  }), [character, abilityScores, skills]);

  const badgeClassName = "text-primary border-primary font-bold px-1.5 py-0 text-xs";


  const handleAddOrUpdateChosenFeatInstance = (definitionId: string, specializationDetail?: string) => {
    const definition = allAvailableFeatDefinitions.find(def => def.value === definitionId);
    if (!definition) {
      toast({ title: "Error", description: "Selected feat definition not found.", variant: "destructive" });
      return;
    }

    const existingChosenInstances = chosenFeatInstances.filter(
      inst => inst.definitionId === definitionId && !inst.isGranted
    );
    const isAlreadyGranted = chosenFeatInstances.some(
      inst => inst.definitionId === definitionId && inst.isGranted
    );

    if (!definition.canTakeMultipleTimes) {
      if (isAlreadyGranted) {
        toast({ title: "Feat Already Granted", description: `"${definition.label}" is already granted by your class/race and cannot be chosen again.`, variant: "destructive" });
        return;
      }
      if (existingChosenInstances.length > 0) {
        toast({ title: "Duplicate Feat", description: `You have already chosen "${definition.label}", and it cannot be taken multiple times.`, variant: "destructive" });
        return;
      }
    }
    // If it can be taken multiple times, these checks are bypassed for chosen instances.
    // However, even multi-take feats shouldn't be re-added if they are *granted* (unless the grant itself is stackable, which is rare).
    // For simplicity, we'll assume granted feats (even if multi-take by definition) are only granted once by a source.

    let newInstanceId = definition.value; // Default for non-multi-take or first instance of multi-take
    if (definition.canTakeMultipleTimes) {
      // Ensure instance ID is unique for multi-take feats by appending a UUID
      newInstanceId = `${definition.value}-MULTI-INSTANCE-${crypto.randomUUID()}`;
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

  const getFeatSource = (definitionValue: string): string | null => {
    if (definitionValue.startsWith('class-')) {
      const parts = definitionValue.split('-');
      if (parts.length > 1) {
        const className = parts[1];
        // Find class label for proper capitalization if available
        const classDef = DND_CLASSES.find(c => c.value === className);
        return classDef ? classDef.label : className.charAt(0).toUpperCase() + className.slice(1);
      }
    }
    return null;
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
          <div className="mb-3 p-3 border rounded-md bg-muted/30">
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
              Base <Badge variant="outline" className={badgeClassName}>{baseFeat}</Badge>
              {racialBonus > 0 && (
                <>
                  {' + '}Racial Bonus <Badge variant="outline" className={badgeClassName}>{racialBonus}</Badge>
                </>
              )}
              {' + '}Level Progression <Badge variant="outline" className={badgeClassName}>{levelProgressionFeats}</Badge>
              {classBonusFeats > 0 && (
                <>
                  {' + '}Class Granted <Badge variant="outline" className={badgeClassName}>{classBonusFeats}</Badge>
                </>
              )}
            </p>
          </div>

          <div className="space-y-1 mb-3">
            {chosenFeatInstances.map((instance) => {
              const definition = allAvailableFeatDefinitions.find(def => def.value === instance.definitionId);
              if (!definition) return null;

              const prereqMessages = checkFeatPrerequisites(definition, characterForPrereqCheck, allAvailableFeatDefinitions, allPredefinedSkillDefinitions, allCustomSkillDefinitions);
              const isCustomDefinition = definition.isCustom;
              
              const featTypeLabel = definition.type && definition.type !== "special" 
                ? FEAT_TYPES.find(ft => ft.value === definition.type)?.label
                : null;

              const featSource = (instance.isGranted && definition.isClassFeature) ? getFeatSource(definition.value) : null;

              return (
                <div key={instance.instanceId} className="group flex items-start justify-between py-2 px-3 border-b border-border/50 hover:bg-muted/10 transition-colors">
                  <div className="flex-grow mr-2">
                    <div className="flex items-baseline flex-wrap gap-x-1.5 mb-1">
                      {featSource && <Badge variant="secondary" className="text-xs font-normal h-5">{featSource}</Badge>}
                      <h4 className="font-medium text-foreground inline-flex items-center">
                        {definition.label}
                      </h4>
                      {featTypeLabel && <Badge variant="outline" className="text-xs font-normal h-5">{featTypeLabel}</Badge>}
                      {isCustomDefinition && <Badge variant="outline" className="text-xs text-primary/70 border-primary/50 h-5">Custom</Badge>}
                       {instance.grantedNote && !featSource && <span className="text-xs text-muted-foreground italic">{instance.grantedNote}</span>}
                       {instance.grantedNote && featSource && <span className="text-xs text-muted-foreground">{instance.grantedNote}</span>}
                    </div>
                    {definition.requiresSpecialization && instance.specializationDetail && <p className="text-sm text-muted-foreground mt-0.5 ml-1">({instance.specializationDetail})</p>}
                    {definition.description && <div className="text-sm text-muted-foreground mt-0.5 whitespace-normal" dangerouslySetInnerHTML={{ __html: definition.description }} />}
                    {definition.effectsText && <p className="text-sm text-muted-foreground mt-0.5 whitespace-normal">Effects: {definition.effectsText}</p>}
                    {prereqMessages.length > 0 ? (
                      <div className="text-sm mt-0.5 whitespace-normal text-muted-foreground">
                        <strong>Prerequisites:</strong>{' '}
                        {prereqMessages.map((msg, idx, arr) => (
                          <React.Fragment key={idx}>
                            <span className={cn(!msg.isMet ? 'text-destructive' : 'text-muted-foreground')} dangerouslySetInnerHTML={{ __html: msg.text }} />
                            {idx < arr.length - 1 && ', '}
                          </React.Fragment>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm mt-0.5 whitespace-normal text-muted-foreground"><strong>Prerequisites:</strong> None</p>
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
            {/* "Add New Custom Feat Definition" button moved to CharacterFormCore */}
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

