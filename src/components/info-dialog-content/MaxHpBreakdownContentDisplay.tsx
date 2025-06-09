

'use client';

import React from 'react';
import type { Character, AggregatedFeatEffects, DetailedAbilityScores, AbilityName } from '@/types/character';
import { renderModifierValue, sectionHeadingClass } from './dialog-utils';
import { calculateAbilityModifier } from '@/lib/dnd-utils';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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
      .filter(source => !source.condition) // Assuming unconditional for now, or would need condition checking
      .map(source => source.sourceFeatName);
    if (activeFeatSources.length > 0) {
      miscModifierSubLabel = `(${activeFeatSources.join(', ')})`;
    }
  } else if (miscModifierValue !== 0) {
    miscModifierSubLabel = `(${uiStrings.maxHpDialogFeatsSubLabel || "Feats/Effects"})`;
  }


  return (
    <div>
      <h3 className={sectionHeadingClass}>{uiStrings.infoDialogSectionHeadingCalculation || "Calculation"}</h3>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>{uiStrings.maxHpDialogBaseHpLabel || "Base Hit Points"}</span>
          <span className="font-bold">{baseHp}</span>
        </div>
        <div className="flex justify-between">
          <span>
            {uiStrings.maxHpDialogAbilityModLabel || "Ability Modifier"}
            <span className="text-muted-foreground"> ({conAbbr})</span>
          </span>
          {renderModifierValue(finalConstitutionModifier)}
        </div>
        {miscModifierValue !== 0 && (
            <div className="flex justify-between items-baseline">
                <span className="flex-shrink-0 mr-2">
                    {uiStrings.maxHpDialogMiscModLabel || "Misc Modifier"}
                    {miscModifierSubLabel && (
                        <span className="ml-1 text-xs text-muted-foreground">{miscModifierSubLabel}</span>
                    )}
                </span>
                {renderModifierValue(miscModifierValue)}
            </div>
        )}
        {customModifier !== 0 && (
            <div className="flex justify-between">
            <span>{uiStrings.maxHpDialogCustomModLabel || "Custom Modifier"}</span>
            {renderModifierValue(customModifier)}
            </div>
        )}
        <div style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}><Separator /></div>
        <div className="flex justify-between text-base">
          <span className="font-semibold">{uiStrings.maxHpDialogTotalLabel || "Maximum Hit Points"}</span>
          <span className="font-bold text-accent">{totalMaxHp}</span>
        </div>
      </div>
    </div>
  );
};

