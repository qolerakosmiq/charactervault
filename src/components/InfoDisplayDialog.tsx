
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
import { Badge } from '@/components/ui/badge';
import { Info, Wind, Waves, MoveVertical, Shell, Feather, Loader2, SparklesIcon, Square, CheckSquare, ShieldOff, Weight, Zap, AlertTriangle } from 'lucide-react'; // Added Zap, AlertTriangle
import { ScrollArea } from '@/components/ui/scroll-area';
import type {
  Character, AbilityName, AbilityScoreBreakdown, RaceSpecialQualities,
  InfoDialogContentType, ResistanceFieldKeySheet, SavingThrowType,
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
  DndRaceOption, DndClassOption, AbilityScores, AggregatedFeatEffects
} from '@/types/character';

import {
  getRaceSpecialQualities,
  calculateDetailedAbilityScores,
  calculateTotalSynergyBonus,
  calculateRacialSkillBonus,
  calculateSizeSpecificSkillBonus,
  checkFeatPrerequisites,
  calculateSpeedBreakdown,
  ABILITY_ORDER_INTERNAL,
  getRaceSkillPointsBonusPerLevel,
  SAVING_THROW_ABILITIES
} from '@/types/character';
import { useDefinitionsStore, type CustomSkillDefinition } from '@/lib/definitions-store';
import { useI18n } from '@/context/I18nProvider';
import { Separator } from '@/components/ui/separator';

import {
  calculateAbilityModifier, getAbilityModifierByName, getBab, getSizeModifierAC, getSizeModifierGrapple,
  calculateInitiative, calculateGrapple, getUnarmedGrappleDamage, getBaseSaves
} from '@/lib/dnd-utils';

import { RaceContentDisplay } from './info-dialog-content/RaceContentDisplay';
import { ClassContentDisplay } from './info-dialog-content/ClassContentDisplay';
import { AlignmentSummaryContentDisplay } from './info-dialog-content/AlignmentSummaryContentDisplay';
import { DeityContentDisplay } from './info-dialog-content/DeityContentDisplay';
import { AbilityScoreBreakdownContentDisplay } from './info-dialog-content/AbilityScoreBreakdownContentDisplay';
import { SkillModifierBreakdownContentDisplay } from './info-dialog-content/SkillModifierBreakdownContentDisplay';
import { ResistanceBreakdownContentDisplay } from './info-dialog-content/ResistanceBreakdownContentDisplay';
import { AcBreakdownContentDisplay, type AcBreakdownDetailItem } from './info-dialog-content/AcBreakdownContentDisplay';
import { BabBreakdownContentDisplay } from './info-dialog-content/BabBreakdownContentDisplay';
import { InitiativeBreakdownContentDisplay } from './info-dialog-content/InitiativeBreakdownContentDisplay';
import { GrappleModifierBreakdownContentDisplay } from './info-dialog-content/GrappleModifierBreakdownContentDisplay';
import { GrappleDamageBreakdownContentDisplay } from './info-dialog-content/GrappleDamageBreakdownContentDisplay';
import { SpeedBreakdownContentDisplay } from './info-dialog-content/SpeedBreakdownContentDisplay';
import { SavingThrowBreakdownContentDisplay, type SavingThrowBreakdownDetails } from './info-dialog-content/SavingThrowBreakdownContentDisplay';
import { GenericHtmlContentDisplay } from './info-dialog-content/GenericHtmlContentDisplay';


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
export interface SkillModifierBreakdownDetails {
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
export interface SynergyInfoItem {
  id: string;
  text: React.ReactNode;
  isActive: boolean;
}


interface InfoDisplayDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  character: Character;
  contentType: InfoDialogContentType | null;
  aggregatedFeatEffects: AggregatedFeatEffects;
}

const DIALOG_ICONS: Record<string, React.ElementType> = {
  land: Wind, burrow: Shell, climb: MoveVertical, fly: Feather, swim: Waves,
  skillModifierBreakdown: SparklesIcon,
  armorSpeedPenaltyBreakdown: ShieldOff,
  loadSpeedPenaltyBreakdown: Weight,
  fortitude: Zap, reflex: Zap, will: Zap,
  error: AlertTriangle,
  default: Info,
};


export function InfoDisplayDialog({
  isOpen,
  onOpenChange,
  character,
  contentType,
  aggregatedFeatEffects: aggregatedFeatEffectsProp,
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


  const derivedData = React.useMemo((): DerivedDialogData | null => {
    if (!isOpen || !contentType || !character || translationsLoading || !translations || !aggregatedFeatEffectsProp) {
      return null;
    }

    const {
      DND_RACES, DND_CLASSES, DND_DEITIES, ALIGNMENTS, SKILL_DEFINITIONS, SIZES,
      DND_FEATS_DEFINITIONS: PREDEFINED_FEATS, ABILITY_LABELS, SAVING_THROW_LABELS,
      DND_RACE_ABILITY_MODIFIERS_DATA, DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA,
      SKILL_SYNERGIES: SKILL_SYNERGIES_DATA, CLASS_SKILLS: CLASS_SKILLS_DATA,
      ALIGNMENT_PREREQUISITE_OPTIONS, DND_RACE_BASE_MAX_AGE_DATA, RACE_TO_AGING_CATEGORY_MAP_DATA, DND_RACE_AGING_EFFECTS_DATA, UI_STRINGS
    } = translations;

    let data: DerivedDialogData = { title: UI_STRINGS.infoDialogDefaultTitle || 'Information', content: [] };
    let detailsListHeading: string = UI_STRINGS.infoDialogSectionHeadingDetails || "Details";
    let iconKey = "default";

    const detailedCharScoresForDialog = calculateDetailedAbilityScores(character, aggregatedFeatEffectsProp, DND_RACES, DND_RACE_ABILITY_MODIFIERS_DATA, DND_RACE_BASE_MAX_AGE_DATA, RACE_TO_AGING_CATEGORY_MAP_DATA, DND_RACE_AGING_EFFECTS_DATA, ABILITY_LABELS);
    const finalAbilityScores: AbilityScores = (ABILITY_ORDER_INTERNAL).reduce((acc, ability) => {
        acc[ability] = detailedCharScoresForDialog[ability].finalScore;
        return acc;
    }, {} as AbilityScores);


    switch (contentType.type) {
      case 'race': {
        iconKey = 'race';
        const raceId = character.race;
        const raceData = DND_RACES.find(r => r.value === raceId);
        const qualities = getRaceSpecialQualities(raceId, DND_RACES, DND_RACE_ABILITY_MODIFIERS_DATA, SKILL_DEFINITIONS, PREDEFINED_FEATS, ABILITY_LABELS);
        const racialSkillPointBonus = getRaceSkillPointsBonusPerLevel(raceId, DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA);

        let raceBonusFeatSlotsValue = qualities.bonusFeatSlots;
        if (raceBonusFeatSlotsValue !== undefined && raceBonusFeatSlotsValue <= 0) {
            raceBonusFeatSlotsValue = undefined;
        }

        data = {
          title: raceData?.label || UI_STRINGS.infoDialogRaceDefaultTitle || 'Race Information',
          content: RaceContentDisplay({
            htmlContent: raceData?.description || `<p>${UI_STRINGS.infoDialogNoSkillDescription || 'No description available.'}</p>`,
            abilityModifiers: qualities.abilityEffects,
            skillBonuses: qualities.skillBonuses,
            grantedFeats: qualities.grantedFeats,
            bonusFeatSlots: raceBonusFeatSlotsValue,
            speeds: qualities.speeds,
            translations,
            allCombinedFeatDefinitions,
            customSkillDefinitions,
            character,
            expandedItems,
            toggleExpanded,
          }),
        };
        break;
      }
      case 'class': {
        iconKey = 'class';
        const classId = character.classes[0]?.className;
        const classData = DND_CLASSES.find(c => c.value === classId);
        const classSpecificDetails: Array<{ label: string; value: string | number; isBold?: boolean }> = [];
        if (classData?.hitDice) classSpecificDetails.push({ label: UI_STRINGS.hitDiceLabel || "Hit Dice", value: classData.hitDice, isBold: true });
        if (classData?.saves) {
          const fortSaveLabel = SAVING_THROW_LABELS.find(l => l.value === 'fortitude')?.label || "Fortitude Save";
          const reflexSaveLabel = SAVING_THROW_LABELS.find(l => l.value === 'reflex')?.label || "Reflex Save";
          const willSaveLabel = SAVING_THROW_LABELS.find(l => l.value === 'will')?.label || "Will Save";

          const fortProgression = classData.saves.fortitude === 'good' ? (UI_STRINGS.saveProgressionGood || 'Good') : (UI_STRINGS.saveProgressionPoor || 'Poor');
          const reflexProgression = classData.saves.reflex === 'good' ? (UI_STRINGS.saveProgressionGood || 'Good') : (UI_STRINGS.saveProgressionPoor || 'Poor');
          const willProgression = classData.saves.will === 'good' ? (UI_STRINGS.saveProgressionGood || 'Good') : (UI_STRINGS.saveProgressionPoor || 'Poor');

          classSpecificDetails.push({ label: fortSaveLabel, value: fortProgression });
          classSpecificDetails.push({ label: reflexSaveLabel, value: reflexProgression });
          classSpecificDetails.push({ label: willSaveLabel, value: willProgression });
        }

        const grantedFeatsFormatted = classData?.grantedFeats?.map(gf => ({
            ...gf, name: allCombinedFeatDefinitions.find(f => f.value === gf.featId)?.label || gf.featId
        }));

        data = {
          title: classData?.label || UI_STRINGS.infoDialogClassDefaultTitle || 'Class Information',
          content: ClassContentDisplay({
            htmlContent: classData?.description || `<p>${UI_STRINGS.infoDialogNoSkillDescription || 'No description available.'}</p>`,
            grantedFeats: grantedFeatsFormatted,
            detailsList: classSpecificDetails,
            translations,
            allCombinedFeatDefinitions,
            customSkillDefinitions,
            character,
            expandedItems,
            toggleExpanded,
          }),
        };
        break;
      }
      case 'alignmentSummary':
        iconKey = 'alignmentSummary';
        data = {
          title: UI_STRINGS.infoDialogAlignmentsTitle || 'Alignments',
          content: [AlignmentSummaryContentDisplay({htmlContent: ALIGNMENTS.map(a => `<p><b>${a.label}:</b><br />${a.description}</p>`).join('')})],
        };
        break;
      case 'deity':
        iconKey = 'deity';
        const deityId = character.deity;
        const deityData = DND_DEITIES.find(d => d.value === deityId);
        if (deityData) {
            data = { title: deityData.label, content: [DeityContentDisplay({htmlContent: deityData.description || `<p>${(UI_STRINGS.infoDialogNoSkillDescription || 'No detailed description available for').replace('{itemName}', deityData.label)}</p>`})] };
        } else if (deityId && deityId.trim() !== '') {
            data = { title: deityId, content: [DeityContentDisplay({htmlContent: `<p>${UI_STRINGS.infoDialogDeityPlaceholder || 'Custom deity. No predefined information available.'}</p>`})] };
        } else {
            data = { title: UI_STRINGS.infoDialogDeityDefaultTitle || "Deity Information", content: [DeityContentDisplay({htmlContent: `<p>${UI_STRINGS.infoDialogDeityPlaceholder || "Select or type a deity to see more information."}</p>`})]};
        }
        break;
      case 'abilityScoreBreakdown': {
        iconKey = 'abilityScoreBreakdown';
        const abilityKeyForTitle = contentType.abilityName as Exclude<AbilityName, 'none'>;
        const abilityLabelForTitle = ABILITY_LABELS.find(al => al.value === abilityKeyForTitle);
        const abilityNameString = abilityLabelForTitle?.label || abilityKeyForTitle;
        data = {
          title: (UI_STRINGS.infoDialogTitleScoreCalculation || "{abilityName} Score Calculation").replace("{abilityName}", abilityNameString),
          content: [AbilityScoreBreakdownContentDisplay({abilityScoreBreakdown: detailedCharScoresForDialog[contentType.abilityName], uiStrings: UI_STRINGS})],
        };
        break;
      }
      case 'skillModifierBreakdown': {
        iconKey = 'skillModifierBreakdown';
        const skillInstance = character.skills.find(s => s.id === contentType.skillId);
        const skillDef = allCombinedSkillDefinitionsForDisplay.find(sd => sd.id === contentType.skillId);
        if (skillInstance && skillDef) {
          const keyAbilityMod = skillDef.keyAbility && skillDef.keyAbility !== 'none' ? getAbilityModifierByName(finalAbilityScores, skillDef.keyAbility) : 0;
          const synergyBonus = calculateTotalSynergyBonus(skillDef.id, character.skills, SKILL_DEFINITIONS, SKILL_SYNERGIES_DATA, customSkillDefinitions);

          const featBonus = aggregatedFeatEffectsProp.skillBonuses[skillDef.id] || 0;
          const racialBonus = calculateRacialSkillBonus(skillDef.id, character.race, DND_RACES);
          const sizeBonus = calculateSizeSpecificSkillBonus(skillDef.id, character.size, SIZES);
          const calculatedMiscModifier = synergyBonus + featBonus + racialBonus + sizeBonus;
          const totalSkillBonus = (skillInstance.ranks || 0) + keyAbilityMod + calculatedMiscModifier + (skillInstance.miscModifier || 0);
          const keyAbilityLabel = skillDef.keyAbility && skillDef.keyAbility !== 'none' ? ABILITY_LABELS.find(al => al.value === skillDef.keyAbility)?.abbr : undefined;

          const currentSkillId = contentType.skillId;
          const synergyItems: SynergyInfoItem[] = [];
          const badgeClass = "text-xs font-normal h-5 mx-0.5 px-1.5 py-0.5 align-baseline whitespace-nowrap";

          allCombinedSkillDefinitionsForDisplay.forEach(providingSkillDef => {
              const providingSkillName = <strong>{providingSkillDef.name}</strong>;
              const providingSkillInstance = character.skills.find(s => s.id === providingSkillDef.id);
              const providingSkillRanks = providingSkillInstance?.ranks || 0;

              if (providingSkillDef.id === currentSkillId) {
                  (SKILL_SYNERGIES_DATA[currentSkillId as keyof typeof SKILL_SYNERGIES_DATA] || []).forEach(sRule => {
                      const targetSkillName = <strong>{allCombinedSkillDefinitionsForDisplay.find(sd => sd.id === sRule.targetSkill)?.name || sRule.targetSkill}</strong>;
                      synergyItems.push({
                          id: `provided-${currentSkillId}-${sRule.targetSkill}`,
                          text: (
                            <>
                                {UI_STRINGS.synergyTextPart1ThisSkill || "This skill"}
                                {UI_STRINGS.synergyTextPart1Provided || ", with "}
                                <Badge variant="outline" className={badgeClass}>{sRule.ranksRequired}</Badge>
                                {UI_STRINGS.synergyTextPart2Ranks || " ranks"}
                                {UI_STRINGS.synergyTextPart3GrantsA || ", grants a "}
                                <Badge variant="outline" className={badgeClass}>{sRule.bonus > 0 ? '+' : ''}{sRule.bonus}</Badge>
                                {UI_STRINGS.synergyTextPart4BonusToTargetSkillStart || " bonus to "}
                                {targetSkillName}
                                {UI_STRINGS.synergyTextPart4BonusToTargetSkillEnd || "'s checks."}
                            </>
                          ),
                          isActive: providingSkillRanks >= sRule.ranksRequired
                      });
                  });
                  if (skillDef.isCustom && skillDef.providesSynergies) {
                      skillDef.providesSynergies.forEach(customRule => {
                          const targetSkillNameNode = <strong>{allCombinedSkillDefinitionsForDisplay.find(sd => sd.id === customRule.targetSkillName)?.name || customRule.targetSkillName}</strong>;
                          synergyItems.push({
                              id: `provided-custom-${currentSkillId}-${customRule.id}`,
                               text: (
                                 <>
                                      {UI_STRINGS.synergyTextPart1ThisSkill || "This skill"}
                                      {UI_STRINGS.synergyTextPart1Provided || ", with "}
                                      <Badge variant="outline" className={badgeClass}>{customRule.ranksInThisSkillRequired}</Badge>
                                      {UI_STRINGS.synergyTextPart2Ranks || " ranks"}
                                      {UI_STRINGS.synergyTextPart3GrantsA || ", grants a "}
                                      <Badge variant="outline" className={badgeClass}>{customRule.bonusGranted > 0 ? '+' : ''}{customRule.bonusGranted}</Badge>
                                      {UI_STRINGS.synergyTextPart4BonusToTargetSkillStart || " bonus to "}
                                      {targetSkillNameNode}
                                      {UI_STRINGS.synergyTextPart4BonusToTargetSkillEnd || "'s checks."}
                                  </>
                                ),
                              isActive: providingSkillRanks >= customRule.ranksInThisSkillRequired
                          });
                      });
                  }
              } else {
                  (SKILL_SYNERGIES_DATA[providingSkillDef.id as keyof typeof SKILL_SYNERGIES_DATA] || []).forEach(sRule => {
                      if (sRule.targetSkill === currentSkillId) {
                          synergyItems.push({
                              id: `received-${providingSkillDef.id}-${sRule.targetSkill}`,
                              text: (
                                <>
                                    {providingSkillName}
                                    {UI_STRINGS.synergyTextPart1Received || ", with "}
                                    <Badge variant="outline" className={badgeClass}>{sRule.ranksRequired}</Badge>
                                    {UI_STRINGS.synergyTextPart2Ranks || " ranks"}
                                    {UI_STRINGS.synergyTextPart3GrantsA || ", grants a "}
                                    <Badge variant="outline" className={badgeClass}>{sRule.bonus > 0 ? '+' : ''}{sRule.bonus}</Badge>
                                    {UI_STRINGS.synergyTextPart4BonusToThisSkill || " bonus to this skill's checks."}
                                </>
                              ),
                              isActive: providingSkillRanks >= sRule.ranksRequired
                          });
                      }
                  });
                  const customProvidingSkillDef = allCombinedSkillDefinitionsForDisplay.find(csd => csd.id === providingSkillDef.id && csd.isCustom);
                  if (customProvidingSkillDef?.providesSynergies) {
                      customProvidingSkillDef.providesSynergies.forEach(customRule => {
                          if (customRule.targetSkillName === currentSkillId) {
                              synergyItems.push({
                                  id: `received-custom-${providingSkillDef.id}-${customRule.id}`,
                                  text: (
                                     <>
                                          {providingSkillName}
                                          {UI_STRINGS.synergyTextPart1Received || ", with "}
                                          <Badge variant="outline" className={badgeClass}>{customRule.ranksInThisSkillRequired}</Badge>
                                          {UI_STRINGS.synergyTextPart2Ranks || " ranks"}
                                          {UI_STRINGS.synergyTextPart3GrantsA || ", grants a "}
                                          <Badge variant="outline" className={badgeClass}>{customRule.bonusGranted > 0 ? '+' : ''}{customRule.bonusGranted}</Badge>
                                          {UI_STRINGS.synergyTextPart4BonusToThisSkill || " bonus to this skill's checks."}
                                      </>
                                  ),
                                  isActive: providingSkillRanks >= customRule.ranksInThisSkillRequired
                              });
                          }
                      });
                  }
              }
          });

          const skillModifierBreakdownData = {
              skillName: skillDef.name,
              keyAbilityName: keyAbilityLabel,
              keyAbilityModifier: keyAbilityMod,
              ranks: skillInstance.ranks || 0,
              synergyBonus, featBonus, racialBonus, sizeSpecificBonus: sizeBonus,
              miscModifier: skillInstance.miscModifier || 0,
              totalBonus: totalSkillBonus,
          };

          data = {
            title: (UI_STRINGS.infoDialogTitleModifierBreakdown || "{skillName} Modifier Breakdown").replace("{skillName}", skillDef.name),
            content: SkillModifierBreakdownContentDisplay({
                htmlContent: skillDef.description,
                synergyInfoList: synergyItems.length > 0 ? synergyItems : undefined,
                skillModifierBreakdown: skillModifierBreakdownData,
                uiStrings: UI_STRINGS,
            }),
          };
        } else {
            data = { title: UI_STRINGS.infoDialogSkillDefaultTitle || "Skill Information", content: [GenericHtmlContentDisplay({htmlContent: `<p>${UI_STRINGS.infoDialogSkillNotFound || "Skill details not found."}</p>`})]};
        }
        break;
      }
      case 'resistanceBreakdown':
        iconKey = 'resistanceBreakdown';
        const resistanceValue = character[contentType.resistanceField] as ResistanceValue;
        const resistanceFieldLabelKey = `resistanceLabel${contentType.resistanceField.charAt(0).toUpperCase() + contentType.resistanceField.slice(1).replace('Resistance', '')}` as keyof typeof UI_STRINGS;
        const resistanceLabel = UI_STRINGS[resistanceFieldLabelKey] || contentType.resistanceField.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(' Resistance', '');

        data = {
          title: (UI_STRINGS.infoDialogTitleResistanceBreakdown || "{resistanceName} Resistance Breakdown").replace("{resistanceName}", resistanceLabel),
          content: [ResistanceBreakdownContentDisplay({
            resistanceBreakdown: {
                name: resistanceLabel,
                base: resistanceValue.base || 0,
                customMod: resistanceValue.customMod || 0,
                total: (resistanceValue.base || 0) + (resistanceValue.customMod || 0),
            },
            uiStrings: UI_STRINGS,
          })],
        };
        break;
      case 'acBreakdown': {
        iconKey = 'acBreakdown';
        const dexMod = calculateAbilityModifier(finalAbilityScores.dexterity);
        const sizeModACVal = getSizeModifierAC(character.size, SIZES);
        const sizeLabel = SIZES.find(s => s.value === character.size)?.label || character.size;
        const details: AcBreakdownDetailItem[] = [];

        const acCalculatedMiscModifier = 0;
        const temporaryAcModifier = character.acMiscModifier || 0;

        details.push({ label: UI_STRINGS.acBreakdownBaseLabel || "Base", value: 10 });

        if (contentType.acType === 'Normal' || contentType.acType === 'Touch') {
          details.push({
            label: UI_STRINGS.infoDialogAcAbilityLabel || "Ability Modifier",
            value: dexMod,
            type: 'acAbilityMod',
            abilityAbbr: ABILITY_LABELS.find(al => al.value === 'dexterity')?.abbr || 'DEX'
          });
        }
        details.push({
          label: UI_STRINGS.infoDialogSizeModifierLabel || "Size Modifier",
          value: sizeModACVal,
          type: 'acSizeMod',
          sizeName: sizeLabel
        });

        if (contentType.acType === 'Normal' || contentType.acType === 'Flat-Footed') {
          if (character.armorBonus) details.push({ label: UI_STRINGS.acBreakdownArmorBonusLabel || "Armor Bonus", value: character.armorBonus });
          if (character.shieldBonus) details.push({ label: UI_STRINGS.acBreakdownShieldBonusLabel || "Shield Bonus", value: character.shieldBonus });
          if (character.naturalArmor) details.push({ label: UI_STRINGS.acBreakdownNaturalArmorLabel || "Natural Armor", value: character.naturalArmor });
        }
        if (character.deflectionBonus) details.push({ label: UI_STRINGS.acBreakdownDeflectionBonusLabel || "Deflection Bonus", value: character.deflectionBonus });

        if (acCalculatedMiscModifier !== 0) {
          details.push({ label: UI_STRINGS.acBreakdownCalculatedMiscLabel || "Misc Modifier", value: acCalculatedMiscModifier });
        }

        if ((contentType.acType === 'Normal' || contentType.acType === 'Touch') && character.dodgeBonus) {
          details.push({ label: UI_STRINGS.acBreakdownDodgeBonusLabel || "Dodge Bonus", value: character.dodgeBonus });
        }

        if (temporaryAcModifier !== 0) {
          details.push({ label: UI_STRINGS.armorClassTempModifierLabel || "Temporary Modifier", value: temporaryAcModifier });
        }

        let totalCalculated = 10;
        if (contentType.acType === 'Normal') totalCalculated = 10 + (character.armorBonus || 0) + (character.shieldBonus || 0) + dexMod + sizeModACVal + (character.naturalArmor || 0) + (character.deflectionBonus || 0) + (character.dodgeBonus || 0) + (acCalculatedMiscModifier || 0) + (temporaryAcModifier || 0);
        else if (contentType.acType === 'Touch') totalCalculated = 10 + dexMod + sizeModACVal + (character.deflectionBonus || 0) + (character.dodgeBonus || 0) + (acCalculatedMiscModifier || 0) + (temporaryAcModifier || 0);
        else if (contentType.acType === 'Flat-Footed') totalCalculated = 10 + (character.armorBonus || 0) + (character.shieldBonus || 0) + sizeModACVal + (character.naturalArmor || 0) + (character.deflectionBonus || 0) + (acCalculatedMiscModifier || 0) + (temporaryAcModifier || 0);

        const titleTemplate = UI_STRINGS.infoDialogTitleAcBreakdown || "AC Breakdown ({acType})";
        const acTypeLabel = contentType.acType === 'Normal' ? (UI_STRINGS.armorClassNormalLabel || 'Normal')
                          : contentType.acType === 'Touch' ? (UI_STRINGS.armorClassTouchLabel || 'Touch')
                          : (UI_STRINGS.armorClassFlatFootedLabel || 'Flat-Footed');

        data = { title: titleTemplate.replace("{acType}", acTypeLabel), content: [AcBreakdownContentDisplay({detailsList: details, totalACValue: totalCalculated, detailsListHeading, uiStrings: UI_STRINGS, abilityLabels: ABILITY_LABELS })] };
        break;
      }
      case 'babBreakdown': {
        iconKey = 'babBreakdown';
        const baseBabArrayVal = getBab(character.classes, DND_CLASSES);
        data = {
          title: UI_STRINGS.infoDialogTitleBabBreakdown || 'Base Attack Bonus Breakdown',
          content: [BabBreakdownContentDisplay({
            babBreakdown: {
              baseBabFromClasses: baseBabArrayVal,
              miscModifier: character.babMiscModifier || 0,
              totalBab: baseBabArrayVal.map(b => b + (character.babMiscModifier || 0)),
              characterClassLabel: DND_CLASSES.find(c => c.value === character.classes[0]?.className)?.label || character.classes[0]?.className,
              featAttackBonus: 0,
            },
            uiStrings: UI_STRINGS
          })],
        };
        break;
      }
      case 'initiativeBreakdown': {
        iconKey = 'initiativeBreakdown';
        const dexMod = calculateAbilityModifier(finalAbilityScores.dexterity);
        data = {
          title: UI_STRINGS.infoDialogTitleInitiativeBreakdown || 'Initiative Breakdown',
          content: [InitiativeBreakdownContentDisplay({
            initiativeBreakdown: {
              dexModifier: dexMod,
              miscModifier: character.initiativeMiscModifier || 0,
              totalInitiative: calculateInitiative(dexMod, character.initiativeMiscModifier || 0),
              featBonus: 0,
            },
            uiStrings: UI_STRINGS,
            abilityLabels: ABILITY_LABELS,
          })],
        };
        break;
      }
      case 'grappleModifierBreakdown': {
        iconKey = 'grappleModifierBreakdown';
        const strMod = calculateAbilityModifier(finalAbilityScores.strength);
        const baseBabArrayVal = getBab(character.classes, DND_CLASSES);
        const sizeModGrappleVal = getSizeModifierGrapple(character.size, SIZES);
        data = {
          title: UI_STRINGS.infoDialogTitleGrappleModifierBreakdown || 'Grapple Modifier Breakdown',
          content: [GrappleModifierBreakdownContentDisplay({
            grappleModifierBreakdown: {
                baseAttackBonus: baseBabArrayVal[0] || 0,
                strengthModifier: strMod,
                sizeModifierGrapple: sizeModGrappleVal,
                miscModifier: character.grappleMiscModifier || 0,
                totalGrappleModifier: calculateGrapple(character.classes, strMod, sizeModGrappleVal, DND_CLASSES) + (character.grappleMiscModifier || 0),
                featBonus: 0,
            },
            uiStrings: UI_STRINGS,
            abilityLabels: ABILITY_LABELS,
          })],
        };
        break;
      }
       case 'grappleDamageBreakdown': {
        iconKey = 'grappleDamageBreakdown';
        const strMod = calculateAbilityModifier(finalAbilityScores.strength);
        data = {
          title: UI_STRINGS.infoDialogTitleGrappleDamageBreakdown || 'Grapple Damage Breakdown',
          content: [GrappleDamageBreakdownContentDisplay({
            grappleDamageBreakdown: {
              baseDamage: character.grappleDamage_baseNotes || getUnarmedGrappleDamage(character.size, SIZES),
              bonus: character.grappleDamage_bonus || 0,
              strengthModifier: strMod,
              featBonus: 0,
            },
            uiStrings: UI_STRINGS,
            abilityLabels: ABILITY_LABELS,
          })],
        };
        break;
      }
      case 'speedBreakdown': {
        iconKey = contentType.speedType;
        const speedBreakdownDetails = calculateSpeedBreakdown(contentType.speedType, character, DND_RACES, DND_CLASSES, SIZES, UI_STRINGS);
        const speedNameString = speedBreakdownDetails.name;
        data = {
          title: (UI_STRINGS.infoDialogTitleSpeedBreakdown || "{speedName} Breakdown").replace("{speedName}", speedNameString),
          content: [SpeedBreakdownContentDisplay({speedBreakdown: speedBreakdownDetails, uiStrings: UI_STRINGS})],
        };
        break;
      }
      case 'armorSpeedPenaltyBreakdown': {
        iconKey = 'armorSpeedPenaltyBreakdown';
        const basePenalty = character.armorSpeedPenalty_base || 0;
        const miscModifier = character.armorSpeedPenalty_miscModifier || 0;
        const netEffectOnSpeed = miscModifier - basePenalty;
        const penaltyBreakdown: SpeedBreakdownDetailsType = {
            name: UI_STRINGS.totalArmorPenaltyLabel || "Total Armor Penalty Effect",
            components: [
                { source: UI_STRINGS.speedPenaltyBaseArmorLabel || "Base from Armor", value: -basePenalty },
                { source: UI_STRINGS.speedMiscModifierLabel || "Misc Modifier", value: miscModifier }
            ],
            total: netEffectOnSpeed
        };
        data = {
            title: UI_STRINGS.infoDialogTitleArmorPenaltyBreakdown || "Armor Penalty Breakdown",
            content: [SpeedBreakdownContentDisplay({ speedBreakdown: penaltyBreakdown, uiStrings: UI_STRINGS })]
        };
        break;
      }
      case 'loadSpeedPenaltyBreakdown': {
        iconKey = 'loadSpeedPenaltyBreakdown';
        const basePenalty = character.loadSpeedPenalty_base || 0;
        const miscModifier = character.loadSpeedPenalty_miscModifier || 0;
        const netEffectOnSpeed = miscModifier - basePenalty;
        const penaltyBreakdown: SpeedBreakdownDetailsType = {
            name: UI_STRINGS.totalLoadPenaltyLabel || "Total Load Penalty Effect",
            components: [
                { source: UI_STRINGS.speedPenaltyBaseLoadLabel || "Base from Load", value: -basePenalty },
                { source: UI_STRINGS.speedMiscModifierLabel || "Misc Modifier", value: miscModifier }
            ],
            total: netEffectOnSpeed
        };
        data = {
            title: UI_STRINGS.infoDialogTitleLoadPenaltyBreakdown || "Load Penalty Breakdown",
            content: [SpeedBreakdownContentDisplay({ speedBreakdown: penaltyBreakdown, uiStrings: UI_STRINGS })]
        };
        break;
      }
      case 'savingThrowBreakdown': {
        const currentSaveType = contentType.saveType;
        // Removed the isValidSaveType check to allow direct processing or failure
        
        iconKey = typeof currentSaveType === 'string' && ['fortitude', 'reflex', 'will'].includes(currentSaveType) ? currentSaveType : 'error';
        
        // Attempt to get labels and keys, will be problematic if currentSaveType is not a string
        const saveTypeLabel = SAVING_THROW_LABELS.find(stl => stl.value === currentSaveType)?.label || String(currentSaveType);
        const dialogTitle = (UI_STRINGS.infoDialogTitleSavingThrowBreakdown || "{saveTypeLabel} Breakdown").replace("{saveTypeLabel}", saveTypeLabel);

        const calculatedBaseSaves = getBaseSaves(character.classes, DND_CLASSES);
        // The following lines will likely cause errors if currentSaveType is an object
        const baseSave = calculatedBaseSaves[currentSaveType as SavingThrowType];
        const abilityKeyForSave = SAVING_THROW_ABILITIES[currentSaveType as SavingThrowType];
        const abilityMod = getAbilityModifierByName(finalAbilityScores, abilityKeyForSave);
        const magicMod = character.savingThrows?.[currentSaveType as SavingThrowType]?.magicMod || 0;
        const userTemporaryMod = character.savingThrows?.[currentSaveType as SavingThrowType]?.miscMod || 0;

        const featComponents: SavingThrowBreakdownDetails['featComponents'] = [];
        let featBonusTotal = 0;

        aggregatedFeatEffectsProp.savingThrowBonuses.forEach(effect => {
          if (effect.save === currentSaveType || effect.save === "all") {
            let numericValueFromEffect = 0;
            if (typeof effect.value === 'number') {
              numericValueFromEffect = effect.value;
            } else if (typeof effect.value === 'string' && ABILITY_ORDER_INTERNAL.includes(effect.value as Exclude<AbilityName, 'none'>)) {
              numericValueFromEffect = getAbilityModifierByName(finalAbilityScores, effect.value as Exclude<AbilityName, 'none'>);
            }
            if (numericValueFromEffect !== 0 || effect.condition) {
                featComponents.push({
                    sourceFeat: effect.sourceFeat || 'Unknown Feat',
                    value: numericValueFromEffect,
                    condition: effect.condition,
                });
            }
            featBonusTotal += numericValueFromEffect;
          }
        });

        const totalCalculatedSave = baseSave + abilityMod + magicMod + userTemporaryMod + featBonusTotal;

        const breakdownDetails: SavingThrowBreakdownDetails = {
          saveType: currentSaveType as SavingThrowType, // This cast will be problematic if currentSaveType is an object
          saveTypeLabel,
          baseSave,
          abilityKey: abilityKeyForSave,
          abilityMod,
          magicMod,
          userMiscModifier: userTemporaryMod,
          featBonusTotal,
          featComponents,
          totalSave: totalCalculatedSave,
        };

        data = {
          title: dialogTitle,
          content: [SavingThrowBreakdownContentDisplay({ breakdown: breakdownDetails, uiStrings: UI_STRINGS, abilityLabels: ABILITY_LABELS })],
        };
        break;
      }
      case 'genericHtml':
        iconKey = 'genericHtml';
        data = { title: contentType.title, content: [GenericHtmlContentDisplay({htmlContent: contentType.content})] };
        break;
    }
    data.iconKey = iconKey;
    return data;
  }, [isOpen, contentType, character, translationsLoading, translations, customFeatDefinitions, customSkillDefinitions, allCombinedFeatDefinitions, allCombinedSkillDefinitionsForDisplay, expandedItems, toggleExpanded, aggregatedFeatEffectsProp]);


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
    content: contentBlocks,
    iconKey: finalIconKey
  } = derivedData;

  const IconComponent = DIALOG_ICONS[finalIconKey || 'default'] || Info;

  const renderContent = () => {
    if (!contentBlocks) return null;

    if (Array.isArray(contentBlocks)) {
      return contentBlocks.map((block, index, arr) => (
        <React.Fragment key={index}>
          {block}
          {index < arr.length - 1 && <Separator className="my-3" />}
        </React.Fragment>
      ));
    }
    return contentBlocks;
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif text-left">
            <IconComponent className="mr-2 h-6 w-6 text-primary" />
            {finalTitle}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4 my-2">
          <div className="pb-4">
            {renderContent()}
          </div>
        </ScrollArea>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">{UI_STRINGS.infoDialogCloseButton}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DerivedDialogData {
  title: string;
  content?: React.ReactNode | React.ReactNode[];
  iconKey?: string;
}
