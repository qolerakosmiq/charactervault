
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
// DEFAULT_ABILITIES import is not strictly needed here if we rely on the guard for character.abilityScores
// but can be kept if we want to be hyper-defensive for sub-properties later.

interface ArmorClassPanelProps {
  character?: Character; // Character prop is optional
}

type AcBreakdownDetail = { label: string; value: string | number; isBold?: boolean };

export function ArmorClassPanel({ character }: ArmorClassPanelProps) {
  const [isInfoDialogOpen, setIsInfoDialogOpen] = React.useState(false);
  const [currentInfoDialogData, setCurrentInfoDialogData] = React.useState<{ title: string; detailsList: AcBreakdownDetail[] } | null>(null);

  // Primary guard: If character data is not yet available, or essential parts are missing, show skeletons.
  // This ensures the component doesn't crash and waits for valid data.
  if (!character || !character.abilityScores || !character.size) {
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
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" disabled>
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <Skeleton className="h-8 w-12" />
          </div>
          <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
             <div className="flex items-center">
              <Label htmlFor="touch-ac-display" className="text-lg font-medium">Touch</Label>
               <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" disabled>
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <Skeleton className="h-8 w-12" />
          </div>
          <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
            <div className="flex items-center">
              <Label htmlFor="flat-footed-ac-display" className="text-lg font-medium">Flat-Footed</Label>
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" disabled>
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <Skeleton className="h-8 w-12" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // If we've passed the guard, character, character.abilityScores, and character.size are defined.
  const dexModifier = getAbilityModifierByName(character.abilityScores, 'dexterity');
  const sizeModAC = getSizeModifierAC(character.size);

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
    (character.acMiscModifier || 0); // Dodge applies to touch unless denied for other reasons

  const flatFootedAC = 10 +
    (character.armorBonus || 0) +
    (character.shieldBonus || 0) +
    sizeModAC +
    (character.naturalArmor || 0) +
    (character.deflectionBonus || 0) +
    (character.acMiscModifier || 0); // Dex and Dodge are denied

  const showAcBreakdown = (acType: 'Normal' | 'Touch' | 'Flat-Footed') => {
    const detailsList: AcBreakdownDetail[] = [{ label: 'Base', value: 10 }];
    let totalCalculated = 10;

    // These will use the valid character.abilityScores and character.size from the guarded section
    const breakdownDexModifier = getAbilityModifierByName(character.abilityScores, 'dexterity');
    const breakdownSizeModAC = getSizeModifierAC(character.size);

    if (acType === 'Normal') {
      detailsList.push({ label: 'Dexterity Modifier', value: breakdownDexModifier });
      detailsList.push({ label: 'Size Modifier', value: breakdownSizeModAC });
      detailsList.push({ label: 'Armor Bonus', value: character.armorBonus || 0 });
      detailsList.push({ label: 'Shield Bonus', value: character.shieldBonus || 0 });
      detailsList.push({ label: 'Natural Armor', value: character.naturalArmor || 0 });
      detailsList.push({ label: 'Deflection Bonus', value: character.deflectionBonus || 0 });
      detailsList.push({ label: 'Dodge Bonus', value: character.dodgeBonus || 0 });
      detailsList.push({ label: 'Misc Modifier', value: character.acMiscModifier || 0 });
      totalCalculated = normalAC;
    } else if (acType === 'Touch') {
      detailsList.push({ label: 'Dexterity Modifier', value: breakdownDexModifier }); // Dex applies
      detailsList.push({ label: 'Size Modifier', value: breakdownSizeModAC });
      detailsList.push({ label: 'Deflection Bonus', value: character.deflectionBonus || 0 });
      detailsList.push({ label: 'Dodge Bonus', value: character.dodgeBonus || 0 }); // Dodge applies
      detailsList.push({ label: 'Misc Modifier', value: character.acMiscModifier || 0 });
      totalCalculated = touchAC;
    } else if (acType === 'Flat-Footed') {
      // Dex and Dodge do not apply to Flat-Footed AC
      detailsList.push({ label: 'Size Modifier', value: breakdownSizeModAC });
      detailsList.push({ label: 'Armor Bonus', value: character.armorBonus || 0 });
      detailsList.push({ label: 'Shield Bonus', value: character.shieldBonus || 0 });
      detailsList.push({ label: 'Natural Armor', value: character.naturalArmor || 0 });
      detailsList.push({ label: 'Deflection Bonus', value: character.deflectionBonus || 0 });
      detailsList.push({ label: 'Misc Modifier', value: character.acMiscModifier || 0 });
      totalCalculated = flatFootedAC;
    }
    
    detailsList.push({ label: 'Total', value: totalCalculated, isBold: true });

    setCurrentInfoDialogData({ title: `${acType} AC Breakdown`, detailsList });
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
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={() => showAcBreakdown('Normal')}>
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <p id="normal-ac-display" className="text-3xl font-bold text-accent">{normalAC}</p>
          </div>
          <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
             <div className="flex items-center">
              <Label htmlFor="touch-ac-display" className="text-lg font-medium">Touch</Label>
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={() => showAcBreakdown('Touch')}>
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <p id="touch-ac-display" className="text-3xl font-bold text-accent">{touchAC}</p>
          </div>
          <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
            <div className="flex items-center">
              <Label htmlFor="flat-footed-ac-display" className="text-lg font-medium">Flat-Footed</Label>
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={() => showAcBreakdown('Flat-Footed')}>
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

    