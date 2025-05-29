
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SkillInfoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  skillName: string;
  skillDescription?: string;
}

export function SkillInfoDialog({
  isOpen,
  onOpenChange,
  skillName,
  skillDescription,
}: SkillInfoDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif">
            <ScrollText className="mr-2 h-6 w-6 text-primary" />
            {skillName}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4 my-4">
          <DialogDescription className="whitespace-pre-wrap">
            {skillDescription || 'No description available for this skill.'}
          </DialogDescription>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    