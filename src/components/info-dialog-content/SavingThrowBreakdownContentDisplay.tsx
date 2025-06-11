
'use client';

import React from 'react';
import type { SavingThrowType, AbilityName, SingleSavingThrow, AggregatedFeatEffectBase } from '@/types/character'; // Added AggregatedFeatEffectBase
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface SavingThrowFeatComponent extends AggregatedFeatEffectBase { // Now extends base for isActive
  sourceFeat: string;
  value: number;
  condition?: string;
  // isActive is inherited
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

  const activeFeatComponents = breakdown.featComponents?.filter(fc => fc.isActive && fc.value !== 0) || [];

  return (
    <div>
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-foreground">{uiStrings.savingThrowsRowLabelBase || "Base"}</span>
          <span className="font-bold">{breakdown.baseSave}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-foreground inline-flex items-baseline">
            {uiStrings.savingThrowsRowLabelAbilityModifier || "Ability Modifier"}
            <Badge variant="outline" className="ml-1.5">{abilityAbbr}</Badge>
          </span>
          {renderModifierValue(breakdown.abilityMod)}
        </div>

        {activeFeatComponents.length > 0 && (
          <>
            <h4 className="text-sm font-bold text-muted-foreground pb-0.5">
                {uiStrings.savingThrowsFeatsModifierLabel || "Feats Modifier"}
            </h4>
            {activeFeatComponents.map((fc, index) => (
              <div key={`feat-comp-${index}-${fc.sourceFeat}`} className="flex justify-between items-baseline text-sm ml-3">
                <span className="text-foreground flex-shrink-0 mr-2">
                  {fc.sourceFeat}
                </span>
                {renderModifierValue(fc.value)}
              </div>
            ))}
          </>
        )}

        {breakdown.magicMod !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-foreground">{uiStrings.savingThrowsRowLabelMagicModifier || "Magic Modifier"}</span>
            {renderModifierValue(breakdown.magicMod)}
          </div>
        )}

        {breakdown.userTemporaryModifier !== 0 && (
            <div className="flex justify-between text-sm">
                <span className="text-foreground">{uiStrings.savingThrowsRowLabelTemporaryModifier || "Temporary Modifier"}</span>
                {renderModifierValue(breakdown.userTemporaryModifier)}
            </div>
        )}

        <Separator className="my-2" />
        <div className="flex justify-between text-lg">
          <span className="font-semibold">{uiStrings.savingThrowsRowLabelTotal || "Total"} {breakdown.saveTypeLabel}</span>
          <span className="font-bold text-accent">{renderModifierValue(breakdown.totalSave)}</span>
        </div>
      </div>
    </div>
  );
};

