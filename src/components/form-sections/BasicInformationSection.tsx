
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
import { panelGridGap, panelContentPadding, panelFieldHorizontalGap, panelFieldVerticalGap, panelBadgeGroupGap, textStyleSectionSubheading, debounceDelayFormInput, textStyleBadgeSmall, textStyleLabel } from '@/config/layout';

const UI_EMPTY_SELECTION_VALUE = generateRandomAlphanumericString(50);


interface ClassSpecificFieldProps {
  uiBlock: ClassSpecificUIBlock;
  isVisuallyDisabled: boolean;
  onChoiceChange: (featureKey: string, newValue: string) => void;
  onOpenInfoDialog: (uiBlock: ClassSpecificUIBlock) => void;
  allChoices: CharacterClassSpecificChoice[];
}

const ClassSpecificFieldComponent = React.memo(({
  uiBlock,
  isVisuallyDisabled,
  onChoiceChange,
  onOpenInfoDialog,
  allChoices,
}: ClassSpecificFieldProps) => {
  const { translations, isLoading: translationsLoading, language: currentLang } = useI18n();

  const finalSelectOptions = React.useMemo(() => {
    if (translationsLoading || !translations) return [];

    const { DND_DOMAINS, DND_MAGIC_SCHOOLS, DND_CREATURE_TYPES, UI_STRINGS } = translations;
    const emptySelectionLabelText = uiBlock.emptySelectionLabel ? getLocalizedString(uiBlock.emptySelectionLabel, currentLang) : UI_STRINGS.deityNoneOption;

    let initialOptions: ComboboxOption[] = [];
    if (uiBlock.optionsSource === 'domains') initialOptions = DND_DOMAINS.map(d => ({ value: d.id, label: d.label }));
    else if (uiBlock.optionsSource === 'magicSchools') initialOptions = DND_MAGIC_SCHOOLS.map(s => ({ value: s.id, label: s.label }));
    else if (uiBlock.optionsSource === 'creatureTypes') initialOptions = DND_CREATURE_TYPES.map(ct => ({ value: ct.id, label: ct.label }));
    else if (uiBlock.optionsSource === 'customList' && uiBlock.customOptions) initialOptions = uiBlock.customOptions.map(opt => ({ value: opt.value, label: getLocalizedString(opt.label, currentLang) }));

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
  }, [translationsLoading, translations, uiBlock, allChoices, currentLang]);
  
  if (translationsLoading || !translations) {
    return null;
  }
  
  const { UI_STRINGS } = translations;
  
  const blockLabel = uiBlock.label ? getLocalizedString(uiBlock.label, currentLang) : uiBlock.key;
  const blockNote = uiBlock.note ? getLocalizedString(uiBlock.note, currentLang) : undefined;
  const inputPlaceholderText = uiBlock.inputPlaceholder ? getLocalizedString(uiBlock.inputPlaceholder, currentLang) : UI_STRINGS.selectPlaceholder;

  const getCurrentValue = (key: string): string => {
    const choice = (allChoices || []).find(
      c => c.featureKey === key && c.slotIndex === undefined
    );
    return choice?.value ?? "";
  };

  const currentValue = getCurrentValue(uiBlock.key);
  const uiValueForComponent = currentValue === "" ? UI_EMPTY_SELECTION_VALUE : currentValue;
  const handleChange = (val: string) => { onChoiceChange(uiBlock.key, val === UI_EMPTY_SELECTION_VALUE ? "" : val); };
  const handleOpenInfo = () => onOpenInfoDialog(uiBlock);

  const hasInfoContentForDialog = uiBlock.optionsSource || uiBlock.infoDialogContent || uiBlock.description;
  const commonInfoButton = (hasInfoContentForDialog && onOpenInfoDialog) ? (
    <Button
      type="button" variant="ghost" size="icon-sm"
      className="shrink-0 text-muted-foreground hover:text-foreground"
      onClick={handleOpenInfo}
      disabled={isVisuallyDisabled && !hasInfoContentForDialog}
      aria-label={UI_STRINGS.infoDialogClassSpecificChoiceAriaLabel.replace("{choiceName}", blockLabel)}
    >
      <Info />
    </Button>
  ) : null;


  if (uiBlock.isHeadingOnly) {
    return (
      <div className="md:col-span-2">
        <h3 className={textStyleSectionSubheading}>{blockLabel}</h3>
      </div>
    );
  }

  if (uiBlock.choiceType === 'select' || uiBlock.choiceType === 'combobox') {
    return (
      <div className={cn("flex flex-col", panelFieldVerticalGap)}>
        <Label htmlFor={`cspec-${uiBlock.key}`} className={cn("whitespace-nowrap", textStyleLabel)}>{blockLabel}</Label>
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
});
ClassSpecificFieldComponent.displayName = 'ClassSpecificFieldComponent';

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

const BasicInformationSectionContent = React.memo(({
  panelIsLocked,
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
  translations,
  selectedClassInfo,
  visibleUiSections,
  deitySelectOptions,
  genderSelectOptions,
}: BasicInformationSectionProps & {
  panelIsLocked: boolean,
  translations: NonNullable<ReturnType<typeof useI18n>['translations']>,
  selectedClassInfo?: DndClassOption,
  visibleUiSections: ClassSpecificUIBlock[],
  deitySelectOptions: ComboboxOption[],
  genderSelectOptions: ComboboxOption[],
}) => {
    const { language: currentLang } = useI18n();

    const classSpecificChoicesRef = React.useRef(classSpecificChoices);
    React.useEffect(() => {
        classSpecificChoicesRef.current = classSpecificChoices;
    }, [classSpecificChoices]);

    const [localName, setLocalName] = useDebouncedFormField(
      characterData.name,
      React.useCallback((value) => onFieldChange('name', value), [onFieldChange]),
      debounceDelayFormInput
    );
    const [localPlayerName, setLocalPlayerName] = useDebouncedFormField(
      characterData.playerName || '',
      React.useCallback((value) => onFieldChange('playerName', value), [onFieldChange]),
      debounceDelayFormInput
    );
    const [localRace, setLocalRace] = useDebouncedFormField(
      characterData.race,
      React.useCallback((value) => onFieldChange('race', value as DndRaceId), [onFieldChange]),
      debounceDelayFormInput
    );
    const [localClassName, setLocalClassName] = useDebouncedFormField(
      characterData.classes[0]?.className || '',
      React.useCallback((value) => onClassChange(value as DndClassId | string), [onClassChange]),
      debounceDelayFormInput
    );
    const [localAlignment, setLocalAlignment] = useDebouncedFormField(
      characterData.alignment,
      React.useCallback((value) => onFieldChange('alignment', value as CharacterAlignment), [onFieldChange]),
      debounceDelayFormInput
    );
    const [localDeity, setLocalDeity] = useDebouncedFormField(
      characterData.deity || "",
      React.useCallback((value) => onFieldChange('deity', value as DndDeityId | string), [onFieldChange]),
      debounceDelayFormInput
    );
    const [localAge, setLocalAge] = useDebouncedFormField(
      characterData.age,
      React.useCallback((value) => onFieldChange('age', Math.max(value, currentMinAgeForInput)), [onFieldChange, currentMinAgeForInput]),
      debounceDelayFormInput
    );
    const [localGender, setLocalGender] = useDebouncedFormField(
      characterData.gender,
      React.useCallback((value) => onFieldChange('gender', value as GenderId | string), [onFieldChange]),
      debounceDelayFormInput
    );
    const [localSize, setLocalSize] = useDebouncedFormField(
      characterData.size,
      React.useCallback((value) => onFieldChange('size', value as CharacterSize), [onFieldChange]),
      debounceDelayFormInput
    );

    const { UI_STRINGS, ALIGNMENTS, DND_RACES, DND_CLASSES, DND_DEITIES, SIZES, GENDERS, DND_DOMAINS, DND_MAGIC_SCHOOLS, DND_CREATURE_TYPES, PREFERRED_DEFAULT_ALIGNMENT_IDS } = translations || {};
  
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
  
    const handleOpenClassSpecificChoiceInfoDialogInternal = React.useCallback((uiBlock: ClassSpecificUIBlock) => {
      if (!onOpenClassSpecificChoiceInfoDialog || !translations || !DND_DOMAINS || !DND_MAGIC_SCHOOLS || !UI_STRINGS || !DND_CREATURE_TYPES) return;
  
      const blockLabelForDialog = uiBlock.label ? getLocalizedString(uiBlock.label, currentLang) : uiBlock.key;
      let introductoryContentForDialog = uiBlock.infoDialogContent ? getLocalizedString(uiBlock.infoDialogContent, currentLang) : undefined; 
      if (!introductoryContentForDialog && uiBlock.description) { 
        introductoryContentForDialog = getLocalizedString(uiBlock.description, currentLang);
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
          optionsForDialog = uiBlock.customOptions.map(opt => ({ id: opt.value, label: getLocalizedString(opt.label, currentLang), description: opt.description ? getLocalizedString(opt.description, currentLang) : undefined }));
        }
        optionsForDialog.sort((a,b) => a.label.localeCompare(b.label));
      }
      
      if (uiBlock.optionsSource && optionsForDialog.length > 0) {
          onOpenClassSpecificChoiceInfoDialog({ 
              type: 'classSpecificChoiceOptions', 
              title: uiBlock.infoDialogTitle ? getLocalizedString(uiBlock.infoDialogTitle, currentLang) : blockLabelForDialog, 
              options: optionsForDialog,
              introductoryContentHtml: introductoryContentForDialog 
          });
      } else if (introductoryContentForDialog) { 
          onOpenClassSpecificChoiceInfoDialog({
              type: 'genericHtml',
              title: uiBlock.infoDialogTitle ? getLocalizedString(uiBlock.infoDialogTitle, currentLang) : blockLabelForDialog,
              content: introductoryContentForDialog
          });
      }
    }, [onOpenClassSpecificChoiceInfoDialog, translations, DND_DOMAINS, DND_MAGIC_SCHOOLS, DND_CREATURE_TYPES, currentLang]);
  
    React.useEffect(() => {
      if (!selectedClassInfo || !PREFERRED_DEFAULT_ALIGNMENT_IDS || !ALIGNMENTS) return;
      
      const classRestriction = selectedClassInfo.alignmentRestriction;
      if (!classRestriction || classRestriction === 'any') return; 
      
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
    }, [localClassName, selectedClassInfo, PREFERRED_DEFAULT_ALIGNMENT_IDS, ALIGNMENTS, localAlignment, setLocalAlignment]);
  
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
    }, [localAlignment, localClassName, localDeity, DND_DEITIES, DND_CLASSES, setLocalDeity]);
    
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

    const { DND_CLASSES: DND_CLASSES_UNUSED, PREFERRED_DEFAULT_ALIGNMENT_IDS: P, ...restOfTranslations } = translations;

    return (
      <div className={cn("flex flex-col", panelGridGap)}>
        <div className={cn("grid grid-cols-1 md:grid-cols-2", panelGridGap)}>
          <div className={cn("flex flex-col", panelFieldVerticalGap)}>
            <Label htmlFor="name" className={textStyleLabel}>{UI_STRINGS.characterNameLabel}</Label>
            <Input id="name" name="name" value={localName} onChange={(e) => setLocalName(e.target.value)} disabled={panelIsLocked} />
          </div>
          <div className={cn("flex flex-col", panelFieldVerticalGap)}>
            <Label htmlFor="playerName" className={textStyleLabel}>{UI_STRINGS.playerNameLabel}</Label>
            <Input id="playerName" name="playerName" value={localPlayerName} onChange={(e) => setLocalPlayerName(e.target.value)} disabled={panelIsLocked} />
          </div>
        </div>

        <div className={cn("grid grid-cols-1 md:grid-cols-2", panelGridGap)}>
          <div className={cn("flex flex-col", panelFieldVerticalGap)}>
            <Label htmlFor="race" className={textStyleLabel}>{UI_STRINGS.raceLabel}</Label>
            <div className={cn("flex items-center", panelFieldHorizontalGap)}>
              <div className="flex-grow">
                <Select value={localRace} onValueChange={(value) => setLocalRace(value as DndRaceId)} disabled={panelIsLocked} >
                  <SelectTrigger id="race"> <SelectValue /> </SelectTrigger>
                  <SelectContent> {DND_RACES.map(race => <SelectItem key={race.id} value={race.id}>{race.label}</SelectItem>)} </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={onOpenRaceInfoDialog} disabled={panelIsLocked && !localRace} className="shrink-0"> <Info /> </Button>
            </div>
            {!panelIsLocked && DND_RACES.find(r => r.id === localRace) && raceSpecialQualities?.abilityEffects && raceSpecialQualities.abilityEffects.length > 0 && (
               <div className={cn("flex flex-wrap", panelBadgeGroupGap, textStyleBadgeSmall)}>
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
           <div className={cn("flex flex-col", panelFieldVerticalGap)}>
            <Label htmlFor="className" className={textStyleLabel}>{UI_STRINGS.classLabel}</Label>
            <div className={cn("flex items-center", panelFieldHorizontalGap)}>
              <div className="flex-grow">
                <Select value={localClassName} onValueChange={(value) => setLocalClassName(value as DndClassId)} disabled={panelIsLocked} >
                  <SelectTrigger id="className"> <SelectValue /> </SelectTrigger>
                  <SelectContent> {DND_CLASSES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)} </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={onOpenClassInfoDialog} disabled={panelIsLocked && !localClassName} className="shrink-0"> <Info /> </Button>
            </div>
            <div className={cn("flex flex-wrap", panelBadgeGroupGap, textStyleBadgeSmall)}>
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
                      rightLabel={`${typeof poolValue === 'number' ? poolValue : UI_STRINGS.abilityUsesPoolPlaceholder} / ${localizedPeriod}`}
                      color="accent"
                    />
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>

        {visibleUiSections.length > 0 && (
          <div className={cn("flex flex-col rounded-md border bg-background/50", panelGridGap, panelContentPadding)}>
            <div className={cn("grid grid-cols-1 md:grid-cols-2", panelGridGap)}>
              {visibleUiSections.map((uiBlock, index) => {
                const isVisuallyDisabled = panelIsLocked || disabledStates[uiBlock.key];
                return (
                  <ClassSpecificFieldComponent
                    key={`csf-memo-${uiBlock.key}-${index}`}
                    uiBlock={uiBlock}
                    isVisuallyDisabled={isVisuallyDisabled}
                    onChoiceChange={handleClassSpecificChoiceChange}
                    onOpenInfoDialog={handleOpenClassSpecificChoiceInfoDialogInternal}
                    allChoices={classSpecificChoices}
                  />
                );
              })}
            </div>
          </div>
        )}

        <div className={cn("grid grid-cols-1 md:grid-cols-2", panelGridGap)}>
          <div className={cn("flex flex-col", panelFieldVerticalGap)}>
            <Label htmlFor="alignment" className={textStyleLabel}>{UI_STRINGS.alignmentLabel}</Label>
            <div className={cn("flex items-center", panelFieldHorizontalGap)}>
              <div className="flex-grow">
                <Select name="alignment" value={localAlignment === "" ? UI_EMPTY_SELECTION_VALUE : localAlignment} onValueChange={(value) => setLocalAlignment(value === UI_EMPTY_SELECTION_VALUE ? "" : value as CharacterAlignment)} disabled={panelIsLocked} >
                  <SelectTrigger id="alignment"> <SelectValue /> </SelectTrigger>
                  <SelectContent> {ALIGNMENTS.filter(a => selectedClassInfo?.alignmentRestriction ? isAlignmentValidForRequirement(a.id as CharacterAlignment, selectedClassInfo.alignmentRestriction) : true).map(align => ( <SelectItem key={align.id} value={align.id === "" ? UI_EMPTY_SELECTION_VALUE : align.id}>{align.label}</SelectItem> ))} </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={onOpenAlignmentInfoDialog} disabled={panelIsLocked && !localAlignment} className="shrink-0"> <Info /> </Button>
            </div>
          </div>
          <div className={cn("flex flex-col", panelFieldVerticalGap)}>
              <Label htmlFor="deity" className={textStyleLabel}>{UI_STRINGS.deityLabel}</Label>
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
          <div className={cn("flex flex-col", panelFieldVerticalGap)}>
            <Label htmlFor="age" className={textStyleLabel}>{UI_STRINGS.ageLabel}</Label>
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
               <div className={cn("flex flex-wrap", panelBadgeGroupGap, textStyleBadgeSmall)}>
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
          <div className={cn("flex flex-col", panelFieldVerticalGap)}>
            <Label htmlFor="gender" className={textStyleLabel}>{UI_STRINGS.genderLabel}</Label>
            <Select name="gender" value={localGender} onValueChange={(value) => setLocalGender(value as GenderId)} disabled={panelIsLocked} >
              <SelectTrigger id="gender"> <SelectValue /> </SelectTrigger>
              <SelectContent> {genderSelectOptions.map(g => ( <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem> ))} </SelectContent>
            </Select>
          </div>
          <div className={cn("flex flex-col", panelFieldVerticalGap)}>
            <Label htmlFor="sizeCategory" className={textStyleLabel}>{UI_STRINGS.sizeLabel}</Label>
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
                    <div className={cn("flex flex-wrap", panelBadgeGroupGap, textStyleBadgeSmall)}>
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
    );
});
BasicInformationSectionContent.displayName = 'BasicInformationSectionContent';

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
  const { translations, isLoading: translationsLoading } = useI18n();
  const { UI_STRINGS, ALIGNMENTS, DND_RACES, DND_CLASSES, DND_DEITIES, SIZES, GENDERS } = translations || {};

  const localClassName = characterData.classes[0]?.className || '';
  const localAlignment = characterData.alignment;

  const selectedClassInfo = React.useMemo(() => DND_CLASSES?.find(c => c.id === localClassName), [DND_CLASSES, localClassName]);

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

  const selectedRaceInfo = React.useMemo(() => DND_RACES?.find(r => r.id === characterData.race), [DND_RACES, characterData.race]);
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

  const visibleUiSections = React.useMemo(() => {
    return selectedClassInfo?.uiSections?.filter(uiBlock => {
      if (uiBlock.requiredLevel && characterLevel < uiBlock.requiredLevel) return false;
      if (uiBlock.conditionAggregatedEffect && aggregatedFeatEffects) {
        const propValue = (aggregatedFeatEffects as any)[uiBlock.conditionAggregatedEffect.property];
        switch (uiBlock.conditionAggregatedEffect.comparison) {
          case 'exists': return propValue !== undefined && propValue !== null && (Array.isArray(propValue) ? propValue.length > 0 : true);
          case 'greaterThan': return typeof propValue === 'number' && propValue > (uiBlock.conditionAggregatedEffect.value as number);
          case 'equals': return propValue === uiBlock.conditionAggregatedEffect.value;
          case 'lessThan': return typeof propValue === 'number' && propValue < (uiBlock.conditionAggregatedEffect.value as number);
          case 'notEquals': return propValue !== uiBlock.conditionAggregatedEffect.value;
          default: return true;
        }
      } else if (uiBlock.conditionDependsOnUIStateKey) {
        const controllingValue = classSpecificChoices.find(c => c.featureKey === uiBlock.conditionDependsOnUIStateKey)?.value || "";
        if (uiBlock.conditionDependsOnUIStateValueNotIn) {
          return !uiBlock.conditionDependsOnUIStateValueNotIn.includes(controllingValue);
        }
      }
      return true;
    }) || [];
  }, [selectedClassInfo, characterLevel, aggregatedFeatEffects, classSpecificChoices]);

  if (translationsLoading || !UI_STRINGS || !DND_RACES || !DND_CLASSES || !ALIGNMENTS || !DND_DEITIES || !SIZES || !GENDERS) {
    return null;
  }

  return (
    <LockablePanelWrapper
      title={UI_STRINGS.basicInformationPanelTitle}
      description={UI_STRINGS.basicInformationPanelDescription}
      icon={ScrollText}
      initialLockedState={false}
    >
      {({ isLocked: panelIsLocked }) => (
        <BasicInformationSectionContent
          panelIsLocked={panelIsLocked}
          characterData={characterData}
          classSpecificChoices={classSpecificChoices}
          onFieldChange={onFieldChange}
          onClassChange={onClassChange}
          ageEffectsDetails={ageEffectsDetails}
          raceSpecialQualities={raceSpecialQualities}
          currentMinAgeForInput={currentMinAgeForInput}
          onOpenRaceInfoDialog={onOpenRaceInfoDialog}
          onOpenClassInfoDialog={onOpenClassInfoDialog}
          onOpenAlignmentInfoDialog={onOpenAlignmentInfoDialog}
          onOpenDeityInfoDialog={onOpenDeityInfoDialog}
          onOpenClassSpecificChoiceInfoDialog={onOpenClassSpecificChoiceInfoDialog}
          aggregatedFeatEffects={aggregatedFeatEffects}
          characterLevel={characterLevel}
          translations={translations!}
          selectedClassInfo={selectedClassInfo}
          visibleUiSections={visibleUiSections}
          deitySelectOptions={deitySelectOptions}
          genderSelectOptions={genderSelectOptions}
        />
      )}
    </LockablePanelWrapper>
  );
};
BasicInformationSectionComponent.displayName = 'BasicInformationSectionComponent';
export const BasicInformationSection = React.memo(BasicInformationSectionComponent);
