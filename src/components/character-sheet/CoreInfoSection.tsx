'use client';

import type { Character, CharacterAlignment, CharacterSize, CharacterClass } from '@/types/character';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCircle2 } from 'lucide-react';
import { SIZES, ALIGNMENTS } from '@/types/character'; // Assuming these are defined in types

interface CoreInfoSectionProps {
  character: Pick<Character, 'name' | 'race' | 'alignment' | 'deity' | 'size' | 'age' | 'gender' | 'classes'>;
  onCoreValueChange: <K extends keyof Character>(field: K, value: Character[K]) => void;
  onClassChange: (classIndex: number, field: keyof CharacterClass, value: string | number) => void;
}

export function CoreInfoSection({ character, onCoreValueChange, onClassChange }: CoreInfoSectionProps) {
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name as keyof Character;
    if (name === 'age') {
      onCoreValueChange(field, parseInt(value, 10) || 0 as any);
    } else {
      onCoreValueChange(field, value as any);
    }
  };

  const handleSelectChange = (field: keyof Character, value: string) => {
    onCoreValueChange(field, value as any);
  };

  const handleClassFieldChange = (index: number, field: keyof CharacterClass, value: string | number) => {
    onClassChange(index, field, value);
  };

  // For simplicity, this form handles only the first class. 
  // A more complex UI would be needed for multiclassing.
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
            <Input id="race" name="race" value={character.race} onChange={handleInputChange} />
          </div>
        </div>

        {/* Simplified Class/Level Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="className">Class</Label>
            <Input 
              id="className" 
              name="className" 
              value={firstClass.className} 
              onChange={(e) => handleClassFieldChange(0, 'className', e.target.value)}
              placeholder="e.g., Fighter"
            />
          </div>
          <div>
            <Label htmlFor="level">Level</Label>
            <Input 
              id="level" 
              name="level" 
              type="number" 
              value={firstClass.level} 
              onChange={(e) => handleClassFieldChange(0, 'level', parseInt(e.target.value, 10) || 1)} 
              min="1"
            />
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="alignment">Alignment</Label>
            <Select name="alignment" value={character.alignment} onValueChange={(value) => handleSelectChange('alignment', value)}>
              <SelectTrigger><SelectValue placeholder="Select alignment" /></SelectTrigger>
              <SelectContent>
                {ALIGNMENTS.map(align => <SelectItem key={align} value={align}>{align}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="deity">Deity (Optional)</Label>
            <Input id="deity" name="deity" value={character.deity || ''} onChange={handleInputChange} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="size">Size</Label>
            <Select name="size" value={character.size} onValueChange={(value) => handleSelectChange('size', value)}>
              <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
              <SelectContent>
                {SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="age">Age</Label>
            <Input id="age" name="age" type="number" value={character.age} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Input id="gender" name="gender" value={character.gender} onChange={handleInputChange} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
