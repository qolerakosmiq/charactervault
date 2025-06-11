
'use client';

import React from 'react';
import type { BabBreakdownDetails } from '@/components/InfoDisplayDialog'; // Adjust path
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { Separator } from '@/components/ui/separator';

interface BabBreakdownContentDisplayProps {
  babBreakdown?: BabBreakdownDetails;
  uiStrings: Record<string, string>;
}

export const BabBreakdownContentDisplay = ({
  babBreakdown,
  uiStrings,
}: BabBreakdownContentDisplayProps) => {
  if (!babBreakdown) return null;

  return (
    <div>
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-foreground">{(uiStrings.infoDialogBabClassLabel || "{classLabel} Base Attack Bonus").replace("{classLabel}", babBreakdown.characterClassLabel || 'Class')}</span>
          <span className="font-bold">{babBreakdown.baseBabFromClasses.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/')}</span>
        </div>
        {babBreakdown.miscModifier !== 0 && (
          <div className="flex justify-between text-sm">
              <span className="text-foreground">{uiStrings.infoDialogCustomModifierLabel || "Custom Modifier"}</span>
              {renderModifierValue(babBreakdown.miscModifier)}
          </div>
        )}
        <Separator className="my-1" />
        <div className="flex justify-between text-lg">
          <span className="font-semibold">{uiStrings.infoDialogBabTotalLabel || "Total Base Attack Bonus"}</span>
          <span className="font-bold text-accent">{babBreakdown.totalBab.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/')}</span>
        </div>
      </div>
    </div>
  );
};

