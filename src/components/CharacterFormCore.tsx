
'use client';

import * as React from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { AbilityName, Character, CharacterClass, CharacterAlignment, CharacterSize, AgingEffectsDetails, DndRaceId, SizeAbilityEffectsDetails, RaceSpecialQualities, AbilityScores, RaceAbilityEffectsDetails, Skill as SkillType, DndClassId, CustomSynergyRule, DndDeityId, GenderId, Feat as FeatType, DndRaceOption, DetailedAbilityScores, AbilityScoreBreakdown, CharacterAlignmentObject } from '@/types/character';
import { SIZES, ALIGNMENTS, DND_RACES, DND_CLASSES, getNetAgingEffects, GENDERS, DND_DEITIES, getSizeAbilityEffects, getRaceSpecialQualities, getInitialCharacterSkills, SKILL_DEFINITIONS, DND_FEATS, getGrantedFeatsForCharacter, calculateDetailedAbilityScores } from '@/types/character';
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
import { InfoDisplayDialog, type SkillModifierBreakdownDetails } from '@/components/InfoDisplayDialog';

interface CharacterFormCoreProps {
  initialCharacter?: Character;
  onSave: (character: Character) => void;
  isCreating: boolean;
}

const abilityNames: Exclude<AbilityName, 'none'>[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

export function CharacterFormCore({ initialCharacter, onSave, isCreating }: CharacterFormCoreProps) {
  const [character, setCharacter] = React.useState<Character>(() => {
    const defaultBaseAbilityScores = { ...(JSON.parse(JSON.stringify(constantsData.DEFAULT_ABILITIES)) as AbilityScores) };
    const defaultClasses: CharacterClass[] = [{ id: crypto.randomUUID(), className: '', level: 1 }];

    const tempCharForInitialFeats: Character = {
      id: crypto.randomUUID(),
      name: '', race: '', alignment: '', deity: '', size: 'medium', age: 20, gender: '',
      abilityScores: defaultBaseAbilityScores,
      hp: 10, maxHp: 10, armorBonus: 0, shieldBonus: 0, sizeModifierAC: 0, naturalArmor: 0,
      deflectionBonus: 0, dodgeBonus: 0, acMiscModifier: 0, initiativeMiscModifier: 0,
      savingThrows: JSON.parse(JSON.stringify(constantsData.DEFAULT_SAVING_THROWS)),
      classes: defaultClasses, skills: [], feats: [], inventory: [],
    }
    const initialFeats = getGrantedFeatsForCharacter(tempCharForInitialFeats.race, tempCharForInitialFeats.classes, 1);
    
    return initialCharacter || {
      id: crypto.randomUUID(),
      name: '',
      race: '',
      alignment: '',
      deity: '',
      size: 'medium', 
      age: 20,
      gender: '',
      abilityScores: defaultBaseAbilityScores,
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
      savingThrows: JSON.parse(JSON.stringify(constantsData.DEFAULT_SAVING_THROWS)),
      classes: defaultClasses,
      skills: getInitialCharacterSkills(defaultClasses),
      feats: initialFeats,
      inventory: [],
      personalStory: '',
      portraitDataUrl: undefined,
    };
  });

  const [ageEffectsDetails, setAgeEffectsDetails] = React.useState<AgingEffectsDetails | null>(null);
  const [sizeAbilityEffectsDetails, setSizeAbilityEffectsDetails] = React.useState<SizeAbilityEffectsDetails | null>(null);
  const [raceSpecialQualities, setRaceSpecialQualities] = React.useState<RaceSpecialQualities | null>(null);
  const [isRollerDialogOpen, setIsRollerDialogOpen] = React.useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = React.useState(false);
  const [currentInfoDialogData, setCurrentInfoDialogData] = React.useState<{ title?: string; content?: string; abilityModifiers?: RaceSpecialQualities['abilityEffects']; skillBonuses?: RaceSpecialQualities['skillBonuses'], grantedFeats?: RaceSpecialQualities['grantedFeats'], bonusFeatSlots?: number, abilityScoreBreakdown?: AbilityScoreBreakdown, detailsList?: Array<{ label: string; value: string; isBold?: boolean }> } | null>(null);
  const [detailedAbilityScores, setDetailedAbilityScores] = React.useState<DetailedAbilityScores | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    setDetailedAbilityScores(calculateDetailedAbilityScores(character));
  }, [character]); 

  const actualAbilityScoresForSkills = React.useMemo(() => {
    if (!detailedAbilityScores) {
      return character.abilityScores;
    }
    const finalScores: Partial<AbilityScores> = {};
    for (const ability of abilityNames) {
      if (ability === 'none') continue;
      finalScores[ability] = detailedAbilityScores[ability].finalScore;
    }
    return finalScores as AbilityScores;
  }, [detailedAbilityScores, character.abilityScores]);


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
        const minAdultAge = (constantsData.DND_RACE_MIN_ADULT_AGE_DATA as Record<DndRaceId, number>)[raceKey];
        if (minAdultAge !== undefined && character.age < minAdultAge) {
          setCharacter(prev => ({ ...prev, age: minAdultAge }));
        }
      }
    } else {
      if (character.age > 100 && character.age !== 20) { 
        setCharacter(prev => ({...prev, age: 20}));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.race]); 


  React.useEffect(() => {
    const existingCustomSkillsMap = new Map<string, Partial<SkillType>>();
    character.skills.forEach(skill => {
      if (!SKILL_DEFINITIONS.some(def => def.value === skill.id)) { // skill.id is already kebab-case or UUID
        existingCustomSkillsMap.set(skill.id, {
          name: skill.name,
          keyAbility: skill.keyAbility,
          isClassSkill: skill.isClassSkill, 
          providesSynergies: skill.providesSynergies,
          description: skill.description,
          ranks: skill.ranks || 0, 
          miscModifier: skill.miscModifier || 0 
        });
      }
    });

    const newPredefinedSkills = getInitialCharacterSkills(character.classes); // returns skills with kebab-case IDs
    const finalSkillsMap = new Map<string, SkillType>();

    newPredefinedSkills.forEach(predefinedSkill => {
      finalSkillsMap.set(predefinedSkill.id, { // predefinedSkill.id is kebab-case
        ...predefinedSkill,
        ranks: 0, 
        miscModifier: 0, 
      });
    });

    existingCustomSkillsMap.forEach((customSkillData, skillId) => { // skillId here is UUID
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
    
    const characterLevel = character.classes.reduce((sum, c) => sum + c.level, 0) || 1;
    const newGrantedFeats = getGrantedFeatsForCharacter(character.race, character.classes, characterLevel);
    const userChosenFeats = character.feats.filter(feat => !feat.isGranted); 

    const combinedFeatsMap = new Map<string, FeatType>();
    newGrantedFeats.forEach(feat => combinedFeatsMap.set(feat.id, feat)); 

    userChosenFeats.forEach(feat => { 
        const featDef = DND_FEATS.find(f => f.value === feat.id.split('-')[0]); 
        const featIdToStore = feat.id; 
        
        if (!combinedFeatsMap.has(featIdToStore) || featDef?.canTakeMultipleTimes) {
           combinedFeatsMap.set(featIdToStore, { ...feat, isGranted: false });
        }
    });

    setCharacter(prev => ({
      ...prev,
      skills: Array.from(finalSkillsMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
      feats: Array.from(combinedFeatsMap.values()), 
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.classes[0]?.className, character.race]); 


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
       //This is handled by handleClassChange
    } else if (name === 'size') {
       setCharacter(prev => ({ ...prev, size: value as CharacterSize }));
    } else if (name === 'race') {
      setCharacter(prev => ({ ...prev, race: value as DndRaceId }));
    } else if (name === 'gender') {
      setCharacter(prev => ({ ...prev, gender: value as GenderId | string }));
    } else if (name === 'deity') {
      setCharacter(prev => ({ ...prev, deity: value as DndDeityId | string }));
    } else if (name === 'alignment') {
      setCharacter(prev => ({ ...prev, alignment: value as CharacterAlignment }));
    }
     else {
      setCharacter(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleClassChange = (value: string) => {
      const newClassId = value as DndClassId | string; // value is kebab-case id or custom text
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
      isClassSkill: skillData.keyAbility === 'none' ? false : skillData.isClassSkill, 
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
              isClassSkill: updatedSkillData.keyAbility === 'none' ? false : updatedSkillData.isClassSkill,
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

  const handleFeatSelectionChange = (newlyChosenFeats: FeatType[]) => {
    const characterLevel = character.classes.reduce((sum, c) => sum + c.level, 0) || 1;
    const autoGrantedFeats = getGrantedFeatsForCharacter(character.race, character.classes, characterLevel);

    const finalFeatsMap = new Map<string, FeatType>();
    autoGrantedFeats.forEach(feat => finalFeatsMap.set(feat.id, feat)); 

    newlyChosenFeats.forEach(feat => { 
        const featIdToStore = feat.id; 
        
        if (!finalFeatsMap.has(featIdToStore) || feat.canTakeMultipleTimes) {
           finalFeatsMap.set(featIdToStore, { ...feat, isGranted: false });
        }
    });
    setCharacter(prev => ({ ...prev, feats: Array.from(finalFeatsMap.values()) }));
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
      const qualities = getRaceSpecialQualities(selectedRace.value as DndRaceId);
      setCurrentInfoDialogData({
        title: selectedRace.label,
        content: selectedRace.description,
        abilityModifiers: qualities.abilityEffects,
        skillBonuses: qualities.skillBonuses,
        grantedFeats: qualities.grantedFeats,
        bonusFeatSlots: qualities.bonusFeatSlots
      });
      setIsInfoDialogOpen(true);
    }
  };

  const handleOpenGenericInfoDialog = (title: string, description?: string, details?: Array<{ label: string; value: string; isBold?: boolean }>) => {
    setCurrentInfoDialogData({ 
        title, 
        content: description || "No description available.", 
        abilityModifiers: [], 
        skillBonuses: [], 
        grantedFeats: [], 
        bonusFeatSlots: 0,
        detailsList: details 
    });
    setIsInfoDialogOpen(true);
  };

  const handleOpenAlignmentInfoDialog = () => {
    const allAlignmentDescriptions = ALIGNMENTS.map(align => `<b>${align.label}:</b><br />${align.description}`).join('');
    setCurrentInfoDialogData({
      title: "Alignments",
      content: allAlignmentDescriptions,
    });
    setIsInfoDialogOpen(true);
  };

  const handleOpenAbilityScoreBreakdownDialog = (ability: Exclude<AbilityName, 'none'>) => {
    if (detailedAbilityScores && detailedAbilityScores[ability]) {
      setCurrentInfoDialogData({
        abilityScoreBreakdown: detailedAbilityScores[ability]
      });
      setIsInfoDialogOpen(true);
    }
  };


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!character.name || character.name.trim() === '') {
      toast({ title: "Missing Information", description: "Please enter a character name.", variant: "destructive" }); return;
    }
    if (!character.race || character.race.trim() === '') {
      toast({ title: "Missing Information", description: "Please select or enter a character race.", variant: "destructive" }); return;
    }
    if (!character.classes[0]?.className || character.classes[0]?.className.trim() === '') {
      toast({ title: "Missing Information", description: "Please select or enter a character class.", variant: "destructive" }); return;
    }
    if (!character.alignment || character.alignment.trim() === '') {
      toast({ title: "Missing Information", description: "Please select an alignment.", variant: "destructive" }); return;
    }

    const selectedRaceInfoForValidation = DND_RACES.find(r => r.value === character.race);
    const minAgeForValidation = (selectedRaceInfoForValidation ? (constantsData.DND_RACE_MIN_ADULT_AGE_DATA as Record<DndRaceId, number>)[selectedRaceInfoForValidation.value as DndRaceId] : undefined) || 1;

    if (character.age < minAgeForValidation) {
       toast({ title: "Invalid Age", description: `Age must be at least ${minAgeForValidation}${selectedRaceInfoForValidation ? ` for a ${selectedRaceInfoForValidation.label}` : ''}.`, variant: "destructive" }); return;
    }

    for (const ability of abilityNames) {
      if (ability === 'none') continue;
      if (character.abilityScores[ability] <= 0) {
        toast({ title: `Invalid ${ability.charAt(0).toUpperCase() + ability.slice(1)} Score`, description: `${ability.charAt(0).toUpperCase() + ability.slice(1)} score must be greater than 0.`, variant: "destructive" }); return;
      }
    }
    
    const finalCharacterData = {
      ...character,
      classes: [{ ...character.classes[0], level: 1 }], 
    };
    onSave(finalCharacterData);
  };


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
                   <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10" onClick={handleOpenRaceInfoDialog}>
                    <Info className="h-5 w-5" />
                  </Button>
                )}
                {!isPredefinedRace && character.race && character.race.trim() !== '' && (
                  <Button type="button" variant="outline" size="sm" className="shrink-0 h-10">Customize...</Button>
                )}
              </div>
              {raceSpecialQualities?.abilityEffects && raceSpecialQualities.abilityEffects.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1 ml-1">
                  {raceSpecialQualities.abilityEffects.map((effect, index) => (
                      <React.Fragment key={effect.ability}>
                        <strong className={cn("font-bold", effect.change < 0 ? 'text-destructive' : 'text-emerald-500')}>
                          {effect.ability.substring(0, 3).toUpperCase()} {effect.change > 0 ? '+' : ''}{effect.change}
                        </strong>
                        {index < raceSpecialQualities.abilityEffects.length - 1 && <span className="text-muted-foreground">, </span>}
                      </React.Fragment>
                    ))}
                </p>
              )}
               {raceSpecialQualities && raceSpecialQualities.abilityEffects.length === 0 && character.race && (
                 <p className="text-xs text-muted-foreground mt-1 ml-1">No impact on ability scores</p>
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
                    <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10"
                       onClick={() => {
                          const classData = DND_CLASSES.find(c => c.value === character.classes[0]?.className);
                          if (classData) {
                              const classSpecificDetails = [];
                              if (classData.hitDice) {
                                  classSpecificDetails.push({ label: "Hit Dice", value: classData.hitDice, isBold: true });
                              }
                              handleOpenGenericInfoDialog(
                                  classData.label,
                                  classData.description,
                                  classSpecificDetails
                              );
                          }
                      }}>
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
                     <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10"
                        onClick={handleOpenAlignmentInfoDialog}>
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
                 <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10"
                    onClick={() => {
                        const deityData = DND_DEITIES.find(d => d.value === character.deity);
                        handleOpenGenericInfoDialog(deityData ? deityData.label : "Deity Info", deityData ? `Details about the deity ${deityData.label}.` : "Select or type a deity to see details.");
                    }}>
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
                    {ageEffectsDetails.effects.length > 0 ? (
                      <>
                        <p>
                           {ageEffectsDetails.effects.map((effect, index) => (
                            <React.Fragment key={effect.ability}>
                              <strong className={cn("font-bold", effect.change < 0 ? 'text-destructive' : 'text-emerald-500')}>
                                {effect.ability.substring(0, 3).toUpperCase()} {effect.change > 0 ? '+' : ''}{effect.change}
                              </strong>
                              {index < ageEffectsDetails.effects.length - 1 && <span className="text-muted-foreground">, </span>}
                            </React.Fragment>
                          ))}
                        </p>
                        <p>{ageEffectsDetails.categoryName}</p>
                      </>
                    ) : (
                       <p>{ageEffectsDetails.categoryName !== "Adult" ? `${ageEffectsDetails.categoryName}: ` : ""}No impact on ability scores</p>
                    )}
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
                sizeAbilityEffectsDetails.effects.length > 0 ? (
                  <p className="text-xs text-muted-foreground mt-1 ml-1">
                    {sizeAbilityEffectsDetails.effects.map((effect, index) => (
                        <React.Fragment key={effect.ability}>
                          <strong className={cn( "font-bold", effect.change < 0 ? 'text-destructive' : 'text-emerald-500')}>
                            {effect.ability.substring(0, 3).toUpperCase()} {effect.change > 0 ? '+' : ''}{effect.change}
                          </strong>
                          {index < sizeAbilityEffectsDetails.effects.length - 1 && <span className="text-muted-foreground">, </span>}
                        </React.Fragment>
                      ))}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1 ml-1">No impact on ability scores</p>
                )
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
              const baseScore = character.abilityScores[ability];
              const baseModifier = calculateAbilityModifier(baseScore);
              const actualScoreData = detailedAbilityScores ? detailedAbilityScores[ability] : null;
              const actualModifier = actualScoreData ? calculateAbilityModifier(actualScoreData.finalScore) : baseModifier;

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
                    value={baseScore}
                    onChange={(e) => handleAbilityScoreChange(ability, e.target.value)}
                    className="text-center w-16"
                    min="1"
                  />
                  <p className="text-center text-sm mt-1">
                    <span className="text-accent">Modifier: </span>
                    <span className={cn("font-bold", baseModifier > 0 && "text-emerald-500", baseModifier < 0 && "text-destructive", baseModifier === 0 && "text-accent")}>
                      {baseModifier >= 0 ? '+' : ''}{baseModifier}
                    </span>
                  </p>
                  {actualScoreData && (
                     <div className="text-center text-sm mt-1 flex items-center justify-center gap-1">
                       <span className="text-accent">Actual: </span>
                       <span className={cn(
                          "font-bold",
                          actualModifier > 0 && "text-emerald-500",
                          actualModifier < 0 && "text-destructive",
                          actualModifier === 0 && "text-accent"
                        )}>
                         {actualModifier >= 0 ? '+' : ''}{actualModifier}
                       </span>
                       <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-primary"
                          onClick={() => handleOpenAbilityScoreBreakdownDialog(ability)}
                        >
                           <Info className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                  )}
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
