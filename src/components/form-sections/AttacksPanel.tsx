
'use client';

import *as React from 'react';
import type { Character, BabBreakdownDetails, InitiativeBreakdownDetails, GrappleModifierBreakdownDetails, GrappleDamageBreakdownDetails, CharacterSize, InfoDialogContentType, AbilityScores, FeatDefinitionJsonData, AggregatedFeatEffects, Item } from '@/types/character';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Swords, Info, Loader2, Minus, Plus, Hand, ArrowRightLeft } from 'lucide-react';
import { getAbilityModifierByName, getBab, getSizeModifierAttack } from '@/lib/dnd-utils';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { Separator } from '@/components/ui/separator';

const DEBOUNCE_DELAY = 400;

export type AttacksPanelCharacterData = Pick<Character,
  'abilityScores' | 'classes' | 'size' | 'inventory' | 'feats' | 'babMiscModifier'
>;

export interface AttacksPanelProps {
  attacksPanelData: AttacksPanelCharacterData;
  aggregatedFeatEffects: AggregatedFeatEffects | null;
  allFeatDefinitions: readonly (FeatDefinitionJsonData & { isCustom?: boolean })[];
  onCharacterUpdate: (field: keyof Pick<Character, 'babMiscModifier'>, value: any) => void;
  onOpenAttackBonusInfoDialog: (type: 'melee' | 'ranged' | 'bab') => void;
  onOpenDamageBonusInfoDialog: (type: 'melee' | 'ranged') => void;
}

const AttacksPanelComponent = ({
    attacksPanelData,
    aggregatedFeatEffects,
    allFeatDefinitions,
    onCharacterUpdate,
    onOpenAttackBonusInfoDialog,
    onOpenDamageBonusInfoDialog,
}: AttacksPanelProps) => {
  const { translations, isLoading: translationsLoading } = useI18n();
  const [selectedMeleeWeaponId, setSelectedMeleeWeaponId] = React.useState<string>('unarmed');
  const [selectedRangedWeaponId, setSelectedRangedWeaponId] = React.useState<string>('none');

  const [localBabMiscModifier, setLocalBabMiscModifier] = useDebouncedFormField(
    attacksPanelData.babMiscModifier || 0,
    (value) => onCharacterUpdate('babMiscModifier', value),
    DEBOUNCE_DELAY
  );

  if (translationsLoading || !translations || !attacksPanelData || !aggregatedFeatEffects) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3"> <Swords className="h-8 w-8 text-primary" /> <Skeleton className="h-7 w-1/2" /> </div>
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {[...Array(4)].map((_, i) => <Skeleton key={`combat-panel-skel-${i}`} className="h-40 rounded-md" />)}
        </CardContent>
      </Card>
    );
  }
  const { DND_CLASSES, SIZES, ABILITY_LABELS, UI_STRINGS } = translations;

  const { abilityScores, classes, size, inventory, feats } = attacksPanelData;
  const strMod = getAbilityModifierByName(abilityScores, 'strength');
  const dexMod = getAbilityModifierByName(abilityScores, 'dexterity');
  const sizeModAttack = getSizeModifierAttack(size, SIZES);

  const baseBabArray = getBab(classes, DND_CLASSES);
  const totalBabWithModifier = baseBabArray.map(bab => bab + localBabMiscModifier);

  const meleeWeapons = [{id: 'unarmed', name: UI_STRINGS.attacksPanelUnarmedOption || 'Unarmed', itemType: 'weapon' as const, weaponType: 'melee' as const, damage: '1d3', criticalRange: '20', criticalMultiplier: 'x2'},
                        ...(inventory.filter(item => item.itemType === 'weapon' && (item.weaponType === 'melee' || item.weaponType === 'melee-or-ranged')))];
  const rangedWeapons = inventory.filter(item => item.itemType === 'weapon' && (item.weaponType === 'ranged' || item.weaponType === 'melee-or-ranged'));

  const selectedMeleeWeapon = meleeWeapons.find(w => w.id === selectedMeleeWeaponId);
  const selectedRangedWeapon = rangedWeapons.find(w => w.id === selectedRangedWeaponId);

  // --- Melee Attack Bonus Calculation ---
  let meleeAttackAbilityMod = strMod;
  if (selectedMeleeWeapon?.isFinesseWeapon && dexMod > strMod) {
    meleeAttackAbilityMod = dexMod;
  }
  let meleeAttackFeatBonus = 0;
  aggregatedFeatEffects.attackRollBonuses.forEach(effect => {
    if (effect.appliesTo === 'all' || effect.appliesTo === 'melee' || (selectedMeleeWeaponId === 'unarmed' && effect.appliesTo === 'unarmed')) {
      meleeAttackFeatBonus += (typeof effect.value === 'number' ? effect.value : 0);
    } else if (effect.weaponId && selectedMeleeWeapon && effect.weaponId === selectedMeleeWeapon.name) {
      meleeAttackFeatBonus += (typeof effect.value === 'number' ? effect.value : 0);
    }
  });
  const calculatedMeleeAttackBonus = totalBabWithModifier[0] + meleeAttackAbilityMod + sizeModAttack + meleeAttackFeatBonus;

  // --- Melee Damage Bonus Calculation ---
  let meleeDamageAbilityMod = strMod;
  // TODO: Add logic for 1.5x STR for two-handed weapons later
  let meleeDamageFeatBonus = 0;
  aggregatedFeatEffects.damageRollBonuses.forEach(effect => {
     if (effect.appliesTo === 'all' || effect.appliesTo === 'melee' || (selectedMeleeWeaponId === 'unarmed' && effect.appliesTo === 'unarmed')) {
      meleeDamageFeatBonus += (typeof effect.value === 'number' ? effect.value : 0);
    } else if (effect.weaponId && selectedMeleeWeapon && effect.weaponId === selectedMeleeWeapon.name) {
      meleeDamageFeatBonus += (typeof effect.value === 'number' ? effect.value : 0);
    }
  });
  const calculatedMeleeDamageBonus = meleeDamageAbilityMod + meleeDamageFeatBonus;

  // --- Ranged Attack Bonus Calculation ---
  let rangedAttackFeatBonus = 0;
   aggregatedFeatEffects.attackRollBonuses.forEach(effect => {
    if (effect.appliesTo === 'all' || effect.appliesTo === 'ranged') {
      rangedAttackFeatBonus += (typeof effect.value === 'number' ? effect.value : 0);
    } else if (effect.weaponId && selectedRangedWeapon && effect.weaponId === selectedRangedWeapon.name) {
      rangedAttackFeatBonus += (typeof effect.value === 'number' ? effect.value : 0);
    }
  });
  const calculatedRangedAttackBonus = totalBabWithModifier[0] + dexMod + sizeModAttack + rangedAttackFeatBonus;

  // --- Ranged Damage Bonus Calculation ---
  let rangedDamageFeatBonus = 0;
  aggregatedFeatEffects.damageRollBonuses.forEach(effect => {
    if (effect.appliesTo === 'all' || effect.appliesTo === 'ranged') {
       rangedDamageFeatBonus += (typeof effect.value === 'number' ? effect.value : 0);
    } else if (effect.weaponId && selectedRangedWeapon && effect.weaponId === selectedRangedWeapon.name) {
       rangedDamageFeatBonus += (typeof effect.value === 'number' ? effect.value : 0);
    }
  });
  // Placeholder for STR to ranged damage (e.g. thrown, mighty composite bows) - not implemented yet
  const calculatedRangedDamageBonus = rangedDamageFeatBonus;


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Swords className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl font-serif">{UI_STRINGS.attacksPanelTitle}</CardTitle>
        </div>
        <CardDescription>{UI_STRINGS.attacksPanelDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* BAB Section */}
        <div className="p-3 border rounded-md bg-muted/20 space-y-2 text-center">
          <Label htmlFor="bab-display" className="text-md font-medium block">{UI_STRINGS.attacksPanelBabLabel}</Label>
          <div className="flex items-center justify-center">
            <p id="bab-display" className="text-xl font-bold text-accent">
              {totalBabWithModifier.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/')}
            </p>
             <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={() => onOpenAttackBonusInfoDialog('bab')}>
              <Info className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-auto space-y-1">
            <Label htmlFor="bab-custom-mod" className="text-xs text-muted-foreground block">{UI_STRINGS.attacksPanelBabMiscModLabel}</Label>
            <div className="flex justify-center">
              <NumberSpinnerInput
                id="bab-custom-mod"
                value={localBabMiscModifier}
                onChange={setLocalBabMiscModifier}
                min={-20}
                inputClassName="h-8 text-sm w-20"
                buttonClassName="h-8 w-8"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Melee Section */}
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-foreground/90 flex items-center"><Hand className="mr-2 h-5 w-5 text-primary/70"/>{UI_STRINGS.attacksPanelMeleeTitle}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div className="space-y-1">
              <Label htmlFor="melee-weapon-select">{UI_STRINGS.attacksPanelMeleeWeaponLabel}</Label>
              <Select value={selectedMeleeWeaponId} onValueChange={setSelectedMeleeWeaponId}>
                <SelectTrigger id="melee-weapon-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {meleeWeapons.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            {selectedMeleeWeapon && (
              <div className="p-2 border rounded-md bg-background text-xs space-y-0.5">
                <p><strong>{UI_STRINGS.attacksPanelWeaponDamageLabel}:</strong> {selectedMeleeWeapon.damage || 'N/A'}</p>
                <p><strong>{UI_STRINGS.attacksPanelWeaponCriticalLabel}:</strong> {selectedMeleeWeapon.criticalRange || 'N/A'} {selectedMeleeWeapon.criticalMultiplier || ''}</p>
                {selectedMeleeWeapon.damageType && <p><strong>{UI_STRINGS.attacksPanelWeaponDamageTypeLabel}:</strong> {selectedMeleeWeapon.damageType}</p>}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-2 border rounded-md bg-muted/10 text-center">
              <Label className="text-sm font-medium block">{UI_STRINGS.attacksPanelAttackBonusLabel}</Label>
              <div className="flex items-center justify-center">
                  <p className="text-lg font-bold text-accent">{calculatedMeleeAttackBonus >= 0 ? '+' : ''}{calculatedMeleeAttackBonus}</p>
                  {/* Placeholder for future info dialog */}
              </div>
            </div>
            <div className="p-2 border rounded-md bg-muted/10 text-center">
              <Label className="text-sm font-medium block">{UI_STRINGS.attacksPanelDamageBonusLabel}</Label>
               <div className="flex items-center justify-center">
                <p className="text-lg font-bold text-accent">{calculatedMeleeDamageBonus >= 0 ? '+' : ''}{calculatedMeleeDamageBonus}</p>
                 {/* Placeholder for future info dialog */}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Ranged Section */}
         <div className="space-y-3">
          <h4 className="text-lg font-semibold text-foreground/90 flex items-center"><ArrowRightLeft className="mr-2 h-5 w-5 text-primary/70"/>{UI_STRINGS.attacksPanelRangedTitle}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div className="space-y-1">
              <Label htmlFor="ranged-weapon-select">{UI_STRINGS.attacksPanelRangedWeaponLabel}</Label>
              <Select value={selectedRangedWeaponId} onValueChange={setSelectedRangedWeaponId} disabled={rangedWeapons.length === 0}>
                <SelectTrigger id="ranged-weapon-select">
                  <SelectValue placeholder={rangedWeapons.length === 0 ? (UI_STRINGS.attacksPanelNoRangedWeapons || "No ranged weapons") : (UI_STRINGS.attacksPanelSelectRangedWeapon || "Select ranged weapon...")} />
                </SelectTrigger>
                <SelectContent>
                   <SelectGroup>
                    <SelectItem value="none" disabled={rangedWeapons.length > 0}>{UI_STRINGS.attacksPanelNoRangedWeapons || "No ranged weapons"}</SelectItem>
                    {rangedWeapons.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
             {selectedRangedWeapon && (
              <div className="p-2 border rounded-md bg-background text-xs space-y-0.5">
                <p><strong>{UI_STRINGS.attacksPanelWeaponDamageLabel}:</strong> {selectedRangedWeapon.damage || 'N/A'}</p>
                <p><strong>{UI_STRINGS.attacksPanelWeaponCriticalLabel}:</strong> {selectedRangedWeapon.criticalRange || 'N/A'} {selectedRangedWeapon.criticalMultiplier || ''}</p>
                {selectedRangedWeapon.rangeIncrement && <p><strong>{UI_STRINGS.attacksPanelWeaponRangeLabel}:</strong> {selectedRangedWeapon.rangeIncrement} {UI_STRINGS.speedUnit || "ft."}</p>}
                {selectedRangedWeapon.damageType && <p><strong>{UI_STRINGS.attacksPanelWeaponDamageTypeLabel}:</strong> {selectedRangedWeapon.damageType}</p>}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-2 border rounded-md bg-muted/10 text-center">
              <Label className="text-sm font-medium block">{UI_STRINGS.attacksPanelAttackBonusLabel}</Label>
               <div className="flex items-center justify-center">
                <p className="text-lg font-bold text-accent">{calculatedRangedAttackBonus >= 0 ? '+' : ''}{calculatedRangedAttackBonus}</p>
                 {/* Placeholder for future info dialog */}
                </div>
            </div>
            <div className="p-2 border rounded-md bg-muted/10 text-center">
              <Label className="text-sm font-medium block">{UI_STRINGS.attacksPanelDamageBonusLabel}</Label>
              <div className="flex items-center justify-center">
                <p className="text-lg font-bold text-accent">{calculatedRangedDamageBonus >= 0 ? '+' : ''}{calculatedRangedDamageBonus}</p>
                 {/* Placeholder for future info dialog */}
              </div>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};
AttacksPanelComponent.displayName = 'AttacksPanelComponent';
export const AttacksPanel = React.memo(AttacksPanelComponent);
