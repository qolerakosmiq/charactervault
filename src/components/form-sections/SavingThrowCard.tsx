'use client';

import *as React from 'react';
import type { SavingThrowType, AbilityName } from '@/types/character';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Info, Dices } from 'lucide-react';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { DualBadge, type DualBadgeProps } from '@/components/ui/DualBadge';
import { renderModifierValue } from '../info-dialog-content/dialog-utils';
import { cn } from '@/lib/utils';
import {
  debounceDelayFormInput,
  panelContentPadding,
  panelFieldHorizontalGap,
  panelFieldVerticalGap,
  textStyleCardTitle,
  textStyleInput,
  inputWidthFull,
  textStyleLabel,
  textStyleValueBig,
  textStyleModifier,
  textStyleBadgeMedium,
  textStyleSubLabel,
} from '@/config/layout';

interface SavingThrowCardProps {
  saveType: SavingThrowType;
  saveTypeLabel: string;
  totalValue: number;
  baseValue: number;
  abilityModifier: number;
  abilityAbbr: string;
  miscBonus: number;
  tempModValue: number;
  onTempModChange: (saveType: SavingThrowType, value: number) => void;
  panelIsLocked: boolean;
  onOpenInfoDialog: (saveType: SavingThrowType) => void;
  onOpenRollDialog: (saveType: SavingThrowType) => void;
  uiStrings: Record<string, string>;
}

export const SavingThrowCard = React.memo(({
  saveType,
  saveTypeLabel,
  totalValue,
  baseValue,
  abilityModifier,
  abilityAbbr,
  miscBonus,
  tempModValue,
  onTempModChange,
  panelIsLocked,
  onOpenInfoDialog,
  onOpenRollDialog,
  uiStrings,
}: SavingThrowCardProps) => {

  const handleDebouncedChange = React.useCallback((value: number) => {
    onTempModChange(saveType, value);
  }, [onTempModChange, saveType]);

  const [localTemporaryMod, setLocalTemporaryMod] = useDebouncedFormField(
    tempModValue, handleDebouncedChange, debounceDelayFormInput
  );

  let badgeColor: DualBadgeProps['color'] = 'default';
  if (abilityModifier > 0) badgeColor = 'emerald';
  else if (abilityModifier < 0) badgeColor = 'destructive';

  const formattedAbilityModifier = `${abilityModifier >= 0 ? '+' : ''}${abilityModifier}`;

  return (
    <div className={cn("flex flex-col border rounded-md bg-card items-center text-center", panelContentPadding, panelFieldVerticalGap)}>
       <Label className={cn("text-center flex flex-col items-center", panelFieldVerticalGap)}>
        <span className={textStyleCardTitle}>{saveTypeLabel}</span>
        <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
            <p className={textStyleValueBig}>{baseValue}</p>
            <Button
            type="button" variant="ghost" size="icon-xs"
            className="text-muted-foreground hover:text-primary self-center"
            onClick={() => onOpenInfoDialog(saveType)}
            aria-label={(uiStrings.infoDialogSavingThrowBreakdownAriaLabel || "Detailed breakdown for {saveTypeLabel} save").replace("{saveTypeLabel}", saveTypeLabel)}
            >
            <Info />
            </Button>
        </div>
      </Label>
      <>
        <div className={cn("flex flex-col items-center", panelFieldVerticalGap)}>
          <Label className={textStyleLabel}>{uiStrings.savingThrowsRowLabelFinalModifier}</Label>
          <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
            <p className={cn(textStyleModifier, 'text-center')}>{renderModifierValue(totalValue)}</p>
             <Button
              type="button" variant="ghost" size="icon-xs"
              className="text-muted-foreground hover:text-primary self-center"
              onClick={() => onOpenRollDialog(saveType)}
              aria-label={(uiStrings.rollDialogSavingThrowAriaLabel || "Roll {saveTypeLabel} Save").replace("{saveTypeLabel}", saveTypeLabel)}
            >
              <Dices />
            </Button>
          </div>
        </div>
        {!panelIsLocked && (
          <>
            <div className={cn("flex flex-col items-center", panelFieldVerticalGap)}>
              <Label className={textStyleLabel}>{uiStrings.savingThrowsRowLabelAbilityModifier}</Label>
              <DualBadge leftLabel={abilityAbbr} rightLabel={formattedAbilityModifier} color={badgeColor} className={textStyleBadgeMedium} />
            </div>
            <div className={cn("flex flex-col items-center", panelFieldVerticalGap)}>
              <Label className={textStyleLabel}>
                {uiStrings.savingThrowsRowLabelMiscModifier}
              </Label>
              <p className={textStyleSubLabel}>{renderModifierValue(miscBonus)}</p>
            </div>
            <div className={cn("flex flex-col items-center", panelFieldVerticalGap)}>
                <Label htmlFor={`temp-mod-${saveType}`} className={textStyleLabel}>
                  {uiStrings.savingThrowsRowLabelTemporaryModifier}
                </Label>
                <div className="flex justify-center w-full">
                  <Input
                    id={`temp-mod-${saveType}`}
                    type="number"
                    value={localTemporaryMod}
                    onChange={(e) => setLocalTemporaryMod(parseInt(e.target.value, 10) || 0)}
                    className={cn(textStyleInput, inputWidthFull)}
                    disabled={panelIsLocked}
                  />
                </div>
            </div>
          </>
        )}
      </>
    </div>
  )
});
SavingThrowCard.displayName = 'SavingThrowCard';
