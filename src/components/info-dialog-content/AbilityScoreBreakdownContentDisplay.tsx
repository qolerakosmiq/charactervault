
'use client';

import React from 'react';
import type { AbilityScoreBreakdown, AbilityScoreComponentValue } from '@/types/character';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { calculateAbilityModifier } from '@/lib/dnd-utils';
import { Separator } from '@/components/ui/separator';

interface AbilityScoreBreakdownContentDisplayProps {
  abilityScoreBreakdown?: AbilityScoreBreakdown;
  uiStrings: Record<string, string>;
}

export const AbilityScoreBreakdownContentDisplay = ({
  abilityScoreBreakdown,
  uiStrings,
}: AbilityScoreBreakdownContentDisplayProps) => {
  if (!abilityScoreBreakdown) return null;

  // Calculate a "Dialog Display Score" by summing the base and all active components.
  // The components in abilityScoreBreakdown.components are already filtered by calculateFeatEffects
  // to include only unconditional effects or conditional effects whose conditions are currently met.
  const dialogDisplayScore = abilityScoreBreakdown.base +
    abilityScoreBreakdown.components.reduce((sum, comp: AbilityScoreComponentValue) => {
      // Only add to sum if the component's value is a number
      // This handles cases where a component might be purely informational (though less common for ability scores)
      const numericValue = typeof comp.value === 'number' ? comp.value : 0;
      return sum + numericValue;
    }, 0);

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
           let displaySource = comp.source;
           if (comp.source === "tempMod" && uiStrings.abilityScoreSourceTempMod) { displaySource = uiStrings.abilityScoreSourceTempMod; }
           else if (comp.source.startsWith("Feat: ") && uiStrings.abilityScoreSourceFeats) { 
             displaySource = (uiStrings.abilityScoreSourceFeats).replace("{featName}", comp.source.replace("Feat: ", ""));
           }
           else if (comp.source.startsWith("Race (") && uiStrings.abilityScoreSourceRace) { displaySource = (uiStrings.abilityScoreSourceRace).replace("{raceLabel}", comp.source.match(/Race \((.*?)\)/)?.[1] || ''); }
           else if (comp.source.startsWith("Aging (") && uiStrings.abilityScoreSourceAging) { displaySource = (uiStrings.abilityScoreSourceAging).replace("{categoryName}", comp.source.match(/Aging \((.*?)\)/)?.[1] || '');}

          // Show component if its value is non-zero or if it's a conditional effect being listed
          return (comp.value !== 0 || comp.condition) && (
            <div key={index} className="flex justify-between items-baseline">
              <span className="flex-shrink-0 mr-2">{displaySource}</span>
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
// AbilityScoreBreakdownContentDisplay.displayName = 'AbilityScoreBreakdownContentDisplayComponent';

