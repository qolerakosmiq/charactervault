
'use client';

import *as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Progress } from '@/components/ui/progress';
import { Award, TrendingUp, Loader2 } from 'lucide-react';
import { useI18n } from '@/context/I18nProvider';
import type { XpDataEntry } from '@/i18n/i18n-data';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { Skeleton } from '@/components/ui/skeleton';
import { getXpRequiredForLevel } from '@/lib/dnd-utils'; // Corrected import path
import { cn } from '@/lib/utils';

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

  const [localCurrentXp, setLocalCurrentXp] = useDebouncedFormField(
    currentXp,
    onXpChange,
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

  if (translationsLoading || !translations) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Award className="h-8 w-8 text-primary" />
            <Skeleton className="h-7 w-32" />
          </div>
          <Skeleton className="h-4 w-3/4 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const { UI_STRINGS } = translations;

  const levelLabelFormat = UI_STRINGS.experiencePanelLevelLabelFormat || "Level {levelNumber}";


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Award className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl font-serif">{UI_STRINGS.experiencePanelTitle || "Experience"}</CardTitle>
        </div>
        <CardDescription>{UI_STRINGS.experiencePanelDescription || "Track your character's progression and current experience points."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div>
          <Label htmlFor="current-xp" className="text-sm font-medium block w-full text-center mb-1.5">
            <span>{UI_STRINGS.experiencePanelCurrentXpMainLabel || "Current XP"}</span>
            {UI_STRINGS.experiencePanelCurrentXpSubLabel && (
              <span className="block text-xs text-muted-foreground">
                {UI_STRINGS.experiencePanelCurrentXpSubLabel}
              </span>
            )}
          </Label>
          <div className="flex justify-center">
            <NumberSpinnerInput
              id="current-xp"
              value={localCurrentXp}
              onChange={setLocalCurrentXp}
              min={0}
              inputClassName="w-32 h-10 text-lg text-center"
              buttonClassName="h-10 w-10"
            />
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
      </CardContent>
    </Card>
  );
};
ExperiencePanelComponent.displayName = "ExperiencePanelComponent";
export const ExperiencePanel = React.memo(ExperiencePanelComponent);

