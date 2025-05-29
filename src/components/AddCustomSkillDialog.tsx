
'use client';

import * as React from 'react';
import type { AbilityName, CustomSynergyRule } from '@/types/character';
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
import { PlusCircle, Pencil, Trash2, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddCustomSkillDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (skillData: { 
    id?: string; 
    name: string; 
    keyAbility: AbilityName; 
    isClassSkill: boolean;
    providesSynergies: CustomSynergyRule[];
  }) => void;
  initialSkillData?: { 
    id: string; 
    name: string; 
    keyAbility: AbilityName; 
    isClassSkill: boolean;
    providesSynergies?: CustomSynergyRule[];
  };
}

const keyAbilityOptions: Array<{ value: AbilityName; label: string }> = [
  { value: 'strength', label: 'Strength (STR)' },
  { value: 'dexterity', label: 'Dexterity (DEX)' },
  { value: 'constitution', label: 'Constitution (CON)' },
  { value: 'intelligence', label: 'Intelligence (INT)' },
  { value: 'wisdom', label: 'Wisdom (WIS)' },
  { value: 'charisma', label: 'Charisma (CHA)' },
];

export function AddCustomSkillDialog({
  isOpen,
  onOpenChange,
  onSave,
  initialSkillData,
}: AddCustomSkillDialogProps) {
  const [skillName, setSkillName] = React.useState('');
  const [selectedKeyAbility, setSelectedKeyAbility] = React.useState<AbilityName>('intelligence');
  const [isClassSkill, setIsClassSkill] = React.useState(false);
  const [synergyRules, setSynergyRules] = React.useState<CustomSynergyRule[]>([]);

  // State for the "Add New Synergy Rule" form
  const [newSynergyTargetSkill, setNewSynergyTargetSkill] = React.useState('');
  const [newSynergyRanksRequired, setNewSynergyRanksRequired] = React.useState(5);
  const [newSynergyBonus, setNewSynergyBonus] = React.useState(2);
  const [newSynergyDescription, setNewSynergyDescription] = React.useState('');

  const isEditing = !!initialSkillData;

  React.useEffect(() => {
    if (isOpen) {
      if (initialSkillData) {
        setSkillName(initialSkillData.name);
        setSelectedKeyAbility(initialSkillData.keyAbility);
        setIsClassSkill(initialSkillData.isClassSkill);
        setSynergyRules(initialSkillData.providesSynergies || []);
      } else {
        // Reset for new skill
        setSkillName('');
        setSelectedKeyAbility('intelligence');
        setIsClassSkill(false);
        setSynergyRules([]);
      }
      // Reset new synergy form fields
      setNewSynergyTargetSkill('');
      setNewSynergyRanksRequired(5);
      setNewSynergyBonus(2);
      setNewSynergyDescription('');
    }
  }, [isOpen, initialSkillData]);

  const handleAddSynergyRule = () => {
    if (!newSynergyTargetSkill.trim() || newSynergyRanksRequired <= 0 || newSynergyBonus === 0) {
      alert('Please fill in Target Skill, Ranks Required (>0), and Bonus (not 0) for the synergy rule.');
      return;
    }
    setSynergyRules(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        targetSkillName: newSynergyTargetSkill.trim(),
        ranksInThisSkillRequired: newSynergyRanksRequired,
        bonusGranted: newSynergyBonus,
        description: newSynergyDescription.trim() || undefined,
      }
    ]);
    // Reset synergy form
    setNewSynergyTargetSkill('');
    setNewSynergyRanksRequired(5);
    setNewSynergyBonus(2);
    setNewSynergyDescription('');
  };

  const handleRemoveSynergyRule = (ruleId: string) => {
    setSynergyRules(prev => prev.filter(rule => rule.id !== ruleId));
  };

  const handleSaveSkill = () => {
    if (skillName.trim() === '') {
      alert('Skill name cannot be empty.');
      return;
    }
    onSave({ 
      id: initialSkillData?.id, 
      name: skillName.trim(), 
      keyAbility: selectedKeyAbility, 
      isClassSkill,
      providesSynergies: synergyRules,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif">
            {isEditing ? <Pencil className="mr-2 h-6 w-6 text-primary" /> : <PlusCircle className="mr-2 h-6 w-6 text-primary" />}
            {isEditing ? 'Edit Custom Skill' : 'Add Custom Skill'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? `Modify the details of ${initialSkillData?.name}.` : 'Define a new skill for your character, including any synergies it provides.'}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
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

            <Separator className="my-6" />

            <div>
              <h3 className="text-md font-semibold mb-2 flex items-center">
                <Sparkles className="mr-2 h-5 w-5 text-primary/80" />
                Synergies Provided by this Skill
              </h3>
              <div className="p-3 border rounded-md bg-muted/20 space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="synergy-target-skill">Target Skill Name</Label>
                  <Input 
                    id="synergy-target-skill" 
                    value={newSynergyTargetSkill} 
                    onChange={(e) => setNewSynergyTargetSkill(e.target.value)}
                    placeholder="e.g., Spellcraft" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="synergy-ranks-required">Ranks in this Skill Required</Label>
                    <Input 
                      id="synergy-ranks-required" 
                      type="number" 
                      value={newSynergyRanksRequired} 
                      onChange={(e) => setNewSynergyRanksRequired(parseInt(e.target.value,10) || 0)} 
                      min="1"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="synergy-bonus-granted">Bonus Granted</Label>
                    <Input 
                      id="synergy-bonus-granted" 
                      type="number" 
                      value={newSynergyBonus} 
                      onChange={(e) => setNewSynergyBonus(parseInt(e.target.value,10) || 0)} 
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="synergy-description">Synergy Description (Optional)</Label>
                  <Input 
                    id="synergy-description" 
                    value={newSynergyDescription} 
                    onChange={(e) => setNewSynergyDescription(e.target.value)}
                    placeholder="e.g., +2 to identify magic items" 
                  />
                </div>
                <Button onClick={handleAddSynergyRule} size="sm" variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Synergy Rule
                </Button>
              </div>

              {synergyRules.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label>Defined Synergy Rules:</Label>
                  {synergyRules.map(rule => (
                    <div key={rule.id} className="flex items-center justify-between p-2 border rounded-md text-xs bg-background">
                      <div>
                        <p>Grants <span className="font-semibold text-accent">{rule.bonusGranted > 0 ? '+' : ''}{rule.bonusGranted}</span> to <span className="font-semibold">{rule.targetSkillName}</span></p>
                        <p className="text-muted-foreground">Requires <span className="font-semibold">{rule.ranksInThisSkillRequired}</span> ranks in this custom skill.</p>
                        {rule.description && <p className="text-muted-foreground italic">"{rule.description}"</p>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveSynergyRule(rule.id)}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveSkill}>{isEditing ? 'Save Changes' : 'Save Skill'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
