
'use client';

import React from 'react';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface AcBreakdownContentDisplayProps {
  detailsList?: Array<{ label: string; value: string | number | React.ReactNode; isBold?: boolean }>;
  totalACValue?: number;
  detailsListHeading: string;
  uiStrings: Record<string, string>;
  abilityLabels: readonly { value: string; label: string; abbr: string }[]; // For parsing ability names
}

export const AcBreakdownContentDisplay: React.FC<AcBreakdownContentDisplayProps> = ({
  detailsList,
  totalACValue,
  detailsListHeading,
  uiStrings,
  abilityLabels,
}) => {
  if (!detailsList || detailsList.length === 0) return null;

  return (
    <div>
      <h3 className={sectionHeadingClass}>{detailsListHeading}</h3>
      {detailsList.map((detail, index) => {
        const valueToRender = (typeof detail.value === 'number' || (typeof detail.value === 'string' && !isNaN(parseFloat(detail.value as string)))) && !detail.label.toLowerCase().includes('base attack bonus')
            ? renderModifierValue(detail.value as number | string)
            : detail.value;
        
        let labelContent: React.ReactNode = <span className="text-foreground">{detail.label}</span>;
        if (typeof detail.label === 'string') {
          const abilityMatch = (detail.label as string).match(/{(abilityAbbr|abilityFull)}\s\({(abilityAbbr|abilityFull)}\)\sModifier:/);
          if (abilityMatch) {
              const abilityKey = (detail.label as string).toLowerCase().includes("dexterity") ? 'dexterity' : 'strength'; 
              const abilityLabelInfo = abilityLabels.find(al => al.value === abilityKey);
              const abbr = abilityLabelInfo?.abbr || abilityKey.substring(0,3).toUpperCase();
              const full = abilityLabelInfo?.label || abilityKey.charAt(0).toUpperCase() + abilityKey.slice(1);
              labelContent = (
                  <span className="text-foreground">
                      {(uiStrings.infoDialogInitiativeAbilityModLabel || "{abilityAbbr} ({abilityFull}) Modifier:").replace("{abilityAbbr}", abbr).replace("{abilityFull}", full)}
                  </span>
              );
          }
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
