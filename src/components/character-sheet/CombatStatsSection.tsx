'use client';

import type { Character, AbilityScores, SavingThrows, CharacterClass } from '@/types/character';
import { Input } from '@/components/ui/input';
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

interface CombatStatsSectionProps {
  character: Character;
  onCharacterUpdate: (field: keyof Character | `savingThrows.${keyof SavingThrows}.${'base'|'magicMod'|'miscMod'}`, value: any) => void;
}

export function CombatStatsSection({ character, onCharacterUpdate }: CombatStatsSectionProps) {
  const abilityScores = character.abilityScores;
  const classes = character.classes;

  // Calculated values
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
  
  const handleNumericChange = (field: keyof Character, value: string) => {
    onCharacterUpdate(field, parseInt(value, 10) || 0);
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
            <Input id="hp" type="number" value={character.hp} onChange={(e) => handleNumericChange('hp', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="maxHp">Max HP</Label>
            <Input id="maxHp" type="number" value={character.maxHp} onChange={(e) => handleNumericChange('maxHp', e.target.value)} />
          </div>
          <div className="text-center md:text-left">
            <Label>Initiative</Label>
            <p className="text-3xl font-bold text-accent">{initiative >= 0 ? '+' : ''}{initiative}</p>
            <div className="flex items-center justify-center md:justify-start gap-1 mt-1">
              <span className="text-xs text-muted-foreground">Dex ({dexModifier >= 0 ? '+' : ''}{dexModifier}) + Misc:</span>
              <Input 
                type="number" 
                value={character.initiativeMiscModifier} 
                onChange={(e) => handleNumericChange('initiativeMiscModifier', e.target.value)}
                className="w-16 h-6 text-xs p-1"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Armor Class */}
        <div>
          <h4 className="text-lg font-semibold mb-2 flex items-center"><Shield className="h-5 w-5 mr-2 text-primary/80" />Armor Class: <span className="text-3xl font-bold text-accent ml-2">{totalAC}</span></h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
            <span>Base: 10</span>
            <span>Dex Mod: {dexModifier >=0 ? '+':''}{dexModifier}</span>
            <span>Size Mod: {sizeModAC >=0 ? '+':''}{sizeModAC}</span>
            <div className="flex items-center gap-1">Armor: <Input type="number" value={character.armorBonus} onChange={(e) => handleNumericChange('armorBonus', e.target.value)} className="w-16 h-7 text-sm p-1" /></div>
            <div className="flex items-center gap-1">Shield: <Input type="number" value={character.shieldBonus} onChange={(e) => handleNumericChange('shieldBonus', e.target.value)} className="w-16 h-7 text-sm p-1" /></div>
            <div className="flex items-center gap-1">Natural: <Input type="number" value={character.naturalArmor} onChange={(e) => handleNumericChange('naturalArmor', e.target.value)} className="w-16 h-7 text-sm p-1" /></div>
            <div className="flex items-center gap-1">Deflection: <Input type="number" value={character.deflectionBonus} onChange={(e) => handleNumericChange('deflectionBonus', e.target.value)} className="w-16 h-7 text-sm p-1" /></div>
            <div className="flex items-center gap-1">Dodge: <Input type="number" value={character.dodgeBonus} onChange={(e) => handleNumericChange('dodgeBonus', e.target.value)} className="w-16 h-7 text-sm p-1" /></div>
            <div className="flex items-center gap-1">Misc: <Input type="number" value={character.acMiscModifier} onChange={(e) => handleNumericChange('acMiscModifier', e.target.value)} className="w-16 h-7 text-sm p-1" /></div>
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
                  <div className="flex items-center gap-1">Magic: <Input type="number" value={character.savingThrows[saveType].magicMod} onChange={(e) => handleSavingThrowChange(saveType, 'magicMod', parseInt(e.target.value, 10) || 0)} className="w-16 h-6 text-xs p-1" /></div>
                  <div className="flex items-center gap-1">Misc: <Input type="number" value={character.savingThrows[saveType].miscMod} onChange={(e) => handleSavingThrowChange(saveType, 'miscMod', parseInt(e.target.value, 10) || 0)} className="w-16 h-6 text-xs p-1" /></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
