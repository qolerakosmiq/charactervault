
'use client';

import type { Character, AbilityScores, SavingThrows, CharacterClass } from '@/types/character';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Swords, Heart, Zap, Dices } from 'lucide-react';
import { 
  calculateAbilityModifier, 
  getAbilityModifierByName,
  getBab, 
  getBaseSaves, 
  calculateAc, 
  calculateInitiative, 
  calculateGrapple, 
  getSizeModifierAC,
  getSizeModifierGrapple
} from '@/lib/dnd-utils';
import { Separator } from '../ui/separator';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput'; // Added import

interface CombatStatsSectionProps {
  character: Character;
  onCharacterUpdate: (field: keyof Character | `savingThrows.${keyof SavingThrows}.${'base'|'magicMod'|'miscMod'}`, value: any) => void;
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

  const sizeModAC = getSizeModifierAC(character.size);
  const sizeModGrapple = getSizeModifierGrapple(character.size);

  const totalAC = calculateAc(
    dexModifier,
    character.armorBonus,
    character.shieldBonus,
    sizeModAC,
    character.naturalArmor,
    character.deflectionBonus,
    character.dodgeBonus,
    character.acMiscModifier
  );

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
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Swords className="h-6 w-6 text-primary" />
          <CardTitle className="font-serif">Combat Stats</CardTitle>
        </div>
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
              min={-999} // Allow very low HP for near death states
              max={character.maxHp > 0 ? character.maxHp + 20 : 999} // Allow some buffer over maxHP
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

        {/* Armor Class */}
        <div>
          <h4 className="text-lg font-semibold mb-2 flex items-center"><Shield className="h-5 w-5 mr-2 text-primary/80" />Armor Class: <span className="text-3xl font-bold text-accent ml-2">{totalAC}</span></h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 text-sm items-center">
            <div className="flex items-center gap-1">Base: <span className="font-semibold">10</span></div>
            <div className="flex items-center gap-1">Dex Mod: <span className="font-semibold">{dexModifier >=0 ? '+':''}{dexModifier}</span></div>
            <div className="flex items-center gap-1">Size Mod: <span className="font-semibold">{sizeModAC >=0 ? '+':''}{sizeModAC}</span></div>
            
            <div className="flex items-center gap-1"><Label htmlFor="ac-armor" className="shrink-0">Armor:</Label> <NumberSpinnerInput id="ac-armor" value={character.armorBonus} onChange={(val) => onCharacterUpdate('armorBonus', val)} min={0} max={30} inputClassName="w-12 h-7 text-sm" buttonClassName="h-7 w-7" buttonSize="sm" /></div>
            <div className="flex items-center gap-1"><Label htmlFor="ac-shield" className="shrink-0">Shield:</Label> <NumberSpinnerInput id="ac-shield" value={character.shieldBonus} onChange={(val) => onCharacterUpdate('shieldBonus', val)} min={0} max={15} inputClassName="w-12 h-7 text-sm" buttonClassName="h-7 w-7" buttonSize="sm" /></div>
            <div className="flex items-center gap-1"><Label htmlFor="ac-natural" className="shrink-0">Natural:</Label> <NumberSpinnerInput id="ac-natural" value={character.naturalArmor} onChange={(val) => onCharacterUpdate('naturalArmor', val)} min={0} max={20} inputClassName="w-12 h-7 text-sm" buttonClassName="h-7 w-7" buttonSize="sm" /></div>
            <div className="flex items-center gap-1"><Label htmlFor="ac-deflection" className="shrink-0">Deflection:</Label> <NumberSpinnerInput id="ac-deflection" value={character.deflectionBonus} onChange={(val) => onCharacterUpdate('deflectionBonus', val)} min={0} max={10} inputClassName="w-12 h-7 text-sm" buttonClassName="h-7 w-7" buttonSize="sm" /></div>
            <div className="flex items-center gap-1"><Label htmlFor="ac-dodge" className="shrink-0">Dodge:</Label> <NumberSpinnerInput id="ac-dodge" value={character.dodgeBonus} onChange={(val) => onCharacterUpdate('dodgeBonus', val)} min={0} max={10} inputClassName="w-12 h-7 text-sm" buttonClassName="h-7 w-7" buttonSize="sm" /></div>
            <div className="flex items-center gap-1"><Label htmlFor="ac-misc" className="shrink-0">Misc:</Label> <NumberSpinnerInput id="ac-misc" value={character.acMiscModifier} onChange={(val) => onCharacterUpdate('acMiscModifier', val)} min={-10} max={10} inputClassName="w-12 h-7 text-sm" buttonClassName="h-7 w-7" buttonSize="sm" /></div>
          </div>
        </div>
        
        <Separator />

        {/* BAB and Grapple */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Base Attack Bonus (BAB)</Label>
            <p className="text-2xl font-bold text-accent">{babArray.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/')}</p>
          </div>
          <div>
            <Label>Grapple Modifier</Label>
            <p className="text-2xl font-bold text-accent">{grapple >= 0 ? '+' : ''}{grapple}</p>
            <span className="text-xs text-muted-foreground">BAB ({babArray[0] >= 0 ? '+' : ''}{babArray[0]}) + Str ({strModifier >= 0 ? '+' : ''}{strModifier}) + Size ({sizeModGrapple >= 0 ? '+' : ''}{sizeModGrapple})</span>
          </div>
        </div>

        <Separator />

        {/* Saving Throws */}
        <div>
          <h4 className="text-lg font-semibold mb-2 flex items-center"><Zap className="h-5 w-5 mr-2 text-primary/80" />Saving Throws</h4>
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
  );
}
