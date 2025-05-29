
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
import type { AbilityName } from '@/types/character';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface InfoDisplayDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  content?: string;
  abilityModifiers?: Array<{ ability: AbilityName; change: number }>;
  skillBonuses?: Array<{ skillName: string; bonus: number }>;
  // racialFeats?: Array<{ featName: string }>; // For future use
}

export function InfoDisplayDialog({
  isOpen,
  onOpenChange,
  title,
  content,
  abilityModifiers,
  skillBonuses,
}: InfoDisplayDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif">
            <ScrollText className="mr-2 h-6 w-6 text-primary" />
            {title || 'Information'}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4 my-2">
          {content && (
            <DialogDescription className="whitespace-pre-wrap text-sm">
              {content}
            </DialogDescription>
          )}

          {abilityModifiers && abilityModifiers.length > 0 && (
            <>
              {(content) && <Separator className="my-4" />}
              <div>
                <h3 className="text-md font-semibold mb-2 text-foreground">Ability Score Adjustments:</h3>
                <ul className="space-y-1 text-sm">
                  {abilityModifiers.map(({ ability, change }) => (
                    <li key={ability} className="flex justify-between">
                      <span className="capitalize">{ability}:</span>
                      <span
                        className={cn(
                          "font-bold",
                          change > 0 && "text-emerald-500",
                          change < 0 && "text-destructive",
                          change === 0 && "text-muted-foreground" 
                        )}
                      >
                        {change > 0 ? '+' : ''}{change}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {skillBonuses && skillBonuses.length > 0 && (
            <>
              {(content || (abilityModifiers && abilityModifiers.length > 0)) && <Separator className="my-4" />}
              <div>
                <h3 className="text-md font-semibold mb-2 text-foreground">Racial Skill Bonuses:</h3>
                <ul className="space-y-1 text-sm">
                  {skillBonuses.map(({ skillName, bonus }) => (
                    <li key={skillName} className="flex justify-between">
                      <span>{skillName}:</span>
                      <span className="font-bold text-emerald-500">
                        {bonus > 0 ? '+' : ''}{bonus}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </ScrollArea>
        <DialogFooter className="mt-2">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
