
'use client';

import *as React from 'react';
import type { FeatDefinitionJsonData, FeatPrerequisiteDetails, AbilityName, DndClassOption, DndClassId, DndRaceOption, CharacterAlignmentObject, DndRaceId, FeatTypeString } from '@/types/character';
// ALIGNMENT_PREREQUISITE_OPTIONS, FEAT_TYPES, ABILITY_LABELS are now from context
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComboboxPrimitive, type ComboboxOption } from '@/components/ui/combobox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { useI18n } from '@/context/I18nProvider'; // Import useI18n
import { useToast } from "@/hooks/use-toast";

interface AddCustomFeatDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (featDefData: FeatDefinitionJsonData & { isCustom: true }) => void;
  initialFeatData?: FeatDefinitionJsonData & { isCustom: true };
  allFeats: readonly FeatDefinitionJsonData[];
  allSkills: readonly ComboboxOption[];
  allClasses: readonly DndClassOption[];
  allRaces: readonly DndRaceOption[];
}

const NONE_VALUE = "__NONE__";

const AddCustomFeatDialogComponent = ({
  isOpen,
  onOpenChange,
  onSave,
  initialFeatData,
  allFeats,
  allSkills,
  allClasses: propAllClasses, 
  allRaces: propAllRaces,     
}: AddCustomFeatDialogProps) => {
  const { translations, isLoading: translationsLoading } = useI18n();
  const { toast } = useToast();

  const [featName, setFeatName] = React.useState('');
  const [featType, setFeatType] = React.useState<FeatTypeString>('special');
  const [description, setDescription] = React.useState('');
  const [canTakeMultipleTimes, setCanTakeMultipleTimes] = React.useState(false);
  const [requiresSpecialization, setRequiresSpecialization] = React.useState('');
  const [effectsText, setEffectsText] = React.useState('');
  const [prereqBab, setPrereqBab] = React.useState(0);
  const [prereqCasterLevel, setPrereqCasterLevel] = React.useState(0);
  const [prereqClassId, setPrereqClassId] = React.useState<DndClassId | string>(NONE_VALUE);
  const [prereqClassLevel, setPrereqClassLevel] = React.useState(0);
  const [prereqRaceId, setPrereqRaceId] = React.useState<DndRaceId | string>(NONE_VALUE);
  const [prereqAlignment, setPrereqAlignment] = React.useState<string>(NONE_VALUE);
  const [newPrereqType, setNewPrereqType] = React.useState<'ability' | 'skill' | 'feat' | ''>('');
  const [newPrereqItemId, setNewPrereqItemId] = React.useState('');
  const [newPrereqValue, setNewPrereqValue] = React.useState(0);
  const [prerequisitesList, setPrerequisitesList] = React.useState<PrerequisiteListItem[]>([]);

  const isEditing = !!initialFeatData;

  const abilityOptions = React.useMemo(() => {
    if (translationsLoading || !translations) return [];
    return translations.ABILITY_LABELS.map(al => ({ value: al.value, label: `${al.label} (${al.abbr})` }));
  }, [translations, translationsLoading]);

  const classComboboxOptions = React.useMemo(() => {
    if (translationsLoading || !translations) return [{ value: NONE_VALUE, label: "Loading..." }];
    return [
      { value: NONE_VALUE, label: translations.UI_STRINGS.deityNoneOption || "None" },
      ...propAllClasses.map(c => ({ value: c.value, label: c.label })) 
    ];
  }, [translations, translationsLoading, propAllClasses]);

  const raceComboboxOptions = React.useMemo(() => {
     if (translationsLoading || !translations) return [{ value: NONE_VALUE, label: "Loading..." }];
    return [
      { value: NONE_VALUE, label: translations.UI_STRINGS.deityNoneOption || "None" },
      ...propAllRaces.map(r => ({ value: r.value, label: r.label })) 
    ];
  }, [translations, translationsLoading, propAllRaces]);

  const alignmentComboboxOptions = React.useMemo(() => {
    if (translationsLoading || !translations) return [{ value: NONE_VALUE, label: "Loading..." }];
    return [
      { value: NONE_VALUE, label: translations.UI_STRINGS.deityNoneOption || "None" },
      ...translations.ALIGNMENT_PREREQUISITE_OPTIONS
    ];
  }, [translations, translationsLoading]);
  
  const featTypeOptions = React.useMemo(() => {
    if (translationsLoading || !translations) return [];
    return translations.FEAT_TYPES;
  }, [translations, translationsLoading]);


  React.useEffect(() => {
    if (isOpen && !translationsLoading && translations) {
      if (initialFeatData) {
        setFeatName(initialFeatData.label || '');
        setFeatType(initialFeatData.type || 'special');
        setDescription(initialFeatData.description || '');
        setCanTakeMultipleTimes(initialFeatData.canTakeMultipleTimes || false);
        setRequiresSpecialization(initialFeatData.requiresSpecialization || '');
        setEffectsText(initialFeatData.effectsText || '');

        const prereqs = initialFeatData.prerequisites;
        setPrereqBab(prereqs?.bab || 0);
        setPrereqCasterLevel(prereqs?.casterLevel || 0);
        setPrereqClassId(prereqs?.classLevel?.classId || NONE_VALUE);
        setPrereqClassLevel(prereqs?.classLevel?.level || 0);
        setPrereqRaceId(prereqs?.raceId || NONE_VALUE);
        setPrereqAlignment(prereqs?.alignment || NONE_VALUE);

        const loadedPrereqs: PrerequisiteListItem[] = [];
        if (prereqs?.abilities) {
          for (const [ability, score] of Object.entries(prereqs.abilities)) {
            const abilityLabel = abilityOptions.find(opt => opt.value === ability)?.label || ability;
            loadedPrereqs.push({ tempId: crypto.randomUUID(), type: 'ability', itemId: ability, itemLabel: abilityLabel, value: score });
          }
        }
        if (prereqs?.skills) {
          prereqs.skills.forEach(skillReq => {
            const skillLabel = allSkills.find(s => s.value === skillReq.id)?.label || skillReq.id;
            loadedPrereqs.push({ tempId: crypto.randomUUID(), type: 'skill', itemId: skillReq.id, itemLabel: skillLabel, value: skillReq.ranks });
          });
        }
        if (prereqs?.feats) {
          prereqs.feats.forEach(featId => {
            const featLabel = allFeats.find(f => f.value === featId)?.label || featId;
            loadedPrereqs.push({ tempId: crypto.randomUUID(), type: 'feat', itemId: featId, itemLabel: featLabel });
          });
        }
        setPrerequisitesList(loadedPrereqs);
      } else {
        setFeatName('');
        setFeatType('special');
        setDescription('');
        setCanTakeMultipleTimes(false);
        setRequiresSpecialization('');
        setEffectsText('');
        setPrereqBab(0);
        setPrereqCasterLevel(0);
        setPrereqClassId(NONE_VALUE);
        setPrereqClassLevel(0);
        setPrereqRaceId(NONE_VALUE);
        setPrereqAlignment(NONE_VALUE);
        setPrerequisitesList([]);
      }
      setNewPrereqType('');
      setNewPrereqItemId('');
      setNewPrereqValue(0);
    }
  }, [isOpen, initialFeatData, allFeats, allSkills, translationsLoading, translations, abilityOptions]);

  const handleAddPrerequisite = () => {
    if (!translations) return;
    if (!newPrereqType || !newPrereqItemId) {
      toast({ title: translations.UI_STRINGS.toastPrereqTypeItemMissingTitle, description: translations.UI_STRINGS.toastPrereqTypeItemMissingDesc, variant: "destructive" });
      return;
    }
    let itemLabel = '';
    let value: number | undefined = undefined;

    if (newPrereqType === 'ability') {
      const abilityOpt = abilityOptions.find(opt => opt.value === newPrereqItemId);
      itemLabel = abilityOpt ? abilityOpt.label : newPrereqItemId;
      value = newPrereqValue;
      if (value <= 0) {
        toast({ title: translations.UI_STRINGS.toastAbilityScoreInvalidTitle, description: translations.UI_STRINGS.toastAbilityScoreInvalidDesc, variant: "destructive" });
        return;
      }
    } else if (newPrereqType === 'skill') {
      const skillOpt = allSkills.find(opt => opt.value === newPrereqItemId);
      itemLabel = skillOpt ? skillOpt.label : newPrereqItemId;
      value = newPrereqValue;
      if (value <= 0) {
        toast({ title: translations.UI_STRINGS.toastSkillRanksInvalidTitle, description: translations.UI_STRINGS.toastSkillRanksInvalidDesc, variant: "destructive" });
        return;
      }
    } else if (newPrereqType === 'feat') {
      const featOpt = allFeats.find(opt => opt.value === newPrereqItemId);
      itemLabel = featOpt ? featOpt.label : newPrereqItemId;
    }

    setPrerequisitesList(prev => [...prev, { tempId: crypto.randomUUID(), type: newPrereqType, itemId: newPrereqItemId, itemLabel, value }]);
    setNewPrereqItemId('');
    setNewPrereqValue(0);
  };

  const handleRemovePrerequisite = (tempIdToRemove: string) => {
    setPrerequisitesList(prev => prev.filter(p => p.tempId !== tempIdToRemove));
  };

  const handleSaveFeat = () => {
    if (!translations) return;
    if (featName.trim() === '') {
      toast({ title: translations.UI_STRINGS.toastFeatNameEmptyTitle, description: translations.UI_STRINGS.toastFeatNameEmptyDesc, variant: "destructive" });
      return;
    }
    if (!featType) {
      toast({ title: translations.UI_STRINGS.toastFeatTypeEmptyTitle, description: translations.UI_STRINGS.toastFeatTypeEmptyDesc, variant: "destructive" });
      return;
    }

    const finalStructuredPrerequisites: FeatPrerequisiteDetails = {};
    if (prereqBab > 0) finalStructuredPrerequisites.bab = prereqBab;
    if (prereqCasterLevel > 0) finalStructuredPrerequisites.casterLevel = prereqCasterLevel;
    if (prereqClassId !== NONE_VALUE && prereqClassId.trim() !== '' && prereqClassLevel > 0) {
        finalStructuredPrerequisites.classLevel = { classId: prereqClassId, level: prereqClassLevel };
    }
    if (prereqRaceId !== NONE_VALUE && prereqRaceId.trim() !== '') {
        finalStructuredPrerequisites.raceId = prereqRaceId;
    }
    if (prereqAlignment !== NONE_VALUE && prereqAlignment.trim() !== '') {
        finalStructuredPrerequisites.alignment = prereqAlignment;
    }

    prerequisitesList.forEach(p => {
      if (p.type === 'ability' && p.value !== undefined) {
        if (!finalStructuredPrerequisites.abilities) finalStructuredPrerequisites.abilities = {};
        finalStructuredPrerequisites.abilities[p.itemId as Exclude<AbilityName, 'none'>] = p.value;
      } else if (p.type === 'skill' && p.value !== undefined) {
        if (!finalStructuredPrerequisites.skills) finalStructuredPrerequisites.skills = [];
        finalStructuredPrerequisites.skills.push({ id: p.itemId, ranks: p.value });
      } else if (p.type === 'feat') {
        if (!finalStructuredPrerequisites.feats) finalStructuredPrerequisites.feats = [];
        finalStructuredPrerequisites.feats.push(p.itemId);
      }
    });

    const featDefinition: FeatDefinitionJsonData & { isCustom: true } = {
      value: initialFeatData?.value || crypto.randomUUID(),
      label: featName.trim(),
      type: featType,
      description: description.trim() || undefined,
      prerequisites: Object.keys(finalStructuredPrerequisites).length > 0 || prerequisitesList.length > 0 ? finalStructuredPrerequisites : undefined,
      effectsText: effectsText.trim() || undefined,
      canTakeMultipleTimes,
      requiresSpecialization: requiresSpecialization.trim() || undefined,
      isCustom: true,
    };

    onSave(featDefinition);
    onOpenChange(false);
  };

  const isAddPrerequisiteDisabled = React.useMemo(() => {
    if (!newPrereqType) return true;
    if (!newPrereqItemId) return true;
    if ((newPrereqType === 'ability' || newPrereqType === 'skill')) {
      if (newPrereqValue <= 0) return true;
    }
    return false;
  }, [newPrereqType, newPrereqItemId, newPrereqValue]);
  
  const isFormDisabled = translationsLoading || !translations;


  if (isFormDisabled) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center font-serif">
                        {isEditing ? <Pencil className="mr-2 h-6 w-6 text-primary" /> : <PlusCircle className="mr-2 h-6 w-6 text-primary" />}
                        {translations?.UI_STRINGS.loadingFeatDefinitionTitle || "Loading Feat Definition..."}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-3 text-muted-foreground">{translations?.UI_STRINGS.loadingOptionsTitle || "Loading options..."}</p>
                </div>
                <DialogFooter className="mt-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)} type="button" disabled>
                        Cancel
                    </Button>
                    <Button type="button" disabled>
                        {isEditing ? 'Save Changes to Definition' : 'Save Custom Feat Definition'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
  }
  const UI_STRINGS = translations.UI_STRINGS;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif">
            {isEditing ? <Pencil className="mr-2 h-6 w-6 text-primary" /> : <PlusCircle className="mr-2 h-6 w-6 text-primary" />}
            {isEditing ? (UI_STRINGS.dmSettingsEditCustomFeatButton || 'Edit Custom Feat Definition') : (UI_STRINGS.dmSettingsAddCustomFeatButton || 'Add Custom Feat Definition')}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? `Modify the definition of ${initialFeatData?.label}.` : 'Define a new custom feat template.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] p-1">
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="custom-feat-name">Feat Name (Label)</Label>
                  <Input
                    id="custom-feat-name"
                    value={featName}
                    onChange={(e) => setFeatName(e.target.value)}
                    placeholder="e.g., Mighty Cleave"
                    disabled={isFormDisabled}
                  />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="custom-feat-type">Feat Type</Label>
                    <Select value={featType} onValueChange={(value) => setFeatType(value as FeatTypeString)} disabled={isFormDisabled}>
                        <SelectTrigger id="custom-feat-type">
                            <SelectValue placeholder="Select feat type..." />
                        </SelectTrigger>
                        <SelectContent>
                            {featTypeOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="custom-feat-description">Description</Label>
              <Textarea
                id="custom-feat-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this feat does."
                rows={3}
                disabled={isFormDisabled}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="custom-feat-multiple-times"
                checked={canTakeMultipleTimes}
                onCheckedChange={(checked) => setCanTakeMultipleTimes(checked as boolean)}
                disabled={isFormDisabled}
              />
              <Label htmlFor="custom-feat-multiple-times" className="text-sm font-normal">
                Can this feat be taken multiple times?
              </Label>
            </div>
            <div className="space-y-1">
              <Label htmlFor="custom-feat-specialization">Requires Specialization (Optional)</Label>
              <Input
                id="custom-feat-specialization"
                value={requiresSpecialization}
                onChange={(e) => setRequiresSpecialization(e.target.value)}
                placeholder="e.g., weapon, skill, school of magic"
                disabled={isFormDisabled}
              />
              <p className="text-xs text-muted-foreground">If this feat needs a choice like 'Weapon Focus (Longsword)', enter 'weapon' here.</p>
            </div>

            <Separator className="my-6" />
            <h3 className="text-md font-semibold text-foreground mb-2">Structured Prerequisites</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="prereq-bab">Base Attack Bonus (BAB)</Label>
                <NumberSpinnerInput id="prereq-bab" value={prereqBab} onChange={setPrereqBab} min={0} inputClassName="h-9 text-sm" buttonClassName="h-9 w-9" buttonSize="sm" disabled={isFormDisabled}/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="prereq-caster-level">Caster Level</Label>
                <NumberSpinnerInput id="prereq-caster-level" value={prereqCasterLevel} onChange={setPrereqCasterLevel} min={0} inputClassName="h-9 text-sm" buttonClassName="h-9 w-9" buttonSize="sm" disabled={isFormDisabled}/>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-1">
                <Label htmlFor="prereq-class">Class Prerequisite</Label>
                <ComboboxPrimitive
                  options={classComboboxOptions}
                  value={prereqClassId}
                  onChange={setPrereqClassId}
                  placeholder="Select Class..."
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="prereq-class-level">Minimum Level in Class</Label>
                <NumberSpinnerInput
                  id="prereq-class-level"
                  value={prereqClassLevel}
                  onChange={setPrereqClassLevel}
                  min={0}
                  inputClassName="h-9 text-sm" buttonClassName="h-9 w-9" buttonSize="sm"
                  disabled={isFormDisabled || prereqClassId === NONE_VALUE || prereqClassId === ""}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-1">
                <Label htmlFor="prereq-race">Race Prerequisite</Label>
                <ComboboxPrimitive
                  options={raceComboboxOptions}
                  value={prereqRaceId}
                  onChange={setPrereqRaceId}
                  placeholder="Select Race..."
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="prereq-alignment">Alignment Prerequisite</Label>
                <ComboboxPrimitive
                  options={alignmentComboboxOptions}
                  value={prereqAlignment}
                  onChange={setPrereqAlignment}
                  placeholder="Select Alignment..."
                />
              </div>
            </div>

            <Separator className="my-6" />
            <h4 className="text-sm font-medium text-foreground mb-1">Add Specific Prerequisite:</h4>
            <div className="p-3 border rounded-md bg-muted/20 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="space-y-1">
                  <Label htmlFor="new-prereq-type">Type</Label>
                  <Select value={newPrereqType} onValueChange={(val) => { setNewPrereqType(val as any); setNewPrereqItemId(''); setNewPrereqValue(0); }} disabled={isFormDisabled}>
                    <SelectTrigger><SelectValue placeholder="Select Type..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ability">Ability Score</SelectItem>
                      <SelectItem value="skill">Skill</SelectItem>
                      <SelectItem value="feat">Feat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newPrereqType === 'ability' && (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="new-prereq-ability-item">Ability</Label>
                      <Select value={newPrereqItemId} onValueChange={setNewPrereqItemId} disabled={isFormDisabled}>
                        <SelectTrigger><SelectValue placeholder="Select Ability..." /></SelectTrigger>
                        <SelectContent>
                          {abilityOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="new-prereq-ability-value">Min Score</Label>
                      <NumberSpinnerInput id="new-prereq-ability-value" value={newPrereqValue} onChange={setNewPrereqValue} min={1} inputClassName="h-9 text-sm" buttonClassName="h-9 w-9" buttonSize="sm" disabled={isFormDisabled}/>
                    </div>
                  </>
                )}
                {newPrereqType === 'skill' && (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="new-prereq-skill-item">Skill</Label>
                      <ComboboxPrimitive
                        options={allSkills}
                        value={newPrereqItemId}
                        onChange={setNewPrereqItemId}
                        placeholder="Select Skill..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="new-prereq-skill-value">Min Ranks</Label>
                      <NumberSpinnerInput id="new-prereq-skill-value" value={newPrereqValue} onChange={setNewPrereqValue} min={1} inputClassName="h-9 text-sm" buttonClassName="h-9 w-9" buttonSize="sm" disabled={isFormDisabled}/>
                    </div>
                  </>
                )}
                {newPrereqType === 'feat' && (
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="new-prereq-feat-item">Feat</Label>
                    <ComboboxPrimitive
                      options={allFeats.map(f => ({ value: f.value, label: f.label }))}
                      value={newPrereqItemId}
                      onChange={setNewPrereqItemId}
                      placeholder="Select Prerequisite Feat..."
                    />
                  </div>
                )}
              </div>
              {newPrereqType && (
                <Button onClick={handleAddPrerequisite} size="sm" variant="outline" type="button" disabled={isFormDisabled || isAddPrerequisiteDisabled}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add to Prerequisite List
                </Button>
              )}
            </div>

            {prerequisitesList.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label>Defined Prerequisites:</Label>
                {prerequisitesList.map(p => (
                  <div key={p.tempId} className="flex items-center justify-between p-2 border rounded-md text-xs bg-background">
                    <div>
                      <Badge variant="secondary" className="mr-2 capitalize whitespace-nowrap">{p.type}</Badge>
                      <span className="font-medium">{p.itemLabel}</span>
                      {p.value !== undefined && <span className="text-muted-foreground"> (Min: {p.value}{p.type === 'skill' ? ' Ranks' : ''})</span>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemovePrerequisite(p.tempId)} type="button" disabled={isFormDisabled}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Separator className="my-6" />
            <h3 className="text-md font-semibold text-foreground">Effects (Textual)</h3>
             <div className="space-y-1">
              <Label htmlFor="custom-feat-effects-text">Describe Effects</Label>
              <Textarea
                id="custom-feat-effects-text"
                value={effectsText}
                onChange={(e) => setEffectsText(e.target.value)}
                placeholder="Describe the feat's effects (e.g., +2 damage with greatswords). This is textual only."
                rows={2}
                disabled={isFormDisabled}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button" disabled={isFormDisabled}>
            {UI_STRINGS.formButtonCancel || "Cancel"}
          </Button>
          <Button onClick={handleSaveFeat} type="button" disabled={isFormDisabled}>
            {isEditing ? (UI_STRINGS.formButtonSaveChanges || 'Save Changes') : (UI_STRINGS.dmSettingsAddCustomFeatButton || 'Add Custom Feat Definition')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const AddCustomFeatDialog = React.memo(AddCustomFeatDialogComponent);

interface PrerequisiteListItem {
  tempId: string;
  type: 'ability' | 'skill' | 'feat';
  itemId: string;
  itemLabel: string;
  value?: number;
}

    