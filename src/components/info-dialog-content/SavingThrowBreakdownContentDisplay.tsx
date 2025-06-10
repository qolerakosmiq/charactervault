
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

  const activeFeatSourceNamesAndConditions = breakdown.featComponents
    .filter(fc => fc.value !== 0) 
    .map(fc => fc.condition ? `${fc.sourceFeat} (${fc.condition})` : fc.sourceFeat);


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
        
        {breakdown.featBonusTotal !== 0 && (
          <div className="flex justify-between items-baseline text-sm">
            <span className="text-muted-foreground flex-shrink-0 mr-2">
              {uiStrings.savingThrowsFeatsModifierLabel || "Feats Modifier"}
              {activeFeatSourceNamesAndConditions.length > 0 && (
                <span className="text-muted-foreground/80 ml-1">
                  ({activeFeatSourceNamesAndConditions.join(", ")})
                </span>
              )}
            </span>
            {renderModifierValue(breakdown.featBonusTotal)}
          </div>
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
    
