
'use client';

import * as React from 'react';
import type { Character } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { InfoDisplayDialog } from '@/components/InfoDisplayDialog';
import { getAbilityModifierByName, getSizeModifierAC } from '@/lib/dnd-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { DEFAULT_ABILITIES, SIZES } from '@/types/character';

interface ArmorClassPanelProps {
  character?: Character;
}

type AcBreakdownDetail = { label: string; value: string | number; isBold?: boolean };

export function ArmorClassPanel({ character }: ArmorClassPanelProps) {
  const [isInfoDialogOpen, setIsInfoDialogOpen] = React.useState(false);
  const [currentInfoDialogData, setCurrentInfoDialogData] = React.useState<{ title: string; detailsList: AcBreakdownDetail[] } | null>(null);

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
    dexModifier + // Dex applies to touch
    sizeModAC +
    (character.deflectionBonus || 0) +
    (character.dodgeBonus || 0) + // Dodge applies to touch
    (character.acMiscModifier || 0);

  const flatFootedAC = 10 +
    (character.armorBonus || 0) +
    (character.shieldBonus || 0) +
    sizeModAC + // Dex is denied
    (character.naturalArmor || 0) +
    (character.deflectionBonus || 0) +
    // Dodge bonus is also denied
    (character.acMiscModifier || 0);


  const showAcBreakdown = (acType: 'Normal' | 'Touch' | 'Flat-Footed') => {
    const detailsList: AcBreakdownDetail[] = [{ label: 'Base', value: 10 }];
    let totalCalculated = 10;

    const breakdownDexModifier = getAbilityModifierByName(currentAbilityScores, 'dexterity');
    const breakdownSizeModAC = getSizeModifierAC(currentSize);
    const sizeLabel = SIZES.find(s => s.value === currentSize)?.label || currentSize;

    // Dexterity Modifier (conditional: not for Flat-Footed)
    if (acType === 'Normal' || acType === 'Touch') {
      detailsList.push({ label: 'Dexterity Modifier', value: breakdownDexModifier });
    }
    
    // Size Modifier (always shown)
    detailsList.push({ label: `Size Modifier (${sizeLabel})`, value: breakdownSizeModAC });

    // Armor, Shield, Natural Armor (not for Touch AC)
    if (acType === 'Normal' || acType === 'Flat-Footed') {
      if (character.armorBonus || 0) detailsList.push({ label: 'Armor Bonus', value: character.armorBonus || 0 });
      if (character.shieldBonus || 0) detailsList.push({ label: 'Shield Bonus', value: character.shieldBonus || 0 });
      if (character.naturalArmor || 0) detailsList.push({ label: 'Natural Armor', value: character.naturalArmor || 0 });
    }

    // Deflection Bonus (applies to all)
    if (character.deflectionBonus || 0) detailsList.push({ label: 'Deflection Bonus', value: character.deflectionBonus || 0 });
    
    // Dodge Bonus (not for Flat-Footed AC)
    if (acType === 'Normal' || acType === 'Touch') {
      if (character.dodgeBonus || 0) detailsList.push({ label: 'Dodge Bonus', value: character.dodgeBonus || 0 });
    }
    
    // Misc Modifier (applies to all)
    if (character.acMiscModifier || 0) detailsList.push({ label: 'Misc Modifier', value: character.acMiscModifier || 0 });
    
    if (acType === 'Normal') totalCalculated = normalAC;
    else if (acType === 'Touch') totalCalculated = touchAC;
    else if (acType === 'Flat-Footed') totalCalculated = flatFootedAC;
    
    detailsList.push({ label: 'Total', value: totalCalculated, isBold: true });

    setCurrentInfoDialogData({ title: `${acType} Armor Class Breakdown`, detailsList });
    setIsInfoDialogOpen(true);
  };

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
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={() => showAcBreakdown('Normal')}>
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <p id="normal-ac-display" className="text-3xl font-bold text-accent">{normalAC}</p>
          </div>
          <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
             <div className="flex items-center">
              <Label htmlFor="touch-ac-display" className="text-lg font-medium">Touch</Label>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={() => showAcBreakdown('Touch')}>
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <p id="touch-ac-display" className="text-3xl font-bold text-accent">{touchAC}</p>
          </div>
          <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
            <div className="flex items-center">
              <Label htmlFor="flat-footed-ac-display" className="text-lg font-medium">Flat-Footed</Label>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={() => showAcBreakdown('Flat-Footed')}>
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <p id="flat-footed-ac-display" className="text-3xl font-bold text-accent">{flatFootedAC}</p>
          </div>
        </CardContent>
      </Card>
      {currentInfoDialogData && (
        <InfoDisplayDialog
          isOpen={isInfoDialogOpen}
          onOpenChange={setIsInfoDialogOpen}
          title={currentInfoDialogData.title}
          detailsList={currentInfoDialogData.detailsList}
        />
      )}
    </>
  );
}

