
'use client';

import *as React from 'react';
import type {
  FeatDefinitionJsonData, CharacterFeatInstance, Character, AbilityScores, Skill,
  SkillDefinitionJsonData, FeatTypeString, AvailableFeatSlotsBreakdown, AggregatedFeatEffects, ComboboxOption, NoteEffectDetail, LocalizedString
} from '@/types/character-core';
import {
  checkFeatPrerequisites, calculateAvailableFeats
} from '@/types/character';
import type { CustomSkillDefinition } from '@/lib/definitions-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, PlusCircle, Trash2, Pencil, Loader2, Info, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeatSelectionDialog } from './FeatSelectionDialog';
import { SpecializationInputDialog } from './SpecializationInputDialog';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useI18n, type I18nContextType } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { getLocalizedString } from '@/i18n/i18n-data';

export interface FeatsFormSectionProps {
  featSectionData: Pick<Character, 'race' | 'classes' | 'feats' | 'age' | 'alignment' | 'experiencePoints' | 'chosenCombatStyle' | 'chosenFavoredEnemies' | 'deity' | 'chosenDomains'>;
  allAvailableFeatDefinitions: readonly (FeatDefinitionJsonData & { isCustom?: boolean })[];
  chosenFeatInstances: CharacterFeatInstance[];
  onFeatInstancesChange: (updatedInstances: CharacterFeatInstance[]) => void;
  onEditCustomFeatDefinition: (featDefId: string) => void;
  abilityScores: AbilityScores;
  skills: Skill[];
  allPredefinedSkillDefinitions: readonly SkillDefinitionJsonData[];
  allCustomSkillDefinitions: readonly CustomSkillDefinition[];
  allSkillOptionsForDialog: ComboboxOption[];
  allMagicSchoolOptionsForDialog: ComboboxOption[];
  characterLevel: number;
  aggregatedFeatEffects?: AggregatedFeatEffects | null;
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
  allSkillOptionsForDialog,
  allMagicSchoolOptionsForDialog,
  characterLevel,
  aggregatedFeatEffects,
}: FeatsFormSectionProps) => {
  const i18nContext = useI18n();
  const { translations, isLoading: translationsLoading, language } = i18nContext;
  const { toast } = useToast();

  const [isFeatDialogOpen, setIsFeatDialogOpen] = React.useState(false);
  const [featDialogFilterCategory, setFeatDialogFilterCategory] = React.useState<string | undefined>(undefined);
  const [featToSpecialize, setFeatToSpecialize] = React.useState<FeatDefinitionJsonData | null>(null);
  const [isSpecializationDialogOpen, setIsSpecializationDialogOpen] = React.useState(false);
  const [editingFeatInstanceId, setEditingFeatInstanceId] = React.useState<string | null>(null);
  const [initialSpecializationForEdit, setInitialSpecializationForEdit] = React.useState<string | undefined>(undefined);


  const featSlotsBreakdown = React.useMemo(() => {
    if (translationsLoading || !translations || !translations.UI_STRINGS || !translations.DND_RACES || !translations.XP_TABLE) return { total: 0, base: 0, racial: 0, classBonus: 0, classBonusDetails: [] };
    return calculateAvailableFeats(
      {
        race: featSectionData.race,
        classes: featSectionData.classes,
        feats: featSectionData.feats,
        experiencePoints: featSectionData.experiencePoints || 0,
      },
      allAvailableFeatDefinitions,
      translations.DND_RACES,
      translations.XP_TABLE,
      translations.EPIC_LEVEL_XP_INCREASE
    );
  }, [featSectionData, allAvailableFeatDefinitions, translations, translationsLoading]);


  const { total: availableFeatSlots, classBonusDetails } = featSlotsBreakdown;

  const sortInstancesByLabel = (instances: CharacterFeatInstance[]) => {
    return [...instances].sort((a, b) => {
      const defA = allAvailableFeatDefinitions.find(d => d.id === a.definitionId);
      const defB = allAvailableFeatDefinitions.find(d => d.id === b.definitionId);
      const labelA = defA?.label ? getLocalizedString(defA.label, language) : '';
      const labelB = defB?.label ? getLocalizedString(defB.label, language) : '';
      return labelA.localeCompare(labelB);
    });
  };

  const userChosenFeatInstances = React.useMemo(() => {
    return sortInstancesByLabel(chosenFeatInstances.filter(f => !f.isGranted));
  }, [chosenFeatInstances, allAvailableFeatDefinitions, language]);

  const grantedFeatInstances = React.useMemo(() => {
    return sortInstancesByLabel(chosenFeatInstances.filter(f => f.isGranted));
  }, [chosenFeatInstances, allAvailableFeatDefinitions, language]);

  const userChosenFeatInstancesCount = userChosenFeatInstances.length;
  const featSlotsLeft = availableFeatSlots - userChosenFeatInstancesCount;

  const characterForPrereqCheck = React.useMemo(() => ({
    ...featSectionData,
    abilityScores,
    skills,
    experiencePoints: featSectionData.experiencePoints || 0,
  }), [featSectionData, abilityScores, skills]);


  const handleOpenFeatDialog = () => {
    let filterCategoryForDialog: string | undefined = undefined;
    if (featSlotsLeft <= 0 && classBonusDetails && classBonusDetails.length > 0) {
      const availableBonusCategories = classBonusDetails.filter(detail => {
        const chosenInCategory = userChosenFeatInstances.filter(inst => {
          const def = allAvailableFeatDefinitions.find(d => d.id === inst.definitionId);
          return def?.category === detail.category &&
                 (!def.requiresSpecializationCategory || def.requiresSpecializationCategory === detail.category);
        }).length;
        const totalSlotsForCategory = classBonusDetails
          .filter(bd => bd.category === detail.category)
          .reduce((sum, bd) => sum + bd.count, 0);
        return chosenInCategory < totalSlotsForCategory;
      });

      if (availableBonusCategories.length > 0) {
        filterCategoryForDialog = availableBonusCategories[0].category;
      }
    }
    setFeatDialogFilterCategory(filterCategoryForDialog);
    setEditingFeatInstanceId(null);
    setIsFeatDialogOpen(true);
  };


  const handleAddOrUpdateChosenFeatInstance = (definitionId: string) => {
    if (!translations || !translations.UI_STRINGS) throw new Error("Translations not loaded for feat selection.");
    const UI_STRINGS = translations.UI_STRINGS;
    const definition = allAvailableFeatDefinitions.find(def => def.id === definitionId);
    if (!definition) {
      toast({ title: UI_STRINGS.toastFeatDefNotFoundTitle, description: UI_STRINGS.toastFeatDefNotFoundDesc.replace("{featId}", definitionId), variant: "destructive" });
      return;
    }
    const currentFeatLabel = getLocalizedString(definition.label, language);

    setEditingFeatInstanceId(null);
    setInitialSpecializationForEdit(undefined);

    if (definition.requiresSpecialization) {
      setFeatToSpecialize(definition);
      setIsSpecializationDialogOpen(true);
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
            description: UI_STRINGS.toastFeatAlreadyGrantedDesc.replace('{featLabel}', currentFeatLabel),
            variant: "destructive"
        });
        return;
      }
      if (existingChosenInstances.length > 0) {
        toast({
            title: UI_STRINGS.toastDuplicateFeatTitle,
            description: UI_STRINGS.toastDuplicateFeatDesc.replace('{featLabel}', currentFeatLabel),
            variant: "destructive"
        });
        return;
      }
    }

    let newInstanceId = definition.id;
    if (definition.canTakeMultipleTimes) {
      newInstanceId = `${definition.id}-MULTI-INSTANCE-${crypto.randomUUID()}`;
    }

    const newInstance: CharacterFeatInstance = {
      definitionId: definition.id,
      instanceId: newInstanceId,
      isGranted: false,
      chosenSpecializationCategory: definition.requiresSpecializationCategory,
      conditionalEffectStates: {},
    };

    onFeatInstancesChange([...chosenFeatInstances, newInstance].sort((a, b) => {
      const defA = allAvailableFeatDefinitions.find(d => d.id === a.definitionId);
      const defB = allAvailableFeatDefinitions.find(d => d.id === b.definitionId);
      const labelA = defA?.label ? getLocalizedString(defA.label, language) : '';
      const labelB = defB?.label ? getLocalizedString(defB.label, language) : '';
      return labelA.localeCompare(labelB);
    }));
  };

  const handleOpenEditSpecializationDialog = (instance: CharacterFeatInstance) => {
    const definition = allAvailableFeatDefinitions.find(def => def.id === instance.definitionId);
    if (definition && definition.requiresSpecialization) {
      setFeatToSpecialize(definition);
      setEditingFeatInstanceId(instance.instanceId);
      setInitialSpecializationForEdit(instance.specializationDetail || '');
      setIsSpecializationDialogOpen(true);
    }
  };

  const handleSpecializationProvided = (specializationDetail: string) => {
    if (!featToSpecialize || !translations || !translations.UI_STRINGS) throw new Error("Feat definition or translations not available for specialization.");
    const UI_STRINGS = translations.UI_STRINGS;
    const definition = featToSpecialize;
    const currentFeatLabel = getLocalizedString(definition.label, language);

    if (editingFeatInstanceId) {
      const updatedInstances = chosenFeatInstances.map(inst => {
        if (inst.instanceId === editingFeatInstanceId) {
          let newFinalInstanceId = `${definition.id}-${specializationDetail.toLowerCase().replace(/\s+/g, '-')}`;
          if (chosenFeatInstances.some(otherInst => otherInst.instanceId === newFinalInstanceId && otherInst.instanceId !== editingFeatInstanceId)) {
            newFinalInstanceId = `${newFinalInstanceId}-${crypto.randomUUID().substring(0,8)}`;
          }
          return { ...inst, specializationDetail: specializationDetail.trim() || undefined, instanceId: newFinalInstanceId };
        }
        return inst;
      });
      onFeatInstancesChange(sortInstancesByLabel(updatedInstances));

    } else {
      const existingChosenInstances = chosenFeatInstances.filter(
        inst => inst.definitionId === definition.id && !inst.isGranted && inst.specializationDetail === specializationDetail
      );
      const isAlreadyGrantedWithSameSpecialization = chosenFeatInstances.some(
        inst => inst.definitionId === definition.id && inst.isGranted && inst.specializationDetail === specializationDetail
      );

      if (!definition.canTakeMultipleTimes) {
        if (isAlreadyGrantedWithSameSpecialization) {
          toast({ title: UI_STRINGS.toastFeatAlreadyGrantedTitle, description: UI_STRINGS.toastFeatAlreadyGrantedDesc.replace('{featLabel}', currentFeatLabel), variant: "destructive" });
          return;
        }
        if (existingChosenInstances.length > 0) {
          toast({ title: UI_STRINGS.toastDuplicateFeatTitle, description: UI_STRINGS.toastDuplicateFeatDesc.replace('{featLabel}', currentFeatLabel), variant: "destructive" });
          return;
        }
      }

      let newInstanceId = `${definition.id}-${specializationDetail.toLowerCase().replace(/\s+/g, '-')}`;
      if (definition.canTakeMultipleTimes || chosenFeatInstances.some(fi => fi.instanceId === newInstanceId)) {
        newInstanceId = `${definition.id}-SPEC-${specializationDetail.toLowerCase().replace(/\s+/g, '-')}-${crypto.randomUUID()}`;
      }

      const newInstance: CharacterFeatInstance = {
        definitionId: definition.id,
        instanceId: newInstanceId,
        specializationDetail: specializationDetail.trim() || undefined,
        isGranted: false,
        chosenSpecializationCategory: definition.requiresSpecializationCategory,
        conditionalEffectStates: {},
      };
      onFeatInstancesChange(sortInstancesByLabel([...chosenFeatInstances, newInstance]));
    }

    setFeatToSpecialize(null);
    setIsSpecializationDialogOpen(false);
    setEditingFeatInstanceId(null);
    setInitialSpecializationForEdit(undefined);
  };


  const handleRemoveChosenFeatInstance = (instanceIdToRemove: string) => {
    const updatedInstances = chosenFeatInstances.filter(inst => inst.instanceId !== instanceIdToRemove);
    onFeatInstancesChange(updatedInstances);
  };

  const handleOpenEditDialog = (definitionId: string) => {
    if (!translations || !translations.UI_STRINGS) throw new Error("Translations not loaded for custom feat edit.");
    const UI_STRINGS = translations.UI_STRINGS;
    const defToEdit = allAvailableFeatDefinitions.find(def => def.id === definitionId && def.isCustom);
    if (defToEdit) {
      onEditCustomFeatDefinition(definitionId);
    } else {
      toast({ title: UI_STRINGS.toastCustomFeatNotFoundEditTitle, description: UI_STRINGS.toastCustomFeatNotFoundEditDesc, variant: "destructive" });
    }
  };

  const getFeatSource = React.useCallback((definitionId: string): string | null => {
    if (translationsLoading || !translations || !translations.DND_CLASSES) return null;
    if (definitionId.startsWith('class-')) {
      const parts = definitionId.split('-');
      if (parts.length > 1) {
        const classNameKey = parts.slice(1, -1).join('-');
        const classDef = translations.DND_CLASSES.find(c => c.id === classNameKey);
        return classDef ? classDef.label : capitalizeFirstLetter(classNameKey.replace(/-/g, ' '));
      }
    }
    return null;
  }, [translations, translationsLoading]);

  const capitalizeFirstLetter = (str: string) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };


  const renderFeatInstance = React.useCallback((instance: CharacterFeatInstance) => {
    if (translationsLoading || !translations || !translations.UI_STRINGS || !translations.ABILITY_LABELS || !translations.ALIGNMENT_PREREQUISITE_OPTIONS || !translations.DND_CLASSES || !translations.DND_RACES || !translations.SKILL_DEFINITIONS) return <Skeleton className="h-20 w-full mb-2" />;

    const definition = allAvailableFeatDefinitions.find(def => def.id === instance.definitionId);
    if (!definition) {
        throw new Error(`[DATA_ERROR] Feat definition for ID '${instance.definitionId}' not found during rendering.`);
    }
    const currentLang = language;
    const { UI_STRINGS } = translations;

    const featLabel = getLocalizedString(definition.label, currentLang, undefined, `feats.${definition.id}.label`);
    const featTypeLabel = definition.type && definition.type !== "special"
      ? translations.FEAT_TYPES.find(ft => ft.id === definition.type)?.label
      : null;
    const featSource = (instance.isGranted && definition.isClassFeature) ? getFeatSource(definition.id) : null;
    const isCustomDefinition = definition.isCustom;

    // --- DESCRIPTION ---
    const localizedDescription = definition.description ? getLocalizedString(definition.description, currentLang, undefined, `feats.${definition.id}.description`) : UI_STRINGS.featDescriptionNoneLabel;

    // --- BENEFIT ---
    let benefitContent = "";
    if (definition.effectsText) {
        benefitContent = getLocalizedString(definition.effectsText, currentLang, undefined, `feats.${definition.id}.effectsText`);
    }
    const noteEffects = (definition.effects?.filter(e => e.type === 'note') as NoteEffectDetail[] | undefined) || [];
    if (noteEffects.length > 0) {
      const noteText = noteEffects.map(ne =>
          ne.text // This is already localized by processRawDataBundle
      ).join(' ');
      if (noteText.trim() !== "") {
        if (benefitContent.trim() !== "") benefitContent += " ";
        benefitContent += noteText.trim();
      }
    }
    const finalBenefitText = benefitContent.trim() ? benefitContent : UI_STRINGS.featBenefitNoneLabel;

    // --- PREREQUISITES ---
    const prereqMessages: PrerequisiteMessage[] = checkFeatPrerequisites(
      definition,
      characterForPrereqCheck as Character,
      allAvailableFeatDefinitions,
      allPredefinedSkillDefinitions,
      allCustomSkillDefinitions,
      translations.DND_CLASSES,
      translations.DND_RACES,
      translations.ABILITY_LABELS,
      translations.ALIGNMENT_PREREQUISITE_OPTIONS,
      UI_STRINGS
    );
    let specialPrereqTextContent: string | undefined = undefined;
    if (definition.prerequisites?.special) {
        specialPrereqTextContent = getLocalizedString(definition.prerequisites.special, currentLang, undefined, `feats.${definition.id}.prereq.special`);
        if (specialPrereqTextContent.trim() === "") specialPrereqTextContent = undefined;
    }
    const hasPrereqsToShow = prereqMessages.length > 0 || !!specialPrereqTextContent;


    return (
      <div key={instance.instanceId} className="group flex items-start justify-between py-2 transition-colors">
        <div className="flex-grow mr-2 space-y-1 text-xs text-muted-foreground">
          <div className="flex items-baseline flex-wrap gap-x-1.5">
            {featSource && <Badge variant="secondary" className="whitespace-nowrap">{featSource}</Badge>}
            <h4 className="font-medium text-foreground inline-flex items-center text-sm">
              {featLabel}
            </h4>
            {featTypeLabel && <Badge variant="outline" className="whitespace-nowrap text-xs">{featTypeLabel}</Badge>}
            {isCustomDefinition && <Badge variant="outline" className="text-xs">{UI_STRINGS.badgeCustomLabel}</Badge>}
            {instance.grantedNote && <span className="text-xs text-muted-foreground">{instance.grantedNote}</span>}
          </div>
          {definition.requiresSpecialization && instance.specializationDetail && <p className="text-xs text-muted-foreground ml-1 italic">({instance.specializationDetail})</p>}

          <div className="text-xs text-muted-foreground">
            <strong className="font-bold text-muted-foreground mr-1">{UI_STRINGS.featDescriptionLabel}</strong>
            <span dangerouslySetInnerHTML={{ __html: localizedDescription }} />
          </div>

          <div className="text-xs text-muted-foreground">
            <strong className="font-bold text-muted-foreground mr-1">{UI_STRINGS.featBenefitLabel}</strong>
            <span dangerouslySetInnerHTML={{ __html: finalBenefitText }} />
          </div>

          {hasPrereqsToShow && (
            <div className="text-xs text-muted-foreground">
              <strong className="font-bold text-muted-foreground mr-1">{UI_STRINGS.featPrerequisitesLabel}</strong>
              <>
                {prereqMessages.map((msg, idx, arr) => (
                  <React.Fragment key={idx}>
                    <span className={cn(!msg.isMet ? 'text-destructive' : 'text-muted-foreground')} dangerouslySetInnerHTML={{ __html: msg.text }} />
                    {idx < arr.length - 1 && ', '}
                  </React.Fragment>
                ))}
                {prereqMessages.length > 0 && specialPrereqTextContent && specialPrereqTextContent.trim() !== "" && ', '}
                {specialPrereqTextContent && specialPrereqTextContent.trim() !== "" && <span dangerouslySetInnerHTML={{ __html: specialPrereqTextContent }} />}
              </>
            </div>
          )}
        </div>
        <div className="flex items-center shrink-0">
          {isCustomDefinition && (
            <Button
              type="button" variant="ghost" size="icon"
              onClick={() => handleOpenEditDialog(instance.definitionId)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-50 group-hover:opacity-100 transition-opacity"
              aria-label={(UI_STRINGS.featInstanceEditAriaLabel || "Edit {featLabel} definition").replace("{featLabel}", featLabel)}
            ><Pencil className="h-4 w-4" /></Button>
          )}
          {!instance.isGranted && definition.requiresSpecialization && (
             <Button
              type="button" variant="ghost" size="icon"
              onClick={() => handleOpenEditSpecializationDialog(instance)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-50 group-hover:opacity-100 transition-opacity"
              aria-label={(UI_STRINGS.featEditSpecializationAriaLabel || "Edit specialization for {featLabel}").replace("{featLabel}", featLabel)}
            ><Edit3 className="h-4 w-4" /></Button>
          )}
          {!instance.isGranted && (
            <Button
              type="button" variant="ghost" size="icon"
              onClick={() => handleRemoveChosenFeatInstance(instance.instanceId)}
              className="h-8 w-8 text-destructive hover:text-destructive/80 opacity-50 group-hover:opacity-100 transition-opacity"
              aria-label={UI_STRINGS.featInstanceRemoveAriaLabel || "Remove feat"}
            ><Trash2 className="h-4 w-4" /></Button>
          )}
        </div>
      </div>
    );
  }, [translationsLoading, translations, language, allAvailableFeatDefinitions, characterForPrereqCheck, allPredefinedSkillDefinitions, allCustomSkillDefinitions, getFeatSource, handleOpenEditDialog, handleRemoveChosenFeatInstance, handleOpenEditSpecializationDialog]);


  if (translationsLoading || !translations || !translations.UI_STRINGS || !translations.DND_CLASSES || !translations.DND_RACES || !translations.ABILITY_LABELS || !translations.ALIGNMENT_PREREQUISITE_OPTIONS) {
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
              <CardTitle className="text-2xl font-serif">{UI_STRINGS.featsPanelTitle}</CardTitle>
              <CardDescription>{UI_STRINGS.featsPanelDescription}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col">
        <div className="mb-3 p-3 border rounded-md bg-muted/30">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">
                {UI_STRINGS.featsPanelFeatsAvailableLabel} <span className="text-lg font-bold text-primary">{availableFeatSlots}</span>
              </p>
              <p className="text-sm font-medium">
                {UI_STRINGS.featsPanelFeatsLeftLabel} <span className={cn(
                  "text-lg font-bold whitespace-nowrap",
                  featSlotsLeft >= 0 ? "text-emerald-500" : "text-destructive"
                )}>{featSlotsLeft}</span>
              </p>
            </div>
             <p className="text-xs text-muted-foreground mt-1">
                {UI_STRINGS.featsPanelBreakdownBaseLabel}{'\u00A0'}<Badge variant="outline">{featSlotsBreakdown.base}</Badge>
                {featSlotsBreakdown.racial > 0 && (
                    <>
                    {' + '}{UI_STRINGS.featsPanelBreakdownRacialLabel || "Racial Bonus"}{'\u00A0'}<Badge variant="outline">{featSlotsBreakdown.racial}</Badge>
                    </>
                )}
                {featSlotsBreakdown.classBonusDetails && featSlotsBreakdown.classBonusDetails.length > 0 && (
                    featSlotsBreakdown.classBonusDetails.map(detail => (
                        <React.Fragment key={`${detail.category}-${String(detail.sourceFeatLabel) || 'general'}`}>
                        {' + '}{(detail.sourceFeatLabel ? detail.sourceFeatLabel : detail.category)}{'\u00A0'}<Badge variant="outline">{detail.count}</Badge>
                        </React.Fragment>
                    ))
                )}
                {' = '}<span className="font-bold text-primary">{availableFeatSlots}</span>
            </p>
          </div>

          {aggregatedFeatEffects?.favoredEnemyBonuses && (aggregatedFeatEffects.favoredEnemyBonuses.skillBonus > 0 || aggregatedFeatEffects.favoredEnemyBonuses.damageBonus > 0) && (
            <div className="mt-1 mb-3 p-2 border border-dashed border-primary/50 rounded-md bg-primary/5 text-sm text-primary">
              <Info className="inline h-4 w-4 mr-1.5 mb-0.5" />
              {UI_STRINGS.favoredEnemyBonusDisplayInfo
                .replace('{skillBonus}', String(aggregatedFeatEffects.favoredEnemyBonuses.skillBonus))
                .replace('{damageBonus}', String(aggregatedFeatEffects.favoredEnemyBonuses.damageBonus))}
                { ' ' }
                ({(UI_STRINGS.favoredEnemySlotsAvailableShort || "Slot(s)").replace('{slots}', String(aggregatedFeatEffects.favoredEnemySlots || 0))})
            </div>
          )}


          <div className="mt-3 mb-1 flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleOpenFeatDialog} disabled={featSlotsLeft <= 0 && (!classBonusDetails || classBonusDetails.length === 0 || classBonusDetails.every(d => d.count === 0))}>
              <PlusCircle className="mr-2 h-4 w-4" /> {UI_STRINGS.featsPanelAddButton}
            </Button>
          </div>

          {userChosenFeatInstances.length > 0 && (
            <>
              <h3 className={cn("text-lg font-semibold mb-2 text-primary", "mt-2")}>
                {UI_STRINGS.featsPanelChosenFeatsTitle}
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
                {UI_STRINGS.featsPanelGrantedFeatsTitle}
              </h3>
              <div className="space-y-1 mb-3">
                {grantedFeatInstances.map(renderFeatInstance)}
              </div>
            </>
          )}

          {userChosenFeatInstances.length === 0 && grantedFeatInstances.length === 0 && (
             <p className="text-sm text-muted-foreground mt-4">{UI_STRINGS.featsPanelNoFeatsYet}</p>
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
        filterByCategory={featDialogFilterCategory}
        isLoadingTranslations={translationsLoading}
      />
      <SpecializationInputDialog
        isOpen={isSpecializationDialogOpen}
        onOpenChange={setIsSpecializationDialogOpen}
        featDefinition={featToSpecialize}
        initialSpecializationDetail={initialSpecializationForEdit}
        onSave={handleSpecializationProvided}
        allSkills={allSkillOptionsForDialog}
        allMagicSchools={allMagicSchoolOptionsForDialog}
      />
    </>
  );
};
FeatsFormSectionComponent.displayName = "FeatsFormSectionComponent";
export const FeatsFormSection = React.memo(FeatsFormSectionComponent);

    