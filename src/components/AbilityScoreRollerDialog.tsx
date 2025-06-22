
'use client';

import *as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import type { AbilityName, AbilityScores, DndClassId } from '@/types/character';
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
import { useI18n } from '@/context/I18nProvider';
import { useToast } from "@/hooks/use-toast";

interface AbilityScoreRollerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onScoresApplied: (scores: AbilityScores) => void;
  rerollOnes: boolean;
  characterClassId: DndClassId | '';
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
  characterClassId,
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

    if (translations && translations.DND_CLASSES) {
      const sortedNewScores = [...newScores].sort((a, b) => b.value - a.value);
      const classDef = translations.DND_CLASSES.find(c => c.id === characterClassId);
      const classSpecificPriorities = classDef?.abilityScorePriorities;

      const priorities: Exclude<AbilityName, 'none'>[] =
        (classSpecificPriorities && classSpecificPriorities.length === 6)
        ? classSpecificPriorities
        : ABILITY_ORDER;

      const newAssignments: Partial<Record<Exclude<AbilityName, 'none'>, string>> = {};
      priorities.forEach((ability, index) => {
        if (sortedNewScores[index]) {
          newAssignments[ability] = sortedNewScores[index].id;
        }
      });
      setAssignments(newAssignments);
    } else {
      setAssignments({});
    }
  }, [rerollOnes, translations, characterClassId]);

  useEffect(() => {
    if (isOpen && translations && !translationsLoading) {
      generateNewRolls();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, translations, translationsLoading]); 

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
        title: translations?.UI_STRINGS.rollerDialogErrorNotAllAssignedToastTitle,
        description: translations?.UI_STRINGS.rollerDialogErrorNotAllAssignedToastDesc,
        variant: "destructive",
      });
    }
  };

  const isApplyDisabled = useMemo(() => {
    const assignedCount = Object.values(assignments).filter(Boolean).length;
    const uniqueAssignedRollIds = new Set(Object.values(assignments).filter(Boolean));
    return assignedCount !== 6 || uniqueAssignedRollIds.size !== 6 || translationsLoading;
  }, [assignments, translationsLoading]);

  const sortedRolledScoresForDisplay = useMemo(() => {
    return [...rolledScores].sort((a, b) => b.value - a.value);
  }, [rolledScores]);

  const scoreColors = useMemo(() => {
    if (sortedRolledScoresForDisplay.length === 0) return [];
    const colors: string[] = new Array(sortedRolledScoresForDisplay.length).fill('');
    
    let greenCount = 0;
    for (let i = 0; i < sortedRolledScoresForDisplay.length; i++) {
        if (greenCount < 2 || (greenCount >=2 && i > 0 && sortedRolledScoresForDisplay[i].value === sortedRolledScoresForDisplay[i-1].value && colors[i-1] === 'green')) {
            colors[i] = 'green';
            greenCount++;
        } else {
            break; 
        }
    }

    let orangeCount = 0;
    let firstOrangeIndex = -1;
    for (let i = 0; i < sortedRolledScoresForDisplay.length; i++) {
        if (colors[i] === '') { 
            if (firstOrangeIndex === -1) firstOrangeIndex = i;
            if (orangeCount < 2 || (orangeCount >=2 && i > firstOrangeIndex && sortedRolledScoresForDisplay[i].value === sortedRolledScoresForDisplay[i-1].value && colors[i-1] === 'orange')) {
                 colors[i] = 'orange';
                 orangeCount++;
            } else if (orangeCount >= 2) {
                 break;
            }
        }
    }

    for (let i = 0; i < colors.length; i++) {
        if (colors[i] === '') {
            colors[i] = 'red';
        }
    }
    return colors;
  }, [sortedRolledScoresForDisplay]);


  if (translationsLoading || !translations) {
    return null;
  }
  const { UI_STRINGS, ABILITY_LABELS } = translations;

  const classDef = translations.DND_CLASSES.find(c => c.id === characterClassId);
  const classNameForDisplay = classDef?.label;
  const classPriorities = classDef?.abilityScorePriorities;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif">
            <Dices className="mr-2 h-6 w-6 text-primary" />
            {UI_STRINGS.rollerDialogTitle}
          </DialogTitle>
          <DialogDescription>
            {UI_STRINGS.rollerDialogDescPart1}
            {rerollOnes && (UI_STRINGS.rollerDialogDescRerollOnes)}
            {UI_STRINGS.rollerDialogDescPart2}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4"> {/* Changed my-4 to mt-4 */}
          <div className="text-center">
            <Label className="text-sm font-medium text-muted-foreground">
              {UI_STRINGS.rollerDialogYourScoresLabel}
            </Label>
            <div className="flex justify-center gap-2 mt-2 flex-wrap">
              {sortedRolledScoresForDisplay.map((score, index) => {
                let badgeColorClasses = "";
                const color = scoreColors[index];
                if (color === 'green') {
                  badgeColorClasses = "bg-emerald-600 text-emerald-50 border-emerald-700";
                } else if (color === 'orange') {
                  badgeColorClasses = "bg-amber-500 text-amber-50 border-amber-600";
                } else { // red
                  badgeColorClasses = "bg-red-600 text-red-50 border-red-700";
                }
                return (
                  <Badge
                    key={score.id}
                    variant={null}
                    className={cn(
                      "text-lg font-semibold px-2.5 py-1",
                      badgeColorClasses
                    )}
                  >
                    {score.value}
                  </Badge>
                );
              })}
            </div>
          </div>
          <Button onClick={generateNewRolls} variant="outline" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" /> {UI_STRINGS.rollerDialogRerollButton}
          </Button>
        </div>

        {classNameForDisplay && classPriorities && classPriorities.length >= 3 && (
          <div className="text-sm text-muted-foreground text-center mt-2 mb-3 p-2 border rounded-md bg-muted/20">
            {UI_STRINGS.rollerDialogClassPriorityIntro}{' '}
            <Badge variant="outline" className="font-semibold text-foreground">{classNameForDisplay}</Badge>
            {' '}{UI_STRINGS.rollerDialogClassPriorityPart2}
            <div className="flex justify-center gap-1.5 mt-1.5">
              <Badge className="bg-primary text-primary-foreground">
                {translations.ABILITY_LABELS.find(al => al.id === classPriorities[0])?.label || classPriorities[0]}
              </Badge>
              <Badge variant="secondary">
                {translations.ABILITY_LABELS.find(al => al.id === classPriorities[1])?.label || classPriorities[1]}
              </Badge>
              <Badge variant="outline" className="text-muted-foreground border-border">
                {translations.ABILITY_LABELS.find(al => al.id === classPriorities[2])?.label || classPriorities[2]}
              </Badge>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 items-center">
          {ABILITY_ORDER.map((ability) => {
            const currentAssignedRollId = assignments[ability];
            const abilityLabelInfo = ABILITY_LABELS.find(al => al.id === ability);
            const abbrPart = abilityLabelInfo?.abbr || ability.substring(0,3).toUpperCase();
            const fullNamePart = abilityLabelInfo?.label || ability;

            return (
              <React.Fragment key={ability}>
                <Label htmlFor={`assign-${ability}`} className="font-medium text-right">
                  {abbrPart}
                  {fullNamePart && <span className="text-muted-foreground ml-1 font-normal"> ({fullNamePart})</span>}
                </Label>
                <Select
                  value={currentAssignedRollId || UNASSIGN_VALUE}
                  onValueChange={(value) => handleAssignScore(ability, value)}
                >
                  <SelectTrigger id={`assign-${ability}`} className="w-full">
                    <SelectValue>
                      {currentAssignedRollId && currentAssignedRollId !== UNASSIGN_VALUE
                        ? rolledScores.find(r => r.id === currentAssignedRollId)?.value
                        : (UI_STRINGS.rollerDialogNotSelectedOption)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGN_VALUE}>{UI_STRINGS.rollerDialogNotSelectedOption}</SelectItem>
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
            {UI_STRINGS.rollerDialogCancelButton}
          </Button>
          <Button onClick={handleApply} disabled={isApplyDisabled}>
            {UI_STRINGS.rollerDialogApplyButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
