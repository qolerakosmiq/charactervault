
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
import { RefreshCw, Dices, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nProvider';
import { useToast } from "@/hooks/use-toast";

interface AbilityScoreRollerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onScoresApplied: (scores: AbilityScores) => void;
  rerollOnes: boolean;
}

const ABILITY_ORDER: Exclude<AbilityName, 'none'>[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
const UNASSIGN_VALUE = "__UNASSIGN__"; 

type RolledScoreItem = {
  id: string; 
  value: number;
};

const rollDieInternal = (rerollActive: boolean): number => {
  let roll = Math.floor(Math.random() * 6) + 1;
  if (rerollActive) {
    while (roll === 1) {
      roll = Math.floor(Math.random() * 6) + 1;
    }
  }
  return roll;
};

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
  rerollOnes,
}: AbilityScoreRollerDialogProps) {
  const { translations, isLoading: translationsLoading } = useI18n();
  const { toast } = useToast();
  const [rolledScores, setRolledScores] = useState<RolledScoreItem[]>([]);
  const [assignments, setAssignments] = useState<Partial<Record<Exclude<AbilityName, 'none'>, string>>>({});

  const generateNewRolls = React.useCallback(() => {
    const newScores = Array(6)
      .fill(0)
      .map((_, index) => ({
        id: `roll-${index}-${Date.now()}`, 
        value: generateSingleAbilityScoreInternal(rerollOnes),
      }));
    setRolledScores(newScores);
    setAssignments({}); 
  }, [rerollOnes]);

  useEffect(() => {
    if (isOpen) {
      generateNewRolls();
    }
  }, [isOpen, generateNewRolls]);

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
      toast({
        title: translations?.UI_STRINGS.rollerDialogErrorNotAllAssignedToastTitle || "Assignment Incomplete",
        description: translations?.UI_STRINGS.rollerDialogErrorNotAllAssignedToastDesc || "Please assign all rolled scores to abilities before applying.",
        variant: "destructive",
      });
    }
  };

  const isApplyDisabled = useMemo(() => {
    const assignedCount = Object.values(assignments).filter(Boolean).length;
    const uniqueAssignedRollIds = new Set(Object.values(assignments).filter(Boolean));
    return assignedCount !== 6 || uniqueAssignedRollIds.size !== 6 || translationsLoading;
  }, [assignments, translationsLoading]);

  if (translationsLoading || !translations) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md md:sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center font-serif">
              <Dices className="mr-2 h-6 w-6 text-primary" />
              {translations?.UI_STRINGS.rollerDialogTitleLoading || "Roll Initial Ability Scores"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">{translations?.UI_STRINGS.loadingOptionsTitle || "Loading options..."}</p>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled>Cancel</Button>
            <Button disabled>Apply Scores</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  const { UI_STRINGS, ABILITY_LABELS } = translations;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif">
            <Dices className="mr-2 h-6 w-6 text-primary" />
            {UI_STRINGS.rollerDialogTitle || "Roll Initial Ability Scores"}
          </DialogTitle>
          <DialogDescription>
            {UI_STRINGS.rollerDialogDescPart1 || "Roll 4d6 (drop lowest"}
            {rerollOnes && (UI_STRINGS.rollerDialogDescRerollOnes || ", rerolling 1s")}
            {UI_STRINGS.rollerDialogDescPart2 || "). Assign these values to your abilities."}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-4">
          <div className="text-center">
            <Label className="text-sm font-medium text-muted-foreground">
              {UI_STRINGS.rollerDialogYourScoresLabel || "Your Rolled Scores:"}
            </Label>
            <div className="flex justify-center gap-2 mt-2 flex-wrap">
              {rolledScores.map((score) => (
                <Badge key={score.id} variant="secondary" className="text-lg px-3 py-1">
                  {score.value}
                </Badge>
              ))}
            </div>
          </div>
          <Button onClick={generateNewRolls} variant="outline" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" /> {UI_STRINGS.rollerDialogRerollButton || "Reroll Scores"}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 items-center">
          {ABILITY_ORDER.map((ability) => {
            const currentAssignedRollId = assignments[ability];
            const abilityLabelInfo = ABILITY_LABELS.find(al => al.value === ability);
            const abbrPart = abilityLabelInfo?.abbr || ability.substring(0,3).toUpperCase();
            const fullNamePart = abilityLabelInfo?.label || ability;
            
            return (
              <React.Fragment key={ability}>
                <Label htmlFor={`assign-${ability}`} className="font-medium text-right">
                  {abbrPart}
                  {fullNamePart && <span className="text-muted-foreground ml-1 font-normal">({fullNamePart})</span>}
                </Label>
                <Select
                  value={currentAssignedRollId || UNASSIGN_VALUE} // Ensure UNASSIGN_VALUE is used if undefined
                  onValueChange={(value) => handleAssignScore(ability, value)}
                >
                  <SelectTrigger id={`assign-${ability}`} className="w-full">
                    <SelectValue>
                      {currentAssignedRollId && currentAssignedRollId !== UNASSIGN_VALUE
                        ? rolledScores.find(r => r.id === currentAssignedRollId)?.value
                        : (UI_STRINGS.rollerDialogNotSelectedOption || "Not selected")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGN_VALUE}>{UI_STRINGS.rollerDialogNotSelectedOption || "Not selected"}</SelectItem>
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
            {UI_STRINGS.rollerDialogCancelButton || "Cancel"}
          </Button>
          <Button onClick={handleApply} disabled={isApplyDisabled}>
            {UI_STRINGS.rollerDialogApplyButton || "Apply Scores"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    