
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
import { Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AbilityName, AbilityScoreBreakdown } from '@/types/character';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { calculateAbilityModifier } from '@/lib/dnd-utils';

export interface SkillModifierBreakdownDetails {
  skillName: string;
  keyAbilityName?: string;
  keyAbilityModifier: number;
  ranks: number;
  synergyBonus: number;
  featBonus: number;
  racialBonus: number;
  miscModifier: number;
  totalBonus: number;
}

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
  skillModifierBreakdown?: SkillModifierBreakdownDetails;
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
  skillModifierBreakdown,
}: InfoDisplayDialogProps) {
  
  const hasBonusSection =
    (abilityModifiers && abilityModifiers.length > 0) ||
    (skillBonuses && skillBonuses.length > 0) ||
    (grantedFeats && grantedFeats.length > 0) ||
    (bonusFeatSlots && bonusFeatSlots > 0);

  const renderModifierValue = (value: number, positiveColor = "text-emerald-500", negativeColor = "text-destructive", zeroColor = "text-muted-foreground") => (
    <span
      className={cn(
        "font-bold",
        value > 0 && positiveColor,
        value < 0 && negativeColor,
        value === 0 && zeroColor
      )}
    >
      {value >= 0 ? '+' : ''}{value}
    </span>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif">
            <Info className="mr-2 h-6 w-6 text-primary" />
            {abilityScoreBreakdown ? `${abilityScoreBreakdown.ability.charAt(0).toUpperCase() + abilityScoreBreakdown.ability.slice(1)} Score Calculation` 
             : skillModifierBreakdown ? `${skillModifierBreakdown.skillName} Details`
             : title || 'Information'}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4 my-2">
          {content && !abilityScoreBreakdown && !skillModifierBreakdown && (
            <DialogDescription className="whitespace-pre-wrap text-sm">
              {content}
            </DialogDescription>
          )}
          
          {content && (skillModifierBreakdown || abilityScoreBreakdown) && (
             <p className="whitespace-pre-wrap text-sm text-muted-foreground mb-3">{content}</p>
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
                    {renderModifierValue(comp.value)}
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
                {renderModifierValue(calculateAbilityModifier(abilityScoreBreakdown.finalScore))}
              </div>
            </div>
          )}

          {skillModifierBreakdown && (
            <>
            {content && <Separator className="my-3"/>}
            <div>
                <h3 className="text-md font-semibold mb-2 text-foreground">Skill Modifier Breakdown:</h3>
                <div className="space-y-1 text-sm">
                  {skillModifierBreakdown.keyAbilityName && (
                    <div className="flex justify-between">
                      <span>Key Ability ({skillModifierBreakdown.keyAbilityName.substring(0,3).toUpperCase()}):</span>
                      {renderModifierValue(skillModifierBreakdown.keyAbilityModifier)}
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Ranks:</span>
                    {renderModifierValue(skillModifierBreakdown.ranks)}
                  </div>
                  {skillModifierBreakdown.synergyBonus !== 0 && (
                    <div className="flex justify-between">
                      <span>Synergy Bonus:</span>
                      {renderModifierValue(skillModifierBreakdown.synergyBonus)}
                    </div>
                  )}
                  {skillModifierBreakdown.featBonus !== 0 && (
                    <div className="flex justify-between">
                      <span>Feat Bonus:</span>
                      {renderModifierValue(skillModifierBreakdown.featBonus)}
                    </div>
                  )}
                  {skillModifierBreakdown.racialBonus !== 0 && (
                     <div className="flex justify-between">
                      <span>Racial Bonus:</span>
                      {renderModifierValue(skillModifierBreakdown.racialBonus)}
                    </div>
                  )}
                  {skillModifierBreakdown.miscModifier !== 0 && (
                    <div className="flex justify-between">
                      <span>Misc Modifier:</span>
                      {renderModifierValue(skillModifierBreakdown.miscModifier)}
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between text-base">
                    <span className="font-semibold">Total Bonus:</span>
                    {renderModifierValue(skillModifierBreakdown.totalBonus, "text-accent", "text-accent", "text-accent")}
                  </div>
                </div>
            </div>
            </>
          )}


          {!abilityScoreBreakdown && !skillModifierBreakdown && abilityModifiers && abilityModifiers.length > 0 && (
            <>
              {(content) && <Separator className="my-4" />}
              <div>
                <h3 className="text-md font-semibold mb-2 text-foreground">Ability Score Adjustments:</h3>
                <ul className="space-y-1 text-sm">
                  {abilityModifiers.map(({ ability, change }) => (
                    <li key={ability} className="flex justify-between">
                      <span className="capitalize">{ability}:</span>
                      {renderModifierValue(change)}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {!abilityScoreBreakdown && !skillModifierBreakdown && skillBonuses && skillBonuses.length > 0 && (
            <>
              {(content || (abilityModifiers && abilityModifiers.length > 0)) && <Separator className="my-4" />}
              <div>
                <h3 className="text-md font-semibold mb-2 text-foreground">Racial Skill Bonuses:</h3>
                <ul className="space-y-1 text-sm">
                  {skillBonuses.map(({ skillName, bonus }) => (
                    <li key={skillName} className="flex justify-between">
                      <span>{skillName}:</span>
                      {renderModifierValue(bonus)}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {!abilityScoreBreakdown && !skillModifierBreakdown && ((grantedFeats && grantedFeats.length > 0) || (bonusFeatSlots && bonusFeatSlots > 0)) ? (
             <>
              {(content || hasBonusSection) && (!skillBonuses || skillBonuses.length === 0) && (!abilityModifiers || abilityModifiers.length === 0) && <Separator className="my-4" />}
               {(skillBonuses && skillBonuses.length > 0 || abilityModifiers && abilityModifiers.length > 0) && <Separator className="my-4" />}
              <div>
                <h3 className="text-md font-semibold mb-2 text-foreground">Racial Feat Adjustments:</h3>
                <ul className="space-y-1 text-sm">
                  {bonusFeatSlots && bonusFeatSlots > 0 && (
                    <li className="flex justify-between">
                      <span>Bonus Feat Slots:</span>
                       {renderModifierValue(bonusFeatSlots)}
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
