
'use client';

import React from 'react';
import type { SpeedBreakdownDetails } from '@/types/character';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { Separator } from '@/components/ui/separator';

interface SpeedBreakdownContentDisplayProps {
  speedBreakdown?: SpeedBreakdownDetails;
  uiStrings: Record<string, string>;
}

export const SpeedBreakdownContentDisplay: React.FC<SpeedBreakdownContentDisplayProps> = React.memo(function SpeedBreakdownContentDisplay({
  speedBreakdown,
  uiStrings,
}) {
  if (!speedBreakdown) return null;
  const speedUnit = uiStrings.speedUnit || "ft.";

  const renderSource = (source: string) => {
    const match = source.match(/^(.*?)\s*\((.*)\)$/); // Matches "Text (Details)"
    if (match) {
      const mainText = match[1].trim(); // e.g., "Base"
      const detailText = match[2].trim(); // e.g., "Human"
      return (
        <>
          {mainText}{' '}
          <span className="text-muted-foreground">({detailText})</span>
        </>
      );
    }
    return source;
  };

  return (
    <div>
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3>
      <div className="space-y-1 text-sm">
        {speedBreakdown.components.map((comp, index) => {
          return (
            <div key={index} className="flex justify-between">
              <span>{renderSource(comp.source)}</span>
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
});
SpeedBreakdownContentDisplay.displayName = 'SpeedBreakdownContentDisplay';

    