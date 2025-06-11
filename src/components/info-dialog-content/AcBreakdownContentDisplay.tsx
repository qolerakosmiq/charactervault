
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

  const activeDetailsList = detailsList.filter(detail => detail.isActive !== false || String(detail.mainLabel).toLowerCase() === (uiStrings.acBreakdownBaseLabel || "Base").toLowerCase());

  const staticComponents: AcBreakdownDetailItem[] = [];
  const conditionalFeatComponents: AcBreakdownDetailItem[] = [];

  activeDetailsList.forEach(detail => {
    if (detail.isSubItem && detail.isActive) { 
      conditionalFeatComponents.push(detail);
    } else if (!detail.isSubItem) { 
      staticComponents.push(detail);
    }
  });

  const renderItem = (detail: AcBreakdownDetailItem, index: string | number, isConditionalSubItem: boolean = false) => {
    let mainTextDisplay: React.ReactNode = detail.mainLabel;
    let suffixBadgeDisplay: React.ReactNode = null;

    if (detail.type === 'acAbilityMod' && detail.abilityAbbr) {
      mainTextDisplay = detail.mainLabel;
      suffixBadgeDisplay = <Badge variant="outline">{detail.abilityAbbr}</Badge>;
    } else if (detail.type === 'acSizeMod' && detail.sizeName) {
      mainTextDisplay = detail.mainLabel;
      suffixBadgeDisplay = <Badge variant="outline">{detail.sizeName}</Badge>;
    } else if (detail.suffixDetails && detail.suffixDetails.length > 0 && !isConditionalSubItem) {
      mainTextDisplay = detail.mainLabel;
      suffixBadgeDisplay = <span className="text-muted-foreground/80 ml-1">({detail.suffixDetails.join(", ")})</span>;
    } else if (isConditionalSubItem) {
        mainTextDisplay = detail.mainLabel; 
    }

    let valueToRender = detail.value;
    if (String(detail.mainLabel).toLowerCase() === (uiStrings.acBreakdownBaseLabel || "Base").toLowerCase() && typeof detail.value === 'number') {
      valueToRender = <span className="font-bold">{detail.value}</span>;
    } else if ((typeof detail.value === 'number' || (typeof detail.value === 'string' && !isNaN(parseFloat(detail.value as string))))) {
      valueToRender = renderModifierValue(detail.value as number | string);
    }

    return (
      <div key={`${String(detail.mainLabel)}-${index}`} className={cn("flex justify-between items-baseline text-sm mb-0.5", isConditionalSubItem && "ml-3")}>
        <span className="text-foreground inline-flex items-baseline">
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
      <div className="space-y-0.5">
        {staticComponents.map((detail, index) => renderItem(detail, `static-${index}`))}
      </div>

      {conditionalFeatComponents.length > 0 && (
        <>
          <h4 className="text-sm font-bold text-muted-foreground">
            {uiStrings.infoDialogConditionalBonusesHeading || "Conditional Bonuses"}
          </h4>
          <div className="space-y-0.5">
            {conditionalFeatComponents.map((detail, index) => renderItem(detail, `conditional-${index}`, true))}
          </div>
        </>
      )}

      {totalACValue !== undefined && (
        <>
          <Separator className="my-1" />
          <div className="flex justify-between text-lg">
            <span className="font-semibold">{uiStrings.infoDialogTotalLabel || 'Total'}</span>
            <span className="font-bold text-accent">{renderModifierValue(totalACValue)}</span>
          </div>
        </>
      )}
    </div>
  );
};
