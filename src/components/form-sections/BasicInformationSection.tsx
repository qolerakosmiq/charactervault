
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
import type { DualBadgeProps } from '@/components/ui/DualBadge';
import { isAlignmentCompatibleWithDeity, isAlignmentValidForRequirement } from '@/types/character';
import { getLocalizedString, type ProcessedSiteData } from '@/i18n/i18n-data';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollText, Info, Heart, Activity, ListChecks, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, parseAndRenderUIString, generateRandomAlphanumericString } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/context/I18nProvider';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { DEFAULT_LANGUAGE } from '@/i18n/config';
import { DualBadge } from '@/components/ui/DualBadge';
import { panelGridGap, panelContentPadding, panelFieldHorizontalGap, panelFieldVerticalGap, panelBadgeGroupGap } from '@/config/layout';

const DEBOUNCE_DELAY = 400;

const UI_EMPTY_SELECTION_VALUE = generateRandomAlphanumericString(50);


interface ClassSpecificFieldProps {
  uiBlock: ClassSpecificUIBlock;
  isVisuallyDisabled: boolean;
  onValueChange: (newValue: string) => void;
  onOpenInfoDialog: () => void;
  allChoices: CharacterClassSpecificChoice[];
  characterLevel: number;
  aggregatedFeatEffects: AggregatedFeatEffects | null;
}

const ClassSpecificFieldComponent: React.FC<ClassSpecificFieldProps> = ({
  uiBlock,
  isVisuallyDisabled,
  onValueChange,
  onOpenInfoDialog,
  allChoices,
  characterLevel,
  aggregatedFeatEffects,
}) => {
  const { translations, isLoading: translationsLoading } = useI18n();

  const isVisible = React.useMemo(() => {
    if (uiBlock.requiredLevel && characterLevel < uiBlock.requiredLevel) return false;
    if (uiBlock.conditionAggregatedEffect && aggregatedFeatEffects) {
      const propValue = aggregatedFeatEffects[uiBlock.conditionAggregatedEffect.property as keyof AggregatedFeatEffects] as any;
      switch (uiBlock.conditionAggregatedEffect.comparison) {
        case 'exists': return propValue !== undefined && propValue !== null && (Array.isArray(propValue) ? propValue.length > 0 : true);
        case 'greaterThan': return typeof propValue === 'number' && propValue > (uiBlock.conditionAggregatedEffect.value as number);
        case 'equals': return propValue === uiBlock.conditionAggregatedEffect.value;
        case 'lessThan': return typeof propValue === 'number' && propValue < (uiBlock.conditionAggregatedEffect.value as number);
        case 'notEquals': return propValue !== uiBlock.conditionAggregatedEffect.value;
        default: return true;
      }
    } else if (uiBlock.conditionDependsOnUIStateKey) {
      const controllingValue = allChoices.find(c => c.featureKey === uiBlock.conditionDependsOnUIStateKey)?.value || "";
      if (uiBlock.conditionDependsOnUIStateValueNotIn) {
        return !uiBlock.conditionDependsOnUIStateValueNotIn.includes(controllingValue);
      }
    }
    return true;
  }, [uiBlock, characterLevel, aggregatedFeatEffects, allChoices]);


  const finalSelectOptions = React.useMemo(() => {
    if (translationsLoading || !translations) return [];

    const { DND_DOMAINS, DND_MAGIC_SCHOOLS, DND_CREATURE_TYPES, UI_STRINGS } = translations;
    const emptySelectionLabelText = uiBlock.emptySelectionLabel ? getLocalizedString(uiBlock.emptySelectionLabel, UI_STRINGS.currentLangCodeForNotesFallback || 'en') : UI_STRINGS.deityNoneOption;

    let initialOptions: ComboboxOption[] = [];
    if (uiBlock.optionsSource === 'domains') initialOptions = DND_DOMAINS.map(d => ({ value: d.id, label: d.label }));
    else if (uiBlock.optionsSource === 'magicSchools') initialOptions = DND_MAGIC_SCHOOLS.map(s => ({ value: s.id, label: s.label }));
    else if (uiBlock.optionsSource === 'creatureTypes') initialOptions = DND_CREATURE_TYPES.map(ct => ({ value: ct.id, label: ct.label }));
    else if (uiBlock.optionsSource === 'customList' && uiBlock.customOptions) initialOptions = uiBlock.customOptions.map(opt => ({ value: opt.value, label: getLocalizedString(opt.label, UI_STRINGS.currentLangCodeForNotesFallback || 'en') }));

    let filteredOptions = [...initialOptions];

    if (uiBlock.excludeOptionsFromKeys) {
        const valuesToExclude = uiBlock.excludeOptionsFromKeys.map(keyToExclude =>
            allChoices.find(c => c.featureKey === keyToExclude)?.value
        ).filter(Boolean) as string[];
        filteredOptions = filteredOptions.filter(opt => !valuesToExclude.includes(opt.value));
    }
    
    if (uiBlock.excludeSpecificValues) {
        filteredOptions = filteredOptions.filter(opt => !uiBlock.excludeSpecificValues!.includes(opt.value));
    }

    filteredOptions.sort((a,b) => a.label.localeCompare(b.label));

    const finalOptions: ComboboxOption[] = [];
    if (uiBlock.allowEmptySelection) {
        finalOptions.push({ value: UI_EMPTY_SELECTION_VALUE, label: emptySelectionLabelText, disabled: false });
    }
    finalOptions.push(...filteredOptions);
    return finalOptions;
  }, [translationsLoading, translations, uiBlock, allChoices]);
  
  if (!isVisible) {
    return null;
  }
  
  if (translationsLoading || !translations) {
    return null;
  }
  
  const { UI_STRINGS } = translations;
  
  const blockLabel = uiBlock.label ? getLocalizedString(uiBlock.label, UI_STRINGS.currentLangCodeForNotesFallback || 'en') : uiBlock.key;
  const blockNote = uiBlock.note ? getLocalizedString(uiBlock.note, UI_STRINGS.currentLangCodeForNotesFallback || 'en') : undefined;
  const inputPlaceholderText = uiBlock.inputPlaceholder ? getLocalizedString(uiBlock.inputPlaceholder, UI_STRINGS.currentLangCodeForNotesFallback || 'en') : UI_STRINGS.selectPlaceholder;

  const getCurrentValue = (key: string): string => {
    const choice = (allChoices || []).find(
      c => c.featureKey === key && c.slotIndex === undefined
    );
    return choice?.value ?? "";
  };

  const currentValue = getCurrentValue(uiBlock.key);
  const uiValueForComponent = currentValue === "" ? UI_EMPTY_SELECTION_VALUE : currentValue;
  const handleChange = (val: string) => { onValueChange(val === UI_EMPTY_SELECTION_VALUE ? "" : val); };

  const hasInfoContentForDialog = uiBlock.optionsSource || uiBlock.infoDialogContent || uiBlock.description;
  const commonInfoButton = (hasInfoContentForDialog && onOpenInfoDialog) ? (
    <Button
      type="button" variant="ghost" size="icon-sm"
      className="shrink-0 text-muted-foreground hover:text-foreground"
      onClick={onOpenInfoDialog}
      disabled={isVisuallyDisabled && !hasInfoContentForDialog}
      aria-label={(UI_STRINGS.infoDialogClassSpecificChoiceAriaLabel || "Info for {choiceName}").replace("{choiceName}", blockLabel)}
    >
      <Info />
    </Button>
  ) : null;


  if (uiBlock.isHeadingOnly) {
    return (
      <div className="md:col-span-2">
        <h3 className="text-lg font-bold text-accent">{blockLabel}</h3>
      </div>
    );
  }

  if (uiBlock.choiceType === 'select' || uiBlock.choiceType === 'combobox') {
    return (
      <div className={panelFieldVerticalGap}>
        <Label htmlFor={`cspec-${uiBlock.key}`} className="whitespace-nowrap">{blockLabel}</Label>
         <div className={cn("flex items-center", panelFieldHorizontalGap)}>
          <div className="flex-grow">
              <Select name={uiBlock.key} value={uiValueForComponent} onValueChange={handleChange} disabled={isVisuallyDisabled} >
                  <SelectTrigger id={`cspec-${uiBlock.key}`}> <SelectValue /> </SelectTrigger>
                  <SelectContent> {finalSelectOptions.map(opt => <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</SelectItem>)} </SelectContent>
              </Select>
          </div>
          {commonInfoButton}
        </div>
        {blockNote && <p className="italic text-xs text-muted-foreground">{blockNote}</p>}
      </div>
    );
  }
  return <div key={`${uiBlock.key}-error`} className="text-destructive">Unsupported choiceType: {uiBlock.choiceType} for {uiBlock.key}</div>;
};

const classSpecificFieldAreEqual = (prevProps: Readonly<ClassSpecificFieldProps>, nextProps: Readonly<ClassSpecificFieldProps>): boolean => {
  // Direct prop checks
  if (prevProps.isVisuallyDisabled !== nextProps.isVisuallyDisabled) return false;
  if (prevProps.uiBlock.key !== nextProps.uiBlock.key) return false;
  if (prevProps.characterLevel !== nextProps.characterLevel) return false;

  // Check if this component's own value has changed
  const currentKey = nextProps.uiBlock.key;
  const prevValue = prevProps.allChoices.find(c => c.featureKey === currentKey)?.value;
  const nextValue = nextProps.allChoices.find(c => c.featureKey === currentKey)?.value;
  if (prevValue !== nextValue) return false;

  // Check if any of the dependencies for this component have changed value
  const dependentKeys = [
    ...(nextProps.uiBlock.excludeOptionsFromKeys || []),
    nextProps.uiBlock.relatedSlotKeyForDisable,
    nextProps.uiBlock.disabledIfChoiceValue?.featureKey,
    nextProps.uiBlock.conditionDependsOnUIStateKey, // Added for visibility dependencies
  ].filter(Boolean) as string[];
  
  if (dependentKeys.length > 0) {
    for (const key of dependentKeys) {
      const prevDepValue = prevProps.allChoices.find(c => c.featureKey === key)?.value;
      const nextDepValue = nextProps.allChoices.find(c => c.featureKey === key)?.value;
      if (prevDepValue !== nextDepValue) {
        return false;
      }
    }
  }

  // Check for aggregatedFeatEffects changes ONLY if the component depends on it
  if (nextProps.uiBlock.conditionAggregatedEffect && prevProps.aggregatedFeatEffects !== nextProps.aggregatedFeatEffects) {
    return false;
  }
  
  return true;
};

const MemoizedClassSpecificField = React.memo(ClassSpecificFieldComponent, classSpecificFieldAreEqual);


export interface BasicInformationSectionProps {
  characterData: Pick<Character, 'name' | 'playerName' | 'race' | 'alignment' | 'deity' | 'size' | 'age' | 'gender' | 'classes'>;
  classSpecificChoices: CharacterClassSpecificChoice[];
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
  characterLevel: number;
}

const BasicInformationSectionComponent = ({
  characterData,
  classSpecificChoices,
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
  characterLevel,
}: BasicInformationSectionProps) => {
  const { translations, isLoading: translationsLoading, language: currentLang } = useI18n();
  const classSpecificChoicesRef = React.useRef(classSpecificChoices);
  React.useEffect(() => {
    classSpecificChoicesRef.current = classSpecificChoices;
  }, [classSpecificChoices]);

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
  
  const handleClassSpecificChoiceChange = React.useCallback((
    featureKey: string,
    newValue: string
  ) => {
    const currentChoices = classSpecificChoicesRef.current;
    let updatedChoices: CharacterClassSpecificChoice[] = [...currentChoices];
    const choiceIndex = updatedChoices.findIndex(c => c.featureKey === featureKey);

    if (choiceIndex > -1) {
      updatedChoices[choiceIndex] = { ...updatedChoices[choiceIndex], value: newValue };
    } else {
      updatedChoices.push({ featureKey, value: newValue });
    }
    
    // Reset dependent choices
    const allUiSections = selectedClassInfo?.uiSections || [];
    const resetChildrenOf = (parentKey: string, choices: CharacterClassSpecificChoice[]) => {
      let newChoices = [...choices];
      allUiSections.forEach(uiBlock => {
        if (
          uiBlock.excludeOptionsFromKeys?.includes(parentKey) ||
          uiBlock.disabledIfChoiceValue?.featureKey === parentKey ||
          uiBlock.relatedSlotKeyForDisable === parentKey
        ) {
          const childIndex = newChoices.findIndex(c => c.featureKey === uiBlock.key);
          if (childIndex > -1 && newChoices[childIndex].value !== "") {
            newChoices[childIndex] = { ...newChoices[childIndex], value: "" };
          }
        }
      });
      return newChoices;
    };
    updatedChoices = resetChildrenOf(featureKey, updatedChoices);
    
    onFieldChange('classSpecificChoices', updatedChoices);
  }, [onFieldChange, selectedClassInfo]);


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


  const handleOpenClassSpecificChoiceInfoDialogInternal = React.useCallback((uiBlock: ClassSpecificUIBlock) => {
    if (!onOpenClassSpecificChoiceInfoDialog || !translations || !DND_DOMAINS || !DND_MAGIC_SCHOOLS || !UI_STRINGS || !DND_CREATURE_TYPES) return;

    const blockLabelForDialog = uiBlock.label ? getLocalizedString(uiBlock.label, UI_STRINGS.currentLangCodeForNotesFallback || 'en') : uiBlock.key;
    let introductoryContentForDialog = uiBlock.infoDialogContent ? getLocalizedString(uiBlock.infoDialogContent, UI_STRINGS.currentLangCodeForNotesFallback || 'en') : undefined; 
    if (!introductoryContentForDialog && uiBlock.description) { 
      introductoryContentForDialog = getLocalizedString(uiBlock.description, UI_STRINGS.currentLangCodeForNotesFallback || 'en');
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
        optionsForDialog = uiBlock.customOptions.map(opt => ({ id: opt.value, label: getLocalizedString(opt.label, UI_STRINGS.currentLangCodeForNotesFallback || 'en'), description: opt.description ? getLocalizedString(opt.description, UI_STRINGS.currentLangCodeForNotesFallback || 'en') : undefined }));
      }
      optionsForDialog.sort((a,b) => a.label.localeCompare(b.label));
    }
    
    if (uiBlock.optionsSource && optionsForDialog.length > 0) {
        onOpenClassSpecificChoiceInfoDialog({ 
            type: 'classSpecificChoiceOptions', 
            title: uiBlock.infoDialogTitle ? getLocalizedString(uiBlock.infoDialogTitle, UI_STRINGS.currentLangCodeForNotesFallback || 'en') : blockLabelForDialog, 
            options: optionsForDialog,
            introductoryContentHtml: introductoryContentForDialog 
        });
    } else if (introductoryContentForDialog) { 
        onOpenClassSpecificChoiceInfoDialog({
            type: 'genericHtml',
            title: uiBlock.infoDialogTitle ? getLocalizedString(uiBlock.infoDialogTitle, UI_STRINGS.currentLangCodeForNotesFallback || 'en') : blockLabelForDialog,
            content: introductoryContentForDialog
        });
    }
  }, [onOpenClassSpecificChoiceInfoDialog, translations, DND_DOMAINS, DND_MAGIC_SCHOOLS, UI_STRINGS, DND_CREATURE_TYPES]);

  React.useEffect(() => {
    if (!selectedClassInfo || !PREFERRED_DEFAULT_ALIGNMENT_IDS || !ALIGNMENTS) return;
    
    // This effect runs only when localClassName changes.
    // It recalculates available alignments and checks if the current one is valid.
    const classRestriction = selectedClassInfo.alignmentRestriction;
    if (!classRestriction || classRestriction === 'any') return; // No change needed if any alignment is allowed
    
    const validAlignmentsForClass = ALIGNMENTS.filter(align => isAlignmentValidForRequirement(align.id as CharacterAlignment, classRestriction));
    const currentAlignmentIsValidForNewClass = validAlignmentsForClass.some(a => a.id === localAlignment);

    if (!currentAlignmentIsValidForNewClass) {
        let newAlignmentToSet: CharacterAlignment | undefined = undefined;
        for (const preferred of PREFERRED_DEFAULT_ALIGNMENT_IDS) {
            if (validAlignmentsForClass.some(a => a.id === preferred)) {
                newAlignmentToSet = preferred;
                break;
            }
        }
        if (!newAlignmentToSet && validAlignmentsForClass.length > 0) newAlignmentToSet = validAlignmentsForClass[0].id as CharacterAlignment;
        if (!newAlignmentToSet && PREFERRED_DEFAULT_ALIGNMENT_IDS.length > 0) newAlignmentToSet = PREFERRED_DEFAULT_ALIGNMENT_IDS[0];
        if (!newAlignmentToSet && ALIGNMENTS.length > 0) {
            const trueNeutralFallback = ALIGNMENTS.find(a => a.id === 'true-neutral')?.id as CharacterAlignment | undefined;
            newAlignmentToSet = trueNeutralFallback || ALIGNMENTS[0].id as CharacterAlignment;
        }
        if (newAlignmentToSet && newAlignmentToSet !== localAlignment) setLocalAlignment(newAlignmentToSet);
    }
  }, [localClassName, setLocalAlignment, ALIGNMENTS, PREFERRED_DEFAULT_ALIGNMENT_IDS]); // Minimal dependencies

  React.useEffect(() => {
    if (localDeity === "" || !DND_DEITIES) return;
    const currentDeityInfo = DND_DEITIES.find(d => d.id === localDeity);
    if (!currentDeityInfo) return;
    const currentClassInfo = DND_CLASSES?.find(c => c.id === localClassName);
    
    let deityIsValid = true;
    if (!isAlignmentCompatibleWithDeity(localAlignment, currentDeityInfo.alignment)) deityIsValid = false;
    if (deityIsValid && currentClassInfo?.deityAlignmentRestriction) {
      if (!isAlignmentValidForRequirement(currentDeityInfo.alignment, currentClassInfo.deityAlignmentRestriction)) deityIsValid = false;
    }
    if (!deityIsValid) setLocalDeity("");
  }, [localAlignment, localClassName, localDeity, setLocalDeity, DND_DEITIES, DND_CLASSES]); // Minimal dependencies
  
  const disabledStates = React.useMemo(() => {
    const states: Record<string, boolean> = {};
    if (!selectedClassInfo?.uiSections) return states;

    selectedClassInfo.uiSections.forEach(uiBlock => {
      let isDisabled = false;
      if (uiBlock.relatedSlotKeyForDisable) {
        const relatedValue = classSpecificChoices.find(c => c.featureKey === uiBlock.relatedSlotKeyForDisable)?.value;
        if (!relatedValue || relatedValue === "") isDisabled = true;
      }
      if (!isDisabled && uiBlock.disabledIfChoiceValue) {
        const controllingValue = classSpecificChoices.find(c => c.featureKey === uiBlock.disabledIfChoiceValue.featureKey)?.value;
        if (controllingValue && uiBlock.disabledIfChoiceValue.values.includes(controllingValue)) isDisabled = true;
      }
      states[uiBlock.key] = isDisabled;
    });
    return states;
  }, [selectedClassInfo, classSpecificChoices]);

  if (translationsLoading || !UI_STRINGS || !DND_RACES || !DND_CLASSES || !ALIGNMENTS || !DND_DEITIES || !SIZES || !GENDERS || !DND_DOMAINS || !DND_MAGIC_SCHOOLS || !DND_CREATURE_TYPES) {
    return null;
  }

  return (
    <LockablePanelWrapper
      title={UI_STRINGS.basicInformationPanelTitle}
      description={UI_STRINGS.basicInformationPanelDescription}
      icon={ScrollText}
      headerClassName="bg-muted/20"
      initialLockedState={false}
    >
      {({ isLocked: panelIsLocked }) => (
        <div className={cn("flex flex-col", panelGridGap)}>
          <div className={cn("grid grid-cols-1 md:grid-cols-2", panelGridGap)}>
            <div className={panelFieldVerticalGap}>
              <Label htmlFor="name" className="whitespace-nowrap">{UI_STRINGS.characterNameLabel}</Label>
              <Input id="name" name="name" value={localName} onChange={(e) => setLocalName(e.target.value)} disabled={panelIsLocked} />
            </div>
            <div className={panelFieldVerticalGap}>
              <Label htmlFor="playerName" className="whitespace-nowrap">{UI_STRINGS.playerNameLabel}</Label>
              <Input id="playerName" name="playerName" value={localPlayerName} onChange={(e) => setLocalPlayerName(e.target.value)} disabled={panelIsLocked} />
            </div>
          </div>

          <div className={cn("grid grid-cols-1 md:grid-cols-2", panelGridGap)}>
            <div className={panelFieldVerticalGap}>
              <Label htmlFor="race" className="whitespace-nowrap">{UI_STRINGS.raceLabel}</Label>
              <div className={cn("flex items-center", panelFieldHorizontalGap)}>
                <div className="flex-grow">
                  <Select value={localRace} onValueChange={(value) => setLocalRace(value as DndRaceId)} disabled={panelIsLocked} >
                    <SelectTrigger id="race"> <SelectValue /> </SelectTrigger>
                    <SelectContent> {DND_RACES.map(race => <SelectItem key={race.id} value={race.id}>{race.label}</SelectItem>)} </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={onOpenRaceInfoDialog} disabled={panelIsLocked && !localRace} className="shrink-0"> <Info /> </Button>
              </div>
              {!panelIsLocked && selectedRaceInfo && raceSpecialQualities?.abilityEffects && raceSpecialQualities.abilityEffects.length > 0 && (
                 <div className={cn("flex flex-wrap", panelBadgeGroupGap)}>
                  {raceSpecialQualities.abilityEffects.map((effect) => (
                       <DualBadge
                        key={effect.ability}
                        leftLabel={effect.ability.substring(0, 3).toUpperCase()}
                        rightLabel={effect.change > 0 ? `+${effect.change}` : String(effect.change)}
                        color={effect.change > 0 ? 'emerald' : 'destructive'}
                      />
                    )
                  )}
                </div>
              )}
            </div>
             <div className={panelFieldVerticalGap}>
              <Label htmlFor="className" className="whitespace-nowrap">{UI_STRINGS.classLabel}</Label>
              <div className={cn("flex items-center", panelFieldHorizontalGap)}>
                <div className="flex-grow">
                  <Select value={localClassName} onValueChange={(value) => setLocalClassName(value as DndClassId)} disabled={panelIsLocked} >
                    <SelectTrigger id="className"> <SelectValue /> </SelectTrigger>
                    <SelectContent> {DND_CLASSES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)} </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={onOpenClassInfoDialog} disabled={panelIsLocked && !localClassName} className="shrink-0"> <Info /> </Button>
              </div>
              <div className={cn("flex flex-wrap", panelBadgeGroupGap)}>
                {!panelIsLocked && selectedClassInfo?.hitDice && (
                  <DualBadge
                    leftLabel={UI_STRINGS.hitDiceBadgeLabel}
                    rightLabel={selectedClassInfo.hitDice}
                    color="primary"
                  />
                )}
                {!panelIsLocked && aggregatedFeatEffects?.grantedAbilities && aggregatedFeatEffects.grantedAbilities.map(ability => {
                   const abilityNameForDisplay = getLocalizedString(ability.name, currentLang);
                   if (ability.uses && typeof ability.uses.value === 'number' && ability.uses.per) {
                    const localizedPeriod = (ability.uses.per === 'day' ? (UI_STRINGS.periodDay) : ability.uses.per === 'encounter' ? (UI_STRINGS.periodEncounter) : ability.uses.per === 'week' ? (UI_STRINGS.periodWeek) : ability.uses.per);
                    const usesValue = ability.uses.value;
                    return (
                      <DualBadge
                        key={ability.abilityKey}
                        leftLabel={abilityNameForDisplay}
                        rightLabel={`${usesValue} / ${localizedPeriod}`}
                        color="accent"
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
                        color="accent"
                      />
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>

          {selectedClassInfo?.uiSections && selectedClassInfo.uiSections.length > 0 && (
            <div className={cn("flex flex-col rounded-md border bg-background/50", panelGridGap, panelContentPadding)}>
              <div className={cn("grid grid-cols-1 md:grid-cols-2", panelGridGap)}>
                {selectedClassInfo.uiSections.map((uiBlock, index) => {
                  const isVisuallyDisabled = panelIsLocked || disabledStates[uiBlock.key];
                  return (
                    <MemoizedClassSpecificField
                      key={`csf-memo-${uiBlock.key}-${index}`}
                      uiBlock={uiBlock}
                      isVisuallyDisabled={isVisuallyDisabled}
                      onValueChange={(newValue) => handleClassSpecificChoiceChange(uiBlock.key, newValue)}
                      onOpenInfoDialog={() => handleOpenClassSpecificChoiceInfoDialogInternal(uiBlock)}
                      allChoices={classSpecificChoices}
                      characterLevel={characterLevel}
                      aggregatedFeatEffects={aggregatedFeatEffects}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <div className={cn("grid grid-cols-1 md:grid-cols-2", panelGridGap)}>
            <div className={panelFieldVerticalGap}>
              <Label htmlFor="alignment" className="whitespace-nowrap">{UI_STRINGS.alignmentLabel}</Label>
              <div className={cn("flex items-center", panelFieldHorizontalGap)}>
                <div className="flex-grow">
                  <Select name="alignment" value={localAlignment === "" ? UI_EMPTY_SELECTION_VALUE : localAlignment} onValueChange={(value) => setLocalAlignment(value === UI_EMPTY_SELECTION_VALUE ? "" : value as CharacterAlignment)} disabled={panelIsLocked} >
                    <SelectTrigger id="alignment"> <SelectValue /> </SelectTrigger>
                    <SelectContent> {availableAlignments.map(align => ( <SelectItem key={align.id} value={align.id === "" ? UI_EMPTY_SELECTION_VALUE : align.id}>{align.label}</SelectItem> ))} </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={onOpenAlignmentInfoDialog} disabled={panelIsLocked && !localAlignment} className="shrink-0"> <Info /> </Button>
              </div>
            </div>
            <div className={panelFieldVerticalGap}>
                <Label htmlFor="deity" className="whitespace-nowrap">{UI_STRINGS.deityLabel}</Label>
                <div className={cn("flex items-center", panelFieldHorizontalGap)}>
                  <div className="flex-grow">
                      <Select
                        name="deity"
                        value={localDeity === "" ? UI_EMPTY_SELECTION_VALUE : localDeity}
                        onValueChange={(value) => setLocalDeity(value === UI_EMPTY_SELECTION_VALUE ? "" : value)}
                        disabled={panelIsLocked || (selectedClassInfo?.deityAlignmentRestriction && deitySelectOptions.length <= 1)}
                      >
                        <SelectTrigger id="deity">
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
                  </div>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={onOpenDeityInfoDialog} disabled={(panelIsLocked && (!localDeity || localDeity.trim() === '')) || (!localDeity || localDeity.trim() === '')} className="shrink-0"> <Info /> </Button>
                </div>
              </div>
          </div>

          <div className={cn("grid grid-cols-1 md:grid-cols-3", panelGridGap)}>
            <div className={panelFieldVerticalGap}>
              <Label htmlFor="age" className="block whitespace-nowrap">{UI_STRINGS.ageLabel}</Label>
              <Input
                id="age"
                type="number"
                value={localAge}
                onChange={(e) => setLocalAge(parseInt(e.target.value, 10) || 0)}
                min={currentMinAgeForInput}
                max={1000}
                disabled={panelIsLocked}
              />
              {!panelIsLocked && ageEffectsDetails && (ageEffectsDetails.categoryName !== (UI_STRINGS.ageCategoryAdult) || ageEffectsDetails.effects.length > 0) && (
                 <div className={cn("flex flex-wrap", panelBadgeGroupGap)}>
                  <DualBadge
                    leftLabel={UI_STRINGS.ageCategoryBadgeLabel}
                    rightLabel={ageEffectsDetails.categoryName}
                    color="secondary"
                  />
                  {ageEffectsDetails.effects.map((effect) => (
                       <DualBadge
                        key={effect.ability}
                        leftLabel={effect.ability.substring(0, 3).toUpperCase()}
                        rightLabel={effect.change > 0 ? `+${effect.change}` : String(effect.change)}
                        color={effect.change > 0 ? 'emerald' : 'destructive'}
                      />
                    )
                  )}
                </div>
              )}
              </div>
            <div className={panelFieldVerticalGap}>
              <Label htmlFor="gender" className="whitespace-nowrap">{UI_STRINGS.genderLabel}</Label>
              <Select name="gender" value={localGender} onValueChange={(value) => setLocalGender(value as GenderId)} disabled={panelIsLocked} >
                <SelectTrigger id="gender"> <SelectValue /> </SelectTrigger>
                <SelectContent> {genderSelectOptions.map(g => ( <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem> ))} </SelectContent>
              </Select>
            </div>
            <div className={panelFieldVerticalGap}>
              <Label htmlFor="sizeCategory" className="whitespace-nowrap">{UI_STRINGS.sizeLabel}</Label>
              <div className="flex items-center">
                <div className="flex-grow">
                  <Select name="sizeCategory" value={localSize === "" ? UI_EMPTY_SELECTION_VALUE : localSize} onValueChange={(value) => setLocalSize(value === UI_EMPTY_SELECTION_VALUE ? "" : value as CharacterSize)} disabled={panelIsLocked} >
                    <SelectTrigger id="sizeCategory"><SelectValue /></SelectTrigger>
                    <SelectContent> {SIZES.map(s => <SelectItem key={s.id === "" ? UI_EMPTY_SELECTION_VALUE : s.id} value={s.id === "" ? UI_EMPTY_SELECTION_VALUE : s.id}>{s.label}</SelectItem>)} </SelectContent>
                  </Select>
                </div>
              </div>
              {!panelIsLocked && localSize && (() => {
                  const selectedSizeObject = SIZES.find(s => s.id === localSize);
                  if (selectedSizeObject && typeof selectedSizeObject.acModifier === 'number' && selectedSizeObject.acModifier !== 0) {
                    const acMod = selectedSizeObject.acModifier;
                    return (
                      <div className={cn("flex flex-wrap", panelBadgeGroupGap)}>
                        <DualBadge
                          leftLabel={UI_STRINGS.sizeAcModLeftBadgeLabel}
                          rightLabel={acMod > 0 ? `+${acMod}` : String(acMod)}
                          color={acMod > 0 ? 'emerald' : 'destructive'}
                        />
                      </div>
                    );
                  } return null;
                })()}
            </div>
          </div>
        </div>
      )}
    </LockablePanelWrapper>
  );
};
BasicInformationSectionComponent.displayName = 'BasicInformationSectionComponent';
export const BasicInformationSection = React.memo(BasicInformationSectionComponent);
