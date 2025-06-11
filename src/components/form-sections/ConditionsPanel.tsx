
'use client';

import *as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { type CharacterFeatInstance } from '@/types/character-core';
import { type FeatDefinitionJsonData, type FeatEffectDetail } from '@/types/character-core';
import { ShieldQuestion, Info } from 'lucide-react';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
    isSourceFeatPermanentEffect: boolean; // True if the feat definition has permanentEffect: true
  }>;
  isGloballyActive: boolean;
  isEffectivelyPermanentAndActive: boolean; // True if ALL sources are permanent AND active
  canBeToggled: boolean; // True if at least ONE source is NOT permanent
}

const ConditionsPanelComponent: React.FC<ConditionsPanelProps> = ({
  characterFeats,
  allFeatDefinitions,
  onConditionToggle,
}) => {
  const { translations, isLoading: translationsLoading } = useI18n();

  const uniqueConditionsMap = React.useMemo(() => {
    const conditionsMap = new Map<string, DisplayCondition>();

    characterFeats.forEach(featInstance => {
      const definition = allFeatDefinitions.find(def => def.value === featInstance.definitionId);
      if (definition?.effects) {
        definition.effects.forEach(effect => {
          if (effect.condition && effect.condition.trim() !== "") {
            const conditionKey = effect.condition;
            const isSourceFeatPermanentEffect = !!definition.permanentEffect;
            const isCurrentlyActiveOnThisInstance = isSourceFeatPermanentEffect || !!featInstance.conditionalEffectStates?.[conditionKey];

            if (!conditionsMap.has(conditionKey)) {
              conditionsMap.set(conditionKey, {
                conditionKey,
                displayText: conditionKey, // Placeholder, will be translated
                sources: [],
                isGloballyActive: false,
                isEffectivelyPermanentAndActive: true, // Assume permanent until a non-permanent source is found
                canBeToggled: false, // Assume not toggleable until a non-permanent source is found
              });
            }
            const conditionEntry = conditionsMap.get(conditionKey)!;
            conditionEntry.sources.push({
              featInstanceId: featInstance.instanceId,
              featName: definition.label || featInstance.definitionId,
              isCurrentlyActiveOnThisInstance,
              isSourceFeatPermanentEffect,
            });
          }
        });
      }
    });

    conditionsMap.forEach(entry => {
      entry.isGloballyActive = entry.sources.some(s => s.isCurrentlyActiveOnThisInstance);
      
      // A condition is considered "effectively permanent and active" if ALL its sources are permanent AND active.
      // This might be too strict. A better definition might be:
      // "Effectively permanent" if ALL sources are permanent.
      // "Globally active" if ANY source is active.
      // "Can be toggled" if ANY source is NOT permanent.
      
      const allSourcesArePermanent = entry.sources.every(s => s.isSourceFeatPermanentEffect);
      entry.isEffectivelyPermanentAndActive = allSourcesArePermanent && entry.isGloballyActive;
      entry.canBeToggled = entry.sources.some(s => !s.isSourceFeatPermanentEffect);

      // If any source is permanent and active, the global state is active and it cannot be turned off by toggling non-permanent sources.
      // However, the user might still want to toggle the non-permanent sources *if they exist*.
      // The `disabled` state of the checkbox should depend on whether *all* active sources are permanent.
    });

    return conditionsMap;
  }, [characterFeats, allFeatDefinitions]);

  const uniqueConditionsForDisplay = Array.from(uniqueConditionsMap.values())
    .sort((a,b) => a.displayText.localeCompare(b.displayText));


  const handleToggle = (conditionKey: string, checked: boolean) => {
    // This toggle should only affect non-permanent sources.
    // The global state is derived from all sources including permanent ones.
    onConditionToggle(conditionKey, checked);
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
           const translatedDisplayTextKey = `condition_${conditionKey}` as keyof typeof UI_STRINGS;
           const translatedDisplayText = UI_STRINGS[translatedDisplayTextKey] || displayText;
           
           // Checkbox is disabled if the condition can't be meaningfully toggled by the user
           // (i.e., if all its sources are permanent or if it has no non-permanent sources to toggle).
           const isToggleDisabled = !canBeToggled;

          return (
            <div key={conditionKey} className="flex items-center space-x-2 p-2.5 border rounded-lg bg-card shadow-sm hover:border-primary/50 transition-colors">
              <Checkbox
                id={`condition-toggle-${conditionKey.replace(/\W/g, '-')}`}
                checked={isGloballyActive}
                onCheckedChange={(checked) => handleToggle(conditionKey, !!checked)}
                disabled={isToggleDisabled}
                className="h-5 w-5"
              />
              <Label htmlFor={`condition-toggle-${conditionKey.replace(/\W/g, '-')}`} className={cn("flex-grow text-sm cursor-pointer", isToggleDisabled && "cursor-default opacity-70")}>
                {translatedDisplayText}
                 {isToggleDisabled && isGloballyActive && ( // Show "Permanent" only if it's active due to permanent sources
                    <Badge variant="outline" className="ml-2 text-muted-foreground border-muted-foreground/50">
                      {UI_STRINGS.conditionsPanelPermanentLabel || "Permanent"}
                    </Badge>
                )}
              </Label>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0">
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="end" className="max-w-xs text-xs p-2">
                    <p className="font-medium mb-1">{UI_STRINGS.conditionsPanelTooltipSourcesLabel || "Sources:"}</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {sources.map(s => (
                        <li key={s.featInstanceId}>
                          {s.featName}
                          {s.isSourceFeatPermanentEffect ? ` (${UI_STRINGS.conditionsPanelPermanentLabel || "Permanent"})` : ''}
                        </li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
ConditionsPanelComponent.displayName = "ConditionsPanelComponent";
export const ConditionsPanel = React.memo(ConditionsPanelComponent);
