
'use client';

import React from 'react';
import type { ResistanceBreakdownDetails } from '@/components/InfoDisplayDialog'; // Adjust path if necessary
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { Separator } from '@/components/ui/separator';

interface ResistanceBreakdownContentDisplayProps {
  resistanceBreakdown?: ResistanceBreakdownDetails;
  uiStrings: Record<string, string>;
}

export const ResistanceBreakdownContentDisplay = ({
  resistanceBreakdown,
  uiStrings,
}: ResistanceBreakdownContentDisplayProps) => {
  if (!resistanceBreakdown) return null;

  return (
    <div>
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{uiStrings.infoDialogBaseValueLabel || "Base Value"}</span>
          <span className="font-bold">{resistanceBreakdown.base}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{uiStrings.infoDialogCustomModifierLabel || "Custom Modifier"}</span>
          {renderModifierValue(resistanceBreakdown.customMod)}
        </div>
        <Separator className="my-2" />
        <div className="flex justify-between text-lg">
          <span className="font-semibold">{uiStrings.infoDialogTotalResistanceLabel || "Total Resistance"}</span>
          <span className="font-bold text-accent">{resistanceBreakdown.total}</span>
        </div>
      </div>
    </div>
  );
};

