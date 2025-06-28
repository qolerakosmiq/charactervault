
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
  panelHeaderPadding
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

  const totalBabWithModifier = React.useMemo(() => {
    if (!combatData.classes || !translations) return [0];
    const babArray = getBab(combatData.classes, translations.DND_CLASSES);
    return babArray.map(bab => bab + (combatData.babMiscModifier || 0));
  }, [combatData.classes, combatData.babMiscModifier, translations]);

  const getWeaponDefinition = React.useCallback((definitionId: string | undefined): ItemDefinition | undefined => {
    if (!definitionId) return undefined;
    return allWeaponDefinitions.find(def => def.definitionId === definitionId);
  }, [allWeaponDefinitions]);

  React.useEffect(() => {
    const mainHandInstanceId = combatData.equippedGear?.['main-hand'];
    if (mainHandInstanceId) {
      const mainHandItem = combatData.inventory?.find(i => i.instanceId === mainHandInstanceId);
      const mainHandDef = getWeaponDefinition(mainHandItem?.definitionId);
      if (mainHandDef?.itemType === 'weapon' && (mainHandDef.weaponType === 'melee' || mainHandDef.weaponType === 'melee-or-ranged')) {
        setSelectedMeleeWeaponInstanceId(mainHandInstanceId);
      }
    } else {
      const twoHandInstanceId = combatData.equippedGear?.['two-hand'];
      if (twoHandInstanceId) {
        const twoHandItem = combatData.inventory?.find(i => i.instanceId === twoHandInstanceId);
        const twoHandDef = getWeaponDefinition(twoHandItem?.definitionId);
        if (twoHandDef?.itemType === 'weapon' && (twoHandDef.weaponType === 'melee' || twoHandDef.weaponType === 'melee-or-ranged')) {
          setSelectedMeleeWeaponInstanceId(twoHandInstanceId);
        }
      } else {
        setSelectedMeleeWeaponInstanceId('unarmed');
      }
    }

    let rangedEquipped = false;
    if (mainHandInstanceId) {
      const mainHandItem = combatData.inventory?.find(i => i.instanceId === mainHandInstanceId);
      const mainHandDef = getWeaponDefinition(mainHandItem?.definitionId);
      if (mainHandDef?.itemType === 'weapon' && (mainHandDef.weaponType === 'ranged' || mainHandDef.weaponType === 'melee-or-ranged')) {
        setSelectedRangedWeaponInstanceId(mainHandInstanceId);
        rangedEquipped = true;
      }
    }
    if (!rangedEquipped) {
      const twoHandInstanceId = combatData.equippedGear?.['two-hand'];
      if (twoHandInstanceId) {
        const twoHandItem = combatData.inventory?.find(i => i.instanceId === twoHandInstanceId);
        const twoHandDef = getWeaponDefinition(twoHandItem?.definitionId);
        if (twoHandDef?.itemType === 'weapon' && (twoHandDef.weaponType === 'ranged' || twoHandDef.weaponType === 'melee-or-ranged')) {
          setSelectedRangedWeaponInstanceId(twoHandInstanceId);
          rangedEquipped = true;
        }
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

  const meleeWeaponInstances = React.useMemo(() => {
    if (!translations) return [];
    const inventoryWeapons = combatData.inventory?.filter(itemInst => {
        const itemDef = getWeaponDefinition(itemInst.definitionId);
        return itemDef?.itemType === 'weapon';
      }) || [];

    const unarmedDef = { definitionId: 'unarmed-placeholder', label: { en: 'Unarmed Strike', fr: 'Frappe à mains nues' }, itemType: 'weapon' as const, weaponType: 'melee' as const, damage: (aggregatedFeatEffects?.modifiedMechanics?.unarmedDamage?.isActive && typeof aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value === 'string' ? aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value : (translations.UI_STRINGS.unarmedDamageDefault)), criticalRange: '20', criticalMultiplier: 'x2' };

    return [
        { instanceId: 'unarmed', definitionId: 'unarmed-placeholder', name: getLocalizedString(unarmedDef.label, currentLang, DEFAULT_LANGUAGE), definition: unarmedDef as ItemDefinition },
        ...inventoryWeapons.map(inst => ({ ...inst, definition: getWeaponDefinition(inst.definitionId)! })).filter(item => item.definition && (item.definition.weaponType === 'melee' || item.definition.weaponType === 'melee-or-ranged'))
    ];
  }, [combatData.inventory, translations, getWeaponDefinition, currentLang, aggregatedFeatEffects?.modifiedMechanics?.unarmedDamage]);
  
  const rangedWeaponInstances = React.useMemo(() => {
    if (!combatData.inventory) return [];
    return combatData.inventory
      .map(inst => ({ ...inst, definition: getWeaponDefinition(inst.definitionId)! }))
      .filter(item => item.definition && (item.definition.weaponType === 'ranged' || item.definition.weaponType === 'melee-or-ranged'));
  }, [combatData.inventory, getWeaponDefinition]);


  const handleOpenAttackBreakdown = React.useCallback((isMelee: boolean) => {
    if (!translations || !combatData.abilityScores || !combatData.sizeModifierAttack) return;
    const { UI_STRINGS, ABILITY_LABELS } = translations;
    const weaponDef = isMelee ? getWeaponDefinition(meleeWeaponInstances.find(w => w.instanceId === selectedMeleeWeaponInstanceId)?.definitionId) : getWeaponDefinition(rangedWeaponInstances.find(w => w.instanceId === selectedRangedWeaponInstanceId)?.definitionId);
    const weaponInstId = isMelee ? selectedMeleeWeaponInstanceId : selectedRangedWeaponInstanceId;
    if (!weaponDef && (!isMelee || weaponInstId !== 'unarmed')) return;

    const components: GenericBreakdownItem[] = [];
    const bab = totalBabWithModifier[0];
    const strMod = getAbilityModifierByName(combatData.abilityScores, 'strength');
    const dexMod = getAbilityModifierByName(combatData.abilityScores, 'dexterity');
    const abilityMod = isMelee ? (weaponDef?.isFinesseWeapon && dexMod > strMod ? dexMod : strMod) : dexMod;
    const abilityAbbr = ABILITY_LABELS.find(al => al.id === (isMelee ? (weaponDef?.isFinesseWeapon && dexMod > strMod ? 'dexterity' : 'strength') : 'dexterity'))?.abbr || 'MOD';
    const sizeMod = combatData.sizeModifierAttack;
    const enhBonus = getWeaponEnhancementBonus(weaponDef).attack;
    const featBonus = getActiveAttackBonuses(isMelee ? 'melee' : 'ranged', weaponDef).reduce((sum, eff) => sum + (eff.value as number), 0);

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
  }, [translations, combatData, selectedMeleeWeaponInstanceId, selectedRangedWeaponInstanceId, totalBabWithModifier, getWeaponDefinition, getActiveAttackBonuses, getWeaponEnhancementBonus, onOpenCombatStatInfoDialog, meleeWeaponInstances, rangedWeaponInstances]);

  const handleOpenDamageBreakdown = React.useCallback((isMelee: boolean) => {
    if (!translations || !combatData.abilityScores || !aggregatedFeatEffects) return;
    const { UI_STRINGS } = translations;
    const weaponDef = isMelee ? getWeaponDefinition(meleeWeaponInstances.find(w => w.instanceId === selectedMeleeWeaponInstanceId)?.definitionId) : getWeaponDefinition(rangedWeaponInstances.find(w => w.instanceId === selectedRangedWeaponInstanceId)?.definitionId);
    const weaponInstId = isMelee ? selectedMeleeWeaponInstanceId : selectedRangedWeaponInstanceId;
    const unarmedDmg = aggregatedFeatEffects.modifiedMechanics?.unarmedDamage?.isActive && typeof aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value === 'string' ? aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value : (UI_STRINGS.unarmedDamageDefault);
    if (!weaponDef && (!isMelee || weaponInstId !== 'unarmed')) return;

    const components: GenericBreakdownItem[] = [];
    const baseDamage = isMelee ? (weaponInstId === 'unarmed' ? unarmedDmg : weaponDef?.damage) : weaponDef?.damage;
    components.push({ label: UI_STRINGS.attacksPanelBaseWeaponDamageLabel, value: baseDamage || "N/A", isRawValue: true });

    const strMod = getAbilityModifierByName(combatData.abilityScores, 'strength');
    const abilityMod = isMelee ? strMod : 0; // Ranged typically doesn't add ability to damage unless specific feats
    const abilityAbbr = isMelee ? (translations.ABILITY_LABELS.find(al => al.id === 'strength')?.abbr || 'STR') : '';
    if (abilityMod !== 0) components.push({ label: (UI_STRINGS.attacksPanelAbilityModLabel).replace("{abilityAbbr}", abilityAbbr), value: abilityMod });

    const enhBonus = getWeaponEnhancementBonus(weaponDef).damage;
    if (enhBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelWeaponEnhancementLabel, value: enhBonus });

    const featBonus = getActiveDamageBonuses(isMelee ? 'melee' : 'ranged', weaponDef).reduce((sum, eff) => sum + (typeof eff.value === 'number' ? eff.value : 0), 0);
    if (featBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelFeatBonusLabel, value: featBonus });

    if (isMelee && (combatData.powerAttackValue || 0) > 0) components.push({ label: UI_STRINGS.powerAttackDamageBonusLabel, value: (combatData.powerAttackValue || 0) });

    const totalNumericBonus = abilityMod + enhBonus + featBonus + (isMelee ? (combatData.powerAttackValue || 0) : 0);
    components.push({ label: UI_STRINGS.infoDialogTotalNumericBonusLabel, value: totalNumericBonus, isBold: true });
    
    onOpenCombatStatInfoDialog({ type: 'genericNumericalBreakdown', titleKey: isMelee ? 'infoDialogTitleMeleeDamageBreakdown' : 'infoDialogTitleRangedDamageBreakdown', components });
  }, [translations, combatData, selectedMeleeWeaponInstanceId, selectedRangedWeaponInstanceId, getWeaponDefinition, getActiveDamageBonuses, getWeaponEnhancementBonus, aggregatedFeatEffects, onOpenCombatStatInfoDialog, meleeWeaponInstances, rangedWeaponInstances]);
  
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
        const meleeWeaponInstance = meleeWeaponInstances.find(w => w.instanceId === selectedMeleeWeaponInstanceId);
        const meleeWeaponDef = meleeWeaponInstance?.definition;
        const meleeWeaponName = meleeWeaponDef ? getLocalizedString(meleeWeaponDef.label, currentLang, DEFAULT_LANGUAGE) : (UI_STRINGS.attacksPanelUnarmedOption || 'Unarmed');
        const meleeAbilityMod = meleeWeaponDef?.isFinesseWeapon && dexMod > strMod ? dexMod : strMod;
        baseModifier = calculateFinalAttackBonus(totalBabWithModifier[0], meleeAbilityMod, combatData.sizeModifierAttack || 0, 'melee', meleeWeaponDef, combatData.powerAttackValue, combatData.combatExpertiseValue);
        dialogTitle = (UI_STRINGS.rollDialogTitleMeleeAttackFormat || 'Melee Attack ({weaponName})').replace('{weaponName}', meleeWeaponName);
        handleOpenAttackBreakdown(true);
        return;

      case 'melee-damage':
        const meleeDmgWeaponInstance = meleeWeaponInstances.find(w => w.instanceId === selectedMeleeWeaponInstanceId);
        const meleeDmgWeaponDef = meleeDmgWeaponInstance?.definition;
        const meleeDmgWeaponName = meleeDmgWeaponDef ? getLocalizedString(meleeDmgWeaponDef.label, currentLang, DEFAULT_LANGUAGE) : (UI_STRINGS.attacksPanelUnarmedOption || 'Unarmed');
        const unarmedDmg = aggregatedFeatEffects.modifiedMechanics?.unarmedDamage?.isActive && typeof aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value === 'string' ? aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value : (UI_STRINGS.unarmedDamageDefault);
        weaponDamageDiceString = meleeDmgWeaponDef?.damage || unarmedDmg;
        weaponCriticalMultiplier = parseCritMultiplier(meleeDmgWeaponDef?.criticalMultiplier);
        dialogTitle = (UI_STRINGS.rollDialogTitleMeleeDamageFormat || 'Melee Damage ({weaponName}: {dice})').replace('{weaponName}', meleeDmgWeaponName).replace('{dice}', weaponDamageDiceString);
        baseModifier = calculateFinalNumericalDamageBonus(strMod, 'melee', meleeDmgWeaponDef, combatData.powerAttackValue);
        handleOpenDamageBreakdown(true);
        return;

      case 'ranged-attack':
        const rangedWeaponInstance = rangedWeaponInstances.find(w => w.instanceId === selectedRangedWeaponInstanceId);
        const rangedWeaponDef = rangedWeaponInstance?.definition;
        if (!rangedWeaponDef) return;
        const rangedWeaponName = getLocalizedString(rangedWeaponDef.label, currentLang, DEFAULT_LANGUAGE);
        dialogTitle = (UI_STRINGS.rollDialogTitleRangedAttackFormat || 'Ranged Attack ({weaponName})').replace('{weaponName}', rangedWeaponName);
        baseModifier = calculateFinalAttackBonus(totalBabWithModifier[0], dexMod, combatData.sizeModifierAttack || 0, 'ranged', rangedWeaponDef);
        handleOpenAttackBreakdown(false);
        return;

      case 'ranged-damage':
        const rangedDmgWeaponInstance = rangedWeaponInstances.find(w => w.instanceId === selectedRangedWeaponInstanceId);
        const rangedDmgWeaponDef = rangedDmgWeaponInstance?.definition;
        if (!rangedDmgWeaponDef) return;
        const rangedDmgWeaponName = getLocalizedString(rangedDmgWeaponDef.label, currentLang, DEFAULT_LANGUAGE);
        weaponDamageDiceString = rangedDmgWeaponDef?.damage || '';
        weaponCriticalMultiplier = parseCritMultiplier(rangedDmgWeaponDef?.criticalMultiplier);
        dialogTitle = (UI_STRINGS.rollDialogTitleRangedDamageFormat || 'Ranged Damage ({weaponName}: {dice})').replace('{weaponName}', rangedDmgWeaponName).replace('{dice}', weaponDamageDiceString);
        baseModifier = calculateFinalNumericalDamageBonus(0, 'ranged', rangedDmgWeaponDef);
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
    selectedMeleeWeaponInstanceId, selectedRangedWeaponInstanceId,
    totalBabWithModifier, meleeWeaponInstances, rangedWeaponInstances,
    calculateFinalAttackBonus, calculateFinalNumericalDamageBonus,
    handleOpenAttackBreakdown, handleOpenDamageBreakdown, getWeaponDefinition, parseCritMultiplier, currentLang
  ]);

  if (translationsLoading || !translations || !aggregatedFeatEffects) {
    return null;
  }

  const { UI_STRINGS, DND_CLASSES, SIZES, ABILITY_LABELS } = translations;
  
  const strModifier = getAbilityModifierByName(combatData.abilityScores, 'strength');
  const dexModifier = getAbilityModifierByName(combatData.abilityScores, 'dexterity');
  const baseInitiative = calculateInitiative(dexModifier, combatData.initiativeMiscModifier || 0) + (aggregatedFeatEffects.initiativeBonus || 0);
  const totalGrappleModifier = calculateGrapple(combatData.classes || [], strModifier, getSizeModifierGrapple(combatData.size, SIZES), DND_CLASSES) + (combatData.grappleMiscModifier || 0) + (aggregatedFeatEffects?.attackRollBonuses?.filter(b => b.appliesTo === 'grapple' && b.isActive).reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0) || 0);

  const selectedMeleeWeaponDefinition = getWeaponDefinition(meleeWeaponInstances.find(w => w.instanceId === selectedMeleeWeaponInstanceId)?.definitionId);
  const selectedRangedWeaponDefinition = getWeaponDefinition(rangedWeaponInstances.find(w => w.instanceId === selectedRangedWeaponInstanceId)?.definitionId);
  
  const meleeAbilityModForAttack = selectedMeleeWeaponDefinition?.isFinesseWeapon && dexModifier > strModifier ? dexModifier : strModifier;
  const calculatedMeleeAttackBonus = calculateFinalAttackBonus(totalBabWithModifier[0], meleeAbilityModForAttack, combatData.sizeModifierAttack || 0, 'melee', selectedMeleeWeaponDefinition, combatData.powerAttackValue, combatData.combatExpertiseValue);
  const calculatedMeleeNumericalDamageBonus = calculateFinalNumericalDamageBonus(strModifier, 'melee', selectedMeleeWeaponDefinition, combatData.powerAttackValue);
  
  const calculatedRangedAttackBonus = selectedRangedWeaponDefinition ? calculateFinalAttackBonus(totalBabWithModifier[0], dexModifier, combatData.sizeModifierAttack || 0, 'ranged', selectedRangedWeaponDefinition) : 0;
  const calculatedRangedNumericalDamageBonus = selectedRangedWeaponDefinition ? calculateFinalNumericalDamageBonus(0, 'ranged', selectedRangedWeaponDefinition) : 0;
  
  const characterFeats = combatData.feats;
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
                      disabled={panelIsLocked}
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
                  {baseInitiative >= 0 ? '+' : ''}{baseInitiative}
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
                      disabled={panelIsLocked}
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
                      {totalGrappleModifier >= 0 ? '+' : ''}{totalGrappleModifier}
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
                      disabled={panelIsLocked}
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
          <div className={cn("grid grid-cols-1 md:grid-cols-2", panelGridGap)}>
            <Card>
              <CardContent className={cn("flex flex-col", panelContentPadding, panelGridGap)}>
                <CardTitle className={cn(textStyleCardTitle, "flex items-center gap-2")}><Hand />{UI_STRINGS.attacksPanelMeleeTitle}</CardTitle>
                <div className={cn("grid grid-cols-2", panelGridGap)}>
                  <div className="text-center flex flex-col gap-1">
                    <Label className={textStyleLabel}>{UI_STRINGS.attacksPanelAttackBonusLabel}</Label>
                    <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                      <p className={cn(textStyleModifier, 'text-accent')}>{calculatedMeleeAttackBonus >= 0 ? '+' : ''}{calculatedMeleeAttackBonus}</p>
                      <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleOpenAttackBreakdown(true)}><Info /></Button>
                      <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleRollAction('melee-attack')} aria-label={(UI_STRINGS.rollDialogMeleeAttackAriaLabel || "Roll Melee Attack with {weaponName}").replace("{weaponName}", selectedMeleeWeaponDefinition?.label ? getLocalizedString(selectedMeleeWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : 'Unarmed')}><Dices /></Button>
                    </div>
                  </div>
                  <div className="text-center flex flex-col gap-1">
                    <Label className={textStyleLabel}>{UI_STRINGS.attacksPanelDamageBonusLabel}</Label>
                    <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                      <p className={cn(textStyleModifier, 'text-accent')}>{calculatedMeleeNumericalDamageBonus >= 0 ? '+' : ''}{calculatedMeleeNumericalDamageBonus}</p>
                      <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleOpenDamageBreakdown(true)}><Info /></Button>
                      <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleRollAction('melee-damage')} disabled={!selectedMeleeWeaponDefinition && selectedMeleeWeaponInstanceId !== 'unarmed'} aria-label={(UI_STRINGS.rollDialogDamageAriaLabel || "Roll Damage for {weaponName}").replace("{weaponName}", selectedMeleeWeaponDefinition?.label ? getLocalizedString(selectedMeleeWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : UI_STRINGS.attacksPanelUnarmedOption || "Unarmed")}><Dices /></Button>
                    </div>
                  </div>
                </div>
                <div className={cn("flex flex-col", panelFieldVerticalGap)}>
                  <Label htmlFor="melee-weapon-select" className={textStyleLabel}>{UI_STRINGS.attacksPanelMeleeWeaponLabel}</Label>
                  <Select value={selectedMeleeWeaponInstanceId} onValueChange={setSelectedMeleeWeaponInstanceId} disabled={panelIsLocked}>
                    <SelectTrigger id="melee-weapon-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {meleeWeaponInstances.map(wInst => <SelectItem key={wInst.instanceId} value={wInst.instanceId}>{wInst.name}</SelectItem>)}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <div className={cn("flex w-full items-center justify-between", panelFieldVerticalGap)}>
                    <DualBadge
                      color="primary"
                      leftLabel={UI_STRINGS.attacksPanelWeaponDamageLabel}
                      rightLabel={selectedMeleeWeaponInstanceId === 'unarmed' ? unarmedBaseDamageFromFeat : selectedMeleeWeaponDefinition?.damage || 'N/A'}
                      className={textStyleBadgeSmall}
                    />
                    <DualBadge
                      color="secondary"
                      leftLabel={(UI_STRINGS.attacksPanelCriticalOnLabel || "Critical on {range}").replace("{range}", selectedMeleeWeaponDefinition?.criticalRange || '20')}
                      rightLabel={selectedMeleeWeaponDefinition?.criticalMultiplier || 'x2'}
                      className={textStyleBadgeSmall}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className={cn("flex flex-col h-full", panelContentPadding, panelGridGap)}>
                <CardTitle className={cn(textStyleCardTitle, "flex items-center gap-2")}><ArrowRightLeft />{UI_STRINGS.attacksPanelRangedTitle}</CardTitle>
                <div className={cn("grid grid-cols-2", panelGridGap)}>
                  <div className="text-center flex flex-col gap-1">
                    <Label className={textStyleLabel}>{UI_STRINGS.attacksPanelAttackBonusLabel}</Label>
                    <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                      <p className={cn(textStyleModifier, !selectedRangedWeaponDefinition ? "text-muted-foreground" : 'text-accent')}>{selectedRangedWeaponDefinition ? `${calculatedRangedAttackBonus >= 0 ? '+' : ''}${calculatedRangedAttackBonus}` : 'N/A'}</p>
                      <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleOpenAttackBreakdown(false)} disabled={!selectedRangedWeaponDefinition}><Info /></Button>
                      <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleRollAction('ranged-attack')} disabled={!selectedRangedWeaponDefinition} aria-label={(UI_STRINGS.rollDialogRangedAttackAriaLabel || "Roll Ranged Attack with {weaponName}").replace("{weaponName}", selectedRangedWeaponDefinition?.label ? getLocalizedString(selectedRangedWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : '')}><Dices /></Button>
                    </div>
                  </div>
                  <div className="text-center flex flex-col gap-1">
                    <Label className={textStyleLabel}>{UI_STRINGS.attacksPanelDamageBonusLabel}</Label>
                    <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                      <p className={cn(textStyleModifier, !selectedRangedWeaponDefinition ? "text-muted-foreground" : 'text-accent')}>{selectedRangedWeaponDefinition ? `${calculatedRangedNumericalDamageBonus >= 0 ? '+' : ''}${calculatedRangedNumericalDamageBonus}` : 'N/A'}</p>
                      <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleOpenDamageBreakdown(false)} disabled={!selectedRangedWeaponDefinition}><Info /></Button>
                      <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleRollAction('ranged-damage')} disabled={!selectedRangedWeaponDefinition} aria-label={(UI_STRINGS.rollDialogDamageAriaLabel || "Roll Damage for {weaponName}").replace("{weaponName}", selectedRangedWeaponDefinition?.label ? getLocalizedString(selectedRangedWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : '')}><Dices /></Button>
                    </div>
                  </div>
                </div>
                <div className={cn("flex flex-col mt-auto", panelFieldVerticalGap)}>
                  <Label htmlFor="ranged-weapon-select" className={textStyleLabel}>{UI_STRINGS.attacksPanelRangedWeaponLabel}</Label>
                  <Select value={selectedRangedWeaponInstanceId} onValueChange={setSelectedRangedWeaponInstanceId} disabled={panelIsLocked || rangedWeaponInstances.length === 0}>
                    <SelectTrigger id="ranged-weapon-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="none">{UI_STRINGS.deityNoneOption}</SelectItem>
                        {rangedWeaponInstances.map((wInst) => (<SelectItem key={wInst.instanceId} value={wInst.instanceId}>{getLocalizedString(wInst.definition.label, currentLang, DEFAULT_LANGUAGE)}</SelectItem>))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {selectedRangedWeaponDefinition && (
                    <div className={cn("flex w-full items-center justify-between", panelFieldVerticalGap)}>
                      <DualBadge
                        color="primary"
                        leftLabel={UI_STRINGS.attacksPanelWeaponDamageLabel}
                        rightLabel={selectedRangedWeaponDefinition.damage || 'N/A'}
                        className={textStyleBadgeSmall}
                      />
                      <DualBadge
                        color="secondary"
                        leftLabel={(UI_STRINGS.attacksPanelCriticalOnLabel || "Critical on {range}").replace("{range}", selectedRangedWeaponDefinition.criticalRange || '20')}
                        rightLabel={selectedRangedWeaponDefinition.criticalMultiplier || 'x2'}
                        className={textStyleBadgeSmall}
                      />
                    </div>
                  )}
                </div>
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
