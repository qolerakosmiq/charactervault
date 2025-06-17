
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
  weaponDamageDiceString?: string; // e.g., "1d8", "2d6" - dice that ARE multiplied on critical
  weaponCriticalMultiplier?: number; // e.g., 2 for x2, 3 for x3
  extraDamageDice?: string[]; // e.g., ["1d6", "2d4"] - dice that are NOT multiplied on critical (like sneak attack, elemental)
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
  weaponDamageDiceString,
  weaponCriticalMultiplier,
  extraDamageDice,
  onRoll,
  rerollTwentiesForChecks = false,
}: RollDialogProps) {
  const { translations, isLoading: translationsLoading } = useI18n();
  const [initialD20Roll, setInitialD20Roll] = React.useState<number | null>(null);
  const [bonusRolls, setBonusRolls] = React.useState<number[]>([]);
  const [totalDiceValue, setTotalDiceValue] = React.useState<number | null>(null);
  const [finalResult, setFinalResult] = React.useState<number | null>(null);
  const [isRolling, setIsRolling] = React.useState(false);
  const [isCritical, setIsCritical] = React.useState(false);
  const [rolledWeaponDiceDetails, setRolledWeaponDiceDetails] = React.useState<string | null>(null);
  const [rolledExtraDiceDetails, setRolledExtraDiceDetails] = React.useState<string | null>(null);

  // Debugging logs for props and intermediate variables
  if (isOpen) { // Only log when the dialog is intended to be open
    console.log("[RollDialog Props Received]", {
      isOpen,
      dialogTitle,
      rollType,
      baseModifier,
      calculationBreakdown,
      weaponDamageDiceString,
      weaponCriticalMultiplier,
      extraDamageDice,
      rerollTwentiesForChecks,
    });
  }

  const isDamageRoll = rollType.toLowerCase().includes('damage');
  const isAttackRoll = rollType.toLowerCase().includes('attack');
  const isCheckRoll = !isDamageRoll && !isAttackRoll && !rollType.startsWith('grapple_check') && !rollType.startsWith('initiative_check');

  if (isOpen) {
    console.log("[RollDialog Intermediate Vars]", {
      isDamageRoll,
      isAttackRoll,
      isCheckRoll,
      weaponDamageDiceStringExists: !!weaponDamageDiceString,
      weaponDamageDiceStringTrimmed: weaponDamageDiceString ? weaponDamageDiceString.trim() : "N/A",
      weaponDamageDiceStringIsNotZero: weaponDamageDiceString ? weaponDamageDiceString !== "0" : "N/A",
      weaponCriticalMultiplierExists: !!weaponCriticalMultiplier,
      weaponCriticalMultiplierValue: weaponCriticalMultiplier,
      weaponCriticalMultiplierGt1: weaponCriticalMultiplier ? weaponCriticalMultiplier > 1 : false,
    });
  }

  const canBeCritical = isDamageRoll &&
                        !!weaponDamageDiceString &&
                        weaponDamageDiceString.trim() !== "" &&
                        weaponDamageDiceString !== "0" &&
                        weaponCriticalMultiplier &&
                        weaponCriticalMultiplier > 1;

  if (isOpen) {
    console.log("[RollDialog canBeCritical Eval]", {
      "isDamageRoll": isDamageRoll,
      "!!weaponDamageDiceString": !!weaponDamageDiceString,
      "weaponDamageDiceString.trim() !== \"\"": weaponDamageDiceString ? weaponDamageDiceString.trim() !== "" : false,
      "weaponDamageDiceString !== \"0\"": weaponDamageDiceString ? weaponDamageDiceString !== "0" : false,
      "!!weaponCriticalMultiplier": !!weaponCriticalMultiplier,
      "weaponCriticalMultiplier > 1": weaponCriticalMultiplier ? weaponCriticalMultiplier > 1 : false,
      "FINAL canBeCritical": canBeCritical,
    });
  }


  React.useEffect(() => {
    if (isOpen) {
      setInitialD20Roll(null);
      setBonusRolls([]);
      setTotalDiceValue(null);
      setFinalResult(null);
      setIsCritical(false);
      setRolledWeaponDiceDetails(null);
      setRolledExtraDiceDetails(null);
    }
  }, [isOpen]);

  const handleRollOrConfirm = () => {
    setIsRolling(true);
    setRolledWeaponDiceDetails(null);
    setRolledExtraDiceDetails(null);
    const allDebugLogs: string[] = [];

    // No setTimeout here for direct execution
    if (isDamageRoll && translations) {
      let multipliedWeaponDiceRollResult = 0;
      const weaponDiceRolls: number[] = [];
      let weaponDiceDebugLogs: string[] = [];

      if (weaponDamageDiceString && weaponDamageDiceString.trim() !== "" && weaponDamageDiceString !== "0") {
        const numCritRolls = isCritical && weaponCriticalMultiplier && weaponCriticalMultiplier > 1 ? weaponCriticalMultiplier : 1;
        for (let i = 0; i < numCritRolls; i++) {
          const { result: roll, debugLogs: wdDebug } = parseAndRollDice(weaponDamageDiceString);
          weaponDiceDebugLogs.push(...wdDebug.map(log => `CritRoll ${i+1}/${numCritRolls} for ${weaponDamageDiceString}: ${log}`));
          weaponDiceRolls.push(roll);
          multipliedWeaponDiceRollResult += roll;
        }
        if (weaponDiceRolls.length > 0) {
          setRolledWeaponDiceDetails(`${numCritRolls > 1 ? `${numCritRolls}x ` : ''}${weaponDamageDiceString} (${weaponDiceRolls.join(', ')}) = ${multipliedWeaponDiceRollResult}`);
        }
      }
      allDebugLogs.push(...weaponDiceDebugLogs);

      let extraDiceRollResult = 0;
      const extraDiceRollsBreakdown: string[] = [];
      let extraDiceDebugLogs: string[] = [];
      if (extraDamageDice && extraDamageDice.length > 0) {
        extraDamageDice.forEach((diceStr, idx) => {
          if (diceStr && diceStr.trim() !== "" && diceStr !== "0") {
            const { result: roll, debugLogs: edDebug } = parseAndRollDice(diceStr);
            extraDiceDebugLogs.push(...edDebug.map(log => `ExtraDice ${idx+1} (${diceStr}): ${log}`));
            extraDiceRollResult += roll;
            extraDiceRollsBreakdown.push(`${diceStr} (${roll})`);
          }
        });
        if (extraDiceRollsBreakdown.length > 0) {
          setRolledExtraDiceDetails(`${extraDiceRollsBreakdown.join(' + ')} = ${extraDiceRollResult}`);
        }
      }
      allDebugLogs.push(...extraDiceDebugLogs);
      
      const currentTotalDiceRolled = multipliedWeaponDiceRollResult + extraDiceRollResult;
      const totalDamage = currentTotalDiceRolled + baseModifier;

      setInitialD20Roll(null); 
      setBonusRolls([]);      
      setTotalDiceValue(currentTotalDiceRolled);
      setFinalResult(totalDamage);
      onRoll(currentTotalDiceRolled, baseModifier, totalDamage, weaponDamageDiceString);

    } else { // d20 roll (attack, check, save)
      const { result: firstRollResult, debugLogs: d20Debug } = parseAndRollDice("1d20");
      allDebugLogs.push(...d20Debug.map(log => `d20 Roll: ${log}`));
      const firstRoll = firstRollResult;
      setInitialD20Roll(firstRoll);

      let currentTotalD20Value = firstRoll;
      const currentBonusRolls: number[] = [];
      const isRelevantCheckRoll = isCheckRoll || rollType.startsWith('grapple_check') || rollType.startsWith('initiative_check');

      if (isRelevantCheckRoll && rerollTwentiesForChecks && firstRoll === 20) {
        let latestBonusRoll = 20;
        let safetyBreak = 0;
        while (latestBonusRoll === 20 && safetyBreak < 10) { // Safety break for extreme luck
          const {result: bonusRollVal, debugLogs: bonusD20Debug} = parseAndRollDice("1d20");
          allDebugLogs.push(...bonusD20Debug.map(log => `Exploding d20 Roll #${safetyBreak+1}: ${log}`));
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
      onRoll(currentTotalD20Value, baseModifier, calculatedFinalResult);
    }

    // Log all collected debug messages
    if (allDebugLogs.length > 0) {
      console.log("--- RollDialog Internal Debug Logs ---");
      allDebugLogs.forEach(log => console.log(log));
      console.log("------------------------------------");
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
  const buttonTextKey = isDamageRoll ? "rollDialogConfirmDamageButton" : "rollDialogRollButton";
  const buttonText = UI_STRINGS[buttonTextKey] || (isDamageRoll ? "Confirm Damage" : "Roll 1d20");
  
  const isInitialRollCritFailure = !isDamageRoll && initialD20Roll === 1;
  const isInitialRollNat20 = !isDamageRoll && initialD20Roll === 20;


  const resultCardBackground = cn(
    "p-3 border rounded-md space-y-1",
    isInitialRollCritFailure ? "bg-destructive/20 border-destructive/50" :
    isInitialRollNat20 && bonusRolls.length === 0 ? "bg-emerald-600/20 border-emerald-600/50" :
    "bg-card border-border"
  );

  const diceResultColor = cn(
    "font-bold text-lg",
    isInitialRollCritFailure ? "text-destructive" :
    isInitialRollNat20 && bonusRolls.length === 0 ? "text-emerald-500" :
    "text-primary"
  );

  // This `canBeCritical` is for checkbox visibility, actual critical logic is in handleRollOrConfirm
  const displayCriticalCheckbox = isDamageRoll && !!weaponDamageDiceString && weaponDamageDiceString.trim() !== "" && weaponDamageDiceString !== "0" && weaponCriticalMultiplier && weaponCriticalMultiplier > 1;


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
          {calculationBreakdown.length > 0 && (
            <div>
              <h3 className={cn(sectionHeadingClass, "mb-2")}>{UI_STRINGS.rollDialogCalculationBreakdownTitle || "Calculation Breakdown"}</h3>
              <div>
                {calculationBreakdown.map((item, index) => {
                  if (item.label === (UI_STRINGS.infoDialogTotalLabel || "Total") && item.isBold) {
                    return null;
                  }

                  let labelText = typeof item.label === 'string' ? item.label : (UI_STRINGS.rollDialogGenericBreakdownLabel || "Component");
                  let abilityAbbr: string | undefined;
                  
                  if (typeof item.label === 'string') {
                    const labelMatch = item.label.match(/^(.*)\s+\(([^)]+)\)$/);
                    if (labelMatch) {
                        labelText = labelMatch[1];
                        const potentialAbbr = labelMatch[2].toUpperCase();
                        if (translations.ABILITY_LABELS && translations.ABILITY_LABELS.some(al => al.abbr === potentialAbbr)) {
                            abilityAbbr = potentialAbbr;
                        }
                    } else if (item.label === (UI_STRINGS.rollDialogAbilityModifierLabel || "Ability Modifier ({abilityAbbr})")) {
                       // This case might need more robust logic if a specific ability is NOT in the title/rollType
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
                         labelText = (UI_STRINGS.rollDialogAbilityModifierLabel || "Ability Modifier ({abilityAbbr})").replace("{abilityAbbr}", abilityAbbr || "MOD");

                    }
                  }


                  return (
                    <div key={`breakdown-${index}`} className="flex justify-between text-sm">
                      <span className="text-foreground inline-flex items-baseline">
                        {labelText}
                        {abilityAbbr && item.label !== (UI_STRINGS.rollDialogAbilityModifierLabel || "Ability Modifier ({abilityAbbr})").replace("{abilityAbbr}", abilityAbbr || "MOD") && <>{'\u00A0'}<Badge variant="outline">{abilityAbbr}</Badge></>}
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
                      ? (UI_STRINGS.rollDialogTotalNumericBonusLabel || "Total Numeric Bonus") 
                      : (UI_STRINGS.rollDialogTotalBonusLabel || "Total Bonus")}
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
                {UI_STRINGS.rollDialogCriticalHitLabel || "Critical Hit!"} ({weaponCriticalMultiplier}x {UI_STRINGS.rollDialogDamageMultiplierLabel || "Damage"})
              </Label>
            </div>
          )}

          {totalDiceValue !== null && finalResult !== null && (
            <div className={resultCardBackground}>
              {isDamageRoll ? (
                <>
                  {isCritical && weaponCriticalMultiplier && weaponCriticalMultiplier > 1 && weaponDamageDiceString && weaponDamageDiceString.trim() !== "" && weaponDamageDiceString !== "0" && (
                    <div className="text-center mb-1">
                      <Badge variant="destructive" className="text-sm px-2 py-0.5">{UI_STRINGS.rollDialogCriticalHitAppliedLabel || "CRITICAL HIT APPLIED!"}</Badge>
                    </div>
                  )}
                  {rolledWeaponDiceDetails && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-foreground">{UI_STRINGS.rollDialogWeaponDamageDiceLabel || "Weapon Dice Rolled:"}</span>
                        <span className="font-bold text-primary">{rolledWeaponDiceDetails}</span>
                    </div>
                  )}
                   {rolledExtraDiceDetails && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-foreground">{UI_STRINGS.rollDialogExtraDamageDiceLabel || "Extra Dice Rolled:"}</span>
                        <span className="font-bold text-primary">{rolledExtraDiceDetails}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-foreground">{UI_STRINGS.rollDialogDamageOtherBonusesLabel || "Other Bonuses:"}</span>
                    <span className="font-bold text-primary">{renderModifierValue(baseModifier)}</span>
                  </div>
                  <Separator className="my-1 bg-border/50"/>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">{UI_STRINGS.rollDialogFinalDamageStringLabel || "Total Damage:"}</span>
                    <span className="font-bold text-lg text-primary">{finalResult}</span>
                  </div>
                </>
              ) : ( // d20 roll results
                <>
                  {initialD20Roll !== null && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-sm text-foreground">{UI_STRINGS.rollDialogDiceRollLabel || "Dice Roll:"}{'\u00A0'}</span><Badge variant="outline">1d20</Badge>
                      </div>
                      <span className={diceResultColor}>{initialD20Roll}</span>
                    </div>
                  )}
                  {bonusRolls.length > 0 && (
                     <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground">{UI_STRINGS.rollDialogBonusDiceRollLabel || "Bonus Dice Roll:"}</span>
                      <span className="font-bold text-lg text-primary">{bonusRolls.join(', ')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-foreground">{UI_STRINGS.rollDialogTotalBonusLabel || "Total Bonus:"}</span>
                    <span className="font-bold text-primary">{renderModifierValue(baseModifier)}</span>
                  </div>
                  <Separator className="mt-2 mb-1" />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">{UI_STRINGS.rollDialogFinalResultLabel || "Final Result:"}</span>
                    {isInitialRollCritFailure ? (
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
