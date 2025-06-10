
'use client';

import *as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Dices, Loader2 } from 'lucide-react';
import type { GenericBreakdownItem } from '@/types/character-core';
import { useI18n } from '@/context/I18nProvider';
import { Separator } from '@/components/ui/separator';
import { renderModifierValue, sectionHeadingClass } from '@/components/info-dialog-content/dialog-utils'; // Assuming this utility is suitable
import { cn } from '@/lib/utils';

export interface RollDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dialogTitle: string;
  rollType: string;
  baseModifier: number;
  calculationBreakdown: GenericBreakdownItem[];
  onRoll: (diceResult: number, totalBonus: number, finalResult: number) => void;
}

export function RollDialog({
  isOpen,
  onOpenChange,
  dialogTitle,
  rollType,
  baseModifier,
  calculationBreakdown,
  onRoll,
}: RollDialogProps) {
  const { translations, isLoading: translationsLoading } = useI18n();
  const [diceResult, setDiceResult] = React.useState<number | null>(null);
  const [finalResult, setFinalResult] = React.useState<number | null>(null);
  const [isRolling, setIsRolling] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setDiceResult(null);
      setFinalResult(null);
    }
  }, [isOpen]);

  const handleRoll = () => {
    setIsRolling(true);
    // Simulate a brief roll
    setTimeout(() => {
      const d20Roll = Math.floor(Math.random() * 20) + 1;
      const total = d20Roll + baseModifier;
      setDiceResult(d20Roll);
      setFinalResult(total);
      onRoll(d20Roll, baseModifier, total);
      setIsRolling(false);
    }, 300); // Short delay for visual feedback
  };

  if (translationsLoading || !translations) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center font-serif">
              <Dices className="mr-2 h-5 w-5 text-primary" />
              {translations?.UI_STRINGS.loadingText || "Loading..."}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const UI_STRINGS = translations.UI_STRINGS;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center">
            <Dices className="mr-2 h-5 w-5 text-primary" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {UI_STRINGS.rollDialogDescriptionFormat?.replace("{rollType}", rollType) || `Performing a ${rollType}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3 max-h-[60vh] overflow-y-auto pr-2">
          {calculationBreakdown.length > 0 && (
            <div>
              <h4 className={cn(sectionHeadingClass, "text-base mb-1")}>{UI_STRINGS.rollDialogCalculationBreakdownTitle || "Calculation Breakdown:"}</h4>
              <div className="space-y-0.5 text-sm bg-muted/30 p-2 rounded-md">
                {calculationBreakdown.map((item, index) => (
                  <div key={`breakdown-${index}`} className="flex justify-between">
                    <span className="text-muted-foreground">{item.label}:</span>
                    <span className={cn("font-semibold", item.isBold && "font-bold")}>
                      {renderModifierValue(item.value)}
                    </span>
                  </div>
                ))}
                <Separator className="my-1" />
                <div className="flex justify-between font-semibold">
                  <span className="text-muted-foreground">{UI_STRINGS.rollDialogTotalBonusLabel || "Total Bonus"}:</span>
                  <span>{renderModifierValue(baseModifier)}</span>
                </div>
              </div>
            </div>
          )}

          {diceResult !== null && finalResult !== null && (
            <div className="mt-3 p-3 border rounded-md bg-accent/10 text-center space-y-1">
              <p className="text-sm">
                {UI_STRINGS.rollDialogDiceRollLabel || "Dice Roll (1d20):"} <span className="font-bold text-lg text-primary">{diceResult}</span>
              </p>
              <p className="text-sm">
                {UI_STRINGS.rollDialogTotalBonusLabel || "Total Bonus:"} <span className="font-bold text-lg text-primary">{renderModifierValue(baseModifier)}</span>
              </p>
              <Separator className="my-1 bg-accent/30"/>
              <p className="text-lg font-semibold">
                {UI_STRINGS.rollDialogFinalResultLabel || "Final Result:"} <span className="font-bold text-2xl text-primary">{finalResult}</span>
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button onClick={handleRoll} disabled={isRolling} className="w-full sm:w-auto">
            {isRolling ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Dices className="mr-2 h-4 w-4" />
            )}
            {UI_STRINGS.rollDialogRollButton || "Roll 1d20"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
