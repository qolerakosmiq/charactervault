
'use client';

import React from 'react';
import type { AbilityScoreBreakdown, AbilityScoreComponentValue } from '@/types/character';
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

  const dialogDisplayScore = abilityScoreBreakdown.base +
    abilityScoreBreakdown.components.reduce((sum, comp: AbilityScoreComponentValue) => {
      const numericValue = typeof comp.value === 'number' ? comp.value : 0;
      return sum + numericValue;
    }, 0);

  const dialogDisplayModifier = calculateAbilityModifier(dialogDisplayScore);

  const featBasedComponents = abilityScoreBreakdown.components.filter(comp => comp.source.startsWith("Feat:"));
  const otherComponents = abilityScoreBreakdown.components.filter(comp => !comp.source.startsWith("Feat:"));

  const totalFeatValue = featBasedComponents.reduce((sum, fc) => sum + fc.value, 0);
  const featConditions = Array.from(new Set(featBasedComponents.map(fc => fc.condition).filter(Boolean)));

  return (
    <div>
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>{uiStrings.infoDialogBaseScoreLabel || "Base Score"}</span>
          <span className="font-bold">{abilityScoreBreakdown.base}</span>
        </div>

        {otherComponents.map((comp, index) => {
           let displaySource = comp.source;
           if (comp.source === "tempMod" && uiStrings.abilityScoreSourceTempMod) { displaySource = uiStrings.abilityScoreSourceTempMod; }
           else if (comp.source.startsWith("Race (") && uiStrings.abilityScoreSourceRace) { displaySource = (uiStrings.abilityScoreSourceRace).replace("{raceLabel}", comp.source.match(/Race \((.*?)\)/)?.[1] || ''); }
           else if (comp.source.startsWith("Aging (") && uiStrings.abilityScoreSourceAging) { displaySource = (uiStrings.abilityScoreSourceAging).replace("{categoryName}", comp.source.match(/Aging \((.*?)\)/)?.[1] || '');}

          return (comp.value !== 0 || comp.condition) && (
            <div key={`other-${index}-${comp.source}`} className="flex justify-between items-baseline">
              <span className="flex-shrink-0 mr-2">{displaySource}</span>
              <div className="flex items-baseline">
                {renderModifierValue(comp.value)}
                {comp.condition && <span className="ml-1 text-xs text-muted-foreground">({comp.condition})</span>}
              </div>
            </div>
          );
        })}

        {featBasedComponents.length > 0 && totalFeatValue !== 0 && (
          <div className="flex justify-between items-baseline">
            <span className="flex-shrink-0 mr-2">
              {uiStrings.abilityScoreSourceFeatsGroupLabel || "Feats"}
              {featConditions.length > 0 && (
                <small className="ml-1 text-xs text-muted-foreground">
                  ({featConditions.join(", ")})
                </small>
              )}
            </span>
            <div className="flex items-baseline">
              {renderModifierValue(totalFeatValue)}
            </div>
          </div>
        )}

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

