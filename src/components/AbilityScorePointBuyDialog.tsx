
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calculator, MinusCircle, PlusCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface AbilityScorePointBuyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onScoresApplied: (scores: AbilityScores) => void;
  initialTotalPoints?: number;
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

const ABILITY_DISPLAY_NAMES_FULL: Record<Exclude<AbilityName, 'none'>, string> = {
  strength: 'STR (Strength)',
  dexterity: 'DEX (Dexterity)',
  constitution: 'CON (Constitution)',
  intelligence: 'INT (Intelligence)',
  wisdom: 'WIS (Wisdom)',
  charisma: 'CHA (Charisma)',
};

export function AbilityScorePointBuyDialog({
  isOpen,
  onOpenChange,
  onScoresApplied,
  initialTotalPoints = 25,
}: AbilityScorePointBuyDialogProps) {
  const [totalPoints, setTotalPoints] = React.useState(initialTotalPoints);
  const [currentScores, setCurrentScores] = React.useState<AbilityScores>(() => {
    const scores: Partial<AbilityScores> = {};
    ABILITY_ORDER.forEach(ability => scores[ability] = DEFAULT_SCORE);
    return scores as AbilityScores;
  });

  const calculatePointsSpent = React.useCallback((scores: AbilityScores): number => {
    return ABILITY_ORDER.reduce((acc, ability) => {
      const scoreValue = scores[ability];
      return acc + (POINT_BUY_COST[scoreValue] ?? 0);
    }, 0);
  }, []);

  const [pointsSpent, setPointsSpent] = React.useState(() => calculatePointsSpent(currentScores));
  const pointsRemaining = totalPoints - pointsSpent;

  React.useEffect(() => {
    if (isOpen) {
      const initial = {} as Partial<AbilityScores>;
      ABILITY_ORDER.forEach(ability => initial[ability] = DEFAULT_SCORE);
      setCurrentScores(initial as AbilityScores);
      setTotalPoints(initialTotalPoints); 
    }
  }, [isOpen, initialTotalPoints]);

  React.useEffect(() => {
    setPointsSpent(calculatePointsSpent(currentScores));
  }, [currentScores, calculatePointsSpent]);


  const handleScoreChange = (ability: Exclude<AbilityName, 'none'>, newScore: number) => {
    if (newScore < MIN_SCORE || newScore > MAX_SCORE) return;

    const tempScores = { ...currentScores, [ability]: newScore };
    const tempSpent = calculatePointsSpent(tempScores);

    if (tempSpent <= totalPoints) {
      setCurrentScores(tempScores);
    }
  };

  const incrementScore = (ability: Exclude<AbilityName, 'none'>) => {
    handleScoreChange(ability, currentScores[ability] + 1);
  };

  const decrementScore = (ability: Exclude<AbilityName, 'none'>) => {
    handleScoreChange(ability, currentScores[ability] - 1);
  };

  const handleApply = () => {
    if (pointsRemaining >= 0) {
      onScoresApplied(currentScores);
      onOpenChange(false);
    } else {
      console.error("Error: Cannot apply scores, points spent exceed total points.");
    }
  };

  const isApplyDisabled = pointsRemaining < 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif">
            <Calculator className="mr-2 h-6 w-6 text-primary" />
            Point Buy Ability Scores
          </DialogTitle>
          <DialogDescription>
            Distribute points to set your character's initial ability scores. Scores start at 8.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-2">
            <div className="p-1 space-y-4">
                <div className="flex items-center gap-4 p-3 border rounded-md bg-muted/30">
                    <div className="space-y-1">
                        <Label htmlFor="total-points-buy">Total Points Budget</Label>
                        <Input
                        id="total-points-buy"
                        type="number"
                        value={totalPoints}
                        onChange={(e) => setTotalPoints(parseInt(e.target.value, 10) || 0)}
                        className="w-24 h-8 text-center"
                        />
                    </div>
                    <div className="flex-grow text-right">
                        <p className="text-sm">
                        Points Spent: <Badge variant="secondary">{pointsSpent}</Badge>
                        </p>
                        <p className={cn("text-sm font-semibold mt-1", pointsRemaining < 0 ? "text-destructive" : "text-emerald-500")}>
                        Points Remaining: <Badge variant={pointsRemaining < 0 ? "destructive" : "default"} className={pointsRemaining >=0 ? "bg-emerald-600 hover:bg-emerald-600/80" : ""}>{pointsRemaining}</Badge>
                        </p>
                    </div>
                </div>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                {ABILITY_ORDER.map((ability) => {
                    const score = currentScores[ability];
                    const cost = POINT_BUY_COST[score];
                    const fullDisplayNameFromMap = ABILITY_DISPLAY_NAMES_FULL[ability];
                    
                    const match = fullDisplayNameFromMap.match(/^([A-Z]{3})\s*\(([^)]+)\)$/);
                    const abbreviationPart = match ? match[1] : fullDisplayNameFromMap;
                    const fullNamePart = match ? match[2] : '';

                    return (
                    <div key={ability} className="p-3 border rounded-md space-y-2 bg-background">
                        <Label htmlFor={`score-input-${ability}`} className="text-base flex justify-between items-center">
                          <span>
                            <span className="font-semibold">{abbreviationPart}</span>
                            {fullNamePart && <span className="text-muted-foreground ml-1 font-normal">({fullNamePart})</span>}
                          </span>
                          <Badge variant="outline">Cost: {cost}</Badge>
                        </Label>
                        <div className="flex items-center justify-center space-x-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => decrementScore(ability)}
                            disabled={score <= MIN_SCORE}
                        >
                            <MinusCircle className="h-4 w-4" />
                        </Button>
                        <Input
                            id={`score-input-${ability}`}
                            type="number"
                            value={score}
                            readOnly
                            className="w-16 h-10 text-center text-xl appearance-none"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => incrementScore(ability)}
                            disabled={score >= MAX_SCORE || (calculatePointsSpent({ ...currentScores, [ability]: score + 1 })) > totalPoints}
                        >
                            <PlusCircle className="h-4 w-4" />
                        </Button>
                        </div>
                    </div>
                    );
                })}
                </div>
            </div>
        </ScrollArea>

        <DialogFooter className="mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={isApplyDisabled} type="button">
            Apply Scores
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
