
'use client';

import * as React from 'react';
import type { AbilityName } from '@/types/character';
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
import { PlusCircle, Pencil } from 'lucide-react';

interface AddCustomSkillDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (skillData: { id?: string; name: string; keyAbility: AbilityName; isClassSkill: boolean }) => void;
  initialSkillData?: { id: string; name: string; keyAbility: AbilityName; isClassSkill: boolean };
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
}: AddCustomSkillDialogProps) {
  const [skillName, setSkillName] = React.useState('');
  const [selectedKeyAbility, setSelectedKeyAbility] = React.useState<AbilityName>('none');
  const [isClassSkill, setIsClassSkill] = React.useState(false);

  const isEditing = !!initialSkillData;

  React.useEffect(() => {
    if (isOpen) {
      if (initialSkillData) {
        setSkillName(initialSkillData.name);
        setSelectedKeyAbility(initialSkillData.keyAbility);
        setIsClassSkill(initialSkillData.isClassSkill);
      } else {
        setSkillName('');
        setSelectedKeyAbility('none');
        setIsClassSkill(false);
      }
    }
  }, [isOpen, initialSkillData]);

  const handleSaveSkill = () => {
    if (skillName.trim() === '') {
      // Basic validation, can be enhanced with toasts
      alert('Skill name cannot be empty.');
      return;
    }
    onSave({ 
      id: initialSkillData?.id, 
      name: skillName.trim(), 
      keyAbility: selectedKeyAbility, 
      isClassSkill 
    });
    onOpenChange(false); // Close dialog after save
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif">
            {isEditing ? <Pencil className="mr-2 h-6 w-6 text-primary" /> : <PlusCircle className="mr-2 h-6 w-6 text-primary" />}
            {isEditing ? 'Edit Custom Skill' : 'Add Custom Skill'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? `Modify the details of ${initialSkillData?.name}.` : 'Define a new skill for your character.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
              onValueChange={(value) => setSelectedKeyAbility(value as AbilityName)}
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
          <div className="flex items-center space-x-2">
            <Checkbox
              id="custom-skill-is-class"
              checked={isClassSkill}
              onCheckedChange={(checked) => setIsClassSkill(checked as boolean)}
            />
            <Label htmlFor="custom-skill-is-class" className="text-sm font-normal">
              Is Class Skill?
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveSkill}>{isEditing ? 'Save Changes' : 'Save Skill'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
