
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
import { renderModifierValue, sectionHeadingClass } from '@/components/info-dialog-content/dialog-utils';
import { cn } from '@/lib/utils';
import { parseAndRollDice } from '@/lib/dnd-utils';

export interface RollDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dialogTitle: string;
  rollType: string; // e.g., "ability_check_strength", "saving_throw_fortitude", "skill_bluff", "damage_roll_melee_longsword"
  baseModifier: number; // Numerical bonus for attack/save/skill, or damage bonus for damage rolls
  calculationBreakdown: GenericBreakdownItem[];
  weaponDamageDice?: string; // e.g., "1d8", "2d6", "1d4-1" - only for damage rolls
  onRoll: (diceResult: number, totalBonus: number, finalResult: number, weaponDamageDiceString?: string) => void;
}

export function RollDialog({
  isOpen,
  onOpenChange,
  dialogTitle,
  rollType,
  baseModifier,
  calculationBreakdown,
  weaponDamageDice,
  onRoll,
}: RollDialogProps) {
  const { translations, isLoading: translationsLoading } = useI18n();
  const [diceResult, setDiceResult] = React.useState<number | null>(null); // For d20 or sum of weapon dice
  const [finalResult, setFinalResult] = React.useState<number | null>(null);
  const [isRolling, setIsRolling] = React.useState(false);

  const isDamageRoll = rollType.startsWith('damage_roll');

  React.useEffect(() => {
    if (isOpen) {
      setDiceResult(null);
      setFinalResult(null);
    }
  }, [isOpen]);

  const handleRollOrConfirm = () => {
    setIsRolling(true);
    setTimeout(() => {
      if (isDamageRoll && weaponDamageDice) {
        const weaponDiceRollResult = parseAndRollDice(weaponDamageDice);
        const totalDamage = weaponDiceRollResult + baseModifier; // baseModifier is the sum of other bonuses
        setDiceResult(weaponDiceRollResult); // Store the result of parsing/rolling the weaponDamageDice string
        setFinalResult(totalDamage);
        onRoll(weaponDiceRollResult, baseModifier, totalDamage, weaponDamageDice);
      } else {
        const d20Roll = Math.floor(Math.random() * 20) + 1;
        const total = d20Roll + baseModifier;
        setDiceResult(d20Roll);
        setFinalResult(total);
        onRoll(d20Roll, baseModifier, total);
      }
      setIsRolling(false);
    }, 300);
  };

  if (translationsLoading || !translations) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
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
  const buttonText = isDamageRoll ? (UI_STRINGS.rollDialogConfirmDamageButton || "Confirm Damage") : (UI_STRINGS.rollDialogRollButton || "Roll 1d20");

  const actualWeaponDicePart = weaponDamageDice?.match(/^(\d*d\d+)/)?.[0] || weaponDamageDice;

  const totalBonusLabel = isDamageRoll ? (UI_STRINGS.rollDialogTotalNumericBonusLabel || "Total Numeric Bonus") : (UI_STRINGS.rollDialogTotalBonusLabel || "Total Bonus");

  const isCritFailure = !isDamageRoll && diceResult === 1;
  const isCritSuccess = !isDamageRoll && diceResult === 20;

  const resultCardBackground = cn(
    "p-3 border rounded-md space-y-1",
    isCritFailure ? "bg-destructive/20 border-destructive/50" :
    isCritSuccess ? "bg-emerald-600/20 border-emerald-600/50" :
    "bg-card border-border"
  );

  const diceResultColor = cn(
    "font-bold text-lg",
    isCritFailure ? "text-destructive" :
    isCritSuccess ? "text-emerald-500" :
    "text-primary"
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center text-left">
            <Dices className="mr-2 h-5 w-5 text-primary" />
            {dialogTitle}
          </DialogTitle>
          {!isDamageRoll && (
            <DialogDescription className="text-left">
              {UI_STRINGS.rollDialogDescriptionFormat?.replace("{rollType}", rollType) || `Performing a ${rollType}.`}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-3 py-3 max-h-[60vh] overflow-y-auto pr-2">
          {calculationBreakdown.length > 0 && (
            <div className="space-y-1">
              <h4 className={cn(sectionHeadingClass, "mb-1")}>{UI_STRINGS.rollDialogCalculationBreakdownTitle || "Calculation Breakdown"}</h4>
                {calculationBreakdown.map((item, index) => (
                  <div key={`breakdown-${index}`} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    {item.isRawValue ? (
                      <span className={cn("font-bold text-foreground", item.isBold && "font-bold")}>
                        {item.value}
                      </span>
                    ) : (
                      <span className={cn("font-semibold text-foreground", item.isBold && "font-bold")}>
                        {renderModifierValue(item.value as number | string)}
                      </span>
                    )}
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">
                    {totalBonusLabel}
                  </span>
                  <span className="font-bold text-accent">
                    {renderModifierValue(baseModifier)}
                  </span>
                </div>
              </div>
          )}

          {diceResult !== null && (
            <div className={resultCardBackground}>
              {isDamageRoll ? (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span>
                      {(UI_STRINGS.rollDialogDamageWeaponDiceRolledLabel || "Weapon Dice ({diceString}) Rolled {diceSum}")
                          .replace("{diceString}", actualWeaponDicePart || 'N/A')
                          .replace("{diceSum}", String(diceResult))
                      }
                    </span>
                    <span className="font-bold text-lg text-primary">{diceResult}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>{(UI_STRINGS.rollDialogDamageOtherBonusesLabel || "Other Bonuses")}</span>
                    <span className="font-bold text-lg text-primary">{renderModifierValue(baseModifier)}</span>
                  </div>
                  <Separator className="my-1 bg-border/50"/>
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-semibold">{UI_STRINGS.rollDialogFinalDamageStringLabel || "Total Damage"}</span>
                    <span className="font-bold text-primary">{finalResult}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span>{UI_STRINGS.rollDialogDiceRollLabel || "Dice Roll (1d20)"}</span>
                    <span className={diceResultColor}>{diceResult}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>{UI_STRINGS.rollDialogTotalBonusLabel || "Total Bonus"}</span>
                    <span className="font-bold text-lg text-primary">{renderModifierValue(baseModifier)}</span>
                  </div>
                  <Separator className="my-1 bg-border/50"/>
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-semibold">{UI_STRINGS.rollDialogFinalResultLabel || "Final Result"}</span>
                    <span className="font-bold text-primary">{finalResult}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button onClick={handleRollOrConfirm} disabled={isRolling} className="w-full sm:w-auto">
            {isRolling ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Dices className="mr-2 h-4 w-4" />
            )}
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

