
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

function getXpForLevel(level: number, xpTable: readonly XpDataEntry[], epicLevelXpIncrease: number): number {
  if (level <= 1) return 0;
  const standardEntry = xpTable.find(entry => entry.level === level);
  if (standardEntry) {
    return standardEntry.xpRequired;
  }
  // Handle epic levels
  if (level > 20) {
    const xpForLevel20 = xpTable.find(entry => entry.level === 20)?.xpRequired || 190000;
    return xpForLevel20 + (level - 20) * epicLevelXpIncrease;
  }
  // Should not happen if table is complete up to 20
  return Infinity;
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
    return getXpForLevel(currentLevel, xpTable, epicLevelXpIncrease);
  }, [currentLevel, xpTable, epicLevelXpIncrease]);

  const xpForNextLevel = React.useMemo(() => {
    return getXpForLevel(currentLevel + 1, xpTable, epicLevelXpIncrease);
  }, [currentLevel, xpTable, epicLevelXpIncrease]);

  const progressPercentage = React.useMemo(() => {
    if (xpForNextLevel === Infinity || xpForNextLevel === xpForCurrentLevelStart) return 0; // Max level or error
    const progressInCurrentLevel = Math.max(0, localCurrentXp - xpForCurrentLevelStart);
    const xpNeededForThisLevel = xpForNextLevel - xpForCurrentLevelStart;
    if (xpNeededForThisLevel <= 0) return 100; // Should not happen if XP table is correct
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Award className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl font-serif">{UI_STRINGS.experiencePanelTitle || "Experience"}</CardTitle>
        </div>
        <CardDescription>{UI_STRINGS.experiencePanelDescription || "Track your character's progression."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div>
          <Label htmlFor="current-xp" className="text-sm font-medium block w-full text-center mb-1.5">
            {UI_STRINGS.experiencePanelCurrentXpLabel || "Current XP"}
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

        <div className="space-y-1.5">
          <Progress value={progressPercentage} className="h-3" indicatorClassName="bg-primary" />
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span>Lv. {currentLevel}</span>
            {xpForNextLevel !== Infinity ? (
              <span>
                {(UI_STRINGS.experiencePanelXpToLevelUpFormat || "{currentXp} / {xpForNextLevel} XP")
                  .replace("{currentXp}", localCurrentXp.toLocaleString())
                  .replace("{xpForNextLevel}", xpForNextLevel.toLocaleString())
                }
              </span>
            ) : (
              <span className="font-semibold text-primary">{UI_STRINGS.experiencePanelMaxLevel || "Max Level"}</span>
            )}
            {xpForNextLevel !== Infinity && <span>Lv. {currentLevel + 1}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
ExperiencePanelComponent.displayName = "ExperiencePanelComponent";
export const ExperiencePanel = React.memo(ExperiencePanelComponent);
