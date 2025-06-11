
'use client';

import React from 'react';
import type { GrappleDamageBreakdownDetails, AbilityName } from '@/types/character';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface GrappleDamageBreakdownContentDisplayProps {
  grappleDamageBreakdown?: GrappleDamageBreakdownDetails;
  uiStrings: Record<string, string>;
  abilityLabels: readonly { value: Exclude<AbilityName, 'none'>; label: string; abbr: string }[];
}

export const GrappleDamageBreakdownContentDisplay = ({
  grappleDamageBreakdown,
  uiStrings,
  abilityLabels,
}: GrappleDamageBreakdownContentDisplayProps) => {
  if (!grappleDamageBreakdown) return null;

  const totalNumericBonus = grappleDamageBreakdown.strengthModifier + grappleDamageBreakdown.bonus + (grappleDamageBreakdown.featBonus || 0);
  const displayedTotal = `${grappleDamageBreakdown.baseDamage.split(' ')[0] || '0'}${(totalNumericBonus) !== 0 ? `${(totalNumericBonus) >= 0 ? '+' : ''}${totalNumericBonus}` : ''}`;
  const strengthAbilityInfo = abilityLabels.find(al => al.value === 'strength');

  return (
    <div>
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3>
      <div>
        <div className="flex justify-between text-sm">
          <span className="text-foreground">{uiStrings.infoDialogGrappleDmgBaseLabel || "Base Damage"}</span>
          <span className="font-bold">
            {grappleDamageBreakdown.baseDamage.split(' ')[0] || 'N/A'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-foreground">{uiStrings.infoDialogGrappleDmgWeaponLabel || "Weapon Damage"}</span>
          {grappleDamageBreakdown.baseDamage.toLowerCase().includes('unarmed') ? (
              <span className="font-semibold text-muted-foreground ml-1">({uiStrings.infoDialogGrappleDmgUnarmedLabel || "Unarmed"})</span>
          ) : (
            <span className="font-bold">{renderModifierValue(0)}</span>
          )}
        </div>
        <div className="flex justify-between text-sm items-baseline">
          <span className="text-foreground inline-flex items-baseline">
            {uiStrings.infoDialogGrappleDmgAbilityLabel || "Ability Modifier"}
            {strengthAbilityInfo && <>{' '}<Badge variant="outline">{strengthAbilityInfo.abbr}</Badge></>}
          </span>
          {renderModifierValue(grappleDamageBreakdown.strengthModifier)}
        </div>
        {(grappleDamageBreakdown.featBonus || 0) !== 0 && (
          <div className="flex justify-between text-sm">
              <span className="text-foreground">{uiStrings.infoDialogFeatBonusLabel || "Feat Bonus"}</span>
              {renderModifierValue(grappleDamageBreakdown.featBonus || 0)}
          </div>
        )}
        {grappleDamageBreakdown.bonus !== 0 && (
          <div className="flex justify-between text-sm">
              <span className="text-foreground">{uiStrings.infoDialogCustomModifierLabel || "Custom Modifier"}</span>
              {renderModifierValue(grappleDamageBreakdown.bonus)}
          </div>
        )}
        <Separator className="mt-2 mb-1" />
        <div className="flex justify-between text-lg">
          <span className="font-semibold">{uiStrings.infoDialogGrappleDmgTotalLabel || "Total"}</span>
          <span className="font-bold text-accent">
            {displayedTotal}
          </span>
        </div>
      </div>
    </div>
  );
};
