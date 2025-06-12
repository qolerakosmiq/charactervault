
'use client';

import *as React from 'react';
import type {
  Character,
  InfoDialogContentType,
  AggregatedFeatEffects,
  GenericBreakdownItem,
  AbilityName,
  Item,
  FeatDefinitionJsonData,
  CombatPanelCharacterData,
  AttackRollEffect,
  DamageRollEffect
} from '@/types/character-core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Swords, Info, Loader2, Dices, Hand, ArrowRightLeft, Activity, Shield as ShieldIcon } from 'lucide-react';
import { getAbilityModifierByName, getBab, calculateInitiative, calculateGrapple, getSizeModifierGrapple, getUnarmedGrappleDamage, getSizeModifierAttack } from '@/lib/dnd-utils';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import type { RollDialogProps } from '@/components/RollDialog';
import { useDefinitionsStore } from '@/lib/definitions-store';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { renderModifierValue, sectionHeadingClass } from '@/components/info-dialog-content/dialog-utils';

const DEBOUNCE_DELAY = 400;

export type CombatFieldKey = keyof Pick<Character,
  'babMiscModifier' | 'initiativeMiscModifier' | 'grappleMiscModifier' |
  'grappleDamage_bonus' | 'grappleWeaponChoice' | 'powerAttackValue' | 'combatExpertiseValue'
>;

export interface CombatPanelProps {
  combatData: CombatPanelCharacterData;
  aggregatedFeatEffects: AggregatedFeatEffects | null;
  allFeatDefinitions: readonly (FeatDefinitionJsonData & { isCustom?: boolean })[];
  onCharacterUpdate: (field: CombatFieldKey, value: any) => void;
  onOpenCombatStatInfoDialog: (contentType: InfoDialogContentType) => void;
  onOpenRollDialog: (data: Omit<RollDialogProps, 'isOpen' | 'onOpenChange' | 'onRoll'>) => void;
}

const CombatPanelComponent = ({
  combatData,
  aggregatedFeatEffects,
  allFeatDefinitions,
  onCharacterUpdate,
  onOpenCombatStatInfoDialog,
  onOpenRollDialog
}: CombatPanelProps) => {
  const { translations, isLoading: translationsLoading } = useI18n();
  const { rerollTwentiesForChecks } = useDefinitionsStore(state => ({
    rerollTwentiesForChecks: state.rerollTwentiesForChecks,
  }));

  const [selectedMeleeWeaponId, setSelectedMeleeWeaponId] = React.useState<string>('unarmed');
  const [selectedRangedWeaponId, setSelectedRangedWeaponId] = React.useState<string>('none');

  const [localBabMiscModifier, setLocalBabMiscModifier] = useDebouncedFormField(
    combatData.babMiscModifier || 0, (value) => onCharacterUpdate('babMiscModifier', value), DEBOUNCE_DELAY
  );
  const [localInitiativeMiscModifier, setLocalInitiativeMiscModifier] = useDebouncedFormField(
    combatData.initiativeMiscModifier || 0, (value) => onCharacterUpdate('initiativeMiscModifier', value), DEBOUNCE_DELAY
  );
  const [localGrappleMiscModifier, setLocalGrappleMiscModifier] = useDebouncedFormField(
    combatData.grappleMiscModifier || 0, (value) => onCharacterUpdate('grappleMiscModifier', value), DEBOUNCE_DELAY
  );
  const [localGrappleDamageBonus, setLocalGrappleDamageBonus] = useDebouncedFormField(
    combatData.grappleDamage_bonus || 0, (value) => onCharacterUpdate('grappleDamage_bonus', value), DEBOUNCE_DELAY
  );
  const [localGrappleWeaponChoice, setLocalGrappleWeaponChoice] = useDebouncedFormField(
    combatData.grappleWeaponChoice || 'unarmed', (value) => onCharacterUpdate('grappleWeaponChoice', value), DEBOUNCE_DELAY
  );
  const [localPowerAttackValue, setLocalPowerAttackValue] = useDebouncedFormField(
    combatData.powerAttackValue || 0, (value) => onCharacterUpdate('powerAttackValue', value), DEBOUNCE_DELAY
  );
  const [localCombatExpertiseValue, setLocalCombatExpertiseValue] = useDebouncedFormField(
    combatData.combatExpertiseValue || 0, (value) => onCharacterUpdate('combatExpertiseValue', value), DEBOUNCE_DELAY
  );

  const getActiveAttackBonuses = React.useCallback((
    weaponType: 'melee' | 'ranged' | 'unarmed',
    selectedWeaponItem?: Item | null
  ): AttackRollEffect[] => {
    if (!aggregatedFeatEffects?.attackRollBonuses) return [];
    return aggregatedFeatEffects.attackRollBonuses.filter(effect => {
      if (!effect.isActive || typeof effect.value !== 'number') return false;
      if (effect.appliesTo === 'all') return true;
      if (effect.appliesTo === weaponType) return true;
      if (effect.appliesTo && effect.appliesTo.startsWith('weaponName:') && selectedWeaponItem) {
        return effect.appliesTo.substring('weaponName:'.length) === selectedWeaponItem.name;
      }
      if (effect.weaponId && selectedWeaponItem) {
        return effect.weaponId === selectedWeaponItem.name; 
      }
      return false;
    });
  }, [aggregatedFeatEffects?.attackRollBonuses]);

  const calculateFinalAttackBonus = React.useCallback((
    baseBab: number,
    abilityMod: number,
    sizeMod: number,
    weaponType: 'melee' | 'ranged' | 'unarmed',
    selectedWeaponItem?: Item | null,
    powerAttackVal: number = 0,
    combatExpertiseVal: number = 0
  ): number => {
    let totalBonus = baseBab + abilityMod + sizeMod;
    const activeBonuses = getActiveAttackBonuses(weaponType, selectedWeaponItem);
    activeBonuses.forEach(effect => {
      if (typeof effect.value === 'number') totalBonus += effect.value;
    });

    if (powerAttackVal > 0 && (weaponType === 'melee' || weaponType === 'unarmed')) {
      totalBonus -= powerAttackVal;
    }
    if (combatExpertiseVal > 0 && (weaponType === 'melee' || weaponType === 'unarmed')) {
      totalBonus -= combatExpertiseVal;
    }
    return totalBonus;
  }, [getActiveAttackBonuses]);

  const getActiveDamageBonuses = React.useCallback((
    weaponType: 'melee' | 'ranged' | 'unarmed',
    selectedWeaponItem?: Item | null
  ): DamageRollEffect[] => {
     if (!aggregatedFeatEffects?.damageRollBonuses) return [];
     return aggregatedFeatEffects.damageRollBonuses.filter(effect => {
      if (!effect.isActive) return false;
      if (effect.appliesTo === 'all') return true;
      if (effect.appliesTo === weaponType) return true;
      if (effect.appliesTo?.startsWith('weaponName:') && selectedWeaponItem) {
        return effect.appliesTo.substring('weaponName:'.length) === selectedWeaponItem.name;
      }
      if (effect.weaponId && selectedWeaponItem) {
        return effect.weaponId === selectedWeaponItem.name;
      }
      return false;
    });
  }, [aggregatedFeatEffects?.damageRollBonuses]);

 const calculateFinalNumericalDamageBonus = React.useCallback((
    baseAbilityMod: number,
    weaponType: 'melee' | 'ranged' | 'unarmed',
    selectedWeaponItem?: Item | null,
    powerAttackVal: number = 0
  ): number => {
    let totalBonus = (weaponType === 'melee' || weaponType === 'unarmed') ? baseAbilityMod : 0; 
    const activeBonuses = getActiveDamageBonuses(weaponType, selectedWeaponItem);

    activeBonuses.forEach(effect => {
      if (typeof effect.value === 'number') {
        totalBonus += effect.value;
      }
    });

    if (powerAttackVal > 0 && (weaponType === 'melee' || weaponType === 'unarmed')) {
      
      totalBonus += powerAttackVal;
    }
    return totalBonus;
  }, [getActiveDamageBonuses]);

  if (!combatData || translationsLoading || !translations || !aggregatedFeatEffects || !allFeatDefinitions) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Swords className="h-8 w-8 text-primary" />
            <Skeleton className="h-7 w-1/2" />
          </div>
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {[...Array(6)].map((_, i) => <Skeleton key={`combat-panel-skel-${i}`} className="h-32 rounded-md" />)}
        </CardContent>
      </Card>
    );
  }

  const { DND_CLASSES, SIZES, UI_STRINGS, ABILITY_LABELS } = translations;

  const abilityScores = combatData.abilityScores || {};
  const classes = combatData.classes || [];
  const strModifier = getAbilityModifierByName(abilityScores, 'strength');
  const dexModifier = getAbilityModifierByName(abilityScores, 'dexterity');
  const sizeModGrapple = combatData.size ? getSizeModifierGrapple(combatData.size, SIZES) : 0;
  const actualSizeModAttack = combatData.sizeModifierAttack ?? (combatData.size ? getSizeModifierAttack(combatData.size, SIZES) : 0);

  const baseBabArray = getBab(classes, DND_CLASSES);
  const totalBabWithModifier = baseBabArray.map(bab => bab + (localBabMiscModifier || 0));
  const maxBabForSpinners = totalBabWithModifier[0] || 0;

  let unarmedBaseDamageFromFeat = UI_STRINGS.unarmedDamageDefault || '1d3';
  const monkUnarmedDamageEffect = aggregatedFeatEffects?.modifiedMechanics?.unarmedDamage;
  if (monkUnarmedDamageEffect?.isActive && typeof monkUnarmedDamageEffect.value === 'string') {
      unarmedBaseDamageFromFeat = monkUnarmedDamageEffect.value;
  }
  
  // Flurry of Blows
  const flurryPenalty = aggregatedFeatEffects.modifiedMechanics?.flurryOfBlowsAttackPenalty?.isActive
    ? (aggregatedFeatEffects.modifiedMechanics.flurryOfBlowsAttackPenalty.value as number ?? 0)
    : 0;
  const numFlurryExtraAttacks = aggregatedFeatEffects.modifiedMechanics?.flurryOfBlowsNumExtraAttacks?.isActive
    ? (aggregatedFeatEffects.modifiedMechanics.flurryOfBlowsNumExtraAttacks.value as number ?? 0)
    : 0;

  let flurryAttackSequence: number[] = [];
  if (numFlurryExtraAttacks > 0) {
    const flurryBabBase = totalBabWithModifier.map(bab => bab + flurryPenalty);
    flurryAttackSequence.push(flurryBabBase[0]); // First attack
    for(let i=0; i < numFlurryExtraAttacks; i++) {
      flurryAttackSequence.push(flurryBabBase[0]); // Extra attacks at highest BAB (with penalty)
    }
    // Add remaining standard iterative attacks (with penalty)
    for(let i=1; i < flurryBabBase.length; i++) {
      flurryAttackSequence.push(flurryBabBase[i]);
    }
  }


  const meleeWeapons: Item[] = [{id: 'unarmed', name: UI_STRINGS.attacksPanelUnarmedOption || 'Unarmed', itemType: 'weapon' as const, weaponType: 'melee' as const, damage: unarmedBaseDamageFromFeat, criticalRange: '20', criticalMultiplier: 'x2', quantity: 1},
                        ...(combatData.inventory?.filter(item => item.itemType === 'weapon' && (item.weaponType === 'melee' || item.weaponType === 'melee-or-ranged')) || [])];
  const rangedWeapons: Item[] = combatData.inventory?.filter(item => item.itemType === 'weapon' && (item.weaponType === 'ranged' || item.weaponType === 'melee-or-ranged')) || [];

  const selectedMeleeWeapon = meleeWeapons.find(w => w.id === selectedMeleeWeaponId);
  const selectedRangedWeapon = rangedWeapons.find(w => w.id === selectedRangedWeaponId);

  const featInitiativeBonus = aggregatedFeatEffects?.initiativeBonus || 0;
  const baseInitiative = calculateInitiative(dexModifier, localInitiativeMiscModifier || 0) + featInitiativeBonus;

  const featGrappleBonus = aggregatedFeatEffects?.attackRollBonuses?.filter(b => b.appliesTo === 'grapple' && b.isActive).reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0) || 0;
  const baseGrappleModifier = calculateGrapple(classes, strModifier, sizeModGrapple, DND_CLASSES);
  const totalGrappleModifier = baseGrappleModifier + (localGrappleMiscModifier || 0) + featGrappleBonus;

  const grappleDamageBaseNotes = combatData.grappleDamage_baseNotes || getUnarmedGrappleDamage(combatData.size, SIZES);
  const grappleDamageBaseDice = grappleDamageBaseNotes.split(' ')[0] || '0';
  const totalNumericGrappleBonus = strModifier + (localGrappleDamageBonus || 0);
  const displayedGrappleDamageTotal = `${grappleDamageBaseDice}${totalNumericGrappleBonus !== 0 ? `${totalNumericGrappleBonus >= 0 ? '+' : ''}${totalNumericGrappleBonus}` : ''}`;

  let meleeAttackAbilityModForCalc = strModifier;
  if (selectedMeleeWeapon?.isFinesseWeapon && dexModifier > strModifier) {
    meleeAttackAbilityModForCalc = dexModifier;
  }
  const calculatedMeleeAttackBonus = calculateFinalAttackBonus(totalBabWithModifier[0], meleeAttackAbilityModForCalc, actualSizeModAttack, selectedMeleeWeaponId === 'unarmed' ? 'unarmed' : 'melee', selectedMeleeWeapon, localPowerAttackValue, localCombatExpertiseValue);
  const calculatedMeleeNumericalDamageBonus = calculateFinalNumericalDamageBonus(strModifier, selectedMeleeWeaponId === 'unarmed' ? 'unarmed' : 'melee', selectedMeleeWeapon, localPowerAttackValue);

  const calculatedRangedAttackBonus = selectedRangedWeapon ? calculateFinalAttackBonus(totalBabWithModifier[0], dexModifier, actualSizeModAttack, 'ranged', selectedRangedWeapon) : 0;
  const calculatedRangedNumericalDamageBonus = selectedRangedWeapon ? calculateFinalNumericalDamageBonus(0, 'ranged', selectedRangedWeapon) : 0; 

  const hasPowerAttackFeat = combatData.feats?.some(f => f.definitionId === 'power-attack') || false;
  const hasCombatExpertiseFeat = combatData.feats?.some(f => f.definitionId === 'combat-expertise') || false;

  const handleBabInfo = () => onOpenCombatStatInfoDialog({ type: 'babBreakdown' });
  const handleInitiativeInfo = () => onOpenCombatStatInfoDialog({ type: 'initiativeBreakdown' });
  const handleGrappleModifierInfo = () => onOpenCombatStatInfoDialog({ type: 'grappleModifierBreakdown' });
  const handleGrappleDamageInfo = () => onOpenCombatStatInfoDialog({ type: 'grappleDamageBreakdown' });

  const getMeleeAttackBonusBreakdownComponentsInternal = React.useCallback((): GenericBreakdownItem[] => {
    const components: GenericBreakdownItem[] = [
        { label: UI_STRINGS.attacksPanelBabLabel || "Base Attack Bonus", value: totalBabWithModifier[0] },
        { label: (UI_STRINGS.attacksPanelAbilityModLabel || "Ability Mod ({abilityAbbr})").replace("{abilityAbbr}", ABILITY_LABELS.find(al => al.value === (selectedMeleeWeapon?.isFinesseWeapon && dexModifier > strModifier ? 'dexterity' : 'strength'))?.abbr || (selectedMeleeWeapon?.isFinesseWeapon && dexModifier > strModifier ? 'DEX' : 'STR')), value: meleeAttackAbilityModForCalc },
        { label: UI_STRINGS.attacksPanelSizeModLabel || "Size Mod (Attack)", value: actualSizeModAttack },
    ];
    const activeBonuses = getActiveAttackBonuses(selectedMeleeWeaponId === 'unarmed' ? 'unarmed' : 'melee', selectedMeleeWeapon);
    activeBonuses.forEach(effect => {
        let label = effect.sourceFeat || (UI_STRINGS.attacksPanelFeatBonusLabel || "Feat Bonus");
        if(effect.condition) {
            const conditionTextKey = `condition_${effect.condition.toLowerCase().replace(/\s+/g, '_')}` as keyof typeof UI_STRINGS;
            const conditionText = UI_STRINGS[conditionTextKey] || effect.condition;
            label = `${label} (${conditionText})`;
        }
        components.push({label, value: effect.value});
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
  }, [UI_STRINGS, totalBabWithModifier, meleeAttackAbilityModForCalc, actualSizeModAttack, selectedMeleeWeaponId, selectedMeleeWeapon, getActiveAttackBonuses, localPowerAttackValue, localCombatExpertiseValue, ABILITY_LABELS, dexModifier, strModifier]);

  const handleOpenMeleeAttackInfo = () => {
    const components = getMeleeAttackBonusBreakdownComponentsInternal();
    onOpenCombatStatInfoDialog({type: 'genericNumericalBreakdown', titleKey: 'infoDialogTitleMeleeAttackBreakdown', components});
  };

  const getMeleeDamageBonusBreakdownComponentsInternal = React.useCallback((): GenericBreakdownItem[] => {
    const components: GenericBreakdownItem[] = [];
    
    let baseDmg = selectedMeleeWeapon?.damage || (selectedMeleeWeaponId === 'unarmed' ? unarmedBaseDamageFromFeat : 'N/A');
    components.push({ label: UI_STRINGS.attacksPanelBaseWeaponDamageLabel || "Base Weapon Damage", value: baseDmg, isRawValue: true });

    if (strModifier !== 0 && (selectedMeleeWeaponId === 'unarmed' || selectedMeleeWeapon?.weaponType === 'melee' || selectedMeleeWeapon?.weaponType === 'melee-or-ranged')) {
        components.push({ label: (UI_STRINGS.attacksPanelAbilityModLabel || "Ability Mod ({abilityAbbr})").replace("{abilityAbbr}", ABILITY_LABELS.find(al => al.value === 'strength')?.abbr || 'STR'), value: strModifier });
    }

    const activeBonuses = getActiveDamageBonuses(selectedMeleeWeaponId === 'unarmed' ? 'unarmed' : 'melee', selectedMeleeWeapon);
    activeBonuses.forEach(effect => {
        let label = effect.sourceFeat || (UI_STRINGS.attacksPanelFeatBonusLabel || "Feat Bonus");
        if(effect.condition) {
            const conditionTextKey = `condition_${effect.condition.toLowerCase().replace(/\s+/g, '_')}` as keyof typeof UI_STRINGS;
            const conditionText = UI_STRINGS[conditionTextKey] || effect.condition;
            label = `${label} (${conditionText})`;
        }
        
        components.push({label, value: effect.value, isRawValue: typeof effect.value === 'string'});
    });

    if (localPowerAttackValue > 0) {
        components.push({ label: UI_STRINGS.powerAttackDamageBonusLabel || "Power Attack Damage", value: localPowerAttackValue });
    }

    const totalNumericBonus = calculateFinalNumericalDamageBonus(strModifier, selectedMeleeWeaponId === 'unarmed' ? 'unarmed' : 'melee', selectedMeleeWeapon, localPowerAttackValue);
    components.push({ label: UI_STRINGS.infoDialogTotalNumericBonusLabel || "Total Numeric Bonus", value: totalNumericBonus, isBold: true });
    return components;
  }, [UI_STRINGS, selectedMeleeWeaponId, selectedMeleeWeapon, getActiveDamageBonuses, localPowerAttackValue, strModifier, ABILITY_LABELS, calculateFinalNumericalDamageBonus, unarmedBaseDamageFromFeat]);

  const handleOpenMeleeDamageInfo = () => {
    const components = getMeleeDamageBonusBreakdownComponentsInternal();
    onOpenCombatStatInfoDialog({type: 'genericNumericalBreakdown', titleKey: 'infoDialogTitleMeleeDamageBreakdown', components});
  };

  const getRangedAttackBonusBreakdownComponentsInternal = React.useCallback((): GenericBreakdownItem[] => {
    if (!selectedRangedWeapon) return [{label: UI_STRINGS.attacksPanelNoRangedWeapons || "No Ranged Weapon", value: ""}];
    const components: GenericBreakdownItem[] = [
        { label: UI_STRINGS.attacksPanelBabLabel || "Base Attack Bonus", value: totalBabWithModifier[0] },
        { label: (UI_STRINGS.attacksPanelAbilityModLabel || "Ability Mod ({abilityAbbr})").replace("{abilityAbbr}", ABILITY_LABELS.find(al => al.value === 'dexterity')?.abbr || 'DEX'), value: dexModifier },
        { label: UI_STRINGS.attacksPanelSizeModLabel || "Size Mod (Attack)", value: actualSizeModAttack },
    ];
    const activeBonuses = getActiveAttackBonuses('ranged', selectedRangedWeapon);
    activeBonuses.forEach(effect => {
         let label = effect.sourceFeat || (UI_STRINGS.attacksPanelFeatBonusLabel || "Feat Bonus");
         if(effect.condition) {
            const conditionTextKey = `condition_${effect.condition.toLowerCase().replace(/\s+/g, '_')}` as keyof typeof UI_STRINGS;
            const conditionText = UI_STRINGS[conditionTextKey] || effect.condition;
            label = `${label} (${conditionText})`;
        }
         components.push({label, value: effect.value});
    });
    const total = components.filter(c => typeof c.value === 'number').reduce((sum, comp) => sum + (comp.value as number), 0);
    components.push({ label: UI_STRINGS.infoDialogTotalLabel || "Total", value: total, isBold: true });
    return components;
  }, [UI_STRINGS, totalBabWithModifier, dexModifier, actualSizeModAttack, selectedRangedWeapon, getActiveAttackBonuses, ABILITY_LABELS]);

  const handleOpenRangedAttackInfo = () => {
    const components = getRangedAttackBonusBreakdownComponentsInternal();
    onOpenCombatStatInfoDialog({type: 'genericNumericalBreakdown', titleKey: 'infoDialogTitleRangedAttackBreakdown', components});
  };

  const getRangedDamageBonusBreakdownComponentsInternal = React.useCallback((): GenericBreakdownItem[] => {
    if (!selectedRangedWeapon) return [{label: UI_STRINGS.attacksPanelNoRangedWeapons || "No Ranged Weapon", value: ""}];
    const components: GenericBreakdownItem[] = [];
    const baseDmg = selectedRangedWeapon.damage || 'N/A';
    components.push({ label: UI_STRINGS.attacksPanelBaseWeaponDamageLabel || "Base Weapon Damage", value: baseDmg, isRawValue: true });

    let totalNumericBonusFromEffects = 0;
    const activeBonuses = getActiveDamageBonuses('ranged', selectedRangedWeapon);

    activeBonuses.forEach(effect => {
        let label = effect.sourceFeat || (UI_STRINGS.attacksPanelFeatBonusLabel || "Feat Bonus");
        if(effect.condition) {
            const conditionTextKey = `condition_${effect.condition.toLowerCase().replace(/\s+/g, '_')}` as keyof typeof UI_STRINGS;
            const conditionText = UI_STRINGS[conditionTextKey] || effect.condition;
            label = `${label} (${conditionText})`;
        }
        components.push({label, value: effect.value, isRawValue: typeof effect.value === 'string'});

        if (typeof effect.value === 'number') {
            totalNumericBonusFromEffects += effect.value;
        }
    });

    components.push({ label: UI_STRINGS.infoDialogTotalNumericBonusLabel || "Total Numeric Bonus", value: totalNumericBonusFromEffects, isBold: true });
    return components;
  }, [UI_STRINGS, selectedRangedWeapon, getActiveDamageBonuses]);

  const handleOpenRangedDamageInfo = () => {
    const components = getRangedDamageBonusBreakdownComponentsInternal();
    onOpenCombatStatInfoDialog({type: 'genericNumericalBreakdown', titleKey: 'infoDialogTitleRangedDamageBreakdown', components});
  };

  const handleOpenInitiativeRoll = () => {
    const breakdown: GenericBreakdownItem[] = [
      { label: (UI_STRINGS.attacksPanelAbilityModLabel || "Ability Mod ({abilityAbbr})").replace("{abilityAbbr}", ABILITY_LABELS.find(al => al.value === 'dexterity')?.abbr || 'DEX'), value: dexModifier },
    ];
    if (featInitiativeBonus !== 0) {
      breakdown.push({ label: UI_STRINGS.attacksPanelFeatBonusLabel || "Feat Bonus", value: featInitiativeBonus });
    }
    if ((localInitiativeMiscModifier || 0) !== 0) {
      breakdown.push({ label: UI_STRINGS.infoDialogCustomModifierLabel || "Misc Modifier", value: localInitiativeMiscModifier || 0 });
    }
    onOpenRollDialog({
      dialogTitle: UI_STRINGS.rollDialogTitleInitiative || "Roll Initiative",
      rollType: "initiative_check",
      baseModifier: baseInitiative,
      calculationBreakdown: breakdown,
      rerollTwentiesForChecks: rerollTwentiesForChecks,
    });
  };

  const handleOpenGrappleCheckRoll = () => {
    const breakdown: GenericBreakdownItem[] = [
      { label: UI_STRINGS.attacksPanelBabLabel || "Base Attack Bonus", value: baseBabArray[0] || 0 },
      { label: (UI_STRINGS.attacksPanelAbilityModLabel || "Ability Mod ({abilityAbbr})").replace("{abilityAbbr}", ABILITY_LABELS.find(al => al.value === 'strength')?.abbr || 'STR'), value: strModifier },
      { label: (UI_STRINGS.attacksPanelSizeModLabel || "Size Mod (Attack)").replace("Attack", "Grapple"), value: sizeModGrapple },
    ];
    if (featGrappleBonus !== 0) {
      breakdown.push({ label: UI_STRINGS.attacksPanelFeatBonusLabel || "Feat Bonus", value: featGrappleBonus });
    }
    if ((localGrappleMiscModifier || 0) !== 0) {
      breakdown.push({ label: UI_STRINGS.infoDialogCustomModifierLabel || "Misc Modifier", value: localGrappleMiscModifier || 0 });
    }
    onOpenRollDialog({
      dialogTitle: UI_STRINGS.rollDialogTitleGrappleCheck || "Roll Grapple Check",
      rollType: "grapple_check",
      baseModifier: totalGrappleModifier,
      calculationBreakdown: breakdown,
      rerollTwentiesForChecks: rerollTwentiesForChecks,
    });
  };

  const handleOpenMeleeAttackRollDialog = () => {
    const weaponName = selectedMeleeWeapon?.name || (UI_STRINGS.attacksPanelUnarmedOption || "Unarmed");
    const breakdown = getMeleeAttackBonusBreakdownComponentsInternal().filter(item => item.label !== (UI_STRINGS.infoDialogTotalLabel || "Total"));
    onOpenRollDialog({
      dialogTitle: (UI_STRINGS.rollDialogTitleMeleeAttackFormat || "Roll Melee Attack ({weaponName})").replace("{weaponName}", weaponName),
      rollType: `melee_attack_${selectedMeleeWeaponId}`,
      baseModifier: calculatedMeleeAttackBonus,
      calculationBreakdown: breakdown,
      rerollTwentiesForChecks: false,
    });
  };

  const handleOpenRangedAttackRollDialog = () => {
    if (!selectedRangedWeapon) return;
    const weaponName = selectedRangedWeapon.name;
    const breakdown = getRangedAttackBonusBreakdownComponentsInternal().filter(item => item.label !== (UI_STRINGS.infoDialogTotalLabel || "Total"));
    onOpenRollDialog({
      dialogTitle: (UI_STRINGS.rollDialogTitleRangedAttackFormat || "Roll Ranged Attack ({weaponName})").replace("{weaponName}", weaponName),
      rollType: `ranged_attack_${selectedRangedWeaponId}`,
      baseModifier: calculatedRangedAttackBonus,
      calculationBreakdown: breakdown,
      rerollTwentiesForChecks: false,
    });
  };

  const handleOpenMeleeDamageRollDialog = () => {
    if (!selectedMeleeWeapon) return;
    const weaponName = selectedMeleeWeapon.name;
    const weaponDamageDiceString = selectedMeleeWeapon.id === 'unarmed' ? unarmedBaseDamageFromFeat : selectedMeleeWeapon.damage || 'N/A';
    const breakdown = getMeleeDamageBonusBreakdownComponentsInternal().filter(item => item.label !== (UI_STRINGS.infoDialogTotalNumericBonusLabel || "Total Numeric Bonus"));
    onOpenRollDialog({
      dialogTitle: (UI_STRINGS.rollDialogTitleMeleeDamageFormat || "Melee Damage ({weaponName}: {dice})")
        .replace("{weaponName}", weaponName)
        .replace("{dice}", weaponDamageDiceString),
      rollType: `damage_roll_melee_${selectedMeleeWeapon.id}`,
      baseModifier: calculatedMeleeNumericalDamageBonus,
      calculationBreakdown: breakdown,
      weaponDamageDice: weaponDamageDiceString,
      rerollTwentiesForChecks: false,
    });
  };

  const handleOpenRangedDamageRollDialog = () => {
    if (!selectedRangedWeapon) return;
    const weaponName = selectedRangedWeapon.name;
    const weaponDamageDiceString = selectedRangedWeapon.damage || 'N/A';
    const breakdown = getRangedDamageBonusBreakdownComponentsInternal().filter(item => item.label !== (UI_STRINGS.infoDialogTotalNumericBonusLabel || "Total Numeric Bonus"));
    onOpenRollDialog({
      dialogTitle: (UI_STRINGS.rollDialogTitleRangedDamageFormat || "Ranged Damage ({weaponName}: {dice})")
        .replace("{weaponName}", weaponName)
        .replace("{dice}", weaponDamageDiceString),
      rollType: `damage_roll_ranged_${selectedRangedWeapon.id}`,
      baseModifier: calculatedRangedNumericalDamageBonus,
      calculationBreakdown: breakdown,
      weaponDamageDice: weaponDamageDiceString,
      rerollTwentiesForChecks: false,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Swords className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl font-serif">{UI_STRINGS.combatPanelTitle || "Combat Stats"}</CardTitle>
        </div>
        <CardDescription>{UI_STRINGS.combatPanelDescription || "Key offensive and grappling statistics."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Row 1: BAB, Initiative */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 border rounded-md bg-muted/20 space-y-2 flex flex-col text-center">
            <Label htmlFor="bab-display" className="text-md font-medium block">{UI_STRINGS.combatPanelBabLabel || "Base Attack Bonus"}</Label>
            <div className="flex items-center justify-center">
              <p id="bab-display" className="text-xl font-bold text-accent">
                {totalBabWithModifier.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/')}
              </p>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={handleBabInfo}>
                <Info className="h-4 w-4" />
              </Button>
            </div>
            {numFlurryExtraAttacks > 0 && (
               <div className="flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground mr-1">{UI_STRINGS.combatPanelFlurryOfBlowsLabel || "Flurry of Blows"}:</span>
                <p id="flurry-display" className="text-base font-bold text-accent/80">
                  {flurryAttackSequence.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/')}
                </p>
              </div>
            )}
            <div className="mt-auto space-y-1">
              <Label htmlFor="bab-custom-mod" className="text-xs text-muted-foreground block">{UI_STRINGS.infoDialogCustomModifierLabel || "Misc Modifier"}</Label>
              <div className="flex justify-center">
                <NumberSpinnerInput
                  id="bab-custom-mod"
                  value={localBabMiscModifier}
                  onChange={setLocalBabMiscModifier}
                  min={-20} max={20}
                  inputClassName="h-8 text-sm w-20"
                  buttonClassName="h-8 w-8"
                />
              </div>
            </div>
          </div>

          <div className="p-3 border rounded-md bg-muted/20 space-y-2 flex flex-col text-center">
            <Label htmlFor="initiative-display" className="text-md font-medium block">{UI_STRINGS.combatPanelInitiativeLabel || "Initiative"}</Label>
            <div className="flex items-center justify-center">
              <p id="initiative-display" className="text-xl font-bold text-accent">
                {baseInitiative >= 0 ? '+' : ''}{baseInitiative}
              </p>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-0.5 text-muted-foreground hover:text-foreground" onClick={handleInitiativeInfo}>
                <Info className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-0.5 text-muted-foreground hover:text-primary" onClick={handleOpenInitiativeRoll} aria-label={UI_STRINGS.rollDialogInitiativeAriaLabel || "Roll Initiative"}>
                <Dices className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-auto space-y-1">
              <Label htmlFor="initiative-custom-mod" className="text-xs text-muted-foreground block">{UI_STRINGS.infoDialogCustomModifierLabel || "Misc Modifier"}</Label>
              <div className="flex justify-center">
                <NumberSpinnerInput
                  id="initiative-custom-mod"
                  value={localInitiativeMiscModifier}
                  onChange={setLocalInitiativeMiscModifier}
                  min={-20} max={20}
                  inputClassName="h-8 text-sm w-20"
                  buttonClassName="h-8 w-8"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Grapple Modifier, Grapple Damage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 border rounded-md bg-muted/20 space-y-2 flex flex-col text-center">
            <Label htmlFor="grapple-mod-display" className="text-md font-medium block">{UI_STRINGS.combatPanelGrappleModifierLabel || "Grapple Modifier"}</Label>
            <div className="flex items-center justify-center">
              <p id="grapple-mod-display" className="text-xl font-bold text-accent">
                {totalGrappleModifier >= 0 ? '+' : ''}{totalGrappleModifier}
              </p>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-0.5 text-muted-foreground hover:text-foreground" onClick={handleGrappleModifierInfo}>
                <Info className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-0.5 text-muted-foreground hover:text-primary" onClick={handleOpenGrappleCheckRoll} aria-label={UI_STRINGS.rollDialogGrappleCheckAriaLabel || "Roll Grapple Check"}>
                <Dices className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-auto space-y-1">
              <Label htmlFor="grapple-custom-mod" className="text-xs text-muted-foreground block">{UI_STRINGS.infoDialogCustomModifierLabel || "Misc Modifier"}</Label>
              <div className="flex justify-center">
                <NumberSpinnerInput
                  id="grapple-custom-mod"
                  value={localGrappleMiscModifier}
                  onChange={setLocalGrappleMiscModifier}
                  min={-20} max={20}
                  inputClassName="h-8 text-sm w-20"
                  buttonClassName="h-8 w-8"
                />
              </div>
            </div>
          </div>

          <div className="p-3 border rounded-md bg-muted/20 space-y-2 flex flex-col text-center">
              <Label htmlFor="grapple-damage-display" className="text-md font-medium block">{UI_STRINGS.combatPanelGrappleDamageLabel || "Grapple Damage"}</Label>
              <div className="flex items-center justify-center">
                  <p id="grapple-damage-display" className="text-xl font-bold text-accent">
                    {displayedGrappleDamageTotal}
                  </p>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={handleGrappleDamageInfo}>
                      <Info className="h-4 w-4" />
                  </Button>
              </div>
              <div className="mt-auto space-y-2">
                  <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground block">{UI_STRINGS.combatPanelGrappleWeaponLabel || "Weapon"}</Label>
                      <Select
                          value={localGrappleWeaponChoice}
                          onValueChange={setLocalGrappleWeaponChoice}
                      >
                          <SelectTrigger className="h-8 text-sm w-full max-w-[200px] mx-auto">
                              <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="unarmed">{UI_STRINGS.infoDialogGrappleDmgUnarmedLabel || "Unarmed"}</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-1">
                      <Label htmlFor="grapple-damage-custom-mod" className="text-xs text-muted-foreground block">{UI_STRINGS.infoDialogCustomModifierLabel || "Misc Modifier"}</Label>
                      <div className="flex justify-center">
                        <NumberSpinnerInput
                            id="grapple-damage-custom-mod"
                            value={localGrappleDamageBonus}
                            onChange={setLocalGrappleDamageBonus}
                            min={-20} max={20}
                            inputClassName="h-8 text-sm w-20"
                            buttonClassName="h-8 w-8"
                        />
                      </div>
                  </div>
              </div>
          </div>
        </div>

        <Separator className="my-4" />

        {(hasPowerAttackFeat || hasCombatExpertiseFeat) && (
          <>
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
                    <ShieldIcon className="mr-1.5 h-4 w-4 text-blue-500/80"/>
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
            <Separator className="my-4" />
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Melee Attacks Card */}
          <div className="p-3 border rounded-md bg-muted/20 space-y-3">
            <h4 className="text-lg font-semibold text-foreground/90 flex items-center"><Hand className="mr-2 h-5 w-5 text-primary/70"/>{UI_STRINGS.attacksPanelMeleeTitle || "Melee Attacks"}</h4>
            <div className="space-y-1">
              <Label htmlFor="melee-weapon-select">{UI_STRINGS.attacksPanelMeleeWeaponLabel || "Melee Weapon"}</Label>
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
                <p><strong>{UI_STRINGS.attacksPanelWeaponDamageLabel || "Damage"}:</strong> {selectedMeleeWeapon.id === 'unarmed' ? unarmedBaseDamageFromFeat : selectedMeleeWeapon.damage || 'N/A'}</p>
                <p><strong>{UI_STRINGS.attacksPanelWeaponCriticalLabel || "Critical"}:</strong> {selectedMeleeWeapon.criticalRange || 'N/A'} {selectedMeleeWeapon.criticalMultiplier || ''}</p>
                {selectedMeleeWeapon.damageType && <p><strong>{UI_STRINGS.attacksPanelWeaponDamageTypeLabel || "Type"}:</strong> {selectedMeleeWeapon.damageType}</p>}
              </div>
            )}
            <div className="flex justify-around items-center mt-2">
              <div className="text-center">
                <Label className="text-xs font-medium block">{UI_STRINGS.attacksPanelAttackBonusLabel || "Attack Bonus"}</Label>
                <div className="flex items-center justify-center">
                    <p className="text-base font-bold text-accent">{calculatedMeleeAttackBonus >= 0 ? '+' : ''}{calculatedMeleeAttackBonus}</p>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-0.5 text-muted-foreground hover:text-foreground" onClick={handleOpenMeleeAttackInfo}><Info className="h-3.5 w-3.5" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-0.5 text-muted-foreground hover:text-primary" onClick={handleOpenMeleeAttackRollDialog} aria-label={(UI_STRINGS.rollDialogMeleeAttackAriaLabel || "Roll Melee Attack with {weaponName}").replace("{weaponName}", selectedMeleeWeapon?.name || 'Unarmed')}><Dices className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="text-center">
                <Label className="text-xs font-medium block">{UI_STRINGS.attacksPanelDamageBonusLabel || "Damage Bonus"}</Label>
                <div className="flex items-center justify-center">
                  <p className="text-base font-bold text-accent">{renderModifierValue(calculatedMeleeNumericalDamageBonus)}</p>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={handleOpenMeleeDamageInfo}><Info className="h-3.5 w-3.5" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-0.5 text-muted-foreground hover:text-primary" onClick={handleOpenMeleeDamageRollDialog} disabled={!selectedMeleeWeapon} aria-label={(UI_STRINGS.rollDialogDamageAriaLabel || "Roll Damage for {weaponName}").replace("{weaponName}", selectedMeleeWeapon?.name || UI_STRINGS.attacksPanelUnarmedOption || "Unarmed")}><Dices className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </div>
          </div>

          {/* Ranged Attacks Card */}
          <div className="p-3 border rounded-md bg-muted/20 space-y-3">
            <h4 className="text-lg font-semibold text-foreground/90 flex items-center"><ArrowRightLeft className="mr-2 h-5 w-5 text-primary/70"/>{UI_STRINGS.attacksPanelRangedTitle || "Ranged Attacks"}</h4>
            <div className="space-y-1">
              <Label htmlFor="ranged-weapon-select">{UI_STRINGS.attacksPanelRangedWeaponLabel || "Ranged Weapon"}</Label>
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
                <p><strong>{UI_STRINGS.attacksPanelWeaponDamageLabel || "Damage"}:</strong> {selectedRangedWeapon.damage || 'N/A'}</p>
                <p><strong>{UI_STRINGS.attacksPanelWeaponCriticalLabel || "Critical"}:</strong> {selectedRangedWeapon.criticalRange || 'N/A'} {selectedRangedWeapon.criticalMultiplier || ''}</p>
                {selectedRangedWeapon.rangeIncrement && <p><strong>{UI_STRINGS.attacksPanelWeaponRangeLabel || "Range"}:</strong> {selectedRangedWeapon.rangeIncrement} {UI_STRINGS.speedUnit || "ft."}</p>}
                {selectedRangedWeapon.damageType && <p><strong>{UI_STRINGS.attacksPanelWeaponDamageTypeLabel || "Type"}:</strong> {selectedRangedWeapon.damageType}</p>}
              </div>
            )}
            <div className="flex justify-around items-center mt-2">
              <div className="text-center">
                <Label className="text-xs font-medium block">{UI_STRINGS.attacksPanelAttackBonusLabel || "Attack Bonus"}</Label>
                <div className="flex items-center justify-center">
                  <p className="text-base font-bold text-accent">{selectedRangedWeapon ? (calculatedRangedAttackBonus >= 0 ? '+' : '') + calculatedRangedAttackBonus : 'N/A'}</p>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-0.5 text-muted-foreground hover:text-foreground" onClick={handleOpenRangedAttackInfo} disabled={!selectedRangedWeapon}><Info className="h-3.5 w-3.5" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-0.5 text-muted-foreground hover:text-primary" onClick={handleOpenRangedAttackRollDialog} disabled={!selectedRangedWeapon} aria-label={(UI_STRINGS.rollDialogRangedAttackAriaLabel || "Roll Ranged Attack with {weaponName}").replace("{weaponName}", selectedRangedWeapon?.name || '')}><Dices className="h-3.5 w-3.5" /></Button>
                  </div>
              </div>
              <div className="text-center">
                <Label className="text-xs font-medium block">{UI_STRINGS.attacksPanelDamageBonusLabel || "Damage Bonus"}</Label>
                <div className="flex items-center justify-center">
                  <p className="text-base font-bold text-accent">{selectedRangedWeapon ? renderModifierValue(calculatedRangedNumericalDamageBonus) : 'N/A'}</p>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={handleOpenRangedDamageInfo} disabled={!selectedRangedWeapon}><Info className="h-3.5 w-3.5" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-0.5 text-muted-foreground hover:text-primary" onClick={handleOpenRangedDamageRollDialog} disabled={!selectedRangedWeapon} aria-label={(UI_STRINGS.rollDialogDamageAriaLabel || "Roll Damage for {weaponName}").replace("{weaponName}", selectedRangedWeapon?.name || '')}><Dices className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
CombatPanelComponent.displayName = 'CombatPanelComponent';
export const CombatPanel = React.memo(CombatPanelComponent);

