
'use client';

import * as React from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { AbilityName, Character, CharacterClass, CharacterAlignment, CharacterSize, AgingEffectsDetails, DndRace, SizeAbilityEffectsDetails, AbilityScores, RaceAbilityEffectsDetails } from '@/types/character';
import { DEFAULT_ABILITIES, DEFAULT_SAVING_THROWS, SIZES, ALIGNMENTS, ALL_SKILLS_3_5, DND_RACES, DND_CLASSES, getNetAgingEffects, GENDERS, DND_DEITIES, getSizeAbilityEffects, getRaceAbilityEffects } from '@/types/character';
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
import { ScrollText, Dices, UserSquare2, Palette, HelpCircle } from 'lucide-react';
import { ComboboxPrimitive, type ComboboxOption } from '@/components/ui/combobox';
import { cn } from '@/lib/utils';
import { AbilityScoreRollerDialog } from '@/components/AbilityScoreRollerDialog';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";

interface CharacterFormCoreProps {
  initialCharacter?: Character;
  onSave: (character: Character) => void;
  isCreating: boolean;
}

// Generate a unique ID (for client-side use)
const generateCUID = () => {
  // Basic CUID-like structure, not truly collision-proof for distributed systems
  // but good enough for client-side unique IDs.
  const s = (len: number) => Math.random().toString(36).substring(2, 2 + len);
  return `c${s(8)}${s(4)}${s(4)}${s(4)}${s(12)}`;
};


export function CharacterFormCore({ initialCharacter, onSave, isCreating }: CharacterFormCoreProps) {
  const [character, setCharacter] = React.useState<Character>(
    initialCharacter || {
      id: generateCUID(),
      name: '',
      race: '', 
      alignment: '', 
      deity: '',
      size: SIZES[4], // Medium
      age: 20,
      gender: GENDERS[0].value, 
      abilityScores: { ...DEFAULT_ABILITIES },
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
      savingThrows: JSON.parse(JSON.stringify(DEFAULT_SAVING_THROWS)), // Deep copy
      classes: [{ id: generateCUID(), className: '', level: 1 }], 
      skills: ALL_SKILLS_3_5.map(skill => ({
        id: generateCUID(),
        name: skill.name,
        keyAbility: skill.keyAbility,
        ranks: 0,
        miscModifier: 0,
        isClassSkill: false,
      })),
      feats: [],
      inventory: [],
      personalStory: '',
      portraitDataUrl: undefined,
    }
  );
  const [ageEffectsDetails, setAgeEffectsDetails] = React.useState<AgingEffectsDetails | null>(null);
  const [sizeAbilityEffectsDetails, setSizeAbilityEffectsDetails] = React.useState<SizeAbilityEffectsDetails | null>(null);
  const [raceAbilityEffectsDetails, setRaceAbilityEffectsDetails] = React.useState<RaceAbilityEffectsDetails | null>(null);
  const [isRollerDialogOpen, setIsRollerDialogOpen] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();


  React.useEffect(() => {
    if (character.race && character.age > 0) {
      const details = getNetAgingEffects(character.race as DndRace, character.age);
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
      const details = getRaceAbilityEffects(character.race as DndRace);
      setRaceAbilityEffectsDetails(details);
    } else {
      setRaceAbilityEffectsDetails(null);
    }
  }, [character.race]);

  React.useEffect(() => {
    const selectedRaceInfo = DND_RACES.find(r => r.value.toLowerCase() === character.race?.toLowerCase());
    if (selectedRaceInfo) {
      const raceKey = selectedRaceInfo.value as DndRace;
      const minAdultAge = (constantsData.DND_RACE_MIN_ADULT_AGE_DATA as Record<DndRace, number>)[raceKey];
      if (minAdultAge !== undefined && character.age < minAdultAge) {
        setCharacter(prev => ({ ...prev, age: minAdultAge }));
      }
    }
  }, [character.race]);


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
      setCharacter(prev => ({
        ...prev,
        classes: [{ ...prev.classes[0], id: prev.classes[0]?.id || generateCUID(), className: value, level: 1 }]
      }));
    } else if (name === 'size') {
       setCharacter(prev => ({ ...prev, [name]: value as CharacterSize, sizeModifierAC: calculateAbilityModifier(prev.abilityScores.dexterity) + (SIZES.indexOf(value as CharacterSize) - 4) * (value === SIZES[5] || value === SIZES[6] || value === SIZES[7] || value === SIZES[8] ? -1 : 1) }));
    } else if (name === 'race') {
      setCharacter(prev => ({ ...prev, race: value }));
    } else if (name === 'gender' || name === 'deity' || name === 'alignment') {
      setCharacter(prev => ({ ...prev, [name]: value }));
    }
     else {
      setCharacter(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleClassChange = (value: string) => { // value is the className
      setCharacter(prev => ({
        ...prev,
        classes: [{ ...prev.classes[0], id: prev.classes[0]?.id || generateCUID(), className: value, level: 1 }]
      }));
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
    
    const selectedRaceInfoForValidation = DND_RACES.find(r => r.value.toLowerCase() === character.race?.toLowerCase());
    const minAgeForValidation = (selectedRaceInfoForValidation ? (constantsData.DND_RACE_MIN_ADULT_AGE_DATA as Record<DndRace, number>)[selectedRaceInfoForValidation.value as DndRace] : undefined) || 1;

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

    const finalCharacterData = {
      ...character,
      classes: [{ ...character.classes[0], level: 1 }], 
      sizeModifierAC: calculateAbilityModifier(character.abilityScores.dexterity) + (SIZES.indexOf(character.size as CharacterSize) - 4) * (character.size === SIZES[5] || character.size === SIZES[6] || character.size === SIZES[7] || character.size === SIZES[8] ? -1 : 1)
    };
    onSave(finalCharacterData);
  };

  const abilityNames: AbilityName[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
  const selectedClassInfo = DND_CLASSES.find(c => c.value.toLowerCase() === character.classes[0]?.className?.toLowerCase());

  const isPredefinedRace = React.useMemo(
    () => DND_RACES.some(r => r.value.toLowerCase() === character.race?.toLowerCase()),
    [character.race]
  );
  const isPredefinedClass = React.useMemo(
    () => DND_CLASSES.some(c => c.value.toLowerCase() === character.classes[0]?.className?.toLowerCase()),
    [character.classes]
  );

  const currentMinAgeForInput = React.useMemo(() => {
    const selectedRaceInfo = DND_RACES.find(r => r.value.toLowerCase() === character.race?.toLowerCase());
    if (selectedRaceInfo) {
      return (constantsData.DND_RACE_MIN_ADULT_AGE_DATA as Record<DndRace, number>)[selectedRaceInfo.value as DndRace] || 1;
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
          {/* Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" value={character.name} onChange={handleChange} />
            </div>
            {/* Race */}
            <div className="space-y-1">
              <Label htmlFor="race">Race</Label>
              <div className="flex items-center gap-2">
                <div className="flex-grow">
                  <ComboboxPrimitive
                    options={DND_RACES as readonly ComboboxOption[]}
                    value={character.race}
                    onChange={(value) => handleSelectChange('race', value)}
                    placeholder="Select or type race"
                    searchPlaceholder="Search races..."
                    emptyPlaceholder="No race found. Type to add custom."
                    isEditable={true}
                  />
                </div>
                 {isPredefinedRace && character.race && (
                   <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                )}
                {!isPredefinedRace && character.race && (
                  <Button type="button" variant="outline" size="sm" className="shrink-0 h-10">Customize...</Button>
                )}
              </div>
              {raceAbilityEffectsDetails && (
                <p className="text-xs text-muted-foreground mt-1 ml-1">
                  {raceAbilityEffectsDetails.effects.length > 0 ? (
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
                  ) : (
                   <span>No impact on ability scores</span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Class & Alignment */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <div className="space-y-1">
                <Label htmlFor="className">Class</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-grow">
                    <ComboboxPrimitive
                      options={DND_CLASSES as readonly ComboboxOption[]}
                      value={character.classes[0]?.className || ''}
                      onChange={handleClassChange}
                      placeholder="Select or type class"
                      searchPlaceholder="Search classes..."
                      emptyPlaceholder="No class found. Type to add custom."
                      isEditable={true}
                    />
                  </div>
                   {isPredefinedClass && character.classes[0]?.className && (
                    <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10">
                      <HelpCircle className="h-5 w-5" />
                    </Button>
                  )}
                  {!isPredefinedClass && character.classes[0]?.className && (
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
                      {ALIGNMENTS.map(align => <SelectItem key={align} value={align}>{align}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10">
                  <HelpCircle className="h-5 w-5" />
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
                      options={DND_DEITIES as readonly ComboboxOption[]}
                      value={character.deity || ''}
                      onChange={(value) => handleSelectChange('deity', value)}
                      placeholder="Select or type deity"
                      searchPlaceholder="Search deities..."
                      emptyPlaceholder="No deity found. Type to add."
                      isEditable={true}
                    />
                </div>
                 <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10">
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>


          {/* Age, Gender & Size */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="space-y-1">
              <Label htmlFor="age">Age</Label>
              <Input id="age" name="age" type="number" value={character.age} onChange={handleChange} min={currentMinAgeForInput} />
               {ageEffectsDetails && (
                <div className="text-xs text-muted-foreground mt-1 ml-1">
                  {ageEffectsDetails.effects.length > 0 ? (
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
                  ) : (
                   <span>No impact on ability scores</span>
                  )}
                  {ageEffectsDetails.categoryName && ageEffectsDetails.categoryName !== "Adult" && (
                     <div className="mt-0.5">{ageEffectsDetails.categoryName}</div>
                  )}
                   {ageEffectsDetails.categoryName === "Adult" && ageEffectsDetails.effects.length === 0 && (
                     <div className="mt-0.5">{/* Placeholder to maintain layout if needed, or remove if not causing alignment issues */}</div>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="gender">Gender</Label>
              <ComboboxPrimitive
                  options={GENDERS as readonly ComboboxOption[]}
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
                  {SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              {sizeAbilityEffectsDetails && (
                <p className="text-xs text-muted-foreground mt-1 ml-1">
                  {sizeAbilityEffectsDetails.effects.length > 0 ? (
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
                  ) : (
                    <span>No impact on ability scores</span>
                  )}
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

      {/* Personal Story & Portrait Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
             <UserSquare2 className="h-8 w-8 text-primary" /> {/* Or Palette icon for appearance */}
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
            {/* Portrait Upload Area */}
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
              {/* Fallback if image is not showing for placeholder */}
               {!character.portraitDataUrl && (
                <div className="hidden">
                    <Image src="https://placehold.co/300x300.png" alt="Portrait Placeholder" width={300} height={300} data-ai-hint="fantasy portrait" />
                </div>
              )}
            </div>

            {/* Personal Story Textarea */}
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
    </>
  );
}
