
'use client';

import React from 'react';
import type { Character, AggregatedFeatEffects, DetailedAbilityScores, AbilityName } from '@/types/character';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { calculateAbilityModifier } from '@/lib/dnd-utils';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface MaxHpBreakdownContentDisplayProps {
  character: Character;
  detailedAbilityScores: DetailedAbilityScores | null;
  aggregatedFeatEffects: AggregatedFeatEffects | null;
  uiStrings: Record<string, string>;
  abilityLabels: readonly { value: Exclude<AbilityName, 'none'>; label: string; abbr: string }[];
}

export const MaxHpBreakdownContentDisplay = ({
  character,
  detailedAbilityScores,
  aggregatedFeatEffects,
  uiStrings,
  abilityLabels,
}: MaxHpBreakdownContentDisplayProps) => {
  if (!character || !detailedAbilityScores || !aggregatedFeatEffects) return null;

  const baseHp = character.baseMaxHp || 0;
  const finalConstitutionModifier = calculateAbilityModifier(detailedAbilityScores.constitution.finalScore);
  const miscModifierValue = aggregatedFeatEffects.hpBonus || 0;
  const customModifier = character.customMaxHpModifier || 0;
  const totalMaxHp = character.maxHp;

  const conAbbr = abilityLabels.find(al => al.value === 'constitution')?.abbr || 'CON';

  let miscModifierSubLabel = "";
  if (miscModifierValue !== 0 && aggregatedFeatEffects.hpBonusSources && aggregatedFeatEffects.hpBonusSources.length > 0) {
    const activeFeatSources = aggregatedFeatEffects.hpBonusSources
      .filter(source => source.isActive && !source.condition)
      .map(source => source.sourceFeatName)
      .filter(name => !!name);
    if (activeFeatSources.length > 0) {
      miscModifierSubLabel = `(${activeFeatSources.join(', ')})`;
    }
  }

  const conditionalHpBonuses = aggregatedFeatEffects.hpBonusSources.filter(
    source => source.condition && source.isActive && typeof source.value === 'number' && source.value !== 0
  );

  return (
    <div>
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3>
      <div>
        <div className="flex justify-between text-sm">
          <span className="text-foreground">{uiStrings.maxHpDialogBaseHpLabel || "Base Hit Points"}</span>
          <span className="font-bold">{baseHp}</span>
        </div>
        <div className="flex justify-between text-sm items-baseline">
          <span className="text-foreground inline-flex items-baseline">
            {uiStrings.maxHpDialogAbilityModLabel || "Ability Modifier"}{'\u00A0'}
            <Badge variant="outline">{conAbbr}</Badge>
          </span>
          {renderModifierValue(finalConstitutionModifier)}
        </div>
        {miscModifierValue !== 0 && (
            <div className="flex justify-between items-baseline text-sm">
                <span className="text-foreground flex-shrink-0 mr-2">
                    {uiStrings.maxHpDialogMiscModLabel || "Misc Modifier"}
                    {miscModifierSubLabel && (
                        <span className="text-muted-foreground/80 ml-1">{miscModifierSubLabel}</span>
                    )}
                </span>
                {renderModifierValue(miscModifierValue)}
            </div>
        )}
        {customModifier !== 0 && (
            <div className="flex justify-between text-sm">
            <span className="text-foreground">{uiStrings.maxHpDialogCustomModLabel || "Custom Modifier"}</span>
            {renderModifierValue(customModifier)}
            </div>
        )}

        {conditionalHpBonuses.length > 0 && (
            <>
                <h4 className="text-sm font-bold text-muted-foreground mb-0">
                    {uiStrings.infoDialogConditionalBonusesHeading || "Conditional Bonuses"}
                </h4>
                <div className="space-y-0.5 ml-3 mt-0 mb-0">
                    {conditionalHpBonuses.map((bonus, index) => (
                        <div key={`conditional-hp-${index}`} className="flex justify-between items-baseline text-sm">
                            <span className="text-foreground flex-shrink-0 mr-2">{bonus.sourceFeatName}</span>
                            {renderModifierValue(bonus.value || 0)}
                        </div>
                    ))}
                </div>
            </>
        )}

        <Separator className="mt-2 mb-1" />
        <div className="flex justify-between text-lg">
          <span className="font-semibold">{uiStrings.maxHpDialogTotalLabel || "Maximum Hit Points"}</span>
          <span className="font-bold text-accent">{totalMaxHp}</span>
        </div>
      </div>
    </div>
  );
};
