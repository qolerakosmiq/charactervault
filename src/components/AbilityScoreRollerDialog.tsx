
'use client';

import * as React from 'react'; // Added this line
import { useState, useEffect, useMemo } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Dices } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AbilityScoreRollerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onScoresApplied: (scores: AbilityScores) => void;
}

const ABILITY_ORDER: AbilityName[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

type RolledScoreItem = {
  id: string; // Unique ID for each roll, e.g., 'roll-0', 'roll-1'
  value: number;
};

// Helper function to roll a single die (1-6)
const rollDie = (): number => Math.floor(Math.random() * 6) + 1;

// Helper function to generate a single ability score (4d6 drop lowest)
const generateSingleAbilityScore = (): number => {
  const rolls = [rollDie(), rollDie(), rollDie(), rollDie()];
  rolls.sort((a, b) => a - b); // Sort in ascending order
  rolls.shift(); // Remove the lowest die
  return rolls.reduce((sum, val) => sum + val, 0); // Sum the remaining three
};

export function AbilityScoreRollerDialog({
  isOpen,
  onOpenChange,
  onScoresApplied,
}: AbilityScoreRollerDialogProps) {
  const [rolledScores, setRolledScores] = useState<RolledScoreItem[]>([]);
  // Stores which RolledScoreItem.id is assigned to which AbilityName
  const [assignments, setAssignments] = useState<Partial<Record<AbilityName, string>>>({});

  const generateNewRolls = () => {
    const newScores = Array(6)
      .fill(0)
      .map((_, index) => ({
        id: `roll-${index}-${Date.now()}`, // Ensure unique IDs even with same values
        value: generateSingleAbilityScore(),
      }));
    setRolledScores(newScores);
    setAssignments({}); // Clear previous assignments
  };

  useEffect(() => {
    if (isOpen) {
      generateNewRolls();
    }
  }, [isOpen]);

  const handleAssignScore = (ability: AbilityName, rollId: string | undefined) => {
    setAssignments((prev) => {
      const newAssignments = { ...prev };
      if (rollId === undefined || rollId === '') { // Unassigning
        delete newAssignments[ability];
      } else {
        // If this rollId was previously assigned to another ability, unassign it from there
        for (const key in newAssignments) {
          if (newAssignments[key as AbilityName] === rollId && key !== ability) {
            delete newAssignments[key as AbilityName];
          }
        }
        newAssignments[ability] = rollId;
      }
      return newAssignments;
    });
  };

  const handleApply = () => {
    const finalScores: Partial<AbilityScores> = {};
    let allAssigned = true;
    for (const ability of ABILITY_ORDER) {
      const assignedRollId = assignments[ability];
      const foundRoll = rolledScores.find(r => r.id === assignedRollId);
      if (foundRoll) {
        finalScores[ability] = foundRoll.value;
      } else {
        allAssigned = false;
        break;
      }
    }

    if (allAssigned && Object.keys(finalScores).length === 6) {
      onScoresApplied(finalScores as AbilityScores);
      onOpenChange(false);
    } else {
      // This case should ideally be prevented by disabling the button
      console.error("Error: Not all scores are assigned.");
    }
  };

  const isApplyDisabled = useMemo(() => {
    const assignedCount = Object.values(assignments).filter(Boolean).length;
    const uniqueAssignedRollIds = new Set(Object.values(assignments).filter(Boolean));
    return assignedCount !== 6 || uniqueAssignedRollIds.size !== 6;
  }, [assignments]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif">
            <Dices className="mr-2 h-6 w-6 text-primary" />
            Roll Initial Ability Scores
          </DialogTitle>
          <DialogDescription>
            Roll 4d6, drop the lowest for each score. Assign these values to your abilities.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-4">
          <Button onClick={generateNewRolls} variant="outline" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" /> Reroll Scores
          </Button>

          <div className="text-center">
            <Label className="text-sm font-medium text-muted-foreground">Your Rolled Scores:</Label>
            <div className="flex justify-center gap-2 mt-2 flex-wrap">
              {rolledScores.map((score) => (
                <Badge key={score.id} variant="secondary" className="text-lg px-3 py-1">
                  {score.value}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 items-center">
          {ABILITY_ORDER.map((ability) => {
            const currentAssignedRollId = assignments[ability];
            const availableRollsForThisAbility = rolledScores.filter(
              (roll) =>
                // It's this roll itself OR it's not assigned to any other ability
                roll.id === currentAssignedRollId ||
                !Object.values(assignments).some(assignedId => assignedId === roll.id && assignments[ability] !== roll.id)
            );

            return (
              <React.Fragment key={ability}>
                <Label htmlFor={`assign-${ability}`} className="capitalize font-medium text-right">
                  {ability}
                </Label>
                <Select
                  value={currentAssignedRollId}
                  onValueChange={(value) => handleAssignScore(ability, value)}
                >
                  <SelectTrigger id={`assign-${ability}`} className="w-full">
                    <SelectValue placeholder="Assign..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassign</SelectItem>
                    {rolledScores.map((roll) => (
                       <SelectItem
                        key={roll.id}
                        value={roll.id}
                        disabled={
                          Object.values(assignments).includes(roll.id) && // Check if this roll.id is in any assignment value
                          assignments[ability] !== roll.id // AND it's not the one currently assigned to *this* ability
                        }
                      >
                        {roll.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </React.Fragment>
            );
          })}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={isApplyDisabled}>
            Apply Scores
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
