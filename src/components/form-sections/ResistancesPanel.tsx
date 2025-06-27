
'use client';

import *as React from 'react';
import type { Character, ResistanceValue, DamageReductionInstance, DamageReductionTypeValue, DamageReductionRuleValue, ResistanceFieldKeySheet, AggregatedFeatEffects } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldAlert, Waves, Flame, Snowflake, Zap as ElectricityIcon, Atom, Sigma, ShieldCheck, Brain, Info, PlusCircle, Trash2, Lock, Unlock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/context/I18nProvider';
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';
import { cn } from '@/lib/utils';
import { getLocalizedString } from '@/i18n/i18n-data';
import { DEFAULT_LANGUAGE, type LanguageCode } from '@/i18n/config';
import { renderModifierValue, sectionHeadingClass } from '@/components/info-dialog-content/dialog-utils';
import {
  debounceDelayFormInput,
  textStyleDescription,
  panelGridGap,
  panelContentPadding,
  panelFieldVerticalGap,
  textStyleInput,
  inputWidthStandard,
  textStyleSectionSubheading,
  panelFieldHorizontalGap,
  panelBadgeGroupGap,
  textStyleValueBig,
  textStyleLabel,
  textStyleCardTitle,
} from '@/config/layout';
import { LockablePanelWrapper } from '@/components/LockablePanelWrapper';

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

const ResistancesPanelContent = React.memo(({
  panelIsLocked,
  characterData,
  aggregatedFeatEffects,
  onResistanceChange,
  onDamageReductionChange,
  onOpenResistanceInfoDialog,
  translations
}: ResistancesPanelProps & { panelIsLocked: boolean, translations: NonNullable<ReturnType<typeof useI18n>['translations']>}) => {
  const { toast } = useToast();

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
      debounceDelayFormInput
    );
  });

  React.useEffect(() => {
    if (!translations) return;
    const { DAMAGE_REDUCTION_TYPES, DAMAGE_REDUCTION_RULES_OPTIONS } = translations;
    if (!DAMAGE_REDUCTION_TYPES || !DAMAGE_REDUCTION_RULES_OPTIONS) throw new Error("[DATA_ERROR] DR types/rules missing in translations.");
    if (newDrRule !== 'bypassed-by-type' && newDrType === 'none') {
      const firstNonNoneType = DAMAGE_REDUCTION_TYPES.find(t => t.id !== 'none')?.id || 'magic';
      setNewDrType(firstNonNoneType);
    }
    if (newDrType === "none" && !newDrRule) {
        setNewDrRule(DAMAGE_REDUCTION_RULES_OPTIONS[0]?.id || 'bypassed-by-type');
    }
  }, [newDrRule, newDrType, translations]);
  
  if (!translations || !translations.UI_STRINGS || !translations.DAMAGE_REDUCTION_TYPES || !translations.DAMAGE_REDUCTION_RULES_OPTIONS || !aggregatedFeatEffects) return null;
  
  const { DAMAGE_REDUCTION_TYPES, DAMAGE_REDUCTION_RULES_OPTIONS, UI_STRINGS } = translations;
  const currentLang = UI_STRINGS.currentLangCodeForNotesFallback as LanguageCode || DEFAULT_LANGUAGE;

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
    if (dr.rule === 'bypassed-by-type') return dr.type === "none" ? <>{valueText}/—</> : <>{valueText}/{typeLabel}</>;
    if (dr.rule === 'versus-specific-type') return <>{valueText} {vsLabel} {typeLabel}</>;
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
    if (dr.rule === 'bypassed-by-type') descriptionKey = dr.type === "none" ? 'drBypassedByNoneDesc' : 'drBypassedByTypeDesc';
    else if (dr.rule === 'versus-specific-type') descriptionKey = 'drVersusSpecificTypeDesc';
    else if (dr.rule === 'excepted-by-type') descriptionKey = 'drExceptedByTypeDesc';
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
    <div className={cn("flex flex-col", panelGridGap)}>
      <div className={cn("flex flex-col", panelGridGap)}>
        <h4 className={cn(textStyleSectionSubheading)}>{UI_STRINGS.resistancesPanelEnergyResistancesLabel}</h4>
        <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5", panelGridGap)}>
          {energyResistancesFields.map(({ field, labelKey, Icon, fieldPrefix }) => {
            const resistanceFromProp = characterData[field];
            const itemBonus = aggregatedFeatEffects.resistanceBonuses.find(rb => rb.resistanceTo === field && rb.isActive)?.value || 0;
            const totalValue = (resistanceFromProp?.base || 0) + (resistanceFromProp?.customMod || 0) + itemBonus;
            const label = UI_STRINGS[labelKey];
            const [localCustomMod, setLocalCustomMod] = debouncedResistanceMods[field];
            return (
              <div key={field} className={cn("p-3 border rounded-md bg-card flex flex-col items-center shadow-sm", panelFieldVerticalGap)}>
                <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className={cn(textStyleCardTitle)}>{label}</span>
                </div>
                <div className={cn("flex items-center justify-center", panelBadgeGroupGap)}>
                  <p className={cn(textStyleValueBig)}>{totalValue}</p>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => handleTriggerResistanceInfoDialog(field)}><Info className="h-4 w-4" /></Button>
                </div>
                <div className={cn("flex flex-col items-center", panelFieldVerticalGap)}>
                  <Label htmlFor={`${fieldPrefix}-${field}-customMod`} className={cn(textStyleLabel)}>{UI_STRINGS.infoDialogCustomModifierLabel}</Label>
                  <div className={cn("flex justify-center", inputWidthStandard)}>
                     <Input
                      id={`${fieldPrefix}-${field}-customMod`}
                      type="number"
                      value={localCustomMod}
                      onChange={(e) => setLocalCustomMod(parseInt(e.target.value, 10) || 0)}
                      className={cn(textStyleInput)}
                      disabled={panelIsLocked}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className={cn("flex flex-col", panelGridGap)}>
        <h4 className={cn(textStyleSectionSubheading)}>{UI_STRINGS.resistancesPanelOtherDefensesLabel}</h4>
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3", panelGridGap)}>
          {otherNumericResistancesFields.map(({ field, labelKey, Icon, unit, fieldPrefix }) => {
            const resistanceFromProp = characterData[field];
            const itemBonus = aggregatedFeatEffects.resistanceBonuses.find(rb => rb.resistanceTo === field && rb.isActive)?.value || 0;
            const totalValue = (resistanceFromProp?.base || 0) + (resistanceFromProp?.customMod || 0) + itemBonus;
            const isFortification = field === 'fortification';
            const label = UI_STRINGS[labelKey];
            const [localCustomMod, setLocalCustomMod] = debouncedResistanceMods[field];
            
            const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
              let numericValue = parseInt(e.target.value, 10);
              if (isNaN(numericValue)) {
                  numericValue = 0;
              }
              if (isFortification) {
                  numericValue = Math.max(0, Math.min(100, numericValue));
              }
              setLocalCustomMod(numericValue);
            };

            return (
              <div key={field} className={cn("p-3 border rounded-md bg-card flex flex-col items-center shadow-sm", panelFieldVerticalGap)}>
                <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className={cn(textStyleCardTitle)}>{label} {unit && <span className="text-sm text-muted-foreground font-normal">({unit})</span>}</span>
                </div>
                <div className={cn("flex items-center justify-center", panelBadgeGroupGap)}>
                  <p className={cn(textStyleValueBig)}>{totalValue}</p>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => handleTriggerResistanceInfoDialog(field)}><Info className="h-4 w-4" /></Button>
                </div>
                <div className={cn("flex flex-col items-center", panelFieldVerticalGap)}>
                  <Label htmlFor={`${fieldPrefix}-${field}-customMod`} className={cn(textStyleLabel)}>{UI_STRINGS.infoDialogCustomModifierLabel}</Label>
                  <div className={cn("flex justify-center", inputWidthStandard)}>
                    <Input
                      id={`${fieldPrefix}-${field}-customMod`}
                      type="number"
                      value={localCustomMod}
                      onChange={handleInputChange}
                      className={cn(textStyleInput)}
                      disabled={panelIsLocked}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className={cn("flex flex-col", panelGridGap)}>
          <h4 className={textStyleSectionSubheading}>{UI_STRINGS.resistancesPanelDamageReductionLabel}</h4>
          <div className={cn("grid md:grid-cols-3", panelGridGap)}>
            <div className={cn("md:col-span-1 border p-4 rounded-md flex flex-col", panelGridGap)}>
              <Label className="text-md font-medium">{UI_STRINGS.resistancesPanelAddCustomDrLabel}</Label>
              <div className="flex flex-col gap-1">
                <Label htmlFor="form-dr-value" className="text-sm inline-block text-center">{UI_STRINGS.resistancesPanelDrValueLabel}</Label>
                <Input id="form-dr-value" type="number" value={newDrValue} onChange={(e) => setNewDrValue(parseInt(e.target.value, 10) || 0)} className={cn(textStyleInput, "h-10")} disabled={panelIsLocked} />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="form-dr-rule" className="text-sm inline-block text-left">{UI_STRINGS.resistancesPanelDrRuleLabel}</Label>
                <Select value={newDrRule} onValueChange={(val) => setNewDrRule(val as DamageReductionRuleValue)} disabled={panelIsLocked}>
                  <SelectTrigger id="form-dr-rule" className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{DAMAGE_REDUCTION_RULES_OPTIONS.map(option => (<SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="form-dr-type" className="text-sm inline-block text-left">{UI_STRINGS.resistancesPanelDrTypeLabel}</Label>
                <Select value={newDrType} onValueChange={(val) => setNewDrType(val as DamageReductionTypeValue | string)} disabled={panelIsLocked}>
                  <SelectTrigger id="form-dr-type" className="h-9 text-sm"><SelectValue placeholder={UI_STRINGS.resistancesPanelDrSelectTypePlaceholder} /></SelectTrigger>
                  <SelectContent>{DAMAGE_REDUCTION_TYPES.map(option => (<SelectItem key={option.id} value={option.id} disabled={option.id === 'none' && newDrRule !== 'bypassed-by-type'}>{option.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <Button type="button" onClick={handleAddDamageReduction} size="sm" className="w-full" disabled={panelIsLocked}><PlusCircle className="mr-2 h-4 w-4" /> {UI_STRINGS.resistancesPanelAddDrButton}</Button>
            </div>
            <div className={cn("md:col-span-2 flex flex-col", panelGridGap)}>
              {characterData.damageReduction.length > 0 ? (
                characterData.damageReduction.map(dr => {
                  const ruleDef = DAMAGE_REDUCTION_RULES_OPTIONS.find(opt => opt.id === dr.rule);
                  if (!ruleDef) throw new Error(`[DATA_ERROR] Missing DR Rule Definition for ID: ${dr.rule}`);
                  const ruleLabel = ruleDef.label;
                  const currentLangCodeForDr = UI_STRINGS.currentLangCodeForNotesFallback as LanguageCode || DEFAULT_LANGUAGE;
                  return (
                    <div key={dr.id} className={cn("flex flex-col items-start justify-between p-2 border rounded-md bg-muted/5 text-sm", panelFieldVerticalGap)}>
                      <div className="flex items-center justify-between w-full">
                        <div className={cn("flex items-center flex-wrap", panelBadgeGroupGap)}><span className="font-semibold text-xl text-accent">{getDrPrimaryNotation(dr)}</span><Badge variant="outline">{ruleLabel}</Badge>{dr.isGranted && dr.source && (<Badge variant="secondary">{getLocalizedString(dr.source, currentLangCodeForDr, DEFAULT_LANGUAGE, `drSource.${dr.id}`)}</Badge>)}</div>
                        {!dr.isGranted && (<Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80 shrink-0" onClick={() => handleRemoveDamageReduction(dr.id)} disabled={panelIsLocked}><Trash2 className="h-4 w-4" /></Button>)}
                      </div>
                      <div className="text-sm text-muted-foreground w-full">{getDrRuleDescription(dr)}</div>
                    </div>
                  );
                })
              ) : (<p className="text-sm text-muted-foreground">{UI_STRINGS.resistancesPanelNoDrEntries}</p>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
ResistancesPanelContent.displayName = 'ResistancesPanelContent';

const ResistancesPanelComponent = ({ characterData, aggregatedFeatEffects, onResistanceChange, onDamageReductionChange, onOpenResistanceInfoDialog }: ResistancesPanelProps) => {
  const { translations, isLoading: translationsLoading } = useI18n();

  if (translationsLoading || !translations) return null;

  return (
    <LockablePanelWrapper
      title={translations.UI_STRINGS.resistancesPanelTitle}
      description={translations.UI_STRINGS.resistancesPanelDescription}
      icon={ShieldAlert}
      initialLockedState={false}
    >
      {({ isLocked: panelIsLocked }) => (
        <ResistancesPanelContent
          panelIsLocked={panelIsLocked}
          characterData={characterData}
          aggregatedFeatEffects={aggregatedFeatEffects}
          onResistanceChange={onResistanceChange}
          onDamageReductionChange={onDamageReductionChange}
          onOpenResistanceInfoDialog={onOpenResistanceInfoDialog}
          translations={translations}
        />
      )}
    </LockablePanelWrapper>
  );
};
ResistancesPanelComponent.displayName = 'ResistancesPanelComponent';
export const ResistancesPanel = React.memo(ResistancesPanelComponent);
