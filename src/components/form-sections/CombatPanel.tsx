
'use client';

import * as React from 'react';
import type { Character, BabBreakdownDetails, InitiativeBreakdownDetails, GrappleModifierBreakdownDetails, GrappleDamageBreakdownDetails } from '@/types/character';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Swords, Info } from 'lucide-react';
import { getAbilityModifierByName, getBab, calculateInitiative, calculateGrapple, getSizeModifierGrapple } from '@/lib/dnd-utils';

interface CombatPanelProps {
  character: Character;
  onCharacterUpdate: (field: keyof Character, value: any) => void;
  onOpenCombatStatInfoDialog: (
    breakdownType: 'bab' | 'initiative' | 'grappleModifier' | 'grappleDamage',
    details: BabBreakdownDetails | InitiativeBreakdownDetails | GrappleModifierBreakdownDetails | GrappleDamageBreakdownDetails
  ) => void;
}

export function CombatPanel({ character, onCharacterUpdate, onOpenCombatStatInfoDialog }: CombatPanelProps) {
  const abilityScores = character.abilityScores || {};
  const classes = character.classes || [];
  const strModifier = getAbilityModifierByName(abilityScores, 'strength');
  const dexModifier = getAbilityModifierByName(abilityScores, 'dexterity');
  const sizeModGrapple = getSizeModifierGrapple(character.size);

  const baseBabArray = getBab(classes);
  const totalBabWithModifier = baseBabArray.map(bab => bab + (character.babMiscModifier || 0));

  const baseInitiative = calculateInitiative(dexModifier, character.initiativeMiscModifier);

  const baseGrappleModifier = calculateGrapple(baseBabArray, strModifier, sizeModGrapple);
  const totalGrappleModifier = baseGrappleModifier + (character.grappleMiscModifier || 0);

  const handleBabInfo = () => {
    const details: BabBreakdownDetails = {
        baseBabFromClasses: baseBabArray,
        miscModifier: character.babMiscModifier || 0,
        totalBab: totalBabWithModifier,
    };
    onOpenCombatStatInfoDialog('bab', details);
  };

  const handleInitiativeInfo = () => {
    const details: InitiativeBreakdownDetails = {
        dexModifier: dexModifier,
        miscModifier: character.initiativeMiscModifier || 0,
        totalInitiative: baseInitiative,
    };
    onOpenCombatStatInfoDialog('initiative', details);
  };

  const handleGrappleModifierInfo = () => {
     const details: GrappleModifierBreakdownDetails = {
        baseAttackBonus: baseBabArray[0] || 0,
        strengthModifier: strModifier,
        sizeModifierGrapple: sizeModGrapple,
        miscModifier: character.grappleMiscModifier || 0,
        totalGrappleModifier: totalGrappleModifier,
    };
    onOpenCombatStatInfoDialog('grappleModifier', details);
  };
  
  const handleGrappleDamageInfo = () => {
    const details: GrappleDamageBreakdownDetails = {
        baseDamage: character.grappleDamage_baseNotes || "Unarmed",
        bonus: character.grappleDamage_bonus || 0,
        strengthModifier: strModifier,
    };
    onOpenCombatStatInfoDialog('grappleDamage', details);
};

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Swords className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl font-serif">Combat Stats</CardTitle>
        </div>
        <CardDescription>Key offensive and grappling statistics.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {/* BAB Sub-panel */}
        <div className="p-3 border rounded-md bg-muted/20 space-y-2 flex flex-col text-center">
          <Label htmlFor="bab-display" className="text-md font-medium block">Base Attack Bonus (BAB)</Label>
          <div className="flex items-center justify-center">
            <p id="bab-display" className="text-2xl font-bold text-accent">
              {totalBabWithModifier.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/')}
            </p>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={handleBabInfo}>
              <Info className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-auto space-y-1">
            <Label htmlFor="bab-custom-mod" className="text-xs text-muted-foreground block">Custom Modifier</Label>
            <div className="flex justify-center">
              <NumberSpinnerInput
                id="bab-custom-mod"
                value={character.babMiscModifier || 0}
                onChange={(val) => onCharacterUpdate('babMiscModifier', val)}
                min={-20} // Max removed
                inputClassName="h-8 text-sm w-20" // Width increased
                buttonClassName="h-8 w-8"
              />
            </div>
          </div>
        </div>

        {/* Initiative Sub-panel */}
        <div className="p-3 border rounded-md bg-muted/20 space-y-2 flex flex-col text-center">
          <Label htmlFor="initiative-display" className="text-md font-medium block">Initiative</Label>
           <div className="flex items-center justify-center">
            <p id="initiative-display" className="text-2xl font-bold text-accent">
              {baseInitiative >= 0 ? '+' : ''}{baseInitiative}
            </p>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={handleInitiativeInfo}>
              <Info className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-auto space-y-1">
            <Label htmlFor="initiative-custom-mod" className="text-xs text-muted-foreground block">Custom Modifier</Label>
            <div className="flex justify-center">
              <NumberSpinnerInput
                id="initiative-custom-mod"
                value={character.initiativeMiscModifier || 0}
                onChange={(val) => onCharacterUpdate('initiativeMiscModifier', val)}
                min={-20} // Max removed
                inputClassName="h-8 text-sm w-20" // Width increased
                buttonClassName="h-8 w-8"
              />
            </div>
          </div>
        </div>
        
        {/* Grapple Modifier Sub-panel */}
        <div className="p-3 border rounded-md bg-muted/20 space-y-2 flex flex-col text-center">
          <Label htmlFor="grapple-mod-display" className="text-md font-medium block">Grapple Modifier</Label>
          <div className="flex items-center justify-center">
            <p id="grapple-mod-display" className="text-2xl font-bold text-accent">
              {totalGrappleModifier >= 0 ? '+' : ''}{totalGrappleModifier}
            </p>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={handleGrappleModifierInfo}>
              <Info className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-auto space-y-1">
            <Label htmlFor="grapple-custom-mod" className="text-xs text-muted-foreground block">Custom Modifier</Label>
            <div className="flex justify-center">
              <NumberSpinnerInput
                id="grapple-custom-mod"
                value={character.grappleMiscModifier || 0}
                onChange={(val) => onCharacterUpdate('grappleMiscModifier', val)}
                min={-20} // Max removed
                inputClassName="h-8 text-sm w-20" // Width increased
                buttonClassName="h-8 w-8"
              />
            </div>
          </div>
        </div>

        {/* Grapple Damage Sub-panel */}
        <div className="p-3 border rounded-md bg-muted/20 space-y-2 flex flex-col text-center">
            <Label htmlFor="grapple-damage-display" className="text-md font-medium block">Grapple Damage</Label>
            <div className="flex items-center justify-center">
                <p id="grapple-damage-display" className="text-xl font-semibold text-accent">
                    {character.grappleDamage_baseNotes || 'Unarmed'}
                    {(character.grappleDamage_bonus || 0) !== 0 ? ` ${character.grappleDamage_bonus! >= 0 ? '+' : ''}${character.grappleDamage_bonus}` : ''}
                </p>
                 <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={handleGrappleDamageInfo}>
                    <Info className="h-4 w-4" />
                </Button>
            </div>
            <div className="mt-auto space-y-2">
                <div className="space-y-1">
                    <Label htmlFor="grapple-damage-base" className="text-xs text-muted-foreground block">Base / Notes</Label>
                    <div className="flex justify-center">
                      <Input
                          id="grapple-damage-base"
                          value={character.grappleDamage_baseNotes || ''}
                          onChange={(e) => onCharacterUpdate('grappleDamage_baseNotes', e.target.value)}
                          placeholder="e.g., 1d3, Unarmed"
                          className="h-8 text-sm max-w-[150px]" 
                      />
                    </div>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="grapple-damage-bonus" className="text-xs text-muted-foreground block">Numeric Bonus</Label>
                    <div className="flex justify-center">
                      <NumberSpinnerInput
                          id="grapple-damage-bonus"
                          value={character.grappleDamage_bonus || 0}
                          onChange={(val) => onCharacterUpdate('grappleDamage_bonus', val)}
                          min={-20} // Max removed
                          inputClassName="h-8 text-sm w-20" // Width increased
                          buttonClassName="h-8 w-8"
                      />
                    </div>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
