
'use client';

import type { Character, AbilityScores, SavingThrows, CharacterClass, ResistanceValue, DamageReductionInstance, DamageReductionTypeValue, DamageReductionRuleValue } from '@/types/character';
import { DAMAGE_REDUCTION_TYPES, DAMAGE_REDUCTION_RULES_OPTIONS, ABILITY_LABELS, SAVING_THROW_LABELS } from '@/types/character';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Swords, Heart, Zap as InitiativeIcon, ShieldAlert, Waves, Flame, Snowflake, Zap as ElectricityIcon, Atom, Sigma, Info, Brain, ShieldCheck, PlusCircle, Trash2 } from 'lucide-react';
import { 
  getAbilityModifierByName,
  getBab, 
  getBaseSaves, 
  calculateInitiative, 
  calculateGrapple, 
  getSizeModifierAC,
  getSizeModifierGrapple,
  SAVING_THROW_ABILITIES
} from '@/lib/dnd-utils';
import { Separator } from '../ui/separator';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { ArmorClassPanel } from '../form-sections/ArmorClassPanel'; 
import { Button } from '@/components/ui/button';
import { InfoDisplayDialog, type ResistanceBreakdownDetails } from '@/components/InfoDisplayDialog';
import *as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';


type ResistanceFieldKey = Exclude<keyof Pick<Character,
  'fireResistance' | 'coldResistance' | 'acidResistance' | 'electricityResistance' | 'sonicResistance' |
  'spellResistance' | 'powerResistance' | 'fortification'
>, 'damageReduction'>;

interface CombatStatsSectionProps {
  character: Character;
  onCharacterUpdate: (
    field: keyof Character | 
           `savingThrows.${keyof SavingThrows}.${'base'|'magicMod'|'miscMod'}` |
           `${ResistanceFieldKey}.customMod` | 
           'damageReduction', 
    value: any
  ) => void;
}

export function CombatStatsSection({ character, onCharacterUpdate }: CombatStatsSectionProps) {
  const [isInfoDialogOpen, setIsInfoDialogOpen] = React.useState(false);
  const [currentResistanceBreakdown, setCurrentResistanceBreakdown] = React.useState<ResistanceBreakdownDetails | undefined>(undefined);
  const { toast } = useToast();

  const [newDrValue, setNewDrValue] = React.useState(1);
  const [newDrType, setNewDrType] = React.useState<DamageReductionTypeValue | string>(DAMAGE_REDUCTION_TYPES[0]?.value || "none");
  const [newDrRule, setNewDrRule] = React.useState<DamageReductionRuleValue>(DAMAGE_REDUCTION_RULES_OPTIONS[0]?.value);


  React.useEffect(() => {
    if (newDrRule !== 'bypassed-by-type' && newDrType === 'none') {
      const firstNonNoneType = DAMAGE_REDUCTION_TYPES.find(t => t.value !== 'none')?.value || 'magic';
      setNewDrType(firstNonNoneType);
    }
  }, [newDrRule, newDrType]);


  const abilityScores = character.abilityScores;
  const classes = character.classes;

  const dexModifier = getAbilityModifierByName(abilityScores, 'dexterity');
  const strModifier = getAbilityModifierByName(abilityScores, 'strength');
  const conModifier = getAbilityModifierByName(abilityScores, 'constitution');
  const wisModifier = getAbilityModifierByName(abilityScores, 'wisdom');
  
  const babArray = getBab(classes);
  const baseSaves = getBaseSaves(classes);
  
  const sizeModAttackAC = getSizeModifierAC(character.size);
  const sizeModGrapple = getSizeModifierGrapple(character.size);

  const initiative = calculateInitiative(dexModifier, character.initiativeMiscModifier);
  const grapple = calculateGrapple(babArray, strModifier, sizeModGrapple);

  const calculatedSaves = {
    fortitude: baseSaves.fortitude + conModifier + character.savingThrows.fortitude.magicMod + character.savingThrows.fortitude.miscMod,
    reflex: baseSaves.reflex + dexModifier + character.savingThrows.reflex.magicMod + character.savingThrows.reflex.miscMod,
    will: baseSaves.will + wisModifier + character.savingThrows.will.magicMod + character.savingThrows.will.miscMod,
  };

  const handleSavingThrowChange = (saveType: keyof SavingThrows, field: 'magicMod' | 'miscMod', value: number) => {
    onCharacterUpdate(`savingThrows.${saveType}.${field}`, value);
  };

  const energyResistancesFields: Array<{ field: ResistanceFieldKey; label: string; Icon: React.ElementType; fieldPrefix?: string }> = [
    { field: 'fireResistance', label: 'Fire', Icon: Flame, fieldPrefix: 'sheet-res' },
    { field: 'coldResistance', label: 'Cold', Icon: Snowflake, fieldPrefix: 'sheet-res' },
    { field: 'acidResistance', label: 'Acid', Icon: Atom, fieldPrefix: 'sheet-res' },
    { field: 'electricityResistance', label: 'Electricity', Icon: ElectricityIcon, fieldPrefix: 'sheet-res' },
    { field: 'sonicResistance', label: 'Sonic', Icon: Waves, fieldPrefix: 'sheet-res' },
  ];

  const otherNumericResistancesFields: Array<{ field: ResistanceFieldKey; label: string; Icon: React.ElementType; unit?: string; fieldPrefix?: string }> = [
    { field: 'spellResistance', label: 'Spell Resistance', Icon: Sigma, fieldPrefix: 'sheet-res' },
    { field: 'powerResistance', label: 'Power Resistance', Icon: Brain, fieldPrefix: 'sheet-res' },
    { field: 'fortification', label: 'Fortification', Icon: ShieldCheck, unit: '%', fieldPrefix: 'sheet-res' },
  ];

  const handleOpenResistanceInfoDialog = (
    name: string,
    base: number,
    customMod: number,
    total: number
  ) => {
    setCurrentResistanceBreakdown({ name, base, customMod, total });
    setIsInfoDialogOpen(true);
  };

  const handleAddDamageReduction = () => {
    if (newDrValue <= 0) {
      toast({ title: "Invalid DR Value", description: "DR value must be > 0.", variant: "destructive"});
      return;
    }
     if (!newDrType) { 
        toast({ title: "DR Type Missing", description: "Select DR type.", variant: "destructive"});
        return;
    }
     if ((newDrRule === 'excepted-by-type' || newDrRule === 'versus-specific-type') && newDrType === 'none') {
      toast({ title: "Invalid Combination", description: `The '${DAMAGE_REDUCTION_RULES_OPTIONS.find(opt => opt.value === newDrRule)?.label}' rule requires a specific damage type (not 'None').`, variant: "destructive"});
      return;
    }

    const existingUserDrOfTypeAndRule = character.damageReduction.find(
      dr => !dr.isGranted && dr.type === newDrType && dr.rule === newDrRule
    );
    if (existingUserDrOfTypeAndRule) {
      toast({ title: "Duplicate DR Entry", description: `Custom DR with this type and rule already exists.`, variant: "destructive"});
      return;
    }

    const newInstance: DamageReductionInstance = {
      id: crypto.randomUUID(),
      value: newDrValue,
      type: newDrType,
      rule: newDrRule,
      isGranted: false,
    };
    onCharacterUpdate('damageReduction', [...character.damageReduction, newInstance]);
    setNewDrValue(1);
    setNewDrType(DAMAGE_REDUCTION_TYPES[0]?.value || "none"); 
    setNewDrRule(DAMAGE_REDUCTION_RULES_OPTIONS[0]?.value); 
  };

  const handleRemoveDamageReduction = (idToRemove: string) => {
    onCharacterUpdate('damageReduction', character.damageReduction.filter(dr => dr.id !== idToRemove));
  };

  const getDrTypeUiLabel = (typeValue: DamageReductionTypeValue | string): string => {
    return DAMAGE_REDUCTION_TYPES.find(t => t.value === typeValue)?.label || String(typeValue);
  };
  
 const getDrPrimaryNotation = (dr: DamageReductionInstance): string => {
    const typeLabel = getDrTypeUiLabel(dr.type);
    if (dr.rule === 'bypassed-by-type') {
      return dr.type === "none" ? `${dr.value}/—` : `${dr.value}/${typeLabel}`;
    }
    if (dr.rule === 'versus-specific-type') {
      return `${dr.value} vs ${typeLabel}`;
    }
    if (dr.rule === 'excepted-by-type') {
       const displayType = typeLabel === "None" ? "—" : typeLabel;
       return `${dr.value}/${displayType} (Immunity)`;
    }
    return `${dr.value}/${typeLabel} (${DAMAGE_REDUCTION_RULES_OPTIONS.find(opt => opt.value === dr.rule)?.label || dr.rule})`;
  };
  
  const getDrRuleDescription = (dr: DamageReductionInstance): string => {
    const typeLabel = getDrTypeUiLabel(dr.type);
    const ruleDef = DAMAGE_REDUCTION_RULES_OPTIONS.find(opt => opt.value === dr.rule);

    if (dr.rule === 'bypassed-by-type') {
      return dr.type === "none" ? `Reduces damage from most attacks by ${dr.value}.` : `Reduces damage by ${dr.value} unless attack is ${typeLabel}.`;
    }
    if (dr.rule === 'versus-specific-type') {
      return `Specifically reduces damage from ${typeLabel} sources by ${dr.value}.`;
    }
    if (dr.rule === 'excepted-by-type') {
        return `Immune to damage unless from ${typeLabel} sources. ${typeLabel} sources deal damage reduced by ${dr.value}.`;
    }
    return `Rule: ${ruleDef ? ruleDef.label : dr.rule}`; 
  };
  
  return (
    <>
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Swords className="h-6 w-6 text-primary" />
            <CardTitle className="font-serif">Combat Vitals & Offense</CardTitle>
          </div>
           <CardDescription>Key combat statistics including health, initiative, attack bonuses, and saving throws.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* HP and Initiative */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="hp">Current HP</Label>
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
              <Label htmlFor="maxHp">Max HP</Label>
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
              <Label>Initiative</Label>
              <p className="text-3xl font-bold text-accent">{initiative >= 0 ? '+' : ''}{initiative}</p>
              <div className="flex items-center justify-center md:justify-start gap-1 mt-1">
                <span className="text-xs text-muted-foreground">Dex ({dexModifier >= 0 ? '+' : ''}{dexModifier}) + Misc:</span>
                <NumberSpinnerInput
                  value={character.initiativeMiscModifier}
                  onChange={(newValue) => onCharacterUpdate('initiativeMiscModifier', newValue)}
                  min={-20} max={20}
                  inputClassName="w-12 h-6 text-xs"
                  buttonClassName="h-6 w-6"
                  buttonSize="icon"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* BAB and Grapple */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Base Attack Bonus (BAB)</Label>
              <p className="text-2xl font-bold text-accent">{babArray.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/')}</p>
              <span className="text-xs text-muted-foreground">Note: General attack rolls also include Str/Dex mod, Size mod ({sizeModAttackAC >= 0 ? '+' : ''}{sizeModAttackAC}), etc.</span>
            </div>
            <div>
              <Label>Grapple Modifier</Label>
              <p className="text-2xl font-bold text-accent">{grapple >= 0 ? '+' : ''}{grapple}</p>
              <span className="text-xs text-muted-foreground">BAB ({babArray[0] >= 0 ? '+' : ''}{babArray[0]}) + Str ({strModifier >= 0 ? '+' : ''}{strModifier}) + Size (Grapple) ({sizeModGrapple >= 0 ? '+' : ''}{sizeModGrapple})</span>
            </div>
          </div>

          <Separator />

          {/* Saving Throws */}
          <div>
            <h4 className="text-lg font-semibold mb-2 flex items-center"><InitiativeIcon className="h-5 w-5 mr-2 text-primary/80" />Saving Throws</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['fortitude', 'reflex', 'will'] as const).map(saveType => (
                <div key={saveType} className="p-3 border rounded-md bg-background/30">
                  <Label className="capitalize font-medium">{SAVING_THROW_LABELS.find(stl => stl.value === saveType)?.label || saveType}</Label>
                  <p className="text-3xl font-bold text-accent">{calculatedSaves[saveType] >= 0 ? '+' : ''}{calculatedSaves[saveType]}</p>
                  <div className="text-xs space-y-1 mt-1">
                    <p>Base: {baseSaves[saveType]}</p>
                    <p>Ability Mod: {getAbilityModifierByName(abilityScores, SAVING_THROW_ABILITIES[saveType]) >= 0 ? '+' : ''}{getAbilityModifierByName(abilityScores, SAVING_THROW_ABILITIES[saveType])} ({(ABILITY_LABELS.find(al => al.value === SAVING_THROW_ABILITIES[saveType])?.abbr || SAVING_THROW_ABILITIES[saveType].substring(0,3).toUpperCase())})</p>
                    <div className="flex items-center gap-1"><Label htmlFor={`st-magic-${saveType}`} className="shrink-0">Magic:</Label> 
                      <NumberSpinnerInput 
                        id={`st-magic-${saveType}`}
                        value={character.savingThrows[saveType].magicMod} 
                        onChange={(val) => handleSavingThrowChange(saveType, 'magicMod', val)} 
                        min={-10} max={10}
                        inputClassName="w-12 h-6 text-xs" buttonClassName="h-6 w-6" buttonSize="icon" />
                    </div>
                    <div className="flex items-center gap-1"><Label htmlFor={`st-misc-${saveType}`} className="shrink-0">Misc:</Label> 
                      <NumberSpinnerInput
                        id={`st-misc-${saveType}`}
                        value={character.savingThrows[saveType].miscMod} 
                        onChange={(val) => handleSavingThrowChange(saveType, 'miscMod', val)}
                        min={-10} max={10}
                        inputClassName="w-12 h-6 text-xs" buttonClassName="h-6 w-6" buttonSize="icon" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* ArmorClassPanel is now expected to be a sibling component in CharacterSheetTabs, not rendered here */}

      <Card>
        <CardHeader>
            <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-primary" />
                <CardTitle className="font-serif">AC Components</CardTitle>
            </div>
            <CardDescription>Adjust individual bonuses contributing to Armor Class.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 text-sm items-center">
                <div className="flex items-center gap-1"><Label htmlFor="ac-armor" className="shrink-0">Armor Bonus:</Label> <NumberSpinnerInput id="ac-armor" value={character.armorBonus} onChange={(val) => onCharacterUpdate('armorBonus', val)} min={0} max={30} inputClassName="w-12 h-7 text-sm" buttonClassName="h-7 w-7" buttonSize="icon" /></div>
                <div className="flex items-center gap-1"><Label htmlFor="ac-shield" className="shrink-0">Shield Bonus:</Label> <NumberSpinnerInput id="ac-shield" value={character.shieldBonus} onChange={(val) => onCharacterUpdate('shieldBonus', val)} min={0} max={15} inputClassName="w-12 h-7 text-sm" buttonClassName="h-7 w-7" buttonSize="icon" /></div>
                <div className="flex items-center gap-1"><Label htmlFor="ac-natural" className="shrink-0">Natural Armor:</Label> <NumberSpinnerInput id="ac-natural" value={character.naturalArmor} onChange={(val) => onCharacterUpdate('naturalArmor', val)} min={0} max={20} inputClassName="w-12 h-7 text-sm" buttonClassName="h-7 w-7" buttonSize="icon" /></div>
                <div className="flex items-center gap-1"><Label htmlFor="ac-deflection" className="shrink-0">Deflection Bonus:</Label> <NumberSpinnerInput id="ac-deflection" value={character.deflectionBonus} onChange={(val) => onCharacterUpdate('deflectionBonus', val)} min={0} max={10} inputClassName="w-12 h-7 text-sm" buttonClassName="h-7 w-7" buttonSize="icon" /></div>
                <div className="flex items-center gap-1"><Label htmlFor="ac-dodge" className="shrink-0">Dodge Bonus:</Label> <NumberSpinnerInput id="ac-dodge" value={character.dodgeBonus} onChange={(val) => onCharacterUpdate('dodgeBonus', val)} min={0} max={10} inputClassName="w-12 h-7 text-sm" buttonClassName="h-7 w-7" buttonSize="icon" /></div>
                <div className="flex items-center gap-1"><Label htmlFor="ac-misc" className="shrink-0">Misc Modifier:</Label> <NumberSpinnerInput id="ac-misc" value={character.acMiscModifier} onChange={(val) => onCharacterUpdate('acMiscModifier', val)} min={-10} max={10} inputClassName="w-12 h-7 text-sm" buttonClassName="h-7 w-7" buttonSize="icon" /></div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
            <CardTitle className="font-serif">Resistances &amp; Other Defenses</CardTitle>
          </div>
          <CardDescription>Manage custom modifiers for resistances, damage reductions, and fortification. Base values are often 0 unless granted by race, class and items.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-md font-semibold mb-3 text-foreground/90">Energy Resistances</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {energyResistancesFields.map(({ field, label, Icon, fieldPrefix }) => {
                const resistance = character[field] as ResistanceValue;
                const totalValue = (resistance?.base || 0) + (resistance?.customMod || 0);
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
                        onClick={() => handleOpenResistanceInfoDialog(
                          `${label} Resistance`,
                          resistance.base || 0,
                          resistance.customMod || 0,
                          totalValue
                        )}
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
            <h4 className="text-md font-semibold mb-3 text-foreground/90">Other Defenses</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {otherNumericResistancesFields.map(({ field, label, Icon, unit, fieldPrefix }) => {
                const resistance = character[field] as ResistanceValue;
                const totalValue = (resistance?.base || 0) + (resistance?.customMod || 0);
                const isFortification = field === 'fortification';
                return (
                  <div key={field} className="p-3 border rounded-md bg-card flex flex-col items-center space-y-1 text-center shadow-sm">
                     <div className="flex items-center justify-center">
                        <Icon className="h-5 w-5 mr-1.5 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {label} {unit && `(${unit})`}
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
                        onClick={() => handleOpenResistanceInfoDialog(
                          label,
                          resistance.base || 0,
                          resistance.customMod || 0,
                          totalValue
                        )}
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
                <h4 className="text-md font-semibold mb-3 text-foreground/90">Damage Reduction</h4>
                <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-3"> 
                    {character.damageReduction.length > 0 ? (
                      character.damageReduction.map(dr => {
                        const ruleDef = DAMAGE_REDUCTION_RULES_OPTIONS.find(opt => opt.value === dr.rule);
                        const ruleLabel = ruleDef?.label || dr.rule;
                        return (
                        <div key={dr.id} className="flex items-start justify-between p-2 border rounded-md bg-muted/5 text-sm">
                          <div>
                            <p className="font-semibold">{getDrPrimaryNotation(dr)}</p>
                             <div className="mt-0.5 flex items-center">
                                <Badge variant="outline" className="text-xs font-normal h-5 mr-1 whitespace-nowrap">
                                  {ruleLabel}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{getDrRuleDescription(dr)}</span>
                              </div>
                          </div>
                           <div className="flex items-center shrink-0">
                            {dr.isGranted && dr.source && <Badge variant="secondary" className="text-xs mr-1 whitespace-nowrap">{dr.source}</Badge>}
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
                      <p className="text-sm text-muted-foreground">No Damage Reduction entries.</p>
                    )}
                  </div>

                  <div className="space-y-3 border md:border-l md:border-t-0 p-4 rounded-md md:pl-6"> 
                    <Label className="text-md font-medium">Custom Damage Reduction</Label>
                    <div className="space-y-1">
                        <Label htmlFor="sheet-dr-value" className="text-xs">Value</Label>
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
                        <Label htmlFor="sheet-dr-rule" className="text-xs">Rule</Label>
                         <Select value={newDrRule} onValueChange={(val) => setNewDrRule(val as DamageReductionRuleValue)}>
                            <SelectTrigger id="sheet-dr-rule" className="h-9 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {DAMAGE_REDUCTION_RULES_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="sheet-dr-type" className="text-xs">Type</Label>
                        <Select value={newDrType} onValueChange={(val) => setNewDrType(val as DamageReductionTypeValue | string)}>
                            <SelectTrigger id="sheet-dr-type" className="h-9 text-sm">
                               <SelectValue placeholder="Select type..." />
                            </SelectTrigger>
                            <SelectContent>
                                {DAMAGE_REDUCTION_TYPES.map(option => (
                                    <SelectItem 
                                        key={option.value} 
                                        value={option.value}
                                        disabled={option.value === 'none' && newDrRule !== 'bypassed-by-type'}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="button" onClick={handleAddDamageReduction} size="sm" className="mt-3">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Damage Reduction
                    </Button>
                  </div>
                </div>
              </div>

          </div>
        </CardContent>
      </Card>

    </div>
    {isInfoDialogOpen && currentResistanceBreakdown && (
        <InfoDisplayDialog
          isOpen={isInfoDialogOpen}
          onOpenChange={setIsInfoDialogOpen}
          character={character} /* Pass the full character object */
          contentType={{ type: 'resistanceBreakdown', resistanceField: 'fireResistance' }} /* Dummy, real value is in state or derived */
        />
      )}
    </>
  );
}

