
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
  SpeedDetails, SpeedType, CharacterAlignment
} from '@/types/character';
import {
  getNetAgingEffects,
  getRaceSpecialQualities,
  getInitialCharacterSkills,
  getGrantedFeatsForCharacter,
  calculateDetailedAbilityScores,
  getRaceSkillPointsBonusPerLevel,
  ABILITY_ORDER_INTERNAL
} from '@/types/character';
import { getUnarmedGrappleDamage } from '@/lib/dnd-utils';

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
import { Separator } from '@/components/ui/separator';
import { BookOpenCheck, ShieldPlus, Zap, ShieldCheck, Settings, Calculator, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Skeleton } from '@/components/ui/skeleton';


interface CharacterFormCoreProps {
  initialCharacter?: Character;
  onSave: (character: Character) => void;
  isCreating: boolean;
}

const abilityNames: Exclude<AbilityName, 'none'>[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

export function CharacterFormCore({ initialCharacter, onSave, isCreating }: CharacterFormCoreProps) {
  const { translations, isLoading: translationsLoading } = useI18n();
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
  } else {
    numericPointBuyBudgetFromStore = 25;
  }
  const pointBuyBudget = isClient ? numericPointBuyBudgetFromStore : 25;

  const [character, setCharacter] = React.useState<Character | null>(null);

  React.useEffect(() => {
    if (translationsLoading || !translations || !isClient) return;

    const {
      DEFAULT_ABILITIES: DEFAULT_ABILITIES_DATA,
      DEFAULT_SAVING_THROWS: DEFAULT_SAVING_THROWS_DATA,
      DEFAULT_RESISTANCE_VALUE: DEFAULT_RESISTANCE_VALUE_DATA,
      DEFAULT_SPEED_DETAILS: DEFAULT_SPEED_DETAILS_DATA,
      DEFAULT_SPEED_PENALTIES: DEFAULT_SPEED_PENALTIES_DATA,
      DND_FEATS_DEFINITIONS, DND_RACES, DND_CLASSES, SKILL_DEFINITIONS, CLASS_SKILLS, SIZES
    } = translations;

    const defaultBaseAbilityScores = { ...(JSON.parse(JSON.stringify(DEFAULT_ABILITIES_DATA)) as AbilityScores) };
    const defaultTempCustomMods: AbilityScores = { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 };
    const defaultClasses: CharacterClass[] = [{ id: crypto.randomUUID(), className: DND_CLASSES[0]?.value || '', level: 1 }];
    const defaultSize: CharacterSize = 'medium';
    const sizeLabel = SIZES.find(s => s.value === defaultSize)?.label || defaultSize;
    const defaultUnarmedGrappleDice = getUnarmedGrappleDamage(defaultSize, SIZES);


    const allInitialFeatDefsForGranting = [
        ...DND_FEATS_DEFINITIONS.map(def => ({ ...def, isCustom: false as const })),
        ...(isCreating ? globalCustomFeatDefinitionsFromStore : (initialCharacter?.feats.filter(f => f.isGranted && allInitialFeatDefsForGranting.find(fd => fd.value === f.definitionId && fd.isCustom)).map(f => globalCustomFeatDefinitionsFromStore.find(cfd => cfd.value === f.definitionId)).filter(Boolean) as (FeatDefinitionJsonData & { isCustom: true })[] || []))
    ];

    const initialFeats = getGrantedFeatsForCharacter(
      initialCharacter?.race || DND_RACES[0]?.value || '',
      initialCharacter?.classes || defaultClasses,
      initialCharacter?.classes?.reduce((sum, c) => sum + c.level, 0) || 1,
      allInitialFeatDefsForGranting, DND_RACES, DND_CLASSES
    );

    let initialSkills = initialCharacter?.skills || getInitialCharacterSkills(defaultClasses, SKILL_DEFINITIONS, CLASS_SKILLS);

    const baseCharData: Character = {
      id: crypto.randomUUID(),
      name: '',
      playerName: '',
      campaign: '',
      race: DND_RACES[0]?.value || '', alignment: 'true-neutral' as CharacterAlignment, deity: '', size: defaultSize, age: 20, gender: '',
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
      savingThrows: JSON.parse(JSON.stringify(DEFAULT_SAVING_THROWS_DATA)),
      classes: defaultClasses,
      skills: initialSkills,
      feats: initialFeats,
      inventory: [], personalStory: '', portraitDataUrl: undefined,
      fireResistance: { ...DEFAULT_RESISTANCE_VALUE_DATA },
      coldResistance: { ...DEFAULT_RESISTANCE_VALUE_DATA },
      acidResistance: { ...DEFAULT_RESISTANCE_VALUE_DATA },
      electricityResistance: { ...DEFAULT_RESISTANCE_VALUE_DATA },
      sonicResistance: { ...DEFAULT_RESISTANCE_VALUE_DATA },
      spellResistance: { ...DEFAULT_RESISTANCE_VALUE_DATA },
      powerResistance: { ...DEFAULT_RESISTANCE_VALUE_DATA },
      damageReduction: [],
      fortification: { ...DEFAULT_RESISTANCE_VALUE_DATA },
      landSpeed: { ...DEFAULT_SPEED_DETAILS_DATA },
      burrowSpeed: { ...DEFAULT_SPEED_DETAILS_DATA },
      climbSpeed: { ...DEFAULT_SPEED_DETAILS_DATA },
      flySpeed: { ...DEFAULT_SPEED_DETAILS_DATA },
      swimSpeed: { ...DEFAULT_SPEED_DETAILS_DATA },
      armorSpeedPenalty: DEFAULT_SPEED_PENALTIES_DATA.armorSpeedPenalty,
      loadSpeedPenalty: DEFAULT_SPEED_PENALTIES_DATA.loadSpeedPenalty,
    };

    if (initialCharacter) {
      setCharacter({
        ...baseCharData,
        ...initialCharacter,
        playerName: initialCharacter.playerName || '',
        campaign: initialCharacter.campaign || '',
        race: initialCharacter.race || DND_RACES[0]?.value || '',
        alignment: initialCharacter.alignment || 'true-neutral',
        abilityScores: initialCharacter.abilityScores || defaultBaseAbilityScores,
        abilityScoreTempCustomModifiers: initialCharacter.abilityScoreTempCustomModifiers || defaultTempCustomMods,
        savingThrows: initialCharacter.savingThrows || JSON.parse(JSON.stringify(DEFAULT_SAVING_THROWS_DATA)),
        classes: initialCharacter.classes && initialCharacter.classes.length > 0 ? initialCharacter.classes : defaultClasses,
        skills: initialCharacter.skills || initialSkills,
        feats: initialCharacter.feats || initialFeats,
        fireResistance: initialCharacter.fireResistance || { ...DEFAULT_RESISTANCE_VALUE_DATA },
        coldResistance: initialCharacter.coldResistance || { ...DEFAULT_RESISTANCE_VALUE_DATA },
        acidResistance: initialCharacter.acidResistance || { ...DEFAULT_RESISTANCE_VALUE_DATA },
        electricityResistance: initialCharacter.electricityResistance || { ...DEFAULT_RESISTANCE_VALUE_DATA },
        sonicResistance: initialCharacter.sonicResistance || { ...DEFAULT_RESISTANCE_VALUE_DATA },
        spellResistance: initialCharacter.spellResistance || { ...DEFAULT_RESISTANCE_VALUE_DATA },
        powerResistance: initialCharacter.powerResistance || { ...DEFAULT_RESISTANCE_VALUE_DATA },
        damageReduction: initialCharacter.damageReduction || [],
        fortification: initialCharacter.fortification || { ...DEFAULT_RESISTANCE_VALUE_DATA },
        grappleWeaponChoice: initialCharacter.grappleWeaponChoice || 'unarmed',
        height: initialCharacter.height || '',
        weight: initialCharacter.weight || '',
        eyes: initialCharacter.eyes || '',
        hair: initialCharacter.hair || '',
        skin: initialCharacter.skin || '',
        landSpeed: initialCharacter.landSpeed || { ...DEFAULT_SPEED_DETAILS_DATA },
        burrowSpeed: initialCharacter.burrowSpeed || { ...DEFAULT_SPEED_DETAILS_DATA },
        climbSpeed: initialCharacter.climbSpeed || { ...DEFAULT_SPEED_DETAILS_DATA },
        flySpeed: initialCharacter.flySpeed || { ...DEFAULT_SPEED_DETAILS_DATA },
        swimSpeed: initialCharacter.swimSpeed || { ...DEFAULT_SPEED_DETAILS_DATA },
        armorSpeedPenalty: initialCharacter.armorSpeedPenalty ?? DEFAULT_SPEED_PENALTIES_DATA.armorSpeedPenalty,
        loadSpeedPenalty: initialCharacter.loadSpeedPenalty ?? DEFAULT_SPEED_PENALTIES_DATA.loadSpeedPenalty,
      });
    } else {
      setCharacter(baseCharData);
    }
  }, [isClient, translationsLoading, translations, initialCharacter, isCreating, globalCustomFeatDefinitionsFromStore]);


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
    if (translationsLoading || !translations) return [];
    const predefined = translations.DND_FEATS_DEFINITIONS.map(def => ({ ...def, isCustom: false as const }));
    return [...predefined, ...globalCustomFeatDefinitions];
  }, [translationsLoading, translations, globalCustomFeatDefinitions]);

  const allAvailableSkillDefinitionsForDisplay = React.useMemo(() => {
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
  }, [character, translations]);

  React.useEffect(() => {
    if (character && character.race && translations) {
      const details = getRaceSpecialQualities(
        character.race as DndRaceId,
        translations.DND_RACES,
        translations.DND_RACE_ABILITY_MODIFIERS_DATA,
        translations.SKILL_DEFINITIONS,
        translations.DND_FEATS_DEFINITIONS,
        translations.ABILITY_LABELS
      );
      setRaceSpecialQualities(details);
    } else {
      setRaceSpecialQualities(null);
    }
  }, [character, translations]);

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
  }, [character, translations, setCharacter]);

 React.useEffect(() => {
    if (!character || !translations) return;
    const characterLevel = character.classes.reduce((sum, c) => sum + c.level, 0) || 1;
    const newGrantedFeatInstances = getGrantedFeatsForCharacter(
      character.race,
      character.classes,
      characterLevel,
      allAvailableFeatDefinitions,
      translations.DND_RACES,
      translations.DND_CLASSES
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

    setCharacter(prev => prev ? ({
        ...prev,
        feats: Array.from(combinedFeatInstancesMap.values()).sort((a, b) => {
            const defA = allAvailableFeatDefinitions.find(d => d.value === a.definitionId);
            const defB = allAvailableFeatDefinitions.find(d => d.value === b.definitionId);
            return (defA?.label || '').localeCompare(defB?.label || '');
        }),
    }) : null);
  }, [character?.race, character?.classes, allAvailableFeatDefinitions, translations]); 

  React.useEffect(() => {
    if (!character) return;
    const barbarianClass = character.classes.find(c => c.className === 'barbarian');
    const barbarianLevel = barbarianClass?.level || 0;
    let grantedDrValue = 0;

    if (barbarianLevel >= 19) grantedDrValue = 5;
    else if (barbarianLevel >= 16) grantedDrValue = 4;
    else if (barbarianLevel >= 13) grantedDrValue = 3;
    else if (barbarianLevel >= 10) grantedDrValue = 2;
    else if (barbarianLevel >= 7) grantedDrValue = 1;

    setCharacter(prev => {
      if (!prev) return null;
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
  }, [character?.classes]);

  const prevGlobalCustomSkillDefinitionsRef = React.useRef<CustomSkillDefinition[]>([]);
  React.useEffect(() => {
    if (!isClient || !character || !translations) return;

    const currentGlobalDefs = globalCustomSkillDefinitionsFromStore;
    const instancesToAddToCharacter: SkillType[] = [];

    currentGlobalDefs.forEach(globalDef => {
        if (!character.skills.find(s => s.id === globalDef.id)) {
            const isClassSkill = character.classes[0]?.className ?
                (translations.CLASS_SKILLS[character.classes[0]?.className as keyof typeof translations.CLASS_SKILLS] || []).includes(globalDef.id) : false;
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
        if (!prevCharacter) return null;
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
  }, [ globalCustomSkillDefinitionsFromStore, isClient, character?.skills, character?.classes, allAvailableSkillDefinitionsForDisplay, translations ]);

  React.useEffect(() => {
    if (!character || !translations) return;
    let newBaseNotes = '';
    const sizeLabel = translations.SIZES.find(s => s.value === character.size)?.label || character.size || 'Unknown Size';

    if (character.grappleWeaponChoice === 'unarmed') {
      const unarmedDamageDice = getUnarmedGrappleDamage(character.size, translations.SIZES);
      newBaseNotes = `${unarmedDamageDice} (${sizeLabel} Unarmed)`;
    } else {
      newBaseNotes = character.grappleDamage_baseNotes;
    }

    if (character.grappleDamage_baseNotes !== newBaseNotes) {
      setCharacter(prev => prev ? ({ ...prev, grappleDamage_baseNotes: newBaseNotes }) : null);
    }
  }, [character?.size, character?.grappleWeaponChoice, character?.grappleDamage_baseNotes, translations]);

  const handleCoreInfoFieldChange = (field: keyof Character, value: any) => {
     setCharacter(prev => prev ? ({ ...prev, [field]: value }) : null);
  };
  
  const handleCharacterFieldUpdate = (
    field: keyof Character | `${SpeedType}Speed.miscModifier`,
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
        }
        return { ...prev, [field as keyof Character]: value };
     });
  };

  const handleResistanceChange = (
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
  };

  const handleDamageReductionChange = (newDrArray: DamageReductionInstance[]) => {
    setCharacter(prev => prev ? ({ ...prev, damageReduction: newDrArray }) : null);
  };

  const handleBaseAbilityScoreChange = (ability: Exclude<AbilityName, 'none'>, value: number) => {
    setCharacter(prev => prev ? ({
      ...prev,
      abilityScores: {
        ...prev.abilityScores,
        [ability]: value,
      },
    }) : null);
  };

  const handleAbilityScoreTempCustomModifierChange = (ability: Exclude<AbilityName, 'none'>, value: number) => {
    setCharacter(prev => prev ? ({
      ...prev,
      abilityScoreTempCustomModifiers: {
        ...prev.abilityScoreTempCustomModifiers,
        [ability]: value,
      },
    }) : null);
  };

  const handleMultipleBaseAbilityScoresChange = (newScores: AbilityScores) => {
    setCharacter(prev => prev ? ({ ...prev, abilityScores: newScores }) : null);
  };

  const handleClassChange = (value: DndClassId | string) => {
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
      return { ...prev, classes: updatedClasses, skills: newSkills };
    });
  };

  const handleSkillChange = (skillId: string, ranks: number, isClassSkill?: boolean) => {
    setCharacter(prev => prev ? ({
      ...prev,
      skills: prev.skills.map(s =>
        s.id === skillId ? { ...s, ranks, isClassSkill: isClassSkill !== undefined ? isClassSkill : s.isClassSkill } : s
      ),
    }) : null);
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
    setCharacter(prev => prev ? ({ ...prev, feats: updatedFeatInstances }) : null);
  };

  const handleCustomFeatDefinitionSaveToStore = (featDefData: (FeatDefinitionJsonData & { isCustom: true })) => {
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
        setCharacter(prev => prev ? ({ ...prev, portraitDataUrl: reader.result as string }) : null);
      };
      reader.readAsDataURL(file);
    } else {
      setCharacter(prev => prev ? ({ ...prev, portraitDataUrl: undefined }) : null);
    }
  };

  const handleSavingThrowMiscModChange = (saveType: SavingThrowType, value: number) => {
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
  };

  const handleCancel = () => { router.push('/'); };

  const openInfoDialog = (contentType: InfoDialogContentType) => { setActiveInfoDialogType(contentType); setIsInfoDialogOpen(true); };
  const handleOpenRaceInfoDialog = () => { if (character?.race) { openInfoDialog({ type: 'race' }); } };
  const handleOpenClassInfoDialog = () => { if (character?.classes[0]?.className) { openInfoDialog({ type: 'class' }); } };
  const handleOpenAlignmentInfoDialog = () => openInfoDialog({ type: 'alignmentSummary' });
  const handleOpenDeityInfoDialog = () => openInfoDialog({ type: 'deity' });
  const handleOpenAbilityScoreBreakdownDialog = (ability: Exclude<AbilityName, 'none'>) => { openInfoDialog({ type: 'abilityScoreBreakdown', abilityName: ability }); };
  const handleOpenCombatStatInfoDialog = (contentType: InfoDialogContentType) => { openInfoDialog(contentType); };
  const handleOpenSkillInfoDialog = (skillId: string) => { openInfoDialog({ type: 'skillModifierBreakdown', skillId }); };
  const handleOpenAcBreakdownDialog = (acType: 'Normal' | 'Touch' | 'Flat-Footed') => { openInfoDialog({ type: 'acBreakdown', acType }); };
  const handleOpenResistanceInfoDialog = (resistanceField: ResistanceFieldKeySheet) => { openInfoDialog({ type: 'resistanceBreakdown', resistanceField }); };
  const handleOpenSpeedInfoDialog = (speedType: SpeedType) => { openInfoDialog({ type: 'speedBreakdown', speedType }); };

  const handleSubmit = (e: FormEvent) => {
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
  };

  if (translationsLoading || !translations || !character) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center space-x-3"> <Skeleton className="h-8 w-8 rounded-full" /> <Skeleton className="h-7 w-1/3" /> </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <div className="flex justify-between mt-12 pt-8 border-t"> <Skeleton className="h-12 w-24" /> <Skeleton className="h-12 w-36" /> </div>
      </div>
    );
  }

  const selectedClassInfo = translations.DND_CLASSES.find(c => c.value === character.classes[0]?.className);
  const isPredefinedRace = !!translations.DND_RACES.find(r => r.value === character.race);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ArmorClassPanel
            character={character}
            onCharacterUpdate={handleCharacterFieldUpdate}
            onOpenAcBreakdownDialog={handleOpenAcBreakdownDialog}
          />
          <SpeedPanel
            character={character}
            onCharacterUpdate={handleCharacterFieldUpdate}
            onOpenSpeedInfoDialog={handleOpenSpeedInfoDialog}
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
                        Default is 25 points for standard D&amp;D 3.5 point buy.
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
        allFeats={translations.DND_FEATS_DEFINITIONS}
        allSkills={allSkillOptionsForDialog}
        allClasses={translations.DND_CLASSES}
        allRaces={translations.DND_RACES}
      />
    </>
  );
}
