
'use client';

import * as React from 'react';
import type {
  Character,
  CharacterClass,
  DndRaceId,
  DndClassId,
  CharacterAlignment,
  DndDeityId,
  CharacterSize,
  GenderId,
  AgingEffectsDetails,
  SizeAbilityEffectsDetails,
  RaceSpecialQualities,
  DndRaceOption,
  DndClassOption,
  DndDeityOption,
} from '@/types/character';
import {
  SIZES,
  ALIGNMENTS,
  DND_RACES,
  DND_CLASSES,
  GENDERS,
  DND_DEITIES,
  isAlignmentCompatible,
} from '@/types/character';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollText, Info } from 'lucide-react';
import { ComboboxPrimitive } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Badge } from '@/components/ui/badge'; // Added import for Badge

interface CharacterFormCoreInfoSectionProps {
  characterData: Pick<Character, 'name' | 'race' | 'alignment' | 'deity' | 'size' | 'age' | 'gender' | 'classes'>;
  onFieldChange: (field: keyof Character, value: any) => void;
  onClassChange: (className: DndClassId | string) => void;
  ageEffectsDetails: AgingEffectsDetails | null;
  sizeAbilityEffectsDetails: SizeAbilityEffectsDetails | null;
  raceSpecialQualities: RaceSpecialQualities | null;
  selectedClassInfo: DndClassOption | undefined;
  isPredefinedRace: boolean;
  isPredefinedClass: boolean;
  currentMinAgeForInput: number;
  onOpenRaceInfoDialog: () => void;
  onOpenClassInfoDialog: () => void;
  onOpenAlignmentInfoDialog: () => void;
  onOpenDeityInfoDialog: () => void;
}

export function CharacterFormCoreInfoSection({
  characterData,
  onFieldChange,
  onClassChange,
  ageEffectsDetails,
  sizeAbilityEffectsDetails,
  raceSpecialQualities,
  selectedClassInfo,
  isPredefinedRace, 
  isPredefinedClass, 
  currentMinAgeForInput,
  onOpenRaceInfoDialog,
  onOpenClassInfoDialog,
  onOpenAlignmentInfoDialog,
  onOpenDeityInfoDialog,
}: CharacterFormCoreInfoSectionProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name as keyof Character;
    // Age is handled by NumberSpinnerInput now
    onFieldChange(field, value);
  };

  const handleSelectChange = (field: keyof Character, value: string) => {
    onFieldChange(field, value);
  };

  const filteredDeities = React.useMemo(() => {
    if (!characterData.alignment) {
      return DND_DEITIES; 
    }
    return DND_DEITIES.filter(deity =>
      isAlignmentCompatible(characterData.alignment, deity.alignment)
    );
  }, [characterData.alignment]);

  React.useEffect(() => {
    if (characterData.alignment && characterData.deity) {
      const currentDeity = DND_DEITIES.find(d => d.value === characterData.deity);
      if (currentDeity && !isAlignmentCompatible(characterData.alignment, currentDeity.alignment)) {
        onFieldChange('deity', '');
      }
    }
  }, [characterData.alignment, characterData.deity, onFieldChange]);


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <ScrollText className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-serif">
              Core Attributes
            </CardTitle>
            <CardDescription>
              Define the fundamental aspects of your adventurer.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Name and Race */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" value={characterData.name} onChange={handleInputChange} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="race">Race</Label>
            <div className="flex items-center gap-2">
              <div className="flex-grow">
                <ComboboxPrimitive
                  options={DND_RACES}
                  value={characterData.race}
                  onChange={(value) => handleSelectChange('race', value)}
                  placeholder="Select or type race"
                  searchPlaceholder="Search races..."
                  emptyPlaceholder="No race found. Type to add custom."
                  isEditable={true}
                />
              </div>
              {isPredefinedRace && characterData.race && (
                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10" onClick={onOpenRaceInfoDialog}>
                  <Info className="h-5 w-5" />
                </Button>
              )}
               {characterData.race && !isPredefinedRace && characterData.race.trim() !== '' && (
                <Button type="button" variant="outline" size="sm" className="shrink-0 h-10">Customize...</Button>
              )}
            </div>
            {isPredefinedRace && raceSpecialQualities?.abilityEffects && raceSpecialQualities.abilityEffects.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 ml-1">
                {raceSpecialQualities.abilityEffects.map((effect) => (
                  <Badge
                    key={effect.ability}
                    variant={effect.change === 0 ? "outline" : effect.change < 0 ? "destructive" : "outline"}
                    className={cn(
                      "font-normal text-xs", // Badges are font-semibold by default, text-xs for smaller text
                      effect.change > 0 && "text-emerald-600 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20",
                      // Destructive variant handles its own colors, including hover
                      effect.change < 0 && "hover:bg-destructive/80", // Ensure hover for destructive is consistent
                      effect.change === 0 && "text-muted-foreground border-muted-foreground/30 bg-muted/50"
                    )}
                  >
                    {effect.ability.substring(0, 3).toUpperCase()} {effect.change > 0 ? '+' : ''}{effect.change}
                  </Badge>
                ))}
              </div>
            )}
            {isPredefinedRace && (!raceSpecialQualities?.abilityEffects || raceSpecialQualities.abilityEffects.length === 0) && (
                <p className="text-xs text-muted-foreground mt-1 ml-1">No ability score adjustments.</p>
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
                  value={characterData.classes[0]?.className || ''}
                  onChange={(value) => onClassChange(value)}
                  placeholder="Select or type class"
                  searchPlaceholder="Search classes..."
                  emptyPlaceholder="No class found. Type to add custom."
                  isEditable={true}
                />
              </div>
              {isPredefinedClass && characterData.classes[0]?.className && (
                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10"
                  onClick={onOpenClassInfoDialog}>
                  <Info className="h-5 w-5" />
                </Button>
              )}
              {characterData.classes[0]?.className && !isPredefinedClass && characterData.classes[0]?.className.trim() !== '' && (
                <Button type="button" variant="outline" size="sm" className="shrink-0 h-10">Customize...</Button>
              )}
            </div>
            {selectedClassInfo?.hitDice && (
              <p className="text-xs text-muted-foreground mt-1 ml-1">Hit Dice: <strong className="font-bold text-primary">{selectedClassInfo.hitDice}</strong></p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="alignment">Alignment</Label>
            <div className="flex items-center gap-2">
              <div className="flex-grow">
                <Select name="alignment" value={characterData.alignment} onValueChange={(value) => handleSelectChange('alignment', value as CharacterAlignment)}>
                  <SelectTrigger><SelectValue placeholder="Select alignment" /></SelectTrigger>
                  <SelectContent>
                    {ALIGNMENTS.map(align => <SelectItem key={align.value} value={align.value}>{align.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10"
                  onClick={onOpenAlignmentInfoDialog}>
                  <Info className="h-5 w-5" />
                </Button>
            </div>
          </div>
        </div>

        {/* Deity */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-1">
              <Label htmlFor="deity">Deity</Label>
              <div className="flex items-center gap-2">
                <div className="flex-grow">
                  <ComboboxPrimitive
                    options={filteredDeities}
                    value={characterData.deity || ''}
                    onChange={(value) => handleSelectChange('deity', value as DndDeityId | string)}
                    placeholder="Select or type deity"
                    searchPlaceholder="Search deities..."
                    emptyPlaceholder="No deity found. Type to add."
                    isEditable={true}
                  />
                </div>
                {characterData.deity && characterData.deity.trim() !== '' && (
                  <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10"
                    onClick={onOpenDeityInfoDialog}>
                    <Info className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
        </div>


        {/* Age, Gender, Size */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="space-y-1">
            <Label htmlFor="age">Age</Label>
            <NumberSpinnerInput
              id="age"
              value={characterData.age}
              onChange={(newValue) => onFieldChange('age', newValue)}
              min={currentMinAgeForInput}
              max={1000} // A reasonable upper limit for age
              inputClassName="h-10 text-base" // Match other inputs in this section
              buttonClassName="h-10 w-10"
              buttonSize="icon"
            />
            {ageEffectsDetails && ageEffectsDetails.effects.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1 ml-1 space-y-0.5">
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
                {ageEffectsDetails.categoryName !== 'Adult' && (
                  <p className="text-xs">{ageEffectsDetails.categoryName}</p>
                )}
              </div>
            )}
            </div>
          <div className="space-y-1">
            <Label htmlFor="gender">Gender</Label>
            <ComboboxPrimitive
              options={GENDERS}
              value={characterData.gender}
              onChange={(value) => handleSelectChange('gender', value as GenderId | string)}
              placeholder="Select or type gender"
              searchPlaceholder="Search genders..."
              emptyPlaceholder="No gender found. Type to add."
              isEditable={true}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="size">Size</Label>
            <Select name="size" value={characterData.size} onValueChange={(value) => handleSelectChange('size', value as CharacterSize)}>
              <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
              <SelectContent>
                {SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {sizeAbilityEffectsDetails && sizeAbilityEffectsDetails.effects.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1 ml-1">
                {sizeAbilityEffectsDetails.effects.map((effect, index) => (
                    <React.Fragment key={effect.ability}>
                      <strong className={cn("font-bold", effect.change < 0 ? 'text-destructive' : 'text-emerald-500')}>
                        {effect.ability.substring(0, 3).toUpperCase()} {effect.change > 0 ? '+' : ''}{effect.change}
                      </strong>
                      {index < sizeAbilityEffectsDetails.effects.length - 1 && <span className="text-muted-foreground">, </span>}
                    </React.Fragment>
                  ))}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
