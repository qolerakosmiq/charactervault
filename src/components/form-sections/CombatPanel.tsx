
'use client';

import *as React from 'react';
import type {
  Character,
  InfoDialogContentType,
  AggregatedFeatEffects,
  GenericBreakdownItem,
  AbilityName,
  Item,
  ItemInstance,
  ItemDefinition,
  FeatDefinitionJsonData,
  CombatPanelCharacterData,
  AttackRollEffect,
  DamageRollEffect,
  GearSlotId,
  WeaponStyleType
} from '@/types/character-core';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Swords, Info, Loader2, Dices, Hand, ArrowRightLeft, Activity, Shield as ShieldIcon } from 'lucide-react';
import { getAbilityModifierByName, getBab, calculateInitiative, calculateGrapple, getSizeModifierGrapple, getUnarmedGrappleDamage, getSizeModifierAttack, parseAndRollDice } from '@/lib/dnd-utils';
import { useI18n } from '@/context/I18nProvider';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import type { RollDialogProps } from '@/components/RollDialog';
import { useDefinitionsStore } from '@/lib/definitions-store';
import { cn } from '@/lib/utils';
import { renderModifierValue, sectionHeadingClass } from '@/components/info-dialog-content/dialog-utils';
import { getLocalizedString } from '@/i18n/i18n-data';
import { DEFAULT_LANGUAGE, type LanguageCode } from '@/i18n/config';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper';
import { Input } from '@/components/ui/input';
import { DualBadge } from '@/components/ui/DualBadge';
import {
  debounceDelayFormInput,
  panelContentPadding,
  panelFieldHorizontalGap,
  panelFieldVerticalGap,
  panelGridGap,
  textStyleCardTitle,
  textStyleInput,
  textStyleLabel,
  textStyleModifier,
  textStyleValueBig,
  inputWidthStandard,
  textStylePanelSectionHeader,
  textStyleSubLabel,
  panelBadgeGroupGap,
  textStyleBadgeSmall
} from '@/config/layout';


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
  const { translations, isLoading: translationsLoading, language: currentLang } = useI18n();
  const { rerollTwentiesForChecks } = useDefinitionsStore(state => ({
    rerollTwentiesForChecks: state.rerollTwentiesForChecks,
  }));

  const [selectedMeleeWeaponInstanceId, setSelectedMeleeWeaponInstanceId] = React.useState<string>('unarmed');
  const [selectedRangedWeaponInstanceId, setSelectedRangedWeaponInstanceId] = React.useState<string>('none');


  const [localBabMiscModifier, setLocalBabMiscModifier] = useDebouncedFormField(
    combatData.babMiscModifier || 0, (value) => onCharacterUpdate('babMiscModifier', value), debounceDelayFormInput
  );
  const [localInitiativeMiscModifier, setLocalInitiativeMiscModifier] = useDebouncedFormField(
    combatData.initiativeMiscModifier || 0, (value) => onCharacterUpdate('initiativeMiscModifier', value), debounceDelayFormInput
  );
  const [localGrappleMiscModifier, setLocalGrappleMiscModifier] = useDebouncedFormField(
    combatData.grappleMiscModifier || 0, (value) => onCharacterUpdate('grappleMiscModifier', value), debounceDelayFormInput
  );
  const [localGrappleDamageBonus, setLocalGrappleDamageBonus] = useDebouncedFormField(
    combatData.grappleDamage_bonus || 0, (value) => onCharacterUpdate('grappleDamage_bonus', value), debounceDelayFormInput
  );
  const [localGrappleWeaponChoice, setLocalGrappleWeaponChoice] = useDebouncedFormField(
    combatData.grappleWeaponChoice || 'unarmed', (value) => onCharacterUpdate('grappleWeaponChoice', value), debounceDelayFormInput
  );
  const [localPowerAttackValue, setLocalPowerAttackValue] = useDebouncedFormField(
    combatData.powerAttackValue || 0, (value) => onCharacterUpdate('powerAttackValue', value), debounceDelayFormInput
  );
  const [localCombatExpertiseValue, setLocalCombatExpertiseValue] = useDebouncedFormField(
    combatData.combatExpertiseValue || 0, (value) => onCharacterUpdate('combatExpertiseValue', value), debounceDelayFormInput
  );

  const allWeaponDefinitions = React.useMemo(() => {
    if (translationsLoading || !translations) return [];
    return translations.ITEM_DEFINITIONS_WEAPONS || [];
  }, [translations, translationsLoading]);

  const getWeaponDefinition = React.useCallback((definitionId: string | undefined): ItemDefinition | undefined => {
    if (!definitionId) return undefined;
    return allWeaponDefinitions.find(def => def.definitionId === definitionId);
  }, [allWeaponDefinitions]);

  const getEquippedItemInstance = React.useCallback((slotId: GearSlotId): ItemInstance | undefined => {
    const instanceId = combatData.equippedGear?.[slotId];
    return instanceId ? combatData.inventory?.find(item => item.instanceId === instanceId) : undefined;
  }, [combatData.equippedGear, combatData.inventory]);

  const getWeaponEnhancementBonus = React.useCallback((itemDef?: ItemDefinition): { attack: number, damage: number } => {
    let attackBonus = 0;
    let damageBonus = 0;
    if (itemDef?.effects) {
      itemDef.effects.forEach(effect => {
        if (effect.type === 'attackRoll' && effect.bonusType === 'enhancement' && typeof effect.value === 'number') {
          attackBonus += effect.value;
        }
        if (effect.type === 'damageRoll' && effect.bonusType === 'enhancement' && typeof effect.value === 'number') {
          damageBonus += effect.value;
        }
      });
    }
    return { attack: attackBonus, damage: damageBonus };
  }, []);


  const getActiveAttackBonuses = React.useCallback((
    weaponType: WeaponStyleType | 'unarmed',
    selectedWeaponDefinition?: ItemDefinition | null
  ): AttackRollEffect[] => {
    if (!aggregatedFeatEffects?.attackRollBonuses) return [];
    return aggregatedFeatEffects.attackRollBonuses.filter(effect => {
      if (!effect.isActive || typeof effect.value !== 'number') return false;
      if (effect.appliesTo === 'all') return true;
      if (effect.appliesTo === weaponType) return true;
      if (effect.appliesTo && effect.appliesTo.startsWith('weaponName:') && selectedWeaponDefinition) {
        return effect.appliesTo.substring('weaponName:'.length) === getLocalizedString(selectedWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE);
      }
      if (effect.weaponId && selectedWeaponDefinition) {
        return effect.weaponId === selectedWeaponDefinition.definitionId;
      }
      return false;
    });
  }, [aggregatedFeatEffects?.attackRollBonuses, currentLang]);
  
  const calculateFinalAttackBonus = React.useCallback((
    baseBab: number,
    abilityMod: number,
    sizeMod: number,
    weaponType: 'melee' | 'ranged' | 'unarmed',
    selectedWeaponDefinition?: ItemDefinition | null,
    powerAttackVal: number = 0,
    combatExpertiseVal: number = 0
  ): number => {
    let totalBonus = baseBab + abilityMod + sizeMod;
    const activeFeatBonuses = getActiveAttackBonuses(weaponType, selectedWeaponDefinition);
    activeFeatBonuses.forEach(effect => {
      if (typeof effect.value === 'number') totalBonus += effect.value;
    });

    const weaponEnhancement = getWeaponEnhancementBonus(selectedWeaponDefinition);
    totalBonus += weaponEnhancement.attack;

    if (powerAttackVal > 0 && (weaponType === 'melee' || weaponType === 'unarmed')) {
      totalBonus -= powerAttackVal;
    }
    if (combatExpertiseVal > 0 && (weaponType === 'melee' || weaponType === 'unarmed')) {
      totalBonus -= combatExpertiseVal;
    }
    return totalBonus;
  }, [getActiveAttackBonuses, getWeaponEnhancementBonus]);

  const getActiveDamageBonuses = React.useCallback((
    weaponType: WeaponStyleType | 'unarmed',
    selectedWeaponDefinition?: ItemDefinition | null
  ): DamageRollEffect[] => {
     if (!aggregatedFeatEffects?.damageRollBonuses) return [];
     return aggregatedFeatEffects.damageRollBonuses.filter(effect => {
      if (!effect.isActive) return false;
      if (effect.appliesTo === 'all') return true;
      if (effect.appliesTo === weaponType) return true;
      if (effect.appliesTo?.startsWith('weaponName:') && selectedWeaponDefinition) {
        return effect.appliesTo.substring('weaponName:'.length) === getLocalizedString(selectedWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE);
      }
      if (effect.weaponId && selectedWeaponDefinition) {
        return effect.weaponId === selectedWeaponDefinition.definitionId;
      }
      return false;
    });
  }, [aggregatedFeatEffects?.damageRollBonuses, currentLang]);

 const calculateFinalNumericalDamageBonus = React.useCallback((
    baseAbilityMod: number,
    weaponType: 'melee' | 'ranged' | 'unarmed',
    selectedWeaponDefinition?: ItemDefinition | null,
    powerAttackVal: number = 0
  ): number => {
    let totalBonus = (weaponType === 'melee' || weaponType === 'unarmed') ? baseAbilityMod : 0;
    const activeFeatBonuses = getActiveDamageBonuses(weaponType, selectedWeaponDefinition);

    activeFeatBonuses.forEach(effect => {
      if (typeof effect.value === 'number') {
        totalBonus += effect.value;
      }
    });

    const weaponEnhancement = getWeaponEnhancementBonus(selectedWeaponDefinition);
    totalBonus += weaponEnhancement.damage;

    if (powerAttackVal > 0 && (weaponType === 'melee' || weaponType === 'unarmed')) {
      totalBonus += powerAttackVal;
    }
    return totalBonus;
  }, [getActiveDamageBonuses, getWeaponEnhancementBonus]);


  if (!combatData || translationsLoading || !translations || !aggregatedFeatEffects || !allFeatDefinitions) {
    return null;
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

  const flurryPenalty = aggregatedFeatEffects.modifiedMechanics?.flurryOfBlowsAttackPenalty?.isActive
    ? (aggregatedFeatEffects.modifiedMechanics.flurryOfBlowsAttackPenalty.value as number ?? 0)
    : 0;
  const numFlurryExtraAttacks = aggregatedFeatEffects.modifiedMechanics?.flurryOfBlowsNumExtraAttacks?.isActive
    ? (aggregatedFeatEffects.modifiedMechanics.flurryOfBlowsNumExtraAttacks.value as number ?? 0)
    : 0;

  let flurryAttackSequence: number[] = [];
  if (numFlurryExtraAttacks > 0) {
    const flurryBabBase = totalBabWithModifier.map(bab => bab + flurryPenalty);
    flurryAttackSequence.push(flurryBabBase[0]);
    for(let i=0; i < numFlurryExtraAttacks; i++) {
      flurryAttackSequence.push(flurryBabBase[0]);
    }
    for(let i=1; i < flurryBabBase.length; i++) {
      flurryAttackSequence.push(flurryBabBase[i]);
    }
  }

  const inventoryWeapons = combatData.inventory?.filter(itemInst => {
    const itemDef = getWeaponDefinition(itemInst.definitionId);
    return itemDef?.itemType === 'weapon';
  }) || [];

  const meleeWeaponInstances: Array<ItemInstance & { definition: ItemDefinition }> = [
    { instanceId: 'unarmed', definitionId: 'unarmed-placeholder', name: UI_STRINGS.attacksPanelUnarmedOption || 'Unarmed', itemType: 'weapon' as const, weaponType: 'melee' as const, damage: unarmedBaseDamageFromFeat, criticalRange: '20', criticalMultiplier: 'x2', quantity: 1, definition: { definitionId: 'unarmed-placeholder', label: { en: 'Unarmed Strike', fr: 'Frappe à mains nues'}, itemType: 'weapon', weaponType: 'melee', damage: unarmedBaseDamageFromFeat, criticalRange: '20', criticalMultiplier: 'x2'  } as ItemDefinition },
    ...inventoryWeapons.map(inst => ({ ...inst, definition: getWeaponDefinition(inst.definitionId)! })).filter(item => item.definition && (item.definition.weaponType === 'melee' || item.definition.weaponType === 'melee-or-ranged'))
  ];
  const rangedWeaponInstances: Array<ItemInstance & { definition: ItemDefinition }> = inventoryWeapons
    .map(inst => ({ ...inst, definition: getWeaponDefinition(inst.definitionId)! }))
    .filter(item => item.definition && (item.definition.weaponType === 'ranged' || item.definition.weaponType === 'melee-or-ranged'));


  const selectedMeleeWeaponInstance = meleeWeaponInstances.find(w => w.instanceId === selectedMeleeWeaponInstanceId);
  const selectedMeleeWeaponDefinition = selectedMeleeWeaponInstance?.definition;

  const selectedRangedWeaponInstance = rangedWeaponInstances.find(w => w.instanceId === selectedRangedWeaponInstanceId);
  const selectedRangedWeaponDefinition = selectedRangedWeaponInstance?.definition;


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
  if (selectedMeleeWeaponDefinition?.isFinesseWeapon && dexModifier > strModifier) {
    meleeAttackAbilityModForCalc = dexModifier;
  }
  const calculatedMeleeAttackBonus = calculateFinalAttackBonus(totalBabWithModifier[0], meleeAttackAbilityModForCalc, actualSizeModAttack, selectedMeleeWeaponInstanceId === 'unarmed' ? 'unarmed' : 'melee', selectedMeleeWeaponDefinition, localPowerAttackValue, localCombatExpertiseValue);
  const calculatedMeleeNumericalDamageBonus = calculateFinalNumericalDamageBonus(strModifier, selectedMeleeWeaponInstanceId === 'unarmed' ? 'unarmed' : 'melee', selectedMeleeWeaponDefinition, localPowerAttackValue);

  const calculatedRangedAttackBonus = selectedRangedWeaponDefinition ? calculateFinalAttackBonus(totalBabWithModifier[0], dexModifier, actualSizeModAttack, 'ranged', selectedRangedWeaponDefinition) : 0;
  const calculatedRangedNumericalDamageBonus = selectedRangedWeaponDefinition ? calculateFinalNumericalDamageBonus(0, 'ranged', selectedRangedWeaponDefinition) : 0;

  const hasPowerAttackFeat = combatData.feats?.some(f => f.definitionId === 'power-attack') || false;
  const hasCombatExpertiseFeat = combatData.feats?.some(f => f.definitionId === 'combat-expertise') || false;

  const handleBabInfo = () => onOpenCombatStatInfoDialog({ type: 'babBreakdown' });
  const handleInitiativeInfo = () => onOpenCombatStatInfoDialog({ type: 'initiativeBreakdown' });
  const handleGrappleModifierInfo = () => onOpenCombatStatInfoDialog({ type: 'grappleModifierBreakdown' });

  const getMeleeAttackBonusBreakdownComponentsInternal = React.useCallback((): GenericBreakdownItem[] => {
    const components: GenericBreakdownItem[] = [
        { label: UI_STRINGS.attacksPanelBabLabel || "Base Attack Bonus", value: totalBabWithModifier[0] },
        { label: (UI_STRINGS.attacksPanelAbilityModLabel || "Ability Mod ({abilityAbbr})").replace("{abilityAbbr}", ABILITY_LABELS.find(al => al.id === (selectedMeleeWeaponDefinition?.isFinesseWeapon && dexModifier > strModifier ? 'dexterity' : 'strength'))?.abbr || (selectedMeleeWeaponDefinition?.isFinesseWeapon && dexModifier > strModifier ? 'DEX' : 'STR')), value: meleeAttackAbilityModForCalc },
        { label: UI_STRINGS.attacksPanelSizeModLabel || "Size Mod (Attack)", value: actualSizeModAttack },
    ];
    const weaponEnhancement = getWeaponEnhancementBonus(selectedMeleeWeaponDefinition);
    if (weaponEnhancement.attack !== 0) {
        components.push({ label: UI_STRINGS.attacksPanelWeaponEnhancementLabel || "Weapon Enhancement", value: weaponEnhancement.attack});
    }
    const activeBonuses = getActiveAttackBonuses(selectedMeleeWeaponInstanceId === 'unarmed' ? 'unarmed' : 'melee', selectedMeleeWeaponDefinition);
    activeBonuses.forEach(effect => {
        let label = effect.sourceFeat ? getLocalizedString(effect.sourceFeat, currentLang, DEFAULT_LANGUAGE) : (UI_STRINGS.attacksPanelFeatBonusLabel || "Feat Bonus");
        if(effect.condition) {
            const conditionTextKey = `condition_${effect.condition.toLowerCase().replace(/\s+/g, '_')}` as keyof typeof UI_STRINGS;
            const conditionText = UI_STRINGS[conditionTextKey] || effect.condition;
            label = `${label} (${conditionText})`;
        }
        components.push({label, value: typeof effect.value === 'number' ? effect.value : 0});
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
  }, [UI_STRINGS, totalBabWithModifier, meleeAttackAbilityModForCalc, actualSizeModAttack, selectedMeleeWeaponInstanceId, selectedMeleeWeaponDefinition, getActiveAttackBonuses, localPowerAttackValue, localCombatExpertiseValue, ABILITY_LABELS, dexModifier, strModifier, getWeaponEnhancementBonus, currentLang]);

  const handleOpenMeleeAttackInfo = () => {
    const components = getMeleeAttackBonusBreakdownComponentsInternal();
    onOpenCombatStatInfoDialog({type: 'meleeAttackBreakdown', components});
  };

  const getMeleeDamageBonusBreakdownComponentsInternal = React.useCallback((): GenericBreakdownItem[] => {
    const components: GenericBreakdownItem[] = [];

    let baseDmg = selectedMeleeWeaponDefinition?.damage || (selectedMeleeWeaponInstanceId === 'unarmed' ? unarmedBaseDamageFromFeat : undefined);
    if(baseDmg) {
      components.push({ label: UI_STRINGS.attacksPanelBaseWeaponDamageLabel || "Base Weapon Damage", value: baseDmg, isRawValue: true });
    }


    if (strModifier !== 0 && (selectedMeleeWeaponInstanceId === 'unarmed' || selectedMeleeWeaponDefinition?.weaponType === 'melee' || selectedMeleeWeaponDefinition?.weaponType === 'melee-or-ranged')) {
        components.push({ label: (UI_STRINGS.attacksPanelAbilityModLabel || "Ability Mod ({abilityAbbr})").replace("{abilityAbbr}", ABILITY_LABELS.find(al => al.id === 'strength')?.abbr || 'STR'), value: strModifier });
    }
    const weaponEnhancement = getWeaponEnhancementBonus(selectedMeleeWeaponDefinition);
    if (weaponEnhancement.damage !== 0) {
        components.push({ label: UI_STRINGS.attacksPanelWeaponEnhancementLabel || "Weapon Enhancement", value: weaponEnhancement.damage});
    }

    const activeBonuses = getActiveDamageBonuses(selectedMeleeWeaponInstanceId === 'unarmed' ? 'unarmed' : 'melee', selectedMeleeWeaponDefinition);
    activeBonuses.forEach(effect => {
        let label = effect.sourceFeat ? getLocalizedString(effect.sourceFeat, currentLang, DEFAULT_LANGUAGE) : (UI_STRINGS.attacksPanelFeatBonusLabel || "Feat Bonus");
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

    const totalNumericBonus = calculateFinalNumericalDamageBonus(strModifier, selectedMeleeWeaponInstanceId === 'unarmed' ? 'unarmed' : 'melee', selectedMeleeWeaponDefinition, localPowerAttackValue);
    components.push({ label: UI_STRINGS.infoDialogTotalNumericBonusLabel || "Total Numeric Bonus", value: totalNumericBonus, isBold: true });
    return components;
  }, [UI_STRINGS, selectedMeleeWeaponInstanceId, selectedMeleeWeaponDefinition, getActiveDamageBonuses, localPowerAttackValue, strModifier, ABILITY_LABELS, calculateFinalNumericalDamageBonus, unarmedBaseDamageFromFeat, getWeaponEnhancementBonus, currentLang]);

  const handleOpenMeleeDamageInfo = () => {
    const components = getMeleeDamageBonusBreakdownComponentsInternal();
    onOpenCombatStatInfoDialog({type: 'meleeDamageBreakdown', components});
  };

  const getRangedAttackBonusBreakdownComponentsInternal = React.useCallback((): GenericBreakdownItem[] => {
    if (!selectedRangedWeaponDefinition) return [{label: UI_STRINGS.attacksPanelNoRangedWeapons || "No Ranged Weapon", value: ""}];
    const components: GenericBreakdownItem[] = [
        { label: UI_STRINGS.attacksPanelBabLabel || "Base Attack Bonus", value: totalBabWithModifier[0] },
        { label: (UI_STRINGS.attacksPanelAbilityModLabel || "Ability Mod ({abilityAbbr})").replace("{abilityAbbr}", ABILITY_LABELS.find(al => al.id === 'dexterity')?.abbr || 'DEX'), value: dexModifier },
        { label: UI_STRINGS.attacksPanelSizeModLabel || "Size Mod (Attack)", value: actualSizeModAttack },
    ];
    const weaponEnhancement = getWeaponEnhancementBonus(selectedRangedWeaponDefinition);
    if (weaponEnhancement.attack !== 0) {
        components.push({ label: UI_STRINGS.attacksPanelWeaponEnhancementLabel || "Weapon Enhancement", value: weaponEnhancement.attack});
    }
    const activeBonuses = getActiveAttackBonuses('ranged', selectedRangedWeaponDefinition);
    activeBonuses.forEach(effect => {
         let label = effect.sourceFeat ? getLocalizedString(effect.sourceFeat, currentLang, DEFAULT_LANGUAGE) : (UI_STRINGS.attacksPanelFeatBonusLabel || "Feat Bonus");
         if(effect.condition) {
            const conditionTextKey = `condition_${effect.condition.toLowerCase().replace(/\s+/g, '_')}` as keyof typeof UI_STRINGS;
            const conditionText = UI_STRINGS[conditionTextKey] || effect.condition;
            label = `${label} (${conditionText})`;
        }
         components.push({label, value: typeof effect.value === 'number' ? effect.value : 0});
    });
    const total = components.filter(c => typeof c.value === 'number').reduce((sum, comp) => sum + (comp.value as number), 0);
    components.push({ label: UI_STRINGS.infoDialogTotalLabel || "Total", value: total, isBold: true });
    return components;
  }, [UI_STRINGS, totalBabWithModifier, dexModifier, actualSizeModAttack, selectedRangedWeaponDefinition, getActiveAttackBonuses, ABILITY_LABELS, getWeaponEnhancementBonus, currentLang]);

  const handleOpenRangedAttackInfo = () => {
    const components = getRangedAttackBonusBreakdownComponentsInternal();
    onOpenCombatStatInfoDialog({type: 'rangedAttackBreakdown', components});
  };

  const getRangedDamageBonusBreakdownComponentsInternal = React.useCallback((): GenericBreakdownItem[] => {
    if (!selectedRangedWeaponDefinition) return [{label: UI_STRINGS.attacksPanelNoRangedWeapons || "No Ranged Weapon", value: ""}];
    const components: GenericBreakdownItem[] = [];
    const baseDmg = selectedRangedWeaponDefinition.damage;
    if (baseDmg) {
      components.push({ label: UI_STRINGS.attacksPanelBaseWeaponDamageLabel || "Base Weapon Damage", value: baseDmg, isRawValue: true });
    }


    const weaponEnhancement = getWeaponEnhancementBonus(selectedRangedWeaponDefinition);
    if (weaponEnhancement.damage !== 0) {
        components.push({ label: UI_STRINGS.attacksPanelWeaponEnhancementLabel || "Weapon Enhancement", value: weaponEnhancement.damage});
    }

    let totalNumericBonusFromEffects = weaponEnhancement.damage; 
    const activeBonuses = getActiveDamageBonuses('ranged', selectedRangedWeaponDefinition);

    activeBonuses.forEach(effect => {
        let label = effect.sourceFeat ? getLocalizedString(effect.sourceFeat, currentLang, DEFAULT_LANGUAGE) : (UI_STRINGS.attacksPanelFeatBonusLabel || "Feat Bonus");
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
  }, [UI_STRINGS, selectedRangedWeaponDefinition, getActiveDamageBonuses, getWeaponEnhancementBonus, currentLang]);

  const handleOpenRangedDamageInfo = () => {
    const components = getRangedDamageBonusBreakdownComponentsInternal();
    onOpenCombatStatInfoDialog({type: 'rangedDamageBreakdown', components});
  };

  const handleOpenInitiativeRoll = () => {
    const breakdown: GenericBreakdownItem[] = [
      { label: (UI_STRINGS.attacksPanelAbilityModLabel || "Ability Mod ({abilityAbbr})").replace("{abilityAbbr}", ABILITY_LABELS.find(al => al.id === 'dexterity')?.abbr || 'DEX'), value: dexModifier },
    ];
    if (featInitiativeBonus !== 0) {
      breakdown.push({ label: UI_STRINGS.infoDialogFeatBonusLabel || "Feat Bonus", value: featInitiativeBonus });
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
      weaponDamageDiceString: "", 
      weaponCriticalMultiplier: 1,
    });
  };

  const handleOpenGrappleCheckRoll = () => {
    const breakdown: GenericBreakdownItem[] = [
      { label: UI_STRINGS.attacksPanelBabLabel || "Base Attack Bonus", value: baseBabArray[0] || 0 },
      { label: (UI_STRINGS.attacksPanelAbilityModLabel || "Ability Mod ({abilityAbbr})").replace("{abilityAbbr}", ABILITY_LABELS.find(al => al.id === 'strength')?.abbr || 'STR'), value: strModifier },
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
      weaponDamageDiceString: "", 
      weaponCriticalMultiplier: 1, 
    });
  };

  const parseCritMultiplier = (critMultString: string | undefined): number => {
    if (!critMultString) return 1;
    const match = critMultString.toLowerCase().match(/x(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  };

  const handleOpenMeleeAttackRollDialog = () => {
    const weaponName = selectedMeleeWeaponDefinition?.label ? getLocalizedString(selectedMeleeWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : (selectedMeleeWeaponInstanceId === 'unarmed' ? (UI_STRINGS.attacksPanelUnarmedOption || "Unarmed") : "N/A");
    const breakdown = getMeleeAttackBonusBreakdownComponentsInternal().filter(item => item.label !== (UI_STRINGS.infoDialogTotalLabel || "Total"));
    onOpenRollDialog({
      dialogTitle: (UI_STRINGS.rollDialogTitleMeleeAttackFormat || "Roll Melee Attack ({weaponName})").replace("{weaponName}", weaponName),
      rollType: `melee_attack_${selectedMeleeWeaponInstanceId}`,
      baseModifier: calculatedMeleeAttackBonus,
      calculationBreakdown: breakdown,
      rerollTwentiesForChecks: false,
      weaponDamageDiceString: "", 
      weaponCriticalMultiplier: 1, 
    });
  };

  const handleOpenRangedAttackRollDialog = () => {
    if (!selectedRangedWeaponDefinition) return;
    const weaponName = getLocalizedString(selectedRangedWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE);
    const breakdown = getRangedAttackBonusBreakdownComponentsInternal().filter(item => item.label !== (UI_STRINGS.infoDialogTotalLabel || "Total"));
    onOpenRollDialog({
      dialogTitle: (UI_STRINGS.rollDialogTitleRangedAttackFormat || "Roll Ranged Attack ({weaponName})").replace("{weaponName}", weaponName),
      rollType: `ranged_attack_${selectedRangedWeaponInstanceId}`,
      baseModifier: calculatedRangedAttackBonus,
      calculationBreakdown: breakdown,
      rerollTwentiesForChecks: false,
      weaponDamageDiceString: "",
      weaponCriticalMultiplier: 1,
    });
  };

  const handleOpenMeleeDamageRollDialog = () => {
    const weaponNameForTitle = selectedMeleeWeaponDefinition?.label ? getLocalizedString(selectedMeleeWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : (selectedMeleeWeaponInstanceId === 'unarmed' ? (UI_STRINGS.attacksPanelUnarmedOption || "Unarmed") : "N/A");
    
    let actualDiceString: string | undefined;
    let actualCritMultiplierString: string | undefined;

    if (selectedMeleeWeaponInstanceId === 'unarmed') {
      actualDiceString = unarmedBaseDamageFromFeat;
      if (!actualDiceString || typeof actualDiceString !== 'string' || actualDiceString.trim() === "" || actualDiceString === "0" || !actualDiceString.includes('d')) {
        actualDiceString = "1d3"; 
      }
      actualCritMultiplierString = "x2";
    } else if (selectedMeleeWeaponDefinition) {
      actualDiceString = selectedMeleeWeaponDefinition.damage;
      actualCritMultiplierString = selectedMeleeWeaponDefinition.criticalMultiplier;
    }
        
    const critMultiplier = parseCritMultiplier(actualCritMultiplierString);
    const breakdown = getMeleeDamageBonusBreakdownComponentsInternal().filter(item => item.label !== (UI_STRINGS.infoDialogTotalNumericBonusLabel || "Total Numeric Bonus"));
    
    onOpenRollDialog({
      dialogTitle: (UI_STRINGS.rollDialogTitleMeleeDamageFormat || "Melee Damage ({weaponName}: {dice})")
        .replace("{weaponName}", weaponNameForTitle)
        .replace("{dice}", actualDiceString || "0d0"),
      rollType: `damage_roll_melee_${selectedMeleeWeaponInstanceId}`,
      baseModifier: calculatedMeleeNumericalDamageBonus,
      calculationBreakdown: breakdown,
      weaponDamageDiceString: actualDiceString || "0d0",
      weaponCriticalMultiplier: critMultiplier,
      extraDamageDice: undefined, 
      rerollTwentiesForChecks: false,
    });
  };

  const handleOpenRangedDamageRollDialog = () => {
    if (!selectedRangedWeaponDefinition) return;
    const weaponName = getLocalizedString(selectedRangedWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE);

    let actualDiceString: string | undefined = selectedRangedWeaponDefinition.damage;

    const critMultiplier = parseCritMultiplier(selectedRangedWeaponDefinition.criticalMultiplier);
    const breakdown = getRangedDamageBonusBreakdownComponentsInternal().filter(item => item.label !== (UI_STRINGS.infoDialogTotalNumericBonusLabel || "Total Numeric Bonus"));

    onOpenRollDialog({
      dialogTitle: (UI_STRINGS.rollDialogTitleRangedDamageFormat || "Ranged Damage ({weaponName}: {dice})")
        .replace("{weaponName}", weaponName)
        .replace("{dice}", actualDiceString || "0d0"),
      rollType: `damage_roll_ranged_${selectedRangedWeaponInstanceId}`,
      baseModifier: calculatedRangedNumericalDamageBonus,
      calculationBreakdown: breakdown,
      weaponDamageDiceString: actualDiceString || "0d0",
      weaponCriticalMultiplier: critMultiplier,
      rerollTwentiesForChecks: false,
    });
  };

  return (
    <LockablePanelWrapper
      title={UI_STRINGS.combatPanelTitle}
      description={UI_STRINGS.combatPanelDescription}
      icon={Swords}
      initialLockedState={false}
    >
      {({ isLocked: panelIsLocked }) => (
        <CardContent className={cn("flex flex-col", panelGridGap)}>

          {/* Vitals Section */}
          <div className={cn("grid grid-cols-1 md:grid-cols-3", panelGridGap)}>
            <div className={cn("flex flex-col border rounded-md bg-card items-center text-center", panelContentPadding, panelFieldVerticalGap)}>
              <Label htmlFor="bab-display" className={textStyleCardTitle}>{UI_STRINGS.combatPanelBabLabel}</Label>
              <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                <p id="bab-display" className={textStyleValueBig}>
                  {totalBabWithModifier.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/')}
                </p>
                <Button type="button" variant="ghost" size="icon-xs" className="ml-1" onClick={handleBabInfo}><Info /></Button>
              </div>
              {numFlurryExtraAttacks > 0 && (
                <div className="flex items-center justify-center">
                  <span className="text-xs font-medium text-muted-foreground mr-1">{UI_STRINGS.combatPanelFlurryOfBlowsLabel}:</span>
                  <p id="flurry-display" className="text-base font-bold text-accent/80">
                    {flurryAttackSequence.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/')}
                  </p>
                </div>
              )}
              <div className={cn("mt-auto flex flex-col items-center", panelFieldVerticalGap)}>
                <Label htmlFor="bab-custom-mod" className={textStyleSubLabel}>{UI_STRINGS.infoDialogCustomModifierLabel}</Label>
                <div className={cn("flex justify-center", inputWidthStandard)}>
                  <Input
                    id="bab-custom-mod"
                    type="number"
                    value={localBabMiscModifier}
                    onChange={(e) => setLocalBabMiscModifier(parseInt(e.target.value, 10) || 0)}
                    disabled={panelIsLocked}
                    className={cn(textStyleInput)}
                  />
                </div>
              </div>
            </div>

            <div className={cn("flex flex-col border rounded-md bg-card items-center text-center", panelContentPadding, panelFieldVerticalGap)}>
              <Label htmlFor="initiative-display" className={textStyleCardTitle}>{UI_STRINGS.combatPanelInitiativeLabel}</Label>
              <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                <p id="initiative-display" className={textStyleValueBig}>
                  {baseInitiative >= 0 ? '+' : ''}{baseInitiative}
                </p>
                <Button type="button" variant="ghost" size="icon-xs" className="ml-1" onClick={handleInitiativeInfo}><Info /></Button>
                <Button type="button" variant="ghost" size="icon-xs" onClick={handleOpenInitiativeRoll} aria-label={UI_STRINGS.rollDialogInitiativeAriaLabel}><Dices /></Button>
              </div>
              <div className={cn("mt-auto flex flex-col items-center", panelFieldVerticalGap)}>
                <Label htmlFor="initiative-custom-mod" className={textStyleSubLabel}>{UI_STRINGS.infoDialogCustomModifierLabel}</Label>
                <div className={cn("flex justify-center", inputWidthStandard)}>
                  <Input
                    id="initiative-custom-mod"
                    type="number"
                    value={localInitiativeMiscModifier}
                    onChange={(e) => setLocalInitiativeMiscModifier(parseInt(e.target.value, 10) || 0)}
                    disabled={panelIsLocked}
                    className={cn(textStyleInput)}
                  />
                </div>
              </div>
            </div>

            <div className={cn("flex flex-col border rounded-md bg-card items-center text-center", panelContentPadding, panelFieldVerticalGap)}>
              <Label htmlFor="grapple-mod-display" className={textStyleCardTitle}>{UI_STRINGS.combatPanelGrappleModifierLabel}</Label>
               <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                <p id="grapple-mod-display" className={textStyleValueBig}>
                  {totalGrappleModifier >= 0 ? '+' : ''}{totalGrappleModifier}
                </p>
                <Button type="button" variant="ghost" size="icon-xs" className="ml-1" onClick={handleGrappleModifierInfo}><Info /></Button>
                <Button type="button" variant="ghost" size="icon-xs" onClick={handleOpenGrappleCheckRoll} aria-label={UI_STRINGS.rollDialogGrappleCheckAriaLabel}><Dices /></Button>
               </div>
              <div className={cn("mt-auto flex flex-col items-center", panelFieldVerticalGap)}>
                <Label htmlFor="grapple-custom-mod" className={textStyleSubLabel}>{UI_STRINGS.infoDialogCustomModifierLabel}</Label>
                <div className={cn("flex justify-center", inputWidthStandard)}>
                  <Input
                    id="grapple-custom-mod"
                    type="number"
                    value={localGrappleMiscModifier}
                    onChange={(e) => setLocalGrappleMiscModifier(parseInt(e.target.value, 10) || 0)}
                    disabled={panelIsLocked}
                    className={cn(textStyleInput)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Power Attack / Combat Expertise Section */}
          {(hasPowerAttackFeat || hasCombatExpertiseFeat) && !panelIsLocked && (
            <div className={cn("grid grid-cols-1 md:grid-cols-2", panelGridGap)}>
              {hasPowerAttackFeat && (
                <div className={cn("flex flex-col border rounded-md bg-card items-center text-center", panelContentPadding, panelFieldVerticalGap)}>
                  <Label htmlFor="power-attack-value" className={cn("flex items-center", textStyleLabel, panelFieldHorizontalGap)}>
                    <Activity className="text-destructive/80"/>
                    {UI_STRINGS.powerAttackValueLabel}
                  </Label>
                   <p className={textStyleSubLabel}>{UI_STRINGS.powerAttackDescription}</p>
                   <div className={cn("flex justify-center", inputWidthStandard)}>
                    <Input
                      id="power-attack-value"
                      type="number"
                      value={localPowerAttackValue}
                      onChange={(e) => setLocalPowerAttackValue(parseInt(e.target.value, 10) || 0)}
                      min={0}
                      max={maxBabForSpinners > 0 ? maxBabForSpinners : 0}
                      disabled={panelIsLocked}
                      className={cn(textStyleInput)}
                    />
                   </div>
                </div>
              )}
              {hasCombatExpertiseFeat && (
                <div className={cn("flex flex-col border rounded-md bg-card items-center text-center", panelContentPadding, panelFieldVerticalGap)}>
                  <Label htmlFor="combat-expertise-value" className={cn("flex items-center", textStyleLabel, panelFieldHorizontalGap)}>
                    <ShieldIcon className="text-blue-500/80"/>
                    {UI_STRINGS.combatExpertiseValueLabel}
                  </Label>
                  <p className={textStyleSubLabel}>{UI_STRINGS.combatExpertiseDescription}</p>
                  <div className={cn("flex justify-center", inputWidthStandard)}>
                    <Input
                      id="combat-expertise-value"
                      type="number"
                      value={localCombatExpertiseValue}
                      onChange={(e) => setLocalCombatExpertiseValue(parseInt(e.target.value, 10) || 0)}
                      min={0}
                      max={maxBabForSpinners > 0 ? maxBabForSpinners : 0}
                      disabled={panelIsLocked}
                      className={cn(textStyleInput)}
                    />
                   </div>
                </div>
              )}
            </div>
          )}

          {/* Attack Sections */}
          <div className={cn("grid grid-cols-1 md:grid-cols-2", panelGridGap)}>
            <Card>
                <CardHeader className={cn(panelHeaderPadding)}>
                    <CardTitle className={cn(textStyleCardTitle, "flex items-center gap-2")}><Hand />{UI_STRINGS.attacksPanelMeleeTitle}</CardTitle>
                </CardHeader>
                <CardContent className={cn("flex flex-col", panelContentPadding, panelFieldVerticalGap)}>
                    <div className="flex flex-col gap-1">
                        <Label htmlFor="melee-weapon-select" className={textStyleLabel}>{UI_STRINGS.attacksPanelMeleeWeaponLabel}</Label>
                        <Select value={selectedMeleeWeaponInstanceId} onValueChange={setSelectedMeleeWeaponInstanceId} disabled={panelIsLocked}>
                            <SelectTrigger id="melee-weapon-select"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                {meleeWeaponInstances.map(wInst => <SelectItem key={wInst.instanceId} value={wInst.instanceId}>{getLocalizedString(wInst.definition.label, currentLang, DEFAULT_LANGUAGE)}</SelectItem>)}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    {selectedMeleeWeaponDefinition && (
                      <div className="flex justify-between items-center w-full">
                        <DualBadge
                          color="primary"
                          leftLabel={UI_STRINGS.attacksPanelWeaponDamageLabel}
                          rightLabel={selectedMeleeWeaponInstanceId === 'unarmed' ? unarmedBaseDamageFromFeat : selectedMeleeWeaponDefinition.damage || 'N/A'}
                          className={textStyleBadgeSmall}
                        />
                        <DualBadge
                          color="secondary"
                          leftLabel={(UI_STRINGS.attacksPanelCriticalOnLabel || "Critical on {range}").replace('{range}', selectedMeleeWeaponDefinition.criticalRange || '20')}
                          rightLabel={selectedMeleeWeaponDefinition.criticalMultiplier || 'x2'}
                          className={textStyleBadgeSmall}
                        />
                      </div>
                    )}
                    <div className="flex justify-around items-center mt-2">
                        <div className="text-center flex flex-col gap-1">
                            <Label className={textStyleLabel}>{UI_STRINGS.attacksPanelAttackBonusLabel}</Label>
                            <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                                <p className={textStyleModifier}>{calculatedMeleeAttackBonus >= 0 ? '+' : ''}{calculatedMeleeAttackBonus}</p>
                                <Button type="button" variant="ghost" size="icon-xs" className="ml-1" onClick={handleOpenMeleeAttackInfo}><Info /></Button>
                                <Button type="button" variant="ghost" size="icon-xs" onClick={handleOpenMeleeAttackRollDialog} aria-label={(UI_STRINGS.rollDialogMeleeAttackAriaLabel || "Roll Melee Attack with {weaponName}").replace("{weaponName}", selectedMeleeWeaponDefinition?.label ? getLocalizedString(selectedMeleeWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : 'Unarmed')}><Dices /></Button>
                            </div>
                        </div>
                        <div className="text-center flex flex-col gap-1">
                            <Label className={textStyleLabel}>{UI_STRINGS.attacksPanelDamageBonusLabel}</Label>
                            <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                                <p className={textStyleModifier}>{renderModifierValue(calculatedMeleeNumericalDamageBonus)}</p>
                                <Button type="button" variant="ghost" size="icon-xs" className="ml-1" onClick={handleOpenMeleeDamageInfo}><Info /></Button>
                                <Button type="button" variant="ghost" size="icon-xs" onClick={handleOpenMeleeDamageRollDialog} disabled={!selectedMeleeWeaponDefinition && selectedMeleeWeaponInstanceId !== 'unarmed'} aria-label={(UI_STRINGS.rollDialogDamageAriaLabel || "Roll Damage for {weaponName}").replace("{weaponName}", selectedMeleeWeaponDefinition?.label ? getLocalizedString(selectedMeleeWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : UI_STRINGS.attacksPanelUnarmedOption || "Unarmed")}><Dices /></Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader className={cn(panelHeaderPadding)}>
                    <CardTitle className={cn(textStyleCardTitle, "flex items-center gap-2")}><ArrowRightLeft />{UI_STRINGS.attacksPanelRangedTitle}</CardTitle>
                </CardHeader>
                <CardContent className={cn("flex flex-col", panelContentPadding, panelFieldVerticalGap)}>
                    <div className="flex flex-col gap-1">
                        <Label htmlFor="ranged-weapon-select" className={textStyleLabel}>{UI_STRINGS.attacksPanelRangedWeaponLabel}</Label>
                        <Select value={selectedRangedWeaponInstanceId} onValueChange={setSelectedRangedWeaponInstanceId} disabled={panelIsLocked || rangedWeaponInstances.length === 0}>
                            <SelectTrigger id="ranged-weapon-select">
                                <SelectValue placeholder={rangedWeaponInstances.length === 0 ? (UI_STRINGS.attacksPanelNoRangedWeapons) : (UI_STRINGS.attacksPanelSelectRangedWeapon)} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                {rangedWeaponInstances.length === 0 ?
                                    <SelectItem value="none" disabled>{UI_STRINGS.attacksPanelNoRangedWeapons}</SelectItem>
                                    :
                                    rangedWeaponInstances.map(wInst => <SelectItem key={wInst.instanceId} value={wInst.instanceId}>{getLocalizedString(wInst.definition.label, currentLang, DEFAULT_LANGUAGE)}</SelectItem>)
                                }
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    {selectedRangedWeaponDefinition && (
                        <div className={cn("flex flex-col", panelFieldVerticalGap)}>
                          <div className="flex justify-between items-center w-full">
                            <DualBadge
                              color="primary"
                              leftLabel={UI_STRINGS.attacksPanelWeaponDamageLabel}
                              rightLabel={selectedRangedWeaponDefinition.damage || 'N/A'}
                              className={textStyleBadgeSmall}
                            />
                            <DualBadge
                              color="secondary"
                              leftLabel={(UI_STRINGS.attacksPanelCriticalOnLabel || "Critical on {range}").replace('{range}', selectedRangedWeaponDefinition.criticalRange || '20')}
                              rightLabel={selectedRangedWeaponDefinition.criticalMultiplier || 'x2'}
                              className={textStyleBadgeSmall}
                            />
                          </div>
                          <div className={cn("flex flex-wrap items-center", panelBadgeGroupGap)}>
                            {selectedRangedWeaponDefinition.rangeIncrement && (
                              <DualBadge
                                color="default"
                                leftLabel={UI_STRINGS.attacksPanelWeaponRangeLabel}
                                rightLabel={`${selectedRangedWeaponDefinition.rangeIncrement} ${UI_STRINGS.speedUnit || "ft."}`}
                                className={textStyleBadgeSmall}
                              />
                            )}
                            {selectedRangedWeaponDefinition.damageType && (
                              <DualBadge
                                color="default"
                                leftLabel={UI_STRINGS.attacksPanelWeaponDamageTypeLabel}
                                rightLabel={getLocalizedString(selectedRangedWeaponDefinition.damageType, currentLang, DEFAULT_LANGUAGE)}
                                className={textStyleBadgeSmall}
                              />
                            )}
                          </div>
                        </div>
                    )}
                    {selectedRangedWeaponDefinition ? (
                      <div className="flex justify-around items-center mt-2">
                          <div className="text-center flex flex-col gap-1">
                              <Label className={textStyleLabel}>{UI_STRINGS.attacksPanelAttackBonusLabel}</Label>
                              <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                                  <p className={textStyleModifier}>{calculatedRangedAttackBonus >= 0 ? '+' : ''}{calculatedRangedAttackBonus}</p>
                                  <Button type="button" variant="ghost" size="icon-xs" className="ml-1" onClick={handleOpenRangedAttackInfo}><Info /></Button>
                                  <Button type="button" variant="ghost" size="icon-xs" onClick={handleOpenRangedAttackRollDialog} aria-label={(UI_STRINGS.rollDialogRangedAttackAriaLabel || "Roll Ranged Attack with {weaponName}").replace("{weaponName}", selectedRangedWeaponDefinition?.label ? getLocalizedString(selectedRangedWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : '')}><Dices /></Button>
                              </div>
                          </div>
                          <div className="text-center flex flex-col gap-1">
                              <Label className={textStyleLabel}>{UI_STRINGS.attacksPanelDamageBonusLabel}</Label>
                              <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                                  <p className={textStyleModifier}>{renderModifierValue(calculatedRangedNumericalDamageBonus)}</p>
                                  <Button type="button" variant="ghost" size="icon-xs" className="ml-1" onClick={handleOpenRangedDamageInfo}><Info /></Button>
                                  <Button type="button" variant="ghost" size="icon-xs" onClick={handleOpenRangedDamageRollDialog} aria-label={(UI_STRINGS.rollDialogDamageAriaLabel || "Roll Damage for {weaponName}").replace("{weaponName}", selectedRangedWeaponDefinition?.label ? getLocalizedString(selectedRangedWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : '')}><Dices /></Button>
                              </div>
                          </div>
                      </div>
                    ) : <div className="h-10"></div>}
                </CardContent>
            </Card>
          </div>
        </CardContent>
      )}
    </LockablePanelWrapper>
  );
};
CombatPanelComponent.displayName = 'CombatPanelComponent';
export const CombatPanel = React.memo(CombatPanelComponent);
