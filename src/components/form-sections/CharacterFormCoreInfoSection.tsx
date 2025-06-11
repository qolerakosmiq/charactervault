
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
  CharacterFavoredEnemy,
  DomainDefinition,
  DomainId,
  MagicSchoolId
} from '@/types/character-core';
import { isAlignmentCompatible } from '@/types/character';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollText, Info, Loader2, Users, Activity, BookOpen, Wand2, Heart } from 'lucide-react'; // Added Heart
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
const DOMAIN_NONE_OPTION_VALUE = "__NONE_DOMAIN__";
const MAGIC_SCHOOL_NONE_OPTION_VALUE = "__NONE_SCHOOL__"; // Universal/Generalist
const PROHIBITED_SCHOOL_NONE_VALUE = "__NONE_PROHIBITED__";


export interface CharacterFormCoreInfoSectionProps {
  characterData: Pick<Character, 'name' | 'playerName' | 'race' | 'alignment' | 'deity' | 'size' | 'age' | 'gender' | 'classes' | 'chosenCombatStyle' | 'chosenFavoredEnemies' | 'chosenDomains' | 'chosenSpecializationSchool' | 'prohibitedSchools'>;
  onFieldChange: (
    field: keyof Pick<Character, 'name' | 'playerName' | 'race' | 'alignment' | 'deity' | 'size' | 'age' | 'gender' | 'chosenCombatStyle' | 'chosenFavoredEnemies' | 'chosenDomains' | 'chosenSpecializationSchool' | 'prohibitedSchools'>,
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
  const [localSpecializationSchool, setLocalSpecializationSchool] = useDebouncedFormField(
    characterData.chosenSpecializationSchool || MAGIC_SCHOOL_NONE_OPTION_VALUE,
    (value) => {
      onFieldChange('chosenSpecializationSchool', value === MAGIC_SCHOOL_NONE_OPTION_VALUE ? undefined : value as MagicSchoolId);
      if (value === MAGIC_SCHOOL_NONE_OPTION_VALUE || value === 'universal') {
        onFieldChange('prohibitedSchools', []); // Clear prohibited schools if generalist
      }
    },
    DEBOUNCE_DELAY
  );

  const handleFavoredEnemyChange = (index: number, newType: string) => {
    const updatedEnemies = [...(characterData.chosenFavoredEnemies || [])];
    while (updatedEnemies.length <= index) {
        updatedEnemies.push({ id: crypto.randomUUID(), type: '' });
    }
    updatedEnemies[index] = { ...(updatedEnemies[index] || { id: crypto.randomUUID() }), type: newType };
    onFieldChange('chosenFavoredEnemies', updatedEnemies);
  };


  const handleDomainChange = (index: 0 | 1, newDomainId: DomainId | undefined) => {
    const currentDomains = characterData.chosenDomains ? [...characterData.chosenDomains] : [undefined, undefined];
    currentDomains[index] = newDomainId === DOMAIN_NONE_OPTION_VALUE ? undefined : newDomainId;
    onFieldChange('chosenDomains', currentDomains as [DomainId | undefined, DomainId | undefined]);
  };

  const handleProhibitedSchoolChange = (index: 0 | 1, newSchoolId: MagicSchoolId | undefined) => {
    const currentProhibited = characterData.prohibitedSchools ? [...characterData.prohibitedSchools] : [undefined, undefined];
    currentProhibited[index] = newSchoolId === PROHIBITED_SCHOOL_NONE_VALUE ? undefined : newSchoolId;
    onFieldChange('prohibitedSchools', currentProhibited.filter((s, i, arr) => s && arr.indexOf(s) === i) as MagicSchoolId[]);
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

  const domainOptions = React.useMemo(() => {
    if (translationsLoading || !translations) return [{ value: DOMAIN_NONE_OPTION_VALUE, label: "Loading..." }];
    const noneOptionLabel = translations.UI_STRINGS?.domainNoneOption || "None";
    return [{ value: DOMAIN_NONE_OPTION_VALUE, label: noneOptionLabel }, ...translations.DND_DOMAINS.map(d => ({ value: d.value, label: d.label }))];
  }, [translations, translationsLoading]);

  const selectedDomain1 = characterData.chosenDomains?.[0];
  const selectedDomain2 = characterData.chosenDomains?.[1];

  const domainOptionsForSecondPicker = React.useMemo(() => {
    if (!selectedDomain1) return domainOptions;
    return domainOptions.filter(opt => opt.value !== selectedDomain1);
  }, [domainOptions, selectedDomain1]);

  const magicSchoolOptions = React.useMemo(() => {
    if (translationsLoading || !translations) return [{ value: MAGIC_SCHOOL_NONE_OPTION_VALUE, label: "Loading..." }];
    const generalistLabel = translations.DND_MAGIC_SCHOOLS.find(s => s.value === 'universal')?.label || "Generalist";
    return [
      { value: MAGIC_SCHOOL_NONE_OPTION_VALUE, label: generalistLabel },
      ...translations.DND_MAGIC_SCHOOLS.filter(s => s.value !== 'universal').map(s => ({ value: s.value, label: s.label }))
    ];
  }, [translations, translationsLoading]);

  const prohibitedSchoolOptions = React.useMemo(() => {
    if (translationsLoading || !translations) return [{ value: PROHIBITED_SCHOOL_NONE_VALUE, label: "Loading..." }];
    const noneLabel = translations.UI_STRINGS?.prohibitedSchoolNoneOption || "None";
    return [
      {value: PROHIBITED_SCHOOL_NONE_VALUE, label: noneLabel},
      ...translations.DND_MAGIC_SCHOOLS.filter(s => s.value !== 'universal' && s.value !== localSpecializationSchool).map(s => ({value: s.value, label: s.label}))
    ];
  }, [translations, translationsLoading, localSpecializationSchool]);

  const selectedProhibitedSchool1 = characterData.prohibitedSchools?.[0];
  const selectedProhibitedSchool2 = characterData.prohibitedSchools?.[1];

  const prohibitedSchoolOptionsForSecondPicker = React.useMemo(() => {
    if(!selectedProhibitedSchool1) return prohibitedSchoolOptions;
    return prohibitedSchoolOptions.filter(opt => opt.value !== selectedProhibitedSchool1);
  }, [prohibitedSchoolOptions, selectedProhibitedSchool1]);


  const isRanger = selectedClassInfo?.value === 'ranger';
  const rangerLevel = isRanger ? (characterData.classes[0]?.level || 0) : 0;
  const canChooseCombatStyle = isRanger && rangerLevel >= 2;
  const favoredEnemySlots = aggregatedFeatEffects?.favoredEnemySlots || 0;

  const isBarbarian = selectedClassInfo?.value === 'barbarian';
  const rageUsesAbility = aggregatedFeatEffects?.grantedAbilities.find(ab => ab.abilityKey === 'barbarianRageUses');
  const rageUsesPerDay = rageUsesAbility?.uses?.value || 0;

  const isCleric = selectedClassInfo?.value === 'cleric';
  const isWizard = selectedClassInfo?.value === 'wizard';
  const isSpecialistWizard = isWizard && localSpecializationSchool !== MAGIC_SCHOOL_NONE_OPTION_VALUE && localSpecializationSchool !== 'universal';


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
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-[6px] ml-1">
              {selectedClassInfo?.hitDice && (
                <Badge variant="secondary" className="text-xs font-normal hover:bg-secondary hover:text-secondary-foreground whitespace-nowrap">
                  <Heart className="inline h-3 w-3 mr-1.5 text-primary/70" />
                  {UI_STRINGS.hitDiceLabel || "Hit Dice"}:{'\u00A0'}
                  <strong className="font-bold">{selectedClassInfo.hitDice}</strong>
                </Badge>
              )}
              {isBarbarian && rageUsesPerDay > 0 && (
                  <Badge className="text-xs font-normal whitespace-nowrap bg-accent text-accent-foreground hover:bg-accent/90">
                    <Activity className="inline h-3 w-3 mr-1" />
                    {(UI_STRINGS.barbarianRageUsesLabel || "Rage Uses Per Day")}: <strong className="font-bold ml-1">{rageUsesPerDay}</strong>
                  </Badge>
              )}
            </div>
          </div>
        </div>

        {isCleric && (
          <div className="space-y-4 p-3 border rounded-md bg-muted/20">
            <Label className="flex items-center text-md font-medium">
              <BookOpen className="mr-2 h-5 w-5 text-primary/70" />
              {UI_STRINGS.clericDomainsTitle || "Cleric Domains"}
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="cleric-domain-1" className="text-sm">{UI_STRINGS.clericDomain1Label || "First Domain"}</Label>
                <ComboboxPrimitive
                  id="cleric-domain-1"
                  options={domainOptions}
                  value={selectedDomain1 || DOMAIN_NONE_OPTION_VALUE}
                  onChange={(val) => handleDomainChange(0, val as DomainId)}
                  placeholder={UI_STRINGS.selectDomainPlaceholder || "Select Domain..."}
                  triggerClassName="h-9 text-sm"
                />
                {selectedDomain1 && <p className="text-xs text-muted-foreground mt-1">{translations.DND_DOMAINS.find(d=>d.value === selectedDomain1)?.grantedPowerDescription}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="cleric-domain-2" className="text-sm">{UI_STRINGS.clericDomain2Label || "Second Domain"}</Label>
                <ComboboxPrimitive
                  id="cleric-domain-2"
                  options={domainOptionsForSecondPicker}
                  value={selectedDomain2 || DOMAIN_NONE_OPTION_VALUE}
                  onChange={(val) => handleDomainChange(1, val as DomainId)}
                  placeholder={UI_STRINGS.selectDomainPlaceholder || "Select Domain..."}
                  triggerClassName="h-9 text-sm"
                />
                 {selectedDomain2 && <p className="text-xs text-muted-foreground mt-1">{translations.DND_DOMAINS.find(d=>d.value === selectedDomain2)?.grantedPowerDescription}</p>}
              </div>
            </div>
          </div>
        )}

        {isWizard && (
          <div className="space-y-4 p-3 border rounded-md bg-muted/20">
            <Label className="flex items-center text-md font-medium">
              <Wand2 className="mr-2 h-5 w-5 text-primary/70" />
              {UI_STRINGS.wizardSpecializationTitle || "Wizard Specialization"}
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="wizard-specialization" className="text-sm">{UI_STRINGS.wizardSpecializationSchoolLabel || "Specialization School"}</Label>
                <ComboboxPrimitive
                  id="wizard-specialization"
                  options={magicSchoolOptions}
                  value={localSpecializationSchool}
                  onChange={(val) => setLocalSpecializationSchool(val as MagicSchoolId)}
                  placeholder={UI_STRINGS.selectMagicSchoolPlaceholder || "Select School..."}
                  triggerClassName="h-9 text-sm"
                />
                {localSpecializationSchool !== MAGIC_SCHOOL_NONE_OPTION_VALUE && localSpecializationSchool !== 'universal' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {UI_STRINGS.wizardSpecialistBonusSpellInfo || "Grants one bonus spell of the chosen school per spell level per day."}
                  </p>
                )}
              </div>
              {isSpecialistWizard && (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="wizard-prohibited-1" className="text-sm">{UI_STRINGS.wizardProhibitedSchool1Label || "First Prohibited School"}</Label>
                    <ComboboxPrimitive
                      id="wizard-prohibited-1"
                      options={prohibitedSchoolOptions}
                      value={selectedProhibitedSchool1 || PROHIBITED_SCHOOL_NONE_VALUE}
                      onChange={(val) => handleProhibitedSchoolChange(0, val as MagicSchoolId)}
                      placeholder={UI_STRINGS.selectProhibitedSchoolPlaceholder || "Select School..."}
                      triggerClassName="h-9 text-sm"
                    />
                  </div>
                   <div className="space-y-1 md:col-start-2"> {/* Ensures second prohibited school is below the first on md+ screens */}
                    <Label htmlFor="wizard-prohibited-2" className="text-sm">{UI_STRINGS.wizardProhibitedSchool2Label || "Second Prohibited School"}</Label>
                    <ComboboxPrimitive
                      id="wizard-prohibited-2"
                      options={prohibitedSchoolOptionsForSecondPicker}
                      value={selectedProhibitedSchool2 || PROHIBITED_SCHOOL_NONE_VALUE}
                      onChange={(val) => handleProhibitedSchoolChange(1, val as MagicSchoolId)}
                      placeholder={UI_STRINGS.selectProhibitedSchoolPlaceholder || "Select School..."}
                      triggerClassName="h-9 text-sm"
                      disabled={!selectedProhibitedSchool1 || selectedProhibitedSchool1 === PROHIBITED_SCHOOL_NONE_VALUE}
                    />
                  </div>
                   <p className="text-xs text-muted-foreground mt-1 md:col-span-2">
                     {UI_STRINGS.wizardProhibitedSchoolInfo || "Spells from prohibited schools cannot be learned or cast. Divination cannot be prohibited."}
                   </p>
                </>
              )}
            </div>
          </div>
        )}


        {isRanger && canChooseCombatStyle && (
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
                  {(UI_STRINGS.favoredEnemySlotLabel || "Favored Enemy Slot {slotNum}").replace("{slotNum}", String(index + 1))}
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

