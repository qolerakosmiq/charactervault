
'use client';

import *as React from 'react';
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
import { ComboboxPrimitive, type ComboboxOption } from '@/components/ui/combobox';
import { Loader2, CheckCircle } from 'lucide-react';
import type { FeatDefinitionJsonData } from '@/types/character-core';
import { useI18n } from '@/context/I18nProvider';
import { useToast } from '@/hooks/use-toast';

interface SpecializationInputDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  featDefinition: FeatDefinitionJsonData | null;
  onSave: (specializationDetail: string) => void;
  allSkills: ComboboxOption[];
  allMagicSchools: ComboboxOption[];
  initialSpecializationDetail?: string; // New prop
}

export function SpecializationInputDialog({
  isOpen,
  onOpenChange,
  featDefinition,
  onSave,
  allSkills,
  allMagicSchools,
  initialSpecializationDetail, // Destructure new prop
}: SpecializationInputDialogProps) {
  const { translations, isLoading: translationsLoading } = useI18n();
  const { toast } = useToast();
  const [specializationDetail, setSpecializationDetail] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setSpecializationDetail(initialSpecializationDetail || ''); // Use initial value if provided
    }
  }, [isOpen, initialSpecializationDetail]);

  const handleSave = () => {
    if (!featDefinition) return;
    if (featDefinition.requiresSpecialization && !specializationDetail.trim()) {
      toast({
        title: translations?.UI_STRINGS.toastErrorTitle || "Error",
        description: translations?.UI_STRINGS.specializationErrorRequired || "Specialization is required for this feat.",
        variant: "destructive",
      });
      return;
    }
    onSave(specializationDetail.trim());
    onOpenChange(false);
  };

  if (translationsLoading || !translations || !featDefinition) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center font-serif">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {translations?.UI_STRINGS.loadingText || "Loading..."}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p>{translations?.UI_STRINGS.loadingText || "Loading specialization options..."}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { UI_STRINGS } = translations;
  const featName = featDefinition?.label || 'Unknown Feat';
  const specializationType = featDefinition?.requiresSpecialization;

  let inputField: React.ReactNode;
  let placeholderText = '';

  switch (specializationType) {
    case 'skill':
      placeholderText = UI_STRINGS.specializationSelectPlaceholderSkill || "Select skill...";
      inputField = (
        <ComboboxPrimitive
          options={allSkills}
          value={specializationDetail}
          onChange={setSpecializationDetail}
          placeholder={placeholderText}
          searchPlaceholder={UI_STRINGS.searchPlaceholder || "Search..."}
          emptyPlaceholder={UI_STRINGS.noOptionFoundPlaceholder || "No option found."}
          triggerClassName="h-10"
        />
      );
      break;
    case 'school of magic':
      placeholderText = UI_STRINGS.specializationSelectPlaceholderSchool || "Select school of magic...";
      inputField = (
        <ComboboxPrimitive
          options={allMagicSchools}
          value={specializationDetail}
          onChange={setSpecializationDetail}
          placeholder={placeholderText}
          searchPlaceholder={UI_STRINGS.searchPlaceholder || "Search..."}
          emptyPlaceholder={UI_STRINGS.noOptionFoundPlaceholder || "No option found."}
          triggerClassName="h-10"
        />
      );
      break;
    case 'weapon':
    default: // Default to text input for other types or if not specified
      placeholderText = UI_STRINGS.specializationInputPlaceholderWeapon || "Enter weapon name (e.g., Longsword)";
      if (specializationType && specializationType !== 'weapon') {
        placeholderText = `Enter ${specializationType}`;
      }
      inputField = (
        <Input
          value={specializationDetail}
          onChange={(e) => setSpecializationDetail(e.target.value)}
          placeholder={placeholderText}
          className="h-10"
        />
      );
      break;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {(UI_STRINGS.specializationDialogTitle || "Feat Specialization: {featName}").replace("{featName}", featName)}
          </DialogTitle>
          <DialogDescription>
            {(UI_STRINGS.specializationDialogDescription || "Please provide the required specialization for the feat '{featName}'.").replace("{featName}", featName)}
            {specializationType && <span className="text-muted-foreground text-xs"> ({specializationType})</span>}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="specialization-input">
            {UI_STRINGS.featSpecializationLabel || "Specialization"}
            {specializationType && <span className="text-muted-foreground text-xs"> ({specializationType})</span>}
          </Label>
          {inputField}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {UI_STRINGS.formButtonCancel || "Cancel"}
          </Button>
          <Button type="button" onClick={handleSave} disabled={!specializationDetail.trim()}>
            <CheckCircle className="mr-2 h-4 w-4" />
            {UI_STRINGS.specializationSaveButton || "Confirm Specialization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
