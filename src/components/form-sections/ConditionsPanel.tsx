
'use client';

import *as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { type CharacterFeatInstance } from '@/types/character-core';
import { type FeatDefinitionJsonData, type FeatEffectDetail, type AbilityScoreEffect, type SavingThrowEffect, type AttackRollEffect, type DamageRollEffect, type ArmorClassEffect, type HitPointsEffect, type InitiativeEffect, type SpeedEffect, type AggregatedFeatEffectBase } from '@/types/character-core';
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
    effectsSummary?: React.ReactNode[];
  }>;
  isGloballyActive: boolean;
  canBeToggled: boolean;
}

const capitalizeFirstLetter = (string: string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const formatEffectSummary = (
  effects: FeatEffectDetail[] | undefined,
  uiStrings: Record<string, string>,
  abilityLabels: readonly { value: string; label: string; abbr: string }[]
): React.ReactNode[] => {
  if (!uiStrings || !abilityLabels) {
    return [<span key="loading-effects">{uiStrings.loadingText || "Loading..."}</span>];
  }
  if (!effects || effects.length === 0) {
    return [<Badge key="no-effects" variant="outline" className="text-xs italic px-1.5 py-0.5">{uiStrings.conditionsPanelNoEffectDetails || "No specific effects listed."}</Badge>];
  }

  const effectBadges: React.ReactNode[] = [];

  effects.forEach((effect, index) => {
    let effectValueDisplay = "";
    let effectTargetDisplay = "";
    const val = (effect as any).value;
    const originalBonusType = (effect as any).bonusType || "untyped";
    const translatedBonusTypeKey = `bonusType${capitalizeFirstLetter(originalBonusType)}` as keyof typeof uiStrings;
    const bonusTypeDisplay = uiStrings[translatedBonusTypeKey] || capitalizeFirstLetter(originalBonusType);

    switch (effect.type) {
      case "abilityScore":
        const asEffect = effect as AbilityScoreEffect;
        effectValueDisplay = `${typeof val === 'number' && val > 0 ? '+' : ''}${val}`;
        effectTargetDisplay = abilityLabels.find(ab => ab.value === asEffect.ability)?.abbr || asEffect.ability.toUpperCase();
        break;
      case "savingThrow":
        const stEffect = effect as SavingThrowEffect;
        const saveAbbrKey = `saveTypeAbbr${stEffect.save.charAt(0).toUpperCase() + stEffect.save.slice(1)}` as keyof typeof uiStrings;
        effectValueDisplay = `${typeof val === 'number' && val > 0 ? '+' : ''}${val}`;
        effectTargetDisplay = uiStrings[saveAbbrKey] || stEffect.save.toUpperCase();
        if (stEffect.save === "all") effectTargetDisplay += (uiStrings.saveTypeAllAbbrSuffix || " (All)");
        break;
      case "attackRoll":
        const arEffect = effect as AttackRollEffect;
        effectValueDisplay = `${typeof val === 'number' && val > 0 ? '+' : ''}${val}`;
        effectTargetDisplay = uiStrings.effectTypeAttack || "Attack";
        if (arEffect.appliesTo && arEffect.appliesTo !== 'all' && arEffect.appliesTo !== 'SPEC') {
          effectTargetDisplay += ` (${arEffect.appliesTo})`;
        }
        break;
      case "damageRoll":
        const drEffect = effect as DamageRollEffect;
        effectValueDisplay = `${typeof val === 'number' && val > 0 ? '+' : ''}${val}`;
        effectTargetDisplay = uiStrings.effectTypeDamage || "Damage";
        if (drEffect.appliesTo && drEffect.appliesTo !== 'all' && drEffect.appliesTo !== 'SPEC') {
          effectTargetDisplay += ` (${drEffect.appliesTo})`;
        }
        break;
      case "armorClass":
        const acEffect = effect as ArmorClassEffect;
        if (typeof val === 'number') {
          effectValueDisplay = `${val > 0 ? '+' : ''}${val}`;
        } else if (val === "WIS" || val === "INT" || val === "CHA") {
          effectValueDisplay = abilityLabels.find(al => al.value === String(val).toLowerCase())?.abbr || String(val);
        } else {
           effectValueDisplay = String(val);
        }
        
        let primaryDisplayAcTypeKey: keyof typeof uiStrings;
        if (acEffect.acType === "untyped") {
          primaryDisplayAcTypeKey = 'acLabelGeneric' as keyof typeof uiStrings;
        } else {
          primaryDisplayAcTypeKey = `acType${capitalizeFirstLetter(acEffect.acType.replace(/_/g, ''))}` as keyof typeof uiStrings;
        }
        effectTargetDisplay = uiStrings[primaryDisplayAcTypeKey] || capitalizeFirstLetter(acEffect.acType);
        
        // Special handling for "Untyped" bonus type with generic AC types
        if (acEffect.acType === "untyped" && originalBonusType === "untyped") {
           // The target is already "AC" (from acLabelGeneric), so just the value. bonusTypeDisplay is already "Untyped".
           // If the bonusType is "untyped", it might be redundant if acType is also generic like "AC" (from "untyped")
           // The pipe will add "| Untyped" only if bonusTypeDisplay is not "Untyped" OR if acType is something specific where "Untyped" adds clarity.
           // In this case, if acType is untyped (shown as "AC") and bonusType is untyped, we *do* want to show "| Untyped" to be clear it's an untyped bonus to general AC.
        } else if (originalBonusType.toLowerCase() === "untyped" && ["dodge", "armor", "shield", "natural", "deflection"].includes(acEffect.acType.toLowerCase())) {
          // If bonusType is "untyped" for a specific AC type like "Dodge", don't show "| Untyped" as it's implied.
        }
        break;
      case "hitPoints":
        const hpEffect = effect as HitPointsEffect;
        effectValueDisplay = `${typeof val === 'number' && val > 0 ? '+' : ''}${val}`;
        effectTargetDisplay = "HP";
        break;
      case "initiative":
        const initEffect = effect as InitiativeEffect;
        effectValueDisplay = `${typeof val === 'number' && val > 0 ? '+' : ''}${val}`;
        effectTargetDisplay = uiStrings.effectTypeInitiative || "Initiative";
        break;
      case "speed":
        const speedEffect = effect as SpeedEffect;
        effectValueDisplay = `${typeof val === 'number' && val > 0 ? '+' : ''}${val}`;
        effectTargetDisplay = `${uiStrings.effectTypeSpeed || "Speed"} (${speedEffect.speedType})`;
        break;
      default:
        effectTargetDisplay = "Effect";
        break;
    }

    let badgeContentString = `${effectValueDisplay} ${effectTargetDisplay}`;
    const untypedBonusTypeString = (uiStrings.bonusTypeUntyped || "Untyped");

    // Logic for appending bonus type
    if (effect.type === "armorClass" && (effect as ArmorClassEffect).acType.toLowerCase() === "untyped" && bonusTypeDisplay.toLowerCase() === untypedBonusTypeString.toLowerCase()) {
      // For "-2 AC | Untyped", we want exactly this
      badgeContentString += ` | ${bonusTypeDisplay}`;
    } else if (bonusTypeDisplay.toLowerCase() !== untypedBonusTypeString.toLowerCase()) {
      badgeContentString += ` | ${bonusTypeDisplay}`;
    } else if (effect.type !== "armorClass" || !["dodge", "armor", "shield", "natural", "deflection"].includes((effect as ArmorClassEffect).acType.toLowerCase())) {
       // For non-AC types, or AC types that aren't inherently typed like dodge/armor, show "| Untyped" if it's the bonusType
      if (bonusTypeDisplay.toLowerCase() === untypedBonusTypeString.toLowerCase()) {
         badgeContentString += ` | ${bonusTypeDisplay}`;
      }
    }


    if (badgeContentString) {
      effectBadges.push(
        <Badge key={`effect-${index}-${effect.type}`} variant="outline" className="text-xs px-1.5 py-0.5">
          {badgeContentString}
        </Badge>
      );
    }
  });

  if (effectBadges.length === 0) {
    return [<Badge key="no-specifics" variant="outline" className="text-xs italic px-1.5 py-0.5">{uiStrings.conditionsPanelNoEffectDetails || "No specific effects listed."}</Badge>];
  }
  return effectBadges;
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
                displayText: conditionKey, // Will be replaced by translated or capitalized version
                sources: [],
                isGloballyActive: false,
                canBeToggled: false,
              });
            }
            const conditionEntry = conditionsMap.get(conditionKey)!;

            const effectsForThisCondition = definition.effects?.filter(e => e.condition === conditionKey);
            const summaryBadges = formatEffectSummary(effectsForThisCondition, translations.UI_STRINGS, translations.ABILITY_LABELS);

            conditionEntry.sources.push({
              featInstanceId: featInstance.instanceId,
              featName: definition.label || featInstance.definitionId,
              isCurrentlyActiveOnThisInstance,
              isSourceFeatPermanentEffect,
              effectsSummary: summaryBadges,
            });
          }
        });
      }
    });

    conditionsMap.forEach(entry => {
      entry.isGloballyActive = entry.sources.some(s => s.isCurrentlyActiveOnThisInstance);
      const forcedActiveByPermanent = entry.sources.some(s => s.isSourceFeatPermanentEffect && s.isCurrentlyActiveOnThisInstance);
      const allSourcesPermanent = entry.sources.length > 0 && entry.sources.every(s => s.isSourceFeatPermanentEffect);
      const permanentlyOff = allSourcesPermanent && !entry.isGloballyActive; // All sources are permanent, and none are active

      if (forcedActiveByPermanent) {
        entry.isGloballyActive = true;
        entry.canBeToggled = false;
      } else if (permanentlyOff) {
        entry.isGloballyActive = false;
        entry.canBeToggled = false;
      } else {
        // Can be toggled if at least one source is not permanent,
        // OR if there are no permanent sources at all (implies all are toggleable)
        entry.canBeToggled = entry.sources.some(s => !s.isSourceFeatPermanentEffect) || entry.sources.length === 0 || !allSourcesPermanent;
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
            <div key={i} className="flex items-center space-x-2 py-1.5">
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
        {uniqueConditionsForDisplay.map(({ conditionKey, sources, isGloballyActive, canBeToggled }) => {
           const translatedDisplayTextKey = `condition_${conditionKey.toLowerCase().replace(/\s+/g, '_')}` as keyof typeof UI_STRINGS;
           let displayLabelText = UI_STRINGS[translatedDisplayTextKey] || capitalizeFirstLetter(conditionKey);
           
           const isToggleDisabled = !canBeToggled;
           const firstSource = sources[0]; // For simplicity, show details from the first source

          return (
            <div key={conditionKey} className="flex items-start space-x-2">
              <Checkbox
                id={`condition-toggle-${conditionKey.replace(/\W/g, '-')}`}
                checked={isGloballyActive}
                onCheckedChange={(checked) => handleToggle(conditionKey, !!checked)}
                disabled={isToggleDisabled}
                className="h-5 w-5 mt-0.5 shrink-0"
              />
              <div className="flex-grow">
                <Label htmlFor={`condition-toggle-${conditionKey.replace(/\W/g, '-')}`} className={cn("text-sm font-medium cursor-pointer", isToggleDisabled && "cursor-default opacity-70")}>
                  {displayLabelText}
                  {isToggleDisabled && isGloballyActive && (
                      <Badge variant="outline" className="ml-2 text-xs text-muted-foreground border-muted-foreground/50">
                        {UI_STRINGS.conditionsPanelPermanentLabel || "Permanent"}
                      </Badge>
                  )}
                </Label>
                {firstSource && (firstSource.featName || (firstSource.effectsSummary && firstSource.effectsSummary.length > 0)) && (
                  <div className="text-xs text-muted-foreground mt-0.5 space-y-0.5">
                    {firstSource.featName && (
                      <div className="flex items-baseline">
                        <strong>{UI_STRINGS.conditionsPanelSourceFeatLabel || "Source"}:</strong>{'\u00A0'}
                        <span className="text-xs">{firstSource.featName}</span>
                      </div>
                    )}
                    {firstSource.effectsSummary && firstSource.effectsSummary.length > 0 && (
                       <div className="flex items-baseline flex-wrap">
                          <strong>{UI_STRINGS.conditionsPanelEffectLabel || "Effects"}:</strong>{'\u00A0'}
                          <span className="flex flex-wrap items-center gap-1">
                            {firstSource.effectsSummary.map((badge, idx) => (
                              <React.Fragment key={idx}>
                                {badge}
                              </React.Fragment>
                            ))}
                          </span>
                       </div>
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

