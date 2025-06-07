
'use client';

import React from 'react';
import type { ResistanceBreakdownDetails } from '@/components/InfoDisplayDialog'; // Adjust path if necessary
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { Separator } from '@/components/ui/separator';

interface ResistanceBreakdownContentDisplayProps {
  resistanceBreakdown?: ResistanceBreakdownDetails;
  uiStrings: Record<string, string>;
}

export const ResistanceBreakdownContentDisplay = React.memo(function ResistanceBreakdownContentDisplayComponent({
  resistanceBreakdown,
  uiStrings,
}: ResistanceBreakdownContentDisplayProps) {
  if (!resistanceBreakdown) return null;

  return (
    <div>
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>{uiStrings.infoDialogBaseValueLabel || "Base Value:"}</span>
          <span className="font-bold">{resistanceBreakdown.base}</span>
        </div>
        <div className="flex justify-between">
          <span>{uiStrings.infoDialogCustomModifierLabel || "Custom Modifier:"}</span>
          {renderModifierValue(resistanceBreakdown.customMod)}
        </div>
        <div style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}><Separator /></div>
        <div className="flex justify-between text-base">
          <span className="font-semibold">{uiStrings.infoDialogTotalResistanceLabel || "Total Resistance:"}</span>
          <span className="font-bold text-accent">{resistanceBreakdown.total}</span>
        </div>
      </div>
    </div>
  );
});
ResistanceBreakdownContentDisplay.displayName = 'ResistanceBreakdownContentDisplay';
