
'use client';

import React from 'react';
import type { SavingThrowType, AbilityName, SingleSavingThrow } from '@/types/character';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface SavingThrowFeatComponent {
  sourceFeat: string;
  value: number;
  condition?: string;
  isActive?: boolean; // Added to indicate if the condition is met
}

export interface SavingThrowBreakdownDetails {
  saveType: SavingThrowType;
  saveTypeLabel: string;
  baseSave: number;
  abilityKey: Exclude<AbilityName, 'none'> | undefined; 
  abilityMod: number;
  magicMod: number;
  userTemporaryModifier: number;
  featBonusTotal: number; 
  featComponents: SavingThrowFeatComponent[]; 
  totalSave: number;
}

interface SavingThrowBreakdownContentDisplayProps {
  breakdown?: SavingThrowBreakdownDetails;
  uiStrings: Record<string, string>;
  abilityLabels: readonly { value: Exclude<AbilityName, 'none'>; label: string; abbr: string }[];
}

export const SavingThrowBreakdownContentDisplay = ({
  breakdown,
  uiStrings,
  abilityLabels,
}: SavingThrowBreakdownContentDisplayProps) => {
  if (!breakdown) return null;

  const abilityAbbr = breakdown.abilityKey
    ? (abilityLabels.find(al => al.value === breakdown.abilityKey)?.abbr || String(breakdown.abilityKey).substring(0,3).toUpperCase())
    : 'N/A';

  return (
    <div>
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{uiStrings.savingThrowsRowLabelBase || "Base"}</span>
          <span className="font-bold">{breakdown.baseSave}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {uiStrings.savingThrowsRowLabelAbilityModifier || "Ability Modifier"}
            <span className="text-muted-foreground/80 ml-1">({abilityAbbr})</span>
          </span>
          {renderModifierValue(breakdown.abilityMod)}
        </div>
        
        {breakdown.featComponents && breakdown.featComponents.length > 0 && breakdown.featBonusTotal !== 0 && (
          breakdown.featComponents.filter(fc => fc.value !== 0).map((fc, index) => (
            <div key={`feat-comp-${index}-${fc.sourceFeat}`} className="flex justify-between items-baseline text-sm">
              <span className="text-muted-foreground flex-shrink-0 mr-2">
                {fc.sourceFeat}
                {fc.condition && (
                  <span className="text-muted-foreground/80 italic ml-1">
                     ({uiStrings[`condition_${fc.condition}`] || fc.condition} - {fc.isActive 
                       ? (uiStrings.conditionalEffectActiveSuffix || "(Active)")
                       : (uiStrings.conditionalEffectInactiveSuffix || "(Inactive)")
                     })
                  </span>
                )}
              </span>
              {renderModifierValue(fc.value)}
            </div>
          ))
        )}

        {breakdown.magicMod !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{uiStrings.savingThrowsRowLabelMagicModifier || "Magic Modifier"}</span>
            {renderModifierValue(breakdown.magicMod)}
          </div>
        )}

        {breakdown.userTemporaryModifier !== 0 && (
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{uiStrings.savingThrowsRowLabelTemporaryModifier || "Temporary Modifier"}</span>
                {renderModifierValue(breakdown.userTemporaryModifier)}
            </div>
        )}

        <Separator className="my-2" />
        <div className="flex justify-between text-xl">
          <span className="font-semibold">{uiStrings.savingThrowsRowLabelTotal || "Total"} {breakdown.saveTypeLabel}</span>
          <span className="font-bold text-accent">{renderModifierValue(breakdown.totalSave)}</span>
        </div>
      </div>
    </div>
  );
};
    
    