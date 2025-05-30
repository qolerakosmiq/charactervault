
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
import { ScrollText, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AbilityName, AbilityScoreBreakdown } from '@/types/character';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { calculateAbilityModifier } from '@/lib/dnd-utils';

interface InfoDisplayDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  content?: string;
  abilityModifiers?: Array<{ ability: AbilityName; change: number }>;
  skillBonuses?: Array<{ skillName: string; bonus: number }>;
  grantedFeats?: Array<{ name: string; note?: string }>;
  bonusFeatSlots?: number;
  abilityScoreBreakdown?: AbilityScoreBreakdown;
}

export function InfoDisplayDialog({
  isOpen,
  onOpenChange,
  title,
  content,
  abilityModifiers,
  skillBonuses,
  grantedFeats,
  bonusFeatSlots,
  abilityScoreBreakdown,
}: InfoDisplayDialogProps) {
  
  const hasBonusSection =
    (abilityModifiers && abilityModifiers.length > 0) ||
    (skillBonuses && skillBonuses.length > 0) ||
    (grantedFeats && grantedFeats.length > 0) ||
    (bonusFeatSlots && bonusFeatSlots > 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif">
            <Info className="mr-2 h-6 w-6 text-primary" />
            {abilityScoreBreakdown ? `${abilityScoreBreakdown.ability.charAt(0).toUpperCase() + abilityScoreBreakdown.ability.slice(1)} Score Calculation` : title || 'Information'}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4 my-2">
          {content && !abilityScoreBreakdown && (
            <DialogDescription className="whitespace-pre-wrap text-sm">
              {content}
            </DialogDescription>
          )}

          {abilityScoreBreakdown && (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Base Score:</span>
                <span className="font-bold">{abilityScoreBreakdown.base}</span>
              </div>
              {abilityScoreBreakdown.components.map((comp, index) => (
                comp.value !== 0 && (
                  <div key={index} className="flex justify-between">
                    <span>{comp.source}:</span>
                    <span
                      className={cn(
                        "font-bold",
                        comp.value > 0 && "text-emerald-500",
                        comp.value < 0 && "text-destructive"
                      )}
                    >
                      {comp.value > 0 ? '+' : ''}{comp.value}
                    </span>
                  </div>
                )
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between text-base">
                <span className="font-semibold">Final Score:</span>
                <span className="font-bold">{abilityScoreBreakdown.finalScore}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Final Modifier:</span>
                <span
                  className={cn(
                    "font-bold",
                    calculateAbilityModifier(abilityScoreBreakdown.finalScore) > 0 && "text-emerald-500",
                    calculateAbilityModifier(abilityScoreBreakdown.finalScore) < 0 && "text-destructive",
                     calculateAbilityModifier(abilityScoreBreakdown.finalScore) === 0 && "text-accent"
                  )}
                >
                  {calculateAbilityModifier(abilityScoreBreakdown.finalScore) >= 0 ? '+' : ''}
                  {calculateAbilityModifier(abilityScoreBreakdown.finalScore)}
                </span>
              </div>
            </div>
          )}

          {!abilityScoreBreakdown && abilityModifiers && abilityModifiers.length > 0 && (
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

          {!abilityScoreBreakdown && skillBonuses && skillBonuses.length > 0 && (
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

          {!abilityScoreBreakdown && ((grantedFeats && grantedFeats.length > 0) || (bonusFeatSlots && bonusFeatSlots > 0)) ? (
             <>
              {(content || hasBonusSection) && (!skillBonuses || skillBonuses.length === 0) && (!abilityModifiers || abilityModifiers.length === 0) && <Separator className="my-4" />}
               {(skillBonuses && skillBonuses.length > 0 || abilityModifiers && abilityModifiers.length > 0) && <Separator className="my-4" />}
              <div>
                <h3 className="text-md font-semibold mb-2 text-foreground">Racial Feat Adjustments:</h3>
                <ul className="space-y-1 text-sm">
                  {bonusFeatSlots && bonusFeatSlots > 0 && (
                    <li className="flex justify-between">
                      <span>Bonus Feat Slots:</span>
                       <span
                        className={cn(
                          "font-bold text-emerald-500"
                        )}
                      >
                        +{bonusFeatSlots}
                      </span>
                    </li>
                  )}
                  {grantedFeats && grantedFeats.map(({ name, note }, index) => (
                    <li key={`${name}-${index}`}>
                      <span>{name} {note && <span className="text-muted-foreground text-xs">{note}</span>}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
        </ScrollArea>
        <DialogFooter className="mt-2">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
