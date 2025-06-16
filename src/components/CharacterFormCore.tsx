
'use client';

import *as React from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type {
  AbilityName, Character, CharacterClass,
  DndRaceId, AbilityScores, SavingThrows, SavingThrowType,
  Skill as SkillType, DndClassId, DndDeityId, GenderId,
  DndRaceOption, DetailedAbilityScores, AbilityScoreBreakdown,
  FeatDefinitionJsonData, CharacterFeatInstance, SkillDefinitionJsonData, CharacterSize,
  ResistanceValue, DamageReductionInstance, DamageReductionType, InfoDialogContentType, ResistanceFieldKeySheet,
  SpeedDetails, SpeedType, CharacterAlignment, ProcessedSiteData, SpeedPanelCharacterData, CombatPanelCharacterData, LanguageId,
  AggregatedFeatEffects, ExperiencePanelData, ComboboxOption, MagicSchoolId, Item, GenericBreakdownItem, DamageReductionFeatEffect,
  CharacterFavoredEnemy, CharacterAnimalCompanion, DomainDefinition, DndDeityOption,
  GearSlot, GearSlotId, ItemDefinition, ItemDefinitionId, ItemInstance, ItemBaseType, CharacterClassSpecificChoice
} from '@/types/character';
import {
  getNetAgingEffects,
  getRaceSpecialQualities,
  getInitialCharacterSkills,
  getGrantedFeatsForCharacter,
  calculateDetailedAbilityScores,
  getRaceSkillPointsBonusPerLevel,
  ABILITY_ORDER_INTERNAL,
  calculateFeatEffects
} from '@/types/character';
import {
  getBab,
  getSizeModifierAC,
  getSizeModifierGrapple,
  getSizeModifierAttack,
  calculateInitiative,
  calculateGrapple,
  getUnarmedGrappleDamage,
  calculateAbilityModifier,
  calculateSumOfClassLevels,
  calculateLevelFromXp
} from '@/lib/dnd-utils';


import { useDefinitionsStore, type CustomSkillDefinition } from '@/lib/definitions-store';
import { useI18n } from '@/context/I18nProvider';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { InfoDisplayDialog } from '@/components/InfoDisplayDialog';
import { RollDialog, type RollDialogProps } from '@/components/RollDialog';
import { CharacterFormCoreInfoSection, type CharacterFormCoreInfoSectionProps } from '@/components/form-sections/CharacterFormCoreInfoSection';
import { CharacterFormAbilityScoresSection, type CharacterFormAbilityScoresSectionProps } from '@/components/form-sections/CharacterFormAbilityScoresSection';
import { CharacterFormStoryPortraitSection, type CharacterFormStoryPortraitSectionProps } from '@/components/form-sections/CharacterFormStoryPortraitSection';
import { SkillsFormSection, type SkillsFormSectionProps } from '@/components/SkillsFormSection';
import { FeatsFormSection, type FeatsFormSectionProps } from '@/components/FeatsFormSection';
import { SavingThrowsPanel, type SavingThrowsPanelProps } from '@/components/form-sections/SavingThrowsPanel';
import { ArmorClassPanel, type ArmorClassPanelProps } from '@/components/form-sections/ArmorClassPanel';
import { HealthPanel, type HealthPanelProps } from '@/components/form-sections/HealthPanel';
import { SpeedPanel, type SpeedPanelProps } from '@/components/form-sections/SpeedPanel';
import { CombatPanel, type CombatPanelProps } from '@/components/form-sections/CombatPanel';
import { ResistancesPanel, type ResistancesPanelProps } from '@/components/form-sections/ResistancesPanel';
import { LanguagesPanel, type LanguagesPanelProps } from '@/components/form-sections/LanguagesPanel';
import { AddCustomSkillDialog } from '@/components/AddCustomSkillDialog';
import { AddCustomFeatDialog } from '@/components/AddCustomFeatDialog';
import { ConditionsPanel, type ConditionsPanelProps } from '@/components/form-sections/ConditionsPanel';
import { ExperiencePanel } from '@/components/form-sections/ExperiencePanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import { Loader2 } from 'lucide-react';


interface CharacterFormCoreProps {
  onSave: (character: Character) => void;
}

const abilityNames: Exclude<AbilityName, 'none'>[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

function createBaseCharacterData(
    translations: ProcessedSiteData,
    globalCustomSkillDefinitions: CustomSkillDefinition[]
): Character {
    const {
      DEFAULT_ABILITIES, DEFAULT_SAVING_THROWS, DEFAULT_RESISTANCE_VALUE,
      DEFAULT_SPEED_DETAILS, DEFAULT_SPEED_PENALTIES, DND_RACES, DND_CLASSES,
      SIZES, SKILL_DEFINITIONS, CLASS_SKILLS, DND_RACE_ABILITY_MODIFIERS_DATA
    } = translations;

    const defaultHumanRace = DND_RACES.find(r => r.id === 'human');
    const defaultRaceValue = defaultHumanRace?.id || (DND_RACES.length > 0 ? DND_RACES[0].id : '');
    const defaultFighterClass = DND_CLASSES.find(c => c.id === 'fighter');
    const defaultClassNameValue = defaultFighterClass?.id || (DND_CLASSES.length > 0 ? DND_CLASSES[0].id : '');
    const defaultClasses: CharacterClass[] = [{ id: crypto.randomUUID(), className: defaultClassNameValue, level: 1 }];
    const defaultSize: CharacterSize = 'medium';
    const sizeLabelForGrapple = SIZES.find(s => s.id === defaultSize)?.label || defaultSize;
    const defaultUnarmedGrappleDice = getUnarmedGrappleDamage(defaultSize, SIZES);
    const defaultSizeModifierAttack = getSizeModifierAttack(defaultSize, SIZES);

    const allSkillDefinitionsForInstances: Array<{ id: string; label: string; keyAbility: AbilityName; isCustom: boolean }> = [
      ...SKILL_DEFINITIONS.map(sd => ({ id: sd.id, label: sd.label, keyAbility: sd.keyAbility as AbilityName, isCustom: false })),
      ...globalCustomSkillDefinitions.map(csd => ({ id: csd.id, label: csd.name, keyAbility: csd.keyAbility, isCustom: true }))
    ];

    const initialSkillInstances = allSkillDefinitionsForInstances.map(skillDef => {
      const isClassSkill = defaultClasses[0]?.className
        ? (CLASS_SKILLS[defaultClasses[0].className as keyof typeof CLASS_SKILLS] || []).includes(skillDef.id)
        : false;
      return {
        id: skillDef.id,
        ranks: 0,
        miscModifier: 0,
        isClassSkill: isClassSkill,
      };
    }).sort((a, b) => {
      const nameA = allSkillDefinitionsForInstances.find(d => d.id === a.id)?.label || '';
      const nameB = allSkillDefinitionsForInstances.find(d => d.id === b.id)?.label || '';
      return nameA.localeCompare(nameB);
    });


    const defaultClassDef = DND_CLASSES.find(c => c.id === defaultClassNameValue);
    let initialBaseMaxHp = 10;
    if (defaultClassDef?.hitDice) {
        const hitDiceValue = parseInt(defaultClassDef.hitDice.substring(1));
        if (!isNaN(hitDiceValue)) {
            initialBaseMaxHp = hitDiceValue;
        }
    }
    const initialConMod = calculateAbilityModifier(DEFAULT_ABILITIES.constitution);
    const initialMaxHp = initialBaseMaxHp + initialConMod;


    return {
      id: crypto.randomUUID(), name: '', playerName: '', campaign: '', homeland: '', race: defaultRaceValue, alignment: 'true-neutral' as CharacterAlignment, deity: '', size: defaultSize, sizeModifierAttack: defaultSizeModifierAttack, age: 20, gender: 'unspecified',
      languages: [], experiencePoints: 0,
      abilityScores: { ...(JSON.parse(JSON.stringify(DEFAULT_ABILITIES))) },
      abilityScoreTempCustomModifiers: { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 },
      hp: initialMaxHp,
      maxHp: initialMaxHp,
      baseMaxHp: initialBaseMaxHp,
      customMaxHpModifier: 0,
      nonlethalDamage: 0,
      temporaryHp: 0,
      numberOfWounds: 0,
      armorBonus: 0, shieldBonus: 0, sizeModifierAC: 0, naturalArmor: 0, deflectionBonus: 0, dodgeBonus: 0, acMiscModifier: 0, babMiscModifier: 0, initiativeMiscModifier: 0,
      grappleMiscModifier: 0, grappleWeaponChoice: 'unarmed', grappleDamage_baseNotes: `${defaultUnarmedGrappleDice} (${sizeLabelForGrapple} Unarmed)`, grappleDamage_bonus: 0,
      savingThrows: JSON.parse(JSON.stringify(DEFAULT_SAVING_THROWS)),
      classes: defaultClasses,
      skills: initialSkillInstances,
      feats: [],
      inventory: [],
      equippedGear: {}, 
      personalStory: '', portraitDataUrl: undefined,
      fireResistance: { ...DEFAULT_RESISTANCE_VALUE }, coldResistance: { ...DEFAULT_RESISTANCE_VALUE }, acidResistance: { ...DEFAULT_RESISTANCE_VALUE }, electricityResistance: { ...DEFAULT_RESISTANCE_VALUE }, sonicResistance: { ...DEFAULT_RESISTANCE_VALUE },
      spellResistance: { ...DEFAULT_RESISTANCE_VALUE }, powerResistance: { ...DEFAULT_RESISTANCE_VALUE }, damageReduction: [], fortification: { ...DEFAULT_RESISTANCE_VALUE },
      landSpeed: { ...DEFAULT_SPEED_DETAILS }, burrowSpeed: { ...DEFAULT_SPEED_DETAILS }, climbSpeed: { ...DEFAULT_SPEED_DETAILS }, flySpeed: { ...DEFAULT_SPEED_DETAILS }, swimSpeed: { ...DEFAULT_SPEED_DETAILS },
      armorSpeedPenalty_base: DEFAULT_SPEED_PENALTIES.armorSpeedPenalty_base || 0,
      armorSpeedPenalty_miscModifier: DEFAULT_SPEED_PENALTIES.armorSpeedPenalty_miscModifier || 0,
      loadSpeedPenalty_base: DEFAULT_SPEED_PENALTIES.loadSpeedPenalty_base || 0,
      loadSpeedPenalty_miscModifier: DEFAULT_SPEED_PENALTIES.loadSpeedPenalty_miscModifier || 0,
      powerAttackValue: 0,
      combatExpertiseValue: 0,
      classSpecificChoices: [], // Initialize classSpecificChoices
      animalCompanion: undefined,
    };
}


const CharacterFormCoreComponent = ({ onSave }: CharacterFormCoreProps) => {
  const { translations, isLoading: translationsLoading } = useI18n();
  const {
    customFeatDefinitions: globalCustomFeatDefinitionsFromStore,
    customSkillDefinitions: globalCustomSkillDefinitionsFromStore,
    actions: definitionsActions
  } = useDefinitionsStore();

  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const globalCustomFeatDefinitions = isClient ? globalCustomFeatDefinitionsFromStore : [];
  const globalCustomSkillDefinitions = isClient ? globalCustomSkillDefinitionsFromStore : [];

  const [character, setCharacter] = React.useState<Character | null>(null);


  const allAvailableFeatDefinitions = React.useMemo(() => {
    if (translationsLoading || !translations) return [];
    const predefined = translations.DND_FEATS_DEFINITIONS.map(def => ({ ...def, isCustom: false as const }));
    return [...predefined, ...globalCustomFeatDefinitions];
  }, [translationsLoading, translations, globalCustomFeatDefinitions]);

  const allAvailableSkillDefinitionsForDisplay = React.useMemo((): SkillDefinitionJsonData[] => {
    if (translationsLoading || !translations) return [];
    const predefined = translations.SKILL_DEFINITIONS.map(sd => ({
        id: sd.id,
        label: sd.label,
        keyAbility: sd.keyAbility as AbilityName,
        description: sd.description,
        isCustom: false,
        providesSynergies: (translations.SKILL_SYNERGIES as Record<string, any>)[sd.id] || [],
    }));
    const custom = globalCustomSkillDefinitions.map(csd => ({
        id: csd.id,
        label: csd.name,
        keyAbility: csd.keyAbility,
        description: csd.description,
        isCustom: true,
        providesSynergies: csd.providesSynergies,
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

    const { CLASS_SKILLS, SIZES, DND_RACES, DND_CLASSES, DND_DOMAINS, DND_DEITIES, XP_TABLE, EPIC_LEVEL_XP_INCREASE, UI_STRINGS } = translations;

    let currentSkills = initialCharData.skills.map(skillInstance => ({
        ...skillInstance,
        isClassSkill: initialCharData.classes[0]?.className ? (CLASS_SKILLS[initialCharData.classes[0].className as keyof typeof CLASS_SKILLS] || []).includes(skillInstance.id) : false,
    }));

    initialCharData.skills = currentSkills.sort((a, b) => (allAvailableSkillDefinitionsForDisplay.find(d => d.id === a.id)?.label || '').localeCompare(allAvailableSkillDefinitionsForDisplay.find(d => d.id === b.id)?.label || ''));

    const initialGrantedFeats = getGrantedFeatsForCharacter(
      initialCharData,
      allAvailableFeatDefinitions, DND_RACES, DND_CLASSES, DND_DOMAINS, DND_DEITIES, XP_TABLE, EPIC_LEVEL_XP_INCREASE, UI_STRINGS
    );

    const userChosenFeats = initialCharData.feats?.filter(fi => !fi.isGranted) || [];

    const combinedFeatsMap = new Map<string, CharacterFeatInstance>();
    initialGrantedFeats.forEach(inst => combinedFeatsMap.set(inst.instanceId, { ...inst, isGranted: true }));
    userChosenFeats.forEach(inst => {
      const def = allAvailableFeatDefinitions.find(d => d.id === inst.definitionId);
      if (!initialGrantedFeats.some(gf => gf.definitionId === inst.definitionId && !def?.canTakeMultipleTimes)) {
          combinedFeatsMap.set(inst.instanceId, inst);
      }
    });

    initialCharData.feats = Array.from(combinedFeatsMap.values()).sort((a,b) => (allAvailableFeatDefinitions.find(d=>d.id===a.definitionId)?.label||'').localeCompare(allAvailableFeatDefinitions.find(d=>d.id===b.definitionId)?.label||''));


    if (initialCharData.grappleWeaponChoice === 'unarmed') {
        const unarmedDamageDice = getUnarmedGrappleDamage(initialCharData.size, SIZES);
        const currentSizeLabelGrapple = SIZES.find(s => s.id === initialCharData.size)?.label || initialCharData.size;
        initialCharData.grappleDamage_baseNotes = `${unarmedDamageDice} (${currentSizeLabelGrapple} Unarmed)`;
    }
    initialCharData.sizeModifierAttack = getSizeModifierAttack(initialCharData.size, SIZES);

    const tempAggFeats = calculateFeatEffects(initialCharData, allAvailableFeatDefinitions, translations);
    const existingUserDrInstances = initialCharData.damageReduction?.filter(dr => !dr.isGranted) || [];
    let finalDrArray: DamageReductionInstance[] = [...existingUserDrInstances];

    if (tempAggFeats.damageReductions) {
        tempAggFeats.damageReductions.forEach(drEffect => {
            if (drEffect.isActive) {
                const drValue = typeof drEffect.value === 'number' ? drEffect.value : 0;
                if (drValue > 0) {
                    finalDrArray.unshift({
                        id: `granted-dr-${drEffect.sourceFeat?.toString().toLowerCase().replace(/\s+/g, '-')}-${crypto.randomUUID().substring(0,4)}`,
                        value: drValue,
                        type: drEffect.drType,
                        rule: 'bypassed-by-type', // Assuming default rule for feat-granted DR
                        isGranted: true,
                        source: drEffect.sourceFeat || 'Granted Feat'
                    });
                }
            }
        });
    }
    const uniqueDrMap = new Map<string, DamageReductionInstance>();
    finalDrArray.forEach(dr => {
        const key = `${dr.source}-${dr.value}-${dr.type}-${dr.rule}`;
        if (!uniqueDrMap.has(key) || dr.isGranted) { // Always keep granted, overwrite user if same key as granted
            uniqueDrMap.set(key, dr);
        }
    });
    initialCharData.damageReduction = Array.from(uniqueDrMap.values());

    setCharacter(initialCharData);

  }, [
    isClient, translationsLoading, translations, globalCustomFeatDefinitionsFromStore,
    globalCustomSkillDefinitionsFromStore, allAvailableFeatDefinitions, // allItemDefinitions removed from direct dependency, indirectly via translations
    allAvailableSkillDefinitionsForDisplay, globalCustomSkillDefinitions
  ]);


  const [ageEffectsDetails, setAgeEffectsDetails] = React.useState<CharacterFormCoreInfoSectionProps['ageEffectsDetails']>(null);
  const [raceSpecialQualities, setRaceSpecialQualities] = React.useState<CharacterFormCoreInfoSectionProps['raceSpecialQualities']>(null);
  const [activeInfoDialogType, setActiveInfoDialogType] = React.useState<InfoDialogContentType | null>(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = React.useState(false);

  const [aggregatedFeatEffects, setAggregatedFeatEffects] = React.useState<AggregatedFeatEffects | null>(null);
  const [detailedAbilityScores, setDetailedAbilityScores] = React.useState<DetailedAbilityScores | null>(null);

  const [isAddOrEditSkillDialogOpen, setIsAddOrEditSkillDialogOpen] = React.useState(false);
  const [skillToEdit, setSkillToEdit] = React.useState<CustomSkillDefinition | undefined>(undefined);
  const [isCustomFeatDialogOpen, setIsCustomFeatDialogOpen] = React.useState(false);
  const [editingCustomFeatDefinition, setEditingCustomFeatDefinition] = React.useState<(FeatDefinitionJsonData & { isCustom: true }) | undefined>(undefined);

  const [isRollAbilityDialogOpen, setIsRollAbilityDialogOpen] = React.useState(false);
  const [rollDialogProps, setRollDialogProps] = React.useState<Omit<RollDialogProps, 'isOpen' | 'onOpenChange' | 'onRoll'> | null>(null);


  const router = useRouter();
  const { toast } = useToast();

  const characterLevelFromXP = React.useMemo(() => {
    if (!character || !translations) return 1;
    return calculateLevelFromXp(
      character.experiencePoints || 0,
      translations.XP_TABLE,
      translations.EPIC_LEVEL_XP_INCREASE
    );
  }, [character?.experiencePoints, translations]);


  React.useEffect(() => {
    if (character && translations && allAvailableFeatDefinitions.length > 0 && translations.UI_STRINGS && translations.UI_STRINGS.currentLangCodeForNotesFallback && allItemDefinitions.length > 0) {
      const aggFeatsAndItems = calculateFeatEffects(character, allAvailableFeatDefinitions, translations);
      setAggregatedFeatEffects(aggFeatsAndItems);

      const detailedScores = calculateDetailedAbilityScores(
        character,
        aggFeatsAndItems,
        translations.DND_RACES,
        translations.DND_RACE_ABILITY_MODIFIERS_DATA,
        translations.DND_RACE_BASE_MAX_AGE_DATA,
        translations.RACE_TO_AGING_CATEGORY_MAP_DATA,
        translations.DND_RACE_AGING_EFFECTS_DATA,
        translations.ABILITY_LABELS
      );
      setDetailedAbilityScores(detailedScores);

      const conMod = detailedScores ? calculateAbilityModifier(detailedScores.constitution.finalScore) : 0;
      const featHpBonus = aggFeatsAndItems.hpBonus || 0;
      const newMaxHp = (character.baseMaxHp || 0) + conMod + (character.customMaxHpModifier || 0) + featHpBonus;

      const existingUserDrInstances = character.damageReduction?.filter(dr => !dr.isGranted) || [];
      let finalDrArray: DamageReductionInstance[] = [...existingUserDrInstances];

      if (aggFeatsAndItems.damageReductions) {
          aggFeatsAndItems.damageReductions.forEach(drEffect => {
              if (drEffect.isActive) {
                  const drValue = typeof drEffect.value === 'number' ? drEffect.value : 0;
                  if (drValue > 0) {
                      finalDrArray.unshift({
                          id: `granted-dr-${drEffect.sourceFeat?.toString().toLowerCase().replace(/\s+/g, '-')}-${crypto.randomUUID().substring(0,4)}`,
                          value: drValue,
                          type: drEffect.drType,
                          rule: 'bypassed-by-type',
                          isGranted: true,
                          source: drEffect.sourceFeat || 'Granted Feat/Item'
                      });
                  }
              }
          });
      }
      const uniqueDrMap = new Map<string, DamageReductionInstance>();
      finalDrArray.forEach(dr => {
          const key = `${dr.source}-${dr.value}-${dr.type}-${dr.rule}`;
          if (!uniqueDrMap.has(key) || dr.isGranted) {
              uniqueDrMap.set(key, dr);
          }
      });
      const trulyFinalDrArray = Array.from(uniqueDrMap.values());

      if(character.maxHp !== newMaxHp || character.hp > newMaxHp || JSON.stringify(character.damageReduction) !== JSON.stringify(trulyFinalDrArray)) {
        setCharacter(prev => {
          if (!prev) return null;
          const currentHp = prev.hp > newMaxHp ? newMaxHp : prev.hp;
          if (prev.maxHp === newMaxHp && prev.hp === currentHp && JSON.stringify(prev.damageReduction) === JSON.stringify(trulyFinalDrArray)) return prev;
          return {...prev, maxHp: newMaxHp, hp: currentHp, damageReduction: trulyFinalDrArray };
        });
      }
    }
  }, [character, translations, allAvailableFeatDefinitions, allItemDefinitions]);


  const actualAbilityScoresForSavesAndSkills = React.useMemo(() => {
    if (!character || !detailedAbilityScores) {
      if (!character) return ABILITY_ORDER_INTERNAL.reduce((acc, key) => { acc[key] = 0; return acc; }, {} as AbilityScores);
      const scoresWithTemp: Partial<AbilityScores> = {};
      for (const ability of abilityNames) {
        if (ability === 'none') continue;
        scoresWithTemp[ability] = (character.abilityScores[ability] || 0) + (character.abilityScoreTempCustomModifiers?.[ability] || 0);
      }
      return scoresWithTemp as AbilityScores;
    }
    const finalScores: Partial<AbilityScores> = {};
    for (const ability of abilityNames) {
      if (ability === 'none') continue;
      finalScores[ability] = detailedAbilityScores[ability].finalScore;
    }
    return finalScores as AbilityScores;
  }, [detailedAbilityScores, character]);

  React.useEffect(() => {
    if (character && character.race && character.age > 0 && translations && translations.ABILITY_LABELS.length > 0) {
      const details = getNetAgingEffects(
        character.race as DndRaceId,
        character.age,
        translations.DND_RACE_BASE_MAX_AGE_DATA,
        translations.RACE_TO_AGING_CATEGORY_MAP_DATA,
        translations.DND_RACE_AGING_EFFECTS_DATA,
        translations.ABILITY_LABELS
      );
      setAgeEffectsDetails(details);
    } else {
      setAgeEffectsDetails(null);
    }
  }, [character?.race, character?.age, translations]);

  React.useEffect(() => {
    if (character && character.race && translations && allAvailableFeatDefinitions.length > 0 && allAvailableSkillDefinitionsForDisplay.length > 0 && translations.ABILITY_LABELS.length > 0) {
      const details = getRaceSpecialQualities(
        character.race as DndRaceId,
        translations.DND_RACES,
        translations.DND_RACE_ABILITY_MODIFIERS_DATA,
        allAvailableSkillDefinitionsForDisplay.map(sdd => ({id: sdd.id, label: sdd.label, keyAbility: sdd.keyAbility})),
        allAvailableFeatDefinitions,
        translations.ABILITY_LABELS
      );
      setRaceSpecialQualities(details);
    } else {
      setRaceSpecialQualities(null);
    }
  }, [character?.race, translations, allAvailableFeatDefinitions, allAvailableSkillDefinitionsForDisplay]);


  const currentMinAgeForInput = React.useMemo(() => {
    if (!character || !character.race || !translations || translationsLoading) return 1;
    const selectedRaceInfo = translations.DND_RACES.find(r => r.id === character.race);
    if (selectedRaceInfo) {
      const raceKey = selectedRaceInfo.id as DndRaceId;
      return translations.DND_RACE_MIN_ADULT_AGE_DATA[raceKey] || 1;
    }
    return 1;
  }, [character?.race, translations, translationsLoading]);

  React.useEffect(() => {
    if (character && character.race && translations) {
      const selectedRaceInfo = translations.DND_RACES.find(r => r.id === character.race);
      if (selectedRaceInfo) {
        const raceKey = selectedRaceInfo.id as DndRaceId;
        const minAdultAge = translations.DND_RACE_MIN_ADULT_AGE_DATA[raceKey];
        if (minAdultAge !== undefined && character.age < minAdultAge) {
          setCharacter(prev => prev ? ({ ...prev, age: minAdultAge }) : null);
        }
        const newSizeModifierAttack = getSizeModifierAttack(character.size, translations.SIZES);
        if (character.sizeModifierAttack !== newSizeModifierAttack) {
            setCharacter(prev => prev ? ({...prev, sizeModifierAttack: newSizeModifierAttack}) : null);
        }
      }
    }
  }, [character?.race, character?.age, character?.size, translations]);


  const handleCoreInfoFieldChange = React.useCallback((
    field: keyof Character,
    value: any
  ) => {
     setCharacter(prev => {
        if (!prev) return null;
        let updatedChar = { ...prev, [field as keyof Character]: value };
        if (field === 'size' && translations) {
            const newSizeModifierAttack = getSizeModifierAttack(value as CharacterSize, translations.SIZES);
            updatedChar = {...updatedChar, sizeModifierAttack: newSizeModifierAttack };
        }
        // If the class changed, we need to re-evaluate granted feats and skills
        if (field === 'classes' || field === 'experiencePoints' || field === 'race' || field === 'classSpecificChoices') {
          if (translations) {
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
            
            if(field === 'classes' && updatedChar.classes[0]?.className) {
                const newSkills = allAvailableSkillDefinitionsForDisplay.map(skillDef => {
                    const existingInstance = updatedChar.skills.find(s => s.id === skillDef.id);
                    const isNowClassSkill = updatedChar.classes[0]?.className ?
                        (translations.CLASS_SKILLS[updatedChar.classes[0].className as keyof typeof translations.CLASS_SKILLS] || []).includes(skillDef.id)
                        : false;
                    return {
                        id: skillDef.id,
                        ranks: existingInstance?.ranks || 0,
                        miscModifier: existingInstance?.miscModifier || 0,
                        isClassSkill: isNowClassSkill
                    };
                }).sort((a, b) => {
                    const nameA = allAvailableSkillDefinitionsForDisplay.find(d => d.id === a.id)?.label || '';
                    const nameB = allAvailableSkillDefinitionsForDisplay.find(d => d.id === b.id)?.label || '';
                    return nameA.localeCompare(nameB);
                });
                updatedChar.skills = newSkills;
            }
          }
        }
        return updatedChar;
     });
  }, [translations, allAvailableFeatDefinitions, allAvailableSkillDefinitionsForDisplay]);

  const handleHealthFieldChange = React.useCallback((field: keyof Pick<Character, 'hp' | 'baseMaxHp' | 'customMaxHpModifier' | 'nonlethalDamage' | 'temporaryHp' | 'numberOfWounds'>, value: number) => {
    setCharacter(prev => prev ? ({ ...prev, [field]: value }) : null);
  }, []);


  const handleCharacterFieldUpdate = React.useCallback((
    field: keyof Character | `${SpeedType}Speed.miscModifier` | `armorSpeedPenalty_miscModifier` | `loadSpeedPenalty_miscModifier` | `babMiscModifier` | `powerAttackValue` | `combatExpertiseValue` | `initiativeMiscModifier` | `grappleMiscModifier` | `grappleDamage_bonus` | `grappleWeaponChoice`,
    value: any
  ) => {
     setCharacter(prev => {
        if (!prev) return null;
        if (typeof field === 'string' && field.endsWith('Speed.miscModifier')) {
            const speedType = field.split('Speed.miscModifier')[0] as SpeedType;
            const speedFieldKey = `${speedType}Speed` as keyof Pick<Character, 'landSpeed' | 'burrowSpeed' | 'climbSpeed' | 'flySpeed' | 'swimSpeed'>;
            return {
                ...prev,
                [speedFieldKey]: {
                    ...(prev[speedFieldKey] as SpeedDetails),
                    miscModifier: value,
                }
            };
        } else if (['armorSpeedPenalty_miscModifier', 'loadSpeedPenalty_miscModifier', 'babMiscModifier', 'powerAttackValue', 'combatExpertiseValue', 'initiativeMiscModifier', 'grappleMiscModifier', 'grappleDamage_bonus', 'grappleWeaponChoice'].includes(field as string)) {
          return { ...prev, [field as string]: value };
        }
        return { ...prev, [field as keyof Character]: value };
     });
  }, []);

  const handleResistanceChange = React.useCallback((
    field: ResistanceFieldKeySheet,
    subField: 'customMod',
    value: number
  ) => {
    setCharacter(prev => prev ? ({
      ...prev,
      [field]: {
        ...(prev[field] as ResistanceValue),
        [subField]: value,
      },
    }) : null);
  }, []);

  const handleDamageReductionChange = React.useCallback((newDrArray: DamageReductionInstance[]) => {
    setCharacter(prev => prev ? ({ ...prev, damageReduction: newDrArray }) : null);
  }, []);

  const handleBaseAbilityScoreChange = React.useCallback((ability: Exclude<AbilityName, 'none'>, value: number) => {
    setCharacter(prev => prev ? ({
      ...prev,
      abilityScores: {
        ...prev.abilityScores,
        [ability]: value,
      },
    }) : null);
  }, []);

  const handleAbilityScoreTempCustomModifierChange = React.useCallback((ability: Exclude<AbilityName, 'none'>, value: number) => {
    setCharacter(prev => prev ? ({
      ...prev,
      abilityScoreTempCustomModifiers: {
        ...prev.abilityScoreTempCustomModifiers,
        [ability]: value,
      },
    }) : null);
  }, []);

  const handleMultipleBaseAbilityScoresChange = React.useCallback((newScores: AbilityScores) => {
    setCharacter(prev => prev ? ({ ...prev, abilityScores: newScores }) : null);
  }, []);

  const handleClassChange = React.useCallback((value: DndClassId | string) => {
    if (!translations || !translations.UI_STRINGS) {
        throw new Error("Translations not loaded in handleClassChange");
    }
    setCharacter(prev => {
      if (!prev) return null;
      const updatedClasses = [{ ...prev.classes[0], id: prev.classes[0]?.id || crypto.randomUUID(), className: value, level: 1 }];
      const characterWithNewClass = { ...prev, classes: updatedClasses, classSpecificChoices: [] }; // Reset classSpecificChoices on class change

      const newSkills = allAvailableSkillDefinitionsForDisplay.map(skillDef => {
          const existingInstance = prev.skills.find(s => s.id === skillDef.id);
          const isNowClassSkill = value ?
            (translations.CLASS_SKILLS[value as keyof typeof translations.CLASS_SKILLS] || []).includes(skillDef.id)
            : false;
          return {
            id: skillDef.id,
            ranks: existingInstance?.ranks || 0,
            miscModifier: existingInstance?.miscModifier || 0,
            isClassSkill: isNowClassSkill
          };
      }).sort((a, b) => {
        const nameA = allAvailableSkillDefinitionsForDisplay.find(d => d.id === a.id)?.label || '';
        const nameB = allAvailableSkillDefinitionsForDisplay.find(d => d.id === b.id)?.label || '';
        return nameA.localeCompare(nameB);
      });

      const newGrantedFeats = getGrantedFeatsForCharacter(
        characterWithNewClass,
        allAvailableFeatDefinitions, translations.DND_RACES, translations.DND_CLASSES,
        translations.DND_DOMAINS, translations.DND_DEITIES, translations.XP_TABLE, translations.EPIC_LEVEL_XP_INCREASE, translations.UI_STRINGS
      );
      const userChosenFeats = prev.feats.filter(fi => !fi.isGranted);

      const combinedFeatsMap = new Map<string, CharacterFeatInstance>();
      newGrantedFeats.forEach(inst => combinedFeatsMap.set(inst.instanceId, inst));
      userChosenFeats.forEach(inst => {
        const def = allAvailableFeatDefinitions.find(d => d.id === inst.definitionId);
        if (!newGrantedFeats.some(gf => gf.definitionId === inst.definitionId && !def?.canTakeMultipleTimes)) {
            combinedFeatsMap.set(inst.instanceId, inst);
        }
      });
      const updatedFeats = Array.from(combinedFeatsMap.values()).sort((a,b) => (allAvailableFeatDefinitions.find(d=>d.id===a.definitionId)?.label||'').localeCompare(allAvailableFeatDefinitions.find(d=>d.id===b.definitionId)?.label||''));

      return { ...characterWithNewClass, skills: newSkills, feats: updatedFeats };
    });
  }, [translations, allAvailableSkillDefinitionsForDisplay, allAvailableFeatDefinitions]);

  const handleSkillChange = React.useCallback((skillId: string, ranks: number, isClassSkill?: boolean) => {
    setCharacter(prev => prev ? ({
      ...prev,
      skills: prev.skills.map(s =>
        s.id === skillId ? { ...s, ranks, isClassSkill: isClassSkill !== undefined ? isClassSkill : s.isClassSkill } : s
      ),
    }) : null);
  }, []);

  const handleCustomSkillDefinitionSaveToStore = React.useCallback((skillData: CustomSkillDefinition) => {
    if(!translations || !translations.UI_STRINGS) throw new Error("Translations not loaded for skill save");
    const existing = definitionsActions.getCustomSkillDefinitionById(skillData.id);
    if(existing) {
        definitionsActions.updateCustomSkillDefinition(skillData);
        toast({ title: translations.UI_STRINGS.toastCustomSkillUpdatedTitle, description: translations.UI_STRINGS.toastCustomSkillUpdatedDesc.replace("{skillName}", skillData.name) });
    } else {
        definitionsActions.addCustomSkillDefinition(skillData);
        toast({ title: translations.UI_STRINGS.toastCustomSkillAddedTitle, description: translations.UI_STRINGS.toastCustomSkillAddedDesc.replace("{skillName}", skillData.name) });
    }
    setIsAddOrEditSkillDialogOpen(false);
    setSkillToEdit(undefined);
  }, [definitionsActions, toast, translations]);

  const handleOpenEditCustomSkillDialog = React.useCallback((skillDefId: string) => {
    if(!translations || !translations.UI_STRINGS) throw new Error("Translations not loaded for custom skill edit");
    const customDef = definitionsActions.getCustomSkillDefinitionById(skillDefId);
    if (customDef) {
      setSkillToEdit(customDef);
      setIsAddOrEditSkillDialogOpen(true);
    } else {
      toast({ title: translations.UI_STRINGS.toastCustomSkillNotFoundEditTitle, description: translations.UI_STRINGS.toastCustomSkillNotFoundEditDesc, variant: "destructive" });
    }
  }, [definitionsActions, toast, translations]);

  const handleFeatInstancesChange = React.useCallback((updatedFeatInstances: CharacterFeatInstance[]) => {
     setCharacter(prev => {
        if (!prev || !translations || !translations.UI_STRINGS) throw new Error("Character or translations not loaded for feat instance change");
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

  const handleCustomFeatDefinitionSaveToStore = React.useCallback((featDefData: (FeatDefinitionJsonData & { isCustom: true })) => {
    if (!character || !translations || !translations.UI_STRINGS) throw new Error("Character or translations not loaded for custom feat save");
    const existing = definitionsActions.getCustomFeatDefinitionById(featDefData.id);
    if (existing) {
        definitionsActions.updateCustomFeatDefinition(featDefData);
        toast({ title: translations.UI_STRINGS.toastCustomFeatUpdatedTitle, description: translations.UI_STRINGS.toastCustomFeatUpdatedDesc.replace("{featLabel}", featDefData.label) });

    } else {
        definitionsActions.addCustomFeatDefinition(featDefData);
        toast({ title: translations.UI_STRINGS.toastCustomFeatAddedTitle, description: translations.UI_STRINGS.toastCustomFeatAddedDesc.replace("{featLabel}", featDefData.label) });
    }
    const oldDefinition = allAvailableFeatDefinitions.find(d => d.id === featDefData.id && d.isCustom);
    if (oldDefinition?.canTakeMultipleTimes && !featDefData.canTakeMultipleTimes) {
      const instancesOfThisFeat = character.feats.filter(inst => inst.definitionId === featDefData.id && !inst.isGranted);
      if (instancesOfThisFeat.length > 1) {
        const firstInstance = instancesOfThisFeat[0];
        const newChosenInstances = character.feats.filter(
          inst => inst.isGranted || inst.definitionId !== featDefData.id || inst.instanceId === firstInstance.instanceId
        );
        handleFeatInstancesChange(newChosenInstances);
      }
    }
    setEditingCustomFeatDefinition(undefined);
    setIsCustomFeatDialogOpen(false);
  }, [character, definitionsActions, allAvailableFeatDefinitions, handleFeatInstancesChange, translations, toast]);

  const handleOpenEditCustomFeatDefinitionDialog = React.useCallback((definitionId: string) => {
    if(!translations || !translations.UI_STRINGS) throw new Error("Translations not loaded for custom feat edit dialog");
    const defToEdit = definitionsActions.getCustomFeatDefinitionById(definitionId);
    if (defToEdit) {
      setEditingCustomFeatDefinition(defToEdit);
      setIsCustomFeatDialogOpen(true);
    } else {
      toast({ title: translations.UI_STRINGS.toastCustomFeatNotFoundEditTitle, description: translations.UI_STRINGS.toastCustomFeatNotFoundEditDesc, variant: "destructive" });
    }
  }, [definitionsActions, toast, translations]);

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

  const handleSavingThrowTemporaryModChange = React.useCallback((saveType: SavingThrowType, value: number) => {
    setCharacter(prev => prev ? ({
      ...prev,
      savingThrows: {
        ...prev.savingThrows,
        [saveType]: {
          ...prev.savingThrows[saveType],
          miscMod: value,
        },
      },
    }) : null);
  }, []);

  const handleLanguagesChange = React.useCallback((updatedLanguages: LanguageId[]) => {
    setCharacter(prev => prev ? ({ ...prev, languages: updatedLanguages }) : null);
  }, []);

  const handleConditionToggle = React.useCallback((conditionKey: string, isActive: boolean) => {
    setCharacter(prevCharacter => {
      if (!prevCharacter) return null;
      return {
        ...prevCharacter,
        feats: prevCharacter.feats.map(featInstance => {
          const definition = allAvailableFeatDefinitions.find(def => def.id === featInstance.definitionId);
          if (definition && !definition.permanentEffect) {
            const hasThisConditionInEffects = definition.effects?.some(eff => eff.condition === conditionKey);
            if (hasThisConditionInEffects) {
              const newStates = { ...(featInstance.conditionalEffectStates || {}) };
              newStates[conditionKey] = isActive;
              return { ...featInstance, conditionalEffectStates: newStates };
            }
          }
          return featInstance;
        }),
      };
    });
  }, [allAvailableFeatDefinitions]);


  const handleCancel = React.useCallback(() => { router.push('/'); }, [router]);

  const openInfoDialog = React.useCallback((newContentType: InfoDialogContentType) => {
    setActiveInfoDialogType(newContentType);
    setIsInfoDialogOpen(true);
  }, []);

  const handleOpenRollDialog = React.useCallback((data: Omit<RollDialogProps, 'isOpen' | 'onOpenChange' | 'onRoll'>) => {
    setRollDialogProps(data);
    setIsRollAbilityDialogOpen(true);
  }, []);

  const handleRollResult = React.useCallback((diceResult: number, totalBonus: number, finalResult: number, weaponDamageDiceString?: string) => {
  }, []);


  const handleOpenRaceInfoDialog = React.useCallback(() => { if (character?.race) { openInfoDialog({ type: 'race' }); } }, [character?.race, openInfoDialog]);
  const handleOpenClassInfoDialog = React.useCallback(() => { if (character?.classes[0]?.className) { openInfoDialog({ type: 'class' }); } }, [character?.classes, openInfoDialog]);
  const handleOpenAlignmentInfoDialog = React.useCallback(() => openInfoDialog({ type: 'alignmentSummary' }), [openInfoDialog]);
  const handleOpenDeityInfoDialog = React.useCallback(() => openInfoDialog({ type: 'deity' }), [openInfoDialog]);

  const handleOpenAbilityCheckRollDialog = React.useCallback((ability: Exclude<AbilityName, 'none'>) => {
    if (!detailedAbilityScores || !translations) throw new Error("Detailed scores or translations not loaded for ability check roll");
    const abilityLabelInfo = translations.ABILITY_LABELS.find(al => al.id === ability);
    const abilityName = abilityLabelInfo?.label || ability;
    const finalModifier = calculateAbilityModifier(detailedAbilityScores[ability].finalScore);
    const breakdown: GenericBreakdownItem[] = [
      { label: translations.UI_STRINGS.abilityScoreLabel || "Ability Score", value: detailedAbilityScores[ability].finalScore, isRawValue: true },
      { label: translations.UI_STRINGS.abilityModifierLabel || "Modifier", value: finalModifier, isBold: true }
    ];
    setRollDialogProps({
      dialogTitle: (translations.UI_STRINGS.rollDialogTitleAbilityCheck || "{abilityName} Check").replace("{abilityName}", abilityName),
      rollType: `ability_check_${ability}`,
      baseModifier: finalModifier,
      calculationBreakdown: breakdown,
      rerollTwentiesForChecks: rollDialogProps?.rerollTwentiesForChecks,
    });
    setIsRollAbilityDialogOpen(true);
  }, [detailedAbilityScores, translations, rollDialogProps?.rerollTwentiesForChecks]);

  const handleOpenAbilityScoreBreakdownDialog = React.useCallback((ability: Exclude<AbilityName, 'none'>) => { openInfoDialog({ type: 'abilityScoreBreakdown', abilityName: ability }); }, [openInfoDialog]);
  const handleOpenCombatStatInfoDialog = React.useCallback((contentType: InfoDialogContentType) => { openInfoDialog(contentType); }, [openInfoDialog]);
  const handleOpenSkillInfoDialog = React.useCallback((skillId: string) => { openInfoDialog({ type: 'skillModifierBreakdown', skillId }); }, [openInfoDialog]);
  const handleOpenAcBreakdownDialog = React.useCallback((contentType: InfoDialogContentType) => {
    openInfoDialog(contentType);
  }, [openInfoDialog]);
  const handleOpenSpeedInfoDialog = React.useCallback((speedType: SpeedType) => { openInfoDialog({ type: 'speedBreakdown', speedType }); }, [openInfoDialog]);
  const handleOpenArmorSpeedPenaltyInfoDialog = React.useCallback(() => openInfoDialog({ type: 'armorSpeedPenaltyBreakdown' }), [openInfoDialog]);
  const handleOpenLoadSpeedPenaltyInfoDialog = React.useCallback(() => openInfoDialog({ type: 'loadSpeedPenaltyBreakdown' }), [openInfoDialog]);

  const handleOpenSavingThrowInfoDialog = React.useCallback((contentType: InfoDialogContentType) => {
    openInfoDialog(contentType);
  }, [openInfoDialog]);

  const handleOpenHealthInfoDialog = React.useCallback((contentType: InfoDialogContentType) => {
    openInfoDialog(contentType);
  }, [openInfoDialog]);

  const handleOpenResistanceInfoDialog = React.useCallback((resistanceField: ResistanceFieldKeySheet) => {
    openInfoDialog({ type: 'resistanceBreakdown', resistanceField });
  }, [openInfoDialog]);


  const handleSubmit = React.useCallback((e: FormEvent) => {
    e.preventDefault();
    if (!character || !translations || !translations.UI_STRINGS) {
      throw new Error(translations?.UI_STRINGS.toastCharacterDataNotLoadedDesc || "Character data not loaded. Cannot save.");
    }
    const UI_STRINGS = translations.UI_STRINGS;
    if (!character.name || character.name.trim() === '') { toast({ title: UI_STRINGS.toastMissingCharacterNameTitle, description: UI_STRINGS.toastMissingCharacterNameDesc, variant: "destructive" }); return; }
    if (!character.race || character.race.trim() === '') { toast({ title: UI_STRINGS.toastMissingCharacterRaceTitle, description: UI_STRINGS.toastMissingCharacterRaceDesc, variant: "destructive" }); return; }
    if (!character.classes[0]?.className || character.classes[0]?.className.trim() === '') { toast({ title: UI_STRINGS.toastMissingCharacterClassTitle, description: UI_STRINGS.toastMissingCharacterClassDesc, variant: "destructive" }); return; }
    if (!character.alignment) { toast({ title: UI_STRINGS.toastMissingAlignmentTitle, description: UI_STRINGS.toastMissingAlignmentDesc, variant: "destructive" }); return; }

    const selectedRaceInfoForValidation = translations.DND_RACES.find(r => r.id === character.race);
    const minAgeForValidation = (selectedRaceInfoForValidation ? translations.DND_RACE_MIN_ADULT_AGE_DATA[selectedRaceInfoForValidation.id as DndRaceId] : undefined) || 1;
    if (character.age < minAgeForValidation) {
      toast({
        title: UI_STRINGS.toastInvalidAgeTitle,
        description: UI_STRINGS.toastInvalidAgeDesc
          .replace('{minAge}', String(minAgeForValidation))
          .replace('{raceContext}', selectedRaceInfoForValidation ? ` for a ${selectedRaceInfoForValidation.label}` : ''),
        variant: "destructive"
      });
      return;
    }

    for (const ability of abilityNames) {
      if (ability === 'none') continue;
      if (character.abilityScores[ability] <= 0) {
        const abilityLabelForError = translations.ABILITY_LABELS.find(al => al.id === ability)?.label || ability;
        toast({
          title: UI_STRINGS.toastInvalidAbilityScoreTitle.replace('{abilityName}', abilityLabelForError),
          description: UI_STRINGS.toastInvalidAbilityScoreDesc.replace('{abilityName}', abilityLabelForError),
          variant: "destructive"
        });
        return;
      }
    }
    const finalCharacterData = { ...character };
    onSave(finalCharacterData);
  }, [character, onSave, toast, translations]);

  const calculatedMaxHpForPanel = React.useMemo(() => {
    if (!character || !detailedAbilityScores || !aggregatedFeatEffects) return 0;
    const conMod = calculateAbilityModifier(detailedAbilityScores.constitution.finalScore);
    const featHpBonus = aggregatedFeatEffects.hpBonus || 0;
    return (character.baseMaxHp || 0) + conMod + (character.customMaxHpModifier || 0) + featHpBonus;
  }, [character?.baseMaxHp, character?.customMaxHpModifier, detailedAbilityScores, aggregatedFeatEffects]);

  const finalConstitutionModifierForPanel = React.useMemo(() => {
    if (!detailedAbilityScores) return 0;
    return calculateAbilityModifier(detailedAbilityScores.constitution.finalScore);
  }, [detailedAbilityScores]);

  const calculatedMiscMaxHpBonusForPanel = React.useMemo(() => {
    return aggregatedFeatEffects?.hpBonus || 0;
  }, [aggregatedFeatEffects]);


  const coreInfoData = React.useMemo<CharacterFormCoreInfoSectionProps['characterData'] | undefined>(() => {
    if (!character) return undefined;
    return {
      name: character.name, playerName: character.playerName, race: character.race, alignment: character.alignment,
      deity: character.deity, size: character.size, age: character.age, gender: character.gender, classes: character.classes,
      classSpecificChoices: character.classSpecificChoices, // Changed from chosen...
    };
  }, [character]);

  const abilityScoresData = React.useMemo<CharacterFormAbilityScoresSectionProps['abilityScoresData'] | undefined>(() => {
    if (!character) return undefined;
    return {
      abilityScores: character.abilityScores, abilityScoreTempCustomModifiers: character.abilityScoreTempCustomModifiers,
    };
  }, [character]);

  const healthPanelData = React.useMemo<HealthPanelProps['healthData'] | undefined>(() => {
    if (!character) return undefined;
    return {
      hp: character.hp,
      baseMaxHp: character.baseMaxHp,
      customMaxHpModifier: character.customMaxHpModifier,
      nonlethalDamage: character.nonlethalDamage,
      temporaryHp: character.temporaryHp,
      numberOfWounds: character.numberOfWounds,
      abilityScores: character.abilityScores,
    };
  }, [character]);

  const experiencePanelData = React.useMemo<ExperiencePanelData | undefined>(() => {
    if (!character) return undefined;
    return {
      currentXp: character.experiencePoints || 0,
      currentLevel: characterLevelFromXP,
    };
  }, [character?.experiencePoints, characterLevelFromXP]);

  const storyAndAppearanceData = React.useMemo<CharacterFormStoryPortraitSectionProps['storyAndAppearanceData'] | undefined>(() => {
    if (!character) return undefined;
    return {
      campaign: character.campaign, personalStory: character.personalStory, portraitDataUrl: character.portraitDataUrl,
      height: character.height, weight: character.weight, eyes: character.eyes, hair: character.hair, skin: character.skin,
      homeland: character.homeland,
    };
  }, [character]);

  const skillsData = React.useMemo<Omit<SkillsFormSectionProps, 'characterLevel' | 'onSkillChange' | 'onEditCustomSkillDefinition' | 'onOpenSkillInfoDialog' | 'onOpenRollDialog' | 'allFeatDefinitions' | 'allPredefinedSkillDefinitions' | 'allCustomSkillDefinitions' | 'actualAbilityScores' | 'aggregatedFeatEffects'>['skillsData'] | undefined>(() => {
    if (!character) return undefined;
    return {
      skills: character.skills, classes: character.classes, race: character.race, size: character.size, feats: character.feats,
    };
  }, [character]);


  const featSectionData = React.useMemo<Omit<FeatsFormSectionProps, 'characterLevel' | 'allAvailableFeatDefinitions' | 'chosenFeatInstances' | 'onFeatInstancesChange' | 'onEditCustomFeatDefinition' | 'abilityScores' | 'skills' | 'allPredefinedSkillDefinitions' | 'allCustomSkillDefinitions' | 'allSkillOptionsForDialog' | 'allMagicSchoolOptionsForDialog' | 'aggregatedFeatEffects'>['featSectionData'] | undefined>(() => {
    if (!character) return undefined;
    return {
      race: character.race, classes: character.classes, feats: character.feats, age: character.age, alignment: character.alignment, experiencePoints: character.experiencePoints,
      classSpecificChoices: character.classSpecificChoices, // Changed from chosen...
      deity: character.deity,
    };
  }, [character]);

  const savingThrowsData = React.useMemo<SavingThrowsPanelProps['savingThrowsData'] | undefined>(() => {
    if(!character) return undefined;
    return { savingThrows: character.savingThrows, classes: character.classes, feats: character.feats };
  }, [character]);

  const speedData = React.useMemo<SpeedPanelProps['speedData'] | undefined>(() => {
    if(!character) return undefined;
    return {
      race: character.race, size: character.size, classes: character.classes, landSpeed: character.landSpeed, burrowSpeed: character.burrowSpeed,
      climbSpeed: character.climbSpeed, flySpeed: character.flySpeed, swimSpeed: character.swimSpeed,
      armorSpeedPenalty_base: character.armorSpeedPenalty_base, armorSpeedPenalty_miscModifier: character.armorSpeedPenalty_miscModifier,
      loadSpeedPenalty_base: character.loadSpeedPenalty_base, loadSpeedPenalty_miscModifier: character.loadSpeedPenalty_miscModifier,
      feats: character.feats,
    };
  }, [character]);

  const combatDataForPanel = React.useMemo<CombatPanelCharacterData | undefined>(() => {
    if(!character) return undefined;
    return {
        abilityScores: character.abilityScores,
        classes: character.classes,
        size: character.size,
        inventory: character.inventory,
        equippedGear: character.equippedGear, // Added equippedGear
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
  }, [character]);


  const resistancesData = React.useMemo<ResistancesPanelProps['characterData'] | undefined>(() => {
    if(!character) return undefined;
    return {
      fireResistance: character.fireResistance, coldResistance: character.coldResistance, acidResistance: character.acidResistance,
      electricityResistance: character.electricityResistance, sonicResistance: character.sonicResistance,
      spellResistance: character.spellResistance, powerResistance: character.powerResistance,
      damageReduction: character.damageReduction, fortification: character.fortification,
    };
  }, [character]);

  const languagesPanelData = React.useMemo<Omit<LanguagesPanelProps, 'onLanguagesChange'> | undefined>(() => {
    if (!character || !detailedAbilityScores) return undefined;
    return {
      characterLanguages: character.languages || [],
      characterRaceId: character.race,
      characterIntelligenceScore: detailedAbilityScores.intelligence.finalScore,
      speakLanguageSkillRanks: character.skills.find(s => s.id === 'speak-language')?.ranks || 0,
    };
  }, [character, detailedAbilityScores]);

  const conditionsPanelData = React.useMemo<Omit<ConditionsPanelProps, 'onConditionToggle' | 'aggregatedFeatEffects'> | undefined>(() => {
    if (!character || !allAvailableFeatDefinitions) return undefined;
    return {
        characterFeats: character.feats,
        allFeatDefinitions: allAvailableFeatDefinitions,
    };
  }, [character, allAvailableFeatDefinitions]);

  const getCompatibleItemsForSlot = React.useCallback((slot: GearSlot, allItems: ItemDefinition[]): ItemDefinition[] => {
    if (!translations) return [];
    if (!slot.tags || slot.tags.length === 0) {
      if (slot.id.includes('ring')) return allItems.filter(item => item.itemType === 'ring');
      if (slot.id === 'neck') return allItems.filter(item => item.itemType === 'amulet');
      return allItems.filter(item => item.itemType === 'wondrous' || item.itemType === 'other');
    }

    let itemTypesForSlot: ItemBaseType[] = [];
    if (slot.tags.includes('weapon')) itemTypesForSlot.push('weapon');
    if (slot.tags.includes('armor')) itemTypesForSlot.push('armor');
    if (slot.tags.includes('shield')) itemTypesForSlot.push('shield');
    if (slot.tags.includes('ring')) itemTypesForSlot.push('ring');
    if (slot.tags.includes('amulet')) itemTypesForSlot.push('amulet');
    if (slot.tags.includes('headwear')) itemTypesForSlot.push('headband');
    if (slot.tags.includes('cloak') || slot.tags.includes('cape')) itemTypesForSlot.push('cloak');
    if (slot.tags.includes('bracer')) itemTypesForSlot.push('bracers');
    if (slot.tags.includes('glove')) itemTypesForSlot.push('gloves');
    if (slot.tags.includes('belt')) itemTypesForSlot.push('belt');
    if (slot.tags.includes('footwear')) itemTypesForSlot.push('boots');

    if (itemTypesForSlot.length === 0 && slot.tags.some(t => ['jewelry', 'accessory', 'clothing', 'eyewear'].includes(t))) {
        itemTypesForSlot.push('wondrous', 'other');
    }
    if (itemTypesForSlot.length === 0 && !slot.tags.includes('container') && !slot.tags.includes('ammunition')) {
        itemTypesForSlot.push('wondrous', 'other');
    }

    return allItems.filter(item => item.itemType && itemTypesForSlot.includes(item.itemType));
  }, [translations]);

  const handleEquipItem = React.useCallback((slotId: GearSlotId, itemDefinitionId: ItemDefinitionId | '__NONE__') => {
    setCharacter(prevCharacter => {
      if (!prevCharacter || !translations) return null;
      const newCharacter = { ...prevCharacter };
      newCharacter.equippedGear = { ...(newCharacter.equippedGear || {}) };
      newCharacter.inventory = [...(newCharacter.inventory || [])];

      if (itemDefinitionId === '__NONE__') {
        newCharacter.equippedGear[slotId] = undefined;
        return newCharacter;
      }

      const itemDefToEquip = allItemDefinitions.find(def => def.definitionId === itemDefinitionId);
      if (!itemDefToEquip) return prevCharacter;

      let instanceToEquip = newCharacter.inventory.find(
        inst => inst.definitionId === itemDefinitionId &&
                !Object.values(newCharacter.equippedGear).includes(inst.instanceId)
      );

      if (!instanceToEquip) {
        instanceToEquip = {
          instanceId: crypto.randomUUID(),
          definitionId: itemDefinitionId,
          quantity: 1,
        };
        newCharacter.inventory.push(instanceToEquip);
      }

      newCharacter.equippedGear[slotId] = instanceToEquip.instanceId;

      const currentSlotDef = translations.GEAR_SLOTS.find(s => s.id === slotId);
      if (currentSlotDef?.mutuallyExclusiveWith) {
        currentSlotDef.mutuallyExclusiveWith.forEach(exclusiveSlotId => {
          if (newCharacter.equippedGear[exclusiveSlotId] && slotId !== exclusiveSlotId) {
            newCharacter.equippedGear[exclusiveSlotId] = undefined;
          }
        });
      }

      if (itemDefToEquip.itemType === 'weapon' && itemDefToEquip.isTwoHandedWeapon) {
          if (newCharacter.equippedGear['main-hand'] && slotId !== 'main-hand') newCharacter.equippedGear['main-hand'] = undefined;
          if (newCharacter.equippedGear['off-hand'] && slotId !== 'off-hand') newCharacter.equippedGear['off-hand'] = undefined;
          if (newCharacter.equippedGear['shield'] && slotId !== 'shield') newCharacter.equippedGear['shield'] = undefined;
      } else if (slotId === 'main-hand' || slotId === 'off-hand' || slotId === 'shield') {
          const twoHandSlotId = 'two-hand';
          const twoHandInstanceId = newCharacter.equippedGear[twoHandSlotId];
          if (twoHandInstanceId) {
               const twoHandItemInstance = newCharacter.inventory.find(i => i.instanceId === twoHandInstanceId);
               const twoHandItemDef = twoHandItemInstance ? allItemDefinitions.find(def => def.definitionId === twoHandItemInstance.definitionId) : undefined;
               if (twoHandItemDef?.itemType === 'weapon' && twoHandItemDef.isTwoHandedWeapon) {
                   newCharacter.equippedGear[twoHandSlotId] = undefined;
               }
          }
      }
      return newCharacter;
    });
  }, [allItemDefinitions, translations]);


  if (
    translationsLoading ||
    !character ||
    !translations ||
    !translations.UI_STRINGS ||
    !translations.UI_STRINGS.currentLangCodeForNotesFallback || // Explicit check for the property used
    !translations.DAMAGE_REDUCTION_TYPES ||
    !translations.DAMAGE_REDUCTION_RULES_OPTIONS ||
    !detailedAbilityScores ||
    !aggregatedFeatEffects ||
    !coreInfoData ||
    allItemDefinitions.length === 0
  ) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex justify-center items-center py-10 min-h-[50vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground text-lg">
            {translations?.UI_STRINGS.loadingCharacterDetailsTitle || "Loading Character Details..."}
          </p>
        </div>
      </div>
    );
  }
  const { UI_STRINGS } = translations;


  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        {coreInfoData && (
          <CharacterFormCoreInfoSection
            characterData={coreInfoData}
            onFieldChange={handleCoreInfoFieldChange}
            onClassChange={handleClassChange}
            ageEffectsDetails={ageEffectsDetails}
            raceSpecialQualities={raceSpecialQualities}
            currentMinAgeForInput={currentMinAgeForInput}
            onOpenRaceInfoDialog={handleOpenRaceInfoDialog}
            onOpenClassInfoDialog={handleOpenClassInfoDialog}
            onOpenAlignmentInfoDialog={handleOpenAlignmentInfoDialog}
            onOpenDeityInfoDialog={handleOpenDeityInfoDialog}
            aggregatedFeatEffects={aggregatedFeatEffects}
          />
        )}

        {abilityScoresData && detailedAbilityScores && (
          <CharacterFormAbilityScoresSection
            abilityScoresData={abilityScoresData}
            detailedAbilityScores={detailedAbilityScores}
            onBaseAbilityScoreChange={handleBaseAbilityScoreChange}
            onMultipleBaseAbilityScoresChange={handleMultipleBaseAbilityScoresChange}
            onAbilityScoreTempCustomModifierChange={handleAbilityScoreTempCustomModifierChange}
            onOpenAbilityScoreBreakdownDialog={handleOpenAbilityScoreBreakdownDialog}
            characterClassId={character.classes[0]?.className || ''}
          />
        )}

        {savingThrowsData && aggregatedFeatEffects && (
          <SavingThrowsPanel
              savingThrowsData={savingThrowsData}
              abilityScores={actualAbilityScoresForSavesAndSkills}
              aggregatedFeatEffects={aggregatedFeatEffects}
              onSavingThrowTemporaryModChange={handleSavingThrowTemporaryModChange}
              onOpenInfoDialog={handleOpenSavingThrowInfoDialog}
              onOpenRollDialog={handleOpenRollDialog}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-8">
            {character && aggregatedFeatEffects && (
              <ArmorClassPanel
                character={character}
                aggregatedFeatEffects={aggregatedFeatEffects}
                onCharacterUpdate={handleCharacterFieldUpdate as any}
                onOpenAcBreakdownDialog={handleOpenAcBreakdownDialog}
              />
            )}
            {experiencePanelData && translations.XP_TABLE && (
              <ExperiencePanel
                experienceData={experiencePanelData}
                onXpChange={(newXp) => handleCoreInfoFieldChange('experiencePoints', newXp)}
                xpTable={translations.XP_TABLE}
                epicLevelXpIncrease={translations.EPIC_LEVEL_XP_INCREASE}
              />
            )}
          </div>

          <div className="space-y-8">
            {healthPanelData && (
              <HealthPanel
                healthData={healthPanelData}
                calculatedMaxHp={calculatedMaxHpForPanel}
                finalConstitutionModifier={finalConstitutionModifierForPanel}
                calculatedMiscMaxHpBonus={calculatedMiscMaxHpBonusForPanel}
                onCharacterUpdate={handleHealthFieldChange}
                onOpenHealthInfoDialog={handleOpenHealthInfoDialog}
              />
            )}
          </div>
        </div>

        {resistancesData && aggregatedFeatEffects && ( 
          <ResistancesPanel
            characterData={resistancesData}
            aggregatedFeatEffects={aggregatedFeatEffects} 
            onResistanceChange={handleResistanceChange}
            onDamageReductionChange={handleDamageReductionChange}
            onOpenResistanceInfoDialog={handleOpenResistanceInfoDialog}
          />
        )}

        {combatDataForPanel && aggregatedFeatEffects && (
          <CombatPanel
              combatData={combatDataForPanel}
              aggregatedFeatEffects={aggregatedFeatEffects}
              allFeatDefinitions={allAvailableFeatDefinitions}
              onCharacterUpdate={handleCharacterFieldUpdate as any}
              onOpenCombatStatInfoDialog={handleOpenCombatStatInfoDialog}
              onOpenRollDialog={handleOpenRollDialog}
          />
        )}


        {conditionsPanelData && aggregatedFeatEffects && (character?.feats?.length ?? 0) > 0 && (
          <ConditionsPanel
            characterFeats={conditionsPanelData.characterFeats}
            allFeatDefinitions={conditionsPanelData.allFeatDefinitions}
            onConditionToggle={handleConditionToggle}
            aggregatedFeatEffects={aggregatedFeatEffects}
          />
        )}

        {storyAndAppearanceData && (
          <CharacterFormStoryPortraitSection
            storyAndAppearanceData={storyAndAppearanceData}
            onFieldChange={handleCharacterFieldUpdate as any}
            onPortraitChange={handlePortraitChange}
          />
        )}

        {languagesPanelData && (
          <LanguagesPanel
            characterLanguages={languagesPanelData.characterLanguages}
            onLanguagesChange={handleLanguagesChange}
            characterRaceId={languagesPanelData.characterRaceId}
            characterIntelligenceScore={languagesPanelData.characterIntelligenceScore}
            speakLanguageSkillRanks={languagesPanelData.speakLanguageSkillRanks}
          />
        )}

        {skillsData && aggregatedFeatEffects && (
          <SkillsFormSection
            skillsData={skillsData}
            actualAbilityScores={actualAbilityScoresForSavesAndSkills}
            allFeatDefinitions={allAvailableFeatDefinitions}
            allPredefinedSkillDefinitions={translations.SKILL_DEFINITIONS}
            allCustomSkillDefinitions={globalCustomSkillDefinitions}
            onSkillChange={handleSkillChange}
            onEditCustomSkillDefinition={handleOpenEditCustomSkillDialog}
            onOpenSkillInfoDialog={handleOpenSkillInfoDialog}
            onOpenRollDialog={handleOpenRollDialog}
            characterLevel={characterLevelFromXP}
            aggregatedFeatEffects={aggregatedFeatEffects}
          />
        )}

        {featSectionData && (
          <FeatsFormSection
            featSectionData={featSectionData}
            allAvailableFeatDefinitions={allAvailableFeatDefinitions}
            chosenFeatInstances={character.feats}
            onFeatInstancesChange={handleFeatInstancesChange}
            onEditCustomFeatDefinition={handleOpenEditCustomFeatDefinitionDialog}
            abilityScores={actualAbilityScoresForSavesAndSkills}
            skills={character.skills}
            allPredefinedSkillDefinitions={translations.SKILL_DEFINITIONS}
            allCustomSkillDefinitions={globalCustomSkillDefinitions}
            allSkillOptionsForDialog={allSkillOptionsForDialog}
            allMagicSchoolOptionsForDialog={allMagicSchoolOptionsForDialog}
            characterLevel={characterLevelFromXP}
            aggregatedFeatEffects={aggregatedFeatEffects}
          />
        )}

        {speedData && aggregatedFeatEffects && (
          <SpeedPanel
            speedData={speedData}
            aggregatedFeatEffects={aggregatedFeatEffects}
            onCharacterUpdate={handleCharacterFieldUpdate as any}
            onOpenSpeedInfoDialog={handleOpenSpeedInfoDialog}
            onOpenArmorSpeedPenaltyInfoDialog={handleOpenArmorSpeedPenaltyInfoDialog}
            onOpenLoadSpeedPenaltyInfoDialog={handleOpenLoadSpeedPenaltyInfoDialog}
          />
        )}

        {character && translations?.GEAR_SLOTS && allItemDefinitions.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="font-serif text-xl">Quick Equip (Testing Panel)</CardTitle>
              <CardDescription>Select items to equip directly. This is for testing and will be removed.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {translations.GEAR_SLOTS.map((slot) => {
                const compatibleItems = getCompatibleItemsForSlot(slot, allItemDefinitions);
                const equippedInstanceId = character.equippedGear?.[slot.id];
                const equippedInstance = equippedInstanceId ? character.inventory.find(inst => inst.instanceId === equippedInstanceId) : undefined;
                const equippedItemDef = equippedInstance ? allItemDefinitions.find(def => def.definitionId === equippedInstance.definitionId) : undefined;

                return (
                  <div key={slot.id} className="space-y-1">
                    <Label htmlFor={`equip-${slot.id}`}>{slot.label}</Label>
                    <Select
                      value={equippedItemDef?.definitionId || '__NONE__'}
                      onValueChange={(itemDefId) => handleEquipItem(slot.id, itemDefId as ItemDefinitionId | '__NONE__')}
                    >
                      <SelectTrigger id={`equip-${slot.id}`}>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__NONE__">None</SelectItem>
                        {compatibleItems.map(itemDef => (
                          <SelectItem key={itemDef.definitionId} value={itemDef.definitionId}>
                            {itemDef.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}


        <div className="flex flex-col-reverse md:flex-row md:justify-between gap-4 mt-12 pt-8 border-t">
          <Button type="button" variant="outline" size="lg" onClick={handleCancel} className="w-full md:w-auto">
            {UI_STRINGS.formButtonCancel || "Cancel"}
          </Button>
          <Button type="submit" size="lg" className="w-full md:w-auto shadow-md hover:shadow-lg transition-shadow">
            {UI_STRINGS.formButtonCreateCharacter || "Create Character"}
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
          weaponDamageDice={rollDialogProps.weaponDamageDice}
          onRoll={handleRollResult}
          rerollTwentiesForChecks={rollDialogProps.rerollTwentiesForChecks}
        />
      )}
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
};
CharacterFormCoreComponent.displayName = "CharacterFormCoreComponent";
export const CharacterFormCore = React.memo(CharacterFormCoreComponent);



