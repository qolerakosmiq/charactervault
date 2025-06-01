
'use client';

import type { Character, Skill, Item, CharacterClass, AbilityName, SavingThrows, ResistanceValue, BabBreakdownDetails, InitiativeBreakdownDetails, GrappleModifierBreakdownDetails, GrappleDamageBreakdownDetails } from '@/types/character';
import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CoreInfoSection } from './CoreInfoSection';
import { AbilityScoresSection } from './AbilityScoresSection';
import { CombatPanel } from '../form-sections/CombatPanel'; // Changed from CombatStatsSection to CombatPanel
import { SkillsListing } from '../SkillsListing'; // Corrected: This is likely from '../SkillsListing' not './SkillsListing'
import { FeatsListing } from './FeatsListing';
import { InventoryListing } from './InventoryListing';
import { SpellsListing } from './SpellsListing';
import { Save, Trash2, Users, Shield, Brain, Award, Backpack, Sparkles, Dices } from 'lucide-react';
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
import { InfoDisplayDialog } from '@/components/InfoDisplayDialog'; // Added import

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

  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [currentInfoDialogData, setCurrentInfoDialogData] = useState<Parameters<typeof InfoDisplayDialog>[0] | null>(null);


  useEffect(() => {
    setCharacter(initialCharacter);
  }, [initialCharacter]);

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
        (newClasses[index] as any)[field] = value; // Type assertion for simplicity
      } else {
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
           'damageReduction', 
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
          // Handles updates like 'fireResistance.customMod'
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

  const handleFeatAdd = useCallback((featId: string, name: string, description?: string) => { // Adjusted to match FeatsListing
    setCharacter(prev => ({ ...prev, feats: [...prev.feats, { definitionId: featId, instanceId: crypto.randomUUID(), isGranted: false, specializationDetail: '' }] }));
  }, []);

  const handleFeatRemove = useCallback((instanceId: string) => { // Changed to instanceId
    setCharacter(prev => ({ ...prev, feats: prev.feats.filter(f => f.instanceId !== instanceId) }));
  }, []);
  
  const handleFeatUpdate = useCallback((updatedFeatInstance: Character['feats'][number]) => { // Changed to instance
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

  const handleOpenCombatStatInfoDialog = (
    breakdownType: 'bab' | 'initiative' | 'grappleModifier' | 'grappleDamage',
    details: BabBreakdownDetails | InitiativeBreakdownDetails | GrappleModifierBreakdownDetails | GrappleDamageBreakdownDetails
  ) => {
    let dialogTitle = '';
    let dialogProps: Partial<React.ComponentProps<typeof InfoDisplayDialog>> = {};

    switch (breakdownType) {
        case 'bab':
            dialogTitle = "Base Attack Bonus Breakdown";
            dialogProps = { babBreakdown: details as BabBreakdownDetails };
            break;
        case 'initiative':
            dialogTitle = "Initiative Breakdown";
            dialogProps = { initiativeBreakdown: details as InitiativeBreakdownDetails };
            break;
        case 'grappleModifier':
            dialogTitle = "Grapple Modifier Breakdown";
            dialogProps = { grappleModifierBreakdown: details as GrappleModifierBreakdownDetails };
            break;
        case 'grappleDamage':
            dialogTitle = "Grapple Damage Notes";
            dialogProps = { grappleDamageBreakdown: details as GrappleDamageBreakdownDetails };
            break;
    }
    setCurrentInfoDialogData({
        isOpen: true, 
        onOpenChange: setIsInfoDialogOpen, 
        title: dialogTitle,
        ...dialogProps
    });
    setIsInfoDialogOpen(true); // Ensure the dialog is set to open
  };


  if (!character) return <div>Loading character data...</div>;

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
          <TabsTrigger value="combat"><Shield className="mr-1 h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Combat</span></TabsTrigger>
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
            character={character} 
            onCharacterUpdate={handleCharacterUpdate}
            onOpenCombatStatInfoDialog={handleOpenCombatStatInfoDialog} // Pass handler
          />
        </TabsContent>
        <TabsContent value="skills" className="mt-4">
          <SkillsListing 
            skills={character.skills} 
            abilityScores={character.abilityScores}
            characterClasses={character.classes}
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
      {currentInfoDialogData && isInfoDialogOpen && (
        <InfoDisplayDialog
          isOpen={isInfoDialogOpen}
          onOpenChange={setIsInfoDialogOpen}
          title={currentInfoDialogData.title}
          content={currentInfoDialogData.content}
          abilityModifiers={currentInfoDialogData.abilityModifiers}
          skillBonuses={currentInfoDialogData.skillBonuses}
          grantedFeats={currentInfoDialogData.grantedFeats}
          bonusFeatSlots={currentInfoDialogData.bonusFeatSlots}
          abilityScoreBreakdown={currentInfoDialogData.abilityScoreBreakdown}
          detailsList={currentInfoDialogData.detailsList}
          skillModifierBreakdown={currentInfoDialogData.skillModifierBreakdown}
          resistanceBreakdown={currentInfoDialogData.resistanceBreakdown}
          babBreakdown={currentInfoDialogData.babBreakdown}
          initiativeBreakdown={currentInfoDialogData.initiativeBreakdown}
          grappleModifierBreakdown={currentInfoDialogData.grappleModifierBreakdown}
          grappleDamageBreakdown={currentInfoDialogData.grappleDamageBreakdown}
        />
      )}
    </div>
  );
}
