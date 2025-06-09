
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
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>{uiStrings.infoDialogBaseScoreLabel || "Base Score"}</span>
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
            <div key={`comp-${index}-${comp.sourceLabel}-${comp.sourceDetail || ''}`} className="flex justify-between items-baseline">
              <span className="flex-shrink-0 mr-2">
                {displaySourceLabel}
                {comp.sourceLabel === "Feat" && comp.sourceDetail && (
                     <span className="text-muted-foreground ml-1">({comp.sourceDetail})</span>
                )}
              </span>
              <div className="flex items-baseline">
                {renderModifierValue(comp.value)}
                {comp.condition && <span className="ml-1 text-xs text-muted-foreground italic">({comp.condition})</span>}
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}><Separator /></div>
        <div className="flex justify-between text-base">
          <span className="font-semibold">{uiStrings.infoDialogFinalScoreLabel || "Final Score"}</span>
          <span className="font-bold text-accent">{dialogDisplayScore}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">{uiStrings.infoDialogFinalModifierLabel || "Final Modifier"}</span>
          {renderModifierValue(dialogDisplayModifier)}
        </div>
      </div>
    </div>
  );
};

