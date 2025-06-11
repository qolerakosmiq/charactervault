

'use client';

import type { Character, Skill, Item, CharacterClass, AbilityName, SavingThrows, ResistanceValue, InfoDialogContentType, AggregatedFeatEffects, DetailedAbilityScores, CombatPanelCharacterData } from '@/types/character'; // Added AggregatedFeatEffects, DetailedAbilityScores
import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CoreInfoSection } from './CoreInfoSection';
import { AbilityScoresSection } from './AbilityScoresSection';
import { CombatPanel } from '../form-sections/CombatPanel';
import { SkillsListing } from './SkillsListing';
import { FeatsListing } from './FeatsListing';
import { InventoryListing } from './InventoryListing';
import { SpellsListing } from './SpellsListing';
import { Save, Trash2, Users, Shield, Brain, Award, Backpack, Sparkles, Dices, Swords } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { InfoDisplayDialog } from '@/components/InfoDisplayDialog'; 
import { calculateDetailedAbilityScores, calculateFeatEffects, calculateLevelFromXp } from '@/types/character';
import { useI18n } from '@/context/I18nProvider';
import { useDefinitionsStore } from '@/lib/definitions-store';


type ResistanceFieldKeySheet = Exclude<keyof Pick<Character,
  'fireResistance' | 'coldResistance' | 'acidResistance' | 'electricityResistance' | 'sonicResistance' |
  'spellResistance' | 'powerResistance' | 'fortification'
>, 'damageReduction'>;


interface CharacterSheetTabsProps {
  initialCharacter: Character;
  onSave: (character: Character) => void;
  onDelete: (characterId: string) => void;
}

export function CharacterSheetTabs({ initialCharacter, onSave, onDelete }: CharacterSheetTabsProps) {
  const [character, setCharacter] = useState<Character>(initialCharacter);
  const { toast } = useToast();
  const router = useRouter();
  const { translations, isLoading: translationsLoading } = useI18n();
  const { customFeatDefinitions } = useDefinitionsStore(state => ({ customFeatDefinitions: state.customFeatDefinitions }));


  const [activeInfoDialogType, setActiveInfoDialogType] = useState<InfoDialogContentType | null>(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  
  const [aggregatedFeatEffects, setAggregatedFeatEffects] = useState<AggregatedFeatEffects | null>(null);
  const [detailedAbilityScores, setDetailedAbilityScores] = useState<DetailedAbilityScores | null>(null);

  const allAvailableFeatDefinitions = React.useMemo(() => {
    if (translationsLoading || !translations) return [];
    const predefined = translations.DND_FEATS_DEFINITIONS.map(def => ({ ...def, isCustom: false as const }));
    return [...predefined, ...customFeatDefinitions];
  }, [translationsLoading, translations, customFeatDefinitions]);


  const characterLevelFromXP = React.useMemo(() => {
    if (!character || translationsLoading || !translations) return 1;
    return calculateLevelFromXp(
      character.experiencePoints || 0,
      translations.XP_TABLE,
      translations.EPIC_LEVEL_XP_INCREASE
    );
  }, [character, translations, translationsLoading]);


  useEffect(() => {
    setCharacter(initialCharacter);
  }, [initialCharacter]);
  
  useEffect(() => {
    if (character && translations && !translationsLoading && allAvailableFeatDefinitions) {
      const aggFeats = calculateFeatEffects(character, allAvailableFeatDefinitions);
      setAggregatedFeatEffects(aggFeats);
      const detailedScores = calculateDetailedAbilityScores(
        character,
        aggFeats,
        translations.DND_RACES,
        translations.DND_RACE_ABILITY_MODIFIERS_DATA,
        translations.DND_RACE_BASE_MAX_AGE_DATA,
        translations.RACE_TO_AGING_CATEGORY_MAP_DATA,
        translations.DND_RACE_AGING_EFFECTS_DATA,
        translations.ABILITY_LABELS
      );
      setDetailedAbilityScores(detailedScores);
    }
  }, [character, translations, translationsLoading, allAvailableFeatDefinitions]);


  const handleSaveCharacter = () => {
    onSave(character);
    toast({
      title: "Character Saved!",
      description: `${character.name}'s sheet has been updated.`,
    });
  };

  const handleDeleteCharacter = () => {
    onDelete(character.id);
    toast({
      title: "Character Deleted",
      description: `${character.name} has been removed.`,
      variant: "destructive",
    });
    router.push('/');
  };

  const handleCoreValueChange = useCallback(<K extends keyof Character>(field: K, value: Character[K]) => {
    setCharacter(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const handleClassChange = useCallback((index: number, field: keyof CharacterClass, value: string | number) => {
    setCharacter(prev => {
      const newClasses = [...prev.classes];
      if (newClasses[index]) {
        (newClasses[index] as any)[field] = value;
      } else {
        // This part might need adjustment if multiple classes are supported beyond simple first class editing
        newClasses[index] = { id: crypto.randomUUID(), className: '', level: 1, ...{[field]: value} };
      }
      return { ...prev, classes: newClasses };
    });
  }, []);

  const handleAbilityScoreChange = useCallback((ability: AbilityName, value: number) => {
    setCharacter(prev => ({
      ...prev,
      abilityScores: {
        ...prev.abilityScores,
        [ability]: value,
      },
    }));
  }, []);
  
  const handleCharacterUpdate = useCallback((
    field: keyof Character | 
           `savingThrows.${keyof SavingThrows}.${'base'|'magicMod'|'miscMod'}` |
           `${ResistanceFieldKeySheet}.customMod` |
           'damageReduction' |
           'powerAttackValue' | 'combatExpertiseValue',
    value: any
  ) => {
    setCharacter(prev => {
      const parts = String(field).split('.');
      if (parts.length > 1) {
        const mainKey = parts[0] as keyof Character;
        const subKey = parts[1] as string;
        const nestedKey = parts[2] as string | undefined;

        if (mainKey === 'savingThrows' && nestedKey && (subKey === 'fortitude' || subKey === 'reflex' || subKey === 'will')) {
          const saveType = subKey as keyof SavingThrows;
          const prop = nestedKey as 'base' | 'magicMod' | 'miscMod';
          return {
            ...prev,
            savingThrows: {
              ...prev.savingThrows,
              [saveType]: {
                ...prev.savingThrows[saveType],
                [prop]: value,
              },
            },
          };
        } else if (Object.keys(prev).includes(mainKey) && (prev[mainKey] as any).hasOwnProperty('customMod') && subKey === 'customMod') {
          const resistanceField = mainKey as ResistanceFieldKeySheet;
           return {
            ...prev,
            [resistanceField]: {
              ...(prev[resistanceField] as ResistanceValue),
              customMod: value,
            },
          };
        }
      }
      return { ...prev, [field as keyof Character]: value };
    });
  }, []);


  const handleSkillChange = useCallback((skillId: string, ranks: number, miscModifier: number, isClassSkill?: boolean) => {
    setCharacter(prev => ({
      ...prev,
      skills: prev.skills.map(s =>
        s.id === skillId ? { ...s, ranks, miscModifier, isClassSkill: isClassSkill === undefined ? s.isClassSkill : s.isClassSkill } : s
      ),
    }));
  }, []);

  const handleFeatAdd = useCallback((feat: Character['feats'][number]) => { 
    setCharacter(prev => ({ ...prev, feats: [...prev.feats, feat ] }));
  }, []);

  const handleFeatRemove = useCallback((instanceId: string) => { 
    setCharacter(prev => ({ ...prev, feats: prev.feats.filter(f => f.instanceId !== instanceId) }));
  }, []);
  
  const handleFeatUpdate = useCallback((updatedFeatInstance: Character['feats'][number]) => { 
    setCharacter(prev => ({
      ...prev,
      feats: prev.feats.map(f => f.instanceId === updatedFeatInstance.instanceId ? updatedFeatInstance : f)
    }));
  }, []);

  const handleItemAdd = useCallback((item: Item) => {
    setCharacter(prev => ({ ...prev, inventory: [...prev.inventory, item] }));
  }, []);

  const handleItemRemove = useCallback((itemId: string) => {
    setCharacter(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== itemId) }));
  }, []);

  const handleItemUpdate = useCallback((updatedItem: Item) => {
    setCharacter(prev => ({
      ...prev,
      inventory: prev.inventory.map(i => i.id === updatedItem.id ? updatedItem : i)
    }));
  }, []);

  const openInfoDialog = (contentType: InfoDialogContentType) => {
    setActiveInfoDialogType(contentType);
    setIsInfoDialogOpen(true);
  };

  const handleOpenCombatStatInfoDialog = (contentType: InfoDialogContentType) => {
    openInfoDialog(contentType);
  };
  

  if (!character || translationsLoading || !detailedAbilityScores || !aggregatedFeatEffects || !allAvailableFeatDefinitions) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-10 min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">
              {translations?.UI_STRINGS.characterSheetLoadingCharacter || "Loading character sheet..."}
            </p>
        </div>
      </div>
    );
  }


  const combatPanelDataForDisplay: CombatPanelCharacterData = {
    abilityScores: character.abilityScores,
    classes: character.classes,
    size: character.size,
    inventory: character.inventory,
    feats: character.feats,
    babMiscModifier: character.babMiscModifier,
    initiativeMiscModifier: character.initiativeMiscModifier,
    grappleMiscModifier: character.grappleMiscModifier,
    grappleDamage_baseNotes: character.grappleDamage_baseNotes,
    grappleDamage_bonus: character.grappleDamage_bonus,
    grappleWeaponChoice: character.grappleWeaponChoice,
    sizeModifierAttack: character.sizeModifierAttack,
    powerAttackValue: character.powerAttackValue,
    combatExpertiseValue: character.combatExpertiseValue,
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary truncate max-w-md">{character.name}</h1>
        <div className="flex space-x-2">
          <Button onClick={handleSaveCharacter} size="lg" className="shadow-md">
            <Save className="mr-2 h-5 w-5" /> Save Changes
          </Button>
           <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="lg" className="shadow-md">
                <Trash2 className="mr-2 h-5 w-5" /> Delete Character
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {character.name}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteCharacter}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="core" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-7">
          <TabsTrigger value="core"><Users className="mr-1 h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Core</span></TabsTrigger>
          <TabsTrigger value="abilities"><Dices className="mr-1 h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Abilities</span></TabsTrigger>
          <TabsTrigger value="combat"><Swords className="mr-1 h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Combat</span></TabsTrigger>
          <TabsTrigger value="skills"><Brain className="mr-1 h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Skills</span></TabsTrigger>
          <TabsTrigger value="feats"><Award className="mr-1 h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Feats</span></TabsTrigger>
          <TabsTrigger value="inventory"><Backpack className="mr-1 h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Inventory</span></TabsTrigger>
          <TabsTrigger value="spells"><Sparkles className="mr-1 h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Spells</span></TabsTrigger>
        </TabsList>

        <TabsContent value="core" className="mt-4">
          <CoreInfoSection 
            character={character} 
            onCoreValueChange={handleCoreValueChange} 
            onClassChange={handleClassChange}
          />
        </TabsContent>
        <TabsContent value="abilities" className="mt-4">
          <AbilityScoresSection 
            abilityScores={character.abilityScores}
            onAbilityScoreChange={handleAbilityScoreChange}
          />
        </TabsContent>
        <TabsContent value="combat" className="mt-4">
          <CombatPanel
            combatData={combatPanelDataForDisplay}
            aggregatedFeatEffects={aggregatedFeatEffects}
            allFeatDefinitions={allAvailableFeatDefinitions}
            onCharacterUpdate={handleCharacterUpdate as any}
            onOpenCombatStatInfoDialog={handleOpenCombatStatInfoDialog}
            onOpenRollDialog={openInfoDialog as any} // TODO: Fix proper roll dialog handler
          />
        </TabsContent>
        <TabsContent value="skills" className="mt-4">
          <SkillsListing 
            skills={character.skills} 
            abilityScores={character.abilityScores}
            characterClasses={character.classes}
            characterExperiencePoints={character.experiencePoints || 0}
            onSkillChange={handleSkillChange} 
          />
        </TabsContent>
        <TabsContent value="feats" className="mt-4">
          <FeatsListing 
            feats={character.feats} 
            characterClasses={character.classes}
            onFeatAdd={handleFeatAdd} 
            onFeatRemove={handleFeatRemove}
            onFeatUpdate={handleFeatUpdate}
          />
        </TabsContent>
        <TabsContent value="inventory" className="mt-4">
          <InventoryListing 
            inventory={character.inventory} 
            onItemAdd={handleItemAdd} 
            onItemRemove={handleItemRemove}
            onItemUpdate={handleItemUpdate}
          />
        </TabsContent>
        <TabsContent value="spells" className="mt-4">
          <SpellsListing />
        </TabsContent>
      </Tabs>
      {isInfoDialogOpen && activeInfoDialogType && detailedAbilityScores && aggregatedFeatEffects && (
        <InfoDisplayDialog
          isOpen={isInfoDialogOpen}
          onOpenChange={setIsInfoDialogOpen}
          character={character}
          contentType={activeInfoDialogType}
          aggregatedFeatEffects={aggregatedFeatEffects}
          detailedAbilityScores={detailedAbilityScores}
        />
      )}
    </div>
  );
}

