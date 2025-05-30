
'use client';

import * as React from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type {
  AbilityName, Character, CharacterClass, CharacterAlignment, CharacterSize,
  AgingEffectsDetails, DndRaceId, SizeAbilityEffectsDetails, RaceSpecialQualities, AbilityScores,
  Skill as SkillType, DndClassId, CustomSynergyRule, DndDeityId, GenderId, Feat as FeatType,
  DndRaceOption, DetailedAbilityScores, AbilityScoreBreakdown, CharacterAlignmentObject, DndClassOption, DndDeityOption
} from '@/types/character';
import {
  SIZES,
  ALIGNMENTS,
  DND_RACES,
  DND_CLASSES,
  getNetAgingEffects,
  GENDERS,
  DND_DEITIES,
  getSizeAbilityEffects,
  getRaceSpecialQualities,
  getInitialCharacterSkills,
  SKILL_DEFINITIONS,
  DND_FEATS,
  getGrantedFeatsForCharacter,
  calculateDetailedAbilityScores,
  DEFAULT_ABILITIES, // Import directly
  DEFAULT_SAVING_THROWS, // Import directly
  DND_RACE_MIN_ADULT_AGE_DATA // Import directly
} from '@/types/character';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { AbilityScoreRollerDialog } from '@/components/AbilityScoreRollerDialog';
import { InfoDisplayDialog } from '@/components/InfoDisplayDialog';
import { CharacterFormCoreInfoSection } from '@/components/form-sections/CharacterFormCoreInfoSection';
import { CharacterFormAbilityScoresSection } from '@/components/form-sections/CharacterFormAbilityScoresSection';
import { CharacterFormStoryPortraitSection } from '@/components/form-sections/CharacterFormStoryPortraitSection';
import { SkillsFormSection } from '@/components/SkillsFormSection';
import { FeatsFormSection } from '@/components/FeatsFormSection';

interface CharacterFormCoreProps {
  initialCharacter?: Character;
  onSave: (character: Character) => void;
  isCreating: boolean;
}

const abilityNames: Exclude<AbilityName, 'none'>[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

export function CharacterFormCore({ initialCharacter, onSave, isCreating }: CharacterFormCoreProps) {
  const [character, setCharacter] = React.useState<Character>(() => {
    const defaultBaseAbilityScores = { ...(JSON.parse(JSON.stringify(DEFAULT_ABILITIES)) as AbilityScores) };
    const defaultClasses: CharacterClass[] = [{ id: crypto.randomUUID(), className: '', level: 1 }];

    const tempCharForInitialFeats: Character = {
      id: crypto.randomUUID(), name: '', race: '', alignment: 'true-neutral', deity: '', size: 'medium', age: 20, gender: '',
      abilityScores: defaultBaseAbilityScores,
      hp: 10, maxHp: 10, armorBonus: 0, shieldBonus: 0, sizeModifierAC: 0, naturalArmor: 0,
      deflectionBonus: 0, dodgeBonus: 0, acMiscModifier: 0, initiativeMiscModifier: 0,
      savingThrows: JSON.parse(JSON.stringify(DEFAULT_SAVING_THROWS)),
      classes: defaultClasses, skills: [], feats: [], inventory: [],
    }
    const initialFeats = getGrantedFeatsForCharacter(tempCharForInitialFeats.race, tempCharForInitialFeats.classes, 1);

    return initialCharacter || {
      id: crypto.randomUUID(),
      name: '', race: '', alignment: 'true-neutral', deity: '', size: 'medium', age: 20, gender: '',
      abilityScores: defaultBaseAbilityScores, hp: 10, maxHp: 10,
      armorBonus: 0, shieldBonus: 0, sizeModifierAC: 0, naturalArmor: 0,
      deflectionBonus: 0, dodgeBonus: 0, acMiscModifier: 0, initiativeMiscModifier: 0,
      savingThrows: JSON.parse(JSON.stringify(DEFAULT_SAVING_THROWS)),
      classes: defaultClasses,
      skills: getInitialCharacterSkills(defaultClasses),
      feats: initialFeats, inventory: [], personalStory: '', portraitDataUrl: undefined,
    };
  });

  const [ageEffectsDetails, setAgeEffectsDetails] = React.useState<AgingEffectsDetails | null>(null);
  const [sizeAbilityEffectsDetails, setSizeAbilityEffectsDetails] = React.useState<SizeAbilityEffectsDetails | null>(null);
  const [raceSpecialQualities, setRaceSpecialQualities] = React.useState<RaceSpecialQualities | null>(null);
  const [isRollerDialogOpen, setIsRollerDialogOpen] = React.useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = React.useState(false);
  const [currentInfoDialogData, setCurrentInfoDialogData] = React.useState<{
    title?: string; content?: string;
    abilityModifiers?: RaceSpecialQualities['abilityEffects'];
    skillBonuses?: RaceSpecialQualities['skillBonuses'],
    grantedFeats?: RaceSpecialQualities['grantedFeats'],
    bonusFeatSlots?: number,
    abilityScoreBreakdown?: AbilityScoreBreakdown,
    detailsList?: Array<{ label: string; value: string; isBold?: boolean }>
  } | null>(null);
  const [detailedAbilityScores, setDetailedAbilityScores] = React.useState<DetailedAbilityScores | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  // Recalculate detailed ability scores whenever character data changes
  React.useEffect(() => {
    setDetailedAbilityScores(calculateDetailedAbilityScores(character));
  }, [character]);

  const actualAbilityScoresForSkills = React.useMemo(() => {
    if (!detailedAbilityScores) {
      // Fallback to base scores if detailed scores aren't computed yet
      // This can happen on initial render or if `character` isn't fully defined
      return character.abilityScores;
    }
    const finalScores: Partial<AbilityScores> = {};
    for (const ability of abilityNames) {
      if (ability === 'none') continue;
      finalScores[ability] = detailedAbilityScores[ability].finalScore;
    }
    return finalScores as AbilityScores;
  }, [detailedAbilityScores, character.abilityScores]);


  // Age effects
  React.useEffect(() => {
    if (character.race && character.age > 0) {
      const details = getNetAgingEffects(character.race as DndRaceId, character.age);
      setAgeEffectsDetails(details);
    } else {
      setAgeEffectsDetails(null);
    }
  }, [character.age, character.race]);

  // Size effects
  React.useEffect(() => {
    if (character.size) {
      const details = getSizeAbilityEffects(character.size as CharacterSize);
      setSizeAbilityEffectsDetails(details);
    } else {
      setSizeAbilityEffectsDetails(null);
    }
  }, [character.size]);

  // Race special qualities (including ability mods)
  React.useEffect(() => {
    if (character.race) {
      const details = getRaceSpecialQualities(character.race as DndRaceId);
      setRaceSpecialQualities(details);
    } else {
      setRaceSpecialQualities(null);
    }
  }, [character.race]);

  // Adjust age based on race's minimum adult age
  React.useEffect(() => {
    if (character.race) {
      const selectedRaceInfo = DND_RACES.find(r => r.value === character.race);
      if (selectedRaceInfo) {
        const raceKey = selectedRaceInfo.value as DndRaceId;
        const minAdultAge = DND_RACE_MIN_ADULT_AGE_DATA[raceKey];
        if (minAdultAge !== undefined && character.age < minAdultAge) {
          setCharacter(prev => ({ ...prev, age: minAdultAge }));
        }
      }
    } else {
      if (character.age !== 20 && isCreating && character.race === '') {
        setCharacter(prev => ({ ...prev, age: 20 }));
      }
    }
  }, [character.race, isCreating, character.age]);


  // Update skills and granted feats when class or race changes
  React.useEffect(() => {
    const existingCustomSkillsMap = new Map<string, Partial<SkillType>>();
    character.skills.forEach(skill => {
      if (!SKILL_DEFINITIONS.some(def => def.value === skill.id)) {
        existingCustomSkillsMap.set(skill.id, {
          name: skill.name, keyAbility: skill.keyAbility, isClassSkill: skill.isClassSkill,
          providesSynergies: skill.providesSynergies, description: skill.description,
          ranks: 0, // Reset ranks for custom skills
        });
      }
    });

    const newPredefinedSkills = getInitialCharacterSkills(character.classes);
    const finalSkillsMap = new Map<string, SkillType>();

    newPredefinedSkills.forEach(predefinedSkill => {
      finalSkillsMap.set(predefinedSkill.id, {
        ...predefinedSkill,
        ranks: 0,
        miscModifier: 0,
      });
    });

    existingCustomSkillsMap.forEach((customSkillData, skillId) => {
      finalSkillsMap.set(skillId, {
        id: skillId, name: customSkillData.name!, keyAbility: customSkillData.keyAbility!,
        isClassSkill: customSkillData.isClassSkill!,
        providesSynergies: customSkillData.providesSynergies,
        description: customSkillData.description,
        ranks: 0,
        miscModifier: 0,
      });
    });

    const characterLevel = character.classes.reduce((sum, c) => sum + c.level, 0) || 1;
    const newGrantedFeats = getGrantedFeatsForCharacter(character.race, character.classes, characterLevel);

    const userChosenFeats = character.feats.filter(feat => !feat.isGranted);

    const combinedFeatsMap = new Map<string, FeatType>();
    newGrantedFeats.forEach(feat => combinedFeatsMap.set(feat.id, feat));
    userChosenFeats.forEach(feat => {
      const featDef = DND_FEATS.find(f => f.value === feat.id.split('-MULTI-INSTANCE-')[0]);
      const featIdToStore = feat.id;

      if (!combinedFeatsMap.has(featIdToStore) || (featDef?.canTakeMultipleTimes)) {
        const baseGrantedId = featIdToStore.split('-MULTI-INSTANCE-')[0];
        if (!newGrantedFeats.some(gf => gf.id === baseGrantedId && !featDef?.canTakeMultipleTimes)) {
            combinedFeatsMap.set(featIdToStore, { ...feat, isGranted: false });
        }
      }
    });

    setCharacter(prev => ({
      ...prev,
      skills: Array.from(finalSkillsMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
      feats: Array.from(combinedFeatsMap.values()),
    }));
  }, [character.classes[0]?.className, character.race]); // Only depends on className and race for re-initialization


  const handleChange = (field: keyof Character, value: any) => {
     setCharacter(prev => ({ ...prev, [field]: value }));
  };

  const handleCoreInfoFieldChange = (field: keyof Character, value: any) => {
     setCharacter(prev => ({ ...prev, [field]: value }));
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

  const handleApplyRolledScores = (newScores: AbilityScores) => {
    setCharacter(prev => ({ ...prev, abilityScores: newScores }));
    setIsRollerDialogOpen(false);
  };

  const handleClassChange = (value: DndClassId | string) => {
    setCharacter(prev => {
      const updatedClasses = [{ ...prev.classes[0], id: prev.classes[0]?.id || crypto.randomUUID(), className: value, level: 1 }];
      return { ...prev, classes: updatedClasses };
    });
  };

  const handleSkillChange = (skillId: string, ranks: number) => {
    setCharacter(prev => ({
      ...prev,
      skills: prev.skills.map(s =>
        s.id === skillId ? { ...s, ranks } : s
      ),
    }));
  };

  const handleCustomSkillAdd = (skillData: { name: string; keyAbility: AbilityName; isClassSkill: boolean; providesSynergies: CustomSynergyRule[]; description?: string; }) => {
    const newSkill: SkillType = {
      id: crypto.randomUUID(), name: skillData.name, keyAbility: skillData.keyAbility,
      ranks: 0, miscModifier: 0, isClassSkill: skillData.keyAbility === 'none' ? false : skillData.isClassSkill,
      providesSynergies: skillData.providesSynergies, description: skillData.description,
    };
    setCharacter(prev => ({
      ...prev,
      skills: [...prev.skills, newSkill].sort((a, b) => a.name.localeCompare(b.name)),
    }));
  };

  const handleCustomSkillUpdate = (updatedSkillData: { id: string; name: string; keyAbility: AbilityName; isClassSkill: boolean; providesSynergies: CustomSynergyRule[]; description?: string; }) => {
    setCharacter(prev => ({
      ...prev,
      skills: prev.skills.map(s =>
        s.id === updatedSkillData.id
          ? { ...s,
              name: updatedSkillData.name, keyAbility: updatedSkillData.keyAbility,
              isClassSkill: updatedSkillData.keyAbility === 'none' ? false : updatedSkillData.isClassSkill,
              providesSynergies: updatedSkillData.providesSynergies, description: updatedSkillData.description,
            }
          : s
      ).sort((a, b) => a.name.localeCompare(b.name)),
    }));
  };

  const handleCustomSkillRemove = (skillId: string) => {
    setCharacter(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s.id !== skillId)
    }));
  };

  const handleFeatSelectionChange = (newlyChosenFeats: FeatType[]) => { // newlyChosenFeats are only user-chosen ones
    const characterLevel = character.classes.reduce((sum, c) => sum + c.level, 0) || 1;
    const autoGrantedFeats = getGrantedFeatsForCharacter(character.race, character.classes, characterLevel);

    const finalFeatsMap = new Map<string, FeatType>();

    autoGrantedFeats.forEach(feat => finalFeatsMap.set(feat.id, feat));

    newlyChosenFeats.forEach(feat => {
      const featDef = DND_FEATS.find(f => f.value === feat.id.split('-MULTI-INSTANCE-')[0]);
      const featIdToStore = feat.id;

      const baseGrantedId = featIdToStore.split('-MULTI-INSTANCE-')[0];
      const isBaseGrantedAndNotMultiTake = autoGrantedFeats.some(gf => gf.id === baseGrantedId && !featDef?.canTakeMultipleTimes);

      if (!isBaseGrantedAndNotMultiTake) {
        finalFeatsMap.set(featIdToStore, { ...feat, isGranted: false });
      }
    });

    setCharacter(prev => ({ ...prev, feats: Array.from(finalFeatsMap.values()) }));
  };

  const handlePersonalStoryChange = (story: string) => {
    setCharacter(prev => ({ ...prev, personalStory: story }));
  };

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

  const handleCancel = () => { router.push('/'); };

  const handleOpenRaceInfoDialog = () => {
    const selectedRace = DND_RACES.find(r => r.value === character.race);
    if (selectedRace) {
      const qualities = getRaceSpecialQualities(selectedRace.value as DndRaceId);
      setCurrentInfoDialogData({
        title: selectedRace.label,
        content: selectedRace.description,
        abilityModifiers: qualities.abilityEffects,
        skillBonuses: qualities.skillBonuses,
        grantedFeats: qualities.grantedFeats,
        bonusFeatSlots: qualities.bonusFeatSlots,
      });
      setIsInfoDialogOpen(true);
    }
  };

  const handleOpenClassInfoDialog = () => {
    const classData = DND_CLASSES.find(c => c.value === character.classes[0]?.className);
    if (classData) {
        const classSpecificDetails = [];
        if (classData.hitDice) {
            classSpecificDetails.push({ label: "Hit Dice", value: classData.hitDice, isBold: true });
        }
        setCurrentInfoDialogData({
            title: classData.label,
            content: classData.description,
            abilityModifiers: [],
            skillBonuses: [],
            grantedFeats: classData.grantedFeats,
            bonusFeatSlots: 0,
            detailsList: classSpecificDetails
        });
        setIsInfoDialogOpen(true);
    }
  };

  const handleOpenAlignmentInfoDialog = () => {
    const allAlignmentDescriptions = ALIGNMENTS.map(
      (align) => `<p><b>${align.label}:</b><br />${align.description}</p>`
    ).join('');
    setCurrentInfoDialogData({ title: "Alignments", content: allAlignmentDescriptions });
    setIsInfoDialogOpen(true);
  };

  const handleOpenDeityInfoDialog = () => {
      const deityData = DND_DEITIES.find(d => d.value === character.deity);
      if (deityData) {
        setCurrentInfoDialogData({
            title: deityData.label,
            content: deityData.description || `<p>No detailed description available for ${deityData.label}.</p>`
        });
      } else if (character.deity && character.deity.trim() !== '') {
        setCurrentInfoDialogData({
            title: character.deity,
            content: `<p>Custom deity. No predefined information available.</p>`
        });
      } else {
         setCurrentInfoDialogData({
            title: "Deity Information",
            content: "<p>Select or type a deity to see more information.</p>"
        });
      }
      setIsInfoDialogOpen(true);
  };

  const handleOpenAbilityScoreBreakdownDialog = (ability: Exclude<AbilityName, 'none'>) => {
    if (detailedAbilityScores && detailedAbilityScores[ability]) {
      setCurrentInfoDialogData({ abilityScoreBreakdown: detailedAbilityScores[ability] });
      setIsInfoDialogOpen(true);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!character.name || character.name.trim() === '') { toast({ title: "Missing Information", description: "Please enter a character name.", variant: "destructive" }); return; }
    if (!character.race || character.race.trim() === '') { toast({ title: "Missing Information", description: "Please select or enter a character race.", variant: "destructive" }); return; }
    if (!character.classes[0]?.className || character.classes[0]?.className.trim() === '') { toast({ title: "Missing Information", description: "Please select or enter a character class.", variant: "destructive" }); return; }
    // Removed alignment check as it now has a default
    // if (!character.alignment || character.alignment.trim() === '') { toast({ title: "Missing Information", description: "Please select an alignment.", variant: "destructive" }); return; }

    const selectedRaceInfoForValidation = DND_RACES.find(r => r.value === character.race);
    const minAgeForValidation = (selectedRaceInfoForValidation ? (DND_RACE_MIN_ADULT_AGE_DATA as Record<DndRaceId, number>)[selectedRaceInfoForValidation.value as DndRaceId] : undefined) || 1;
    if (character.age < minAgeForValidation) { toast({ title: "Invalid Age", description: `Age must be at least ${minAgeForValidation}${selectedRaceInfoForValidation ? ` for a ${selectedRaceInfoForValidation.label}` : ''}.`, variant: "destructive" }); return; }

    for (const ability of abilityNames) {
      if (ability === 'none') continue;
      if (character.abilityScores[ability] <= 0) { toast({ title: `Invalid ${ability.charAt(0).toUpperCase() + ability.slice(1)} Score`, description: `${ability.charAt(0).toUpperCase() + ability.slice(1)} score must be greater than 0.`, variant: "destructive" }); return; }
    }

    const finalCharacterData = { ...character, classes: [{ ...character.classes[0], level: 1 }], };
    onSave(finalCharacterData);
  };

  const isPredefinedRace = React.useMemo(() => DND_RACES.some(r => r.value === character.race), [character.race]);
  const isPredefinedClass = React.useMemo(() => DND_CLASSES.some(c => c.value === character.classes[0]?.className), [character.classes[0]?.className]);
  const selectedClassInfo = React.useMemo(() => DND_CLASSES.find(c => c.value === character.classes[0]?.className), [character.classes[0]?.className]);
  const currentMinAgeForInput = React.useMemo(() => {
    if (character.race) {
      const selectedRaceInfo = DND_RACES.find(r => r.value === character.race);
      if (selectedRaceInfo) { return DND_RACE_MIN_ADULT_AGE_DATA[selectedRaceInfo.value as DndRaceId] || 1; }
    }
    return 1;
  }, [character.race]);

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        <CharacterFormCoreInfoSection
          characterData={character}
          onFieldChange={handleCoreInfoFieldChange}
          onClassChange={handleClassChange}
          ageEffectsDetails={ageEffectsDetails}
          sizeAbilityEffectsDetails={sizeAbilityEffectsDetails}
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
          baseAbilityScores={character.abilityScores}
          detailedAbilityScores={detailedAbilityScores}
          onBaseAbilityScoreChange={handleBaseAbilityScoreChange}
          onOpenAbilityScoreBreakdownDialog={handleOpenAbilityScoreBreakdownDialog}
          onOpenRollerDialog={() => setIsRollerDialogOpen(true)}
          isCreating={isCreating}
        />

        <CharacterFormStoryPortraitSection
          personalStory={character.personalStory}
          portraitDataUrl={character.portraitDataUrl}
          onPersonalStoryChange={handlePersonalStoryChange}
          onPortraitChange={handlePortraitChange}
        />

        <SkillsFormSection
          skills={character.skills}
          abilityScores={character.abilityScores}
          actualAbilityScores={actualAbilityScoresForSkills}
          characterClasses={character.classes}
          characterRace={character.race}
          selectedFeats={character.feats}
          onSkillChange={handleSkillChange}
          onCustomSkillAdd={handleCustomSkillAdd}
          onCustomSkillUpdate={handleCustomSkillUpdate}
          onCustomSkillRemove={handleCustomSkillRemove}
        />

        <FeatsFormSection
          characterRace={character.race}
          characterClasses={character.classes}
          selectedFeats={character.feats}
          onFeatSelectionChange={handleFeatSelectionChange}
          abilityScores={actualAbilityScoresForSkills}
          skills={character.skills}
        />

        <div className="flex flex-col-reverse md:flex-row md:justify-between gap-4 mt-8">
          <Button type="button" variant="outline" size="lg" onClick={handleCancel} className="w-full md:w-auto">
            Cancel
          </Button>
          <Button type="submit" size="lg" className="w-full md:w-auto shadow-md hover:shadow-lg transition-shadow">
            {isCreating ? 'Create Character' : 'Save Changes'}
          </Button>
        </div>
      </form>

      {isCreating && (
        <AbilityScoreRollerDialog
          isOpen={isRollerDialogOpen}
          onOpenChange={setIsRollerDialogOpen}
          onScoresApplied={handleApplyRolledScores}
        />
      )}
      {isInfoDialogOpen && currentInfoDialogData && (
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
        />
      )}
    </>
  );
}
