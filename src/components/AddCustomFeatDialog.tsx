
'use client';

import * as React from 'react';
import type { FeatDefinitionJsonData, FeatPrerequisiteDetails, AbilityName, DndClassOption, DndClassId, DndRaceOption, CharacterAlignmentObject, DndRaceId } from '@/types/character';
import { ALIGNMENT_PREREQUISITE_OPTIONS } from '@/types/character';
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
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComboboxPrimitive, type ComboboxOption } from '@/components/ui/combobox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface AddCustomFeatDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (featDefData: FeatDefinitionJsonData & { isCustom: true }) => void;
  initialFeatData?: FeatDefinitionJsonData & { isCustom: true };
  allFeats: readonly FeatDefinitionJsonData[]; // For feat prerequisite selector (predefined D&D feats)
  allSkills: readonly ComboboxOption[]; // skill ID (value) and label
  allClasses: readonly DndClassOption[];
  allRaces: readonly DndRaceOption[];
}

const abilityOptions: Array<{ value: Exclude<AbilityName, 'none'>; label: string }> = [
  { value: 'strength', label: 'Strength (STR)' },
  { value: 'dexterity', label: 'Dexterity (DEX)' },
  { value: 'constitution', label: 'Constitution (CON)' },
  { value: 'intelligence', label: 'Intelligence (INT)' },
  { value: 'wisdom', label: 'Wisdom (WIS)' },
  { value: 'charisma', label: 'Charisma (CHA)' },
];

type PrerequisiteListItem = {
  tempId: string;
  type: 'ability' | 'skill' | 'feat';
  itemId: string; // For ability: ability name; For skill: skill ID; For feat: feat definition ID
  itemLabel: string;
  value?: number; // For ability: score; For skill: ranks
};

const NONE_VALUE = "__NONE__";

export function AddCustomFeatDialog({
  isOpen,
  onOpenChange,
  onSave,
  initialFeatData,
  allFeats, // Predefined D&D feats
  allSkills, // skill definitions {value: id, label: name}
  allClasses,
  allRaces,
}: AddCustomFeatDialogProps) {
  const [featName, setFeatName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [canTakeMultipleTimes, setCanTakeMultipleTimes] = React.useState(false);
  const [requiresSpecialization, setRequiresSpecialization] = React.useState('');
  const [effectsText, setEffectsText] = React.useState('');
  const [prereqBab, setPrereqBab] = React.useState('');
  const [prereqCasterLevel, setPrereqCasterLevel] = React.useState('');
  const [prereqClassId, setPrereqClassId] = React.useState<DndClassId | string>(NONE_VALUE);
  const [prereqClassLevel, setPrereqClassLevel] = React.useState('');
  const [prereqRaceId, setPrereqRaceId] = React.useState<DndRaceId | string>(NONE_VALUE);
  const [prereqAlignment, setPrereqAlignment] = React.useState<string>(NONE_VALUE);
  const [newPrereqType, setNewPrereqType] = React.useState<'ability' | 'skill' | 'feat' | ''>('');
  const [newPrereqItemId, setNewPrereqItemId] = React.useState('');
  const [newPrereqValue, setNewPrereqValue] = React.useState('');
  const [prerequisitesList, setPrerequisitesList] = React.useState<PrerequisiteListItem[]>([]);

  const isEditing = !!initialFeatData;
  
  const classComboboxOptions = React.useMemo(() => [
    { value: NONE_VALUE, label: "None" },
    ...allClasses.map(c => ({ value: c.value, label: c.label }))
  ], [allClasses]);

  const raceComboboxOptions = React.useMemo(() => [
    { value: NONE_VALUE, label: "None" },
    ...allRaces.map(r => ({ value: r.value, label: r.label }))
  ], [allRaces]);

  const alignmentComboboxOptions = React.useMemo(() => [
    { value: NONE_VALUE, label: "None" },
    ...ALIGNMENT_PREREQUISITE_OPTIONS
  ], []);

  React.useEffect(() => {
    if (isOpen) {
      if (initialFeatData) {
        setFeatName(initialFeatData.label || '');
        setDescription(initialFeatData.description || '');
        setCanTakeMultipleTimes(initialFeatData.canTakeMultipleTimes || false);
        setRequiresSpecialization(initialFeatData.requiresSpecialization || '');
        setEffectsText(initialFeatData.effectsText || '');

        const prereqs = initialFeatData.prerequisites;
        setPrereqBab(prereqs?.bab?.toString() || '');
        setPrereqCasterLevel(prereqs?.casterLevel?.toString() || '');
        setPrereqClassId(prereqs?.classLevel?.classId || NONE_VALUE);
        setPrereqClassLevel(prereqs?.classLevel?.level.toString() || '');
        setPrereqRaceId(prereqs?.raceId || NONE_VALUE);
        setPrereqAlignment(prereqs?.alignment || NONE_VALUE);
        
        const loadedPrereqs: PrerequisiteListItem[] = [];
        if (prereqs?.abilities) {
          for (const [ability, score] of Object.entries(prereqs.abilities)) {
            const abilityLabel = abilityOptions.find(opt => opt.value === ability)?.label || ability;
            loadedPrereqs.push({ tempId: crypto.randomUUID(), type: 'ability', itemId: ability, itemLabel: abilityLabel, value: score });
          }
        }
        if (prereqs?.skills) { // prereqs.skills contains {id: skillId, ranks: number}
          prereqs.skills.forEach(skillReq => {
            const skillLabel = allSkills.find(s => s.value === skillReq.id)?.label || skillReq.id;
            loadedPrereqs.push({ tempId: crypto.randomUUID(), type: 'skill', itemId: skillReq.id, itemLabel: skillLabel, value: skillReq.ranks });
          });
        }
        if (prereqs?.feats) { // prereqs.feats is an array of feat definition IDs
          prereqs.feats.forEach(featId => {
            const featLabel = allFeats.find(f => f.value === featId)?.label || featId; // Use predefined feats for label
            loadedPrereqs.push({ tempId: crypto.randomUUID(), type: 'feat', itemId: featId, itemLabel: featLabel });
          });
        }
        setPrerequisitesList(loadedPrereqs);
      } else {
        setFeatName('');
        setDescription('');
        setCanTakeMultipleTimes(false);
        setRequiresSpecialization('');
        setEffectsText('');
        setPrereqBab('');
        setPrereqCasterLevel('');
        setPrereqClassId(NONE_VALUE);
        setPrereqClassLevel('');
        setPrereqRaceId(NONE_VALUE);
        setPrereqAlignment(NONE_VALUE);
        setPrerequisitesList([]);
      }
      setNewPrereqType('');
      setNewPrereqItemId('');
      setNewPrereqValue('');
    }
  }, [isOpen, initialFeatData, allFeats, allSkills]);

  const handleAddPrerequisite = () => {
    if (!newPrereqType || !newPrereqItemId) {
      alert('Please select a prerequisite type and item.');
      return;
    }
    let itemLabel = '';
    let value: number | undefined = undefined;

    if (newPrereqType === 'ability') {
      const abilityOpt = abilityOptions.find(opt => opt.value === newPrereqItemId);
      itemLabel = abilityOpt ? abilityOpt.label : newPrereqItemId;
      value = parseInt(newPrereqValue, 10);
      if (isNaN(value) || value <= 0) {
        alert('Please enter a valid positive ability score.');
        return;
      }
    } else if (newPrereqType === 'skill') { // newPrereqItemId is skill ID
      const skillOpt = allSkills.find(opt => opt.value === newPrereqItemId);
      itemLabel = skillOpt ? skillOpt.label : newPrereqItemId;
      value = parseInt(newPrereqValue, 10);
      if (isNaN(value) || value <= 0) {
        alert('Please enter valid positive skill ranks.');
        return;
      }
    } else if (newPrereqType === 'feat') { // newPrereqItemId is feat definition ID
      const featOpt = allFeats.find(opt => opt.value === newPrereqItemId);
      itemLabel = featOpt ? featOpt.label : newPrereqItemId;
    }

    setPrerequisitesList(prev => [...prev, { tempId: crypto.randomUUID(), type: newPrereqType, itemId: newPrereqItemId, itemLabel, value }]);
    setNewPrereqItemId('');
    setNewPrereqValue('');
  };

  const handleRemovePrerequisite = (tempIdToRemove: string) => {
    setPrerequisitesList(prev => prev.filter(p => p.tempId !== tempIdToRemove));
  };

  const handleSaveFeat = () => {
    if (featName.trim() === '') {
      alert('Feat name cannot be empty.');
      return;
    }

    const finalStructuredPrerequisites: FeatPrerequisiteDetails = {};
    if (prereqBab.trim() !== '' && !isNaN(parseInt(prereqBab, 10))) finalStructuredPrerequisites.bab = parseInt(prereqBab, 10);
    if (prereqCasterLevel.trim() !== '' && !isNaN(parseInt(prereqCasterLevel, 10))) finalStructuredPrerequisites.casterLevel = parseInt(prereqCasterLevel, 10);
    if (prereqClassId !== NONE_VALUE && prereqClassId.trim() !== '' && prereqClassLevel.trim() !== '' && !isNaN(parseInt(prereqClassLevel, 10))) {
        finalStructuredPrerequisites.classLevel = { classId: prereqClassId, level: parseInt(prereqClassLevel, 10) };
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
      } else if (p.type === 'skill' && p.value !== undefined) { // p.itemId is skill ID
        if (!finalStructuredPrerequisites.skills) finalStructuredPrerequisites.skills = [];
        finalStructuredPrerequisites.skills.push({ id: p.itemId, ranks: p.value });
      } else if (p.type === 'feat') { // p.itemId is feat definition ID
        if (!finalStructuredPrerequisites.feats) finalStructuredPrerequisites.feats = [];
        finalStructuredPrerequisites.feats.push(p.itemId);
      }
    });

    const featDefinition: FeatDefinitionJsonData & { isCustom: true } = {
      value: initialFeatData?.value || crypto.randomUUID(),
      label: featName.trim(),
      description: description.trim() || undefined,
      prerequisites: Object.keys(finalStructuredPrerequisites).length > 0 || prerequisitesList.length > 0 ? finalStructuredPrerequisites : undefined,
      effectsText: effectsText.trim() || undefined,
      canTakeMultipleTimes,
      requiresSpecialization: requiresSpecialization.trim() || undefined,
      isCustom: true,
      // Effects object could be built here if editable
    };

    onSave(featDefinition);
    onOpenChange(false);
  };

  const isAddPrerequisiteDisabled = React.useMemo(() => {
    if (!newPrereqType) return true;
    if (!newPrereqItemId) return true;
    if ((newPrereqType === 'ability' || newPrereqType === 'skill')) {
      const numValue = parseInt(newPrereqValue, 10);
      if (isNaN(numValue) || numValue <= 0) return true;
    }
    return false;
  }, [newPrereqType, newPrereqItemId, newPrereqValue]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif">
            {isEditing ? <Pencil className="mr-2 h-6 w-6 text-primary" /> : <PlusCircle className="mr-2 h-6 w-6 text-primary" />}
            {isEditing ? 'Edit Custom Feat Definition' : 'Add Custom Feat Definition'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? `Modify the definition of ${initialFeatData?.label}.` : 'Define a new custom feat template.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] p-1">
          <div className="space-y-4 p-4">
            <div className="space-y-1">
              <Label htmlFor="custom-feat-name">Feat Name (Label)</Label>
              <Input
                id="custom-feat-name"
                value={featName}
                onChange={(e) => setFeatName(e.target.value)}
                placeholder="e.g., Mighty Cleave"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="custom-feat-description">Description</Label>
              <Textarea
                id="custom-feat-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this feat does."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="custom-feat-multiple-times"
                checked={canTakeMultipleTimes}
                onCheckedChange={(checked) => setCanTakeMultipleTimes(checked as boolean)}
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
              />
              <p className="text-xs text-muted-foreground">If this feat needs a choice like 'Weapon Focus (Longsword)', enter 'weapon' here.</p>
            </div>

            <Separator className="my-6" />
            <h3 className="text-md font-semibold text-foreground mb-2">Structured Prerequisites</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="prereq-bab">Base Attack Bonus (BAB)</Label>
                <Input id="prereq-bab" type="number" value={prereqBab} onChange={(e) => setPrereqBab(e.target.value)} placeholder="e.g., 1" min="0"/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="prereq-caster-level">Caster Level</Label>
                <Input id="prereq-caster-level" type="number" value={prereqCasterLevel} onChange={(e) => setPrereqCasterLevel(e.target.value)} placeholder="e.g., 1" min="0" />
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
                <Input 
                  id="prereq-class-level" 
                  type="number" 
                  value={prereqClassLevel} 
                  onChange={(e) => setPrereqClassLevel(e.target.value)} 
                  placeholder="e.g., 1" 
                  min="1"
                  disabled={prereqClassId === NONE_VALUE || prereqClassId === ""}
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
                  <Select value={newPrereqType} onValueChange={(val) => { setNewPrereqType(val as any); setNewPrereqItemId(''); setNewPrereqValue(''); }}>
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
                      <Select value={newPrereqItemId} onValueChange={setNewPrereqItemId}>
                        <SelectTrigger><SelectValue placeholder="Select Ability..." /></SelectTrigger>
                        <SelectContent>
                          {abilityOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="new-prereq-ability-value">Min Score</Label>
                      <Input id="new-prereq-ability-value" type="number" value={newPrereqValue} onChange={e => setNewPrereqValue(e.target.value)} placeholder="e.g., 13" min="1" />
                    </div>
                  </>
                )}
                {newPrereqType === 'skill' && (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="new-prereq-skill-item">Skill</Label>
                      <ComboboxPrimitive
                        options={allSkills} // {value: skillId, label: skillName}
                        value={newPrereqItemId} // skillId
                        onChange={setNewPrereqItemId}
                        placeholder="Select Skill..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="new-prereq-skill-value">Min Ranks</Label>
                      <Input id="new-prereq-skill-value" type="number" value={newPrereqValue} onChange={e => setNewPrereqValue(e.target.value)} placeholder="e.g., 5" min="1" />
                    </div>
                  </>
                )}
                {newPrereqType === 'feat' && (
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="new-prereq-feat-item">Feat</Label>
                    <ComboboxPrimitive
                      options={allFeats.map(f => ({ value: f.value, label: f.label }))} // {value: featDefId, label: featName}
                      value={newPrereqItemId} // featDefId
                      onChange={setNewPrereqItemId}
                      placeholder="Select Prerequisite Feat..."
                    />
                  </div>
                )}
              </div>
              {newPrereqType && (
                <Button onClick={handleAddPrerequisite} size="sm" variant="outline" type="button" disabled={isAddPrerequisiteDisabled}>
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
                      <Badge variant="secondary" className="mr-2 capitalize">{p.type}</Badge>
                      <span className="font-medium">{p.itemLabel}</span>
                      {p.value !== undefined && <span className="text-muted-foreground"> (Min: {p.value}{p.type === 'skill' ? ' Ranks' : ''})</span>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemovePrerequisite(p.tempId)} type="button">
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
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
            Cancel
          </Button>
          <Button onClick={handleSaveFeat} type="button">{isEditing ? 'Save Changes to Definition' : 'Save Custom Feat Definition'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
