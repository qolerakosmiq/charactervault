
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
  suffixDetails?: string[];
  // Properties for specific, non-generic suffix styling (fallback)
  type?: 'acAbilityMod' | 'acSizeMod' | 'acFeatBonus';
  abilityAbbr?: string;
  sizeName?: string;
  condition?: string; // For feat bonus conditions
}

interface AcBreakdownContentDisplayProps {
  detailsList?: AcBreakdownDetailItem[];
  totalACValue?: number;
  detailsListHeading: string;
  uiStrings: Record<string, string>;
  // abilityLabels: readonly { value: Exclude<AbilityName, 'none'>; label: string; abbr: string }[]; // May not be used directly if labels pre-formatted
  // aggregatedFeatEffects?: AggregatedFeatEffects | null;
  // acType?: 'Normal' | 'Touch' | 'Flat-Footed';
}

export const AcBreakdownContentDisplay = ({
  detailsList,
  totalACValue,
  detailsListHeading,
  uiStrings,
}: AcBreakdownContentDisplayProps) => {
  if (!detailsList || detailsList.length === 0) return null;

  return (
    <div>
      <h3 className={sectionHeadingClass}>{detailsListHeading}</h3>
      {detailsList.map((detail, index) => {
        const valueToRender = (typeof detail.value === 'number' || (typeof detail.value === 'string' && !isNaN(parseFloat(detail.value as string)))) && !String(detail.mainLabel).toLowerCase().includes('base attack bonus')
            ? renderModifierValue(detail.value as number | string)
            : detail.value;
        
        let mainText = detail.mainLabel;
        let suffixText = detail.suffixDetails && detail.suffixDetails.length > 0 ? `(${detail.suffixDetails.join(", ")})` : null;

        // Fallback for specifically structured ability/size modifiers if not using suffixDetails
        if (!suffixText) {
          if (detail.type === 'acAbilityMod' && detail.abilityAbbr) {
            mainText = detail.mainLabel; // Should already be just "Ability Modifier"
            suffixText = `(${detail.abilityAbbr})`;
          } else if (detail.type === 'acSizeMod' && detail.sizeName) {
            mainText = detail.mainLabel; // Should already be just "Size Modifier"
            suffixText = `(${detail.sizeName})`;
          }
        }
        
        // If the mainLabel itself already contains the suffix, split it
        if (typeof mainText === 'string') {
          const suffixMatch = mainText.match(/\s(\([^)]+\))$/);
          if (suffixMatch && !suffixText) { // only if suffixText wasn't already set by suffixDetails
            mainText = mainText.substring(0, mainText.length - suffixMatch[0].length);
            suffixText = suffixMatch[1];
          }
        }


        return (
          <div key={index} className="flex justify-between text-sm mb-0.5">
            <span className="text-foreground">
              {mainText}
              {suffixText && (
                <span className="text-muted-foreground ml-1">
                  {suffixText}
                </span>
              )}
              {detail.type === 'acFeatBonus' && detail.condition && (
                <span className="text-muted-foreground italic ml-1">({detail.condition})</span>
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
