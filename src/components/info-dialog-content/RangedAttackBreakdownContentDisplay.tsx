
'use client';

import React from 'react';
import type { GenericBreakdownItem } from '@/types/character-core';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RangedAttackBreakdownContentDisplayProps {
  components?: GenericBreakdownItem[];
  uiStrings: Record<string, string>;
}

export const RangedAttackBreakdownContentDisplay = ({
  components,
  uiStrings,
}: RangedAttackBreakdownContentDisplayProps) => {
  if (!components || components.length === 0) return null;

  const totalItem = components.find(c => c.label === (uiStrings.infoDialogTotalLabel || "Total"));
  const regularComponents = components.filter(c => c.label !== (uiStrings.infoDialogTotalLabel || "Total"));

  return (
    <div>
      {/* <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3> */}
      <div className="space-y-0.5">
        {regularComponents.map((item, index) => {
          let labelText = item.label;
          let abilityAbbr: string | undefined;
          const labelMatch = typeof item.label === 'string' ? item.label.match(/^(.*)\s+\(([^)]+)\)$/) : null;
           if (labelMatch) {
              labelText = labelMatch[1];
              const potentialAbbr = labelMatch[2].toUpperCase();
              if (potentialAbbr.length === 3 && potentialAbbr === potentialAbbr.toUpperCase()) {
                  abilityAbbr = potentialAbbr;
              }
          }

          return (
            <div key={`ranged-atk-comp-${index}`} className="flex justify-between text-sm items-baseline">
              <span className="text-foreground inline-flex items-baseline">
                {labelText}
                {abilityAbbr && <>{'\u00A0'}<Badge variant="outline" className="font-normal">{abilityAbbr}</Badge></>}
              </span>
               {item.isRawValue ? (
                <span className={cn("font-bold text-foreground", item.isBold && "font-bold")}>
                  {item.value}
                </span>
              ) : (
                <span className={cn("font-semibold text-foreground", item.isBold && "font-bold")}>
                  {renderModifierValue(item.value as number | string)}
                </span>
              )}
            </div>
          );
        })}
        {totalItem && (
          <>
            <Separator className="mt-2 mb-1" />
            <div className="flex justify-between text-lg">
              <span className="font-semibold">{totalItem.label}</span>
              <span className="font-bold text-accent">{renderModifierValue(totalItem.value as number | string)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
