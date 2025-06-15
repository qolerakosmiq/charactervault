
'use client';

import *as React from 'react';
import type { MouseEvent } from 'react'; // Import MouseEvent
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Progress } from '@/components/ui/progress';
import { Award, TrendingUp, Loader2, Lock, Unlock } from 'lucide-react'; // Added Lock, Unlock
import { useI18n } from '@/context/I18nProvider';
import type { XpDataEntry } from '@/i18n/i18n-data';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { Skeleton } from '@/components/ui/skeleton';
import { getXpRequiredForLevel } from '@/lib/dnd-utils'; 
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
  const [isLocked, setIsLocked] = React.useState(true);
  const toggleLock = () => setIsLocked(prev => !prev);

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
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <Award className="h-8 w-8 text-primary" />
              <Skeleton className="h-7 w-32" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
          <Skeleton className="h-4 w-3/4 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <Skeleton className="h-10 w-24 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const { UI_STRINGS } = translations;
  const levelLabelFormat = UI_STRINGS.experiencePanelLevelLabelFormat || "Level {levelNumber}";

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <Award className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl font-serif">{UI_STRINGS.experiencePanelTitle || "Experience"}</CardTitle>
              <CardDescription>{UI_STRINGS.experiencePanelDescription || "Track your character's progression and current experience points."}</CardDescription>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground shrink-0"
            onClick={toggleLock}
            aria-pressed={!isLocked}
            aria-label={isLocked ? UI_STRINGS.lockButtonAriaLabelLocked : UI_STRINGS.lockButtonAriaLabelUnlocked}
          >
            {isLocked ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
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
            />
          </div>
          <div className="w-1/2">
            {!isMaxLevel && (
            <Button onClick={handleLevelUpClick} disabled={isMaxLevel} className="w-full h-10">
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
      </CardContent>
    </Card>
  );
};
ExperiencePanelComponent.displayName = "ExperiencePanelComponent";
export const ExperiencePanel = React.memo(ExperiencePanelComponent);

