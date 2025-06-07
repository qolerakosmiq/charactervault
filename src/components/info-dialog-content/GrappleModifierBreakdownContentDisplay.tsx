
'use client';

import React from 'react';
import type { GrappleModifierBreakdownDetails, AbilityName } from '@/types/character';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { Separator } from '@/components/ui/separator';

interface GrappleModifierBreakdownContentDisplayProps {
  grappleModifierBreakdown?: GrappleModifierBreakdownDetails;
  uiStrings: Record<string, string>;
  abilityLabels: readonly { value: Exclude<AbilityName, 'none'>; label: string; abbr: string }[];
}

export const GrappleModifierBreakdownContentDisplay = React.memo(function GrappleModifierBreakdownContentDisplayComponent({
  grappleModifierBreakdown,
  uiStrings,
  abilityLabels,
}: GrappleModifierBreakdownContentDisplayProps) {
  if (!grappleModifierBreakdown) return null;

  const strengthAbilityInfo = abilityLabels.find(al => al.value === 'strength');

  return (
    <div>
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>{uiStrings.infoDialogGrappleModBabLabel || "Base Attack Bonus"}</span>
          {renderModifierValue(grappleModifierBreakdown.baseAttackBonus)}
        </div>
        <div className="flex justify-between">
          <span>
            {uiStrings.infoDialogGrappleModAbilityLabel || "Ability Modifier"}
            {strengthAbilityInfo && (
              <span className="text-muted-foreground"> ({strengthAbilityInfo.abbr})</span>
            )}
          </span>
          {renderModifierValue(grappleModifierBreakdown.strengthModifier)}
        </div>
        <div className="flex justify-between">
          <span>{uiStrings.infoDialogGrappleModSizeLabel || "Size Modifier"}</span>
          {renderModifierValue(grappleModifierBreakdown.sizeModifierGrapple)}
        </div>
        {grappleModifierBreakdown.miscModifier !== 0 && (
          <div className="flex justify-between">
              <span>{uiStrings.infoDialogCustomModifierLabel || "Custom Modifier"}</span>
              {renderModifierValue(grappleModifierBreakdown.miscModifier)}
          </div>
        )}
        <div style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}><Separator /></div>
        <div className="flex justify-between text-base">
          <span className="font-semibold">{uiStrings.infoDialogGrappleModTotalLabel || "Total Grapple Modifier"}</span>
          <span className="font-bold text-accent">{renderModifierValue(grappleModifierBreakdown.totalGrappleModifier)}</span>
        </div>
      </div>
    </div>
  );
});
GrappleModifierBreakdownContentDisplay.displayName = 'GrappleModifierBreakdownContentDisplay';
