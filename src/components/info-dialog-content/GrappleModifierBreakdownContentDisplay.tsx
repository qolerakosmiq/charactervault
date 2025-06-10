
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

export const GrappleModifierBreakdownContentDisplay = ({
  grappleModifierBreakdown,
  uiStrings,
  abilityLabels,
}: GrappleModifierBreakdownContentDisplayProps) => {
  if (!grappleModifierBreakdown) return null;

  const strengthAbilityInfo = abilityLabels.find(al => al.value === 'strength');

  return (
    <div>
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{uiStrings.infoDialogGrappleModBabLabel || "Base Attack Bonus"}</span>
          <span className="font-bold">{renderModifierValue(grappleModifierBreakdown.baseAttackBonus)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {uiStrings.infoDialogGrappleModAbilityLabel || "Ability Modifier"}
            {strengthAbilityInfo && (
              <span className="text-muted-foreground/80 ml-1">({strengthAbilityInfo.abbr})</span>
            )}
          </span>
          {renderModifierValue(grappleModifierBreakdown.strengthModifier)}
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{uiStrings.infoDialogGrappleModSizeLabel || "Size Modifier"}</span>
          {renderModifierValue(grappleModifierBreakdown.sizeModifierGrapple)}
        </div>
        {grappleModifierBreakdown.featBonus !== 0 && grappleModifierBreakdown.featBonus !== undefined && (
          <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{uiStrings.infoDialogFeatBonusLabel || "Feat Bonus"}</span>
              {renderModifierValue(grappleModifierBreakdown.featBonus)}
          </div>
        )}
        {grappleModifierBreakdown.miscModifier !== 0 && (
          <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{uiStrings.infoDialogCustomModifierLabel || "Custom Modifier"}</span>
              {renderModifierValue(grappleModifierBreakdown.miscModifier)}
          </div>
        )}
        <Separator className="my-2" />
        <div className="flex justify-between text-xl">
          <span className="font-semibold">{uiStrings.infoDialogGrappleModTotalLabel || "Total Grapple Modifier"}</span>
          <span className="font-bold text-accent">{renderModifierValue(grappleModifierBreakdown.totalGrappleModifier)}</span>
        </div>
      </div>
    </div>
  );
};

