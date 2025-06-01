
'use client';

import * as React from 'react';
import type { Character, ResistanceValue, DamageReductionInstance, DamageReductionTypeValue, DamageReductionRuleValue } from '@/types/character';
import { DAMAGE_REDUCTION_TYPES, DAMAGE_REDUCTION_RULES_OPTIONS } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldAlert, Waves, Flame, Snowflake, Zap as ElectricityIcon, Atom, Sigma, ShieldCheck, Brain, Info, PlusCircle, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { InfoDisplayDialog, type ResistanceBreakdownDetails } from '@/components/InfoDisplayDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

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
    damageReduction: DamageReductionInstance[];
    fortification: ResistanceValue;
  };
  onResistanceChange: (field: ResistanceField, subField: 'customMod', value: number) => void;
  onDamageReductionChange: (newDrArray: DamageReductionInstance[]) => void;
}

export function ResistancesPanel({ characterData, onResistanceChange, onDamageReductionChange }: ResistancesPanelProps) {
  const [isInfoDialogOpen, setIsInfoDialogOpen] = React.useState(false);
  const [currentResistanceBreakdown, setCurrentResistanceBreakdown] = React.useState<ResistanceBreakdownDetails | undefined>(undefined);
  const { toast } = useToast();

  const [newDrValue, setNewDrValue] = React.useState(1);
  const [newDrType, setNewDrType] = React.useState<DamageReductionTypeValue | string>("none");
  const [newDrRule, setNewDrRule] = React.useState<DamageReductionRuleValue>(DAMAGE_REDUCTION_RULES_OPTIONS[0].value);

  React.useEffect(() => {
    if (newDrRule !== 'bypassed-by-type' && newDrType === 'none') {
      setNewDrType('magic');
    }
  }, [newDrRule, newDrType]);
  
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

  const handleAddDamageReduction = () => {
    if (newDrValue <= 0) {
      toast({ title: "Invalid DR Value", description: "Damage Reduction value must be greater than 0.", variant: "destructive"});
      return;
    }
    if (!newDrType) {
        toast({ title: "DR Type Missing", description: "Please select a DR type.", variant: "destructive"});
        return;
    }
    if (newDrRule === 'excepted-by-type' && newDrType === 'none') {
      toast({ title: "Invalid Combination", description: "The 'Excepted by Type' rule requires a specific damage type (not 'None').", variant: "destructive"});
      return;
    }
     if (newDrRule === 'versus-specific-type' && newDrType === 'none') {
      toast({ title: "Invalid Combination", description: "The 'Versus Specific Type' rule requires a specific damage type (not 'None').", variant: "destructive"});
      return;
    }

    const existingUserDrOfTypeAndRule = characterData.damageReduction.find(
      dr => !dr.isGranted && dr.type === newDrType && dr.rule === newDrRule
    );
    if (existingUserDrOfTypeAndRule) {
      toast({ title: "Duplicate DR Entry", description: `You already have a custom DR with this type and rule.`, variant: "destructive"});
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
    setNewDrType(DAMAGE_REDUCTION_TYPES[0].value);
    setNewDrRule(DAMAGE_REDUCTION_RULES_OPTIONS[0].value);
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
       return `DR ${dr.value} vs ${typeLabel} (Immunity Except)`;
    }
    // Fallback, should ideally not happen if rules are exhaustive
    return `${dr.value}/${typeLabel} (Rule: ${DAMAGE_REDUCTION_RULES_OPTIONS.find(opt => opt.value === dr.rule)?.label || dr.rule})`;
  };
  
  const getDrRuleDescription = (dr: DamageReductionInstance): string => {
    const typeLabel = getDrTypeUiLabel(dr.type);
    const ruleDef = DAMAGE_REDUCTION_RULES_OPTIONS.find(opt => opt.value === dr.rule);

    if (dr.rule === 'bypassed-by-type') {
      return dr.type === "none" ? "Reduces damage from most physical attacks." : `Damage reduced unless attack is ${typeLabel}.`;
    }
    if (dr.rule === 'versus-specific-type') {
      return `Specifically reduces damage from ${typeLabel} sources.`;
    }
    if (dr.rule === 'excepted-by-type') {
        return `Immune to damage unless from ${typeLabel} sources. ${typeLabel} sources deal damage reduced by ${dr.value}.`;
    }
    return `Rule: ${ruleDef ? ruleDef.label : dr.rule}`; // Fallback
  };


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <ShieldAlert className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-serif">Resistances & Defenses</CardTitle>
          </div>
          <CardDescription>Manage custom modifiers for resistances, damage reductions, and fortification. Base values are often 0 unless granted by race, class and items.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold mb-3 text-foreground/90">Energy Resistances</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {energyResistances.map(({ field, label, Icon, fieldPrefix }) => {
                const resistance = characterData[field];
                const totalValue = (resistance?.base || 0) + (resistance?.customMod || 0);
                return (
                  <div key={field} className="p-3 border rounded-md bg-card flex flex-col items-center space-y-1 text-center shadow-sm">
                    <div className="flex items-center justify-center">
                      <Icon className="h-5 w-5 mr-1.5 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {label}
                      </span>
                    </div>
                    <div className="flex items-center justify-center">
                      <p className="text-2xl font-bold text-accent min-w-[40px] text-center">
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
                    <div className="w-full max-w-[120px] flex justify-center">
                       <NumberSpinnerInput
                        id={`${fieldPrefix}-${field}-customMod`}
                        value={resistance?.customMod || 0}
                        onChange={(newValue) => onResistanceChange(field, 'customMod', newValue)}
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
            <h4 className="text-lg font-semibold mb-3 text-foreground/90">Other Defenses</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {otherNumericResistances.map(({ field, label, Icon, unit, fieldPrefix }) => {
                const resistance = characterData[field];
                const totalValue = (resistance?.base || 0) + (resistance?.customMod || 0);
                const isFortification = field === 'fortification';
                return (
                  <div key={field} className="p-3 border rounded-md bg-card flex flex-col items-center space-y-1 text-center shadow-sm">
                     <div className="flex items-center justify-center">
                        <Icon className="h-5 w-5 mr-1.5 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {label} {unit && `(${unit})`}
                        </span>
                      </div>
                    <div className="flex items-center justify-center">
                      <p className="text-2xl font-bold text-accent min-w-[40px] text-center">
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
                     <div className="w-full max-w-[120px] flex justify-center">
                       <NumberSpinnerInput
                        id={`${fieldPrefix}-${field}-customMod`}
                        value={resistance?.customMod || 0}
                        onChange={(newValue) => onResistanceChange(field, 'customMod', newValue)}
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
              <h4 className="text-lg font-semibold mb-3 text-foreground/90">Damage Reduction</h4>
                <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-3"> 
                    {characterData.damageReduction.length > 0 ? (
                      characterData.damageReduction.map(dr => {
                        const ruleLabel = DAMAGE_REDUCTION_RULES_OPTIONS.find(opt => opt.value === dr.rule)?.label || dr.rule;
                        return (
                          <div key={dr.id} className="flex items-start justify-between p-2 border rounded-md bg-muted/5 text-sm">
                            <div>
                              <p className="font-semibold">{getDrPrimaryNotation(dr)}</p>
                              <div className="mt-0.5 flex items-center">
                                <Badge variant="outline" className="text-xs font-normal h-5 mr-1">
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
                      <p className="text-sm text-muted-foreground">No Damage Reduction entries.</p>
                    )}
                  </div>

                <div className="space-y-3 border md:border-l md:border-t-0 p-4 rounded-md md:pl-6">
                  <Label className="text-md font-medium">Custom Damage Reduction</Label>
                  <div className="space-y-1">
                      <Label htmlFor="form-dr-value" className="text-xs">Value</Label>
                      <NumberSpinnerInput
                      id="form-dr-value"
                      value={newDrValue}
                      onChange={setNewDrValue}
                      min={1}
                      inputClassName="h-9 text-sm w-20"
                      buttonClassName="h-9 w-9"
                      buttonSize="sm"
                      />
                  </div>
                   <div className="space-y-1">
                        <Label htmlFor="form-dr-rule" className="text-xs">Rule</Label>
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
                      <Label htmlFor="form-dr-type" className="text-xs">Type</Label>
                       <Select value={newDrType} onValueChange={(val) => setNewDrType(val as DamageReductionTypeValue | string)}>
                          <SelectTrigger id="form-dr-type" className="h-9 text-sm">
                             <SelectValue />
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
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Damage Reduction
                  </Button>
                </div>
              </div>
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

