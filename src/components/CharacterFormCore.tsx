
'use client';

import *as React from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type {
  AbilityName, Character, CharacterClass,
  DndRaceId, AbilityScores, SavingThrows, SavingThrowType,
  Skill as SkillType, DndClassId, DndDeityId, GenderId,
  DndRaceOption, DetailedAbilityScores, AbilityScoreBreakdown,
  FeatDefinitionJsonData, CharacterFeatInstance, SkillDefinitionJsonData, CharacterSize,
  ResistanceValue, DamageReductionInstance, DamageReductionType, InfoDialogContentType, ResistanceFieldKeySheet
} from '@/types/character';
import {
  SIZES,
  ALIGNMENTS,
  DND_RACES,
  DND_CLASSES,
  getNetAgingEffects,
  GENDERS,
  DND_DEITIES,
  getRaceSpecialQualities,
  getInitialCharacterSkills,
  SKILL_DEFINITIONS,
  DND_FEATS_DEFINITIONS,
  getGrantedFeatsForCharacter,
  calculateDetailedAbilityScores,
  DEFAULT_ABILITIES,
  DEFAULT_SAVING_THROWS,
  DEFAULT_RESISTANCE_VALUE,
  DND_RACE_MIN_ADULT_AGE_DATA,
  CLASS_SKILLS,
  SKILL_SYNERGIES,
  getRaceSkillPointsBonusPerLevel,
  DAMAGE_REDUCTION_TYPES
} from '@/types/character';
import { getUnarmedGrappleDamage } from '@/lib/dnd-utils';


import { useDefinitionsStore, type CustomSkillDefinition } from '@/lib/definitions-store';

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
import { CombatPanel } from '@/components/form-sections/CombatPanel';
import { ResistancesPanel } from '@/components/form-sections/ResistancesPanel';
import { AddCustomSkillDialog } from '@/components/AddCustomSkillDialog';
import { AddCustomFeatDialog } from '@/components/AddCustomFeatDialog';
import { Separator } from '@/components/ui/separator';
import { BookOpenCheck, ShieldPlus, Zap, ShieldCheck, Settings, Calculator } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';

interface CharacterFormCoreProps {
  initialCharacter?: Character;
  onSave: (character: Character) => void;
  isCreating: boolean;
}


const abilityNames: Exclude<AbilityName, 'none'>[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

export function CharacterFormCore({ initialCharacter, onSave, isCreating }: CharacterFormCoreProps) {
  const {
    customFeatDefinitions: globalCustomFeatDefinitionsFromStore,
    customSkillDefinitions: globalCustomSkillDefinitionsFromStore,
    rerollOnesForAbilityScores: rerollOnesForAbilityScoresFromStore,
    pointBuyBudget: rawPointBuyBudgetFromStore,
    actions: definitionsActions
  } = useDefinitionsStore();


  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const globalCustomFeatDefinitions = isClient ? globalCustomFeatDefinitionsFromStore : [];
  const globalCustomSkillDefinitions = isClient ? globalCustomSkillDefinitionsFromStore : [];
  const rerollOnesForAbilityScores = isClient ? rerollOnesForAbilityScoresFromStore : false;

  let numericPointBuyBudgetFromStore: number;
  if (typeof rawPointBuyBudgetFromStore === 'number' && !isNaN(rawPointBuyBudgetFromStore)) {
    numericPointBuyBudgetFromStore = rawPointBuyBudgetFromStore;
  } else if (typeof rawPointBuyBudgetFromStore === 'string') {
    const parsed = parseFloat(rawPointBuyBudgetFromStore);
    numericPointBuyBudgetFromStore = !isNaN(parsed) ? parsed : 25;
  }
  else {
    numericPointBuyBudgetFromStore = 25;
  }
  const pointBuyBudget = isClient ? numericPointBuyBudgetFromStore : 25;


  const [character, setCharacter] = React.useState<Character>(() => {
    const defaultBaseAbilityScores = { ...(JSON.parse(JSON.stringify(DEFAULT_ABILITIES)) as AbilityScores) };
    const defaultTempCustomMods: AbilityScores = { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 };
    const defaultClasses: CharacterClass[] = [{ id: crypto.randomUUID(), className: '', level: 1 }];
    const defaultSize: CharacterSize = 'medium';
    const defaultUnarmedGrappleDice = getUnarmedGrappleDamage(defaultSize);
    const sizeLabel = SIZES.find(s => s.value === defaultSize)?.label || defaultSize;


    const allInitialFeatDefsForGranting = [
        ...DND_FEATS_DEFINITIONS.map(def => ({ ...def, isCustom: false as const })),
        ...(isCreating && isClient ? globalCustomFeatDefinitionsFromStore : (initialCharacter?.feats.filter(f => f.isGranted && allInitialFeatDefsForGranting.find(fd => fd.value === f.definitionId && fd.isCustom)).map(f => globalCustomFeatDefinitionsFromStore.find(cfd => cfd.value === f.definitionId)).filter(Boolean) as (FeatDefinitionJsonData & { isCustom: true })[] || []))
    ];

    const initialFeats = getGrantedFeatsForCharacter(
      initialCharacter?.race || '',
      initialCharacter?.classes || defaultClasses,
      initialCharacter?.classes?.reduce((sum, c) => sum + c.level, 0) || 1,
      allInitialFeatDefsForGranting
    );

    let initialSkills = initialCharacter?.skills || getInitialCharacterSkills(defaultClasses);

    const baseCharData = {
      id: crypto.randomUUID(),
      name: '', race: '', alignment: 'true-neutral' as CharacterAlignment, deity: '', size: defaultSize, age: 20, gender: '',
      height: '', weight: '', eyes: '', hair: '', skin: '',
      abilityScores: defaultBaseAbilityScores,
      abilityScoreTempCustomModifiers: defaultTempCustomMods,
      hp: 10, maxHp: 10,
      armorBonus: 0, shieldBonus: 0, sizeModifierAC: 0, naturalArmor: 0,
      deflectionBonus: 0, dodgeBonus: 0, acMiscModifier: 0,
      
      babMiscModifier: 0,
      initiativeMiscModifier: 0,
      grappleMiscModifier: 0,
      grappleWeaponChoice: 'unarmed',
      grappleDamage_baseNotes: `${defaultUnarmedGrappleDice} (${sizeLabel} Unarmed)`,
      grappleDamage_bonus: 0,
      
      savingThrows: JSON.parse(JSON.stringify(DEFAULT_SAVING_THROWS)),
      classes: defaultClasses,
      skills: initialSkills,
      feats: initialFeats,
      inventory: [], personalStory: '', portraitDataUrl: undefined,
      fireResistance: { ...DEFAULT_RESISTANCE_VALUE },
      coldResistance: { ...DEFAULT_RESISTANCE_VALUE },
      acidResistance: { ...DEFAULT_RESISTANCE_VALUE },
      electricityResistance: { ...DEFAULT_RESISTANCE_VALUE },
      sonicResistance: { ...DEFAULT_RESISTANCE_VALUE },
      spellResistance: { ...DEFAULT_RESISTANCE_VALUE },
      powerResistance: { ...DEFAULT_RESISTANCE_VALUE },
      damageReduction: [],
      fortification: { ...DEFAULT_RESISTANCE_VALUE },
    };

    if (initialCharacter) {
      return {
        ...baseCharData,
        ...initialCharacter,
        alignment: initialCharacter.alignment || 'true-neutral',
        abilityScores: initialCharacter.abilityScores || defaultBaseAbilityScores,
        abilityScoreTempCustomModifiers: initialCharacter.abilityScoreTempCustomModifiers || defaultTempCustomMods,
        savingThrows: initialCharacter.savingThrows || JSON.parse(JSON.stringify(DEFAULT_SAVING_THROWS)),
        classes: initialCharacter.classes && initialCharacter.classes.length > 0 ? initialCharacter.classes : defaultClasses,
        skills: initialCharacter.skills || initialSkills,
        feats: initialCharacter.feats || initialFeats,
        fireResistance: initialCharacter.fireResistance || { ...DEFAULT_RESISTANCE_VALUE },
        coldResistance: initialCharacter.coldResistance || { ...DEFAULT_RESISTANCE_VALUE },
        acidResistance: initialCharacter.acidResistance || { ...DEFAULT_RESISTANCE_VALUE },
        electricityResistance: initialCharacter.electricityResistance || { ...DEFAULT_RESISTANCE_VALUE },
        sonicResistance: initialCharacter.sonicResistance || { ...DEFAULT_RESISTANCE_VALUE },
        spellResistance: initialCharacter.spellResistance || { ...DEFAULT_RESISTANCE_VALUE },
        powerResistance: initialCharacter.powerResistance || { ...DEFAULT_RESISTANCE_VALUE },
        damageReduction: initialCharacter.damageReduction || [],
        fortification: initialCharacter.fortification || { ...DEFAULT_RESISTANCE_VALUE },
        grappleWeaponChoice: initialCharacter.grappleWeaponChoice || 'unarmed',
        height: initialCharacter.height || '',
        weight: initialCharacter.weight || '',
        eyes: initialCharacter.eyes || '',
        hair: initialCharacter.hair || '',
        skin: initialCharacter.skin || '',
      };
    }
    return baseCharData;
  });

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

  const allAvailableFeatDefinitions = React.useMemo(() => {
    const predefined = DND_FEATS_DEFINITIONS.map(def => ({ ...def, isCustom: false as const }));
    return [...predefined, ...globalCustomFeatDefinitions];
  }, [globalCustomFeatDefinitions]);

  const allAvailableSkillDefinitionsForDisplay = React.useMemo(() => {
    const predefined = SKILL_DEFINITIONS.map(sd => ({
        id: sd.value,
        name: sd.label,
        keyAbility: sd.keyAbility as AbilityName,
        description: sd.description,
        isCustom: false,
        providesSynergies: SKILL_SYNERGIES[sd.value as keyof typeof SKILL_SYNERGIES] || [],
    }));
    const custom = globalCustomSkillDefinitions.map(csd => ({
        ...csd,
        isCustom: true,
    }));
    return [...predefined, ...custom].sort((a,b) => a.name.localeCompare(b.name));
  }, [globalCustomSkillDefinitions]);


  React.useEffect(() => {
    setDetailedAbilityScores(calculateDetailedAbilityScores(character, globalCustomFeatDefinitions));
  }, [character, globalCustomFeatDefinitions]);

  const actualAbilityScoresForSavesAndSkills = React.useMemo(() => {
    if (!detailedAbilityScores) {
      const scoresWithTemp: Partial<AbilityScores> = {};
      for (const ability of abilityNames) {
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
  }, [detailedAbilityScores, character.abilityScores, character.abilityScoreTempCustomModifiers]);


  React.useEffect(() => {
    if (character.race && character.age > 0) {
      const details = getNetAgingEffects(character.race as DndRaceId, character.age);
      setAgeEffectsDetails(details);
    } else {
      setAgeEffectsDetails(null);
    }
  }, [character.age, character.race]);


  React.useEffect(() => {
    if (character.race) {
      const details = getRaceSpecialQualities(character.race as DndRaceId);
      setRaceSpecialQualities(details);
    } else {
      setRaceSpecialQualities(null);
    }
  }, [character.race]);

  React.useEffect(() => {
    if (character.race) {
      const selectedRaceInfo = DND_RACES.find(r => r.value === character.race);
      if (selectedRaceInfo) {
        const raceKey = selectedRaceInfo.value as DndRaceId;
        const minAdultAge = (DND_RACE_MIN_ADULT_AGE_DATA as Record<DndRaceId, number>)[raceKey];
        if (minAdultAge !== undefined && character.age < minAdultAge) {
          setCharacter(prev => ({ ...prev, age: minAdultAge }));
        }
      }
    }
  }, [character.race, character.age, setCharacter]);

 React.useEffect(() => {
    const characterLevel = character.classes.reduce((sum, c) => sum + c.level, 0) || 1;
    const newGrantedFeatInstances = getGrantedFeatsForCharacter(
      character.race,
      character.classes,
      characterLevel,
      allAvailableFeatDefinitions
    );

    const userChosenFeatInstances = character.feats.filter(fi => !fi.isGranted);
    const combinedFeatInstancesMap = new Map<string, CharacterFeatInstance>();

    newGrantedFeatInstances.forEach(instance => {
        combinedFeatInstancesMap.set(instance.instanceId, instance);
    });

    userChosenFeatInstances.forEach(instance => {
        const definition = allAvailableFeatDefinitions.find(d => d.value === instance.definitionId);
        if (!newGrantedFeatInstances.some(gf => gf.definitionId === instance.definitionId && !definition?.canTakeMultipleTimes)) {
             combinedFeatInstancesMap.set(instance.instanceId, instance);
         }
    });

    setCharacter(prev => ({
        ...prev,
        feats: Array.from(combinedFeatInstancesMap.values()).sort((a, b) => {
            const defA = allAvailableFeatDefinitions.find(d => d.value === a.definitionId);
            const defB = allAvailableFeatDefinitions.find(d => d.value === b.definitionId);
            return (defA?.label || '').localeCompare(defB?.label || '');
        }),
    }));
  }, [character.race, character.classes, allAvailableFeatDefinitions]);

  React.useEffect(() => {
    const barbarianClass = character.classes.find(c => c.className === 'barbarian');
    const barbarianLevel = barbarianClass?.level || 0;
    let grantedDrValue = 0;

    if (barbarianLevel >= 19) grantedDrValue = 5;
    else if (barbarianLevel >= 16) grantedDrValue = 4;
    else if (barbarianLevel >= 13) grantedDrValue = 3;
    else if (barbarianLevel >= 10) grantedDrValue = 2;
    else if (barbarianLevel >= 7) grantedDrValue = 1;

    setCharacter(prev => {
      const existingGrantedBarbDr = prev.damageReduction.find(dr => dr.isGranted && dr.source === 'Barbarian Class');
      let newDrArray = prev.damageReduction.filter(dr => !(dr.isGranted && dr.source === 'Barbarian Class'));

      if (grantedDrValue > 0) {
        const newBarbDrInstance: DamageReductionInstance = {
          id: existingGrantedBarbDr?.id || `granted-barb-dr-${crypto.randomUUID()}`,
          value: grantedDrValue,
          type: 'none',
          rule: 'bypassed-by-type',
          isGranted: true,
          source: 'Barbarian Class'
        };
        newDrArray = [newBarbDrInstance, ...newDrArray];
      }
      return { ...prev, damageReduction: newDrArray };
    });
  }, [character.classes]);

  const prevGlobalCustomSkillDefinitionsRef = React.useRef<CustomSkillDefinition[]>([]);

  React.useEffect(() => {
    if (!isClient) return;

    const currentGlobalDefs = globalCustomSkillDefinitionsFromStore;

    const instancesToAddToCharacter: SkillType[] = [];

    currentGlobalDefs.forEach(globalDef => {
        if (!character.skills.find(s => s.id === globalDef.id)) {
            const isClassSkill = character.classes[0]?.className ?
                (CLASS_SKILLS[character.classes[0]?.className as keyof typeof CLASS_SKILLS] || []).includes(globalDef.id) : false;
            instancesToAddToCharacter.push({
                id: globalDef.id,
                ranks: 0,
                miscModifier: 0,
                isClassSkill: isClassSkill,
            });
        }
    });


    if (instancesToAddToCharacter.length > 0) {
      setCharacter(prevCharacter => {
        const existingSkillIds = new Set(prevCharacter.skills.map(s => s.id));
        const uniqueNewInstances = instancesToAddToCharacter.filter(inst => !existingSkillIds.has(inst.id));

        if (uniqueNewInstances.length === 0) return prevCharacter;

        const updatedSkills = [...prevCharacter.skills, ...uniqueNewInstances].sort((a, b) => {
          const nameA = allAvailableSkillDefinitionsForDisplay.find(d => d.id === a.id)?.name || '';
          const nameB = allAvailableSkillDefinitionsForDisplay.find(d => d.id === b.id)?.name || '';
          return nameA.localeCompare(nameB);
        });
        return { ...prevCharacter, skills: updatedSkills };
      });
    }
    prevGlobalCustomSkillDefinitionsRef.current = currentGlobalDefs;
  }, [
    globalCustomSkillDefinitionsFromStore,
    isClient,
    character.skills,
    character.classes,
    allAvailableSkillDefinitionsForDisplay
  ]);

  React.useEffect(() => {
    let newBaseNotes = '';
    const sizeLabel = SIZES.find(s => s.value === character.size)?.label || character.size || 'Unknown Size';

    if (character.grappleWeaponChoice === 'unarmed') {
      const unarmedDamageDice = getUnarmedGrappleDamage(character.size);
      newBaseNotes = `${unarmedDamageDice} (${sizeLabel} Unarmed)`;
    } else {
      newBaseNotes = character.grappleDamage_baseNotes;
    }

    if (character.grappleDamage_baseNotes !== newBaseNotes) {
      setCharacter(prev => ({
        ...prev,
        grappleDamage_baseNotes: newBaseNotes,
      }));
    }
  }, [character.size, character.grappleWeaponChoice, character.grappleDamage_baseNotes]);


  const handleCoreInfoFieldChange = (field: keyof Character, value: any) => {
     setCharacter(prev => ({ ...prev, [field]: value }));
  };
  
  const handleCharacterFieldUpdate = (field: keyof Character, value: any) => {
     setCharacter(prev => ({ ...prev, [field]: value }));
  };


  const handleResistanceChange = (
    field: ResistanceFieldKeySheet,
    subField: 'customMod',
    value: number
  ) => {
    setCharacter(prev => ({
      ...prev,
      [field]: {
        ...(prev[field] as ResistanceValue),
        [subField]: value,
      },
    }));
  };

  const handleDamageReductionChange = (newDrArray: DamageReductionInstance[]) => {
    setCharacter(prev => ({ ...prev, damageReduction: newDrArray }));
  };

  const handleBaseAbilityScoreChange = (ability: Exclude<AbilityName, 'none'>, value: number) => {
    setCharacter(prev => ({
      ...prev,
      abilityScores: {
        ...prev.abilityScores,
        [ability]: value,
      },
    }));
  };

  const handleAbilityScoreTempCustomModifierChange = (ability: Exclude<AbilityName, 'none'>, value: number) => {
    setCharacter(prev => ({
      ...prev,
      abilityScoreTempCustomModifiers: {
        ...prev.abilityScoreTempCustomModifiers,
        [ability]: value,
      },
    }));
  };


  const handleMultipleBaseAbilityScoresChange = (newScores: AbilityScores) => {
    setCharacter(prev => ({ ...prev, abilityScores: newScores }));
  };


  const handleClassChange = (value: DndClassId | string) => {
    setCharacter(prev => {
      const updatedClasses = [{ ...prev.classes[0], id: prev.classes[0]?.id || crypto.randomUUID(), className: value, level: 1 }];
      const newSkills = prev.skills.map(skillInstance => {
          const isNowClassSkill = value ?
            (CLASS_SKILLS[value as keyof typeof CLASS_SKILLS] || []).includes(skillInstance.id)
            : false;
          return {...skillInstance, isClassSkill: isNowClassSkill };
      }).sort((a, b) => {
        const nameA = allAvailableSkillDefinitionsForDisplay.find(d => d.id === a.id)?.name || '';
        const nameB = allAvailableSkillDefinitionsForDisplay.find(d => d.id === b.id)?.name || '';
        return nameA.localeCompare(nameB);
      });
      return { ...prev, classes: updatedClasses, skills: newSkills };
    });
  };

  const handleSkillChange = (skillId: string, ranks: number, isClassSkill?: boolean) => {
    setCharacter(prev => ({
      ...prev,
      skills: prev.skills.map(s =>
        s.id === skillId ? { ...s, ranks, isClassSkill: isClassSkill !== undefined ? isClassSkill : s.isClassSkill } : s
      ),
    }));
  };

  const handleCustomSkillDefinitionSaveToStore = (skillData: CustomSkillDefinition) => {
    const existing = definitionsActions.getCustomSkillDefinitionById(skillData.id);
    if(existing) {
        definitionsActions.updateCustomSkillDefinition(skillData);
    } else {
        definitionsActions.addCustomSkillDefinition(skillData);
    }
    setIsAddOrEditSkillDialogOpen(false);
    setSkillToEdit(undefined);
  };

  const handleOpenEditCustomSkillDialog = (skillDefId: string) => {
    const customDef = definitionsActions.getCustomSkillDefinitionById(skillDefId);
    if (customDef) {
      setSkillToEdit(customDef);
      setIsAddOrEditSkillDialogOpen(true);
    } else {
      toast({ title: "Error", description: "Could not find custom skill definition to edit.", variant: "destructive" });
    }
  };


  const handleFeatInstancesChange = (updatedFeatInstances: CharacterFeatInstance[]) => {
    setCharacter(prev => ({ ...prev, feats: updatedFeatInstances }));
  };

  const handleCustomFeatDefinitionSaveToStore = (featDefData: (FeatDefinitionJsonData & { isCustom: true })) => {
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
  };

  const handleOpenEditCustomFeatDefinitionDialog = (definitionId: string) => {
    const defToEdit = definitionsActions.getCustomFeatDefinitionById(definitionId);
    if (defToEdit) {
      setEditingCustomFeatDefinition(defToEdit);
      setIsCustomFeatDialogOpen(true);
    } else {
      toast({ title: "Error", description: "Could not find custom feat definition to edit.", variant: "destructive" });
    }
  };

  const allSkillOptionsForDialog = React.useMemo(() => {
    return allAvailableSkillDefinitionsForDisplay
      .filter(skill => skill.id !== skillToEdit?.id)
      .map(s => ({ value: s.id, label: s.name }))
      .sort((a,b) => a.label.localeCompare(b.label));
  }, [allAvailableSkillDefinitionsForDisplay, skillToEdit]);


  const handlePortraitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setCharacter(prev => ({ ...prev, portraitDataUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } else {
      setCharacter(prev => ({ ...prev, portraitDataUrl: undefined }));
    }
  };

  const handleSavingThrowMiscModChange = (saveType: SavingThrowType, value: number) => {
    setCharacter(prev => ({
      ...prev,
      savingThrows: {
        ...prev.savingThrows,
        [saveType]: {
          ...prev.savingThrows[saveType],
          miscMod: value,
        },
      },
    }));
  };

  const handleCancel = () => { router.push('/'); };

  // Info Dialog Open Handlers
  const openInfoDialog = (contentType: InfoDialogContentType) => {
    setActiveInfoDialogType(contentType);
    setIsInfoDialogOpen(true);
  };
  
  const handleOpenRaceInfoDialog = () => {
    if (character.race) {
        openInfoDialog({ type: 'race' });
    }
  };
  const handleOpenClassInfoDialog = () => {
    if (character.classes[0]?.className) {
        openInfoDialog({ type: 'class' });
    }
  };
  const handleOpenAlignmentInfoDialog = () => openInfoDialog({ type: 'alignmentSummary' });
  const handleOpenDeityInfoDialog = () => openInfoDialog({ type: 'deity' });
  const handleOpenAbilityScoreBreakdownDialog = (ability: Exclude<AbilityName, 'none'>) => {
    openInfoDialog({ type: 'abilityScoreBreakdown', abilityName: ability });
  };
  const handleOpenCombatStatInfoDialog = (contentType: InfoDialogContentType) => {
    openInfoDialog(contentType);
  };
  const handleOpenSkillInfoDialog = (skillId: string) => {
    openInfoDialog({ type: 'skillModifierBreakdown', skillId });
  };
  const handleOpenAcBreakdownDialog = (acType: 'Normal' | 'Touch' | 'Flat-Footed') => {
    openInfoDialog({ type: 'acBreakdown', acType });
  };
  const handleOpenResistanceInfoDialog = (resistanceField: ResistanceFieldKeySheet) => {
    openInfoDialog({ type: 'resistanceBreakdown', resistanceField });
  };


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!character.name || character.name.trim() === '') { toast({ title: "Missing Information", description: "Please enter a character name.", variant: "destructive" }); return; }
    if (!character.race || character.race.trim() === '') { toast({ title: "Missing Information", description: "Please select or enter a character race.", variant: "destructive" }); return; }
    if (!character.classes[0]?.className || character.classes[0]?.className.trim() === '') { toast({ title: "Missing Information", description: "Please select or enter a character class.", variant: "destructive" }); return; }
    if (!character.alignment) { toast({ title: "Missing Information", description: "Please select an alignment.", variant: "destructive" }); return; }

    const selectedRaceInfoForValidation = DND_RACES.find(r => r.value === character.race);
    const minAgeForValidation = (selectedRaceInfoForValidation ? (DND_RACE_MIN_ADULT_AGE_DATA as Record<DndRaceId, number>)[selectedRaceInfoForValidation.value as DndRaceId] : undefined) || 1;
    if (character.age < minAgeForValidation) { toast({ title: "Invalid Age", description: `Age must be at least ${minAgeForValidation}${selectedRaceInfoForValidation ? ` for a ${selectedRaceInfoForValidation.label}` : ''}.`, variant: "destructive" }); return; }

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
  };

  const selectedClassInfo = React.useMemo(() => DND_CLASSES.find(c => c.value === character.classes[0]?.className), [character.classes[0]?.className]);
  const isPredefinedClass = !!selectedClassInfo;

  const selectedRaceInfo = React.useMemo(() =>
    DND_RACES.find(r => r.value === character.race),
  [character.race]);
  const isPredefinedRace = !!selectedRaceInfo;


  const currentMinAgeForInput = React.useMemo(() => {
    if (character.race) {
      const raceInfoForMinAge = DND_RACES.find(r => r.value === character.race);
      if (raceInfoForMinAge) { return (DND_RACE_MIN_ADULT_AGE_DATA as Record<DndRaceId, number>)[raceInfoForMinAge.value as DndRaceId] || 1; }
    }
    return 1;
  }, [character.race]);


  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        <CharacterFormCoreInfoSection
          characterData={{
            name: character.name,
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
          selectedClassInfo={selectedClassInfo}
          isPredefinedRace={isPredefinedRace}
          isPredefinedClass={isPredefinedClass}
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
            abilityScores: character.abilityScores, // Pass base scores via character object
            classes: character.classes,
            race: character.race,
            size: character.size,
            feats: character.feats,
          }}
          actualAbilityScores={actualAbilityScoresForSavesAndSkills} // Pass calculated scores separately
          allFeatDefinitions={allAvailableFeatDefinitions}
          allPredefinedSkillDefinitions={SKILL_DEFINITIONS}
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
          abilityScores={actualAbilityScoresForSavesAndSkills} // This is the final calculated score
          skills={character.skills}
          allPredefinedSkillDefinitions={SKILL_DEFINITIONS}
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
          <ArmorClassPanel
            character={character}
            onCharacterUpdate={handleCharacterFieldUpdate}
            onOpenAcBreakdownDialog={handleOpenAcBreakdownDialog}
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


        <Separator className="my-10" />

        <div className="space-y-4 p-4 border rounded-lg shadow-sm bg-card">
            <h3 className="text-xl font-serif text-foreground/80 flex items-center">
                <Settings className="mr-3 h-6 w-6 text-primary/70" />
                Dungeon Master Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-2">
                    <Label htmlFor="dm-reroll-ones" className="flex items-center">
                        <Checkbox
                            id="dm-reroll-ones"
                            checked={rerollOnesForAbilityScores}
                            onCheckedChange={definitionsActions.toggleRerollOnesForAbilityScores}
                            className="mr-2"
                        />
                        Reroll 1s for Ability Score Rolls
                    </Label>
                    <p className="text-xs text-muted-foreground pl-6">
                        When using 4d6 drop lowest, reroll any die that shows a 1 until it is not a 1.
                    </p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dm-point-buy-budget" className="flex items-center">
                        <Calculator className="mr-2 h-4 w-4 text-muted-foreground" />
                        Point Buy Budget for Ability Scores
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
                        Default is 25 points for standard D&D 3.5 point buy.
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
                    <BookOpenCheck className="mr-2 h-5 w-5" /> Add New Custom Skill Definition
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setEditingCustomFeatDefinition(undefined); setIsCustomFeatDialogOpen(true); }}
                    className="w-full sm:w-auto"
                >
                    <ShieldPlus className="mr-2 h-5 w-5" /> Add New Custom Feat Definition
                </Button>
            </div>
        </div>


        <div className="flex flex-col-reverse md:flex-row md:justify-between gap-4 mt-12 pt-8 border-t">
          <Button type="button" variant="outline" size="lg" onClick={handleCancel} className="w-full md:w-auto">
            Cancel
          </Button>
          <Button type="submit" size="lg" className="w-full md:w-auto shadow-md hover:shadow-lg transition-shadow">
            {isCreating ? 'Create Character' : 'Save Changes'}
          </Button>
        </div>
      </form>

      {isInfoDialogOpen && activeInfoDialogType && (
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
        allFeats={DND_FEATS_DEFINITIONS}
        allSkills={allSkillOptionsForDialog}
        allClasses={DND_CLASSES}
        allRaces={DND_RACES}
      />
    </>
  );
}
