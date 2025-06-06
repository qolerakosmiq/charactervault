
'use client';

import * as React from 'react';
import type { AbilityName, AbilityScores } from '@/types/character';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calculator, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { useI18n } from '@/context/I18nProvider';
import { useToast } from "@/hooks/use-toast";

interface AbilityScorePointBuyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onScoresApplied: (scores: AbilityScores) => void;
  totalPointsBudget: number | string;
}

const ABILITY_ORDER: Exclude<AbilityName, 'none'>[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
const MIN_SCORE = 8;
const MAX_SCORE = 18;
const DEFAULT_SCORE = 8;

const POINT_BUY_COST: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 6,
  15: 8,
  16: 10,
  17: 13,
  18: 16,
};

export function AbilityScorePointBuyDialog({
  isOpen,
  onOpenChange,
  onScoresApplied,
  totalPointsBudget,
}: AbilityScorePointBuyDialogProps) {
  const { translations, isLoading: translationsLoading } = useI18n();
  const { toast } = useToast();

  const [currentScores, setCurrentScores] = React.useState<AbilityScores>(() => {
    const scores: Partial<AbilityScores> = {};
    ABILITY_ORDER.forEach(ability => scores[ability] = DEFAULT_SCORE);
    return scores as AbilityScores;
  });

  const parsedBudgetProp = typeof totalPointsBudget === 'string' ? parseFloat(totalPointsBudget) : totalPointsBudget;
  const isValidBudgetProp = typeof parsedBudgetProp === 'number' && !isNaN(parsedBudgetProp);
  
  const displayBudget = isValidBudgetProp ? parsedBudgetProp : 'N/A';
  const safeBudgetForCalculations = isValidBudgetProp ? parsedBudgetProp : 0;

  const calculatePointsSpent = React.useCallback((scores: AbilityScores): number => {
    return ABILITY_ORDER.reduce((acc, ability) => {
      const scoreValue = scores[ability];
      return acc + (POINT_BUY_COST[scoreValue] ?? 0);
    }, 0);
  }, []);

  const [pointsSpent, setPointsSpent] = React.useState(() => calculatePointsSpent(currentScores));
  const pointsRemaining = safeBudgetForCalculations - pointsSpent;

  React.useEffect(() => {
    if (isOpen) {
      const initial = {} as Partial<AbilityScores>;
      ABILITY_ORDER.forEach(ability => initial[ability] = DEFAULT_SCORE);
      setCurrentScores(initial as AbilityScores);
    }
  }, [isOpen]);

  React.useEffect(() => {
    setPointsSpent(calculatePointsSpent(currentScores));
  }, [currentScores, calculatePointsSpent]);


  const handleScoreChange = (ability: Exclude<AbilityName, 'none'>, newScore: number) => {
    if (newScore < MIN_SCORE || newScore > MAX_SCORE) return;

    const tempScores = { ...currentScores, [ability]: newScore };
    const tempSpent = calculatePointsSpent(tempScores);

    if (newScore < currentScores[ability] || tempSpent <= safeBudgetForCalculations) {
      setCurrentScores(tempScores);
    }
  };

  const handleApply = () => {
    if (pointsRemaining === 0 && isValidBudgetProp) {
      onScoresApplied(currentScores);
      onOpenChange(false);
    } else {
      toast({
        title: translations?.UI_STRINGS.pointBuyDialogErrorInvalidApplicationTitle || "Invalid Scores",
        description: translations?.UI_STRINGS.pointBuyDialogErrorInvalidApplicationDesc || "Cannot apply scores. Points spent must exactly match the total points budget, or the budget is invalid.",
        variant: "destructive",
      });
    }
  };

  const isApplyDisabled = pointsRemaining !== 0 || !isValidBudgetProp || translationsLoading;

  if (translationsLoading || !translations) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg md:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center font-serif">
              <Calculator className="mr-2 h-6 w-6 text-primary" />
              {translations?.UI_STRINGS.pointBuyDialogTitleLoading || "Point Buy Ability Scores"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">{translations?.UI_STRINGS.loadingAbilityNamesTitle || "Loading ability names..."}</p>
          </div>
           <DialogFooter className="mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
              Cancel
            </Button>
            <Button disabled type="button">
              Apply Scores
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  const { ABILITY_LABELS, UI_STRINGS } = translations;


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif">
            <Calculator className="mr-2 h-6 w-6 text-primary" />
            {UI_STRINGS.pointBuyDialogTitle || "Point Buy Ability Scores"}
          </DialogTitle>
          <DialogDescription>
            {UI_STRINGS.pointBuyDialogDescription || "Distribute points to set your character's initial ability scores. Scores start at 8, and the maximum score is 18."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-2">
            <div className="p-1 space-y-4">
                <div className="flex items-center justify-between gap-4 p-3 border rounded-md bg-muted/30">
                    <div className="text-left">
                        <p className="text-sm font-medium">{UI_STRINGS.pointBuyDialogTotalPointsBudgetLabel || "Total Points Budget:"}</p>
                        <p className="text-xl font-bold text-primary">{String(displayBudget)}</p>
                    </div>
                    <div className="flex-grow text-right">
                        <p className="text-sm">
                        {UI_STRINGS.pointBuyDialogPointsSpentLabel || "Points Spent:"} <Badge variant="secondary" className="whitespace-nowrap">{String(pointsSpent)}</Badge>
                        </p>
                        <p className={cn("text-sm font-semibold mt-1", pointsRemaining !== 0 ? "text-destructive" : "text-emerald-500")}>
                        {UI_STRINGS.pointBuyDialogPointsRemainingLabel || "Points Remaining:"} <Badge variant={pointsRemaining !== 0 || !isValidBudgetProp ? "destructive" : "default"} className={cn(pointsRemaining === 0 && isValidBudgetProp ? "bg-emerald-600 hover:bg-emerald-600/80" : "", "whitespace-nowrap")}>{String(pointsRemaining)}</Badge>
                        </p>
                    </div>
                </div>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                {ABILITY_ORDER.map((ability) => {
                    const score = currentScores[ability];
                    const cost = POINT_BUY_COST[score];
                    
                    const abilityLabelInfo = ABILITY_LABELS.find(al => al.value === ability);
                    const abbreviationPart = abilityLabelInfo?.abbr || ability.substring(0,3).toUpperCase();
                    const fullNamePart = abilityLabelInfo?.label || ability;


                    const incrementWouldExceedBudget = (calculatePointsSpent({ ...currentScores, [ability]: score + 1 })) > safeBudgetForCalculations;

                    return (
                    <div key={ability} className="p-3 border rounded-md space-y-2 bg-background">
                        <Label htmlFor={`score-input-${ability}`} className="text-base flex justify-between items-center">
                          <span>
                            <span className="font-semibold">{abbreviationPart}</span>
                            {fullNamePart && <span className="text-muted-foreground ml-1 font-normal">({fullNamePart})</span>}
                          </span>
                          <Badge variant="outline" className="whitespace-nowrap">{UI_STRINGS.pointBuyDialogCostLabel || "Cost:"} {cost}</Badge>
                        </Label>
                        <div className="flex items-center justify-center">
                           <NumberSpinnerInput
                              id={`score-input-${ability}`}
                              value={score}
                              onChange={(newVal) => handleScoreChange(ability, newVal)}
                              min={MIN_SCORE}
                              max={MAX_SCORE}
                              readOnly={true}
                              isIncrementDisabled={incrementWouldExceedBudget || score >= MAX_SCORE}
                              inputClassName="w-16 h-10 text-center text-xl" 
                              buttonClassName="h-10 w-10" 
                              buttonSize="icon" 
                              className="justify-center" 
                           />
                        </div>
                    </div>
                    );
                })}
                </div>
            </div>
        </ScrollArea>

        <DialogFooter className="mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
            {UI_STRINGS.pointBuyDialogCancelButton || "Cancel"}
          </Button>
          <Button onClick={handleApply} disabled={isApplyDisabled} type="button">
            {UI_STRINGS.pointBuyDialogApplyButton || "Apply Scores"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
