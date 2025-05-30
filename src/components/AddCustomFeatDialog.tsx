
'use client';

import * as React from 'react';
import type { Feat, FeatPrerequisiteDetails, AbilityName, FeatDefinitionJsonData } from '@/types/character';
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
import { PlusCircle, Pencil } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComboboxPrimitive, type ComboboxOption } from '@/components/ui/combobox';
import { Separator } from '@/components/ui/separator';

interface AddCustomFeatDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (featData: Partial<Feat> & { name: string }) => void;
  initialFeatData?: Feat;
  allFeats: readonly FeatDefinitionJsonData[];
  allSkills: readonly ComboboxOption[];
}

const abilityOptions: Array<{ value: Exclude<AbilityName, 'none'> | '__NONE__'; label: string }> = [
  { value: 'strength', label: 'Strength (STR)' },
  { value: 'dexterity', label: 'Dexterity (DEX)' },
  { value: 'constitution', label: 'Constitution (CON)' },
  { value: 'intelligence', label: 'Intelligence (INT)' },
  { value: 'wisdom', label: 'Wisdom (WIS)' },
  { value: 'charisma', label: 'Charisma (CHA)' },
];

const NONE_ABILITY_VALUE = "__NONE__"; // Unique value for "None"

export function AddCustomFeatDialog({
  isOpen,
  onOpenChange,
  onSave,
  initialFeatData,
  allFeats,
  allSkills,
}: AddCustomFeatDialogProps) {
  const [featName, setFeatName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [canTakeMultipleTimes, setCanTakeMultipleTimes] = React.useState(false);
  const [requiresSpecialization, setRequiresSpecialization] = React.useState('');
  const [effectsText, setEffectsText] = React.useState('');

  // Structured Prerequisites State
  const [prereqBab, setPrereqBab] = React.useState('');
  const [prereqAbilityName, setPrereqAbilityName] = React.useState<Exclude<AbilityName, 'none'> | typeof NONE_ABILITY_VALUE>(NONE_ABILITY_VALUE);
  const [prereqAbilityScore, setPrereqAbilityScore] = React.useState('');
  const [prereqSkillId, setPrereqSkillId] = React.useState('');
  const [prereqSkillRanks, setPrereqSkillRanks] = React.useState('');
  const [prereqFeatId, setPrereqFeatId] = React.useState('');
  const [prereqCasterLevel, setPrereqCasterLevel] = React.useState('');
  const [prereqSpecialText, setPrereqSpecialText] = React.useState('');

  const isEditing = !!initialFeatData;

  React.useEffect(() => {
    if (isOpen) {
      if (initialFeatData) {
        setFeatName(initialFeatData.name || '');
        setDescription(initialFeatData.description || '');
        setCanTakeMultipleTimes(initialFeatData.canTakeMultipleTimes || false);
        setRequiresSpecialization(initialFeatData.requiresSpecialization || '');
        setEffectsText(initialFeatData.effectsText || '');

        // Populate structured prerequisites
        const prereqs = initialFeatData.prerequisites;
        setPrereqBab(prereqs?.bab?.toString() || '');
        if (prereqs?.abilities && Object.keys(prereqs.abilities).length > 0) {
          const firstAbility = Object.keys(prereqs.abilities)[0] as Exclude<AbilityName, 'none'>;
          setPrereqAbilityName(firstAbility);
          setPrereqAbilityScore(prereqs.abilities[firstAbility]?.toString() || '');
        } else {
          setPrereqAbilityName(NONE_ABILITY_VALUE);
          setPrereqAbilityScore('');
        }
        setPrereqSkillId(prereqs?.skills?.[0]?.id || '');
        setPrereqSkillRanks(prereqs?.skills?.[0]?.ranks?.toString() || '');
        setPrereqFeatId(prereqs?.feats?.[0] || '');
        setPrereqCasterLevel(prereqs?.casterLevel?.toString() || '');
        setPrereqSpecialText(prereqs?.special || '');
      } else {
        // Reset all fields for new feat
        setFeatName('');
        setDescription('');
        setCanTakeMultipleTimes(false);
        setRequiresSpecialization('');
        setEffectsText('');
        setPrereqBab('');
        setPrereqAbilityName(NONE_ABILITY_VALUE);
        setPrereqAbilityScore('');
        setPrereqSkillId('');
        setPrereqSkillRanks('');
        setPrereqFeatId('');
        setPrereqCasterLevel('');
        setPrereqSpecialText('');
      }
    }
  }, [isOpen, initialFeatData]);

  const handleSaveFeat = () => {
    if (featName.trim() === '') {
      alert('Feat name cannot be empty.'); // Simple validation
      return;
    }

    const structuredPrerequisites: FeatPrerequisiteDetails = {};
    if (prereqBab.trim() !== '') structuredPrerequisites.bab = parseInt(prereqBab, 10);
    if (prereqAbilityName && prereqAbilityName !== NONE_ABILITY_VALUE && prereqAbilityScore.trim() !== '') {
      structuredPrerequisites.abilities = { [prereqAbilityName as Exclude<AbilityName, 'none'>]: parseInt(prereqAbilityScore, 10) };
    }
    if (prereqSkillId && prereqSkillRanks.trim() !== '') {
      structuredPrerequisites.skills = [{ id: prereqSkillId, ranks: parseInt(prereqSkillRanks, 10) }];
    }
    if (prereqFeatId) {
      structuredPrerequisites.feats = [prereqFeatId];
    }
    if (prereqCasterLevel.trim() !== '') structuredPrerequisites.casterLevel = parseInt(prereqCasterLevel, 10);
    if (prereqSpecialText.trim() !== '') structuredPrerequisites.special = prereqSpecialText.trim();

    onSave({
      id: initialFeatData?.id,
      name: featName.trim(),
      description: description.trim() || undefined,
      prerequisites: Object.keys(structuredPrerequisites).length > 0 ? structuredPrerequisites : undefined,
      effectsText: effectsText.trim() || undefined,
      canTakeMultipleTimes,
      requiresSpecialization: requiresSpecialization.trim() || undefined,
      isCustom: true,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif">
            {isEditing ? <Pencil className="mr-2 h-6 w-6 text-primary" /> : <PlusCircle className="mr-2 h-6 w-6 text-primary" />}
            {isEditing ? 'Edit Custom Feat' : 'Add Custom Feat'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? `Modify the details of ${initialFeatData?.name}.` : 'Define a new custom feat with structured prerequisites.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-2">
          <div className="space-y-4 p-4">
            {/* Core Feat Info */}
            <div className="space-y-1">
              <Label htmlFor="custom-feat-name">Feat Name</Label>
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
            <h3 className="text-md font-semibold text-foreground">Structured Prerequisites</h3>
            
            {/* Structured Prerequisites Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="prereq-bab">Base Attack Bonus (BAB)</Label>
                <Input id="prereq-bab" type="number" value={prereqBab} onChange={(e) => setPrereqBab(e.target.value)} placeholder="e.g., 1" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="prereq-caster-level">Caster Level</Label>
                <Input id="prereq-caster-level" type="number" value={prereqCasterLevel} onChange={(e) => setPrereqCasterLevel(e.target.value)} placeholder="e.g., 1" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div className="space-y-1">
                <Label htmlFor="prereq-ability-name">Ability Score</Label>
                <Select value={prereqAbilityName} onValueChange={(val) => setPrereqAbilityName(val as Exclude<AbilityName, 'none'> | typeof NONE_ABILITY_VALUE)}>
                  <SelectTrigger><SelectValue placeholder="Select Ability..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_ABILITY_VALUE}>None</SelectItem>
                    {abilityOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Input id="prereq-ability-score" type="number" value={prereqAbilityScore} onChange={(e) => setPrereqAbilityScore(e.target.value)} placeholder="Min Score" disabled={prereqAbilityName === NONE_ABILITY_VALUE} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
               <div className="space-y-1">
                <Label htmlFor="prereq-skill-id">Skill</Label>
                <ComboboxPrimitive
                  options={allSkills}
                  value={prereqSkillId}
                  onChange={setPrereqSkillId}
                  placeholder="Select Skill..."
                  searchPlaceholder="Search skills..."
                  emptyPlaceholder="No skill found."
                />
              </div>
              <div className="space-y-1">
                 <Input id="prereq-skill-ranks" type="number" value={prereqSkillRanks} onChange={(e) => setPrereqSkillRanks(e.target.value)} placeholder="Min Ranks" disabled={!prereqSkillId} />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="prereq-feat-id">Feat</Label>
              <ComboboxPrimitive
                  options={allFeats.map(f => ({value: f.value, label: f.label}))}
                  value={prereqFeatId}
                  onChange={setPrereqFeatId}
                  placeholder="Select Prerequisite Feat..."
                  searchPlaceholder="Search feats..."
                  emptyPlaceholder="No feat found."
                />
            </div>

            <div className="space-y-1">
              <Label htmlFor="prereq-special-text">Special Prerequisite Text</Label>
              <Input id="prereq-special-text" value={prereqSpecialText} onChange={(e) => setPrereqSpecialText(e.target.value)} placeholder="e.g., Wild Shape ability" />
            </div>
            
            {/* Effects section (textual for now, can be expanded later) */}
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

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
            Cancel
          </Button>
          <Button onClick={handleSaveFeat} type="button">{isEditing ? 'Save Changes' : 'Save Custom Feat'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

