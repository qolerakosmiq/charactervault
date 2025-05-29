
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

interface InfoDisplayDialogProps { // Renamed from SkillInfoDialogProps
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string; // Renamed from skillName
  content?: string; // Renamed from skillDescription
}

export function InfoDisplayDialog({ // Renamed from SkillInfoDialog
  isOpen,
  onOpenChange,
  title,
  content,
}: InfoDisplayDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif">
            <ScrollText className="mr-2 h-6 w-6 text-primary" />
            {title || 'Information'} {/* Use generalized title */}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4 my-4">
          <DialogDescription className="whitespace-pre-wrap">
            {content || 'No description available.'} {/* Use generalized content */}
          </DialogDescription>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    