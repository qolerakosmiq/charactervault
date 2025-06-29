'use client';

import *as React from 'react';
import type { ItemDefinition, ItemInstance } from '@/types/character-core';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Info, Dices } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLocalizedString } from '@/i18n/i18n-data';
import { DEFAULT_LANGUAGE, type LanguageCode } from '@/i18n/config';
import {
  panelFieldHorizontalGap,
  textStyleLabel,
  textStyleValueBig,
} from '@/config/layout';

interface AttackCardProps {
  label: string;
  selectId: string;
  weaponInstances: Array<ItemInstance & { definition: ItemDefinition }>;
  selectedWeaponInstanceId: string;
  onSelectedWeaponChange: (id: string) => void;
  formattedDamageBonus: string;
  weaponDisplay: React.ReactNode;
  onOpenDamageBreakdown: () => void;
  onRollDamage: () => void;
  isPanelLocked: boolean;
  uiStrings: Record<string, string>;
  currentLang: LanguageCode;
}

export const AttackCard = React.memo(({
  label,
  selectId,
  weaponInstances,
  selectedWeaponInstanceId,
  onSelectedWeaponChange,
  formattedDamageBonus,
  weaponDisplay,
  onOpenDamageBreakdown,
  onRollDamage,
  isPanelLocked,
  uiStrings,
  currentLang
}: AttackCardProps) => {

  const weaponName = React.useMemo(() => {
    return weaponInstances.find(w => w.instanceId === selectedWeaponInstanceId)?.definition.label;
  }, [weaponInstances, selectedWeaponInstanceId]);

  const rollDamageAriaLabel = React.useMemo(() => {
    const name = weaponName ? getLocalizedString(weaponName, currentLang, DEFAULT_LANGUAGE) : (uiStrings.attacksPanelUnarmedOption || 'Unarmed');
    return (uiStrings.rollDialogDamageAriaLabel || "Roll Damage for {weaponName}").replace("{weaponName}", name);
  }, [weaponName, currentLang, uiStrings]);

  const isWeaponSelected = selectedWeaponInstanceId !== 'none' && selectedWeaponInstanceId !== 'unarmed';

  return (
    <div className="flex items-start w-full gap-4">
      {/* Left Column: Weapon Selection & Stats (75%) */}
      <div className="w-3/4 flex flex-col gap-2">
        <Label htmlFor={selectId} className={textStyleLabel}>
          {label}
        </Label>
        <Select
          value={selectedWeaponInstanceId}
          onValueChange={onSelectedWeaponChange}
          // Note: The 'disabled' prop is intentionally omitted here to keep the select enabled when locked.
        >
          <SelectTrigger id={selectId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="none">{uiStrings.deityNoneOption}</SelectItem>
              {weaponInstances.map(wInst => (
                <SelectItem key={`cs-melee-${wInst.instanceId}`} value={wInst.instanceId}>
                  {getLocalizedString(wInst.definition.label, currentLang, DEFAULT_LANGUAGE)}
                  {wInst.instanceId !== 'unarmed' && wInst.quantity > 1 && ` (x${wInst.quantity})`}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {weaponDisplay}
      </div>

      {/* Right Column: Damage Bonus (25%) */}
      {selectedWeaponInstanceId !== 'none' && (
        <div className="w-1/4 flex flex-col gap-2 items-center text-center">
          <Label className={textStyleLabel}>
            {uiStrings.attacksPanelDamageBonusLabel}
          </Label>
          <div className={cn("flex items-center justify-center h-10", panelFieldHorizontalGap)}>
            <p className={cn(textStyleValueBig, "text-accent")}>{formattedDamageBonus}</p>
            <Button type="button" variant="ghost" size="icon-xs" onClick={onOpenDamageBreakdown} disabled={isPanelLocked}>
              <Info />
            </Button>
            <Button type="button" variant="ghost" size="icon-xs" onClick={onRollDamage} disabled={isPanelLocked} aria-label={rollDamageAriaLabel}>
              <Dices />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});
AttackCard.displayName = "AttackCard";
