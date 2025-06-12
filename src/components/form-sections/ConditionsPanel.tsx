
'use client';

import *as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { type CharacterFeatInstance } from '@/types/character-core';
import { type FeatDefinitionJsonData, type FeatEffectDetail, type AbilityScoreEffect, type SavingThrowEffect, type AttackRollEffect, type DamageRollEffect, type ArmorClassEffect, type HitPointsEffect, type InitiativeEffect, type SpeedEffect, type AggregatedFeatEffectBase, type AggregatedFeatEffects } from '@/types/character-core';
import { ShieldQuestion, Loader2 } from 'lucide-react';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface ConditionsPanelProps {
  characterFeats: CharacterFeatInstance[];
  allFeatDefinitions: readonly (FeatDefinitionJsonData & { isCustom?: boolean })[];
  onConditionToggle: (conditionKey: string, isActive: boolean) => void;
  aggregatedFeatEffects: AggregatedFeatEffects | null; // Added prop
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
  abilityLabels: readonly { value: string; label: string; abbr: string }[],
  isGloballyActive: boolean
): React.ReactNode[] => {
  if (!uiStrings || !abilityLabels) {
    return [<span key="loading-effects">{uiStrings.loadingText || "Loading..."}</span>];
  }
  if (!effects || effects.length === 0) {
    return [<Badge key="no-effects" variant={isGloballyActive ? "secondary" : "outline"} className="text-xs italic px-1.5 py-0.5">{uiStrings.conditionsPanelNoEffectDetails || "No specific effects listed."}</Badge>];
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
        const acTypeLabelKey = `acType${acEffect.acType.charAt(0).toUpperCase() + acEffect.acType.slice(1).replace(/_/g, '')}` as keyof typeof uiStrings;
        effectTargetDisplay = uiStrings[acTypeLabelKey] || uiStrings.acLabelGeneric || "AC";
        if (acEffect.acType === "untyped") {
          effectTargetDisplay = uiStrings.acLabelGeneric || "AC";
        }

        if (typeof val === 'number') {
          effectValueDisplay = `${val > 0 ? '+' : ''}${val}`;
        } else if (val === "WIS" || val === "INT" || val === "CHA") {
          effectValueDisplay = abilityLabels.find(al => al.value === String(val).toLowerCase())?.abbr || String(val);
        } else {
           effectValueDisplay = String(val);
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
    const isEffectTypeUntyped = bonusTypeDisplay.toLowerCase() === untypedBonusTypeString.toLowerCase();

    if (effect.type === "armorClass") {
      const acEffect = effect as ArmorClassEffect;
      const isSpecificAcType = ["dodge", "armor", "shield", "natural", "deflection"].includes(acEffect.acType.toLowerCase());
      if (!isSpecificAcType || !isEffectTypeUntyped) {
        badgeContentString += ` | ${bonusTypeDisplay}`;
      }
    } else if (!isEffectTypeUntyped) {
      badgeContentString += ` | ${bonusTypeDisplay}`;
    }


    if (badgeContentString) {
      effectBadges.push(
        <Badge key={`effect-${index}-${effect.type}`} variant={isGloballyActive ? "secondary" : "outline"} className="text-xs px-1.5 py-0.5">
          {badgeContentString}
        </Badge>
      );
    }
  });

  if (effectBadges.length === 0) {
    return [<Badge key="no-specifics" variant={isGloballyActive ? "secondary" : "outline"} className="text-xs italic px-1.5 py-0.5">{uiStrings.conditionsPanelNoEffectDetails || "No specific effects listed."}</Badge>];
  }
  return effectBadges;
};


const ConditionsPanelComponent: React.FC<ConditionsPanelProps> = ({
  characterFeats,
  allFeatDefinitions,
  onConditionToggle,
  aggregatedFeatEffects, // Use the prop
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
                displayText: conditionKey,
                sources: [],
                isGloballyActive: false,
                canBeToggled: false,
              });
            }
            const conditionEntry = conditionsMap.get(conditionKey)!;
            
            conditionEntry.sources.push({
              featInstanceId: featInstance.instanceId,
              featName: definition.label || featInstance.definitionId,
              isCurrentlyActiveOnThisInstance,
              isSourceFeatPermanentEffect,
              effectsSummary: [],
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
        entry.canBeToggled = entry.sources.some(s => !s.isSourceFeatPermanentEffect) || entry.sources.length === 0 || !allSourcesPermanent;
      }
      
      const translatedDisplayTextKey = `condition_${entry.conditionKey.toLowerCase().replace(/\s+/g, '_')}` as keyof typeof translations.UI_STRINGS;
      entry.displayText = translations.UI_STRINGS[translatedDisplayTextKey] || capitalizeFirstLetter(entry.conditionKey);

      entry.sources.forEach(source => {
         const definition = allFeatDefinitions.find(def => def.label === source.featName || def.value === source.featName);
         
         if (entry.conditionKey === "vs_favored_enemy" && aggregatedFeatEffects?.favoredEnemyBonuses) {
            const skillBonus = aggregatedFeatEffects.favoredEnemyBonuses.skillBonus;
            const damageBonus = aggregatedFeatEffects.favoredEnemyBonuses.damageBonus;
            const effectBadges: React.ReactNode[] = [];
            if (skillBonus > 0) {
                const skillBonusLabel = (translations.UI_STRINGS.favoredEnemySkillsEffectSummaryBadge || "+{bonus} Favored Enemy Skills")
                .replace("{bonus}", String(skillBonus));
                effectBadges.push(<Badge key="fe-skill-bonus" variant={entry.isGloballyActive ? "secondary" : "outline"} className="text-xs px-1.5 py-0.5">{skillBonusLabel}</Badge>);
            }
            if (damageBonus > 0) {
                const damageBonusLabel = (translations.UI_STRINGS.favoredEnemyDamageEffectSummaryBadge || "+{bonus} Damage vs Favored Enemy")
                .replace("{bonus}", String(damageBonus));
                effectBadges.push(<Badge key="fe-damage-bonus" variant={entry.isGloballyActive ? "secondary" : "outline"} className="text-xs px-1.5 py-0.5">{damageBonusLabel}</Badge>);
            }
            source.effectsSummary = effectBadges.length > 0 ? effectBadges : [<Badge key="no-fe-effects" variant={entry.isGloballyActive ? "secondary" : "outline"} className="text-xs italic px-1.5 py-0.5">{translations.UI_STRINGS.conditionsPanelNoEffectDetails || "No specific effects listed."}</Badge>];
         } else {
            source.effectsSummary = formatEffectSummary(
                definition?.effects?.filter(e => e.condition === entry.conditionKey),
                translations.UI_STRINGS,
                translations.ABILITY_LABELS,
                entry.isGloballyActive 
            );
         }
      });
    });


    return conditionsMap;
  }, [characterFeats, allFeatDefinitions, translations, aggregatedFeatEffects]); // Added aggregatedFeatEffects

  const uniqueConditionsForDisplay = Array.from(uniqueConditionsMap.values())
    .sort((a,b) => a.displayText.localeCompare(b.displayText));

  const handleToggle = React.useCallback((conditionKey: string, checked: boolean) => {
    onConditionToggle(conditionKey, !!checked);
  }, [onConditionToggle]);

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
        {uniqueConditionsForDisplay.map(({ conditionKey, displayText, sources, isGloballyActive, canBeToggled }) => {
           const isToggleDisabled = !canBeToggled;
           const firstSource = sources[0];

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
                  {displayText}
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

    