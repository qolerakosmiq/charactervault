
'use client';

import *as React from 'react';
import type { MouseEvent } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Award, TrendingUp } from 'lucide-react';
import { useI18n } from '@/context/I18nProvider';
import type { XpDataEntry } from '@/i18n/i18n-data';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { getXpRequiredForLevel, calculateLevelFromXp } from '@/lib/dnd-utils'; 
import { cn, parseAndRenderUIString } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper';
import {
  debounceDelayFormInput,
  panelGridGap,
  panelFieldHorizontalGap,
  panelFieldVerticalGap,
  inputWidthFull,
  textStyleInput,
  textStyleDescription,
  textStyleLabel,
  textStyleModifier,
} from '@/config/layout';

export interface ExperiencePanelData {
  currentXp: number;
  currentLevel: number;
}

export interface ExperiencePanelProps {
  experienceData: ExperiencePanelData;
  onXpChange: (newXp: number) => void;
  xpTable: readonly XpDataEntry[];
  epicLevelXpIncrease: number;
}

const ExperiencePanelComponent: React.FC<ExperiencePanelProps> = ({
  experienceData,
  onXpChange,
  xpTable,
  epicLevelXpIncrease,
}) => {
  const { translations, isLoading: translationsLoading } = useI18n();
  const { currentXp, currentLevel } = experienceData;

  const debouncedXpChange = React.useCallback(onXpChange, [onXpChange]);
  const [localCurrentXp, setLocalCurrentXp] = useDebouncedFormField(
    currentXp,
    debouncedXpChange,
    debounceDelayFormInput
  );

  const xpForCurrentLevelStart = React.useMemo(() => {
    return getXpRequiredForLevel(currentLevel, xpTable, epicLevelXpIncrease);
  }, [currentLevel, xpTable, epicLevelXpIncrease]);

  const xpForNextLevel = React.useMemo(() => {
    return getXpRequiredForLevel(currentLevel + 1, xpTable, epicLevelXpIncrease);
  }, [currentLevel, xpTable, epicLevelXpIncrease]);
    
  const isMaxLevel = React.useMemo(() => xpForNextLevel === Infinity, [xpForNextLevel]);

  const progressPercentage = React.useMemo(() => {
    if (isMaxLevel || xpForNextLevel === xpForCurrentLevelStart) return 100;
    const progressInCurrentLevel = Math.max(0, localCurrentXp - xpForCurrentLevelStart);
    const xpNeededForThisLevel = xpForNextLevel - xpForCurrentLevelStart;
    if (xpNeededForThisLevel <= 0) return 100;
    return Math.min(100, (progressInCurrentLevel / xpNeededForThisLevel) * 100);
  }, [localCurrentXp, xpForCurrentLevelStart, xpForNextLevel, isMaxLevel]);

  const handleLevelUpClick = React.useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!isMaxLevel && localCurrentXp < xpForNextLevel) {
      const newXpToReachNextLevel = xpForNextLevel;
      setLocalCurrentXp(newXpToReachNextLevel);
    }
  }, [xpForNextLevel, localCurrentXp, setLocalCurrentXp, isMaxLevel]);


  if (translationsLoading || !translations) {
    return null;
  }

  const { UI_STRINGS } = translations;
  const levelLabelFormat = UI_STRINGS.experiencePanelLevelLabelFormat;

  return (
    <LockablePanelWrapper
      title={UI_STRINGS.experiencePanelTitle}
      description={UI_STRINGS.experiencePanelDescription}
      icon={Award}
      headerClassName="bg-muted/20"
      cardContentClassName={cn("flex flex-col", panelGridGap)}
      initialLockedState={false}
    >
      {({ isLocked: panelIsLocked }) => (
        <>
          {!panelIsLocked && (
            <div className={cn("grid grid-cols-2 items-stretch", panelGridGap)}>
              <div className={cn("flex flex-col", panelFieldVerticalGap)}>
                <Label htmlFor="current-xp" className={cn(textStyleLabel, "block w-full text-center mb-0")}>
                  <span>{UI_STRINGS.experiencePanelCurrentXpMainLabel}</span>
                  <span className="block text-xs text-muted-foreground">
                    {UI_STRINGS.experiencePanelCurrentXpSubLabel}
                  </span>
                </Label>
                <Input
                  id="current-xp"
                  type="number"
                  value={localCurrentXp}
                  onChange={(e) => setLocalCurrentXp(parseInt(e.target.value, 10) || 0)}
                  min={0}
                  className={cn("h-10 text-center", textStyleInput)}
                  disabled={panelIsLocked}
                />
              </div>
              <div className="flex flex-col justify-end">
                {!isMaxLevel && (
                  <Button type="button" onClick={handleLevelUpClick} disabled={isMaxLevel || panelIsLocked} className="w-full h-10">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    {UI_STRINGS.experiencePanelLevelUpButton}
                  </Button>
                )}
              </div>
            </div>
          )}

          <div>
            <Progress value={progressPercentage} indicatorClassName="bg-primary" />
            <div className="flex justify-between items-center text-muted-foreground px-1">
              <span className={cn(
                  textStyleModifier, "text-accent",
                  currentLevel === 0 && "text-muted-foreground"
              )}>
                {parseAndRenderUIString(levelLabelFormat, {levelNumber: String(currentLevel)})}
              </span>
              {xpForNextLevel !== Infinity ? (
                <span className="text-xs">
                  {parseAndRenderUIString(UI_STRINGS.experiencePanelXpToLevelUpFormat, {
                    currentXp: localCurrentXp.toLocaleString(),
                    xpForNextLevel: xpForNextLevel.toLocaleString()
                  })}
                </span>
              ) : (
                <span className="font-semibold text-primary text-xs">{UI_STRINGS.experiencePanelMaxLevel}</span>
              )}
              {xpForNextLevel !== Infinity && <span className="text-xs">{parseAndRenderUIString(levelLabelFormat, {levelNumber: String(currentLevel + 1)})}</span>}
            </div>
          </div>

          {isMaxLevel && (
             <p className="text-sm text-center text-muted-foreground pt-2">
              {UI_STRINGS.experiencePanelMaxLevel}
             </p>
          )}
        </>
      )}
    </LockablePanelWrapper>
  );
};
ExperiencePanelComponent.displayName = "ExperiencePanelComponent";
export const ExperiencePanel = React.memo(ExperiencePanelComponent);

