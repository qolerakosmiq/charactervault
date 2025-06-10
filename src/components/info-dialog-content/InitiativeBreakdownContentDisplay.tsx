
'use client';

import React from 'react';
import type { InitiativeBreakdownDetails, AbilityName } from '@/types/character';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { Separator } from '@/components/ui/separator';

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
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {uiStrings.infoDialogInitiativeAbilityModLabel || "Ability Modifier"}
            {dexterityAbilityInfo && (
              <span className="text-muted-foreground/80 ml-1"> ({dexterityAbilityInfo.abbr})</span>
            )}
          </span>
          {renderModifierValue(initiativeBreakdown.dexModifier)}
        </div>
        {initiativeBreakdown.featBonus !== 0 && initiativeBreakdown.featBonus !== undefined && (
           <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{uiStrings.infoDialogFeatBonusLabel || "Feat Bonus"}</span>
              {renderModifierValue(initiativeBreakdown.featBonus)}
          </div>
        )}
        {initiativeBreakdown.miscModifier !== 0 && (
          <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{uiStrings.infoDialogCustomModifierLabel || "Custom Modifier"}</span>
              {renderModifierValue(initiativeBreakdown.miscModifier)}
          </div>
        )}
        <Separator className="my-2" />
        <div className="flex justify-between text-xl">
          <span className="font-semibold">{uiStrings.infoDialogInitiativeTotalLabel || "Total Initiative"}</span>
          <span className="font-bold text-accent">{renderModifierValue(initiativeBreakdown.totalInitiative)}</span>
        </div>
      </div>
    </div>
  );
};

