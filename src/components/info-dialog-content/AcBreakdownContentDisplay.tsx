
'use client';

import React from 'react';
import type { AbilityName, AggregatedFeatEffects } from '@/types/character';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { Badge } from '@/components/ui/badge';

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
        let valueToRender = detail.value;
        if (String(detail.mainLabel).toLowerCase() === (uiStrings.acBreakdownBaseLabel || "Base").toLowerCase()) {
          valueToRender = <span className="font-bold">{detail.value}</span>; 
        } else if ((typeof detail.value === 'number' || (typeof detail.value === 'string' && !isNaN(parseFloat(detail.value as string)))) && !String(detail.mainLabel).toLowerCase().includes('base attack bonus')) {
          valueToRender = renderModifierValue(detail.value as number | string);
        }
        
        let mainText = detail.mainLabel;
        let suffixBadge: React.ReactNode = null;

        if (detail.type === 'acAbilityMod' && detail.abilityAbbr) {
          mainText = detail.mainLabel; 
          suffixBadge = <Badge variant="outline" className="ml-1.5">{detail.abilityAbbr}</Badge>;
        } else if (detail.type === 'acSizeMod' && detail.sizeName) {
          mainText = detail.mainLabel; 
          suffixBadge = <Badge variant="outline" className="ml-1.5">{detail.sizeName}</Badge>;
        } else if (detail.suffixDetails && detail.suffixDetails.length > 0) {
          
          suffixBadge = <span className="text-muted-foreground/80 ml-1">({detail.suffixDetails.join(", ")})</span>;
        }
        
        
        if (typeof mainText === 'string' && !suffixBadge) {
          const suffixMatch = mainText.match(/\s(\([^)]+\))$/);
          if (suffixMatch) { 
            mainText = mainText.substring(0, mainText.length - suffixMatch[0].length);
            suffixBadge = <span className="text-muted-foreground/80 ml-1">{suffixMatch[1]}</span>;
          }
        }


        return (
          <div key={index} className="flex justify-between text-sm mb-0.5 items-baseline">
            <span className="text-muted-foreground inline-flex items-baseline">
              {mainText}
              {suffixBadge}
              {detail.condition && (
                <span className="text-muted-foreground/80 italic ml-1 text-xs"> 
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
          <div className="flex justify-between text-lg">
            <span className="font-semibold">{uiStrings.infoDialogTotalLabel || 'Total'}</span>
            <span className="font-bold text-accent">{renderModifierValue(totalACValue)}</span>
          </div>
        </>
      )}
    </div>
  );
};
