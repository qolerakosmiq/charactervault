
'use client';

import *as React from 'react';
import type { Character, BabBreakdownDetails, InitiativeBreakdownDetails, GrappleModifierBreakdownDetails, GrappleDamageBreakdownDetails, CharacterSize, InfoDialogContentType, AbilityScores, FeatDefinitionJsonData, AggregatedFeatEffects, Item, GenericBreakdownItem } from '@/types/character';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Swords, Info, Loader2, Hand, ArrowRightLeft, Activity, Shield } from 'lucide-react';
import { getAbilityModifierByName, getBab, getSizeModifierAttack } from '@/lib/dnd-utils';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const DEBOUNCE_DELAY = 400;

export type AttacksPanelCharacterData = Pick<Character,
  'abilityScores' | 'classes' | 'size' | 'inventory' | 'feats' | 'babMiscModifier' | 'sizeModifierAttack' | 'powerAttackValue' | 'combatExpertiseValue'
>;

export interface AttacksPanelProps {
  attacksPanelData: AttacksPanelCharacterData;
  aggregatedFeatEffects: AggregatedFeatEffects | null;
  allFeatDefinitions: readonly (FeatDefinitionJsonData & { isCustom?: boolean })[];
  onCharacterUpdate: (field: keyof Pick<Character, 'babMiscModifier' | 'powerAttackValue' | 'combatExpertiseValue'>, value: any) => void;
  onOpenAttackBonusInfoDialog: (contentType: InfoDialogContentType) => void;
  onOpenDamageBonusInfoDialog: (contentType: InfoDialogContentType) => void;
}

const AttacksPanelComponent = ({
    attacksPanelData,
    aggregatedFeatEffects,
    allFeatDefinitions, // Keep if needed for feat name lookup, though sourceFeat is now in effect
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

  const [localPowerAttackValue, setLocalPowerAttackValue] = useDebouncedFormField(
    attacksPanelData.powerAttackValue || 0,
    (value) => onCharacterUpdate('powerAttackValue', value),
    DEBOUNCE_DELAY
  );

  const [localCombatExpertiseValue, setLocalCombatExpertiseValue] = useDebouncedFormField(
    attacksPanelData.combatExpertiseValue || 0,
    (value) => onCharacterUpdate('combatExpertiseValue', value),
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

  const { abilityScores, classes, size, inventory, feats, sizeModifierAttack } = attacksPanelData;
  const strMod = getAbilityModifierByName(abilityScores, 'strength');
  const dexMod = getAbilityModifierByName(abilityScores, 'dexterity');
  
  const actualSizeModAttack = sizeModifierAttack || 0;


  const baseBabArray = getBab(classes, DND_CLASSES);
  const totalBabWithModifier = baseBabArray.map(bab => bab + localBabMiscModifier);
  const maxBabForSpinners = totalBabWithModifier[0] || 0;

  const meleeWeapons = [{id: 'unarmed', name: UI_STRINGS.attacksPanelUnarmedOption || 'Unarmed', itemType: 'weapon' as const, weaponType: 'melee' as const, damage: '1d3', criticalRange: '20', criticalMultiplier: 'x2'},
                        ...(inventory.filter(item => item.itemType === 'weapon' && (item.weaponType === 'melee' || item.weaponType === 'melee-or-ranged')))];
  const rangedWeapons = inventory.filter(item => item.itemType === 'weapon' && (item.weaponType === 'ranged' || item.weaponType === 'melee-or-ranged'));

  const selectedMeleeWeapon = meleeWeapons.find(w => w.id === selectedMeleeWeaponId);
  const selectedRangedWeapon = rangedWeapons.find(w => w.id === selectedRangedWeaponId);
  
  const calculateFinalAttackBonus = (
    baseBab: number,
    abilityMod: number,
    sizeMod: number,
    weaponType: 'melee' | 'ranged' | 'unarmed',
    selectedWeapon?: Item
  ): number => {
    let totalBonus = baseBab + abilityMod + sizeMod;
    aggregatedFeatEffects.attackRollBonuses.forEach(effect => {
      let applies = false;
      if (effect.appliesTo === 'all') applies = true;
      else if (effect.appliesTo === weaponType) applies = true;
      else if (weaponType === 'melee' && selectedWeapon?.id === 'unarmed' && effect.appliesTo === 'unarmed') applies = true;
      else if (selectedWeapon && effect.weaponId === selectedWeapon.name) applies = true;

      if (applies && typeof effect.value === 'number') {
        totalBonus += effect.value;
      }
    });
    return totalBonus;
  };

  const calculateFinalDamageBonus = (
    abilityMod: number, // Only pass STR for melee, 0 for ranged default
    weaponType: 'melee' | 'ranged' | 'unarmed',
    selectedWeapon?: Item
  ): number => {
    let totalBonus = abilityMod;
     aggregatedFeatEffects.damageRollBonuses.forEach(effect => {
      let applies = false;
      if (effect.appliesTo === 'all') applies = true;
      else if (effect.appliesTo === weaponType) applies = true;
      else if (weaponType === 'melee' && selectedWeapon?.id === 'unarmed' && effect.appliesTo === 'unarmed') applies = true;
      else if (selectedWeapon && effect.weaponId === selectedWeapon.name) applies = true;
      
      if (applies && typeof effect.value === 'number') {
        totalBonus += effect.value;
      }
    });
    return totalBonus;
  };


  // --- Melee Attack Bonus Calculation ---
  let meleeAttackAbilityModForCalc = strMod;
  if (selectedMeleeWeapon?.isFinesseWeapon && dexMod > strMod) {
    meleeAttackAbilityModForCalc = dexMod;
  }
  const calculatedMeleeAttackBonus = calculateFinalAttackBonus(totalBabWithModifier[0], meleeAttackAbilityModForCalc, actualSizeModAttack, selectedMeleeWeaponId === 'unarmed' ? 'unarmed' : 'melee', selectedMeleeWeapon);
  const calculatedMeleeDamageBonus = calculateFinalDamageBonus(strMod, selectedMeleeWeaponId === 'unarmed' ? 'unarmed' : 'melee', selectedMeleeWeapon); // STR applies by default

  // --- Ranged Attack Bonus Calculation ---
  const calculatedRangedAttackBonus = calculateFinalAttackBonus(totalBabWithModifier[0], dexMod, actualSizeModAttack, 'ranged', selectedRangedWeapon);
  const calculatedRangedDamageBonus = calculateFinalDamageBonus(0, 'ranged', selectedRangedWeapon); // Ranged typically doesn't add ability mod to damage by default

  const hasPowerAttackFeat = feats.some(f => f.definitionId === 'power-attack');
  const hasCombatExpertiseFeat = feats.some(f => f.definitionId === 'combat-expertise');

  const handleOpenBabInfo = () => {
    const components = getBabBreakdownComponents(baseBabArray, localBabMiscModifier, UI_STRINGS);
    onOpenAttackBonusInfoDialog({type: 'genericNumericalBreakdown', titleKey: 'infoDialogTitleTotalBabBreakdown', components});
  };

  const handleOpenMeleeAttackInfo = () => {
    const components = getMeleeAttackBonusBreakdownComponents(
        totalBabWithModifier[0], meleeAttackAbilityModForCalc, actualSizeModAttack,
        UI_STRINGS, ABILITY_LABELS, selectedMeleeWeapon?.isFinesseWeapon ? 'dexterity' : 'strength',
        aggregatedFeatEffects, selectedMeleeWeapon
    );
    onOpenAttackBonusInfoDialog({type: 'genericNumericalBreakdown', titleKey: 'infoDialogTitleMeleeAttackBreakdown', components});
  };
  const handleOpenMeleeDamageInfo = () => {
    const components = getMeleeDamageBonusBreakdownComponents(
        strMod, // Base ability mod for melee damage is STR
        UI_STRINGS, ABILITY_LABELS,
        aggregatedFeatEffects, selectedMeleeWeapon
    );
    onOpenDamageBonusInfoDialog({type: 'genericNumericalBreakdown', titleKey: 'infoDialogTitleMeleeDamageBreakdown', components});
  };
   const handleOpenRangedAttackInfo = () => {
    const components = getRangedAttackBonusBreakdownComponents(
        totalBabWithModifier[0], dexMod, actualSizeModAttack,
        UI_STRINGS, ABILITY_LABELS,
        aggregatedFeatEffects, selectedRangedWeapon
    );
    onOpenAttackBonusInfoDialog({type: 'genericNumericalBreakdown', titleKey: 'infoDialogTitleRangedAttackBreakdown', components});
  };
  const handleOpenRangedDamageInfo = () => {
    const components = getRangedDamageBonusBreakdownComponents(
        UI_STRINGS, ABILITY_LABELS, // Ranged damage usually has 0 ability mod unless specific feats
        aggregatedFeatEffects, selectedRangedWeapon
    );
    onOpenDamageBonusInfoDialog({type: 'genericNumericalBreakdown', titleKey: 'infoDialogTitleRangedDamageBreakdown', components});
  };


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
             <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={handleOpenBabInfo}>
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

        {(hasPowerAttackFeat || hasCombatExpertiseFeat) && <Separator />}

        {/* Power Attack / Combat Expertise Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hasPowerAttackFeat && (
            <div className="p-3 border rounded-md bg-card space-y-1 text-center">
              <Label htmlFor="power-attack-value" className="text-sm font-medium flex items-center justify-center">
                <Activity className="mr-1.5 h-4 w-4 text-destructive/80"/>
                {UI_STRINGS.powerAttackValueLabel || "Power Attack"}
              </Label>
               <NumberSpinnerInput
                id="power-attack-value"
                value={localPowerAttackValue}
                onChange={setLocalPowerAttackValue}
                min={0}
                max={maxBabForSpinners > 0 ? maxBabForSpinners : 0}
                inputClassName="h-8 text-sm w-20"
                buttonClassName="h-8 w-8"
              />
              <p className="text-xs text-muted-foreground">{UI_STRINGS.powerAttackDescription || "Set penalty to attack for damage bonus."}</p>
            </div>
          )}
          {hasCombatExpertiseFeat && (
             <div className="p-3 border rounded-md bg-card space-y-1 text-center">
              <Label htmlFor="combat-expertise-value" className="text-sm font-medium flex items-center justify-center">
                <Shield className="mr-1.5 h-4 w-4 text-blue-500/80"/>
                {UI_STRINGS.combatExpertiseValueLabel || "Combat Expertise"}
              </Label>
              <NumberSpinnerInput
                id="combat-expertise-value"
                value={localCombatExpertiseValue}
                onChange={setLocalCombatExpertiseValue}
                min={0}
                max={maxBabForSpinners > 0 ? maxBabForSpinners : 0}
                inputClassName="h-8 text-sm w-20"
                buttonClassName="h-8 w-8"
              />
              <p className="text-xs text-muted-foreground">{UI_STRINGS.combatExpertiseDescription || "Set penalty to attack for AC bonus."}</p>
            </div>
          )}
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
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={handleOpenMeleeAttackInfo}>
                    <Info className="h-4 w-4" />
                  </Button>
              </div>
            </div>
            <div className="p-2 border rounded-md bg-muted/10 text-center">
              <Label className="text-sm font-medium block">{UI_STRINGS.attacksPanelDamageBonusLabel}</Label>
               <div className="flex items-center justify-center">
                <p className="text-lg font-bold text-accent">{calculatedMeleeDamageBonus >= 0 ? '+' : ''}{calculatedMeleeDamageBonus}</p>
                 <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={handleOpenMeleeDamageInfo}>
                    <Info className="h-4 w-4" />
                  </Button>
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
                 <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={handleOpenRangedAttackInfo}>
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
            </div>
            <div className="p-2 border rounded-md bg-muted/10 text-center">
              <Label className="text-sm font-medium block">{UI_STRINGS.attacksPanelDamageBonusLabel}</Label>
              <div className="flex items-center justify-center">
                <p className="text-lg font-bold text-accent">{calculatedRangedDamageBonus >= 0 ? '+' : ''}{calculatedRangedDamageBonus}</p>
                 <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={handleOpenRangedDamageInfo}>
                    <Info className="h-4 w-4" />
                  </Button>
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

function getBabBreakdownComponents(baseBabArray: number[], localBabMiscModifier: number, UI_STRINGS: Record<string,string>): GenericBreakdownItem[] {
    const components: GenericBreakdownItem[] = [];
    components.push({ label: UI_STRINGS.attacksPanelBabBaseLabel || "Base BAB (from Classes)", value: baseBabArray.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/') });
    if (localBabMiscModifier !== 0) {
        components.push({ label: UI_STRINGS.attacksPanelBabMiscModLabel || "Misc Modifier", value: localBabMiscModifier });
    }
    const totalBabWithModifier = baseBabArray.map(bab => bab + localBabMiscModifier);
    components.push({ label: UI_STRINGS.infoDialogTitleTotalBabBreakdown || "Total BAB", value: totalBabWithModifier.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/'), isBold: true });
    return components;
}

function getMeleeAttackBonusBreakdownComponents(
    baseAttackBonus: number, abilityMod: number, sizeMod: number,
    UI_STRINGS: Record<string,string>, ABILITY_LABELS: any[], abilityKey: 'strength' | 'dexterity',
    aggregatedFeatEffects: AggregatedFeatEffects | null, selectedWeapon?: Item | null
): GenericBreakdownItem[] {
    const components: GenericBreakdownItem[] = [
        { label: UI_STRINGS.attacksPanelBabLabel || "Base Attack Bonus", value: baseAttackBonus },
        { label: (UI_STRINGS.attacksPanelAbilityModLabel || "Ability Modifier ({abilityAbbr})").replace("{abilityAbbr}", ABILITY_LABELS.find(al => al.value === abilityKey)?.abbr || abilityKey.toUpperCase()), value: abilityMod },
        { label: UI_STRINGS.attacksPanelSizeModLabel || "Size Modifier (Attack)", value: sizeMod },
    ];

    let totalBonusFromFeats = 0;
    aggregatedFeatEffects?.attackRollBonuses?.forEach(effect => {
        let applies = false;
        if (effect.appliesTo === 'all' || effect.appliesTo === 'melee') applies = true;
        if (selectedWeapon?.id === 'unarmed' && effect.appliesTo === 'unarmed') applies = true;
        if (selectedWeapon && effect.weaponId === selectedWeapon.name) applies = true;

        if (applies && typeof effect.value === 'number') {
            totalBonusFromFeats += effect.value;
            components.push({label: effect.sourceFeat || (UI_STRINGS.attacksPanelFeatBonusLabel || "Feat Bonus"), value: effect.value});
        }
    });

    const total = baseAttackBonus + abilityMod + sizeMod + totalBonusFromFeats;
    components.push({ label: UI_STRINGS.infoDialogTotalLabel || "Total", value: total, isBold: true });
    return components;
}

function getMeleeDamageBonusBreakdownComponents(
    abilityMod: number, // Base STR mod
    UI_STRINGS: Record<string,string>, ABILITY_LABELS: any[],
    aggregatedFeatEffects: AggregatedFeatEffects | null, selectedWeapon?: Item | null
): GenericBreakdownItem[] {
    const components: GenericBreakdownItem[] = [
        { label: (UI_STRINGS.attacksPanelAbilityModLabel || "Ability Modifier ({abilityAbbr})").replace("{abilityAbbr}", ABILITY_LABELS.find(al => al.value === 'strength')?.abbr || 'STR'), value: abilityMod },
    ];
    let totalBonusFromFeats = 0;
    aggregatedFeatEffects?.damageRollBonuses?.forEach(effect => {
        let applies = false;
        if (effect.appliesTo === 'all' || effect.appliesTo === 'melee') applies = true;
        if (selectedWeapon?.id === 'unarmed' && effect.appliesTo === 'unarmed') applies = true;
        if (selectedWeapon && effect.weaponId === selectedWeapon.name) applies = true;

        if (applies && typeof effect.value === 'number') {
            totalBonusFromFeats += effect.value;
            components.push({label: effect.sourceFeat || (UI_STRINGS.attacksPanelFeatBonusLabel || "Feat Bonus"), value: effect.value});
        }
    });
    const total = abilityMod + totalBonusFromFeats;
    components.push({ label: UI_STRINGS.infoDialogTotalLabel || "Total", value: total, isBold: true });
    return components;
}

function getRangedAttackBonusBreakdownComponents(
    baseAttackBonus: number, abilityMod: number, sizeMod: number,
    UI_STRINGS: Record<string,string>, ABILITY_LABELS: any[],
    aggregatedFeatEffects: AggregatedFeatEffects | null, selectedWeapon?: Item | null
): GenericBreakdownItem[] {
    const components: GenericBreakdownItem[] = [
        { label: UI_STRINGS.attacksPanelBabLabel || "Base Attack Bonus", value: baseAttackBonus },
        { label: (UI_STRINGS.attacksPanelAbilityModLabel || "Ability Modifier ({abilityAbbr})").replace("{abilityAbbr}", ABILITY_LABELS.find(al => al.value === 'dexterity')?.abbr || 'DEX'), value: abilityMod },
        { label: UI_STRINGS.attacksPanelSizeModLabel || "Size Modifier (Attack)", value: sizeMod },
    ];
    let totalBonusFromFeats = 0;
    aggregatedFeatEffects?.attackRollBonuses?.forEach(effect => {
        let applies = false;
        if (effect.appliesTo === 'all' || effect.appliesTo === 'ranged') applies = true;
        if (selectedWeapon && effect.weaponId === selectedWeapon.name) applies = true;
        
        if (applies && typeof effect.value === 'number') {
            totalBonusFromFeats += effect.value;
             components.push({label: effect.sourceFeat || (UI_STRINGS.attacksPanelFeatBonusLabel || "Feat Bonus"), value: effect.value});
        }
    });
    const total = baseAttackBonus + abilityMod + sizeMod + totalBonusFromFeats;
    components.push({ label: UI_STRINGS.infoDialogTotalLabel || "Total", value: total, isBold: true });
    return components;
}

function getRangedDamageBonusBreakdownComponents(
    UI_STRINGS: Record<string,string>, ABILITY_LABELS: any[],
    aggregatedFeatEffects: AggregatedFeatEffects | null, selectedWeapon?: Item | null
): GenericBreakdownItem[] {
    const components: GenericBreakdownItem[] = [];
    let totalBonusFromFeats = 0;
    aggregatedFeatEffects?.damageRollBonuses?.forEach(effect => {
         let applies = false;
        if (effect.appliesTo === 'all' || effect.appliesTo === 'ranged') applies = true;
        if (selectedWeapon && effect.weaponId === selectedWeapon.name) applies = true;

        if (applies && typeof effect.value === 'number') {
            totalBonusFromFeats += effect.value;
            components.push({label: effect.sourceFeat || (UI_STRINGS.attacksPanelFeatBonusLabel || "Feat Bonus"), value: effect.value});
        }
    });
    // Ranged damage typically doesn't add ability mod unless specific feats grant it (handled by feat effects).
    const total = totalBonusFromFeats;
    if (totalBonusFromFeats === 0) { // If no feat bonuses, add a placeholder if needed or keep it clean
        components.push({label: UI_STRINGS.attacksPanelNoAbilityDamageBonusRanged || "No Ability Bonus to Damage (Typical for Ranged)", value: 0});
    }
    components.push({ label: UI_STRINGS.infoDialogTotalLabel || "Total", value: total, isBold: true });
    return components;
}

    
