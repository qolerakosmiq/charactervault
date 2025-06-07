
'use client';

import *as React from 'react';
import type { Character, InfoDialogContentType } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Info, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { getAbilityModifierByName, getSizeModifierAC } from '@/lib/dnd-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/context/I18nProvider';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';

const DEBOUNCE_DELAY = 400;

type ArmorClassPanelData = Pick<Character, 'abilityScores' | 'size' | 'armorBonus' | 'shieldBonus' | 'naturalArmor' | 'deflectionBonus' | 'dodgeBonus' | 'acMiscModifier'>;

interface ArmorClassPanelProps {
  acData?: ArmorClassPanelData;
  onCharacterUpdate?: (field: keyof ArmorClassPanelData, value: any) => void;
  onOpenAcBreakdownDialog?: (acType: 'Normal' | 'Touch' | 'Flat-Footed') => void;
}

export const ArmorClassPanel = React.memo(function ArmorClassPanelComponent({ acData, onCharacterUpdate, onOpenAcBreakdownDialog }: ArmorClassPanelProps) {
  const { translations, isLoading: translationsLoading } = useI18n();

  const [localTemporaryAcModifier, setLocalTemporaryAcModifier] = useDebouncedFormField(
    acData?.acMiscModifier || 0,
    (value) => { if (onCharacterUpdate) onCharacterUpdate('acMiscModifier', value); },
    DEBOUNCE_DELAY
  );

  if (translationsLoading || !translations || !acData) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-serif">{translations?.UI_STRINGS.armorClassPanelTitle || "Armor Class"}</CardTitle>
          </div>
          <CardDescription>{translations?.UI_STRINGS.armorClassPanelDescription || "Details about your character's defenses."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {translationsLoading || !translations ? ( 
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">{translations?.UI_STRINGS.armorClassPanelLoading || "Loading AC details..."}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
                <div className="flex items-center">
                  <Label htmlFor="normal-ac-display" className="text-lg font-medium">{translations?.UI_STRINGS.armorClassNormalLabel || "Normal"}</Label>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" disabled>
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
                <Skeleton className="h-8 w-12" />
              </div>
              <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
                <div className="flex items-center">
                  <Label htmlFor="touch-ac-display" className="text-lg font-medium">{translations?.UI_STRINGS.armorClassTouchLabel || "Touch"}</Label>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" disabled>
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
                <Skeleton className="h-8 w-12" />
              </div>
              <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
                <div className="flex items-center">
                  <Label htmlFor="flat-footed-ac-display" className="text-lg font-medium">{translations?.UI_STRINGS.armorClassFlatFootedLabel || "Flat-Footed"}</Label>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" disabled>
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
                <Skeleton className="h-8 w-12" />
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between">
                <Label htmlFor="custom-ac-mod-display" className="text-sm font-medium">{translations?.UI_STRINGS.armorClassMiscModifierLabel || "Temporary Modifier"}</Label>
                <NumberSpinnerInput
                  id="custom-ac-mod-display"
                  value={0}
                  onChange={() => {}}
                  disabled={true}
                  inputClassName="w-24 h-9 text-base"
                  buttonClassName="h-9 w-9"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  const { DEFAULT_ABILITIES, SIZES, UI_STRINGS } = translations;
  const currentAbilityScores = acData.abilityScores || DEFAULT_ABILITIES;
  const currentSize = acData.size || 'medium';

  const dexModifier = getAbilityModifierByName(currentAbilityScores, 'dexterity');
  const sizeModAC = getSizeModifierAC(currentSize, SIZES);

  const acCalculatedMiscModifier = 0; 

  const normalAC = 10 +
    (acData.armorBonus || 0) +
    (acData.shieldBonus || 0) +
    dexModifier +
    sizeModAC +
    (acData.naturalArmor || 0) +
    (acData.deflectionBonus || 0) +
    (acData.dodgeBonus || 0) +
    (acCalculatedMiscModifier || 0) + 
    (acData.acMiscModifier || 0);  

  const touchAC = 10 +
    dexModifier +
    sizeModAC +
    (acData.deflectionBonus || 0) +
    (acData.dodgeBonus || 0) +
    (acCalculatedMiscModifier || 0) + 
    (acData.acMiscModifier || 0);  

  const flatFootedAC = 10 +
    (acData.armorBonus || 0) +
    (acData.shieldBonus || 0) +
    sizeModAC +
    (acData.naturalArmor || 0) +
    (acData.deflectionBonus || 0) +
    (acCalculatedMiscModifier || 0) + 
    (acData.acMiscModifier || 0);  


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
            <CardTitle className="text-2xl font-serif">{UI_STRINGS.armorClassPanelTitle || "Armor Class"}</CardTitle>
          </div>
          <CardDescription>{UI_STRINGS.armorClassPanelDescription || "Details about your character's defenses."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
            <div className="flex items-center">
              <Label htmlFor="normal-ac-display" className="text-lg font-medium">{UI_STRINGS.armorClassNormalLabel || "Normal"}</Label>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={() => handleShowAcBreakdown('Normal')} disabled={!onOpenAcBreakdownDialog}>
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <p id="normal-ac-display" className="text-lg font-bold text-accent">{normalAC}</p>
          </div>
          <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
             <div className="flex items-center">
              <Label htmlFor="touch-ac-display" className="text-lg font-medium">{UI_STRINGS.armorClassTouchLabel || "Touch"}</Label>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={() => handleShowAcBreakdown('Touch')} disabled={!onOpenAcBreakdownDialog}>
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <p id="touch-ac-display" className="text-lg font-bold text-accent">{touchAC}</p>
          </div>
          <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
            <div className="flex items-center">
              <Label htmlFor="flat-footed-ac-display" className="text-lg font-medium">{UI_STRINGS.armorClassFlatFootedLabel || "Flat-Footed"}</Label>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={() => handleShowAcBreakdown('Flat-Footed')} disabled={!onOpenAcBreakdownDialog}>
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <p id="flat-footed-ac-display" className="text-lg font-bold text-accent">{flatFootedAC}</p>
          </div>

          <Separator className="my-3" />
          <div className="flex items-center justify-between">
            <Label htmlFor="temporary-ac-modifier-input" className="text-sm font-medium">{UI_STRINGS.armorClassMiscModifierLabel || "Temporary Modifier"}</Label>
            <NumberSpinnerInput
              id="temporary-ac-modifier-input" 
              value={localTemporaryAcModifier}
              onChange={setLocalTemporaryAcModifier}
              disabled={!isEditable}
              min={-20}
              max={20}
              inputClassName="w-24 h-9 text-base"
              buttonClassName="h-9 w-9"
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
});
ArmorClassPanel.displayName = 'ArmorClassPanelComponent';
