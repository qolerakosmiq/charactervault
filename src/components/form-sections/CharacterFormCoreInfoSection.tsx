
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
} from '@/types/character-core';
import { isAlignmentCompatible } from '@/types/character';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollText, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Badge } from '@/components/ui/badge';
import { ComboboxPrimitive } from '@/components/ui/combobox';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';

const DEBOUNCE_DELAY = 400; // ms

interface CharacterFormCoreInfoSectionProps {
  characterData: Pick<Character, 'name' | 'playerName' | 'race' | 'alignment' | 'deity' | 'size' | 'age' | 'gender' | 'classes'>;
  onFieldChange: (field: keyof Character, value: any) => void;
  onClassChange: (className: DndClassId | string) => void;
  ageEffectsDetails: AgingEffectsDetails | null;
  raceSpecialQualities: RaceSpecialQualities | null;
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
  currentMinAgeForInput,
  onOpenRaceInfoDialog,
  onOpenClassInfoDialog,
  onOpenAlignmentInfoDialog,
  onOpenDeityInfoDialog,
}: CharacterFormCoreInfoSectionProps) {
  const { translations, isLoading: translationsLoading } = useI18n();

  // Local states for debounced inputs
  const [localName, setLocalName] = React.useState(characterData.name);
  const [localPlayerName, setLocalPlayerName] = React.useState(characterData.playerName);
  const [localRace, setLocalRace] = React.useState(characterData.race);
  const [localClassName, setLocalClassName] = React.useState(characterData.classes[0]?.className || '');
  const [localAlignment, setLocalAlignment] = React.useState(characterData.alignment);
  const [localDeity, setLocalDeity] = React.useState(characterData.deity);
  const [localAge, setLocalAge] = React.useState(characterData.age);
  const [localGender, setLocalGender] = React.useState(characterData.gender);
  const [localSize, setLocalSize] = React.useState(characterData.size);

  // Sync local states with props
  React.useEffect(() => { setLocalName(characterData.name); }, [characterData.name]);
  React.useEffect(() => { setLocalPlayerName(characterData.playerName); }, [characterData.playerName]);
  React.useEffect(() => { setLocalRace(characterData.race); }, [characterData.race]);
  React.useEffect(() => { setLocalClassName(characterData.classes[0]?.className || ''); }, [characterData.classes]);
  React.useEffect(() => { setLocalAlignment(characterData.alignment); }, [characterData.alignment]);
  React.useEffect(() => { setLocalDeity(characterData.deity); }, [characterData.deity]);
  React.useEffect(() => { setLocalAge(characterData.age); }, [characterData.age]);
  React.useEffect(() => { setLocalGender(characterData.gender); }, [characterData.gender]);
  React.useEffect(() => { setLocalSize(characterData.size); }, [characterData.size]);

  // Generic debounce effect hook
  const useDebounceEffectForField = (localValue: any, propValue: any, fieldName: keyof Character | 'class', updateFunction: (field: any, value: any) => void) => {
    React.useEffect(() => {
      const handler = setTimeout(() => {
        if (localValue !== propValue) {
          if (fieldName === 'class') {
            updateFunction(localValue as DndClassId | string, ''); // Second arg not used by onClassChange
          } else {
            updateFunction(fieldName, localValue);
          }
        }
      }, DEBOUNCE_DELAY);
      return () => clearTimeout(handler);
    }, [localValue, propValue, fieldName, updateFunction]);
  };

  // Debounce effects for text inputs and number spinner
  useDebounceEffectForField(localName, characterData.name, 'name', onFieldChange);
  useDebounceEffectForField(localPlayerName, characterData.playerName, 'playerName', onFieldChange);
  React.useEffect(() => { // Special handling for age with min value
    const handler = setTimeout(() => {
      const ageToCommit = Math.max(localAge, currentMinAgeForInput);
      if (ageToCommit !== characterData.age) {
        onFieldChange('age', ageToCommit);
      }
      if (localAge < currentMinAgeForInput && localAge !== ageToCommit) { // only setLocalAge if it would change
        setLocalAge(ageToCommit);
      }
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(handler);
  }, [localAge, characterData.age, onFieldChange, currentMinAgeForInput]);
  useDebounceEffectForField(localGender, characterData.gender, 'gender', onFieldChange);

  // Debounce effects for Select components
  useDebounceEffectForField(localRace, characterData.race, 'race', onFieldChange);
  useDebounceEffectForField(localAlignment, characterData.alignment, 'alignment', onFieldChange);
  useDebounceEffectForField(localDeity, characterData.deity, 'deity', (field, value) => onFieldChange(field as keyof Character, value === DEITY_NONE_OPTION_VALUE ? '' : value));
  useDebounceEffectForField(localSize, characterData.size, 'size', onFieldChange);
  
  // Debounce effect for class
  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (localClassName !== (characterData.classes[0]?.className || '')) {
        onClassChange(localClassName);
      }
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(handler);
  }, [localClassName, characterData.classes, onClassChange]);


  React.useEffect(() => {
    if (translationsLoading || !translations) return;

    if (!characterData.race && translations.DND_RACES.length > 0) {
        const defaultRace = translations.DND_RACES.find(r => r.value === 'human')?.value || translations.DND_RACES[0]?.value || '';
        setLocalRace(defaultRace); // Update local directly
        // onFieldChange will be triggered by debounce effect
    }
    if ((!characterData.classes[0]?.className || characterData.classes[0]?.className === '') && translations.DND_CLASSES.length > 0) {
        const defaultClass = translations.DND_CLASSES.find(c => c.value === 'fighter')?.value || translations.DND_CLASSES[0]?.value || '';
        setLocalClassName(defaultClass); // Update local directly
        // onClassChange will be triggered by debounce effect
    }
    if (characterData.deity === undefined || characterData.deity === null) {
        setLocalDeity(DEITY_NONE_OPTION_VALUE); // Update local directly
        // onFieldChange will be triggered by debounce effect
    }
  }, [translationsLoading, translations, characterData.race, characterData.classes, characterData.deity]);


  const selectedClassInfo = React.useMemo(() => {
    if (!translations || !localClassName) return undefined;
    return translations.DND_CLASSES.find(c => c.value === localClassName);
  }, [translations, localClassName]);

  const isPredefinedRace = React.useMemo(() => {
    if (!translations || !localRace) return false;
    return !!translations.DND_RACES.find(r => r.value === localRace);
  }, [translations, localRace]);

  const filteredDeities = React.useMemo(() => {
    if (!translations || !localAlignment) {
      return translations?.DND_DEITIES || [];
    }
    return translations.DND_DEITIES.filter(deity =>
      isAlignmentCompatible(localAlignment, deity.alignment)
    );
  }, [translations, localAlignment]);

  const deitySelectOptions = React.useMemo(() => {
    if (!translations) return [{ value: DEITY_NONE_OPTION_VALUE, label: "Loading..." }];
    const noneOptionLabel = translations.UI_STRINGS?.deityNoneOption || "None";
    return [{ value: DEITY_NONE_OPTION_VALUE, label: noneOptionLabel }, ...filteredDeities];
  }, [translations, filteredDeities]);

  React.useEffect(() => {
    if (!translations || !characterData) return; // characterData still needed for original check
    if (localAlignment && localDeity && localDeity !== DEITY_NONE_OPTION_VALUE) {
      const currentDeityInfo = translations.DND_DEITIES.find(d => d.value === localDeity);
      if (currentDeityInfo && !isAlignmentCompatible(localAlignment, currentDeityInfo.alignment)) {
        // If incompatible, set localDeity to None, which will then trigger the debounce for onFieldChange
        setLocalDeity(DEITY_NONE_OPTION_VALUE);
      }
    }
  }, [translations, localAlignment, localDeity, characterData, onFieldChange]); // onFieldChange in deps to satisfy linter for debounce
  
  if (translationsLoading || !translations) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <ScrollText className="h-8 w-8 text-primary" />
            <Skeleton className="h-7 w-1/3" />
          </div>
           <Skeleton className="h-4 w-3/4 mt-1" />
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-1.5"> <Skeleton className="h-5 w-1/4 mb-1" /> <Skeleton className="h-10 w-full" /> </div>
              <div className="space-y-1.5"> <Skeleton className="h-5 w-1/4 mb-1" /> <Skeleton className="h-10 w-full" /> </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const { ALIGNMENTS, DND_RACES, DND_CLASSES, GENDERS, SIZES, UI_STRINGS } = translations;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <ScrollText className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-serif">
              {UI_STRINGS.coreAttributesTitle || "Core Attributes"}
            </CardTitle>
            <CardDescription>
              {UI_STRINGS.coreAttributesDescription || "Define the fundamental aspects of your adventurer."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-1.5">
            <Label htmlFor="name">{UI_STRINGS.characterNameLabel || "Character Name"}</Label>
            <Input id="name" name="name" value={localName || ''} onChange={(e) => setLocalName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="playerName">{UI_STRINGS.playerNameLabel || "Player Name"}</Label>
            <Input id="playerName" name="playerName" value={localPlayerName || ''} onChange={(e) => setLocalPlayerName(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-1.5">
            <Label htmlFor="race">{UI_STRINGS.raceLabel || "Race"}</Label>
            <div className="flex items-center gap-2">
              <div className="flex-grow">
                <Select
                  value={localRace || DND_RACES[0]?.value || ''}
                  onValueChange={(value) => setLocalRace(value as DndRaceId)}
                >
                  <SelectTrigger id="race">
                    <SelectValue placeholder={UI_STRINGS.selectRacePlaceholder || "Select race"} />
                  </SelectTrigger>
                  <SelectContent>
                    {DND_RACES.map(race => (
                      <SelectItem key={race.value} value={race.value}>{race.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10" onClick={onOpenRaceInfoDialog} disabled={!localRace}>
                <Info className="h-5 w-5" />
              </Button>
            </div>
            {isPredefinedRace && raceSpecialQualities?.abilityEffects && raceSpecialQualities.abilityEffects.length > 0 && (
               <div className="flex flex-wrap items-baseline gap-1 pt-[6px] ml-1">
                {raceSpecialQualities.abilityEffects.map((effect) => {
                  let badgeVariantProp: "destructive" | "secondary" | "default" = "secondary";
                  let badgeClassName = "text-xs font-normal whitespace-nowrap";
                  if (effect.change > 0) badgeClassName = cn(badgeClassName, "bg-emerald-700 text-emerald-100 border-emerald-600", "hover:bg-emerald-700 hover:text-emerald-100");
                  else if (effect.change < 0) { badgeVariantProp = "destructive"; badgeClassName = cn(badgeClassName, "hover:bg-destructive"); }
                  else badgeClassName = cn(badgeClassName, "bg-muted/50 text-muted-foreground border-border", "hover:bg-muted/50 hover:text-muted-foreground");
                  return ( <Badge key={effect.ability} variant={badgeVariantProp} className={badgeClassName}> {effect.ability.substring(0, 3).toUpperCase()}{effect.change !== 0 ? ' ' : ''} {effect.change > 0 ? '+' : ''} {effect.change !==0 ? effect.change : ''} </Badge> );
                })}
              </div>
            )}
          </div>
           <div className="space-y-1.5">
            <Label htmlFor="className">{UI_STRINGS.classLabel || "Class"}</Label>
            <div className="flex items-center gap-2">
              <div className="flex-grow">
                <Select
                  value={localClassName || DND_CLASSES[0]?.value || ''}
                  onValueChange={(value) => setLocalClassName(value as DndClassId)} 
                >
                  <SelectTrigger id="className"> <SelectValue placeholder={UI_STRINGS.selectClassPlaceholder || "Select class"} /> </SelectTrigger>
                  <SelectContent> {DND_CLASSES.map(c => ( <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem> ))} </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10" onClick={onOpenClassInfoDialog} disabled={!localClassName} >
                <Info className="h-5 w-5" />
              </Button>
            </div>
            {selectedClassInfo?.hitDice && (
              <div className="flex items-baseline gap-1 pt-[6px] ml-1"> <Badge variant="secondary" className="text-xs font-normal hover:bg-secondary hover:text-secondary-foreground whitespace-nowrap"> {UI_STRINGS.hitDiceLabel || "Hit Dice"}:{'\u00A0'} <strong className="font-bold">{selectedClassInfo.hitDice}</strong> </Badge> </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-1.5">
            <Label htmlFor="alignment">{UI_STRINGS.alignmentLabel || "Alignment"}</Label>
            <div className="flex items-center gap-2">
              <div className="flex-grow">
                <Select name="alignment" value={localAlignment} onValueChange={(value) => setLocalAlignment(value as CharacterAlignment)}>
                  <SelectTrigger><SelectValue placeholder={UI_STRINGS.selectAlignmentPlaceholder || "Select alignment"} /></SelectTrigger>
                  <SelectContent> {ALIGNMENTS.map(align => <SelectItem key={align.value} value={align.value}>{align.label}</SelectItem>)} </SelectContent>
                </Select>
              </div>
                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10" onClick={onOpenAlignmentInfoDialog}> <Info className="h-5 w-5" /> </Button>
            </div>
          </div>
          <div className="space-y-1.5">
              <Label htmlFor="deity">{UI_STRINGS.deityLabel || "Deity"}</Label>
              <div className="flex items-center gap-2">
                <div className="flex-grow">
                  <Select value={(localDeity && localDeity.trim() !== '') ? localDeity : DEITY_NONE_OPTION_VALUE} onValueChange={(value) => setLocalDeity(value)} >
                    <SelectTrigger id="deity"> <SelectValue placeholder={UI_STRINGS.selectDeityPlaceholder || "Select deity"} /> </SelectTrigger>
                    <SelectContent> {deitySelectOptions.map(opt => ( <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem> ))} </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10" onClick={onOpenDeityInfoDialog} disabled={!localDeity || localDeity.trim() === '' || localDeity === DEITY_NONE_OPTION_VALUE} >
                  <Info className="h-5 w-5" />
                </Button>
              </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="space-y-1.5">
            <Label htmlFor="age" className="inline-block w-full text-center md:text-center">{UI_STRINGS.ageLabel || "Age"}</Label>
            <NumberSpinnerInput 
              id="age" 
              value={localAge || currentMinAgeForInput} 
              onChange={setLocalAge}
              min={currentMinAgeForInput} 
              max={1000} 
              inputClassName="w-full h-10 text-base text-center" 
              buttonClassName="h-10 w-10" 
              buttonSize="icon" 
              className="justify-center"
            />
            {ageEffectsDetails && (ageEffectsDetails.categoryName !== 'Adult' || ageEffectsDetails.effects.length > 0) && (
              <div className="flex flex-wrap items-baseline justify-center md:justify-start gap-1 pt-[6px] ml-1">
                <Badge variant="secondary" className="text-xs font-normal hover:bg-secondary hover:text-secondary-foreground whitespace-nowrap"> {ageEffectsDetails.categoryName} </Badge>
                {ageEffectsDetails.effects.map((effect) => {
                  let badgeVariantProp: "destructive" | "secondary" | "default" = "secondary";
                  let badgeClassName = "text-xs font-normal whitespace-nowrap";
                  if (effect.change > 0) badgeClassName = cn(badgeClassName, "bg-emerald-700 text-emerald-100 border-emerald-600", "hover:bg-emerald-700 hover:text-emerald-100");
                  else if (effect.change < 0) { badgeVariantProp = "destructive"; badgeClassName = cn(badgeClassName, "hover:bg-destructive"); }
                  return ( <Badge key={effect.ability} variant={badgeVariantProp} className={badgeClassName}> {effect.ability.substring(0, 3).toUpperCase()}{effect.change !== 0 ? ' ' : ''} {effect.change > 0 ? '+' : ''} {effect.change} </Badge> );
                })}
              </div>
            )}
            </div>
          <div className="space-y-1.5">
            <Label htmlFor="gender">{UI_STRINGS.genderLabel || "Gender"}</Label>
             <ComboboxPrimitive 
                options={GENDERS} 
                value={localGender || ""} 
                onChange={setLocalGender} 
                placeholder={UI_STRINGS.selectGenderPlaceholder || "Select or type gender..."} 
                searchPlaceholder="Search genders..." 
                emptyPlaceholder="No gender found." 
                isEditable={true} 
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sizeCategory">{UI_STRINGS.sizeLabel || "Size Category"}</Label>
            <Select name="sizeCategory" value={localSize} onValueChange={(value) => setLocalSize(value as CharacterSize)}>
              <SelectTrigger id="sizeCategory"><SelectValue placeholder={UI_STRINGS.selectSizePlaceholder || "Select size category"} /></SelectTrigger>
              <SelectContent> {SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)} </SelectContent>
            </Select>
            <div className="flex items-baseline gap-1 pt-[6px] ml-1">
              {localSize && (() => {
                const selectedSizeObject = SIZES.find(s => s.value === localSize);
                if (selectedSizeObject && typeof selectedSizeObject.acModifier === 'number' && selectedSizeObject.acModifier !== 0) {
                  const acMod = selectedSizeObject.acModifier;
                  let badgeVariantProp: "destructive" | "secondary" | "default" = "secondary";
                  let badgeClassNameForAc = "text-xs font-normal whitespace-nowrap";
                  if (acMod > 0) badgeClassNameForAc = cn(badgeClassNameForAc, "bg-emerald-700 text-emerald-100 border-emerald-600", "hover:bg-emerald-700 hover:text-emerald-100");
                  else if (acMod < 0) { badgeVariantProp = "destructive"; badgeClassNameForAc = cn(badgeClassNameForAc, "hover:bg-destructive"); }
                  return ( <Badge variant={badgeVariantProp} className={badgeClassNameForAc}> AC{'\u00A0'}{acMod >= 0 ? '+' : ''}{acMod} </Badge> );
                } return null;
              })()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

