
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
  panelBadgeGroupGap,
  textStyleBadgeSmall,
} from '@/config/layout';
import { DualBadge } from '../ui/DualBadge';
import { renderModifierValue } from '../info-dialog-content/dialog-utils';


interface AttackCardProps {
  label: string;
  selectId: string;
  weaponInstances: Array<ItemInstance & { definition: ItemDefinition }>;
  selectedWeaponInstanceId: string;
  onSelectedWeaponChange: (id: string) => void;
  
  // Attack Bonus props
  attackBonus: number;
  onOpenAttackBreakdown: () => void;
  onRollAttack: () => void;
  
  // Damage Bonus props
  damageBonus: number;
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
  attackBonus,
  onOpenAttackBreakdown,
  onRollAttack,
  damageBonus,
  onOpenDamageBreakdown,
  onRollDamage,
  isPanelLocked,
  uiStrings,
  currentLang
}: AttackCardProps) => {

  const selectedWeaponDefinition = React.useMemo(() => {
    return weaponInstances.find(w => w.instanceId === selectedWeaponInstanceId)?.definition;
  }, [weaponInstances, selectedWeaponInstanceId]);

  const rollAttackAriaLabel = React.useMemo(() => {
    const name = selectedWeaponDefinition?.label ? getLocalizedString(selectedWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : (uiStrings.attacksPanelUnarmedOption || 'Unarmed');
    return (uiStrings.rollDialogAttackAriaLabel || "Roll Attack for {weaponName}").replace("{weaponName}", name);
  }, [selectedWeaponDefinition, currentLang, uiStrings]);
  
  const rollDamageAriaLabel = React.useMemo(() => {
    const name = selectedWeaponDefinition?.label ? getLocalizedString(selectedWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : (uiStrings.attacksPanelUnarmedOption || 'Unarmed');
    return (uiStrings.rollDialogDamageAriaLabel || "Roll Damage for {weaponName}").replace("{weaponName}", name);
  }, [selectedWeaponDefinition, currentLang, uiStrings]);

  const weaponDisplay = React.useMemo(() => {
    if (!selectedWeaponDefinition) return null;
    return (
      <div className={cn("flex w-full items-center justify-start", panelBadgeGroupGap)}>
        <DualBadge color="primary" leftLabel={uiStrings.attacksPanelWeaponDamageLabel} rightLabel={selectedWeaponDefinition.damage || '—'} className={textStyleBadgeSmall} />
        <DualBadge color="secondary" leftLabel={(uiStrings.attacksPanelCriticalOnLabel || "Critical on {range}").replace("{range}", selectedWeaponDefinition.criticalRange || '20')} rightLabel={(selectedWeaponDefinition.criticalMultiplier || '×2').replace('x', '×')} className={textStyleBadgeSmall} />
      </div>
    );
  }, [selectedWeaponDefinition, uiStrings, panelBadgeGroupGap, textStyleBadgeSmall]);

  const noWeaponSelected = selectedWeaponInstanceId === 'none';

  return (
    <div className="flex flex-col gap-2">
      <div>
        <Label htmlFor={selectId} className={textStyleLabel}>
          {label}
        </Label>
        <Select
          value={selectedWeaponInstanceId}
          onValueChange={onSelectedWeaponChange}
          disabled={isPanelLocked}
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
      </div>
      
      {!noWeaponSelected && (
        <>
          <div className="col-span-2">
            {weaponDisplay}
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
            {/* Attack Bonus Column */}
            <div className="text-center">
              <Label className={textStyleLabel}>{uiStrings.attacksPanelAttackBonusLabel}</Label>
              <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                <p className={cn(textStyleValueBig, "text-accent")}>{renderModifierValue(attackBonus)}</p>
                <Button type="button" variant="ghost" size="icon-xs" onClick={onOpenAttackBreakdown} disabled={isPanelLocked}><Info /></Button>
                <Button type="button" variant="ghost" size="icon-xs" onClick={onRollAttack} disabled={isPanelLocked} aria-label={rollAttackAriaLabel}><Dices /></Button>
              </div>
            </div>

            {/* Damage Bonus Column */}
            <div className="text-center">
              <Label className={textStyleLabel}>{uiStrings.attacksPanelDamageBonusLabel}</Label>
              <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                <p className={cn(textStyleValueBig, "text-accent")}>{renderModifierValue(damageBonus)}</p>
                <Button type="button" variant="ghost" size="icon-xs" onClick={onOpenDamageBreakdown} disabled={isPanelLocked}><Info /></Button>
                <Button type="button" variant="ghost" size="icon-xs" onClick={onRollDamage} disabled={isPanelLocked} aria-label={rollDamageAriaLabel}><Dices /></Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
});
AttackCard.displayName = "AttackCard";
