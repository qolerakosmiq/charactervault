
'use client';

import type { Character, AbilityScores, SavingThrows, CharacterClass, ResistanceValue } from '@/types/character';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Swords, Heart, Zap as InitiativeIcon, ShieldAlert, Waves, Flame, Snowflake, Zap as ElectricityIcon, Atom, Sigma, ShieldCheck, Brain } from 'lucide-react';
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
import { ArmorClassPanel } from '../form-sections/ArmorClassPanel'; 
import { Input } from '@/components/ui/input';

type ResistanceFieldKey = Exclude<keyof Pick<Character,
  'fireResistance' | 'coldResistance' | 'acidResistance' | 'electricityResistance' | 'sonicResistance' |
  'spellResistance' | 'powerResistance' | 'fortification'
>, 'damageReduction'>;

interface CombatStatsSectionProps {
  character: Character;
  onCharacterUpdate: (
    field: keyof Character | 
           `savingThrows.${keyof SavingThrows}.${'base'|'magicMod'|'miscMod'}` |
           `${ResistanceFieldKey}.customMod` | // Path for resistance custom mods
           'damageReduction', // For direct damageReduction string
    value: any
  ) => void;
}

export function CombatStatsSection({ character, onCharacterUpdate }: CombatStatsSectionProps) {
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

  const energyResistancesFields: Array<{ field: ResistanceFieldKey; label: string; Icon: React.ElementType }> = [
    { field: 'fireResistance', label: 'Fire', Icon: Flame },
    { field: 'coldResistance', label: 'Cold', Icon: Snowflake },
    { field: 'acidResistance', label: 'Acid', Icon: Atom },
    { field: 'electricityResistance', label: 'Electricity', Icon: ElectricityIcon },
    { field: 'sonicResistance', label: 'Sonic', Icon: Waves },
  ];

  const otherNumericResistancesFields: Array<{ field: ResistanceFieldKey; label: string; Icon: React.ElementType; unit?: string }> = [
    { field: 'spellResistance', label: 'Spell Resistance', Icon: Sigma },
    { field: 'powerResistance', label: 'Power Resistance', Icon: Brain },
    { field: 'fortification', label: 'Fortification', Icon: ShieldCheck, unit: '%' },
  ];
  
  return (
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
                  buttonSize="sm"
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
                  <Label className="capitalize font-medium">{saveType}</Label>
                  <p className="text-3xl font-bold text-accent">{calculatedSaves[saveType] >= 0 ? '+' : ''}{calculatedSaves[saveType]}</p>
                  <div className="text-xs space-y-1 mt-1">
                    <p>Base: {baseSaves[saveType]}</p>
                    <p>Ability Mod: {saveType === 'fortitude' ? conModifier : saveType === 'reflex' ? dexModifier : wisModifier}</p>
                    <div className="flex items-center gap-1"><Label htmlFor={`st-magic-${saveType}`} className="shrink-0">Magic:</Label> 
                      <NumberSpinnerInput 
                        id={`st-magic-${saveType}`}
                        value={character.savingThrows[saveType].magicMod} 
                        onChange={(val) => handleSavingThrowChange(saveType, 'magicMod', val)} 
                        min={-10} max={10}
                        inputClassName="w-12 h-6 text-xs" buttonClassName="h-6 w-6" buttonSize="sm" />
                    </div>
                    <div className="flex items-center gap-1"><Label htmlFor={`st-misc-${saveType}`} className="shrink-0">Misc:</Label> 
                      <NumberSpinnerInput
                        id={`st-misc-${saveType}`}
                        value={character.savingThrows[saveType].miscMod} 
                        onChange={(val) => handleSavingThrowChange(saveType, 'miscMod', val)}
                        min={-10} max={10}
                        inputClassName="w-12 h-6 text-xs" buttonClassName="h-6 w-6" buttonSize="sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <ArmorClassPanel character={character} />

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
                <div className="flex items-center gap-1"><Label htmlFor="ac-armor" className="shrink-0">Armor Bonus:</Label> <NumberSpinnerInput id="ac-armor" value={character.armorBonus} onChange={(val) => onCharacterUpdate('armorBonus', val)} min={0} max={30} inputClassName="w-12 h-7 text-sm" buttonClassName="h-7 w-7" buttonSize="sm" /></div>
                <div className="flex items-center gap-1"><Label htmlFor="ac-shield" className="shrink-0">Shield Bonus:</Label> <NumberSpinnerInput id="ac-shield" value={character.shieldBonus} onChange={(val) => onCharacterUpdate('shieldBonus', val)} min={0} max={15} inputClassName="w-12 h-7 text-sm" buttonClassName="h-7 w-7" buttonSize="sm" /></div>
                <div className="flex items-center gap-1"><Label htmlFor="ac-natural" className="shrink-0">Natural Armor:</Label> <NumberSpinnerInput id="ac-natural" value={character.naturalArmor} onChange={(val) => onCharacterUpdate('naturalArmor', val)} min={0} max={20} inputClassName="w-12 h-7 text-sm" buttonClassName="h-7 w-7" buttonSize="sm" /></div>
                <div className="flex items-center gap-1"><Label htmlFor="ac-deflection" className="shrink-0">Deflection Bonus:</Label> <NumberSpinnerInput id="ac-deflection" value={character.deflectionBonus} onChange={(val) => onCharacterUpdate('deflectionBonus', val)} min={0} max={10} inputClassName="w-12 h-7 text-sm" buttonClassName="h-7 w-7" buttonSize="sm" /></div>
                <div className="flex items-center gap-1"><Label htmlFor="ac-dodge" className="shrink-0">Dodge Bonus:</Label> <NumberSpinnerInput id="ac-dodge" value={character.dodgeBonus} onChange={(val) => onCharacterUpdate('dodgeBonus', val)} min={0} max={10} inputClassName="w-12 h-7 text-sm" buttonClassName="h-7 w-7" buttonSize="sm" /></div>
                <div className="flex items-center gap-1"><Label htmlFor="ac-misc" className="shrink-0">Misc Modifier:</Label> <NumberSpinnerInput id="ac-misc" value={character.acMiscModifier} onChange={(val) => onCharacterUpdate('acMiscModifier', val)} min={-10} max={10} inputClassName="w-12 h-7 text-sm" buttonClassName="h-7 w-7" buttonSize="sm" /></div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
            <CardTitle className="font-serif">Resistances &amp; Other Defenses</CardTitle>
          </div>
          <CardDescription>Manage custom modifiers for energy resistances, spell/power resistance, damage reduction, and fortification.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-md font-semibold mb-2 text-foreground/90">Energy Resistances</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-3">
              {energyResistancesFields.map(({ field, label, Icon }) => {
                const resistance = character[field] as ResistanceValue;
                const totalValue = (resistance?.base || 0) + (resistance?.customMod || 0);
                return (
                  <div key={field} className="space-y-1">
                    <Label htmlFor={`res-${field}-customMod`} className="flex items-center text-sm">
                      <Icon className="h-4 w-4 mr-1 text-muted-foreground" />
                      {label}
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-accent p-1 min-w-[30px] text-center">
                        {totalValue}
                      </span>
                      <NumberSpinnerInput
                        id={`res-${field}-customMod`}
                        value={resistance?.customMod || 0}
                        onChange={(newValue) => onCharacterUpdate(`${field}.customMod` as `${ResistanceFieldKey}.customMod`, newValue)}
                        min={-50} max={200}
                        inputClassName="w-full h-9 text-sm" buttonClassName="h-9 w-9" buttonSize="sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="text-md font-semibold mb-2 text-foreground/90">Other Defenses</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {otherNumericResistancesFields.map(({ field, label, Icon, unit }) => {
                const resistance = character[field] as ResistanceValue;
                const totalValue = (resistance?.base || 0) + (resistance?.customMod || 0);
                return (
                  <div key={field} className="space-y-1">
                    <Label htmlFor={`res-${field}-customMod`} className="flex items-center text-sm">
                      <Icon className="h-4 w-4 mr-1 text-muted-foreground" />
                      {label} {unit}
                    </Label>
                     <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-accent p-1 min-w-[30px] text-center">
                        {totalValue}
                      </span>
                      <NumberSpinnerInput
                        id={`res-${field}-customMod`}
                        value={resistance?.customMod || 0}
                        onChange={(newValue) => onCharacterUpdate(`${field}.customMod` as `${ResistanceFieldKey}.customMod`, newValue)}
                        min={0} max={field === 'fortification' ? 100 : 200}
                        inputClassName="w-full h-9 text-sm" buttonClassName="h-9 w-9" buttonSize="sm"
                      />
                    </div>
                  </div>
                );
              })}
              <div className="space-y-1">
                <Label htmlFor="res-damageReduction" className="flex items-center text-sm">
                  <ShieldAlert className="h-4 w-4 mr-1 text-muted-foreground" />
                  Damage Reduction
                </Label>
                <Input
                  id="res-damageReduction"
                  value={character.damageReduction || ''}
                  onChange={(e) => onCharacterUpdate('damageReduction', e.target.value)}
                  placeholder="e.g., 5/magic"
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

    