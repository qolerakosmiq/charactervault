
'use client';

import *as React from 'react';
import type { Character, BabBreakdownDetails, InitiativeBreakdownDetails, GrappleModifierBreakdownDetails, GrappleDamageBreakdownDetails, CharacterSize, InfoDialogContentType, AbilityScores, FeatDefinitionJsonData, AggregatedFeatEffects, Item, GenericBreakdownItem, AbilityName, DamageRollEffect } from '@/types/character';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Swords, Info, Loader2, Hand, ArrowRightLeft, Activity, Shield, Dices } from 'lucide-react';
import { getAbilityModifierByName, getBab, getSizeModifierAttack } from '@/lib/dnd-utils';
import { renderModifierValue } from '@/components/info-dialog-content/dialog-utils';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { RollDialogProps } from '@/components/RollDialog';

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
  onOpenRollDialog: (data: Omit<RollDialogProps, 'isOpen' | 'onOpenChange' | 'onRoll'>) => void;
}

const AttacksPanelComponent = ({
    attacksPanelData,
    aggregatedFeatEffects,
    allFeatDefinitions,
    onCharacterUpdate,
    onOpenAttackBonusInfoDialog,
    onOpenDamageBonusInfoDialog,
    onOpenRollDialog,
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

  const meleeWeapons = [{id: 'unarmed', name: UI_STRINGS.attacksPanelUnarmedOption || 'Unarmed', itemType: 'weapon' as const, weaponType: 'melee' as const, damage: UI_STRINGS.unarmedDamageDefault || '1d3', criticalRange: '20', criticalMultiplier: 'x2'},
                        ...(inventory.filter(item => item.itemType === 'weapon' && (item.weaponType === 'melee' || item.weaponType === 'melee-or-ranged')))];
  const rangedWeapons = inventory.filter(item => item.itemType === 'weapon' && (item.weaponType === 'ranged' || item.weaponType === 'melee-or-ranged'));

  const selectedMeleeWeapon = meleeWeapons.find(w => w.id === selectedMeleeWeaponId);
  const selectedRangedWeapon = rangedWeapons.find(w => w.id === selectedRangedWeaponId);
  
  const calculateFinalAttackBonus = (
    baseBab: number,
    abilityMod: number,
    sizeMod: number,
    weaponType: 'melee' | 'ranged' | 'unarmed',
    selectedWeapon?: Item | null,
    powerAttackValue: number = 0,
    combatExpertiseValue: number = 0
  ): number => {
    let totalBonus = baseBab + abilityMod + sizeMod;
    
    aggregatedFeatEffects.attackRollBonuses.forEach(effect => {
        let isGenericBonus = (effect.appliesTo === 'all' || effect.appliesTo === weaponType) && !effect.weaponId;
        if (weaponType === 'unarmed' && effect.appliesTo === 'unarmed' && !effect.weaponId) {
            isGenericBonus = true;
        }
        const isSpecificWeaponBonus = selectedWeapon && effect.weaponId === selectedWeapon.name;

        if ((isGenericBonus || isSpecificWeaponBonus) && typeof effect.value === 'number') {
            totalBonus += effect.value;
        }
    });

    if (powerAttackValue > 0 && (weaponType === 'melee' || weaponType === 'unarmed')) {
      totalBonus -= powerAttackValue;
    }
    if (combatExpertiseValue > 0 && (weaponType === 'melee' || weaponType === 'unarmed')) {
      totalBonus -= combatExpertiseValue;
    }
    return totalBonus;
  };
  
 const calculateFinalNumericalDamageBonus = (
    abilityMod: number, 
    weaponType: 'melee' | 'ranged' | 'unarmed',
    selectedWeapon?: Item | null, // Full item passed
    powerAttackValue: number = 0
  ): number => {
    let totalBonus = (weaponType === 'melee' || weaponType === 'unarmed') ? abilityMod : 0; // Dex usually not to ranged damage unless specific feat

    aggregatedFeatEffects.damageRollBonuses.forEach(effect => {
      // Only sum unconditional, numerical bonuses for this direct sum.
      // Conditional or dice-based damage is handled in the breakdown display.
      if (typeof effect.value !== 'number' || effect.condition) return; 

      let bonusApplies = false;
      if (effect.weaponId && selectedWeapon && effect.weaponId === selectedWeapon.name) {
          bonusApplies = true;
      } else if (!effect.weaponId) { // Generic bonus
          if (effect.appliesTo === 'all' || effect.appliesTo === weaponType) bonusApplies = true;
          if (weaponType === 'unarmed' && effect.appliesTo === 'unarmed') bonusApplies = true;
      }
      
      if (bonusApplies && effect.sourceFeat !== "Power Attack Effect") {
          totalBonus += effect.value;
      }
    });

    if (powerAttackValue > 0 && (weaponType === 'melee' || weaponType === 'unarmed')) {
      // Note: This assumes 1:1 for Power Attack damage. A more detailed system
      // would check for two-handed weapon use for 1.5x or 2x bonus.
      // The "Power Attack Effect" source is usually handled by the feat system's effect itself,
      // but if we are manually adding Power Attack bonus here, ensure it's not double counted.
      // For simplicity, the 'Power Attack Effect' source might be how the feat system grants it.
      // If Power Attack's numerical damage is already in damageRollBonuses, this manual add is redundant.
      // Let's assume powerAttackValue is the *direct* penalty chosen by user, and we derive damage from it here.
      totalBonus += powerAttackValue; // Simplified: 1x penalty for 1x damage.
    }
    return totalBonus;
  };


  let meleeAttackAbilityModForCalc = strMod;
  if (selectedMeleeWeapon?.isFinesseWeapon && dexMod > strMod) {
    meleeAttackAbilityModForCalc = dexMod;
  }
  const calculatedMeleeAttackBonus = calculateFinalAttackBonus(totalBabWithModifier[0], meleeAttackAbilityModForCalc, actualSizeModAttack, selectedMeleeWeaponId === 'unarmed' ? 'unarmed' : 'melee', selectedMeleeWeapon, localPowerAttackValue, localCombatExpertiseValue);
  const calculatedMeleeNumericalDamageBonus = calculateFinalNumericalDamageBonus(strMod, selectedMeleeWeaponId === 'unarmed' ? 'unarmed' : 'melee', selectedMeleeWeapon, localPowerAttackValue);

  const calculatedRangedAttackBonus = selectedRangedWeapon ? calculateFinalAttackBonus(totalBabWithModifier[0], dexMod, actualSizeModAttack, 'ranged', selectedRangedWeapon) : 0;
  const calculatedRangedNumericalDamageBonus = selectedRangedWeapon ? calculateFinalNumericalDamageBonus(0, 'ranged', selectedRangedWeapon) : 0; 

  const hasPowerAttackFeat = feats.some(f => f.definitionId === 'power-attack');
  const hasCombatExpertiseFeat = feats.some(f => f.definitionId === 'combat-expertise');

  const getBabBreakdownComponents = (): GenericBreakdownItem[] => {
    const components: GenericBreakdownItem[] = [];
    components.push({ label: UI_STRINGS.attacksPanelBabBaseLabel || "Base BAB (from Classes)", value: baseBabArray.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/') });
    if (localBabMiscModifier !== 0) {
        components.push({ label: UI_STRINGS.attacksPanelBabMiscModLabel || "Misc Modifier", value: localBabMiscModifier });
    }
    components.push({ label: UI_STRINGS.infoDialogTitleTotalBabBreakdown || "Total BAB", value: totalBabWithModifier.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/'), isBold: true });
    return components;
  };
  const handleOpenBabInfo = () => {
    const components = getBabBreakdownComponents();
    onOpenAttackBonusInfoDialog({type: 'genericNumericalBreakdown', titleKey: 'infoDialogTitleTotalBabBreakdown', components});
  };

  const getMeleeAttackBonusBreakdownComponentsInternal = (): GenericBreakdownItem[] => {
    const components: GenericBreakdownItem[] = [
        { label: UI_STRINGS.attacksPanelBabLabel || "Base Attack Bonus", value: totalBabWithModifier[0] },
        { label: (UI_STRINGS.attacksPanelAbilityModLabel || "Ability Mod ({abilityAbbr})").replace("{abilityAbbr}", ABILITY_LABELS.find(al => al.value === (selectedMeleeWeapon?.isFinesseWeapon && dexMod > strMod ? 'dexterity' : 'strength'))?.abbr || (selectedMeleeWeapon?.isFinesseWeapon && dexMod > strMod ? 'DEX' : 'STR')), value: meleeAttackAbilityModForCalc },
        { label: UI_STRINGS.attacksPanelSizeModLabel || "Size Mod (Attack)", value: actualSizeModAttack },
    ];
    aggregatedFeatEffects?.attackRollBonuses?.forEach(effect => {
        let bonusApplies = false;
        const weaponTypeForEffect: 'melee' | 'unarmed' = selectedMeleeWeaponId === 'unarmed' ? 'unarmed' : 'melee';
        if (effect.weaponId && selectedMeleeWeapon && effect.weaponId === selectedMeleeWeapon.name) {
            bonusApplies = true;
        } else if (!effect.weaponId) {
            if (effect.appliesTo === 'all' || effect.appliesTo === weaponTypeForEffect) bonusApplies = true;
        }
        
        if (bonusApplies && typeof effect.value === 'number' && effect.sourceFeat !== "Power Attack Effect" && effect.sourceFeat !== "Combat Expertise Effect") {
            let label = effect.sourceFeat || (UI_STRINGS.attacksPanelFeatBonusLabel || "Feat Bonus");
            if(effect.condition) {
                const conditionTextKey = `condition_${effect.condition.toLowerCase().replace(/\s+/g, '_')}` as keyof typeof UI_STRINGS;
                const conditionText = UI_STRINGS[conditionTextKey] || effect.condition;
                label = `${label} (${conditionText})`;
            }
            components.push({label, value: effect.value});
        }
    });
    if (localPowerAttackValue > 0) {
       components.push({ label: UI_STRINGS.powerAttackPenaltyLabel || "Power Attack Penalty", value: -localPowerAttackValue });
    }
    if (localCombatExpertiseValue > 0) {
       components.push({ label: UI_STRINGS.combatExpertisePenaltyLabel || "Combat Expertise Penalty", value: -localCombatExpertiseValue });
    }
    const total = components.filter(c => typeof c.value === 'number').reduce((sum, comp) => sum + (comp.value as number), 0);
    components.push({ label: UI_STRINGS.infoDialogTotalLabel || "Total", value: total, isBold: true });
    return components;
  };
  const handleOpenMeleeAttackInfo = () => {
    const components = getMeleeAttackBonusBreakdownComponentsInternal();
    onOpenAttackBonusInfoDialog({type: 'genericNumericalBreakdown', titleKey: 'infoDialogTitleMeleeAttackBreakdown', components});
  };
  
  const getMeleeDamageBonusBreakdownComponentsInternal = (): GenericBreakdownItem[] => {
    const components: GenericBreakdownItem[] = [];
    const baseDmg = selectedMeleeWeapon?.damage || (selectedMeleeWeaponId === 'unarmed' ? (UI_STRINGS.unarmedDamageDefault || '1d3') : 'N/A');
    components.push({ label: UI_STRINGS.attacksPanelBaseWeaponDamageLabel || "Base Weapon Damage", value: baseDmg });
    
    if (strMod !== 0) {
        components.push({ label: (UI_STRINGS.attacksPanelAbilityModLabel || "Ability Mod ({abilityAbbr})").replace("{abilityAbbr}", ABILITY_LABELS.find(al => al.value === 'strength')?.abbr || 'STR'), value: strMod });
    }
    
    aggregatedFeatEffects?.damageRollBonuses?.forEach(effect => {
        let bonusApplies = false;
        const weaponTypeForEffect: 'melee' | 'unarmed' = selectedMeleeWeaponId === 'unarmed' ? 'unarmed' : 'melee';

        if (effect.weaponId && selectedMeleeWeapon && effect.weaponId === selectedMeleeWeapon.name) {
            bonusApplies = true;
        } else if (!effect.weaponId) { // Generic bonus
            if (effect.appliesTo === 'all' || effect.appliesTo === weaponTypeForEffect) bonusApplies = true;
        }

        if (bonusApplies) {
            let label = effect.sourceFeat || (UI_STRINGS.attacksPanelFeatBonusLabel || "Feat Bonus");
            if(effect.condition) {
                const conditionTextKey = `condition_${effect.condition.toLowerCase().replace(/\s+/g, '_')}` as keyof typeof UI_STRINGS;
                const conditionText = UI_STRINGS[conditionTextKey] || effect.condition;
                label = `${label} (${conditionText})`;
            }
            const valueDisplay = typeof effect.value === 'string' ? effect.value : renderModifierValue(effect.value as number);
            // For "Power Attack Effect" by the feat system, it will be included here with its label.
            components.push({label, value: valueDisplay });
        }
    });

    // If Power Attack is handled manually via localPowerAttackValue and *not* via a direct feat effect in damageRollBonuses
    // ensure it's added or correctly represented. The current calculateFinalNumericalDamageBonus adds it.
    // This breakdown should reflect all components. If calculateFinal... adds it, this breakdown should too.
    // The refactor to `calculateFinalNumericalDamageBonus` ensures that unconditional numeric bonuses are summed.
    // Conditional dice or dice-based bonuses (like Sneak Attack) are displayed as their string value here.
    
    const totalNumericBonus = calculateFinalNumericalDamageBonus(strMod, selectedMeleeWeaponId === 'unarmed' ? 'unarmed' : 'melee', selectedMeleeWeapon, localPowerAttackValue);
    components.push({ label: UI_STRINGS.infoDialogTotalNumericBonusLabel || "Total Numeric Bonus", value: totalNumericBonus, isBold: true });
    return components;
  };
  const handleOpenMeleeDamageInfo = () => {
    const components = getMeleeDamageBonusBreakdownComponentsInternal();
    onOpenDamageBonusInfoDialog({type: 'genericNumericalBreakdown', titleKey: 'infoDialogTitleMeleeDamageBreakdown', components});
  };

  const getRangedAttackBonusBreakdownComponentsInternal = (): GenericBreakdownItem[] => {
    if (!selectedRangedWeapon) return [{label: UI_STRINGS.attacksPanelNoRangedWeapons || "No Ranged Weapon", value: ""}];
    const components: GenericBreakdownItem[] = [
        { label: UI_STRINGS.attacksPanelBabLabel || "Base Attack Bonus", value: totalBabWithModifier[0] },
        { label: (UI_STRINGS.attacksPanelAbilityModLabel || "Ability Mod ({abilityAbbr})").replace("{abilityAbbr}", ABILITY_LABELS.find(al => al.value === 'dexterity')?.abbr || 'DEX'), value: dexMod },
        { label: UI_STRINGS.attacksPanelSizeModLabel || "Size Mod (Attack)", value: actualSizeModAttack },
    ];
    aggregatedFeatEffects?.attackRollBonuses?.forEach(effect => {
        let bonusApplies = false;
        if (effect.weaponId && selectedRangedWeapon && effect.weaponId === selectedRangedWeapon.name) {
            bonusApplies = true;
        } else if (!effect.weaponId) {
             if (effect.appliesTo === 'all' || effect.appliesTo === 'ranged') bonusApplies = true;
        }
        
        if (bonusApplies && typeof effect.value === 'number') {
             let label = effect.sourceFeat || (UI_STRINGS.attacksPanelFeatBonusLabel || "Feat Bonus");
             if(effect.condition) {
                const conditionTextKey = `condition_${effect.condition.toLowerCase().replace(/\s+/g, '_')}` as keyof typeof UI_STRINGS;
                const conditionText = UI_STRINGS[conditionTextKey] || effect.condition;
                label = `${label} (${conditionText})`;
            }
             components.push({label, value: effect.value});
        }
    });
    const total = components.filter(c => typeof c.value === 'number').reduce((sum, comp) => sum + (comp.value as number), 0);
    components.push({ label: UI_STRINGS.infoDialogTotalLabel || "Total", value: total, isBold: true });
    return components;
  };
  const handleOpenRangedAttackInfo = () => {
    const components = getRangedAttackBonusBreakdownComponentsInternal();
    onOpenAttackBonusInfoDialog({type: 'genericNumericalBreakdown', titleKey: 'infoDialogTitleRangedAttackBreakdown', components});
  };

  const getRangedDamageBonusBreakdownComponentsInternal = (): GenericBreakdownItem[] => {
    if (!selectedRangedWeapon) return [{label: UI_STRINGS.attacksPanelNoRangedWeapons || "No Ranged Weapon", value: ""}];
    const components: GenericBreakdownItem[] = [];
    const baseDmg = selectedRangedWeapon.damage || 'N/A';
    components.push({ label: UI_STRINGS.attacksPanelBaseWeaponDamageLabel || "Base Weapon Damage", value: baseDmg });
    
    let totalNumericBonusFromEffects = 0; // Accumulator for numerical unconditional bonuses

    aggregatedFeatEffects?.damageRollBonuses?.forEach(effect => {
        let bonusApplies = false;
        if (effect.weaponId && selectedRangedWeapon && effect.weaponId === selectedRangedWeapon.name) {
            bonusApplies = true;
        } else if (!effect.weaponId) { // Generic bonus
            if (effect.appliesTo === 'all' || effect.appliesTo === 'ranged') bonusApplies = true;
        }

        if (bonusApplies) {
            let label = effect.sourceFeat || (UI_STRINGS.attacksPanelFeatBonusLabel || "Feat Bonus");
            if(effect.condition) {
                const conditionTextKey = `condition_${effect.condition.toLowerCase().replace(/\s+/g, '_')}` as keyof typeof UI_STRINGS;
                const conditionText = UI_STRINGS[conditionTextKey] || effect.condition;
                label = `${label} (${conditionText})`;
            }
            const valueDisplay = typeof effect.value === 'string' ? effect.value : renderModifierValue(effect.value as number);
            components.push({label, value: valueDisplay });

            if (typeof effect.value === 'number' && !effect.condition) {
                totalNumericBonusFromEffects += effect.value;
            }
        }
    });
    
    components.push({ label: UI_STRINGS.infoDialogTotalNumericBonusLabel || "Total Numeric Bonus", value: totalNumericBonusFromEffects, isBold: true });
    return components;
  };
  const handleOpenRangedDamageInfo = () => {
    const components = getRangedDamageBonusBreakdownComponentsInternal();
    onOpenDamageBonusInfoDialog({type: 'genericNumericalBreakdown', titleKey: 'infoDialogTitleRangedDamageBreakdown', components});
  };


  const handleOpenMeleeAttackRollDialog = () => {
    const weaponName = selectedMeleeWeapon?.name || UI_STRINGS.attacksPanelUnarmedOption || "Unarmed";
    const breakdown = getMeleeAttackBonusBreakdownComponentsInternal();
    onOpenRollDialog({
      dialogTitle: (UI_STRINGS.rollDialogTitleMeleeAttackFormat || "Roll Melee Attack ({weaponName})").replace("{weaponName}", weaponName),
      rollType: `melee_attack_${selectedMeleeWeaponId}`,
      baseModifier: calculatedMeleeAttackBonus,
      calculationBreakdown: breakdown,
    });
  };

  const handleOpenRangedAttackRollDialog = () => {
    if (!selectedRangedWeapon) return;
    const weaponName = selectedRangedWeapon.name;
    const breakdown = getRangedAttackBonusBreakdownComponentsInternal();
    onOpenRollDialog({
      dialogTitle: (UI_STRINGS.rollDialogTitleRangedAttackFormat || "Roll Ranged Attack ({weaponName})").replace("{weaponName}", weaponName),
      rollType: `ranged_attack_${selectedRangedWeaponId}`,
      baseModifier: calculatedRangedAttackBonus,
      calculationBreakdown: breakdown,
    });
  };

  const handleOpenMeleeDamageRollDialog = () => {
    if (!selectedMeleeWeapon) return;
    const weaponName = selectedMeleeWeapon.name;
    const weaponDamageDiceString = selectedMeleeWeapon.damage || (selectedMeleeWeapon.id === 'unarmed' ? (UI_STRINGS.unarmedDamageDefault || '1d3') : 'N/A');
    const breakdown = getMeleeDamageBonusBreakdownComponentsInternal();
    onOpenRollDialog({
      dialogTitle: (UI_STRINGS.rollDialogTitleMeleeDamageFormat || "Melee Damage ({weaponName}: {dice})")
        .replace("{weaponName}", weaponName)
        .replace("{dice}", weaponDamageDiceString),
      rollType: `damage_roll_melee_${selectedMeleeWeapon.id}`,
      baseModifier: calculatedMeleeNumericalDamageBonus,
      calculationBreakdown: breakdown,
      weaponDamageDice: weaponDamageDiceString,
    });
  };

  const handleOpenRangedDamageRollDialog = () => {
    if (!selectedRangedWeapon) return;
    const weaponName = selectedRangedWeapon.name;
    const weaponDamageDiceString = selectedRangedWeapon.damage || 'N/A';
    const breakdown = getRangedDamageBonusBreakdownComponentsInternal();
    onOpenRollDialog({
      dialogTitle: (UI_STRINGS.rollDialogTitleRangedDamageFormat || "Ranged Damage ({weaponName}: {dice})")
        .replace("{weaponName}", weaponName)
        .replace("{dice}", weaponDamageDiceString),
      rollType: `damage_roll_ranged_${selectedRangedWeapon.id}`,
      baseModifier: calculatedRangedNumericalDamageBonus, 
      calculationBreakdown: breakdown,
      weaponDamageDice: weaponDamageDiceString,
    });
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
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-0.5 text-muted-foreground hover:text-foreground" onClick={handleOpenMeleeAttackInfo}>
                    <Info className="h-4 w-4" />
                  </Button>
                   <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 ml-0.5 text-muted-foreground hover:text-primary"
                      onClick={handleOpenMeleeAttackRollDialog}
                      aria-label={(UI_STRINGS.rollDialogMeleeAttackAriaLabel || "Roll Melee Attack with {weaponName}").replace("{weaponName}", selectedMeleeWeapon?.name || 'Unarmed')}
                    >
                    <Dices className="h-4 w-4" />
                  </Button>
              </div>
            </div>
            <div className="p-2 border rounded-md bg-muted/10 text-center">
              <Label className="text-sm font-medium block">{UI_STRINGS.attacksPanelDamageBonusLabel}</Label>
               <div className="flex items-center justify-center">
                <p className="text-lg font-bold text-accent">{renderModifierValue(calculatedMeleeNumericalDamageBonus)}</p>
                 <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={handleOpenMeleeDamageInfo}>
                    <Info className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 ml-0.5 text-muted-foreground hover:text-primary"
                    onClick={handleOpenMeleeDamageRollDialog}
                    disabled={!selectedMeleeWeapon}
                    aria-label={(UI_STRINGS.rollDialogDamageAriaLabel || "Roll Damage for {weaponName}")
                      .replace("{weaponName}", selectedMeleeWeapon?.name || UI_STRINGS.attacksPanelUnarmedOption || "Unarmed")}
                  >
                    <Dices className="h-4 w-4" />
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
                <p className="text-lg font-bold text-accent">{selectedRangedWeapon ? (calculatedRangedAttackBonus >= 0 ? '+' : '') + calculatedRangedAttackBonus : 'N/A'}</p>
                 <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-0.5 text-muted-foreground hover:text-foreground" onClick={handleOpenRangedAttackInfo} disabled={!selectedRangedWeapon}>
                    <Info className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 ml-0.5 text-muted-foreground hover:text-primary"
                    onClick={handleOpenRangedAttackRollDialog}
                    disabled={!selectedRangedWeapon}
                    aria-label={(UI_STRINGS.rollDialogRangedAttackAriaLabel || "Roll Ranged Attack with {weaponName}").replace("{weaponName}", selectedRangedWeapon?.name || '')}
                  >
                    <Dices className="h-4 w-4" />
                  </Button>
                </div>
            </div>
            <div className="p-2 border rounded-md bg-muted/10 text-center">
              <Label className="text-sm font-medium block">{UI_STRINGS.attacksPanelDamageBonusLabel}</Label>
              <div className="flex items-center justify-center">
                <p className="text-lg font-bold text-accent">{selectedRangedWeapon ? renderModifierValue(calculatedRangedNumericalDamageBonus) : 'N/A'}</p>
                 <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={handleOpenRangedDamageInfo} disabled={!selectedRangedWeapon}>
                    <Info className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 ml-0.5 text-muted-foreground hover:text-primary"
                    onClick={handleOpenRangedDamageRollDialog}
                    disabled={!selectedRangedWeapon}
                    aria-label={(UI_STRINGS.rollDialogDamageAriaLabel || "Roll Damage for {weaponName}")
                      .replace("{weaponName}", selectedRangedWeapon?.name || '')}
                  >
                    <Dices className="h-4 w-4" />
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

    
    