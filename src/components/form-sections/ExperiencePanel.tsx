
'use client';

import *as React from 'react';
import type { MouseEvent } from 'react';
import { Label } from '@/components/ui/label';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Progress } from '@/components/ui/progress';
import { Award, TrendingUp, Loader2 } from 'lucide-react';
import { useI18n } from '@/context/I18nProvider';
import type { XpDataEntry } from '@/i18n/i18n-data';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { Skeleton } from '@/components/ui/skeleton';
import { getXpRequiredForLevel } from '@/lib/dnd-utils'; 
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper'; // Added

const DEBOUNCE_DELAY_XP = 500;

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
    DEBOUNCE_DELAY_XP
  );

  const xpForCurrentLevelStart = React.useMemo(() => {
    return getXpRequiredForLevel(currentLevel, xpTable, epicLevelXpIncrease);
  }, [currentLevel, xpTable, epicLevelXpIncrease]);

  const xpForNextLevel = React.useMemo(() => {
    return getXpRequiredForLevel(currentLevel + 1, xpTable, epicLevelXpIncrease);
  }, [currentLevel, xpTable, epicLevelXpIncrease]);

  const progressPercentage = React.useMemo(() => {
    if (xpForNextLevel === Infinity || xpForNextLevel === xpForCurrentLevelStart) return 0;
    const progressInCurrentLevel = Math.max(0, localCurrentXp - xpForCurrentLevelStart);
    const xpNeededForThisLevel = xpForNextLevel - xpForCurrentLevelStart;
    if (xpNeededForThisLevel <= 0) return 100;
    return Math.min(100, (progressInCurrentLevel / xpNeededForThisLevel) * 100);
  }, [localCurrentXp, xpForCurrentLevelStart, xpForNextLevel]);

  const handleLevelUpClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (xpForNextLevel !== Infinity && localCurrentXp < xpForNextLevel) {
      const newXpToReachNextLevel = xpForNextLevel;
      setLocalCurrentXp(newXpToReachNextLevel);
    }
  };

  const isMaxLevel = xpForNextLevel === Infinity;


  if (translationsLoading || !translations) {
    return (
      <LockablePanelWrapper
        title={translations?.UI_STRINGS.experiencePanelTitle || "Experience"}
        description={translations?.UI_STRINGS.experiencePanelDescription || "Track your character's progression and current experience points."}
        icon={Award}
        cardContentClassName="space-y-4 pt-4"
        initialLockedState={false}
      >
        {() => (
          <>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
            <Skeleton className="h-10 w-24 mx-auto" />
          </>
        )}
      </LockablePanelWrapper>
    );
  }

  const { UI_STRINGS } = translations;
  const levelLabelFormat = UI_STRINGS.experiencePanelLevelLabelFormat || "Level {levelNumber}";

  return (
    <LockablePanelWrapper
      title={UI_STRINGS.experiencePanelTitle || "Experience"}
      description={UI_STRINGS.experiencePanelDescription || "Track your character's progression and current experience points."}
      icon={Award}
      cardContentClassName="space-y-4 pt-4"
      initialLockedState={false}
    >
      {({ isLocked: panelIsLocked }) => (
        <>
          <div className="flex items-center gap-x-2">
            <div className="w-1/2 space-y-1.5">
              <Label htmlFor="current-xp" className="text-sm font-medium block w-full text-center mb-0">
                <span>{UI_STRINGS.experiencePanelCurrentXpMainLabel || "Current XP"}</span>
                <span className="block text-xs text-muted-foreground">
                  {UI_STRINGS.experiencePanelCurrentXpSubLabel || "Experience Points"}
                </span>
              </Label>
              <NumberSpinnerInput
                id="current-xp"
                value={localCurrentXp}
                onChange={setLocalCurrentXp}
                min={0}
                inputClassName="w-full h-10 text-lg text-center" 
                buttonClassName="h-10 w-10"
                disabled={panelIsLocked}
              />
            </div>
            <div className="w-1/2">
              {!isMaxLevel && (
              <Button type="button" onClick={handleLevelUpClick} disabled={isMaxLevel || panelIsLocked} className="w-full h-10">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  {UI_STRINGS.experiencePanelLevelUpButton || "Level Up"}
              </Button>
              )}
            </div>
          </div>

          <div>
            <Progress value={progressPercentage} className="h-3" indicatorClassName="bg-primary" />
            <div className="flex justify-between items-center text-muted-foreground px-1">
              <span className={cn(
                  "font-semibold text-xl text-accent",
                  currentLevel === 0 && "text-muted-foreground"
              )}>
                {levelLabelFormat.replace("{levelNumber}", String(currentLevel))}
              </span>
              {xpForNextLevel !== Infinity ? (
                <span className="text-xs">
                  {(UI_STRINGS.experiencePanelXpToLevelUpFormat || "{currentXp} / {xpForNextLevel} XP")
                    .replace("{currentXp}", localCurrentXp.toLocaleString())
                    .replace("{xpForNextLevel}", xpForNextLevel.toLocaleString())
                  }
                </span>
              ) : (
                <span className="font-semibold text-primary text-xs">{UI_STRINGS.experiencePanelMaxLevel || "Max Level"}</span>
              )}
              {xpForNextLevel !== Infinity && <span className="text-xs">{levelLabelFormat.replace("{levelNumber}", String(currentLevel + 1))}</span>}
            </div>
          </div>
          
          {isMaxLevel && ( 
             <p className="text-sm text-center text-muted-foreground pt-2">
              {UI_STRINGS.experiencePanelMaxLevel || "Max Level Reached"}
             </p>
          )}
        </>
      )}
    </LockablePanelWrapper>
  );
};
ExperiencePanelComponent.displayName = "ExperiencePanelComponent";
export const ExperiencePanel = React.memo(ExperiencePanelComponent);

