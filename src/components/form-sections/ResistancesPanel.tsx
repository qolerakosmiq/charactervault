
'use client';

import * as React from 'react';
import type { Character } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldAlert, Waves, Flame, Snowflake, Zap as ElectricityIcon, Atom, Sigma } from 'lucide-react'; // Using more distinct icons
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Separator } from '@/components/ui/separator';

interface ResistancesPanelProps {
  characterData: Pick<
    Character,
    | 'fireResistance' | 'coldResistance' | 'acidResistance' | 'electricityResistance' | 'sonicResistance'
    | 'spellResistance' | 'damageReduction' | 'fortification'
  >;
  onFieldChange: (field: keyof Character, value: any) => void;
}

export function ResistancesPanel({ characterData, onFieldChange }: ResistancesPanelProps) {
  const energyResistances: Array<{ field: keyof Character; label: string; Icon: React.ElementType }> = [
    { field: 'fireResistance', label: 'Fire', Icon: Flame },
    { field: 'coldResistance', label: 'Cold', Icon: Snowflake },
    { field: 'acidResistance', label: 'Acid', Icon: Atom }, // Replaced Waves with Atom for Acid
    { field: 'electricityResistance', label: 'Electricity', Icon: ElectricityIcon },
    { field: 'sonicResistance', label: 'Sonic', Icon: Waves }, // Using Waves for Sonic
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <ShieldAlert className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl font-serif">Resistances & Defenses</CardTitle>
        </div>
        <CardDescription>Manage your character's special defenses.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-lg font-semibold mb-2 text-foreground/90">Energy Resistances</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
            {energyResistances.map(({ field, label, Icon }) => (
              <div key={field} className="space-y-1">
                <Label htmlFor={field} className="flex items-center text-sm">
                  <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                  {label}
                </Label>
                <NumberSpinnerInput
                  id={field}
                  value={characterData[field as keyof typeof characterData] as number || 0}
                  onChange={(newValue) => onFieldChange(field, newValue)}
                  min={0}
                  max={200} // Arbitrary max
                  inputClassName="w-full h-9 text-sm"
                  buttonClassName="h-9 w-9"
                  buttonSize="sm"
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="text-lg font-semibold mb-2 text-foreground/90">Other Defenses</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
            <div className="space-y-1">
              <Label htmlFor="spellResistance" className="flex items-center text-sm">
                <Sigma className="h-4 w-4 mr-2 text-muted-foreground" /> Spell Resistance
              </Label>
              <NumberSpinnerInput
                id="spellResistance"
                value={characterData.spellResistance || 0}
                onChange={(newValue) => onFieldChange('spellResistance', newValue)}
                min={0}
                max={100} // Arbitrary max
                inputClassName="w-full h-9 text-sm"
                buttonClassName="h-9 w-9"
                buttonSize="sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fortification" className="flex items-center text-sm">
                <ShieldCheck className="h-4 w-4 mr-2 text-muted-foreground" /> Fortification (%)
              </Label>
              <NumberSpinnerInput
                id="fortification"
                value={characterData.fortification || 0}
                onChange={(newValue) => onFieldChange('fortification', newValue)}
                min={0}
                max={100}
                inputClassName="w-full h-9 text-sm"
                buttonClassName="h-9 w-9"
                buttonSize="sm"
              />
            </div>
             <div className="space-y-1 sm:col-span-2 md:col-span-1"> {/* Allow DR to span more if needed */}
              <Label htmlFor="damageReduction" className="flex items-center text-sm">
                <ShieldAlert className="h-4 w-4 mr-2 text-muted-foreground" /> Damage Reduction
              </Label>
              <Input
                id="damageReduction"
                value={characterData.damageReduction || ''}
                onChange={(e) => onFieldChange('damageReduction', e.target.value)}
                placeholder="e.g., 5/magic"
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
