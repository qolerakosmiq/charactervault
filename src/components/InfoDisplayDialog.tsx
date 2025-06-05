
'use client';

import *as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, Wind, Waves, MoveVertical, Shell, Feather, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type {
  Character, AbilityName, AbilityScoreBreakdown, RaceSpecialQualities,
  InfoDialogContentType, ResistanceFieldKeySheet,
  FeatDefinitionJsonData, SkillDefinitionForDisplay, SkillDefinitionJsonData,
  BabBreakdownDetails as BabBreakdownDetailsType,
  InitiativeBreakdownDetails as InitiativeBreakdownDetailsType,
  GrappleModifierBreakdownDetails as GrappleModifierBreakdownDetailsType,
  GrappleDamageBreakdownDetails as GrappleDamageBreakdownDetailsType,
  ResistanceValue,
  PrerequisiteMessage,
  SpeedType,
  SpeedBreakdownDetails as SpeedBreakdownDetailsType,
  SpeedComponent,
  CharacterSizeObject, 
  DndRaceOption, DndClassOption, AbilityScores
} from '@/types/character';

import {
  getRaceSpecialQualities,
  calculateDetailedAbilityScores,
  calculateTotalSynergyBonus,
  calculateFeatBonusesForSkill,
  calculateRacialSkillBonus,
  calculateSizeSpecificSkillBonus,
  checkFeatPrerequisites,
  calculateSpeedBreakdown,
  ABILITY_ORDER_INTERNAL,
  getRaceSkillPointsBonusPerLevel
} from '@/types/character';
import { useDefinitionsStore, type CustomSkillDefinition } from '@/lib/definitions-store';
import { useI18n } from '@/context/I18nProvider';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';


import {
  calculateAbilityModifier, getAbilityModifierByName, getBab, getSizeModifierAC, getSizeModifierGrapple,
  calculateInitiative, calculateGrapple, getUnarmedGrappleDamage
} from '@/lib/dnd-utils';


export interface ResistanceBreakdownDetails {
  name: string;
  base: number;
  customMod: number;
  total: number;
}

export interface BabBreakdownDetails extends BabBreakdownDetailsType {
  characterClassLabel?: string;
}
export interface InitiativeBreakdownDetails extends InitiativeBreakdownDetailsType {}
export interface GrappleModifierBreakdownDetails extends GrappleModifierBreakdownDetailsType {}
export interface GrappleDamageBreakdownDetails extends GrappleDamageBreakdownDetailsType {}
export interface SpeedBreakdownDetails extends SpeedBreakdownDetailsType {}


interface InfoDisplayDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  character: Character;
  contentType: InfoDialogContentType | null;
}

const SPEED_ICONS: Record<SpeedType, React.ElementType> = {
  land: Wind,
  burrow: Shell,
  climb: MoveVertical,
  fly: Feather,
  swim: Waves,
};


const ExpandableDetailWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="mt-1.5 p-3 rounded-md bg-muted/20 border border-border/30">
      {children}
    </div>
  );
};

// Internal component for displaying feat details
const FeatDetailContent: React.FC<{
  featId: string;
  character: Character;
  allFeats: readonly (FeatDefinitionJsonData & {isCustom?: boolean})[];
  allPredefinedSkills: readonly SkillDefinitionJsonData[];
  allCustomSkills: readonly CustomSkillDefinition[];
  allClasses: readonly DndClassOption[]; // From translations
  allRaces: readonly DndRaceOption[];   // From translations
  abilityLabels: readonly {value: Exclude<AbilityName, 'none'>, label:string, abbr:string}[]; // From translations
  alignmentPrereqOptions: readonly {value: string, label:string}[]; // From translations
  uiStrings: Record<string, string>; // For prerequisite and effect labels
}> = ({ featId, character, allFeats, allPredefinedSkills, allCustomSkills, allClasses, allRaces, abilityLabels, alignmentPrereqOptions, uiStrings }) => {
  const featDef = allFeats.find(f => f.value === featId);
  if (!featDef) return <p className="text-sm text-muted-foreground">{uiStrings.infoDialogFeatNotFound || "Feat details not found."}</p>;

  const prereqMessages = checkFeatPrerequisites(featDef, character, allFeats, allPredefinedSkills, allCustomSkills, allClasses, allRaces, abilityLabels, alignmentPrereqOptions);

  return (
    <div className="space-y-2 text-sm">
      {featDef.description && <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: featDef.description }} />}
      {prereqMessages.length > 0 && (
        <div className="mt-2">
          <p className="text-sm font-medium text-muted-foreground">{uiStrings.featPrerequisitesLabel || "Prerequisites:"}</p>
          <ul className="list-disc list-inside text-sm">
            {prereqMessages.map((msg, index) => (
              <li key={index} className={cn(!msg.isMet && "text-destructive")}>
                <span dangerouslySetInnerHTML={{ __html: msg.text }}></span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {featDef.effectsText && (
        <div className="mt-2">
          <p className="text-sm font-medium text-muted-foreground">{uiStrings.featEffectsLabel || "Effects:"}</p>
          <p className="text-sm">{featDef.effectsText}</p>
        </div>
      )}
    </div>
  );
};


export function InfoDisplayDialog({
  isOpen,
  onOpenChange,
  character,
  contentType,
}: InfoDisplayDialogProps) {
  const { translations, isLoading: translationsLoading } = useI18n();
  const { customFeatDefinitions, customSkillDefinitions } = useDefinitionsStore(state => ({
    customFeatDefinitions: state.customFeatDefinitions,
    customSkillDefinitions: state.customSkillDefinitions,
  }));

  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  React.useEffect(() => {
    if (!isOpen) {
      setExpandedItems(new Set());
    }
  }, [isOpen]);


  const allCombinedFeatDefinitions = React.useMemo(() => {
    if (translationsLoading || !translations) return [];
    return [
      ...translations.DND_FEATS_DEFINITIONS.map(def => ({ ...def, isCustom: false as const })),
      ...customFeatDefinitions,
    ];
  }, [translations, translationsLoading, customFeatDefinitions]);

  const allCombinedSkillDefinitionsForDisplay = React.useMemo((): SkillDefinitionForDisplay[] => {
    if (translationsLoading || !translations) return [];
    const predefined = translations.SKILL_DEFINITIONS.map(sd => ({
      id: sd.value,
      name: sd.label,
      keyAbility: sd.keyAbility as AbilityName,
      description: sd.description,
      isCustom: false,
      providesSynergies: (translations.SKILL_SYNERGIES as Record<string, any>)[sd.value] || [],
    }));
    const custom = customSkillDefinitions.map(csd => ({
      ...csd,
      isCustom: true,
    }));
    return [...predefined, ...custom].sort((a, b) => a.name.localeCompare(b.name));
  }, [translations, translationsLoading, customSkillDefinitions]);


  const renderModifierValue = (value: number | string,
    positiveColor = "text-emerald-500",
    negativeColor = "text-destructive",
    zeroColor = "text-muted-foreground",
    accentColor = "text-accent",
    isTotal = false
  ) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) {
      return <span className="font-bold">{value}</span>;
    }
    let colorClass = zeroColor;
     if (isTotal) {
        colorClass = accentColor;
    } else if (numValue > 0) {
        colorClass = positiveColor;
    } else if (numValue < 0) {
        colorClass = negativeColor;
    } else { 
        colorClass = zeroColor;
    }
    const prefix = numValue > 0 ? '+' : (numValue === 0 && isTotal ? '' : (numValue === 0 ? '+' : ''));
    return <span className={cn("font-bold", colorClass)}>{prefix}{numValue}</span>;
  };

  const derivedData = React.useMemo((): DerivedDialogData | null => {
    if (!isOpen || !contentType || !character || translationsLoading || !translations) {
      return null;
    }

    const {
      DND_RACES, DND_CLASSES, DND_DEITIES, ALIGNMENTS, SKILL_DEFINITIONS, SIZES,
      DND_FEATS_DEFINITIONS: PREDEFINED_FEATS, ABILITY_LABELS,
      DND_RACE_ABILITY_MODIFIERS_DATA, DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA,
      SKILL_SYNERGIES: SKILL_SYNERGIES_DATA, CLASS_SKILLS: CLASS_SKILLS_DATA,
      ALIGNMENT_PREREQUISITE_OPTIONS, DND_RACE_BASE_MAX_AGE_DATA, RACE_TO_AGING_CATEGORY_MAP_DATA, DND_RACE_AGING_EFFECTS_DATA, UI_STRINGS
    } = translations;

    let data: DerivedDialogData = { title: UI_STRINGS.infoDialogDefaultTitle || 'Information' };

    switch (contentType.type) {
      case 'race': {
        const raceId = character.race;
        const raceData = DND_RACES.find(r => r.value === raceId);
        const qualities = getRaceSpecialQualities(raceId, DND_RACES, DND_RACE_ABILITY_MODIFIERS_DATA, SKILL_DEFINITIONS, PREDEFINED_FEATS, ABILITY_LABELS);
        const racialSkillPointBonus = getRaceSkillPointsBonusPerLevel(raceId, DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA);
        const details: Array<{ label: string; value: string | number | React.ReactNode; isBold?: boolean }> = [];
        if (racialSkillPointBonus > 0) {
          details.push({ label: UI_STRINGS.infoDialogBonusFeatSlots || "Bonus Skill Points Per Level", value: renderModifierValue(racialSkillPointBonus), isBold: true });
        }
        
        let raceBonusFeatSlotsValue = qualities.bonusFeatSlots;
        if (raceBonusFeatSlotsValue !== undefined && raceBonusFeatSlotsValue <= 0) {
            raceBonusFeatSlotsValue = undefined;
        }

        data = {
          title: raceData?.label || UI_STRINGS.infoDialogRaceDefaultTitle || 'Race Information',
          htmlContent: raceData?.description || `<p>${UI_STRINGS.infoDialogNoSkillDescription || 'No description available.'}</p>`,
          abilityModifiers: qualities.abilityEffects,
          skillBonuses: qualities.skillBonuses,
          bonusFeatSlots: raceBonusFeatSlotsValue,
          grantedFeats: qualities.grantedFeats,
          detailsList: details.length > 0 ? details : undefined,
          speeds: qualities.speeds,
        };
        break;
      }
      case 'class': {
        const classId = character.classes[0]?.className;
        const classData = DND_CLASSES.find(c => c.value === classId);
        const classSpecificDetails: Array<{ label: string; value: string | number; isBold?: boolean }> = [];
        if (classData?.hitDice) classSpecificDetails.push({ label: UI_STRINGS.hitDiceLabel || "Hit Dice", value: classData.hitDice, isBold: true });
        if (classData?.saves) {
          classSpecificDetails.push({ label: SAVING_THROW_LABELS.find(l => l.value === 'fortitude')?.label || "Fortitude Save", value: classData.saves.fortitude.charAt(0).toUpperCase() + classData.saves.fortitude.slice(1) });
          classSpecificDetails.push({ label: SAVING_THROW_LABELS.find(l => l.value === 'reflex')?.label || "Reflex Save", value: classData.saves.reflex.charAt(0).toUpperCase() + classData.saves.reflex.slice(1) });
          classSpecificDetails.push({ label: SAVING_THROW_LABELS.find(l => l.value === 'will')?.label || "Will Save", value: classData.saves.will.charAt(0).toUpperCase() + classData.saves.will.slice(1) });
        }
        
        const grantedFeatsFormatted = classData?.grantedFeats?.map(gf => ({
            ...gf, name: allCombinedFeatDefinitions.find(f => f.value === gf.featId)?.label || gf.featId
        }));

        data = {
          title: classData?.label || UI_STRINGS.infoDialogClassDefaultTitle || 'Class Information',
          htmlContent: classData?.description || `<p>${UI_STRINGS.infoDialogNoSkillDescription || 'No description available.'}</p>`,
          grantedFeats: grantedFeatsFormatted,
          detailsList: classSpecificDetails,
        };
        break;
      }
      case 'alignmentSummary':
        data = {
          title: UI_STRINGS.infoDialogAlignmentsTitle || 'Alignments',
          htmlContent: ALIGNMENTS.map(a => `<p><b>${a.label}:</b><br />${a.description}</p>`).join(''),
        };
        break;
      case 'deity':
        const deityId = character.deity;
        const deityData = DND_DEITIES.find(d => d.value === deityId);
        if (deityData) {
            data = { title: deityData.label, htmlContent: deityData.description || `<p>${UI_STRINGS.infoDialogNoSkillDescription || 'No detailed description available for'} ${deityData.label}.</p>` };
        } else if (deityId && deityId.trim() !== '') {
            data = { title: deityId, htmlContent: `<p>${UI_STRINGS.infoDialogDeityPlaceholder || 'Custom deity. No predefined information available.'}</p>` };
        } else {
            data = { title: UI_STRINGS.infoDialogDeityDefaultTitle || "Deity Information", htmlContent: `<p>${UI_STRINGS.infoDialogDeityPlaceholder || "Select or type a deity to see more information."}</p>`};
        }
        break;
      case 'abilityScoreBreakdown':
        const detailedScores = calculateDetailedAbilityScores(character, customFeatDefinitions, DND_RACES, DND_RACE_ABILITY_MODIFIERS_DATA, DND_RACE_BASE_MAX_AGE_DATA, RACE_TO_AGING_CATEGORY_MAP_DATA, DND_RACE_AGING_EFFECTS_DATA, PREDEFINED_FEATS, ABILITY_LABELS);
        const abilityKeyForTitle = contentType.abilityName as Exclude<AbilityName, 'none'>;
        const abilityLabelForTitle = ABILITY_LABELS.find(al => al.value === abilityKeyForTitle);
        const abilityNameString = abilityLabelForTitle?.label || abilityKeyForTitle;
        data = {
          title: (UI_STRINGS.infoDialogTitleScoreCalculation || "{abilityName} Score Calculation").replace("{abilityName}", abilityNameString),
          abilityScoreBreakdown: detailedScores[contentType.abilityName],
        };
        break;
      case 'skillModifierBreakdown': {
        const skillInstance = character.skills.find(s => s.id === contentType.skillId);
        const skillDef = allCombinedSkillDefinitionsForDisplay.find(sd => sd.id === contentType.skillId);
        if (skillInstance && skillDef) {
          const actualAbilityScoresResult = calculateDetailedAbilityScores(character, customFeatDefinitions, DND_RACES, DND_RACE_ABILITY_MODIFIERS_DATA, DND_RACE_BASE_MAX_AGE_DATA, RACE_TO_AGING_CATEGORY_MAP_DATA, DND_RACE_AGING_EFFECTS_DATA, PREDEFINED_FEATS, ABILITY_LABELS);
          const finalAbilityScores: AbilityScores = (ABILITY_ORDER_INTERNAL).reduce((acc, ability) => {
              acc[ability] = actualAbilityScoresResult[ability].finalScore;
              return acc;
          }, {} as AbilityScores);

          const keyAbilityMod = skillDef.keyAbility && skillDef.keyAbility !== 'none' ? getAbilityModifierByName(finalAbilityScores, skillDef.keyAbility) : 0;
          const synergyBonus = calculateTotalSynergyBonus(skillDef.id, character.skills, SKILL_DEFINITIONS, SKILL_SYNERGIES_DATA, customSkillDefinitions);
          const featBonus = calculateFeatBonusesForSkill(skillDef.id, character.feats, allCombinedFeatDefinitions);
          const racialBonus = calculateRacialSkillBonus(skillDef.id, character.race, DND_RACES, SKILL_DEFINITIONS);
          const sizeBonus = calculateSizeSpecificSkillBonus(skillDef.id, character.size, SIZES);
          const totalMod = keyAbilityMod + synergyBonus + featBonus + racialBonus + sizeBonus;
          const totalSkillBonus = (skillInstance.ranks || 0) + totalMod + (skillInstance.miscModifier || 0);
          const keyAbilityLabel = skillDef.keyAbility && skillDef.keyAbility !== 'none' ? ABILITY_LABELS.find(al => al.value === skillDef.keyAbility)?.abbr : undefined;
          data = {
            title: (UI_STRINGS.infoDialogTitleModifierBreakdown || "{skillName} Modifier Breakdown").replace("{skillName}", skillDef.name),
            htmlContent: skillDef.description,
            skillModifierBreakdown: {
              skillName: skillDef.name,
              keyAbilityName: keyAbilityLabel,
              keyAbilityModifier: keyAbilityMod,
              ranks: skillInstance.ranks || 0,
              synergyBonus, featBonus, racialBonus, sizeSpecificBonus: sizeBonus,
              miscModifier: skillInstance.miscModifier || 0,
              totalBonus: totalSkillBonus,
            },
          };
        } else {
            data = { title: UI_STRINGS.infoDialogSkillDefaultTitle || "Skill Information", htmlContent: `<p>${UI_STRINGS.infoDialogSkillNotFound || "Skill details not found."}</p>`};
        }
        break;
      }
      case 'resistanceBreakdown':
        const resistanceValue = character[contentType.resistanceField] as ResistanceValue;
        const resistanceLabel = contentType.resistanceField.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(' Resistance', '');
        data = {
          title: (UI_STRINGS.infoDialogTitleResistanceBreakdown || "{resistanceName} Resistance Breakdown").replace("{resistanceName}", resistanceLabel),
          resistanceBreakdown: {
            name: resistanceLabel,
            base: resistanceValue.base || 0,
            customMod: resistanceValue.customMod || 0,
            total: (resistanceValue.base || 0) + (resistanceValue.customMod || 0),
          },
        };
        break;
      case 'acBreakdown': {
        const detailedCharScores = calculateDetailedAbilityScores(character, customFeatDefinitions, DND_RACES, DND_RACE_ABILITY_MODIFIERS_DATA, DND_RACE_BASE_MAX_AGE_DATA, RACE_TO_AGING_CATEGORY_MAP_DATA, DND_RACE_AGING_EFFECTS_DATA, PREDEFINED_FEATS, ABILITY_LABELS);
        const dexMod = calculateAbilityModifier(detailedCharScores.dexterity.finalScore);
        const sizeModACVal = getSizeModifierAC(character.size, SIZES);
        const sizeLabel = SIZES.find(s => s.value === character.size)?.label || character.size;
        const details: Array<{ label: string; value: string | number; isBold?: boolean }> = [{ label: 'Base', value: 10 }];
        let totalCalculated = 10;

        if (contentType.acType === 'Normal' || contentType.acType === 'Touch') details.push({ label: (UI_STRINGS.infoDialogInitiativeAbilityModLabel || "{abilityAbbr} ({abilityFull}) Modifier:").replace("{abilityAbbr}", ABILITY_LABELS.find(al => al.value === 'dexterity')?.abbr || 'DEX').replace("{abilityFull}", ABILITY_LABELS.find(al => al.value === 'dexterity')?.label || 'Dexterity'), value: dexMod });
        details.push({ label: `${(UI_STRINGS.infoDialogSizeModifierLabel || "Size Modifier")} (${sizeLabel})`, value: sizeModACVal });

        if (contentType.acType === 'Normal' || contentType.acType === 'Flat-Footed') {
          if (character.armorBonus) details.push({ label: 'Armor Bonus', value: character.armorBonus });
          if (character.shieldBonus) details.push({ label: 'Shield Bonus', value: character.shieldBonus });
          if (character.naturalArmor) details.push({ label: 'Natural Armor', value: character.naturalArmor });
        }
        if (character.deflectionBonus) details.push({ label: 'Deflection Bonus', value: character.deflectionBonus });
        if ((contentType.acType === 'Normal' || contentType.acType === 'Touch') && character.dodgeBonus) {
          details.push({ label: 'Dodge Bonus', value: character.dodgeBonus });
        }
        
        if (character.acMiscModifier) details.push({ label: UI_STRINGS.infoDialogCustomModifierLabel || 'Custom Modifier', value: character.acMiscModifier });


        if (contentType.acType === 'Normal') totalCalculated = 10 + (character.armorBonus || 0) + (character.shieldBonus || 0) + dexMod + sizeModACVal + (character.naturalArmor || 0) + (character.deflectionBonus || 0) + (character.dodgeBonus || 0) + (character.acMiscModifier || 0);
        else if (contentType.acType === 'Touch') totalCalculated = 10 + dexMod + sizeModACVal + (character.deflectionBonus || 0) + (character.dodgeBonus || 0) + (character.acMiscModifier || 0);
        else if (contentType.acType === 'Flat-Footed') totalCalculated = 10 + (character.armorBonus || 0) + (character.shieldBonus || 0) + sizeModACVal + (character.naturalArmor || 0) + (character.deflectionBonus || 0) + (character.acMiscModifier || 0);
        
        details.push({ label: UI_STRINGS.infoDialogTotalBonusLabel || 'Total', value: totalCalculated, isBold: true });
        data = { title: (UI_STRINGS.infoDialogTitleAcBreakdown || "{acType} AC Breakdown").replace("{acType}", contentType.acType), detailsList: details };
        break;
      }
      case 'babBreakdown': {
        const baseBabArrayVal = getBab(character.classes, DND_CLASSES);
        data = {
          title: UI_STRINGS.infoDialogTitleBabBreakdown || 'Base Attack Bonus Breakdown',
          babBreakdown: {
            baseBabFromClasses: baseBabArrayVal,
            miscModifier: character.babMiscModifier || 0,
            totalBab: baseBabArrayVal.map(b => b + (character.babMiscModifier || 0)),
            characterClassLabel: DND_CLASSES.find(c => c.value === character.classes[0]?.className)?.label || character.classes[0]?.className
          },
        };
        break;
      }
      case 'initiativeBreakdown': {
        const detailedCharScores = calculateDetailedAbilityScores(character, customFeatDefinitions, DND_RACES, DND_RACE_ABILITY_MODIFIERS_DATA, DND_RACE_BASE_MAX_AGE_DATA, RACE_TO_AGING_CATEGORY_MAP_DATA, DND_RACE_AGING_EFFECTS_DATA, PREDEFINED_FEATS, ABILITY_LABELS);
        const dexMod = calculateAbilityModifier(detailedCharScores.dexterity.finalScore);
        data = {
          title: UI_STRINGS.infoDialogTitleInitiativeBreakdown || 'Initiative Breakdown',
          initiativeBreakdown: {
            dexModifier: dexMod,
            miscModifier: character.initiativeMiscModifier || 0,
            totalInitiative: calculateInitiative(dexMod, character.initiativeMiscModifier || 0),
          },
        };
        break;
      }
      case 'grappleModifierBreakdown': {
        const detailedCharScores = calculateDetailedAbilityScores(character, customFeatDefinitions, DND_RACES, DND_RACE_ABILITY_MODIFIERS_DATA, DND_RACE_BASE_MAX_AGE_DATA, RACE_TO_AGING_CATEGORY_MAP_DATA, DND_RACE_AGING_EFFECTS_DATA, PREDEFINED_FEATS, ABILITY_LABELS);
        const strMod = calculateAbilityModifier(detailedCharScores.strength.finalScore);
        const baseBabArrayVal = getBab(character.classes, DND_CLASSES);
        const sizeModGrappleVal = getSizeModifierGrapple(character.size, SIZES);
        data = {
          title: UI_STRINGS.infoDialogTitleGrappleModifierBreakdown || 'Grapple Modifier Breakdown',
          grappleModifierBreakdown: {
            baseAttackBonus: baseBabArrayVal[0] || 0,
            strengthModifier: strMod,
            sizeModifierGrapple: sizeModGrappleVal,
            miscModifier: character.grappleMiscModifier || 0,
            totalGrappleModifier: calculateGrapple(character.classes, strMod, sizeModGrappleVal, DND_CLASSES) + (character.grappleMiscModifier || 0),
          },
        };
        break;
      }
       case 'grappleDamageBreakdown': {
        const detailedCharScores = calculateDetailedAbilityScores(character, customFeatDefinitions, DND_RACES, DND_RACE_ABILITY_MODIFIERS_DATA, DND_RACE_BASE_MAX_AGE_DATA, RACE_TO_AGING_CATEGORY_MAP_DATA, DND_RACE_AGING_EFFECTS_DATA, PREDEFINED_FEATS, ABILITY_LABELS);
        const strMod = calculateAbilityModifier(detailedCharScores.strength.finalScore);
        data = {
          title: UI_STRINGS.infoDialogTitleGrappleDamageBreakdown || 'Grapple Damage Breakdown',
          grappleDamageBreakdown: {
            baseDamage: character.grappleDamage_baseNotes || getUnarmedGrappleDamage(character.size, SIZES),
            bonus: character.grappleDamage_bonus || 0,
            strengthModifier: strMod,
          },
        };
        break;
      }
      case 'speedBreakdown': {
        const speedBreakdownDetails = calculateSpeedBreakdown(contentType.speedType, character, DND_RACES, DND_CLASSES, SIZES);
        const speedNameString = speedBreakdownDetails.name.replace(" Speed", "");
        data = {
          title: (UI_STRINGS.infoDialogTitleSpeedBreakdown || "{speedName} Breakdown").replace("{speedName}", speedNameString),
          speedBreakdown: speedBreakdownDetails,
        };
        break;
      }
      case 'genericHtml':
        data = { title: contentType.title, htmlContent: contentType.content };
        break;
    }
    return data;
  }, [isOpen, contentType, character, translationsLoading, translations, customFeatDefinitions, customSkillDefinitions, allCombinedFeatDefinitions, allCombinedSkillDefinitionsForDisplay]);


  if (translationsLoading || !translations || !isOpen || !derivedData) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center font-serif text-left">
              <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
              {translations?.UI_STRINGS.infoDialogLoadingTitle || "Loading Information..."}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <p className="text-muted-foreground">{translations?.UI_STRINGS.infoDialogLoadingDescription || "Fetching details..."}</p>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} type="button">{translations?.UI_STRINGS.infoDialogCloseButton || "Close"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  const { UI_STRINGS } = translations;

  const {
    title: finalTitle,
    htmlContent,
    abilityModifiers,
    skillBonuses,
    grantedFeats,
    bonusFeatSlots,
    abilityScoreBreakdown,
    skillModifierBreakdown,
    resistanceBreakdown,
    detailsList,
    babBreakdown,
    initiativeBreakdown,
    grappleModifierBreakdown,
    grappleDamageBreakdown,
    speeds,
    speedBreakdown,
  } = derivedData;
  
  const sectionHeadingClass = "text-md font-semibold mb-2 text-primary";

  const sectionHeading = abilityScoreBreakdown || skillModifierBreakdown || resistanceBreakdown || babBreakdown || initiativeBreakdown || grappleModifierBreakdown || grappleDamageBreakdown || speedBreakdown || (detailsList && (contentType?.type === 'acBreakdown' || contentType?.type === 'class')) ? (UI_STRINGS.infoDialogSectionHeadingCalculation || "Calculation") : (UI_STRINGS.infoDialogSectionHeadingDetails || "Details:");
  const hasAnyBonusSection = abilityModifiers?.length || skillBonuses?.length || grantedFeats?.length || bonusFeatSlots !== undefined || speeds;
  
  let hasRenderedContentBlock = false;
  const renderSeparatorIfNeeded = () => {
    if (hasRenderedContentBlock) {
      return <Separator className="my-3" />;
    }
    return null;
  };
  
  const markContentRendered = () => {
    hasRenderedContentBlock = true;
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif text-left">
            { contentType?.type === 'speedBreakdown' && SPEED_ICONS[contentType.speedType] && React.createElement(SPEED_ICONS[contentType.speedType], { className: "mr-2 h-6 w-6 text-primary" }) }
            { contentType?.type !== 'speedBreakdown' && <Info className="mr-2 h-6 w-6 text-primary" /> }
            {finalTitle}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4 my-2">
          <div className="pb-4"> 
            {htmlContent && (
              <>
                {renderSeparatorIfNeeded()}
                <div
                  className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
                {markContentRendered()}
              </>
            )}

            {babBreakdown && (
              <>
              {renderSeparatorIfNeeded()}
              <div>
                  <h3 className={sectionHeadingClass}>{sectionHeading}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{(UI_STRINGS.infoDialogBabClassLabel || "{classLabel} Base Attack Bonus:").replace("{classLabel}", babBreakdown.characterClassLabel || 'Class')}</span>
                      <span className="font-bold">{babBreakdown.baseBabFromClasses.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/')}</span>
                    </div>
                    {babBreakdown.miscModifier !== 0 && (
                      <div className="flex justify-between">
                          <span>{UI_STRINGS.infoDialogCustomModifierLabel || "Custom Modifier:"}</span>
                          {renderModifierValue(babBreakdown.miscModifier)}
                      </div>
                    )}
                    <Separator className="my-3" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">{UI_STRINGS.infoDialogBabTotalLabel || "Total Base Attack Bonus:"}</span>
                      <span className="font-bold text-accent">{babBreakdown.totalBab.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/')}</span>
                    </div>
                  </div>
                </div>
                {markContentRendered()}
              </>
            )}

            {initiativeBreakdown && (
              <>
              {renderSeparatorIfNeeded()}
              <div>
                  <h3 className={sectionHeadingClass}>{sectionHeading}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>
                        {(UI_STRINGS.infoDialogInitiativeAbilityModLabel || "{abilityAbbr} ({abilityFull}) Modifier:").replace("{abilityAbbr}", translations.ABILITY_LABELS.find(al => al.value === 'dexterity')?.abbr || 'DEX').replace("{abilityFull}", translations.ABILITY_LABELS.find(al => al.value === 'dexterity')?.label || 'Dexterity')}
                      </span>
                      {renderModifierValue(initiativeBreakdown.dexModifier)}
                    </div>
                    {initiativeBreakdown.miscModifier !== 0 && (
                      <div className="flex justify-between">
                          <span>{UI_STRINGS.infoDialogCustomModifierLabel || "Custom Modifier:"}</span>
                          {renderModifierValue(initiativeBreakdown.miscModifier)}
                      </div>
                    )}
                    <Separator className="my-3" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">{UI_STRINGS.infoDialogInitiativeTotalLabel || "Total Initiative:"}</span>
                      {renderModifierValue(initiativeBreakdown.totalInitiative, undefined, undefined, undefined, "text-accent", true)}
                    </div>
                  </div>
                </div>
                {markContentRendered()}
              </>
            )}

            {grappleModifierBreakdown && (
              <>
              {renderSeparatorIfNeeded()}
              <div>
                  <h3 className={sectionHeadingClass}>{sectionHeading}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{UI_STRINGS.infoDialogGrappleModBabLabel || "Base Attack Bonus:"}</span>
                      {renderModifierValue(grappleModifierBreakdown.baseAttackBonus)}
                    </div>
                    <div className="flex justify-between">
                      <span>
                         {(UI_STRINGS.infoDialogGrappleModAbilityLabel || "{abilityAbbr} ({abilityFull}) Modifier:").replace("{abilityAbbr}", translations.ABILITY_LABELS.find(al => al.value === 'strength')?.abbr || 'STR').replace("{abilityFull}", translations.ABILITY_LABELS.find(al => al.value === 'strength')?.label || 'Strength')}
                      </span>
                      {renderModifierValue(grappleModifierBreakdown.strengthModifier)}
                    </div>
                    <div className="flex justify-between">
                      <span>{UI_STRINGS.infoDialogGrappleModSizeLabel || "Size Modifier:"}</span>
                      {renderModifierValue(grappleModifierBreakdown.sizeModifierGrapple)}
                    </div>
                    {grappleModifierBreakdown.miscModifier !== 0 && (
                      <div className="flex justify-between">
                          <span>{UI_STRINGS.infoDialogCustomModifierLabel || "Custom Modifier:"}</span>
                          {renderModifierValue(grappleModifierBreakdown.miscModifier)}
                      </div>
                    )}
                    <Separator className="my-3" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">{UI_STRINGS.infoDialogGrappleModTotalLabel || "Total Grapple Modifier:"}</span>
                      {renderModifierValue(grappleModifierBreakdown.totalGrappleModifier, undefined, undefined, undefined, "text-accent", true)}
                    </div>
                  </div>
                </div>
                {markContentRendered()}
              </>
            )}
            
            {grappleDamageBreakdown && (
              <>
              {renderSeparatorIfNeeded()}
              <div>
                  <h3 className={sectionHeadingClass}>{sectionHeading}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{UI_STRINGS.infoDialogGrappleDmgBaseLabel || "Base Damage:"}</span>
                      <span className="font-bold">
                        {grappleDamageBreakdown.baseDamage.split(' ')[0] || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{UI_STRINGS.infoDialogGrappleDmgWeaponLabel || "Weapon Damage:"}</span>
                      {grappleDamageBreakdown.baseDamage.toLowerCase().includes('unarmed') ? (
                          <span className="font-semibold text-muted-foreground">{UI_STRINGS.infoDialogGrappleDmgUnarmedLabel || "Unarmed"}</span>
                      ) : (
                          renderModifierValue(0) 
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span>
                        {(UI_STRINGS.infoDialogGrappleDmgAbilityLabel || "{abilityAbbr} ({abilityFull}) Modifier:").replace("{abilityAbbr}", translations.ABILITY_LABELS.find(al => al.value === 'strength')?.abbr || 'STR').replace("{abilityFull}", translations.ABILITY_LABELS.find(al => al.value === 'strength')?.label || 'Strength')}
                      </span>
                      {renderModifierValue(grappleDamageBreakdown.strengthModifier)}
                    </div>
                    {grappleDamageBreakdown.bonus !== 0 && (
                      <div className="flex justify-between">
                          <span>{UI_STRINGS.infoDialogCustomModifierLabel || "Custom Modifier:"}</span>
                          {renderModifierValue(grappleDamageBreakdown.bonus)}
                      </div>
                    )}
                    <Separator className="my-3" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">{UI_STRINGS.infoDialogGrappleDmgTotalLabel || "Total:"}</span>
                      <span className="font-bold text-accent">
                        {`${grappleDamageBreakdown.baseDamage.split(' ')[0] || '0'}${(grappleDamageBreakdown.strengthModifier + grappleDamageBreakdown.bonus) !== 0 ? `${(grappleDamageBreakdown.strengthModifier + grappleDamageBreakdown.bonus) >= 0 ? '+' : ''}${grappleDamageBreakdown.strengthModifier + grappleDamageBreakdown.bonus}`: ''}`}
                      </span>
                    </div>
                  </div>
                </div>
                {markContentRendered()}
              </>
            )}

            {abilityScoreBreakdown && (
              <>
              {renderSeparatorIfNeeded()}
              <div>
                  <h3 className={sectionHeadingClass}>{sectionHeading}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{UI_STRINGS.infoDialogBaseScoreLabel || "Base Score"}</span>
                      <span className="font-bold">{abilityScoreBreakdown.base}</span>
                    </div>
                    {abilityScoreBreakdown.components.map((comp, index) => (
                      comp.value !== 0 && (
                        <div key={index} className="flex justify-between">
                          <span>{comp.source}</span>
                          {renderModifierValue(comp.value)}
                        </div>
                      )
                    ))}
                    <Separator className="my-3" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">{UI_STRINGS.infoDialogFinalScoreLabel || "Final Score"}</span>
                      <span className="font-bold text-accent">{abilityScoreBreakdown.finalScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">{UI_STRINGS.infoDialogFinalModifierLabel || "Final Modifier"}</span>
                      {renderModifierValue(calculateAbilityModifier(abilityScoreBreakdown.finalScore))}
                    </div>
                  </div>
                </div>
                {markContentRendered()}
              </>
            )}

            {skillModifierBreakdown && (
              <>
              {renderSeparatorIfNeeded()}
              <div>
                  <h3 className={sectionHeadingClass}>{sectionHeading}</h3>
                  <div className="space-y-1 text-sm">
                    {skillModifierBreakdown.keyAbilityName && (
                        <div className="flex justify-between">
                          <span>
                            {UI_STRINGS.infoDialogKeyAbilityLabel || "Key Ability"}
                            {" "}
                            <span className="text-muted-foreground">({skillModifierBreakdown.keyAbilityName})</span>
                          </span>
                          {renderModifierValue(skillModifierBreakdown.keyAbilityModifier)}
                        </div>
                    )}
                    <div className="flex justify-between">
                      <span>{UI_STRINGS.infoDialogRanksLabel || "Ranks"}</span>
                      {renderModifierValue(skillModifierBreakdown.ranks)}
                    </div>
                    {skillModifierBreakdown.sizeSpecificBonus !== 0 && (
                      <div className="flex justify-between">
                        <span>{UI_STRINGS.infoDialogSizeModifierLabel || "Size Modifier"}</span>
                        {renderModifierValue(skillModifierBreakdown.sizeSpecificBonus)}
                      </div>
                    )}
                    {skillModifierBreakdown.synergyBonus !== 0 && (
                      <div className="flex justify-between">
                        <span>{UI_STRINGS.infoDialogSynergyBonusLabel || "Synergy Bonus"}</span>
                        {renderModifierValue(skillModifierBreakdown.synergyBonus)}
                      </div>
                    )}
                    {skillModifierBreakdown.featBonus !== 0 && (
                      <div className="flex justify-between">
                        <span>{UI_STRINGS.infoDialogFeatBonusLabel || "Feat Bonus"}</span>
                        {renderModifierValue(skillModifierBreakdown.featBonus)}
                      </div>
                    )}
                    {skillModifierBreakdown.racialBonus !== 0 && (
                      <div className="flex justify-between">
                        <span>{UI_STRINGS.infoDialogRacialBonusLabel || "Racial Bonus"}</span>
                        {renderModifierValue(skillModifierBreakdown.racialBonus)}
                      </div>
                    )}
                    {skillModifierBreakdown.miscModifier !== 0 && (
                      <div className="flex justify-between">
                        <span>{UI_STRINGS.infoDialogMiscModifierLabel || "Misc Modifier"}</span>
                        {renderModifierValue(skillModifierBreakdown.miscModifier)}
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">{UI_STRINGS.infoDialogTotalBonusLabel || "Total Bonus"}</span>
                      {renderModifierValue(skillModifierBreakdown.totalBonus, undefined, undefined, undefined, "text-accent", true)}
                    </div>
                  </div>
              </div>
              {markContentRendered()}
              </>
            )}
            
            {resistanceBreakdown && (
              <>
                {renderSeparatorIfNeeded()}
                <div>
                  <h3 className={sectionHeadingClass}>{sectionHeading}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{UI_STRINGS.infoDialogBaseValueLabel || "Base Value:"}</span>
                      <span className="font-bold">{resistanceBreakdown.base}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{UI_STRINGS.infoDialogCustomModifierLabel || "Custom Modifier:"}</span>
                      {renderModifierValue(resistanceBreakdown.customMod)}
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">{UI_STRINGS.infoDialogTotalResistanceLabel || "Total Resistance:"}</span>
                      <span className="font-bold text-accent">{resistanceBreakdown.total}</span>
                    </div>
                  </div>
                </div>
                {markContentRendered()}
              </>
            )}

             {speedBreakdown && (
              <>
                {renderSeparatorIfNeeded()}
                <div>
                  <h3 className={sectionHeadingClass}>{sectionHeading}</h3>
                  <div className="space-y-1 text-sm">
                    {speedBreakdown.components.map((comp, index) => {
                      let label = comp.source;
                      if (comp.source === "Base (Race)") label = UI_STRINGS.infoDialogSpeedBaseRaceLabel || "Base (Race)";
                      else if (comp.source === "Misc Modifier") label = UI_STRINGS.infoDialogSpeedMiscModifierLabel || "Misc Modifier";
                      else if (comp.source === "Monk Unarmored Speed") label = UI_STRINGS.infoDialogSpeedMonkLabel || "Monk Unarmored Speed";
                      else if (comp.source === "Barbarian Fast Movement") label = UI_STRINGS.infoDialogSpeedBarbarianLabel || "Barbarian Fast Movement";
                      else if (comp.source === "Armor Penalty") label = UI_STRINGS.infoDialogSpeedArmorPenaltyLabel || "Armor Penalty";
                      else if (comp.source === "Load Penalty") label = UI_STRINGS.infoDialogSpeedLoadPenaltyLabel || "Load Penalty";
                      
                      return (
                        <div key={index} className="flex justify-between">
                          <span>{label}:</span>
                          {renderModifierValue(comp.value)}
                        </div>
                      );
                    })}
                    <Separator className="my-2" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">{(UI_STRINGS.infoDialogSpeedTotalPrefixLabel || "Total")} {speedBreakdown.name.replace(" Speed", "")}:</span>
                      <span className="font-bold text-accent">{speedBreakdown.total} ft.</span>
                    </div>
                  </div>
                </div>
                {markContentRendered()}
              </>
            )}


            {!abilityScoreBreakdown && !skillModifierBreakdown && !resistanceBreakdown && !babBreakdown && !initiativeBreakdown && !grappleModifierBreakdown && !grappleDamageBreakdown && !speedBreakdown && contentType?.type === 'race' && (
              <>
              {detailsList && detailsList.length > 0 && (
                  <>
                    {renderSeparatorIfNeeded()}
                    <div>
                      <h3 className={sectionHeadingClass}>{UI_STRINGS.infoDialogListHeadingDetails || "Details"}</h3>
                      {detailsList!.map((detail, index) => (
                        <div key={index} className="flex justify-between text-sm mb-0.5">
                        <span className="text-foreground">{detail.label}</span>
                        <span className={cn(detail.isBold && "font-bold", "text-foreground")}>{detail.value as React.ReactNode}</span>
                        </div>
                      ))}
                    </div>
                    {markContentRendered()}
                  </>
                )}
                
                {abilityModifiers && abilityModifiers.length > 0 && (
                  <>
                  {renderSeparatorIfNeeded()}
                  <div className="mb-3">
                    <h3 className={sectionHeadingClass}>{UI_STRINGS.infoDialogAbilityScoreAdjustments || "Ability Score Adjustments"}</h3>
                    <ul className="space-y-1 text-sm">
                      {abilityModifiers!.map(({ ability, change }) => {
                        const abilityLabelInfo = translations.ABILITY_LABELS.find(al => al.value === ability);
                        const abbr = abilityLabelInfo?.abbr || ability.substring(0,3).toUpperCase();
                        const full = abilityLabelInfo?.label || ability;
                        return (
                          <li key={ability} className="flex justify-between text-foreground">
                            <span>
                              {abbr}
                              {" "}
                              <span className="text-xs text-muted-foreground">({full})</span>
                            </span>
                            {renderModifierValue(change)}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  {markContentRendered()}
                  </>
                )}
                
                {skillBonuses && skillBonuses.length > 0 && (
                  <>
                  {renderSeparatorIfNeeded()}
                  <div className="mb-3">
                    <h3 className={sectionHeadingClass}>{UI_STRINGS.infoDialogRacialSkillBonuses || "Racial Skill Bonuses"}</h3>
                    <ul className="space-y-1 text-sm">
                      {skillBonuses!.map(({ skillId, skillName, bonus }, index) => {
                        const skillDef = allCombinedSkillDefinitionsForDisplay.find(s => s.id === skillId);
                        const uniqueKey = `skill-${skillId}-${index}`;
                        const isExpanded = expandedItems.has(uniqueKey);
                        return (
                          <li key={uniqueKey} className="text-foreground">
                            <div className="flex justify-between items-center">
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => toggleExpanded(uniqueKey)}
                                className="p-0 h-auto text-sm font-normal text-foreground inline-flex items-center text-left justify-start no-underline hover:no-underline items-baseline"
                                aria-expanded={isExpanded}
                              >
                                {skillName}
                              </Button>
                              {renderModifierValue(bonus)}
                            </div>
                            {isExpanded && skillDef?.description && (
                                <ExpandableDetailWrapper>
                                  <div
                                    className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: skillDef.description }}
                                  />
                                </ExpandableDetailWrapper>
                            )}
                            {isExpanded && !skillDef?.description && (
                              <ExpandableDetailWrapper>
                                <div className="mt-1 pl-4 text-xs text-muted-foreground italic">
                                    {UI_STRINGS.infoDialogNoSkillDescription || "No description available for this skill."}
                                </div>
                              </ExpandableDetailWrapper>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  {markContentRendered()}
                  </>
                )}
                {speeds && Object.keys(speeds).length > 0 && (
                  <>
                  {renderSeparatorIfNeeded()}
                  <div className="mb-3">
                    <h3 className={sectionHeadingClass}>{UI_STRINGS.infoDialogBaseSpeeds || "Base Speeds"}</h3>
                    <ul className="space-y-1 text-sm">
                      {Object.entries(speeds).map(([speedType, speedValue]) => {
                        if (speedValue === 0 && speedType !== 'land') return null; 
                        const label = speedType.charAt(0).toUpperCase() + speedType.slice(1);
                        return (
                          <li key={speedType} className="flex justify-between text-foreground">
                            <span>{label}</span>
                            <span className="font-bold">{speedValue} ft.</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  {markContentRendered()}
                  </>
                )}

                {(grantedFeats && grantedFeats.length > 0) || (bonusFeatSlots !== undefined) ? (
                  <>
                  {renderSeparatorIfNeeded()}
                  <div>
                    <h3 className={sectionHeadingClass}>{UI_STRINGS.infoDialogRacialFeatAdjustments || "Racial Feat Adjustments"}</h3>
                    <div className="text-sm space-y-1">
                      {bonusFeatSlots !== undefined && bonusFeatSlots > 0 && ( 
                        <div className="flex justify-between">
                          <span className="text-foreground">{UI_STRINGS.infoDialogBonusFeatSlots || "Bonus Feat Slots"}</span>
                          {renderModifierValue(bonusFeatSlots)}
                        </div>
                      )}
                      {grantedFeats && grantedFeats.length > 0 ? (
                        <ul className="space-y-2">
                          {grantedFeats.map((feat, index) => {
                            const uniqueKey = `racefeat-${feat.featId}-${index}`;
                            const isExpanded = expandedItems.has(uniqueKey);
                            return (
                            <li key={uniqueKey}>
                              <Button
                                  variant="link"
                                  size="sm"
                                  onClick={() => toggleExpanded(uniqueKey)}
                                  className="p-0 h-auto text-foreground text-sm font-normal inline-flex items-center text-left justify-start no-underline hover:no-underline items-baseline"
                                  aria-expanded={isExpanded}
                                >
                                  {feat.name}
                                  {feat.note && (<span className="text-xs text-muted-foreground ml-1">({feat.note})</span>)}
                                </Button>
                              {isExpanded && translations && (
                                <ExpandableDetailWrapper>
                                  <FeatDetailContent
                                    featId={feat.featId}
                                    character={character}
                                    allFeats={allCombinedFeatDefinitions}
                                    allPredefinedSkills={translations.SKILL_DEFINITIONS}
                                    allCustomSkills={customSkillDefinitions}
                                    allClasses={translations.DND_CLASSES}
                                    allRaces={translations.DND_RACES}
                                    abilityLabels={translations.ABILITY_LABELS}
                                    alignmentPrereqOptions={translations.ALIGNMENT_PREREQUISITE_OPTIONS}
                                    uiStrings={UI_STRINGS}
                                  />
                                </ExpandableDetailWrapper>
                              )}
                            </li>
                          )})}
                        </ul>
                      ) : (
                        (bonusFeatSlots === undefined || bonusFeatSlots <= 0) && <p className="text-foreground">{UI_STRINGS.infoDialogNone || "None"}</p>
                      )}
                    </div>
                  </div>
                  {markContentRendered()}
                  </>
                ) : null}
              </>
            )}

            {!abilityScoreBreakdown && !skillModifierBreakdown && !resistanceBreakdown && !babBreakdown && !initiativeBreakdown && !grappleModifierBreakdown && !grappleDamageBreakdown && !speedBreakdown && contentType?.type === 'class' && (
              <>
                {detailsList && detailsList.length > 0 && (
                  <>
                  {renderSeparatorIfNeeded()}
                  <div className="mb-3">
                    <h3 className={sectionHeadingClass}>{UI_STRINGS.infoDialogListHeadingDetails || "Details"}</h3>
                    {detailsList!.map((detail, index) => (
                        <div key={index} className="flex justify-between text-sm mb-0.5">
                        <span className="text-foreground">{detail.label}</span>
                        <span className={cn(detail.isBold && "font-bold", "text-foreground")}>{detail.value as React.ReactNode}</span>
                        </div>
                    ))}
                  </div>
                  {markContentRendered()}
                  </>
                )}
                {grantedFeats && grantedFeats.length > 0 && (
                  <>
                  {renderSeparatorIfNeeded()}
                  <div>
                    <h3 className={sectionHeadingClass}>{UI_STRINGS.infoDialogClassFeaturesAndFeats || "Class Features & Granted Feats"}</h3>
                    <ul className="space-y-1.5 text-sm">
                      {grantedFeats.map(({ featId, name, note, levelAcquired }, index) => {
                        const uniqueKey = `classfeat-${featId}-${index}`;
                        const isExpanded = expandedItems.has(uniqueKey);
                        return (
                        <li key={uniqueKey}>
                           <div className="flex items-start gap-x-2 text-foreground">
                            {levelAcquired !== undefined && (
                              <Badge variant="outline" className="text-xs font-normal h-5 whitespace-nowrap shrink-0 mt-[1px]">
                                {UI_STRINGS.levelLabel || "Level"} {levelAcquired}
                              </Badge>
                            )}
                            <div className="flex-grow min-w-0">
                              <Button
                                  variant="link"
                                  size="sm"
                                  onClick={() => toggleExpanded(uniqueKey)}
                                  className={cn(
                                    "p-0 h-auto text-sm font-normal text-left justify-start text-foreground no-underline hover:no-underline items-baseline break-words w-full"
                                  )}
                                  aria-expanded={isExpanded}
                                >
                                  {name}
                                </Button>
                                {note && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {note}
                                  </p>
                                )}
                            </div>
                          </div>
                          {isExpanded && translations && (
                            <ExpandableDetailWrapper>
                              <FeatDetailContent
                                featId={featId}
                                character={character}
                                allFeats={allCombinedFeatDefinitions}
                                allPredefinedSkills={translations.SKILL_DEFINITIONS}
                                allCustomSkills={customSkillDefinitions}
                                allClasses={translations.DND_CLASSES}
                                allRaces={translations.DND_RACES}
                                abilityLabels={translations.ABILITY_LABELS}
                                alignmentPrereqOptions={translations.ALIGNMENT_PREREQUISITE_OPTIONS}
                                uiStrings={UI_STRINGS}
                              />
                            </ExpandableDetailWrapper>
                          )}
                        </li>
                      )})}
                    </ul>
                  </div>
                  {markContentRendered()}
                  </>
                )}
              </>
            )}
            
            {!abilityScoreBreakdown && !skillModifierBreakdown && !resistanceBreakdown && !babBreakdown && !initiativeBreakdown && !grappleModifierBreakdown && !grappleDamageBreakdown && !speedBreakdown && detailsList && detailsList.length > 0 && (contentType?.type !== 'class' && contentType?.type !== 'race') && (
              <>
                {renderSeparatorIfNeeded()}
                <div>
                  <h3 className={sectionHeadingClass}>{sectionHeading}</h3>
                  {detailsList!.filter(detail => detail.label.toLowerCase() !== 'total').map((detail, index) => {
                      const valueToRender = (typeof detail.value === 'number' || (typeof detail.value === 'string' && !isNaN(parseFloat(detail.value as string))))
                          ? renderModifierValue(detail.value as number | string, undefined, undefined, undefined, (detail.label.toLowerCase() === "total" ? "text-accent" : undefined), detail.label.toLowerCase() === "total")
                          : detail.value;
                      
                      let labelContent: React.ReactNode;
                      const defaultLabelClass = "text-foreground"; 

                      if (detail.label.toLowerCase().includes("modifier") && (detail.label.toLowerCase().includes("dexterity") || detail.label.toLowerCase().includes("strength"))) {
                          const abilityKey = detail.label.toLowerCase().includes("dexterity") ? 'dexterity' : 'strength';
                          const abilityLabelInfo = translations.ABILITY_LABELS.find(al => al.value === abilityKey);
                          const abbr = abilityLabelInfo?.abbr || abilityKey.substring(0,3).toUpperCase();
                          const full = abilityLabelInfo?.label || abilityKey.charAt(0).toUpperCase() + abilityKey.slice(1);

                          labelContent = (
                              <span className={defaultLabelClass}>
                                  {abbr}{'\u00A0'}
                                  <span className="text-xs text-muted-foreground">({full})</span> Modifier
                              </span>
                          );
                      } else {
                          labelContent = <span className={defaultLabelClass}>{detail.label}</span>;
                      }

                      return (
                          <div key={index} className="flex justify-between text-sm mb-0.5">
                          {labelContent}
                          <span className={cn(detail.isBold && "font-bold", "text-foreground")}>{valueToRender as React.ReactNode}</span>
                          </div>
                      );
                  })}
                  
                  {detailsList!.find(detail => detail.label.toLowerCase() === 'total') && (
                    <>
                      <Separator className="my-2" />
                      <div className="flex justify-between text-base">
                        <span className="font-semibold">{UI_STRINGS.infoDialogTotalBonusLabel || "Total"}</span>
                        {renderModifierValue(detailsList!.find(detail => detail.label.toLowerCase() === 'total')!.value as number | string, undefined, undefined, undefined, "text-accent", true)}
                      </div>
                    </>
                  )}
                </div>
                {markContentRendered()}
              </>
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">{UI_STRINGS.infoDialogCloseButton || "Close"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DerivedDialogData {
  title: string;
  htmlContent?: string;
  abilityModifiers?: Array<{ ability: Exclude<AbilityName, 'none'>; change: number }>;
  skillBonuses?: Array<{ skillId: string; skillName: string; bonus: number }>;
  grantedFeats?: Array<{ featId: string; name: string; note?: string; levelAcquired?: number }>;
  bonusFeatSlots?: number;
  abilityScoreBreakdown?: AbilityScoreBreakdown;
  skillModifierBreakdown?: SkillModifierBreakdownDetails;
  resistanceBreakdown?: ResistanceBreakdownDetails;
  detailsList?: Array<{ label: string; value: string | number | React.ReactNode; isBold?: boolean }>;
  babBreakdown?: BabBreakdownDetails;
  initiativeBreakdown?: InitiativeBreakdownDetails;
  grappleModifierBreakdown?: GrappleModifierBreakdownDetails;
  grappleDamageBreakdown?: GrappleDamageBreakdownDetails;
  speeds?: Partial<Record<SpeedType, number>>;
  speedBreakdown?: SpeedBreakdownDetails;
}

interface SkillModifierBreakdownDetails {
  skillName: string;
  keyAbilityName?: string; 
  keyAbilityModifier: number;
  ranks: number;
  synergyBonus: number;
  featBonus: number;
  racialBonus: number;
  sizeSpecificBonus: number;
  miscModifier: number;
  totalBonus: number;
}
