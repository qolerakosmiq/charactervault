
'use client';

import *as React from 'react';
import type { Character, InfoDialogContentType } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
// InfoDisplayDialog import removed
import { getAbilityModifierByName, getSizeModifierAC } from '@/lib/dnd-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { DEFAULT_ABILITIES, SIZES } from '@/types/character';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Separator } from '@/components/ui/separator';

interface ArmorClassPanelProps {
  character?: Character;
  onCharacterUpdate?: (field: keyof Character, value: any) => void;
  onOpenAcBreakdownDialog?: (acType: 'Normal' | 'Touch' | 'Flat-Footed') => void; // New prop
}

export function ArmorClassPanel({ character, onCharacterUpdate, onOpenAcBreakdownDialog }: ArmorClassPanelProps) {
  // Local state for InfoDisplayDialog removed

  if (!character) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-serif">Armor Class</CardTitle>
          </div>
          <CardDescription>Details about your character's defenses.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
            <div className="flex items-center">
              <Label htmlFor="normal-ac-display" className="text-lg font-medium">Normal</Label>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" disabled>
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <Skeleton className="h-8 w-12" />
          </div>
          <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
             <div className="flex items-center">
              <Label htmlFor="touch-ac-display" className="text-lg font-medium">Touch</Label>
               <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" disabled>
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <Skeleton className="h-8 w-12" />
          </div>
          <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
            <div className="flex items-center">
              <Label htmlFor="flat-footed-ac-display" className="text-lg font-medium">Flat-Footed</Label>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" disabled>
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <Skeleton className="h-8 w-12" />
          </div>
          <Separator className="my-3" />
          <div className="flex items-center justify-between pt-2">
            <Label htmlFor="custom-ac-mod-display" className="text-sm font-medium">Custom Modifier</Label>
            <NumberSpinnerInput
              id="custom-ac-mod-display"
              value={0}
              onChange={() => {}}
              disabled={true}
              inputClassName="w-24 h-9 text-base"
              buttonClassName="h-9 w-9"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentAbilityScores = character.abilityScores || DEFAULT_ABILITIES;
  const currentSize = character.size || 'medium';

  const dexModifier = getAbilityModifierByName(currentAbilityScores, 'dexterity');
  const sizeModAC = getSizeModifierAC(currentSize);

  const normalAC = 10 +
    (character.armorBonus || 0) +
    (character.shieldBonus || 0) +
    dexModifier +
    sizeModAC +
    (character.naturalArmor || 0) +
    (character.deflectionBonus || 0) +
    (character.dodgeBonus || 0) +
    (character.acMiscModifier || 0);

  const touchAC = 10 +
    dexModifier +
    sizeModAC +
    (character.deflectionBonus || 0) +
    (character.dodgeBonus || 0) +
    (character.acMiscModifier || 0);

  const flatFootedAC = 10 +
    (character.armorBonus || 0) +
    (character.shieldBonus || 0) +
    sizeModAC +
    (character.naturalArmor || 0) +
    (character.deflectionBonus || 0) +
    (character.acMiscModifier || 0);


  const handleShowAcBreakdown = (acType: 'Normal' | 'Touch' | 'Flat-Footed') => {
    if (onOpenAcBreakdownDialog) {
      onOpenAcBreakdownDialog(acType);
    }
  };

  const isEditable = !!onCharacterUpdate;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-serif">Armor Class</CardTitle>
          </div>
          <CardDescription>Details about your character's defenses.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
            <div className="flex items-center">
              <Label htmlFor="normal-ac-display" className="text-lg font-medium">Normal</Label>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={() => handleShowAcBreakdown('Normal')} disabled={!onOpenAcBreakdownDialog}>
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <p id="normal-ac-display" className="text-3xl font-bold text-accent">{normalAC}</p>
          </div>
          <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
             <div className="flex items-center">
              <Label htmlFor="touch-ac-display" className="text-lg font-medium">Touch</Label>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={() => handleShowAcBreakdown('Touch')} disabled={!onOpenAcBreakdownDialog}>
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <p id="touch-ac-display" className="text-3xl font-bold text-accent">{touchAC}</p>
          </div>
          <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
            <div className="flex items-center">
              <Label htmlFor="flat-footed-ac-display" className="text-lg font-medium">Flat-Footed</Label>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={() => handleShowAcBreakdown('Flat-Footed')} disabled={!onOpenAcBreakdownDialog}>
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <p id="flat-footed-ac-display" className="text-3xl font-bold text-accent">{flatFootedAC}</p>
          </div>

          <Separator className="my-3" />
          <div className="flex items-center justify-between pt-2">
            <Label htmlFor="ac-misc-modifier-input" className="text-sm font-medium">Custom Modifier</Label>
            <NumberSpinnerInput
              id="ac-misc-modifier-input"
              value={character.acMiscModifier || 0}
              onChange={(newValue) => {
                if (onCharacterUpdate) {
                  onCharacterUpdate('acMiscModifier', newValue);
                }
              }}
              disabled={!isEditable}
              min={-20}
              max={20}
              inputClassName="w-24 h-9 text-base"
              buttonClassName="h-9 w-9"
            />
          </div>
        </CardContent>
      </Card>
      {/* InfoDisplayDialog rendering removed, handled by parent */}
    </>
  );
}
