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
import { Swords, Info, Loader2, Dices, Hand, ArrowRightLeft, Activity, Shield as ShieldIcon } from 'lucide-react';
import { getAbilityModifierByName, getBab, calculateInitiative, calculateGrapple, getSizeModifierGrapple, getUnarmedGrappleDamage, getSizeModifierAttack, parseAndRollDice } from '@/lib/dnd-utils';
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
  const { translations, isLoading: translationsLoading, language: currentLang } = useI18n();
  const { rerollTwentiesForChecks } = useDefinitionsStore(state => ({
    rerollTwentiesForChecks: state.rerollTwentiesForChecks,
  }));

  const [selectedMainHandMeleeWeaponInstanceId, setSelectedMainHandMeleeWeaponInstanceId] = React.useState<string>('unarmed');
  const [selectedOffHandMeleeWeaponInstanceId, setSelectedOffHandMeleeWeaponInstanceId] = React.useState<string>('none');
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
  const [localPowerAttackValue, setLocalPowerAttackValue] = useDebouncedFormField(
    combatData.powerAttackValue || 0, (value) => onCharacterUpdate('powerAttackValue', value), debounceDelayFormInput
  );
  const [localCombatExpertiseValue, setLocalCombatExpertiseValue] = useDebouncedFormField(
    combatData.combatExpertiseValue || 0, (value) => onCharacterUpdate('combatExpertiseValue', value), debounceDelayFormInput
  );

  const allWeaponAndShieldDefinitions = React.useMemo(() => {
    if (translationsLoading || !translations) return [];
    const weapons = translations.ITEM_DEFINITIONS_WEAPONS || [];
    const shields = (translations.ITEM_DEFINITIONS_SHIELDS || []).filter(s => s.damage);
    return [...weapons, ...shields];
  }, [translations, translationsLoading]);

  const getWeaponDefinition = React.useCallback((definitionId: string | undefined): ItemDefinition | undefined => {
    if (!definitionId) return undefined;
    return allWeaponAndShieldDefinitions.find(def => def.definitionId === definitionId);
  }, [allWeaponAndShieldDefinitions]);

  React.useEffect(() => {
    const mainHandInstanceId = combatData.equippedGear?.['main-hand'];
    const twoHandInstanceId = combatData.equippedGear?.['two-hand'];
    let finalMainHandId = 'unarmed'; 

    if (mainHandInstanceId) {
        const mainHandItem = combatData.inventory?.find(i => i.instanceId === mainHandInstanceId);
        const mainHandDef = getWeaponDefinition(mainHandItem?.definitionId);
        if (mainHandDef && (mainHandDef.itemType === 'weapon' || mainHandDef.itemType === 'shield') && (mainHandDef.weaponType === 'melee' || mainHandDef.weaponType === 'melee-or-ranged')) {
            finalMainHandId = mainHandInstanceId;
        }
    } else if (twoHandInstanceId) {
        const twoHandItem = combatData.inventory?.find(i => i.instanceId === twoHandInstanceId);
        const twoHandDef = getWeaponDefinition(twoHandItem?.definitionId);
        if (twoHandDef && (twoHandDef.itemType === 'weapon' || twoHandDef.itemType === 'shield') && (twoHandDef.weaponType === 'melee' || twoHandDef.weaponType === 'melee-or-ranged')) {
            finalMainHandId = twoHandInstanceId;
        }
    }
    setSelectedMainHandMeleeWeaponInstanceId(finalMainHandId);

    const offHandInstanceId = combatData.equippedGear?.['off-hand'];
    let finalOffHandId = 'none';

    if (offHandInstanceId) {
        const offHandItem = combatData.inventory?.find(i => i.instanceId === offHandInstanceId);
        const offHandDef = getWeaponDefinition(offHandItem?.definitionId);
        if (offHandDef && (offHandDef.itemType === 'weapon' || offHandDef.itemType === 'shield') && (offHandDef.weaponType === 'melee' || offHandDef.weaponType === 'melee-or-ranged')) {
            finalOffHandId = offHandInstanceId;
        }
    }
    setSelectedOffHandMeleeWeaponInstanceId(finalOffHandId);

    let rangedEquipped = false;
    if (mainHandInstanceId) {
      const mainHandItem = combatData.inventory?.find(i => i.instanceId === mainHandInstanceId);
      const mainHandDef = getWeaponDefinition(mainHandItem?.definitionId);
      if (mainHandDef?.itemType === 'weapon' && (mainHandDef.weaponType === 'ranged' || mainHandDef.weaponType === 'melee-or-ranged')) {
        setSelectedRangedWeaponInstanceId(mainHandInstanceId);
        rangedEquipped = true;
      }
    }
    if (!rangedEquipped && twoHandInstanceId) {
      const twoHandItem = combatData.inventory?.find(i => i.instanceId === twoHandInstanceId);
      const twoHandDef = getWeaponDefinition(twoHandItem?.definitionId);
       if (twoHandDef?.itemType === 'weapon' && (twoHandDef.weaponType === 'ranged' || twoHandDef.weaponType === 'melee-or-ranged')) {
         setSelectedRangedWeaponInstanceId(twoHandInstanceId);
         rangedEquipped = true;
       }
    }
    if (!rangedEquipped) {
        setSelectedRangedWeaponInstanceId('none');
    }
  }, [combatData.equippedGear, combatData.inventory, getWeaponDefinition]);


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
  }, [aggregatedFeatEffects?.attackRollBonuses, currentLang]);

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
  }, [aggregatedFeatEffects?.damageRollBonuses, currentLang]);

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

  const handleBabInfo = React.useCallback(() => onOpenCombatStatInfoDialog({ type: 'babBreakdown' }), [onOpenCombatStatInfoDialog]);
  const handleInitiativeInfo = React.useCallback(() => onOpenCombatStatInfoDialog({ type: 'initiativeBreakdown' }), [onOpenCombatStatInfoDialog]);
  const handleGrappleModifierInfo = React.useCallback(() => onOpenCombatStatInfoDialog({ type: 'grappleModifierBreakdown' }), [onOpenCombatStatInfoDialog]);
  
  const totalBabWithModifier = React.useMemo(() => {
    if (!combatData.classes || !translations) return [0];
    const babArray = getBab(combatData.classes, translations.DND_CLASSES);
    return babArray.map(bab => bab + (combatData.babMiscModifier || 0));
  }, [combatData.classes, combatData.babMiscModifier, translations]);

  const meleeWeaponInstances = React.useMemo(() => {
    if (!translations) return [];
    const inventoryItems = combatData.inventory?.filter(itemInst => {
        const itemDef = getWeaponDefinition(itemInst.definitionId);
        return itemDef && (itemDef.itemType === 'weapon' || (itemDef.itemType === 'shield' && !!itemDef.damage));
    }) || [];

    const unarmedDef: ItemDefinition = {
      definitionId: 'unarmed-placeholder',
      label: { en: 'Unarmed', fr: 'À mains nues' },
      itemType: 'weapon' as const,
      weaponType: 'melee' as const,
      damage: (aggregatedFeatEffects?.modifiedMechanics?.unarmedDamage?.isActive && typeof aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value === 'string' ? aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value : (translations.UI_STRINGS.unarmedDamageDefault)),
      criticalRange: '20',
      criticalMultiplier: 'x2'
    };

    const meleeInventoryItems = inventoryItems
      .map(inst => ({ ...inst, definition: getWeaponDefinition(inst.definitionId)! }))
      .filter(item => item.definition && (item.definition.weaponType === 'melee' || item.definition.weaponType === 'melee-or-ranged'));
      
    return [
      { instanceId: 'unarmed', definitionId: 'unarmed-placeholder', quantity: 1, definition: unarmedDef },
      ...meleeInventoryItems,
    ];
  }, [combatData.inventory, translations, getWeaponDefinition, aggregatedFeatEffects?.modifiedMechanics?.unarmedDamage]);
  
  const rangedWeaponInstances = React.useMemo(() => {
    if (!combatData.inventory) return [];
    return combatData.inventory
      .map(inst => ({ ...inst, definition: getWeaponDefinition(inst.definitionId)! }))
      .filter(item => item.definition && (item.definition.weaponType === 'ranged' || item.definition.weaponType === 'melee-or-ranged'));
  }, [combatData.inventory, getWeaponDefinition]);
  
  
  const handleOpenAttackBreakdown = React.useCallback((isMelee: boolean) => {
    if (!translations || !combatData.abilityScores || !combatData.sizeModifierAttack) return;
    const { UI_STRINGS, ABILITY_LABELS } = translations;
    const selectedMeleeWeaponInstance = meleeWeaponInstances.find(w => w.instanceId === selectedMainHandMeleeWeaponInstanceId);
    const weaponDef = isMelee ? selectedMeleeWeaponInstance?.definition : getWeaponDefinition(rangedWeaponInstances.find(w => w.instanceId === selectedRangedWeaponInstanceId)?.definitionId);
    const weaponInstId = isMelee ? selectedMainHandMeleeWeaponInstanceId : selectedRangedWeaponInstanceId;
    if (!weaponDef && (!isMelee || weaponInstId !== 'unarmed')) return;

    const components: GenericBreakdownItem[] = [];
    const bab = totalBabWithModifier[0];
    const strMod = getAbilityModifierByName(combatData.abilityScores, 'strength');
    const dexMod = getAbilityModifierByName(combatData.abilityScores, 'dexterity');
    const abilityMod = isMelee ? (weaponDef?.isFinesseWeapon && dexMod > strMod ? dexMod : strMod) : dexMod;
    const abilityAbbr = ABILITY_LABELS.find(al => al.id === (isMelee ? (weaponDef?.isFinesseWeapon && dexMod > strMod ? 'dexterity' : 'strength') : 'dexterity'))?.abbr || 'MOD';
    const sizeMod = combatData.sizeModifierAttack;
    const enhBonus = getWeaponEnhancementBonus(weaponDef).attack;
    const featBonus = getActiveAttackBonuses(isMelee ? (weaponInstId === 'unarmed' ? 'unarmed' : 'melee') : 'ranged', weaponDef).reduce((sum, eff) => sum + ((eff.value as number) || 0), 0);

    components.push({ label: UI_STRINGS.attacksPanelBabLabel, value: bab });
    components.push({ label: (UI_STRINGS.attacksPanelAbilityModLabel).replace("{abilityAbbr}", abilityAbbr), value: abilityMod });
    if (sizeMod !== 0) components.push({ label: UI_STRINGS.attacksPanelSizeModLabel, value: sizeMod });
    if (enhBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelWeaponEnhancementLabel, value: enhBonus });
    if (featBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelFeatBonusLabel, value: featBonus });
    if (isMelee && (combatData.powerAttackValue || 0) > 0) components.push({ label: UI_STRINGS.powerAttackPenaltyLabel, value: -(combatData.powerAttackValue || 0) });
    if (isMelee && (combatData.combatExpertiseValue || 0) > 0) components.push({ label: UI_STRINGS.combatExpertisePenaltyLabel, value: -(combatData.combatExpertiseValue || 0) });
    
    const total = bab + abilityMod + sizeMod + enhBonus + featBonus - (isMelee ? (combatData.powerAttackValue || 0) + (combatData.combatExpertiseValue || 0) : 0);
    components.push({ label: UI_STRINGS.infoDialogTotalLabel, value: total, isBold: true });

    onOpenCombatStatInfoDialog({ type: 'genericNumericalBreakdown', titleKey: isMelee ? 'infoDialogTitleMeleeAttackBreakdown' : 'infoDialogTitleRangedAttackBreakdown', components });
  }, [translations, combatData, selectedMainHandMeleeWeaponInstanceId, selectedRangedWeaponInstanceId, totalBabWithModifier, getWeaponDefinition, getActiveAttackBonuses, getWeaponEnhancementBonus, onOpenCombatStatInfoDialog, meleeWeaponInstances, rangedWeaponInstances]);

  const handleOpenDamageBreakdown = React.useCallback((isMelee: boolean) => {
    if (!translations || !combatData.abilityScores || !aggregatedFeatEffects) return;
    const { UI_STRINGS } = translations;
    const selectedMeleeWeaponInstance = meleeWeaponInstances.find(w => w.instanceId === selectedMainHandMeleeWeaponInstanceId);
    const weaponDef = isMelee ? selectedMeleeWeaponInstance?.definition : getWeaponDefinition(rangedWeaponInstances.find(w => w.instanceId === selectedRangedWeaponInstanceId)?.definitionId);
    const weaponInstId = isMelee ? selectedMainHandMeleeWeaponInstanceId : selectedRangedWeaponInstanceId;
    const unarmedDmg = aggregatedFeatEffects.modifiedMechanics?.unarmedDamage?.isActive && typeof aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value === 'string' ? aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value : (UI_STRINGS.unarmedDamageDefault);
    if (!weaponDef && (!isMelee || weaponInstId !== 'unarmed')) return;

    const components: GenericBreakdownItem[] = [];
    const baseDamage = isMelee ? (weaponInstId === 'unarmed' ? unarmedDmg : weaponDef?.damage) : weaponDef?.damage;
    components.push({ label: UI_STRINGS.attacksPanelBaseWeaponDamageLabel, value: baseDamage || "N/A", isRawValue: true });

    const strMod = getAbilityModifierByName(combatData.abilityScores, 'strength');
    const abilityMod = isMelee ? strMod : 0; 
    const abilityAbbr = isMelee ? (translations.ABILITY_LABELS.find(al => al.id === 'strength')?.abbr || 'STR') : '';
    if (abilityMod !== 0) components.push({ label: (UI_STRINGS.attacksPanelAbilityModLabel).replace("{abilityAbbr}", abilityAbbr), value: abilityMod });

    const enhBonus = getWeaponEnhancementBonus(weaponDef).damage;
    if (enhBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelWeaponEnhancementLabel, value: enhBonus });

    const featBonus = getActiveDamageBonuses(isMelee ? (weaponInstId === 'unarmed' ? 'unarmed' : 'melee') : 'ranged', weaponDef).reduce((sum, eff) => sum + ((eff.value as number) || 0), 0);
    if (featBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelFeatBonusLabel, value: featBonus });

    if (isMelee && (combatData.powerAttackValue || 0) > 0) components.push({ label: UI_STRINGS.powerAttackDamageBonusLabel, value: (combatData.powerAttackValue || 0) });
    
    const strModifierForDamageBonus = getAbilityModifierByName(combatData.abilityScores, 'strength');
    const meleeNumericalDamageBonusFinal = (selectedMainHandMeleeWeaponInstanceId === 'unarmed' || weaponDef?.weaponType === 'melee' || weaponDef?.weaponType === 'melee-or-ranged' ? strModifierForDamageBonus : 0) + getWeaponEnhancementBonus(weaponDef).damage + getActiveDamageBonuses('melee', weaponDef).reduce((s, e) => s + ((e.value as number) || 0), 0) + (combatData.powerAttackValue || 0);
    const rangedNumericalDamageBonusFinal = getWeaponEnhancementBonus(weaponDef).damage + getActiveDamageBonuses('ranged', weaponDef).reduce((s, e) => s + ((e.value as number) || 0), 0);
    
    const totalNumericBonus = (isMelee ? meleeNumericalDamageBonusFinal : rangedNumericalDamageBonusFinal) - (isMelee ? strMod : 0) + abilityMod; 
    components.push({ label: UI_STRINGS.infoDialogTotalNumericBonusLabel, value: totalNumericBonus, isBold: true });
    
    onOpenCombatStatInfoDialog({ type: 'genericNumericalBreakdown', titleKey: isMelee ? 'infoDialogTitleMeleeDamageBreakdown' : 'infoDialogTitleRangedDamageBreakdown', components });
  }, [translations, combatData, selectedMainHandMeleeWeaponInstanceId, selectedRangedWeaponInstanceId, getWeaponDefinition, getActiveDamageBonuses, getWeaponEnhancementBonus, aggregatedFeatEffects, onOpenCombatStatInfoDialog, meleeWeaponInstances, rangedWeaponInstances]);
  
  const parseCritMultiplier = React.useCallback((critMultString: string | undefined): number => {
    if (!critMultString) return 1;
    const match = critMultString.toLowerCase().match(/x(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }, []);

  const handleRollAction = React.useCallback((rollType: 'initiative' | 'grapple' | 'melee-attack' | 'melee-damage' | 'ranged-attack' | 'ranged-damage') => {
    if (!translations || !combatData.abilityScores || !aggregatedFeatEffects) return;
    const { UI_STRINGS, DND_CLASSES, SIZES, ABILITY_LABELS } = translations;
    
    const strMod = getAbilityModifierByName(combatData.abilityScores, 'strength');
    const dexMod = getAbilityModifierByName(combatData.abilityScores, 'dexterity');
    const bab = getBab(combatData.classes || [], DND_CLASSES)[0] || 0;
    
    let dialogTitle = "";
    let baseModifier = 0;
    let calculationBreakdown: GenericBreakdownItem[] = [];
    let weaponDamageDiceString: string = "";
    let weaponCriticalMultiplier: number = 1;
    let extraDamageDice: string[] = [];

    switch(rollType) {
      case 'initiative':
        baseModifier = calculateInitiative(dexMod, combatData.initiativeMiscModifier || 0) + (aggregatedFeatEffects.initiativeBonus || 0);
        dialogTitle = UI_STRINGS.rollDialogTitleInitiative || 'Roll Initiative';
        if (dexMod !== 0) calculationBreakdown.push({ label: (UI_STRINGS.infoDialogInitiativeAbilityModLabel || 'Ability Modifier').replace("{abilityAbbr}", 'DEX'), value: dexMod });
        if ((aggregatedFeatEffects.initiativeBonus || 0) !== 0) calculationBreakdown.push({ label: UI_STRINGS.infoDialogFeatBonusLabel || 'Feat Bonus', value: aggregatedFeatEffects.initiativeBonus || 0 });
        if (combatData.initiativeMiscModifier !== 0) calculationBreakdown.push({ label: UI_STRINGS.infoDialogCustomModifierLabel || 'Misc Modifier', value: combatData.initiativeMiscModifier || 0 });
        break;
      
      case 'grapple':
        baseModifier = calculateGrapple(combatData.classes || [], strMod, getSizeModifierGrapple(combatData.size, SIZES), DND_CLASSES) + (combatData.grappleMiscModifier || 0) + (aggregatedFeatEffects?.attackRollBonuses?.filter(b => b.appliesTo === 'grapple' && b.isActive).reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0) || 0);
        dialogTitle = UI_STRINGS.rollDialogTitleGrappleCheck || 'Roll Grapple Check';
        if(bab) calculationBreakdown.push({ label: UI_STRINGS.infoDialogGrappleModBabLabel || 'Base Attack Bonus', value: bab });
        if(strMod) calculationBreakdown.push({ label: (UI_STRINGS.infoDialogGrappleModAbilityLabel || 'Ability Modifier').replace("{abilityAbbr}", 'STR'), value: strMod });
        const sizeModGrapple = getSizeModifierGrapple(combatData.size, SIZES);
        if(sizeModGrapple) calculationBreakdown.push({ label: UI_STRINGS.infoDialogGrappleModSizeLabel || 'Size Modifier', value: sizeModGrapple });
        const featGrappleBonus = (aggregatedFeatEffects.attackRollBonuses?.filter(b => b.appliesTo === 'grapple' && b.isActive).reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0) || 0);
        if(featGrappleBonus) calculationBreakdown.push({ label: UI_STRINGS.infoDialogFeatBonusLabel || 'Feat Bonus', value: featGrappleBonus });
        if(combatData.grappleMiscModifier) calculationBreakdown.push({ label: UI_STRINGS.infoDialogCustomModifierLabel || 'Misc Modifier', value: combatData.grappleMiscModifier || 0 });
        break;

      case 'melee-attack':
        handleOpenAttackBreakdown(true);
        return;

      case 'melee-damage':
        handleOpenDamageBreakdown(true);
        return;

      case 'ranged-attack':
        handleOpenAttackBreakdown(false);
        return;

      case 'ranged-damage':
        handleOpenDamageBreakdown(false);
        return;
    }
    
    onOpenRollDialog({
      dialogTitle, rollType, baseModifier, calculationBreakdown,
      weaponDamageDiceString, weaponCriticalMultiplier, extraDamageDice,
      rerollTwentiesForChecks: rollType.includes('attack') || rollType.includes('damage') ? false : rerollTwentiesForChecks,
    });
  }, [
    translations, combatData, aggregatedFeatEffects, onOpenRollDialog, rerollTwentiesForChecks,
    selectedMainHandMeleeWeaponInstanceId, selectedRangedWeaponInstanceId,
    handleOpenAttackBreakdown, handleOpenDamageBreakdown, getWeaponDefinition, parseCritMultiplier, currentLang
  ]);

  const { DND_CLASSES, SIZES, ABILITY_LABELS, UI_STRINGS } = translations || {};
  if (translationsLoading || !UI_STRINGS || !DND_CLASSES || !SIZES || !ABILITY_LABELS || !aggregatedFeatEffects) {
    return null;
  }
  
  const characterFeats = combatData.feats;
  const strModifier = getAbilityModifierByName(combatData.abilityScores, 'strength');
  const dexModifier = getAbilityModifierByName(combatData.abilityScores, 'dexterity');
  const baseInitiative = calculateInitiative(dexModifier, combatData.initiativeMiscModifier || 0) + (aggregatedFeatEffects.initiativeBonus || 0);
  const totalGrappleModifier = calculateGrapple(combatData.classes || [], strModifier, getSizeModifierGrapple(combatData.size, SIZES), DND_CLASSES) + (combatData.grappleMiscModifier || 0) + (aggregatedFeatEffects?.attackRollBonuses?.filter(b => b.appliesTo === 'grapple' && b.isActive).reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0) || 0);

  const selectedMainHandMeleeWeaponInstance = meleeWeaponInstances.find(w => w.instanceId === selectedMainHandMeleeWeaponInstanceId);
  const selectedMainHandMeleeWeaponDefinition = selectedMainHandMeleeWeaponInstance?.definition;
  
  const selectedOffHandMeleeWeaponInstance = meleeWeaponInstances.find(w => w.instanceId === selectedOffHandMeleeWeaponInstanceId);
  const selectedOffHandMeleeWeaponDefinition = selectedOffHandMeleeWeaponInstance?.definition;
  
  const selectedRangedWeaponInstance = rangedWeaponInstances.find(w => w.instanceId === selectedRangedWeaponInstanceId);
  const selectedRangedWeaponDefinition = selectedRangedWeaponInstance?.definition;
  
  const meleeAbilityModForAttack = selectedMainHandMeleeWeaponDefinition?.isFinesseWeapon && dexModifier > strModifier ? dexModifier : strModifier;
  const calculatedMeleeAttackBonus = calculateFinalAttackBonus(totalBabWithModifier[0], meleeAbilityModForAttack, combatData.sizeModifierAttack || 0, 'melee', selectedMainHandMeleeWeaponDefinition, combatData.powerAttackValue, combatData.combatExpertiseValue);
  const calculatedMeleeNumericalDamageBonus = calculateFinalNumericalDamageBonus(strModifier, 'melee', selectedMainHandMeleeWeaponDefinition, combatData.powerAttackValue);
  
  const calculatedRangedAttackBonus = selectedRangedWeaponDefinition ? calculateFinalAttackBonus(totalBabWithModifier[0], dexModifier, combatData.sizeModifierAttack || 0, 'ranged', selectedRangedWeaponDefinition) : 0;
  const calculatedRangedNumericalDamageBonus = selectedRangedWeaponDefinition ? calculateFinalNumericalDamageBonus(0, 'ranged', selectedRangedWeaponDefinition) : 0;
  
  const hasPowerAttackFeat = allFeatDefinitions.some(f => f.id === 'power-attack' && characterFeats.some(cf => cf.definitionId === f.id));
  const hasCombatExpertiseFeat = allFeatDefinitions.some(f => f.id === 'combat-expertise' && characterFeats.some(cf => cf.definitionId === f.id));
  const maxBabForSpinners = getBab(combatData.classes || [], DND_CLASSES)[0] || 0;
  
  const unarmedBaseDamageFromFeat = aggregatedFeatEffects.modifiedMechanics?.unarmedDamage?.isActive && typeof aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value === 'string' ? aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value : (UI_STRINGS.unarmedDamageDefault);

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
            <Card>
              <CardContent className={cn("flex flex-col", panelContentPadding, "gap-4")}>
                <CardTitle className={cn(textStyleCardTitle, "flex items-center gap-2")}><Hand />{UI_STRINGS.attacksPanelMeleeTitle}</CardTitle>
                <div className={cn("grid grid-cols-2", panelGridGap)}>
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
                <div className={cn("flex flex-col", panelFieldVerticalGap)}>
                    <Label htmlFor="main-hand-weapon-select" className={textStyleLabel}>{UI_STRINGS.attacksPanelMainHandMeleeWeaponLabel}</Label>
                    <Select value={selectedMainHandMeleeWeaponInstanceId} onValueChange={setSelectedMainHandMeleeWeaponInstanceId}>
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
                      <div className={cn("flex w-full items-center justify-between", "gap-2")}>
                        <DualBadge color="primary" leftLabel={UI_STRINGS.attacksPanelWeaponDamageLabel} rightLabel={selectedMainHandMeleeWeaponInstanceId === 'unarmed' ? unarmedBaseDamageFromFeat : selectedMainHandMeleeWeaponDefinition.damage || 'N/A'} className={textStyleBadgeSmall} />
                        <DualBadge color="secondary" leftLabel={(UI_STRINGS.attacksPanelCriticalOnLabel).replace("{range}", selectedMainHandMeleeWeaponDefinition.criticalRange || '20')} rightLabel={(selectedMainHandMeleeWeaponDefinition.criticalMultiplier || 'x2').replace('x', '×')} className={textStyleBadgeSmall} />
                      </div>
                    )}
                </div>
                <div className={cn("flex flex-col", panelFieldVerticalGap)}>
                    <Label htmlFor="off-hand-weapon-select" className={textStyleLabel}>{UI_STRINGS.attacksPanelOffHandMeleeWeaponLabel}</Label>
                    <Select value={selectedOffHandMeleeWeaponInstanceId} onValueChange={setSelectedOffHandMeleeWeaponInstanceId}>
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
                      <div className={cn("flex w-full items-center justify-between", "gap-2")}>
                        <DualBadge color="primary" leftLabel={UI_STRINGS.attacksPanelWeaponDamageLabel} rightLabel={selectedOffHandMeleeWeaponDefinition.damage || 'N/A'} className={textStyleBadgeSmall} />
                        <DualBadge color="secondary" leftLabel={(UI_STRINGS.attacksPanelCriticalOnLabel).replace("{range}", selectedOffHandMeleeWeaponDefinition.criticalRange || '20')} rightLabel={(selectedOffHandMeleeWeaponDefinition.criticalMultiplier || 'x2').replace('x', '×')} className={textStyleBadgeSmall} />
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
            <div className={cn("flex flex-col", "gap-4")}>
                <Card>
                    <CardContent className={cn("flex flex-col h-full", panelContentPadding, "gap-4")}>
                        <CardTitle className={cn(textStyleCardTitle, "flex items-center gap-2")}><ArrowRightLeft />{UI_STRINGS.attacksPanelRangedTitle}</CardTitle>
                        <div className={cn("grid grid-cols-2", panelGridGap)}>
                          <div className="text-center flex flex-col gap-1">
                            <Label className={textStyleLabel}>{UI_STRINGS.attacksPanelAttackBonusLabel}</Label>
                            <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                              <p className={cn(textStyleValueBig, "text-accent")}>
                                {selectedRangedWeaponDefinition ? `${calculatedRangedAttackBonus >= 0 ? '+' : ''}${calculatedRangedAttackBonus}` : '—'}
                              </p>
                              <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleOpenAttackBreakdown(false)} disabled={!selectedRangedWeaponDefinition}><Info /></Button>
                              <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleRollAction('ranged-attack')} aria-label={(UI_STRINGS.rollDialogRangedAttackAriaLabel || "Roll Ranged Attack with {weaponName}").replace("{weaponName}", selectedRangedWeaponDefinition?.label ? getLocalizedString(selectedRangedWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : '')} disabled={!selectedRangedWeaponDefinition}><Dices /></Button>
                            </div>
                          </div>
                          <div className="text-center flex flex-col gap-1">
                            <Label className={textStyleLabel}>{UI_STRINGS.attacksPanelDamageBonusLabel}</Label>
                            <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                              <p className={cn(textStyleValueBig, "text-accent")}>
                                {selectedRangedWeaponDefinition ? `${calculatedRangedNumericalDamageBonus >= 0 ? '+' : ''}${calculatedRangedNumericalDamageBonus}` : '—'}
                              </p>
                              <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleOpenDamageBreakdown(false)} disabled={!selectedRangedWeaponDefinition}><Info /></Button>
                              <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleRollAction('ranged-damage')} aria-label={(UI_STRINGS.rollDialogDamageAriaLabel || "Roll Damage for {weaponName}").replace("{weaponName}", selectedRangedWeaponDefinition?.label ? getLocalizedString(selectedRangedWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : '')} disabled={!selectedRangedWeaponDefinition}><Dices /></Button>
                            </div>
                          </div>
                        </div>
                        <div className={cn("flex flex-col", panelFieldVerticalGap, "mt-auto")}>
                          <Label htmlFor="ranged-weapon-select" className={textStyleLabel}>{UI_STRINGS.attacksPanelRangedWeaponLabel}</Label>
                          <Select value={selectedRangedWeaponInstanceId} onValueChange={setSelectedRangedWeaponInstanceId}>
                            <SelectTrigger id="ranged-weapon-select">
                              <SelectValue placeholder={UI_STRINGS.deityNoneOption} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                <SelectItem value="none">{UI_STRINGS.deityNoneOption}</SelectItem>
                                {rangedWeaponInstances.map((wInst) => (<SelectItem key={wInst.instanceId} value={wInst.instanceId}>{getLocalizedString(wInst.definition.label, currentLang, DEFAULT_LANGUAGE)} (x{wInst.quantity})</SelectItem>))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          {selectedRangedWeaponDefinition && (
                            <div className={cn("flex w-full items-center justify-between", "gap-2")}>
                              <DualBadge color="primary" leftLabel={UI_STRINGS.attacksPanelWeaponDamageLabel} rightLabel={selectedRangedWeaponDefinition.damage || 'N/A'} className={textStyleBadgeSmall} />
                              <DualBadge color="secondary" leftLabel={(UI_STRINGS.attacksPanelCriticalOnLabel).replace("{range}", selectedRangedWeaponDefinition.criticalRange || '20')} rightLabel={(selectedRangedWeaponDefinition.criticalMultiplier || 'x2').replace('x', '×')} className={textStyleBadgeSmall} />
                            </div>
                          )}
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>
        </CardContent>
      )}
    </LockablePanelWrapper>
  );
};
CombatPanelComponent.displayName = 'CombatPanelComponent';
export const CombatPanel = React.memo(CombatPanelComponent);
