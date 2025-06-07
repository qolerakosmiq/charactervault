
'use client';

import *as React from 'react';
import type {
  FeatDefinitionJsonData, CharacterFeatInstance, Character, AbilityScores, Skill,
  SkillDefinitionJsonData, FeatTypeString
} from '@/types/character-core'; 
import {
  checkFeatPrerequisites, calculateAvailableFeats
} from '@/types/character';
import type { CustomSkillDefinition } from '@/lib/definitions-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, PlusCircle, Trash2, Pencil, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeatSelectionDialog } from './FeatSelectionDialog';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';

interface FeatsFormSectionProps {
  featSectionData: Pick<Character, 'race' | 'classes' | 'feats' | 'age' | 'alignment'>;
  allAvailableFeatDefinitions: readonly (FeatDefinitionJsonData & { isCustom?: boolean })[]; 
  chosenFeatInstances: CharacterFeatInstance[]; 
  onFeatInstancesChange: (updatedInstances: CharacterFeatInstance[]) => void;
  onEditCustomFeatDefinition: (featDefId: string) => void;
  abilityScores: AbilityScores; 
  skills: Skill[];
  allPredefinedSkillDefinitions: readonly SkillDefinitionJsonData[]; 
  allCustomSkillDefinitions: readonly CustomSkillDefinition[]; 
}

const FeatsFormSectionComponent = ({
  featSectionData,
  allAvailableFeatDefinitions,
  chosenFeatInstances,
  onFeatInstancesChange,
  onEditCustomFeatDefinition,
  abilityScores,
  skills,
  allPredefinedSkillDefinitions,
  allCustomSkillDefinitions,
}: FeatsFormSectionProps) => {
  const { translations, isLoading: translationsLoading } = useI18n();
  const characterLevel = featSectionData.classes.reduce((sum, cls) => sum + cls.level, 0) || 1;
  const { toast } = useToast();

  const [isFeatDialogOpen, setIsFeatDialogOpen] = React.useState(false);

  const featSlotsBreakdown = React.useMemo(() => {
    if (translationsLoading || !translations) return { total: 0, base: 0, racial: 0, levelProgression: 0, classBonus: 0 };
    return calculateAvailableFeats(featSectionData.race, characterLevel, featSectionData.classes, translations.DND_RACES);
  }, [featSectionData.race, characterLevel, featSectionData.classes, translations, translationsLoading]);

  const { total: availableFeatSlots, base: baseFeat, racial: racialBonus, levelProgression: levelProgressionFeats, classBonus: classBonusFeats } = featSlotsBreakdown;

  const sortInstancesByLabel = (instances: CharacterFeatInstance[]) => {
    return [...instances].sort((a, b) => {
      const defA = allAvailableFeatDefinitions.find(d => d.value === a.definitionId);
      const defB = allAvailableFeatDefinitions.find(d => d.value === b.definitionId);
      return (defA?.label || '').localeCompare(defB?.label || '');
    });
  };

  const userChosenFeatInstances = React.useMemo(() => {
    return sortInstancesByLabel(chosenFeatInstances.filter(f => !f.isGranted));
  }, [chosenFeatInstances, allAvailableFeatDefinitions]);

  const grantedFeatInstances = React.useMemo(() => {
    return sortInstancesByLabel(chosenFeatInstances.filter(f => f.isGranted));
  }, [chosenFeatInstances, allAvailableFeatDefinitions]);

  const userChosenFeatInstancesCount = userChosenFeatInstances.length;
  const featSlotsLeft = availableFeatSlots - userChosenFeatInstancesCount;

  const characterForPrereqCheck = React.useMemo(() => ({
    ...featSectionData, 
    abilityScores,
    skills,
  }), [featSectionData, abilityScores, skills]);

  const badgeClassName = "text-primary border-primary font-bold px-1.5 py-0 text-xs whitespace-nowrap";

  const handleAddOrUpdateChosenFeatInstance = (definitionId: string, specializationDetail?: string) => {
    if (!translations) return;
    const UI_STRINGS = translations.UI_STRINGS;
    const definition = allAvailableFeatDefinitions.find(def => def.value === definitionId);
    if (!definition) {
      toast({ title: UI_STRINGS.toastFeatDefNotFoundTitle, description: UI_STRINGS.toastFeatDefNotFoundDesc, variant: "destructive" });
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
        toast({ 
            title: UI_STRINGS.toastFeatAlreadyGrantedTitle, 
            description: (UI_STRINGS.toastFeatAlreadyGrantedDesc || '"{featLabel}" is already granted and cannot be chosen again.').replace('{featLabel}', definition.label), 
            variant: "destructive" 
        });
        return;
      }
      if (existingChosenInstances.length > 0) {
        toast({ 
            title: UI_STRINGS.toastDuplicateFeatTitle, 
            description: (UI_STRINGS.toastDuplicateFeatDesc || 'You have already chosen "{featLabel}", and it cannot be taken multiple times.').replace('{featLabel}', definition.label), 
            variant: "destructive" 
        });
        return;
      }
    }
    
    let newInstanceId = definition.value; 
    if (definition.canTakeMultipleTimes) {
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
    if (!translations) return;
    const UI_STRINGS = translations.UI_STRINGS;
    const defToEdit = allAvailableFeatDefinitions.find(def => def.value === definitionId && def.isCustom);
    if (defToEdit) {
      onEditCustomFeatDefinition(definitionId);
    } else {
      toast({ title: UI_STRINGS.toastCustomFeatNotFoundEditTitle, description: UI_STRINGS.toastCustomFeatNotFoundEditDesc, variant: "destructive" });
    }
  };

  const getFeatSource = React.useCallback((definitionValue: string): string | null => {
    if (translationsLoading || !translations) return null;
    if (definitionValue.startsWith('class-')) {
      const parts = definitionValue.split('-');
      if (parts.length > 1) {
        const classNameKey = parts[1];
        const classDef = translations.DND_CLASSES.find(c => c.value === classNameKey);
        return classDef ? classDef.label : classNameKey.charAt(0).toUpperCase() + classNameKey.slice(1);
      }
    }
    return null;
  }, [translations, translationsLoading]);

  const renderFeatInstance = React.useCallback((instance: CharacterFeatInstance) => {
    if (translationsLoading || !translations) return <Skeleton className="h-16 w-full mb-2" />;

    const definition = allAvailableFeatDefinitions.find(def => def.value === instance.definitionId);
    if (!definition) return null;

    const prereqMessages = checkFeatPrerequisites(
      definition, 
      characterForPrereqCheck as Character, // Cast as it expects full Character
      allAvailableFeatDefinitions, 
      allPredefinedSkillDefinitions, 
      allCustomSkillDefinitions,    
      translations.DND_CLASSES,      
      translations.DND_RACES,        
      translations.ABILITY_LABELS,   
      translations.ALIGNMENT_PREREQUISITE_OPTIONS,
      translations.UI_STRINGS
    );
    const isCustomDefinition = definition.isCustom;
    
    const featTypeLabel = definition.type && definition.type !== "special" 
      ? translations.FEAT_TYPES.find(ft => ft.value === definition.type)?.label
      : null;

    const featSource = (instance.isGranted && definition.isClassFeature) ? getFeatSource(definition.value) : null;
    const { UI_STRINGS } = translations;

    return (
      <div key={instance.instanceId} className="group flex items-start justify-between py-2 transition-colors">
        <div className="flex-grow mr-2">
          <div className="flex items-baseline flex-wrap gap-x-1.5 mb-1">
            {featSource && <Badge variant="secondary" className="text-xs font-normal h-5 whitespace-nowrap">{featSource}</Badge>}
            <h4 className="font-medium text-foreground inline-flex items-center">
              {definition.label}
            </h4>
            {featTypeLabel && <Badge variant="outline" className="text-xs font-normal h-5 whitespace-nowrap">{featTypeLabel}</Badge>}
            {isCustomDefinition && <Badge variant="outline" className="text-xs text-primary/70 border-primary/50 h-5 whitespace-nowrap">{UI_STRINGS.badgeCustomLabel || "Custom"}</Badge>}
            {instance.grantedNote && !featSource && <span className="text-xs text-muted-foreground italic">{instance.grantedNote}</span>}
            {instance.grantedNote && featSource && <span className="text-xs text-muted-foreground">{instance.grantedNote}</span>}
          </div>
          {definition.requiresSpecialization && instance.specializationDetail && <p className="text-sm text-muted-foreground mt-0.5 ml-1">({instance.specializationDetail})</p>}
          {definition.description && <div className="text-sm text-muted-foreground mt-0.5 whitespace-normal" dangerouslySetInnerHTML={{ __html: definition.description }} />}
          {definition.effectsText && (
            <p className="text-sm text-muted-foreground mt-0.5 whitespace-normal">
              <span dangerouslySetInnerHTML={{ __html: UI_STRINGS.featEffectsLabel || "<b>Effects:</b>" }} />
              {' '}{definition.effectsText}
            </p>
          )}
          {prereqMessages.length > 0 ? (
            <div className="text-sm mt-0.5 whitespace-normal text-muted-foreground">
              <strong>{UI_STRINGS.featPrerequisitesLabel || "Prerequisites:"}</strong>{' '}
              {prereqMessages.map((msg, idx, arr) => (
                <React.Fragment key={idx}>
                  <span className={cn(!msg.isMet ? 'text-destructive' : 'text-muted-foreground')} dangerouslySetInnerHTML={{ __html: msg.text }} />
                  {idx < arr.length - 1 && ', '}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <p className="text-sm mt-0.5 whitespace-normal text-muted-foreground">
              <strong>{UI_STRINGS.featPrerequisitesLabel || "Prerequisites:"}</strong> {UI_STRINGS.featPrerequisitesNoneLabel || "None"}
            </p>
          )}
        </div>
        <div className="flex items-center shrink-0">
          {isCustomDefinition && ( 
            <Button
              type="button" variant="ghost" size="icon"
              onClick={() => handleOpenEditDialog(instance.definitionId)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-50 group-hover:opacity-100 transition-opacity"
              aria-label={(UI_STRINGS.featInstanceEditAriaLabel || "Edit custom feat definition {featLabel}").replace("{featLabel}", definition.label)}
            ><Pencil className="h-4 w-4" /></Button>
          )}
          {!instance.isGranted && (
            <Button
              type="button" variant="ghost" size="icon"
              onClick={() => handleRemoveChosenFeatInstance(instance.instanceId)}
              className="h-8 w-8 text-destructive hover:text-destructive/80 opacity-50 group-hover:opacity-100 transition-opacity"
              aria-label={UI_STRINGS.featInstanceRemoveAriaLabel || "Remove feat instance"}
            ><Trash2 className="h-4 w-4" /></Button>
          )}
        </div>
      </div>
    );
  }, [translationsLoading, translations, allAvailableFeatDefinitions, characterForPrereqCheck, allPredefinedSkillDefinitions, allCustomSkillDefinitions, getFeatSource, handleOpenEditDialog, handleRemoveChosenFeatInstance]);


  if (translationsLoading || !translations) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Award className="h-8 w-8 text-primary" />
            <div><Skeleton className="h-7 w-16 mb-1" /><Skeleton className="h-4 w-40" /></div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-10 w-1/3 mb-4" />
          <Skeleton className="h-16 w-full mb-2" />
          <Skeleton className="h-16 w-full mb-2" />
        </CardContent>
      </Card>
    );
  }
  const { DND_CLASSES, DND_RACES, ABILITY_LABELS, ALIGNMENT_PREREQUISITE_OPTIONS, UI_STRINGS } = translations;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Award className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl font-serif">{UI_STRINGS.featsPanelTitle || "Feats"}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col">
          <div className="mb-3 p-3 border rounded-md bg-muted/30">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">
                {UI_STRINGS.featsPanelFeatsAvailableLabel || "Feats Available:"} <span className="text-lg font-bold text-primary">{availableFeatSlots}</span>
              </p>
              <p className="text-sm font-medium">
                {UI_STRINGS.featsPanelFeatsLeftLabel || "Feats Left to Choose:"} <span className={cn(
                  "text-lg font-bold whitespace-nowrap",
                  featSlotsLeft >= 0 ? "text-emerald-500" : "text-destructive"
                )}>{featSlotsLeft}</span>
              </p>
            </div>
             <p className="text-xs text-muted-foreground mt-1">
              {UI_STRINGS.featsPanelBreakdownBaseLabel || "Base"} <Badge variant="outline" className={badgeClassName}>{baseFeat}</Badge>
              {racialBonus > 0 && (
                <>
                  {' + '} {UI_STRINGS.featsPanelBreakdownRacialLabel || "Racial Bonus"} <Badge variant="outline" className={badgeClassName}>{racialBonus}</Badge>
                </>
              )}
              {' + '} {UI_STRINGS.featsPanelBreakdownLevelProgressionLabel || "Level Progression"} <Badge variant="outline" className={badgeClassName}>{levelProgressionFeats}</Badge>
              {classBonusFeats > 0 && (
                <>
                  {' + '} {UI_STRINGS.featsPanelBreakdownClassGrantedLabel || "Class Granted"} <Badge variant="outline" className={badgeClassName}>{classBonusFeats}</Badge>
                </>
              )}
            </p>
          </div>

          <div className="mt-3 mb-1 flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFeatDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> {UI_STRINGS.featsPanelAddButton || "Choose Feat"}
            </Button>
          </div>

          {userChosenFeatInstances.length > 0 && (
            <>
              <h3 className={cn("text-lg font-semibold mb-2 text-primary", "mt-2")}>
                {UI_STRINGS.featsPanelChosenFeatsTitle || "Chosen Feats"}
              </h3>
              <div className="space-y-1 mb-3">
                {userChosenFeatInstances.map(renderFeatInstance)}
              </div>
            </>
          )}

          {grantedFeatInstances.length > 0 && (
            <>
              {userChosenFeatInstances.length > 0 && <Separator className="my-2" />}
              <h3
                className={cn(
                  "text-lg font-semibold mb-2 text-primary",
                   userChosenFeatInstances.length === 0 ? "mt-2" : "" 
                )}
              >
                {UI_STRINGS.featsPanelGrantedFeatsTitle || "Granted Feats"}
              </h3>
              <div className="space-y-1 mb-3">
                {grantedFeatInstances.map(renderFeatInstance)}
              </div>
            </>
          )}
          
          {userChosenFeatInstances.length === 0 && grantedFeatInstances.length === 0 && (
             <p className="text-sm text-muted-foreground mt-4">{UI_STRINGS.featsPanelNoFeatsYet || "No feats selected or granted yet."}</p>
          )}

        </CardContent>
      </Card>
      <FeatSelectionDialog
        isOpen={isFeatDialogOpen}
        onOpenChange={setIsFeatDialogOpen}
        onFeatSelected={handleAddOrUpdateChosenFeatInstance}
        allFeats={allAvailableFeatDefinitions} 
        character={characterForPrereqCheck as Character} 
        allPredefinedSkillDefinitions={allPredefinedSkillDefinitions}
        allCustomSkillDefinitions={allCustomSkillDefinitions}
        allClasses={DND_CLASSES}
        allRaces={DND_RACES}
        abilityLabels={ABILITY_LABELS}
        alignmentPrereqOptions={ALIGNMENT_PREREQUISITE_OPTIONS}
        isLoadingTranslations={translationsLoading}
      />
    </>
  );
};

export const FeatsFormSection = React.memo(FeatsFormSectionComponent);

    