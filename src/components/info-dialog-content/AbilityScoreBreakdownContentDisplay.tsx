
'use client';

import React from 'react';
import type { AbilityScoreBreakdown } from '@/types/character';
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
           else if (comp.source === "feats" && uiStrings.abilityScoreSourceFeats) { displaySource = uiStrings.abilityScoreSourceFeats; }
           else if (comp.source.startsWith("Race (") && uiStrings.abilityScoreSourceRace) { displaySource = (uiStrings.abilityScoreSourceRace).replace("{raceLabel}", comp.source.match(/Race \((.*?)\)/)?.[1] || ''); }
           else if (comp.source.startsWith("Aging (") && uiStrings.abilityScoreSourceAging) { displaySource = (uiStrings.abilityScoreSourceAging).replace("{categoryName}", comp.source.match(/Aging \((.*?)\)/)?.[1] || '');}

          return comp.value !== 0 && (
            <div key={index} className="flex justify-between">
              <span>{displaySource}</span>
              {renderModifierValue(comp.value)}
            </div>
          );
        })}
        <div style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}><Separator /></div>
        <div className="flex justify-between text-base">
          <span className="font-semibold">{uiStrings.infoDialogFinalScoreLabel || "Final Score"}</span>
          <span className="font-bold text-accent">{abilityScoreBreakdown.finalScore}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">{uiStrings.infoDialogFinalModifierLabel || "Final Modifier"}</span>
          {renderModifierValue(calculateAbilityModifier(abilityScoreBreakdown.finalScore))}
        </div>
      </div>
    </div>
  );
};
// AbilityScoreBreakdownContentDisplay.displayName = 'AbilityScoreBreakdownContentDisplayComponent';
