
'use client';

import React from 'react';
import type { AbilityName, AggregatedFeatEffects } from '@/types/character';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';

export interface AcBreakdownDetailItem {
  mainLabel: string | React.ReactNode;
  value: string | number | React.ReactNode;
  isBold?: boolean;
  // Removed type, abilityAbbr, sizeName, featSource, condition
  // Those specific details are now handled by how mainLabel and suffixDetails are constructed
  suffixDetails?: string[];
}

interface AcBreakdownContentDisplayProps {
  detailsList?: AcBreakdownDetailItem[];
  totalACValue?: number;
  detailsListHeading: string;
  uiStrings: Record<string, string>;
  abilityLabels: readonly { value: Exclude<AbilityName, 'none'>; label: string; abbr: string }[];
  aggregatedFeatEffects?: AggregatedFeatEffects | null; // Still needed for context if any complex logic remains
  acType?: 'Normal' | 'Touch' | 'Flat-Footed'; // Still needed for context
}

export const AcBreakdownContentDisplay = ({
  detailsList,
  totalACValue,
  detailsListHeading,
  uiStrings,
  // abilityLabels, // May not be directly used in rendering if mainLabel is pre-formatted
  // aggregatedFeatEffects,
  // acType,
}: AcBreakdownContentDisplayProps) => {
  if (!detailsList || detailsList.length === 0) return null;

  return (
    <div>
      <h3 className={sectionHeadingClass}>{detailsListHeading}</h3>
      {detailsList.map((detail, index) => {
        const valueToRender = (typeof detail.value === 'number' || (typeof detail.value === 'string' && !isNaN(parseFloat(detail.value as string)))) && !String(detail.mainLabel).toLowerCase().includes('base attack bonus')
            ? renderModifierValue(detail.value as number | string)
            : detail.value;
        
        let labelNode = detail.mainLabel;
        // Specific suffix handling for DEX/Size should ideally be pre-formatted into suffixDetails if needed,
        // or mainLabel should include it if it's part of the primary label text.
        // For now, we'll assume mainLabel is the primary text, and suffixDetails handles parenthetical additions.

        return (
          <div key={index} className="flex justify-between text-sm mb-0.5">
            <span className="text-foreground">
              {labelNode}
              {detail.suffixDetails && detail.suffixDetails.length > 0 && (
                <span className="text-muted-foreground ml-1">
                  ({detail.suffixDetails.join(", ")})
                </span>
              )}
            </span>
            <span className={cn(detail.isBold && "font-bold", "text-foreground")}>{valueToRender as React.ReactNode}</span>
          </div>
        );
      })}

      {totalACValue !== undefined && (
        <>
          <div style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}><Separator /></div>
          <div className="flex justify-between text-base">
            <span className="font-semibold">{uiStrings.infoDialogTotalLabel || 'Total'}</span>
            <span className="font-bold text-accent">{renderModifierValue(totalACValue)}</span>
          </div>
        </>
      )}
    </div>
  );
};
