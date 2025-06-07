
'use client';

import *as React from 'react';
import type { Character, SpeedType, SpeedDetails, InfoDialogContentType, DndRaceOption, DndClassOption } from '@/types/character';
import { calculateSpeedBreakdown } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Wind, Waves, MoveVertical, Shell, Feather, Info, Loader2, ShieldSlash, Weight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';

const DEBOUNCE_DELAY = 400;

interface SpeedPanelProps {
  character: Character;
  onCharacterUpdate: (
    field: keyof Character | 
           `landSpeed.miscModifier` | 
           `burrowSpeed.miscModifier` | 
           `climbSpeed.miscModifier` | 
           `flySpeed.miscModifier` | 
           `swimSpeed.miscModifier` |
           `armorSpeedPenalty_miscModifier` | 
           `loadSpeedPenalty_miscModifier`, 
    value: any
  ) => void;
  onOpenSpeedInfoDialog: (speedType: SpeedType) => void;
  onOpenArmorSpeedPenaltyInfoDialog: () => void;
  onOpenLoadSpeedPenaltyInfoDialog: () => void;
}

export function SpeedPanel({ 
  character, 
  onCharacterUpdate, 
  onOpenSpeedInfoDialog, 
  onOpenArmorSpeedPenaltyInfoDialog,
  onOpenLoadSpeedPenaltyInfoDialog 
}: SpeedPanelProps) {
  const { translations, isLoading: translationsLoading } = useI18n();

  const speedTypesConfig: Array<{
    type: SpeedType;
    labelKey: keyof NonNullable<NonNullable<typeof translations>['UI_STRINGS']>; 
    Icon: React.ElementType;
    fieldKey: keyof Pick<Character, 'landSpeed' | 'burrowSpeed' | 'climbSpeed' | 'flySpeed' | 'swimSpeed'>;
  }> = [
    { type: 'land', labelKey: 'speedLabelLand', Icon: Wind, fieldKey: 'landSpeed' },
    { type: 'burrow', labelKey: 'speedLabelBurrow', Icon: Shell, fieldKey: 'burrowSpeed' },
    { type: 'climb', labelKey: 'speedLabelClimb', Icon: MoveVertical, fieldKey: 'climbSpeed' },
    { type: 'fly', labelKey: 'speedLabelFly', Icon: Feather, fieldKey: 'flySpeed' },
    { type: 'swim', labelKey: 'speedLabelSwim', Icon: Waves, fieldKey: 'swimSpeed' },
  ];

  const debouncedSpeedMods = {} as Record<SpeedType, [number, (val: number) => void]>;
  speedTypesConfig.forEach(config => {
    const fieldKey = `${config.type}Speed.miscModifier` as const;
     // eslint-disable-next-line react-hooks/rules-of-hooks
    debouncedSpeedMods[config.type] = useDebouncedFormField(
      character[config.fieldKey]?.miscModifier || 0,
      (value) => onCharacterUpdate(fieldKey, value),
      DEBOUNCE_DELAY
    );
  });

  const [localArmorPenaltyMiscMod, setLocalArmorPenaltyMiscMod] = useDebouncedFormField(
    character.armorSpeedPenalty_miscModifier || 0,
    (value) => onCharacterUpdate('armorSpeedPenalty_miscModifier', value),
    DEBOUNCE_DELAY
  );
  const [localLoadPenaltyMiscMod, setLocalLoadPenaltyMiscMod] = useDebouncedFormField(
    character.loadSpeedPenalty_miscModifier || 0,
    (value) => onCharacterUpdate('loadSpeedPenalty_miscModifier', value),
    DEBOUNCE_DELAY
  );


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
        <CardContent className="space-y-3">
          {translationsLoading || !translations ? ( 
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
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {[...Array(2)].map((_, i) => (
                  <div key={`penalty-skel-${i}`} className="p-3 border rounded-md bg-card flex flex-col items-center space-y-1.5 text-center shadow-sm">
                    <Skeleton className="h-5 w-24 mb-1" /> {/* Icon + Label */}
                    <Skeleton className="h-9 w-12 mb-1" /> {/* Penalty value */}
                    <Skeleton className="h-4 w-24 mb-1" /> {/* Misc Mod Label */}
                    <Skeleton className="h-8 w-32" />    {/* NumberSpinnerInput */}
                  </div>
                 ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }
  
  const { DND_RACES, DND_CLASSES, SIZES, UI_STRINGS } = translations;
  const speedUnit = UI_STRINGS.speedUnit || "ft.";
  const speedStep = parseFloat(UI_STRINGS.speedStepIncrement || "5");

  const totalArmorPenalty = (character.armorSpeedPenalty_base || 0) + (character.armorSpeedPenalty_miscModifier || 0);
  const totalLoadPenalty = (character.loadSpeedPenalty_base || 0) + (character.loadSpeedPenalty_miscModifier || 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Wind className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl font-serif">{UI_STRINGS.speedPanelTitle}</CardTitle>
        </div>
        <CardDescription>{UI_STRINGS.speedPanelDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {speedTypesConfig.map(({ type, labelKey, Icon, fieldKey }) => {
            const speedData = calculateSpeedBreakdown(type, character, DND_RACES, DND_CLASSES, SIZES, UI_STRINGS);
            const [localMiscMod, setLocalMiscMod] = debouncedSpeedMods[type];
            const label = UI_STRINGS[labelKey] || type;

            return (
              <div key={type} className="p-3 border rounded-md bg-card flex flex-col items-center space-y-1.5 text-center shadow-sm">
                <div className="flex items-center justify-center">
                  <Icon className="h-5 w-5 mr-1.5 text-muted-foreground" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <div className="flex items-center justify-center space-x-1 h-9"> 
                  <span className="text-lg font-bold text-accent">
                    {speedData.total}
                  </span>
                  <span className="text-base font-normal text-muted-foreground">
                    {speedUnit}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => onOpenSpeedInfoDialog(type)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
                <div className="w-full max-w-[140px]">
                  <Label htmlFor={`speed-misc-${type}`} className="text-xs text-muted-foreground">{UI_STRINGS.speedMiscModifierLabel}</Label>
                  <NumberSpinnerInput
                    id={`speed-misc-${type}`}
                    value={localMiscMod}
                    onChange={setLocalMiscMod}
                    min={-100} 
                    max={100}  
                    step={speedStep}
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
        
        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Armor Penalty Card */}
          <div className="p-3 border rounded-md bg-card flex flex-col items-center space-y-1.5 text-center shadow-sm">
            <div className="flex items-center justify-center">
              <ShieldSlash className="h-5 w-5 mr-1.5 text-muted-foreground" />
              <span className="text-sm font-medium">{UI_STRINGS.armorPenaltyCardTitle}</span>
            </div>
            <div className="flex items-center justify-center space-x-1 h-9">
              <span className="text-lg font-bold text-destructive">
                {totalArmorPenalty > 0 ? `-${totalArmorPenalty}` : totalArmorPenalty}
              </span>
              <span className="text-base font-normal text-muted-foreground">
                {speedUnit}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={onOpenArmorSpeedPenaltyInfoDialog}
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <div className="w-full max-w-[140px]">
              <Label htmlFor="armor-penalty-misc-mod" className="text-xs text-muted-foreground">{UI_STRINGS.speedMiscModifierLabel}</Label>
              <NumberSpinnerInput
                id="armor-penalty-misc-mod"
                value={localArmorPenaltyMiscMod}
                onChange={setLocalArmorPenaltyMiscMod}
                min={0} // Penalties are usually positive numbers that subtract
                max={100}
                step={speedStep}
                inputClassName="w-20 h-8 text-sm text-center"
                buttonClassName="h-8 w-8"
                buttonSize="sm"
                className="justify-center mt-0.5"
              />
            </div>
          </div>

          {/* Load Penalty Card */}
          <div className="p-3 border rounded-md bg-card flex flex-col items-center space-y-1.5 text-center shadow-sm">
            <div className="flex items-center justify-center">
              <Weight className="h-5 w-5 mr-1.5 text-muted-foreground" />
              <span className="text-sm font-medium">{UI_STRINGS.loadPenaltyCardTitle}</span>
            </div>
            <div className="flex items-center justify-center space-x-1 h-9">
              <span className="text-lg font-bold text-destructive">
                {totalLoadPenalty > 0 ? `-${totalLoadPenalty}` : totalLoadPenalty}
              </span>
              <span className="text-base font-normal text-muted-foreground">
                {speedUnit}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={onOpenLoadSpeedPenaltyInfoDialog}
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <div className="w-full max-w-[140px]">
              <Label htmlFor="load-penalty-misc-mod" className="text-xs text-muted-foreground">{UI_STRINGS.speedMiscModifierLabel}</Label>
              <NumberSpinnerInput
                id="load-penalty-misc-mod"
                value={localLoadPenaltyMiscMod}
                onChange={setLocalLoadPenaltyMiscMod}
                min={0} // Penalties are usually positive
                max={100}
                step={speedStep}
                inputClassName="w-20 h-8 text-sm text-center"
                buttonClassName="h-8 w-8"
                buttonSize="sm"
                className="justify-center mt-0.5"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
