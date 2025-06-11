
'use client';

import React from 'react';
import type { SpeedBreakdownDetails } from '@/types/character';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge'; // Added Badge import
import { cn } from '@/lib/utils'; // Added cn import

interface SpeedBreakdownContentDisplayProps {
  speedBreakdown?: SpeedBreakdownDetails;
  uiStrings: Record<string, string>;
}

export const SpeedBreakdownContentDisplay = ({
  speedBreakdown,
  uiStrings,
}: SpeedBreakdownContentDisplayProps) => {
  if (!speedBreakdown) return null;
  const speedUnit = uiStrings.speedUnit || "ft.";

  const renderSource = (source: string) => {
    const match = source.match(/^(.*?)\s*\((.*)\)$/);
    if (match) {
      const mainText = match[1].trim();
      const detailText = match[2].trim();
      // Check if the source is specifically the racial base speed, which includes the race name in parentheses
      const baseRaceLabelKey = uiStrings.infoDialogSpeedBaseRaceLabel || "Base ({raceName})";
      // Extracts "Base" or translated equivalent of "Base" from "Base ({raceName})"
      const baseTextPart = baseRaceLabelKey.substring(0, baseRaceLabelKey.indexOf(" (") > -1 ? baseRaceLabelKey.indexOf(" (") : baseRaceLabelKey.length);

      if (mainText === baseTextPart) {
        return (
          <>
            {mainText}
            <Badge variant="outline" className={cn("ml-1.5 text-sm font-normal px-1.5 py-0.5 whitespace-nowrap")}>
              {detailText}
            </Badge>
          </>
        );
      }
      // Fallback for other parenthesized details if needed
      return (
        <>
          {mainText}
          <span className="text-muted-foreground/80 ml-1">({detailText})</span>
        </>
      );
    }
    return source;
  };

  return (
    <div>
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3>
      <div className="space-y-1">
        {speedBreakdown.components.map((comp, index) => {
          return (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{renderSource(comp.source)}</span>
              <span className="font-bold">{renderModifierValue(comp.value)}</span>
            </div>
          );
        })}
        <Separator className="my-2" />
        <div className="flex justify-between text-lg">
          <span className="font-semibold">{(uiStrings.infoDialogSpeedTotalPrefixLabel || "Total")} {speedBreakdown.name}</span>
          <span className="font-bold text-accent">{speedBreakdown.total} {speedUnit}</span>
        </div>
      </div>
    </div>
  );
};

SpeedBreakdownContentDisplay.displayName = "SpeedBreakdownContentDisplayComponent";
