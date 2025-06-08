
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

  const activeFeatSourcesText = breakdown.featComponents
    .filter(fc => fc.value !== 0)
    .map(fc => `${fc.sourceFeat}${fc.condition ? ` (${fc.condition})` : ''}`)
    .join(', ');

  return (
    <div>
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>{uiStrings.savingThrowsRowLabelBase || "Base"}</span>
          <span className="font-bold">{breakdown.baseSave}</span>
        </div>
        <div className="flex justify-between">
          <span>
            {uiStrings.savingThrowsRowLabelAbilityModifier || "Ability Modifier"}
            <span className="text-muted-foreground"> ({abilityAbbr})</span>
          </span>
          {renderModifierValue(breakdown.abilityMod)}
        </div>
        
        {breakdown.featBonusTotal !== 0 && (
          <div className="flex justify-between">
            <span>
              {uiStrings.savingThrowsFeatsModifierLabel || "Feats Modifier"}
              {activeFeatSourcesText && (
                <span className="ml-1 text-xs text-muted-foreground">({activeFeatSourcesText})</span>
              )}
            </span>
            {renderModifierValue(breakdown.featBonusTotal)}
          </div>
        )}

        {breakdown.magicMod !== 0 && (
          <div className="flex justify-between">
            <span>{uiStrings.savingThrowsRowLabelMagicModifier || "Magic Modifier"}</span>
            {renderModifierValue(breakdown.magicMod)}
          </div>
        )}

        {breakdown.userTemporaryModifier !== 0 && (
            <div className="flex justify-between">
                <span>{uiStrings.savingThrowsRowLabelTemporaryModifier || "Temporary Modifier"}</span>
                {renderModifierValue(breakdown.userTemporaryModifier)}
            </div>
        )}

        <div style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}><Separator /></div>
        <div className="flex justify-between text-base">
          <span className="font-semibold">{uiStrings.savingThrowsRowLabelTotal || "Total"} {breakdown.saveTypeLabel}</span>
          <span className="font-bold text-accent">{renderModifierValue(breakdown.totalSave)}</span>
        </div>
      </div>
    </div>
  );
};
    
