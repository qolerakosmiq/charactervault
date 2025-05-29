
'use client';

import * as React from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { AbilityName, Character, CharacterClass, CharacterAlignment, CharacterSize, AgingEffectsDetails, DndRaceId, SizeAbilityEffectsDetails, AbilityScores, RaceAbilityEffectsDetails, Skill as SkillType, DndClassId, CustomSynergyRule, DndDeityId, GenderId, Feat as FeatType, DndRaceOption } from '@/types/character';
import { SIZES, ALIGNMENTS, DND_RACES, DND_CLASSES, getNetAgingEffects, GENDERS, DND_DEITIES, getSizeAbilityEffects, getRaceAbilityEffects, getInitialCharacterSkills, SKILL_DEFINITIONS } from '@/types/character';
import constantsData from '@/data/dnd-constants.json';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { calculateAbilityModifier } from '@/lib/dnd-utils';
import { ScrollText, Dices, UserSquare2, Palette, Info } from 'lucide-react';
import { ComboboxPrimitive } from '@/components/ui/combobox';
import { cn } from '@/lib/utils';
import { AbilityScoreRollerDialog } from '@/components/AbilityScoreRollerDialog';
import { SkillsFormSection } from '@/components/SkillsFormSection';
import { FeatsFormSection } from '@/components/FeatsFormSection';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { InfoDisplayDialog } from '@/components/InfoDisplayDialog';

interface CharacterFormCoreProps {
  initialCharacter?: Character;
  onSave: (character: Character) => void;
  isCreating: boolean;
}


export function CharacterFormCore({ initialCharacter, onSave, isCreating }: CharacterFormCoreProps) {
  const [character, setCharacter] = React.useState<Character>(() => {
    const defaultClasses: CharacterClass[] = [{ id: crypto.randomUUID(), className: '', level: 1 }];
    return initialCharacter || {
      id: crypto.randomUUID(),
      name: '',
      race: '' as DndRaceId,
      alignment: '' as CharacterAlignment,
      deity: '',
      size: 'medium' as CharacterSize,
      age: 20,
      gender: '' as GenderId,
      abilityScores: { ...JSON.parse(JSON.stringify(constantsData.DEFAULT_ABILITIES || {})) },
      hp: 10,
      maxHp: 10,
      armorBonus: 0,
      shieldBonus: 0,
      sizeModifierAC: 0,
      naturalArmor: 0,
      deflectionBonus: 0,
      dodgeBonus: 0,
      acMiscModifier: 0,
      initiativeMiscModifier: 0,
      savingThrows: JSON.parse(JSON.stringify(constantsData.DEFAULT_SAVING_THROWS || {})),
      classes: defaultClasses,
      skills: getInitialCharacterSkills(defaultClasses),
      feats: [],
      inventory: [],
      personalStory: '',
      portraitDataUrl: undefined,
    };
  });

  const [ageEffectsDetails, setAgeEffectsDetails] = React.useState<AgingEffectsDetails | null>(null);
  const [sizeAbilityEffectsDetails, setSizeAbilityEffectsDetails] = React.useState<SizeAbilityEffectsDetails | null>(null);
  const [raceAbilityEffectsDetails, setRaceAbilityEffectsDetails] = React.useState<RaceAbilityEffectsDetails | null>(null);
  const [isRollerDialogOpen, setIsRollerDialogOpen] = React.useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = React.useState(false);
  const [currentInfoDialogData, setCurrentInfoDialogData] = React.useState<{ title: string; content?: string; abilityModifiers?: RaceAbilityEffectsDetails['effects'] } | null>(null);

  const router = useRouter();
  const { toast } = useToast();


  React.useEffect(() => {
    if (character.race && character.age > 0) {
      const details = getNetAgingEffects(character.race as DndRaceId, character.age);
      setAgeEffectsDetails(details);
    } else {
      setAgeEffectsDetails(null);
    }
  }, [character.age, character.race]);

  React.useEffect(() => {
    if (character.size) {
      const details = getSizeAbilityEffects(character.size as CharacterSize);
      setSizeAbilityEffectsDetails(details);
    } else {
      setSizeAbilityEffectsDetails(null);
    }
  }, [character.size]);

  React.useEffect(() => {
    if (character.race) {
      const details = getRaceAbilityEffects(character.race as DndRaceId);
      setRaceAbilityEffectsDetails(details);
    } else {
      setRaceAbilityEffectsDetails(null);
    }
  }, [character.race]);

  React.useEffect(() => {
    if (character.race) {
      const selectedRaceInfo = DND_RACES.find(r => r.value === character.race);
      if (selectedRaceInfo) {
        const raceKey = selectedRaceInfo.value as DndRaceId;
        const minAdultAge = (constantsData.DND_RACE_MIN_ADULT_AGE_DATA as Record<DndRaceId, number>)[raceKey];
        if (minAdultAge !== undefined && character.age < minAdultAge) {
          setCharacter(prev => ({ ...prev, age: minAdultAge }));
        }
      }
    }
  }, [character.race, character.age]);

  React.useEffect(() => {
    const existingCustomSkillsMap = new Map<string, Partial<SkillType>>();
    character.skills.forEach(skill => {
      if (!SKILL_DEFINITIONS.some(def => def.value === skill.id)) {
        existingCustomSkillsMap.set(skill.id, {
          name: skill.name,
          keyAbility: skill.keyAbility,
          isClassSkill: skill.isClassSkill,
          providesSynergies: skill.providesSynergies,
          description: skill.description,
          ranks: skill.ranks,
          miscModifier: skill.miscModifier
        });
      }
    });

    const newPredefinedSkills = getInitialCharacterSkills(character.classes);
    const finalSkillsMap = new Map<string, SkillType>();

    newPredefinedSkills.forEach(skill => {
      finalSkillsMap.set(skill.id, { ...skill, ranks: 0, miscModifier: 0 });
    });

    existingCustomSkillsMap.forEach((customSkillData, skillId) => {
      finalSkillsMap.set(skillId, {
        id: skillId,
        name: customSkillData.name!,
        keyAbility: customSkillData.keyAbility!,
        isClassSkill: customSkillData.isClassSkill!,
        providesSynergies: customSkillData.providesSynergies,
        description: customSkillData.description,
        ranks: 0,
        miscModifier: 0,
      });
    });
    
    setCharacter(prev => ({
      ...prev,
      skills: Array.from(finalSkillsMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.classes[0]?.className]);


  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCharacter(prev => ({ ...prev, [name]: name === 'age' || name === 'hp' || name === 'maxHp' ? parseInt(value, 10) || 0 : value }));
  };

  const handleAbilityScoreChange = (ability: AbilityName, value: string) => {
    setCharacter(prev => ({
      ...prev,
      abilityScores: {
        ...prev.abilityScores,
        [ability]: parseInt(value, 10) || 0,
      },
    }));
  };

  const handleApplyRolledScores = (newScores: AbilityScores) => {
    setCharacter(prev => ({ ...prev, abilityScores: newScores }));
    setIsRollerDialogOpen(false);
  };

  const handleSelectChange = (name: keyof Character | 'className', value: string) => {
     if (name === 'className') {
      // This case is handled by handleClassChange directly
    } else if (name === 'size') {
       let acSizeModifierValue = 0;
        switch (value) {
            case 'fine': acSizeModifierValue = 8; break;
            case 'diminutive': acSizeModifierValue = 4; break;
            case 'tiny': acSizeModifierValue = 2; break;
            case 'small': acSizeModifierValue = 1; break;
            case 'medium': acSizeModifierValue = 0; break;
            case 'large': acSizeModifierValue = -1; break;
            case 'huge': acSizeModifierValue = -2; break;
            case 'gargantuan': acSizeModifierValue = -4; break;
            case 'colossal': acSizeModifierValue = -8; break;
        }
       setCharacter(prev => ({ ...prev, [name]: value as CharacterSize, sizeModifierAC: acSizeModifierValue }));
    } else if (name === 'race') {
      setCharacter(prev => ({ ...prev, race: value as DndRaceId }));
    } else if (name === 'gender') {
      setCharacter(prev => ({ ...prev, gender: value as GenderId }));
    } else if (name === 'deity') {
      setCharacter(prev => ({ ...prev, deity: value as DndDeityId }));
    } else if (name === 'alignment') {
      setCharacter(prev => ({ ...prev, [name]: value as CharacterAlignment }));
    }
     else {
      setCharacter(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleClassChange = (value: string) => {
      const newClassId = value as DndClassId | string;
      setCharacter(prev => {
        const updatedClasses = [{ ...prev.classes[0], id: prev.classes[0]?.id || crypto.randomUUID(), className: newClassId, level: 1 }];
        return {
          ...prev,
          classes: updatedClasses,
        };
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
      id: crypto.randomUUID(),
      name: skillData.name,
      keyAbility: skillData.keyAbility,
      ranks: 0,
      miscModifier: 0,
      isClassSkill: skillData.isClassSkill,
      providesSynergies: skillData.providesSynergies,
      description: skillData.description,
    };
    setCharacter(prev => ({
      ...prev,
      skills: [...prev.skills, newSkill].sort((a,b) => a.name.localeCompare(b.name)),
    }));
  };

  const handleCustomSkillUpdate = (updatedSkillData: { id: string; name: string; keyAbility: AbilityName; isClassSkill: boolean; providesSynergies: CustomSynergyRule[]; description?: string; }) => {
    setCharacter(prev => ({
      ...prev,
      skills: prev.skills.map(s =>
        s.id === updatedSkillData.id
          ? { ...s,
              name: updatedSkillData.name,
              keyAbility: updatedSkillData.keyAbility,
              isClassSkill: updatedSkillData.isClassSkill,
              providesSynergies: updatedSkillData.providesSynergies,
              description: updatedSkillData.description,
            }
          : s
      ).sort((a,b) => a.name.localeCompare(b.name)),
    }));
  };


  const handleCustomSkillRemove = (skillId: string) => {
    setCharacter(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s.id !== skillId)
    }));
  };

  const handleFeatSelectionChange = (newSelectedFeats: FeatType[]) => {
    setCharacter(prev => ({ ...prev, feats: newSelectedFeats }));
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

  const handleCancel = () => {
    router.push('/');
  };

  const handleOpenRaceInfoDialog = () => {
    const selectedRace = DND_RACES.find(r => r.value === character.race);
    if (selectedRace) {
      const raceAbilityEffects = getRaceAbilityEffects(selectedRace.value as DndRaceId);
      setCurrentInfoDialogData({
        title: selectedRace.label,
        content: selectedRace.description,
        abilityModifiers: raceAbilityEffects.effects,
      });
      setIsInfoDialogOpen(true);
    }
  };

  const handleOpenGenericInfoDialog = (title: string, content?: string) => {
    setCurrentInfoDialogData({ title, content: content || "No description available.", abilityModifiers: [] });
    setIsInfoDialogOpen(true);
  };


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!character.name || character.name.trim() === '') {
      toast({
        title: "Missing Information",
        description: "Please enter a character name.",
        variant: "destructive",
      });
      return;
    }
    if (!character.race || character.race.trim() === '') {
      toast({
        title: "Missing Information",
        description: "Please select or enter a character race.",
        variant: "destructive",
      });
      return;
    }
    if (!character.classes[0]?.className || character.classes[0]?.className.trim() === '') {
      toast({
        title: "Missing Information",
        description: "Please select or enter a character class.",
        variant: "destructive",
      });
      return;
    }
    if (!character.alignment || character.alignment.trim() === '') {
      toast({
        title: "Missing Information",
        description: "Please select an alignment.",
        variant: "destructive",
      });
      return;
    }

    const selectedRaceInfoForValidation = DND_RACES.find(r => r.value === character.race);
    const minAgeForValidation = (selectedRaceInfoForValidation ? (constantsData.DND_RACE_MIN_ADULT_AGE_DATA as Record<DndRaceId, number>)[selectedRaceInfoForValidation.value as DndRaceId] : undefined) || 1;

    if (character.age < minAgeForValidation) {
       toast({
        title: "Invalid Age",
        description: `Age must be at least ${minAgeForValidation}${selectedRaceInfoForValidation ? ` for a ${selectedRaceInfoForValidation.label}` : ''}.`,
        variant: "destructive",
      });
      return;
    }

    for (const ability of abilityNames) {
      if (character.abilityScores[ability] <= 0) {
        toast({
          title: `Invalid ${ability.charAt(0).toUpperCase() + ability.slice(1)} Score`,
          description: `${ability.charAt(0).toUpperCase() + ability.slice(1)} score must be greater than 0.`,
          variant: "destructive",
        });
        return;
      }
    }

    let acSizeModifierValue = 0;
    switch (character.size) {
        case 'fine': acSizeModifierValue = 8; break;
        case 'diminutive': acSizeModifierValue = 4; break;
        case 'tiny': acSizeModifierValue = 2; break;
        case 'small': acSizeModifierValue = 1; break;
        case 'medium': acSizeModifierValue = 0; break;
        case 'large': acSizeModifierValue = -1; break;
        case 'huge': acSizeModifierValue = -2; break;
        case 'gargantuan': acSizeModifierValue = -4; break;
        case 'colossal': acSizeModifierValue = -8; break;
    }


    const finalCharacterData = {
      ...character,
      classes: [{ ...character.classes[0], level: 1 }],
      sizeModifierAC: acSizeModifierValue
    };
    onSave(finalCharacterData);
  };

  const abilityNames: AbilityName[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

  const isPredefinedRace = React.useMemo(
    () => DND_RACES.some(r => r.value === character.race),
    [character.race]
  );
  const isPredefinedClass = React.useMemo(
    () => DND_CLASSES.some(c => c.value === character.classes[0]?.className),
    [character.classes[0]?.className]
  );
  const selectedClassInfo = React.useMemo(
    () => DND_CLASSES.find(c => c.value === character.classes[0]?.className),
    [character.classes[0]?.className]
  );


  const currentMinAgeForInput = React.useMemo(() => {
    if (character.race) {
        const selectedRaceInfo = DND_RACES.find(r => r.value === character.race);
        if (selectedRaceInfo) {
        return (constantsData.DND_RACE_MIN_ADULT_AGE_DATA as Record<DndRaceId, number>)[selectedRaceInfo.value as DndRaceId] || 1;
        }
    }
    return 1;
  }, [character.race]);


  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <ScrollText className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl font-serif">
                {isCreating ? 'Forge Your Legend' : `Edit ${character.name}`}
              </CardTitle>
              <CardDescription>
                {isCreating ? 'Define the core attributes of your new adventurer.' : 'Update the core attributes of your character.'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Name and Race */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" value={character.name} onChange={handleChange} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="race">Race</Label>
              <div className="flex items-center gap-2">
                <div className="flex-grow">
                  <ComboboxPrimitive
                    options={DND_RACES}
                    value={character.race}
                    onChange={(value) => handleSelectChange('race', value)}
                    placeholder="Select or type race"
                    searchPlaceholder="Search races..."
                    emptyPlaceholder="No race found. Type to add custom."
                    isEditable={true}
                  />
                </div>
                {isPredefinedRace && (
                   <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10"
                      onClick={handleOpenRaceInfoDialog}
                    >
                    <Info className="h-5 w-5" />
                  </Button>
                )}
                {!isPredefinedRace && character.race && character.race.trim() !== '' && (
                  <Button type="button" variant="outline" size="sm" className="shrink-0 h-10">Customize...</Button>
                )}
              </div>
              {raceAbilityEffectsDetails && (
                <p className="text-xs text-muted-foreground mt-1 ml-1">
                  {raceAbilityEffectsDetails.effects.length > 0 ?
                    raceAbilityEffectsDetails.effects.map((effect, index) => (
                      <React.Fragment key={effect.ability}>
                        <strong
                          className={cn(
                            "font-bold",
                            effect.change < 0 ? 'text-destructive' : 'text-emerald-500'
                          )}
                        >
                          {effect.ability.substring(0, 3).toUpperCase()} {effect.change > 0 ? '+' : ''}{effect.change}
                        </strong>
                        {index < raceAbilityEffectsDetails.effects.length - 1 && <span className="text-muted-foreground">, </span>}
                      </React.Fragment>
                    ))
                    : "No impact on ability scores"
                  }
                </p>
              )}
            </div>
          </div>

           {/* Class and Alignment */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-1">
              <Label htmlFor="className">Class</Label>
              <div className="flex items-center gap-2">
                <div className="flex-grow">
                  <ComboboxPrimitive
                    options={DND_CLASSES}
                    value={character.classes[0]?.className || ''}
                    onChange={handleClassChange}
                    placeholder="Select or type class"
                    searchPlaceholder="Search classes..."
                    emptyPlaceholder="No class found. Type to add custom."
                    isEditable={true}
                  />
                </div>
                {isPredefinedClass && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10"
                    onClick={() => {
                        const classData = DND_CLASSES.find(c => c.value === character.classes[0]?.className);
                        if (classData) handleOpenGenericInfoDialog(classData.label, `Hit Dice: ${classData.hitDice}. Further class details can be added here.`);
                    }}
                  >
                    <Info className="h-5 w-5" />
                  </Button>
                )}
                {!isPredefinedClass && character.classes[0]?.className && character.classes[0]?.className.trim() !== '' && (
                  <Button type="button" variant="outline" size="sm" className="shrink-0 h-10">Customize...</Button>
                )}
              </div>
              {selectedClassInfo && (
                <p className="text-xs text-muted-foreground mt-1 ml-1">Hit Dice: <strong className="font-bold">{selectedClassInfo.hitDice}</strong></p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="alignment">Alignment</Label>
              <div className="flex items-center gap-2">
                <div className="flex-grow">
                  <Select name="alignment" value={character.alignment} onValueChange={(value) => handleSelectChange('alignment', value as CharacterAlignment)}>
                    <SelectTrigger><SelectValue placeholder="Select alignment" /></SelectTrigger>
                    <SelectContent>
                      {ALIGNMENTS.map(align => <SelectItem key={align.value} value={align.value}>{align.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10"
                    onClick={() => {
                        const alignData = ALIGNMENTS.find(a => a.value === character.alignment);
                         handleOpenGenericInfoDialog(alignData ? alignData.label : "Alignment", alignData ? `Details about ${alignData.label} alignment.` : "Select an alignment to see details.");
                    }}
                >
                  <Info className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Deity */}
          <div className="grid grid-cols-1 gap-6 items-start">
            <div className="space-y-1">
              <Label htmlFor="deity">Deity</Label>
              <div className="flex items-center gap-2">
                <div className="flex-grow">
                  <ComboboxPrimitive
                      options={DND_DEITIES}
                      value={character.deity || ''}
                      onChange={(value) => handleSelectChange('deity', value)}
                      placeholder="Select or type deity"
                      searchPlaceholder="Search deities..."
                      emptyPlaceholder="No deity found. Type to add."
                      isEditable={true}
                    />
                </div>
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10"
                    onClick={() => {
                        const deityData = DND_DEITIES.find(d => d.value === character.deity);
                        handleOpenGenericInfoDialog(deityData ? deityData.label : "Deity", deityData ? `Details about the deity ${deityData.label}.` : "Select or type a deity to see details.");
                    }}
                >
                  <Info className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Age, Gender, Size */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="space-y-1">
              <Label htmlFor="age">Age</Label>
              <Input id="age" name="age" type="number" value={character.age} onChange={handleChange} min={currentMinAgeForInput} />
               {ageEffectsDetails && (
                  <div className="text-xs text-muted-foreground mt-1 ml-1 space-y-0.5">
                    <p>
                      {ageEffectsDetails.effects.length > 0 ?
                        ageEffectsDetails.effects.map((effect, index) => (
                          <React.Fragment key={effect.ability}>
                            <strong
                              className={cn(
                                "font-bold",
                                effect.change < 0 ? 'text-destructive' : 'text-emerald-500'
                              )}
                            >
                              {effect.ability.substring(0, 3).toUpperCase()} {effect.change > 0 ? '+' : ''}{effect.change}
                            </strong>
                            {index < ageEffectsDetails.effects.length - 1 && <span className="text-muted-foreground">, </span>}
                          </React.Fragment>
                        ))
                        : "No impact on ability scores"
                      }
                    </p>
                    {ageEffectsDetails.categoryName !== "adult" && <p>{constantsData.DND_RACE_AGING_EFFECTS_DATA[constantsData.RACE_TO_AGING_CATEGORY_MAP_DATA[character.race as DndRaceId] as keyof typeof constantsData.DND_RACE_AGING_EFFECTS_DATA]?.categories.find(c => c.categoryName === ageEffectsDetails.categoryName)?.categoryName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || ageEffectsDetails.categoryName}</p>}
                  </div>
                )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="gender">Gender</Label>
              <ComboboxPrimitive
                  options={GENDERS}
                  value={character.gender}
                  onChange={(value) => handleSelectChange('gender', value)}
                  placeholder="Select or type gender"
                  searchPlaceholder="Search genders..."
                  emptyPlaceholder="No gender found. Type to add."
                  isEditable={true}
                />
            </div>
             <div className="space-y-1">
              <Label htmlFor="size">Size</Label>
              <Select name="size" value={character.size} onValueChange={(value) => handleSelectChange('size', value as CharacterSize)}>
                <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                <SelectContent>
                  {SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {sizeAbilityEffectsDetails && (
                 <p className="text-xs text-muted-foreground mt-1 ml-1">
                  {sizeAbilityEffectsDetails.effects.length > 0 ?
                    sizeAbilityEffectsDetails.effects.map((effect, index) => (
                        <React.Fragment key={effect.ability}>
                          <strong
                            className={cn(
                              "font-bold",
                              effect.change < 0 ? 'text-destructive' : 'text-emerald-500'
                            )}
                          >
                            {effect.ability.substring(0, 3).toUpperCase()} {effect.change > 0 ? '+' : ''}{effect.change}
                          </strong>
                          {index < sizeAbilityEffectsDetails.effects.length - 1 && <span className="text-muted-foreground">, </span>}
                        </React.Fragment>
                      ))
                  : "No impact on ability scores"
                }
                </p>
               )}
            </div>
          </div>

          <Separator className="my-6" />
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-serif font-semibold text-primary">Ability Scores</h3>
            {isCreating && (
               <Button type="button" variant="outline" size="sm" onClick={() => setIsRollerDialogOpen(true)}>
                <Dices className="mr-2 h-4 w-4" /> Roll Scores
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {abilityNames.map(ability => {
              const score = character.abilityScores[ability];
              const modifier = calculateAbilityModifier(score);
              return (
                <div key={ability} className="space-y-1 flex flex-col items-center">
                  <Label htmlFor={ability} className="capitalize text-sm font-semibold">
                    {ability.substring(0,3).toUpperCase()}
                  </Label>
                  <p className="text-xs text-muted-foreground capitalize mb-0.5">
                    {ability}
                  </p>
                  <Input
                    id={ability}
                    name={ability}
                    type="number"
                    value={score}
                    onChange={(e) => handleAbilityScoreChange(ability, e.target.value)}
                    className="text-center w-16"
                    min="1"
                  />
                  <p className="text-center text-sm mt-1">
                    <span className="text-accent">Modifier: </span>
                    <span
                      className={cn(
                        "font-bold",
                        modifier > 0 && "text-emerald-500",
                        modifier < 0 && "text-destructive",
                        modifier === 0 && "text-accent"
                      )}
                    >
                      {modifier >= 0 ? '+' : ''}{modifier}
                    </span>
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
             <UserSquare2 className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl font-serif">
                Personal Story & Portrait
              </CardTitle>
              <CardDescription>
                Flesh out your character's background and appearance.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:items-stretch">
            <div className="md:col-span-1 space-y-2 flex flex-col">
              <Label htmlFor="portraitUpload">Character Portrait</Label>
              <div className="aspect-square w-full bg-muted rounded-md flex items-center justify-center relative overflow-hidden border border-border shadow-sm">
                {character.portraitDataUrl ? (
                  <Image src={character.portraitDataUrl} alt="Character Portrait" fill style={{objectFit: 'cover'}} />
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Palette size={48} className="mb-2"/>
                    <span className="text-sm">No portrait uploaded</span>
                  </div>
                )}
              </div>
              <Input
                id="portraitUpload"
                type="file"
                accept="image/*"
                onChange={handlePortraitChange}
                className="text-sm file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
               {!character.portraitDataUrl && (
                <div className="hidden">
                    <Image src="https://placehold.co/300x300.png" alt="Portrait Placeholder" width={300} height={300} data-ai-hint="fantasy portrait" />
                </div>
              )}
            </div>

            <div className="md:col-span-2 space-y-2 flex flex-col">
              <Label htmlFor="personalStory">Personal Story</Label>
              <Textarea
                id="personalStory"
                name="personalStory"
                value={character.personalStory || ''}
                onChange={handleChange}
                placeholder="Describe your character's history, motivations, personality, and defining moments..."
                className="min-h-[260px] md:flex-grow md:min-h-0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <SkillsFormSection
        skills={character.skills}
        abilityScores={character.abilityScores}
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
        abilityScores={character.abilityScores}
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
      />
    )}
    </>
  );
}
