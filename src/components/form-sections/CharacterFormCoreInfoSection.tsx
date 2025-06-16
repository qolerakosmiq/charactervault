
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
  MagicSchoolId,
  GrantsAbilityEffect,
  GrantsAbilityEffectUses,
  ClassSpecificUIBlock,
  CharacterClassSpecificChoice,
  ComboboxOption
} from '@/types/character-core';
import { isAlignmentCompatibleWithDeity, isAlignmentValidForRequirement, getGrantedFeatsForCharacter } from '@/types/character';
import { getLocalizedString } from '@/i18n/i18n-data';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollText, Info, Loader2, Users, Activity, BookOpen, Wand2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, parseAndRenderUIString } from '@/lib/utils';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Badge } from '@/components/ui/badge';
import { ComboboxPrimitive } from '@/components/ui/combobox';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { Separator } from '@/components/ui/separator';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper';
import type { ProcessedSiteData } from '@/i18n/i18n-data';

const DEBOUNCE_DELAY = 400;
const DEITY_NONE_OPTION_VALUE = "__NONE_DEITY__";

export interface CharacterFormCoreInfoSectionProps {
  characterData: Pick<Character, 'name' | 'playerName' | 'race' | 'alignment' | 'deity' | 'size' | 'age' | 'gender' | 'classes' | 'classSpecificChoices'>;
  onFieldChange: (
    field: keyof Pick<Character, 'name' | 'playerName' | 'race' | 'alignment' | 'deity' | 'size' | 'age' | 'gender' | 'classSpecificChoices'>,
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
  const { translations, isLoading: translationsLoading, language: currentLang } = useI18n();

  const [localName, setLocalName] = useDebouncedFormField(
    characterData.name,
    React.useCallback((value) => onFieldChange('name', value), [onFieldChange]),
    DEBOUNCE_DELAY
  );
  const [localPlayerName, setLocalPlayerName] = useDebouncedFormField(
    characterData.playerName || '',
    React.useCallback((value) => onFieldChange('playerName', value), [onFieldChange]),
    DEBOUNCE_DELAY
  );
  const [localRace, setLocalRace] = useDebouncedFormField(
    characterData.race,
    React.useCallback((value) => onFieldChange('race', value as DndRaceId), [onFieldChange]),
    DEBOUNCE_DELAY
  );
  const [localClassName, setLocalClassName] = useDebouncedFormField(
    characterData.classes[0]?.className,
    React.useCallback((value) => onClassChange(value as DndClassId | string), [onClassChange]),
    DEBOUNCE_DELAY
  );
  const [localAlignment, setLocalAlignment] = useDebouncedFormField(
    characterData.alignment,
    React.useCallback((value) => onFieldChange('alignment', value as CharacterAlignment), [onFieldChange]),
    DEBOUNCE_DELAY
  );
  const [localDeity, setLocalDeity] = useDebouncedFormField(
    characterData.deity || DEITY_NONE_OPTION_VALUE,
    React.useCallback((value) => onFieldChange('deity', value === DEITY_NONE_OPTION_VALUE ? '' : value as DndDeityId | string), [onFieldChange]),
    DEBOUNCE_DELAY
  );
  const [localAge, setLocalAge] = useDebouncedFormField(
    characterData.age,
    React.useCallback((value) => onFieldChange('age', Math.max(value, currentMinAgeForInput)), [onFieldChange, currentMinAgeForInput]),
    DEBOUNCE_DELAY
  );
  const [localGender, setLocalGender] = useDebouncedFormField(
    characterData.gender,
    React.useCallback((value) => onFieldChange('gender', value as GenderId | string), [onFieldChange]),
    DEBOUNCE_DELAY
  );
  const [localSize, setLocalSize] = useDebouncedFormField(
    characterData.size,
    React.useCallback((value) => onFieldChange('size', value as CharacterSize), [onFieldChange]),
    DEBOUNCE_DELAY
  );

  const selectedRaceInfo = React.useMemo(() => {
    if (!translations || !localRace) return undefined;
    return translations.DND_RACES.find(r => r.id === localRace);
  }, [translations, localRace]);

  const selectedClassInfo = React.useMemo(() => {
    if (!translations || !localClassName) return undefined;
    return translations.DND_CLASSES.find(c => c.id === localClassName);
  }, [translations, localClassName]);

  const availableAlignments = React.useMemo(() => {
    if (translationsLoading || !translations) return [];
    const classRestriction = selectedClassInfo?.alignmentRestriction;
    if (!classRestriction || classRestriction === 'any') {
      return translations.ALIGNMENTS;
    }
    return translations.ALIGNMENTS.filter(align =>
      isAlignmentValidForRequirement(align.id as CharacterAlignment, classRestriction)
    );
  }, [translationsLoading, translations, selectedClassInfo]);

  React.useEffect(() => {
    if (translationsLoading || !translations || !selectedClassInfo || !translations.UI_STRINGS || !translations.PREFERRED_DEFAULT_ALIGNMENT_IDS) return;

    const currentAlignmentIsValidForNewClass = availableAlignments.some(a => a.id === localAlignment);

    if (!currentAlignmentIsValidForNewClass) {
        const preferredDefaultsFromData: readonly CharacterAlignment[] = translations.PREFERRED_DEFAULT_ALIGNMENT_IDS;
        let newAlignmentToSet: CharacterAlignment | undefined = undefined;

        for (const preferred of preferredDefaultsFromData) {
            if (availableAlignments.some(a => a.id === preferred)) {
            newAlignmentToSet = preferred;
            break;
            }
        }

        if (!newAlignmentToSet) {
            newAlignmentToSet = availableAlignments.length > 0
              ? availableAlignments[0].id as CharacterAlignment
              : (translations.ALIGNMENTS.find(a => a.id === 'true-neutral')?.id || preferredDefaultsFromData[0]);
        }
        
        if (!newAlignmentToSet && translations.ALIGNMENTS.length > 0) {
            newAlignmentToSet = translations.ALIGNMENTS.find(a => a.id === 'true-neutral')?.id || translations.ALIGNMENTS[0].id;
        }

        if (newAlignmentToSet) {
            setLocalAlignment(newAlignmentToSet);
        }
    }
  }, [localClassName, selectedClassInfo, availableAlignments, localAlignment, setLocalAlignment, translations, translationsLoading]);


  const deitySelectOptions = React.useMemo(() => {
    if (translationsLoading || !translations) return [{ value: DEITY_NONE_OPTION_VALUE, label: "Loading..." }];
    const noneOptionLabel = translations.UI_STRINGS?.deityNoneOption || "None";

    let filteredDeities = translations.DND_DEITIES.filter(deity =>
      isAlignmentCompatibleWithDeity(localAlignment, deity.alignment)
    );

    if (selectedClassInfo?.deityAlignmentRestriction) {
      filteredDeities = filteredDeities.filter(deity =>
        isAlignmentValidForRequirement(deity.alignment, selectedClassInfo.deityAlignmentRestriction!)
      );
    }

    return [{ value: DEITY_NONE_OPTION_VALUE, label: noneOptionLabel }, ...filteredDeities.map(deity => ({value: deity.id, label: deity.label}))];
  }, [translationsLoading, translations, localAlignment, selectedClassInfo]);

  React.useEffect(() => {
    if (translationsLoading || !translations || !translations.UI_STRINGS || localDeity === DEITY_NONE_OPTION_VALUE) return;

    const currentDeityInfo = translations.DND_DEITIES.find(d => d.id === localDeity);
    if (!currentDeityInfo) return; 

    let deityIsValid = true;
    if (!isAlignmentCompatibleWithDeity(localAlignment, currentDeityInfo.alignment)) {
      deityIsValid = false;
    }
    if (deityIsValid && selectedClassInfo?.deityAlignmentRestriction) {
      if (!isAlignmentValidForRequirement(currentDeityInfo.alignment, selectedClassInfo.deityAlignmentRestriction)) {
        deityIsValid = false;
      }
    }

    if (!deityIsValid) {
      setLocalDeity(DEITY_NONE_OPTION_VALUE);
    }
  }, [localDeity, localAlignment, selectedClassInfo, translations, translationsLoading, setLocalDeity]);


  React.useEffect(() => {
    if (translationsLoading || !translations) return;
    if (!localRace && translations.DND_RACES.length > 0) {
        const defaultRace = translations.DND_RACES.find(r => r.id === 'human')?.id || translations.DND_RACES[0]?.id || '';
        setLocalRace(defaultRace as DndRaceId);
    }
    if (!localClassName && translations.DND_CLASSES.length > 0) {
        const defaultClass = translations.DND_CLASSES.find(c => c.id === 'fighter')?.id || translations.DND_CLASSES[0]?.id || '';
        setLocalClassName(defaultClass as DndClassId);
    }
  }, [translationsLoading, translations, localRace, setLocalRace, localClassName, setLocalClassName]);

  const isPredefinedRace = React.useMemo(() => {
    if (!translations || !localRace) return false;
    return !!translations.DND_RACES.find(r => r.id === localRace);
  }, [translations, localRace]);

  const raceSelectOptions = React.useMemo(() => {
    if (translationsLoading || !translations) return null;
    return translations.DND_RACES.map(race => <SelectItem key={race.id} value={race.id}>{race.label}</SelectItem>);
  }, [translationsLoading, translations]);

  const classSelectOptions = React.useMemo(() => {
    if (translationsLoading || !translations) return null;
    return translations.DND_CLASSES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>);
  }, [translationsLoading, translations]);

  const sizeSelectOptions = React.useMemo(() => {
    if (translationsLoading || !translations) return null;
    return translations.SIZES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>);
  }, [translationsLoading, translations]);

  const genderSelectOptions = React.useMemo(() => {
    if (translationsLoading || !translations) return [{ id: "unspecified", label: "Loading..." }];

    const unspecifiedOption = translations.GENDERS.find(g => g.id === 'unspecified') || { id: 'unspecified', label: 'Unspecified' };
    const otherOption = translations.GENDERS.find(g => g.id === 'other') || { id: 'other', label: 'Other' };
    const maleOption = translations.GENDERS.find(g => g.id === 'male') || { id: 'male', label: 'Male' };
    const femaleOption = translations.GENDERS.find(g => g.id === 'female') || { id: 'female', label: 'Female' };

    const options = [unspecifiedOption];
    const raceSpecificGenders = selectedRaceInfo?.genderOptions;

    if (raceSpecificGenders && raceSpecificGenders.length > 0) {
      options.push(...raceSpecificGenders);
    } else {
      options.push(maleOption, femaleOption);
    }
    options.push(otherOption);
    return options;
  }, [translations, translationsLoading, selectedRaceInfo]);

   const handleClassSpecificChoiceChange = React.useCallback((
    featureKey: string,
    newValue: string,
    slotIndex?: number
  ) => {
    const existingChoices = characterData.classSpecificChoices || [];
    let updatedChoices: CharacterClassSpecificChoice[];

    if (slotIndex !== undefined) {
      const choiceExists = existingChoices.some(
        (c) => c.featureKey === featureKey && c.slotIndex === slotIndex
      );
      if (choiceExists) {
        updatedChoices = existingChoices.map((c) =>
          c.featureKey === featureKey && c.slotIndex === slotIndex
            ? { ...c, value: newValue }
            : c
        );
      } else {
        updatedChoices = [...existingChoices, { featureKey, value: newValue, slotIndex }];
      }
      updatedChoices = updatedChoices.filter(c => !(c.slotIndex === slotIndex && (newValue === "" || newValue.endsWith("__NONE__"))));
    } else {
      const choiceExists = existingChoices.some((c) => c.featureKey === featureKey);
      if (choiceExists) {
        updatedChoices = existingChoices.map((c) =>
          c.featureKey === featureKey ? { ...c, value: newValue } : c
        );
      } else {
        updatedChoices = [...existingChoices, { featureKey, value: newValue }];
      }
    }
    onFieldChange('classSpecificChoices', updatedChoices);
  }, [characterData.classSpecificChoices, onFieldChange]);



  if (translationsLoading || !translations) {
    return (
      <LockablePanelWrapper
        title={translations?.UI_STRINGS.coreAttributesTitle || "Core Attributes"}
        description={translations?.UI_STRINGS.coreAttributesDescription || "Define the fundamental aspects of your adventurer."}
        icon={ScrollText}
        cardContentClassName="space-y-6 pt-6"
        initialLockedState={false}
      >
        {() => (
          <>
            {[1,2,3,4].map(i => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-1.5"> <Skeleton className="h-5 w-1/4 mb-1" /> <Skeleton className="h-10 w-full" /> </div>
                <div className="space-y-1.5"> <Skeleton className="h-5 w-1/4 mb-1" /> <Skeleton className="h-10 w-full" /> </div>
              </div>
            ))}
          </>
        )}
      </LockablePanelWrapper>
    );
  }

  const { UI_STRINGS, ALIGNMENTS, DND_DOMAINS, DND_MAGIC_SCHOOLS } = translations;

  const renderClassSpecificUI = (uiBlock: ClassSpecificUIBlock, panelIsLocked: boolean) => {
    const currentCharacterClassLevel = characterData.classes[0]?.level || 0;
    if (uiBlock.requiredLevel && currentCharacterClassLevel < uiBlock.requiredLevel) {
      return null;
    }

    if (uiBlock.conditionAggregatedEffect && aggregatedFeatEffects) {
      const propValue = aggregatedFeatEffects[uiBlock.conditionAggregatedEffect.property as keyof AggregatedFeatEffects] as any;
      let conditionMet = false;
      switch (uiBlock.conditionAggregatedEffect.comparison) {
        case 'exists': conditionMet = propValue !== undefined && propValue !== null && (Array.isArray(propValue) ? propValue.length > 0 : true); break;
        case 'greaterThan': conditionMet = typeof propValue === 'number' && propValue > (uiBlock.conditionAggregatedEffect.value as number); break;
        case 'equals': conditionMet = propValue === uiBlock.conditionAggregatedEffect.value; break;
        case 'lessThan': conditionMet = typeof propValue === 'number' && propValue < (uiBlock.conditionAggregatedEffect.value as number); break;
        case 'notEquals': conditionMet = propValue !== uiBlock.conditionAggregatedEffect.value; break;
      }
      if (!conditionMet) return null;
    }

    if (uiBlock.conditionDependsOnUIStateKey) {
      const stateValue = (characterData as any)[uiBlock.conditionDependsOnUIStateKey]; // Using characterData directly
      if (uiBlock.conditionDependsOnUIStateValueNotIn && uiBlock.conditionDependsOnUIStateValueNotIn.includes(stateValue as string | null | undefined)) {
        return null;
      }
    }

    const blockLabel = parseAndRenderUIString(UI_STRINGS[uiBlock.labelKey] || uiBlock.key);
    const blockDescription = uiBlock.descriptionKey ? parseAndRenderUIString(UI_STRINGS[uiBlock.descriptionKey] || '') : null;

    const getCurrentValue = (key: string, index?: number): string => {
      const choice = (characterData.classSpecificChoices || []).find(
        c => c.featureKey === key && (index === undefined || c.slotIndex === index)
      );
      return choice?.value || '';
    };

    let options: ComboboxOption[] = [];
    let placeholder: string | undefined = uiBlock.placeholderKey ? parseAndRenderUIString(UI_STRINGS[uiBlock.placeholderKey]) as string : undefined;

    if (uiBlock.optionsSource === 'domains' && DND_DOMAINS) {
      const noneOptionValue = "__NONE_DOMAIN__";
      options = [{value: noneOptionValue, label: UI_STRINGS.domainNoneOption || "None"}, ...DND_DOMAINS.map(d => ({ value: d.id, label: d.label }))]
        .sort((a,b) => a.label.localeCompare(b.label));

      // For second domain picker, filter out the first selected domain
      if(uiBlock.relatedSlotKeyForDisable === 'clericDomain1') { // This implies this uiBlock is for domain 2
          const firstDomainChoice = (characterData.classSpecificChoices || []).find(c => c.featureKey === 'clericDomain1');
          if(firstDomainChoice && firstDomainChoice.value && firstDomainChoice.value !== noneOptionValue) {
            options = options.filter(opt => opt.value !== firstDomainChoice.value);
          }
      }


    } else if (uiBlock.optionsSource === 'magicSchools' && DND_MAGIC_SCHOOLS) {
      const noneOptionValue = "__NONE_SCHOOL__";
      options = [{value: noneOptionValue, label: (DND_MAGIC_SCHOOLS.find(s => s.id === 'universal')?.label || UI_STRINGS.magicSchoolNoneOption || "None / Generalist")},
                 ...DND_MAGIC_SCHOOLS.filter(s => s.id !== 'universal').map(s => ({value: s.id, label: s.label}))]
                 .sort((a,b) => a.label.localeCompare(b.label));
    } else if (uiBlock.optionsSource === 'rangerCombatStyles') {
        options = [
            { value: '', label: UI_STRINGS.selectRangerCombatStylePlaceholder || "Select Combat Style..." },
            { value: 'archery', label: UI_STRINGS.rangerCombatStyleArchery || "Archery" },
            { value: 'twoWeaponFighting', label: UI_STRINGS.rangerCombatStyleTwoWeapon || "Two-Weapon Fighting" },
        ];
        placeholder = undefined; // Handled by the first empty option
    } else if (uiBlock.optionsSource === 'customList' && uiBlock.customOptions) {
        options = uiBlock.customOptions.map(opt => ({value: opt.value, label: getLocalizedString(opt.label, currentLang)}));
    }


    let isDisabled = panelIsLocked;
    if (uiBlock.relatedSlotKeyForDisable) {
        const relatedChoice = (characterData.classSpecificChoices || []).find(
            c => c.featureKey === uiBlock.relatedSlotKeyForDisable
        );
        if (!relatedChoice || relatedChoice.value === '' || relatedChoice.value.endsWith('__NONE__')) {
            isDisabled = true;
        }
    }
    if (!isDisabled && uiBlock.disabledIfChoiceValue) {
        const controllingChoice = (characterData.classSpecificChoices || []).find(
            c => c.featureKey === uiBlock.disabledIfChoiceValue!.featureKey
        );
        if (controllingChoice && uiBlock.disabledIfChoiceValue.values.includes(controllingChoice.value)) {
            isDisabled = true;
        }
    }

    const currentBlockValue = getCurrentValue(uiBlock.key);
    const selectedOptionForDisplay = options.find(opt => opt.value === currentBlockValue);
    const displayValueInTrigger = selectedOptionForDisplay?.label || (currentBlockValue && (currentBlockValue.endsWith('__NONE__') || currentBlockValue === "") ? placeholder : currentBlockValue) || placeholder;


    if (uiBlock.choiceType === 'select' || uiBlock.choiceType === 'combobox') {
      return (
        <div key={uiBlock.key} className="space-y-1.5">
          <Label htmlFor={`cspec-${uiBlock.key}`}>{blockLabel}</Label>
          {uiBlock.choiceType === 'select' ? (
            <Select
              name={uiBlock.key}
              value={currentBlockValue}
              onValueChange={(val) => handleClassSpecificChoiceChange(uiBlock.key, val)}
              disabled={isDisabled}
            >
              <SelectTrigger id={`cspec-${uiBlock.key}`}>
                <SelectValue placeholder={placeholder ? placeholder : undefined} />
              </SelectTrigger>
              <SelectContent>{options.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
            </Select>
          ) : ( 
            <ComboboxPrimitive
              options={options}
              value={currentBlockValue}
              onChange={(val) => handleClassSpecificChoiceChange(uiBlock.key, val)}
              placeholder={placeholder}
              triggerClassName="h-9 text-sm"
              disabled={isDisabled}
            />
          )}
          {blockDescription && <p className="text-xs text-muted-foreground">{blockDescription}</p>}
        </div>
      );
    } else if (uiBlock.choiceType === 'multiInput' && uiBlock.maxSelections && uiBlock.maxSelections > 0) {
      const numInputsToRender = uiBlock.maxSelections;
      const inputPlaceholder = uiBlock.inputPlaceholderKey ? parseAndRenderUIString(UI_STRINGS[uiBlock.inputPlaceholderKey]) as string : '';
      const slotLabel = uiBlock.slotLabelKey ? UI_STRINGS[uiBlock.slotLabelKey] : `${uiBlock.key} Slot {slotNum}`;
      return (
        <div key={uiBlock.key} className="space-y-3 p-3 border rounded-md bg-muted/20">
          <Label className="flex items-center text-md font-medium">
            {blockLabel}
            <Badge variant="outline" className="ml-2">{numInputsToRender}</Badge>
          </Label>
          {blockDescription && <p className="text-xs text-muted-foreground">{blockDescription}</p>}
          {Array.from({ length: numInputsToRender }).map((_, index) => (
            <div key={`${uiBlock.key}-slot-${index}`} className="space-y-1">
              <Label htmlFor={`${uiBlock.key}-input-${index}`} className="text-xs">
                {parseAndRenderUIString(slotLabel, { slotNum: index + 1 })}
              </Label>
              <Input
                id={`${uiBlock.key}-input-${index}`}
                value={getCurrentValue(uiBlock.key, index)}
                onChange={(e) => handleClassSpecificChoiceChange(uiBlock.key, e.target.value, index)}
                placeholder={inputPlaceholder}
                className="h-9 text-sm"
                disabled={isDisabled}
              />
            </div>
          ))}
        </div>
      );
    } else if (uiBlock.choiceType === 'textInput') {
      const inputPlaceholder = uiBlock.inputPlaceholderKey ? parseAndRenderUIString(UI_STRINGS[uiBlock.inputPlaceholderKey]) as string : '';
      return (
         <div key={uiBlock.key} className="space-y-1.5">
            <Label htmlFor={`cspec-${uiBlock.key}`}>{blockLabel}</Label>
            <Input
                id={`cspec-${uiBlock.key}`}
                value={getCurrentValue(uiBlock.key)}
                onChange={(e) => handleClassSpecificChoiceChange(uiBlock.key, e.target.value)}
                placeholder={inputPlaceholder}
                disabled={isDisabled}
            />
            {blockDescription && <p className="text-xs text-muted-foreground">{blockDescription}</p>}
         </div>
      );
    }
    return <div key={uiBlock.key} className="text-destructive">Unsupported choiceType: {uiBlock.choiceType} for {uiBlock.key}</div>;
  };


  return (
    <LockablePanelWrapper
      title={parseAndRenderUIString(UI_STRINGS.coreAttributesTitle) as string}
      description={parseAndRenderUIString(UI_STRINGS.coreAttributesDescription) as string}
      icon={ScrollText}
      cardContentClassName="space-y-6 pt-6"
      initialLockedState={false}
    >
      {({ isLocked: panelIsLocked }) => (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-1.5">
              <Label htmlFor="name">{parseAndRenderUIString(UI_STRINGS.characterNameLabel)}</Label>
              <Input id="name" name="name" value={localName} onChange={(e) => setLocalName(e.target.value)} disabled={panelIsLocked} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="playerName">{parseAndRenderUIString(UI_STRINGS.playerNameLabel)}</Label>
              <Input id="playerName" name="playerName" value={localPlayerName} onChange={(e) => setLocalPlayerName(e.target.value)} disabled={panelIsLocked}/>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-1.5">
              <Label htmlFor="race">{parseAndRenderUIString(UI_STRINGS.raceLabel)}</Label>
              <div className="flex items-center gap-2">
                <div className="flex-grow">
                  <Select
                    value={localRace}
                    onValueChange={(value) => setLocalRace(value as DndRaceId)}
                    disabled={panelIsLocked}
                  >
                    <SelectTrigger id="race">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {raceSelectOptions}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10" onClick={onOpenRaceInfoDialog} disabled={!localRace || panelIsLocked}>
                  <Info className="h-5 w-5" />
                </Button>
              </div>
              {isPredefinedRace && raceSpecialQualities?.abilityEffects && raceSpecialQualities.abilityEffects.length > 0 && (
                 <div className="flex flex-wrap items-baseline gap-1 pt-[6px] ml-1">
                  {raceSpecialQualities.abilityEffects.map((effect) => {
                    let badgeVariantProp: "destructive" | "secondary" | "default" = "secondary";
                    let badgeClassNameInternal = "whitespace-nowrap";
                    if (effect.change > 0) badgeClassNameInternal = cn(badgeClassNameInternal, "bg-emerald-700 text-emerald-100 border-emerald-600", "hover:bg-emerald-700 hover:text-emerald-100");
                    else if (effect.change < 0) { badgeVariantProp = "destructive"; badgeClassNameInternal = cn(badgeClassNameInternal, "hover:bg-destructive"); }
                    else badgeClassNameInternal = cn(badgeClassNameInternal, "bg-muted/50 text-muted-foreground border-border", "hover:bg-muted/50 hover:text-muted-foreground");
                    return ( <Badge key={effect.ability} variant={badgeVariantProp} className={badgeClassNameInternal}> {parseAndRenderUIString(UI_STRINGS.abilityScoreRaceModBadgeFormat, { abilityAbbr: effect.ability.substring(0, 3).toUpperCase(), change: (effect.change > 0 ? `+${effect.change}` : (effect.change < 0 ? effect.change : '0')) })} </Badge> );
                  })}
                </div>
              )}
            </div>
             <div className="space-y-1.5">
              <Label htmlFor="className">{parseAndRenderUIString(UI_STRINGS.classLabel)}</Label>
              <div className="flex items-center gap-2">
                <div className="flex-grow">
                  <Select
                    value={localClassName}
                    onValueChange={(value) => setLocalClassName(value as DndClassId)}
                    disabled={panelIsLocked}
                  >
                    <SelectTrigger id="className"> <SelectValue /> </SelectTrigger>
                    <SelectContent> {classSelectOptions} </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10" onClick={onOpenClassInfoDialog} disabled={!localClassName || panelIsLocked} >
                  <Info className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-[6px] ml-1">
                {selectedClassInfo?.hitDice && (
                   <Badge variant="secondary" className="whitespace-nowrap">
                    <Heart fill="currentColor" className="inline h-3 w-3 mr-1.5 text-primary/70" />
                     {parseAndRenderUIString(UI_STRINGS.hitDiceLabel, {value: selectedClassInfo.hitDice})}
                  </Badge>
                )}
                {aggregatedFeatEffects?.grantedAbilities && aggregatedFeatEffects.grantedAbilities.map(ability => {
                   const abilityNameForDisplay = getLocalizedString(ability.name, currentLang);
                   if (ability.uses && typeof ability.uses.value === 'number' && ability.uses.per) {
                    const periodStrKey = `period${ability.uses.per.charAt(0).toUpperCase() + ability.uses.per.slice(1)}` as keyof typeof UI_STRINGS;
                    const localizedPeriod = UI_STRINGS[periodStrKey] || ability.uses.per;
                    const dataContext = {
                      abilityName: abilityNameForDisplay,
                      usesValue: ability.uses.value,
                      period: localizedPeriod
                    };
                    return (
                      <Badge key={ability.abilityKey} variant="secondary" className="whitespace-nowrap bg-accent text-accent-foreground">
                        <Activity className="inline h-3 w-3 mr-1" />
                        {parseAndRenderUIString(UI_STRINGS.abilityUsesFormat, dataContext)}
                      </Badge>
                    );
                  } else if (ability.uses && ability.uses.value === "customPool" && ability.abilityKey === "layOnHandsHealingPool" && aggregatedFeatEffects?.modifiedMechanics?.layOnHandsHealingPool) {
                    const localizedPeriod = UI_STRINGS.periodDay || 'day';
                    const poolValue = aggregatedFeatEffects.modifiedMechanics.layOnHandsHealingPool.value;
                     const dataContext = {
                        abilityName: abilityNameForDisplay,
                        poolValue: typeof poolValue === 'number' ? poolValue : "Pool",
                        period: localizedPeriod
                    };
                    return (
                         <Badge key={ability.abilityKey} variant="secondary" className="whitespace-nowrap bg-accent text-accent-foreground">
                            <Heart className="inline h-3 w-3 mr-1" />
                            {parseAndRenderUIString(UI_STRINGS.abilityPoolFormat, dataContext)}
                        </Badge>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>

          {selectedClassInfo?.uiSections && selectedClassInfo.uiSections.map(uiBlock => (
            <React.Fragment key={`ui-section-wrapper-${uiBlock.key}`}>
              {renderClassSpecificUI(uiBlock, panelIsLocked)}
            </React.Fragment>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-1.5">
              <Label htmlFor="alignment">{parseAndRenderUIString(UI_STRINGS.alignmentLabel)}</Label>
              <div className="flex items-center gap-2">
                <div className="flex-grow">
                  <Select
                    name="alignment"
                    value={localAlignment}
                    onValueChange={(value) => setLocalAlignment(value as CharacterAlignment)}
                    disabled={panelIsLocked}
                  >
                    <SelectTrigger id="alignment">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAlignments.map(align => (
                        <SelectItem key={align.id} value={align.id}>{align.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                  <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10" onClick={onOpenAlignmentInfoDialog} disabled={panelIsLocked}> <Info className="h-5 w-5" /> </Button>
              </div>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="deity">{parseAndRenderUIString(UI_STRINGS.deityLabel)}</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-grow">
                    <Select value={localDeity} onValueChange={(value) => setLocalDeity(value)} disabled={panelIsLocked} >
                      <SelectTrigger id="deity"> <SelectValue /> </SelectTrigger>
                      <SelectContent> {deitySelectOptions.map(opt => ( <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem> ))} </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10" onClick={onOpenDeityInfoDialog} disabled={!localDeity || localDeity.trim() === '' || localDeity === DEITY_NONE_OPTION_VALUE || panelIsLocked} >
                    <Info className="h-5 w-5" />
                  </Button>
                </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="space-y-1.5">
              <Label htmlFor="age" className="inline-block w-full text-center md:text-center">{parseAndRenderUIString(UI_STRINGS.ageLabel)}</Label>
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
                disabled={panelIsLocked}
              />
              {ageEffectsDetails && (ageEffectsDetails.categoryName !== (UI_STRINGS.ageCategoryAdult || 'Adult') || ageEffectsDetails.effects.length > 0) && (
                 <div className="flex flex-wrap items-baseline justify-center md:justify-start gap-1 pt-[6px] ml-1">
                  <Badge variant="secondary" className="whitespace-nowrap"> {parseAndRenderUIString(ageEffectsDetails.categoryName)} </Badge>
                  {ageEffectsDetails.effects.map((effect) => {
                    let badgeVariantProp: "destructive" | "secondary" | "default" = "secondary";
                    let badgeClassNameInternal = "whitespace-nowrap";
                    if (effect.change > 0) badgeClassNameInternal = cn(badgeClassNameInternal, "bg-emerald-700 text-emerald-100 border-emerald-600", "hover:bg-emerald-700 hover:text-emerald-100");
                    else if (effect.change < 0) { badgeVariantProp = "destructive"; badgeClassNameInternal = cn(badgeClassNameInternal, "hover:bg-destructive"); }
                    return ( <Badge key={effect.ability} variant={badgeVariantProp} className={badgeClassNameInternal}> {parseAndRenderUIString(UI_STRINGS.abilityScoreAgingEffectBadgeFormat, {abilityAbbr: effect.ability.substring(0,3).toUpperCase(), change: (effect.change > 0 ? `+${effect.change}` : effect.change)})} </Badge> );
                  })}
                </div>
              )}
              </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender">{parseAndRenderUIString(UI_STRINGS.genderLabel)}</Label>
              <Select
                name="gender"
                value={localGender}
                onValueChange={(value) => setLocalGender(value as GenderId)}
                disabled={panelIsLocked}
              >
                <SelectTrigger id="gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {genderSelectOptions.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sizeCategory">{parseAndRenderUIString(UI_STRINGS.sizeLabel)}</Label>
              <Select name="sizeCategory" value={localSize} onValueChange={(value) => setLocalSize(value as CharacterSize)} disabled={panelIsLocked}>
                <SelectTrigger id="sizeCategory"><SelectValue /></SelectTrigger>
                <SelectContent> {sizeSelectOptions} </SelectContent>
              </Select>
              <div className="flex items-baseline gap-1 pt-[6px] ml-1">
                {localSize && (() => {
                  const selectedSizeObject = translations.SIZES.find(s => s.id === localSize);
                  if (selectedSizeObject && typeof selectedSizeObject.acModifier === 'number' && selectedSizeObject.acModifier !== 0) {
                    const acMod = selectedSizeObject.acModifier;
                    let badgeVariantProp: "destructive" | "secondary" | "default" = "secondary";
                    let badgeClassNameForAc = "whitespace-nowrap";
                    if (acMod > 0) badgeClassNameForAc = cn(badgeClassNameForAc, "bg-emerald-700 text-emerald-100 border-emerald-600", "hover:bg-emerald-700 hover:text-emerald-100");
                    else if (acMod < 0) { badgeVariantProp = "destructive"; badgeClassNameForAc = cn(badgeClassNameForAc, "hover:bg-destructive"); }
                    return ( <Badge variant={badgeVariantProp} className={badgeClassNameForAc}> {parseAndRenderUIString(UI_STRINGS.acModSizeBadgeFormat, {acModValue: (acMod > 0 ? `+${acMod}` : acMod)})} </Badge> );
                  } return null;
                })()}
              </div>
            </div>
          </div>
        </>
      )}
    </LockablePanelWrapper>
  );
};
CharacterFormCoreInfoSectionComponent.displayName = 'CharacterFormCoreInfoSectionComponent';
export const CharacterFormCoreInfoSection = React.memo(CharacterFormCoreInfoSectionComponent);

    

