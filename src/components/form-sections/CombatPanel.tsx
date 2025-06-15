
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
import { getLocalizedString } from '@/i18n/i18n-data';
import { DEFAULT_LANGUAGE, type LanguageCode } from '@/i18n/config';

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
  const { translations, isLoading: translationsLoading, language: currentLang } = useI18n();
  const { rerollTwentiesForChecks } = useDefinitionsStore(state => ({
    rerollTwentiesForChecks: state.rerollTwentiesForChecks,
  }));

  const [selectedMeleeWeaponInstanceId, setSelectedMeleeWeaponInstanceId] = React.useState<string>('unarmed');
  const [selectedRangedWeaponInstanceId, setSelectedRangedWeaponInstanceId] = React.useState<string>('none');


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
    weaponType: 'melee' | 'ranged' | 'unarmed',
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
    weaponType: 'melee' | 'ranged' | 'unarmed',
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
  const handleGrappleDamageInfo = () => onOpenCombatStatInfoDialog({ type: 'grappleDamageBreakdown' });

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
  }, [UI_STRINGS, totalBabWithModifier, meleeAttackAbilityModForCalc, actualSizeModAttack, selectedMeleeWeaponInstanceId, selectedMeleeWeaponDefinition, getActiveAttackBonuses, localPowerAttackValue, localCombatExpertiseValue, ABILITY_LABELS, dexModifier, strModifier, getWeaponEnhancementBonus, currentLang]);

  const handleOpenMeleeAttackInfo = () => {
    const components = getMeleeAttackBonusBreakdownComponentsInternal();
    onOpenCombatStatInfoDialog({type: 'genericNumericalBreakdown', titleKey: 'infoDialogTitleMeleeAttackBreakdown', components});
  };

  const getMeleeDamageBonusBreakdownComponentsInternal = React.useCallback((): GenericBreakdownItem[] => {
    const components: GenericBreakdownItem[] = [];
    
    let baseDmg = selectedMeleeWeaponDefinition?.damage || (selectedMeleeWeaponInstanceId === 'unarmed' ? unarmedBaseDamageFromFeat : 'N/A');
    components.push({ label: UI_STRINGS.attacksPanelBaseWeaponDamageLabel || "Base Weapon Damage", value: baseDmg, isRawValue: true });

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
    onOpenCombatStatInfoDialog({type: 'genericNumericalBreakdown', titleKey: 'infoDialogTitleMeleeDamageBreakdown', components});
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
         components.push({label, value: effect.value});
    });
    const total = components.filter(c => typeof c.value === 'number').reduce((sum, comp) => sum + (comp.value as number), 0);
    components.push({ label: UI_STRINGS.infoDialogTotalLabel || "Total", value: total, isBold: true });
    return components;
  }, [UI_STRINGS, totalBabWithModifier, dexModifier, actualSizeModAttack, selectedRangedWeaponDefinition, getActiveAttackBonuses, ABILITY_LABELS, getWeaponEnhancementBonus, currentLang]);

  const handleOpenRangedAttackInfo = () => {
    const components = getRangedAttackBonusBreakdownComponentsInternal();
    onOpenCombatStatInfoDialog({type: 'genericNumericalBreakdown', titleKey: 'infoDialogTitleRangedAttackBreakdown', components});
  };

  const getRangedDamageBonusBreakdownComponentsInternal = React.useCallback((): GenericBreakdownItem[] => {
    if (!selectedRangedWeaponDefinition) return [{label: UI_STRINGS.attacksPanelNoRangedWeapons || "No Ranged Weapon", value: ""}];
    const components: GenericBreakdownItem[] = [];
    const baseDmg = selectedRangedWeaponDefinition.damage || 'N/A';
    components.push({ label: UI_STRINGS.attacksPanelBaseWeaponDamageLabel || "Base Weapon Damage", value: baseDmg, isRawValue: true });

    const weaponEnhancement = getWeaponEnhancementBonus(selectedRangedWeaponDefinition);
    if (weaponEnhancement.damage !== 0) {
        components.push({ label: UI_STRINGS.attacksPanelWeaponEnhancementLabel || "Weapon Enhancement", value: weaponEnhancement.damage});
    }

    let totalNumericBonusFromEffects = weaponEnhancement.damage; // Start with weapon enhancement
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
    onOpenCombatStatInfoDialog({type: 'genericNumericalBreakdown', titleKey: 'infoDialogTitleRangedDamageBreakdown', components});
  };

  const handleOpenInitiativeRoll = () => {
    const breakdown: GenericBreakdownItem[] = [
      { label: (UI_STRINGS.attacksPanelAbilityModLabel || "Ability Mod ({abilityAbbr})").replace("{abilityAbbr}", ABILITY_LABELS.find(al => al.id === 'dexterity')?.abbr || 'DEX'), value: dexModifier },
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
    });
  };

  const parseCritMultiplier = (critMultString: string | undefined): number => {
    if (!critMultString) return 1;
    const match = critMultString.toLowerCase().match(/x(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  };

  const handleOpenMeleeAttackRollDialog = () => {
    const weaponName = selectedMeleeWeaponDefinition?.label ? getLocalizedString(selectedMeleeWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : (UI_STRINGS.attacksPanelUnarmedOption || "Unarmed");
    const breakdown = getMeleeAttackBonusBreakdownComponentsInternal().filter(item => item.label !== (UI_STRINGS.infoDialogTotalLabel || "Total"));
    onOpenRollDialog({
      dialogTitle: (UI_STRINGS.rollDialogTitleMeleeAttackFormat || "Roll Melee Attack ({weaponName})").replace("{weaponName}", weaponName),
      rollType: `melee_attack_${selectedMeleeWeaponInstanceId}`,
      baseModifier: calculatedMeleeAttackBonus,
      calculationBreakdown: breakdown,
      rerollTwentiesForChecks: false, 
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
    });
  };

  const handleOpenMeleeDamageRollDialog = () => {
    const weaponDamageString = selectedMeleeWeaponInstanceId === 'unarmed' ? unarmedBaseDamageFromFeat : selectedMeleeWeaponDefinition?.damage || 'N/A';
    const critMultiplier = parseCritMultiplier(selectedMeleeWeaponDefinition?.criticalMultiplier);
    
    const weaponName = selectedMeleeWeaponDefinition?.label ? getLocalizedString(selectedMeleeWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : UI_STRINGS.attacksPanelUnarmedOption || "Unarmed";
    const breakdown = getMeleeDamageBonusBreakdownComponentsInternal().filter(item => item.label !== (UI_STRINGS.infoDialogTotalNumericBonusLabel || "Total Numeric Bonus"));
    
    onOpenRollDialog({
      dialogTitle: (UI_STRINGS.rollDialogTitleMeleeDamageFormat || "Melee Damage ({weaponName}: {dice})")
        .replace("{weaponName}", weaponName)
        .replace("{dice}", weaponDamageString),
      rollType: `damage_roll_melee_${selectedMeleeWeaponInstanceId}`,
      baseModifier: calculatedMeleeNumericalDamageBonus,
      calculationBreakdown: breakdown,
      weaponDamageDiceString: weaponDamageString,
      weaponCriticalMultiplier: critMultiplier,
      rerollTwentiesForChecks: false,
    });
  };

  const handleOpenRangedDamageRollDialog = () => {
    if (!selectedRangedWeaponDefinition) return;
    const weaponName = getLocalizedString(selectedRangedWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE);
    const weaponDamageString = selectedRangedWeaponDefinition.damage || 'N/A';
    const critMultiplier = parseCritMultiplier(selectedRangedWeaponDefinition.criticalMultiplier);
    const breakdown = getRangedDamageBonusBreakdownComponentsInternal().filter(item => item.label !== (UI_STRINGS.infoDialogTotalNumericBonusLabel || "Total Numeric Bonus"));

    onOpenRollDialog({
      dialogTitle: (UI_STRINGS.rollDialogTitleRangedDamageFormat || "Ranged Damage ({weaponName}: {dice})")
        .replace("{weaponName}", weaponName)
        .replace("{dice}", weaponDamageString),
      rollType: `damage_roll_ranged_${selectedRangedWeaponInstanceId}`,
      baseModifier: calculatedRangedNumericalDamageBonus,
      calculationBreakdown: breakdown,
      weaponDamageDiceString: weaponDamageString,
      weaponCriticalMultiplier: critMultiplier,
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
              <Select value={selectedMeleeWeaponInstanceId} onValueChange={setSelectedMeleeWeaponInstanceId}>
                <SelectTrigger id="melee-weapon-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {meleeWeaponInstances.map(wInst => <SelectItem key={wInst.instanceId} value={wInst.instanceId}>{getLocalizedString(wInst.definition.label, currentLang, DEFAULT_LANGUAGE)}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            {selectedMeleeWeaponDefinition && (
              <div className="p-2 border rounded-md bg-background text-xs space-y-0.5">
                <p><strong>{UI_STRINGS.attacksPanelWeaponDamageLabel || "Damage"}:</strong> {selectedMeleeWeaponInstanceId === 'unarmed' ? unarmedBaseDamageFromFeat : selectedMeleeWeaponDefinition.damage || 'N/A'}</p>
                <p><strong>{UI_STRINGS.attacksPanelWeaponCriticalLabel || "Critical"}:</strong> {selectedMeleeWeaponDefinition.criticalRange || 'N/A'} {selectedMeleeWeaponDefinition.criticalMultiplier || ''}</p>
                {selectedMeleeWeaponDefinition.damageType && <p><strong>{UI_STRINGS.attacksPanelWeaponDamageTypeLabel || "Type"}:</strong> {getLocalizedString(selectedMeleeWeaponDefinition.damageType, currentLang, DEFAULT_LANGUAGE)}</p>}
              </div>
            )}
            <div className="flex justify-around items-center mt-2">
              <div className="text-center">
                <Label className="text-xs font-medium block">{UI_STRINGS.attacksPanelAttackBonusLabel || "Attack Bonus"}</Label>
                <div className="flex items-center justify-center">
                    <p className="text-base font-bold text-accent">{calculatedMeleeAttackBonus >= 0 ? '+' : ''}{calculatedMeleeAttackBonus}</p>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-0.5 text-muted-foreground hover:text-foreground" onClick={handleOpenMeleeAttackInfo}><Info className="h-3.5 w-3.5" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-0.5 text-muted-foreground hover:text-primary" onClick={handleOpenMeleeAttackRollDialog} aria-label={(UI_STRINGS.rollDialogMeleeAttackAriaLabel || "Roll Melee Attack with {weaponName}").replace("{weaponName}", selectedMeleeWeaponDefinition?.label ? getLocalizedString(selectedMeleeWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : 'Unarmed')}><Dices className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="text-center">
                <Label className="text-xs font-medium block">{UI_STRINGS.attacksPanelDamageBonusLabel || "Damage Bonus"}</Label>
                <div className="flex items-center justify-center">
                  <p className="text-base font-bold text-accent">{renderModifierValue(calculatedMeleeNumericalDamageBonus)}</p>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={handleOpenMeleeDamageInfo}><Info className="h-3.5 w-3.5" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-0.5 text-muted-foreground hover:text-primary" onClick={handleOpenMeleeDamageRollDialog} disabled={!selectedMeleeWeaponDefinition && selectedMeleeWeaponInstanceId !== 'unarmed'} aria-label={(UI_STRINGS.rollDialogDamageAriaLabel || "Roll Damage for {weaponName}").replace("{weaponName}", selectedMeleeWeaponDefinition?.label ? getLocalizedString(selectedMeleeWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : UI_STRINGS.attacksPanelUnarmedOption || "Unarmed")}><Dices className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </div>
          </div>

          {/* Ranged Attacks Card */}
          <div className="p-3 border rounded-md bg-muted/20 space-y-3">
            <h4 className="text-lg font-semibold text-foreground/90 flex items-center"><ArrowRightLeft className="mr-2 h-5 w-5 text-primary/70"/>{UI_STRINGS.attacksPanelRangedTitle || "Ranged Attacks"}</h4>
            <div className="space-y-1">
              <Label htmlFor="ranged-weapon-select">{UI_STRINGS.attacksPanelRangedWeaponLabel || "Ranged Weapon"}</Label>
              <Select value={selectedRangedWeaponInstanceId} onValueChange={setSelectedRangedWeaponInstanceId} disabled={rangedWeaponInstances.length === 0}>
                <SelectTrigger id="ranged-weapon-select">
                  <SelectValue placeholder={rangedWeaponInstances.length === 0 ? (UI_STRINGS.attacksPanelNoRangedWeapons || "No ranged weapons") : (UI_STRINGS.attacksPanelSelectRangedWeapon || "Select ranged weapon...")} />
                </SelectTrigger>
                <SelectContent>
                   <SelectGroup>
                    {rangedWeaponInstances.length === 0 ?
                      <SelectItem value="none" disabled>{UI_STRINGS.attacksPanelNoRangedWeapons || "No ranged weapons"}</SelectItem>
                      :
                      rangedWeaponInstances.map(wInst => <SelectItem key={wInst.instanceId} value={wInst.instanceId}>{getLocalizedString(wInst.definition.label, currentLang, DEFAULT_LANGUAGE)}</SelectItem>)
                    }
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
             {selectedRangedWeaponDefinition && (
              <div className="p-2 border rounded-md bg-background text-xs space-y-0.5">
                <p><strong>{UI_STRINGS.attacksPanelWeaponDamageLabel || "Damage"}:</strong> {selectedRangedWeaponDefinition.damage || 'N/A'}</p>
                <p><strong>{UI_STRINGS.attacksPanelWeaponCriticalLabel || "Critical"}:</strong> {selectedRangedWeaponDefinition.criticalRange || 'N/A'} {selectedRangedWeaponDefinition.criticalMultiplier || ''}</p>
                {selectedRangedWeaponDefinition.rangeIncrement && <p><strong>{UI_STRINGS.attacksPanelWeaponRangeLabel || "Range"}:</strong> {selectedRangedWeaponDefinition.rangeIncrement} {UI_STRINGS.speedUnit || "ft."}</p>}
                {selectedRangedWeaponDefinition.damageType && <p><strong>{UI_STRINGS.attacksPanelWeaponDamageTypeLabel || "Type"}:</strong> {getLocalizedString(selectedRangedWeaponDefinition.damageType, currentLang, DEFAULT_LANGUAGE)}</p>}
              </div>
            )}
            <div className="flex justify-around items-center mt-2">
              <div className="text-center">
                <Label className="text-xs font-medium block">{UI_STRINGS.attacksPanelAttackBonusLabel || "Attack Bonus"}</Label>
                <div className="flex items-center justify-center">
                  <p className="text-base font-bold text-accent">{selectedRangedWeaponDefinition ? (calculatedRangedAttackBonus >= 0 ? '+' : '') + calculatedRangedAttackBonus : 'N/A'}</p>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-0.5 text-muted-foreground hover:text-foreground" onClick={handleOpenRangedAttackInfo} disabled={!selectedRangedWeaponDefinition}><Info className="h-3.5 w-3.5" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-0.5 text-muted-foreground hover:text-primary" onClick={handleOpenRangedAttackRollDialog} disabled={!selectedRangedWeaponDefinition} aria-label={(UI_STRINGS.rollDialogRangedAttackAriaLabel || "Roll Ranged Attack with {weaponName}").replace("{weaponName}", selectedRangedWeaponDefinition?.label ? getLocalizedString(selectedRangedWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : '')}><Dices className="h-3.5 w-3.5" /></Button>
                  </div>
              </div>
              <div className="text-center">
                <Label className="text-xs font-medium block">{UI_STRINGS.attacksPanelDamageBonusLabel || "Damage Bonus"}</Label>
                <div className="flex items-center justify-center">
                  <p className="text-base font-bold text-accent">{selectedRangedWeaponDefinition ? renderModifierValue(calculatedRangedNumericalDamageBonus) : 'N/A'}</p>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={handleOpenRangedDamageInfo} disabled={!selectedRangedWeaponDefinition}><Info className="h-3.5 w-3.5" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-0.5 text-muted-foreground hover:text-primary" onClick={handleOpenRangedDamageRollDialog} disabled={!selectedRangedWeaponDefinition} aria-label={(UI_STRINGS.rollDialogDamageAriaLabel || "Roll Damage for {weaponName}").replace("{weaponName}", selectedRangedWeaponDefinition?.label ? getLocalizedString(selectedRangedWeaponDefinition.label, currentLang, DEFAULT_LANGUAGE) : '')}><Dices className="h-3.5 w-3.5" /></Button>
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

    