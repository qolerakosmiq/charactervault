
'use client';

import *as React from 'react';
import type {
  Character,
  InfoDialogContentType,
  AggregatedFeatEffects,
  GenericBreakdownItem,
  AbilityName,
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
import { CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Swords, Info, Dices, Hand, ArrowRightLeft, Activity, Shield as ShieldIcon } from 'lucide-react';
import { getAbilityModifierByName, getBab, calculateInitiative, calculateGrapple, getSizeModifierGrapple } from '@/lib/dnd-utils';
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
  textStyleValueBig,
  inputWidthStandard,
  textStylePanelSectionHeader,
  textStyleSubLabel,
  textStyleBadgeSmall,
} from '@/config/layout';
import { AttackCard } from './AttackCard';

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
  
  const {
    classes, abilityScores, size, inventory, equippedGear,
    feats: characterFeats, babMiscModifier, initiativeMiscModifier,
    grappleMiscModifier, sizeModifierAttack, powerAttackValue,
    combatExpertiseValue
  } = combatData;
  
  const { DND_CLASSES, SIZES, ABILITY_LABELS, UI_STRINGS, ITEM_DEFINITIONS_WEAPONS, ITEM_DEFINITIONS_SHIELDS } = translations || {};
  
  const {
    attackRollBonuses,
    damageRollBonuses,
    initiativeBonus,
    modifiedMechanics,
  } = aggregatedFeatEffects || {};

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
    return calculateInitiative(dexModifier, localInitiativeMiscModifier || 0) + (initiativeBonus || 0);
  }, [dexModifier, localInitiativeMiscModifier, initiativeBonus]);

  const totalGrappleModifier = React.useMemo(() => {
    if (!SIZES || !DND_CLASSES || !attackRollBonuses) return 0;
    const featGrappleBonus = attackRollBonuses.filter(b => b.appliesTo === 'grapple' && b.isActive).reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0) || 0;
    return calculateGrapple(classes || [], strModifier, getSizeModifierGrapple(size, SIZES), DND_CLASSES) + (localGrappleMiscModifier || 0) + featGrappleBonus;
  }, [classes, strModifier, size, SIZES, DND_CLASSES, localGrappleMiscModifier, attackRollBonuses]);
  
  const hasPowerAttackFeat = React.useMemo(() => allFeatDefinitions.some(f => f.id === 'power-attack' && characterFeats.some(cf => cf.definitionId === f.id)), [allFeatDefinitions, characterFeats]);
  const hasCombatExpertiseFeat = React.useMemo(() => allFeatDefinitions.some(f => f.id === 'combat-expertise' && characterFeats.some(cf => cf.definitionId === f.id)), [allFeatDefinitions, characterFeats]);
  const maxBabForSpinners = React.useMemo(() => (DND_CLASSES ? getBab(classes || [], DND_CLASSES) : [0])[0] || 0, [classes, DND_CLASSES]);
  
  const allWeaponAndShieldDefinitionsMap = React.useMemo(() => {
    if (translationsLoading || !ITEM_DEFINITIONS_WEAPONS || !ITEM_DEFINITIONS_SHIELDS) return new Map();
    const map = new Map<string, ItemDefinition>();
    const allDefs = [...(ITEM_DEFINITIONS_WEAPONS || []), ...(ITEM_DEFINITIONS_SHIELDS || []).filter(s => s.damage)];
    allDefs.forEach(def => {
      if (def && def.definitionId) {
        map.set(def.definitionId, def);
      }
    });
    return map;
  }, [translationsLoading, ITEM_DEFINITIONS_WEAPONS, ITEM_DEFINITIONS_SHIELDS]);

  const getWeaponDefinition = React.useCallback((definitionId: string | undefined): ItemDefinition | undefined => {
    if (!definitionId) return undefined;
    return allWeaponAndShieldDefinitionsMap.get(definitionId);
  }, [allWeaponAndShieldDefinitionsMap]);
  
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
    if (!attackRollBonuses) return [];
    return attackRollBonuses.filter(effect => {
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
  }, [attackRollBonuses, currentLang]);
  
  const getActiveDamageBonuses = React.useCallback((weaponType: WeaponStyleType | 'unarmed', selectedWeaponDefinition?: ItemDefinition | null): DamageRollEffect[] => {
    if (!damageRollBonuses) return [];
    return damageRollBonuses.filter(effect => {
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
  }, [damageRollBonuses, currentLang]);

  const unarmedBaseDamageFromFeat = React.useMemo(() => {
    if (!UI_STRINGS) return '1d3';
    return modifiedMechanics?.unarmedDamage?.isActive && typeof modifiedMechanics.unarmedDamage.value === 'string'
      ? modifiedMechanics.unarmedDamage.value
      : UI_STRINGS.unarmedDamageDefault;
  }, [modifiedMechanics, UI_STRINGS]);

  const unarmedStrikeDefinition = React.useMemo(() => {
    if (!UI_STRINGS) return null;
    return {
        definitionId: 'unarmed-placeholder',
        label: { en: 'Unarmed', fr: 'À mains nues' },
        itemType: 'weapon' as const,
        weaponType: 'melee' as const,
        damage: unarmedBaseDamageFromFeat,
        criticalRange: '20',
        criticalMultiplier: '×2'
    } as ItemDefinition;
  }, [UI_STRINGS, unarmedBaseDamageFromFeat]);

  const meleeWeaponInstances = React.useMemo(() => {
    if (!inventory || !unarmedStrikeDefinition) return [];
    const inventoryItems = inventory.filter(itemInst => {
        const itemDef = getWeaponDefinition(itemInst.definitionId);
        return itemDef && (itemDef.itemType === 'weapon' || (itemDef.itemType === 'shield' && !!itemDef.damage));
    });
  
    const meleeInventoryItems = inventoryItems
      .map(inst => ({ ...inst, definition: getWeaponDefinition(inst.definitionId)! }))
      .filter(item => item.definition && (item.definition.weaponType === 'melee' || item.definition.weaponType === 'melee-or-ranged'));
      
    return [
      { instanceId: 'unarmed', definitionId: 'unarmed-placeholder', quantity: 1, definition: unarmedStrikeDefinition },
      ...meleeInventoryItems,
    ];
  }, [inventory, getWeaponDefinition, unarmedStrikeDefinition]);
  
  const rangedWeaponInstances = React.useMemo(() => {
    if (!inventory) return [];
    return inventory
      .map(inst => ({ ...inst, definition: getWeaponDefinition(inst.definitionId)! }))
      .filter(item => item.definition && (item.definition.weaponType === 'ranged' || item.definition.weaponType === 'melee-or-ranged'));
  }, [inventory, getWeaponDefinition]);
  
  const mainHandItem = React.useMemo(() => inventory?.find(i => i.instanceId === equippedGear?.['main-hand']), [inventory, equippedGear]);
  const offHandItem = React.useMemo(() => inventory?.find(i => i.instanceId === equippedGear?.['off-hand']), [inventory, equippedGear]);
  const twoHandItem = React.useMemo(() => inventory?.find(i => i.instanceId === equippedGear?.['two-hand']), [inventory, equippedGear]);


  React.useEffect(() => {
    let finalMainHandId = 'unarmed'; 
    if (mainHandItem) {
        const mainHandDef = getWeaponDefinition(mainHandItem.definitionId);
        if (mainHandDef && (mainHandDef.itemType === 'weapon' || (mainHandDef.itemType === 'shield' && mainHandDef.damage)) && (mainHandDef.weaponType === 'melee' || mainHandDef.weaponType === 'melee-or-ranged')) {
            finalMainHandId = mainHandItem.instanceId;
        }
    } else if (twoHandItem) {
        const twoHandDef = getWeaponDefinition(twoHandItem.definitionId);
         if (twoHandDef && (twoHandDef.itemType === 'weapon' || (twoHandDef.itemType === 'shield' && twoHandDef.damage)) && (twoHandDef.weaponType === 'melee' || twoHandDef.weaponType === 'melee-or-ranged')) {
           finalMainHandId = twoHandItem.instanceId;
         }
    }
    setSelectedMainHandMeleeWeaponInstanceId(finalMainHandId);

    let finalOffHandId = 'none';
    if (offHandItem) {
        const offHandDef = getWeaponDefinition(offHandItem.definitionId);
        if (offHandDef && (offHandDef.itemType === 'weapon' || (offHandDef.itemType === 'shield' && offHandDef.damage)) && (offHandDef.weaponType === 'melee' || offHandDef.weaponType === 'melee-or-ranged')) {
            finalOffHandId = offHandItem.instanceId;
        }
    }
    setSelectedOffHandMeleeWeaponInstanceId(finalOffHandId);

    let rangedEquipped = false;
    let finalRangedWeaponInstanceId = 'none';
    if (mainHandItem) {
      const mainHandDef = getWeaponDefinition(mainHandItem.definitionId);
      if (mainHandDef?.itemType === 'weapon' && (mainHandDef.weaponType === 'ranged' || mainHandDef.weaponType === 'melee-or-ranged')) {
        finalRangedWeaponInstanceId = mainHandItem.instanceId;
        rangedEquipped = true;
      }
    }
    if (!rangedEquipped && twoHandItem) {
      const twoHandDef = getWeaponDefinition(twoHandItem.definitionId);
       if (twoHandDef?.itemType === 'weapon' && (twoHandDef.weaponType === 'ranged' || twoHandDef.weaponType === 'melee-or-ranged')) {
         finalRangedWeaponInstanceId = twoHandItem.instanceId;
         rangedEquipped = true;
       }
    }
    setSelectedRangedWeaponInstanceId(finalRangedWeaponInstanceId);
  }, [mainHandItem, offHandItem, twoHandItem, getWeaponDefinition]);
  
  const selectedMainHandMeleeWeaponInstance = React.useMemo(() => meleeWeaponInstances.find(w => w.instanceId === selectedMainHandMeleeWeaponInstanceId), [meleeWeaponInstances, selectedMainHandMeleeWeaponInstanceId]);
  const selectedMainHandMeleeWeaponDefinition = selectedMainHandMeleeWeaponInstance?.definition;
  
  const selectedOffHandMeleeWeaponInstance = React.useMemo(() => meleeWeaponInstances.find(w => w.instanceId === selectedOffHandMeleeWeaponInstanceId), [meleeWeaponInstances, selectedOffHandMeleeWeaponInstanceId]);
  const selectedOffHandMeleeWeaponDefinition = selectedOffHandMeleeWeaponInstance?.definition;
  
  const selectedRangedWeaponInstance = React.useMemo(() => rangedWeaponInstances.find(w => w.instanceId === selectedRangedWeaponInstanceId), [rangedWeaponInstances, selectedRangedWeaponInstanceId]);
  const selectedRangedWeaponDefinition = selectedRangedWeaponInstance?.definition;
  
  const meleeAbilityModForAttack = React.useMemo(() => selectedMainHandMeleeWeaponDefinition?.isFinesseWeapon && dexModifier > strModifier ? dexModifier : strModifier, [selectedMainHandMeleeWeaponDefinition, dexModifier, strModifier]);

  const parseCritMultiplier = React.useCallback((critMultString: string | undefined): number => {
    if (!critMultString) return 1;
    const match = critMultString.toLowerCase().match(/x(\d+)|×(\d+)/);
    return match ? parseInt(match[1] || match[2], 10) : 1;
  }, []);
  
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
  
  const calculatedMeleeAttackBonus = React.useMemo(() => calculateFinalAttackBonus(totalBabWithModifier[0], meleeAbilityModForAttack, sizeModifierAttack || 0, 'melee', selectedMainHandMeleeWeaponDefinition, localPowerAttackValue, localCombatExpertiseValue), [calculateFinalAttackBonus, totalBabWithModifier, meleeAbilityModForAttack, sizeModifierAttack, selectedMainHandMeleeWeaponDefinition, localPowerAttackValue, localCombatExpertiseValue]);
  const calculatedMeleeNumericalDamageBonus = React.useMemo(() => calculateFinalNumericalDamageBonus(strModifier, 'melee', selectedMainHandMeleeWeaponDefinition, localPowerAttackValue), [calculateFinalNumericalDamageBonus, strModifier, selectedMainHandMeleeWeaponDefinition, localPowerAttackValue]);
  
  const calculatedRangedAttackBonus = React.useMemo(() => selectedRangedWeaponDefinition ? calculateFinalAttackBonus(totalBabWithModifier[0], dexModifier, sizeModifierAttack || 0, 'ranged', selectedRangedWeaponDefinition) : 0, [calculateFinalAttackBonus, selectedRangedWeaponDefinition, totalBabWithModifier, dexModifier, sizeModifierAttack]);
  const calculatedRangedNumericalDamageBonus = React.useMemo(() => selectedRangedWeaponDefinition ? calculateFinalNumericalDamageBonus(0, 'ranged', selectedRangedWeaponDefinition) : 0, [calculateFinalNumericalDamageBonus, selectedRangedWeaponDefinition]);
  
  const meleeExtraDamageDice = React.useMemo(() => 
    getActiveDamageBonuses(
      selectedMainHandMeleeWeaponInstanceId === 'unarmed' ? 'unarmed' : 'melee',
      selectedMainHandMeleeWeaponDefinition
    )
    .filter(d => typeof d.value === 'string' && d.value.includes('d'))
    .map(d => d.value as string),
    [getActiveDamageBonuses, selectedMainHandMeleeWeaponInstanceId, selectedMainHandMeleeWeaponDefinition]
  );
  
  const rangedExtraDamageDice = React.useMemo(() =>
    selectedRangedWeaponDefinition 
      ? getActiveDamageBonuses(
          'ranged',
          selectedRangedWeaponDefinition
        )
        .filter(d => typeof d.value === 'string' && d.value.includes('d'))
        .map(d => d.value as string)
      : [],
    [getActiveDamageBonuses, selectedRangedWeaponDefinition]
  );

  const initiativeBreakdown = React.useMemo(() => {
    if (!UI_STRINGS || !ABILITY_LABELS) return [];
    const components: GenericBreakdownItem[] = [];
    const dexAbbr = ABILITY_LABELS.find(al => al.id === 'dexterity')?.abbr || "DEX";
    components.push({ label: (UI_STRINGS.rollDialogAbilityModifierLabel).replace("{abilityAbbr}", dexAbbr), value: dexModifier });
    if(initiativeBonus && initiativeBonus !== 0) components.push({ label: UI_STRINGS.infoDialogFeatBonusLabel, value: initiativeBonus });
    if(localInitiativeMiscModifier && localInitiativeMiscModifier !== 0) components.push({ label: UI_STRINGS.infoDialogCustomModifierLabel, value: localInitiativeMiscModifier });
    return components;
  }, [UI_STRINGS, ABILITY_LABELS, dexModifier, initiativeBonus, localInitiativeMiscModifier]);

  const grappleBreakdown = React.useMemo(() => {
      if (!UI_STRINGS || !SIZES || !DND_CLASSES || !attackRollBonuses || !ABILITY_LABELS) return [];
      const components: GenericBreakdownItem[] = [];
      const featGrappleBonus = (attackRollBonuses.filter(b => b.appliesTo === 'grapple' && b.isActive).reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0) || 0);
      const strAbbr = ABILITY_LABELS.find(al => al.id === 'strength')?.abbr || "STR";

      if(totalBabWithModifier[0]) components.push({ label: UI_STRINGS.attacksPanelBabLabel || 'Base Attack Bonus', value: totalBabWithModifier[0] });
      if(strModifier) components.push({ label: (UI_STRINGS.rollDialogAbilityModifierLabel).replace("{abilityAbbr}", strAbbr), value: strModifier });
      const sizeModGrapple = getSizeModifierGrapple(size, SIZES || []);
      if(sizeModGrapple) components.push({ label: UI_STRINGS.attacksPanelSizeModLabel || 'Size Mod (Attack)', value: sizeModGrapple });
      if(featGrappleBonus) components.push({ label: UI_STRINGS.attacksPanelFeatBonusLabel || 'Feat Bonus', value: featGrappleBonus });
      if(localGrappleMiscModifier) components.push({ label: UI_STRINGS.infoDialogCustomModifierLabel || 'Misc Modifier', value: localGrappleMiscModifier || 0 });
      return components;
  }, [UI_STRINGS, SIZES, DND_CLASSES, size, strModifier, localGrappleMiscModifier, attackRollBonuses, totalBabWithModifier, ABILITY_LABELS]);

  const meleeAttackBreakdown = React.useMemo(() => {
    if (!UI_STRINGS || !ABILITY_LABELS || !selectedMainHandMeleeWeaponDefinition && selectedMainHandMeleeWeaponInstanceId !== 'unarmed') return [];

    const components: GenericBreakdownItem[] = [];
    const bab = totalBabWithModifier[0];
    const abilityMod = meleeAbilityModForAttack;
    const abilityAbbr = ABILITY_LABELS.find(al => al.id === (selectedMainHandMeleeWeaponDefinition?.isFinesseWeapon && dexModifier > strModifier ? 'dexterity' : 'strength'))?.abbr || 'MOD';
    const sizeMod = sizeModifierAttack || 0;
    const enhBonus = getWeaponEnhancementBonus(selectedMainHandMeleeWeaponDefinition).attack;
    const featBonus = getActiveAttackBonuses('melee', selectedMainHandMeleeWeaponDefinition).reduce((sum, eff) => sum + ((eff.value as number) || 0), 0);
    
    components.push({ label: UI_STRINGS.attacksPanelBabLabel, value: bab });
    components.push({ label: (UI_STRINGS.rollDialogAbilityModifierLabel).replace("{abilityAbbr}", abilityAbbr), value: abilityMod });
    if(sizeMod !== 0) components.push({ label: UI_STRINGS.attacksPanelSizeModLabel, value: sizeMod });
    if(enhBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelWeaponEnhancementLabel, value: enhBonus });
    if(featBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelFeatBonusLabel, value: featBonus });
    if ((localPowerAttackValue || 0) > 0) components.push({ label: UI_STRINGS.powerAttackPenaltyLabel, value: -(localPowerAttackValue || 0) });
    if ((localCombatExpertiseValue || 0) > 0) components.push({ label: UI_STRINGS.combatExpertisePenaltyLabel, value: -(localCombatExpertiseValue || 0) });
    
    return components;
  }, [UI_STRINGS, ABILITY_LABELS, totalBabWithModifier, meleeAbilityModForAttack, sizeModifierAttack, selectedMainHandMeleeWeaponDefinition, getWeaponEnhancementBonus, getActiveAttackBonuses, localPowerAttackValue, localCombatExpertiseValue, dexModifier, strModifier, selectedMainHandMeleeWeaponInstanceId]);

  const meleeDamageBreakdown = React.useMemo(() => {
    if (!UI_STRINGS || !ABILITY_LABELS || !selectedMainHandMeleeWeaponDefinition && selectedMainHandMeleeWeaponInstanceId !== 'unarmed') return [];

    const components: GenericBreakdownItem[] = [];
    const baseDamage = selectedMainHandMeleeWeaponInstanceId === 'unarmed' ? unarmedBaseDamageFromFeat : selectedMainHandMeleeWeaponDefinition?.damage;
    components.push({ label: UI_STRINGS.attacksPanelBaseWeaponDamageLabel, value: baseDamage || "—", isRawValue: true });

    const abilityMod = strModifier;
    const abilityAbbr = ABILITY_LABELS.find(al => al.id === 'strength')?.abbr || 'STR';
    if (abilityMod !== 0) components.push({ label: (UI_STRINGS.rollDialogAbilityModifierLabel).replace("{abilityAbbr}", abilityAbbr), value: abilityMod });

    const enhBonus = getWeaponEnhancementBonus(selectedMainHandMeleeWeaponDefinition).damage;
    if(enhBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelWeaponEnhancementLabel, value: enhBonus });
    
    const featBonus = getActiveDamageBonuses('melee', selectedMainHandMeleeWeaponDefinition).reduce((sum, eff) => sum + ((eff.value as number) || 0), 0);
    if(featBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelFeatBonusLabel, value: featBonus });

    if ((localPowerAttackValue || 0) > 0) components.push({ label: UI_STRINGS.powerAttackDamageBonusLabel, value: (localPowerAttackValue || 0) });

    const totalNumericBonus = abilityMod + enhBonus + featBonus + (localPowerAttackValue || 0);
    components.push({ label: UI_STRINGS.infoDialogTotalNumericBonusLabel, value: totalNumericBonus, isBold: true });
    
    return components;
  }, [UI_STRINGS, ABILITY_LABELS, selectedMainHandMeleeWeaponInstanceId, selectedMainHandMeleeWeaponDefinition, unarmedBaseDamageFromFeat, strModifier, getWeaponEnhancementBonus, getActiveDamageBonuses, localPowerAttackValue]);
  
  const rangedAttackBreakdown = React.useMemo(() => {
    if (!UI_STRINGS || !ABILITY_LABELS || !selectedRangedWeaponDefinition) return [];

    const components: GenericBreakdownItem[] = [];
    const bab = totalBabWithModifier[0];
    const abilityMod = dexModifier;
    const abilityAbbr = ABILITY_LABELS.find(al => al.id === 'dexterity')?.abbr || 'DEX';
    const sizeMod = sizeModifierAttack || 0;
    const enhBonus = getWeaponEnhancementBonus(selectedRangedWeaponDefinition).attack;
    const featBonus = getActiveAttackBonuses('ranged', selectedRangedWeaponDefinition).reduce((sum, eff) => sum + ((eff.value as number) || 0), 0);
    
    components.push({ label: UI_STRINGS.attacksPanelBabLabel, value: bab });
    components.push({ label: (UI_STRINGS.rollDialogAbilityModifierLabel).replace("{abilityAbbr}", abilityAbbr), value: abilityMod });
    if(sizeMod !== 0) components.push({ label: UI_STRINGS.attacksPanelSizeModLabel, value: sizeMod });
    if(enhBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelWeaponEnhancementLabel, value: enhBonus });
    if(featBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelFeatBonusLabel, value: featBonus });
    
    return components;
  }, [UI_STRINGS, ABILITY_LABELS, totalBabWithModifier, dexModifier, sizeModifierAttack, selectedRangedWeaponDefinition, getWeaponEnhancementBonus, getActiveAttackBonuses]);

  const rangedDamageBreakdown = React.useMemo(() => {
    if (!UI_STRINGS || !selectedRangedWeaponDefinition) return [];

    const components: GenericBreakdownItem[] = [];
    const baseDamage = selectedRangedWeaponDefinition.damage;
    components.push({ label: UI_STRINGS.attacksPanelBaseWeaponDamageLabel, value: baseDamage || "—", isRawValue: true });

    const enhBonus = getWeaponEnhancementBonus(selectedRangedWeaponDefinition).damage;
    if(enhBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelWeaponEnhancementLabel, value: enhBonus });
    
    const featBonus = getActiveDamageBonuses('ranged', selectedRangedWeaponDefinition).reduce((sum, eff) => sum + ((eff.value as number) || 0), 0);
    if(featBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelFeatBonusLabel, value: featBonus });

    const totalNumericBonus = enhBonus + featBonus;
    components.push({ label: UI_STRINGS.infoDialogTotalNumericBonusLabel, value: totalNumericBonus, isBold: true });
    
    return components;
  }, [UI_STRINGS, selectedRangedWeaponDefinition, getWeaponEnhancementBonus, getActiveDamageBonuses]);

  const handleRollAction = React.useCallback((rollType: 'initiative' | 'grapple' | 'melee-attack' | 'melee-damage' | 'ranged-attack' | 'ranged-damage') => {
    if (!UI_STRINGS || !onOpenRollDialog) return;
    
    let dialogTitle = "";
    let baseModifier = 0;
    let calculationBreakdown: GenericBreakdownItem[] = [];
    let weaponDamageDiceString: string = "";
    let weaponCriticalMultiplier: number = 1;
    let extraDamageDice: string[] = [];

    switch(rollType) {
      case 'initiative':
        dialogTitle = UI_STRINGS.rollDialogTitleInitiative || 'Roll Initiative';
        baseModifier = baseInitiative;
        calculationBreakdown = initiativeBreakdown;
        break;
      case 'grapple':
        dialogTitle = UI_STRINGS.rollDialogTitleGrappleCheck || 'Roll Grapple Check';
        baseModifier = totalGrappleModifier;
        calculationBreakdown = grappleBreakdown;
        break;
      case 'melee-attack':
        calculationBreakdown = meleeAttackBreakdown;
        baseModifier = calculatedMeleeAttackBonus;
        const meleeWeaponName = selectedMainHandMeleeWeaponDefinition ? getLocalizedString(selectedMainHandMeleeWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : UI_STRINGS.attacksPanelUnarmedOption;
        dialogTitle = (UI_STRINGS.rollDialogTitleMeleeAttackFormat || "Roll Melee Attack ({weaponName})").replace("{weaponName}", meleeWeaponName);
        break;
      case 'melee-damage':
        calculationBreakdown = meleeDamageBreakdown;
        baseModifier = calculatedMeleeNumericalDamageBonus;
        const meleeDamageWeaponName = selectedMainHandMeleeWeaponDefinition ? getLocalizedString(selectedMainHandMeleeWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : UI_STRINGS.attacksPanelUnarmedOption;
        const meleeDamageDice = selectedMainHandMeleeWeaponInstanceId === 'unarmed' ? unarmedBaseDamageFromFeat : selectedMainHandMeleeWeaponDefinition?.damage || '—';
        dialogTitle = (UI_STRINGS.rollDialogTitleMeleeDamageFormat || "Melee Damage ({weaponName}: {dice})").replace("{weaponName}", meleeDamageWeaponName).replace("{dice}", meleeDamageDice);
        weaponDamageDiceString = meleeDamageDice;
        weaponCriticalMultiplier = parseCritMultiplier(selectedMainHandMeleeWeaponDefinition?.criticalMultiplier);
        extraDamageDice = meleeExtraDamageDice;
        break;
      case 'ranged-attack':
        if (!selectedRangedWeaponDefinition) return;
        calculationBreakdown = rangedAttackBreakdown;
        baseModifier = calculatedRangedAttackBonus;
        const rangedWeaponName = getLocalizedString(selectedRangedWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE);
        dialogTitle = (UI_STRINGS.rollDialogTitleRangedAttackFormat || "Roll Ranged Attack ({weaponName})").replace("{weaponName}", rangedWeaponName);
        break;
      case 'ranged-damage':
        if (!selectedRangedWeaponDefinition) return;
        calculationBreakdown = rangedDamageBreakdown;
        baseModifier = calculatedRangedNumericalDamageBonus;
        const rangedDamageWeaponName = getLocalizedString(selectedRangedWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE);
        const rangedDamageDice = selectedRangedWeaponDefinition?.damage || '—';
        dialogTitle = (UI_STRINGS.rollDialogTitleRangedDamageFormat || "Ranged Damage ({weaponName}: {dice})").replace("{weaponName}", rangedDamageWeaponName).replace("{dice}", rangedDamageDice);
        weaponDamageDiceString = rangedDamageDice;
        weaponCriticalMultiplier = parseCritMultiplier(selectedRangedWeaponDefinition.criticalMultiplier);
        extraDamageDice = rangedExtraDamageDice;
        break;
    }
    
    onOpenRollDialog({
      dialogTitle, rollType, baseModifier, calculationBreakdown,
      weaponDamageDiceString, weaponCriticalMultiplier, extraDamageDice,
      rerollTwentiesForChecks: rollType.includes('attack') || rollType.includes('damage') ? false : rerollTwentiesForChecks,
    });
  }, [UI_STRINGS, onOpenRollDialog, rerollTwentiesForChecks, currentLang, baseInitiative, totalGrappleModifier, selectedMainHandMeleeWeaponDefinition, selectedRangedWeaponDefinition, calculatedMeleeAttackBonus, calculatedMeleeNumericalDamageBonus, calculatedRangedAttackBonus, calculatedRangedNumericalDamageBonus, unarmedBaseDamageFromFeat, selectedMainHandMeleeWeaponInstanceId, parseCritMultiplier, meleeExtraDamageDice, rangedExtraDamageDice, initiativeBreakdown, grappleBreakdown, meleeAttackBreakdown, meleeDamageBreakdown, rangedAttackBreakdown, rangedDamageBreakdown]);

  const handleRollInitiative = React.useCallback(() => handleRollAction('initiative'), [handleRollAction]);
  const handleRollGrapple = React.useCallback(() => handleRollAction('grapple'), [handleRollAction]);
  const handleRollMeleeAttack = React.useCallback(() => handleRollAction('melee-attack'), [handleRollAction]);
  const handleRollMeleeDamage = React.useCallback(() => handleRollAction('melee-damage'), [handleRollAction]);
  const handleRollRangedAttack = React.useCallback(() => handleRollAction('ranged-attack'), [handleRollAction]);
  const handleRollRangedDamage = React.useCallback(() => handleRollAction('ranged-damage'), [handleRollAction]);
  
  const handleOpenAttackBreakdown = React.useCallback((isMelee: boolean) => {
    if (!UI_STRINGS) return;
    const components = isMelee ? meleeAttackBreakdown : rangedAttackBreakdown;
    onOpenCombatStatInfoDialog({ type: 'genericNumericalBreakdown', titleKey: isMelee ? 'infoDialogTitleMeleeAttackBreakdown' : 'infoDialogTitleRangedAttackBreakdown', components });
  }, [UI_STRINGS, onOpenCombatStatInfoDialog, meleeAttackBreakdown, rangedAttackBreakdown]);

  const handleOpenDamageBreakdown = React.useCallback((isMelee: boolean) => {
    if (!UI_STRINGS) return;
    const components = isMelee ? meleeDamageBreakdown : rangedDamageBreakdown;
    onOpenCombatStatInfoDialog({ type: 'genericNumericalBreakdown', titleKey: isMelee ? 'infoDialogTitleMeleeDamageBreakdown' : 'infoDialogTitleRangedDamageBreakdown', components });
  }, [UI_STRINGS, onOpenCombatStatInfoDialog, meleeDamageBreakdown, rangedDamageBreakdown]);

  const handleBabInfo = React.useCallback(() => onOpenCombatStatInfoDialog({ type: 'babBreakdown' }), [onOpenCombatStatInfoDialog]);
  const handleInitiativeInfo = React.useCallback(() => onOpenCombatStatInfoDialog({ type: 'initiativeBreakdown' }), [onOpenCombatStatInfoDialog]);
  const handleGrappleModifierInfo = React.useCallback(() => onOpenCombatStatInfoDialog({ type: 'grappleModifierBreakdown' }), [onOpenCombatStatInfoDialog]);

  const mainHandWeaponDisplay = React.useMemo(() => {
    if (!selectedMainHandMeleeWeaponDefinition || !UI_STRINGS) return null;
    return (
      <div className={cn("flex w-full items-center justify-between", panelBadgeGroupGap)}>
        <DualBadge color="primary" leftLabel={UI_STRINGS.attacksPanelWeaponDamageLabel} rightLabel={selectedMainHandMeleeWeaponInstanceId === 'unarmed' ? unarmedBaseDamageFromFeat : selectedMainHandMeleeWeaponDefinition.damage || '—'} className={textStyleBadgeSmall} />
        <DualBadge color="secondary" leftLabel={(UI_STRINGS.attacksPanelCriticalOnLabel).replace("{range}", selectedMainHandMeleeWeaponDefinition.criticalRange || '20')} rightLabel={(selectedMainHandMeleeWeaponDefinition.criticalMultiplier || '×2').replace('x', '×')} className={textStyleBadgeSmall} />
      </div>
    );
  }, [selectedMainHandMeleeWeaponDefinition, selectedMainHandMeleeWeaponInstanceId, unarmedBaseDamageFromFeat, UI_STRINGS, panelBadgeGroupGap, textStyleBadgeSmall]);

  const offHandWeaponDisplay = React.useMemo(() => {
    if (!selectedOffHandMeleeWeaponDefinition || !UI_STRINGS) return null;
    return (
      <div className={cn("flex w-full items-center justify-between", panelBadgeGroupGap)}>
        <DualBadge color="primary" leftLabel={UI_STRINGS.attacksPanelWeaponDamageLabel} rightLabel={selectedOffHandMeleeWeaponDefinition.damage || '—'} className={textStyleBadgeSmall} />
        <DualBadge color="secondary" leftLabel={(UI_STRINGS.attacksPanelCriticalOnLabel).replace("{range}", selectedOffHandMeleeWeaponDefinition.criticalRange || '20')} rightLabel={(selectedOffHandMeleeWeaponDefinition.criticalMultiplier || '×2').replace('x', '×')} className={textStyleBadgeSmall} />
      </div>
    );
  }, [selectedOffHandMeleeWeaponDefinition, UI_STRINGS, panelBadgeGroupGap, textStyleBadgeSmall]);

  const rangedWeaponDisplay = React.useMemo(() => {
    if (!selectedRangedWeaponDefinition || !UI_STRINGS) return null;
    return (
      <div className={cn("flex w-full items-center justify-between", panelBadgeGroupGap)}>
        <DualBadge color="primary" leftLabel={UI_STRINGS.attacksPanelWeaponDamageLabel} rightLabel={selectedRangedWeaponDefinition.damage || '—'} className={textStyleBadgeSmall} />
        <DualBadge color="secondary" leftLabel={(UI_STRINGS.attacksPanelCriticalOnLabel).replace("{range}", selectedRangedWeaponDefinition.criticalRange || '20')} rightLabel={(selectedRangedWeaponDefinition.criticalMultiplier || '×2').replace('x', '×')} className={textStyleBadgeSmall} />
      </div>
    );
  }, [selectedRangedWeaponDefinition, UI_STRINGS, panelBadgeGroupGap, textStyleBadgeSmall]);
  
  const formattedBab = React.useMemo(() => totalBabWithModifier.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/'), [totalBabWithModifier]);
  const formattedInitiative = React.useMemo(() => `${baseInitiative >= 0 ? '+' : ''}${baseInitiative}`, [baseInitiative]);
  const formattedGrapple = React.useMemo(() => `${totalGrappleModifier >= 0 ? '+' : ''}${totalGrappleModifier}`, [totalGrappleModifier]);
  const formattedMeleeAttackBonus = React.useMemo(() => `${calculatedMeleeAttackBonus >= 0 ? '+' : ''}${calculatedMeleeAttackBonus}`, [calculatedMeleeAttackBonus]);
  const formattedMeleeDamageBonus = React.useMemo(() => `${calculatedMeleeNumericalDamageBonus >= 0 ? '+' : ''}${calculatedMeleeNumericalDamageBonus}`, [calculatedMeleeNumericalDamageBonus]);
  const formattedRangedAttackBonus = React.useMemo(() => `${calculatedRangedAttackBonus >= 0 ? '+' : ''}${calculatedRangedAttackBonus}`, [calculatedRangedAttackBonus]);
  const formattedRangedDamageBonus = React.useMemo(() => `${calculatedRangedNumericalDamageBonus >= 0 ? '+' : ''}${calculatedRangedNumericalDamageBonus}`, [calculatedRangedNumericalDamageBonus]);

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
                <p id="bab-display" className={cn(textStyleValueBig, "text-accent")}>{formattedBab}</p>
                <Button type="button" variant="ghost" size="icon-xs" onClick={handleBabInfo}><Info /></Button>
              </div>
              {!panelIsLocked && (
                <div className={cn("mt-auto flex flex-col items-center", panelFieldVerticalGap)}>
                  <Label htmlFor="bab-custom-mod" className={cn(textStyleLabel)}>{UI_STRINGS.infoDialogCustomModifierLabel}</Label>
                  <div className={cn("flex justify-center", inputWidthStandard)}>
                    <Input id="bab-custom-mod" type="number" value={localBabMiscModifier} onChange={(e) => setLocalBabMiscModifier(parseInt(e.target.value, 10) || 0)} className={cn(textStyleInput)} />
                  </div>
                </div>
              )}
            </div>
            <div className={cn("flex flex-col border rounded-md bg-card items-center text-center", panelContentPadding, panelFieldVerticalGap)}>
              <Label htmlFor="initiative-display" className={textStyleCardTitle}>{UI_STRINGS.combatPanelInitiativeLabel}</Label>
              <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                <p id="initiative-display" className={cn(textStyleValueBig, "text-accent")}>{formattedInitiative}</p>
                <Button type="button" variant="ghost" size="icon-xs" onClick={handleInitiativeInfo}><Info /></Button>
                <Button type="button" variant="ghost" size="icon-xs" onClick={handleRollInitiative} aria-label={UI_STRINGS.rollDialogInitiativeAriaLabel}><Dices /></Button>
              </div>
              {!panelIsLocked && (
                <div className={cn("mt-auto flex flex-col items-center", panelFieldVerticalGap)}>
                  <Label htmlFor="initiative-custom-mod" className={cn(textStyleLabel)}>{UI_STRINGS.infoDialogCustomModifierLabel}</Label>
                  <div className={cn("flex justify-center", inputWidthStandard)}>
                    <Input id="initiative-custom-mod" type="number" value={localInitiativeMiscModifier} onChange={(e) => setLocalInitiativeMiscModifier(parseInt(e.target.value, 10) || 0)} className={cn(textStyleInput)} />
                  </div>
                </div>
              )}
            </div>
            <div className={cn("flex flex-col border rounded-md bg-card items-center text-center", panelContentPadding, panelFieldVerticalGap)}>
              <Label htmlFor="grapple-mod-display" className={textStyleCardTitle}>{UI_STRINGS.combatPanelGrappleModifierLabel}</Label>
                 <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                    <p id="grapple-mod-display" className={cn(textStyleValueBig, "text-accent")}>{formattedGrapple}</p>
                    <Button type="button" variant="ghost" size="icon-xs" onClick={handleGrappleModifierInfo}><Info /></Button>
                    <Button type="button" variant="ghost" size="icon-xs" onClick={handleRollGrapple} aria-label={UI_STRINGS.rollDialogGrappleCheckAriaLabel}><Dices /></Button>
                 </div>
              {!panelIsLocked && (
                <div className={cn("mt-auto flex flex-col items-center", panelFieldVerticalGap)}>
                  <Label htmlFor="grapple-custom-mod" className={cn(textStyleLabel)}>{UI_STRINGS.infoDialogCustomModifierLabel}</Label>
                  <div className={cn("flex justify-center", inputWidthStandard)}>
                    <Input id="grapple-custom-mod" type="number" value={localGrappleMiscModifier} onChange={(e) => setLocalGrappleMiscModifier(parseInt(e.target.value, 10) || 0)} className={cn(textStyleInput)} />
                  </div>
                </div>
              )}
            </div>
          </div>
          {(hasPowerAttackFeat || hasCombatExpertiseFeat) && !panelIsLocked && (
            <div className={cn("grid grid-cols-1 md:grid-cols-2", panelGridGap)}>
              {hasPowerAttackFeat && (
                <div className={cn("flex flex-col border rounded-md bg-card items-center text-center", panelContentPadding, panelFieldVerticalGap)}>
                  <Label htmlFor="power-attack-value" className={cn("flex items-center", textStyleLabel, panelFieldHorizontalGap)}><Activity className="text-destructive/80"/>{UI_STRINGS.powerAttackValueLabel}</Label>
                  <p className={textStyleSubLabel}>{UI_STRINGS.powerAttackDescription}</p>
                  <div className={cn("flex justify-center", inputWidthStandard)}>
                    <Input id="power-attack-value" type="number" value={localPowerAttackValue} onChange={(e) => setLocalPowerAttackValue(parseInt(e.target.value, 10) || 0)} min={0} max={maxBabForSpinners > 0 ? maxBabForSpinners : 0} className={cn(textStyleInput)} />
                  </div>
                </div>
              )}
              {hasCombatExpertiseFeat && (
                <div className={cn("flex flex-col border rounded-md bg-card items-center text-center", panelContentPadding, panelFieldVerticalGap)}>
                  <Label htmlFor="combat-expertise-value" className={cn("flex items-center", textStyleLabel, panelFieldHorizontalGap)}><ShieldIcon className="text-blue-500/80"/>{UI_STRINGS.combatExpertiseValueLabel}</Label>
                  <p className={textStyleSubLabel}>{UI_STRINGS.combatExpertiseDescription}</p>
                  <div className={cn("flex justify-center", inputWidthStandard)}>
                    <Input id="combat-expertise-value" type="number" value={localCombatExpertiseValue} onChange={(e) => setLocalCombatExpertiseValue(parseInt(e.target.value, 10) || 0)} min={0} max={maxBabForSpinners > 0 ? maxBabForSpinners : 0} className={cn(textStyleInput)} />
                  </div>
                </div>
              )}
            </div>
          )}
          <div className={cn("grid grid-cols-1 md:grid-cols-2", panelGridGap)}>
            <AttackCard
              attackType="melee"
              Icon={Hand}
              title={UI_STRINGS.attacksPanelMeleeTitle}
              weaponInstances={meleeWeaponInstances}
              selectedWeaponInstanceId={selectedMainHandMeleeWeaponInstanceId}
              onSelectedWeaponChange={setSelectedMainHandMeleeWeaponInstanceId}
              formattedAttackBonus={formattedMeleeAttackBonus}
              formattedDamageBonus={formattedMeleeDamageBonus}
              weaponDisplay={mainHandWeaponDisplay}
              onOpenAttackBreakdown={() => handleOpenAttackBreakdown(true)}
              onOpenDamageBreakdown={() => handleOpenDamageBreakdown(true)}
              onRollAttack={handleRollMeleeAttack}
              onRollDamage={handleRollMeleeDamage}
              isPanelLocked={panelIsLocked}
              uiStrings={UI_STRINGS}
              currentLang={currentLang}
              offHandWeaponInstances={meleeWeaponInstances}
              selectedOffHandWeaponInstanceId={selectedOffHandMeleeWeaponInstanceId}
              onSelectedOffHandWeaponChange={setSelectedOffHandMeleeWeaponInstanceId}
              offHandWeaponDisplay={offHandWeaponDisplay}
            />
            <AttackCard
              attackType="ranged"
              Icon={ArrowRightLeft}
              title={UI_STRINGS.attacksPanelRangedTitle}
              weaponInstances={rangedWeaponInstances}
              selectedWeaponInstanceId={selectedRangedWeaponInstanceId}
              onSelectedWeaponChange={setSelectedRangedWeaponInstanceId}
              formattedAttackBonus={formattedRangedAttackBonus}
              formattedDamageBonus={formattedRangedDamageBonus}
              weaponDisplay={rangedWeaponDisplay}
              onOpenAttackBreakdown={() => handleOpenAttackBreakdown(false)}
              onOpenDamageBreakdown={() => handleOpenDamageBreakdown(false)}
              onRollAttack={handleRollRangedAttack}
              onRollDamage={handleRollRangedDamage}
              isPanelLocked={panelIsLocked}
              uiStrings={UI_STRINGS}
              currentLang={currentLang}
              isRangedCardAndNoWeapons={rangedWeaponInstances.length === 0}
            />
          </div>
        </CardContent>
      )}
    </LockablePanelWrapper>
  );
};
CombatPanelComponent.displayName = 'CombatPanelComponent';
export const CombatPanel = React.memo(CombatPanelComponent);
