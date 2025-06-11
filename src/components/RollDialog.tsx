
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
  weaponDamageDice?: string; // e.g., "1d8", "2d6", "1d4+1" - only for damage rolls
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
            <div>
              <h4 className={cn(sectionHeadingClass, "mb-1")}>{UI_STRINGS.rollDialogCalculationBreakdownTitle || "Calculation Breakdown:"}</h4>
              <div className="space-y-1 text-sm"> {/* Removed card-like styling */}
                {calculationBreakdown.map((item, index) => (
                  <div key={`breakdown-${index}`} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}:</span>
                    <span className={cn("font-semibold text-foreground", item.isBold && "font-bold")}>
                      {typeof item.value === 'number' || !isNaN(Number(item.value)) ? renderModifierValue(item.value) : item.value}
                    </span>
                  </div>
                ))}
                <Separator className="my-2" /> {/* Separator after items */}
                <div className="flex justify-between text-lg"> {/* Total line */}
                  <span className="font-semibold">
                    {isDamageRoll ? (UI_STRINGS.rollDialogTotalNumericBonusLabel || "Total Numeric Bonus") : (UI_STRINGS.rollDialogTotalBonusLabel || "Total Bonus")}:
                  </span>
                  <span className="font-bold text-accent">
                    {renderModifierValue(baseModifier)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {diceResult !== null && (
            <div className="mt-3 p-3 border rounded-md bg-accent/10 text-center space-y-1">
              {isDamageRoll ? (
                <>
                  <p className="text-sm">
                    {(UI_STRINGS.rollDialogDamageWeaponDiceRolledLabel || "Weapon Dice ({diceString}): Rolled {diceSum}")
                        .replace("{diceString}", actualWeaponDicePart || 'N/A')
                        .replace("{diceSum}", String(diceResult))
                    }
                  </p>
                  <p className="text-sm">
                    {(UI_STRINGS.rollDialogDamageOtherBonusesLabel || "Other Bonuses:")} <span className="font-bold text-lg text-primary">{renderModifierValue(baseModifier)}</span>
                  </p>
                  <Separator className="my-1 bg-accent/30"/>
                  <p className="text-lg font-semibold">
                    {UI_STRINGS.rollDialogFinalDamageStringLabel || "Total Damage:"} <span className="font-bold text-lg text-primary">{finalResult}</span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm">
                    {UI_STRINGS.rollDialogDiceRollLabel || "Dice Roll (1d20):"} <span className="font-bold text-lg text-primary">{diceResult}</span>
                  </p>
                  <p className="text-sm">
                    {UI_STRINGS.rollDialogTotalBonusLabel || "Total Bonus:"} <span className="font-bold text-lg text-primary">{renderModifierValue(baseModifier)}</span>
                  </p>
                  <Separator className="my-1 bg-accent/30"/>
                  <p className="text-lg font-semibold">
                    {UI_STRINGS.rollDialogFinalResultLabel || "Final Result:"} <span className="font-bold text-lg text-primary">{finalResult}</span>
                  </p>
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

