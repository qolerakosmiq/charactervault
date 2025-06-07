
'use client';

import *as React from 'react';
import type { Character, BabBreakdownDetails, InitiativeBreakdownDetails, GrappleModifierBreakdownDetails, GrappleDamageBreakdownDetails, CharacterSize, InfoDialogContentType } from '@/types/character';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Swords, Info, Loader2 } from 'lucide-react';
import { getAbilityModifierByName, getBab, calculateInitiative, calculateGrapple, getSizeModifierGrapple, getUnarmedGrappleDamage } from '@/lib/dnd-utils';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';

const DEBOUNCE_DELAY = 400;

interface CombatPanelProps {
  character: Character;
  onCharacterUpdate: (field: keyof Character, value: any) => void;
  onOpenCombatStatInfoDialog: (contentType: InfoDialogContentType) => void;
  onOpenAcBreakdownDialog?: (acType: 'Normal' | 'Touch' | 'Flat-Footed') => void;
}

export function CombatPanel({ character, onCharacterUpdate, onOpenCombatStatInfoDialog }: CombatPanelProps) {
  const { translations, isLoading: translationsLoading } = useI18n();

  // Local states for debouncing
  const [localBabMiscModifier, setLocalBabMiscModifier] = React.useState(character.babMiscModifier || 0);
  const [localInitiativeMiscModifier, setLocalInitiativeMiscModifier] = React.useState(character.initiativeMiscModifier || 0);
  const [localGrappleMiscModifier, setLocalGrappleMiscModifier] = React.useState(character.grappleMiscModifier || 0);
  const [localGrappleDamageBonus, setLocalGrappleDamageBonus] = React.useState(character.grappleDamage_bonus || 0);
  const [localGrappleWeaponChoice, setLocalGrappleWeaponChoice] = React.useState(character.grappleWeaponChoice || 'unarmed');

  // Sync local states with props
  React.useEffect(() => { setLocalBabMiscModifier(character.babMiscModifier || 0); }, [character.babMiscModifier]);
  React.useEffect(() => { setLocalInitiativeMiscModifier(character.initiativeMiscModifier || 0); }, [character.initiativeMiscModifier]);
  React.useEffect(() => { setLocalGrappleMiscModifier(character.grappleMiscModifier || 0); }, [character.grappleMiscModifier]);
  React.useEffect(() => { setLocalGrappleDamageBonus(character.grappleDamage_bonus || 0); }, [character.grappleDamage_bonus]);
  React.useEffect(() => { setLocalGrappleWeaponChoice(character.grappleWeaponChoice || 'unarmed'); }, [character.grappleWeaponChoice]);

  // Debounce effects
  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (localBabMiscModifier !== (character.babMiscModifier || 0)) {
        onCharacterUpdate('babMiscModifier', localBabMiscModifier);
      }
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(handler);
  }, [localBabMiscModifier, character.babMiscModifier, onCharacterUpdate]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (localInitiativeMiscModifier !== (character.initiativeMiscModifier || 0)) {
        onCharacterUpdate('initiativeMiscModifier', localInitiativeMiscModifier);
      }
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(handler);
  }, [localInitiativeMiscModifier, character.initiativeMiscModifier, onCharacterUpdate]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (localGrappleMiscModifier !== (character.grappleMiscModifier || 0)) {
        onCharacterUpdate('grappleMiscModifier', localGrappleMiscModifier);
      }
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(handler);
  }, [localGrappleMiscModifier, character.grappleMiscModifier, onCharacterUpdate]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (localGrappleDamageBonus !== (character.grappleDamage_bonus || 0)) {
        onCharacterUpdate('grappleDamage_bonus', localGrappleDamageBonus);
      }
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(handler);
  }, [localGrappleDamageBonus, character.grappleDamage_bonus, onCharacterUpdate]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (localGrappleWeaponChoice !== (character.grappleWeaponChoice || 'unarmed')) {
        onCharacterUpdate('grappleWeaponChoice', localGrappleWeaponChoice);
      }
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(handler);
  }, [localGrappleWeaponChoice, character.grappleWeaponChoice, onCharacterUpdate]);


  if (translationsLoading || !translations || !character) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3"> <Swords className="h-8 w-8 text-primary" /> <Skeleton className="h-7 w-1/2" /> </div>
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-md" />)}
        </CardContent>
      </Card>
    );
  }

  const { DND_CLASSES, SIZES, UI_STRINGS } = translations;

  const abilityScores = character.abilityScores || {};
  const classes = character.classes || [];
  const strModifier = getAbilityModifierByName(abilityScores, 'strength');
  const dexModifier = getAbilityModifierByName(abilityScores, 'dexterity');
  const sizeModGrapple = getSizeModifierGrapple(character.size, SIZES);

  const baseBabArray = getBab(classes, DND_CLASSES);
  const totalBabWithModifier = baseBabArray.map(bab => bab + (localBabMiscModifier || 0));

  const baseInitiative = calculateInitiative(dexModifier, localInitiativeMiscModifier || 0);

  const baseGrappleModifier = calculateGrapple(classes, strModifier, sizeModGrapple, DND_CLASSES);
  const totalGrappleModifier = baseGrappleModifier + (localGrappleMiscModifier || 0);

  const grappleDamageBaseNotes = character.grappleDamage_baseNotes || getUnarmedGrappleDamage(character.size, SIZES);
  const grappleDamageBaseDice = grappleDamageBaseNotes.split(' ')[0] || '0';
  const totalNumericGrappleBonus = strModifier + (localGrappleDamageBonus || 0);
  const displayedGrappleDamageTotal = `${grappleDamageBaseDice}${totalNumericGrappleBonus !== 0 ? `${totalNumericGrappleBonus >= 0 ? '+' : ''}${totalNumericGrappleBonus}` : ''}`;


  const handleBabInfo = () => {
    onOpenCombatStatInfoDialog({ type: 'babBreakdown' });
  };

  const handleInitiativeInfo = () => {
    onOpenCombatStatInfoDialog({ type: 'initiativeBreakdown' });
  };

  const handleGrappleModifierInfo = () => {
    onOpenCombatStatInfoDialog({ type: 'grappleModifierBreakdown' });
  };

  const handleGrappleDamageInfo = () => {
    onOpenCombatStatInfoDialog({ type: 'grappleDamageBreakdown' });
  };

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Swords className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl font-serif">{UI_STRINGS.combatPanelTitle || "Combat Stats"}</CardTitle>
        </div>
        <CardDescription>{UI_STRINGS.combatPanelDescription || "Key offensive and grappling statistics."}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div className="p-3 border rounded-md bg-muted/20 space-y-2 flex flex-col text-center">
          <Label htmlFor="bab-display" className="text-md font-medium block">{UI_STRINGS.combatPanelBabLabel || "Base Attack Bonus"}</Label>
          <div className="flex items-center justify-center">
            <p id="bab-display" className="text-2xl font-bold text-accent">
              {totalBabWithModifier.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/')}
            </p>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={handleBabInfo}>
              <Info className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-auto space-y-1">
            <Label htmlFor="bab-custom-mod" className="text-xs text-muted-foreground block">{UI_STRINGS.infoDialogCustomModifierLabel || "Custom Modifier"}</Label>
            <div className="flex justify-center">
              <NumberSpinnerInput
                id="bab-custom-mod"
                value={localBabMiscModifier}
                onChange={setLocalBabMiscModifier}
                min={-20}
                inputClassName="h-8 text-sm w-20"
                buttonClassName="h-8 w-8"
              />
            </div>
          </div>
        </div>

        <div className="p-3 border rounded-md bg-muted/20 space-y-2 flex flex-col text-center">
          <Label htmlFor="initiative-display" className="text-md font-medium block">{UI_STRINGS.combatPanelInitiativeLabel || "Initiative"}</Label>
           <div className="flex items-center justify-center">
            <p id="initiative-display" className="text-2xl font-bold text-accent">
              {baseInitiative >= 0 ? '+' : ''}{baseInitiative}
            </p>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={handleInitiativeInfo}>
              <Info className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-auto space-y-1">
            <Label htmlFor="initiative-custom-mod" className="text-xs text-muted-foreground block">{UI_STRINGS.infoDialogCustomModifierLabel || "Custom Modifier"}</Label>
            <div className="flex justify-center">
              <NumberSpinnerInput
                id="initiative-custom-mod"
                value={localInitiativeMiscModifier}
                onChange={setLocalInitiativeMiscModifier}
                min={-20}
                inputClassName="h-8 text-sm w-20"
                buttonClassName="h-8 w-8"
              />
            </div>
          </div>
        </div>

        <div className="p-3 border rounded-md bg-muted/20 space-y-2 flex flex-col text-center">
          <Label htmlFor="grapple-mod-display" className="text-md font-medium block">{UI_STRINGS.combatPanelGrappleModifierLabel || "Grapple Modifier"}</Label>
          <div className="flex items-center justify-center">
            <p id="grapple-mod-display" className="text-2xl font-bold text-accent">
              {totalGrappleModifier >= 0 ? '+' : ''}{totalGrappleModifier}
            </p>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={handleGrappleModifierInfo}>
              <Info className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-auto space-y-1">
            <Label htmlFor="grapple-custom-mod" className="text-xs text-muted-foreground block">{UI_STRINGS.infoDialogCustomModifierLabel || "Custom Modifier"}</Label>
            <div className="flex justify-center">
              <NumberSpinnerInput
                id="grapple-custom-mod"
                value={localGrappleMiscModifier}
                onChange={setLocalGrappleMiscModifier}
                min={-20}
                inputClassName="h-8 text-sm w-20"
                buttonClassName="h-8 w-8"
              />
            </div>
          </div>
        </div>

        <div className="p-3 border rounded-md bg-muted/20 space-y-2 flex flex-col text-center">
            <Label htmlFor="grapple-damage-display" className="text-md font-medium block">{UI_STRINGS.combatPanelGrappleDamageLabel || "Grapple Damage"}</Label>
            <div className="flex items-center justify-center">
                <p id="grapple-damage-display" className="text-2xl font-bold text-accent">
                  {displayedGrappleDamageTotal}
                </p>
                 <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={handleGrappleDamageInfo}>
                    <Info className="h-4 w-4" />
                </Button>
            </div>
            <div className="mt-auto space-y-2">
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground block">{UI_STRINGS.combatPanelGrappleWeaponLabel || "Weapon"}</Label>
                    <Select
                        value={localGrappleWeaponChoice}
                        onValueChange={setLocalGrappleWeaponChoice}
                    >
                        <SelectTrigger className="h-8 text-sm w-full max-w-[200px] mx-auto">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="unarmed">{UI_STRINGS.infoDialogGrappleDmgUnarmedLabel || "Unarmed"}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="grapple-damage-custom-mod" className="text-xs text-muted-foreground block">{UI_STRINGS.infoDialogCustomModifierLabel || "Custom Modifier"}</Label>
                    <div className="flex justify-center">
                      <NumberSpinnerInput
                          id="grapple-damage-custom-mod"
                          value={localGrappleDamageBonus}
                          onChange={setLocalGrappleDamageBonus}
                          min={-20}
                          inputClassName="h-8 text-sm w-20"
                          buttonClassName="h-8 w-8"
                      />
                    </div>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
    </>
  );
}

    