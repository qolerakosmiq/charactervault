
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
  CharacterClassSpecificChoice,
  InfoDialogContentType
} from '@/types/character-core';
import { isAlignmentCompatibleWithDeity, isAlignmentValidForRequirement } from '@/types/character';
import { getLocalizedString, type ProcessedSiteData } from '@/i18n/i18n-data';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollText, Info, Heart, Activity, ListChecks, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, parseAndRenderUIString } from '@/lib/utils';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/context/I18nProvider';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { Separator } from '@/components/ui/separator';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { DEFAULT_LANGUAGE } from '@/i18n/config';
import { DualBadge } from '@/components/ui/DualBadge';
import { Card } from '@/components/ui/card';

const DEBOUNCE_DELAY = 400;

const generateRandomAlphanumericString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
const UI_EMPTY_SELECTION_VALUE = generateRandomAlphanumericString(50);


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
  onOpenClassSpecificChoiceInfoDialog: (contentType: InfoDialogContentType) => void;
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
  onOpenClassSpecificChoiceInfoDialog,
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
    characterData.classes[0]?.className || '',
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

  const { UI_STRINGS, ALIGNMENTS, DND_RACES, DND_CLASSES, DND_DEITIES, SIZES, GENDERS, DND_DOMAINS, DND_MAGIC_SCHOOLS, DND_CREATURE_TYPES, PREFERRED_DEFAULT_ALIGNMENT_IDS } = translations || {};

  const selectedClassInfo = React.useMemo(() => DND_CLASSES?.find(c => c.id === localClassName), [DND_CLASSES, localClassName]);
  const selectedRaceInfo = React.useMemo(() => DND_RACES?.find(r => r.id === localRace), [DND_RACES, localRace]);


  const availableAlignments = React.useMemo(() => {
    if (!ALIGNMENTS || !selectedClassInfo) return [];
    const classRestriction = selectedClassInfo.alignmentRestriction;
    if (!classRestriction || classRestriction === 'any') return ALIGNMENTS;
    return ALIGNMENTS.filter(align => isAlignmentValidForRequirement(align.id as CharacterAlignment, classRestriction));
  }, [ALIGNMENTS, selectedClassInfo]);

  const deitySelectOptions = React.useMemo(() => {
    if (!DND_DEITIES || !UI_STRINGS) return [{ value: UI_EMPTY_SELECTION_VALUE, label: "Loading..." }];
    let filteredDeities = DND_DEITIES.filter(deity => isAlignmentCompatibleWithDeity(localAlignment, deity.alignment));
    if (selectedClassInfo?.deityAlignmentRestriction) {
      filteredDeities = filteredDeities.filter(deity => isAlignmentValidForRequirement(deity.alignment, selectedClassInfo.deityAlignmentRestriction!));
    }
    const options: ComboboxOption[] = filteredDeities.map(deity => ({value: deity.id, label: deity.label}));
    options.unshift({value: UI_EMPTY_SELECTION_VALUE, label: UI_STRINGS.deityNoneOption});
    return options;
  }, [DND_DEITIES, localAlignment, selectedClassInfo, UI_STRINGS]);

  const genderSelectOptions = React.useMemo(() => {
    if (!GENDERS || !UI_STRINGS) return [];
    const options: ComboboxOption[] = [];
    const unspecifiedOption = GENDERS.find(g => g.id === 'unspecified') || { id: 'unspecified' as GenderId, label: 'Unspecified' };
    options.push({ value: unspecifiedOption.id, label: unspecifiedOption.label });

    const raceSpecificGenders = selectedRaceInfo?.genderOptions;
    if (raceSpecificGenders && raceSpecificGenders.length > 0) {
      options.push(...raceSpecificGenders.map(go => ({value: go.id as GenderId, label: go.label})));
    } else {
      const maleOption = GENDERS.find(g => g.id === 'male') || { id: 'male' as GenderId, label: 'Male' };
      const femaleOption = GENDERS.find(g => g.id === 'female') || { id: 'female' as GenderId, label: 'Female' };
      options.push({value: maleOption.id, label: maleOption.label});
      options.push({value: femaleOption.id, label: femaleOption.label});
    }
    const otherOption = GENDERS.find(g => g.id === 'other') || { id: 'other' as GenderId, label: 'Other' };
    if (!options.find(opt => opt.value === 'other')) {
      options.push({value: otherOption.id, label: otherOption.label});
    }
    
    const uniqueOptionsMap = new Map<string, ComboboxOption>();
    options.forEach(opt => {
      if (!uniqueOptionsMap.has(opt.value)) {
        uniqueOptionsMap.set(opt.value, opt);
      }
    });
    return Array.from(uniqueOptionsMap.values());
  }, [GENDERS, selectedRaceInfo, UI_STRINGS]);


  const getCurrentValue = React.useCallback((key: string, index?: number): string => {
      const choice = (characterData.classSpecificChoices || []).find(
        c => c.featureKey === key && (index === undefined || c.slotIndex === index)
      );
      return choice?.value ?? "";
  }, [characterData.classSpecificChoices]);

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
        if (!choiceExists) updatedChoices = updatedChoices.filter(c => !(c.featureKey === featureKey && c.slotIndex === slotIndex && c.value === ""));
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
         if (!choiceExists) updatedChoices = updatedChoices.filter(c => !(c.featureKey === featureKey && c.slotIndex === undefined && c.value === ""));
      }
    }
    updatedChoices = updatedChoices.filter(c => {
      if (c.value !== "") return true;
      const originalChoice = (characterData.classSpecificChoices || []).find(ec => ec.featureKey === c.featureKey && ec.slotIndex === c.slotIndex);
      const uiBlockDef = selectedClassInfo?.uiSections?.find(uib => uib.key === c.featureKey);
      return (originalChoice && originalChoice.value !== "") || (uiBlockDef && uiBlockDef.defaultValue === "");
    });
    onFieldChange('classSpecificChoices', updatedChoices);
  }, [characterData.classSpecificChoices, onFieldChange, selectedClassInfo?.uiSections]);

  const handleOpenClassSpecificChoiceInfoDialogInternal = React.useCallback((uiBlock: ClassSpecificUIBlock) => {
    if (!onOpenClassSpecificChoiceInfoDialog || !translations || !DND_DOMAINS || !DND_MAGIC_SCHOOLS || !UI_STRINGS || !DND_CREATURE_TYPES) return;

    const blockLabelForDialog = uiBlock.label || uiBlock.key;
    let introductoryContentForDialog = uiBlock.infoDialogContent; // Explicit dialog-only intro
    if (!introductoryContentForDialog && uiBlock.description) { // Fallback to form description if no explicit dialog intro
      introductoryContentForDialog = uiBlock.description;
    }

    let optionsForDialog: Array<{ id: string; label: string; description?: string; }> = [];
    if (uiBlock.optionsSource) {
      if (uiBlock.optionsSource === 'domains') {
        optionsForDialog = DND_DOMAINS.map(d => ({ id: d.id, label: d.label, description: d.description }));
      } else if (uiBlock.optionsSource === 'magicSchools') {
        optionsForDialog = DND_MAGIC_SCHOOLS.map(s => ({ id: s.id, label: s.label, description: s.description }));
      } else if (uiBlock.optionsSource === 'creatureTypes' && DND_CREATURE_TYPES) {
        optionsForDialog = DND_CREATURE_TYPES.map(ct => ({ id: ct.id, label: ct.label,  description: ct.description  }));
      } else if (uiBlock.optionsSource === 'customList' && uiBlock.customOptions) {
        optionsForDialog = uiBlock.customOptions.map(opt => ({ id: opt.value, label: opt.label, description: opt.description }));
      }
      optionsForDialog.sort((a,b) => a.label.localeCompare(b.label));
    }
    
    if (uiBlock.optionsSource && optionsForDialog.length > 0) {
        onOpenClassSpecificChoiceInfoDialog({ 
            type: 'classSpecificChoiceOptions', 
            title: uiBlock.infoDialogTitle || blockLabelForDialog, 
            options: optionsForDialog,
            introductoryContentHtml: introductoryContentForDialog 
        });
    } else if (introductoryContentForDialog) { // If no options, but there is intro content (which might have been the form description)
        onOpenClassSpecificChoiceInfoDialog({
            type: 'genericHtml',
            title: uiBlock.infoDialogTitle || blockLabelForDialog,
            content: introductoryContentForDialog
        });
    }
  }, [onOpenClassSpecificChoiceInfoDialog, translations, DND_DOMAINS, DND_MAGIC_SCHOOLS, UI_STRINGS, DND_CREATURE_TYPES]);


  React.useEffect(() => {
    if (!selectedClassInfo?.uiSections || !translations || !UI_STRINGS || !DND_DOMAINS || !DND_MAGIC_SCHOOLS || !DND_CREATURE_TYPES) return;
    let choicesToUpdate: CharacterClassSpecificChoice[] = [...(characterData.classSpecificChoices || [])];
    let changed = false;

    selectedClassInfo.uiSections.forEach(uiBlock => {
      if (uiBlock.isHeadingOnly) return;
      const numSlots = uiBlock.choiceType === 'multiInput' && uiBlock.maxSelections ? uiBlock.maxSelections : 1;
      for (let i = 0; i < numSlots; i++) {
        const slotIndex = uiBlock.choiceType === 'multiInput' ? i : undefined;
        const existingChoice = choicesToUpdate.find(c => c.featureKey === uiBlock.key && c.slotIndex === slotIndex);
        if (!existingChoice) {
          let valueToSet: string | undefined = uiBlock.defaultValue;
          if (valueToSet === undefined) {
            if (uiBlock.allowEmptySelection) {
              valueToSet = "";
            } else {
              let tempOptions: ComboboxOption[] = [];
              if (uiBlock.optionsSource === 'domains') tempOptions = DND_DOMAINS.map(d => ({ value: d.id, label: d.label }));
              else if (uiBlock.optionsSource === 'magicSchools') tempOptions = DND_MAGIC_SCHOOLS.map(s => ({ value: s.id, label: s.label }));
              else if (uiBlock.optionsSource === 'creatureTypes') tempOptions = DND_CREATURE_TYPES.map(ct => ({ value: ct.id, label: ct.label }));
              else if (uiBlock.optionsSource === 'customList' && uiBlock.customOptions) tempOptions = uiBlock.customOptions.map(opt => ({ value: opt.value, label: opt.label }));

              const actualSelectableOptions = tempOptions.filter(opt => opt.value !== UI_EMPTY_SELECTION_VALUE && opt.value !== "");
              if (actualSelectableOptions.length > 0) valueToSet = actualSelectableOptions[0].value;
            }
          }
          if (valueToSet !== undefined) {
            if (valueToSet !== "" || (valueToSet === "" && uiBlock.defaultValue === "")) {
                choicesToUpdate.push({ featureKey: uiBlock.key, value: valueToSet, slotIndex });
                changed = true;
            }
          }
        }
      }
    });
    if (changed) onFieldChange('classSpecificChoices', choicesToUpdate);
  }, [selectedClassInfo?.id, selectedClassInfo?.uiSections, translations, UI_STRINGS, DND_DOMAINS, DND_MAGIC_SCHOOLS, DND_CREATURE_TYPES, onFieldChange, characterData.classSpecificChoices]);

  React.useEffect(() => {
    if (!selectedClassInfo || !PREFERRED_DEFAULT_ALIGNMENT_IDS || !ALIGNMENTS) return;
    const currentAlignmentIsValidForNewClass = availableAlignments.some(a => a.id === localAlignment);
    if (!currentAlignmentIsValidForNewClass) {
        let newAlignmentToSet: CharacterAlignment | undefined = undefined;
        for (const preferred of PREFERRED_DEFAULT_ALIGNMENT_IDS) {
            if (availableAlignments.some(a => a.id === preferred)) {
                newAlignmentToSet = preferred;
                break;
            }
        }
        if (!newAlignmentToSet && availableAlignments.length > 0) newAlignmentToSet = availableAlignments[0].id as CharacterAlignment;
        if (!newAlignmentToSet && PREFERRED_DEFAULT_ALIGNMENT_IDS.length > 0) newAlignmentToSet = PREFERRED_DEFAULT_ALIGNMENT_IDS[0];
        if (!newAlignmentToSet && ALIGNMENTS.length > 0) {
            const trueNeutralFallback = ALIGNMENTS.find(a => a.id === 'true-neutral')?.id as CharacterAlignment | undefined;
            newAlignmentToSet = trueNeutralFallback || ALIGNMENTS[0].id as CharacterAlignment;
        }
        if (newAlignmentToSet && newAlignmentToSet !== localAlignment) setLocalAlignment(newAlignmentToSet);
    }
  }, [localClassName, availableAlignments, localAlignment, selectedClassInfo, PREFERRED_DEFAULT_ALIGNMENT_IDS, ALIGNMENTS, setLocalAlignment]);

  React.useEffect(() => {
    if (localDeity === "" || !DND_DEITIES) return;
    const currentDeityInfo = DND_DEITIES.find(d => d.id === localDeity);
    if (!currentDeityInfo) return;
    let deityIsValid = true;
    if (!isAlignmentCompatibleWithDeity(localAlignment, currentDeityInfo.alignment)) deityIsValid = false;
    if (deityIsValid && selectedClassInfo?.deityAlignmentRestriction) {
      if (!isAlignmentValidForRequirement(currentDeityInfo.alignment, selectedClassInfo.deityAlignmentRestriction)) deityIsValid = false;
    }
    if (!deityIsValid) setLocalDeity("");
  }, [localAlignment, localClassName, localDeity, DND_DEITIES, selectedClassInfo, setLocalDeity]);

  React.useEffect(() => {
    if (!selectedClassInfo?.uiSections || !characterData.classSpecificChoices || !translations || !DND_DOMAINS || !DND_MAGIC_SCHOOLS || !DND_CREATURE_TYPES) return;
    let choicesChanged = false;
    const newChoices = [...characterData.classSpecificChoices];
    selectedClassInfo.uiSections.forEach(uiBlock => {
      if (uiBlock.isHeadingOnly) return;
      const numSlots = uiBlock.choiceType === 'multiInput' && uiBlock.maxSelections ? uiBlock.maxSelections : 1;
      for (let i = 0; i < numSlots; i++) {
        const slotIndex = uiBlock.choiceType === 'multiInput' ? i : undefined;
        const currentChoiceForSlot = newChoices.find(c => c.featureKey === uiBlock.key && c.slotIndex === slotIndex);
        const currentValue = currentChoiceForSlot?.value;
        if (currentValue !== undefined && currentValue !== "") {
          let isInvalid = false;
          if (uiBlock.excludeSpecificValues?.includes(currentValue)) isInvalid = true;
          if (!isInvalid && uiBlock.excludeOptionsFromKeys) {
            isInvalid = uiBlock.excludeOptionsFromKeys.some(excludedKey => {
              const valOfExcludedKey = getCurrentValue(excludedKey);
              return valOfExcludedKey === currentValue && valOfExcludedKey !== "" && valOfExcludedKey !== UI_EMPTY_SELECTION_VALUE;
            });
          }
          if (isInvalid) {
            let resetValue = "";
            if (!uiBlock.allowEmptySelection) {
              resetValue = uiBlock.defaultValue || "";
              if (resetValue === "") {
                let tempOptions: ComboboxOption[] = [];
                if (uiBlock.optionsSource === 'domains') tempOptions = DND_DOMAINS.map(d => ({ value: d.id, label: d.label }));
                else if (uiBlock.optionsSource === 'magicSchools') tempOptions = DND_MAGIC_SCHOOLS.map(s => ({ value: s.id, label: s.label }));
                else if (uiBlock.optionsSource === 'creatureTypes') tempOptions = DND_CREATURE_TYPES.map(ct => ({ value: ct.id, label: ct.label }));
                else if (uiBlock.optionsSource === 'customList' && uiBlock.customOptions) tempOptions = uiBlock.customOptions.map(opt => ({ value: opt.value, label: opt.label }));
                const actualSelectableOptions = tempOptions.filter(opt =>
                    opt.value !== UI_EMPTY_SELECTION_VALUE && opt.value !== "" &&
                    !(uiBlock.excludeSpecificValues?.includes(opt.value)) &&
                    !(uiBlock.excludeOptionsFromKeys?.some(ek => getCurrentValue(ek) === opt.value && getCurrentValue(ek) !== "" && getCurrentValue(ek) !== UI_EMPTY_SELECTION_VALUE))
                );
                if (actualSelectableOptions.length > 0) resetValue = actualSelectableOptions[0].value;
              }
            }
            if (currentChoiceForSlot && currentChoiceForSlot.value !== resetValue) {
                currentChoiceForSlot.value = resetValue;
                choicesChanged = true;
            }
          }
        }
      }
    });
    if (choicesChanged) onFieldChange('classSpecificChoices', newChoices);
  }, [characterData.classSpecificChoices, selectedClassInfo?.uiSections, onFieldChange, getCurrentValue, translations, DND_DOMAINS, DND_MAGIC_SCHOOLS, DND_CREATURE_TYPES]);

  const renderClassSpecificUI = React.useCallback((uiBlock: ClassSpecificUIBlock, panelIsLocked: boolean, blockIndex: number) => {
    if (!translations || !UI_STRINGS || !DND_DOMAINS || !DND_MAGIC_SCHOOLS || !DND_CREATURE_TYPES) return <Skeleton className="h-10 w-full my-2" />;

    const currentCharacterClassLevel = characterData.classes[0]?.level || 0;
    if (uiBlock.requiredLevel && currentCharacterClassLevel < uiBlock.requiredLevel) return null;
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
      const stateValue = getCurrentValue(uiBlock.conditionDependsOnUIStateKey);
      if (uiBlock.conditionDependsOnUIStateValueNotIn && uiBlock.conditionDependsOnUIStateValueNotIn.includes(stateValue || "")) return null;
      if (uiBlock.conditionDependsOnUIStateValueIs && !uiBlock.conditionDependsOnUIStateValueIs.includes(stateValue || "")) return null;
    }

    const blockLabel = uiBlock.label || uiBlock.key;
    const blockNote = uiBlock.note;
    const inputPlaceholderText = uiBlock.inputPlaceholder || UI_STRINGS.selectPlaceholder;
    const emptySelectionLabelText = uiBlock.emptySelectionLabel || UI_STRINGS.deityNoneOption;


    const currentBlockValueForProp = getCurrentValue(uiBlock.key, uiBlock.choiceType === 'multiInput' ? blockIndex : undefined);
    const uiValueForComponent = currentBlockValueForProp === "" ? UI_EMPTY_SELECTION_VALUE : currentBlockValueForProp;
    const handleChange = (val: string) => { handleClassSpecificChoiceChange(uiBlock.key, val === UI_EMPTY_SELECTION_VALUE ? "" : val, uiBlock.choiceType === 'multiInput' ? blockIndex : undefined); };

    let initialOptions: ComboboxOption[] = [];
    if (uiBlock.optionsSource === 'domains') initialOptions = DND_DOMAINS.map(d => ({ value: d.id, label: d.label }));
    else if (uiBlock.optionsSource === 'magicSchools') initialOptions = DND_MAGIC_SCHOOLS.map(s => ({ value: s.id, label: s.label }));
    else if (uiBlock.optionsSource === 'creatureTypes') initialOptions = DND_CREATURE_TYPES.map(ct => ({ value: ct.id, label: ct.label }));
    else if (uiBlock.optionsSource === 'customList' && uiBlock.customOptions) initialOptions = uiBlock.customOptions.map(opt => ({ value: opt.value, label: opt.label }));
    initialOptions.sort((a,b) => a.label.localeCompare(b.label));

    const finalSelectOptions: ComboboxOption[] = [];
    if (uiBlock.allowEmptySelection && emptySelectionLabelText) {
      finalSelectOptions.push({ value: UI_EMPTY_SELECTION_VALUE, label: emptySelectionLabelText, disabled: false });
    }

    initialOptions.forEach(opt => {
      let isDisabled = opt.disabled || false;
      if (uiBlock.excludeSpecificValues?.includes(opt.value)) isDisabled = true;

      if (!isDisabled && uiBlock.excludeOptionsFromKeys) {
        const isExcludedByOtherKey = uiBlock.excludeOptionsFromKeys.some(excludedKey => {
          const valOfExcludedKey = getCurrentValue(excludedKey);
          return valOfExcludedKey === opt.value && opt.value !== "" && valOfExcludedKey !== UI_EMPTY_SELECTION_VALUE;
        });
        if (isExcludedByOtherKey && opt.value !== currentBlockValueForProp) {
          isDisabled = true;
        }
      }
      finalSelectOptions.push({ ...opt, disabled: isDisabled });
    });

    let isDisabledByPanelOrDependency = panelIsLocked;
    if (uiBlock.relatedSlotKeyForDisable && !isDisabledByPanelOrDependency) {
        const relatedChoiceValue = getCurrentValue(uiBlock.relatedSlotKeyForDisable);
        if (!relatedChoiceValue || relatedChoiceValue === "") isDisabledByPanelOrDependency = true;
    }
    if (!isDisabledByPanelOrDependency && uiBlock.disabledIfChoiceValue) {
        const controllingChoiceValue = getCurrentValue(uiBlock.disabledIfChoiceValue.featureKey);
        if (uiBlock.disabledIfChoiceValue.values.includes(controllingChoiceValue)) isDisabledByPanelOrDependency = true;
    }

    const hasInfoContentForDialog = uiBlock.optionsSource || uiBlock.infoDialogContent || uiBlock.description;
    const commonInfoButton = (hasInfoContentForDialog && !!onOpenClassSpecificChoiceInfoDialog) ? (
      <Button
        type="button" variant="ghost" size="icon"
        className="shrink-0 text-muted-foreground hover:text-foreground h-9 w-9"
        onClick={() => handleOpenClassSpecificChoiceInfoDialogInternal(uiBlock)}
        disabled={panelIsLocked && !hasInfoContentForDialog}
        aria-label={(UI_STRINGS.infoDialogClassSpecificChoiceAriaLabel || "Info for {choiceName}").replace("{choiceName}", blockLabel)}
      >
        <Info className="h-5 w-5" />
      </Button>
    ) : null;


    if (uiBlock.isHeadingOnly) {
      return (
        <div key={`${uiBlock.key}-${blockIndex}-heading`} className="mt-1 mb-0">
          <h3 className="text-md font-semibold text-accent">{blockLabel}</h3>
          <Separator className="mt-1" />
        </div>
      );
    }

    if (uiBlock.choiceType === 'select') {
      return (
        <div key={`${uiBlock.key}-${blockIndex}-select`} className="space-y-1.5">
          <Label htmlFor={`cspec-${uiBlock.key}-${blockIndex}`}>{blockLabel}</Label>
          <div className="flex items-center gap-2">
            <Select name={uiBlock.key} value={uiValueForComponent} onValueChange={handleChange} disabled={isDisabledByPanelOrDependency} >
              <SelectTrigger id={`cspec-${uiBlock.key}-${blockIndex}`} className="flex-grow h-10 text-sm"> <SelectValue/> </SelectTrigger>
              <SelectContent> {finalSelectOptions.map(opt => <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</SelectItem>)} </SelectContent>
            </Select>
            {commonInfoButton}
          </div>
          {blockNote && <p className="text-xs text-destructive/80 italic mt-1">{blockNote}</p>}
        </div>
      );
    } else if (uiBlock.choiceType === 'combobox') { // Should only be used for Ranger Favored Enemy now
      return (
        <div key={`${uiBlock.key}-${blockIndex}-combobox`} className="space-y-1.5">
          <Label htmlFor={`cspec-${uiBlock.key}-${blockIndex}`}>{blockLabel}</Label>
           <div className="flex items-center gap-2">
            <Select
              name={uiBlock.key}
              value={uiValueForComponent}
              onValueChange={handleChange}
              disabled={isDisabledByPanelOrDependency}
            >
              <SelectTrigger id={`cspec-${uiBlock.key}-${blockIndex}`} className="flex-grow h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {finalSelectOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {commonInfoButton}
          </div>
          {blockNote && <p className="text-xs text-destructive/80 italic mt-1">{blockNote}</p>}
        </div>
      );
    } else if (uiBlock.choiceType === 'multiInput' && uiBlock.maxSelections && uiBlock.maxSelections > 0) {
      const numInputsToRender = uiBlock.maxSelections;
      const slotLabelTemplate = uiBlock.slotLabel || `${uiBlock.key} Slot {slotNum}`;
      return (
        <div key={`${uiBlock.key}-group-${blockIndex}`} className="space-y-3 p-3 border rounded-md bg-background/50">
          <Label className="flex items-center text-md font-medium">{blockLabel} <Badge variant="outline" className="ml-2">{numInputsToRender}</Badge></Label>
          {Array.from({ length: numInputsToRender }).map((_, index) => (
            <div key={`${uiBlock.key}-slot-${index}`} className="space-y-1">
              <Label htmlFor={`${uiBlock.key}-input-${index}`} className="text-xs"> {parseAndRenderUIString(slotLabelTemplate, { slotNum: index + 1 })} </Label>
              <Input id={`${uiBlock.key}-input-${index}`} value={getCurrentValue(uiBlock.key, index)} onChange={(e) => handleClassSpecificChoiceChange(uiBlock.key, e.target.value, index)} placeholder={inputPlaceholderText} className="h-10 text-sm" disabled={isDisabledByPanelOrDependency} />
            </div>
          ))}
          {blockNote && <p className="text-xs text-destructive/80 italic mt-1">{blockNote}</p>}
        </div>
      );
    } else if (uiBlock.choiceType === 'textInput') {
      return (
         <div key={`${uiBlock.key}-${blockIndex}-textInput`} className="space-y-1.5">
            <Label htmlFor={`cspec-${uiBlock.key}-${blockIndex}`}>{blockLabel}</Label>
            <Input id={`cspec-${uiBlock.key}-${blockIndex}`} value={currentBlockValueForProp} onChange={(e) => handleClassSpecificChoiceChange(uiBlock.key, e.target.value, uiBlock.choiceType === 'multiInput' ? blockIndex : undefined)} placeholder={inputPlaceholderText} disabled={isDisabledByPanelOrDependency} className="h-10 text-sm"/>
            {blockNote && <p className="text-xs text-destructive/80 italic mt-1">{blockNote}</p>}
         </div>
      );
    }
    return <div key={`${uiBlock.key}-error-${blockIndex}`} className="text-destructive">Unsupported choiceType: {uiBlock.choiceType} for {uiBlock.key}</div>;
  }, [
    characterData.classSpecificChoices, characterData.classes,
    aggregatedFeatEffects,
    translations,
    DND_DOMAINS, DND_MAGIC_SCHOOLS, DND_CREATURE_TYPES, UI_STRINGS,
    handleClassSpecificChoiceChange,
    handleOpenClassSpecificChoiceInfoDialogInternal,
    onOpenClassSpecificChoiceInfoDialog,
    getCurrentValue,
  ]);


  if (translationsLoading || !translations || !UI_STRINGS || !DND_RACES || !DND_CLASSES || !ALIGNMENTS || !DND_DEITIES || !SIZES || !GENDERS || !DND_DOMAINS || !DND_MAGIC_SCHOOLS || !DND_CREATURE_TYPES) {
    return (
      <LockablePanelWrapper
        title={translations?.UI_STRINGS.coreAttributesTitle || "Core Attributes"}
        description={translations?.UI_STRINGS.coreAttributesDescription || "Define the fundamental aspects of your adventurer."}
        icon={ScrollText}
        cardContentClassName="space-y-6 pt-6"
        initialLockedState={false}
      >
        {() => (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">{translations?.UI_STRINGS.loadingText || "Loading..."}</p>
          </div>
        )}
      </LockablePanelWrapper>
    );
  }


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
              <Input id="name" name="name" value={localName} onChange={(e) => setLocalName(e.target.value)} disabled={panelIsLocked} className="h-10 text-sm"/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="playerName">{UI_STRINGS.playerNameLabel}</Label>
              <Input id="playerName" name="playerName" value={localPlayerName} onChange={(e) => setLocalPlayerName(e.target.value)} disabled={panelIsLocked} className="h-10 text-sm"/>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-1.5">
              <Label htmlFor="race">{UI_STRINGS.raceLabel}</Label>
              <div className="flex items-center gap-2">
                <Select value={localRace} onValueChange={(value) => setLocalRace(value as DndRaceId)} disabled={panelIsLocked} >
                  <SelectTrigger id="race" className="flex-grow h-10 text-sm"> <SelectValue /> </SelectTrigger>
                  <SelectContent> {DND_RACES.map(race => <SelectItem key={race.id} value={race.id}>{race.label}</SelectItem>)} </SelectContent>
                </Select>
                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-9 w-9" onClick={onOpenRaceInfoDialog} disabled={panelIsLocked && !localRace}> <Info className="h-5 w-5" /> </Button>
              </div>
              {!panelIsLocked && selectedRaceInfo && raceSpecialQualities?.abilityEffects && raceSpecialQualities.abilityEffects.length > 0 && (
                 <div className="flex flex-wrap items-baseline gap-1 pt-[6px] justify-center md:justify-start">
                  {raceSpecialQualities.abilityEffects.map((effect) => {
                    const change = effect.change;
                    let leftBorderColorClass = "border-border";
                    let rightBgClass = "bg-muted";
                    let rightTextClass = "text-muted-foreground";
                    let rightBorderColorClass = "border-border";

                    if (change > 0) {
                      leftBorderColorClass = "border-emerald-600";
                      rightBgClass = "bg-emerald-600";
                      rightTextClass = "text-emerald-50";
                      rightBorderColorClass = "border-emerald-600";
                    } else if (change < 0) {
                      leftBorderColorClass = "border-destructive";
                      rightBgClass = "bg-destructive";
                      rightTextClass = "text-destructive-foreground";
                      rightBorderColorClass = "border-destructive";
                    }

                    return (
                       <DualBadge
                        key={effect.ability}
                        leftLabel={effect.ability.substring(0, 3).toUpperCase()}
                        rightLabel={change > 0 ? `+${change}` : String(change)}
                        leftClassName={cn("bg-transparent text-foreground border-2 rounded-l-full border-r-0", leftBorderColorClass)}
                        rightClassName={cn("border-2 rounded-r-full -ml-[2px]", rightBgClass, rightTextClass, rightBorderColorClass)}
                        className="mr-1 mb-1"
                      />
                    );
                  })}
                </div>
              )}
            </div>
             <div className="space-y-1.5">
              <Label htmlFor="className">{UI_STRINGS.classLabel}</Label>
              <div className="flex items-center gap-2">
                <Select value={localClassName} onValueChange={(value) => setLocalClassName(value as DndClassId)} disabled={panelIsLocked} >
                  <SelectTrigger id="className" className="flex-grow h-10 text-sm"> <SelectValue /> </SelectTrigger>
                  <SelectContent> {DND_CLASSES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)} </SelectContent>
                </Select>
                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-9 w-9" onClick={onOpenClassInfoDialog} disabled={panelIsLocked && !localClassName} > <Info className="h-5 w-5" /> </Button>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-[6px] justify-center md:justify-start">
                {!panelIsLocked && selectedClassInfo?.hitDice && (
                  <DualBadge
                    leftLabel={UI_STRINGS.hitDiceBadgeLabel}
                    rightLabel={selectedClassInfo.hitDice}
                    leftClassName="bg-transparent text-foreground border-2 border-primary/60 border-r-0"
                    rightClassName="bg-primary text-primary-foreground border-2 border-primary"
                    className="mr-1 mb-1"
                  />
                )}
                {!panelIsLocked && aggregatedFeatEffects?.grantedAbilities && aggregatedFeatEffects.grantedAbilities.map(ability => {
                   const abilityNameForDisplay = ability.name;
                   if (ability.uses && typeof ability.uses.value === 'number' && ability.uses.per) {
                    const localizedPeriod = (ability.uses.per === 'day' ? (UI_STRINGS.periodDay) : ability.uses.per === 'encounter' ? (UI_STRINGS.periodEncounter) : ability.uses.per === 'week' ? (UI_STRINGS.periodWeek) : ability.uses.per);
                    const usesValue = ability.uses.value;
                    return (
                      <DualBadge
                        key={ability.abilityKey}
                        leftLabel={abilityNameForDisplay}
                        rightLabel={`${usesValue} / ${localizedPeriod}`}
                        leftClassName="bg-transparent text-foreground border-2 border-accent/60 border-r-0"
                        rightClassName="bg-accent text-accent-foreground border-2 border-accent"
                        className="mr-1 mb-1"
                      />
                    );
                  } else if (ability.uses && ability.uses.value === "customPool" && ability.abilityKey === "layOnHandsHealingPool" && aggregatedFeatEffects?.modifiedMechanics?.layOnHandsHealingPool) {
                    const localizedPeriod = UI_STRINGS.periodDay;
                    const poolValue = aggregatedFeatEffects.modifiedMechanics.layOnHandsHealingPool.value;
                    return (
                      <DualBadge
                        key={ability.abilityKey}
                        leftLabel={abilityNameForDisplay}
                        rightLabel={`${typeof poolValue === 'number' ? poolValue : UI_STRINGS.abilityUsesPoolPlaceholder || "Pool"} / ${localizedPeriod}`}
                        leftClassName="bg-transparent text-foreground border-2 border-accent/60 border-r-0"
                        rightClassName="bg-accent text-accent-foreground border-2 border-accent"
                        className="mr-1 mb-1"
                      />
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>

          {selectedClassInfo?.uiSections && selectedClassInfo.uiSections.length > 0 && (
            <Card className="mt-6 p-4 pt-3 bg-background">
              <div className="space-y-4">
                {selectedClassInfo.uiSections.map((uiBlock, index) => (
                  <React.Fragment key={`ui-section-wrapper-${uiBlock.key}-${index}`}>
                    {renderClassSpecificUI(uiBlock, panelIsLocked, index)}
                  </React.Fragment>
                ))}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-1.5">
              <Label htmlFor="alignment">{UI_STRINGS.alignmentLabel}</Label>
              <div className="flex items-center gap-2">
                <Select name="alignment" value={localAlignment === "" ? UI_EMPTY_SELECTION_VALUE : localAlignment} onValueChange={(value) => setLocalAlignment(value === UI_EMPTY_SELECTION_VALUE ? "" : value as CharacterAlignment)} disabled={panelIsLocked} >
                  <SelectTrigger id="alignment" className="flex-grow h-10 text-sm"> <SelectValue /> </SelectTrigger>
                  <SelectContent> {availableAlignments.map(align => ( <SelectItem key={align.id} value={align.id === "" ? UI_EMPTY_SELECTION_VALUE : align.id}>{align.label}</SelectItem> ))} </SelectContent>
                </Select>
                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-9 w-9" onClick={onOpenAlignmentInfoDialog} disabled={panelIsLocked && !localAlignment}> <Info className="h-5 w-5" /> </Button>
              </div>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="deity">{UI_STRINGS.deityLabel}</Label>
                <div className="flex items-center gap-2">
                  <Select
                    name="deity"
                    value={localDeity === "" ? UI_EMPTY_SELECTION_VALUE : localDeity}
                    onValueChange={(value) => setLocalDeity(value === UI_EMPTY_SELECTION_VALUE ? "" : value)}
                    disabled={panelIsLocked || (selectedClassInfo?.deityAlignmentRestriction && deitySelectOptions.length <= 1)}
                  >
                    <SelectTrigger id="deity" className="flex-grow h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {deitySelectOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground h-9 w-9" onClick={onOpenDeityInfoDialog} disabled={(panelIsLocked && (!localDeity || localDeity.trim() === '')) || (!localDeity || localDeity.trim() === '')} > <Info className="h-5 w-5" /> </Button>
                </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="space-y-1.5">
              <Label htmlFor="age" className="inline-block w-full text-center md:text-center">{UI_STRINGS.ageLabel}</Label>
              <NumberSpinnerInput id="age" value={localAge} onChange={setLocalAge} min={currentMinAgeForInput} max={1000} inputClassName="w-full h-10 text-sm text-center" buttonClassName="h-10 w-10" buttonSize="icon" className="justify-center" disabled={panelIsLocked} />
              {!panelIsLocked && ageEffectsDetails && (ageEffectsDetails.categoryName !== (UI_STRINGS.ageCategoryAdult) || ageEffectsDetails.effects.length > 0) && (
                 <div className="flex flex-wrap items-baseline justify-center gap-1 pt-[6px]">
                  <DualBadge
                    leftLabel={UI_STRINGS.ageCategoryBadgeLabel}
                    rightLabel={ageEffectsDetails.categoryName}
                    leftClassName="bg-transparent text-foreground border-2 border-secondary/60 border-r-0"
                    rightClassName="bg-secondary text-secondary-foreground border-2 border-secondary"
                    className="mr-1 mb-1"
                  />
                  {ageEffectsDetails.effects.map((effect) => {
                    const change = effect.change;
                    let leftBorderColorClass = "border-border";
                    let rightBgClass = "bg-muted";
                    let rightTextClass = "text-muted-foreground";
                    let rightBorderColorClass = "border-border";

                    if (change > 0) {
                      leftBorderColorClass = "border-emerald-600";
                      rightBgClass = "bg-emerald-600";
                      rightTextClass = "text-emerald-50";
                      rightBorderColorClass = "border-emerald-600";
                    } else if (change < 0) {
                      leftBorderColorClass = "border-destructive";
                      rightBgClass = "bg-destructive";
                      rightTextClass = "text-destructive-foreground";
                      rightBorderColorClass = "border-destructive";
                    }

                    return (
                       <DualBadge
                        key={effect.ability}
                        leftLabel={effect.ability.substring(0, 3).toUpperCase()}
                        rightLabel={change > 0 ? `+${change}` : String(change)}
                        leftClassName={cn("bg-transparent text-foreground border-2 rounded-l-full border-r-0", leftBorderColorClass)}
                        rightClassName={cn("border-2 rounded-r-full -ml-[2px]", rightBgClass, rightTextClass, rightBorderColorClass)}
                        className="mr-1 mb-1"
                      />
                    );
                  })}
                </div>
              )}
              </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender">{UI_STRINGS.genderLabel}</Label>
              <Select name="gender" value={localGender} onValueChange={(value) => setLocalGender(value as GenderId)} disabled={panelIsLocked} >
                <SelectTrigger id="gender" className="h-10 text-sm"> <SelectValue /> </SelectTrigger>
                <SelectContent> {genderSelectOptions.map(g => ( <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem> ))} </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sizeCategory">{UI_STRINGS.sizeLabel}</Label>
              <Select name="sizeCategory" value={localSize === "" ? UI_EMPTY_SELECTION_VALUE : localSize} onValueChange={(value) => setLocalSize(value === UI_EMPTY_SELECTION_VALUE ? "" : value as CharacterSize)} disabled={panelIsLocked} >
                <SelectTrigger id="sizeCategory" className="h-10 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent> {SIZES.map(s => <SelectItem key={s.id === "" ? UI_EMPTY_SELECTION_VALUE : s.id} value={s.id === "" ? UI_EMPTY_SELECTION_VALUE : s.id}>{s.label}</SelectItem>)} </SelectContent>
              </Select>
              {!panelIsLocked && localSize && (() => {
                  const selectedSizeObject = SIZES.find(s => s.id === localSize);
                  if (selectedSizeObject && typeof selectedSizeObject.acModifier === 'number' && selectedSizeObject.acModifier !== 0) {
                    const acMod = selectedSizeObject.acModifier;

                    let leftBorderColorClass = "border-border";
                    let rightBgClass = "bg-muted";
                    let rightTextClass = "text-muted-foreground";
                    let rightBorderColorClass = "border-border";

                    if (acMod > 0) {
                      leftBorderColorClass = "border-emerald-600";
                      rightBgClass = "bg-emerald-600";
                      rightTextClass = "text-emerald-50";
                      rightBorderColorClass = "border-emerald-600";
                    } else if (acMod < 0) {
                      leftBorderColorClass = "border-destructive";
                      rightBgClass = "bg-destructive";
                      rightTextClass = "text-destructive-foreground";
                      rightBorderColorClass = "border-destructive";
                    }

                    return (
                      <div className="flex items-baseline justify-center md:justify-start gap-1 pt-[6px]">
                        <DualBadge
                          leftLabel={UI_STRINGS.sizeAcModLeftBadgeLabel}
                          rightLabel={acMod > 0 ? `+${acMod}` : String(acMod)}
                          leftClassName={cn("bg-transparent text-foreground border-2 rounded-l-full border-r-0", leftBorderColorClass)}
                          rightClassName={cn("border-2 rounded-r-full -ml-[2px]", rightBgClass, rightTextClass, rightBorderColorClass)}
                          className="mr-1 mb-1"
                        />
                      </div>
                    );
                  } return null;
                })()}
            </div>
          </div>
        </>
      )}
    </LockablePanelWrapper>
  );
};
CharacterFormCoreInfoSectionComponent.displayName = 'CharacterFormCoreInfoSectionComponent';
export const CharacterFormCoreInfoSection = React.memo(CharacterFormCoreInfoSectionComponent);
