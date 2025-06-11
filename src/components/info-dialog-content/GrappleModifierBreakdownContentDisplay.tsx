
'use client';

import React from 'react';
import type { GrappleModifierBreakdownDetails, AbilityName } from '@/types/character';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge'; // Added Badge import
import { cn } from '@/lib/utils'; // Added cn import

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
        <div className="flex justify-between text-sm items-baseline"> {/* Ensure items-baseline */}
          <span className="text-muted-foreground inline-flex items-baseline"> {/* Ensure items-baseline */}
            {uiStrings.infoDialogGrappleModAbilityLabel || "Ability Modifier"}
            {strengthAbilityInfo && (
              <Badge variant="outline" className={cn("ml-1.5 text-sm font-normal px-1.5 py-0.5 whitespace-nowrap")}>
                {strengthAbilityInfo.abbr}
              </Badge>
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
        <div className="flex justify-between text-lg">
          <span className="font-semibold">{uiStrings.infoDialogGrappleModTotalLabel || "Total Grapple Modifier"}</span>
          <span className="font-bold text-accent">{renderModifierValue(grappleModifierBreakdown.totalGrappleModifier)}</span>
        </div>
      </div>
    </div>
  );
};

