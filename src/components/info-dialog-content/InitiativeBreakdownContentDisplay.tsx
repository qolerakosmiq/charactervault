
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

export const InitiativeBreakdownContentDisplay: React.FC<InitiativeBreakdownContentDisplayProps> = React.memo(function InitiativeBreakdownContentDisplay({
  initiativeBreakdown,
  uiStrings,
  abilityLabels,
}) {
  if (!initiativeBreakdown) return null;

  const dexterityAbilityInfo = abilityLabels.find(al => al.value === 'dexterity');

  return (
    <div>
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>
            {uiStrings.infoDialogInitiativeAbilityModLabel || "Ability Modifier"}
            {dexterityAbilityInfo && (
              <span className="text-muted-foreground"> ({dexterityAbilityInfo.abbr})</span>
            )}
          </span>
          {renderModifierValue(initiativeBreakdown.dexModifier)}
        </div>
        {initiativeBreakdown.miscModifier !== 0 && (
          <div className="flex justify-between">
              <span>{uiStrings.infoDialogCustomModifierLabel || "Custom Modifier"}</span>
              {renderModifierValue(initiativeBreakdown.miscModifier)}
          </div>
        )}
        <div style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}><Separator /></div>
        <div className="flex justify-between text-base">
          <span className="font-semibold">{uiStrings.infoDialogInitiativeTotalLabel || "Total Initiative"}</span>
          <span className="font-bold text-accent">{renderModifierValue(initiativeBreakdown.totalInitiative)}</span>
        </div>
      </div>
    </div>
  );
});
InitiativeBreakdownContentDisplay.displayName = 'InitiativeBreakdownContentDisplay';

    
    