
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
  SpeedDetails, SpeedType, CharacterAlignment, ProcessedSiteData
} from '@/types/character';
import {
  getNetAgingEffects,
  getRaceSpecialQualities,
  getInitialCharacterSkills,
  getGrantedFeatsForCharacter,
  calculateDetailedAbilityScores,
  getRaceSkillPointsBonusPerLevel,
  ABILITY_ORDER_INTERNAL,
  getUnarmedGrappleDamage
} from '@/types/character';

import { useDefinitionsStore, type CustomSkillDefinition } from '@/lib/definitions-store';
import { useI18n } from '@/context/I18nProvider';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { InfoDisplayDialog } from '@/components/InfoDisplayDialog';
import { CharacterFormCoreInfoSection } from '@/components/form-sections/CharacterFormCoreInfoSection';
import { CharacterFormAbilityScoresSection } from '@/components/form-sections/CharacterFormAbilityScoresSection';
import { CharacterFormStoryPortraitSection } from '@/components/form-sections/CharacterFormStoryPortraitSection';
import { SkillsFormSection } from '@/components/SkillsFormSection';
import { FeatsFormSection } from '@/components/FeatsFormSection';
import { SavingThrowsPanel } from '@/components/form-sections/SavingThrowsPanel';
import { ArmorClassPanel } from '@/components/form-sections/ArmorClassPanel';
import { SpeedPanel } from '@/components/form-sections/SpeedPanel';
import { CombatPanel } from '@/components/form-sections/CombatPanel';
import { ResistancesPanel } from '@/components/form-sections/ResistancesPanel';
import { AddCustomSkillDialog } from '@/components/AddCustomSkillDialog';
import { AddCustomFeatDialog } from '@/components/AddCustomFeatDialog';

import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';


interface CharacterFormCoreProps {
  initialCharacter?: Character;
  onSave: (character: Character) => void;
  isCreating: boolean;
}

const abilityNames: Exclude<AbilityName, 'none'>[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

// Helper function to create base character data
function createBaseCharacterData(
    translations: ProcessedSiteData,
): Character {
    const {
      DEFAULT_ABILITIES, DEFAULT_SAVING_THROWS, DEFAULT_RESISTANCE_VALUE,
      DEFAULT_SPEED_DETAILS, DEFAULT_SPEED_PENALTIES, DND_RACES, DND_CLASSES,
      SIZES, SKILL_DEFINITIONS, CLASS_SKILLS
    } = translations;

    const defaultHumanRace = DND_RACES.find(r => r.value === 'human');
    const defaultRaceValue = defaultHumanRace?.value || (DND_RACES.length > 0 ? DND_RACES[0].value : '');
    const defaultFighterClass = DND_CLASSES.find(c => c.value === 'fighter');
    const defaultClassNameValue = defaultFighterClass?.value || (DND_CLASSES.length > 0 ? DND_CLASSES[0].value : '');
    const defaultClasses: CharacterClass[] = [{ id: crypto.randomUUID(), className: defaultClassNameValue, level: 1 }];
    const defaultSize: CharacterSize = 'medium';
    const sizeLabelForGrapple = SIZES.find(s => s.value === defaultSize)?.label || defaultSize;
    const defaultUnarmedGrappleDice = getUnarmedGrappleDamage(defaultSize, SIZES);

    const initialSkills = getInitialCharacterSkills(defaultClasses, SKILL_DEFINITIONS, CLASS_SKILLS);

    return {
      id: crypto.randomUUID(), name: '', playerName: '', campaign: '', race: defaultRaceValue, alignment: 'true-neutral' as CharacterAlignment, deity: '', size: defaultSize, age: 20, gender: '',
      height: '', weight: '', eyes: '', hair: '', skin: '',
      abilityScores: { ...(JSON.parse(JSON.stringify(DEFAULT_ABILITIES))) },
      abilityScoreTempCustomModifiers: { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 },
      hp: 10, maxHp: 10,
      armorBonus: 0, shieldBonus: 0, sizeModifierAC: 0, naturalArmor: 0, deflectionBonus: 0, dodgeBonus: 0, acMiscModifier: 0, babMiscModifier: 0, initiativeMiscModifier: 0,
      grappleMiscModifier: 0, grappleWeaponChoice: 'unarmed', grappleDamage_baseNotes: `${defaultUnarmedGrappleDice} (${sizeLabelForGrapple} Unarmed)`, grappleDamage_bonus: 0,
      savingThrows: JSON.parse(JSON.stringify(DEFAULT_SAVING_THROWS)),
      classes: defaultClasses,
      skills: initialSkills,
      feats: [], // Will be populated by getGrantedFeatsForCharacter based on actual race/class/level & custom defs
      inventory: [], personalStory: '', portraitDataUrl: undefined,
      fireResistance: { ...DEFAULT_RESISTANCE_VALUE }, coldResistance: { ...DEFAULT_RESISTANCE_VALUE }, acidResistance: { ...DEFAULT_RESISTANCE_VALUE }, electricityResistance: { ...DEFAULT_RESISTANCE_VALUE }, sonicResistance: { ...DEFAULT_RESISTANCE_VALUE },
      spellResistance: { ...DEFAULT_RESISTANCE_VALUE }, powerResistance: { ...DEFAULT_RESISTANCE_VALUE }, damageReduction: [], fortification: { ...DEFAULT_RESISTANCE_VALUE },
      landSpeed: { ...DEFAULT_SPEED_DETAILS }, burrowSpeed: { ...DEFAULT_SPEED_DETAILS }, climbSpeed: { ...DEFAULT_SPEED_DETAILS }, flySpeed: { ...DEFAULT_SPEED_DETAILS }, swimSpeed: { ...DEFAULT_SPEED_DETAILS },
      armorSpeedPenalty_base: DEFAULT_SPEED_PENALTIES.armorSpeedPenalty_base || 0,
      armorSpeedPenalty_miscModifier: DEFAULT_SPEED_PENALTIES.armorSpeedPenalty_miscModifier || 0,
      loadSpeedPenalty_base: DEFAULT_SPEED_PENALTIES.loadSpeedPenalty_base || 0,
      loadSpeedPenalty_miscModifier: DEFAULT_SPEED_PENALTIES.loadSpeedPenalty_miscModifier || 0,
    };
}


export function CharacterFormCore({ initialCharacter, onSave, isCreating }: CharacterFormCoreProps) {
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

  const allAvailableSkillDefinitionsForDisplay = React.useMemo((): SkillDefinitionForDisplay[] => {
    if (translationsLoading || !translations) return [];
    const predefined = translations.SKILL_DEFINITIONS.map(sd => ({
        id: sd.value,
        name: sd.label,
        keyAbility: sd.keyAbility as AbilityName,
        description: sd.description,
        isCustom: false,
        providesSynergies: (translations.SKILL_SYNERGIES as Record<string, any>)[sd.value] || [],
    }));
    const custom = globalCustomSkillDefinitions.map(csd => ({
        ...csd,
        isCustom: true,
    }));
    return [...predefined, ...custom].sort((a,b) => a.name.localeCompare(b.name));
  }, [translationsLoading, translations, globalCustomSkillDefinitions]);


  React.useEffect(() => {
    if (translationsLoading || !translations || !isClient) return;

    let characterToSet: Character;

    if (isCreating) {
        characterToSet = createBaseCharacterData(translations);
    } else if (initialCharacter) {
        const baseCharDataForDefaults = createBaseCharacterData(translations);
        characterToSet = {
            ...baseCharDataForDefaults,
            ...initialCharacter,
            abilityScores: initialCharacter.abilityScores || baseCharDataForDefaults.abilityScores,
            abilityScoreTempCustomModifiers: initialCharacter.abilityScoreTempCustomModifiers || baseCharDataForDefaults.abilityScoreTempCustomModifiers,
            savingThrows: initialCharacter.savingThrows || baseCharDataForDefaults.savingThrows,
            classes: initialCharacter.classes && initialCharacter.classes.length > 0 ? initialCharacter.classes : baseCharDataForDefaults.classes,
            // Skills and Feats will be re-derived below.
            // Ensure damageReduction from initialCharacter is preserved if it exists, otherwise use default empty array.
            damageReduction: initialCharacter.damageReduction || baseCharDataForDefaults.damageReduction,
        };
    } else {
        return; // Not creating and no initial character, do nothing.
    }

    // Apply/Re-apply translation-dependent and globally defined custom data
    const { SKILL_DEFINITIONS, CLASS_SKILLS, SIZES, DND_FEATS_DEFINITIONS, DND_RACES, DND_CLASSES } = translations;

    // Update skills: Ensure class skills are correct and add any new global custom skills
    let currentSkills = isCreating ? 
        getInitialCharacterSkills(characterToSet.classes, SKILL_DEFINITIONS, CLASS_SKILLS) 
        : (characterToSet.skills || getInitialCharacterSkills(characterToSet.classes, SKILL_DEFINITIONS, CLASS_SKILLS));

    currentSkills = currentSkills.map(skillInstance => ({
        ...skillInstance,
        isClassSkill: characterToSet.classes[0]?.className ? (CLASS_SKILLS[characterToSet.classes[0].className as keyof typeof CLASS_SKILLS] || []).includes(skillInstance.id) : false,
    }));
    
    const skillInstancesToAdd: SkillType[] = [];
    globalCustomSkillDefinitions.forEach(globalDef => {
        if (!currentSkills.find(s => s.id === globalDef.id)) {
            skillInstancesToAdd.push({
                id: globalDef.id, ranks: 0, miscModifier: 0,
                isClassSkill: characterToSet.classes[0]?.className ? (CLASS_SKILLS[characterToSet.classes[0].className as keyof typeof CLASS_SKILLS] || []).includes(globalDef.id) : false
            });
        }
    });
    if (skillInstancesToAdd.length > 0) {
        currentSkills = [...currentSkills, ...skillInstancesToAdd];
    }
    characterToSet.skills = currentSkills.sort((a, b) => (allAvailableSkillDefinitionsForDisplay.find(d => d.id === a.id)?.name || '').localeCompare(allAvailableSkillDefinitionsForDisplay.find(d => d.id === b.id)?.name || ''));


    // Update feats: Re-evaluate granted feats and combine with user-chosen feats
    const characterLevel = characterToSet.classes.reduce((sum, c) => sum + c.level, 0) || 1;
    const newGrantedFeats = getGrantedFeatsForCharacter(characterToSet.race, characterToSet.classes, characterLevel, allAvailableFeatDefinitions, DND_RACES, DND_CLASSES);
    const userChosenFeats = isCreating ? [] : (characterToSet.feats?.filter(fi => !fi.isGranted) || []);
    
    const combinedFeatsMap = new Map<string, CharacterFeatInstance>();
    newGrantedFeats.forEach(inst => combinedFeatsMap.set(inst.instanceId, inst));
    userChosenFeats.forEach(inst => {
        const def = allAvailableFeatDefinitions.find(d => d.value === inst.definitionId);
        if (!newGrantedFeats.some(gf => gf.definitionId === inst.definitionId && !def?.canTakeMultipleTimes)) {
            combinedFeatsMap.set(inst.instanceId, inst);
        }
    });
    characterToSet.feats = Array.from(combinedFeatsMap.values()).sort((a,b) => (allAvailableFeatDefinitions.find(d=>d.value===a.definitionId)?.label||'').localeCompare(allAvailableFeatDefinitions.find(d=>d.value===b.definitionId)?.label||''));


    // Update Grapple Damage Notes if unarmed
    if (characterToSet.grappleWeaponChoice === 'unarmed') {
        const unarmedDamageDice = getUnarmedGrappleDamage(characterToSet.size, SIZES);
        const currentSizeLabelGrapple = SIZES.find(s => s.value === characterToSet.size)?.label || characterToSet.size;
        characterToSet.grappleDamage_baseNotes = `${unarmedDamageDice} (${currentSizeLabelGrapple} Unarmed)`;
    }

    // Update Barbarian Damage Reduction
    const barbarianClass = characterToSet.classes.find(c => c.className === 'barbarian');
    const barbarianLevel = barbarianClass?.level || 0;
    let grantedDrValue = 0;
    if (barbarianLevel >= 19) grantedDrValue = 5; else if (barbarianLevel >= 16) grantedDrValue = 4; else if (barbarianLevel >= 13) grantedDrValue = 3; else if (barbarianLevel >= 10) grantedDrValue = 2; else if (barbarianLevel >= 7) grantedDrValue = 1;
    
    const existingUserDrInstances = characterToSet.damageReduction?.filter(dr => !dr.isGranted) || [];
    let finalDrArray = [...existingUserDrInstances];
    if (grantedDrValue > 0) {
        const existingGrantedBarbDrDefinition = initialCharacter?.damageReduction?.find(dr => dr.isGranted && dr.source === 'Barbarian Class');
        finalDrArray.unshift({ // Add or update granted DR at the beginning
            id: existingGrantedBarbDrDefinition?.id || `granted-barb-dr-${crypto.randomUUID()}`,
            value: grantedDrValue, type: 'none', rule: 'bypassed-by-type', isGranted: true, source: 'Barbarian Class'
        });
    }
    characterToSet.damageReduction = finalDrArray;

    setCharacter(characterToSet);

  }, [
    isClient, translationsLoading, translations, initialCharacter, isCreating,
    globalCustomFeatDefinitions, globalCustomSkillDefinitions, // Switched from ...FromStore
    allAvailableFeatDefinitions, allAvailableSkillDefinitionsForDisplay // Ensure these are stable or correctly memoized
  ]);


  const [ageEffectsDetails, setAgeEffectsDetails] = React.useState<CharacterFormCoreInfoSectionProps['ageEffectsDetails']>(null);
  const [raceSpecialQualities, setRaceSpecialQualities] = React.useState<CharacterFormCoreInfoSectionProps['raceSpecialQualities']>(null);
  const [activeInfoDialogType, setActiveInfoDialogType] = React.useState<InfoDialogContentType | null>(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = React.useState(false);
  const [detailedAbilityScores, setDetailedAbilityScores] = React.useState<DetailedAbilityScores | null>(null);
  const [isAddOrEditSkillDialogOpen, setIsAddOrEditSkillDialogOpen] = React.useState(false);
  const [skillToEdit, setSkillToEdit] = React.useState<CustomSkillDefinition | undefined>(undefined);
  const [isCustomFeatDialogOpen, setIsCustomFeatDialogOpen] = React.useState(false);
  const [editingCustomFeatDefinition, setEditingCustomFeatDefinition] = React.useState<(FeatDefinitionJsonData & { isCustom: true }) | undefined>(undefined);

  const router = useRouter();
  const { toast } = useToast();


  React.useEffect(() => {
    if (character && translations) {
      setDetailedAbilityScores(calculateDetailedAbilityScores(
        character,
        globalCustomFeatDefinitions,
        translations.DND_RACES,
        translations.DND_RACE_ABILITY_MODIFIERS_DATA,
        translations.DND_RACE_BASE_MAX_AGE_DATA,
        translations.RACE_TO_AGING_CATEGORY_MAP_DATA,
        translations.DND_RACE_AGING_EFFECTS_DATA,
        translations.DND_FEATS_DEFINITIONS, 
        translations.ABILITY_LABELS
      ));
    }
  }, [character, translations, globalCustomFeatDefinitions]);

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
    if (character && character.race && character.age > 0 && translations) {
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
    if (character && character.race && translations) {
      const details = getRaceSpecialQualities(
        character.race as DndRaceId,
        translations.DND_RACES,
        translations.DND_RACE_ABILITY_MODIFIERS_DATA,
        translations.SKILL_DEFINITIONS,
        translations.DND_FEATS_DEFINITIONS, // Pass predefined feats here
        translations.ABILITY_LABELS
      );
      setRaceSpecialQualities(details);
    } else {
      setRaceSpecialQualities(null);
    }
  }, [character?.race, translations]);

  React.useEffect(() => {
    if (character && character.race && translations) {
      const selectedRaceInfo = translations.DND_RACES.find(r => r.value === character.race);
      if (selectedRaceInfo) {
        const raceKey = selectedRaceInfo.value as DndRaceId;
        const minAdultAge = translations.DND_RACE_MIN_ADULT_AGE_DATA[raceKey];
        if (minAdultAge !== undefined && character.age < minAdultAge) {
          setCharacter(prev => prev ? ({ ...prev, age: minAdultAge }) : null);
        }
      }
    }
  }, [character?.race, character?.age, translations]); 

  const handleCoreInfoFieldChange = React.useCallback((field: keyof Character, value: any) => {
     setCharacter(prev => prev ? ({ ...prev, [field]: value }) : null);
  }, []);
  
  const handleCharacterFieldUpdate = React.useCallback((
    field: keyof Character | `${SpeedType}Speed.miscModifier` | `armorSpeedPenalty_miscModifier` | `loadSpeedPenalty_miscModifier`,
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
        } else if (field === 'armorSpeedPenalty_miscModifier' || field === 'loadSpeedPenalty_miscModifier') {
          return { ...prev, [field]: value };
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
    if (!translations) return;
    setCharacter(prev => {
      if (!prev) return null;
      const updatedClasses = [{ ...prev.classes[0], id: prev.classes[0]?.id || crypto.randomUUID(), className: value, level: 1 }];
      const newSkills = prev.skills.map(skillInstance => {
          const isNowClassSkill = value ?
            (translations.CLASS_SKILLS[value as keyof typeof translations.CLASS_SKILLS] || []).includes(skillInstance.id)
            : false;
          return {...skillInstance, isClassSkill: isNowClassSkill };
      }).sort((a, b) => {
        const nameA = allAvailableSkillDefinitionsForDisplay.find(d => d.id === a.id)?.name || '';
        const nameB = allAvailableSkillDefinitionsForDisplay.find(d => d.id === b.id)?.name || '';
        return nameA.localeCompare(nameB);
      });
      // Re-evaluate granted feats when class changes
      const characterLevel = updatedClasses.reduce((sum, c) => sum + c.level, 0) || 1;
      const newGrantedFeats = getGrantedFeatsForCharacter(prev.race, updatedClasses, characterLevel, allAvailableFeatDefinitions, translations.DND_RACES, translations.DND_CLASSES);
      const userChosenFeats = prev.feats.filter(fi => !fi.isGranted);
      const combinedFeatsMap = new Map<string, CharacterFeatInstance>();
      newGrantedFeats.forEach(inst => combinedFeatsMap.set(inst.instanceId, inst));
      userChosenFeats.forEach(inst => {
        const def = allAvailableFeatDefinitions.find(d => d.value === inst.definitionId);
        if (!newGrantedFeats.some(gf => gf.definitionId === inst.definitionId && !def?.canTakeMultipleTimes)) {
            combinedFeatsMap.set(inst.instanceId, inst);
        }
      });
      const updatedFeats = Array.from(combinedFeatsMap.values()).sort((a,b) => (allAvailableFeatDefinitions.find(d=>d.value===a.definitionId)?.label||'').localeCompare(allAvailableFeatDefinitions.find(d=>d.value===b.definitionId)?.label||''));

      return { ...prev, classes: updatedClasses, skills: newSkills, feats: updatedFeats };
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
    const existing = definitionsActions.getCustomSkillDefinitionById(skillData.id);
    if(existing) {
        definitionsActions.updateCustomSkillDefinition(skillData);
    } else {
        definitionsActions.addCustomSkillDefinition(skillData);
    }
    setIsAddOrEditSkillDialogOpen(false);
    setSkillToEdit(undefined);
  }, [definitionsActions]);

  const handleOpenEditCustomSkillDialog = React.useCallback((skillDefId: string) => {
    const customDef = definitionsActions.getCustomSkillDefinitionById(skillDefId);
    if (customDef) {
      setSkillToEdit(customDef);
      setIsAddOrEditSkillDialogOpen(true);
    } else {
      toast({ title: "Error", description: "Could not find custom skill definition to edit.", variant: "destructive" });
    }
  }, [definitionsActions, toast]);

  const handleFeatInstancesChange = React.useCallback((updatedFeatInstances: CharacterFeatInstance[]) => {
    setCharacter(prev => prev ? ({ ...prev, feats: updatedFeatInstances }) : null);
  }, []);

  const handleCustomFeatDefinitionSaveToStore = React.useCallback((featDefData: (FeatDefinitionJsonData & { isCustom: true })) => {
    if (!character) return;
    const existing = definitionsActions.getCustomFeatDefinitionById(featDefData.value);
    if (existing) {
        definitionsActions.updateCustomFeatDefinition(featDefData);
    } else {
        definitionsActions.addCustomFeatDefinition(featDefData);
    }
    const oldDefinition = allAvailableFeatDefinitions.find(d => d.value === featDefData.value && d.isCustom);
    if (oldDefinition?.canTakeMultipleTimes && !featDefData.canTakeMultipleTimes) {
      const instancesOfThisFeat = character.feats.filter(inst => inst.definitionId === featDefData.value && !inst.isGranted);
      if (instancesOfThisFeat.length > 1) {
        const firstInstance = instancesOfThisFeat[0];
        const newChosenInstances = character.feats.filter(
          inst => inst.isGranted || inst.definitionId !== featDefData.value || inst.instanceId === firstInstance.instanceId
        );
        handleFeatInstancesChange(newChosenInstances);
      }
    }
    setEditingCustomFeatDefinition(undefined);
    setIsCustomFeatDialogOpen(false);
  }, [character, definitionsActions, allAvailableFeatDefinitions, handleFeatInstancesChange]);

  const handleOpenEditCustomFeatDefinitionDialog = React.useCallback((definitionId: string) => {
    const defToEdit = definitionsActions.getCustomFeatDefinitionById(definitionId);
    if (defToEdit) {
      setEditingCustomFeatDefinition(defToEdit);
      setIsCustomFeatDialogOpen(true);
    } else {
      toast({ title: "Error", description: "Could not find custom feat definition to edit.", variant: "destructive" });
    }
  }, [definitionsActions, toast]);

  const allSkillOptionsForDialog = React.useMemo(() => {
    return allAvailableSkillDefinitionsForDisplay
      .filter(skill => skill.id !== skillToEdit?.id)
      .map(s => ({ value: s.id, label: s.name }))
      .sort((a,b) => a.label.localeCompare(b.label));
  }, [allAvailableSkillDefinitionsForDisplay, skillToEdit]);

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

  const handleSavingThrowMiscModChange = React.useCallback((saveType: SavingThrowType, value: number) => {
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

  const handleCancel = React.useCallback(() => { router.push('/'); }, [router]);

  const openInfoDialog = React.useCallback((contentType: InfoDialogContentType) => { setActiveInfoDialogType(contentType); setIsInfoDialogOpen(true); }, []);
  const handleOpenRaceInfoDialog = React.useCallback(() => { if (character?.race) { openInfoDialog({ type: 'race' }); } }, [character?.race, openInfoDialog]);
  const handleOpenClassInfoDialog = React.useCallback(() => { if (character?.classes[0]?.className) { openInfoDialog({ type: 'class' }); } }, [character?.classes, openInfoDialog]);
  const handleOpenAlignmentInfoDialog = React.useCallback(() => openInfoDialog({ type: 'alignmentSummary' }), [openInfoDialog]);
  const handleOpenDeityInfoDialog = React.useCallback(() => openInfoDialog({ type: 'deity' }), [openInfoDialog]);
  const handleOpenAbilityScoreBreakdownDialog = React.useCallback((ability: Exclude<AbilityName, 'none'>) => { openInfoDialog({ type: 'abilityScoreBreakdown', abilityName: ability }); }, [openInfoDialog]);
  const handleOpenCombatStatInfoDialog = React.useCallback((contentType: InfoDialogContentType) => { openInfoDialog(contentType); }, [openInfoDialog]);
  const handleOpenSkillInfoDialog = React.useCallback((skillId: string) => { openInfoDialog({ type: 'skillModifierBreakdown', skillId }); }, [openInfoDialog]);
  const handleOpenAcBreakdownDialog = React.useCallback((acType: 'Normal' | 'Touch' | 'Flat-Footed') => { openInfoDialog({ type: 'acBreakdown', acType }); }, [openInfoDialog]);
  const handleOpenSpeedInfoDialog = React.useCallback((speedType: SpeedType) => { openInfoDialog({ type: 'speedBreakdown', speedType }); }, [openInfoDialog]);
  const handleOpenResistanceInfoDialog = React.useCallback((resistanceField: ResistanceFieldKeySheet) => { openInfoDialog({ type: 'resistanceBreakdown', resistanceField }); }, [openInfoDialog]);
  const handleOpenArmorSpeedPenaltyInfoDialog = React.useCallback(() => openInfoDialog({ type: 'armorSpeedPenaltyBreakdown' }), [openInfoDialog]);
  const handleOpenLoadSpeedPenaltyInfoDialog = React.useCallback(() => openInfoDialog({ type: 'loadSpeedPenaltyBreakdown' }), [openInfoDialog]);


  const handleSubmit = React.useCallback((e: FormEvent) => {
    e.preventDefault();
    if (!character) { toast({ title: "Error", description: "Character data not loaded.", variant: "destructive" }); return; }
    if (!character.name || character.name.trim() === '') { toast({ title: "Missing Information", description: "Please enter a character name.", variant: "destructive" }); return; }
    if (!character.race || character.race.trim() === '') { toast({ title: "Missing Information", description: "Please select or enter a character race.", variant: "destructive" }); return; }
    if (!character.classes[0]?.className || character.classes[0]?.className.trim() === '') { toast({ title: "Missing Information", description: "Please select or enter a character class.", variant: "destructive" }); return; }
    if (!character.alignment) { toast({ title: "Missing Information", description: "Please select an alignment.", variant: "destructive" }); return; }

    if (translations) {
        const selectedRaceInfoForValidation = translations.DND_RACES.find(r => r.value === character.race);
        const minAgeForValidation = (selectedRaceInfoForValidation ? translations.DND_RACE_MIN_ADULT_AGE_DATA[selectedRaceInfoForValidation.value as DndRaceId] : undefined) || 1;
        if (character.age < minAgeForValidation) { toast({ title: "Invalid Age", description: `Age must be at least ${minAgeForValidation}${selectedRaceInfoForValidation ? ` for a ${selectedRaceInfoForValidation.label}` : ''}.`, variant: "destructive" }); return; }
    }


    for (const ability of abilityNames) {
      if (ability === 'none') continue;
      if (character.abilityScores[ability] <= 0) { toast({ title: `Invalid ${ability.charAt(0).toUpperCase() + ability.slice(1)} Score`, description: `${ability.charAt(0).toUpperCase() + ability.slice(1)} score must be greater than 0.`, variant: "destructive" }); return; }
    }

    const finalCharacterData = {
      ...character,
      classes: character.classes.length > 0 ? character.classes : [{id: crypto.randomUUID(), className: '', level: 1}],
    };
    if (finalCharacterData.classes[0]) {
        finalCharacterData.classes[0].level = 1; 
    }

    onSave(finalCharacterData);
  }, [character, onSave, toast, translations]);

  if (translationsLoading || !character || !translations) { 
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

  const selectedClassInfo = translations.DND_CLASSES.find(c => c.value === character.classes[0]?.className);
  const currentMinAgeForInput = character.race ? (translations.DND_RACE_MIN_ADULT_AGE_DATA[character.race as DndRaceId] || 1) : 1;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        <CharacterFormCoreInfoSection
          characterData={{
            name: character.name,
            playerName: character.playerName,
            race: character.race,
            alignment: character.alignment,
            deity: character.deity,
            size: character.size,
            age: character.age,
            gender: character.gender,
            classes: character.classes,
          }}
          onFieldChange={handleCoreInfoFieldChange}
          onClassChange={handleClassChange}
          ageEffectsDetails={ageEffectsDetails}
          raceSpecialQualities={raceSpecialQualities}
          currentMinAgeForInput={currentMinAgeForInput}
          onOpenRaceInfoDialog={handleOpenRaceInfoDialog}
          onOpenClassInfoDialog={handleOpenClassInfoDialog}
          onOpenAlignmentInfoDialog={handleOpenAlignmentInfoDialog}
          onOpenDeityInfoDialog={handleOpenDeityInfoDialog}
        />

        <CharacterFormAbilityScoresSection
          character={{
            abilityScores: character.abilityScores,
            abilityScoreTempCustomModifiers: character.abilityScoreTempCustomModifiers,
          }}
          detailedAbilityScores={detailedAbilityScores}
          onBaseAbilityScoreChange={handleBaseAbilityScoreChange}
          onMultipleBaseAbilityScoresChange={handleMultipleBaseAbilityScoresChange}
          onAbilityScoreTempCustomModifierChange={handleAbilityScoreTempCustomModifierChange}
          onOpenAbilityScoreBreakdownDialog={handleOpenAbilityScoreBreakdownDialog}
          isCreating={isCreating}
        />

        <CharacterFormStoryPortraitSection
          character={{
            campaign: character.campaign,
            personalStory: character.personalStory,
            portraitDataUrl: character.portraitDataUrl,
            height: character.height,
            weight: character.weight,
            eyes: character.eyes,
            hair: character.hair,
            skin: character.skin,
          }}
          onFieldChange={handleCoreInfoFieldChange}
          onPortraitChange={handlePortraitChange}
        />

        <SkillsFormSection
          character={{
            skills: character.skills,
            abilityScores: character.abilityScores,
            classes: character.classes,
            race: character.race,
            size: character.size,
            feats: character.feats,
          }}
          actualAbilityScores={actualAbilityScoresForSavesAndSkills}
          allFeatDefinitions={allAvailableFeatDefinitions}
          allPredefinedSkillDefinitions={translations.SKILL_DEFINITIONS}
          allCustomSkillDefinitions={globalCustomSkillDefinitions}
          onSkillChange={handleSkillChange}
          onEditCustomSkillDefinition={handleOpenEditCustomSkillDialog}
          onOpenSkillInfoDialog={handleOpenSkillInfoDialog}
        />

        <FeatsFormSection
          character={character}
          allAvailableFeatDefinitions={allAvailableFeatDefinitions}
          chosenFeatInstances={character.feats}
          onFeatInstancesChange={handleFeatInstancesChange}
          onEditCustomFeatDefinition={handleOpenEditCustomFeatDefinitionDialog}
          abilityScores={actualAbilityScoresForSavesAndSkills}
          skills={character.skills}
          allPredefinedSkillDefinitions={translations.SKILL_DEFINITIONS}
          allCustomSkillDefinitions={globalCustomSkillDefinitions}
        />
        
        <div className="grid grid-cols-1 gap-6">
           <SavingThrowsPanel
              character={{
                savingThrows: character.savingThrows,
                classes: character.classes,
              }}
              abilityScores={actualAbilityScoresForSavesAndSkills}
              onSavingThrowMiscModChange={handleSavingThrowMiscModChange}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:items-start">
          <ArmorClassPanel
            character={character}
            onCharacterUpdate={handleCharacterFieldUpdate}
            onOpenAcBreakdownDialog={handleOpenAcBreakdownDialog}
          />
          <SpeedPanel
            character={character}
            onCharacterUpdate={handleCharacterFieldUpdate}
            onOpenSpeedInfoDialog={handleOpenSpeedInfoDialog}
            onOpenArmorSpeedPenaltyInfoDialog={handleOpenArmorSpeedPenaltyInfoDialog}
            onOpenLoadSpeedPenaltyInfoDialog={handleOpenLoadSpeedPenaltyInfoDialog}
          />
        </div>
        
        <CombatPanel
            character={character}
            onCharacterUpdate={handleCharacterFieldUpdate}
            onOpenCombatStatInfoDialog={handleOpenCombatStatInfoDialog}
            onOpenAcBreakdownDialog={handleOpenAcBreakdownDialog}
        />

        <ResistancesPanel
          characterData={{
            fireResistance: character.fireResistance,
            coldResistance: character.coldResistance,
            acidResistance: character.acidResistance,
            electricityResistance: character.electricityResistance,
            sonicResistance: character.sonicResistance,
            spellResistance: character.spellResistance,
            powerResistance: character.powerResistance,
            damageReduction: character.damageReduction,
            fortification: character.fortification,
          }}
          onResistanceChange={handleResistanceChange}
          onDamageReductionChange={handleDamageReductionChange}
          onOpenResistanceInfoDialog={handleOpenResistanceInfoDialog}
        />

        <div className="flex flex-col-reverse md:flex-row md:justify-between gap-4 mt-12 pt-8 border-t">
          <Button type="button" variant="outline" size="lg" onClick={handleCancel} className="w-full md:w-auto">
            {UI_STRINGS.formButtonCancel || "Cancel"}
          </Button>
          <Button type="submit" size="lg" className="w-full md:w-auto shadow-md hover:shadow-lg transition-shadow">
            {isCreating ? (UI_STRINGS.formButtonCreateCharacter || "Create Character") : (UI_STRINGS.formButtonSaveChanges || "Save Changes")}
          </Button>
        </div>
      </form>

      {isInfoDialogOpen && activeInfoDialogType && character && (
        <InfoDisplayDialog
          isOpen={isInfoDialogOpen}
          onOpenChange={setIsInfoDialogOpen}
          character={character}
          contentType={activeInfoDialogType}
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
        allFeats={translations.DND_FEATS_DEFINITIONS} // Pass predefined only for selection base
        allSkills={allSkillOptionsForDialog}
        allClasses={translations.DND_CLASSES}
        allRaces={translations.DND_RACES}
      />
    </>
  );
}

