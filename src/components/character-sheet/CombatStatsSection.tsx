
'use client';

import type { Character, AbilityScores, SavingThrows, CharacterClass, ResistanceValue, DamageReductionInstance, DamageReductionTypeValue, DamageReductionRuleValue, InfoDialogContentType, DetailedAbilityScores, AggregatedFeatEffects, SavingThrowType } from '@/types/character';
import { SAVING_THROW_ABILITIES } from '@/types/character'; 
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Swords, Heart, Zap as InitiativeIcon, ShieldAlert, Waves, Flame, Snowflake, Zap as ElectricityIcon, Atom, Sigma, Info, Brain, ShieldCheck, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { 
  getAbilityModifierByName,
  getBab, 
  getBaseSaves, 
  calculateInitiative, 
  calculateGrapple, 
  getSizeModifierAC,
  getSizeModifierGrapple
} from '@/lib/dnd-utils';
import { Separator } from '../ui/separator';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Button } from '@/components/ui/button';
import *as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { getLocalizedString } from '@/i18n/i18n-data'; 
import { DEFAULT_LANGUAGE, type LanguageCode } from '@/i18n/config'; 

type ResistanceFieldKey = Exclude<keyof Pick<Character,
  'fireResistance' | 'coldResistance' | 'acidResistance' | 'electricityResistance' | 'sonicResistance' |
  'spellResistance' | 'powerResistance' | 'fortification'
>, 'damageReduction'>;

interface CombatStatsSectionProps {
  character: Character;
  detailedAbilityScores: DetailedAbilityScores | null; 
  aggregatedFeatEffects: AggregatedFeatEffects | null; 
  onCharacterUpdate: (
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
  const { translations, isLoading: i18nLoading } = useI18n();
  const { toast } = useToast();

  const [newDrValue, setNewDrValue] = React.useState(1);
  const [newDrType, setNewDrType] = React.useState<DamageReductionTypeValue | string>("none");
  const [newDrRule, setNewDrRule] = React.useState<DamageReductionRuleValue>('bypassed-by-type');

  React.useEffect(() => {
    if (translations && translations.DAMAGE_REDUCTION_TYPES && newDrRule !== 'bypassed-by-type' && newDrType === 'none') {
      const firstNonNoneType = translations.DAMAGE_REDUCTION_TYPES.find(t => t.id !== 'none')?.id || 'magic';
      setNewDrType(firstNonNoneType);
    }
  }, [newDrRule, newDrType, translations]);

  if (i18nLoading || !translations || !translations.UI_STRINGS || !translations.ABILITY_LABELS || !translations.SAVING_THROW_LABELS || !translations.DND_CLASSES || !translations.SIZES || !translations.DAMAGE_REDUCTION_TYPES || !translations.DAMAGE_REDUCTION_RULES_OPTIONS || !detailedAbilityScores || !aggregatedFeatEffects) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent><Loader2 className="h-6 w-6 animate-spin text-primary" /></CardContent>
        </Card>
         <Card>
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent><Loader2 className="h-6 w-6 animate-spin text-primary" /></CardContent>
        </Card>
      </div>
    );
  }
  const { UI_STRINGS, DND_CLASSES, SIZES, DAMAGE_REDUCTION_TYPES: DR_TYPES_DATA, DAMAGE_REDUCTION_RULES_OPTIONS: DR_RULES_DATA, ABILITY_LABELS, SAVING_THROW_LABELS } = translations;


  const strModifier = detailedAbilityScores.strength.finalScore ? getAbilityModifierByName(detailedAbilityScores, 'strength') : 0;
  const dexModifier = detailedAbilityScores.dexterity.finalScore ? getAbilityModifierByName(detailedAbilityScores, 'dexterity') : 0;
  const conModifier = detailedAbilityScores.constitution.finalScore ? getAbilityModifierByName(detailedAbilityScores, 'constitution') : 0;
  const wisModifier = detailedAbilityScores.wisdom.finalScore ? getAbilityModifierByName(detailedAbilityScores, 'wisdom') : 0;
  
  const babArray = getBab(character.classes, DND_CLASSES); 
  const totalBabWithModifier = babArray.map(bab => bab + (character.babMiscModifier || 0)); 

  const sizeModAC = getSizeModifierAC(character.size, SIZES);
  const sizeModGrapple = getSizeModifierGrapple(character.size, SIZES);

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

  const handleSavingThrowChange = (saveType: keyof SavingThrows, field: 'magicMod' | 'miscMod', value: number) => {
    onCharacterUpdate(`savingThrows.${saveType}.${field}`, value);
  };

  const energyResistancesFields: Array<{ field: ResistanceFieldKey; labelKey: keyof typeof UI_STRINGS; Icon: React.ElementType; fieldPrefix?: string }> = [
    { field: 'fireResistance', labelKey: 'resistanceLabelFire', Icon: Flame, fieldPrefix: 'sheet-res' },
    { field: 'coldResistance', labelKey: 'resistanceLabelCold', Icon: Snowflake, fieldPrefix: 'sheet-res' },
    { field: 'acidResistance', labelKey: 'resistanceLabelAcid', Icon: Atom, fieldPrefix: 'sheet-res' },
    { field: 'electricityResistance', labelKey: 'resistanceLabelElectricity', Icon: ElectricityIcon, fieldPrefix: 'sheet-res' },
    { field: 'sonicResistance', labelKey: 'resistanceLabelSonic', Icon: Waves, fieldPrefix: 'sheet-res' },
  ];

  const otherNumericResistancesFields: Array<{ field: ResistanceFieldKey; labelKey: keyof typeof UI_STRINGS; Icon: React.ElementType; unit?: string; fieldPrefix?: string }> = [
    { field: 'spellResistance', labelKey: 'resistanceLabelSpellResistance', Icon: Sigma, fieldPrefix: 'sheet-res' },
    { field: 'powerResistance', labelKey: 'resistanceLabelPowerResistance', Icon: Brain, fieldPrefix: 'sheet-res' },
    { field: 'fortification', labelKey: 'resistanceLabelFortification', Icon: ShieldCheck, unit: '%', fieldPrefix: 'sheet-res' },
  ];

  const handleOpenResistanceInfoDialog = (field: ResistanceFieldKey) => {
    onOpenCombatStatInfoDialog({ type: 'resistanceBreakdown', resistanceField: field });
  };
  
  const handleOpenAcBreakdownDialog = (acType: 'Normal' | 'Touch' | 'Flat-Footed') => {
    onOpenCombatStatInfoDialog({ type: 'acBreakdown', acType });
  };


  const handleAddDamageReduction = () => {
    if (newDrValue <= 0) {
      toast({ title: UI_STRINGS.toastInvalidDrValueTitle, description: UI_STRINGS.toastInvalidDrValueDesc, variant: "destructive"});
      return;
    }
     if (!newDrType) { 
        toast({ title: UI_STRINGS.toastDrTypeMissingTitle, description: UI_STRINGS.toastDrTypeMissingDesc, variant: "destructive"});
        return;
    }
    const ruleLabelForToast = DR_RULES_DATA.find(opt => opt.id === newDrRule)?.label || newDrRule;
    if ((newDrRule === 'excepted-by-type' || newDrRule === 'versus-specific-type') && newDrType === 'none') {
      toast({ title: UI_STRINGS.toastDrInvalidCombinationTitle, description: (UI_STRINGS.toastDrInvalidCombinationDesc).replace("{ruleLabel}", ruleLabelForToast), variant: "destructive"});
      return;
    }

    const existingUserDrOfTypeAndRule = character.damageReduction?.find(
      dr => !dr.isGranted && dr.type === newDrType && dr.rule === newDrRule
    );
    if (existingUserDrOfTypeAndRule) {
      toast({ title: UI_STRINGS.toastDrDuplicateEntryTitle, description: UI_STRINGS.toastDrDuplicateEntryDesc, variant: "destructive"});
      return;
    }

    const newInstance: DamageReductionInstance = {
      id: crypto.randomUUID(),
      value: newDrValue,
      type: newDrType,
      rule: newDrRule,
      isGranted: false,
    };
    onCharacterUpdate('damageReduction', [...(character.damageReduction || []), newInstance]);
    setNewDrValue(1);
    setNewDrType(DR_TYPES_DATA[0]?.id || "none"); 
    setNewDrRule(DR_RULES_DATA[0]?.id || 'bypassed-by-type'); 
  };

  const handleRemoveDamageReduction = (idToRemove: string) => {
    onCharacterUpdate('damageReduction', (character.damageReduction || []).filter(dr => dr.id !== idToRemove));
  };
  
  const getDrTypeUiLabel = (typeValue: DamageReductionTypeValue | string): string => {
    const drType = DR_TYPES_DATA.find(t => t.id === typeValue);
    if (!drType) throw new Error(`[DATA_ERROR] DR Type definition not found for ID: ${typeValue}`);
    return drType.label;
  };
  
  const getDrPrimaryNotation = (dr: DamageReductionInstance): string => {
    const typeLabel = getDrTypeUiLabel(dr.type);
    if (dr.rule === 'bypassed-by-type') {
      return dr.type === "none" ? `${dr.value}/—` : `${dr.value}/${typeLabel}`;
    }
    if (dr.rule === 'versus-specific-type') {
      return `${dr.value} ${UI_STRINGS.drVsLabel || "vs"} ${typeLabel}`;
    }
    if (dr.rule === 'excepted-by-type') {
       const noneTypeLabel = DR_TYPES_DATA.find(t => t.id === 'none')?.label;
       if (!noneTypeLabel) throw new Error("[DATA_ERROR] DR Type 'none' definition missing.");
       const displayType = typeLabel === noneTypeLabel ? "—" : typeLabel;
       return `${dr.value}/${displayType} ${UI_STRINGS.drImmunitySuffixLabel || "(Immunity)"}`;
    }
    const ruleDef = DR_RULES_DATA.find(opt => opt.id === dr.rule);
    if (!ruleDef) throw new Error(`[DATA_ERROR] DR Rule definition not found for ID: ${dr.rule}`);
    return `${dr.value}/${typeLabel} (${ruleDef.label})`;
  };
  
  const getDrRuleDescription = (dr: DamageReductionInstance): string => {
    const typeLabel = getDrTypeUiLabel(dr.type);
    const ruleDef = DR_RULES_DATA.find(opt => opt.id === dr.rule);
    if (!ruleDef) throw new Error(`[DATA_ERROR] DR Rule definition not found for ID: ${dr.rule}`);
    const value = dr.value;
    
    let descriptionKey: keyof typeof UI_STRINGS | undefined;

    if (dr.rule === 'bypassed-by-type') {
        descriptionKey = dr.type === "none" ? 'drBypassedByNoneDesc' : 'drBypassedByTypeDesc';
    } else if (dr.rule === 'versus-specific-type') {
        descriptionKey = 'drVersusSpecificTypeDesc';
    } else if (dr.rule === 'excepted-by-type') {
        descriptionKey = 'drExceptedByTypeDesc';
    }

    if (descriptionKey && UI_STRINGS[descriptionKey]) {
        return UI_STRINGS[descriptionKey].replace("{value}", String(value)).replace("{typeLabel}", typeLabel);
    }
    return `${UI_STRINGS.resistancesPanelDrRuleLabel}: ${ruleDef.label}`;
  };

  const totalArmorBonusNormal = (character.armorBonus || 0) + (aggregatedFeatEffects.acBonuses.find(b => b.acType === 'armor' && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('normal')))?.value || 0);
  const totalShieldBonusNormal = (character.shieldBonus || 0) + (aggregatedFeatEffects.acBonuses.find(b => b.acType === 'shield' && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('normal')))?.value || 0);
  const totalNaturalArmorNormal = (character.naturalArmor || 0) + (aggregatedFeatEffects.acBonuses.find(b => b.acType === 'natural' && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('normal')))?.value || 0);
  const totalDeflectionBonusNormal = (character.deflectionBonus || 0) + (aggregatedFeatEffects.acBonuses.find(b => b.acType === 'deflection' && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('normal')))?.value || 0);
  const totalDodgeBonusNormal = (character.dodgeBonus || 0) + (aggregatedFeatEffects.acBonuses.filter(b => b.acType === 'dodge' && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('normal'))).reduce((sum, b) => sum + (b.value as number), 0) );
  
  const monkWisAcBonus = aggregatedFeatEffects.acBonuses.find(b => b.acType === 'monk_wisdom' && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('normal')))?.value === "WIS" ? Math.max(0, wisModifier) : 0;
  const monkScalingAcBonus = aggregatedFeatEffects.acBonuses.find(b => b.acType === 'monkScaling' && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('normal')))?.value || 0;
  const otherFeatAcBonusesNormal = aggregatedFeatEffects.acBonuses.filter(b => !['armor','shield','natural','deflection','dodge','monk_wisdom','monkScaling'].includes(b.acType) && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('normal'))).reduce((sum,b) => sum + (b.value as number),0);

  const normalAC = 10 + totalArmorBonusNormal + totalShieldBonusNormal + dexModifier + sizeModAC + totalNaturalArmorNormal + totalDeflectionBonusNormal + totalDodgeBonusNormal + monkWisAcBonus + (monkScalingAcBonus as number) + otherFeatAcBonusesNormal + (character.acMiscModifier || 0);
  
  const totalDeflectionBonusTouch = (character.deflectionBonus || 0) + (aggregatedFeatEffects.acBonuses.find(b => b.acType === 'deflection' && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('touch')))?.value || 0);
  const totalDodgeBonusTouch = (character.dodgeBonus || 0) + (aggregatedFeatEffects.acBonuses.filter(b => b.acType === 'dodge' && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('touch'))).reduce((sum, b) => sum + (b.value as number), 0) );
  const monkWisAcBonusTouch = aggregatedFeatEffects.acBonuses.find(b => b.acType === 'monk_wisdom' && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('touch')))?.value === "WIS" ? Math.max(0, wisModifier) : 0;
  const monkScalingAcBonusTouch = aggregatedFeatEffects.acBonuses.find(b => b.acType === 'monkScaling' && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('touch')))?.value || 0;
  const otherFeatAcBonusesTouch = aggregatedFeatEffects.acBonuses.filter(b => !['armor','shield','natural','deflection','dodge','monk_wisdom','monkScaling'].includes(b.acType) && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('touch'))).reduce((sum,b) => sum + (b.value as number),0);
  const touchAC = 10 + dexModifier + sizeModAC + totalDeflectionBonusTouch + totalDodgeBonusTouch + monkWisAcBonusTouch + (monkScalingAcBonusTouch as number) + otherFeatAcBonusesTouch + (character.acMiscModifier || 0);
  
  const totalArmorBonusFlat = (character.armorBonus || 0) + (aggregatedFeatEffects.acBonuses.find(b => b.acType === 'armor' && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('flatFooted')))?.value || 0);
  const totalShieldBonusFlat = (character.shieldBonus || 0) + (aggregatedFeatEffects.acBonuses.find(b => b.acType === 'shield' && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('flatFooted')))?.value || 0);
  const totalNaturalArmorFlat = (character.naturalArmor || 0) + (aggregatedFeatEffects.acBonuses.find(b => b.acType === 'natural' && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('flatFooted')))?.value || 0);
  const totalDeflectionBonusFlat = (character.deflectionBonus || 0) + (aggregatedFeatEffects.acBonuses.find(b => b.acType === 'deflection' && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('flatFooted')))?.value || 0);
  const monkWisAcBonusFlat = aggregatedFeatEffects.acBonuses.find(b => b.acType === 'monk_wisdom' && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('flatFooted')))?.value === "WIS" ? Math.max(0, wisModifier) : 0;
  const monkScalingAcBonusFlat = aggregatedFeatEffects.acBonuses.find(b => b.acType === 'monkScaling' && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('flatFooted')))?.value || 0;
  const otherFeatAcBonusesFlat = aggregatedFeatEffects.acBonuses.filter(b => !['armor','shield','natural','deflection','dodge','monk_wisdom','monkScaling'].includes(b.acType) && b.isActive && (!b.appliesToScope || b.appliesToScope.includes('flatFooted'))).reduce((sum,b) => sum + (b.value as number),0);
  const flatFootedAC = 10 + totalArmorBonusFlat + totalShieldBonusFlat + sizeModAC + totalNaturalArmorFlat + totalDeflectionBonusFlat + monkWisAcBonusFlat + (monkScalingAcBonusFlat as number) + otherFeatAcBonusesFlat + (character.acMiscModifier || 0);


  return (
    <>
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Swords className="h-6 w-6 text-primary" />
            <CardTitle className="font-serif">{UI_STRINGS.combatPanelCombatVitalsTitle}</CardTitle>
          </div>
           <CardDescription>{UI_STRINGS.combatPanelCombatVitalsDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="hp">{UI_STRINGS.healthPanelCurrentHpLabel}</Label>
              <NumberSpinnerInput
                id="hp"
                value={character.hp}
                onChange={(newValue) => onCharacterUpdate('hp', newValue)}
                min={-999} 
                max={character.maxHp > 0 ? character.maxHp + 20 : 999} 
                inputClassName="w-24 h-10 text-lg"
                buttonClassName="h-10 w-10"
                buttonSize="icon"
              />
            </div>
            <div>
              <Label htmlFor="maxHp">{UI_STRINGS.healthPanelMaxHpLabel}</Label>
               <NumberSpinnerInput
                id="maxHp"
                value={character.maxHp}
                onChange={(newValue) => onCharacterUpdate('maxHp', newValue)}
                min={1}
                max={999}
                inputClassName="w-24 h-10 text-lg"
                buttonClassName="h-10 w-10"
                buttonSize="icon"
              />
            </div>
            <div className="text-center md:text-left">
              <Label>{UI_STRINGS.combatPanelInitiativeLabel}</Label>
              <p className="text-3xl font-bold text-accent">{initiative >= 0 ? '+' : ''}{initiative}</p>
              <div className="flex items-center justify-center md:justify-start gap-1 mt-1">
                <span className="text-xs text-muted-foreground">
                  {ABILITY_LABELS.find(al => al.id === 'dexterity')?.abbr || 'DEX'} ({dexModifier >= 0 ? '+' : ''}{dexModifier}) + {UI_STRINGS.miscLabelShort || "Misc"}:
                </span>
                <NumberSpinnerInput
                  value={character.initiativeMiscModifier || 0}
                  onChange={(newValue) => onCharacterUpdate('initiativeMiscModifier', newValue)}
                  min={-20} max={20}
                  inputClassName="w-12 h-6 text-xs"
                  buttonClassName="h-6 w-6"
                  buttonSize="icon"
                />
                 <Button type="button" variant="ghost" size="icon" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => onOpenCombatStatInfoDialog({ type: 'initiativeBreakdown' })}><Info className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{UI_STRINGS.combatPanelBabLabel}</Label>
              <div className="flex items-baseline">
                <p className="text-2xl font-bold text-accent">{totalBabWithModifier.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/')}</p>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={() => onOpenCombatStatInfoDialog({ type: 'babBreakdown' })}><Info className="h-4 w-4" /></Button>
              </div>
              <span className="text-xs text-muted-foreground">{UI_STRINGS.combatPanelBabNote}</span>
            </div>
            <div>
              <Label>{UI_STRINGS.combatPanelGrappleModifierLabel}</Label>
              <div className="flex items-baseline">
                <p className="text-2xl font-bold text-accent">{grapple >= 0 ? '+' : ''}{grapple}</p>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={() => onOpenCombatStatInfoDialog({ type: 'grappleModifierBreakdown' })}><Info className="h-4 w-4" /></Button>
              </div>
              <span className="text-xs text-muted-foreground">
                {UI_STRINGS.combatPanelBabLabelShort} ({totalBabWithModifier[0] >= 0 ? '+' : ''}{totalBabWithModifier[0]}) + {ABILITY_LABELS.find(al => al.id === 'strength')?.abbr || 'STR'} ({strModifier >= 0 ? '+' : ''}{strModifier}) + {UI_STRINGS.sizeLabel} ({sizeModGrapple >= 0 ? '+' : ''}{sizeModGrapple})
              </span>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-lg font-semibold mb-2 flex items-center"><InitiativeIcon className="h-5 w-5 mr-2 text-primary/80" />{UI_STRINGS.savingThrowsPanelTitle}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['fortitude', 'reflex', 'will'] as const).map(saveType => {
                const abilityKey = SAVING_THROW_ABILITIES[saveType];
                const abilityMod = getAbilityModifierByName(detailedAbilityScores, abilityKey);
                const saveLabel = SAVING_THROW_LABELS.find(stl => stl.id === saveType)?.label;
                if (!saveLabel) throw new Error (`[DATA_ERROR] Saving throw label for ${saveType} not found.`);
                return (
                  <div key={saveType} className="p-3 border rounded-md bg-background/30">
                    <Label className="capitalize font-medium">{saveLabel}</Label>
                    <div className="flex items-baseline">
                        <p className="text-3xl font-bold text-accent">{calculatedSaves[saveType] >= 0 ? '+' : ''}{calculatedSaves[saveType]}</p>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={() => onOpenCombatStatInfoDialog({ type: 'savingThrowBreakdown', saveType })}><Info className="h-4 w-4" /></Button>
                    </div>
                    <div className="text-xs space-y-1 mt-1">
                      <p>{UI_STRINGS.savingThrowsRowLabelBase}: {baseSavesFromClass[saveType]}</p>
                      <p>{UI_STRINGS.savingThrowsRowLabelAbilityModifier}: {abilityMod >= 0 ? '+' : ''}{abilityMod} ({(ABILITY_LABELS.find(al => al.id === abilityKey)?.abbr || abilityKey.substring(0,3).toUpperCase())})</p>
                      <div className="flex items-center gap-1"><Label htmlFor={`st-magic-${saveType}`} className="shrink-0">{UI_STRINGS.savingThrowsRowLabelMagicModifier}:</Label> 
                        <NumberSpinnerInput 
                          id={`st-magic-${saveType}`}
                          value={character.savingThrows[saveType].magicMod || 0} 
                          onChange={(val) => handleSavingThrowChange(saveType, 'magicMod', val)} 
                          min={-10} max={10}
                          inputClassName="w-12 h-6 text-xs" buttonClassName="h-6 w-6" buttonSize="icon" />
                      </div>
                      <div className="flex items-center gap-1"><Label htmlFor={`st-misc-${saveType}`} className="shrink-0">{UI_STRINGS.savingThrowsRowLabelTemporaryModifier}:</Label> 
                        <NumberSpinnerInput
                          id={`st-misc-${saveType}`}
                          value={character.savingThrows[saveType].miscMod || 0} 
                          onChange={(val) => handleSavingThrowChange(saveType, 'miscMod', val)}
                          min={-10} max={10}
                          inputClassName="w-12 h-6 text-xs" buttonClassName="h-6 w-6" buttonSize="icon" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
            <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-primary" />
                <CardTitle className="font-serif">{UI_STRINGS.armorClassPanelTitle}</CardTitle>
            </div>
            <CardDescription>{UI_STRINGS.armorClassPanelDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
                <Label>{UI_STRINGS.armorClassNormalLabel}</Label>
                <div className="flex items-center justify-center">
                  <p className="text-3xl font-bold text-accent">{normalAC}</p>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={() => handleOpenAcBreakdownDialog('Normal')}><Info className="h-4 w-4" /></Button>
                </div>
            </div>
            <div>
                <Label>{UI_STRINGS.armorClassTouchLabel}</Label>
                 <div className="flex items-center justify-center">
                  <p className="text-3xl font-bold text-accent">{touchAC}</p>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={() => handleOpenAcBreakdownDialog('Touch')}><Info className="h-4 w-4" /></Button>
                </div>
            </div>
            <div>
                <Label>{UI_STRINGS.armorClassFlatFootedLabel}</Label>
                 <div className="flex items-center justify-center">
                  <p className="text-3xl font-bold text-accent">{flatFootedAC}</p>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={() => handleOpenAcBreakdownDialog('Flat-Footed')}><Info className="h-4 w-4" /></Button>
                </div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
            <CardTitle className="font-serif">{UI_STRINGS.resistancesPanelTitle}</CardTitle>
          </div>
          <CardDescription>{UI_STRINGS.resistancesPanelDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-md font-semibold mb-3 text-foreground/90">{UI_STRINGS.resistancesPanelEnergyResistancesLabel}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {energyResistancesFields.map(({ field, labelKey, Icon, fieldPrefix }) => {
                const resistance = character[field as keyof Character] as ResistanceValue;
                const totalValue = (resistance?.base || 0) + (resistance?.customMod || 0) + (aggregatedFeatEffects.resistanceBonuses.find(b => b.resistanceTo === field.replace('Resistance','').toLowerCase() && b.isActive)?.value || 0);
                const label = UI_STRINGS[labelKey]; 
                if(!label) throw new Error(`[UI_ERROR] Missing UI String for ${labelKey}`);
                return (
                  <div key={field} className="p-3 border rounded-md bg-card flex flex-col items-center space-y-1 text-center shadow-sm">
                    <div className="flex items-center justify-center">
                      <Icon className="h-5 w-5 mr-1.5 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {label}
                      </span>
                    </div>
                    <div className="flex items-center justify-center">
                      <p className="text-2xl font-bold text-accent min-w-[40px] text-center">
                        {totalValue}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground"
                        onClick={() => handleOpenResistanceInfoDialog(field)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="w-full max-w-[120px] flex justify-center">
                      <NumberSpinnerInput
                        id={`${fieldPrefix}-${field}-customMod`}
                        value={resistance?.customMod || 0}
                        onChange={(newValue) => onCharacterUpdate(`${field}.customMod` as `${ResistanceFieldKey}.customMod`, newValue)}
                        min={-50}
                        inputClassName="w-16 h-7 text-sm text-center"
                        buttonClassName="h-7 w-7"
                        buttonSize="sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="text-md font-semibold mb-3 text-foreground/90">{UI_STRINGS.resistancesPanelOtherDefensesLabel}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {otherNumericResistancesFields.map(({ field, labelKey, Icon, unit, fieldPrefix }) => {
                const resistance = character[field as keyof Character] as ResistanceValue;
                const featBonus = aggregatedFeatEffects.resistanceBonuses.find(b => b.resistanceTo === field.toLowerCase().replace('resistance','').replace('fortification','fortification') && b.isActive)?.value || 0;
                const totalValue = (resistance?.base || 0) + (resistance?.customMod || 0) + featBonus;
                const isFortification = field === 'fortification';
                const label = UI_STRINGS[labelKey];
                 if(!label) throw new Error(`[UI_ERROR] Missing UI String for ${labelKey}`);
                return (
                  <div key={field} className="p-3 border rounded-md bg-card flex flex-col items-center space-y-1 text-center shadow-sm">
                     <div className="flex items-center justify-center">
                        <Icon className="h-5 w-5 mr-1.5 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {label} {unit && `(${unit})`}
                        </span>
                      </div>
                    <div className="flex items-center justify-center">
                      <p className="text-2xl font-bold text-accent text-center">
                        {totalValue}
                      </p>
                       <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground"
                        onClick={() => handleOpenResistanceInfoDialog(field)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </div>
                     <div className="w-full max-w-[120px] flex justify-center">
                      <NumberSpinnerInput
                        id={`${fieldPrefix}-${field}-customMod`}
                        value={resistance?.customMod || 0}
                        onChange={(newValue) => onCharacterUpdate(`${field}.customMod` as `${ResistanceFieldKey}.customMod`, newValue)}
                        min={isFortification ? 0 : -50}
                        max={isFortification ? 100 : undefined} 
                        inputClassName="w-16 h-7 text-sm text-center"
                        buttonClassName="h-7 w-7"
                        buttonSize="sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <Separator className="my-6" />
            <div>
                <h4 className="text-md font-semibold mb-3 text-foreground/90">{UI_STRINGS.resistancesPanelDamageReductionLabel}</h4>
                <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-3"> 
                    {(character.damageReduction || []).length > 0 ? (
                      (character.damageReduction || []).map(dr => {
                        const ruleDef = DR_RULES_DATA.find(opt => opt.id === dr.rule);
                        if (!ruleDef) throw new Error(`[DATA_ERROR] Missing DR Rule Definition for ID: ${dr.rule}`);
                        const ruleLabel = ruleDef.label;
                        const currentLangCode = UI_STRINGS.currentLangCodeForNotesFallback as LanguageCode;

                        return (
                        <div key={dr.id} className="flex items-start justify-between p-2 border rounded-md bg-muted/5 text-sm">
                          <div>
                            <p className="font-semibold text-lg">{getDrPrimaryNotation(dr)}</p>
                             <div className="mt-0.5 flex items-center">
                                <Badge variant="outline" className="text-xs font-normal h-5 mr-1 whitespace-nowrap">
                                  {ruleLabel}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{getDrRuleDescription(dr)}</span>
                              </div>
                          </div>
                           <div className="flex items-center shrink-0">
                            {dr.isGranted && dr.source && <Badge variant="secondary" className="text-xs mr-1 whitespace-nowrap">{getLocalizedString(dr.source, currentLangCode, DEFAULT_LANGUAGE, `drSource.${dr.id}`)}</Badge>}
                            {!dr.isGranted && (
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80" onClick={() => handleRemoveDamageReduction(dr.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">{UI_STRINGS.resistancesPanelNoDrEntries}</p>
                    )}
                  </div>

                  <div className="space-y-3 border md:border-l md:border-t-0 p-4 rounded-md md:pl-6"> 
                    <Label className="text-md font-medium">{UI_STRINGS.resistancesPanelAddCustomDrLabel}</Label>
                    <div className="space-y-1">
                        <Label htmlFor="sheet-dr-value" className="text-xs">{UI_STRINGS.resistancesPanelDrValueLabel}</Label>
                        <NumberSpinnerInput
                        id="sheet-dr-value"
                        value={newDrValue}
                        onChange={setNewDrValue}
                        min={1}
                        inputClassName="h-9 text-sm w-20"
                        buttonClassName="h-9 w-9"
                        buttonSize="sm"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="sheet-dr-rule" className="text-xs">{UI_STRINGS.resistancesPanelDrRuleLabel}</Label>
                         <Select value={newDrRule} onValueChange={(val) => setNewDrRule(val as DamageReductionRuleValue)}>
                            <SelectTrigger id="sheet-dr-rule" className="h-9 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {DR_RULES_DATA.map(option => (
                                    <SelectItem key={option.id} value={option.id}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="sheet-dr-type" className="text-xs">{UI_STRINGS.resistancesPanelDrTypeLabel}</Label>
                        <Select value={newDrType} onValueChange={(val) => setNewDrType(val as DamageReductionTypeValue | string)}>
                            <SelectTrigger id="sheet-dr-type" className="h-9 text-sm">
                               <SelectValue placeholder={UI_STRINGS.resistancesPanelDrSelectTypePlaceholder} />
                            </SelectTrigger>
                            <SelectContent>
                                {DR_TYPES_DATA.map(option => (
                                    <SelectItem 
                                      key={option.id} 
                                      value={option.id}
                                      disabled={option.id === 'none' && newDrRule !== 'bypassed-by-type'}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="button" onClick={handleAddDamageReduction} size="sm" className="mt-3">
                        <PlusCircle className="mr-2 h-4 w-4" /> {UI_STRINGS.resistancesPanelAddDrButton}
                    </Button>
                  </div>
                </div>
              </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}

    