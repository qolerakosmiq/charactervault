
'use client';

import *as React from 'react';
import type { Character, SpeedType, SpeedDetails, InfoDialogContentType, DndRaceOption, DndClassOption } from '@/types/character';
import { calculateSpeedBreakdown } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Wind, Waves, MoveVertical, Shell, Feather, Info, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';

interface SpeedPanelProps {
  character: Character;
  onCharacterUpdate: (field: keyof Character | `landSpeed.miscModifier` | `burrowSpeed.miscModifier` | `climbSpeed.miscModifier` | `flySpeed.miscModifier` | `swimSpeed.miscModifier`, value: any) => void;
  onOpenSpeedInfoDialog: (speedType: SpeedType) => void;
}

export function SpeedPanel({ character, onCharacterUpdate, onOpenSpeedInfoDialog }: SpeedPanelProps) {
  const { translations, isLoading: translationsLoading } = useI18n();

  const handleMiscModifierChange = (speedType: SpeedType, newValue: number) => {
    const fieldKey = `${speedType}Speed.miscModifier` as const;
    onCharacterUpdate(fieldKey, newValue);
  };

  const speedTypesConfig: Array<{
    type: SpeedType;
    labelKey: keyof typeof translations.UI_STRINGS; // Key for translations
    Icon: React.ElementType;
    fieldKey: keyof Pick<Character, 'landSpeed' | 'burrowSpeed' | 'climbSpeed' | 'flySpeed' | 'swimSpeed'>;
  }> = translations ? [
    { type: 'land', labelKey: 'speedLabelLand', Icon: Wind, fieldKey: 'landSpeed' },
    { type: 'burrow', labelKey: 'speedLabelBurrow', Icon: Shell, fieldKey: 'burrowSpeed' },
    { type: 'climb', labelKey: 'speedLabelClimb', Icon: MoveVertical, fieldKey: 'climbSpeed' },
    { type: 'fly', labelKey: 'speedLabelFly', Icon: Feather, fieldKey: 'flySpeed' },
    { type: 'swim', labelKey: 'speedLabelSwim', Icon: Waves, fieldKey: 'swimSpeed' },
  ] : [];


  if (translationsLoading || !translations) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Wind className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-serif">{translations?.UI_STRINGS.speedPanelTitle || "Movement Speeds"}</CardTitle>
          </div>
          <CardDescription>{translations?.UI_STRINGS.speedPanelDescription || "Manage your character's various movement capabilities and penalties."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {translationsLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">{translations?.UI_STRINGS.speedPanelLoadingSpeeds || "Loading speed details..."}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-3 border rounded-md bg-card flex flex-col items-center space-y-1.5 text-center shadow-sm">
                    <Skeleton className="h-5 w-20 mb-1" /> {/* Icon + Label */}
                    <Skeleton className="h-9 w-16 mb-1" /> {/* Speed value */}
                    <Skeleton className="h-4 w-24 mb-1" /> {/* Misc Mod Label */}
                    <Skeleton className="h-8 w-32" />    {/* NumberSpinnerInput */}
                  </div>
                ))}
              </div>
              <Separator className="my-6" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="p-4"><Skeleton className="h-5 w-3/4 mx-auto" /></CardHeader>
                    <CardContent className="p-4 pt-0 space-y-1"><Skeleton className="h-8 w-24 mx-auto" /><Skeleton className="h-3 w-full mx-auto mt-1" /></CardContent>
                </Card>
                <Card>
                    <CardHeader className="p-4"><Skeleton className="h-5 w-3/4 mx-auto" /></CardHeader>
                    <CardContent className="p-4 pt-0 space-y-1"><Skeleton className="h-8 w-24 mx-auto" /><Skeleton className="h-3 w-full mx-auto mt-1" /></CardContent>
                </Card>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }
  
  const { DND_RACES, DND_CLASSES, SIZES, UI_STRINGS } = translations;
  const speedUnit = UI_STRINGS.speedUnit || "ft.";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Wind className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl font-serif">{UI_STRINGS.speedPanelTitle}</CardTitle>
        </div>
        <CardDescription>{UI_STRINGS.speedPanelDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {speedTypesConfig.map(({ type, labelKey, Icon, fieldKey }) => {
            const speedData = calculateSpeedBreakdown(type, character, DND_RACES, DND_CLASSES, SIZES);
            const currentMiscMod = character[fieldKey]?.miscModifier || 0;
            const label = UI_STRINGS[labelKey as keyof typeof UI_STRINGS] || type;

            return (
              <div key={type} className="p-3 border rounded-md bg-card flex flex-col items-center space-y-1.5 text-center shadow-sm">
                <div className="flex items-center justify-center">
                  <Icon className="h-5 w-5 mr-1.5 text-muted-foreground" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <div className="flex items-center justify-center">
                  <p className="text-3xl font-bold text-accent min-w-[50px] text-center">
                    {speedData.total}<span className="text-base font-normal text-muted-foreground ml-1">{speedUnit}</span>
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
                  <Label htmlFor={`speed-misc-${type}`} className="text-xs text-muted-foreground">{UI_STRINGS.speedMiscModifierLabel}</Label>
                  <NumberSpinnerInput
                    id={`speed-misc-${type}`}
                    value={currentMiscMod}
                    onChange={(newValue) => handleMiscModifierChange(type, newValue)}
                    min={-100} 
                    max={100}  
                    step={5}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base font-medium text-center">{UI_STRINGS.armorPenaltyCardTitle}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-1">
              <div className="flex justify-center">
                <NumberSpinnerInput
                  id="armor-speed-penalty"
                  value={character.armorSpeedPenalty || 0}
                  onChange={(val) => onCharacterUpdate('armorSpeedPenalty', val)}
                  min={0}
                  step={5}
                  inputClassName="w-24 h-9 text-base"
                  buttonClassName="h-9 w-9"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center pt-1">
                {UI_STRINGS.armorPenaltyDescriptionFormat.replace("{unit}", speedUnit)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base font-medium text-center">{UI_STRINGS.loadPenaltyCardTitle}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-1">
              <div className="flex justify-center">
                <NumberSpinnerInput
                  id="load-speed-penalty"
                  value={character.loadSpeedPenalty || 0}
                  onChange={(val) => onCharacterUpdate('loadSpeedPenalty', val)}
                  min={0}
                  step={5}
                  inputClassName="w-24 h-9 text-base"
                  buttonClassName="h-9 w-9"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center pt-1">
                {UI_STRINGS.loadPenaltyDescriptionFormat.replace("{unit}", speedUnit)}
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}


    