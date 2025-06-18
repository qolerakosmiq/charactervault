
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
  ClassSpecificUIBlock,
  ComboboxOption,
  LocalizedString,
  CharacterClassSpecificChoice
} from '@/types/character-core';
import { isAlignmentCompatibleWithDeity, isAlignmentValidForRequirement } from '@/types/character';
import { getLocalizedString } from '@/i18n/i18n-data';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollText, Info, Heart, Activity } from 'lucide-react'; // Added Heart
import { Button } from '@/components/ui/button';
import { cn, parseAndRenderUIString } from '@/lib/utils';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Badge } from '@/components/ui/badge';
import { ComboboxPrimitive } from '@/components/ui/combobox';
import { useI18n } from '@/context/I18nProvider';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { Separator } from '@/components/ui/separator';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper';

const DEBOUNCE_DELAY = 400;
const DEITY_NONE_OPTION_VALUE = "__NONE_DEITY__";
const DOMAIN_NONE_OPTION_VALUE = "__NONE_DOMAIN__";
const MAGIC_SCHOOL_NONE_OPTION_VALUE = "__NONE_SCHOOL__";


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
  const { translations, language: currentLang } = useI18n();
  // Assuming translations are always available due to fail-fast or parent component checks
  const { UI_STRINGS, ALIGNMENTS, DND_RACES, DND_CLASSES, DND_DEITIES, SIZES, GENDERS, DND_DOMAINS, DND_MAGIC_SCHOOLS } = translations!;


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
    characterData.classes[0].className,
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

  const selectedRaceInfo = React.useMemo(() => DND_RACES.find(r => r.id === localRace), [DND_RACES, localRace]);
  const selectedClassInfo = React.useMemo(() => DND_CLASSES.find(c => c.id === localClassName), [DND_CLASSES, localClassName]);

  const availableAlignments = React.useMemo(() => {
    const classRestriction = selectedClassInfo?.alignmentRestriction;
    if (!classRestriction || classRestriction === 'any') {
      return ALIGNMENTS;
    }
    return ALIGNMENTS.filter(align =>
      isAlignmentValidForRequirement(align.id as CharacterAlignment, classRestriction)
    );
  }, [ALIGNMENTS, selectedClassInfo]);

  React.useEffect(() => {
    if (!selectedClassInfo || !UI_STRINGS.preferredDefaultAlignmentIds) return;
    
    const currentAlignmentIsValidForNewClass = availableAlignments.some(a => a.id === localAlignment);

    if (!currentAlignmentIsValidForNewClass) {
        const preferredDefaultsFromData: readonly CharacterAlignment[] = UI_STRINGS.preferredDefaultAlignmentIds as unknown as readonly CharacterAlignment[];
        let newAlignmentToSet: CharacterAlignment | undefined = undefined;

        for (const preferred of preferredDefaultsFromData) {
            if (availableAlignments.some(a => a.id === preferred)) {
                newAlignmentToSet = preferred;
                break;
            }
        }
        if (!newAlignmentToSet && availableAlignments.length > 0) {
           newAlignmentToSet = availableAlignments[0].id as CharacterAlignment;
        }
        if (!newAlignmentToSet && preferredDefaultsFromData.length > 0) {
           newAlignmentToSet = preferredDefaultsFromData[0]; 
        }
        if (!newAlignmentToSet && ALIGNMENTS.length > 0) {
            const trueNeutralFallback = ALIGNMENTS.find(a => a.id === 'true-neutral')?.id as CharacterAlignment | undefined;
            newAlignmentToSet = trueNeutralFallback || ALIGNMENTS[0].id as CharacterAlignment;
        }
        
        if (newAlignmentToSet && newAlignmentToSet !== localAlignment) {
            setLocalAlignment(newAlignmentToSet);
        }
    }
  }, [localClassName, selectedClassInfo, availableAlignments, localAlignment, setLocalAlignment, ALIGNMENTS, UI_STRINGS.preferredDefaultAlignmentIds]);


  const deitySelectOptions = React.useMemo(() => {
    const noneOptionLabel = getLocalizedString(UI_STRINGS.deityNoneOption, currentLang);

    let filteredDeities = DND_DEITIES.filter(deity =>
      isAlignmentCompatibleWithDeity(localAlignment, deity.alignment)
    );

    if (selectedClassInfo?.deityAlignmentRestriction) {
      filteredDeities = filteredDeities.filter(deity =>
        isAlignmentValidForRequirement(deity.alignment, selectedClassInfo.deityAlignmentRestriction!)
      );
    }
    return [{ value: DEITY_NONE_OPTION_VALUE, label: noneOptionLabel }, ...filteredDeities.map(deity => ({value: deity.id, label: deity.label}))];
  }, [DND_DEITIES, localAlignment, selectedClassInfo, UI_STRINGS.deityNoneOption, currentLang]);

  React.useEffect(() => {
    if (localDeity === DEITY_NONE_OPTION_VALUE) return;

    const currentDeityInfo = DND_DEITIES.find(d => d.id === localDeity);
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
  }, [localDeity, localAlignment, selectedClassInfo, DND_DEITIES, setLocalDeity]);

  const genderSelectOptions = React.useMemo(() => {
    const unspecifiedOption = GENDERS.find(g => g.id === 'unspecified') || { id: 'unspecified' as GenderId, label: 'Unspecified' };
    const otherOption = GENDERS.find(g => g.id === 'other') || { id: 'other' as GenderId, label: 'Other' };
    const maleOption = GENDERS.find(g => g.id === 'male') || { id: 'male' as GenderId, label: 'Male' };
    const femaleOption = GENDERS.find(g => g.id === 'female') || { id: 'female' as GenderId, label: 'Female' };

    const options = [unspecifiedOption];
    const raceSpecificGenders = selectedRaceInfo?.genderOptions;

    if (raceSpecificGenders && raceSpecificGenders.length > 0) {
      options.push(...raceSpecificGenders.map(go => ({id: go.id as GenderId, label: go.label})));
    } else {
      options.push(maleOption, femaleOption);
    }
    if (!options.find(opt => opt.id === 'other')) {
      options.push(otherOption);
    }
    return options.filter((opt, index, self) => index === self.findIndex(o => o.id === opt.id));
  }, [GENDERS, selectedRaceInfo]);


  const handleClassSpecificChoiceChange = React.useCallback((
    featureKey: string,
    newValue: string,
    slotIndex?: number
  ) => {
    const existingChoices = characterData.classSpecificChoices || [];
    let updatedChoices: CharacterClassSpecificChoice[];

    if (slotIndex !== undefined) { // Multi-input scenario
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
      if (newValue === "" || newValue === DOMAIN_NONE_OPTION_VALUE || newValue === MAGIC_SCHOOL_NONE_OPTION_VALUE) {
        updatedChoices = updatedChoices.filter(c => !(c.featureKey === featureKey && c.slotIndex === slotIndex));
      }
    } else { // Single input scenario
      const choiceExists = existingChoices.some((c) => c.featureKey === featureKey && c.slotIndex === undefined);
      if (choiceExists) {
        updatedChoices = existingChoices.map((c) =>
          (c.featureKey === featureKey && c.slotIndex === undefined) ? { ...c, value: newValue } : c
        );
      } else {
        updatedChoices = [...existingChoices, { featureKey, value: newValue }];
      }
      if (newValue === "" || newValue === DOMAIN_NONE_OPTION_VALUE || newValue === MAGIC_SCHOOL_NONE_OPTION_VALUE) {
        updatedChoices = updatedChoices.filter(c => !(c.featureKey === featureKey && c.slotIndex === undefined));
      }
    }
    onFieldChange('classSpecificChoices', updatedChoices);
  }, [characterData.classSpecificChoices, onFieldChange]);

  const renderClassSpecificUI = React.useCallback((uiBlock: ClassSpecificUIBlock, panelIsLocked: boolean, blockIndex: number) => {
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
      const stateValue = (characterData.classSpecificChoices || []).find(c => c.featureKey === uiBlock.conditionDependsOnUIStateKey)?.value;
      if (uiBlock.conditionDependsOnUIStateValueNotIn && uiBlock.conditionDependsOnUIStateValueNotIn.includes(stateValue || "")) {
        return null;
      }
      if (uiBlock.conditionDependsOnUIStateValueIs && !uiBlock.conditionDependsOnUIStateValueIs.includes(stateValue || "")) {
        return null;
      }
    }

    const blockLabel = uiBlock.label ? getLocalizedString(uiBlock.label, currentLang) : (uiBlock.labelKey ? UI_STRINGS[uiBlock.labelKey] : uiBlock.key);
    const blockDescription = uiBlock.description ? getLocalizedString(uiBlock.description, currentLang) : (uiBlock.descriptionKey ? UI_STRINGS[uiBlock.descriptionKey] : undefined);
    const blockNote = uiBlock.note ? getLocalizedString(uiBlock.note, currentLang) : undefined;

    const getCurrentValue = (key: string, index?: number): string => {
      const choice = (characterData.classSpecificChoices || []).find(
        c => c.featureKey === key && (index === undefined || c.slotIndex === index)
      );
      return choice?.value || '';
    };
    
    let placeholderForSelectOrCombobox: string | undefined;
    if (uiBlock.placeholder) placeholderForSelectOrCombobox = getLocalizedString(uiBlock.placeholder, currentLang);
    else if (uiBlock.placeholderKey) placeholderForSelectOrCombobox = UI_STRINGS[uiBlock.placeholderKey];

    let actualOptions: ComboboxOption[] = [];
    if (uiBlock.optionsSource === 'domains' && DND_DOMAINS) {
        const noneOptionLabel = getLocalizedString(UI_STRINGS.domainNoneOption, currentLang) || "None";
        actualOptions = [{ value: DOMAIN_NONE_OPTION_VALUE, label: noneOptionLabel }, ...DND_DOMAINS.map(d => ({ value: d.id, label: d.label }))]
            .sort((a, b) => a.label.localeCompare(b.label));
        if (uiBlock.key === 'clericDomain2') {
            const firstDomainValue = getCurrentValue('clericDomain1');
            if (firstDomainValue && firstDomainValue !== DOMAIN_NONE_OPTION_VALUE) {
                actualOptions = actualOptions.filter(opt => opt.value !== firstDomainValue);
            }
        }
    } else if (uiBlock.optionsSource === 'magicSchools' && DND_MAGIC_SCHOOLS) {
        const noneOptionLabel = getLocalizedString(UI_STRINGS.magicSchoolNoneOption, currentLang) || "None / Universalist";
        actualOptions = [{ value: MAGIC_SCHOOL_NONE_OPTION_VALUE, label: noneOptionLabel }, ...DND_MAGIC_SCHOOLS.map(s => ({ value: s.id, label: s.label }))]
            .sort((a, b) => a.label.localeCompare(b.label));

        const chosenSpecializationSchool = getCurrentValue('chosenSpecializationSchool');
        const prohibitedSchool1 = getCurrentValue('prohibitedSchool1');

        if (uiBlock.key.startsWith('prohibitedSchool')) {
             actualOptions = actualOptions.filter(opt => opt.value !== 'divination');
             if (chosenSpecializationSchool && chosenSpecializationSchool !== MAGIC_SCHOOL_NONE_OPTION_VALUE && chosenSpecializationSchool !== 'universal') {
                actualOptions = actualOptions.filter(opt => opt.value !== chosenSpecializationSchool);
             }
        }
        if (uiBlock.key === 'prohibitedSchool2') {
            if (prohibitedSchool1 && prohibitedSchool1 !== MAGIC_SCHOOL_NONE_OPTION_VALUE) {
                actualOptions = actualOptions.filter(opt => opt.value !== prohibitedSchool1);
            }
        }
    } else if (uiBlock.optionsSource === 'customList' && uiBlock.customOptions) {
        actualOptions = uiBlock.customOptions.map(opt => ({ value: opt.value, label: getLocalizedString(opt.label, currentLang) })).filter(opt => opt.value !== "");
    }

    let isDisabled = panelIsLocked;
    if (uiBlock.relatedSlotKeyForDisable && !isDisabled) {
        const relatedChoice = (characterData.classSpecificChoices || []).find(
            c => c.featureKey === uiBlock.relatedSlotKeyForDisable
        );
        if (!relatedChoice || relatedChoice.value === '' || relatedChoice.value === DOMAIN_NONE_OPTION_VALUE || relatedChoice.value === MAGIC_SCHOOL_NONE_OPTION_VALUE) {
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

    if (uiBlock.isHeadingOnly) {
      return (
        <div key={`${uiBlock.key}-${blockIndex}`} className="mt-3 mb-1">
          <h3 className="text-lg font-semibold text-foreground/80">{blockLabel}</h3>
          {blockDescription && <p className="text-xs text-muted-foreground">{blockDescription}</p>}
          <Separator className="mt-1" />
        </div>
      );
    }

    const currentBlockValue = getCurrentValue(uiBlock.key, uiBlock.choiceType === 'multiInput' ? blockIndex : undefined);
    const filteredActualOptions = actualOptions.filter(opt => opt.value !== "");

    if (uiBlock.choiceType === 'select') {
      return (
        <div key={`${uiBlock.key}-${blockIndex}`} className="space-y-1.5">
          <Label htmlFor={`cspec-${uiBlock.key}-${blockIndex}`}>{blockLabel}</Label>
          <Select
            name={uiBlock.key}
            value={currentBlockValue}
            onValueChange={(val) => handleClassSpecificChoiceChange(uiBlock.key, val, uiBlock.choiceType === 'multiInput' ? blockIndex : undefined)}
            disabled={isDisabled}
          >
            <SelectTrigger id={`cspec-${uiBlock.key}-${blockIndex}`} className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filteredActualOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {blockDescription && <p className="text-xs text-muted-foreground">{blockDescription}</p>}
          {blockNote && <p className="text-xs text-destructive/80 italic mt-1">{blockNote}</p>}
        </div>
      );
    } else if (uiBlock.choiceType === 'combobox') {
      return (
        <div key={`${uiBlock.key}-${blockIndex}`} className="space-y-1.5">
          <Label htmlFor={`cspec-${uiBlock.key}-${blockIndex}`}>{blockLabel}</Label>
          <ComboboxPrimitive
            options={filteredActualOptions}
            value={currentBlockValue}
            onChange={(val) => handleClassSpecificChoiceChange(uiBlock.key, val, uiBlock.choiceType === 'multiInput' ? blockIndex : undefined)}
            placeholder={placeholderForSelectOrCombobox}
            triggerClassName="h-9 text-sm"
            disabled={isDisabled}
          />
          {blockDescription && <p className="text-xs text-muted-foreground">{blockDescription}</p>}
          {blockNote && <p className="text-xs text-destructive/80 italic mt-1">{blockNote}</p>}
        </div>
      );
    } else if (uiBlock.choiceType === 'multiInput' && uiBlock.maxSelections && uiBlock.maxSelections > 0) {
      const numInputsToRender = uiBlock.maxSelections;
      const slotLabelTemplate = uiBlock.slotLabel ? getLocalizedString(uiBlock.slotLabel, currentLang) : (uiBlock.slotLabelKey ? UI_STRINGS[uiBlock.slotLabelKey] : `${uiBlock.key} Slot {slotNum}`);
      const inputPlaceholderText = uiBlock.inputPlaceholder ? getLocalizedString(uiBlock.inputPlaceholder, currentLang) : (uiBlock.inputPlaceholderKey ? UI_STRINGS[uiBlock.inputPlaceholderKey] : undefined);

      return (
        <div key={`${uiBlock.key}-group-${blockIndex}`} className="space-y-3 p-3 border rounded-md bg-muted/20">
          <Label className="flex items-center text-md font-medium">
            {blockLabel}
            <Badge variant="outline" className="ml-2">{numInputsToRender}</Badge>
          </Label>
          {blockDescription && <p className="text-xs text-muted-foreground">{blockDescription}</p>}
          {Array.from({ length: numInputsToRender }).map((_, index) => (
            <div key={`${uiBlock.key}-slot-${index}`} className="space-y-1">
              <Label htmlFor={`${uiBlock.key}-input-${index}`} className="text-xs">
                {parseAndRenderUIString(slotLabelTemplate, { slotNum: index + 1 })}
              </Label>
              <Input
                id={`${uiBlock.key}-input-${index}`}
                value={getCurrentValue(uiBlock.key, index)}
                onChange={(e) => handleClassSpecificChoiceChange(uiBlock.key, e.target.value, index)}
                placeholder={inputPlaceholderText}
                className="h-9 text-sm"
                disabled={isDisabled}
              />
            </div>
          ))}
          {blockNote && <p className="text-xs text-destructive/80 italic mt-1">{blockNote}</p>}
        </div>
      );
    } else if (uiBlock.choiceType === 'textInput') {
      const inputPlaceholderText = uiBlock.inputPlaceholder ? getLocalizedString(uiBlock.inputPlaceholder, currentLang) : (uiBlock.inputPlaceholderKey ? UI_STRINGS[uiBlock.inputPlaceholderKey] : undefined);
      return (
         <div key={`${uiBlock.key}-${blockIndex}`} className="space-y-1.5">
            <Label htmlFor={`cspec-${uiBlock.key}-${blockIndex}`}>{blockLabel}</Label>
            <Input
                id={`cspec-${uiBlock.key}-${blockIndex}`}
                value={getCurrentValue(uiBlock.key)}
                onChange={(e) => handleClassSpecificChoiceChange(uiBlock.key, e.target.value)}
                placeholder={inputPlaceholderText}
                disabled={isDisabled}
            />
            {blockDescription && <p className="text-xs text-muted-foreground">{blockDescription}</p>}
            {blockNote && <p className="text-xs text-destructive/80 italic mt-1">{blockNote}</p>}
         </div>
      );
    }
    return <div key={`${uiBlock.key}-error-${blockIndex}`} className="text-destructive">Unsupported choiceType: {uiBlock.choiceType} for {uiBlock.key}</div>;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterData.classes, characterData.classSpecificChoices, aggregatedFeatEffects, UI_STRINGS, currentLang, DND_DOMAINS, DND_MAGIC_SCHOOLS, handleClassSpecificChoiceChange]);


  return (
    <LockablePanelWrapper
      title={UI_STRINGS.coreAttributesTitle}
      description={UI_STRINGS.coreAttributesDescription}
      icon={ScrollText}
      cardContentClassName="space-y-6 pt-6"
      initialLockedState={false}
    >
      {({ isLocked: panelIsLocked }) => (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-1.5">
              <Label htmlFor="name">{UI_STRINGS.characterNameLabel}</Label>
              <Input id="name" name="name" value={localName} onChange={(e) => setLocalName(e.target.value)} disabled={panelIsLocked} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="playerName">{UI_STRINGS.playerNameLabel}</Label>
              <Input id="playerName" name="playerName" value={localPlayerName} onChange={(e) => setLocalPlayerName(e.target.value)} disabled={panelIsLocked}/>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-1.5">
              <Label htmlFor="race">{UI_STRINGS.raceLabel}</Label>
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
                      {DND_RACES.map(race => <SelectItem key={race.id} value={race.id}>{race.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10" onClick={onOpenRaceInfoDialog} disabled={!localRace || panelIsLocked}>
                  <Info className="h-5 w-5" />
                </Button>
              </div>
              {selectedRaceInfo && raceSpecialQualities?.abilityEffects && raceSpecialQualities.abilityEffects.length > 0 && (
                 <div className="flex flex-wrap items-baseline gap-1 pt-[6px] ml-1">
                  {raceSpecialQualities.abilityEffects.map((effect) => {
                    let badgeVariantProp: "destructive" | "secondary" | "default" = "secondary";
                    let badgeClassNameInternal = "whitespace-nowrap";
                    const changeValue = effect.change > 0 ? `+${effect.change}` : String(effect.change);
                    if (effect.change > 0) badgeClassNameInternal = cn(badgeClassNameInternal, "bg-emerald-700 text-emerald-100 border-emerald-600", "hover:bg-emerald-700 hover:text-emerald-100");
                    else if (effect.change < 0) { badgeVariantProp = "destructive"; badgeClassNameInternal = cn(badgeClassNameInternal, "hover:bg-destructive"); }
                    else badgeClassNameInternal = cn(badgeClassNameInternal, "bg-muted/50 text-muted-foreground border-border", "hover:bg-muted/50 hover:text-muted-foreground");
                    return (
                       <Badge key={effect.ability} variant={badgeVariantProp} className={badgeClassNameInternal}>
                          {effect.ability.substring(0, 3).toUpperCase()}{'\u00A0|\u00A0'}<b>{changeValue}</b>
                       </Badge>
                    );
                  })}
                </div>
              )}
            </div>
             <div className="space-y-1.5">
              <Label htmlFor="className">{UI_STRINGS.classLabel}</Label>
              <div className="flex items-center gap-2">
                <div className="flex-grow">
                  <Select
                    value={localClassName}
                    onValueChange={(value) => setLocalClassName(value as DndClassId)}
                    disabled={panelIsLocked}
                  >
                    <SelectTrigger id="className"> <SelectValue /> </SelectTrigger>
                    <SelectContent> {DND_CLASSES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)} </SelectContent>
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
                    const localizedPeriod = (ability.uses.per === 'day' ? (UI_STRINGS.periodDay) : ability.uses.per === 'encounter' ? (UI_STRINGS.periodEncounter) : ability.uses.per === 'week' ? (UI_STRINGS.periodWeek) : ability.uses.per);
                    const usesValue = ability.uses.value;
                    return (
                      <Badge key={ability.abilityKey} variant="secondary" className="whitespace-nowrap bg-accent text-accent-foreground">
                        <Activity className="inline h-3 w-3 mr-1" />
                        {parseAndRenderUIString(UI_STRINGS.abilityUsesFormat, {abilityName: abilityNameForDisplay, period: localizedPeriod, usesValue: String(usesValue)})}
                      </Badge>
                    );
                  } else if (ability.uses && ability.uses.value === "customPool" && ability.abilityKey === "layOnHandsHealingPool" && aggregatedFeatEffects?.modifiedMechanics?.layOnHandsHealingPool) {
                    const localizedPeriod = UI_STRINGS.periodDay;
                    const poolValue = aggregatedFeatEffects.modifiedMechanics.layOnHandsHealingPool.value;
                    return (
                         <Badge key={ability.abilityKey} variant="secondary" className="whitespace-nowrap bg-accent text-accent-foreground">
                            <Heart className="inline h-3 w-3 mr-1" />
                            {parseAndRenderUIString(UI_STRINGS.abilityPoolFormat, {abilityName: abilityNameForDisplay, poolValue: String(typeof poolValue === 'number' ? poolValue : "Pool"), period: localizedPeriod})}
                        </Badge>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>

          {selectedClassInfo?.uiSections && selectedClassInfo.uiSections.map((uiBlock, index) => (
            <React.Fragment key={`ui-section-wrapper-${uiBlock.key}-${index}`}>
              {renderClassSpecificUI(uiBlock, panelIsLocked, index)}
            </React.Fragment>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-1.5">
              <Label htmlFor="alignment">{UI_STRINGS.alignmentLabel}</Label>
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
                <Label htmlFor="deity">{UI_STRINGS.deityLabel}</Label>
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
              <Label htmlFor="age" className="inline-block w-full text-center md:text-center">{UI_STRINGS.ageLabel}</Label>
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
              {ageEffectsDetails && (ageEffectsDetails.categoryName !== (UI_STRINGS.ageCategoryAdult) || ageEffectsDetails.effects.length > 0) && (
                 <div className="flex flex-wrap items-baseline justify-center md:justify-start gap-1 pt-[6px] ml-1">
                  <Badge variant="secondary" className="whitespace-nowrap"> {parseAndRenderUIString(ageEffectsDetails.categoryName)} </Badge>
                  {ageEffectsDetails.effects.map((effect) => {
                    let badgeVariantProp: "destructive" | "secondary" | "default" = "secondary";
                    let badgeClassNameInternal = "whitespace-nowrap";
                    const changeValue = effect.change > 0 ? `+${effect.change}` : String(effect.change);
                    if (effect.change > 0) badgeClassNameInternal = cn(badgeClassNameInternal, "bg-emerald-700 text-emerald-100 border-emerald-600", "hover:bg-emerald-700 hover:text-emerald-100");
                    else if (effect.change < 0) { badgeVariantProp = "destructive"; badgeClassNameInternal = cn(badgeClassNameInternal, "hover:bg-destructive"); }
                    else badgeClassNameInternal = cn(badgeClassNameInternal, "bg-muted/50 text-muted-foreground border-border", "hover:bg-muted/50 hover:text-muted-foreground");
                    return (
                      <Badge key={effect.ability} variant={badgeVariantProp} className={badgeClassNameInternal}>
                        {effect.ability.substring(0, 3).toUpperCase()}{'\u00A0|\u00A0'}<b>{changeValue}</b>
                      </Badge>
                    );
                  })}
                </div>
              )}
              </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender">{UI_STRINGS.genderLabel}</Label>
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
              <Label htmlFor="sizeCategory">{UI_STRINGS.sizeLabel}</Label>
              <Select name="sizeCategory" value={localSize} onValueChange={(value) => setLocalSize(value as CharacterSize)} disabled={panelIsLocked}>
                <SelectTrigger id="sizeCategory"><SelectValue /></SelectTrigger>
                <SelectContent> {SIZES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)} </SelectContent>
              </Select>
              <div className="flex items-baseline gap-1 pt-[6px] ml-1">
                {localSize && (() => {
                  const selectedSizeObject = SIZES.find(s => s.id === localSize);
                  if (selectedSizeObject && typeof selectedSizeObject.acModifier === 'number' && selectedSizeObject.acModifier !== 0) {
                    const acMod = selectedSizeObject.acModifier;
                    let badgeVariantProp: "destructive" | "secondary" | "default" = "secondary";
                    let badgeClassNameForAc = "whitespace-nowrap";
                    const acModValue = acMod > 0 ? `+${acMod}` : String(acMod);
                    if (acMod > 0) badgeClassNameForAc = cn(badgeClassNameForAc, "bg-emerald-700 text-emerald-100 border-emerald-600", "hover:bg-emerald-700 hover:text-emerald-100");
                    else if (acMod < 0) { badgeVariantProp = "destructive"; badgeClassNameForAc = cn(badgeClassNameForAc, "hover:bg-destructive"); }
                    return (
                      <Badge variant={badgeVariantProp} className={badgeClassNameForAc}>
                        {parseAndRenderUIString(UI_STRINGS.acModSizeBadgeFormat, { acModValue: acModValue })}
                      </Badge>
                    );
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

