
'use client';

import *as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { type CharacterFeatInstance } from '@/types/character-core';
import { type FeatDefinitionJsonData, type FeatEffectDetail, type AbilityScoreEffect, type SavingThrowEffect, type AttackRollEffect, type DamageRollEffect, type ArmorClassEffect, type HitPointsEffect, type InitiativeEffect, type SpeedEffect } from '@/types/character-core';
import { ShieldQuestion, Loader2 } from 'lucide-react';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface ConditionsPanelProps {
  characterFeats: CharacterFeatInstance[];
  allFeatDefinitions: readonly (FeatDefinitionJsonData & { isCustom?: boolean })[];
  onConditionToggle: (conditionKey: string, isActive: boolean) => void;
}

interface DisplayCondition {
  conditionKey: string;
  displayText: string;
  sources: Array<{
    featInstanceId: string;
    featName: string;
    isCurrentlyActiveOnThisInstance: boolean;
    isSourceFeatPermanentEffect: boolean;
    effectsSummary?: string;
  }>;
  isGloballyActive: boolean;
  canBeToggled: boolean;
}

// Helper function defined outside the component
const formatEffectSummary = (
  effects: FeatEffectDetail[] | undefined,
  uiStrings: Record<string, string>,
  abilityLabels: readonly { value: string; label: string; abbr: string }[]
): string => {
  if (!uiStrings || !abilityLabels) {
    return "Loading effects...";
  }
  if (!effects || effects.length === 0) {
    return uiStrings.conditionsPanelNoEffectDetails || "No specific effects listed.";
  }

  const effectStrings: string[] = [];

  effects.forEach(effect => {
    let str = "";
    const val = (effect as any).value;
    const bonusType = (effect as any).bonusType ? ` (${(effect as any).bonusType})` : "";

    switch (effect.type) {
      case "abilityScore":
        const asEffect = effect as AbilityScoreEffect;
        const abilityLabel = abilityLabels.find(ab => ab.value === asEffect.ability)?.abbr || asEffect.ability;
        str = `${typeof val === 'number' && val > 0 ? '+' : ''}${val} ${abilityLabel}${bonusType}`;
        break;
      case "savingThrow":
        const stEffect = effect as SavingThrowEffect;
        const saveAbbrKey = `saveTypeAbbr${stEffect.save.charAt(0).toUpperCase() + stEffect.save.slice(1)}` as keyof typeof uiStrings;
        const saveAbbr = uiStrings[saveAbbrKey] || stEffect.save;
        str = `${typeof val === 'number' && val > 0 ? '+' : ''}${val} ${saveAbbr}${stEffect.save === "all" ? " (All)" : ""}${bonusType}`;
        break;
      case "attackRoll":
        const arEffect = effect as AttackRollEffect;
        str = `${typeof val === 'number' && val > 0 ? '+' : ''}${val} Attack${arEffect.appliesTo && arEffect.appliesTo !== 'all' ? ` (${arEffect.appliesTo})` : ''}${bonusType}`;
        break;
      case "damageRoll":
        const drEffect = effect as DamageRollEffect;
        str = `${typeof val === 'number' && val > 0 ? '+' : ''}${val} Damage${drEffect.appliesTo && drEffect.appliesTo !== 'all' ? ` (${drEffect.appliesTo})` : ''}${bonusType}`;
        break;
      case "armorClass":
        const acEffect = effect as ArmorClassEffect;
        let acValStr = String(val);
        if (val === "WIS" || val === "INT" || val === "CHA") {
            acValStr = abilityLabels.find(al => al.value === String(val).toLowerCase())?.abbr || String(val);
        } else if (typeof val === 'number') {
            acValStr = `${val > 0 ? '+' : ''}${val}`;
        }
        str = `${acValStr} AC (${acEffect.acType})${bonusType}`;
        break;
      case "hitPoints":
        const hpEffect = effect as HitPointsEffect;
        str = `${typeof val === 'number' && val > 0 ? '+' : ''}${val} HP${bonusType}`;
        break;
      case "initiative":
        const initEffect = effect as InitiativeEffect;
        str = `${typeof val === 'number' && val > 0 ? '+' : ''}${val} Initiative${bonusType}`;
        break;
      case "speed":
        const speedEffect = effect as SpeedEffect;
        str = `${typeof val === 'number' && val > 0 ? '+' : ''}${val} Speed (${speedEffect.speedType})${bonusType}`;
        break;
      default:
        // Non-mechanical effects or effects without a simple summary might not produce a string here.
        break;
    }
    if (str) effectStrings.push(str);
  });

  if (effectStrings.length === 0) {
    return uiStrings.conditionsPanelNoEffectDetails || "No specific effects listed.";
  }
  return effectStrings.join(', ');
};

const ConditionsPanelComponent: React.FC<ConditionsPanelProps> = ({
  characterFeats,
  allFeatDefinitions,
  onConditionToggle,
}) => {
  const { translations, isLoading: translationsLoading } = useI18n();

  const uniqueConditionsMap = React.useMemo(() => {
    const conditionsMap = new Map<string, DisplayCondition>();
    if (!translations || !translations.UI_STRINGS || !translations.ABILITY_LABELS) {
      return conditionsMap;
    }

    characterFeats.forEach(featInstance => {
      const definition = allFeatDefinitions.find(def => def.value === featInstance.definitionId);
      if (definition?.effects) {
        definition.effects.forEach(effectDetail => {
          if (effectDetail.condition && effectDetail.condition.trim() !== "") {
            const conditionKey = effectDetail.condition;
            const isSourceFeatPermanentEffect = !!definition.permanentEffect;
            const isCurrentlyActiveOnThisInstance = isSourceFeatPermanentEffect || !!featInstance.conditionalEffectStates?.[conditionKey];

            if (!conditionsMap.has(conditionKey)) {
              conditionsMap.set(conditionKey, {
                conditionKey,
                displayText: conditionKey, // This will be translated later
                sources: [],
                isGloballyActive: false,
                canBeToggled: false,
              });
            }
            const conditionEntry = conditionsMap.get(conditionKey)!;

            const effectsForThisCondition = definition.effects?.filter(e => e.condition === conditionKey);
            const summary = formatEffectSummary(effectsForThisCondition, translations.UI_STRINGS, translations.ABILITY_LABELS);

            conditionEntry.sources.push({
              featInstanceId: featInstance.instanceId,
              featName: definition.label || featInstance.definitionId,
              isCurrentlyActiveOnThisInstance,
              isSourceFeatPermanentEffect,
              effectsSummary: summary,
            });
          }
        });
      }
    });

    conditionsMap.forEach(entry => {
      entry.isGloballyActive = entry.sources.some(s => s.isCurrentlyActiveOnThisInstance);

      const forcedActiveByPermanent = entry.sources.some(s => s.isSourceFeatPermanentEffect && s.isCurrentlyActiveOnThisInstance);
      const allSourcesPermanent = entry.sources.length > 0 && entry.sources.every(s => s.isSourceFeatPermanentEffect);
      const permanentlyOff = allSourcesPermanent && !entry.isGloballyActive;

      if (forcedActiveByPermanent) {
        entry.isGloballyActive = true;
        entry.canBeToggled = false;
      } else if (permanentlyOff) {
        entry.isGloballyActive = false;
        entry.canBeToggled = false;
      } else {
        entry.canBeToggled = entry.sources.some(s => !s.isSourceFeatPermanentEffect);
      }
    });

    return conditionsMap;
  }, [characterFeats, allFeatDefinitions, translations]);

  const uniqueConditionsForDisplay = Array.from(uniqueConditionsMap.values())
    .sort((a,b) => a.displayText.localeCompare(b.displayText));

  const handleToggle = (conditionKey: string, checked: boolean) => {
    onConditionToggle(conditionKey, !!checked);
  };
  
  if (translationsLoading || !translations) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <ShieldQuestion className="h-8 w-8 text-primary" />
            <Skeleton className="h-7 w-32" />
          </div>
          <Skeleton className="h-4 w-3/4 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center space-x-2 p-2 border rounded-md bg-muted/30">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-4/5" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (uniqueConditionsForDisplay.length === 0) {
    return null; 
  }
  
  const { UI_STRINGS } = translations;

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <ShieldQuestion className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl font-serif">{UI_STRINGS.conditionsPanelTitle || "Active Conditions"}</CardTitle>
        </div>
        <CardDescription>{UI_STRINGS.conditionsPanelDescription || "Toggle conditional effects from your character's feats and abilities."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {uniqueConditionsForDisplay.map(({ conditionKey, displayText, sources, isGloballyActive, canBeToggled }) => {
           const translatedDisplayTextKey = `condition_${conditionKey.toLowerCase().replace(/\s+/g, '_')}` as keyof typeof UI_STRINGS;
           const translatedDisplayText = UI_STRINGS[translatedDisplayTextKey] || displayText;
           const isToggleDisabled = !canBeToggled;
           const firstSource = sources[0]; // For simplicity, show details from the first source. Could be expanded.

          return (
            <div key={conditionKey} className="flex items-start space-x-2 p-2.5 border rounded-lg bg-card shadow-sm">
              <Checkbox
                id={`condition-toggle-${conditionKey.replace(/\W/g, '-')}`}
                checked={isGloballyActive}
                onCheckedChange={(checked) => handleToggle(conditionKey, !!checked)}
                disabled={isToggleDisabled}
                className="h-5 w-5 mt-0.5 shrink-0"
              />
              <div className="flex-grow">
                <Label htmlFor={`condition-toggle-${conditionKey.replace(/\W/g, '-')}`} className={cn("text-sm font-medium cursor-pointer", isToggleDisabled && "cursor-default opacity-70")}>
                  {translatedDisplayText}
                  {isToggleDisabled && isGloballyActive && (
                      <Badge variant="outline" className="ml-2 text-muted-foreground border-muted-foreground/50">
                        {UI_STRINGS.conditionsPanelPermanentLabel || "Permanent"}
                      </Badge>
                  )}
                </Label>
                {firstSource && (firstSource.featName || firstSource.effectsSummary) && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {firstSource.featName && (
                      <span>
                        <strong>{UI_STRINGS.conditionsPanelSourceFeatLabel || "Source:"}{'\u00A0'}</strong>
                        {firstSource.featName}
                      </span>
                    )}
                    {firstSource.featName && firstSource.effectsSummary && firstSource.effectsSummary !== (UI_STRINGS.conditionsPanelNoEffectDetails || "No specific effects listed.") && <br />}
                    {firstSource.effectsSummary && firstSource.effectsSummary !== (UI_STRINGS.conditionsPanelNoEffectDetails || "No specific effects listed.") && (
                       <span>
                        <strong>{UI_STRINGS.conditionsPanelEffectLabel || "Effect:"}{'\u00A0'}</strong>
                        {firstSource.effectsSummary}
                       </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
ConditionsPanelComponent.displayName = "ConditionsPanelComponent";
export const ConditionsPanel = React.memo(ConditionsPanelComponent);

    