
'use client';

import *as React from 'react';
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
  RaceSpecialQualities,
  DndRaceOption,
  DndClassOption,
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
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Badge } from '@/components/ui/badge';
import { ComboboxPrimitive } from '@/components/ui/combobox';

interface CharacterFormCoreInfoSectionProps {
  characterData: Pick<Character, 'name' | 'playerName' | 'race' | 'alignment' | 'deity' | 'size' | 'age' | 'gender' | 'classes'>;
  onFieldChange: (field: keyof Character, value: any) => void;
  onClassChange: (className: DndClassId | string) => void;
  ageEffectsDetails: AgingEffectsDetails | null;
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

const DEITY_NONE_OPTION_VALUE = "__NONE_DEITY__";

export function CharacterFormCoreInfoSection({
  characterData,
  onFieldChange,
  onClassChange,
  ageEffectsDetails,
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

  React.useEffect(() => {
    if (!characterData) return;

    if (!characterData.race) {
      onFieldChange('race', 'human' as DndRaceId);
    }
    if (!characterData.classes[0]?.className) {
      onClassChange('fighter' as DndClassId);
    }
    if (characterData.deity === undefined || characterData.deity === null) {
      onFieldChange('deity', DEITY_NONE_OPTION_VALUE);
    }
  }, []); // This effect sets initial defaults and should run once on mount

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name as keyof Character;
    onFieldChange(field, value);
  };

  const handleSelectChange = (field: keyof Character, value: string) => {
    onFieldChange(field, value);
  };

  const filteredDeities = React.useMemo(() => {
    if (!characterData || !characterData.alignment) {
      return DND_DEITIES;
    }
    return DND_DEITIES.filter(deity =>
      isAlignmentCompatible(characterData.alignment, deity.alignment)
    );
  }, [characterData]); // Changed dependency to characterData

  const deitySelectOptions = React.useMemo(() => {
    return [{ value: DEITY_NONE_OPTION_VALUE, label: "None" }, ...filteredDeities];
  }, [filteredDeities]);


  React.useEffect(() => {
    if (!characterData) return; // Guard against undefined characterData

    if (characterData.alignment && characterData.deity && characterData.deity !== DEITY_NONE_OPTION_VALUE) {
      const currentDeity = DND_DEITIES.find(d => d.value === characterData.deity);
      if (currentDeity && !isAlignmentCompatible(characterData.alignment, currentDeity.alignment)) {
        onFieldChange('deity', DEITY_NONE_OPTION_VALUE);
      }
    }
  }, [characterData, onFieldChange]); // Changed dependencies


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
        {/* Name, Player Name, Race */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="space-y-1.5">
            <Label htmlFor="name">Character Name</Label>
            <Input id="name" name="name" value={characterData?.name || ''} onChange={handleInputChange} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="playerName">Player Name</Label>
            <Input id="playerName" name="playerName" value={characterData?.playerName || ''} onChange={handleInputChange} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="race">Race</Label>
            <div className="flex items-center gap-2">
              <div className="flex-grow">
                <Select
                  value={characterData?.race || 'human'}
                  onValueChange={(value) => handleSelectChange('race', value as DndRaceId)}
                >
                  <SelectTrigger id="race">
                    <SelectValue placeholder="Select race" />
                  </SelectTrigger>
                  <SelectContent>
                    {DND_RACES.map(race => (
                      <SelectItem key={race.value} value={race.value}>{race.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10"
                onClick={onOpenRaceInfoDialog}
                disabled={!characterData?.race}
              >
                <Info className="h-5 w-5" />
              </Button>
            </div>
            {isPredefinedRace && raceSpecialQualities?.abilityEffects && raceSpecialQualities.abilityEffects.length > 0 && (
               <div className="flex flex-wrap items-baseline gap-1 pt-[6px] ml-1">
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
          </div>
        </div>

        {/* Class and Alignment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
           <div className="space-y-1.5">
            <Label htmlFor="className">Class</Label>
            <div className="flex items-center gap-2">
              <div className="flex-grow">
                <Select
                  value={characterData?.classes[0]?.className || 'fighter'}
                  onValueChange={(value) => onClassChange(value as DndClassId)}
                >
                  <SelectTrigger id="className">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {DND_CLASSES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10"
                onClick={onOpenClassInfoDialog}
                disabled={!characterData?.classes[0]?.className}
              >
                <Info className="h-5 w-5" />
              </Button>
            </div>
            {selectedClassInfo?.hitDice && (
              <div className="flex items-baseline gap-1 pt-[6px] ml-1">
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
          <div className="space-y-1.5">
            <Label htmlFor="alignment">Alignment</Label>
            <div className="flex items-center gap-2">
              <div className="flex-grow">
                <Select name="alignment" value={characterData?.alignment} onValueChange={(value) => handleSelectChange('alignment', value as CharacterAlignment)}>
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
            <div className="space-y-1.5">
              <Label htmlFor="deity">Deity</Label>
              <div className="flex items-center gap-2">
                <div className="flex-grow">
                  <Select
                    value={(characterData?.deity && characterData.deity.trim() !== '') ? characterData.deity : DEITY_NONE_OPTION_VALUE}
                    onValueChange={(value) => {
                        handleSelectChange('deity', value === DEITY_NONE_OPTION_VALUE ? '' : value);
                    }}
                  >
                    <SelectTrigger id="deity">
                      <SelectValue placeholder="Select deity" />
                    </SelectTrigger>
                    <SelectContent>
                      {deitySelectOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10"
                  onClick={onOpenDeityInfoDialog}
                  disabled={!characterData?.deity || characterData.deity.trim() === '' || characterData.deity === DEITY_NONE_OPTION_VALUE}
                >
                  <Info className="h-5 w-5" />
                </Button>
              </div>
            </div>
        </div>


        {/* Age, Gender, Size */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="space-y-1.5">
            <Label htmlFor="age" className="inline-block w-full text-center">Age</Label>
            <NumberSpinnerInput
              id="age"
              value={characterData?.age || currentMinAgeForInput}
              onChange={(newValue) => onFieldChange('age', newValue)}
              min={currentMinAgeForInput}
              max={1000}
              inputClassName="w-full h-10 text-base text-center"
              buttonClassName="h-10 w-10"
              buttonSize="icon"
            />
            {ageEffectsDetails && (ageEffectsDetails.categoryName !== 'Adult' || ageEffectsDetails.effects.length > 0) && (
              <div className="flex flex-wrap items-baseline justify-center gap-1 pt-[6px] ml-1">
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
          <div className="space-y-1.5">
            <Label htmlFor="gender">Gender</Label>
             <ComboboxPrimitive
                options={GENDERS}
                value={characterData?.gender || ""}
                onChange={(value) => handleSelectChange('gender', value)}
                placeholder="Select or type gender..."
                searchPlaceholder="Search genders..."
                emptyPlaceholder="No gender found."
                isEditable={true}
              />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="size">Size</Label>
            <Select name="size" value={characterData?.size} onValueChange={(value) => handleSelectChange('size', value as CharacterSize)}>
              <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
              <SelectContent>
                {SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-baseline gap-1 pt-[6px] ml-1">
              {characterData?.size && (() => {
                const selectedSizeObject = SIZES.find(s => s.value === characterData.size);
                if (selectedSizeObject && typeof selectedSizeObject.acModifier === 'number' && selectedSizeObject.acModifier !== 0) {
                  const acMod = selectedSizeObject.acModifier;
                  let badgeVariantProp: "destructive" | "secondary" | "default" = "secondary";
                  let badgeClassNameForAc = "text-xs font-normal";

                  if (acMod > 0) {
                    badgeClassNameForAc = cn(
                      badgeClassNameForAc,
                      "bg-emerald-700 text-emerald-100 border-emerald-600",
                      "hover:bg-emerald-700 hover:text-emerald-100"
                    );
                  } else if (acMod < 0) {
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

