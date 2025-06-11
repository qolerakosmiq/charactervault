
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
  isActive?: boolean;
  isSubItem?: boolean;
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

  const activeDetailsList = detailsList.filter(detail => detail.isActive !== false);

  const staticComponents: AcBreakdownDetailItem[] = [];
  const conditionalFeatComponents: AcBreakdownDetailItem[] = [];

  activeDetailsList.forEach(detail => {
    if (detail.isSubItem) {
      conditionalFeatComponents.push(detail);
    } else {
      staticComponents.push(detail);
    }
  });

  const renderItem = (detail: AcBreakdownDetailItem, index: string | number) => {
    let mainTextDisplay: React.ReactNode = detail.mainLabel;
    let suffixBadgeDisplay: React.ReactNode = null;

    if (detail.isSubItem) {
      // For conditional bonuses (sub-items), mainLabel is the feat name. No suffix badge.
      mainTextDisplay = detail.mainLabel;
      suffixBadgeDisplay = null;
    } else {
      // Logic for static components like Ability Mod, Size Mod
      if (detail.type === 'acAbilityMod' && detail.abilityAbbr) {
        mainTextDisplay = detail.mainLabel;
        suffixBadgeDisplay = <Badge variant="outline" className="ml-1.5">{detail.abilityAbbr}</Badge>;
      } else if (detail.type === 'acSizeMod' && detail.sizeName) {
        mainTextDisplay = detail.mainLabel;
        suffixBadgeDisplay = <Badge variant="outline" className="ml-1.5">{detail.sizeName}</Badge>;
      } else if (detail.suffixDetails && detail.suffixDetails.length > 0) {
        mainTextDisplay = detail.mainLabel;
        suffixBadgeDisplay = <span className="text-muted-foreground/80 ml-1 text-xs">({detail.suffixDetails.join(", ")})</span>;
      } else if (typeof detail.mainLabel === 'string') {
        // Generic suffix parsing for other static items if needed - this might be too broad.
        // For AC breakdown, specific types (ability, size) should handle their suffixes.
        // This part is less likely to be hit if specific types are handled above.
        // const suffixMatch = detail.mainLabel.match(/\s(\([^)]+\))$/);
        // if (suffixMatch) {
        //   mainTextDisplay = detail.mainLabel.substring(0, detail.mainLabel.length - suffixMatch[0].length);
        //   suffixBadgeDisplay = <span className="text-muted-foreground/80 ml-1 text-xs">{suffixMatch[1]}</span>;
        // }
        // Keep mainTextDisplay as is for simpler cases
        mainTextDisplay = detail.mainLabel;
      }
    }

    let valueToRender = detail.value;
    if (String(detail.mainLabel).toLowerCase() === (uiStrings.acBreakdownBaseLabel || "Base").toLowerCase() && typeof detail.value === 'number') {
      valueToRender = <span className="font-bold">{detail.value}</span>;
    } else if ((typeof detail.value === 'number' || (typeof detail.value === 'string' && !isNaN(parseFloat(detail.value as string))))) {
      valueToRender = renderModifierValue(detail.value as number | string);
    }


    return (
      <div key={`${String(detail.mainLabel)}-${index}`} className={cn("flex justify-between items-baseline text-sm mb-0.5", detail.isSubItem && "ml-3")}>
        <span className="text-muted-foreground inline-flex items-baseline">
          {mainTextDisplay}
          {suffixBadgeDisplay}
        </span>
        <span className={cn(detail.isBold && "font-bold", "text-foreground")}>{valueToRender as React.ReactNode}</span>
      </div>
    );
  };

  return (
    <div>
      <h3 className={sectionHeadingClass}>{detailsListHeading}</h3>
      {staticComponents.map((detail, index) => renderItem(detail, `static-${index}`))}

      {conditionalFeatComponents.length > 0 && (
        <>
          <h4 className="text-sm font-medium text-muted-foreground pt-1.5 pb-0.5 mt-1.5">
            {uiStrings.infoDialogConditionalBonusesHeading || "Conditional Bonuses"}
          </h4>
          <div className="space-y-0.5"> 
            {conditionalFeatComponents.map((detail, index) => renderItem(detail, `conditional-${index}`))}
          </div>
        </>
      )}

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
