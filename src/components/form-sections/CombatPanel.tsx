
'use client';

import * as React from 'react';
import type { Character, AbilityScores, BabBreakdownDetails, InitiativeBreakdownDetails, GrappleModifierBreakdownDetails, GrappleDamageBreakdownDetails } from '@/types/character';
import { DND_CLASSES } from '@/types/character';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Separator } from '@/components/ui/separator';
import { Swords, Zap as InitiativeIcon, Grip, Info } from 'lucide-react'; // Using Grip for Grapple
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
  // Note: initiativeMiscModifier is already part of character, no separate custom mod needed for total display here.

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
        totalInitiative: baseInitiative, // baseInitiative already includes miscMod
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
        strengthModifier: strModifier, // Assuming Str mod applies to grapple damage
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
      <CardContent className="space-y-6">
        {/* BAB */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] items-end gap-x-4 gap-y-2 p-3 border rounded-md bg-muted/5">
          <div className="flex-grow">
            <Label htmlFor="bab-display" className="text-md font-medium">Base Attack Bonus (BAB)</Label>
            <p id="bab-display" className="text-2xl font-bold text-accent">
              {totalBabWithModifier.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/')}
            </p>
          </div>
          <div className="flex flex-col items-start space-y-1">
            <Label htmlFor="bab-misc-mod" className="text-xs text-muted-foreground whitespace-nowrap">Misc Modifier</Label>
            <NumberSpinnerInput
              id="bab-misc-mod"
              value={character.babMiscModifier || 0}
              onChange={(val) => onCharacterUpdate('babMiscModifier', val)}
              min={-20} max={20}
              inputClassName="w-16 h-8 text-sm"
              buttonClassName="h-8 w-8"
            />
          </div>
           <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-foreground self-end" onClick={handleBabInfo}>
             <Info className="h-5 w-5" />
           </Button>
        </div>

        <Separator/>

        {/* Initiative */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] items-end gap-x-4 gap-y-2 p-3 border rounded-md bg-muted/5">
          <div className="flex-grow">
            <Label htmlFor="initiative-display" className="text-md font-medium">Initiative</Label>
            <p id="initiative-display" className="text-2xl font-bold text-accent">
              {baseInitiative >= 0 ? '+' : ''}{baseInitiative}
            </p>
          </div>
          <div className="flex flex-col items-start space-y-1">
            <Label htmlFor="initiative-misc-mod" className="text-xs text-muted-foreground whitespace-nowrap">Misc Modifier</Label>
            <NumberSpinnerInput
              id="initiative-misc-mod"
              value={character.initiativeMiscModifier || 0}
              onChange={(val) => onCharacterUpdate('initiativeMiscModifier', val)}
              min={-20} max={20}
              inputClassName="w-16 h-8 text-sm"
              buttonClassName="h-8 w-8"
            />
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-foreground self-end" onClick={handleInitiativeInfo}>
            <Info className="h-5 w-5" />
          </Button>
        </div>
        
        <Separator/>

        {/* Grapple Modifier */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] items-end gap-x-4 gap-y-2 p-3 border rounded-md bg-muted/5">
          <div className="flex-grow">
            <Label htmlFor="grapple-mod-display" className="text-md font-medium">Grapple Modifier</Label>
            <p id="grapple-mod-display" className="text-2xl font-bold text-accent">
              {totalGrappleModifier >= 0 ? '+' : ''}{totalGrappleModifier}
            </p>
          </div>
          <div className="flex flex-col items-start space-y-1">
            <Label htmlFor="grapple-misc-mod" className="text-xs text-muted-foreground whitespace-nowrap">Misc Modifier</Label>
            <NumberSpinnerInput
              id="grapple-misc-mod"
              value={character.grappleMiscModifier || 0}
              onChange={(val) => onCharacterUpdate('grappleMiscModifier', val)}
              min={-20} max={20}
              inputClassName="w-16 h-8 text-sm"
              buttonClassName="h-8 w-8"
            />
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-foreground self-end" onClick={handleGrappleModifierInfo}>
            <Info className="h-5 w-5" />
          </Button>
        </div>

        <Separator/>

        {/* Grapple Damage */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] items-end gap-x-4 gap-y-2 p-3 border rounded-md bg-muted/5">
            <div className="md:col-span-2 flex-grow">
                 <Label htmlFor="grapple-damage-display" className="text-md font-medium">Grapple Damage</Label>
                 <p id="grapple-damage-display" className="text-lg font-semibold text-accent">
                    {character.grappleDamage_baseNotes || 'Unarmed'}
                    {(character.grappleDamage_bonus || 0) !== 0 ? ` ${character.grappleDamage_bonus! >= 0 ? '+' : ''}${character.grappleDamage_bonus}` : ''}
                </p>
            </div>
            <div className="flex flex-col items-start space-y-1">
                <Label htmlFor="grapple-damage-base" className="text-xs text-muted-foreground whitespace-nowrap">Base / Notes</Label>
                <Input
                    id="grapple-damage-base"
                    value={character.grappleDamage_baseNotes || ''}
                    onChange={(e) => onCharacterUpdate('grappleDamage_baseNotes', e.target.value)}
                    placeholder="e.g., 1d3, Unarmed"
                    className="h-8 text-sm w-full" 
                />
            </div>
            <div className="flex flex-col items-start space-y-1">
                 <Label htmlFor="grapple-damage-bonus" className="text-xs text-muted-foreground whitespace-nowrap">Numeric Bonus</Label>
                <NumberSpinnerInput
                    id="grapple-damage-bonus"
                    value={character.grappleDamage_bonus || 0}
                    onChange={(val) => onCharacterUpdate('grappleDamage_bonus', val)}
                    min={-20} max={20}
                    inputClassName="w-16 h-8 text-sm"
                    buttonClassName="h-8 w-8"
                />
            </div>
             <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-foreground self-end md:col-start-4" onClick={handleGrappleDamageInfo}>
                <Info className="h-5 w-5" />
            </Button>
        </div>

      </CardContent>
    </Card>
  );
}
