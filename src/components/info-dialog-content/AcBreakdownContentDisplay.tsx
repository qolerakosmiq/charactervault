
'use client';

import React from 'react';
import type { AbilityName, AggregatedFeatEffects } from '@/types/character';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';

export interface AcBreakdownDetailItem {
  label: string;
  value: string | number | React.ReactNode;
  isBold?: boolean;
  type?: 'acAbilityMod' | 'acSizeMod' | 'acFeatBonus';
  abilityAbbr?: string; 
  sizeName?: string;   
  featSource?: string; // For feat bonuses
  condition?: string; // For conditional feat bonuses
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

  const allDetailsToRender: AcBreakdownDetailItem[] = [...detailsList];

  if (aggregatedFeatEffects?.acBonuses && acType) {
    aggregatedFeatEffects.acBonuses.forEach(featEffect => {
      let effectApplies = false;
      if (!featEffect.appliesToScope || featEffect.appliesToScope.length === 0) {
        effectApplies = true; // Applies to all if scope not defined
      } else {
        if (acType === 'Normal' && featEffect.appliesToScope.includes('normal')) effectApplies = true;
        if (acType === 'Touch' && featEffect.appliesToScope.includes('touch')) effectApplies = true;
        if (acType === 'Flat-Footed' && featEffect.appliesToScope.includes('flatFooted')) effectApplies = true;
         // If appliesToScope is not defined, assume it applies to Normal AC at least
        if (acType === 'Normal' && !featEffect.appliesToScope) effectApplies = true;
      }
      
      if (effectApplies && typeof featEffect.value === 'number' && featEffect.value !== 0) {
          // Determine if the bonus type is already covered by a main category (armor, shield, natural, deflection, dodge)
          const isMainCategoryBonus = ["armor", "shield", "natural", "deflection", "dodge"].includes(featEffect.acType);
          
          if (!isMainCategoryBonus) {
            const featSourceLabel = featEffect.sourceFeat || (uiStrings.infoDialogUnknownFeatSource || "Unknown Feat");
            let labelText = `${featSourceLabel} (${featEffect.acType})`;
            if (featEffect.acType === "monk_wisdom") {
                labelText = uiStrings.abilityScoreSourceMonkWisdom || "Monk Wisdom Bonus";
            }

            allDetailsToRender.push({
                label: labelText,
                value: featEffect.value,
                type: 'acFeatBonus',
                featSource: featEffect.sourceFeat,
                condition: featEffect.condition,
            });
          }
      } else if (effectApplies && featEffect.acType === "monk_wisdom" && featEffect.value === "WIS" && abilityLabels) {
          // Handle Monk Wisdom to AC specifically
          const wisAbilityInfo = abilityLabels.find(al => al.value === 'wisdom');
          const wisMod = wisAbilityInfo ? (uiStrings.abilityScoreSourceMonkWisdom || "Monk Wisdom Bonus") : "Wisdom"; // Fallback label
           allDetailsToRender.push({
              label: wisMod,
              value: "(Actual Wis Mod)", // Placeholder, real value comes from character stats
              type: 'acFeatBonus',
              featSource: featEffect.sourceFeat || (uiStrings.infoDialogUnknownFeatSource || "Unknown Feat"),
              condition: featEffect.condition,
          });
      }
    });
  }


  return (
    <div>
      <h3 className={sectionHeadingClass}>{detailsListHeading}</h3>
      {allDetailsToRender.map((detail, index) => {
        const valueToRender = (typeof detail.value === 'number' || (typeof detail.value === 'string' && !isNaN(parseFloat(detail.value as string)))) && !String(detail.label).toLowerCase().includes('base attack bonus')
            ? renderModifierValue(detail.value as number | string)
            : detail.value;
        
        let labelContent: React.ReactNode = <span className="text-foreground">{detail.label}</span>;

        if (detail.type === 'acAbilityMod' && detail.abilityAbbr) {
          labelContent = (
            <span className="text-foreground">
              {detail.label}
              <span className="text-muted-foreground"> ({detail.abilityAbbr})</span>
            </span>
          );
        } else if (detail.type === 'acSizeMod' && detail.sizeName) {
          labelContent = (
            <span className="text-foreground">
              {detail.label}
              <span className="text-muted-foreground"> ({detail.sizeName})</span>
            </span>
          );
        } else if (detail.type === 'acFeatBonus' && detail.condition) {
            labelContent = (
            <span className="text-foreground">
              {detail.label}
              <span className="text-xs text-muted-foreground italic ml-1">({detail.condition})</span>
            </span>
          );
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

