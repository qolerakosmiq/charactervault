
'use client';

import *as React from 'react';
import type { ItemDefinition, ItemInstance } from '@/types/character-core';
import { Card, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Info, Dices } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLocalizedString } from '@/i18n/i18n-data';
import { DEFAULT_LANGUAGE, type LanguageCode } from '@/i18n/config';
import {
  panelContentPadding,
  panelFieldHorizontalGap,
  panelFieldVerticalGap,
  panelGridGap,
  textStyleCardTitle,
  textStyleLabel,
  textStyleValueBig,
} from '@/config/layout';

interface AttackCardProps {
  attackType: 'melee' | 'ranged';
  Icon: React.ElementType;
  title: string;
  weaponInstances: Array<ItemInstance & { definition: ItemDefinition }>;
  selectedWeaponInstanceId: string;
  onSelectedWeaponChange: (id: string) => void;
  formattedAttackBonus: string;
  formattedDamageBonus: string;
  weaponDisplay: React.ReactNode;
  onOpenAttackBreakdown: () => void;
  onOpenDamageBreakdown: () => void;
  onRollAttack: () => void;
  onRollDamage: () => void;
  isPanelLocked: boolean;
  uiStrings: Record<string, string>;
  currentLang: LanguageCode;
  offHandWeaponInstances?: Array<ItemInstance & { definition: ItemDefinition }>;
  selectedOffHandWeaponInstanceId?: string;
  onSelectedOffHandWeaponChange?: (id: string) => void;
  offHandWeaponDisplay?: React.ReactNode;
  isRangedCardAndNoWeapons?: boolean;
}

export const AttackCard = React.memo(({
  attackType,
  Icon,
  title,
  weaponInstances,
  selectedWeaponInstanceId,
  onSelectedWeaponChange,
  formattedAttackBonus,
  formattedDamageBonus,
  weaponDisplay,
  onOpenAttackBreakdown,
  onOpenDamageBreakdown,
  onRollAttack,
  onRollDamage,
  isPanelLocked,
  uiStrings,
  currentLang,
  offHandWeaponInstances,
  selectedOffHandWeaponInstanceId,
  onSelectedOffHandWeaponChange,
  offHandWeaponDisplay,
  isRangedCardAndNoWeapons,
}: AttackCardProps) => {

  const weaponName = React.useMemo(() => {
    return weaponInstances.find(w => w.instanceId === selectedWeaponInstanceId)?.definition.label;
  }, [weaponInstances, selectedWeaponInstanceId]);

  const rollAttackAriaLabel = React.useMemo(() => {
    const name = weaponName ? getLocalizedString(weaponName, currentLang, DEFAULT_LANGUAGE) : (uiStrings.attacksPanelUnarmedOption || 'Unarmed');
    return (uiStrings.rollDialogMeleeAttackAriaLabel || "Roll Melee Attack with {weaponName}").replace("{weaponName}", name);
  }, [weaponName, currentLang, uiStrings.rollDialogMeleeAttackAriaLabel, uiStrings.attacksPanelUnarmedOption]);

  const rollDamageAriaLabel = React.useMemo(() => {
    const name = weaponName ? getLocalizedString(weaponName, currentLang, DEFAULT_LANGUAGE) : (uiStrings.attacksPanelUnarmedOption || 'Unarmed');
    return (uiStrings.rollDialogDamageAriaLabel || "Roll Damage for {weaponName}").replace("{weaponName}", name);
  }, [weaponName, currentLang, uiStrings.rollDialogDamageAriaLabel, uiStrings.attacksPanelUnarmedOption]);

  const isDamageRollDisabled = React.useMemo(() => {
    return attackType === 'melee'
      ? !weaponInstances.some(w => w.instanceId === selectedWeaponInstanceId)
      : isRangedCardAndNoWeapons || !weaponInstances.some(w => w.instanceId === selectedWeaponInstanceId);
  }, [attackType, weaponInstances, selectedWeaponInstanceId, isRangedCardAndNoWeapons]);

  return (
    <Card className={cn("flex flex-col justify-start", panelContentPadding, panelGridGap)}>
      <CardTitle className={cn(textStyleCardTitle, "flex items-center gap-2")}><Icon />{title}</CardTitle>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center flex flex-col gap-1">
          <Label className={textStyleLabel}>{uiStrings.attacksPanelAttackBonusLabel}</Label>
          <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
            <p className={cn(textStyleValueBig, "text-accent")}>{isRangedCardAndNoWeapons ? '—' : formattedAttackBonus}</p>
            <Button type="button" variant="ghost" size="icon-xs" onClick={onOpenAttackBreakdown} disabled={isRangedCardAndNoWeapons}><Info /></Button>
            <Button type="button" variant="ghost" size="icon-xs" onClick={onRollAttack} disabled={isRangedCardAndNoWeapons} aria-label={rollAttackAriaLabel}><Dices /></Button>
          </div>
        </div>
        <div className="text-center flex flex-col gap-1">
          <Label className={textStyleLabel}>{uiStrings.attacksPanelDamageBonusLabel}</Label>
          <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
            <p className={cn(textStyleValueBig, "text-accent")}>{isRangedCardAndNoWeapons ? '—' : formattedDamageBonus}</p>
            <Button type="button" variant="ghost" size="icon-xs" onClick={onOpenDamageBreakdown} disabled={isRangedCardAndNoWeapons}><Info /></Button>
            <Button type="button" variant="ghost" size="icon-xs" onClick={onRollDamage} disabled={isDamageRollDisabled} aria-label={rollDamageAriaLabel}><Dices /></Button>
          </div>
        </div>
      </div>
      <div className={cn("flex flex-col mt-auto", panelGridGap)}>
        <div className={cn("flex flex-col", panelFieldVerticalGap)}>
          <Label htmlFor={`${attackType}-weapon-select`} className={textStyleLabel}>
            {attackType === 'melee' ? uiStrings.attacksPanelMainHandMeleeWeaponLabel : uiStrings.attacksPanelRangedWeaponLabel}
          </Label>
          <Select value={selectedWeaponInstanceId} onValueChange={onSelectedWeaponChange} disabled={isPanelLocked || isRangedCardAndNoWeapons}>
            <SelectTrigger id={`${attackType}-weapon-select`}>
              <SelectValue placeholder={isRangedCardAndNoWeapons ? (uiStrings.attacksPanelNoRangedWeapons) : (uiStrings.attacksPanelSelectRangedWeapon)} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {attackType === 'ranged' && <SelectItem value="none">{uiStrings.deityNoneOption}</SelectItem>}
                {weaponInstances.map(wInst => (
                  <SelectItem key={`cs-${attackType}-${wInst.instanceId}`} value={wInst.instanceId}>
                    {getLocalizedString(wInst.definition.label, currentLang, DEFAULT_LANGUAGE)}
                    {wInst.instanceId !== 'unarmed' && wInst.quantity > 1 && ` (x${wInst.quantity})`}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {weaponDisplay}
        </div>
        {offHandWeaponInstances && onSelectedOffHandWeaponChange && selectedOffHandWeaponInstanceId && (
          <div className={cn("flex flex-col", panelFieldVerticalGap)}>
            <Label htmlFor="off-hand-weapon-select" className={textStyleLabel}>{uiStrings.attacksPanelOffHandMeleeWeaponLabel}</Label>
            <Select value={selectedOffHandWeaponInstanceId} onValueChange={onSelectedOffHandWeaponChange} disabled={isPanelLocked}>
              <SelectTrigger id="off-hand-weapon-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="none">{uiStrings.deityNoneOption}</SelectItem>
                  {offHandWeaponInstances.map(wInst => (
                    <SelectItem key={`cs-offhand-${wInst.instanceId}`} value={wInst.instanceId}>
                      {getLocalizedString(wInst.definition.label, currentLang, DEFAULT_LANGUAGE)}
                      {wInst.instanceId !== 'unarmed' && wInst.quantity > 1 && ` (x${wInst.quantity})`}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {offHandWeaponDisplay}
          </div>
        )}
      </div>
    </Card>
  );
});
AttackCard.displayName = "AttackCard";
