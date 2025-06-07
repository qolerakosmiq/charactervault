
'use client';

import React from 'react';
import type { GrappleDamageBreakdownDetails, AbilityName } from '@/types/character';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { Separator } from '@/components/ui/separator';

interface GrappleDamageBreakdownContentDisplayProps {
  grappleDamageBreakdown?: GrappleDamageBreakdownDetails;
  uiStrings: Record<string, string>;
  abilityLabels: readonly { value: Exclude<AbilityName, 'none'>; label: string; abbr: string }[];
}

export const GrappleDamageBreakdownContentDisplay: React.FC<GrappleDamageBreakdownContentDisplayProps> = React.memo(function GrappleDamageBreakdownContentDisplay({
  grappleDamageBreakdown,
  uiStrings,
  abilityLabels,
}) {
  if (!grappleDamageBreakdown) return null;

  const totalNumericBonus = grappleDamageBreakdown.strengthModifier + grappleDamageBreakdown.bonus;
  const displayedTotal = `${grappleDamageBreakdown.baseDamage.split(' ')[0] || '0'}${(totalNumericBonus) !== 0 ? `${(totalNumericBonus) >= 0 ? '+' : ''}${totalNumericBonus}` : ''}`;
  const strengthAbilityInfo = abilityLabels.find(al => al.value === 'strength');

  return (
    <div>
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>{uiStrings.infoDialogGrappleDmgBaseLabel || "Base Damage"}</span>
          <span className="font-bold">
            {grappleDamageBreakdown.baseDamage.split(' ')[0] || 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>{uiStrings.infoDialogGrappleDmgWeaponLabel || "Weapon Damage"}</span>
          {grappleDamageBreakdown.baseDamage.toLowerCase().includes('unarmed') ? (
              <span className="font-semibold text-muted-foreground">{uiStrings.infoDialogGrappleDmgUnarmedLabel || "Unarmed"}</span>
          ) : (
              renderModifierValue(0) 
          )}
        </div>
        <div className="flex justify-between">
          <span>
            {uiStrings.infoDialogGrappleDmgAbilityLabel || "Ability Modifier"}
            {strengthAbilityInfo && (
              <span className="text-muted-foreground"> ({strengthAbilityInfo.abbr})</span>
            )}
          </span>
          {renderModifierValue(grappleDamageBreakdown.strengthModifier)}
        </div>
        {grappleDamageBreakdown.bonus !== 0 && (
          <div className="flex justify-between">
              <span>{uiStrings.infoDialogCustomModifierLabel || "Custom Modifier:"}</span>
              {renderModifierValue(grappleDamageBreakdown.bonus)}
          </div>
        )}
        <div style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}><Separator /></div>
        <div className="flex justify-between text-base">
          <span className="font-semibold">{uiStrings.infoDialogGrappleDmgTotalLabel || "Total"}</span>
          <span className="font-bold text-accent">
            {displayedTotal}
          </span>
        </div>
      </div>
    </div>
  );
});
GrappleDamageBreakdownContentDisplay.displayName = 'GrappleDamageBreakdownContentDisplay';

    
    