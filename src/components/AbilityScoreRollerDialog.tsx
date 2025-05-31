
'use client';

import * as React from 'react';
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
  rerollOnes: boolean; // New prop
}

const ABILITY_ORDER: Exclude<AbilityName, 'none'>[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
const UNASSIGN_VALUE = "__UNASSIGN__"; 

type RolledScoreItem = {
  id: string; 
  value: number;
};

const ABILITY_FULL_DISPLAY_NAMES: Record<Exclude<AbilityName, 'none'>, string> = {
  strength: 'Strength (STR)',
  dexterity: 'Dexterity (DEX)',
  constitution: 'Constitution (CON)',
  intelligence: 'Intelligence (INT)',
  wisdom: 'Wisdom (WIS)',
  charisma: 'Charisma (CHA)',
};

// Internal function to roll a single die, with optional reroll of 1s
const rollDieInternal = (rerollActive: boolean): number => {
  let roll = Math.floor(Math.random() * 6) + 1;
  if (rerollActive) {
    while (roll === 1) {
      roll = Math.floor(Math.random() * 6) + 1;
    }
  }
  return roll;
};

// Internal function to generate a single ability score (4d6 drop lowest)
const generateSingleAbilityScoreInternal = (rerollActive: boolean): number => {
  const rolls = [
    rollDieInternal(rerollActive),
    rollDieInternal(rerollActive),
    rollDieInternal(rerollActive),
    rollDieInternal(rerollActive),
  ];
  rolls.sort((a, b) => a - b); 
  rolls.shift(); 
  return rolls.reduce((sum, val) => sum + val, 0); 
};

export function AbilityScoreRollerDialog({
  isOpen,
  onOpenChange,
  onScoresApplied,
  rerollOnes, // Destructure new prop
}: AbilityScoreRollerDialogProps) {
  const [rolledScores, setRolledScores] = useState<RolledScoreItem[]>([]);
  const [assignments, setAssignments] = useState<Partial<Record<Exclude<AbilityName, 'none'>, string>>>({});

  const generateNewRolls = React.useCallback(() => {
    const newScores = Array(6)
      .fill(0)
      .map((_, index) => ({
        id: `roll-${index}-${Date.now()}`, 
        value: generateSingleAbilityScoreInternal(rerollOnes), // Use the rerollOnes prop
      }));
    setRolledScores(newScores);
    setAssignments({}); 
  }, [rerollOnes]); // Add rerollOnes to dependency array

  useEffect(() => {
    if (isOpen) {
      generateNewRolls();
    }
  }, [isOpen, generateNewRolls]); // generateNewRolls is now memoized with useCallback

  const handleAssignScore = (ability: Exclude<AbilityName, 'none'>, rollId: string | undefined) => {
    setAssignments((prev) => {
      const newAssignments = { ...prev };
      if (rollId === undefined || rollId === UNASSIGN_VALUE) { 
        delete newAssignments[ability];
      } else {
        for (const key in newAssignments) {
          if (newAssignments[key as Exclude<AbilityName, 'none'>] === rollId && key !== ability) {
            delete newAssignments[key as Exclude<AbilityName, 'none'>];
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
            Roll 4d6 (drop lowest{rerollOnes ? ", rerolling 1s" : ""}). Assign these values to your abilities.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-4">
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
          <Button onClick={generateNewRolls} variant="outline" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" /> Reroll Scores
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 items-center">
          {ABILITY_ORDER.map((ability) => {
            const currentAssignedRollId = assignments[ability];
            const fullDisplayName = ABILITY_FULL_DISPLAY_NAMES[ability];
            const openParenIndex = fullDisplayName.indexOf('(');
            let mainNamePart = fullDisplayName;
            let abbreviationPart = '';

            if (openParenIndex > -1 && fullDisplayName.endsWith(')')) {
                mainNamePart = fullDisplayName.substring(0, openParenIndex).trim();
                abbreviationPart = fullDisplayName.substring(openParenIndex);
            }
            
            return (
              <React.Fragment key={ability}>
                <Label htmlFor={`assign-${ability}`} className="font-medium text-right">
                  {mainNamePart}
                  {abbreviationPart && <span className="text-muted-foreground ml-1 font-normal">{abbreviationPart}</span>}
                </Label>
                <Select
                  value={currentAssignedRollId}
                  onValueChange={(value) => handleAssignScore(ability, value)}
                >
                  <SelectTrigger id={`assign-${ability}`} className="w-full">
                    <SelectValue placeholder="Assign..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGN_VALUE}>Unassign</SelectItem>
                    {rolledScores.map((roll) => (
                       <SelectItem
                        key={roll.id}
                        value={roll.id}
                        disabled={
                          Object.values(assignments).includes(roll.id) && 
                          assignments[ability] !== roll.id 
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
