
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
  // SizeAbilityEffectsDetails, // Removed as size no longer directly affects abilities
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
import { Badge } from '@/components/ui/badge';

interface CharacterFormCoreInfoSectionProps {
  characterData: Pick<Character, 'name' | 'race' | 'alignment' | 'deity' | 'size' | 'age' | 'gender' | 'classes'>;
  onFieldChange: (field: keyof Character, value: any) => void;
  onClassChange: (className: DndClassId | string) => void;
  ageEffectsDetails: AgingEffectsDetails | null;
  // sizeAbilityEffectsDetails: SizeAbilityEffectsDetails | null; // Removed
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
  // sizeAbilityEffectsDetails, // Removed
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
               <div className="flex flex-wrap gap-1 pt-[6px] ml-1">
                {raceSpecialQualities.abilityEffects.map((effect) => {
                  let badgeVariantProp: "destructive" | "secondary" | "default" = "secondary";
                  let badgeClassName = "text-xs font-normal";

                  if (effect.change > 0) { 
                    badgeClassName = cn(
                      badgeClassName,
                      "bg-emerald-700 text-emerald-100 border-emerald-600",
                      "hover:bg-emerald-700 hover:text-emerald-100"
                    );
                  } else if (effect.change < 0) { 
                    badgeVariantProp = "destructive";
                     badgeClassName = cn(badgeClassName, "hover:bg-destructive");
                  } else { 
                     badgeClassName = cn(
                      badgeClassName,
                      "bg-muted/50 text-muted-foreground border-border",
                      "hover:bg-muted/50 hover:text-muted-foreground"
                    );
                  }
                  return (
                    <Badge
                      key={effect.ability}
                      variant={badgeVariantProp}
                      className={badgeClassName}
                    >
                      {effect.ability.substring(0, 3).toUpperCase()}{effect.change !== 0 ? '\u00A0' : ''}
                      {effect.change > 0 ? '+' : ''}
                      {effect.change !==0 ? effect.change : ''}
                    </Badge>
                  );
                })}
              </div>
            )}
            {isPredefinedRace && (!raceSpecialQualities?.abilityEffects || raceSpecialQualities.abilityEffects.length === 0) && (
                <div className="pt-[6px] ml-1"><p className="text-xs text-muted-foreground">No ability score adjustments.</p></div>
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
              <div className="pt-[6px] ml-1">
                <Badge
                  variant="secondary"
                  className="text-xs font-normal hover:bg-secondary hover:text-secondary-foreground"
                >
                  Hit Dice:{'\u00A0'}
                  <strong className="font-bold">{selectedClassInfo.hitDice}</strong>
                </Badge>
              </div>
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
              inputClassName="w-full h-10 text-base" 
              buttonClassName="h-10 w-10"
              buttonSize="icon"
            />
            {ageEffectsDetails && (ageEffectsDetails.categoryName !== 'Adult' || ageEffectsDetails.effects.length > 0) && (
              <div className="flex flex-wrap items-center gap-1 pt-[6px] ml-1">
                <Badge
                  variant="secondary"
                  className="text-xs font-normal hover:bg-secondary hover:text-secondary-foreground"
                >
                  {ageEffectsDetails.categoryName}
                </Badge>
                {ageEffectsDetails.effects.map((effect) => {
                  let badgeVariantProp: "destructive" | "secondary" | "default" = "secondary";
                  let badgeClassName = "text-xs font-normal";

                  if (effect.change > 0) {
                    badgeClassName = cn(
                      badgeClassName,
                      "bg-emerald-700 text-emerald-100 border-emerald-600",
                      "hover:bg-emerald-700 hover:text-emerald-100" 
                    );
                  } else if (effect.change < 0) {
                    badgeVariantProp = "destructive";
                    badgeClassName = cn(badgeClassName, "hover:bg-destructive"); 
                  }
                  return (
                    <Badge
                      key={effect.ability}
                      variant={badgeVariantProp}
                      className={badgeClassName}
                    >
                      {effect.ability.substring(0, 3).toUpperCase()}{'\u00A0'}
                      {effect.change > 0 ? '+' : ''}
                      {effect.change}
                    </Badge>
                  );
                })}
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
            <div className="flex flex-wrap items-center gap-1 pt-[6px] ml-1">
              {/* Removed display of ability score modifications from size here */}
              {/* AC Modifier Badge for Size */}
              {characterData.size && (() => {
                const selectedSizeObject = SIZES.find(s => s.value === characterData.size);
                if (selectedSizeObject && typeof selectedSizeObject.acModifier === 'number' && selectedSizeObject.acModifier !== 0) {
                  const acMod = selectedSizeObject.acModifier;
                  let badgeVariantProp: "destructive" | "secondary" | "default" = "secondary";
                  let badgeClassNameForAc = "text-xs font-normal";

                  if (acMod > 0) { // Positive AC mod is good (smaller creatures get AC bonus)
                    badgeClassNameForAc = cn(
                      badgeClassNameForAc,
                      "bg-emerald-700 text-emerald-100 border-emerald-600",
                      "hover:bg-emerald-700 hover:text-emerald-100"
                    );
                  } else if (acMod < 0) { // Negative AC mod is bad (larger creatures get AC penalty)
                    badgeVariantProp = "destructive";
                    badgeClassNameForAc = cn(badgeClassNameForAc, "hover:bg-destructive");
                  }
                  return (
                    <Badge
                      variant={badgeVariantProp}
                      className={badgeClassNameForAc}
                    >
                      AC{'\u00A0'}{acMod >= 0 ? '+' : ''}{acMod}
                    </Badge>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

