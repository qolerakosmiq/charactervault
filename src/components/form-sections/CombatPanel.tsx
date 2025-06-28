
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
  WeaponStyleType,
  LocalizedString
} from '@/types/character-core';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Swords, Info, Dices, Hand, ArrowRightLeft, Activity, Shield as ShieldIcon } from 'lucide-react';
import { getAbilityModifierByName, getBab, calculateInitiative, calculateGrapple, getSizeModifierGrapple, getUnarmedGrappleDamage, getSizeModifierAttack } from '@/lib/dnd-utils';
import { useI18n } from '@/context/I18nProvider';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import type { RollDialogProps } from '@/components/RollDialog';
import { useDefinitionsStore } from '@/lib/definitions-store';
import { cn } from '@/lib/utils';
import { DualBadge, type DualBadgeProps } from '@/components/ui/DualBadge';
import { getLocalizedString } from '@/i18n/i18n-data';
import { DEFAULT_LANGUAGE, type LanguageCode } from '@/i18n/config';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper';
import { Input } from '@/components/ui/input';
import {
  debounceDelayFormInput,
  panelContentPadding,
  panelFieldHorizontalGap,
  panelFieldVerticalGap,
  panelGridGap,
  panelBadgeGroupGap,
  textStyleCardTitle,
  textStyleInput,
  textStyleLabel,
  textStyleModifier,
  textStyleValueBig,
  inputWidthStandard,
  textStylePanelSectionHeader,
  textStyleSubLabel,
  textStyleBadgeSmall,
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
  const {
    classes, abilityScores, size, inventory, equippedGear,
    feats: characterFeats, babMiscModifier, initiativeMiscModifier,
    grappleMiscModifier, sizeModifierAttack, powerAttackValue,
    combatExpertiseValue
  } = combatData;
  
  const { translations, isLoading: translationsLoading, language: currentLang } = useI18n();
  const { rerollTwentiesForChecks } = useDefinitionsStore(state => ({
    rerollTwentiesForChecks: state.rerollTwentiesForChecks,
  }));

  const { DND_CLASSES, SIZES, ABILITY_LABELS, UI_STRINGS, ITEM_DEFINITIONS_WEAPONS, ITEM_DEFINITIONS_SHIELDS } = translations || {};
  
  const handleUpdateCallback = React.useCallback((fieldName: CombatFieldKey) => (value: any) => {
    if (onCharacterUpdate) {
      onCharacterUpdate(fieldName, value);
    }
  }, [onCharacterUpdate]);

  const [localBabMiscModifier, setLocalBabMiscModifier] = useDebouncedFormField(
    babMiscModifier || 0, handleUpdateCallback('babMiscModifier'), debounceDelayFormInput
  );
  const [localInitiativeMiscModifier, setLocalInitiativeMiscModifier] = useDebouncedFormField(
    initiativeMiscModifier || 0, handleUpdateCallback('initiativeMiscModifier'), debounceDelayFormInput
  );
  const [localGrappleMiscModifier, setLocalGrappleMiscModifier] = useDebouncedFormField(
    grappleMiscModifier || 0, handleUpdateCallback('grappleMiscModifier'), debounceDelayFormInput
  );
  const [localPowerAttackValue, setLocalPowerAttackValue] = useDebouncedFormField(
    powerAttackValue || 0, handleUpdateCallback('powerAttackValue'), debounceDelayFormInput
  );
  const [localCombatExpertiseValue, setLocalCombatExpertiseValue] = useDebouncedFormField(
    combatExpertiseValue || 0, handleUpdateCallback('combatExpertiseValue'), debounceDelayFormInput
  );

  const [selectedMainHandMeleeWeaponInstanceId, setSelectedMainHandMeleeWeaponInstanceId] = React.useState<string>('unarmed');
  const [selectedOffHandMeleeWeaponInstanceId, setSelectedOffHandMeleeWeaponInstanceId] = React.useState<string>('none');
  const [selectedRangedWeaponInstanceId, setSelectedRangedWeaponInstanceId] = React.useState<string>('none');

  const strModifier = React.useMemo(() => getAbilityModifierByName(abilityScores, 'strength'), [abilityScores]);
  const dexModifier = React.useMemo(() => getAbilityModifierByName(abilityScores, 'dexterity'), [abilityScores]);
  
  const totalBabWithModifier = React.useMemo(() => {
    if (!DND_CLASSES) return [0];
    const babArray = getBab(classes || [], DND_CLASSES);
    return babArray.map(bab => bab + (localBabMiscModifier || 0));
  }, [classes, DND_CLASSES, localBabMiscModifier]);

  const baseInitiative = React.useMemo(() => {
    if (!aggregatedFeatEffects) return 0;
    return calculateInitiative(dexModifier, localInitiativeMiscModifier || 0) + (aggregatedFeatEffects.initiativeBonus || 0);
  }, [dexModifier, localInitiativeMiscModifier, aggregatedFeatEffects]);

  const totalGrappleModifier = React.useMemo(() => {
    if (!SIZES || !DND_CLASSES || !aggregatedFeatEffects) return 0;
    return calculateGrapple(classes || [], strModifier, getSizeModifierGrapple(size, SIZES), DND_CLASSES) + (localGrappleMiscModifier || 0) + (aggregatedFeatEffects?.attackRollBonuses?.filter(b => b.appliesTo === 'grapple' && b.isActive).reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0) || 0);
  }, [classes, strModifier, size, SIZES, DND_CLASSES, localGrappleMiscModifier, aggregatedFeatEffects]);
  
  const hasPowerAttackFeat = React.useMemo(() => allFeatDefinitions.some(f => f.id === 'power-attack' && characterFeats.some(cf => cf.definitionId === f.id)), [allFeatDefinitions, characterFeats]);
  const hasCombatExpertiseFeat = React.useMemo(() => allFeatDefinitions.some(f => f.id === 'combat-expertise' && characterFeats.some(cf => cf.definitionId === f.id)), [allFeatDefinitions, characterFeats]);
  const maxBabForSpinners = React.useMemo(() => (DND_CLASSES ? getBab(classes || [], DND_CLASSES) : [0])[0] || 0, [classes, DND_CLASSES]);
  
  const allWeaponAndShieldDefinitions = React.useMemo(() => {
    if (translationsLoading || !ITEM_DEFINITIONS_WEAPONS || !ITEM_DEFINITIONS_SHIELDS) return [];
    const weapons = ITEM_DEFINITIONS_WEAPONS || [];
    const shields = (ITEM_DEFINITIONS_SHIELDS || []).filter(s => s.damage);
    return [...weapons, ...shields];
  }, [translationsLoading, ITEM_DEFINITIONS_WEAPONS, ITEM_DEFINITIONS_SHIELDS]);

  const getWeaponDefinition = React.useCallback((definitionId: string | undefined): ItemDefinition | undefined => {
    if (!definitionId) return undefined;
    return allWeaponAndShieldDefinitions.find(def => def.definitionId === definitionId);
  }, [allWeaponAndShieldDefinitions]);
  
  const getWeaponEnhancementBonus = React.useCallback((itemDef?: ItemDefinition): { attack: number, damage: number } => {
    let attackBonus = 0;
    let damageBonus = 0;
    if (itemDef?.effects) {
      itemDef.effects.forEach(effect => {
        if (effect.type === 'attackRoll' && (effect as any).bonusType === 'enhancement' && typeof (effect as any).value === 'number') {
          attackBonus += (effect as any).value;
        }
        if (effect.type === 'damageRoll' && (effect as any).bonusType === 'enhancement' && typeof (effect as any).value === 'number') {
          damageBonus += (effect as any).value;
        }
      });
    }
    return { attack: attackBonus, damage: damageBonus };
  }, []);

  const getActiveAttackBonuses = React.useCallback((weaponType: WeaponStyleType | 'unarmed', selectedWeaponDefinition?: ItemDefinition | null): AttackRollEffect[] => {
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
  }, [aggregatedFeatEffects, currentLang]);
  
  const getActiveDamageBonuses = React.useCallback((weaponType: WeaponStyleType | 'unarmed', selectedWeaponDefinition?: ItemDefinition | null): DamageRollEffect[] => {
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
  }, [aggregatedFeatEffects, currentLang]);

  const unarmedBaseDamageFromFeat = React.useMemo(() => {
    if (!UI_STRINGS || !aggregatedFeatEffects) return '1d3';
    return aggregatedFeatEffects.modifiedMechanics?.unarmedDamage?.isActive && typeof aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value === 'string'
      ? aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value
      : UI_STRINGS.unarmedDamageDefault;
  }, [aggregatedFeatEffects, UI_STRINGS]);

  const meleeWeaponInstances = React.useMemo(() => {
    if (!UI_STRINGS || !aggregatedFeatEffects) return [];
    const inventoryItems = inventory?.filter(itemInst => {
        const itemDef = getWeaponDefinition(itemInst.definitionId);
        return itemDef && (itemDef.itemType === 'weapon' || (itemDef.itemType === 'shield' && !!itemDef.damage));
    }) || [];
  
    const unarmedDef: ItemDefinition = {
      definitionId: 'unarmed-placeholder',
      label: { en: 'Unarmed', fr: 'À mains nues' },
      itemType: 'weapon' as const,
      weaponType: 'melee' as const,
      damage: unarmedBaseDamageFromFeat,
      criticalRange: '20',
      criticalMultiplier: '×2'
    };
  
    const meleeInventoryItems = inventoryItems
      .map(inst => ({ ...inst, definition: getWeaponDefinition(inst.definitionId)! }))
      .filter(item => item.definition && (item.definition.weaponType === 'melee' || item.definition.weaponType === 'melee-or-ranged'));
      
    return [
      { instanceId: 'unarmed', definitionId: 'unarmed-placeholder', quantity: 1, definition: unarmedDef },
      ...meleeInventoryItems,
    ];
  }, [inventory, getWeaponDefinition, aggregatedFeatEffects, UI_STRINGS, unarmedBaseDamageFromFeat]);
  
  const rangedWeaponInstances = React.useMemo(() => {
    if (!inventory) return [];
    return inventory
      .map(inst => ({ ...inst, definition: getWeaponDefinition(inst.definitionId)! }))
      .filter(item => item.definition && (item.definition.weaponType === 'ranged' || item.definition.weaponType === 'melee-or-ranged'));
  }, [inventory, getWeaponDefinition]);
  
  React.useEffect(() => {
    const mainHandInstanceId = equippedGear?.['main-hand'];
    const twoHandInstanceId = equippedGear?.['two-hand'];
    let finalMainHandId = 'unarmed'; 

    if (mainHandInstanceId) {
        const mainHandItem = inventory?.find(i => i.instanceId === mainHandInstanceId);
        const mainHandDef = getWeaponDefinition(mainHandItem?.definitionId);
        if (mainHandDef && (mainHandDef.itemType === 'weapon' || mainHandDef.itemType === 'shield') && (mainHandDef.weaponType === 'melee' || mainHandDef.weaponType === 'melee-or-ranged')) {
            finalMainHandId = mainHandInstanceId;
        }
    } else if (twoHandInstanceId) {
        const twoHandItem = inventory?.find(i => i.instanceId === twoHandInstanceId);
        const twoHandDef = getWeaponDefinition(twoHandItem?.definitionId);
        if (twoHandDef && (twoHandDef.itemType === 'weapon' || twoHandDef.itemType === 'shield') && (twoHandDef.weaponType === 'melee' || twoHandDef.weaponType === 'melee-or-ranged')) {
            finalMainHandId = twoHandInstanceId;
        }
    }
    setSelectedMainHandMeleeWeaponInstanceId(finalMainHandId);

    const offHandInstanceId = equippedGear?.['off-hand'];
    let finalOffHandId = 'none';

    if (offHandInstanceId) {
        const offHandItem = inventory?.find(i => i.instanceId === offHandInstanceId);
        const offHandDef = getWeaponDefinition(offHandItem?.definitionId);
        if (offHandDef && (offHandDef.itemType === 'weapon' || offHandDef.itemType === 'shield') && (offHandDef.weaponType === 'melee' || offHandDef.weaponType === 'melee-or-ranged')) {
            finalOffHandId = offHandInstanceId;
        }
    }
    setSelectedOffHandMeleeWeaponInstanceId(finalOffHandId);

    let rangedEquipped = false;
    if (mainHandInstanceId) {
      const mainHandItem = inventory?.find(i => i.instanceId === mainHandInstanceId);
      const mainHandDef = getWeaponDefinition(mainHandItem?.definitionId);
      if (mainHandDef?.itemType === 'weapon' && (mainHandDef.weaponType === 'ranged' || mainHandDef.weaponType === 'melee-or-ranged')) {
        setSelectedRangedWeaponInstanceId(mainHandInstanceId);
        rangedEquipped = true;
      }
    }
    if (!rangedEquipped && twoHandInstanceId) {
      const twoHandItem = inventory?.find(i => i.instanceId === twoHandInstanceId);
      const twoHandDef = getWeaponDefinition(twoHandItem?.definitionId);
       if (twoHandDef?.itemType === 'weapon' && (twoHandDef.weaponType === 'ranged' || twoHandDef.weaponType === 'melee-or-ranged')) {
         setSelectedRangedWeaponInstanceId(twoHandInstanceId);
         rangedEquipped = true;
       }
    }
    if (!rangedEquipped) {
        setSelectedRangedWeaponInstanceId('none');
    }
  }, [equippedGear, inventory, getWeaponDefinition]);
  
  const calculateFinalAttackBonus = React.useCallback((baseBab: number, abilityMod: number, sizeMod: number, weaponType: 'melee' | 'ranged' | 'unarmed', selectedWeaponDefinition?: ItemDefinition | null, powerAttackVal: number = 0, combatExpertiseVal: number = 0): number => {
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

  const calculateFinalNumericalDamageBonus = React.useCallback((baseAbilityMod: number, weaponType: 'melee' | 'ranged' | 'unarmed', selectedWeaponDefinition?: ItemDefinition | null, powerAttackVal: number = 0): number => {
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
  
  const selectedMainHandMeleeWeaponInstance = React.useMemo(() => meleeWeaponInstances.find(w => w.instanceId === selectedMainHandMeleeWeaponInstanceId), [meleeWeaponInstances, selectedMainHandMeleeWeaponInstanceId]);
  const selectedMainHandMeleeWeaponDefinition = selectedMainHandMeleeWeaponInstance?.definition;
  
  const selectedOffHandMeleeWeaponInstance = React.useMemo(() => meleeWeaponInstances.find(w => w.instanceId === selectedOffHandMeleeWeaponInstanceId), [meleeWeaponInstances, selectedOffHandMeleeWeaponInstanceId]);
  const selectedOffHandMeleeWeaponDefinition = selectedOffHandMeleeWeaponInstance?.definition;
  
  const selectedRangedWeaponInstance = React.useMemo(() => rangedWeaponInstances.find(w => w.instanceId === selectedRangedWeaponInstanceId), [rangedWeaponInstances, selectedRangedWeaponInstanceId]);
  const selectedRangedWeaponDefinition = selectedRangedWeaponInstance?.definition;
  
  const meleeAbilityModForAttack = React.useMemo(() => selectedMainHandMeleeWeaponDefinition?.isFinesseWeapon && dexModifier > strModifier ? dexModifier : strModifier, [selectedMainHandMeleeWeaponDefinition, dexModifier, strModifier]);
  
  const calculatedMeleeAttackBonus = React.useMemo(() => calculateFinalAttackBonus(totalBabWithModifier[0], meleeAbilityModForAttack, sizeModifierAttack || 0, 'melee', selectedMainHandMeleeWeaponDefinition, localPowerAttackValue, localCombatExpertiseValue), [calculateFinalAttackBonus, totalBabWithModifier, meleeAbilityModForAttack, sizeModifierAttack, selectedMainHandMeleeWeaponDefinition, localPowerAttackValue, localCombatExpertiseValue]);
  const calculatedMeleeNumericalDamageBonus = React.useMemo(() => calculateFinalNumericalDamageBonus(strModifier, 'melee', selectedMainHandMeleeWeaponDefinition, localPowerAttackValue), [calculateFinalNumericalDamageBonus, strModifier, selectedMainHandMeleeWeaponDefinition, localPowerAttackValue]);
  
  const calculatedRangedAttackBonus = React.useMemo(() => selectedRangedWeaponDefinition ? calculateFinalAttackBonus(totalBabWithModifier[0], dexModifier, sizeModifierAttack || 0, 'ranged', selectedRangedWeaponDefinition) : 0, [calculateFinalAttackBonus, selectedRangedWeaponDefinition, totalBabWithModifier, dexModifier, sizeModifierAttack]);
  const calculatedRangedNumericalDamageBonus = React.useMemo(() => selectedRangedWeaponDefinition ? calculateFinalNumericalDamageBonus(0, 'ranged', selectedRangedWeaponDefinition) : 0, [calculateFinalNumericalDamageBonus, selectedRangedWeaponDefinition]);
  
  const handleBabInfo = React.useCallback(() => onOpenCombatStatInfoDialog({ type: 'babBreakdown' }), [onOpenCombatStatInfoDialog]);
  const handleInitiativeInfo = React.useCallback(() => onOpenCombatStatInfoDialog({ type: 'initiativeBreakdown' }), [onOpenCombatStatInfoDialog]);
  const handleGrappleModifierInfo = React.useCallback(() => onOpenCombatStatInfoDialog({ type: 'grappleModifierBreakdown' }), [onOpenCombatStatInfoDialog]);
  const handleOpenAttackBreakdown = React.useCallback((isMelee: boolean) => {
      const weaponDef = isMelee ? selectedMainHandMeleeWeaponDefinition : selectedRangedWeaponDefinition;
      const weaponInstId = isMelee ? selectedMainHandMeleeWeaponInstanceId : selectedRangedWeaponInstanceId;
      if (!weaponDef && (!isMelee || weaponInstId !== 'unarmed')) return;

      const components: GenericBreakdownItem[] = [];
      const bab = totalBabWithModifier[0];
      const abilityMod = isMelee ? meleeAbilityModForAttack : dexModifier;
      const abilityAbbr = ABILITY_LABELS.find(al => al.id === (isMelee ? (weaponDef?.isFinesseWeapon && dexModifier > strModifier ? 'dexterity' : 'strength') : 'dexterity'))?.abbr || 'MOD';
      const sizeMod = sizeModifierAttack || 0;
      const enhBonus = getWeaponEnhancementBonus(weaponDef).attack;
      const featBonus = getActiveAttackBonuses(isMelee ? (weaponInstId === 'unarmed' ? 'unarmed' : 'melee') : 'ranged', weaponDef).reduce((sum, eff) => sum + ((eff.value as number) || 0), 0);
      
      components.push({ label: UI_STRINGS.attacksPanelBabLabel, value: bab });
      components.push({ label: (UI_STRINGS.attacksPanelAbilityModLabel).replace("{abilityAbbr}", abilityAbbr), value: abilityMod });
      if(sizeMod !== 0) components.push({ label: UI_STRINGS.attacksPanelSizeModLabel, value: sizeMod });
      if(enhBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelWeaponEnhancementLabel, value: enhBonus });
      if(featBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelFeatBonusLabel, value: featBonus });
      if (isMelee && (localPowerAttackValue || 0) > 0) components.push({ label: UI_STRINGS.powerAttackPenaltyLabel, value: -(localPowerAttackValue || 0) });
      if (isMelee && (localCombatExpertiseValue || 0) > 0) components.push({ label: UI_STRINGS.combatExpertisePenaltyLabel, value: -(localCombatExpertiseValue || 0) });
      
      const total = bab + abilityMod + sizeMod + enhBonus + featBonus - (isMelee ? (localPowerAttackValue || 0) + (localCombatExpertiseValue || 0) : 0);
      components.push({ label: UI_STRINGS.infoDialogTotalLabel, value: total, isBold: true });

      onOpenCombatStatInfoDialog({
        type: 'meleeAttackBreakdown',
        components
      });
  }, [totalBabWithModifier, meleeAbilityModForAttack, dexModifier, sizeModifierAttack, getWeaponEnhancementBonus, getActiveAttackBonuses, localPowerAttackValue, localCombatExpertiseValue, UI_STRINGS, ABILITY_LABELS, selectedMainHandMeleeWeaponDefinition, selectedRangedWeaponDefinition, selectedMainHandMeleeWeaponInstanceId, onOpenCombatStatInfoDialog]);

  const handleOpenDamageBreakdown = React.useCallback((isMelee: boolean) => {
    const weaponDef = isMelee ? selectedMainHandMeleeWeaponDefinition : selectedRangedWeaponDefinition;
    const weaponInstId = isMelee ? selectedMainHandMeleeWeaponInstanceId : selectedRangedWeaponInstanceId;
    if (!weaponDef && (!isMelee || weaponInstId !== 'unarmed')) return;

    const components: GenericBreakdownItem[] = [];
    const baseDamage = isMelee ? (weaponInstId === 'unarmed' ? unarmedBaseDamageFromFeat : weaponDef?.damage) : weaponDef?.damage;
    components.push({ label: UI_STRINGS.attacksPanelBaseWeaponDamageLabel, value: baseDamage || "—", isRawValue: true });

    const abilityMod = isMelee ? strModifier : 0;
    const abilityAbbr = isMelee ? (ABILITY_LABELS.find(al => al.id === 'strength')?.abbr || 'STR') : '';
    if (abilityMod !== 0) components.push({ label: (UI_STRINGS.attacksPanelAbilityModLabel).replace("{abilityAbbr}", abilityAbbr), value: abilityMod });

    const enhBonus = getWeaponEnhancementBonus(weaponDef).damage;
    if(enhBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelWeaponEnhancementLabel, value: enhBonus });
    
    const featBonus = getActiveDamageBonuses(isMelee ? (weaponInstId === 'unarmed' ? 'unarmed' : 'melee') : 'ranged', weaponDef).reduce((sum, eff) => sum + ((eff.value as number) || 0), 0);
    if(featBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelFeatBonusLabel, value: featBonus });

    if (isMelee && (localPowerAttackValue || 0) > 0) components.push({ label: UI_STRINGS.powerAttackDamageBonusLabel, value: (localPowerAttackValue || 0) });

    const totalNumericBonus = (isMelee ? calculatedMeleeNumericalDamageBonus : calculatedRangedNumericalDamageBonus);
    components.push({ label: UI_STRINGS.infoDialogTotalNumericBonusLabel, value: totalNumericBonus, isBold: true });
    
    onOpenCombatStatInfoDialog({
      type: 'meleeDamageBreakdown',
      components
    });
  }, [selectedMainHandMeleeWeaponDefinition, selectedRangedWeaponDefinition, selectedMainHandMeleeWeaponInstanceId, unarmedBaseDamageFromFeat, strModifier, getWeaponEnhancementBonus, getActiveDamageBonuses, localPowerAttackValue, UI_STRINGS, ABILITY_LABELS, onOpenCombatStatInfoDialog, calculatedMeleeNumericalDamageBonus, calculatedRangedNumericalDamageBonus]);

  const parseCritMultiplier = React.useCallback((critMultString: string | undefined): number => {
    if (!critMultString) return 1;
    const match = critMultString.toLowerCase().match(/x(\d+)|×(\d+)/);
    return match ? parseInt(match[1] || match[2], 10) : 1;
  }, []);
  
  const handleRollAction = React.useCallback((rollType: 'initiative' | 'grapple' | 'melee-attack' | 'melee-damage' | 'ranged-attack' | 'ranged-damage') => {
    if (!UI_STRINGS || !DND_CLASSES || !SIZES || !ABILITY_LABELS || !abilityScores || !aggregatedFeatEffects) return;
    
    let dialogTitle = "";
    let baseModifier = 0;
    let calculationBreakdown: GenericBreakdownItem[] = [];
    let weaponDamageDiceString: string = "";
    let weaponCriticalMultiplier: number = 1;
    let extraDamageDice: string[] = [];

    switch(rollType) {
      case 'initiative':
        baseModifier = baseInitiative;
        dialogTitle = UI_STRINGS.rollDialogTitleInitiative || 'Roll Initiative';
        if (dexModifier !== 0) calculationBreakdown.push({ label: (UI_STRINGS.attacksPanelAbilityModLabel || 'Ability Mod ({abilityAbbr})').replace("{abilityAbbr}", 'DEX'), value: dexModifier });
        if ((aggregatedFeatEffects.initiativeBonus || 0) !== 0) calculationBreakdown.push({ label: UI_STRINGS.attacksPanelFeatBonusLabel || 'Feat Bonus', value: aggregatedFeatEffects.initiativeBonus || 0 });
        if (localInitiativeMiscModifier !== 0) calculationBreakdown.push({ label: UI_STRINGS.infoDialogCustomModifierLabel || 'Misc Modifier', value: localInitiativeMiscModifier || 0 });
        break;
      
      case 'grapple':
        baseModifier = totalGrappleModifier;
        dialogTitle = UI_STRINGS.rollDialogTitleGrappleCheck || 'Roll Grapple Check';
        if(totalBabWithModifier[0]) calculationBreakdown.push({ label: UI_STRINGS.attacksPanelBabLabel || 'Base Attack Bonus', value: totalBabWithModifier[0] });
        if(strModifier) calculationBreakdown.push({ label: (UI_STRINGS.attacksPanelAbilityModLabel || 'Ability Mod ({abilityAbbr})').replace("{abilityAbbr}", 'STR'), value: strModifier });
        const sizeModGrapple = getSizeModifierGrapple(size, SIZES);
        if(sizeModGrapple) calculationBreakdown.push({ label: UI_STRINGS.attacksPanelSizeModLabel || 'Size Mod (Attack)', value: sizeModGrapple });
        const featGrappleBonus = (aggregatedFeatEffects.attackRollBonuses?.filter(b => b.appliesTo === 'grapple' && b.isActive).reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0) || 0);
        if(featGrappleBonus) calculationBreakdown.push({ label: UI_STRINGS.attacksPanelFeatBonusLabel || 'Feat Bonus', value: featGrappleBonus });
        if(localGrappleMiscModifier) calculationBreakdown.push({ label: UI_STRINGS.infoDialogCustomModifierLabel || 'Misc Modifier', value: localGrappleMiscModifier || 0 });
        break;

      case 'melee-attack':
        calculationBreakdown = getAttackBreakdown(true);
        baseModifier = calculatedMeleeAttackBonus;
        const meleeWeaponName = selectedMainHandMeleeWeaponDefinition ? getLocalizedString(selectedMainHandMeleeWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : UI_STRINGS.attacksPanelUnarmedOption;
        dialogTitle = (UI_STRINGS.rollDialogTitleMeleeAttackFormat || "Roll Melee Attack ({weaponName})").replace("{weaponName}", meleeWeaponName);
        break;
      
      case 'melee-damage':
        calculationBreakdown = getDamageBreakdown(true);
        baseModifier = calculatedMeleeNumericalDamageBonus;
        const meleeDamageWeaponName = selectedMainHandMeleeWeaponDefinition ? getLocalizedString(selectedMainHandMeleeWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : UI_STRINGS.attacksPanelUnarmedOption;
        const meleeDamageDice = selectedMainHandMeleeWeaponInstanceId === 'unarmed' ? unarmedBaseDamageFromFeat : selectedMainHandMeleeWeaponDefinition?.damage || '—';
        dialogTitle = (UI_STRINGS.rollDialogTitleMeleeDamageFormat || "Melee Damage ({weaponName}: {dice})").replace("{weaponName}", meleeDamageWeaponName).replace("{dice}", meleeDamageDice);
        weaponDamageDiceString = meleeDamageDice;
        weaponCriticalMultiplier = parseCritMultiplier(selectedMainHandMeleeWeaponDefinition?.criticalMultiplier);
        extraDamageDice = getActiveDamageBonuses(selectedMainHandMeleeWeaponInstanceId === 'unarmed' ? 'unarmed' : 'melee', selectedMainHandMeleeWeaponDefinition).filter(d => typeof d.value === 'string' && d.value.includes('d')).map(d => d.value as string);
        break;
      
      case 'ranged-attack':
        if (!selectedRangedWeaponDefinition) return;
        calculationBreakdown = getAttackBreakdown(false);
        baseModifier = calculatedRangedAttackBonus;
        const rangedWeaponName = getLocalizedString(selectedRangedWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE);
        dialogTitle = (UI_STRINGS.rollDialogTitleRangedAttackFormat || "Roll Ranged Attack ({weaponName})").replace("{weaponName}", rangedWeaponName);
        break;
      
      case 'ranged-damage':
        if (!selectedRangedWeaponDefinition) return;
        calculationBreakdown = getDamageBreakdown(false);
        baseModifier = calculatedRangedNumericalDamageBonus;
        const rangedDamageWeaponName = getLocalizedString(selectedRangedWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE);
        const rangedDamageDice = selectedRangedWeaponDefinition?.damage || '—';
        dialogTitle = (UI_STRINGS.rollDialogTitleRangedDamageFormat || "Ranged Damage ({weaponName}: {dice})").replace("{weaponName}", rangedDamageWeaponName).replace("{dice}", rangedDamageDice);
        weaponDamageDiceString = rangedDamageDice;
        weaponCriticalMultiplier = parseCritMultiplier(selectedRangedWeaponDefinition.criticalMultiplier);
        extraDamageDice = getActiveDamageBonuses('ranged', selectedRangedWeaponDefinition).filter(d => typeof d.value === 'string' && d.value.includes('d')).map(d => d.value as string);
        break;
    }
    
    onOpenRollDialog({
      dialogTitle, rollType, baseModifier, calculationBreakdown,
      weaponDamageDiceString, weaponCriticalMultiplier, extraDamageDice,
      rerollTwentiesForChecks: rollType.includes('attack') || rollType.includes('damage') ? false : rerollTwentiesForChecks,
    });
  }, [UI_STRINGS, DND_CLASSES, SIZES, ABILITY_LABELS, abilityScores, classes, size, aggregatedFeatEffects, onOpenRollDialog, rerollTwentiesForChecks, currentLang, baseInitiative, totalGrappleModifier, selectedMainHandMeleeWeaponDefinition, selectedRangedWeaponDefinition, localInitiativeMiscModifier, localGrappleMiscModifier, calculatedMeleeAttackBonus, calculatedMeleeNumericalDamageBonus, calculatedRangedAttackBonus, calculatedRangedNumericalDamageBonus, localPowerAttackValue, localCombatExpertiseValue, meleeAbilityModForAttack, sizeModifierAttack, unarmedBaseDamageFromFeat, selectedMainHandMeleeWeaponInstanceId, getWeaponEnhancementBonus, getActiveDamageBonuses, getActiveAttackBonuses, parseCritMultiplier, totalBabWithModifier, getAttackBreakdown, getDamageBreakdown, strModifier, dexModifier]);
  
  if (translationsLoading || !UI_STRINGS || !DND_CLASSES || !SIZES || !ABILITY_LABELS || !aggregatedFeatEffects) {
    return null;
  }

  return (
    <LockablePanelWrapper
      title={UI_STRINGS.combatPanelTitle}
      description={UI_STRINGS.combatPanelDescription}
      icon={Swords}
      initialLockedState={false}
    >
      {({ isLocked: panelIsLocked }) => (
        <CardContent className={cn("flex flex-col", panelGridGap)}>
          <div className={cn("grid grid-cols-1 md:grid-cols-3", panelGridGap)}>
            <div className={cn("flex flex-col border rounded-md bg-card items-center text-center", panelContentPadding, panelFieldVerticalGap)}>
              <Label htmlFor="bab-display" className={textStyleCardTitle}>{UI_STRINGS.combatPanelBabLabel}</Label>
              <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                <p id="bab-display" className={cn(textStyleValueBig, "text-accent")}>
                  {totalBabWithModifier.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/')}
                </p>
                <Button type="button" variant="ghost" size="icon-xs" onClick={handleBabInfo}><Info /></Button>
              </div>
              {!panelIsLocked && (
                <div className={cn("mt-auto flex flex-col items-center", panelFieldVerticalGap)}>
                  <Label htmlFor="bab-custom-mod" className={cn(textStyleLabel)}>{UI_STRINGS.infoDialogCustomModifierLabel}</Label>
                  <div className={cn("flex justify-center", inputWidthStandard)}>
                    <Input
                      id="bab-custom-mod"
                      type="number"
                      value={localBabMiscModifier}
                      onChange={(e) => setLocalBabMiscModifier(parseInt(e.target.value, 10) || 0)}
                      className={cn(textStyleInput)}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className={cn("flex flex-col border rounded-md bg-card items-center text-center", panelContentPadding, panelFieldVerticalGap)}>
              <Label htmlFor="initiative-display" className={textStyleCardTitle}>{UI_STRINGS.combatPanelInitiativeLabel}</Label>
              <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                <p id="initiative-display" className={cn(textStyleValueBig, "text-accent")}>
                  {`${baseInitiative >= 0 ? '+' : ''}${baseInitiative}`}
                </p>
                <Button type="button" variant="ghost" size="icon-xs" onClick={handleInitiativeInfo}><Info /></Button>
                <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleRollAction('initiative')} aria-label={UI_STRINGS.rollDialogInitiativeAriaLabel}><Dices /></Button>
              </div>
              {!panelIsLocked && (
                <div className={cn("mt-auto flex flex-col items-center", panelFieldVerticalGap)}>
                  <Label htmlFor="initiative-custom-mod" className={cn(textStyleLabel)}>{UI_STRINGS.infoDialogCustomModifierLabel}</Label>
                  <div className={cn("flex justify-center", inputWidthStandard)}>
                    <Input
                      id="initiative-custom-mod"
                      type="number"
                      value={localInitiativeMiscModifier}
                      onChange={(e) => setLocalInitiativeMiscModifier(parseInt(e.target.value, 10) || 0)}
                      className={cn(textStyleInput)}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className={cn("flex flex-col border rounded-md bg-card items-center text-center", panelContentPadding, panelFieldVerticalGap)}>
              <Label htmlFor="grapple-mod-display" className={textStyleCardTitle}>{UI_STRINGS.combatPanelGrappleModifierLabel}</Label>
                 <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                    <p id="grapple-mod-display" className={cn(textStyleValueBig, "text-accent")}>
                      {`${totalGrappleModifier >= 0 ? '+' : ''}${totalGrappleModifier}`}
                    </p>
                    <Button type="button" variant="ghost" size="icon-xs" onClick={handleGrappleModifierInfo}><Info /></Button>
                    <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleRollAction('grapple')} aria-label={UI_STRINGS.rollDialogGrappleCheckAriaLabel}><Dices /></Button>
                 </div>
              {!panelIsLocked && (
                <div className={cn("mt-auto flex flex-col items-center", panelFieldVerticalGap)}>
                  <Label htmlFor="grapple-custom-mod" className={cn(textStyleLabel)}>{UI_STRINGS.infoDialogCustomModifierLabel}</Label>
                  <div className={cn("flex justify-center", inputWidthStandard)}>
                    <Input
                      id="grapple-custom-mod"
                      type="number"
                      value={localGrappleMiscModifier}
                      onChange={(e) => setLocalGrappleMiscModifier(parseInt(e.target.value, 10) || 0)}
                      className={cn(textStyleInput)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
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
                      className={cn(textStyleInput)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          <div className={cn("grid grid-cols-1 md:grid-cols-2", panelGridGap)}>
            <Card className={cn("flex flex-col justify-start", panelContentPadding, panelGridGap)}>
                <CardTitle className={cn(textStyleCardTitle, "flex items-center gap-2")}><Hand />{UI_STRINGS.attacksPanelMeleeTitle}</CardTitle>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="text-center flex flex-col gap-1">
                      <Label className={textStyleLabel}>{UI_STRINGS.attacksPanelAttackBonusLabel}</Label>
                      <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                        <p className={cn(textStyleValueBig, "text-accent")}>{`${calculatedMeleeAttackBonus >= 0 ? '+' : ''}${calculatedMeleeAttackBonus}`}</p>
                        <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleOpenAttackBreakdown(true)}><Info /></Button>
                        <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleRollAction('melee-attack')} aria-label={(UI_STRINGS.rollDialogMeleeAttackAriaLabel || "Roll Melee Attack with {weaponName}").replace("{weaponName}", selectedMainHandMeleeWeaponDefinition?.label ? getLocalizedString(selectedMainHandMeleeWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : 'Unarmed')}><Dices /></Button>
                      </div>
                    </div>
                    <div className="text-center flex flex-col gap-1">
                      <Label className={textStyleLabel}>{UI_STRINGS.attacksPanelDamageBonusLabel}</Label>
                      <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                        <p className={cn(textStyleValueBig, "text-accent")}>{`${calculatedMeleeNumericalDamageBonus >= 0 ? '+' : ''}${calculatedMeleeNumericalDamageBonus}`}</p>
                        <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleOpenDamageBreakdown(true)}><Info /></Button>
                        <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleRollAction('melee-damage')} disabled={(!selectedMainHandMeleeWeaponDefinition && selectedMainHandMeleeWeaponInstanceId !== 'unarmed')} aria-label={(UI_STRINGS.rollDialogDamageAriaLabel || "Roll Damage for {weaponName}").replace("{weaponName}", selectedMainHandMeleeWeaponDefinition?.label ? getLocalizedString(selectedMainHandMeleeWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : UI_STRINGS.attacksPanelUnarmedOption || "Unarmed")}><Dices /></Button>
                      </div>
                    </div>
                </div>
                <div className={cn("flex flex-col", panelGridGap)}>
                    <div className={cn("flex flex-col", panelFieldVerticalGap)}>
                      <Label htmlFor="main-hand-weapon-select" className={textStyleLabel}>{UI_STRINGS.attacksPanelMainHandMeleeWeaponLabel}</Label>
                      <Select value={selectedMainHandMeleeWeaponInstanceId} onValueChange={setSelectedMainHandMeleeWeaponInstanceId} disabled={panelIsLocked}>
                        <SelectTrigger id="main-hand-weapon-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {meleeWeaponInstances.map(wInst => (
                              <SelectItem key={`cs-mainhand-${wInst.instanceId}`} value={wInst.instanceId}>
                                {getLocalizedString(wInst.definition.label, currentLang, DEFAULT_LANGUAGE)}
                                {wInst.instanceId !== 'unarmed' && ` (x${wInst.quantity})`}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {selectedMainHandMeleeWeaponDefinition && (
                        <div className={cn("flex w-full items-center justify-between mt-1", panelBadgeGroupGap)}>
                          <DualBadge color="primary" leftLabel={UI_STRINGS.attacksPanelWeaponDamageLabel} rightLabel={selectedMainHandMeleeWeaponInstanceId === 'unarmed' ? unarmedBaseDamageFromFeat : selectedMainHandMeleeWeaponDefinition.damage || '—'} className={textStyleBadgeSmall} />
                          <DualBadge color="secondary" leftLabel={(UI_STRINGS.attacksPanelCriticalOnLabel).replace("{range}", selectedMainHandMeleeWeaponDefinition.criticalRange || '20')} rightLabel={(selectedMainHandMeleeWeaponDefinition.criticalMultiplier || '×2').replace('x', '×')} className={textStyleBadgeSmall} />
                        </div>
                      )}
                    </div>
                    <div className={cn("flex flex-col", panelFieldVerticalGap)}>
                      <Label htmlFor="off-hand-weapon-select" className={textStyleLabel}>{UI_STRINGS.attacksPanelOffHandMeleeWeaponLabel}</Label>
                      <Select value={selectedOffHandMeleeWeaponInstanceId} onValueChange={setSelectedOffHandMeleeWeaponInstanceId} disabled={panelIsLocked}>
                        <SelectTrigger id="off-hand-weapon-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                              <SelectItem value="none">{UI_STRINGS.deityNoneOption}</SelectItem>
                            {meleeWeaponInstances.map(wInst => (
                              <SelectItem key={`cs-offhand-${wInst.instanceId}`} value={wInst.instanceId}>
                                {getLocalizedString(wInst.definition.label, currentLang, DEFAULT_LANGUAGE)}
                                {wInst.instanceId !== 'unarmed' && ` (x${wInst.quantity})`}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {selectedOffHandMeleeWeaponDefinition && (
                        <div className={cn("flex w-full items-center justify-between mt-1", panelBadgeGroupGap)}>
                          <DualBadge color="primary" leftLabel={UI_STRINGS.attacksPanelWeaponDamageLabel} rightLabel={selectedOffHandMeleeWeaponDefinition.damage || '—'} className={textStyleBadgeSmall} />
                          <DualBadge color="secondary" leftLabel={(UI_STRINGS.attacksPanelCriticalOnLabel).replace("{range}", selectedOffHandMeleeWeaponDefinition.criticalRange || '20')} rightLabel={(selectedOffHandMeleeWeaponDefinition.criticalMultiplier || '×2').replace('x', '×')} className={textStyleBadgeSmall} />
                        </div>
                      )}
                    </div>
                </div>
            </Card>
            <Card className={cn("flex flex-col justify-start mt-4 md:mt-0", panelContentPadding, panelGridGap)}>
                <CardTitle className={cn(textStyleCardTitle, "flex items-center gap-2")}><ArrowRightLeft />{UI_STRINGS.attacksPanelRangedTitle}</CardTitle>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center flex flex-col gap-1">
                    <Label className={textStyleLabel}>{UI_STRINGS.attacksPanelAttackBonusLabel}</Label>
                    <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                      <p className={cn(textStyleValueBig, "text-accent")}>{selectedRangedWeaponDefinition ? `${calculatedRangedAttackBonus >= 0 ? '+' : ''}${calculatedRangedAttackBonus}` : '—'}</p>
                      <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleOpenAttackBreakdown(false)} disabled={!selectedRangedWeaponDefinition}><Info /></Button>
                      <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleRollAction('ranged-attack')} disabled={!selectedRangedWeaponDefinition} aria-label={(UI_STRINGS.rollDialogRangedAttackAriaLabel || "Roll Ranged Attack with {weaponName}").replace("{weaponName}", selectedRangedWeaponDefinition?.label ? getLocalizedString(selectedRangedWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : '')}><Dices /></Button>
                    </div>
                  </div>
                  <div className="text-center flex flex-col gap-1">
                    <Label className={textStyleLabel}>{UI_STRINGS.attacksPanelDamageBonusLabel}</Label>
                    <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                      <p className={cn(textStyleValueBig, "text-accent")}>{selectedRangedWeaponDefinition ? `${calculatedRangedNumericalDamageBonus >= 0 ? '+' : ''}${calculatedRangedNumericalDamageBonus}` : '—'}</p>
                      <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleOpenDamageBreakdown(false)} disabled={!selectedRangedWeaponDefinition}><Info /></Button>
                      <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleRollAction('ranged-damage')} disabled={!selectedRangedWeaponDefinition} aria-label={(UI_STRINGS.rollDialogDamageAriaLabel || "Roll Damage for {weaponName}").replace("{weaponName}", selectedRangedWeaponDefinition?.label ? getLocalizedString(selectedRangedWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : '')}><Dices /></Button>
                    </div>
                  </div>
                </div>
                <div className={cn("flex flex-col", panelFieldVerticalGap)}>
                  <Label htmlFor="ranged-weapon-select" className={textStyleLabel}>{UI_STRINGS.attacksPanelRangedWeaponLabel}</Label>
                  <Select value={selectedRangedWeaponInstanceId} onValueChange={setSelectedRangedWeaponInstanceId} disabled={panelIsLocked}>
                    <SelectTrigger id="ranged-weapon-select">
                      <SelectValue placeholder={rangedWeaponInstances.length === 0 ? (UI_STRINGS.attacksPanelNoRangedWeapons) : (UI_STRINGS.attacksPanelSelectRangedWeapon)} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                        <SelectItem value="none">{UI_STRINGS.deityNoneOption}</SelectItem>
                        {rangedWeaponInstances.map((wInst) => (<SelectItem key={wInst.instanceId} value={wInst.instanceId}>{getLocalizedString(wInst.definition.label, currentLang, DEFAULT_LANGUAGE)} (x{wInst.quantity})</SelectItem>))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {selectedRangedWeaponDefinition && (
                    <div className={cn("flex w-full items-center justify-between mt-1", panelBadgeGroupGap)}>
                      <DualBadge color="primary" leftLabel={UI_STRINGS.attacksPanelWeaponDamageLabel} rightLabel={selectedRangedWeaponDefinition.damage || '—'} className={textStyleBadgeSmall} />
                      <DualBadge color="secondary" leftLabel={(UI_STRINGS.attacksPanelCriticalOnLabel).replace("{range}", selectedRangedWeaponDefinition.criticalRange || '20')} rightLabel={(selectedRangedWeaponDefinition.criticalMultiplier || '×2').replace('x', '×')} className={textStyleBadgeSmall} />
                    </div>
                  )}
                </div>
            </Card>
          </div>
        </CardContent>
      )}
    </LockablePanelWrapper>
  );
};
CombatPanelComponent.displayName = 'CombatPanelComponent';
export const CombatPanel = React.memo(CombatPanelComponent);
