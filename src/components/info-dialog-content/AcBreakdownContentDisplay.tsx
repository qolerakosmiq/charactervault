
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

  const staticComponents: AcBreakdownDetailItem[] = [];
  const conditionalFeatComponents: AcBreakdownDetailItem[] = [];

  detailsList.forEach(detail => {
    if (detail.isActive === false) return; 

    if (detail.isSubItem) {
      conditionalFeatComponents.push(detail);
    } else {
      staticComponents.push(detail);
    }
  });

  const renderItem = (detail: AcBreakdownDetailItem, index: string | number) => {
    let mainText = detail.mainLabel;
    let suffixBadge: React.ReactNode = null;

    if (detail.type === 'acAbilityMod' && detail.abilityAbbr) {
      mainText = detail.mainLabel;
      suffixBadge = <Badge variant="outline" className="ml-1.5">{detail.abilityAbbr}</Badge>;
    } else if (detail.type === 'acSizeMod' && detail.sizeName) {
      mainText = detail.mainLabel;
      suffixBadge = <Badge variant="outline" className="ml-1.5">{detail.sizeName}</Badge>;
    } else if (detail.suffixDetails && detail.suffixDetails.length > 0) {
      suffixBadge = <span className="text-muted-foreground/80 ml-1 text-xs">({detail.suffixDetails.join(", ")})</span>;
    }

    if (typeof mainText === 'string' && !suffixBadge) {
      const suffixMatch = mainText.match(/\s(\([^)]+\))$/);
      if (suffixMatch) {
        mainText = mainText.substring(0, mainText.length - suffixMatch[0].length);
        suffixBadge = <span className="text-muted-foreground/80 ml-1 text-xs">{suffixMatch[1]}</span>;
      }
    }

    let valueToRender = detail.value;
    if (String(detail.mainLabel).toLowerCase() === (uiStrings.acBreakdownBaseLabel || "Base").toLowerCase()) {
      valueToRender = <span className="font-bold">{detail.value}</span>;
    } else if ((typeof detail.value === 'number' || (typeof detail.value === 'string' && !isNaN(parseFloat(detail.value as string))))) {
      valueToRender = renderModifierValue(detail.value as number | string);
    }

    return (
      <div key={`${String(detail.mainLabel)}-${index}`} className={cn("flex justify-between items-baseline text-sm mb-0.5", detail.isSubItem && "ml-3")}>
        <span className="text-muted-foreground inline-flex items-baseline">
          {mainText}
          {suffixBadge}
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
          <Separator className="my-2" />
          <h4 className="text-md font-medium text-muted-foreground mb-1">
            {uiStrings.infoDialogConditionalBonusesHeading || "Conditional Bonuses"}
          </h4>
          {conditionalFeatComponents.map((detail, index) => renderItem(detail, `conditional-${index}`))}
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
