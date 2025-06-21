
'use client';

import type { Character, AbilityScores, SavingThrows, CharacterClass, ResistanceValue, DamageReductionInstance, DamageReductionTypeValue, DamageReductionRuleValue, InfoDialogContentType, DetailedAbilityScores, AggregatedFeatEffects, SavingThrowType, ItemDefinition, ItemInstance, GearSlotId, WeaponStyleType } from '@/types/character';
import { SAVING_THROW_ABILITIES } from '@/lib/dnd-utils';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Swords, Heart, Zap as InitiativeIcon, ShieldAlert, Waves, Flame, Snowflake, Zap as ElectricityIcon, Atom, Sigma, Info, Brain, ShieldCheck, PlusCircle, Trash2, Loader2, Dices, Hand, ArrowRightLeft, Activity } from 'lucide-react';
import {
  getAbilityModifierByName,
  getBab,
  getBaseSaves,
  calculateInitiative,
  calculateGrapple,
  getSizeModifierAC,
  getSizeModifierGrapple,
  getUnarmedGrappleDamage,
  getSizeModifierAttack
} from '@/lib/dnd-utils';
import { Separator } from '../ui/separator';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Button } from '@/components/ui/button';
import *as React from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { getLocalizedString } from '@/i18n/i18n-data';
import { DEFAULT_LANGUAGE, type LanguageCode } from '@/i18n/config';
import { cn } from '@/lib/utils';
import { renderModifierValue } from '@/components/info-dialog-content/dialog-utils'; // Added

type ResistanceFieldKey = Exclude<keyof Pick<Character,
  'fireResistance' | 'coldResistance' | 'acidResistance' | 'electricityResistance' | 'sonicResistance' |
  'spellResistance' | 'powerResistance' | 'fortification'
>, 'damageReduction'>;

interface CombatStatsSectionProps {
  character: Character;
  detailedAbilityScores: DetailedAbilityScores | null;
  aggregatedFeatEffects: AggregatedFeatEffects | null;
  onCharacterUpdate: ( // This prop might be less relevant here if the sheet is display-only for these stats
    field: keyof Character |
           `savingThrows.${keyof SavingThrows}.${'base'|'magicMod'|'miscMod'}` |
           `${ResistanceFieldKey}.customMod` |
           'damageReduction',
    value: any
  ) => void;
  onOpenCombatStatInfoDialog: (contentType: InfoDialogContentType) => void;
}

export function CombatStatsSection({
  character,
  detailedAbilityScores,
  aggregatedFeatEffects,
  onCharacterUpdate,
  onOpenCombatStatInfoDialog
}: CombatStatsSectionProps) {
  const { translations, isLoading: i18nLoading, language: currentLang } = useI18n();
  const { toast } = useToast();

  const [selectedMeleeWeaponInstanceId, setSelectedMeleeWeaponInstanceId] = React.useState<string>('unarmed');
  const [selectedRangedWeaponInstanceId, setSelectedRangedWeaponInstanceId] = React.useState<string>('none');


  const allWeaponDefinitions = React.useMemo(() => {
    if (i18nLoading || !translations) return [];
    return translations.ITEM_DEFINITIONS_WEAPONS || [];
  }, [translations, i18nLoading]);

  const getWeaponDefinition = React.useCallback((definitionId: string | undefined): ItemDefinition | undefined => {
    if (!definitionId) return undefined;
    return allWeaponDefinitions.find(def => def.definitionId === definitionId);
  }, [allWeaponDefinitions]);

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

  React.useEffect(() => {
    // Set initial selected weapon for melee if main-hand is equipped
    const mainHandInstanceId = character.equippedGear?.['main-hand'];
    if (mainHandInstanceId) {
      const mainHandItem = character.inventory?.find(i => i.instanceId === mainHandInstanceId);
      const mainHandDef = getWeaponDefinition(mainHandItem?.definitionId);
      if (mainHandDef?.itemType === 'weapon' && (mainHandDef.weaponType === 'melee' || mainHandDef.weaponType === 'melee-or-ranged')) {
        setSelectedMeleeWeaponInstanceId(mainHandInstanceId);
      }
    } else {
       // Check if two-hand is equipped
      const twoHandInstanceId = character.equippedGear?.['two-hand'];
      if (twoHandInstanceId) {
        const twoHandItem = character.inventory?.find(i => i.instanceId === twoHandInstanceId);
        const twoHandDef = getWeaponDefinition(twoHandItem?.definitionId);
         if (twoHandDef?.itemType === 'weapon' && (twoHandDef.weaponType === 'melee' || twoHandDef.weaponType === 'melee-or-ranged')) {
           setSelectedMeleeWeaponInstanceId(twoHandInstanceId);
         }
      } else {
         setSelectedMeleeWeaponInstanceId('unarmed');
      }
    }

    // Set initial selected weapon for ranged (can be main or two-hand)
    let rangedEquipped = false;
    if (mainHandInstanceId) {
      const mainHandItem = character.inventory?.find(i => i.instanceId === mainHandInstanceId);
      const mainHandDef = getWeaponDefinition(mainHandItem?.definitionId);
      if (mainHandDef?.itemType === 'weapon' && (mainHandDef.weaponType === 'ranged' || mainHandDef.weaponType === 'melee-or-ranged')) {
        setSelectedRangedWeaponInstanceId(mainHandInstanceId);
        rangedEquipped = true;
      }
    }
    if (!rangedEquipped) {
      const twoHandInstanceId = character.equippedGear?.['two-hand'];
      if (twoHandInstanceId) {
        const twoHandItem = character.inventory?.find(i => i.instanceId === twoHandInstanceId);
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

  }, [character.equippedGear, character.inventory, getWeaponDefinition]);


  if (i18nLoading || !translations || !translations.UI_STRINGS || !translations.ABILITY_LABELS || !translations.SAVING_THROW_LABELS || !translations.DND_CLASSES || !translations.SIZES || !detailedAbilityScores || !aggregatedFeatEffects) {
    return (
      <div className="space-y-6">
        <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Loader2 className="h-6 w-6 animate-spin text-primary" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Loader2 className="h-6 w-6 animate-spin text-primary" /></CardContent></Card>
      </div>
    );
  }
  const { UI_STRINGS, DND_CLASSES, SIZES, ABILITY_LABELS, SAVING_THROW_LABELS, ITEM_DEFINITIONS_ARMOR, ITEM_DEFINITIONS_SHIELDS } = translations;

  const strModifier = detailedAbilityScores.strength.finalScore ? getAbilityModifierByName(detailedAbilityScores, 'strength') : 0;
  const dexModifier = detailedAbilityScores.dexterity.finalScore ? getAbilityModifierByName(detailedAbilityScores, 'dexterity') : 0;
  const conModifier = detailedAbilityScores.constitution.finalScore ? getAbilityModifierByName(detailedAbilityScores, 'constitution') : 0;
  const wisModifier = detailedAbilityScores.wisdom.finalScore ? getAbilityModifierByName(detailedAbilityScores, 'wisdom') : 0;

  const babArray = getBab(character.classes, DND_CLASSES);
  const totalBabWithModifier = babArray.map(bab => bab + (character.babMiscModifier || 0));

  const sizeModAC = getSizeModifierAC(character.size, SIZES);
  const sizeModGrapple = getSizeModifierGrapple(character.size, SIZES);
  const actualSizeModAttack = character.sizeModifierAttack ?? getSizeModifierAttack(character.size, SIZES);


  const initiativeFeatBonus = aggregatedFeatEffects.initiativeBonus || 0;
  const initiative = calculateInitiative(dexModifier, character.initiativeMiscModifier || 0) + initiativeFeatBonus;

  const grappleFeatBonus = aggregatedFeatEffects.attackRollBonuses?.filter(b => b.appliesTo === 'grapple' && b.isActive).reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0) || 0;
  const grappleBase = calculateGrapple(character.classes, strModifier, sizeModGrapple, DND_CLASSES);
  const grapple = grappleBase + (character.grappleMiscModifier || 0) + grappleFeatBonus;

  const baseSavesFromClass = getBaseSaves(character.classes, DND_CLASSES);
  const calculatedSaves = {
    fortitude: baseSavesFromClass.fortitude + conModifier + (character.savingThrows.fortitude.magicMod || 0) + (aggregatedFeatEffects.savingThrowBonuses.find(b => (b.save === 'fortitude' || b.save === 'all') && b.isActive)?.value || 0) + (character.savingThrows.fortitude.miscMod || 0),
    reflex: baseSavesFromClass.reflex + dexModifier + (character.savingThrows.reflex.magicMod || 0) + (aggregatedFeatEffects.savingThrowBonuses.find(b => (b.save === 'reflex' || b.save === 'all') && b.isActive)?.value || 0) + (character.savingThrows.reflex.miscMod || 0),
    will: baseSavesFromClass.will + wisModifier + (character.savingThrows.will.magicMod || 0) + (aggregatedFeatEffects.savingThrowBonuses.find(b => (b.save === 'will' || b.save === 'all') && b.isActive)?.value || 0) + (character.savingThrows.will.miscMod || 0),
  };

  const equippedArmorInstanceId = character.equippedGear?.['armor-body'];
  const equippedArmorInstance = equippedArmorInstanceId ? character.inventory.find(i => i.instanceId === equippedArmorInstanceId) : undefined;
  const equippedArmorDefinition = equippedArmorInstance ? ITEM_DEFINITIONS_ARMOR.find(def => def.definitionId === equippedArmorInstance.definitionId) : undefined;
  const physicalArmorBonus = equippedArmorDefinition?.armorBonus || 0;

  const equippedShieldInstanceId = character.equippedGear?.['shield'];
  const equippedShieldInstance = equippedShieldInstanceId ? character.inventory.find(i => i.instanceId === equippedShieldInstanceId) : undefined;
  const equippedShieldDefinition = equippedShieldInstance ? ITEM_DEFINITIONS_SHIELDS.find(def => def.definitionId === equippedShieldInstance.definitionId) : undefined;
  const physicalShieldBonus = equippedShieldDefinition?.shieldBonus || 0;

  const totalArmorBonusNormal = (character.armorBonus || 0) + physicalArmorBonus + (aggregatedFeatEffects.acBonuses.find(b => b.acType === 'armor' && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('normal')))?.value || 0);
  const totalShieldBonusNormal = (character.shieldBonus || 0) + physicalShieldBonus + (aggregatedFeatEffects.acBonuses.find(b => b.acType === 'shield' && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('normal')))?.value || 0);
  const totalNaturalArmorNormal = (character.naturalArmor || 0) + (aggregatedFeatEffects.acBonuses.find(b => b.acType === 'natural' && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('normal')))?.value || 0);
  const totalDeflectionBonusNormal = (character.deflectionBonus || 0) + (aggregatedFeatEffects.acBonuses.find(b => b.acType === 'deflection' && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('normal')))?.value || 0);
  const totalDodgeBonusNormal = (character.dodgeBonus || 0) + (aggregatedFeatEffects.acBonuses.filter(b => b.acType === 'dodge' && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('normal'))).reduce((sum, b) => sum + (b.value as number), 0) );
  const monkWisAcBonus = aggregatedFeatEffects.acBonuses.find(b => b.acType === 'monk_wisdom' && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('normal')))?.value === "WIS" ? Math.max(0, wisModifier) : 0;
  const monkScalingAcBonus = aggregatedFeatEffects.acBonuses.find(b => b.acType === 'monkScaling' && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('normal')))?.value || 0;
  const otherFeatAcBonusesNormal = aggregatedFeatEffects.acBonuses.filter(b => !['armor','shield','natural','deflection','dodge','monk_wisdom','monkScaling'].includes(b.acType) && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('normal'))).reduce((sum,b) => sum + (b.value as number),0);
  const normalAC = 10 + totalArmorBonusNormal + totalShieldBonusNormal + dexModifier + sizeModAC + totalNaturalArmorNormal + totalDeflectionBonusNormal + totalDodgeBonusNormal + monkWisAcBonus + (monkScalingAcBonus as number) + otherFeatAcBonusesNormal + (character.acMiscModifier || 0);

  // --- Weapon Calculation Logic (Adapted from CombatPanel) ---
  const inventoryWeapons = character.inventory?.filter(itemInst => {
    const itemDef = getWeaponDefinition(itemInst.definitionId);
    return itemDef?.itemType === 'weapon';
  }) || [];

  const meleeWeaponInstancesForSheet: Array<ItemInstance & { definition: ItemDefinition }> = [
    { instanceId: 'unarmed', definitionId: 'unarmed-placeholder', name: UI_STRINGS.attacksPanelUnarmedOption || 'Unarmed', itemType: 'weapon' as const, weaponType: 'melee' as const, damage: (aggregatedFeatEffects.modifiedMechanics?.unarmedDamage?.isActive && typeof aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value === 'string' ? aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value : (UI_STRINGS.unarmedDamageDefault || '1d3')), criticalRange: '20', criticalMultiplier: 'x2', quantity: 1, definition: { definitionId: 'unarmed-placeholder', label: { en: 'Unarmed Strike', fr: 'Frappe à mains nues'}, itemType: 'weapon', weaponType: 'melee', damage: (aggregatedFeatEffects.modifiedMechanics?.unarmedDamage?.isActive && typeof aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value === 'string' ? aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value : (UI_STRINGS.unarmedDamageDefault || '1d3')), criticalRange: '20', criticalMultiplier: 'x2'  } as ItemDefinition },
    ...inventoryWeapons.map(inst => ({ ...inst, definition: getWeaponDefinition(inst.definitionId)! })).filter(item => item.definition && (item.definition.weaponType === 'melee' || item.definition.weaponType === 'melee-or-ranged'))
  ];
  const rangedWeaponInstancesForSheet: Array<ItemInstance & { definition: ItemDefinition }> = inventoryWeapons
    .map(inst => ({ ...inst, definition: getWeaponDefinition(inst.definitionId)! }))
    .filter(item => item.definition && (item.definition.weaponType === 'ranged' || item.definition.weaponType === 'melee-or-ranged'));

  const currentMeleeWeaponInstance = meleeWeaponInstancesForSheet.find(w => w.instanceId === selectedMeleeWeaponInstanceId);
  const currentMeleeWeaponDefinition = currentMeleeWeaponInstance?.definition;

  const currentRangedWeaponInstance = rangedWeaponInstancesForSheet.find(w => w.instanceId === selectedRangedWeaponInstanceId);
  const currentRangedWeaponDefinition = currentRangedWeaponInstance?.definition;
  
  let meleeAbilityModForAttack = strModifier;
  if (currentMeleeWeaponDefinition?.isFinesseWeapon && dexModifier > strModifier) {
    meleeAbilityModForAttack = dexModifier;
  }

  const getActiveAttackBonusesForSheet = React.useCallback((weaponType: WeaponStyleType | 'unarmed', selectedWeaponDef?: ItemDefinition | null ): number => {
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
  
  const getActiveDamageBonusesForSheet = React.useCallback((weaponType: WeaponStyleType | 'unarmed', selectedWeaponDef?: ItemDefinition | null ): number => {
    if (!aggregatedFeatEffects?.damageRollBonuses) return 0;
    let total = 0;
    aggregatedFeatEffects.damageRollBonuses.forEach(effect => {
      if (effect.isActive && typeof effect.value === 'number') {
        if (effect.appliesTo === 'all' || effect.appliesTo === weaponType) total += effect.value;
        else if (effect.weaponId && selectedWeaponDef?.definitionId === effect.weaponId) total += effect.value;
         else if (effect.appliesTo?.startsWith('weaponName:') && selectedWeaponDef?.label && getLocalizedString(selectedWeaponDef.label, currentLang, DEFAULT_LANGUAGE) === effect.appliesTo.substring('weaponName:'.length)) {
            total += effect.value;
        }
      }
    });
    return total;
  }, [aggregatedFeatEffects?.damageRollBonuses, currentLang]);


  const meleeEnhBonus = getWeaponEnhancementBonus(currentMeleeWeaponDefinition);
  const meleeFeatAttackBonus = getActiveAttackBonusesForSheet(selectedMeleeWeaponInstanceId === 'unarmed' ? 'unarmed' : 'melee', currentMeleeWeaponDefinition);
  const meleeAttackBonusFinal = totalBabWithModifier[0] + meleeAbilityModForAttack + actualSizeModAttack + meleeEnhBonus.attack + meleeFeatAttackBonus - (character.powerAttackValue || 0) - (character.combatExpertiseValue || 0);

  const meleeFeatDamageBonus = getActiveDamageBonusesForSheet(selectedMeleeWeaponInstanceId === 'unarmed' ? 'unarmed' : 'melee', currentMeleeWeaponDefinition);
  const meleeNumericalDamageBonusFinal = (selectedMeleeWeaponInstanceId === 'unarmed' || currentMeleeWeaponDefinition?.weaponType === 'melee' || currentMeleeWeaponDefinition?.weaponType === 'melee-or-ranged' ? strModifier : 0) + meleeEnhBonus.damage + meleeFeatDamageBonus + (character.powerAttackValue || 0);


  const rangedEnhBonus = getWeaponEnhancementBonus(currentRangedWeaponDefinition);
  const rangedFeatAttackBonus = getActiveAttackBonusesForSheet('ranged', currentRangedWeaponDefinition);
  const rangedAttackBonusFinal = currentRangedWeaponDefinition ? totalBabWithModifier[0] + dexModifier + actualSizeModAttack + rangedEnhBonus.attack + rangedFeatAttackBonus : 0;

  const rangedFeatDamageBonus = getActiveDamageBonusesForSheet('ranged', currentRangedWeaponDefinition);
  const rangedNumericalDamageBonusFinal = currentRangedWeaponDefinition ? rangedEnhBonus.damage + rangedFeatDamageBonus : 0;
  // --- End Weapon Calculation Logic ---


  const handleOpenAttackBreakdown = (isMelee: boolean) => {
    const weaponDef = isMelee ? currentMeleeWeaponDefinition : currentRangedWeaponDefinition;
    const weaponInstId = isMelee ? selectedMeleeWeaponInstanceId : selectedRangedWeaponInstanceId;
    if (!weaponDef && (!isMelee || weaponInstId !== 'unarmed')) return;

    const components: GenericBreakdownItem[] = [];
    const bab = totalBabWithModifier[0];
    const abilityMod = isMelee ? meleeAbilityModForAttack : dexModifier;
    const abilityAbbr = ABILITY_LABELS.find(al => al.id === (isMelee ? (currentMeleeWeaponDefinition?.isFinesseWeapon && dexModifier > strModifier ? 'dexterity' : 'strength') : 'dexterity'))?.abbr || 'MOD';
    const sizeMod = actualSizeModAttack;
    const enhBonus = isMelee ? meleeEnhBonus.attack : rangedEnhBonus.attack;
    const featBonus = isMelee ? meleeFeatAttackBonus : rangedFeatAttackBonus;

    components.push({ label: UI_STRINGS.attacksPanelBabLabel || "BAB", value: bab });
    components.push({ label: (UI_STRINGS.attacksPanelAbilityModLabel || "Ability Mod ({abilityAbbr})").replace("{abilityAbbr}", abilityAbbr), value: abilityMod });
    if(sizeMod !== 0) components.push({ label: UI_STRINGS.attacksPanelSizeModLabel || "Size Mod", value: sizeMod });
    if(enhBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelWeaponEnhancementLabel || "Weapon Enhancement", value: enhBonus });
    if(featBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelFeatBonusLabel || "Feat Bonus", value: featBonus });
    if (isMelee && (character.powerAttackValue || 0) > 0) components.push({ label: UI_STRINGS.powerAttackPenaltyLabel || "Power Attack", value: -(character.powerAttackValue || 0) });
    if (isMelee && (character.combatExpertiseValue || 0) > 0) components.push({ label: UI_STRINGS.combatExpertisePenaltyLabel || "Combat Expertise", value: -(character.combatExpertiseValue || 0) });
    
    const total = bab + abilityMod + sizeMod + enhBonus + featBonus - (isMelee ? (character.powerAttackValue || 0) + (character.combatExpertiseValue || 0) : 0);
    components.push({ label: UI_STRINGS.infoDialogTotalLabel || "Total", value: total, isBold: true });

    onOpenCombatStatInfoDialog({
      type: 'genericNumericalBreakdown',
      titleKey: isMelee ? 'infoDialogTitleMeleeAttackBreakdown' : 'infoDialogTitleRangedAttackBreakdown',
      components
    });
  };

  const handleOpenDamageBreakdown = (isMelee: boolean) => {
    const weaponDef = isMelee ? currentMeleeWeaponDefinition : currentRangedWeaponDefinition;
    const weaponInstId = isMelee ? selectedMeleeWeaponInstanceId : selectedRangedWeaponInstanceId;
    if (!weaponDef && (!isMelee || weaponInstId !== 'unarmed')) return;

    const components: GenericBreakdownItem[] = [];
    const baseDamage = isMelee ? (weaponInstId === 'unarmed' ? (aggregatedFeatEffects.modifiedMechanics?.unarmedDamage?.isActive && typeof aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value === 'string' ? aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value : (UI_STRINGS.unarmedDamageDefault || '1d3')) : weaponDef?.damage) : weaponDef?.damage;
    components.push({ label: UI_STRINGS.attacksPanelBaseWeaponDamageLabel || "Base Damage", value: baseDamage || "N/A", isRawValue: true });

    const abilityMod = isMelee ? strModifier : 0; // Ranged typically doesn't add ability to damage unless specific feats
    const abilityAbbr = isMelee ? (ABILITY_LABELS.find(al => al.id === 'strength')?.abbr || 'STR') : '';
    if (abilityMod !== 0) components.push({ label: (UI_STRINGS.attacksPanelAbilityModLabel || "Ability Mod ({abilityAbbr})").replace("{abilityAbbr}", abilityAbbr), value: abilityMod });

    const enhBonus = isMelee ? meleeEnhBonus.damage : rangedEnhBonus.damage;
    if(enhBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelWeaponEnhancementLabel || "Weapon Enhancement", value: enhBonus });
    
    const featBonus = isMelee ? meleeFeatDamageBonus : rangedFeatDamageBonus;
    if(featBonus !== 0) components.push({ label: UI_STRINGS.attacksPanelFeatBonusLabel || "Feat Bonus", value: featBonus });

    if (isMelee && (character.powerAttackValue || 0) > 0) components.push({ label: UI_STRINGS.powerAttackDamageBonusLabel || "Power Attack Dmg", value: (character.powerAttackValue || 0) });

    const totalNumericBonus = (isMelee ? meleeNumericalDamageBonusFinal : rangedNumericalDamageBonusFinal) - (isMelee ? strModifier : 0) + abilityMod; // Recalculate total numeric part for display
    components.push({ label: UI_STRINGS.infoDialogTotalNumericBonusLabel || "Total Numeric Bonus", value: totalNumericBonus, isBold: true });
    
    onOpenCombatStatInfoDialog({
      type: 'genericNumericalBreakdown',
      titleKey: isMelee ? 'infoDialogTitleMeleeDamageBreakdown' : 'infoDialogTitleRangedDamageBreakdown',
      components
    });
  };


  return (
    <>
    <div className="space-y-6">
      {/* AC, Saves, HP (existing) */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <CardTitle className="font-serif">{UI_STRINGS.armorClassPanelTitle}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
             <div>
                <Label>{UI_STRINGS.armorClassNormalLabel}</Label>
                <div className="flex items-center justify-center">
                  <p className="text-3xl font-bold text-accent">{normalAC}</p>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={() => onOpenCombatStatInfoDialog({type: 'acBreakdown', acType: 'Normal'})}><Info className="h-4 w-4" /></Button>
                </div>
            </div>
            {/* ... Touch and Flat-Footed AC displays ... */}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
             <Activity className="h-6 w-6 text-primary" />
            <CardTitle className="font-serif">{UI_STRINGS.savingThrowsPanelTitle}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['fortitude', 'reflex', 'will'] as const).map(saveType => {
            const abilityKey = SAVING_THROW_ABILITIES[saveType];
            const abilityMod = getAbilityModifierByName(detailedAbilityScores, abilityKey);
            const saveLabel = SAVING_THROW_LABELS.find(stl => stl.id === saveType)?.label;
            if (!saveLabel) return null;
            return (
              <div key={saveType} className="p-3 border rounded-md bg-muted/20 text-center">
                <Label className="capitalize font-medium">{saveLabel}</Label>
                <div className="flex items-baseline justify-center">
                    <p className="text-3xl font-bold text-accent">{calculatedSaves[saveType] >= 0 ? '+' : ''}{calculatedSaves[saveType]}</p>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={() => onOpenCombatStatInfoDialog({ type: 'savingThrowBreakdown', saveType })}><Info className="h-4 w-4" /></Button>
                </div>
                 <p className="text-xs text-muted-foreground">
                    {UI_STRINGS.savingThrowsRowLabelBase}: {baseSavesFromClass[saveType]}, {UI_STRINGS.savingThrowsRowLabelAbilityModifier}: {renderModifierValue(abilityMod)}
                 </p>
              </div>
            );
          })}
        </CardContent>
      </Card>
       {/* End AC, Saves, HP */}


      {/* BAB, Initiative, Grapple (existing) */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Swords className="h-6 w-6 text-primary" />
            <CardTitle className="font-serif">{UI_STRINGS.combatPanelCombatVitalsTitle}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
                <Label>{UI_STRINGS.combatPanelBabLabel}</Label>
                <div className="flex items-center justify-center">
                    <p className="text-2xl font-bold text-accent">{totalBabWithModifier.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/')}</p>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={() => onOpenCombatStatInfoDialog({ type: 'babBreakdown' })}><Info className="h-4 w-4" /></Button>
                </div>
            </div>
            <div className="text-center">
                <Label>{UI_STRINGS.combatPanelInitiativeLabel}</Label>
                <div className="flex items-center justify-center">
                  <p className="text-2xl font-bold text-accent">{initiative >= 0 ? '+' : ''}{initiative}</p>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={() => onOpenCombatStatInfoDialog({ type: 'initiativeBreakdown' })}><Info className="h-4 w-4" /></Button>
                </div>
            </div>
            <div className="text-center">
                <Label>{UI_STRINGS.combatPanelGrappleModifierLabel}</Label>
                 <div className="flex items-center justify-center">
                    <p className="text-2xl font-bold text-accent">{grapple >= 0 ? '+' : ''}{grapple}</p>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={() => onOpenCombatStatInfoDialog({ type: 'grappleModifierBreakdown' })}><Info className="h-4 w-4" /></Button>
                 </div>
            </div>
           </div>
        </CardContent>
      </Card>
      {/* End BAB, Initiative, Grapple */}


      {/* Attack Sections */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
             <Hand className="h-6 w-6 text-primary" />
            <CardTitle className="font-serif">{UI_STRINGS.attacksPanelMeleeTitle || "Melee Attacks"}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="cs-melee-weapon-select">{UI_STRINGS.attacksPanelMeleeWeaponLabel || "Melee Weapon"}</Label>
            <Select value={selectedMeleeWeaponInstanceId} onValueChange={setSelectedMeleeWeaponInstanceId}>
              <SelectTrigger id="cs-melee-weapon-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {meleeWeaponInstancesForSheet.map(wInst => (
                    <SelectItem key={`cs-melee-${wInst.instanceId}`} value={wInst.instanceId}>
                      {getLocalizedString(wInst.definition.label, currentLang, DEFAULT_LANGUAGE)}
                      {wInst.instanceId !== 'unarmed' && ` (x${wInst.quantity})`}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          {currentMeleeWeaponDefinition && (
            <div className="p-2 border rounded-md bg-background text-xs space-y-0.5">
              <p><strong>{UI_STRINGS.attacksPanelWeaponDamageLabel || "Damage"}:</strong> {selectedMeleeWeaponInstanceId === 'unarmed' ? (aggregatedFeatEffects.modifiedMechanics?.unarmedDamage?.isActive && typeof aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value === 'string' ? aggregatedFeatEffects.modifiedMechanics.unarmedDamage.value : (UI_STRINGS.unarmedDamageDefault || '1d3')) : currentMeleeWeaponDefinition.damage || 'N/A'}</p>
              <p><strong>{UI_STRINGS.attacksPanelWeaponCriticalLabel || "Critical"}:</strong> {currentMeleeWeaponDefinition.criticalRange || 'N/A'} {currentMeleeWeaponDefinition.criticalMultiplier || ''}</p>
              {currentMeleeWeaponDefinition.damageType && <p><strong>{UI_STRINGS.attacksPanelWeaponDamageTypeLabel || "Type"}:</strong> {getLocalizedString(currentMeleeWeaponDefinition.damageType, currentLang, DEFAULT_LANGUAGE)}</p>}
            </div>
          )}
          <div className="flex justify-around items-center mt-2">
            <div className="text-center">
              <Label className="text-sm font-medium block">{UI_STRINGS.attacksPanelAttackBonusLabel || "Attack Bonus"}</Label>
              <div className="flex items-center justify-center">
                  <p className="text-xl font-bold text-accent">{meleeAttackBonusFinal >= 0 ? '+' : ''}{meleeAttackBonusFinal}</p>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-0.5 text-muted-foreground hover:text-foreground" onClick={() => handleOpenAttackBreakdown(true)}><Info className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="text-center">
              <Label className="text-sm font-medium block">{UI_STRINGS.attacksPanelDamageBonusLabel || "Damage Bonus"}</Label>
              <div className="flex items-center justify-center">
                <p className="text-xl font-bold text-accent">{renderModifierValue(meleeNumericalDamageBonusFinal)}</p>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={() => handleOpenDamageBreakdown(true)}><Info className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
             <ArrowRightLeft className="h-6 w-6 text-primary" />
            <CardTitle className="font-serif">{UI_STRINGS.attacksPanelRangedTitle || "Ranged Attacks"}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="cs-ranged-weapon-select">{UI_STRINGS.attacksPanelRangedWeaponLabel || "Ranged Weapon"}</Label>
            <Select value={selectedRangedWeaponInstanceId} onValueChange={setSelectedRangedWeaponInstanceId} disabled={rangedWeaponInstancesForSheet.length === 0}>
              <SelectTrigger id="cs-ranged-weapon-select">
                <SelectValue placeholder={rangedWeaponInstancesForSheet.length === 0 ? (UI_STRINGS.attacksPanelNoRangedWeapons || "No ranged weapons") : (UI_STRINGS.attacksPanelSelectRangedWeapon || "Select ranged weapon...")} />
              </SelectTrigger>
              <SelectContent>
                 <SelectGroup>
                  {rangedWeaponInstancesForSheet.length === 0 ?
                    <SelectItem value="none" disabled>{UI_STRINGS.attacksPanelNoRangedWeapons || "No ranged weapons"}</SelectItem>
                    :
                    rangedWeaponInstancesForSheet.map(wInst => <SelectItem key={`cs-ranged-${wInst.instanceId}`} value={wInst.instanceId}>{getLocalizedString(wInst.definition.label, currentLang, DEFAULT_LANGUAGE)} (x{wInst.quantity})</SelectItem>)
                  }
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
           {currentRangedWeaponDefinition && (
            <div className="p-2 border rounded-md bg-background text-xs space-y-0.5">
              <p><strong>{UI_STRINGS.attacksPanelWeaponDamageLabel || "Damage"}:</strong> {currentRangedWeaponDefinition.damage || 'N/A'}</p>
              <p><strong>{UI_STRINGS.attacksPanelWeaponCriticalLabel || "Critical"}:</strong> {currentRangedWeaponDefinition.criticalRange || 'N/A'} {currentRangedWeaponDefinition.criticalMultiplier || ''}</p>
              {currentRangedWeaponDefinition.rangeIncrement && <p><strong>{UI_STRINGS.attacksPanelWeaponRangeLabel || "Range"}:</strong> {currentRangedWeaponDefinition.rangeIncrement} {UI_STRINGS.speedUnit || "ft."}</p>}
              {currentRangedWeaponDefinition.damageType && <p><strong>{UI_STRINGS.attacksPanelWeaponDamageTypeLabel || "Type"}:</strong> {getLocalizedString(currentRangedWeaponDefinition.damageType, currentLang, DEFAULT_LANGUAGE)}</p>}
            </div>
          )}
          <div className="flex justify-around items-center mt-2">
            <div className="text-center">
              <Label className="text-sm font-medium block">{UI_STRINGS.attacksPanelAttackBonusLabel || "Attack Bonus"}</Label>
              <div className="flex items-center justify-center">
                <p className="text-xl font-bold text-accent">{currentRangedWeaponDefinition ? (rangedAttackBonusFinal >= 0 ? '+' : '') + rangedAttackBonusFinal : 'N/A'}</p>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-0.5 text-muted-foreground hover:text-foreground" onClick={() => handleOpenAttackBreakdown(false)} disabled={!currentRangedWeaponDefinition}><Info className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="text-center">
              <Label className="text-sm font-medium block">{UI_STRINGS.attacksPanelDamageBonusLabel || "Damage Bonus"}</Label>
              <div className="flex items-center justify-center">
                <p className="text-xl font-bold text-accent">{currentRangedWeaponDefinition ? renderModifierValue(rangedNumericalDamageBonusFinal) : 'N/A'}</p>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={() => handleOpenDamageBreakdown(false)} disabled={!currentRangedWeaponDefinition}><Info className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* End Attack Sections */}

    </div>
    </>
  );
}
