
'use client';

import *as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
import { parseAndRollDice, SAVING_THROW_ABILITIES } from '@/lib/dnd-utils';
import { Badge } from '@/components/ui/badge';

export interface RollDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dialogTitle: string;
  rollType: string;
  baseModifier: number; // Static bonuses
  calculationBreakdown: GenericBreakdownItem[];
  weaponDamageDiceString?: string;
  weaponCriticalMultiplier?: number;
  extraDamageDice?: string[];
  onRoll?: (diceResult: number, totalBonus: number, finalResult: number, weaponDamageDiceString?: string) => void;
  rerollTwentiesForChecks?: boolean;
}

export function RollDialog({
  isOpen,
  onOpenChange,
  dialogTitle,
  rollType,
  baseModifier,
  calculationBreakdown,
  weaponDamageDiceString,
  weaponCriticalMultiplier,
  extraDamageDice,
  onRoll,
  rerollTwentiesForChecks = false,
}: RollDialogProps) {
  const { translations, isLoading: translationsLoading } = useI18n();
  const [initialD20Roll, setInitialD20Roll] = React.useState<number | null>(null);
  const [bonusRolls, setBonusRolls] = React.useState<number[]>([]);
  const [totalDiceValue, setTotalDiceValue] = React.useState<number | null>(null); // For damage, this will be weapon dice + extra dice
  const [finalResult, setFinalResult] = React.useState<number | null>(null);
  const [isRolling, setIsRolling] = React.useState(false);
  const [isCritical, setIsCritical] = React.useState(false);
  
  // For displaying damage roll steps
  const [rolledWeaponDiceDetails, setRolledWeaponDiceDetails] = React.useState<string | null>(null);
  const [baseDamagePlusModDetails, setBaseDamagePlusModDetails] = React.useState<string | null>(null);
  const [critMultiplierAppliedDetails, setCritMultiplierAppliedDetails] = React.useState<string | null>(null);
  const [rolledExtraDiceDetails, setRolledExtraDiceDetails] = React.useState<string | null>(null);


  const isDamageRoll = rollType.toLowerCase().includes('damage');
  const isAttackRoll = rollType.toLowerCase().includes('attack');
  const isCheckRoll = !isDamageRoll && !isAttackRoll && !rollType.startsWith('grapple_check') && !rollType.startsWith('initiative_check');

  const canBeCritical = React.useMemo(() => {
      const wpnDmgStrValid = !!weaponDamageDiceString && weaponDamageDiceString.trim() !== "" && weaponDamageDiceString !== "0" && weaponDamageDiceString.includes('d');
      const critMultValid = !!weaponCriticalMultiplier && weaponCriticalMultiplier > 1;
      return isDamageRoll && wpnDmgStrValid && critMultValid;
  }, [isDamageRoll, weaponDamageDiceString, weaponCriticalMultiplier]);


  React.useEffect(() => {
    if (isOpen) {
      setInitialD20Roll(null);
      setBonusRolls([]);
      setTotalDiceValue(null);
      setFinalResult(null);
      setIsCritical(false);
      setRolledWeaponDiceDetails(null);
      setBaseDamagePlusModDetails(null);
      setCritMultiplierAppliedDetails(null);
      setRolledExtraDiceDetails(null);
    }
  }, [isOpen]);


  const handleRollOrConfirm = () => {
    setIsRolling(true);
    setRolledWeaponDiceDetails(null);
    setBaseDamagePlusModDetails(null);
    setCritMultiplierAppliedDetails(null);
    setRolledExtraDiceDetails(null);
    
    if (isDamageRoll && translations) {
      const { result: weaponDiceRollResult } = parseAndRollDice(weaponDamageDiceString || '');
      setRolledWeaponDiceDetails(`${weaponDamageDiceString} (${weaponDiceRollResult})`);

      const damageWithBaseMod = weaponDiceRollResult + baseModifier;
      setBaseDamagePlusModDetails(`(${weaponDiceRollResult} + ${baseModifier}) = ${damageWithBaseMod}`);

      let critAppliedDamage = damageWithBaseMod;
      if (isCritical && weaponCriticalMultiplier && weaponCriticalMultiplier > 1) {
        critAppliedDamage = damageWithBaseMod * weaponCriticalMultiplier;
        setCritMultiplierAppliedDetails(`${damageWithBaseMod} x${weaponCriticalMultiplier} = ${critAppliedDamage}`);
      } else {
        setCritMultiplierAppliedDetails(null); // Clear if not critical
      }
      
      let extraDiceRollTotal = 0;
      const extraDiceBreakdownParts: string[] = [];
      if (extraDamageDice && extraDamageDice.length > 0) {
        extraDamageDice.forEach((diceStr) => {
          if (diceStr && diceStr.trim() !== "" && diceStr !== "0") {
            const { result: roll } = parseAndRollDice(diceStr);
            extraDiceRollTotal += roll;
            extraDiceBreakdownParts.push(`${diceStr} (${roll})`);
          }
        });
        if (extraDiceBreakdownParts.length > 0) {
          setRolledExtraDiceDetails(`${extraDiceBreakdownParts.join(' + ')} = ${extraDiceRollTotal}`);
        }
      }
      
      const totalFinalDamage = critAppliedDamage + extraDiceRollTotal;

      setInitialD20Roll(null); // Not used for damage
      setBonusRolls([]);      // Not used for damage
      setTotalDiceValue(weaponDiceRollResult + extraDiceRollTotal); // Sum of raw dice
      setFinalResult(totalFinalDamage);
      if (onRoll) onRoll(weaponDiceRollResult + extraDiceRollTotal, baseModifier, totalFinalDamage, weaponDamageDiceString);

    } else { 
      // Non-damage roll (Attack, Check, Save)
      const { result: firstRollResult } = parseAndRollDice("1d20");
      const firstRoll = firstRollResult;
      setInitialD20Roll(firstRoll);

      let currentTotalD20Value = firstRoll;
      const currentBonusRolls: number[] = [];
      const isRelevantCheckRoll = isCheckRoll || rollType.startsWith('grapple_check') || rollType.startsWith('initiative_check');

      if (isRelevantCheckRoll && rerollTwentiesForChecks && firstRoll === 20) {
        let latestBonusRoll = 20;
        let safetyBreak = 0; // Prevent infinite loop
        while (latestBonusRoll === 20 && safetyBreak < 10) { // Limit to 10 rerolls
          const {result: bonusRollVal } = parseAndRollDice("1d20");
          latestBonusRoll = bonusRollVal;
          currentBonusRolls.push(latestBonusRoll);
          currentTotalD20Value += latestBonusRoll;
          safetyBreak++;
        }
      }
      setBonusRolls(currentBonusRolls);
      setTotalDiceValue(currentTotalD20Value);
      const calculatedFinalResult = currentTotalD20Value + baseModifier;
      setFinalResult(calculatedFinalResult);
      if (onRoll) onRoll(currentTotalD20Value, baseModifier, calculatedFinalResult, weaponDamageDiceString); 
    }
    
    setIsRolling(false);
  };

  if (translationsLoading || !translations) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center text-left">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
              {translations?.UI_STRINGS.loadingText}
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
  const buttonTextKey = isDamageRoll ? "rollDialogConfirmDamageButton" : "rollDialogRollButton";
  const buttonText = UI_STRINGS[buttonTextKey];
  
  const isInitialRollCritFailure = !isDamageRoll && initialD20Roll === 1;
  const isInitialRollNat20 = !isDamageRoll && initialD20Roll === 20;

  const resultCardBackground = cn(
    "p-3 border rounded-md", 
    isInitialRollCritFailure ? "bg-destructive/20 border-destructive/50" :
    (isInitialRollNat20 && !isDamageRoll) ? "bg-emerald-600/20 border-emerald-600/50" : 
    "bg-card border-border"
  );

  const diceResultColor = cn(
    "font-bold text-lg",
    isInitialRollCritFailure ? "text-destructive" :
    (isInitialRollNat20 && !isDamageRoll) ? "text-emerald-500" : 
    "text-primary"
  );

  const displayCriticalCheckbox = canBeCritical;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center text-left">
            <Dices className="mr-2 h-5 w-5 text-primary" />
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-3 max-h-[60vh] overflow-y-auto pr-2">
          {calculationBreakdown && calculationBreakdown.length > 0 && (
            <div>
              <h3 className={cn(sectionHeadingClass, "mb-2")}>{UI_STRINGS.rollDialogCalculationBreakdownTitle}</h3>
              <div>
                {calculationBreakdown.map((item, index) => {
                  if (item.label === (UI_STRINGS.infoDialogTotalLabel) && item.isBold) {
                    return null; 
                  }
                  if (isDamageRoll && item.label === (UI_STRINGS.rollDialogTotalNumericBonusLabel) && item.isBold) {
                    return null; 
                  }


                  let labelText = item.label;
                  let abilityAbbr: string | undefined;
                  
                  if (typeof item.label === 'string') {
                    const labelMatch = item.label.match(/^(.*)\s+\(([^)]+)\)$/);
                    if (labelMatch) {
                        labelText = labelMatch[1];
                        const potentialAbbr = labelMatch[2].toUpperCase();
                        if (translations.ABILITY_LABELS && translations.ABILITY_LABELS.some(al => al.abbr === potentialAbbr)) {
                            abilityAbbr = potentialAbbr;
                        }
                    } else if (item.label === (UI_STRINGS.rollDialogAbilityModifierLabel)) {
                        const matchFromTitle = dialogTitle.match(/\(([^)]+)\)/);
                        const matchFromRollTypeAbility = rollType.match(/ability_check_(\w+)/);
                        const matchFromRollTypeSave = rollType.match(/saving_throw_(\w+)/);
                        const matchFromRollTypeSkill = rollType.match(/skill_check_([a-zA-Z-]+)_(\w+)/); 

                        let abilityKey: string | undefined;

                        if (matchFromRollTypeAbility) abilityKey = matchFromRollTypeAbility[1];
                        else if (matchFromRollTypeSave) {
                            const saveType = matchFromRollTypeSave[1] as keyof typeof SAVING_THROW_ABILITIES;
                            abilityKey = SAVING_THROW_ABILITIES[saveType];
                        } else if (matchFromRollTypeSkill && translations.SKILL_DEFINITIONS) {
                            const skillIdParts = rollType.split('_');
                            const skillId = skillIdParts.length > 2 ? skillIdParts.slice(2).join('_') : skillIdParts[1]; 
                            const skillDef = translations.SKILL_DEFINITIONS.find(sd => sd.id === skillId);
                            if (skillDef) abilityKey = skillDef.keyAbility as string;
                        } else if (matchFromTitle && translations.ABILITY_LABELS) {
                            const extractedAbility = matchFromTitle[1];
                            const foundLabel = translations.ABILITY_LABELS.find(al => al.abbr === extractedAbility.toUpperCase() || al.label === extractedAbility);
                            if (foundLabel) abilityKey = foundLabel.id;
                        }

                        if(abilityKey && translations.ABILITY_LABELS){
                            abilityAbbr = translations.ABILITY_LABELS.find(al => al.id === abilityKey)?.abbr;
                        }
                         labelText = (UI_STRINGS.rollDialogAbilityModifierLabel).replace("{abilityAbbr}", abilityAbbr || "MOD");
                    }
                  }

                  return (
                    <div key={`breakdown-${index}`} className="flex justify-between text-sm">
                      <span className="text-foreground inline-flex items-baseline">
                        {labelText}
                        {abilityAbbr && item.label !== (UI_STRINGS.rollDialogAbilityModifierLabel).replace("{abilityAbbr}", abilityAbbr || "MOD") && <>{'\u00A0'}<Badge variant="outline" className="font-normal">{abilityAbbr}</Badge></>}
                      </span>
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
                  );
                })}
                <Separator className="mt-2 mb-1" />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">
                    {isDamageRoll 
                      ? (UI_STRINGS.rollDialogTotalNumericBonusLabel) 
                      : (UI_STRINGS.rollDialogTotalBonusLabel)}
                  </span>
                  <span className="font-bold text-accent">
                    {renderModifierValue(baseModifier)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {displayCriticalCheckbox && (
            <div className="flex items-center space-x-2 mt-2">
              <Checkbox
                id="critical-hit-checkbox"
                checked={isCritical}
                onCheckedChange={(checked) => setIsCritical(!!checked)}
              />
              <Label htmlFor="critical-hit-checkbox" className="font-medium">
                {UI_STRINGS.rollDialogCriticalHitLabel} ({weaponCriticalMultiplier}x {UI_STRINGS.rollDialogDamageMultiplierLabel})
              </Label>
            </div>
          )}

          {finalResult !== null && (
            <div className={resultCardBackground}>
              {isDamageRoll ? (
                <>
                  {isCritical && weaponCriticalMultiplier && weaponCriticalMultiplier > 1 && weaponDamageDiceString && weaponDamageDiceString.trim() !== "" && weaponDamageDiceString !== "0" && (
                    <div className="text-center mb-1">
                      <Badge variant="destructive" className="text-sm px-2 py-0.5">{UI_STRINGS.rollDialogCriticalHitAppliedLabel}</Badge>
                    </div>
                  )}
                  {rolledWeaponDiceDetails && (
                    <div className="flex justify-between items-center text-sm mb-0.5">
                        <span className="text-foreground">{UI_STRINGS.rollDialogWeaponDamageDiceLabel}</span>
                        <span className="font-bold text-primary">{rolledWeaponDiceDetails}</span>
                    </div>
                  )}
                  {baseDamagePlusModDetails && (
                     <div className="flex justify-between items-center text-sm mb-0.5">
                        <span className="text-foreground">{UI_STRINGS.rollDialogBaseDamagePlusModLabel}</span>
                        <span className="font-bold text-primary">{baseDamagePlusModDetails}</span>
                    </div>
                  )}
                  {critMultiplierAppliedDetails && (
                     <div className="flex justify-between items-center text-sm mb-0.5">
                        <span className="text-foreground">{UI_STRINGS.rollDialogCritMultiplierAppliedLabel}</span>
                        <span className="font-bold text-primary">{critMultiplierAppliedDetails}</span>
                    </div>
                  )}
                   {rolledExtraDiceDetails && (
                    <div className="flex justify-between items-center text-sm mb-0.5">
                        <span className="text-foreground">{UI_STRINGS.rollDialogExtraDamageDiceLabel}</span>
                        <span className="font-bold text-primary">{rolledExtraDiceDetails}</span>
                    </div>
                  )}
                  <Separator className="my-1 bg-border/50"/>
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="text-lg font-semibold">{UI_STRINGS.rollDialogFinalDamageStringLabel}</span>
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
                      <span className={diceResultColor}>{initialD20Roll}</span>
                    </div>
                  )}
                  {bonusRolls.length > 0 && (
                     <div className="flex justify-between items-center mb-0.5">
                      <span className="text-sm text-foreground">{UI_STRINGS.rollDialogBonusDiceRollLabel}</span>
                      <span className="font-bold text-lg text-primary">{bonusRolls.join(', ')}</span>
                    </div>
                  )}
                   {baseModifier !== 0 && !isDamageRoll && (
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
                    ) : (!isDamageRoll && finalResult !== null && finalResult < 0) ? (
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
