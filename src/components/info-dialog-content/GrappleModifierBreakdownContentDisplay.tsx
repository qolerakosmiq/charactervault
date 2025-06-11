
'use client';

import React from 'react';
import type { GrappleModifierBreakdownDetails, AbilityName } from '@/types/character';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
      <div>
        <div className="flex justify-between text-sm">
          <span className="text-foreground">{uiStrings.infoDialogGrappleModBabLabel || "Base Attack Bonus"}</span>
          <span className="font-bold">{renderModifierValue(grappleModifierBreakdown.baseAttackBonus)}</span>
        </div>
        <div className="flex justify-between text-sm items-baseline">
          <span className="text-foreground inline-flex items-baseline">
            {uiStrings.infoDialogGrappleModAbilityLabel || "Ability Modifier"}
            {strengthAbilityInfo && <>{'\u00A0'}<Badge variant="outline">{strengthAbilityInfo.abbr}</Badge></>}
          </span>
          {renderModifierValue(grappleModifierBreakdown.strengthModifier)}
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-foreground">{uiStrings.infoDialogGrappleModSizeLabel || "Size Modifier"}</span>
          {renderModifierValue(grappleModifierBreakdown.sizeModifierGrapple)}
        </div>
        {(grappleModifierBreakdown.featBonus || 0) !== 0 && (
          <div className="flex justify-between text-sm">
              <span className="text-foreground">{uiStrings.infoDialogFeatBonusLabel || "Feat Bonus"}</span>
              {renderModifierValue(grappleModifierBreakdown.featBonus || 0)}
          </div>
        )}
        {grappleModifierBreakdown.miscModifier !== 0 && (
          <div className="flex justify-between text-sm">
              <span className="text-foreground">{uiStrings.infoDialogCustomModifierLabel || "Custom Modifier"}</span>
              {renderModifierValue(grappleModifierBreakdown.miscModifier)}
          </div>
        )}
        <Separator className="mt-2 mb-1" />
        <div className="flex justify-between text-lg">
          <span className="font-semibold">{uiStrings.infoDialogGrappleModTotalLabel || "Total Grapple Modifier"}</span>
          <span className="font-bold text-accent">{renderModifierValue(grappleModifierBreakdown.totalGrappleModifier)}</span>
        </div>
      </div>
    </div>
  );
};
