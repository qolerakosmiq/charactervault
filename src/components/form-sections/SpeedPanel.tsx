
'use client';

import * as React from 'react';
import type { Character, SpeedType, SpeedDetails, InfoDialogContentType, DndRaceOption, DndClassOption } from '@/types/character';
import { DND_RACES, DND_CLASSES, calculateSpeedBreakdown } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Wind, Waves, MoveVertical, Shell, Feather, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface SpeedPanelProps {
  character: Character;
  onCharacterUpdate: (field: keyof Character | `landSpeed.miscModifier` | `burrowSpeed.miscModifier` | `climbSpeed.miscModifier` | `flySpeed.miscModifier` | `swimSpeed.miscModifier`, value: any) => void;
  onOpenSpeedInfoDialog: (speedType: SpeedType) => void;
}

const speedTypesConfig: Array<{
  type: SpeedType;
  label: string;
  Icon: React.ElementType;
  fieldKey: keyof Pick<Character, 'landSpeed' | 'burrowSpeed' | 'climbSpeed' | 'flySpeed' | 'swimSpeed'>;
}> = [
  { type: 'land', label: 'Land', Icon: Wind, fieldKey: 'landSpeed' },
  { type: 'burrow', label: 'Burrow', Icon: Shell, fieldKey: 'burrowSpeed' },
  { type: 'climb', label: 'Climb', Icon: MoveVertical, fieldKey: 'climbSpeed' },
  { type: 'fly', label: 'Fly', Icon: Feather, fieldKey: 'flySpeed' },
  { type: 'swim', label: 'Swim', Icon: Waves, fieldKey: 'swimSpeed' },
];

export function SpeedPanel({ character, onCharacterUpdate, onOpenSpeedInfoDialog }: SpeedPanelProps) {

  const handleMiscModifierChange = (speedType: SpeedType, newValue: number) => {
    const fieldKey = `${speedType}Speed.miscModifier` as const;
    onCharacterUpdate(fieldKey, newValue);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Wind className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl font-serif">Movement Speeds</CardTitle>
        </div>
        <CardDescription>Manage your character's various movement capabilities and penalties.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {speedTypesConfig.map(({ type, label, Icon, fieldKey }) => {
            const speedData = calculateSpeedBreakdown(type, character, DND_RACES, DND_CLASSES);
            const currentMiscMod = character[fieldKey]?.miscModifier || 0;

            return (
              <div key={type} className="p-3 border rounded-md bg-card flex flex-col items-center space-y-1.5 text-center shadow-sm">
                <div className="flex items-center justify-center">
                  <Icon className="h-5 w-5 mr-1.5 text-muted-foreground" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <div className="flex items-center justify-center">
                  <p className="text-3xl font-bold text-accent min-w-[50px] text-center">
                    {speedData.total}<span className="text-base font-normal text-muted-foreground ml-1">ft.</span>
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground"
                    onClick={() => onOpenSpeedInfoDialog(type)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
                <div className="w-full max-w-[140px]">
                  <Label htmlFor={`speed-misc-${type}`} className="text-xs text-muted-foreground">Misc Modifier</Label>
                  <NumberSpinnerInput
                    id={`speed-misc-${type}`}
                    value={currentMiscMod}
                    onChange={(newValue) => handleMiscModifierChange(type, newValue)}
                    min={-100} // Arbitrary reasonable min
                    max={100}  // Arbitrary reasonable max
                    step={1.5} // As requested
                    inputClassName="w-20 h-8 text-sm text-center"
                    buttonClassName="h-8 w-8"
                    buttonSize="sm"
                    className="justify-center mt-0.5"
                  />
                </div>
              </div>
            );
          })}
        </div>
        <Separator className="my-6" />
        <div>
            <h4 className="text-md font-semibold mb-3 text-foreground/90">Global Speed Penalties</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div className="space-y-1">
                    <Label htmlFor="armor-speed-penalty">Armor Penalty (ft.)</Label>
                    <NumberSpinnerInput
                        id="armor-speed-penalty"
                        value={character.armorSpeedPenalty || 0}
                        onChange={(val) => onCharacterUpdate('armorSpeedPenalty', val)}
                        min={0}
                        step={5}
                        inputClassName="w-24 h-9 text-base"
                        buttonClassName="h-9 w-9"
                    />
                     <p className="text-xs text-muted-foreground">Penalty to land speed from armor worn.</p>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="load-speed-penalty">Load Penalty (ft.)</Label>
                     <NumberSpinnerInput
                        id="load-speed-penalty"
                        value={character.loadSpeedPenalty || 0}
                        onChange={(val) => onCharacterUpdate('loadSpeedPenalty', val)}
                        min={0}
                        step={5}
                        inputClassName="w-24 h-9 text-base"
                        buttonClassName="h-9 w-9"
                    />
                     <p className="text-xs text-muted-foreground">Penalty to land speed from encumbrance.</p>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
