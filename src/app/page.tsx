
'use client';

import *as React from 'react';
import type { FeatDefinitionJsonData, Character } from '@/types/character';
import { CharacterCard } from '@/components/CharacterCard';
import { Button } from '@/components/ui/button';
import { useCharacterStore } from '@/lib/character-store';
import { PlusCircle, Users, Loader2, Settings, Calculator, BookOpenCheck, ShieldPlus, Languages, Repeat } from 'lucide-react'; // Added Repeat
import Link from 'next/link';
import Image from 'next/image';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { useDefinitionsStore, type CustomSkillDefinition } from '@/lib/definitions-store';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Separator } from '@/components/ui/separator';
import { AddCustomSkillDialog } from '@/components/AddCustomSkillDialog';
import { AddCustomFeatDialog } from '@/components/AddCustomFeatDialog';
import { useToast } from "@/hooks/use-toast";
import { LanguageSwitcher } from '@/components/LanguageSwitcher';


export default function CharacterDashboardPage() {
  const { characters, deleteCharacter, isLoading: isStoreLoading } = useCharacterStore();
  const { translations, isLoading: translationsLoading } = useI18n();
  const { toast } = useToast();

  const {
    customFeatDefinitions: globalCustomFeatDefinitionsFromStore,
    customSkillDefinitions: globalCustomSkillDefinitionsFromStore,
    rerollOnesForAbilityScores,
    pointBuyBudget: rawPointBuyBudgetFromStore,
    rerollTwentiesForChecks, // New setting from store
    actions: definitionsActions,
  } = useDefinitionsStore();

  const [isAddOrEditSkillDialogOpen, setIsAddOrEditSkillDialogOpen] = React.useState(false);
  const [skillToEdit, setSkillToEdit] = React.useState<CustomSkillDefinition | undefined>(undefined);
  const [isCustomFeatDialogOpen, setIsCustomFeatDialogOpen] = React.useState(false);
  const [editingCustomFeatDefinition, setEditingCustomFeatDefinition] = React.useState<(FeatDefinitionJsonData & { isCustom: true }) | undefined>(undefined);


  const isLoading = isStoreLoading || translationsLoading;

  let numericPointBuyBudget: number;
  if (typeof rawPointBuyBudgetFromStore === 'number' && !isNaN(rawPointBuyBudgetFromStore)) {
    numericPointBuyBudget = rawPointBuyBudgetFromStore;
  } else if (typeof rawPointBuyBudgetFromStore === 'string') {
    const parsed = parseFloat(rawPointBuyBudgetFromStore);
    numericPointBuyBudget = !isNaN(parsed) ? parsed : 25;
  } else {
    numericPointBuyBudget = 25;
  }
  const pointBuyBudget = numericPointBuyBudget;

  const handleCustomSkillDefinitionSaveToStore = React.useCallback((skillData: CustomSkillDefinition) => {
    const existing = definitionsActions.getCustomSkillDefinitionById(skillData.id);
    if (existing) {
      definitionsActions.updateCustomSkillDefinition(skillData);
      toast({ title: "Custom Skill Updated", description: `${skillData.name} has been updated.` });
    } else {
      definitionsActions.addCustomSkillDefinition(skillData);
      toast({ title: "Custom Skill Added", description: `${skillData.name} has been added to global definitions.` });
    }
    setIsAddOrEditSkillDialogOpen(false);
    setSkillToEdit(undefined);
  }, [definitionsActions, toast]);

  const handleCustomFeatDefinitionSaveToStore = React.useCallback((featDefData: FeatDefinitionJsonData & { isCustom: true }) => {
    const existing = definitionsActions.getCustomFeatDefinitionById(featDefData.value);
    if (existing) {
      definitionsActions.updateCustomFeatDefinition(featDefData);
      toast({ title: "Custom Feat Updated", description: `${featDefData.label} has been updated.` });
    } else {
      definitionsActions.addCustomFeatDefinition(featDefData);
      toast({ title: "Custom Feat Added", description: `${featDefData.label} has been added to global definitions.` });
    }
    setIsCustomFeatDialogOpen(false);
    setEditingCustomFeatDefinition(undefined);
  }, [definitionsActions, toast]);

  const allAvailableSkillDefinitionsForDisplay = React.useMemo(() => {
    if (translationsLoading || !translations) return [];
    const predefined = translations.SKILL_DEFINITIONS.map(sd => ({
        id: sd.value,
        name: sd.label,
        keyAbility: sd.keyAbility as any,
        description: sd.description,
        isCustom: false,
        providesSynergies: (translations.SKILL_SYNERGIES as Record<string, any>)[sd.value] || [],
    }));
    const custom = globalCustomSkillDefinitionsFromStore.map(csd => ({
        ...csd,
        isCustom: true,
    }));
    return [...predefined, ...custom].sort((a,b) => a.name.localeCompare(b.name));
  }, [translationsLoading, translations, globalCustomSkillDefinitionsFromStore]);


  const allSkillOptionsForDialog = React.useMemo(() => {
    return allAvailableSkillDefinitionsForDisplay
      .map(s => ({ value: s.id, label: s.name }))
      .sort((a,b) => a.label.localeCompare(b.label));
  }, [allAvailableSkillDefinitionsForDisplay]);


  const handleDeleteCharacter = (id: string) => {
    deleteCharacter(id);
  };

  if (isLoading || !translations) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-border">
          <div className="flex items-center space-x-3 mb-4 sm:mb-0">
            <Users className="h-10 w-10 text-primary" />
            <Skeleton className="h-10 w-64" />
          </div>
          <Skeleton className="h-12 w-56 rounded-md" />
        </div>
        <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">
              {translations?.UI_STRINGS.dashboardLoadingCharacters || "Loading characters..."}
            </p>
        </div>
      </div>
    );
  }

  const { UI_STRINGS } = translations;

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-border">
          <div className="flex items-center space-x-3 mb-4 sm:mb-0">
            <Users className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-serif font-bold">{UI_STRINGS.dashboardTitle}</h1>
          </div>
          <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
            <Link href="/character/new">
              <PlusCircle className="mr-2 h-5 w-5" /> {UI_STRINGS.dashboardButtonCreateNew}
            </Link>
          </Button>
        </div>

        {characters.length === 0 ? (
          <div className="text-center py-12">
            <Image 
              src="https://placehold.co/300x200.png" 
              alt={UI_STRINGS.dashboardImageAltEmptyScroll} 
              width={300} 
              height={200} 
              className="mx-auto mb-6 rounded-lg shadow-md"
              data-ai-hint="scroll map" 
            />
            <h2 className="text-2xl font-serif mb-2">{UI_STRINGS.dashboardEmptyStateTitle}</h2>
            <p className="text-muted-foreground mb-6">
              {UI_STRINGS.dashboardEmptyStateDescription}
            </p>
            <Button asChild size="lg">
              <Link href="/character/new">
                <PlusCircle className="mr-2 h-5 w-5" /> {UI_STRINGS.dashboardEmptyStateButtonStart}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map(character => (
              <CharacterCard
                key={character.id}
                character={character}
                onDelete={handleDeleteCharacter}
              />
            ))}
          </div>
        )}

        <Separator className="my-10" />
        
        <div className="space-y-4 p-4 border rounded-lg shadow-sm bg-card">
            <h3 className="text-xl font-serif text-foreground/80 flex items-center">
                <Settings className="mr-3 h-6 w-6 text-primary/70" />
                {UI_STRINGS.dmSettingsPanelTitle || "Dungeon Master Settings"}
            </h3>
            <div className="space-y-2 pt-2">
              <div className="flex items-center space-x-3">
                <Label htmlFor="dm-language-switcher" className="flex items-center text-sm font-medium">
                  <Languages className="mr-2 h-4 w-4 text-muted-foreground" />
                  {UI_STRINGS.dmSettingsLanguageLabel || "Game Language"}
                </Label>
                <LanguageSwitcher />
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                {UI_STRINGS.dmSettingsLanguageDescription || "Affects game data such as units, numerical increments, and default names."}
              </p>
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-2">
                    <Label htmlFor="dm-reroll-ones" className="flex items-center">
                        <Checkbox
                            id="dm-reroll-ones"
                            checked={rerollOnesForAbilityScores}
                            onCheckedChange={definitionsActions.toggleRerollOnesForAbilityScores}
                            className="mr-2"
                        />
                        {UI_STRINGS.dmSettingsRerollOnesLabel || "Reroll 1s for Ability Score Rolls"}
                    </Label>
                    <p className="text-xs text-muted-foreground pl-6">
                        {UI_STRINGS.dmSettingsRerollOnesDescription || "When using 4d6 drop lowest, reroll any die that shows a 1 until it is not a 1."}
                    </p>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="dm-reroll-twenties" className="flex items-center">
                        <Repeat className="mr-2 h-4 w-4 text-muted-foreground" />
                        <Checkbox
                            id="dm-reroll-twenties"
                            checked={rerollTwentiesForChecks}
                            onCheckedChange={definitionsActions.toggleRerollTwentiesForChecks}
                            className="mr-2"
                        />
                        {UI_STRINGS.dmSettingsRerollTwentiesLabel || "Reroll 20s for Checks (Exploding Dice)"}
                    </Label>
                    <p className="text-xs text-muted-foreground pl-6">
                        {UI_STRINGS.dmSettingsRerollTwentiesDescription || "When rolling a 20 on a d20 for a check, roll again and add. Repeat on subsequent 20s."}
                    </p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dm-point-buy-budget" className="flex items-center">
                        <Calculator className="mr-2 h-4 w-4 text-muted-foreground" />
                        {UI_STRINGS.dmSettingsPointBuyBudgetLabel || "Point Buy Budget for Ability Scores"}
                    </Label>
                    <NumberSpinnerInput
                        id="dm-point-buy-budget"
                        value={pointBuyBudget}
                        onChange={definitionsActions.setPointBuyBudget}
                        min={0}
                        inputClassName="h-9 text-sm w-20"
                        buttonClassName="h-9 w-9"
                        buttonSize="sm"
                    />
                     <p className="text-xs text-muted-foreground">
                        {UI_STRINGS.dmSettingsPointBuyBudgetDescription || "Default is 25 points for standard D&D 3.5 point buy."}
                    </p>
                </div>
            </div>
            <Separator className="my-4" />
             <div className="flex flex-col sm:flex-row gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setSkillToEdit(undefined); setIsAddOrEditSkillDialogOpen(true); }}
                    className="w-full sm:w-auto"
                >
                    <BookOpenCheck className="mr-2 h-5 w-5" /> {UI_STRINGS.dmSettingsAddCustomSkillButton || "Add New Custom Skill"}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setEditingCustomFeatDefinition(undefined); setIsCustomFeatDialogOpen(true); }}
                    className="w-full sm:w-auto"
                >
                    <ShieldPlus className="mr-2 h-5 w-5" /> {UI_STRINGS.dmSettingsAddCustomFeatButton || "Add New Custom Feat"}
                </Button>
            </div>
        </div>
      </div>

      <AddCustomSkillDialog
        isOpen={isAddOrEditSkillDialogOpen}
        onOpenChange={setIsAddOrEditSkillDialogOpen}
        onSave={handleCustomSkillDefinitionSaveToStore}
        initialSkillData={skillToEdit}
        allSkills={allSkillOptionsForDialog}
      />
      <AddCustomFeatDialog
        isOpen={isCustomFeatDialogOpen}
        onOpenChange={setIsCustomFeatDialogOpen}
        onSave={handleCustomFeatDefinitionSaveToStore}
        initialFeatData={editingCustomFeatDefinition}
        allFeats={translations.DND_FEATS_DEFINITIONS}
        allSkills={allSkillOptionsForDialog}
        allClasses={translations.DND_CLASSES}
        allRaces={translations.DND_RACES}
      />
    </>
  );
}
