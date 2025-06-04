
'use client';

import type { Character, CharacterAlignment, CharacterSize, CharacterClass, DndRaceId, DndClassId, DndDeityId, GenderId } from '@/types/character';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCircle2 } from 'lucide-react';
import { SIZES, ALIGNMENTS } from '@/types/character';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput'; // Added import
import { cn } from '@/lib/utils';

interface CoreInfoSectionProps {
  character: Pick<Character, 'name' | 'race' | 'alignment' | 'deity' | 'size' | 'age' | 'gender' | 'classes'>;
  onCoreValueChange: <K extends keyof Character>(field: K, value: Character[K]) => void;
  onClassChange: (classIndex: number, field: keyof CharacterClass, value: string | number) => void;
}

export function CoreInfoSection({ character, onCoreValueChange, onClassChange }: CoreInfoSectionProps) {
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name as keyof Character;
    // Age and Level are now handled by NumberSpinnerInput
    onCoreValueChange(field, value as any);
  };

  const handleSelectChange = (field: keyof Character, value: string) => {
    if (field === 'alignment') {
      onCoreValueChange(field, value as CharacterAlignment);
    } else if (field === 'size') {
      onCoreValueChange(field, value as CharacterSize);
    } else {
      onCoreValueChange(field, value as any);
    }
  };

  const handleClassFieldChange = (index: number, field: keyof CharacterClass, value: string | number) => {
    onClassChange(index, field, value);
  };

  const firstClass = character.classes[0] || { id: crypto.randomUUID(), className: '', level: 1 };


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <UserCircle2 className="h-6 w-6 text-primary" />
          <CardTitle className="font-serif">Core Information</CardTitle>
        </div>
        <CardDescription>Define the fundamental aspects of your character.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" value={character.name} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="race">Race</Label>
            <Input id="race" name="race" value={character.race as string} onChange={handleInputChange} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="className">Class</Label>
            <Input 
              id="className" 
              name="className" 
              value={firstClass.className as string} 
              onChange={(e) => handleClassFieldChange(0, 'className', e.target.value)}
              placeholder="e.g., Fighter"
            />
          </div>
          <div>
            <Label htmlFor="level">Level</Label>
            <NumberSpinnerInput
              id="level"
              value={firstClass.level}
              onChange={(newValue) => handleClassFieldChange(0, 'level', newValue)}
              min={1}
              max={20} // Common D&D max level
              inputClassName="w-24 h-10 text-base text-center" // Ensure text is centered in input
              buttonClassName="h-10 w-10"
              className="justify-center" // Center the spinner's internal content
            />
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="alignment">Alignment</Label>
            <Select name="alignment" value={character.alignment} onValueChange={(value) => handleSelectChange('alignment', value)}>
              <SelectTrigger><SelectValue placeholder="Select alignment" /></SelectTrigger>
              <SelectContent>
                {ALIGNMENTS.map(align => <SelectItem key={align.value} value={align.value}>{align.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="deity">Deity</Label>
            <Input id="deity" name="deity" value={character.deity as string || ''} onChange={handleInputChange} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="age-cs" className="inline-block w-full text-center">Age</Label>
            <NumberSpinnerInput
              id="age-cs"
              value={character.age}
              onChange={(newValue) => onCoreValueChange('age', newValue)}
              min={1} // Or a race-specific min
              max={1000}
              inputClassName="w-24 h-10 text-base text-center" // Ensure text is centered
              buttonClassName="h-10 w-10"
              className="justify-center" // Center the spinner's internal content
            />
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Input id="gender" name="gender" value={character.gender as string} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="size">Size</Label>
            <Select name="size" value={character.size} onValueChange={(value) => handleSelectChange('size', value)}>
              <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
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
