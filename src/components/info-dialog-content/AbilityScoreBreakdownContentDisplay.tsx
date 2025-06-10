
'use client';

import React from 'react';
import type { AbilityScoreBreakdown, AbilityScoreComponentValue, AbilityName } from '@/types/character'; // Updated AbilityScoreComponentValue import
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { calculateAbilityModifier } from '@/lib/dnd-utils';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface AbilityScoreBreakdownContentDisplayProps {
  abilityScoreBreakdown?: AbilityScoreBreakdown;
  uiStrings: Record<string, string>;
}

export const AbilityScoreBreakdownContentDisplay = ({
  abilityScoreBreakdown,
  uiStrings,
}: AbilityScoreBreakdownContentDisplayProps) => {
  if (!abilityScoreBreakdown) return null;

  const dialogDisplayScore = abilityScoreBreakdown.finalScore; // Use finalScore directly
  const dialogDisplayModifier = calculateAbilityModifier(dialogDisplayScore);

  return (
    <div>
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{uiStrings.infoDialogBaseScoreLabel || "Base Score"}</span>
          <span className="font-bold">{abilityScoreBreakdown.base}</span>
        </div>

        {abilityScoreBreakdown.components.map((comp, index) => {
          let displaySourceLabel = comp.sourceLabel; // Already structured
          if (comp.sourceLabel === "Race" && uiStrings.abilityScoreSourceRace && comp.sourceDetail) { 
            displaySourceLabel = (uiStrings.abilityScoreSourceRace).replace("{raceLabel}", comp.sourceDetail);
          } else if (comp.sourceLabel === "Aging" && uiStrings.abilityScoreSourceAging && comp.sourceDetail) {
            displaySourceLabel = (uiStrings.abilityScoreSourceAging).replace("{categoryName}", comp.sourceDetail);
          } else if (comp.sourceLabel === "Feat" && comp.sourceDetail) { // Display feat name if available
            displaySourceLabel = uiStrings.abilityScoreSourceFeatsGroupLabel || "Feats";
          } else if (comp.sourceLabel === "tempMod" && uiStrings.abilityScoreSourceTempMod) {
            displaySourceLabel = uiStrings.abilityScoreSourceTempMod;
          }
          
          return (comp.value !== 0 || comp.condition) && (
            <div key={`comp-${index}-${comp.sourceLabel}-${comp.sourceDetail || ''}`} className="flex justify-between items-baseline text-sm">
              <span className="text-muted-foreground flex-shrink-0 mr-2">
                {displaySourceLabel}
                {comp.sourceLabel === "Feat" && comp.sourceDetail && (
                     <span className="text-muted-foreground/80 ml-1">({comp.sourceDetail})</span>
                )}
              </span>
              <div className="flex items-baseline">
                {renderModifierValue(comp.value)}
                {comp.condition && <span className="ml-1 text-xs text-muted-foreground/80 italic">({comp.condition})</span>}
              </div>
            </div>
          );
        })}

        <Separator className="my-2" />
        <div className="flex justify-between text-xl">
          <span className="font-semibold">{uiStrings.infoDialogFinalScoreLabel || "Final Score"}</span>
          <span className="font-bold text-accent">{dialogDisplayScore}</span>
        </div>
        <div className="flex justify-between text-xl">
          <span className="font-semibold">{uiStrings.infoDialogFinalModifierLabel || "Final Modifier"}</span>
          <span className="font-bold text-accent">{renderModifierValue(dialogDisplayModifier)}</span>
        </div>
      </div>
    </div>
  );
};

