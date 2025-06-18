
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
import { getLocalizedString, type ProcessedSiteData } from '@/i18n/i18n-data';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollText, Info, Heart, Activity } from 'lucide-react';
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
const UI_EMPTY_SELECTION_VALUE = "__EMPTY_SELECTION__"; // Unique placeholder for UI Select/Combobox

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
    characterData.deity || "", 
    React.useCallback((value) => onFieldChange('deity', value as DndDeityId | string), [onFieldChange]),
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
        const preferredDefaultsFromData = UI_STRINGS.preferredDefaultAlignmentIds as unknown as readonly CharacterAlignment[];
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
    let filteredDeities = DND_DEITIES.filter(deity =>
      isAlignmentCompatibleWithDeity(localAlignment, deity.alignment)
    );

    if (selectedClassInfo?.deityAlignmentRestriction) {
      filteredDeities = filteredDeities.filter(deity =>
        isAlignmentValidForRequirement(deity.alignment, selectedClassInfo.deityAlignmentRestriction!)
      );
    }
    const options = filteredDeities.map(deity => ({value: deity.id, label: deity.label}));
    options.unshift({value: "", label: UI_STRINGS.deityNoneOption || "None"});
    
    return options;
  }, [DND_DEITIES, localAlignment, selectedClassInfo, UI_STRINGS.deityNoneOption]);

  React.useEffect(() => {
    if (localDeity === "") return; 

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
      setLocalDeity(""); 
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
      if (newValue === "") { 
        updatedChoices = updatedChoices.filter(c => !(c.featureKey === featureKey && c.slotIndex === slotIndex && newValue === ""));
      }
    } else { 
      const choiceExists = existingChoices.some((c) => c.featureKey === featureKey && c.slotIndex === undefined);
      if (choiceExists) {
        updatedChoices = existingChoices.map((c) =>
          (c.featureKey === featureKey && c.slotIndex === undefined) ? { ...c, value: newValue } : c
        );
      } else {
        updatedChoices = [...existingChoices, { featureKey, value: newValue }];
      }
      if (newValue === "") { 
         updatedChoices = updatedChoices.filter(c => !(c.featureKey === featureKey && c.slotIndex === undefined && newValue === ""));
      }
    }
    onFieldChange('classSpecificChoices', updatedChoices);
  }, [characterData.classSpecificChoices, onFieldChange]);


  React.useEffect(() => {
    if (selectedClassInfo?.uiSections) {
      const existingChoicesMap = new Map(
        (characterData.classSpecificChoices || []).map(choice => [`${choice.featureKey}-${choice.slotIndex ?? 'single'}`, choice.value])
      );
      let choicesToUpdate: CharacterClassSpecificChoice[] = [...(characterData.classSpecificChoices || [])];
      let changed = false;

      selectedClassInfo.uiSections.forEach(uiBlock => {
        const choiceKeyBase = `${uiBlock.key}`;
        const numSlots = uiBlock.choiceType === 'multiInput' && uiBlock.maxSelections ? uiBlock.maxSelections : 1;

        for (let i = 0; i < numSlots; i++) {
          const slotIndex = uiBlock.choiceType === 'multiInput' ? i : undefined;
          const fullChoiceKey = `${choiceKeyBase}-${slotIndex ?? 'single'}`;

          if (!existingChoicesMap.has(fullChoiceKey)) {
            let valueToSet: string | undefined = uiBlock.defaultValue;

            if (valueToSet === undefined) {
              if (uiBlock.allowEmptySelection) {
                valueToSet = "";
              } else {
                let tempOptions: ComboboxOption[] = [];
                 if (uiBlock.optionsSource === 'domains' && DND_DOMAINS) tempOptions = DND_DOMAINS.map(d => ({ value: d.id, label: d.label }));
                 else if (uiBlock.optionsSource === 'magicSchools' && DND_MAGIC_SCHOOLS) tempOptions = DND_MAGIC_SCHOOLS.map(s => ({ value: s.id, label: s.label }));
                 else if (uiBlock.optionsSource === 'customList' && uiBlock.customOptions) tempOptions = uiBlock.customOptions.map(opt => ({ value: opt.value, label: getLocalizedString(opt.label, currentLang) }));
                
                if (tempOptions.length > 0) {
                   valueToSet = tempOptions.filter(opt => opt.value !== "")[0]?.value;
                }
              }
            }
            
            if (valueToSet !== undefined) {
              const existingIndex = choicesToUpdate.findIndex(c => c.featureKey === uiBlock.key && c.slotIndex === slotIndex);
              if (existingIndex > -1) {
                if (choicesToUpdate[existingIndex].value !== valueToSet) {
                  choicesToUpdate[existingIndex].value = valueToSet;
                  changed = true;
                }
              } else {
                choicesToUpdate.push({ featureKey: uiBlock.key, value: valueToSet, slotIndex });
                changed = true;
              }
            }
          }
        }
      });

      if (changed) {
        onFieldChange('classSpecificChoices', choicesToUpdate);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassInfo?.id, selectedClassInfo?.uiSections]); // Only re-run if class or its UI sections change


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
      return choice?.value ?? ""; 
    };
    
    let actualOptions: ComboboxOption[] = [];
    if (uiBlock.allowEmptySelection && uiBlock.emptySelectionLabelKey) {
        const emptyLabel = UI_STRINGS[uiBlock.emptySelectionLabelKey] || "None";
        actualOptions.push({ value: UI_EMPTY_SELECTION_VALUE, label: emptyLabel });
    }

    if (uiBlock.optionsSource === 'domains' && DND_DOMAINS) {
        actualOptions.push(...DND_DOMAINS.map(d => ({ value: d.id, label: d.label })));
    } else if (uiBlock.optionsSource === 'magicSchools' && DND_MAGIC_SCHOOLS) {
        actualOptions.push(...DND_MAGIC_SCHOOLS.map(s => ({ value: s.id, label: s.label })));
    } else if (uiBlock.optionsSource === 'customList' && uiBlock.customOptions) {
        actualOptions.push(...uiBlock.customOptions.map(opt => ({ value: opt.value, label: getLocalizedString(opt.label, currentLang) })).filter(opt => opt.value !== UI_EMPTY_SELECTION_VALUE));
    }
    actualOptions.sort((a,b) => (a.value === UI_EMPTY_SELECTION_VALUE ? -1 : b.value === UI_EMPTY_SELECTION_VALUE ? 1 : a.label.localeCompare(b.label)));


    let isDisabled = panelIsLocked;
    if (uiBlock.relatedSlotKeyForDisable && !isDisabled) {
        const relatedChoice = (characterData.classSpecificChoices || []).find(
            c => c.featureKey === uiBlock.relatedSlotKeyForDisable
        );
        if (!relatedChoice || relatedChoice.value === "") { 
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
    
    if ((uiBlock.key === 'clericDomain2' || uiBlock.key === 'prohibitedSchool2') && !isDisabled) {
        const firstChoiceKey = uiBlock.key === 'clericDomain2' ? 'clericDomain1' : (uiBlock.key === 'prohibitedSchool2' ? 'prohibitedSchool1' : 'errorKey');
        const firstChoiceValue = getCurrentValue(firstChoiceKey);
        const specializedSchoolValue = (uiBlock.key === 'prohibitedSchool1' || uiBlock.key === 'prohibitedSchool2') ? getCurrentValue('chosenSpecializationSchool') : undefined;

        const currentSlotValue = getCurrentValue(uiBlock.key, uiBlock.choiceType === 'multiInput' ? blockIndex : undefined);

        actualOptions = actualOptions.filter(opt => {
            if (opt.value === UI_EMPTY_SELECTION_VALUE) return true; 
            if (opt.value === firstChoiceValue && firstChoiceValue !== "") return false;
            if (specializedSchoolValue && opt.value === specializedSchoolValue) return false;
            if (uiBlock.key === 'prohibitedSchool2' && specializedSchoolValue === "divination" && opt.value === "divination") return false; // Can't prohibit divination if specialized in it for P2
            if ((uiBlock.key === 'prohibitedSchool1' || uiBlock.key === 'prohibitedSchool2') && opt.value === "divination") return false; // Divination cannot be prohibited.
            if ((uiBlock.key === 'prohibitedSchool1' || uiBlock.key === 'prohibitedSchool2') && opt.value === "universal") return false; // Universal cannot be prohibited.
            return true;
        });
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
    const uiValue = currentBlockValue === "" ? UI_EMPTY_SELECTION_VALUE : currentBlockValue;

    const handleChange = (val: string) => {
        handleClassSpecificChoiceChange(uiBlock.key, val === UI_EMPTY_SELECTION_VALUE ? "" : val, uiBlock.choiceType === 'multiInput' ? blockIndex : undefined);
    };

    if (uiBlock.choiceType === 'select') {
      return (
        <div key={`${uiBlock.key}-${blockIndex}`} className="space-y-1.5">
          <Label htmlFor={`cspec-${uiBlock.key}-${blockIndex}`}>{blockLabel}</Label>
          <Select
            name={uiBlock.key}
            value={uiValue}
            onValueChange={handleChange}
            disabled={isDisabled}
          >
            <SelectTrigger id={`cspec-${uiBlock.key}-${blockIndex}`} className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {actualOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {blockDescription && <p className="text-xs text-muted-foreground">{blockDescription}</p>}
          {blockNote && <p className="text-xs text-destructive/80 italic mt-1">{blockNote}</p>}
        </div>
      );
    } else if (uiBlock.choiceType === 'combobox') {
      const inputPlaceholderText = uiBlock.inputPlaceholder ? getLocalizedString(uiBlock.inputPlaceholder, currentLang) : (uiBlock.inputPlaceholderKey ? UI_STRINGS[uiBlock.inputPlaceholderKey] : undefined);
      return (
        <div key={`${uiBlock.key}-${blockIndex}`} className="space-y-1.5">
          <Label htmlFor={`cspec-${uiBlock.key}-${blockIndex}`}>{blockLabel}</Label>
          <ComboboxPrimitive
            options={actualOptions}
            value={uiValue}
            onChange={handleChange}
            placeholder={inputPlaceholderText}
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
                value={currentBlockValue}
                onChange={(e) => handleClassSpecificChoiceChange(uiBlock.key, e.target.value, uiBlock.choiceType === 'multiInput' ? blockIndex : undefined)}
                placeholder={inputPlaceholderText}
                disabled={isDisabled}
            />
            {blockDescription && <p className="text-xs text-muted-foreground">{blockDescription}</p>}
            {blockNote && <p className="text-xs text-destructive/80 italic mt-1">{blockNote}</p>}
         </div>
      );
    }
    return <div key={`${uiBlock.key}-error-${blockIndex}`} className="text-destructive">Unsupported choiceType: {uiBlock.choiceType} for {uiBlock.key}</div>;
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
                          {parseAndRenderUIString(UI_STRINGS.abilityScoreRaceModBadgeFormat, {abilityAbbr: effect.ability.substring(0,3).toUpperCase(), change: changeValue})}
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
                    value={localAlignment === "" ? UI_EMPTY_SELECTION_VALUE : localAlignment}
                    onValueChange={(value) => setLocalAlignment(value === UI_EMPTY_SELECTION_VALUE ? "" : value as CharacterAlignment)}
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
                    <Select 
                      value={localDeity === "" ? UI_EMPTY_SELECTION_VALUE : localDeity} 
                      onValueChange={(value) => setLocalDeity(value === UI_EMPTY_SELECTION_VALUE ? "" : value)} 
                      disabled={panelIsLocked} 
                    >
                      <SelectTrigger id="deity"> <SelectValue /> </SelectTrigger>
                      <SelectContent> 
                        {deitySelectOptions.map(opt => ( 
                          <SelectItem key={opt.value === "" ? UI_EMPTY_SELECTION_VALUE : opt.value} value={opt.value === "" ? UI_EMPTY_SELECTION_VALUE : opt.value}>
                            {opt.label}
                          </SelectItem> 
                        ))} 
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-10 w-10" onClick={onOpenDeityInfoDialog} disabled={!localDeity || localDeity.trim() === '' || panelIsLocked} >
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
                        {parseAndRenderUIString(UI_STRINGS.abilityScoreRaceModBadgeFormat, {abilityAbbr: effect.ability.substring(0,3).toUpperCase(), change: changeValue})}
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
                value={localGender === "" ? UI_EMPTY_SELECTION_VALUE : localGender}
                onValueChange={(value) => setLocalGender(value === UI_EMPTY_SELECTION_VALUE ? "" : value as GenderId)}
                disabled={panelIsLocked}
              >
                <SelectTrigger id="gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {genderSelectOptions.map(g => (
                    <SelectItem key={g.id === "" ? UI_EMPTY_SELECTION_VALUE : g.id} value={g.id === "" ? UI_EMPTY_SELECTION_VALUE : g.id}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sizeCategory">{UI_STRINGS.sizeLabel}</Label>
              <Select 
                name="sizeCategory" 
                value={localSize === "" ? UI_EMPTY_SELECTION_VALUE : localSize} 
                onValueChange={(value) => setLocalSize(value === UI_EMPTY_SELECTION_VALUE ? "" : value as CharacterSize)} 
                disabled={panelIsLocked}
              >
                <SelectTrigger id="sizeCategory"><SelectValue /></SelectTrigger>
                <SelectContent> 
                  {SIZES.map(s => <SelectItem key={s.id === "" ? UI_EMPTY_SELECTION_VALUE : s.id} value={s.id === "" ? UI_EMPTY_SELECTION_VALUE : s.id}>{s.label}</SelectItem>)} 
                </SelectContent>
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

