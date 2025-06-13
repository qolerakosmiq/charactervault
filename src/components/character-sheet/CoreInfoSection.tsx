
'use client';

import type { Character, CharacterAlignment, CharacterSize, CharacterClass, DndRaceId, DndClassId, DndDeityId, GenderId } from '@/types/character';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCircle2, Loader2 } from 'lucide-react';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';

interface CoreInfoSectionProps {
  character: Pick<Character, 'name' | 'race' | 'alignment' | 'deity' | 'size' | 'age' | 'gender' | 'classes' | 'playerName' | 'campaign' | 'homeland'>; // Added playerName, campaign, homeland
  onCoreValueChange: <K extends keyof Character>(field: K, value: Character[K]) => void;
  onClassChange: (classIndex: number, field: keyof CharacterClass, value: string | number) => void;
}

export function CoreInfoSection({ character, onCoreValueChange, onClassChange }: CoreInfoSectionProps) {
  const { translations, isLoading: translationsLoading } = useI18n();
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name as keyof Character;
    onCoreValueChange(field, value as any);
  };

  const handleSelectChange = (field: keyof Character, value: string) => {
    if (field === 'alignment') {
      onCoreValueChange(field, value as CharacterAlignment);
    } else if (field === 'size') {
      onCoreValueChange(field, value as CharacterSize);
    } else if (field === 'race') {
      onCoreValueChange(field, value as DndRaceId);
    } else {
      onCoreValueChange(field, value as any);
    }
  };

  const handleClassFieldChange = (index: number, field: keyof CharacterClass, value: string | number) => {
    onClassChange(index, field, value);
  };

  const firstClass = character.classes[0] || { id: crypto.randomUUID(), className: '', level: 1 };

  if (translationsLoading || !translations) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <UserCircle2 className="h-6 w-6 text-primary" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>{translations?.UI_STRINGS.characterNameLabel || "Name"}</Label><Skeleton className="h-10 w-full" /></div>
            <div><Label>{translations?.UI_STRINGS.raceLabel || "Race"}</Label><Skeleton className="h-10 w-full" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>{translations?.UI_STRINGS.classLabel || "Class"}</Label><Skeleton className="h-10 w-full" /></div>
            <div><Label>{translations?.UI_STRINGS.levelLabel || "Level"}</Label><Skeleton className="h-10 w-24" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>{translations?.UI_STRINGS.alignmentLabel || "Alignment"}</Label><Skeleton className="h-10 w-full" /></div>
            <div><Label>{translations?.UI_STRINGS.deityLabel || "Deity"}</Label><Skeleton className="h-10 w-full" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label className="inline-block w-full text-center">{translations?.UI_STRINGS.ageLabel || "Age"}</Label><Skeleton className="h-10 w-24 mx-auto" /></div>
            <div><Label>{translations?.UI_STRINGS.genderLabel || "Gender"}</Label><Skeleton className="h-10 w-full" /></div>
            <div><Label>{translations?.UI_STRINGS.sizeLabel || "Size"}</Label><Skeleton className="h-10 w-full" /></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  const { SIZES, ALIGNMENTS, UI_STRINGS, DND_RACES, DND_CLASSES } = translations;

  const currentRaceLabel = DND_RACES.find(r => r.value === character.race)?.label || character.race || UI_STRINGS.selectRacePlaceholder;
  const currentClassLabel = DND_CLASSES.find(c => c.value === firstClass.className)?.label || firstClass.className || UI_STRINGS.selectClassPlaceholder;
  const currentAlignmentLabel = ALIGNMENTS.find(a => a.value === character.alignment)?.label || character.alignment || UI_STRINGS.selectAlignmentPlaceholder;
  const currentSizeLabel = SIZES.find(s => s.value === character.size)?.label || character.size || UI_STRINGS.selectSizePlaceholder;
  const currentGenderLabel = GENDERS.find(g => g.value === character.gender)?.label || character.gender || UI_STRINGS.selectGenderPlaceholder;


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <UserCircle2 className="h-6 w-6 text-primary" />
          <CardTitle className="font-serif">{UI_STRINGS.coreInfoSectionTitle || "Core Information"}</CardTitle>
        </div>
        <CardDescription>{UI_STRINGS.coreInfoSectionDescription || "Fundamental aspects of your character."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name-cs">{UI_STRINGS.characterNameLabel || "Name"}</Label>
            <Input id="name-cs" name="name" value={character.name} onChange={handleInputChange} />
          </div>
           <div>
            <Label htmlFor="playerName-cs">{UI_STRINGS.playerNameLabel || "Player Name"}</Label>
            <Input id="playerName-cs" name="playerName" value={character.playerName || ''} onChange={handleInputChange} />
          </div>
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="campaign-cs">{UI_STRINGS.campaignLabel || "Campaign"}</Label>
            <Input id="campaign-cs" name="campaign" value={character.campaign || ''} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="homeland-cs">{UI_STRINGS.homelandLabel || "Homeland"}</Label>
            <Input id="homeland-cs" name="homeland" value={character.homeland || ''} onChange={handleInputChange} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
            <Label htmlFor="race-cs">{UI_STRINGS.raceLabel || "Race"}</Label>
            <Select name="race" value={character.race} onValueChange={(value) => handleSelectChange('race', value as DndRaceId)}>
              <SelectTrigger id="race-cs"><SelectValue placeholder={currentRaceLabel} /></SelectTrigger>
              <SelectContent>
                {DND_RACES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="className-cs">{UI_STRINGS.classLabel || "Class"}</Label>
            <Select name="className" value={firstClass.className} onValueChange={(value) => handleClassFieldChange(0, 'className', value as DndClassId)}>
              <SelectTrigger id="className-cs"><SelectValue placeholder={currentClassLabel} /></SelectTrigger>
              <SelectContent>
                 {DND_CLASSES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="level-cs">{UI_STRINGS.levelLabel || "Level"}</Label>
            <NumberSpinnerInput
              id="level-cs"
              value={firstClass.level}
              onChange={(newValue) => handleClassFieldChange(0, 'level', newValue)}
              min={1}
              max={20} 
              inputClassName="w-24 h-10 text-base text-center" 
              buttonClassName="h-10 w-10"
              className="justify-start" 
            />
          </div>
          <div>
            <Label htmlFor="alignment-cs">{UI_STRINGS.alignmentLabel || "Alignment"}</Label>
            <Select name="alignment" value={character.alignment} onValueChange={(value) => handleSelectChange('alignment', value)}>
              <SelectTrigger id="alignment-cs"><SelectValue placeholder={currentAlignmentLabel} /></SelectTrigger>
              <SelectContent>
                {ALIGNMENTS.map(align => <SelectItem key={align.value} value={align.value}>{align.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="deity-cs">{UI_STRINGS.deityLabel || "Deity"}</Label>
            <Input id="deity-cs" name="deity" value={character.deity as string || ''} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="age-cs-input" className="inline-block w-full">{UI_STRINGS.ageLabel || "Age"}</Label>
            <NumberSpinnerInput
              id="age-cs-input"
              value={character.age}
              onChange={(newValue) => onCoreValueChange('age', newValue)}
              min={1} 
              max={1000}
              inputClassName="w-full h-10 text-base text-center"
              buttonClassName="h-10 w-10"
            />
          </div>
          <div>
            <Label htmlFor="gender-cs">{UI_STRINGS.genderLabel || "Gender"}</Label>
            <Select name="gender" value={character.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
              <SelectTrigger id="gender-cs"><SelectValue placeholder={currentGenderLabel} /></SelectTrigger>
              <SelectContent>
                {GENDERS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="size-cs">{UI_STRINGS.sizeLabel || "Size"}</Label>
            <Select name="size" value={character.size} onValueChange={(value) => handleSelectChange('size', value)}>
              <SelectTrigger id="size-cs"><SelectValue placeholder={currentSizeLabel} /></SelectTrigger>
              <SelectContent>
                {SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
