
'use client';

import React from 'react';
import type { AbilityName, AggregatedFeatEffects } from '@/types/character';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';

export interface AcBreakdownDetailItem {
  label: string | React.ReactNode; // Allow ReactNode for already complex labels
  value: string | number | React.ReactNode;
  isBold?: boolean;
  type?: 'acAbilityMod' | 'acSizeMod' | 'acFeatBonus';
  abilityAbbr?: string;
  sizeName?: string;
  featSource?: string;
  condition?: string;
}

interface AcBreakdownContentDisplayProps {
  detailsList?: AcBreakdownDetailItem[];
  totalACValue?: number;
  detailsListHeading: string;
  uiStrings: Record<string, string>;
  abilityLabels: readonly { value: Exclude<AbilityName, 'none'>; label: string; abbr: string }[];
  aggregatedFeatEffects?: AggregatedFeatEffects | null;
  acType?: 'Normal' | 'Touch' | 'Flat-Footed';
}

export const AcBreakdownContentDisplay = ({
  detailsList,
  totalACValue,
  detailsListHeading,
  uiStrings,
  abilityLabels,
  aggregatedFeatEffects,
  acType,
}: AcBreakdownContentDisplayProps) => {
  if (!detailsList || detailsList.length === 0) return null;

  return (
    <div>
      <h3 className={sectionHeadingClass}>{detailsListHeading}</h3>
      {detailsList.map((detail, index) => {
        const valueToRender = (typeof detail.value === 'number' || (typeof detail.value === 'string' && !isNaN(parseFloat(detail.value as string)))) && !String(detail.label).toLowerCase().includes('base attack bonus')
            ? renderModifierValue(detail.value as number | string)
            : detail.value;

        let labelNode: React.ReactNode;

        if (typeof detail.label === 'string') {
          const match = detail.label.match(/^(.*?)(\s\([^)]*\))?$/);
          if (match && match[2]) { // If there's a parenthetical suffix like " (Dodge)" or " (Source1, Source2)"
            const mainText = match[1];
            const suffixText = match[2].trim(); // e.g., "(Dodge)"
            labelNode = (
              <>
                {mainText}
                <span className="text-xs text-muted-foreground ml-1">{suffixText}</span>
              </>
            );
          } else if (detail.type === 'acAbilityMod' && detail.abilityAbbr) {
            const baseLabelText = detail.label.replace(`(${detail.abilityAbbr})`, "").trim();
            labelNode = (
              <>
                {baseLabelText || uiStrings.infoDialogAcAbilityLabel || "Ability Modifier"}
                <span className="text-xs text-muted-foreground ml-1">({detail.abilityAbbr})</span>
              </>
            );
          } else if (detail.type === 'acSizeMod' && detail.sizeName) {
            const baseLabelText = detail.label.replace(`(${detail.sizeName})`, "").trim();
            labelNode = (
              <>
                {baseLabelText || uiStrings.infoDialogSizeModifierLabel || "Size Modifier"}
                <span className="text-xs text-muted-foreground ml-1">({detail.sizeName})</span>
              </>
            );
          } else if (detail.type === 'acFeatBonus' && detail.condition) {
             labelNode = (
              <>
                {detail.label} {/* Assume detail.label is just the feat name here */}
                <span className="text-xs text-muted-foreground italic ml-1">({detail.condition})</span>
              </>
            );
          }
          else {
            labelNode = detail.label;
          }
        } else {
          // If detail.label is already a ReactNode, use it as is
          labelNode = detail.label;
        }

        const labelContent = <span className="text-foreground">{labelNode}</span>;

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
