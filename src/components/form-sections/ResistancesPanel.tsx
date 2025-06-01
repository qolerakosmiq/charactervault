
'use client';

import * as React from 'react';
import type { Character, ResistanceValue } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldAlert, Waves, Flame, Snowflake, Zap as ElectricityIcon, Atom, Sigma, ShieldCheck, Brain } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Separator } from '@/components/ui/separator';

type ResistanceField = Exclude<keyof Pick<Character,
  'fireResistance' | 'coldResistance' | 'acidResistance' | 'electricityResistance' | 'sonicResistance' |
  'spellResistance' | 'powerResistance' | 'fortification'
>, 'damageReduction'>;


interface ResistancesPanelProps {
  characterData: {
    fireResistance: ResistanceValue;
    coldResistance: ResistanceValue;
    acidResistance: ResistanceValue;
    electricityResistance: ResistanceValue;
    sonicResistance: ResistanceValue;
    spellResistance: ResistanceValue;
    powerResistance: ResistanceValue;
    damageReduction: string;
    fortification: ResistanceValue;
  };
  onResistanceChange: (field: ResistanceField, subField: 'customMod', value: number) => void;
  onDamageReductionChange: (value: string) => void;
}

export function ResistancesPanel({ characterData, onResistanceChange, onDamageReductionChange }: ResistancesPanelProps) {
  
  const energyResistances: Array<{ field: ResistanceField; label: string; Icon: React.ElementType }> = [
    { field: 'fireResistance', label: 'Fire', Icon: Flame },
    { field: 'coldResistance', label: 'Cold', Icon: Snowflake },
    { field: 'acidResistance', label: 'Acid', Icon: Atom },
    { field: 'electricityResistance', label: 'Electricity', Icon: ElectricityIcon },
    { field: 'sonicResistance', label: 'Sonic', Icon: Waves },
  ];

  const otherNumericResistances: Array<{ field: ResistanceField; label: string; Icon: React.ElementType; unit?: string }> = [
    { field: 'spellResistance', label: 'Spell Resistance', Icon: Sigma },
    { field: 'powerResistance', label: 'Power Resistance', Icon: Brain },
    { field: 'fortification', label: 'Fortification', Icon: ShieldCheck, unit: '%' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <ShieldAlert className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl font-serif">Resistances & Defenses</CardTitle>
        </div>
        <CardDescription>Manage your character's special defenses. Input custom/temporary modifiers below.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-lg font-semibold mb-2 text-foreground/90">Energy Resistances</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-3">
            {energyResistances.map(({ field, label, Icon }) => {
              const resistance = characterData[field];
              const totalValue = (resistance?.base || 0) + (resistance?.customMod || 0);
              return (
                <div key={field} className="space-y-1">
                  <Label htmlFor={`${field}-customMod`} className="flex items-center text-sm">
                    <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                    {label}
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-accent p-1 min-w-[30px] text-center">
                      {totalValue}
                    </span>
                    <NumberSpinnerInput
                      id={`${field}-customMod`}
                      value={resistance?.customMod || 0}
                      onChange={(newValue) => onResistanceChange(field, 'customMod', newValue)}
                      min={-50} // Allow negative custom mods if needed
                      max={200}
                      inputClassName="w-full h-9 text-sm"
                      buttonClassName="h-9 w-9"
                      buttonSize="sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="text-lg font-semibold mb-2 text-foreground/90">Other Defenses</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
            {otherNumericResistances.map(({ field, label, Icon, unit }) => {
              const resistance = characterData[field];
              const totalValue = (resistance?.base || 0) + (resistance?.customMod || 0);
              return (
                <div key={field} className="space-y-1">
                  <Label htmlFor={`${field}-customMod`} className="flex items-center text-sm">
                    <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                    {label} {unit}
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-accent p-1 min-w-[30px] text-center">
                      {totalValue}
                    </span>
                    <NumberSpinnerInput
                      id={`${field}-customMod`}
                      value={resistance?.customMod || 0}
                      onChange={(newValue) => onResistanceChange(field, 'customMod', newValue)}
                      min={0}
                      max={field === 'fortification' ? 100 : 200}
                      inputClassName="w-full h-9 text-sm"
                      buttonClassName="h-9 w-9"
                      buttonSize="sm"
                    />
                  </div>
                </div>
              );
            })}
            <div className="space-y-1 sm:col-span-2 md:col-span-1">
              <Label htmlFor="damageReduction" className="flex items-center text-sm">
                <ShieldAlert className="h-4 w-4 mr-2 text-muted-foreground" /> Damage Reduction
              </Label>
              <Input
                id="damageReduction"
                value={characterData.damageReduction || ''}
                onChange={(e) => onDamageReductionChange(e.target.value)}
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

    