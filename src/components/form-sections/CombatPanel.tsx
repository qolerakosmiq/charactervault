
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
  WeaponStyleType
} from '@/types/character-core';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
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
      criticalRange: '20', criticalMultiplier: '×2'
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
  const getWeaponEnhancementBonus = React.useCallback((itemDef?: ItemDefinition): number => {
    let bonus = 0;
    itemDef?.effects?.forEach(effect => {
      if (effect.type === 'attackRoll' && effect.bonusType === 'enhancement' && typeof effect.value === 'number') {
        bonus += effect.value;
      }
    });
    return bonus;
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

  const meleeAttackBonusFinal = React.useMemo(() => {
    const mainHandWeaponDef = meleeWeaponInstances.find(w => w.instanceId === selectedMainHandMeleeWeaponInstanceId)?.definition;
    const abilityMod = (mainHandWeaponDef?.isFinesseWeapon && dexModifier > strModifier) ? dexModifier : strModifier;
    const enhancementBonus = getWeaponEnhancementBonus(mainHandWeaponDef);
    const featBonus = getActiveAttackBonuses('melee', mainHandWeaponDef);
    return totalBabWithModifier[0] + abilityMod + sizeModifierAttack + enhancementBonus + featBonus - (localPowerAttackValue || 0) - (localCombatExpertiseValue || 0);
  }, [selectedMainHandMeleeWeaponInstanceId, meleeWeaponInstances, dexModifier, strModifier, getWeaponEnhancementBonus, getActiveAttackBonuses, totalBabWithModifier, sizeModifierAttack, localPowerAttackValue, localCombatExpertiseValue]);
  
  const rangedAttackBonusFinal = React.useMemo(() => {
    const rangedWeaponDef = rangedWeaponInstances.find(w => w.instanceId === selectedRangedWeaponInstanceId)?.definition;
    if (!rangedWeaponDef) return 0;
    const enhancementBonus = getWeaponEnhancementBonus(rangedWeaponDef);
    const featBonus = getActiveAttackBonuses('ranged', rangedWeaponDef);
    return totalBabWithModifier[0] + dexModifier + sizeModifierAttack + enhancementBonus + featBonus;
  }, [selectedRangedWeaponInstanceId, rangedWeaponInstances, dexModifier, getWeaponEnhancementBonus, getActiveAttackBonuses, totalBabWithModifier, sizeModifierAttack]);


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
            <div className="flex flex-col items-center justify-center p-3 gap-1">
              <Label className={textStyleLabel}>{UI_STRINGS.combatPanelBabLabel}</Label>
              <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                <p className={cn(textStyleValueBig, "text-accent")}>{totalBabWithModifier.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/')}</p>
                <Button type="button" variant="ghost" size="icon-xs" onClick={() => onOpenCombatStatInfoDialog({type: 'babBreakdown'})} disabled={panelIsLocked}><Info /></Button>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center p-3 gap-1">
              <Label className={textStyleLabel}>{UI_STRINGS.combatPanelInitiativeLabel}</Label>
              <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                <p className={cn(textStyleValueBig, "text-accent")}>{baseInitiative >= 0 ? '+' : ''}{baseInitiative}</p>
                <Button type="button" variant="ghost" size="icon-xs" onClick={() => onOpenCombatStatInfoDialog({type: 'initiativeBreakdown'})} disabled={panelIsLocked}><Info /></Button>
                <Button type="button" variant="ghost" size="icon-xs" onClick={handleInitiativeRoll} disabled={panelIsLocked}><Dices /></Button>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center p-3 gap-1">
              <Label className={textStyleLabel}>{UI_STRINGS.combatPanelGrappleModifierLabel}</Label>
              <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                <p className={cn(textStyleValueBig, "text-accent")}>{totalGrappleModifier >= 0 ? '+' : ''}{totalGrappleModifier}</p>
                <Button type="button" variant="ghost" size="icon-xs" onClick={() => onOpenCombatStatInfoDialog({type: 'grappleModifierBreakdown'})} disabled={panelIsLocked}><Info /></Button>
                <Button type="button" variant="ghost" size="icon-xs" onClick={handleGrappleRoll} disabled={panelIsLocked}><Dices /></Button>
              </div>
            </div>
          </div>
          
          <div className={cn("grid grid-cols-1 md:grid-cols-2", panelGridGap)}>
            <Card className={cn("flex flex-col")}>
              <CardHeader className={cn(panelContentPadding)}>
                <CardTitle className={cn(textStyleCardTitle, "flex items-center gap-2")}><Hand />{UI_STRINGS.attacksPanelMeleeTitle}</CardTitle>
                 <div className="text-center flex flex-col gap-1 pt-2">
                    <Label className={textStyleLabel}>{UI_STRINGS.attacksPanelAttackBonusLabel}</Label>
                    <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                      <p className={cn(textStyleValueBig, "text-accent")}>{meleeAttackBonusFinal >= 0 ? '+' : ''}{meleeAttackBonusFinal}</p>
                      <Button type="button" variant="ghost" size="icon-xs" onClick={() => {}} disabled={panelIsLocked}><Info /></Button>
                      <Button type="button" variant="ghost" size="icon-xs" onClick={() => {}} disabled={panelIsLocked}><Dices /></Button>
                    </div>
                  </div>
              </CardHeader>
              <CardContent className={cn("flex flex-col flex-grow", panelGridGap, panelContentPadding, "pt-0")}>
                  
                  {(hasPowerAttackFeat || hasCombatExpertiseFeat) && !panelIsLocked && (
                    <div className={cn("grid grid-cols-2", panelGridGap)}>
                      {hasPowerAttackFeat && (
                        <div className="flex flex-col items-center text-center gap-1">
                          <Label htmlFor="power-attack-value" className={cn(textStyleLabel, "flex items-center gap-1")}><Activity className="text-destructive/80"/>{UI_STRINGS.powerAttackValueLabel}</Label>
                          <p className={textStyleSubLabel}>{UI_STRINGS.powerAttackDescription}</p>
                          <div className={cn("flex justify-center", inputWidthStandard)}>
                            <Input id="power-attack-value" type="number" value={localPowerAttackValue} onChange={(e) => setLocalPowerAttackValue(parseInt(e.target.value, 10) || 0)} min={0} max={maxBabForSpinners > 0 ? maxBabForSpinners : 0} className={cn(textStyleInput)} />
                          </div>
                        </div>
                      )}
                      {hasCombatExpertiseFeat && (
                        <div className="flex flex-col items-center text-center gap-1">
                          <Label htmlFor="combat-expertise-value" className={cn(textStyleLabel, "flex items-center gap-1")}><ShieldIcon className="text-blue-500/80"/>{UI_STRINGS.combatExpertiseValueLabel}</Label>
                          <p className={textStyleSubLabel}>{UI_STRINGS.combatExpertiseDescription}</p>
                          <div className={cn("flex justify-center", inputWidthStandard)}>
                            <Input id="combat-expertise-value" type="number" value={localCombatExpertiseValue} onChange={(e) => setLocalCombatExpertiseValue(parseInt(e.target.value, 10) || 0)} min={0} max={maxBabForSpinners > 0 ? maxBabForSpinners : 0} className={cn(textStyleInput)} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <AttackCard
                      label={UI_STRINGS.attacksPanelMainHandMeleeWeaponLabel || "Main Hand"}
                      selectId="main-hand-melee-select"
                      weaponInstances={meleeWeaponInstances}
                      selectedWeaponInstanceId={selectedMainHandMeleeWeaponInstanceId}
                      onSelectedWeaponChange={setSelectedMainHandMeleeWeaponInstanceId}
                      damageBonus={0} // Placeholder
                      onOpenDamageBreakdown={() => {}}
                      onRollDamage={() => {}}
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
                      damageBonus={0} // Placeholder
                      onOpenDamageBreakdown={() => {}}
                      onRollDamage={() => {}}
                      isPanelLocked={panelIsLocked}
                      uiStrings={UI_STRINGS}
                      currentLang={currentLang}
                  />
              </CardContent>
            </Card>

            <Card className={cn("flex flex-col")}>
              <CardHeader className={cn(panelContentPadding)}>
                <CardTitle className={cn(textStyleCardTitle, "flex items-center gap-2")}><ArrowRightLeft />{UI_STRINGS.attacksPanelRangedTitle}</CardTitle>
                <div className="text-center flex flex-col gap-1 pt-2">
                  <Label className={textStyleLabel}>{UI_STRINGS.attacksPanelAttackBonusLabel}</Label>
                  <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                    <p className={cn(textStyleValueBig, "text-accent")}>{rangedAttackBonusFinal >= 0 ? '+' : ''}{rangedAttackBonusFinal}</p>
                    <Button type="button" variant="ghost" size="icon-xs" onClick={() => {}} disabled={panelIsLocked}><Info /></Button>
                    <Button type="button" variant="ghost" size="icon-xs" onClick={() => {}} disabled={panelIsLocked}><Dices /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className={cn("flex flex-col flex-grow", panelGridGap, panelContentPadding, "pt-0")}>
                <AttackCard
                    label={UI_STRINGS.attacksPanelRangedWeaponLabel || "Ranged"}
                    selectId="ranged-weapon-select"
                    weaponInstances={rangedWeaponInstances}
                    selectedWeaponInstanceId={selectedRangedWeaponInstanceId}
                    onSelectedWeaponChange={setSelectedRangedWeaponInstanceId}
                    damageBonus={0} // Placeholder
                    onOpenDamageBreakdown={() => {}}
                    onRollDamage={() => {}}
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
