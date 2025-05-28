
'use client';

import * as React from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { AbilityName, Character, CharacterClass, CharacterAlignment, CharacterSize } from '@/types/character';
import { DEFAULT_ABILITIES, DEFAULT_SAVING_THROWS, SIZES, ALIGNMENTS, ALL_SKILLS_3_5, DND_RACES, DND_CLASSES } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { calculateAbilityModifier } from '@/lib/dnd-utils';
import { ScrollText } from 'lucide-react';
import { ComboboxPrimitive } from '@/components/ui/combobox';

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
      alignment: ALIGNMENTS[4], // True Neutral
      deity: '',
      size: SIZES[4], // Medium
      age: 20,
      gender: '',
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
        isClassSkill: false, // This would be determined by class
      })),
      feats: [],
      inventory: [],
    }
  );

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

  const handleSelectChange = (name: keyof Character | 'className', value: string) => {
     if (name === 'className') {
      setCharacter(prev => ({
        ...prev,
        // For now, assumes single class. A more robust system would handle multiple classes.
        classes: [{ ...prev.classes[0], id: prev.classes[0]?.id || generateCUID(), className: value, level: prev.classes[0]?.level || 1 }]
      }));
    } else if (name === 'size') {
       setCharacter(prev => ({ ...prev, [name]: value as CharacterSize, sizeModifierAC: calculateAbilityModifier(prev.abilityScores.dexterity) + (SIZES.indexOf(value as CharacterSize) - 4) * (value === SIZES[5] || value === SIZES[6] || value === SIZES[7] || value === SIZES[8] ? -1 : 1) })); // simplified size mod
    } else if (name === 'race') {
      setCharacter(prev => ({ ...prev, race: value }));
    }
     else {
      setCharacter(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleClassLevelChange = (value: string) => {
    setCharacter(prev => ({
      ...prev,
      classes: [{ ...prev.classes[0], id: prev.classes[0]?.id || generateCUID(), className: prev.classes[0]?.className || '', level: parseInt(value,10) || 1 }]
    }));
  };


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Add any validation or final calculations here before saving
    const finalCharacterData = {
      ...character,
      // Ensure sizeModifierAC is correctly calculated based on current size
      sizeModifierAC: calculateAbilityModifier(character.abilityScores.dexterity) + (SIZES.indexOf(character.size as CharacterSize) - 4) * (character.size === SIZES[5] || character.size === SIZES[6] || character.size === SIZES[7] || character.size === SIZES[8] ? -1 : 1)
    };
    onSave(finalCharacterData);
  };
  
  const abilityNames: AbilityName[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
  const selectedClassInfo = DND_CLASSES.find(c => c.value === character.classes[0]?.className);

  return (
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" value={character.name} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="race">Race</Label>
              <div className="flex items-center gap-2">
                <div className="flex-grow">
                  <ComboboxPrimitive
                    options={DND_RACES}
                    value={character.race}
                    onChange={(value) => handleSelectChange('race', value)}
                    placeholder="Select Race"
                    searchPlaceholder="Search races..."
                    emptyPlaceholder="No race found."
                  />
                </div>
                <Button type="button" variant="outline" size="sm" className="shrink-0 h-10">Customize...</Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
              <Label htmlFor="className">Class</Label>
              <div className="flex items-center gap-2">
                <div className="flex-grow">
                  <ComboboxPrimitive
                    options={DND_CLASSES}
                    value={character.classes[0]?.className || ''}
                    onChange={(value) => handleSelectChange('className', value)}
                    placeholder="Select Class"
                    searchPlaceholder="Search classes..."
                    emptyPlaceholder="No class found."
                  />
                </div>
                <Button type="button" variant="outline" size="sm" className="shrink-0 h-10">Customize...</Button>
              </div>
              {selectedClassInfo && (
                <p className="text-xs text-muted-foreground mt-1 ml-1">Hit Dice: {selectedClassInfo.hitDice}</p>
              )}
            </div>
            <div>
              <Label htmlFor="level">Level</Label>
              <div className="flex items-center gap-2">
                <div className="flex-grow">
                  <Input id="level" name="level" type="number" value={character.classes[0]?.level || 1} onChange={(e) => handleClassLevelChange(e.target.value)} min="1" />
                </div>
                <Button type="button" variant="outline" size="sm" className="shrink-0 h-10">Customize...</Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
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
              <Label htmlFor="size">Size</Label>
              <Select name="size" value={character.size} onValueChange={(value) => handleSelectChange('size', value)}>
                <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                <SelectContent>
                  {SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div>
              <Label htmlFor="age">Age</Label>
              <Input id="age" name="age" type="number" value={character.age} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Input id="gender" name="gender" value={character.gender} onChange={handleChange} />
            </div>
             <div>
              <Label htmlFor="deity">Deity (Optional)</Label>
              <Input id="deity" name="deity" value={character.deity || ''} onChange={handleChange} />
            </div>
          </div>
          
          <Separator className="my-6" />
          <h3 className="text-xl font-serif font-semibold text-primary">Ability Scores</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {abilityNames.map(ability => (
              <div key={ability} className="space-y-1">
                <Label htmlFor={ability} className="capitalize">{ability.substring(0,3).toUpperCase()}</Label>
                <Input
                  id={ability}
                  name={ability}
                  type="number"
                  value={character.abilityScores[ability]}
                  onChange={(e) => handleAbilityScoreChange(ability, e.target.value)}
                  className="text-center"
                />
                <p className="text-center text-sm text-accent font-semibold">
                  Mod: {calculateAbilityModifier(character.abilityScores[ability]) >= 0 ? '+' : ''}{calculateAbilityModifier(character.abilityScores[ability])}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Button type="submit" size="lg" className="w-full md:w-auto shadow-md hover:shadow-lg transition-shadow">
        {isCreating ? 'Create Character' : 'Save Changes'}
      </Button>
    </form>
  );
}
