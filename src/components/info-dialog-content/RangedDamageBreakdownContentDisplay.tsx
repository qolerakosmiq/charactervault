
'use client';

import React from 'react';
import type { GenericBreakdownItem } from '@/types/character-core';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RangedDamageBreakdownContentDisplayProps {
  components?: GenericBreakdownItem[];
  uiStrings: Record<string, string>;
}

export const RangedDamageBreakdownContentDisplay = ({
  components,
  uiStrings,
}: RangedDamageBreakdownContentDisplayProps) => {
  if (!components || components.length === 0) return null;

  const totalItem = components.find(c => c.label === (uiStrings.infoDialogTotalNumericBonusLabel || "Total Numeric Bonus"));
  const regularComponents = components.filter(c => c.label !== (uiStrings.infoDialogTotalNumericBonusLabel || "Total Numeric Bonus"));
  const baseDamageItem = regularComponents.find(c => c.label === (uiStrings.attacksPanelBaseWeaponDamageLabel || "Base Weapon Damage"));
  const otherNumericComponents = regularComponents.filter(c => c.label !== (uiStrings.attacksPanelBaseWeaponDamageLabel || "Base Weapon Damage"));

  const finalDisplayedDamage = `${baseDamageItem?.value || '0'}${totalItem && typeof totalItem.value === 'number' && totalItem.value !== 0 ? `${totalItem.value >= 0 ? '+' : ''}${totalItem.value}` : ''}`;

  return (
    <div>
      {/* <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3> */}
      <div className="space-y-0.5">
        {baseDamageItem && (
            <div className="flex justify-between text-sm items-baseline">
                <span className="text-foreground">{baseDamageItem.label}</span>
                <span className="font-bold text-foreground">{baseDamageItem.value}</span>
            </div>
        )}
        {otherNumericComponents.map((item, index) => {
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
            <div key={`ranged-dmg-comp-${index}`} className="flex justify-between text-sm items-baseline">
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
              <span className="font-semibold">{uiStrings.infoDialogGrappleDmgTotalLabel || "Total Damage"}</span>
              <span className="font-bold text-accent">{finalDisplayedDamage}</span>
            </div>
             <p className="text-xs text-muted-foreground text-right">
                ({uiStrings.infoDialogTotalNumericBonusLabel || "Total Numeric Bonus"}: {renderModifierValue(totalItem.value as number | string)})
            </p>
          </>
        )}
      </div>
    </div>
  );
};
