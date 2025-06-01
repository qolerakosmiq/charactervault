
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AbilityName, AbilityScoreBreakdown, Feat, RaceSpecialQualities, SkillModifierBreakdownDetails } from '@/types/character';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { calculateAbilityModifier } from '@/lib/dnd-utils';

interface InfoDisplayDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  content?: string; // This content can now be HTML
  abilityModifiers?: Array<{ ability: AbilityName; change: number }>;
  skillBonuses?: Array<{ skillName: string; bonus: number }>;
  grantedFeats?: Array<{ featId: string; name: string; note?: string; levelAcquired?: number }>;
  bonusFeatSlots?: number;
  abilityScoreBreakdown?: AbilityScoreBreakdown;
  skillModifierBreakdown?: SkillModifierBreakdownDetails;
  detailsList?: Array<{ label: string; value: string | number; isBold?: boolean }>;
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
  detailsList,
}: InfoDisplayDialogProps) {

  const hasAbilityModifiers = abilityModifiers && abilityModifiers.length > 0;
  const hasSkillBonuses = skillBonuses && skillBonuses.length > 0;
  const hasFeatAdjustments = (grantedFeats && grantedFeats.length > 0) || (bonusFeatSlots && bonusFeatSlots > 0);
  const hasDetailsList = detailsList && detailsList.length > 0;

  const renderModifierValue = (value: number | string,
    positiveColor = "text-emerald-500",
    negativeColor = "text-destructive",
    zeroColor = "text-muted-foreground",
    accentColor = "text-accent",
    isTotal = false
  ) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) {
      return <span className="font-bold">{value}</span>;
    }

    let colorClass = zeroColor;
     if (isTotal) {
        colorClass = accentColor;
    } else if (numValue > 0) {
        colorClass = positiveColor;
    } else if (numValue < 0) {
        colorClass = negativeColor;
    } else { // numValue === 0
        colorClass = zeroColor; 
    }
    
    const prefix = numValue > 0 ? '+' : (numValue === 0 ? '+' : '');


    return (
      <span
        className={cn(
          "font-bold",
          colorClass
        )}
      >
        {prefix}{numValue}
      </span>
    );
  };


  const anyBonusSectionWillRender = hasAbilityModifiers || hasSkillBonuses || hasFeatAdjustments;

  let dialogTitle = title || 'Information';
  let sectionHeading = "Key Attributes:";
  if (abilityScoreBreakdown) {
    dialogTitle = `${abilityScoreBreakdown.ability.charAt(0).toUpperCase() + abilityScoreBreakdown.ability.slice(1)} Score Calculation`;
    sectionHeading = "Score Breakdown:";
  } else if (skillModifierBreakdown) {
    dialogTitle = `${skillModifierBreakdown.skillName} Details`;
    sectionHeading = "Skill Modifier Breakdown:";
  } else if (title?.toLowerCase().includes("armor class breakdown")){
    dialogTitle = title;
    sectionHeading = "Calculation:";
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif">
            <Info className="mr-2 h-6 w-6 text-primary" />
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4 my-2">
          {content && !abilityScoreBreakdown && !skillModifierBreakdown && !title?.toLowerCase().includes("armor class breakdown") && (
             <div
              className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}

          {content && (skillModifierBreakdown || abilityScoreBreakdown || title?.toLowerCase().includes("armor class breakdown")) && (
             <div
              className="text-sm text-muted-foreground mb-3 leading-relaxed prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}


          {abilityScoreBreakdown && (
            <>
            {content && <Separator className="my-3"/>}
            <div>
                <h3 className="text-md font-semibold mb-2 text-foreground">{sectionHeading}</h3>
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
                    <span className="font-bold text-accent">{abilityScoreBreakdown.finalScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Final Modifier:</span>
                    {renderModifierValue(calculateAbilityModifier(abilityScoreBreakdown.finalScore))}
                  </div>
                </div>
              </div>
            </>
          )}

          {skillModifierBreakdown && (
            <>
            {content && <Separator className="my-3"/>}
            <div>
                <h3 className="text-md font-semibold mb-2 text-foreground">{sectionHeading}</h3>
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
                   {skillModifierBreakdown.sizeSpecificBonus !== 0 && (
                    <div className="flex justify-between">
                      <span>Size Modifier:</span>
                      {renderModifierValue(skillModifierBreakdown.sizeSpecificBonus)}
                    </div>
                  )}
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
                    {renderModifierValue(skillModifierBreakdown.totalBonus, undefined, undefined, undefined, "text-accent", true)}
                  </div>
                </div>
            </div>
            </>
          )}


          {!abilityScoreBreakdown && !skillModifierBreakdown && hasAbilityModifiers && (
            <>
              {(content) && <Separator className="my-4" />}
              <div>
                <h3 className="text-md font-semibold mb-2 text-foreground">Ability Score Adjustments:</h3>
                <ul className="space-y-1 text-sm">
                  {abilityModifiers!.map(({ ability, change }) => (
                    <li key={ability} className="flex justify-between">
                      <span className="capitalize">{ability}:</span>
                      {renderModifierValue(change)}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {!abilityScoreBreakdown && !skillModifierBreakdown && hasSkillBonuses && (
            <>
              {(content || hasAbilityModifiers) && <Separator className="my-4" />}
              <div>
                <h3 className="text-md font-semibold mb-2 text-foreground">Racial Skill Bonuses:</h3>
                <ul className="space-y-1 text-sm">
                  {skillBonuses!.map(({ skillName, bonus }) => (
                    <li key={skillName} className="flex justify-between">
                      <span>{skillName}:</span>
                      {renderModifierValue(bonus)}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {!abilityScoreBreakdown && !skillModifierBreakdown && hasFeatAdjustments ? (
             <>
              {(content || hasAbilityModifiers || hasSkillBonuses) && <Separator className="my-4" />}
              <div>
                 <h3 className="text-md font-semibold mb-2 text-foreground">Racial Feat Adjustments:</h3>
                 <ul className="space-y-1 text-sm">
                  {bonusFeatSlots && bonusFeatSlots > 0 && (
                    <li className="flex justify-between">
                      <span>Bonus Feat Slots:</span>
                       {renderModifierValue(bonusFeatSlots)}
                    </li>
                  )}
                  {grantedFeats && grantedFeats.map(({ featId, name, note }, index) => (
                    <li key={`${featId}-${index}`}>
                      <span>{name} {note && <span className="text-muted-foreground text-xs">{note}</span>}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}

          {!abilityScoreBreakdown && !skillModifierBreakdown && hasDetailsList && (
             <>
              {(content || anyBonusSectionWillRender) && (!title?.toLowerCase().includes("armor class breakdown")) && <Separator className="my-4" />}
              <div>
                <h3 className="text-md font-semibold mb-2 text-foreground">{sectionHeading}</h3>
                {detailsList!.filter(detail => detail.label.toLowerCase() !== 'total').map((detail, index) => {
                    const valueToRender = (typeof detail.value === 'number' || (typeof detail.value === 'string' && !isNaN(parseFloat(detail.value))))
                        ? renderModifierValue(detail.value, undefined, undefined, undefined, (detail.label.toLowerCase() === "total" ? "text-accent" : undefined), detail.label.toLowerCase() === "total")
                        : detail.value;
                    return (
                        <div key={index} className="flex justify-between text-sm mb-0.5">
                        <span className="text-muted-foreground">{detail.label}:</span>
                        <span className={cn(detail.isBold && "font-bold", "text-foreground")}>{valueToRender}</span>
                        </div>
                    );
                })}
                
                {detailsList!.find(detail => detail.label.toLowerCase() === 'total') && (
                  <>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Total:</span>
                      {renderModifierValue(detailsList!.find(detail => detail.label.toLowerCase() === 'total')!.value, undefined, undefined, undefined, "text-accent", true)}
                    </div>
                  </>
                )}
              </div>
            </>
          )}

        </ScrollArea>
        <DialogFooter className="mt-2">
          <Button onClick={() => onOpenChange(false)} type="button">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

