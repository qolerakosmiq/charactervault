
'use client';

import * as React from 'react';
import type { Feat } from '@/types/character';
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

interface AddCustomFeatDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (featData: Partial<Feat> & { name: string }) => void; // Ensure name is always present
  initialFeatData?: Feat;
}

export function AddCustomFeatDialog({
  isOpen,
  onOpenChange,
  onSave,
  initialFeatData,
}: AddCustomFeatDialogProps) {
  const [featName, setFeatName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [prerequisitesText, setPrerequisitesText] = React.useState('');
  const [effectsText, setEffectsText] = React.useState('');
  const [canTakeMultipleTimes, setCanTakeMultipleTimes] = React.useState(false);
  const [requiresSpecialization, setRequiresSpecialization] = React.useState('');

  const isEditing = !!initialFeatData;

  React.useEffect(() => {
    if (isOpen) {
      if (initialFeatData) {
        setFeatName(initialFeatData.name || '');
        setDescription(initialFeatData.description || '');
        setPrerequisitesText(initialFeatData.prerequisitesText || '');
        setEffectsText(initialFeatData.effectsText || '');
        setCanTakeMultipleTimes(initialFeatData.canTakeMultipleTimes || false);
        setRequiresSpecialization(initialFeatData.requiresSpecialization || '');
      } else {
        setFeatName('');
        setDescription('');
        setPrerequisitesText('');
        setEffectsText('');
        setCanTakeMultipleTimes(false);
        setRequiresSpecialization('');
      }
    }
  }, [isOpen, initialFeatData]);

  const handleSaveFeat = () => {
    if (featName.trim() === '') {
      alert('Feat name cannot be empty.');
      return;
    }
    onSave({
      id: initialFeatData?.id, // Pass ID if editing
      name: featName.trim(),
      description: description.trim() || undefined,
      prerequisitesText: prerequisitesText.trim() || undefined,
      effectsText: effectsText.trim() || undefined,
      canTakeMultipleTimes,
      requiresSpecialization: requiresSpecialization.trim() || undefined,
      isCustom: true,
      // Structured prerequisites and effects are not set here
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif">
            {isEditing ? <Pencil className="mr-2 h-6 w-6 text-primary" /> : <PlusCircle className="mr-2 h-6 w-6 text-primary" />}
            {isEditing ? 'Edit Custom Feat' : 'Add Custom Feat'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? `Modify the details of ${initialFeatData?.name}.` : 'Define a new custom feat.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-2">
          <div className="space-y-4 p-4">
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

            <div className="space-y-1">
              <Label htmlFor="custom-feat-prerequisites">Prerequisites (Textual)</Label>
              <Textarea
                id="custom-feat-prerequisites"
                value={prerequisitesText}
                onChange={(e) => setPrerequisitesText(e.target.value)}
                placeholder="Describe any prerequisites (e.g., Str 15, Power Attack)."
                rows={2}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="custom-feat-effects">Effects (Textual)</Label>
              <Textarea
                id="custom-feat-effects"
                value={effectsText}
                onChange={(e) => setEffectsText(e.target.value)}
                placeholder="Describe the feat's effects (e.g., +2 damage with greatswords)."
                rows={2}
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
