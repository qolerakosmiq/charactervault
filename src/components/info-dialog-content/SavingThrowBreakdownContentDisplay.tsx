
'use client';

import React from 'react';
import type { SavingThrowType, AbilityName, SingleSavingThrow } from '@/types/character';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

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
  userMiscModifier: number; // This is the "Temporary Modifier" from the panel
  featBonusTotal: number; // Sum of all feat contributions for this save
  featComponents: SavingThrowFeatComponent[]; // Individual feat contributions
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
        {breakdown.magicMod !== 0 && (
          <div className="flex justify-between">
            <span>{uiStrings.savingThrowsRowLabelMagicModifier || "Magic Modifier"}</span>
            {renderModifierValue(breakdown.magicMod)}
          </div>
        )}
        {breakdown.userMiscModifier !== 0 && (
            <div className="flex justify-between">
                <span>{uiStrings.savingThrowsRowLabelTemporaryModifier || "Temporary Modifier"}</span>
                {renderModifierValue(breakdown.userMiscModifier)}
            </div>
        )}
        {breakdown.featComponents.length > 0 && (
            <>
                <div className="pt-1">
                    <span className="font-medium text-muted-foreground">{uiStrings.savingThrowsFeatContributionsLabel || "Feat Contributions"}:</span>
                </div>
                {breakdown.featComponents.map((featComp, index) => (
                    <div key={`feat-${index}-${featComp.sourceFeat}`} className="flex justify-between pl-2">
                        <span className="italic text-xs">
                        {featComp.sourceFeat}
                        {featComp.condition && <span className="text-muted-foreground/80"> ({featComp.condition})</span>}
                        </span>
                        <span className="text-xs">{renderModifierValue(featComp.value)}</span>
                    </div>
                ))}
                 {breakdown.featComponents.length > 0 && breakdown.featBonusTotal !== 0 && ( 
                    <div className="flex justify-between pl-2">
                        <span className="italic font-medium text-xs">{uiStrings.infoDialogTotalLabelFeats || "Total (from feats)"}</span>
                        <span className="font-medium text-xs">{renderModifierValue(breakdown.featBonusTotal)}</span>
                    </div>
                 )}
            </>
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
    
