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
  panelFieldVerticalGap,
  panelGridGap,
} from '@/config/layout';
import { DualBadge } from '../ui/DualBadge';
import { renderModifierValue } from '../info-dialog-content/dialog-utils';


interface AttackCardProps {
  label: string;
  selectId: string;
  weaponInstances: Array<ItemInstance & { definition: ItemDefinition }>;
  selectedWeaponInstanceId: string;
  onSelectedWeaponChange: (id: string) => void;
  
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
    <div className={cn("flex flex-col", panelFieldVerticalGap)}>
        <div className={cn("grid grid-cols-2", panelGridGap)}>
            <div className={cn("flex flex-col", panelFieldVerticalGap)}>
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
            
            <div className={cn("text-center flex flex-col items-center justify-start", panelFieldVerticalGap)}>
                {!noWeaponSelected && (
                    <>
                        <Label className={textStyleLabel}>{uiStrings.attacksPanelDamageBonusLabel}</Label>
                        <div className={cn("flex items-center justify-center h-10", panelFieldHorizontalGap)}>
                            <p className={cn(textStyleValueBig, "text-accent")}>{renderModifierValue(damageBonus)}</p>
                            <Button type="button" variant="ghost" size="icon-xs" onClick={onOpenDamageBreakdown} disabled={isPanelLocked}><Info /></Button>
                            <Button type="button" variant="ghost" size="icon-xs" onClick={onRollDamage} disabled={isPanelLocked} aria-label={rollDamageAriaLabel}><Dices /></Button>
                        </div>
                    </>
                )}
            </div>
        </div>
        
        {!noWeaponSelected && (
            <div className="col-span-2">
                {weaponDisplay}
            </div>
        )}
    </div>
  );
});
AttackCard.displayName = "AttackCard";
