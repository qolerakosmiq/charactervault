
'use client';

import React from 'react';
import type { InitiativeBreakdownDetails, AbilityName } from '@/types/character';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface InitiativeBreakdownContentDisplayProps {
  initiativeBreakdown?: InitiativeBreakdownDetails;
  uiStrings: Record<string, string>;
  abilityLabels: readonly { value: Exclude<AbilityName, 'none'>; label: string; abbr: string }[];
}

export const InitiativeBreakdownContentDisplay = ({
  initiativeBreakdown,
  uiStrings,
  abilityLabels,
}: InitiativeBreakdownContentDisplayProps) => {
  if (!initiativeBreakdown) return null;

  const dexterityAbilityInfo = abilityLabels.find(al => al.value === 'dexterity');

  return (
    <div>
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3>
      <div> {/* Removed space-y-1 */}
        <div className="flex justify-between text-sm items-baseline">
          <span className="text-foreground inline-flex items-baseline">
            {uiStrings.infoDialogInitiativeAbilityModLabel || "Ability Modifier"}
            {dexterityAbilityInfo && (
              <Badge variant="outline">{dexterityAbilityInfo.abbr}</Badge>
            )}
          </span>
          {renderModifierValue(initiativeBreakdown.dexModifier)}
        </div>
        {(initiativeBreakdown.featBonus || 0) !== 0 && (
           <div className="flex justify-between text-sm">
              <span className="text-foreground">{uiStrings.infoDialogFeatBonusLabel || "Feat Bonus"}</span>
              {renderModifierValue(initiativeBreakdown.featBonus || 0)}
          </div>
        )}
        {initiativeBreakdown.miscModifier !== 0 && (
          <div className="flex justify-between text-sm">
              <span className="text-foreground">{uiStrings.infoDialogCustomModifierLabel || "Custom Modifier"}</span>
              {renderModifierValue(initiativeBreakdown.miscModifier)}
          </div>
        )}
        <Separator className="my-1" />
        <div className="flex justify-between text-lg">
          <span className="font-semibold">{uiStrings.infoDialogInitiativeTotalLabel || "Total Initiative"}</span>
          <span className="font-bold text-accent">{renderModifierValue(initiativeBreakdown.totalInitiative)}</span>
        </div>
      </div>
    </div>
  );
};

