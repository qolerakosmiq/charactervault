
'use client';

import * as React from 'react';
import type { AbilityName, CustomSynergyRule } from '@/types/character';
import type { CustomSkillDefinition } from '@/lib/definitions-store';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ComboboxPrimitive } from '@/components/ui/combobox';
import { PlusCircle, Pencil, Trash2, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

interface AddCustomSkillDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (skillDefData: CustomSkillDefinition) => void; // Saves the definition to global store
  initialSkillData?: CustomSkillDefinition; // The full definition for editing
  allSkills: Array<{value: string; label: string}>; // For synergy target dropdown (skill IDs and names)
}

const keyAbilityOptions: Array<{ value: AbilityName; label: string }> = [
  { value: 'strength', label: 'Strength (STR)' },
  { value: 'dexterity', label: 'Dexterity (DEX)' },
  { value: 'constitution', label: 'Constitution (CON)' },
  { value: 'intelligence', label: 'Intelligence (INT)' },
  { value: 'wisdom', label: 'Wisdom (WIS)' },
  { value: 'charisma', label: 'Charisma (CHA)' },
  { value: 'none', label: 'None' },
];

export function AddCustomSkillDialog({
  isOpen,
  onOpenChange,
  onSave,
  initialSkillData,
  allSkills, // These are {value: skillId, label: skillName}
}: AddCustomSkillDialogProps) {
  const [skillName, setSkillName] = React.useState('');
  const [selectedKeyAbility, setSelectedKeyAbility] = React.useState<AbilityName>('intelligence');
  // isClassSkill is NOT part of the definition; it's per-character based on class. Removed from here.
  const [synergyRules, setSynergyRules] = React.useState<CustomSynergyRule[]>([]);
  const [description, setDescription] = React.useState('');

  const [newSynergyTargetSkillId, setNewSynergyTargetSkillId] = React.useState(''); // Stores ID of target skill
  const [newSynergyRanksRequired, setNewSynergyRanksRequired] = React.useState(5);
  const [newSynergyBonus, setNewSynergyBonus] = React.useState(2);

  const isEditing = !!initialSkillData;

  const availableTargetSkillsOptions = React.useMemo(() => {
    return allSkills
      .filter(skill => skill.value !== initialSkillData?.id) // skill.value is the ID
      .sort((a,b) => a.label.localeCompare(b.label));
  }, [allSkills, initialSkillData?.id]);

  React.useEffect(() => {
    if (isOpen) {
      if (initialSkillData) {
        setSkillName(initialSkillData.name);
        setSelectedKeyAbility(initialSkillData.keyAbility);
        setSynergyRules(initialSkillData.providesSynergies || []);
        setDescription(initialSkillData.description || '');
      } else {
        setSelectedKeyAbility('intelligence');
        setSkillName('');
        setSynergyRules([]);
        setDescription('');
      }
      setNewSynergyTargetSkillId('');
      setNewSynergyRanksRequired(5);
      setNewSynergyBonus(2);
    }
  }, [isOpen, initialSkillData]);

  const handleKeyAbilityChange = (value: string) => {
    setSelectedKeyAbility(value as AbilityName);
    // No need to manage isClassSkill here, as it's not part of the global definition
  };

  const handleAddSynergyRule = () => {
    if (!newSynergyTargetSkillId.trim() || newSynergyRanksRequired <= 0 || newSynergyBonus === 0) {
      alert('Please select a Target Skill and ensure Ranks Required (>0) and Bonus (not 0) are set for the synergy rule.');
      return;
    }
    setSynergyRules(prev => [
      ...prev,
      {
        id: crypto.randomUUID(), // Temp ID for list management in dialog
        targetSkillName: newSynergyTargetSkillId, // This stores the target skill ID
        ranksInThisSkillRequired: newSynergyRanksRequired,
        bonusGranted: newSynergyBonus,
      }
    ]);
    setNewSynergyTargetSkillId('');
    setNewSynergyRanksRequired(5);
    setNewSynergyBonus(2);
  };

  const handleRemoveSynergyRule = (ruleId: string) => {
    setSynergyRules(prev => prev.filter(rule => rule.id !== ruleId));
  };

  const handleSaveSkill = () => {
    if (skillName.trim() === '') {
      alert('Skill name cannot be empty.');
      return;
    }
    const skillDefinitionToSave: CustomSkillDefinition = {
      id: initialSkillData?.id || crypto.randomUUID(),
      name: skillName.trim(),
      keyAbility: selectedKeyAbility,
      providesSynergies: synergyRules,
      description: description.trim() || undefined,
    };
    onSave(skillDefinitionToSave);
    onOpenChange(false);
  };

  const getSkillLabelById = (id: string) => {
    const skill = allSkills.find(s => s.value === id); // s.value is ID
    return skill ? skill.label : 'Unknown Skill';
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif">
            {isEditing ? <Pencil className="mr-2 h-6 w-6 text-primary" /> : <PlusCircle className="mr-2 h-6 w-6 text-primary" />}
            {isEditing ? 'Edit Custom Skill Definition' : 'Add Custom Skill Definition'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? `Modify the definition of ${initialSkillData?.name}.` : 'Define a new skill template, its synergies, and description.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 p-4">
            <div className="space-y-1">
              <Label htmlFor="custom-skill-name">Skill Name</Label>
              <Input
                id="custom-skill-name"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="e.g., Arcane Linguistics"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="custom-skill-key-ability">Key Ability</Label>
              <Select
                value={selectedKeyAbility}
                onValueChange={handleKeyAbilityChange}
              >
                <SelectTrigger id="custom-skill-key-ability">
                  <SelectValue placeholder="Select key ability" />
                </SelectTrigger>
                <SelectContent>
                  {keyAbilityOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* "Is Class Skill" checkbox removed as it's not part of global definition */}

            <div className="space-y-1">
              <Label htmlFor="custom-skill-description">Skill Description</Label>
              <Textarea
                id="custom-skill-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this skill does, its uses, etc."
                rows={3}
              />
            </div>

            <Separator className="my-6" />

            <div>
              <h3 className="text-md font-semibold mb-2 flex items-center">
                <Sparkles className="mr-2 h-5 w-5 text-primary/80" />
                Synergies Provided by this Skill
              </h3>
              <div className="p-3 border rounded-md bg-muted/20 space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="synergy-target-skill">Target Skill to Grant Bonus To</Label>
                  <ComboboxPrimitive
                    options={availableTargetSkillsOptions} // {value: skillId, label: skillName}
                    value={newSynergyTargetSkillId} // Stores skillId
                    onChange={(value) => setNewSynergyTargetSkillId(value)}
                    placeholder="Select target skill"
                    searchPlaceholder="Search skills..."
                    emptyPlaceholder="No skill found."
                    isEditable={false}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="synergy-ranks-required">Ranks in *this* Custom Skill Required</Label>
                    <Input
                      id="synergy-ranks-required"
                      type="number"
                      value={newSynergyRanksRequired}
                      onChange={(e) => setNewSynergyRanksRequired(parseInt(e.target.value,10) || 0)}
                      min="1"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="synergy-bonus-granted">Bonus Granted to Target Skill</Label>
                    <Input
                      id="synergy-bonus-granted"
                      type="number"
                      value={newSynergyBonus}
                      onChange={(e) => setNewSynergyBonus(parseInt(e.target.value,10) || 0)}
                    />
                  </div>
                </div>
                <Button onClick={handleAddSynergyRule} size="sm" variant="outline" type="button">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Synergy Rule
                </Button>
              </div>

              {synergyRules.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label>Defined Synergy Rules (This skill grants...):</Label>
                  {synergyRules.map(rule => (
                    <div key={rule.id} className="flex items-center justify-between p-2 border rounded-md text-xs bg-background">
                      <div>
                        <p>Grants <span className="font-semibold text-accent">{rule.bonusGranted > 0 ? '+' : ''}{rule.bonusGranted}</span> bonus to <span className="font-semibold">{getSkillLabelById(rule.targetSkillName)}</span></p>
                        <p className="text-muted-foreground">When character has <span className="font-semibold">{rule.ranksInThisSkillRequired}</span> ranks in *this* custom skill.</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveSynergyRule(rule.id)} type="button">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
            Cancel
          </Button>
          <Button onClick={handleSaveSkill} type="button">{isEditing ? 'Save Definition Changes' : 'Save Skill Definition'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
