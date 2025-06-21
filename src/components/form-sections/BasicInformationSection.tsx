
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


export interface BasicInformationSectionProps {
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
  characterLevel: number;
}


interface ClassSpecificFieldProps {
  uiBlock: ClassSpecificUIBlock;
  isVisuallyDisabled: boolean;
  onValueChange: (newValue: string) => void;
  onOpenInfoDialog: () => void;
  blockIndex: number;
  characterLevel: number;
  allChoices: CharacterClassSpecificChoice[];
  aggregatedFeatEffects: AggregatedFeatEffects | null;
}

const ClassSpecificFieldComponent: React.FC<ClassSpecificFieldProps> = ({
  uiBlock,
  isVisuallyDisabled: propIsVisuallyDisabled,
  onValueChange,
  onOpenInfoDialog,
  blockIndex,
  characterLevel,
  allChoices,
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
    }
    if (uiBlock.conditionDependsOnUIStateKey) {
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
    const emptySelectionLabelText = uiBlock.emptySelectionLabel ? getLocalizedString(uiBlock.emptySelectionLabel, translations.UI_STRINGS.currentLangCodeForNotesFallback || 'en') : UI_STRINGS.deityNoneOption;

    let initialOptions: ComboboxOption[] = [];
    if (uiBlock.optionsSource === 'domains') initialOptions = DND_DOMAINS.map(d => ({ value: d.id, label: d.label }));
    else if (uiBlock.optionsSource === 'magicSchools') initialOptions = DND_MAGIC_SCHOOLS.map(s => ({ value: s.id, label: s.label }));
    else if (uiBlock.optionsSource === 'creatureTypes') initialOptions = DND_CREATURE_TYPES.map(ct => ({ value: ct.id, label: ct.label }));
    else if (uiBlock.optionsSource === 'customList' && uiBlock.customOptions) initialOptions = uiBlock.customOptions.map(opt => ({ value: opt.value, label: getLocalizedString(opt.label, translations.UI_STRINGS.currentLangCodeForNotesFallback || 'en') }));

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

  if (!isVisible) return null;
  
  if (translationsLoading || !translations) {
    return <Skeleton className="h-10 w-full" />;
  }
  
  const { UI_STRINGS } = translations;
  
  let isVisuallyDisabled = propIsVisuallyDisabled;
  if (uiBlock.relatedSlotKeyForDisable && !isVisuallyDisabled) {
      const relatedChoiceValue = allChoices.find(c => c.featureKey === uiBlock.relatedSlotKeyForDisable)?.value;
      if (!relatedChoiceValue || relatedChoiceValue === "") isVisuallyDisabled = true;
  }
  if (!isVisuallyDisabled && uiBlock.disabledIfChoiceValue) {
      const controllingChoiceValue = allChoices.find(c => c.featureKey === uiBlock.disabledIfChoiceValue.featureKey)?.value;
      if (controllingChoiceValue && uiBlock.disabledIfChoiceValue.values.includes(controllingChoiceValue)) isVisuallyDisabled = true;
  }

  const blockLabel = uiBlock.label ? getLocalizedString(uiBlock.label, UI_STRINGS.currentLangCodeForNotesFallback || 'en') : uiBlock.key;
  const blockNote = uiBlock.note ? getLocalizedString(uiBlock.note, UI_STRINGS.currentLangCodeForNotesFallback || 'en') : undefined;
  const inputPlaceholderText = uiBlock.inputPlaceholder ? getLocalizedString(uiBlock.inputPlaceholder, UI_STRINGS.currentLangCodeForNotesFallback || 'en') : UI_STRINGS.selectPlaceholder;

  const getCurrentValue = (key: string, index?: number): string => {
    const choice = (allChoices || []).find(
      c => c.featureKey === key && (index === undefined || c.slotIndex === index)
    );
    return choice?.value ?? "";
  };

  const currentValue = getCurrentValue(uiBlock.key, uiBlock.choiceType === 'multiInput' ? blockIndex : undefined);
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
  } else if (uiBlock.choiceType === 'multiInput') {
      const numInputsToRender = uiBlock.maxSelections || 1;
      const slotLabelTemplate = uiBlock.slotLabel ? getLocalizedString(uiBlock.slotLabel, UI_STRINGS.currentLangCodeForNotesFallback || 'en') : "Slot {slotNum}";

      return (
        <div key={`${uiBlock.key}-group-${blockIndex}`} className={cn("flex flex-col border rounded-md bg-background/50 p-3", panelFieldVerticalGap)}>
          <Label className="flex font-medium whitespace-nowrap">{blockLabel} <Badge variant="outline">{numInputsToRender}</Badge></Label>
          {Array.from({ length: numInputsToRender }).map((_, index) => {
              const isDisabledByPanelOrDependency = isVisuallyDisabled || (uiBlock.relatedSlotKeyForDisable && !allChoices.find(c => c.featureKey === uiBlock.relatedSlotKeyForDisable)?.value);
              const multiInputCurrentValue = getCurrentValue(uiBlock.key, index);
              return (
                <div key={`${uiBlock.key}-slot-${index}`} className={panelFieldVerticalGap}>
                  <Label htmlFor={`${uiBlock.key}-input-${index}`} className="whitespace-nowrap"> {parseAndRenderUIString(slotLabelTemplate, { slotNum: index + 1 })} </Label>
                  <Input id={`${uiBlock.key}-input-${index}`} value={multiInputCurrentValue} onChange={(e) => onValueChange(e.target.value)} placeholder={inputPlaceholderText} disabled={isDisabledByPanelOrDependency} />
                </div>
              );
          })}
          {blockNote && <p className="italic text-xs text-muted-foreground">{blockNote}</p>}
        </div>
      );
  }
  return <div key={`${uiBlock.key}-error`} className="text-destructive">Unsupported choiceType: {uiBlock.choiceType} for {uiBlock.key}</div>;
};
const MemoizedClassSpecificField = React.memo(ClassSpecificFieldComponent);


const BasicInformationSectionComponent = ({
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
  characterLevel,
}: BasicInformationSectionProps) => {
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

  const choicesRef = React.useRef(characterData.classSpecificChoices);
  React.useEffect(() => {
    choicesRef.current = characterData.classSpecificChoices;
  }, [characterData.classSpecificChoices]);

  const handleClassSpecificChoiceChange = React.useCallback((
    featureKey: string,
    newValue: string,
    slotIndex?: number
  ) => {
    const existingChoices = choicesRef.current || [];
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
      const originalChoice = (choicesRef.current || []).find(ec => ec.featureKey === c.featureKey && ec.slotIndex === c.slotIndex);
      const uiBlockDef = selectedClassInfo?.uiSections?.find(uib => uib.key === c.featureKey);
      return (originalChoice && originalChoice.value !== "") || (uiBlockDef && uiBlockDef.defaultValue === "");
    });
    onFieldChange('classSpecificChoices', updatedChoices);
  }, [onFieldChange, selectedClassInfo?.uiSections]);


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
    if (!selectedClassInfo?.uiSections || !translations || !UI_STRINGS || !DND_DOMAINS || !DND_MAGIC_SCHOOLS || !DND_CREATURE_TYPES) return;
    let choicesToUpdate: CharacterClassSpecificChoice[] = [...(characterData.classSpecificChoices || [])];
    let changed = false;

    selectedClassInfo.uiSections.forEach(uiBlock => {
      if (uiBlock.isHeadingOnly) return;
      const numSlots = uiBlock.choiceType === 'multiInput' ? uiBlock.maxSelections : 1;
      for (let i = 0; i < (numSlots || 1); i++) {
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
              else if (uiBlock.optionsSource === 'customList' && uiBlock.customOptions) tempOptions = uiBlock.customOptions.map(opt => ({ value: opt.value, label: getLocalizedString(opt.label, UI_STRINGS.currentLangCodeForNotesFallback || 'en') }));

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
                {selectedClassInfo.uiSections.map((uiBlock, index) => (
                  <MemoizedClassSpecificField
                    key={`csf-memo-${uiBlock.key}-${index}`}
                    uiBlock={uiBlock}
                    isVisuallyDisabled={panelIsLocked}
                    onValueChange={(newValue) => handleClassSpecificChoiceChange(uiBlock.key, newValue, uiBlock.choiceType === 'multiInput' ? index : undefined)}
                    onOpenInfoDialog={() => handleOpenClassSpecificChoiceInfoDialogInternal(uiBlock)}
                    blockIndex={index}
                    characterLevel={characterLevel}
                    allChoices={characterData.classSpecificChoices || []}
                    aggregatedFeatEffects={aggregatedFeatEffects}
                  />
                ))}
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
