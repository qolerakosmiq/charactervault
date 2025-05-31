
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
  selectedFeats: FeatType[];
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

  const [featSelections, setFeatSelections] = React.useState<(string | undefined)[]>([]);
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


  const userChosenNonCustomFeats = selectedFeats.filter(f => !f.isGranted && !f.isCustom);
  const customFeats = selectedFeats.filter(f => f.isCustom);
  const userAddedFeatsCount = userChosenNonCustomFeats.length + customFeats.length;
  const featSlotsLeft = availableFeatSlots - userAddedFeatsCount;


  const characterForPrereqCheck = React.useMemo(() => ({
    abilityScores,
    skills,
    feats: selectedFeats,
    classes: characterClasses,
    race: characterRace,
    alignment: characterAlignment,
    name: '', // Placeholder for type compatibility
    size: 'medium', // Placeholder
    age: 20, // Placeholder
    hp: 0, maxHp: 0, armorBonus: 0, shieldBonus: 0, sizeModifierAC: 0, naturalArmor: 0,
    deflectionBonus: 0, dodgeBonus: 0, acMiscModifier: 0, initiativeMiscModifier: 0,
    savingThrows: { fortitude: {base:0,magicMod:0,miscMod:0}, reflex: {base:0,magicMod:0,miscMod:0}, will: {base:0,magicMod:0,miscMod:0} },
    inventory: [], portraitDataUrl: '', personalStory: ''
  }), [abilityScores, skills, selectedFeats, characterClasses, characterRace, characterAlignment]);

  const convertSelectionsToFeatTypes = React.useCallback((currentSelectionIds: (string | undefined)[]): FeatType[] => {
    const granted = selectedFeats.filter(f => f.isGranted);
    const currentCustomFeats = selectedFeats.filter(f => f.isCustom);

    const chosenPredefinedOrExistingCustom = currentSelectionIds
      .filter((id): id is string => !!id)
      .map(idOrUuid => {
        const existingCustom = currentCustomFeats.find(cf => cf.id === idOrUuid);
        if (existingCustom) {
          return existingCustom; // Return the full custom feat object
        }
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

    // Combine granted, chosen (which now includes existing customs from selections), and ensure no duplicates of custom feats
    const combinedMap = new Map<string, FeatType>();
    granted.forEach(f => combinedMap.set(f.id, f));
    chosenPredefinedOrExistingCustom.forEach(f => combinedMap.set(f.id,f));
    
    return Array.from(combinedMap.values()).sort((a,b) => a.name.localeCompare(b.name));
  }, [selectedFeats]);


  React.useEffect(() => {
    const userChosenAndCustomFeatIds = selectedFeats
      .filter(f => !f.isGranted)
      .map(f => f.id)
      .sort();

    const currentSelectionIdsSorted = featSelections.filter(id => id !== undefined).sort();

    if (JSON.stringify(userChosenAndCustomFeatIds) !== JSON.stringify(currentSelectionIdsSorted)) {
      setFeatSelections(selectedFeats.filter(f => !f.isGranted).map(f => f.id));
    }
  }, [selectedFeats, featSelections]);


  const handleFeatSelectedFromDialog = (featIdOrUuid: string) => {
    // Check if it's a custom feat (by checking if it's already in selectedFeats with isCustom true)
    const existingCustomFeat = selectedFeats.find(sf => sf.id === featIdOrUuid && sf.isCustom);
    const featDef = DND_FEATS.find(f => f.value === featIdOrUuid); // Check predefined

    let featToAdd: FeatDefinitionJsonData | FeatType | undefined = existingCustomFeat || featDef;
    
    if (!featToAdd) {
        toast({ title: "Error", description: `Feat with ID ${featIdOrUuid} not found.`, variant: "destructive" });
        return;
    }
    
    const featName = existingCustomFeat ? existingCustomFeat.name : (featDef?.label || "Unknown Feat");
    const featCanTakeMultipleTimes = existingCustomFeat ? existingCustomFeat.canTakeMultipleTimes : featDef?.canTakeMultipleTimes;

    const isAlreadySelected = featSelections.some(
      selectedId => selectedId?.split('-MULTI-INSTANCE-')[0] === featIdOrUuid.split('-MULTI-INSTANCE-')[0]
    );
    const isAlreadyGranted = selectedFeats.some(sf => sf.isGranted && sf.id.split('-MULTI-INSTANCE-')[0] === featIdOrUuid.split('-MULTI-INSTANCE-')[0]);

    if (!featCanTakeMultipleTimes && (isAlreadySelected || isAlreadyGranted)) {
      toast({ title: "Duplicate Feat", description: `"${featName}" is already selected or granted and cannot be taken multiple times.`, variant: "destructive" });
      setIsFeatDialogOpen(false);
      return;
    }
    
    let uniqueId = featIdOrUuid;
    if (featCanTakeMultipleTimes && (isAlreadySelected || isAlreadyGranted)) {
       uniqueId = `${featIdOrUuid.split('-MULTI-INSTANCE-')[0]}-MULTI-INSTANCE-${crypto.randomUUID()}`;
    }

    const newSelections = [...featSelections.filter(id => id !== undefined), uniqueId] as string[];
    setFeatSelections(newSelections);
    onFeatSelectionChange(convertSelectionsToFeatTypes(newSelections));
    setIsFeatDialogOpen(false);
  };

  const handleSaveCustomFeat = (featData: Partial<FeatType> & { name: string }) => {
    let updatedFullFeatsList;
    if (featData.id && selectedFeats.some(f => f.id === featData.id && f.isCustom)) {
      updatedFullFeatsList = selectedFeats.map(f =>
        f.id === featData.id ? { ...f, ...featData, isCustom: true, isGranted: false } as FeatType : f
      );
    } else {
      const newCustomFeat: FeatType = {
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
      updatedFullFeatsList = [...selectedFeats, newCustomFeat];
    }
    onFeatSelectionChange(updatedFullFeatsList.sort((a,b) => a.name.localeCompare(b.name)));
    setEditingCustomFeat(null); 
  };

  const handleRemoveFeatSlot = (featIdToRemove: string) => {
    const newSelections = featSelections.filter(id => id !== featIdToRemove);
    setFeatSelections(newSelections);
    onFeatSelectionChange(convertSelectionsToFeatTypes(newSelections));
  };

  const handleOpenEditCustomFeatDialog = (feat: FeatType) => {
    setEditingCustomFeat(feat);
    setIsCustomFeatDialogOpen(true);
  };

  const allSkillOptionsForDialog = React.useMemo(() => {
    return skills.map(s => ({ value: s.id, label: s.name }));
  }, [skills]);

  const allFeatsForDialog = React.useMemo(() => {
    const predefinedFeatsAsDefinitions: FeatDefinitionJsonData[] = DND_FEATS.map(f => ({
      value: f.value,
      label: f.label,
      description: f.description,
      prerequisites: f.prerequisites,
      effects: f.effects,
      canTakeMultipleTimes: f.canTakeMultipleTimes,
      requiresSpecialization: f.requiresSpecialization,
    }));

    const customFeatsAsDefinitions: FeatDefinitionJsonData[] = selectedFeats
      .filter(feat => feat.isCustom)
      .map(feat => ({
        value: feat.id, // Use the UUID of the custom feat
        label: feat.name,
        description: feat.description,
        prerequisites: feat.prerequisites,
        effects: feat.effects, // Custom feats might not have structured effects from the dialog yet
        canTakeMultipleTimes: feat.canTakeMultipleTimes,
        requiresSpecialization: feat.requiresSpecialization,
      }));
    
    // Combine and remove duplicates by 'value' (ID for custom, value for predefined)
    const combinedMap = new Map<string, FeatDefinitionJsonData>();
    predefinedFeatsAsDefinitions.forEach(f => combinedMap.set(f.value, f));
    customFeatsAsDefinitions.forEach(f => combinedMap.set(f.value, f)); // Custom will override predefined if IDs matched, but shouldn't

    return Array.from(combinedMap.values());
  }, [selectedFeats]);


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
            {selectedFeats.length === 0 && (
                 <p className="text-sm text-muted-foreground text-center py-2">No feats selected or granted yet.</p>
            )}
            {selectedFeats.map((feat) => {
              const featDetails = allFeatsForDialog.find(f => f.value === feat.id.split('-MULTI-INSTANCE-')[0]) || feat;
              const prereqMessages: PrerequisiteMessage[] = feat.prerequisites
                ? checkFeatPrerequisites(feat as FeatDefinitionJsonData, characterForPrereqCheck as Character, allFeatsForDialog)
                : (!feat.isCustom && featDetails.prerequisites)
                    ? checkFeatPrerequisites(featDetails, characterForPrereqCheck as Character, allFeatsForDialog)
                    : [];

              return (
                <div key={`feat-${feat.id}`} className="group flex items-start justify-between py-2 px-3 border-b border-border/50 hover:bg-muted/10 transition-colors">
                  <div className="flex-grow mr-2">
                    <h4 className="font-medium text-foreground">
                      {feat.name}
                      {feat.isGranted && feat.grantedNote && <span className="text-xs text-muted-foreground ml-1 italic">{feat.grantedNote}</span>}
                    </h4>
                    {feat.isCustom ? (
                       <>
                        {feat.description && <div className="text-xs text-muted-foreground mt-0.5 whitespace-normal" dangerouslySetInnerHTML={{ __html: feat.description }} />}
                        {feat.effectsText && <p className="text-xs text-muted-foreground mt-0.5 whitespace-normal">Effects: {feat.effectsText}</p>}
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
                       </>
                    ) : (
                      <>
                        {featDetails.description && (
                          <div
                            className="text-xs text-muted-foreground mt-0.5 whitespace-normal"
                            dangerouslySetInnerHTML={{ __html: featDetails.description }}
                          />
                        )}
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
                      </>
                    )}
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
                        onClick={() => handleRemoveFeatSlot(feat.id)}
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
        allFeats={allFeatsForDialog} // Pass the combined list
        character={characterForPrereqCheck as Character}
      />
      <AddCustomFeatDialog
        isOpen={isCustomFeatDialogOpen}
        onOpenChange={setIsCustomFeatDialogOpen}
        onSave={handleSaveCustomFeat}
        initialFeatData={editingCustomFeat || undefined}
        allFeats={DND_FEATS} // AddCustomFeatDialog might still need the base list for its "prereq feat" dropdown
        allSkills={allSkillOptionsForDialog}
        allClasses={DND_CLASSES}
        allRaces={DND_RACES}
      />
    </>
  );
}
