
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dices, Loader2 } from 'lucide-react';
import type { GenericBreakdownItem } from '@/types/character-core';
import { useI18n } from '@/context/I18nProvider';
import { Separator } from '@/components/ui/separator';
import { renderModifierValue, sectionHeadingClass } from '@/components/info-dialog-content/dialog-utils';
import { cn } from '@/lib/utils';
import { parseAndRollDice } from '@/lib/dnd-utils';
import { Badge } from '@/components/ui/badge';

export interface RollDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dialogTitle: string;
  dialogSubtitle?: string;
  rollType: string;
  baseModifier: number;
  calculationBreakdown: GenericBreakdownItem[];
  weaponDamageDiceString?: string;
  weaponCriticalMultiplier?: number;
  onRoll?: (diceResult: number, totalBonus: number, finalResult: number, weaponDamageDiceString?: string) => void;
  rerollTwentiesForChecks?: boolean;
}

export function RollDialog({
  isOpen,
  onOpenChange,
  dialogTitle,
  dialogSubtitle,
  rollType,
  baseModifier,
  calculationBreakdown,
  weaponDamageDiceString,
  weaponCriticalMultiplier,
  onRoll,
  rerollTwentiesForChecks = false,
}: RollDialogProps) {
  const { translations, isLoading: translationsLoading } = useI18n();

  const [initialD20Roll, setInitialD20Roll] = React.useState<number | null>(null);
  const [bonusD20Rolls, setBonusD20Rolls] = React.useState<number[]>([]);
  
  const [baseDamageRoll, setBaseDamageRoll] = React.useState<number | null>(null);
  const [criticalHitBonusDamage, setCriticalHitBonusDamage] = React.useState<number | null>(null);
  const [bonusDiceRollsResult, setBonusDiceRollsResult] = React.useState<number | null>(null);
  
  const [finalResult, setFinalResult] = React.useState<number | null>(null);
  const [isRolling, setIsRolling] = React.useState(false);
  const [isCritical, setIsCritical] = React.useState(false);

  const isDamageRoll = rollType.toLowerCase().includes('damage');
  const isAttackRoll = rollType.toLowerCase().includes('attack');

  React.useEffect(() => {
    if (isOpen) {
      setInitialD20Roll(null);
      setBonusD20Rolls([]);
      setBaseDamageRoll(null);
      setCriticalHitBonusDamage(null);
      setBonusDiceRollsResult(null);
      setFinalResult(null);
      setIsCritical(false);
    }
  }, [isOpen]);

  const { bonusDiceStrings, staticBonus, baseDamageDiceStringForRoll } = React.useMemo(() => {
    if (!isDamageRoll || !calculationBreakdown) return { bonusDiceStrings: [], staticBonus: 0, baseDamageDiceStringForRoll: '' };
    
    const baseDiceItems = calculationBreakdown.filter(item => item.isRawValue);
    const staticBonusItems = calculationBreakdown.filter(item => !item.isRawValue);
    
    const baseDamageStr = weaponDamageDiceString || (baseDiceItems.find(i => i.label.toLowerCase().includes('base'))?.value as string) || '';
    const bonusDiceStrs = baseDiceItems.filter(i => i.label.toLowerCase().includes('base') === false).map(i => i.value as string);
    const staticBns = staticBonusItems.reduce((acc, item) => acc + Number(item.value), 0);
    
    return { bonusDiceStrings: bonusDiceStrs, staticBonus: staticBns, baseDamageDiceStringForRoll: baseDamageStr };
  }, [calculationBreakdown, isDamageRoll, weaponDamageDiceString]);


  const handleRollOrConfirm = () => {
    setIsRolling(true);
    setTimeout(() => { // Simulate roll delay
      if (isDamageRoll) {
        const { result: baseRoll } = parseAndRollDice(baseDamageDiceStringForRoll);
        setBaseDamageRoll(baseRoll);
        
        let totalBonusDiceResult = 0;
        for (const diceStr of bonusDiceStrings) {
          totalBonusDiceResult += parseAndRollDice(diceStr).result;
        }
        setBonusDiceRollsResult(totalBonusDiceResult);
        
        let critBonusDamage = 0;
        const multiplier = weaponCriticalMultiplier || 2;
        if (isCritical && multiplier > 1) {
          for (let i = 0; i < multiplier - 1; i++) {
            critBonusDamage += parseAndRollDice(baseDamageDiceStringForRoll).result;
          }
          critBonusDamage += staticBonus * (multiplier - 1);
        }
        setCriticalHitBonusDamage(critBonusDamage);
        
        const totalFinalDamage = baseRoll + staticBonus + critBonusDamage + totalBonusDiceResult;
        setFinalResult(totalFinalDamage);

      } else { // Attack, Save, Check rolls
        const { result: firstRollResult } = parseAndRollDice("1d20");
        setInitialD20Roll(firstRollResult);

        let currentTotalD20Value = firstRollResult;
        const currentBonusRolls: number[] = [];

        if (rerollTwentiesForChecks && firstRollResult === 20) {
          let latestBonusRoll = 20;
          let safetyBreak = 0;
          while (latestBonusRoll === 20 && safetyBreak < 10) {
            const { result: bonusRollVal } = parseAndRollDice("1d20");
            latestBonusRoll = bonusRollVal;
            currentBonusRolls.push(bonusRollVal);
            currentTotalD20Value += latestBonusRoll;
            safetyBreak++;
          }
        }
        setBonusD20Rolls(currentBonusRolls);
        const calculatedFinalResult = currentTotalD20Value + baseModifier;
        setFinalResult(calculatedFinalResult);
      }
      setIsRolling(false);
    }, 300);
  };

  const totalDamageFormula = React.useMemo(() => {
    if (!isDamageRoll || !calculationBreakdown) return "";
    const diceParts = calculationBreakdown.filter(i => i.isRawValue).map(i => i.value as string);
    const bonus = calculationBreakdown.filter(i => !i.isRawValue).reduce((acc, item) => acc + Number(item.value), 0);
    
    const parts = [...diceParts];
    if (bonus !== 0) {
      parts.push(`${bonus > 0 ? '+' : ''}${bonus}`);
    }
    return parts.join(' + ').replace(/\+ -/g, '- ');
  }, [isDamageRoll, calculationBreakdown]);


  if (translationsLoading || !translations) { return null; }
  const UI_STRINGS = translations.UI_STRINGS;
  
  const buttonText = isDamageRoll
    ? UI_STRINGS.rollDialogRollDamageButton.replace('{dice}', baseDamageDiceStringForRoll || 'Dice')
    : UI_STRINGS.rollDialogRollButton;
  
  const isInitialRollCritFailure = !isDamageRoll && initialD20Roll === 1;
  const isInitialRollNat20 = !isDamageRoll && initialD20Roll === 20;

  const resultCardBackground = cn(
    "p-3 border rounded-md", 
    isInitialRollCritFailure ? "bg-destructive/20 border-destructive/50" :
    (isInitialRollNat20 && !isDamageRoll) ? "bg-emerald-600/20 border-emerald-600/50" : 
    "bg-card border-border"
  );
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
           <div className="flex items-start text-left">
            <Dices className="mr-2 h-5 w-5 shrink-0 text-primary" />
            <div className="flex flex-col gap-1.5">
              <DialogTitle className="font-serif">{dialogTitle}</DialogTitle>
              {dialogSubtitle && <DialogDescription>{dialogSubtitle}</DialogDescription>}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-3 max-h-[60vh] overflow-y-auto pr-2">
          <div>
            <h3 className={cn(sectionHeadingClass, "mb-2")}>{UI_STRINGS.rollDialogCalculationBreakdownTitle}</h3>
            <div>
              {calculationBreakdown.map((item, index) => {
                 let labelText = item.label;
                 let abilityAbbr: string | undefined;
                 const labelMatch = typeof item.label === 'string' ? item.label.match(/^(.*)\s+\(([^)]+)\)$/) : null;
                 if (labelMatch) {
                    labelText = labelMatch[1];
                    abilityAbbr = labelMatch[2].toUpperCase();
                 }
                return (
                  <div key={`breakdown-${index}`} className="flex justify-between text-sm">
                    <span className="text-foreground inline-flex items-baseline">
                      {labelText}
                      {abilityAbbr && <>{'\u00A0'}<Badge variant="outline" className="font-normal">{abilityAbbr}</Badge></>}
                    </span>
                    {item.isRawValue ? (
                      <span className={cn("font-bold text-foreground", item.isBold && "font-bold")}>{item.value}</span>
                    ) : (
                      <span className={cn("font-semibold text-foreground", item.isBold && "font-bold")}>{renderModifierValue(item.value as number | string)}</span>
                    )}
                  </div>
                );
              })}
              <Separator className="mt-2 mb-1" />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">
                  {isDamageRoll ? UI_STRINGS.rollDialogTotalDamageFormulaLabel : UI_STRINGS.rollDialogTotalBonusLabel}
                </span>
                <span className="font-bold text-accent">
                  {isDamageRoll ? totalDamageFormula : renderModifierValue(baseModifier)}
                </span>
              </div>
            </div>
          </div>

          {isDamageRoll && (
            <div className="flex items-center space-x-2 mt-2">
              <Checkbox
                id="critical-hit-checkbox"
                checked={isCritical}
                onCheckedChange={(checked) => setIsCritical(!!checked)}
              />
              <Label htmlFor="critical-hit-checkbox" className="font-medium">
                {UI_STRINGS.rollDialogCriticalHitLabel} ({weaponCriticalMultiplier ? `x${weaponCriticalMultiplier}` : 'x2'})
              </Label>
            </div>
          )}

          {finalResult !== null && (
            <div className={resultCardBackground}>
              {isDamageRoll ? (
                <>
                  <div className="flex justify-between items-center text-sm mb-0.5">
                    <span className="text-foreground">{UI_STRINGS.rollDialogBaseDiceResultLabel}</span>
                    <span className="font-bold text-primary">{baseDamageRoll}</span>
                  </div>
                  {criticalHitBonusDamage !== null && criticalHitBonusDamage > 0 && (
                     <div className="flex justify-between items-center text-sm mb-0.5 text-red-500">
                        <span className="font-semibold">{UI_STRINGS.rollDialogCriticalBonusLabel}</span>
                        <span className="font-bold">{renderModifierValue(criticalHitBonusDamage)}</span>
                    </div>
                  )}
                  {bonusDiceRollsResult !== null && bonusDiceRollsResult > 0 && (
                     <div className="flex justify-between items-center text-sm mb-0.5">
                        <span className="text-foreground">{UI_STRINGS.rollDialogBonusDiceResultLabel}</span>
                        <span className="font-bold text-primary">{renderModifierValue(bonusDiceRollsResult)}</span>
                    </div>
                  )}
                   <div className="flex justify-between items-center text-sm mb-0.5">
                      <span className="text-foreground">{UI_STRINGS.rollDialogStaticBonusesTotalLabel}</span>
                      <span className="font-bold text-primary">{renderModifierValue(staticBonus)}</span>
                  </div>
                  <Separator className="my-1 bg-border/50"/>
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="text-lg font-semibold">{UI_STRINGS.rollDialogTotalDamageLabel}</span>
                    <span className="font-bold text-lg text-primary">{finalResult}</span>
                  </div>
                </>
              ) : ( 
                <>
                  {initialD20Roll !== null && (
                    <div className="flex justify-between items-center mb-0.5">
                      <div className="flex items-center">
                        <span className="text-sm text-foreground">{UI_STRINGS.rollDialogDiceRollLabel}{'\u00A0'}</span><Badge variant="outline">1d20</Badge>
                      </div>
                      <span className={cn("font-bold text-lg", isInitialRollCritFailure ? "text-destructive" : isInitialRollNat20 ? "text-emerald-500" : "text-primary")}>{initialD20Roll}</span>
                    </div>
                  )}
                  {bonusD20Rolls.length > 0 && (
                     <div className="flex justify-between items-center mb-0.5">
                      <span className="text-sm text-foreground">{UI_STRINGS.rollDialogBonusDiceRollLabel}</span>
                      <span className="font-bold text-lg text-primary">{bonusD20Rolls.join(', ')}</span>
                    </div>
                  )}
                   {baseModifier !== 0 && (
                    <div className="flex justify-between items-center text-sm mb-0.5">
                      <span className="text-foreground">{UI_STRINGS.rollDialogTotalBonusLabel}</span>
                      <span className="font-bold text-primary">{renderModifierValue(baseModifier)}</span>
                    </div>
                   )}
                  <Separator className="mt-2 mb-1" />
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="text-lg font-semibold">{UI_STRINGS.rollDialogFinalResultLabel}</span>
                    {isInitialRollCritFailure ? (
                      <span className="font-bold text-lg text-destructive">{UI_STRINGS.rollDialogCritFailureLabel}</span>
                    ) : (!isDamageRoll && finalResult < 0) ? (
                      <span className="font-bold text-lg text-destructive">0</span>
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

    