
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
  type?: 'acAbilityMod' | 'acSizeMod' | 'acFeatBonus';
  abilityAbbr?: string;
  sizeName?: string;
  condition?: string;
  isActive?: boolean; // Added for conditional effects
}

interface AcBreakdownContentDisplayProps {
  detailsList?: AcBreakdownDetailItem[];
  totalACValue?: number;
  detailsListHeading: string;
  uiStrings: Record<string, string>;
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

        if (!suffixText) {
          if (detail.type === 'acAbilityMod' && detail.abilityAbbr) {
            mainText = detail.mainLabel; 
            suffixText = `(${detail.abilityAbbr})`;
          } else if (detail.type === 'acSizeMod' && detail.sizeName) {
            mainText = detail.mainLabel; 
            suffixText = `(${detail.sizeName})`;
          }
        }
        
        if (typeof mainText === 'string') {
          const suffixMatch = mainText.match(/\s(\([^)]+\))$/);
          if (suffixMatch && !suffixText) { 
            mainText = mainText.substring(0, mainText.length - suffixMatch[0].length);
            suffixText = suffixMatch[1];
          }
        }

        return (
          <div key={index} className="flex justify-between text-sm mb-0.5">
            <span className="text-muted-foreground">
              {mainText}
              {suffixText && (
                <span className="text-muted-foreground/80 ml-1">
                  {suffixText}
                </span>
              )}
              {detail.condition && (
                <span className="text-muted-foreground/80 italic ml-1">
                  ({uiStrings[`condition_${detail.condition}`] || detail.condition} - {detail.isActive 
                    ? (uiStrings.conditionalEffectActiveSuffix || "(Active)")
                    : (uiStrings.conditionalEffectInactiveSuffix || "(Inactive)")
                  })
                </span>
              )}
            </span>
            <span className={cn(detail.isBold && "font-bold", "text-foreground")}>{valueToRender as React.ReactNode}</span>
          </div>
        );
      })}

      {totalACValue !== undefined && (
        <>
          <Separator className="my-2" />
          <div className="flex justify-between text-xl">
            <span className="font-semibold">{uiStrings.infoDialogTotalLabel || 'Total'}</span>
            <span className="font-bold text-accent">{renderModifierValue(totalACValue)}</span>
          </div>
        </>
      )}
    </div>
  );
};

    