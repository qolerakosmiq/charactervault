
'use client';

import * as React from 'react';
import type { Character, ResistanceValue } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldAlert, Waves, Flame, Snowflake, Zap as ElectricityIcon, Atom, Sigma, ShieldCheck, Brain, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { InfoDisplayDialog, type ResistanceBreakdownDetails } from '@/components/InfoDisplayDialog';

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
  const [isInfoDialogOpen, setIsInfoDialogOpen] = React.useState(false);
  const [currentResistanceBreakdown, setCurrentResistanceBreakdown] = React.useState<ResistanceBreakdownDetails | undefined>(undefined);
  
  const energyResistances: Array<{ field: ResistanceField; label: string; Icon: React.ElementType; fieldPrefix?: string }> = [
    { field: 'fireResistance', label: 'Fire', Icon: Flame, fieldPrefix: 'form-res' },
    { field: 'coldResistance', label: 'Cold', Icon: Snowflake, fieldPrefix: 'form-res' },
    { field: 'acidResistance', label: 'Acid', Icon: Atom, fieldPrefix: 'form-res' },
    { field: 'electricityResistance', label: 'Electricity', Icon: ElectricityIcon, fieldPrefix: 'form-res' },
    { field: 'sonicResistance', label: 'Sonic', Icon: Waves, fieldPrefix: 'form-res' },
  ];

  const otherNumericResistances: Array<{ field: ResistanceField; label: string; Icon: React.ElementType; unit?: string; fieldPrefix?: string }> = [
    { field: 'spellResistance', label: 'Spell Resistance', Icon: Sigma, fieldPrefix: 'form-res' },
    { field: 'powerResistance', label: 'Power Resistance', Icon: Brain, fieldPrefix: 'form-res' },
    { field: 'fortification', label: 'Fortification', Icon: ShieldCheck, unit: '%', fieldPrefix: 'form-res' },
  ];

  const handleOpenResistanceInfoDialog = (
    name: string,
    base: number,
    customMod: number,
    total: number
  ) => {
    setCurrentResistanceBreakdown({ name, base, customMod, total });
    setIsInfoDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <ShieldAlert className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-serif">Resistances & Defenses</CardTitle>
          </div>
          <CardDescription>Manage custom modifiers for resistances, DR, and fortification. Base values are often 0 unless granted by race/class/items (future feature).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold mb-3 text-foreground/90">Energy Resistances</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {energyResistances.map(({ field, label, Icon, fieldPrefix }) => {
                const resistance = characterData[field];
                const totalValue = (resistance?.base || 0) + (resistance?.customMod || 0);
                return (
                  <div key={field} className="p-3 border rounded-md bg-card flex flex-col items-center space-y-1 text-center shadow-sm">
                    <Label htmlFor={`${fieldPrefix}-${field}-customMod`} className="text-sm font-medium flex items-center justify-center">
                      <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                      {label}
                    </Label>
                    <div className="flex items-center justify-center">
                      <p className="text-2xl font-bold text-accent min-w-[40px]">
                        {totalValue}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground"
                        onClick={() => handleOpenResistanceInfoDialog(
                          `${label} Resistance`,
                          resistance.base || 0,
                          resistance.customMod || 0,
                          totalValue
                        )}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="w-full max-w-[120px]">
                      <NumberSpinnerInput
                        id={`${fieldPrefix}-${field}-customMod`}
                        value={resistance?.customMod || 0}
                        onChange={(newValue) => onResistanceChange(field, 'customMod', newValue)}
                        min={-50} 
                        max={200}
                        inputClassName="w-full h-8 text-sm text-center"
                        buttonClassName="h-8 w-8"
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
            <h4 className="text-lg font-semibold mb-3 text-foreground/90">Other Defenses</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {otherNumericResistances.map(({ field, label, Icon, unit, fieldPrefix }) => {
                const resistance = characterData[field];
                const totalValue = (resistance?.base || 0) + (resistance?.customMod || 0);
                return (
                  <div key={field} className="p-3 border rounded-md bg-card flex flex-col items-center space-y-1 text-center shadow-sm">
                    <Label htmlFor={`${fieldPrefix}-${field}-customMod`} className="text-sm font-medium flex items-center justify-center">
                      <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                      {label} {unit}
                    </Label>
                    <div className="flex items-center justify-center">
                      <p className="text-2xl font-bold text-accent min-w-[40px]">
                        {totalValue}
                      </p>
                       <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground"
                        onClick={() => handleOpenResistanceInfoDialog(
                          label,
                          resistance.base || 0,
                          resistance.customMod || 0,
                          totalValue
                        )}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </div>
                     <div className="w-full max-w-[120px]">
                      <NumberSpinnerInput
                        id={`${fieldPrefix}-${field}-customMod`}
                        value={resistance?.customMod || 0}
                        onChange={(newValue) => onResistanceChange(field, 'customMod', newValue)}
                        min={0}
                        max={field === 'fortification' ? 100 : 200}
                        inputClassName="w-full h-8 text-sm text-center"
                        buttonClassName="h-8 w-8"
                        buttonSize="sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t space-y-1">
                <Label htmlFor="damageReduction" className="flex items-center text-sm font-medium mb-1">
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
        </CardContent>
      </Card>
      {isInfoDialogOpen && currentResistanceBreakdown && (
        <InfoDisplayDialog
          isOpen={isInfoDialogOpen}
          onOpenChange={setIsInfoDialogOpen}
          title={`${currentResistanceBreakdown.name} Breakdown`}
          resistanceBreakdown={currentResistanceBreakdown}
        />
      )}
    </>
  );
}
