
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
import { Badge } from '@/components/ui/badge'; // Added import

export interface RollDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dialogTitle: string;
  rollType: string;
  baseModifier: number;
  calculationBreakdown: GenericBreakdownItem[];
  weaponDamageDice?: string;
  onRoll: (diceResult: number, totalBonus: number, finalResult: number, weaponDamageDiceString?: string) => void;
  rerollTwentiesForChecks?: boolean;
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
  rerollTwentiesForChecks = false,
}: RollDialogProps) {
  const { translations, isLoading: translationsLoading } = useI18n();
  const [initialD20Roll, setInitialD20Roll] = React.useState<number | null>(null);
  const [bonusRolls, setBonusRolls] = React.useState<number[]>([]);
  const [totalDiceValue, setTotalDiceValue] = React.useState<number | null>(null);
  const [finalResult, setFinalResult] = React.useState<number | null>(null);
  const [isRolling, setIsRolling] = React.useState(false);

  const isDamageRoll = rollType.toLowerCase().includes('damage');
  const isAttackRoll = rollType.toLowerCase().includes('attack');
  const isCheckRoll = !isDamageRoll && !isAttackRoll;


  React.useEffect(() => {
    if (isOpen) {
      setInitialD20Roll(null);
      setBonusRolls([]);
      setTotalDiceValue(null);
      setFinalResult(null);
    }
  }, [isOpen]);

  const handleRollOrConfirm = () => {
    setIsRolling(true);
    setTimeout(() => {
      if (isDamageRoll && weaponDamageDice) {
        const weaponDiceRollResult = parseAndRollDice(weaponDamageDice);
        const totalDamage = weaponDiceRollResult + baseModifier;
        setInitialD20Roll(null); 
        setBonusRolls([]);
        setTotalDiceValue(weaponDiceRollResult);
        setFinalResult(totalDamage);
        onRoll(weaponDiceRollResult, baseModifier, totalDamage, weaponDamageDice);
      } else { 
        const firstRoll = Math.floor(Math.random() * 20) + 1;
        setInitialD20Roll(firstRoll);

        let currentTotalDiceValue = firstRoll;
        const currentBonusRolls: number[] = [];

        if (isCheckRoll && rerollTwentiesForChecks && firstRoll === 20) {
          let latestBonusRoll = 20;
          let safetyBreak = 0; // To prevent infinite loops in extreme cases
          while (latestBonusRoll === 20 && safetyBreak < 10) { // Max 10 bonus rolls
            latestBonusRoll = Math.floor(Math.random() * 20) + 1;
            currentBonusRolls.push(latestBonusRoll);
            currentTotalDiceValue += latestBonusRoll;
            safetyBreak++;
          }
        }
        setBonusRolls(currentBonusRolls);
        setTotalDiceValue(currentTotalDiceValue);
        const calculatedFinalResult = currentTotalDiceValue + baseModifier;
        setFinalResult(calculatedFinalResult);
        onRoll(currentTotalDiceValue, baseModifier, calculatedFinalResult);
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

  const isCritFailure = !isDamageRoll && initialD20Roll === 1;
  const isInitialRollNat20 = !isDamageRoll && initialD20Roll === 20;


  const resultCardBackground = cn(
    "p-3 border rounded-md space-y-1",
    isCritFailure ? "bg-destructive/20 border-destructive/50" :
    isInitialRollNat20 ? "bg-emerald-600/20 border-emerald-600/50" :
    "bg-card border-border"
  );

  const diceResultColor = cn(
    "font-bold text-lg",
    isCritFailure ? "text-destructive" :
    isInitialRollNat20 ? "text-emerald-500" :
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
              {UI_STRINGS.rollDialogDescriptionFormat?.replace("{rollType}", rollType) || `Performing a ${rollType}`}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-3 py-3 max-h-[60vh] overflow-y-auto pr-2">
          {calculationBreakdown.length > 0 && (
            <div className="space-y-1">
              <h4 className={cn(sectionHeadingClass, "mb-1")}>{UI_STRINGS.rollDialogCalculationBreakdownTitle}</h4>
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
                    {isDamageRoll ? (UI_STRINGS.rollDialogTotalNumericBonusLabel) : (UI_STRINGS.rollDialogTotalBonusLabel)}
                  </span>
                  <span className="font-bold text-accent">
                    {renderModifierValue(baseModifier)}
                  </span>
                </div>
              </div>
          )}

          {totalDiceValue !== null && finalResult !== null && (
            <div className={resultCardBackground}>
              {isDamageRoll ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">
                      {(UI_STRINGS.rollDialogDamageWeaponDiceRolledLabel || "Weapon Dice ({diceString}) Rolled {diceSum}")
                          .replace("{diceString}", actualWeaponDicePart || 'N/A')
                          .replace("{diceSum}", String(totalDiceValue))}
                    </span>
                    <span className="font-bold text-lg text-primary">{totalDiceValue}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{UI_STRINGS.rollDialogDamageOtherBonusesLabel}</span>
                    <span className="font-bold text-primary">{renderModifierValue(baseModifier)}</span>
                  </div>
                  <Separator className="my-1 bg-border/50"/>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">{UI_STRINGS.rollDialogFinalDamageStringLabel}</span>
                    <span className="font-bold text-lg text-primary">{finalResult}</span>
                  </div>
                </>
              ) : (
                <>
                  {initialD20Roll !== null && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-sm text-muted-foreground">{UI_STRINGS.rollDialogDiceRollLabel}</span>
                        <Badge variant="outline" className="text-sm font-normal ml-1.5 px-1.5 py-0.5">1d20</Badge>
                      </div>
                      <span className={diceResultColor}>{initialD20Roll}</span>
                    </div>
                  )}
                  {bonusRolls.length > 0 && (
                     <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{UI_STRINGS.rollDialogBonusDiceRollLabel}</span>
                      <span className="font-bold text-lg text-primary">{bonusRolls.join(', ')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{UI_STRINGS.rollDialogTotalBonusLabel}</span>
                    <span className="font-bold text-primary">{renderModifierValue(baseModifier)}</span>
                  </div>
                  <Separator className="my-1 bg-border/50"/>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">{UI_STRINGS.rollDialogFinalResultLabel}</span>
                    {isCritFailure ? (
                      <span className="font-bold text-lg text-destructive">{UI_STRINGS.rollDialogCritFailureLabel || "Critical Failure!"}</span>
                    ) : (
                      <span className="font-bold text-lg text-primary">{finalResult}</span>
                    )}
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

