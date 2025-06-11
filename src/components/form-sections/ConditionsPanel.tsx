
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
    featIsPermanentEffectSource: boolean; // New flag
  }>;
  isGloballyActive: boolean; 
  isEffectivelyPermanent: boolean; // New: True if ANY source feat is permanent
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
            const displayText = effect.condition; 
            
            const isCurrentlyActiveOnThisInstance = !!featInstance.conditionalEffectStates?.[conditionKey];
            const featIsPermanentEffectSource = !!definition.permanentEffect; // Check the flag on the feat definition

            if (!conditionsMap.has(conditionKey)) {
              conditionsMap.set(conditionKey, {
                conditionKey,
                displayText,
                sources: [],
                isGloballyActive: false, 
                isEffectivelyPermanent: false, // Initialize
              });
            }
            const conditionEntry = conditionsMap.get(conditionKey)!;
            conditionEntry.sources.push({
              featInstanceId: featInstance.instanceId,
              featName: definition.label || featInstance.definitionId,
              isCurrentlyActiveOnThisInstance,
              featIsPermanentEffectSource, // Store if this source feat is permanent
            });
          }
        });
      }
    });
    
    conditionsMap.forEach(entry => {
      entry.isGloballyActive = entry.sources.some(s => s.isCurrentlyActiveOnThisInstance);
      // A condition is effectively permanent if any of its source feats are marked as permanentEffect
      entry.isEffectivelyPermanent = entry.sources.some(s => s.featIsPermanentEffectSource);
      // If it's effectively permanent, ensure its global active state is true
      if (entry.isEffectivelyPermanent) {
        entry.isGloballyActive = true;
      }
    });

    return conditionsMap;
  }, [characterFeats, allFeatDefinitions]);

  const uniqueConditionsForDisplay = Array.from(uniqueConditionsMap.values())
    .sort((a,b) => a.displayText.localeCompare(b.displayText));


  const handleToggle = (conditionKey: string, checked: boolean) => {
    const conditionEntry = uniqueConditionsMap.get(conditionKey);
    if (conditionEntry && conditionEntry.isEffectivelyPermanent) {
      return; // Don't allow toggling if the condition is from a permanent effect source
    }
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
        {uniqueConditionsForDisplay.map(({ conditionKey, displayText, sources, isGloballyActive, isEffectivelyPermanent }) => {
           const translatedDisplayTextKey = `condition_${conditionKey}` as keyof typeof UI_STRINGS;
           const translatedDisplayText = UI_STRINGS[translatedDisplayTextKey] || displayText;
          return (
            <div key={conditionKey} className="flex items-center space-x-2 p-2.5 border rounded-lg bg-card shadow-sm hover:border-primary/50 transition-colors">
              <Checkbox
                id={`condition-toggle-${conditionKey.replace(/\W/g, '-')}`}
                checked={isGloballyActive} // This will be true if isEffectivelyPermanent is true
                onCheckedChange={(checked) => handleToggle(conditionKey, !!checked)}
                disabled={isEffectivelyPermanent} // Disable if any source is permanent
                className="h-5 w-5"
              />
              <Label htmlFor={`condition-toggle-${conditionKey.replace(/\W/g, '-')}`} className={cn("flex-grow text-sm cursor-pointer", isEffectivelyPermanent && "cursor-default")}>
                {translatedDisplayText}
                 {isEffectivelyPermanent && (
                    <Badge variant="outline" className="ml-2 text-xs text-muted-foreground border-muted-foreground/50">
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
                      {sources.map(s => <li key={s.featInstanceId}>{s.featName}{s.featIsPermanentEffectSource ? ` (${UI_STRINGS.conditionsPanelPermanentLabel || "Permanent"})` : ''}</li>)}
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
