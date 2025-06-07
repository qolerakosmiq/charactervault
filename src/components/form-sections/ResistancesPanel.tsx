
'use client';

import *as React from 'react';
import type { Character, ResistanceValue, DamageReductionInstance, DamageReductionTypeValue, DamageReductionRuleValue, ResistanceFieldKeySheet } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldAlert, Waves, Flame, Snowflake, Zap as ElectricityIcon, Atom, Sigma, ShieldCheck, Brain, Info, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/context/I18nProvider'; 
import { Skeleton } from '@/components/ui/skeleton'; 
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';

const DEBOUNCE_DELAY = 400;

interface ResistancesPanelProps {
  characterData: {
    fireResistance: ResistanceValue;
    coldResistance: ResistanceValue;
    acidResistance: ResistanceValue;
    electricityResistance: ResistanceValue;
    sonicResistance: ResistanceValue;
    spellResistance: ResistanceValue;
    powerResistance: ResistanceValue;
    damageReduction: DamageReductionInstance[];
    fortification: ResistanceValue;
  };
  onResistanceChange: (field: ResistanceFieldKeySheet, subField: 'customMod', value: number) => void;
  onDamageReductionChange: (newDrArray: DamageReductionInstance[]) => void;
  onOpenResistanceInfoDialog: (resistanceField: ResistanceFieldKeySheet) => void;
}

export function ResistancesPanel({ characterData, onResistanceChange, onDamageReductionChange, onOpenResistanceInfoDialog }: ResistancesPanelProps) {
  const { translations, isLoading: translationsLoading } = useI18n();
  const { toast } = useToast();

  const [newDrValue, setNewDrValue] = React.useState(1);
  const [newDrType, setNewDrType] = React.useState<DamageReductionTypeValue | string>("none");
  const [newDrRule, setNewDrRule] = React.useState<DamageReductionRuleValue>('bypassed-by-type');

  const energyResistancesFields: Array<{ field: ResistanceFieldKeySheet; labelKey: keyof NonNullable<NonNullable<typeof translations>['UI_STRINGS']>; Icon: React.ElementType; fieldPrefix?: string }> = [
    { field: 'fireResistance', labelKey: 'resistanceLabelFire', Icon: Flame, fieldPrefix: 'form-res' },
    { field: 'coldResistance', labelKey: 'resistanceLabelCold', Icon: Snowflake, fieldPrefix: 'form-res' },
    { field: 'acidResistance', labelKey: 'resistanceLabelAcid', Icon: Atom, fieldPrefix: 'form-res' },
    { field: 'electricityResistance', labelKey: 'resistanceLabelElectricity', Icon: ElectricityIcon, fieldPrefix: 'form-res' },
    { field: 'sonicResistance', labelKey: 'resistanceLabelSonic', Icon: Waves, fieldPrefix: 'form-res' },
  ];

  const otherNumericResistancesFields: Array<{ field: ResistanceFieldKeySheet; labelKey: keyof NonNullable<NonNullable<typeof translations>['UI_STRINGS']>; Icon: React.ElementType; unit?: string; fieldPrefix?: string }> = [
    { field: 'spellResistance', labelKey: 'resistanceLabelSpellResistance', Icon: Sigma, fieldPrefix: 'form-res' },
    { field: 'powerResistance', labelKey: 'resistanceLabelPowerResistance', Icon: Brain, fieldPrefix: 'form-res' },
    { field: 'fortification', labelKey: 'resistanceLabelFortification', Icon: ShieldCheck, unit: '%', fieldPrefix: 'form-res' },
  ];

  const debouncedResistanceMods = {} as Record<ResistanceFieldKeySheet, [number, (val: number) => void]>;

  [...energyResistancesFields, ...otherNumericResistancesFields].forEach(({ field }) => {
     // eslint-disable-next-line react-hooks/rules-of-hooks
    debouncedResistanceMods[field] = useDebouncedFormField(
      characterData[field]?.customMod || 0,
      (value) => onResistanceChange(field, 'customMod', value),
      DEBOUNCE_DELAY
    );
  });


 React.useEffect(() => {
    if (translationsLoading || !translations) return;
    const { DAMAGE_REDUCTION_TYPES, DAMAGE_REDUCTION_RULES_OPTIONS } = translations;

    if (newDrRule !== 'bypassed-by-type' && newDrType === 'none') {
      const firstNonNoneType = DAMAGE_REDUCTION_TYPES.find(t => t.value !== 'none')?.value || 'magic';
      setNewDrType(firstNonNoneType);
    }
    if (newDrType === "none" && !newDrRule) {
        setNewDrRule(DAMAGE_REDUCTION_RULES_OPTIONS[0]?.value || 'bypassed-by-type');
    }
  }, [newDrRule, newDrType, translations, translationsLoading]);
  
  if (translationsLoading || !translations) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3"> <ShieldAlert className="h-8 w-8 text-primary" /> <Skeleton className="h-7 w-1/2" /> </div>
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">{translations?.UI_STRINGS.resistancesPanelLoading || "Loading resistance details..."}</p>
          </div>
          <div> <Skeleton className="h-6 w-1/3 mb-3" /> <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"> {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 rounded-md" />)} </div> </div>
          <Separator />
          <div> <Skeleton className="h-6 w-1/3 mb-3" /> <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"> {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-md" />)} </div> </div>
          <Separator className="my-6" />
          <div> <Skeleton className="h-6 w-1/3 mb-3" /> <div className="grid md:grid-cols-2 gap-x-6 gap-y-4"> <Skeleton className="h-20 rounded-md" /> <Skeleton className="h-48 rounded-md" /> </div> </div>
        </CardContent>
      </Card>
    );
  }

  const { DAMAGE_REDUCTION_TYPES, DAMAGE_REDUCTION_RULES_OPTIONS, UI_STRINGS } = translations;
  
  const handleTriggerResistanceInfoDialog = (field: ResistanceFieldKeySheet) => {
    onOpenResistanceInfoDialog(field);
  };

  const handleAddDamageReduction = () => {
    if (newDrValue <= 0) {
      toast({ title: UI_STRINGS.toastInvalidDrValueTitle || "Invalid DR Value", description: UI_STRINGS.toastInvalidDrValueDesc || "Damage Reduction value must be greater than 0.", variant: "destructive"});
      return;
    }
    if (!newDrType) {
        toast({ title: UI_STRINGS.toastDrTypeMissingTitle || "DR Type Missing", description: UI_STRINGS.toastDrTypeMissingDesc || "Please select a DR type.", variant: "destructive"});
        return;
    }
    const ruleLabelForToast = DAMAGE_REDUCTION_RULES_OPTIONS.find(opt => opt.value === newDrRule)?.label || newDrRule;
    if ((newDrRule === 'excepted-by-type' || newDrRule === 'versus-specific-type') && newDrType === 'none') {
      toast({ 
        title: UI_STRINGS.toastDrInvalidCombinationTitle || "Invalid Combination", 
        description: (UI_STRINGS.toastDrInvalidCombinationDesc || "The '{ruleLabel}' rule requires a specific damage type (not 'None').").replace("{ruleLabel}", ruleLabelForToast), 
        variant: "destructive"
      });
      return;
    }

    const existingUserDrOfTypeAndRule = characterData.damageReduction.find(
      dr => !dr.isGranted && dr.type === newDrType && dr.rule === newDrRule
    );
    if (existingUserDrOfTypeAndRule) {
      toast({ title: UI_STRINGS.toastDrDuplicateEntryTitle || "Duplicate DR Entry", description: UI_STRINGS.toastDrDuplicateEntryDesc || `You already have a custom DR with this type and rule.`, variant: "destructive"});
      return;
    }

    const newInstance: DamageReductionInstance = {
      id: crypto.randomUUID(),
      value: newDrValue,
      type: newDrType,
      rule: newDrRule,
      isGranted: false,
    };
    onDamageReductionChange([...characterData.damageReduction, newInstance]);
    setNewDrValue(1);
    setNewDrType(DAMAGE_REDUCTION_TYPES[0]?.value || "none");
    setNewDrRule(DAMAGE_REDUCTION_RULES_OPTIONS[0]?.value || 'bypassed-by-type');
  };

  const handleRemoveDamageReduction = (idToRemove: string) => {
    onDamageReductionChange(characterData.damageReduction.filter(dr => dr.id !== idToRemove));
  };
  
  const getDrTypeUiLabel = (typeValue: DamageReductionTypeValue | string): string => {
    return DAMAGE_REDUCTION_TYPES.find(t => t.value === typeValue)?.label || String(typeValue);
  };
  
 const getDrPrimaryNotation = (dr: DamageReductionInstance): string => {
    const typeLabel = getDrTypeUiLabel(dr.type);
    if (dr.rule === 'bypassed-by-type') {
      return dr.type === "none" ? `${dr.value}/—` : `${dr.value}/${typeLabel}`;
    }
    if (dr.rule === 'versus-specific-type') {
      return `${dr.value} vs ${typeLabel}`;
    }
    if (dr.rule === 'excepted-by-type') {
       const displayType = typeLabel === (DAMAGE_REDUCTION_TYPES.find(t => t.value === 'none')?.label || "None") ? "—" : typeLabel;
       return `${dr.value}/${displayType} (Immunity)`;
    }
    return `${dr.value}/${typeLabel} (${DAMAGE_REDUCTION_RULES_OPTIONS.find(opt => opt.value === dr.rule)?.label || dr.rule})`;
  };
  
  const getDrRuleDescription = (dr: DamageReductionInstance): string => {
    const typeLabel = getDrTypeUiLabel(dr.type);
    const ruleDef = DAMAGE_REDUCTION_RULES_OPTIONS.find(opt => opt.value === dr.rule);

    if (dr.rule === 'bypassed-by-type') {
      return dr.type === "none" ? `Reduces damage from most attacks by ${dr.value}.` : `Reduces damage by ${dr.value} unless attack is ${typeLabel}.`;
    }
    if (dr.rule === 'versus-specific-type') {
      return `Specifically reduces damage from ${typeLabel} sources by ${dr.value}.`;
    }
    if (dr.rule === 'excepted-by-type') {
        return `Immune to damage unless from ${typeLabel} sources. ${typeLabel} sources deal damage reduced by ${dr.value}.`;
    }
    return `Rule: ${ruleDef ? ruleDef.label : dr.rule}`; 
  };


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <ShieldAlert className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-serif">{UI_STRINGS.resistancesPanelTitle}</CardTitle>
          </div>
          <CardDescription>{UI_STRINGS.resistancesPanelDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold mb-3 text-foreground/90">{UI_STRINGS.resistancesPanelEnergyResistancesLabel}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {energyResistancesFields.map(({ field, labelKey, Icon, fieldPrefix }) => {
                const resistanceFromProp = characterData[field];
                const totalValue = (resistanceFromProp?.base || 0) + (resistanceFromProp?.customMod || 0);
                const label = UI_STRINGS[labelKey] || field.replace('Resistance', '');
                const [localCustomMod, setLocalCustomMod] = debouncedResistanceMods[field];
                return (
                  <div key={field} className="p-3 border rounded-md bg-card flex flex-col items-center space-y-1.5 text-center shadow-sm">
                    <div className="flex items-center justify-center">
                      <Icon className="h-5 w-5 mr-1.5 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {label}
                      </span>
                    </div>
                    <div className="flex items-center justify-center">
                      <p className="text-2xl font-bold text-accent">
                        {totalValue}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground"
                        onClick={() => handleTriggerResistanceInfoDialog(field)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="w-full max-w-[120px] flex flex-col items-center">
                       <Label htmlFor={`${fieldPrefix}-${field}-customMod`} className="text-xs text-muted-foreground mb-0.5">{UI_STRINGS.infoDialogCustomModifierLabel || "Misc Modifier"}</Label>
                       <NumberSpinnerInput
                        id={`${fieldPrefix}-${field}-customMod`}
                        value={localCustomMod} 
                        onChange={setLocalCustomMod} 
                        min={-50} 
                        inputClassName="w-16 h-7 text-sm text-center" 
                        buttonClassName="h-7 w-7"
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
            <h4 className="text-lg font-semibold mb-3 text-foreground/90">{UI_STRINGS.resistancesPanelOtherDefensesLabel}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {otherNumericResistancesFields.map(({ field, labelKey, Icon, unit, fieldPrefix }) => {
                const resistanceFromProp = characterData[field];
                const totalValue = (resistanceFromProp?.base || 0) + (resistanceFromProp?.customMod || 0);
                const isFortification = field === 'fortification';
                const label = UI_STRINGS[labelKey] || field.replace('Resistance', '').replace('Fortification', 'Fortification');
                const [localCustomMod, setLocalCustomMod] = debouncedResistanceMods[field];
                return (
                  <div key={field} className="p-3 border rounded-md bg-card flex flex-col items-center space-y-1.5 text-center shadow-sm">
                     <div className="flex items-center justify-center">
                        <Icon className="h-5 w-5 mr-1.5 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {label} {unit && `(${unit})`}
                        </span>
                      </div>
                    <div className="flex items-center justify-center">
                      <p className="text-2xl font-bold text-accent">
                        {totalValue}
                      </p>
                       <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground"
                        onClick={() => handleTriggerResistanceInfoDialog(field)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </div>
                     <div className="w-full max-w-[120px] flex flex-col items-center">
                       <Label htmlFor={`${fieldPrefix}-${field}-customMod`} className="text-xs text-muted-foreground mb-0.5">{UI_STRINGS.infoDialogCustomModifierLabel || "Misc Modifier"}</Label>
                       <NumberSpinnerInput
                        id={`${fieldPrefix}-${field}-customMod`}
                        value={localCustomMod}
                        onChange={setLocalCustomMod}
                        min={isFortification ? 0 : -50} 
                        max={isFortification ? 100 : undefined} 
                        inputClassName="w-16 h-7 text-sm text-center"
                        buttonClassName="h-7 w-7"
                        buttonSize="sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <Separator className="my-6" />
             <div>
              <h4 className="text-lg font-semibold mb-3 text-foreground/90">{UI_STRINGS.resistancesPanelDamageReductionLabel}</h4>
                <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-3"> 
                    {characterData.damageReduction.length > 0 ? (
                      characterData.damageReduction.map(dr => {
                        const ruleDef = DAMAGE_REDUCTION_RULES_OPTIONS.find(opt => opt.value === dr.rule);
                        const ruleLabel = ruleDef?.label || dr.rule;
                        return (
                          <div key={dr.id} className="flex items-start justify-between p-2 border rounded-md bg-muted/5 text-sm">
                            <div>
                              <p className="font-semibold">{getDrPrimaryNotation(dr)}</p>
                              <div className="mt-0.5 flex items-center">
                                <Badge variant="outline" className="text-xs font-normal h-5 mr-1 whitespace-nowrap">
                                  {ruleLabel}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{getDrRuleDescription(dr)}</span>
                              </div>
                            </div>
                            <div className="flex items-center shrink-0">
                              {dr.isGranted && dr.source && <Badge variant="secondary" className="text-xs mr-1 whitespace-nowrap">{dr.source}</Badge>}
                              {!dr.isGranted && (
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80" onClick={() => handleRemoveDamageReduction(dr.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">{UI_STRINGS.resistancesPanelNoDrEntries}</p>
                    )}
                  </div>

                <div className="space-y-3 border md:border-l md:border-t-0 p-4 rounded-md md:pl-6">
                  <Label className="text-md font-medium">{UI_STRINGS.resistancesPanelAddCustomDrLabel}</Label>
                  <div className="w-fit space-y-1">
                      <Label htmlFor="form-dr-value" className="text-xs text-center block">{UI_STRINGS.resistancesPanelDrValueLabel}</Label>
                      <NumberSpinnerInput
                      id="form-dr-value"
                      value={newDrValue}
                      onChange={setNewDrValue}
                      min={1}
                      inputClassName="h-9 text-sm w-20"
                      buttonClassName="h-9 w-9"
                      buttonSize="sm"
                      className="justify-center"
                      />
                  </div>
                   <div className="space-y-1">
                        <Label htmlFor="form-dr-rule" className="text-xs">{UI_STRINGS.resistancesPanelDrRuleLabel}</Label>
                         <Select value={newDrRule} onValueChange={(val) => setNewDrRule(val as DamageReductionRuleValue)}>
                            <SelectTrigger id="form-dr-rule" className="h-9 text-sm">
                               <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {DAMAGE_REDUCTION_RULES_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                  <div className="space-y-1">
                      <Label htmlFor="form-dr-type" className="text-xs">{UI_STRINGS.resistancesPanelDrTypeLabel}</Label>
                       <Select value={newDrType} onValueChange={(val) => setNewDrType(val as DamageReductionTypeValue | string)}>
                          <SelectTrigger id="form-dr-type" className="h-9 text-sm">
                             <SelectValue placeholder="Select type..." />
                          </SelectTrigger>
                          <SelectContent>
                              {DAMAGE_REDUCTION_TYPES.map(option => (
                                  <SelectItem 
                                    key={option.value} 
                                    value={option.value}
                                    disabled={option.value === 'none' && newDrRule !== 'bypassed-by-type'}
                                  >
                                      {option.label}
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                  <Button type="button" onClick={handleAddDamageReduction} size="sm" className="mt-3">
                      <PlusCircle className="mr-2 h-4 w-4" /> {UI_STRINGS.resistancesPanelAddDrButton}
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </>
  );
}

