
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
  GearSlotId,
  LocalizedString,
  WeaponStyleType,
  DamageRollEffect
} from '@/types/character-core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Swords, Info, Dices, Hand, ArrowRightLeft, Activity, Shield as ShieldIcon } from 'lucide-react';
import { getAbilityModifierByName, getBab, calculateInitiative, calculateGrapple, getSizeModifierGrapple } from '@/lib/dnd-utils';
import { useI18n } from '@/context/I18nProvider';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import type { RollDialogProps } from '@/components/RollDialog';
import { useDefinitionsStore } from '@/lib/definitions-store';
import { cn } from '@/lib/utils';
import { getLocalizedString } from '@/i18n/i18n-data';
import { DEFAULT_LANGUAGE, type LanguageCode } from '@/i18n/config';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper';
import { Input } from '@/components/ui/input';
import { AttackCard } from './AttackCard';
import {
  debounceDelayFormInput,
  panelContentPadding,
  panelFieldHorizontalGap,
  panelFieldVerticalGap,
  panelGridGap,
  textStyleCardTitle,
  textStyleInput,
  textStyleLabel,
  textStyleValueBig,
  inputWidthStandard,
  textStyleSubLabel,
} from '@/config/layout';
import { renderModifierValue } from '../info-dialog-content/dialog-utils';


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
  
  const { DND_CLASSES, SIZES, UI_STRINGS, ABILITY_LABELS, ITEM_DEFINITIONS_WEAPONS, ITEM_DEFINITIONS_SHIELDS } = translations || {};

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
  
  const strModifier = React.useMemo(() => getAbilityModifierByName(abilityScores, 'strength'), [abilityScores]);
  const dexModifier = React.useMemo(() => getAbilityModifierByName(abilityScores, 'dexterity'), [abilityScores]);
  
  const totalBabWithModifier = React.useMemo(() => {
    if (!DND_CLASSES) return [0];
    const babArray = getBab(classes || [], DND_CLASSES);
    return babArray.map(bab => bab + (localBabMiscModifier || 0));
  }, [classes, DND_CLASSES, localBabMiscModifier]);

  const baseInitiative = React.useMemo(() => {
    return calculateInitiative(dexModifier, localInitiativeMiscModifier || 0) + (aggregatedFeatEffects?.initiativeBonus || 0);
  }, [dexModifier, localInitiativeMiscModifier, aggregatedFeatEffects?.initiativeBonus]);

  const totalGrappleModifier = React.useMemo(() => {
    if (!SIZES || !DND_CLASSES || !aggregatedFeatEffects?.attackRollBonuses) return 0;
    const featGrappleBonus = aggregatedFeatEffects.attackRollBonuses.filter(b => b.appliesTo === 'grapple' && b.isActive).reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0) || 0;
    return calculateGrapple(classes || [], strModifier, getSizeModifierGrapple(size, SIZES), DND_CLASSES) + (localGrappleMiscModifier || 0) + featGrappleBonus;
  }, [classes, strModifier, size, SIZES, DND_CLASSES, localGrappleMiscModifier, aggregatedFeatEffects?.attackRollBonuses]);
  
  const hasPowerAttackFeat = React.useMemo(() => allFeatDefinitions.some(f => f.id === 'power-attack' && characterFeats.some(cf => cf.definitionId === f.id)), [allFeatDefinitions, characterFeats]);
  const hasCombatExpertiseFeat = React.useMemo(() => allFeatDefinitions.some(f => f.id === 'combat-expertise' && characterFeats.some(cf => cf.definitionId === 'combat-expertise')), [allFeatDefinitions, characterFeats]);
  const maxBabForSpinners = React.useMemo(() => (DND_CLASSES ? getBab(classes || [], DND_CLASSES) : [0])[0] || 0, [classes, DND_CLASSES]);
  
  const allWeaponAndShieldDefinitionsMap = React.useMemo(() => {
    if (translationsLoading || !ITEM_DEFINITIONS_WEAPONS || !ITEM_DEFINITIONS_SHIELDS) return new Map();
    const map = new Map<string, ItemDefinition>();
    const allDefs = [...(ITEM_DEFINITIONS_WEAPONS || []), ...(ITEM_DEFINITIONS_SHIELDS || []).filter(s => s.damage)];
    allDefs.forEach(def => {
      if (def && def.definitionId) map.set(def.definitionId, def);
    });
    return map;
  }, [translationsLoading, ITEM_DEFINITIONS_WEAPONS, ITEM_DEFINITIONS_SHIELDS]);

  const getWeaponDefinition = React.useCallback((definitionId: string | undefined): ItemDefinition | undefined => {
    if (!definitionId) return undefined;
    return allWeaponAndShieldDefinitionsMap.get(definitionId);
  }, [allWeaponAndShieldDefinitionsMap]);

  const { meleeWeaponInstances, rangedWeaponInstances } = React.useMemo(() => {
    if (!inventory || !UI_STRINGS || !aggregatedFeatEffects) return { meleeWeaponInstances: [], rangedWeaponInstances: [] };

    const unarmedStrikeDefinition = {
      definitionId: 'unarmed-placeholder', label: { en: 'Unarmed', fr: 'À mains nues' }, itemType: 'weapon' as const, weaponType: 'melee' as const,
      damage: aggregatedFeatEffects?.modifiedMechanics?.unarmedDamage?.isActive && typeof aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value === 'string' ? aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value : (UI_STRINGS.unarmedDamageDefault),
      criticalRange: '20', criticalMultiplier: 'x2'
    } as ItemDefinition;

    const grantedWeapons = (aggregatedFeatEffects?.grantedAbilities || [])
      .filter(ga => ga.isActive && ga.grantedWeapon)
      .map(ga => ({
        instanceId: `granted-${ga.grantedWeapon!.definition.definitionId}`,
        definitionId: ga.grantedWeapon!.definition.definitionId,
        quantity: 1,
        definition: ga.grantedWeapon!.definition
      }));

    const inventoryItemsWithDefs = inventory
      .map(inst => ({ ...inst, definition: getWeaponDefinition(inst.definitionId)! }))
      .filter(item => item.definition && (item.definition.itemType === 'weapon' || (item.definition.itemType === 'shield' && !!item.definition.damage)));
      
    const allPotentialMelee = [
        { instanceId: 'unarmed', definitionId: 'unarmed-placeholder', quantity: 1, definition: unarmedStrikeDefinition },
        ...inventoryItemsWithDefs.filter(item => item.definition.weaponType === 'melee' || item.definition.weaponType === 'melee-or-ranged'),
        ...grantedWeapons.filter(gw => gw.definition.weaponType === 'melee' || gw.definition.weaponType === 'melee-or-ranged')
    ];
    const allPotentialRanged = inventoryItemsWithDefs.filter(item => item.definition.weaponType === 'ranged' || item.definition.weaponType === 'melee-or-ranged');
    
    return { meleeWeaponInstances: allPotentialMelee, rangedWeaponInstances: allPotentialRanged };
  }, [inventory, getWeaponDefinition, UI_STRINGS, aggregatedFeatEffects]);

  const [selectedMainHandMeleeWeaponInstanceId, setSelectedMainHandMeleeWeaponInstanceId] = React.useState<string>('unarmed');
  const [selectedOffHandMeleeWeaponInstanceId, setSelectedOffHandMeleeWeaponInstanceId] = React.useState<string>('none');
  const [selectedRangedWeaponInstanceId, setSelectedRangedWeaponInstanceId] = React.useState<string>('none');
  
  React.useEffect(() => {
    // Logic to set default selected weapons based on equipped gear can go here
  }, [equippedGear, inventory, getWeaponDefinition]);


  const handleInitiativeRoll = React.useCallback(() => {
    if (!UI_STRINGS || !ABILITY_LABELS) return;
    const featBonus = aggregatedFeatEffects?.initiativeBonus || 0;
    const breakdown: GenericBreakdownItem[] = [];
    breakdown.push({ label: (UI_STRINGS.rollDialogAbilityModifierLabel || "Ability Modifier ({abilityAbbr})").replace("{abilityAbbr}", ABILITY_LABELS.find(l => l.id === 'dexterity')?.abbr || "DEX"), value: dexModifier });
    if(featBonus !== 0) breakdown.push({ label: UI_STRINGS.infoDialogFeatBonusLabel || "Feat Bonus", value: featBonus });
    if(localInitiativeMiscModifier !== 0) breakdown.push({ label: UI_STRINGS.infoDialogCustomModifierLabel || "Misc Modifier", value: localInitiativeMiscModifier });

    onOpenRollDialog({
      dialogTitle: UI_STRINGS.rollDialogTitleInitiative || "Roll Initiative",
      rollType: 'initiative_check',
      baseModifier: baseInitiative,
      calculationBreakdown: breakdown,
      rerollTwentiesForChecks: rerollTwentiesForChecks,
    });
  }, [onOpenRollDialog, baseInitiative, rerollTwentiesForChecks, UI_STRINGS, ABILITY_LABELS, dexModifier, aggregatedFeatEffects?.initiativeBonus, localInitiativeMiscModifier]);

  const handleGrappleRoll = React.useCallback(() => {
    if (!UI_STRINGS || !SIZES || !DND_CLASSES || !ABILITY_LABELS || !aggregatedFeatEffects) return;
    const baseBab = getBab(classes || [], DND_CLASSES)[0] || 0;
    const sizeMod = getSizeModifierGrapple(size, SIZES);
    const featBonus = aggregatedFeatEffects.attackRollBonuses?.filter(b => b.appliesTo === 'grapple' && b.isActive).reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0) || 0;

    const breakdown: GenericBreakdownItem[] = [];
    breakdown.push({ label: UI_STRINGS.combatPanelBabLabel || "Base Attack Bonus", value: baseBab });
    breakdown.push({ label: (UI_STRINGS.rollDialogAbilityModifierLabel || "Ability Modifier ({abilityAbbr})").replace("{abilityAbbr}", ABILITY_LABELS.find(l => l.id === 'strength')?.abbr || "STR"), value: strModifier });
    breakdown.push({ label: UI_STRINGS.infoDialogSizeModifierLabel || "Size Modifier", value: sizeMod });
    if(featBonus !== 0) breakdown.push({ label: UI_STRINGS.infoDialogFeatBonusLabel || "Feat Bonus", value: featBonus });
    if(localGrappleMiscModifier !== 0) breakdown.push({ label: UI_STRINGS.infoDialogCustomModifierLabel || "Misc Modifier", value: localGrappleMiscModifier });

    onOpenRollDialog({
      dialogTitle: UI_STRINGS.rollDialogTitleGrappleCheck || "Roll Grapple Check",
      rollType: 'grapple_check',
      baseModifier: totalGrappleModifier,
      calculationBreakdown: breakdown,
      rerollTwentiesForChecks: rerollTwentiesForChecks
    });
  }, [onOpenRollDialog, totalGrappleModifier, rerollTwentiesForChecks, UI_STRINGS, classes, DND_CLASSES, strModifier, size, SIZES, localGrappleMiscModifier, aggregatedFeatEffects, ABILITY_LABELS]);


  // Calculation logic for attacks
  const getWeaponEnhancementBonus = React.useCallback((itemDef?: ItemDefinition): { attack: number, damage: number } => {
    let attackBonus = 0;
    let damageBonus = 0;
    itemDef?.effects?.forEach(effect => {
        if (effect.type === 'attackRoll' && effect.bonusType === 'enhancement' && typeof effect.value === 'number') {
            attackBonus += effect.value;
        }
        if (effect.type === 'damageRoll' && effect.bonusType === 'enhancement' && typeof effect.value === 'number') {
            damageBonus += effect.value;
        }
    });
    return { attack: attackBonus, damage: damageBonus };
  }, []);

  const getActiveAttackBonuses = React.useCallback((weaponType: WeaponStyleType | 'unarmed', selectedWeaponDef?: ItemDefinition | null): number => {
    if (!aggregatedFeatEffects?.attackRollBonuses) return 0;
    let total = 0;
    aggregatedFeatEffects.attackRollBonuses.forEach(effect => {
      if (effect.isActive && typeof effect.value === 'number') {
        if (effect.appliesTo === 'all' || effect.appliesTo === weaponType) total += effect.value;
        else if (effect.weaponId && selectedWeaponDef?.definitionId === effect.weaponId) total += effect.value;
        else if (effect.appliesTo?.startsWith('weaponName:') && selectedWeaponDef?.label && getLocalizedString(selectedWeaponDef.label, currentLang, DEFAULT_LANGUAGE) === effect.appliesTo.substring('weaponName:'.length)) {
            total += effect.value;
        }
      }
    });
    return total;
  }, [aggregatedFeatEffects?.attackRollBonuses, currentLang]);

  const getActiveDamageBonuses = React.useCallback((weaponType: WeaponStyleType | 'unarmed', selectedWeaponDef?: ItemDefinition | null ): Array<DamageRollEffect & AggregatedFeatEffectBase> => {
    if (!aggregatedFeatEffects?.damageRollBonuses) return [];
    return aggregatedFeatEffects.damageRollBonuses.filter(effect => {
      if (!effect.isActive) return false;
      if (effect.appliesTo === 'all' || effect.appliesTo === weaponType) return true;
      if (effect.weaponId && selectedWeaponDef?.definitionId === effect.weaponId) return true;
      if (effect.appliesTo?.startsWith('weaponName:') && selectedWeaponDef?.label && getLocalizedString(selectedWeaponDef.label, currentLang, DEFAULT_LANGUAGE) === effect.appliesTo.substring('weaponName:'.length)) {
        return true;
      }
      return false;
    });
  }, [aggregatedFeatEffects?.damageRollBonuses, currentLang]);

  const calculateTotalAttackBonus = React.useCallback((weaponInstanceId: string, weaponType: 'melee' | 'ranged'): number => {
    if (!UI_STRINGS) return NaN;
    const weaponInstances = weaponType === 'melee' ? meleeWeaponInstances : rangedWeaponInstances;
    const weaponDef = weaponInstances.find(w => w.instanceId === weaponInstanceId)?.definition;
    const enhBonus = getWeaponEnhancementBonus(weaponDef);
    const featBonus = getActiveAttackBonuses(weaponType, weaponDef);
    const powerAttackPenalty = (weaponType === 'melee' && localPowerAttackValue) ? -localPowerAttackValue : 0;
    const combatExpertisePenalty = (weaponType === 'melee' && localCombatExpertiseValue) ? -localCombatExpertiseValue : 0;

    let abilityModForAttack = weaponType === 'melee' ? strModifier : dexModifier;
    if (weaponType === 'melee' && weaponDef?.isFinesseWeapon && dexModifier > strModifier) {
      abilityModForAttack = dexModifier;
    }

    return totalBabWithModifier[0] + abilityModForAttack + sizeModifierAttack + enhBonus.attack + featBonus + powerAttackPenalty + combatExpertisePenalty;
  }, [meleeWeaponInstances, rangedWeaponInstances, getWeaponEnhancementBonus, getActiveAttackBonuses, dexModifier, strModifier, totalBabWithModifier, sizeModifierAttack, localPowerAttackValue, localCombatExpertiseValue, UI_STRINGS]);

  const calculateTotalDamageBonus = React.useCallback((weaponInstanceId: string, weaponType: 'melee' | 'ranged'): number => {
      if (!UI_STRINGS) return NaN;
      const weaponInstances = weaponType === 'melee' ? meleeWeaponInstances : rangedWeaponInstances;
      const weaponDef = weaponInstances.find(w => w.instanceId === weaponInstanceId)?.definition;
      const enhBonus = getWeaponEnhancementBonus(weaponDef);
      const activeDamageBonuses = getActiveDamageBonuses(weaponType, weaponDef);
      const featBonus = activeDamageBonuses.filter(eff => typeof eff.value === 'number').reduce((sum, eff) => sum + (eff.value || 0), 0);
      const powerAttackBonus = (weaponType === 'melee' && localPowerAttackValue) ? localPowerAttackValue : 0;
      
      let abilityBonus = 0;
      if (weaponType === 'melee') {
          abilityBonus = strModifier;
      }

      return abilityBonus + enhBonus.damage + featBonus + powerAttackBonus;
  }, [meleeWeaponInstances, rangedWeaponInstances, getWeaponEnhancementBonus, getActiveDamageBonuses, strModifier, localPowerAttackValue, UI_STRINGS]);
  
  const handleOpenAttackBreakdown = React.useCallback((weaponInstanceId: string, weaponType: 'melee' | 'ranged') => {
    if (!UI_STRINGS || !ABILITY_LABELS) return;
    const weaponInstances = weaponType === 'melee' ? meleeWeaponInstances : rangedWeaponInstances;
    const weaponDef = weaponInstances.find(w => w.instanceId === weaponInstanceId)?.definition;
    if (!weaponDef && weaponInstanceId !== 'unarmed') return;

    const components: GenericBreakdownItem[] = [];
    const bab = totalBabWithModifier[0];
    const abilityMod = weaponType === 'melee' ? ((weaponDef?.isFinesseWeapon && dexModifier > strModifier) ? dexModifier : strModifier) : dexModifier;
    const abilityAbbr = ABILITY_LABELS.find(al => al.id === (weaponType === 'melee' ? (weaponDef?.isFinesseWeapon && dexModifier > strModifier ? 'dexterity' : 'strength') : 'dexterity'))?.abbr || 'MOD';
    const sizeMod = sizeModifierAttack;
    const enhBonus = getWeaponEnhancementBonus(weaponDef).attack;
    const featBonus = getActiveAttackBonuses(weaponType, weaponDef);
    const powerAttackPenalty = (weaponType === 'melee' && localPowerAttackValue) ? -localPowerAttackValue : 0;
    const combatExpertisePenalty = (weaponType === 'melee' && localCombatExpertiseValue) ? -localCombatExpertiseValue : 0;

    components.push({ label: UI_STRINGS.attacksPanelBabLabel, value: bab });
    components.push({ label: (UI_STRINGS.attacksPanelAbilityModLabel).replace("{abilityAbbr}", abilityAbbr), value: abilityMod });
    if(sizeMod !== 0) components.push({ label: UI_STRINGS.attacksPanelSizeModLabel, value: sizeMod });
    if(enhBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelWeaponEnhancementLabel, value: enhBonus });
    if(featBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelFeatBonusLabel, value: featBonus });
    if (powerAttackPenalty !== 0) components.push({ label: UI_STRINGS.powerAttackPenaltyLabel, value: powerAttackPenalty });
    if (combatExpertisePenalty !== 0) components.push({ label: UI_STRINGS.combatExpertisePenaltyLabel, value: combatExpertisePenalty });
    
    const total = bab + abilityMod + sizeMod + enhBonus + featBonus + powerAttackPenalty + combatExpertisePenalty;
    components.push({ label: UI_STRINGS.infoDialogTotalLabel, value: total, isBold: true });

    onOpenCombatStatInfoDialog({
      type: 'genericNumericalBreakdown',
      titleKey: weaponType === 'melee' ? 'infoDialogTitleMeleeAttackBreakdown' : 'infoDialogTitleRangedAttackBreakdown',
      subtitle: getLocalizedString(weaponDef?.label || {en: 'Unarmed', fr: 'À mains nues'}, currentLang, DEFAULT_LANGUAGE),
      components
    });
  }, [onOpenCombatStatInfoDialog, totalBabWithModifier, dexModifier, strModifier, sizeModifierAttack, getWeaponEnhancementBonus, getActiveAttackBonuses, localPowerAttackValue, localCombatExpertiseValue, meleeWeaponInstances, rangedWeaponInstances, UI_STRINGS, ABILITY_LABELS, currentLang]);

  const handleOpenDamageBreakdown = React.useCallback((weaponInstanceId: string, weaponType: 'melee' | 'ranged') => {
    if (!UI_STRINGS || !ABILITY_LABELS) return;
    const weaponInstances = weaponType === 'melee' ? meleeWeaponInstances : rangedWeaponInstances;
    const weaponDef = weaponInstances.find(w => w.instanceId === weaponInstanceId)?.definition;
    if (!weaponDef && weaponInstanceId !== 'unarmed') return;

    const components: GenericBreakdownItem[] = [];
    const baseDamage = weaponInstanceId === 'unarmed' ? (aggregatedFeatEffects?.modifiedMechanics?.unarmedDamage?.isActive && typeof aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value === 'string' ? aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value : (UI_STRINGS.unarmedDamageDefault)) : weaponDef?.damage;
    components.push({ label: UI_STRINGS.attacksPanelBaseWeaponDamageLabel, value: baseDamage || "N/A", isRawValue: true });

    const abilityMod = weaponType === 'melee' ? strModifier : 0; // Ranged typically doesn't add ability to damage unless specific feats
    const abilityAbbr = weaponType === 'melee' ? (ABILITY_LABELS.find(al => al.id === 'strength')?.abbr || 'STR') : '';
    if (abilityMod !== 0) components.push({ label: (UI_STRINGS.attacksPanelAbilityModLabel).replace("{abilityAbbr}", abilityAbbr), value: abilityMod });

    const enhBonus = getWeaponEnhancementBonus(weaponDef).damage;
    if(enhBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelWeaponEnhancementLabel, value: enhBonus });
    
    const activeDamageEffects = getActiveDamageBonuses(weaponType, weaponDef);
    activeDamageEffects.forEach(effect => {
        if(typeof effect.value === 'string' && effect.value.match(/\d*d\d+/)) {
            components.push({ label: getLocalizedString(effect.sourceFeat || {en: 'Bonus Damage', fr: 'Dégâts Bonus'}, currentLang), value: effect.value, isRawValue: true });
        } else if (typeof effect.value === 'number') {
            components.push({ label: getLocalizedString(effect.sourceFeat || {en: 'Bonus Damage', fr: 'Dégâts Bonus'}, currentLang), value: effect.value });
        }
    });
    
    const powerAttackBonus = (weaponType === 'melee' && localPowerAttackValue) ? localPowerAttackValue : 0;
    if (powerAttackBonus > 0) components.push({ label: UI_STRINGS.powerAttackDamageBonusLabel, value: powerAttackBonus });

    const totalNumericBonus = calculateTotalDamageBonus(weaponInstanceId, weaponType);
    components.push({ label: UI_STRINGS.infoDialogTotalNumericBonusLabel, value: totalNumericBonus, isBold: true });
    
    onOpenCombatStatInfoDialog({
      type: 'genericNumericalBreakdown',
      titleKey: weaponType === 'melee' ? 'infoDialogTitleMeleeDamageBreakdown' : 'infoDialogTitleRangedDamageBreakdown',
      subtitle: getLocalizedString(weaponDef?.label || {en: 'Unarmed', fr: 'À mains nues'}, currentLang, DEFAULT_LANGUAGE),
      components
    });
  }, [onOpenCombatStatInfoDialog, strModifier, getWeaponEnhancementBonus, getActiveDamageBonuses, localPowerAttackValue, meleeWeaponInstances, rangedWeaponInstances, UI_STRINGS, ABILITY_LABELS, calculateTotalDamageBonus, currentLang, aggregatedFeatEffects]);

  const handleRoll = React.useCallback((weaponInstanceId: string, weaponType: 'melee' | 'ranged', rollPurpose: 'attack' | 'damage') => {
    if (!UI_STRINGS || !ABILITY_LABELS) return;
    const weaponInstances = weaponType === 'melee' ? meleeWeaponInstances : rangedWeaponInstances;
    const weaponDef = weaponInstances.find(w => w.instanceId === weaponInstanceId)?.definition;
    if (!weaponDef && weaponInstanceId !== 'unarmed') return;

    const weaponName = getLocalizedString(weaponDef?.label || {en: 'Unarmed', fr: 'À mains nues'}, currentLang, DEFAULT_LANGUAGE);
    
    if (rollPurpose === 'attack') {
      const breakdown: GenericBreakdownItem[] = [];
      const totalBonus = calculateTotalAttackBonus(weaponInstanceId, weaponType);
      
      const bab = totalBabWithModifier[0];
      const abilityMod = weaponType === 'melee' ? ((weaponDef?.isFinesseWeapon && dexModifier > strModifier) ? dexModifier : strModifier) : dexModifier;
      const abilityAbbr = ABILITY_LABELS.find(al => al.id === (weaponType === 'melee' ? (weaponDef?.isFinesseWeapon && dexModifier > strModifier ? 'dexterity' : 'strength') : 'dexterity'))?.abbr || 'MOD';
      const sizeMod = sizeModifierAttack;
      const enhBonus = getWeaponEnhancementBonus(weaponDef).attack;
      const featBonus = getActiveAttackBonuses(weaponType, weaponDef);
      const powerAttackPenalty = (weaponType === 'melee' && localPowerAttackValue) ? -localPowerAttackValue : 0;
      const combatExpertisePenalty = (weaponType === 'melee' && localCombatExpertiseValue) ? -localCombatExpertiseValue : 0;

      breakdown.push({ label: UI_STRINGS.attacksPanelBabLabel, value: bab });
      breakdown.push({ label: (UI_STRINGS.attacksPanelAbilityModLabel).replace("{abilityAbbr}", abilityAbbr), value: abilityMod });
      if(sizeMod !== 0) breakdown.push({ label: UI_STRINGS.attacksPanelSizeModLabel, value: sizeMod });
      if(enhBonus !== 0) breakdown.push({ label: UI_STRINGS.attacksPanelWeaponEnhancementLabel, value: enhBonus });
      if(featBonus !== 0) breakdown.push({ label: UI_STRINGS.attacksPanelFeatBonusLabel, value: featBonus });
      if (powerAttackPenalty !== 0) breakdown.push({ label: UI_STRINGS.powerAttackPenaltyLabel, value: powerAttackPenalty });
      if (combatExpertisePenalty !== 0) breakdown.push({ label: UI_STRINGS.combatExpertisePenaltyLabel, value: combatExpertisePenalty });

      onOpenRollDialog({
        dialogTitle: UI_STRINGS.rollDialogTitleMeleeAttackFormat,
        dialogSubtitle: weaponName,
        rollType: `${weaponType}_attack`,
        baseModifier: totalBonus,
        calculationBreakdown: breakdown,
        rerollTwentiesForChecks: rerollTwentiesForChecks
      });
    } else { // damage roll
      const baseDamageDice = weaponInstanceId === 'unarmed' ? (aggregatedFeatEffects?.modifiedMechanics?.unarmedDamage?.isActive && typeof aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value === 'string' ? aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value : (UI_STRINGS.unarmedDamageDefault || "1d3")) : (weaponDef?.damage || '');
      const critMultiplier = weaponDef?.criticalMultiplier ? parseInt(weaponDef.criticalMultiplier.replace(/[x×]/, ''), 10) : 2;

      const breakdown: GenericBreakdownItem[] = [];
      const activeDamageEffects = getActiveDamageBonuses(weaponType, weaponDef);
      
      const abilityMod = weaponType === 'melee' ? strModifier : 0;
      const abilityAbbr = weaponType === 'melee' ? (ABILITY_LABELS.find(al => al.id === 'strength')?.abbr || 'STR') : '';
      if (abilityMod !== 0) breakdown.push({ label: (UI_STRINGS.attacksPanelAbilityModLabel).replace("{abilityAbbr}", abilityAbbr), value: abilityMod });

      const enhBonus = getWeaponEnhancementBonus(weaponDef).damage;
      if(enhBonus !== 0) breakdown.push({ label: UI_STRINGS.attacksPanelWeaponEnhancementLabel, value: enhBonus });
      
      activeDamageEffects.forEach(effect => {
        if(typeof effect.value === 'string' && effect.value.match(/\d*d\d+/)) {
            breakdown.push({ label: getLocalizedString(effect.sourceFeat || {en: 'Bonus Damage', fr: 'Dégâts Bonus'}, currentLang), value: effect.value, isRawValue: true });
        } else if (typeof effect.value === 'number') {
            breakdown.push({ label: getLocalizedString(effect.sourceFeat || {en: 'Bonus Damage', fr: 'Dégâts Bonus'}, currentLang), value: effect.value });
        }
      });
      
      const powerAttackBonus = (weaponType === 'melee' && localPowerAttackValue) ? localPowerAttackValue : 0;
      if (powerAttackBonus > 0) breakdown.push({ label: UI_STRINGS.powerAttackDamageBonusLabel, value: powerAttackBonus });

      const totalNumericBonus = calculateTotalDamageBonus(weaponInstanceId, weaponType);

      onOpenRollDialog({
        dialogTitle: UI_STRINGS.rollDialogTitleMeleeDamageFormat,
        dialogSubtitle: `${weaponName} (${baseDamageDice})`,
        rollType: 'damage',
        baseModifier: totalNumericBonus,
        calculationBreakdown: breakdown,
        weaponDamageDiceString: baseDamageDice,
        weaponCriticalMultiplier: critMultiplier
      });
    }
  }, [onOpenRollDialog, meleeWeaponInstances, rangedWeaponInstances, currentLang, UI_STRINGS, ABILITY_LABELS, calculateTotalAttackBonus, calculateTotalDamageBonus, rerollTwentiesForChecks, totalBabWithModifier, dexModifier, strModifier, sizeModifierAttack, getWeaponEnhancementBonus, getActiveDamageBonuses, localPowerAttackValue, localCombatExpertiseValue, aggregatedFeatEffects]);


  if (translationsLoading || !UI_STRINGS || !DND_CLASSES || !SIZES || !aggregatedFeatEffects) return null;

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
            <Card className={cn("p-3 border rounded-md bg-card flex flex-col items-center text-center shadow-sm", panelFieldVerticalGap)}>
              <CardTitle className={cn(textStyleCardTitle, "flex items-center justify-center", panelFieldHorizontalGap)}><Swords />{UI_STRINGS.combatPanelBabLabel}</CardTitle>
              <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                <p className={cn(textStyleValueBig, "text-accent")}>{totalBabWithModifier.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/')}</p>
                <Button type="button" variant="ghost" size="icon-xs" onClick={() => onOpenCombatStatInfoDialog({type: 'babBreakdown'})} disabled={panelIsLocked}><Info /></Button>
              </div>
            </Card>
            <Card className={cn("p-3 border rounded-md bg-card flex flex-col items-center text-center shadow-sm", panelFieldVerticalGap)}>
              <CardTitle className={cn(textStyleCardTitle, "flex items-center justify-center", panelFieldHorizontalGap)}><Activity />{UI_STRINGS.combatPanelInitiativeLabel}</CardTitle>
              <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                <p className={cn(textStyleValueBig, "text-accent")}>{baseInitiative >= 0 ? '+' : ''}{baseInitiative}</p>
                <Button type="button" variant="ghost" size="icon-xs" onClick={() => onOpenCombatStatInfoDialog({type: 'initiativeBreakdown'})} disabled={panelIsLocked}><Info /></Button>
                <Button type="button" variant="ghost" size="icon-xs" onClick={handleInitiativeRoll} disabled={panelIsLocked}><Dices /></Button>
              </div>
            </Card>
            <Card className={cn("p-3 border rounded-md bg-card flex flex-col items-center text-center shadow-sm", panelFieldVerticalGap)}>
              <CardTitle className={cn(textStyleCardTitle, "flex items-center justify-center", panelFieldHorizontalGap)}><Hand />{UI_STRINGS.combatPanelGrappleModifierLabel}</CardTitle>
              <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                <p className={cn(textStyleValueBig, "text-accent")}>{totalGrappleModifier >= 0 ? '+' : ''}{totalGrappleModifier}</p>
                <Button type="button" variant="ghost" size="icon-xs" onClick={() => onOpenCombatStatInfoDialog({ type: 'grappleModifierBreakdown' })} disabled={panelIsLocked}><Info /></Button>
                <Button type="button" variant="ghost" size="icon-xs" onClick={handleGrappleRoll} disabled={panelIsLocked}><Dices /></Button>
              </div>
            </Card>
          </div>
          
          <div className={cn("grid grid-cols-1 md:grid-cols-2", panelGridGap)}>
            <Card className={cn("flex flex-col")}>
              <CardHeader className={cn(panelContentPadding, "items-center", "text-center")}>
                <CardTitle className={cn(textStyleCardTitle, "flex items-center justify-center", panelFieldHorizontalGap)}><Hand />{UI_STRINGS.attacksPanelMeleeTitle}</CardTitle>
                <div className="text-center">
                  <Label className={textStyleLabel}>{UI_STRINGS.attacksPanelAttackBonusLabel}</Label>
                  <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                    <p className={cn(textStyleValueBig, "text-accent")}>
                      {renderModifierValue(calculateTotalAttackBonus(selectedMainHandMeleeWeaponInstanceId, 'melee'))}
                    </p>
                    <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleOpenAttackBreakdown(selectedMainHandMeleeWeaponInstanceId, 'melee')} disabled={panelIsLocked}><Info /></Button>
                    <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleRoll(selectedMainHandMeleeWeaponInstanceId, 'melee', 'attack')} disabled={panelIsLocked}><Dices /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className={cn("flex flex-col flex-grow", panelGridGap, panelContentPadding)}>
                <AttackCard
                  label={UI_STRINGS.attacksPanelMainHandMeleeWeaponLabel || "Main Hand"}
                  selectId="main-hand-melee-select"
                  weaponInstances={meleeWeaponInstances}
                  selectedWeaponInstanceId={selectedMainHandMeleeWeaponInstanceId}
                  onSelectedWeaponChange={setSelectedMainHandMeleeWeaponInstanceId}
                  damageBonus={calculateTotalDamageBonus(selectedMainHandMeleeWeaponInstanceId, 'melee')}
                  onOpenDamageBreakdown={() => handleOpenDamageBreakdown(selectedMainHandMeleeWeaponInstanceId, 'melee')}
                  onRollDamage={() => handleRoll(selectedMainHandMeleeWeaponInstanceId, 'melee', 'damage')}
                  isPanelLocked={panelIsLocked}
                  uiStrings={UI_STRINGS}
                  currentLang={currentLang}
                />
                <AttackCard
                  label={UI_STRINGS.attacksPanelOffHandMeleeWeaponLabel || "Off Hand"}
                  selectId="off-hand-melee-select"
                  weaponInstances={meleeWeaponInstances}
                  selectedWeaponInstanceId={selectedOffHandMeleeWeaponInstanceId}
                  onSelectedWeaponChange={setSelectedOffHandMeleeWeaponInstanceId}
                  damageBonus={calculateTotalDamageBonus(selectedOffHandMeleeWeaponInstanceId, 'melee')}
                  onOpenDamageBreakdown={() => handleOpenDamageBreakdown(selectedOffHandMeleeWeaponInstanceId, 'melee')}
                  onRollDamage={() => handleRoll(selectedOffHandMeleeWeaponInstanceId, 'melee', 'damage')}
                  isPanelLocked={panelIsLocked}
                  uiStrings={UI_STRINGS}
                  currentLang={currentLang}
                />
                  {(hasPowerAttackFeat || hasCombatExpertiseFeat) && !panelIsLocked && (
                    <div className={cn("grid grid-cols-2", panelGridGap)}>
                      {hasPowerAttackFeat && (
                        <div className={cn("flex flex-col items-center text-center", panelFieldVerticalGap)}>
                          <Label htmlFor="power-attack-value" className={cn(textStyleLabel, "flex items-center gap-1")}><Activity className="text-destructive/80"/>{UI_STRINGS.powerAttackValueLabel}</Label>
                          <p className={textStyleSubLabel}>{UI_STRINGS.powerAttackDescription}</p>
                          <div className={cn("flex justify-center", inputWidthStandard)}>
                            <Input id="power-attack-value" type="number" value={localPowerAttackValue} onChange={(e) => setLocalPowerAttackValue(parseInt(e.target.value, 10) || 0)} min={0} max={maxBabForSpinners > 0 ? maxBabForSpinners : 0} className={cn(textStyleInput)} />
                          </div>
                        </div>
                      )}
                      {hasCombatExpertiseFeat && (
                        <div className={cn("flex flex-col items-center text-center", panelFieldVerticalGap)}>
                          <Label htmlFor="combat-expertise-value" className={cn(textStyleLabel, "flex items-center gap-1")}><ShieldIcon className="text-blue-500/80"/>{UI_STRINGS.combatExpertiseValueLabel}</Label>
                          <p className={textStyleSubLabel}>{UI_STRINGS.combatExpertiseDescription}</p>
                          <div className={cn("flex justify-center", inputWidthStandard)}>
                            <Input id="combat-expertise-value" type="number" value={localCombatExpertiseValue} onChange={(e) => setLocalCombatExpertiseValue(parseInt(e.target.value, 10) || 0)} min={0} max={maxBabForSpinners > 0 ? maxBabForSpinners : 0} className={cn(textStyleInput)} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
              </CardContent>
            </Card>

            <Card className={cn("flex flex-col")}>
              <CardHeader className={cn(panelContentPadding, "items-center", "text-center")}>
                <CardTitle className={cn(textStyleCardTitle, "flex items-center justify-center", panelFieldHorizontalGap)}><ArrowRightLeft />{UI_STRINGS.attacksPanelRangedTitle}</CardTitle>
                <div className="text-center">
                  <Label className={textStyleLabel}>{UI_STRINGS.attacksPanelAttackBonusLabel}</Label>
                  <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                    <p className={cn(textStyleValueBig, "text-accent")}>
                      {selectedRangedWeaponInstanceId === 'none' ? '—' : renderModifierValue(calculateTotalAttackBonus(selectedRangedWeaponInstanceId, 'ranged'))}
                    </p>
                    <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleOpenAttackBreakdown(selectedRangedWeaponInstanceId, 'ranged')} disabled={panelIsLocked || selectedRangedWeaponInstanceId === 'none'}><Info /></Button>
                    <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleRoll(selectedRangedWeaponInstanceId, 'ranged', 'attack')} disabled={panelIsLocked || selectedRangedWeaponInstanceId === 'none'}><Dices /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className={cn("flex flex-col flex-grow", panelGridGap, panelContentPadding)}>
                <AttackCard
                    label={UI_STRINGS.attacksPanelRangedWeaponLabel || "Ranged"}
                    selectId="ranged-weapon-select"
                    weaponInstances={rangedWeaponInstances}
                    selectedWeaponInstanceId={selectedRangedWeaponInstanceId}
                    onSelectedWeaponChange={setSelectedRangedWeaponInstanceId}
                    damageBonus={calculateTotalDamageBonus(selectedRangedWeaponInstanceId, 'ranged')}
                    onOpenDamageBreakdown={() => handleOpenDamageBreakdown(selectedRangedWeaponInstanceId, 'ranged')}
                    onRollDamage={() => handleRoll(selectedRangedWeaponInstanceId, 'ranged', 'damage')}
                    isPanelLocked={panelIsLocked}
                    uiStrings={UI_STRINGS}
                    currentLang={currentLang}
                />
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
