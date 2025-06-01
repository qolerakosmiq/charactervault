
'use client';

import * as React from 'react';
import type { Character } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { InfoDisplayDialog } from '@/components/InfoDisplayDialog';
import { getAbilityModifierByName, getSizeModifierAC } from '@/lib/dnd-utils';

interface ArmorClassPanelProps {
  character: Character; 
}

type AcBreakdownDetail = { label: string; value: string | number; isBold?: boolean };

export function ArmorClassPanel({ character }: ArmorClassPanelProps) {
  const [isInfoDialogOpen, setIsInfoDialogOpen] = React.useState(false);
  const [currentInfoDialogData, setCurrentInfoDialogData] = React.useState<{ title: string; detailsList: AcBreakdownDetail[] } | null>(null);

  // Calculations will proceed assuming 'character', 'character.abilityScores', and 'character.size' are defined,
  // as per the 'Character' type and the expectation that the parent component provides a valid object.
  const dexModifier = getAbilityModifierByName(character.abilityScores, 'dexterity');
  const sizeModAC = getSizeModifierAC(character.size);

  // Calculate Normal AC
  const normalAC = 10 +
    (character.armorBonus || 0) +
    (character.shieldBonus || 0) +
    dexModifier +
    sizeModAC +
    (character.naturalArmor || 0) +
    (character.deflectionBonus || 0) +
    (character.dodgeBonus || 0) +
    (character.acMiscModifier || 0);

  // Calculate Touch AC
  const touchAC = 10 +
    dexModifier +
    sizeModAC +
    (character.deflectionBonus || 0) +
    (character.dodgeBonus || 0) +
    (character.acMiscModifier || 0);

  // Calculate Flat-Footed AC
  const flatFootedAC = 10 +
    (character.armorBonus || 0) +
    (character.shieldBonus || 0) +
    sizeModAC +
    (character.naturalArmor || 0) +
    (character.deflectionBonus || 0) +
    (character.acMiscModifier || 0);

  const showAcBreakdown = (acType: 'Normal' | 'Touch' | 'Flat-Footed') => {
    // No need to check character, abilityScores, or size here if the prop contract is met
    const detailsList: AcBreakdownDetail[] = [{ label: 'Base', value: 10 }];
    let totalCalculated = 10;

    if (acType === 'Normal') {
      detailsList.push({ label: 'Dexterity Modifier', value: dexModifier });
      detailsList.push({ label: 'Size Modifier', value: sizeModAC });
      detailsList.push({ label: 'Armor Bonus', value: character.armorBonus || 0 });
      detailsList.push({ label: 'Shield Bonus', value: character.shieldBonus || 0 });
      detailsList.push({ label: 'Natural Armor', value: character.naturalArmor || 0 });
      detailsList.push({ label: 'Deflection Bonus', value: character.deflectionBonus || 0 });
      detailsList.push({ label: 'Dodge Bonus', value: character.dodgeBonus || 0 });
      detailsList.push({ label: 'Misc Modifier', value: character.acMiscModifier || 0 });
      totalCalculated = normalAC;
    } else if (acType === 'Touch') {
      detailsList.push({ label: 'Dexterity Modifier', value: dexModifier });
      detailsList.push({ label: 'Size Modifier', value: sizeModAC });
      detailsList.push({ label: 'Deflection Bonus', value: character.deflectionBonus || 0 });
      detailsList.push({ label: 'Dodge Bonus', value: character.dodgeBonus || 0 });
      detailsList.push({ label: 'Misc Modifier', value: character.acMiscModifier || 0 });
      totalCalculated = touchAC;
    } else if (acType === 'Flat-Footed') {
      detailsList.push({ label: 'Size Modifier', value: sizeModAC });
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
