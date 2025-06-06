
'use client';

import React from 'react';
import type { SpeedBreakdownDetails } from '@/types/character';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { Separator } from '@/components/ui/separator';

interface SpeedBreakdownContentDisplayProps {
  speedBreakdown?: SpeedBreakdownDetails;
  uiStrings: Record<string, string>;
}

export const SpeedBreakdownContentDisplay: React.FC<SpeedBreakdownContentDisplayProps> = ({
  speedBreakdown,
  uiStrings,
}) => {
  if (!speedBreakdown) return null;
  const speedUnit = uiStrings.speedUnit || "ft.";

  return (
    <div>
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3>
      <div className="space-y-1 text-sm">
        {speedBreakdown.components.map((comp, index) => {
          return (
            <div key={index} className="flex justify-between">
              <span>{comp.source}</span>
              {renderModifierValue(comp.value)}
            </div>
          );
        })}
        <div style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}><Separator /></div>
        <div className="flex justify-between text-base">
          <span className="font-semibold">{(uiStrings.infoDialogSpeedTotalPrefixLabel || "Total")} {speedBreakdown.name}</span>
          <span className="font-bold text-accent">{speedBreakdown.total} {speedUnit}</span>
        </div>
      </div>
    </div>
  );
};
