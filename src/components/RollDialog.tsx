
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
  rollType: string; // e.g., "ability_check_strength", "saving_throw_fortitude", "skill_bluff", "damage_roll_melee_longsword"
  baseModifier: number; // Numerical bonus for attack/save/skill, or damage bonus for damage rolls
  calculationBreakdown: GenericBreakdownItem[];
  weaponDamageDice?: string; // e.g., "1d8", "2d6" - only for damage rolls
  onRoll: (diceResult: number, totalBonus: number, finalResult: number, weaponDamageDice?: string) => void; // Added weaponDamageDice
}

export function RollDialog({
  isOpen,
  onOpenChange,
  dialogTitle,
  rollType,
  baseModifier,
  calculationBreakdown,
  weaponDamageDice, // Destructure new prop
  onRoll,
}: RollDialogProps) {
  const { translations, isLoading: translationsLoading } = useI18n();
  const [diceResult, setDiceResult] = React.useState<number | null>(null);
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
    // Simulate a brief roll/confirmation
    setTimeout(() => {
      if (isDamageRoll) {
        // For damage, we don't roll d20. The 'finalResult' is conceptual (dice + bonus).
        // The actual dice roll would be done by the player.
        // We can pass the baseModifier (numerical bonus) and the weaponDamageDice to the onRoll callback.
        // The `diceResult` could represent the dice string itself or be null.
        // For simplicity, let's pass 0 for diceResult in this case, as it's not a d20 roll.
        onRoll(0, baseModifier, baseModifier, weaponDamageDice); // diceResult is 0, finalResult is just the bonus
        setDiceResult(null); // Or could set to weaponDamageDice string for display
        setFinalResult(baseModifier); // Displaying the bonus part
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
  const buttonText = isDamageRoll ? (UI_STRINGS.rollDialogConfirmDamageButton || "Confirm Damage") : (UI_STRINGS.rollDialogRollButton || "Roll 1d20");


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center">
            <Dices className="mr-2 h-5 w-5 text-primary" />
            {dialogTitle}
          </DialogTitle>
          {!isDamageRoll && (
            <DialogDescription>
              {UI_STRINGS.rollDialogDescriptionFormat?.replace("{rollType}", rollType) || `Performing a ${rollType}.`}
            </DialogDescription>
          )}
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
                      {typeof item.value === 'number' || !isNaN(Number(item.value)) ? renderModifierValue(item.value) : item.value}
                    </span>
                  </div>
                ))}
                {!isDamageRoll && <Separator className="my-1" />}
                <div className="flex justify-between font-semibold">
                  <span className="text-muted-foreground">{isDamageRoll ? (UI_STRINGS.rollDialogTotalNumericBonusLabel || "Total Numeric Bonus") : (UI_STRINGS.rollDialogTotalBonusLabel || "Total Bonus")}:</span>
                  <span>{renderModifierValue(baseModifier)}</span>
                </div>
              </div>
            </div>
          )}

          {diceResult !== null && !isDamageRoll && (
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
          {isDamageRoll && finalResult !== null && (
             <div className="mt-3 p-3 border rounded-md bg-accent/10 text-center space-y-1">
               {weaponDamageDice && (
                <p className="text-sm">
                  {UI_STRINGS.attacksPanelBaseWeaponDamageLabel || "Base Weapon Damage:"} <span className="font-bold text-lg text-primary">{weaponDamageDice}</span>
                </p>
               )}
                <p className="text-sm">
                  {UI_STRINGS.rollDialogTotalNumericBonusLabel || "Total Numeric Bonus:"} <span className="font-bold text-lg text-primary">{renderModifierValue(baseModifier)}</span>
                </p>
                <Separator className="my-1 bg-accent/30"/>
                <p className="text-lg font-semibold">
                  {UI_STRINGS.rollDialogFinalDamageStringLabel || "Total Damage:"} <span className="font-bold text-2xl text-primary">{weaponDamageDice}{baseModifier !== 0 ? (baseModifier > 0 ? `+${baseModifier}`: `${baseModifier}`) : ''}</span>
                </p>
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

