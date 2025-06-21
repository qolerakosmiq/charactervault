
'use client';

import *as React from 'react';
import type { Character, ResistanceValue, DamageReductionInstance, DamageReductionTypeValue, DamageReductionRuleValue, ResistanceFieldKeySheet, AggregatedFeatEffects } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldAlert, Waves, Flame, Snowflake, Zap as ElectricityIcon, Atom, Sigma, ShieldCheck, Brain, Info, PlusCircle, Trash2, Loader2, Lock, Unlock } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { getLocalizedString } from '@/i18n/i18n-data'; 
import { DEFAULT_LANGUAGE, type LanguageCode } from '@/i18n/config'; 
import { renderModifierValue, sectionHeadingClass } from '@/components/info-dialog-content/dialog-utils';
import { DEBOUNCE_DELAY_FORM_INPUT } from '@/config/layout';

export interface ResistancesPanelProps {
  characterData: Pick<Character, 
    'fireResistance' | 'coldResistance' | 'acidResistance' | 'electricityResistance' | 'sonicResistance' |
    'spellResistance' | 'powerResistance' | 'damageReduction' | 'fortification'
  >;
  aggregatedFeatEffects: AggregatedFeatEffects | null;
  onResistanceChange: (field: ResistanceFieldKeySheet, subField: 'customMod', value: number) => void;
  onDamageReductionChange: (newDrArray: DamageReductionInstance[]) => void;
  onOpenResistanceInfoDialog: (resistanceField: ResistanceFieldKeySheet) => void;
}

const ResistancesPanelComponent = ({ characterData, aggregatedFeatEffects, onResistanceChange, onDamageReductionChange, onOpenResistanceInfoDialog }: ResistancesPanelProps) => {
  const { translations, isLoading: translationsLoading, language: currentLang } = useI18n();
  const { toast } = useToast();
  const [isLocked, setIsLocked] = React.useState(false);
  const toggleLock = () => setIsLocked(prev => !prev);

  const [newDrValue, setNewDrValue] = React.useState(1);
  const [newDrType, setNewDrType] = React.useState<DamageReductionTypeValue | string>("none");
  const [newDrRule, setNewDrRule] = React.useState<DamageReductionRuleValue>('bypassed-by-type');

  const energyResistancesFields: Array<{ field: ResistanceFieldKeySheet; labelKey: keyof NonNullable<NonNullable<typeof translations>['UI_STRINGS']>; Icon: React.ElementType; fieldPrefix?: string }> = React.useMemo(() => [
    { field: 'fireResistance', labelKey: 'resistanceLabelFire', Icon: Flame, fieldPrefix: 'form-res' },
    { field: 'coldResistance', labelKey: 'resistanceLabelCold', Icon: Snowflake, fieldPrefix: 'form-res' },
    { field: 'acidResistance', labelKey: 'resistanceLabelAcid', Icon: Atom, fieldPrefix: 'form-res' },
    { field: 'electricityResistance', labelKey: 'resistanceLabelElectricity', Icon: ElectricityIcon, fieldPrefix: 'form-res' },
    { field: 'sonicResistance', labelKey: 'resistanceLabelSonic', Icon: Waves, fieldPrefix: 'form-res' },
  ], []);

  const otherNumericResistancesFields: Array<{ field: ResistanceFieldKeySheet; labelKey: keyof NonNullable<NonNullable<typeof translations>['UI_STRINGS']>; Icon: React.ElementType; unit?: string; fieldPrefix?: string }> = React.useMemo(() => [
    { field: 'spellResistance', labelKey: 'resistanceLabelSpell', Icon: Sigma, fieldPrefix: 'form-res' },
    { field: 'powerResistance', labelKey: 'resistanceLabelPower', Icon: Brain, fieldPrefix: 'form-res' },
    { field: 'fortification', labelKey: 'resistanceLabelFortification', Icon: ShieldCheck, unit: '%', fieldPrefix: 'form-res' },
  ], []);

  const debouncedResistanceMods = {} as Record<ResistanceFieldKeySheet, [number, (val: number) => void]>;

  [...energyResistancesFields, ...otherNumericResistancesFields].forEach(({ field }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    debouncedResistanceMods[field] = useDebouncedFormField(
      characterData[field]?.customMod || 0,
      (value) => onResistanceChange(field, 'customMod', value),
      DEBOUNCE_DELAY_FORM_INPUT
    );
  });


 React.useEffect(() => {
    if (translationsLoading || !translations) return;
    const { DAMAGE_REDUCTION_TYPES, DAMAGE_REDUCTION_RULES_OPTIONS } = translations;
    if (!DAMAGE_REDUCTION_TYPES || !DAMAGE_REDUCTION_RULES_OPTIONS) throw new Error("[DATA_ERROR] DR types/rules missing in translations.");


    if (newDrRule !== 'bypassed-by-type' && newDrType === 'none') {
      const firstNonNoneType = DAMAGE_REDUCTION_TYPES.find(t => t.id !== 'none')?.id || 'magic';
      setNewDrType(firstNonNoneType);
    }
    if (newDrType === "none" && !newDrRule) {
        setNewDrRule(DAMAGE_REDUCTION_RULES_OPTIONS[0]?.id || 'bypassed-by-type');
    }
  }, [newDrRule, newDrType, translations, translationsLoading]);
  
  if (translationsLoading || !translations || !translations.UI_STRINGS || !translations.DAMAGE_REDUCTION_TYPES || !translations.DAMAGE_REDUCTION_RULES_OPTIONS || !aggregatedFeatEffects) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <ShieldAlert className="h-8 w-8 text-primary" />
              <Skeleton className="h-7 w-1/2" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
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
    if (onOpenResistanceInfoDialog) {
      onOpenResistanceInfoDialog(field);
    }
  };

  const handleAddDamageReduction = () => {
    if (newDrValue <= 0) {
      toast({ title: UI_STRINGS.toastInvalidDrValueTitle, description: UI_STRINGS.toastInvalidDrValueDesc, variant: "destructive"});
      return;
    }
     if (!newDrType) { 
        toast({ title: UI_STRINGS.toastDrTypeMissingTitle, description: UI_STRINGS.toastDrTypeMissingDesc, variant: "destructive"});
        return;
    }
    const ruleLabelForToast = DAMAGE_REDUCTION_RULES_OPTIONS.find(opt => opt.id === newDrRule)?.label || newDrRule;
    if ((newDrRule === 'excepted-by-type' || newDrRule === 'versus-specific-type') && newDrType === 'none') {
      toast({ 
        title: UI_STRINGS.toastDrInvalidCombinationTitle, 
        description: (UI_STRINGS.toastDrInvalidCombinationDesc).replace("{ruleLabel}", ruleLabelForToast), 
        variant: "destructive"
      });
      return;
    }

    const existingUserDrOfTypeAndRule = characterData.damageReduction.find(
      dr => !dr.isGranted && dr.type === newDrType && dr.rule === newDrRule
    );
    if (existingUserDrOfTypeAndRule) {
      toast({ title: UI_STRINGS.toastDrDuplicateEntryTitle, description: UI_STRINGS.toastDrDuplicateEntryDesc, variant: "destructive"});
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
    setNewDrType(DAMAGE_REDUCTION_TYPES[0]?.id || "none");
    setNewDrRule(DAMAGE_REDUCTION_RULES_OPTIONS[0]?.id || 'bypassed-by-type');
  };

  const handleRemoveDamageReduction = (idToRemove: string) => {
    onDamageReductionChange(characterData.damageReduction.filter(dr => dr.id !== idToRemove));
  };
  
  const getDrTypeUiLabel = (typeValue: DamageReductionTypeValue | string): string => {
    const drType = DAMAGE_REDUCTION_TYPES.find(t => t.id === typeValue);
    if (!drType) throw new Error(`[DATA_ERROR] DR Type definition not found for ID: ${typeValue}`);
    return drType.label;
  };
  
  const getDrPrimaryNotation = (dr: DamageReductionInstance): React.ReactNode => {
    const typeLabel = getDrTypeUiLabel(dr.type);
    const vsLabel = UI_STRINGS.drVsLabel;
    const immunitySuffix = UI_STRINGS.drImmunitySuffixLabel;
    const valueText = dr.value;

    if (dr.rule === 'bypassed-by-type') {
      return dr.type === "none" ? <>{valueText}/—</> : <>{valueText}/{typeLabel}</>;
    }
    if (dr.rule === 'versus-specific-type') {
      return <>{valueText} {vsLabel} {typeLabel}</>;
    }
    if (dr.rule === 'excepted-by-type') {
       const noneTypeLabel = DAMAGE_REDUCTION_TYPES.find(t => t.id === 'none')?.label;
       if (!noneTypeLabel) throw new Error("[DATA_ERROR] DR Type 'none' definition missing.");
       const displayType = typeLabel === noneTypeLabel ? "—" : typeLabel;
       return <>{valueText}/{displayType} {immunitySuffix}</>;
    }
    const ruleDef = DAMAGE_REDUCTION_RULES_OPTIONS.find(opt => opt.id === dr.rule);
    if (!ruleDef) throw new Error(`[DATA_ERROR] DR Rule definition not found for ID: ${dr.rule}`);
    return <>{valueText}/{typeLabel} ({ruleDef.label})</>;
  };
  
  const getDrRuleDescription = (dr: DamageReductionInstance): React.ReactNode => {
    const typeLabel = getDrTypeUiLabel(dr.type);
    const ruleDef = DAMAGE_REDUCTION_RULES_OPTIONS.find(opt => opt.id === dr.rule);
    if (!ruleDef) throw new Error(`[DATA_ERROR] DR Rule definition not found for ID: ${dr.rule}`);
    const value = dr.value;
    
    let descriptionKey: keyof typeof UI_STRINGS | undefined;

    if (dr.rule === 'bypassed-by-type') {
      descriptionKey = dr.type === "none" ? 'drBypassedByNoneDesc' : 'drBypassedByTypeDesc';
    } else if (dr.rule === 'versus-specific-type') {
      descriptionKey = 'drVersusSpecificTypeDesc';
    } else if (dr.rule === 'excepted-by-type') {
      descriptionKey = 'drExceptedByTypeDesc';
    }

    if (descriptionKey && UI_STRINGS[descriptionKey]) {
        const template = UI_STRINGS[descriptionKey];
        const parts = template.split(/({value}|{typeLabel})/g);
        return parts.map((part, index) => {
            if (part === "{value}") return <Badge key={`${dr.id}-val-${index}`} variant="outline">{value}</Badge>;
            if (part === "{typeLabel}") return <Badge key={`${dr.id}-type-${index}`} variant="outline">{typeLabel}</Badge>;
            return part;
        });
    }
    return `${UI_STRINGS.resistancesPanelDrRuleLabel}: ${ruleDef.label}`;
  };


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <ShieldAlert className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl font-serif">{UI_STRINGS.resistancesPanelTitle}</CardTitle>
                <CardDescription>{UI_STRINGS.resistancesPanelDescription}</CardDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 shrink-0 p-1.5", 
                isLocked
                  ? "text-muted-foreground hover:text-foreground"
                  : "bg-accent text-accent-foreground hover:bg-accent/90"
              )}
              onClick={toggleLock}
              aria-pressed={!isLocked}
              aria-label={isLocked ? UI_STRINGS.lockButtonAriaLabelUnlocked : UI_STRINGS.lockButtonAriaLabelLocked}
            >
              {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold mb-3 text-foreground/90">{UI_STRINGS.resistancesPanelEnergyResistancesLabel}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {energyResistancesFields.map(({ field, labelKey, Icon, fieldPrefix }) => {
                const resistanceFromProp = characterData[field];
                const itemBonus = aggregatedFeatEffects.resistanceBonuses.find(rb => rb.resistanceTo === field && rb.isActive)?.value || 0;
                const totalValue = (resistanceFromProp?.base || 0) + (resistanceFromProp?.customMod || 0) + itemBonus;
                const label = UI_STRINGS[labelKey]; 
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
                      <p className="text-xl font-bold text-accent text-center">
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
                       <Label htmlFor={`${fieldPrefix}-${field}-customMod`} className="text-xs text-muted-foreground mb-0.5">{UI_STRINGS.infoDialogCustomModifierLabel}</Label>
                       <NumberSpinnerInput
                        id={`${fieldPrefix}-${field}-customMod`}
                        value={localCustomMod} 
                        onChange={setLocalCustomMod} 
                        min={-50} 
                        inputClassName="w-16 h-7 text-sm text-center" 
                        buttonClassName="h-7 w-7"
                        buttonSize="sm"
                        disabled={isLocked}
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
                const itemBonus = aggregatedFeatEffects.resistanceBonuses.find(rb => rb.resistanceTo === field && rb.isActive)?.value || 0;
                const totalValue = (resistanceFromProp?.base || 0) + (resistanceFromProp?.customMod || 0) + itemBonus;
                const isFortification = field === 'fortification';
                const label = UI_STRINGS[labelKey];
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
                      <p className="text-xl font-bold text-accent text-center">
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
                       <Label htmlFor={`${fieldPrefix}-${field}-customMod`} className="text-xs text-muted-foreground mb-0.5">{UI_STRINGS.infoDialogCustomModifierLabel}</Label>
                       <NumberSpinnerInput
                        id={`${fieldPrefix}-${field}-customMod`}
                        value={localCustomMod}
                        onChange={setLocalCustomMod}
                        min={isFortification ? 0 : -50} 
                        max={isFortification ? 100 : undefined} 
                        inputClassName="w-16 h-7 text-sm text-center"
                        buttonClassName="h-7 w-7"
                        buttonSize="sm"
                        disabled={isLocked}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <Separator className="my-6" />
             <div>
              <h4 className="text-lg font-semibold mb-3 text-foreground/90">{UI_STRINGS.resistancesPanelDamageReductionLabel}</h4>
                <div className="grid md:grid-cols-3 gap-x-6 gap-y-4">
                  <div className="md:col-span-1 space-y-3 border p-4 rounded-md">
                    <Label className="text-md font-medium">{UI_STRINGS.resistancesPanelAddCustomDrLabel}</Label>
                    <div className="w-full space-y-1">
                        <Label htmlFor="form-dr-value" className="text-sm inline-block w-full text-center">{UI_STRINGS.resistancesPanelDrValueLabel}</Label>
                        <NumberSpinnerInput
                        id="form-dr-value"
                        value={newDrValue}
                        onChange={setNewDrValue}
                        min={1}
                        inputClassName="h-9 text-sm w-full text-center" 
                        buttonClassName="h-9 w-9"
                        buttonSize="sm"
                        className="w-full" 
                        disabled={isLocked}
                        />
                    </div>
                    <div className="space-y-1">
                          <Label htmlFor="form-dr-rule" className="text-sm inline-block w-full text-left">{UI_STRINGS.resistancesPanelDrRuleLabel}</Label>
                          <Select value={newDrRule} onValueChange={(val) => setNewDrRule(val as DamageReductionRuleValue)} disabled={isLocked}>
                              <SelectTrigger id="form-dr-rule" className="h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                  {DAMAGE_REDUCTION_RULES_OPTIONS.map(option => (
                                      <SelectItem key={option.id} value={option.id}>
                                          {option.label}
                                      </SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>
                    <div className="space-y-1">
                        <Label htmlFor="form-dr-type" className="text-sm inline-block w-full text-left">{UI_STRINGS.resistancesPanelDrTypeLabel}</Label>
                        <Select value={newDrType} onValueChange={(val) => setNewDrType(val as DamageReductionTypeValue | string)} disabled={isLocked}>
                            <SelectTrigger id="form-dr-type" className="h-9 text-sm">
                              <SelectValue placeholder={UI_STRINGS.resistancesPanelDrSelectTypePlaceholder} />
                            </SelectTrigger>
                            <SelectContent>
                                {DAMAGE_REDUCTION_TYPES.map(option => (
                                    <SelectItem 
                                      key={option.id} 
                                      value={option.id}
                                      disabled={option.id === 'none' && newDrRule !== 'bypassed-by-type'}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="button" onClick={handleAddDamageReduction} size="sm" className="mt-3 w-full" disabled={isLocked}>
                        <PlusCircle className="mr-2 h-4 w-4" /> {UI_STRINGS.resistancesPanelAddDrButton}
                    </Button>
                  </div>
                  
                  <div className="md:col-span-2 space-y-3">
                    {characterData.damageReduction.length > 0 ? (
                      characterData.damageReduction.map(dr => {
                        const ruleDef = DAMAGE_REDUCTION_RULES_OPTIONS.find(opt => opt.id === dr.rule);
                        if (!ruleDef) throw new Error(`[DATA_ERROR] Missing DR Rule Definition for ID: ${dr.rule}`);
                        const ruleLabel = ruleDef.label;
                        const currentLangCodeForDr = UI_STRINGS.currentLangCodeForNotesFallback as LanguageCode || DEFAULT_LANGUAGE;
                        return (
                          <div key={dr.id} className="flex flex-col items-start justify-between p-2 border rounded-md bg-muted/5 text-sm">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-x-1 flex-wrap">
                                  <span className="font-semibold text-xl text-accent">{getDrPrimaryNotation(dr)}</span>
                                  <Badge variant="outline" className="ml-1">
                                     {ruleLabel}
                                   </Badge>
                                   {dr.isGranted && dr.source && (
                                    <Badge variant="secondary" className="ml-1">{getLocalizedString(dr.source, currentLangCodeForDr, DEFAULT_LANGUAGE, `drSource.${dr.id}`)}</Badge>
                                  )}
                                </div>
                                {!dr.isGranted && (
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80 shrink-0" onClick={() => handleRemoveDamageReduction(dr.id)} disabled={isLocked}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                )}
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground w-full">
                                {getDrRuleDescription(dr)}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">{UI_STRINGS.resistancesPanelNoDrEntries}</p>
                    )}
                  </div>

                </div>
              </div>

          </div>
        </CardContent>
      </Card>
    </>
  );
};
ResistancesPanelComponent.displayName = 'ResistancesPanelComponent';
export const ResistancesPanel = React.memo(ResistancesPanelComponent);
