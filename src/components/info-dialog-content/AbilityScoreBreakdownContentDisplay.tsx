
'use client';

import React from 'react';
import type { AbilityScoreBreakdown, AbilityScoreComponentValue, AbilityName } from '@/types/character';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { calculateAbilityModifier } from '@/lib/dnd-utils';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface AbilityScoreBreakdownContentDisplayProps {
  abilityScoreBreakdown?: AbilityScoreBreakdown;
  uiStrings: Record<string, string>;
}

export const AbilityScoreBreakdownContentDisplay = ({
  abilityScoreBreakdown,
  uiStrings,
}: AbilityScoreBreakdownContentDisplayProps) => {
  if (!abilityScoreBreakdown) return null;

  const dialogDisplayScore = abilityScoreBreakdown.finalScore;
  const dialogDisplayModifier = calculateAbilityModifier(dialogDisplayScore);

  const nonConditionalComponents: AbilityScoreComponentValue[] = [];
  const conditionalActiveComponents: Array<AbilityScoreComponentValue & { conditionName?: string }> = [];

  abilityScoreBreakdown.components.forEach(comp => {
    if (comp.condition && comp.isActive) {
      const conditionTextKey = `condition_${comp.condition.toLowerCase().replace(/\s+/g, '_')}` as keyof typeof uiStrings;
      const conditionName = uiStrings[conditionTextKey] || comp.condition;
      conditionalActiveComponents.push({ ...comp, conditionName });
    } else if (!comp.condition) {
      nonConditionalComponents.push(comp);
    }
  });

  const renderComponent = (comp: AbilityScoreComponentValue, isConditional: boolean = false) => {
    let displaySourceLabel = comp.sourceLabel;
    if (comp.sourceLabel === "Race" && uiStrings.abilityScoreSourceRace && comp.sourceDetail) {
      displaySourceLabel = (uiStrings.abilityScoreSourceRace).replace("{raceLabel}", comp.sourceDetail);
    } else if (comp.sourceLabel === "Aging" && uiStrings.abilityScoreSourceAging && comp.sourceDetail) {
      displaySourceLabel = (uiStrings.abilityScoreSourceAging).replace("{categoryName}", comp.sourceDetail);
    } else if (comp.sourceLabel === "Feat" && comp.sourceDetail) {
      displaySourceLabel = comp.sourceDetail;
    } else if (comp.sourceLabel === "Temporary Modifier" && uiStrings.abilityScoreSourceTempMod) {
      displaySourceLabel = uiStrings.abilityScoreSourceTempMod;
    }

    return (
      <div key={`${comp.sourceLabel}-${comp.sourceDetail || ''}-${comp.value}-${comp.condition || 'unconditional'}`} className={cn("flex justify-between items-baseline text-sm", isConditional && "ml-3")}>
        <span className="text-foreground flex-shrink-0 mr-2">
          {displaySourceLabel}
        </span>
        {renderModifierValue(comp.value)}
      </div>
    );
  };

  return (
    <div>
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-foreground">{uiStrings.infoDialogBaseScoreLabel || "Base Score"}</span>
          <span className="font-bold">{abilityScoreBreakdown.base}</span>
        </div>

        {nonConditionalComponents.map(comp => renderComponent(comp))}

        {conditionalActiveComponents.length > 0 && (
          <>
            <h4 className="text-sm font-bold text-muted-foreground mb-0">
              {uiStrings.infoDialogConditionalBonusesHeading || "Conditional Bonuses"}
            </h4>
            <div className="space-y-0.5 ml-3 mt-0 mb-0">
              {conditionalActiveComponents.map(comp => renderComponent(comp, true))}
            </div>
          </>
        )}

        <Separator className="my-1" />
        <div className="flex justify-between text-lg">
          <span className="font-semibold">{uiStrings.infoDialogFinalScoreLabel || "Final Score"}</span>
          <span className="font-bold text-accent">{dialogDisplayScore}</span>
        </div>
        <div className="flex justify-between text-lg">
          <span className="font-semibold">{uiStrings.infoDialogFinalModifierLabel || "Final Modifier"}</span>
          <span className="font-bold text-accent">{renderModifierValue(dialogDisplayModifier)}</span>
        </div>
      </div>
    </div>
  );
};
