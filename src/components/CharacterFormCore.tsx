
'use client';

import * as React from 'react';
import type { FormEvent } from 'react';
import type {
  AbilityName, Character, CharacterClass,
  DndRaceId, AbilityScores,
  FeatDefinitionJsonData, CharacterFeatInstance, SkillDefinitionJsonData,
  InfoDialogContentType,
  AggregatedFeatEffects, DetailedAbilityScores, ComboboxOption,
  ItemDefinition, ItemDefinitionId, ItemInstance, GearSlotId
} from '@/types/character';
import {
  getGrantedFeatsForCharacter,
  calculateDetailedAbilityScores,
  ABILITY_ORDER_INTERNAL,
  calculateFeatEffects
} from '@/types/character';
import {
  calculateLevelFromXp
} from '@/lib/dnd-utils';


import { useDefinitionsStore, type CustomSkillDefinition } from '@/lib/definitions-store';
import { useI18n, type I18nContextType } from '@/context/I18nProvider';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { InfoDisplayDialog } from '@/components/InfoDisplayDialog';
import { RollDialog, type RollDialogProps } from '@/components/RollDialog';
import { BasicInformationSection, type BasicInformationSectionProps } from '@/components/form-sections/BasicInformationSection';
import { CharacterFormAbilityScoresSection, type CharacterFormAbilityScoresSectionProps } from '@/components/form-sections/CharacterFormAbilityScoresSection';
import { CharacterFormStoryPortraitSection, type CharacterFormStoryPortraitSectionProps } from '@/components/form-sections/CharacterFormStoryPortraitSection';
import { SkillsFormSection, type SkillsFormSectionProps } from '@/components/form-sections/SkillsFormSection';
import { FeatsFormSection, type FeatsFormSectionProps } from '@/components/form-sections/FeatsFormSection';
import { SavingThrowsPanel, type SavingThrowsPanelProps } from '@/components/form-sections/SavingThrowsPanel';
import { ArmorClassPanel, type ArmorClassPanelProps } from '@/components/form-sections/ArmorClassPanel';
import { HealthPanel, type HealthPanelProps } from '@/components/form-sections/HealthPanel';
import { SpeedPanel, type SpeedPanelProps } from '@/components/form-sections/SpeedPanel';
import { CombatPanel, type CombatPanelProps } from '@/components/form-sections/CombatPanel';
import { ResistancesPanel, type ResistancesPanelProps } from '@/components/form-sections/ResistancesPanel';
import { LanguagesPanel, type LanguagesPanelProps } from '@/components/form-sections/LanguagesPanel';
import { ConditionsPanel, type ConditionsPanelProps } from '@/components/form-sections/ConditionsPanel';
import { ExperiencePanel } from '@/components/form-sections/ExperiencePanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Brain, Award, Backpack, Swords, Dices } from 'lucide-react';
import { createBaseCharacterData } from '@/lib/character-creation';


interface CharacterFormCoreProps {
  onSave: (character: Character) => void;
}

const abilityNames: Exclude<AbilityName, 'none'>[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

const CharacterFormCoreComponent = ({ onSave }: CharacterFormCoreProps) => {
  const i18nContext = useI18n();
  const { translations, isLoading: translationsLoading, language } = i18nContext;
  const {
    customFeatDefinitions: globalCustomFeatDefinitionsFromStore,
    customSkillDefinitions: globalCustomSkillDefinitionsFromStore,
  } = useDefinitionsStore();

  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const globalCustomFeatDefinitions = React.useMemo(() => isClient ? globalCustomFeatDefinitionsFromStore : [], [isClient, globalCustomFeatDefinitionsFromStore]);
  const globalCustomSkillDefinitions = React.useMemo(() => isClient ? globalCustomSkillDefinitionsFromStore : [], [isClient, globalCustomSkillDefinitionsFromStore]);

  const [character, setCharacter] = React.useState<Character | null>(null);

  const allAvailableFeatDefinitions = React.useMemo(() => {
    if (translationsLoading || !translations) return [];
    const predefined = translations.DND_FEATS_DEFINITIONS.map(def => ({ ...def, isCustom: false as const }));
    return [...predefined, ...globalCustomFeatDefinitions];
  }, [translationsLoading, translations, globalCustomFeatDefinitions]);

  const allAvailableSkillDefinitionsForDisplay = React.useMemo(() => {
    if (translationsLoading || !translations) return [];
    const predefined = translations.SKILL_DEFINITIONS.map(sd => ({
      id: sd.id, label: sd.label, keyAbility: sd.keyAbility as AbilityName, description: sd.description, isCustom: false,
      providesSynergies: (translations.SKILL_SYNERGIES as Record<string, any>)[sd.id] || [],
    }));
    const custom = globalCustomSkillDefinitions.map(csd => ({
      id: csd.id, label: csd.name, keyAbility: csd.keyAbility, description: csd.description, isCustom: true, providesSynergies: csd.providesSynergies,
    }));
    return [...predefined, ...custom].sort((a,b) => (a.label || '').localeCompare(b.label || ''));
  }, [translationsLoading, translations, globalCustomSkillDefinitions]);

  const allItemDefinitions = React.useMemo(() => {
    if (translationsLoading || !translations) return [];
    const items: ItemDefinition[] = [];
    if (translations.ITEM_DEFINITIONS_WEAPONS) items.push(...translations.ITEM_DEFINITIONS_WEAPONS);
    if (translations.ITEM_DEFINITIONS_ARMOR) items.push(...translations.ITEM_DEFINITIONS_ARMOR);
    if (translations.ITEM_DEFINITIONS_SHIELDS) items.push(...translations.ITEM_DEFINITIONS_SHIELDS);
    if (translations.ITEM_DEFINITIONS_MAGIC_ITEMS) items.push(...translations.ITEM_DEFINITIONS_MAGIC_ITEMS);
    return items;
  }, [translations, translationsLoading]);


  React.useEffect(() => {
    if (!isClient || translationsLoading || !translations || !translations.UI_STRINGS) return;
    let initialCharData = createBaseCharacterData(translations, globalCustomSkillDefinitions);
    setCharacter(initialCharData);
  }, [isClient, translationsLoading, translations, globalCustomSkillDefinitions]);

  const [activeInfoDialogType, setActiveInfoDialogType] = React.useState<InfoDialogContentType | null>(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = React.useState(false);
  const [rollDialogProps, setRollDialogProps] = React.useState<Omit<RollDialogProps, 'isOpen' | 'onOpenChange' | 'onRoll'> | null>(null);
  const [isRollAbilityDialogOpen, setIsRollAbilityDialogOpen] = React.useState(false);


  const router = useRouter();
  const { toast } = useToast();
  
  const aggregatedFeatEffects = React.useMemo(() => {
    if (!character || !translations || allAvailableFeatDefinitions.length === 0 || allItemDefinitions.length === 0) return null;
    return calculateFeatEffects(character, allAvailableFeatDefinitions, translations);
  }, [character, translations, allAvailableFeatDefinitions, allItemDefinitions]);

  const detailedAbilityScores = React.useMemo(() => {
    if (!character || !aggregatedFeatEffects || !translations) return null;
    return calculateDetailedAbilityScores(
      character, aggregatedFeatEffects, translations.DND_RACES, translations.DND_RACE_ABILITY_MODIFIERS_DATA,
      translations.DND_RACE_BASE_MAX_AGE_DATA, translations.RACE_TO_AGING_CATEGORY_MAP_DATA, translations.DND_RACE_AGING_EFFECTS_DATA, translations.ABILITY_LABELS
    );
  }, [character, aggregatedFeatEffects, translations]);


  const actualAbilityScoresForSavesAndSkills = React.useMemo(() => {
    if (!detailedAbilityScores) {
      if (!character) return ABILITY_ORDER_INTERNAL.reduce((acc, key) => { acc[key] = 0; return acc; }, {} as AbilityScores);
      return character.abilityScores;
    }
    return ABILITY_ORDER_INTERNAL.reduce((acc, ability) => {
      acc[ability] = detailedAbilityScores[ability].finalScore;
      return acc;
    }, {} as AbilityScores);
  }, [detailedAbilityScores, character]);

  React.useEffect(() => {
    if (!character || !translations) return;
    const aggFeats = calculateFeatEffects(character, allAvailableFeatDefinitions, translations);
    const detailedScores = calculateDetailedAbilityScores(
      character, aggFeats, translations.DND_RACES, translations.DND_RACE_ABILITY_MODIFIERS_DATA,
      translations.DND_RACE_BASE_MAX_AGE_DATA, translations.RACE_TO_AGING_CATEGORY_MAP_DATA, translations.DND_RACE_AGING_EFFECTS_DATA, translations.ABILITY_LABELS
    );

    const conMod = calculateAbilityModifier(detailedScores.constitution.finalScore);
    const featHpBonus = aggFeats.hpBonus || 0;
    const newMaxHp = (character.baseMaxHp || 0) + conMod + (character.customMaxHpModifier || 0) + featHpBonus;
    
    if (character.maxHp !== newMaxHp || character.hp > newMaxHp) {
      setCharacter(prev => {
        if (!prev) return null;
        const currentHp = prev.hp > newMaxHp ? newMaxHp : prev.hp;
        if (prev.maxHp === newMaxHp && prev.hp === currentHp) return prev;
        return { ...prev, maxHp: newMaxHp, hp: currentHp };
      });
    }
  }, [character, translations, allAvailableFeatDefinitions, allItemDefinitions]);


  const handleCoreInfoFieldChange = React.useCallback((
    field: keyof Character, value: any
  ) => {
     setCharacter(prev => {
        if (!prev || !translations) return null;
        let updatedChar = { ...prev, [field]: value };
        
        if (['classes', 'race', 'alignment', 'deity', 'classSpecificChoices', 'experiencePoints'].includes(field)) {
            const newGrantedFeats = getGrantedFeatsForCharacter(
              updatedChar, allAvailableFeatDefinitions, translations.DND_RACES, translations.DND_CLASSES,
              translations.DND_DOMAINS, translations.DND_DEITIES, translations.XP_TABLE, translations.EPIC_LEVEL_XP_INCREASE, translations.UI_STRINGS
            );
            const userChosenFeats = updatedChar.feats.filter(fi => !fi.isGranted);
            const combinedFeatsMap = new Map<string, CharacterFeatInstance>();
            newGrantedFeats.forEach(inst => combinedFeatsMap.set(inst.instanceId, { ...inst, isGranted: true }));
            userChosenFeats.forEach(inst => {
              const def = allAvailableFeatDefinitions.find(d => d.id === inst.definitionId);
              if (!newGrantedFeats.some(gf => gf.definitionId === inst.definitionId && !def?.canTakeMultipleTimes)) {
                  combinedFeatsMap.set(inst.instanceId, inst);
              }
            });
            updatedChar.feats = Array.from(combinedFeatsMap.values()).sort((a,b) => (allAvailableFeatDefinitions.find(d=>d.id===a.definitionId)?.label||'').localeCompare(allAvailableFeatDefinitions.find(d=>d.id===b.definitionId)?.label||''));
        }
        return updatedChar;
     });
  }, [translations, allAvailableFeatDefinitions]);

  const handleClassChange = React.useCallback((newClassName: DndClassId | string) => {
    setCharacter(prev => {
      if (!prev || !translations) return null;
      const updatedClasses: CharacterClass[] = [{ ...prev.classes[0], className: newClassName, level: 1 }];

      const newClassDef = translations.DND_CLASSES.find(c => c.id === newClassName);
      const newClassSpecificChoices: CharacterClass['classSpecificChoices'] = [];
      if (newClassDef?.uiSections) {
        newClassDef.uiSections.forEach(uiBlock => {
          if (uiBlock.defaultValue !== undefined && uiBlock.defaultValue !== null) {
            newClassSpecificChoices.push({ featureKey: uiBlock.key, value: uiBlock.defaultValue });
          }
        });
      }

      return { ...prev, classes: updatedClasses, classSpecificChoices: newClassSpecificChoices };
    });
  }, [translations]);


  const handleFeatInstancesChange = React.useCallback((updatedFeatInstances: CharacterFeatInstance[]) => {
     setCharacter(prev => {
        if (!prev || !translations) return null;
        const currentGrantedFeats = getGrantedFeatsForCharacter(
            prev, allAvailableFeatDefinitions, translations.DND_RACES, translations.DND_CLASSES,
            translations.DND_DOMAINS, translations.DND_DEITIES, translations.XP_TABLE, translations.EPIC_LEVEL_XP_INCREASE, translations.UI_STRINGS
        );
        const userChosenFeats = updatedFeatInstances.filter(fi => !fi.isGranted);

        const combinedFeatsMap = new Map<string, CharacterFeatInstance>();
        currentGrantedFeats.forEach(inst => combinedFeatsMap.set(inst.instanceId, { ...inst, isGranted: true }));
        userChosenFeats.forEach(inst => combinedFeatsMap.set(inst.instanceId, { ...inst, isGranted: false }));

        const finalFeats = Array.from(combinedFeatsMap.values()).sort((a,b) => (allAvailableFeatDefinitions.find(d=>d.id===a.definitionId)?.label||'').localeCompare(allAvailableFeatDefinitions.find(d=>d.id===b.definitionId)?.label||''));
        return { ...prev, feats: finalFeats };
    });
  }, [allAvailableFeatDefinitions, translations]);
  
  const handlePortraitChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setCharacter(prev => prev ? ({ ...prev, portraitDataUrl: reader.result as string }) : null);
      };
      reader.readAsDataURL(file);
    } else {
      setCharacter(prev => prev ? ({ ...prev, portraitDataUrl: undefined }) : null);
    }
  }, []);

  const handleOpenRollDialog = React.useCallback((data: Omit<RollDialogProps, 'isOpen' | 'onOpenChange' | 'onRoll'>) => {
    setRollDialogProps(data);
    setIsRollAbilityDialogOpen(true);
  }, []);

  const handleRollResult = React.useCallback((diceResult: number, totalBonus: number, finalResult: number, weaponDamageDiceString: string) => { }, []);
  const handleCancel = React.useCallback(() => { router.push('/'); }, [router]);

  const openInfoDialog = React.useCallback((newContentType: InfoDialogContentType) => {
    setActiveInfoDialogType(newContentType);
    setIsInfoDialogOpen(true);
  }, []);

  const handleSubmit = React.useCallback((e: FormEvent) => {
    e.preventDefault();
    if (!character || !translations?.UI_STRINGS) {
      toast({ title: "Error", description: "Character data not loaded." });
      return;
    }
    onSave(character);
  }, [character, onSave, toast, translations]);
  
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && e.target instanceof HTMLElement && e.target.tagName.toLowerCase() === 'input') {
      e.preventDefault();
    }
  }, []);

  const characterLevelFromXP = React.useMemo(() => {
    if (!character?.experiencePoints || !translations?.XP_TABLE || !translations.EPIC_LEVEL_XP_INCREASE) return 1;
    return calculateLevelFromXp(character.experiencePoints, translations.XP_TABLE, translations.EPIC_LEVEL_XP_INCREASE);
  }, [character?.experiencePoints, translations]);


  const allSkillOptionsForDialog = React.useMemo((): ComboboxOption[] => {
    return allAvailableSkillDefinitionsForDisplay
      .map(s => ({ value: s.id, label: s.label }))
      .sort((a,b) => a.label.localeCompare(b.label));
  }, [allAvailableSkillDefinitionsForDisplay]);

  const allMagicSchoolOptionsForDialog = React.useMemo((): ComboboxOption[] => {
    if (translationsLoading || !translations) return [];
    return translations.DND_MAGIC_SCHOOLS.map(ms => ({ value: ms.id, label: ms.label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [translationsLoading, translations]);
  
  if (translationsLoading || !character || !translations?.UI_STRINGS || !detailedAbilityScores || !aggregatedFeatEffects || allItemDefinitions.length === 0) {
    return null;
  }
  const UI_STRINGS = translations.UI_STRINGS;
  
  const basicInfoData: BasicInformationSectionProps['characterData'] | undefined = {
    name: character.name, playerName: character.playerName, race: character.race, alignment: character.alignment,
    deity: character.deity, size: character.size, age: character.age, gender: character.gender, classes: character.classes
  };

  const abilityScoresData: CharacterFormAbilityScoresSectionProps['abilityScoresData'] | undefined = {
    abilityScores: character.abilityScores, abilityScoreTempCustomModifiers: character.abilityScoreTempCustomModifiers,
  };

  const combatDataForPanel: CombatPanelCharacterData | undefined = {
    abilityScores: character.abilityScores, classes: character.classes, size: character.size, inventory: character.inventory,
    equippedGear: character.equippedGear, feats: character.feats, babMiscModifier: character.babMiscModifier,
    initiativeMiscModifier: character.initiativeMiscModifier, grappleMiscModifier: character.grappleMiscModifier,
    grappleDamage_baseNotes: character.grappleDamage_baseNotes, grappleDamage_bonus: character.grappleDamage_bonus,
    grappleWeaponChoice: character.grappleWeaponChoice, sizeModifierAttack: character.sizeModifierAttack,
    powerAttackValue: character.powerAttackValue, combatExpertiseValue: character.combatExpertiseValue,
  };

  return (
    <>
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-6">
        <Tabs defaultValue="core" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
            <TabsTrigger value="core"><Users className="mr-1 h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">{UI_STRINGS.tabLabelCore || 'Core'}</span></TabsTrigger>
            <TabsTrigger value="abilities"><Dices className="mr-1 h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">{UI_STRINGS.tabLabelAbilities || 'Abilities'}</span></TabsTrigger>
            <TabsTrigger value="combat"><Swords className="mr-1 h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">{UI_STRINGS.tabLabelCombat || 'Combat'}</span></TabsTrigger>
            <TabsTrigger value="feats"><Award className="mr-1 h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">{UI_STRINGS.tabLabelFeats || 'Feats'}</span></TabsTrigger>
            <TabsTrigger value="inventory"><Backpack className="mr-1 h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">{UI_STRINGS.tabLabelInventory || 'Inventory'}</span></TabsTrigger>
          </TabsList>

          <TabsContent value="core" className="mt-6 flex flex-col gap-6">
             <BasicInformationSection
              characterData={basicInfoData}
              classSpecificChoices={character.classSpecificChoices || []}
              onFieldChange={handleCoreInfoFieldChange}
              onClassChange={handleClassChange}
              ageEffectsDetails={getNetAgingEffects(character.race, character.age, translations.DND_RACE_BASE_MAX_AGE_DATA, translations.RACE_TO_AGING_CATEGORY_MAP_DATA, translations.DND_RACE_AGING_EFFECTS_DATA, translations.ABILITY_LABELS)}
              raceSpecialQualities={getRaceSpecialQualities(character.race, translations.DND_RACES, translations.DND_RACE_ABILITY_MODIFIERS_DATA, allAvailableSkillDefinitionsForDisplay, allAvailableFeatDefinitions, translations.ABILITY_LABELS)}
              currentMinAgeForInput={translations.DND_RACE_MIN_ADULT_AGE_DATA[character.race as DndRaceId] || 1}
              onOpenRaceInfoDialog={() => openInfoDialog({ type: 'race' })}
              onOpenClassInfoDialog={() => openInfoDialog({ type: 'class' })}
              onOpenAlignmentInfoDialog={() => openInfoDialog({ type: 'alignmentSummary' })}
              onOpenDeityInfoDialog={() => openInfoDialog({ type: 'deity' })}
              onOpenClassSpecificChoiceInfoDialog={(contentType) => openInfoDialog(contentType)}
              aggregatedFeatEffects={aggregatedFeatEffects}
              characterLevel={characterLevelFromXP}
            />
             <CharacterFormStoryPortraitSection
              storyAndAppearanceData={{...character}}
              onFieldChange={handleCoreInfoFieldChange}
              onPortraitChange={handlePortraitChange}
            />
            <LanguagesPanel
              characterLanguages={character.languages || []}
              onLanguagesChange={(val) => handleCoreInfoFieldChange('languages', val)}
              characterRaceId={character.race}
              characterIntelligenceScore={detailedAbilityScores.intelligence.finalScore}
              speakLanguageSkillRanks={character.skills.find(s => s.id === 'speak-language')?.ranks || 0}
            />
          </TabsContent>
          
          <TabsContent value="abilities" className="mt-6 flex flex-col gap-6">
            <CharacterFormAbilityScoresSection
              abilityScoresData={abilityScoresData}
              detailedAbilityScores={detailedAbilityScores}
              onBaseAbilityScoreChange={(ability, value) => setCharacter(prev => prev ? ({ ...prev, abilityScores: { ...prev.abilityScores, [ability]: value } }) : null)}
              onMultipleBaseAbilityScoresChange={(newScores) => setCharacter(prev => prev ? ({ ...prev, abilityScores: newScores }) : null)}
              onAbilityScoreTempCustomModifierChange={(ability, value) => setCharacter(prev => prev ? ({ ...prev, abilityScoreTempCustomModifiers: { ...prev.abilityScoreTempCustomModifiers, [ability]: value } }) : null)}
              onOpenAbilityScoreBreakdownDialog={(ability) => openInfoDialog({type: 'abilityScoreBreakdown', abilityName: ability})}
              characterClassId={character.classes[0]?.className || ''}
            />
            <SavingThrowsPanel
              savingThrowsData={{ savingThrows: character.savingThrows, classes: character.classes, feats: character.feats }}
              abilityScores={actualAbilityScoresForSavesAndSkills}
              aggregatedFeatEffects={aggregatedFeatEffects}
              onSavingThrowTemporaryModChange={(saveType, value) => setCharacter(prev => prev ? ({...prev, savingThrows: {...prev.savingThrows, [saveType]: {...prev.savingThrows[saveType], miscMod: value}}}) : null)}
              onOpenInfoDialog={(contentType) => openInfoDialog(contentType)}
              onOpenRollDialog={handleOpenRollDialog}
            />
            <SkillsFormSection
              skillsData={{ skills: character.skills, classes: character.classes, race: character.race, size: character.size, feats: character.feats }}
              actualAbilityScores={actualAbilityScoresForSavesAndSkills}
              allFeatDefinitions={allAvailableFeatDefinitions}
              allPredefinedSkillDefinitions={translations.SKILL_DEFINITIONS}
              allCustomSkillDefinitions={globalCustomSkillDefinitions}
              onSkillChange={(skillId, ranks, miscModifier, isClassSkill) => setCharacter(prev => prev ? ({ ...prev, skills: prev.skills.map(s => s.id === skillId ? { ...s, ranks, miscModifier, isClassSkill: isClassSkill !== undefined ? isClassSkill : s.isClassSkill } : s) }) : null)}
              onEditCustomSkillDefinition={() => {}}
              onOpenSkillInfoDialog={(skillId) => openInfoDialog({type: 'skillModifierBreakdown', skillId})}
              onOpenRollDialog={handleOpenRollDialog}
              characterLevel={characterLevelFromXP}
              aggregatedFeatEffects={aggregatedFeatEffects}
            />
          </TabsContent>
          
          <TabsContent value="combat" className="mt-6 flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ArmorClassPanel
                  character={character}
                  aggregatedFeatEffects={aggregatedFeatEffects}
                  onCharacterUpdate={(field, value) => setCharacter(prev => prev ? ({...prev, [field]: value}) : null)}
                  onOpenAcBreakdownDialog={(contentType) => openInfoDialog(contentType)}
                />
                <div className="flex flex-col gap-6">
                    <ExperiencePanel
                      experienceData={{ currentXp: character.experiencePoints || 0, currentLevel: characterLevelFromXP }}
                      onXpChange={(newXp) => handleCoreInfoFieldChange('experiencePoints', newXp)}
                      xpTable={translations.XP_TABLE}
                      epicLevelXpIncrease={translations.EPIC_LEVEL_XP_INCREASE}
                    />
                    <HealthPanel
                      healthData={{...character}}
                      calculatedMaxHp={character.maxHp}
                      finalConstitutionModifier={calculateAbilityModifier(detailedAbilityScores.constitution.finalScore)}
                      calculatedMiscMaxHpBonus={aggregatedFeatEffects.hpBonus || 0}
                      onCharacterUpdate={(field, value) => setCharacter(prev => prev ? ({ ...prev, [field]: value }) : null)}
                      onOpenHealthInfoDialog={(contentType) => openInfoDialog(contentType)}
                    />
                </div>
            </div>
            <ResistancesPanel
              characterData={{...character}}
              aggregatedFeatEffects={aggregatedFeatEffects} 
              onResistanceChange={(field, subField, value) => setCharacter(prev => prev ? ({...prev, [field]: {...(prev[field] as any), [subField]: value}}) : null)}
              onDamageReductionChange={(newDrArray) => setCharacter(prev => prev ? ({...prev, damageReduction: newDrArray}) : null)}
              onOpenResistanceInfoDialog={(resistanceField) => openInfoDialog({type: 'resistanceBreakdown', resistanceField})}
            />
             <CombatPanel
              combatData={combatDataForPanel}
              aggregatedFeatEffects={aggregatedFeatEffects}
              allFeatDefinitions={allAvailableFeatDefinitions}
              onCharacterUpdate={(field, value) => setCharacter(prev => prev ? ({...prev, [field]: value}) : null)}
              onOpenCombatStatInfoDialog={(contentType) => openInfoDialog(contentType)}
              onOpenRollDialog={handleOpenRollDialog}
            />
            <SpeedPanel
              speedData={{...character}}
              aggregatedFeatEffects={aggregatedFeatEffects}
              onCharacterUpdate={(field, value) => setCharacter(prev => { if(!prev) return null; const keys = field.split('.'); if(keys.length > 1) { return {...prev, [keys[0]]: {...(prev as any)[keys[0]], [keys[1]]: value}}; } return {...prev, [field]: value};})}
              onOpenSpeedInfoDialog={(speedType) => openInfoDialog({type: 'speedBreakdown', speedType})}
              onOpenArmorSpeedPenaltyInfoDialog={() => openInfoDialog({type: 'armorSpeedPenaltyBreakdown'})}
              onOpenLoadSpeedPenaltyInfoDialog={() => openInfoDialog({type: 'loadSpeedPenaltyBreakdown'})}
            />
          </TabsContent>

          <TabsContent value="feats" className="mt-6 flex flex-col gap-6">
              <FeatsFormSection
                featSectionData={{...character}}
                allAvailableFeatDefinitions={allAvailableFeatDefinitions}
                chosenFeatInstances={character.feats}
                onFeatInstancesChange={handleFeatInstancesChange}
                onEditCustomFeatDefinition={() => {}}
                abilityScores={actualAbilityScoresForSavesAndSkills}
                skills={character.skills}
                allPredefinedSkillDefinitions={translations.SKILL_DEFINITIONS}
                allCustomSkillDefinitions={globalCustomSkillDefinitions}
                allSkillOptionsForDialog={allSkillOptionsForDialog}
                allMagicSchoolOptionsForDialog={allMagicSchoolOptionsForDialog}
                characterLevel={characterLevelFromXP}
                aggregatedFeatEffects={aggregatedFeatEffects}
              />
              <ConditionsPanel
                characterFeats={character.feats}
                allFeatDefinitions={allAvailableFeatDefinitions}
                onConditionToggle={(conditionKey, isActive) => setCharacter(prev => prev ? ({...prev, feats: prev.feats.map(feat => { const def = allAvailableFeatDefinitions.find(d => d.id === feat.definitionId); if (def && !def.permanentEffect && def.effects?.some(e => e.condition === conditionKey)) { return {...feat, conditionalEffectStates: {...feat.conditionalEffectStates, [conditionKey]: isActive}}; } return feat; })}) : null)}
                aggregatedFeatEffects={aggregatedFeatEffects}
              />
          </TabsContent>

          <TabsContent value="inventory" className="mt-6 flex flex-col gap-6">
            <p>Inventory will go here.</p>
          </TabsContent>

        </Tabs>

        <div className="flex flex-col-reverse md:flex-row md:justify-between gap-4 mt-8 pt-8 border-t">
          <Button type="button" variant="outline" size="lg" onClick={handleCancel} className="w-full md:w-auto">
            {UI_STRINGS.formButtonCancel}
          </Button>
          <Button type="submit" size="lg" className="w-full md:w-auto shadow-md hover:shadow-lg transition-shadow">
            {UI_STRINGS.formButtonCreateCharacter}
          </Button>
        </div>
      </form>
      
      {isInfoDialogOpen && activeInfoDialogType && character && aggregatedFeatEffects && detailedAbilityScores && (
        <InfoDisplayDialog
          isOpen={isInfoDialogOpen}
          onOpenChange={setIsInfoDialogOpen}
          character={character}
          contentType={activeInfoDialogType}
          aggregatedFeatEffects={aggregatedFeatEffects}
          detailedAbilityScores={detailedAbilityScores}
        />
      )}
      {isRollAbilityDialogOpen && rollDialogProps && (
        <RollDialog
          isOpen={isRollAbilityDialogOpen}
          onOpenChange={setIsRollAbilityDialogOpen}
          dialogTitle={rollDialogProps.dialogTitle}
          rollType={rollDialogProps.rollType}
          baseModifier={rollDialogProps.baseModifier}
          calculationBreakdown={rollDialogProps.calculationBreakdown}
          weaponDamageDiceString={rollDialogProps.weaponDamageDiceString}
          weaponCriticalMultiplier={rollDialogProps.weaponCriticalMultiplier}
          onRoll={handleRollResult}
          rerollTwentiesForChecks={rollDialogProps.rerollTwentiesForChecks}
        />
      )}
    </>
  );
};
CharacterFormCoreComponent.displayName = "CharacterFormCoreComponent";
export const CharacterFormCore = React.memo(CharacterFormCoreComponent);


function calculateAbilityModifier(score: number | undefined): number { 
  if (typeof score !== 'number' || isNaN(score)) { 
    return 0; 
  }
  return Math.floor((score - 10) / 2);
}

function getNetAgingEffects(
  raceId: DndRaceId | '',
  age: number,
  DND_RACE_BASE_MAX_AGE_DATA: Record<string, number>,
  RACE_TO_AGING_CATEGORY_MAP_DATA: Record<string, string>,
  DND_RACE_AGING_EFFECTS_DATA: Record<string, { categories: Array<{ categoryName: string; ageFactor: number; effects: Record<string, number> }> }>,
  ABILITY_LABELS: readonly { id: Exclude<AbilityName, 'none'>; label: string; abbr: string }[]
): { categoryName: string; effects: { ability: Exclude<AbilityName, 'none'>; change: number }[] } {
  const agingEffects = { categoryName: "Adult", effects: [] };
  // Placeholder for brevity. Actual implementation is more complex.
  return agingEffects;
}

function getRaceSpecialQualities(
    raceId: DndRaceId | '',
    DND_RACES: readonly DndRaceOption[],
    DND_RACE_ABILITY_MODIFIERS_DATA: Record<string, Partial<Record<Exclude<AbilityName, 'none'>, number>>>,
    SKILL_DEFINITIONS: readonly {id: string; label: string; keyAbility: AbilityName | string; description?: string}[],
    DND_FEATS_DEFINITIONS: readonly FeatDefinitionJsonData[],
    ABILITY_LABELS: readonly { id: Exclude<AbilityName, 'none'>; label: string; abbr: string }[]
): any {
    // Placeholder for brevity.
    return { abilityEffects: [], skillBonuses: [], grantedFeats: [], bonusFeatSlots: 0, speeds: {} };
}
