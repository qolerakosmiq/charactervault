
'use client';

import React from 'react';
import type { AbilityName } from '@/types/character';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';

export interface AcBreakdownDetailItem {
  label: string;
  value: string | number | React.ReactNode;
  isBold?: boolean;
  type?: 'acAbilityMod' | 'acSizeMod';
  abilityAbbr?: string; // e.g., "DEX"
  sizeName?: string;    // e.g., "Medium"
}

interface AcBreakdownContentDisplayProps {
  detailsList?: AcBreakdownDetailItem[];
  totalACValue?: number;
  detailsListHeading: string;
  uiStrings: Record<string, string>;
  abilityLabels: readonly { value: Exclude<AbilityName, 'none'>; label: string; abbr: string }[];
}

export const AcBreakdownContentDisplay = ({
  detailsList,
  totalACValue,
  detailsListHeading,
  uiStrings,
  abilityLabels,
}: AcBreakdownContentDisplayProps) => {
  if (!detailsList || detailsList.length === 0) return null;

  return (
    <div>
      <h3 className={sectionHeadingClass}>{detailsListHeading}</h3>
      {detailsList.map((detail, index) => {
        const valueToRender = (typeof detail.value === 'number' || (typeof detail.value === 'string' && !isNaN(parseFloat(detail.value as string)))) && !String(detail.label).toLowerCase().includes('base attack bonus')
            ? renderModifierValue(detail.value as number | string)
            : detail.value;
        
        let labelContent: React.ReactNode = <span className="text-foreground">{detail.label}</span>;

        if (detail.type === 'acAbilityMod' && detail.abilityAbbr) {
          labelContent = (
            <span className="text-foreground">
              {detail.label}
              <span className="text-muted-foreground"> ({detail.abilityAbbr})</span>
            </span>
          );
        } else if (detail.type === 'acSizeMod' && detail.sizeName) {
          labelContent = (
            <span className="text-foreground">
              {detail.label}
              <span className="text-muted-foreground"> ({detail.sizeName})</span>
            </span>
          );
        }


        return (
          <div key={index} className="flex justify-between text-sm mb-0.5">
            {labelContent}
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
// AcBreakdownContentDisplay.displayName = 'AcBreakdownContentDisplayComponent';
