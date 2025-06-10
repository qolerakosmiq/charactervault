
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
  AggregatedFeatEffects,
  CharacterFavoredEnemy
} from '@/types/character-core';
import { isAlignmentCompatible } from '@/types/character';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollText, Info, Loader2, Users, Swords as BarbarianRageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Badge } from '@/components/ui/badge';
import { ComboboxPrimitive } from '@/components/ui/combobox';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { Separator } from '@/components/ui/separator';

const DEBOUNCE_DELAY = 400; // ms
const DEITY_NONE_OPTION_VALUE = "__NONE_DEITY__";

export interface CharacterFormCoreInfoSectionProps {
  characterData: Pick<Character, 'name' | 'playerName' | 'race' | 'alignment' | 'deity' | 'size' | 'age' | 'gender' | 'classes' | 'chosenCombatStyle' | 'chosenFavoredEnemies'>;
  onFieldChange: (
    field: keyof Pick<Character, 'name' | 'playerName' | 'race' | 'alignment' | 'deity' | 'size' | 'age' | 'gender' | 'chosenCombatStyle' | 'chosenFavoredEnemies'>,
    value: any
  ) => void;
  onClassChange: (className: DndClassId | string) => void;
  ageEffectsDetails: AgingEffectsDetails | null;
  raceSpecialQualities: RaceSpecialQualities | null;
  currentMinAgeForInput: number;
  onOpenRaceInfoDialog: () => void;
  onOpenClassInfoDialog: () => void;
  onOpenAlignmentInfoDialog: () => void;
  onOpenDeityInfoDialog: () => void;
  aggregatedFeatEffects?: AggregatedFeatEffects | null;
}

const CharacterFormCoreInfoSectionComponent = ({
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
  aggregatedFeatEffects,
}: CharacterFormCoreInfoSectionProps) => {
  const { translations, isLoading: translationsLoading } = useI18n();

  const [localName, setLocalName] = useDebouncedFormField(
    characterData.name || '',
    (value) => onFieldChange('name', value),
    DEBOUNCE_DELAY
  );
  const [localPlayerName, setLocalPlayerName] = useDebouncedFormField(
    characterData.playerName || '',
    (value) => onFieldChange('playerName', value),
    DEBOUNCE_DELAY
  );
  const [localRace, setLocalRace] = useDebouncedFormField(
    characterData.race || '',
    (value) => onFieldChange('race', value as DndRaceId),
    DEBOUNCE_DELAY
  );
  const [localClassName, setLocalClassName] = useDebouncedFormField(
    characterData.classes[0]?.className || '',
    (value) => onClassChange(value as DndClassId | string),
    DEBOUNCE_DELAY
  );
  const [localAlignment, setLocalAlignment] = useDebouncedFormField(
    characterData.alignment || 'true-neutral',
    (value) => onFieldChange('alignment', value as CharacterAlignment),
    DEBOUNCE_DELAY
  );
  const [localDeity, setLocalDeity] = useDebouncedFormField(
    (characterData.deity || '') === '' ? DEITY_NONE_OPTION_VALUE : (characterData.deity || DEITY_NONE_OPTION_VALUE),
    (value) => onFieldChange('deity', value === DEITY_NONE_OPTION_VALUE ? '' : value as DndDeityId | string),
    DEBOUNCE_DELAY
  );
  const [localAge, setLocalAge] = useDebouncedFormField(
    characterData.age,
    (value) => onFieldChange('age', Math.max(value, currentMinAgeForInput)), 
    DEBOUNCE_DELAY
  );
  const [localGender, setLocalGender] = useDebouncedFormField(
    characterData.gender || '',
    (value) => onFieldChange('gender', value as GenderId | string),
    DEBOUNCE_DELAY
  );
  const [localSize, setLocalSize] = useDebouncedFormField(
    characterData.size || 'medium',
    (value) => onFieldChange('size', value as CharacterSize),
    DEBOUNCE_DELAY
  );
  const [localChosenCombatStyle, setLocalChosenCombatStyle] = useDebouncedFormField(
    characterData.chosenCombatStyle || '',
    (value) => onFieldChange('chosenCombatStyle', value as "archery" | "twoWeaponFighting" | undefined),
    DEBOUNCE_DELAY
  );
  
  const handleFavoredEnemyChange = (index: number, newType: string) => {
    const updatedEnemies = [...(characterData.chosenFavoredEnemies || [])];
    // Ensure the array is long enough
    while (updatedEnemies.length <= index) {
        updatedEnemies.push({ id: crypto.randomUUID(), type: '' });
    }

    if (updatedEnemies[index]) {
        updatedEnemies[index] = { ...updatedEnemies[index], type: newType };
    } else {
        // This case should ideally not be hit if the above while loop works
        updatedEnemies[index] = { id: crypto.randomUUID(), type: newType };
    }
    // Filter out empty entries if user clears an input for an existing slot, 
    // but keep placeholders for newly available slots.
    // For this component, we'll pass back the potentially sparse array and let CharacterFormCore handle it.
    onFieldChange('chosenFavoredEnemies', updatedEnemies);
  };


  React.useEffect(() => {
    if (translationsLoading || !translations) return;
    if (!localRace && translations.DND_RACES.length > 0) {
        const defaultRace = translations.DND_RACES.find(r => r.value === 'human')?.value || translations.DND_RACES[0]?.value || '';
        setLocalRace(defaultRace as DndRaceId); 
    }
    if (!localClassName && translations.DND_CLASSES.length > 0) {
        const defaultClass = translations.DND_CLASSES.find(c => c.value === 'fighter')?.value || translations.DND_CLASSES[0]?.value || '';
        setLocalClassName(defaultClass as DndClassId); 
    }
  }, [translationsLoading, translations, localRace, setLocalRace, localClassName, setLocalClassName]);

  const selectedClassInfo = React.useMemo(() => {
    if (!translations || !localClassName) return undefined;
    return translations.DND_CLASSES.find(c => c.value === localClassName);
  }, [translations, localClassName]);

  const isPredefinedRace = React.useMemo(() => {
    if (!translations || !localRace) return false;
    return !!translations.DND_RACES.find(r => r.value === localRace);
  }, [translations, localRace]);

  const filteredDeities = React.useMemo(() => {
    if (translationsLoading || !translations || !localAlignment) {
      return translations?.DND_DEITIES || [];
    }
    return translations.DND_DEITIES.filter(deity =>
      isAlignmentCompatible(localAlignment, deity.alignment)
    );
  }, [translationsLoading, translations, localAlignment]);

  const deitySelectOptions = React.useMemo(() => {
    if (translationsLoading || !translations) return [{ value: DEITY_NONE_OPTION_VALUE, label: "Loading..." }];
    const noneOptionLabel = translations.UI_STRINGS?.deityNoneOption || "None";
    return [{ value: DEITY_NONE_OPTION_VALUE, label: noneOptionLabel }, ...filteredDeities.map(deity => ({value: deity.value, label: deity.label}))];
  }, [translationsLoading, translations, filteredDeities]);
  
  React.useEffect(() => {
    if (translationsLoading || !translations || !localAlignment || !localDeity) return;
    if (localDeity !== DEITY_NONE_OPTION_VALUE) {
      const currentDeityInfo = translations.DND_DEITIES.find(d => d.value === localDeity);
      if (currentDeityInfo && !isAlignmentCompatible(localAlignment, currentDeityInfo.alignment)) {
        setLocalDeity(DEITY_NONE_OPTION_VALUE);
      }
    }
  }, [translationsLoading, translations, localAlignment, localDeity, setLocalDeity]);

  const raceSelectOptions = React.useMemo(() => {
    if (translationsLoading || !translations) return null;
    return translations.DND_RACES.map(race => <SelectItem key={race.value} value={race.value}>{race.label}</SelectItem>);
  }, [translationsLoading, translations]);

  const classSelectOptions = React.useMemo(() => {
    if (translationsLoading || !translations) return null;
    return translations.DND_CLASSES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>);
  }, [translationsLoading, translations]);

  const alignmentSelectOptions = React.useMemo(() => {
    if (translationsLoading || !translations) return null;
    return translations.ALIGNMENTS.map(align => <SelectItem key={align.value} value={align.value}>{align.label}</SelectItem>);
  }, [translationsLoading, translations]);

  const sizeSelectOptions = React.useMemo(() => {
    if (translationsLoading || !translations) return null;
    return translations.SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>);
  }, [translationsLoading, translations]);
  
  const isRanger = selectedClassInfo?.value === 'ranger';
  const rangerLevel = isRanger ? (characterData.classes[0]?.level || 0) : 0;
  const canChooseCombatStyle = isRanger && rangerLevel >= 2;
  const favoredEnemySlots = aggregatedFeatEffects?.favoredEnemySlots || 0;

  const isBarbarian = selectedClassInfo?.value === 'barbarian';
  const rageUsesAbility = aggregatedFeatEffects?.grantedAbilities.find(ab => ab.abilityKey === 'barbarianRageUses');
  const rageUsesPerDay = rageUsesAbility?.uses?.value || 0;


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

  const { GENDERS, UI_STRINGS } = translations;

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
            <Input id="name" name="name" value={localName} onChange={(e) => setLocalName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="playerName">{UI_STRINGS.playerNameLabel || "Player Name"}</Label>
            <Input id="playerName" name="playerName" value={localPlayerName} onChange={(e) => setLocalPlayerName(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-1.5">
            <Label htmlFor="race">{UI_STRINGS.raceLabel || "Race"}</Label>
            <div className="flex items-center gap-2">
              <div className="flex-grow">
                <Select
                  value={localRace}
                  onValueChange={(value) => setLocalRace(value as DndRaceId)}
                >
                  <SelectTrigger id="race">
                    <SelectValue placeholder={UI_STRINGS.selectRacePlaceholder || "Select race"} />
                  </SelectTrigger>
                  <SelectContent>
                    {raceSelectOptions}
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
                  value={localClassName}
                  onValueChange={(value) => setLocalClassName(value as DndClassId)} 
                >
                  <SelectTrigger id="className"> <SelectValue placeholder={UI_STRINGS.selectClassPlaceholder || "Select class"} /> </SelectTrigger>
                  <SelectContent> {classSelectOptions} </SelectContent>
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

        {isBarbarian && rageUsesPerDay > 0 && (
            <div className="p-3 border rounded-md bg-muted/20 space-y-1">
                <Label className="text-sm font-medium flex items-center">
                    <BarbarianRageIcon className="mr-2 h-4 w-4 text-destructive" />
                    {UI_STRINGS.barbarianRageUsesLabel || "Rage Uses Per Day"}
                </Label>
                <p className="text-2xl font-bold text-destructive">{rageUsesPerDay}</p>
            </div>
        )}


        {canChooseCombatStyle && (
          <div className="space-y-1.5">
            <Label htmlFor="rangerCombatStyle">{UI_STRINGS.rangerCombatStyleLabel || "Ranger Combat Style"}</Label>
            <Select
              name="chosenCombatStyle"
              value={localChosenCombatStyle || ""}
              onValueChange={(value) => setLocalChosenCombatStyle(value as "archery" | "twoWeaponFighting")}
            >
              <SelectTrigger id="rangerCombatStyle">
                <SelectValue placeholder={UI_STRINGS.selectRangerCombatStylePlaceholder || "Select Combat Style..."} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="archery">{UI_STRINGS.rangerCombatStyleArchery || "Archery"}</SelectItem>
                <SelectItem value="twoWeaponFighting">{UI_STRINGS.rangerCombatStyleTwoWeapon || "Two-Weapon Fighting"}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {UI_STRINGS.rangerCombatStyleDescription || "Choose your combat style at Ranger level 2. This grants bonus feats as you level."}
            </p>
          </div>
        )}

        {isRanger && favoredEnemySlots > 0 && (
          <div className="space-y-3 p-3 border rounded-md bg-muted/20">
            <Label className="flex items-center text-md font-medium">
              <Users className="mr-2 h-5 w-5 text-primary/70" />
              {UI_STRINGS.favoredEnemyTitle || "Favored Enemies"}
              <Badge variant="outline" className="ml-2">{favoredEnemySlots} {UI_STRINGS.favoredEnemySlotsAvailableShort || "Slot(s)"}</Badge>
            </Label>
            <p className="text-xs text-muted-foreground">
                {UI_STRINGS.favoredEnemyDescription || "Select creature types your Ranger specializes against. Bonuses apply automatically when relevant."}
            </p>
            {Array.from({ length: favoredEnemySlots }).map((_, index) => (
              <div key={`favored-enemy-${index}`} className="space-y-1">
                <Label htmlFor={`favored-enemy-input-${index}`} className="text-xs">
                  {UI_STRINGS.favoredEnemySlotLabel || "Favored Enemy Slot"} {index + 1}
                </Label>
                <Input
                  id={`favored-enemy-input-${index}`}
                  value={characterData.chosenFavoredEnemies?.[index]?.type || ''}
                  onChange={(e) => handleFavoredEnemyChange(index, e.target.value)}
                  placeholder={UI_STRINGS.favoredEnemyPlaceholder || "e.g., Orc, Goblin, Undead"}
                  className="h-9 text-sm"
                />
              </div>
            ))}
          </div>
        )}


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-1.5">
            <Label htmlFor="alignment">{UI_STRINGS.alignmentLabel || "Alignment"}</Label>
            <div className="flex items-center gap-2">
              <div className="flex-grow">
                <Select name="alignment" value={localAlignment} onValueChange={(value) => setLocalAlignment(value as CharacterAlignment)}>
                  <SelectTrigger><SelectValue placeholder={UI_STRINGS.selectAlignmentPlaceholder || "Select alignment"} /></SelectTrigger>
                  <SelectContent> {alignmentSelectOptions} </SelectContent>
                </Select>
              </div>
                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10" onClick={onOpenAlignmentInfoDialog}> <Info className="h-5 w-5" /> </Button>
            </div>
          </div>
          <div className="space-y-1.5">
              <Label htmlFor="deity">{UI_STRINGS.deityLabel || "Deity"}</Label>
              <div className="flex items-center gap-2">
                <div className="flex-grow">
                  <Select value={localDeity} onValueChange={(value) => setLocalDeity(value)} >
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
              value={localAge} 
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
                value={localGender} 
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
              <SelectContent> {sizeSelectOptions} </SelectContent>
            </Select>
            <div className="flex items-baseline gap-1 pt-[6px] ml-1">
              {localSize && (() => {
                const selectedSizeObject = translations.SIZES.find(s => s.value === localSize);
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
};
CharacterFormCoreInfoSectionComponent.displayName = 'CharacterFormCoreInfoSectionComponent';
export const CharacterFormCoreInfoSection = React.memo(CharacterFormCoreInfoSectionComponent);
