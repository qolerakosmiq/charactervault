
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
import { Info, Wind, Waves, MoveVertical, Shell, Feather, Loader2, SparklesIcon, Square, CheckSquare, ShieldOff, Weight, Zap, AlertTriangle, Heart, ShieldQuestion, Swords, Dices, Brain, UserCircle2, Palette, ScrollText, Languages as LanguagesIcon, Award, Backpack, Sparkles as SpellsIcon, Users as UsersIcon, Shield, ListChecks } from 'lucide-react'; // Added ListChecks
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
  DndRaceOption, DndClassOption, AbilityScores, AggregatedFeatEffects, DetailedAbilityScores,
  CharacterAlignmentObject, DndDeityOption, ClassAttribute, AggregatedFeatEffectBase, SkillEffectDetail,
  ItemDefinition, ItemInstance, GearSlotId, LocalizedString, GenericBreakdownItem // Added Item types and LocalizedString
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
  getRaceSkillPointsBonusPerLevel
} from '@/types/character';
import { useDefinitionsStore, type CustomSkillDefinition } from '@/lib/definitions-store';
import { useI18n } from '@/context/I18nProvider';
import { Separator } from '@/components/ui/separator';
import { getLocalizedString, type ProcessedSiteData } from '@/i18n/i18n-data';
import type { LanguageCode } from '@/i18n/config';

import {
  calculateAbilityModifier, getAbilityModifierByName, getBab, getSizeModifierAC, getSizeModifierGrapple,
  calculateInitiative, calculateGrapple, getUnarmedGrappleDamage, getBaseSaves, SAVING_THROW_ABILITIES
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
import { SavingThrowBreakdownContentDisplay, type SavingThrowBreakdownDetails, type SavingThrowFeatComponent } from './info-dialog-content/SavingThrowBreakdownContentDisplay';
import { GenericHtmlContentDisplay } from './info-dialog-content/GenericHtmlContentDisplay';
import { MaxHpBreakdownContentDisplay } from './info-dialog-content/MaxHpBreakdownContentDisplay';
import { MeleeAttackBreakdownContentDisplay } from './info-dialog-content/MeleeAttackBreakdownContentDisplay';
import { MeleeDamageBreakdownContentDisplay } from './info-dialog-content/MeleeDamageBreakdownContentDisplay';
import { RangedAttackBreakdownContentDisplay } from './info-dialog-content/RangedAttackBreakdownContentDisplay';
import { RangedDamageBreakdownContentDisplay } from './info-dialog-content/RangedDamageBreakdownContentDisplay';
import { ClassSpecificChoiceOptionsDisplay } from './info-dialog-content/ClassSpecificChoiceOptionsDisplay'; // Added


export interface ResistanceBreakdownDetails {
  name: string;
  base: number;
  customMod: number;
  itemBonus: number;
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
  detailedAbilityScores: DetailedAbilityScores | null;
}

const DIALOG_ICONS: Record<string, React.ElementType> = {
  race: UsersIcon,
  class: Award,
  alignmentSummary: ShieldQuestion,
  deity: SparklesIcon,
  abilityScoreBreakdown: Dices,
  skillModifierBreakdown: Brain,
  resistanceBreakdown: Shield,
  acBreakdown: Shield,
  babBreakdown: Swords,
  initiativeBreakdown: Zap,
  grappleModifierBreakdown: Swords,
  grappleDamageBreakdown: Swords,
  meleeAttackBreakdown: Swords,
  meleeDamageBreakdown: Swords,
  rangedAttackBreakdown: Swords,
  rangedDamageBreakdown: Swords,
  land: Wind, burrow: Shell, climb: MoveVertical, fly: Feather, swim: Waves,
  armorSpeedPenaltyBreakdown: ShieldOff,
  loadSpeedPenaltyBreakdown: Weight,
  fortitude: Heart,
  reflex: Zap,
  will: Brain,
  maxHpBreakdown: Heart,
  genericHtml: Info,
  classSpecificChoiceOptions: ListChecks, // Added
  error: AlertTriangle,
  default: Info,
};


export function InfoDisplayDialog({
  isOpen,
  onOpenChange,
  character,
  contentType,
  aggregatedFeatEffects: aggregatedFeatEffectsProp,
  detailedAbilityScores: detailedAbilityScoresProp,
}: InfoDisplayDialogProps) {
  const { translations, isLoading: translationsLoading, language } = useI18n();
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
      id: sd.id,
      name: sd.label,
      keyAbility: sd.keyAbility as AbilityName,
      description: sd.description,
      isCustom: false,
      providesSynergies: (translations.SKILL_SYNERGIES as Record<string, any>)[sd.id] || [],
    }));
    const custom = customSkillDefinitions.map(csd => ({
      ...csd,
      isCustom: true,
    }));
    return [...predefined, ...custom].sort((a, b) => a.name.localeCompare(b.name));
  }, [translations, translationsLoading, customSkillDefinitions]);


  const derivedData = React.useMemo((): DerivedDialogData | null => {
    if (!isOpen || !contentType || !character || translationsLoading || !translations || !aggregatedFeatEffectsProp || !detailedAbilityScoresProp) {
      return null;
    }

    const {
      DND_RACES, DND_CLASSES, DND_DEITIES, ALIGNMENTS, SKILL_DEFINITIONS, SIZES,
      DND_FEATS_DEFINITIONS: PREDEFINED_FEATS, ABILITY_LABELS, SAVING_THROW_LABELS,
      DND_RACE_ABILITY_MODIFIERS_DATA, DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA,
      SKILL_SYNERGIES: SKILL_SYNERGIES_DATA, CLASS_SKILLS: CLASS_SKILLS_DATA,
      ALIGNMENT_PREREQUISITE_OPTIONS, DND_RACE_BASE_MAX_AGE_DATA, RACE_TO_AGING_CATEGORY_MAP_DATA, DND_RACE_AGING_EFFECTS_DATA, UI_STRINGS,
      ITEM_DEFINITIONS_ARMOR, ITEM_DEFINITIONS_SHIELDS, ITEM_DEFINITIONS_WEAPONS, ITEM_DEFINITIONS_MAGIC_ITEMS
    } = translations;

    let data: DerivedDialogData = { title: UI_STRINGS.infoDialogDefaultTitle || "Information", content: [] };
    let detailsListHeading: string = UI_STRINGS.infoDialogSectionHeadingDetails || "Details";
    let iconKey = "default";

    const detailedCharScoresForDialog = detailedAbilityScoresProp;
    const finalAbilityScores: AbilityScores = (ABILITY_ORDER_INTERNAL).reduce((acc, ability) => {
        acc[ability] = detailedCharScoresForDialog[ability].finalScore;
        return acc;
    }, {} as AbilityScores);


    switch (contentType.type) {
      case 'race': {
        iconKey = 'race';
        const raceId = character.race;
        const raceData = DND_RACES.find(r => r.id === raceId);
        const qualities = getRaceSpecialQualities(raceId, DND_RACES, DND_RACE_ABILITY_MODIFIERS_DATA, SKILL_DEFINITIONS, PREDEFINED_FEATS, ABILITY_LABELS);

        let raceBonusFeatSlotsValue = qualities.bonusFeatSlots;
        if (raceBonusFeatSlotsValue !== undefined && raceBonusFeatSlotsValue <= 0) {
            raceBonusFeatSlotsValue = undefined;
        }

        data = {
          title: raceData?.label || (UI_STRINGS.infoDialogRaceDefaultTitle || "Race Details"),
          content: RaceContentDisplay({
            htmlContent: raceData?.generalDescription,
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
        const classData = DND_CLASSES.find(c => c.id === classId);
        const classSpecificDetails: Array<{ label: string; value: string | number; isBold?: boolean }> = [];
        if (classData?.hitDice) classSpecificDetails.push({ label: UI_STRINGS.hitDiceLabel || "Hit Dice | <b>{value}</b>", value: classData.hitDice, isBold: true });
        if (classData?.saves) {
          const fortSaveLabel = SAVING_THROW_LABELS.find(l => l.id === 'fortitude')?.label;
          const reflexSaveLabel = SAVING_THROW_LABELS.find(l => l.id === 'reflex')?.label;
          const willSaveLabel = SAVING_THROW_LABELS.find(l => l.id === 'will')?.label;

          const fortProgression = classData.saves.fortitude === 'good' ? (UI_STRINGS.saveProgressionGood || "Good") : (UI_STRINGS.saveProgressionPoor || "Poor");
          const reflexProgression = classData.saves.reflex === 'good' ? (UI_STRINGS.saveProgressionGood || "Good") : (UI_STRINGS.saveProgressionPoor || "Poor");
          const willProgression = classData.saves.will === 'good' ? (UI_STRINGS.saveProgressionGood || "Good") : (UI_STRINGS.saveProgressionPoor || "Poor");

          if (fortSaveLabel) classSpecificDetails.push({ label: fortSaveLabel, value: fortProgression });
          if (reflexSaveLabel) classSpecificDetails.push({ label: reflexSaveLabel, value: reflexProgression });
          if (willSaveLabel) classSpecificDetails.push({ label: willSaveLabel, value: willProgression });
        }

        const grantedFeatsFormatted = classData?.grantedFeats?.map(gf => ({
            ...gf, name: allCombinedFeatDefinitions.find(f => f.id === gf.featId)?.label || gf.featId
        }));

        data = {
          title: classData?.label || (UI_STRINGS.infoDialogClassDefaultTitle || "Class Details"),
          content: ClassContentDisplay({
            htmlContent: classData?.generalDescription,
            loreAttributes: classData?.loreAttributes,
            grantedFeats: grantedFeatsFormatted,
            detailsList: classSpecificDetails.length > 0 ? classSpecificDetails : undefined,
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
          title: UI_STRINGS.infoDialogAlignmentsTitle || "Alignments",
          content: [AlignmentSummaryContentDisplay({ alignments: ALIGNMENTS, uiStrings: UI_STRINGS })],
        };
        break;
      case 'deity':
        iconKey = 'deity';
        const deityId = character.deity;
        const deityData = DND_DEITIES.find(d => d.id === deityId);

        if (deityData) {
            data = {
                title: deityData.label,
                content: [DeityContentDisplay({ deityData, uiStrings: UI_STRINGS })]
            };
        } else if (deityId && deityId.trim() !== '') {
             const customDeityDisplay: DndDeityOption = {
                id: deityId,
                label: deityId,
                alignment: '',
                fullName: deityId,
                attributes: [{ key: UI_STRINGS.infoDialogDeityPlaceholder || "Select or type a deity...", value: ""}]
             };
            data = { title: deityId, content: [DeityContentDisplay({ deityData: customDeityDisplay, uiStrings: UI_STRINGS })] };
        } else {
             const placeholderDeity: DndDeityOption = {
                id: "__placeholder__",
                label: UI_STRINGS.infoDialogDeityDefaultTitle || "Deity",
                alignment: '',
                fullName: UI_STRINGS.infoDialogDeityDefaultTitle || "Deity",
                attributes: [{ key: UI_STRINGS.infoDialogDeityPlaceholder || "Select or type a deity...", value: ""}]
             };
            data = { title: UI_STRINGS.infoDialogDeityDefaultTitle || "Deity", content: [DeityContentDisplay({ deityData: placeholderDeity, uiStrings: UI_STRINGS })]};
        }
        break;
      case 'abilityScoreBreakdown': {
        iconKey = 'abilityScoreBreakdown';
        const abilityKeyForTitle = contentType.abilityName as Exclude<AbilityName, 'none'>;
        const abilityLabelForTitle = ABILITY_LABELS.find(al => al.id === abilityKeyForTitle);
        const abilityNameString = abilityLabelForTitle?.label || abilityKeyForTitle;
        const titleString = UI_STRINGS.infoDialogTitleScoreCalculation || "{abilityName} Score Calculation";
        data = {
          title: titleString.replace("{abilityName}", abilityNameString),
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
          const calculatedMiscModifier = synergyBonus + racialBonus + sizeBonus;
          const totalSkillBonus = (skillInstance.ranks || 0) + keyAbilityMod + calculatedMiscModifier + (skillInstance.miscModifier || 0) + featBonus;
          const keyAbilityLabel = skillDef.keyAbility && skillDef.keyAbility !== 'none' ? ABILITY_LABELS.find(al => al.id === skillDef.keyAbility)?.abbr : undefined;

          const currentSkillId = contentType.skillId;
          const synergyItems: SynergyInfoItem[] = [];
          const badgeClass = "";

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
                                {(UI_STRINGS.synergyTextPart1ThisSkill || "This skill")}
                                {(UI_STRINGS.synergyTextPart1Provided || ", with ")}
                                <Badge variant="outline" className={badgeClass}>{sRule.ranksRequired}</Badge>
                                {(UI_STRINGS.synergyTextPart2Ranks || " ranks, ")}
                                {(UI_STRINGS.synergyTextPart3GrantsA || "grants a ")}
                                <Badge variant="outline" className={badgeClass}>{sRule.bonus > 0 ? '+' : ''}{sRule.bonus}</Badge>
                                {(UI_STRINGS.synergyTextPart4BonusToTargetSkillStart || " bonus to ")}
                                {targetSkillName}
                                {(UI_STRINGS.synergyTextPart4BonusToTargetSkillEnd || ".")}
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
                                      {(UI_STRINGS.synergyTextPart1ThisSkill || "This skill")}
                                      {(UI_STRINGS.synergyTextPart1Provided || ", with ")}
                                      <Badge variant="outline" className={badgeClass}>{customRule.ranksInThisSkillRequired}</Badge>
                                      {(UI_STRINGS.synergyTextPart2Ranks || " ranks, ")}
                                      {(UI_STRINGS.synergyTextPart3GrantsA || "grants a ")}
                                      <Badge variant="outline" className={badgeClass}>{customRule.bonusGranted > 0 ? '+' : ''}{customRule.bonusGranted}</Badge>
                                      {(UI_STRINGS.synergyTextPart4BonusToTargetSkillStart || " bonus to ")}
                                      {targetSkillNameNode}
                                      {(UI_STRINGS.synergyTextPart4BonusToTargetSkillEnd || ".")}
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
                                    {(UI_STRINGS.synergyTextPart1Received || ", with ")}
                                    <Badge variant="outline" className={badgeClass}>{sRule.ranksRequired}</Badge>
                                    {(UI_STRINGS.synergyTextPart2Ranks || " ranks, ")}
                                    {(UI_STRINGS.synergyTextPart3GrantsA || "grants a ")}
                                    <Badge variant="outline" className={badgeClass}>{sRule.bonus > 0 ? '+' : ''}{sRule.bonus}</Badge>
                                    {(UI_STRINGS.synergyTextPart4BonusToThisSkill || " bonus to this skill.")}
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
                                          {(UI_STRINGS.synergyTextPart1Received || ", with ")}
                                          <Badge variant="outline" className={badgeClass}>{customRule.ranksInThisSkillRequired}</Badge>
                                          {(UI_STRINGS.synergyTextPart2Ranks || " ranks, ")}
                                          {(UI_STRINGS.synergyTextPart3GrantsA || "grants a ")}
                                          <Badge variant="outline" className={badgeClass}>{customRule.bonusGranted > 0 ? '+' : ''}{customRule.bonusGranted}</Badge>
                                          {(UI_STRINGS.synergyTextPart4BonusToThisSkill || " bonus to this skill.")}
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
            title: (UI_STRINGS.infoDialogTitleModifierBreakdown || "Modifier Breakdown ({skillName})").replace("{skillName}", skillDef.name),
            content: SkillModifierBreakdownContentDisplay({
                htmlContent: skillDef.description,
                synergyInfoList: synergyItems.length > 0 ? synergyItems : undefined,
                skillModifierBreakdown: skillModifierBreakdownData,
                allSkillEffectDetails: aggregatedFeatEffectsProp.allSkillEffectDetails.filter(eff => eff.skillId === currentSkillId),
                uiStrings: UI_STRINGS,
            }),
          };
        } else {
            data = { title: UI_STRINGS.infoDialogSkillDefaultTitle || "Skill Details", content: [GenericHtmlContentDisplay({htmlContent: `<p>${UI_STRINGS.infoDialogSkillNotFound || "Skill details not found."}</p>`})]};
        }
        break;
      }
      case 'resistanceBreakdown': {
        iconKey = 'resistanceBreakdown';
        const resistanceValue = character[contentType.resistanceField] as ResistanceValue;
        const resistanceFieldLabelKey = `resistanceLabel${contentType.resistanceField.charAt(0).toUpperCase() + contentType.resistanceField.slice(1).replace('Resistance', '')}` as keyof typeof UI_STRINGS;
        const resistanceLabel = UI_STRINGS[resistanceFieldLabelKey] || contentType.resistanceField.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(' Resistance', '');
        const itemBonus = aggregatedFeatEffectsProp.resistanceBonuses.find(rb => rb.resistanceTo === contentType.resistanceField && rb.isActive)?.value || 0;

        data = {
          title: (UI_STRINGS.infoDialogTitleResistanceBreakdown || "Resistance Breakdown ({resistanceName})").replace("{resistanceName}", resistanceLabel),
          content: [ResistanceBreakdownContentDisplay({
            resistanceBreakdown: {
                name: resistanceLabel,
                base: resistanceValue.base || 0,
                customMod: resistanceValue.customMod || 0,
                itemBonus: itemBonus,
                total: (resistanceValue.base || 0) + (resistanceValue.customMod || 0) + itemBonus,
            },
            uiStrings: UI_STRINGS,
          })],
        };
        break;
      }
      case 'acBreakdown': {
        iconKey = 'acBreakdown';
        const dexMod = calculateAbilityModifier(finalAbilityScores.dexterity);
        const wisMod = calculateAbilityModifier(finalAbilityScores.wisdom);
        const sizeModACVal = getSizeModifierAC(character.size, SIZES);
        const sizeLabel = SIZES.find(s => s.id === character.size)?.label || character.size;

        const equippedArmorInstanceId = character.equippedGear?.['armor-body'];
        const equippedArmorInstance = equippedArmorInstanceId ? character.inventory.find(i => i.instanceId === equippedArmorInstanceId) : undefined;
        const allArmorDefs = [...ITEM_DEFINITIONS_ARMOR, ...ITEM_DEFINITIONS_MAGIC_ITEMS.filter(item => item.itemType === 'armor')];
        const equippedArmorDefinition = equippedArmorInstance ? allArmorDefs.find(def => def.definitionId === equippedArmorInstance.definitionId) : undefined;
        const physicalArmorBonus = equippedArmorDefinition?.armorBonus || 0;

        const equippedShieldInstanceId = character.equippedGear?.['shield'];
        const equippedShieldInstance = equippedShieldInstanceId ? character.inventory.find(i => i.instanceId === equippedShieldInstanceId) : undefined;
        const allShieldDefs = [...ITEM_DEFINITIONS_SHIELDS, ...ITEM_DEFINITIONS_MAGIC_ITEMS.filter(item => item.itemType === 'shield')];
        const equippedShieldDefinition = equippedShieldInstance ? allShieldDefs.find(def => def.definitionId === equippedShieldInstance.definitionId) : undefined;
        const physicalShieldBonus = equippedShieldDefinition?.shieldBonus || 0;


        const details: AcBreakdownDetailItem[] = [];
        details.push({ mainLabel: UI_STRINGS.acBreakdownBaseLabel || "Base", value: 10 });

        if (contentType.acType === 'Normal' || contentType.acType === 'Touch') {
            details.push({
                mainLabel: UI_STRINGS.infoDialogAcAbilityLabel || "Ability Modifier",
                value: dexMod,
                type: 'acAbilityMod',
                abilityAbbr: ABILITY_LABELS.find(al => al.id === 'dexterity')?.abbr
            });
        }
        details.push({
            mainLabel: UI_STRINGS.infoDialogSizeModifierLabel || "Size Modifier",
            value: sizeModACVal,
            type: 'acSizeMod',
            sizeName: sizeLabel
        });

        const mainAcTypes: Array<{ key: keyof Character; labelKey: keyof typeof UI_STRINGS; bonusType: "armor" | "shield" | "natural" | "deflection" | "dodge"; physicalItemBonus: number }> = [
            { key: 'armorBonus', labelKey: 'acBreakdownArmorBonusLabel', bonusType: "armor", physicalItemBonus: physicalArmorBonus},
            { key: 'shieldBonus', labelKey: 'acBreakdownShieldBonusLabel', bonusType: "shield", physicalItemBonus: physicalShieldBonus },
            { key: 'naturalArmor', labelKey: 'acBreakdownNaturalArmorLabel', bonusType: "natural", physicalItemBonus: 0 },
            { key: 'deflectionBonus', labelKey: 'acBreakdownDeflectionBonusLabel', bonusType: "deflection", physicalItemBonus: 0 },
            { key: 'dodgeBonus', labelKey: 'acBreakdownDodgeBonusLabel', bonusType: "dodge", physicalItemBonus: 0 },
        ];

        mainAcTypes.forEach(acItem => {
            let baseValue = (character[acItem.key] as number) || 0;
            let featSourcesForThisType: string[] = [];
            let totalFeatBonusForThisType = 0;

            if (aggregatedFeatEffectsProp?.acBonuses) {
                aggregatedFeatEffectsProp.acBonuses.forEach(featEffect => {
                    let appliesToThisSpecificAcBreakdownView = false;
                    if (!featEffect.appliesToScope || featEffect.appliesToScope.length === 0) { appliesToThisSpecificAcBreakdownView = true; }
                    else {
                        if (contentType.acType === 'Normal' && featEffect.appliesToScope.includes('normal')) appliesToThisSpecificAcBreakdownView = true;
                        if (contentType.acType === 'Touch' && featEffect.appliesToScope.includes('touch')) appliesToThisSpecificAcBreakdownView = true;
                        if (contentType.acType === 'Flat-Footed' && featEffect.appliesToScope.includes('flatFooted')) appliesToThisSpecificAcBreakdownView = true;
                    }

                    if (appliesToThisSpecificAcBreakdownView && featEffect.acType === acItem.bonusType && featEffect.isActive) {
                        let bonusFromThisFeat = 0;
                        if (typeof featEffect.value === 'number') {
                            bonusFromThisFeat = featEffect.value;
                        }
                        totalFeatBonusForThisType += bonusFromThisFeat;
                        if (featEffect.sourceFeat) {
                            featSourcesForThisType.push(getLocalizedString(featEffect.sourceFeat, language as LanguageCode));
                        }
                    }
                });
            }

            const totalComponentValue = baseValue + totalFeatBonusForThisType + acItem.physicalItemBonus;

            const shouldDisplayComponentLineFn = (acBreakdownType: 'Normal' | 'Touch' | 'Flat-Footed', componentBonusType: string) => {
                if (acBreakdownType === 'Normal') return true;
                if (acBreakdownType === 'Touch') return componentBonusType === 'deflection' || componentBonusType === 'dodge';
                if (acBreakdownType === 'Flat-Footed') return componentBonusType === 'armor' || componentBonusType === 'shield' || componentBonusType === 'natural' || componentBonusType === 'deflection';
                return false;
            };

            if (shouldDisplayComponentLineFn(contentType.acType, acItem.bonusType)) {
                 if (totalComponentValue !== 0 || (totalComponentValue === 0 && featSourcesForThisType.length > 0)) {
                    details.push({
                        mainLabel: UI_STRINGS[acItem.labelKey] || acItem.bonusType,
                        value: totalComponentValue,
                        suffixDetails: featSourcesForThisType.length > 0 ? featSourcesForThisType : undefined,
                    });
                }
            }
        });

        let sumOfOtherFeatBonuses = 0;
        const otherFeatBonusSources: Array<{name: string; value: number; condition?: string; isActive?: boolean}> = [];

        if (aggregatedFeatEffectsProp?.acBonuses) {
            aggregatedFeatEffectsProp.acBonuses.forEach(featEffect => {
                let appliesToThisSpecificAcBreakdownView = false;
                if (!featEffect.appliesToScope || featEffect.appliesToScope.length === 0) { appliesToThisSpecificAcBreakdownView = true; }
                else {
                    if (contentType.acType === 'Normal' && featEffect.appliesToScope.includes('normal')) appliesToThisSpecificAcBreakdownView = true;
                    if (contentType.acType === 'Touch' && featEffect.appliesToScope.includes('touch')) appliesToThisSpecificAcBreakdownView = true;
                    if (contentType.acType === 'Flat-Footed' && featEffect.appliesToScope.includes('flatFooted')) appliesToThisSpecificAcBreakdownView = true;
                }

                const mainBonusTypesHandled = ["armor", "shield", "natural", "deflection", "dodge"];
                if (appliesToThisSpecificAcBreakdownView && !mainBonusTypesHandled.includes(featEffect.acType)) {
                    let bonusVal = 0;
                    if (typeof featEffect.value === 'number') {
                        bonusVal = featEffect.value;
                    } else if (featEffect.value === "WIS" && detailedCharScoresForDialog && featEffect.acType === "monk_wisdom") {
                       const wisModForAc = calculateAbilityModifier(detailedCharScoresForDialog.wisdom.finalScore);
                       bonusVal = wisModForAc > 0 ? wisModForAc : 0;
                    } else if (featEffect.acType === "monkScaling" && typeof featEffect.value === 'number') {
                        bonusVal = featEffect.value;
                    }

                    let sourceName = featEffect.sourceFeat ? getLocalizedString(featEffect.sourceFeat, language as LanguageCode) : (UI_STRINGS.infoDialogUnknownFeatSource || "Unknown Feat");
                    if (featEffect.acType === "monk_wisdom") sourceName = UI_STRINGS.abilityScoreSourceMonkWisdom || "Monk Wisdom Bonus";
                    else if (featEffect.acType === "monkScaling") sourceName = UI_STRINGS.acBreakdownMonkScalingLabel || "Monk Scaling AC";

                    if (bonusVal !==0) {
                        otherFeatBonusSources.push({ name: sourceName, value: bonusVal, condition: featEffect.condition, isActive: featEffect.isActive });
                        if(featEffect.isActive) {
                            sumOfOtherFeatBonuses += bonusVal;
                        }
                    }
                }
            });
        }

        otherFeatBonusSources.forEach(s => {
            if (s.isActive && s.value !==0) {
                 details.push({
                    mainLabel: s.name,
                    value: s.value,
                    condition: s.condition,
                    isActive: s.isActive,
                    isSubItem: true,
                 });
            }
        });


        if (character.acMiscModifier && character.acMiscModifier !== 0) {
            details.push({ mainLabel: UI_STRINGS.armorClassMiscModifierLabel || "Temp Modifier", value: character.acMiscModifier });
        }

        let totalACValueForDialog = 10 + sizeModACVal;
        if (contentType.acType === 'Normal' || contentType.acType === 'Touch') {
            totalACValueForDialog += dexMod;
        }

        const componentIsApplicableToAcType = (acBreakdownType: 'Normal' | 'Touch' | 'Flat-Footed', componentBonusType: string) => {
            if (acBreakdownType === 'Normal') return true;
            if (acBreakdownType === 'Touch') return componentBonusType === 'deflection' || componentBonusType === 'dodge';
            if (acBreakdownType === 'Flat-Footed') return componentBonusType === 'armor' || componentBonusType === 'shield' || componentBonusType === 'natural' || componentBonusType === 'deflection';
            return false;
        };

        mainAcTypes.forEach(acItem => {
            if (componentIsApplicableToAcType(contentType.acType, acItem.bonusType)) {
                let baseVal = (character[acItem.key] as number) || 0;
                let featVal = 0;
                if (aggregatedFeatEffectsProp?.acBonuses) {
                     aggregatedFeatEffectsProp.acBonuses.forEach(featEffect => {
                         if (featEffect.acType === acItem.bonusType && featEffect.isActive) {
                            let effectAppliesToScope = false;
                            if (!featEffect.appliesToScope || featEffect.appliesToScope.length === 0) effectAppliesToScope = true;
                            else {
                                if (contentType.acType === 'Normal' && featEffect.appliesToScope.includes('normal')) effectAppliesToScope = true;
                                if (contentType.acType === 'Touch' && featEffect.appliesToScope.includes('touch')) effectAppliesToScope = true;
                                if (contentType.acType === 'Flat-Footed' && featEffect.appliesToScope.includes('flatFooted')) effectAppliesToScope = true;
                            }
                            if(effectAppliesToScope){
                                if(typeof featEffect.value === 'number') featVal += featEffect.value;
                            }
                         }
                     });
                }
                totalACValueForDialog += (baseVal + featVal + acItem.physicalItemBonus);
            }
        });

        totalACValueForDialog += sumOfOtherFeatBonuses;
        totalACValueForDialog += (character.acMiscModifier || 0);

        const titleTemplate = UI_STRINGS.infoDialogTitleAcBreakdown || "Armor Class Breakdown ({acType})";
        const acTypeLabelKey = `armorClass${contentType.acType}Label` as keyof typeof UI_STRINGS;
        const acTypeLabel = UI_STRINGS[acTypeLabelKey] || contentType.acType;

        data = { title: titleTemplate.replace("{acType}", acTypeLabel), content: [AcBreakdownContentDisplay({detailsList: details, totalACValue: totalACValueForDialog, detailsListHeading, uiStrings: UI_STRINGS})] };
        break;
      }
      case 'babBreakdown': {
        iconKey = 'babBreakdown';
        const baseBabArrayVal = getBab(character.classes, DND_CLASSES);
        data = {
          title: UI_STRINGS.infoDialogTitleBabBreakdown || "Base Attack Bonus Breakdown",
          content: [BabBreakdownContentDisplay({
            babBreakdown: {
              baseBabFromClasses: baseBabArrayVal,
              miscModifier: character.babMiscModifier || 0,
              totalBab: baseBabArrayVal.map(b => b + (character.babMiscModifier || 0)),
              characterClassLabel: DND_CLASSES.find(c => c.id === character.classes[0]?.className)?.label || character.classes[0]?.className,
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
        const featBonus = aggregatedFeatEffectsProp?.initiativeBonus || 0;
        data = {
          title: UI_STRINGS.infoDialogTitleInitiativeBreakdown || "Initiative Breakdown",
          content: [InitiativeBreakdownContentDisplay({
            initiativeBreakdown: {
              dexModifier: dexMod,
              miscModifier: character.initiativeMiscModifier || 0,
              totalInitiative: calculateInitiative(dexMod, character.initiativeMiscModifier || 0) + featBonus,
              featBonus: featBonus,
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
        const featGrappleBonus = aggregatedFeatEffectsProp?.attackRollBonuses?.filter(b => b.appliesTo === 'grapple' && b.isActive).reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0) || 0;
        data = {
          title: UI_STRINGS.infoDialogTitleGrappleModifierBreakdown || "Grapple Modifier Breakdown",
          content: [GrappleModifierBreakdownContentDisplay({
            grappleModifierBreakdown: {
                baseAttackBonus: baseBabArrayVal[0] || 0,
                strengthModifier: strMod,
                sizeModifierGrapple: sizeModGrappleVal,
                miscModifier: character.grappleMiscModifier || 0,
                totalGrappleModifier: calculateGrapple(character.classes, strMod, sizeModGrappleVal, DND_CLASSES) + (character.grappleMiscModifier || 0) + featGrappleBonus,
                featBonus: featGrappleBonus,
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
        const featGrappleDamageBonus = aggregatedFeatEffectsProp?.damageRollBonuses?.filter(b => b.appliesTo === 'grapple' && b.isActive && typeof b.value === 'number').reduce((sum, b) => sum + b.value, 0) || 0;

        data = {
          title: UI_STRINGS.infoDialogTitleGrappleDamageBreakdown || "Grapple Damage Breakdown",
          content: [GrappleDamageBreakdownContentDisplay({
            grappleDamageBreakdown: {
              baseDamage: character.grappleDamage_baseNotes || getUnarmedGrappleDamage(character.size, SIZES),
              bonus: character.grappleDamage_bonus || 0,
              strengthModifier: strMod,
              featBonus: featGrappleDamageBonus,
            },
            uiStrings: UI_STRINGS,
            abilityLabels: ABILITY_LABELS,
          })],
        };
        break;
      }
      case 'speedBreakdown': {
        iconKey = contentType.speedType;
        const speedBreakdownDetails = calculateSpeedBreakdown(contentType.speedType, character, aggregatedFeatEffectsProp, DND_RACES, DND_CLASSES, SIZES, UI_STRINGS);
        const speedNameString = speedBreakdownDetails.name;
        data = {
          title: (UI_STRINGS.infoDialogTitleSpeedBreakdown || "Speed Breakdown ({speedName})").replace("{speedName}", speedNameString),
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
            name: UI_STRINGS.totalArmorPenaltyLabel || "Total Armor Penalty",
            components: [
                { source: UI_STRINGS.speedPenaltyBaseArmorLabel || "Base Armor Penalty", value: -basePenalty },
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
            name: UI_STRINGS.totalLoadPenaltyLabel || "Total Load Penalty",
            components: [
                { source: UI_STRINGS.speedPenaltyBaseLoadLabel || "Base Load Penalty", value: -basePenalty },
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
        iconKey = currentSaveType;

        const saveTypeLabel = SAVING_THROW_LABELS.find(stl => stl.id === currentSaveType)?.label || currentSaveType;
        const dialogTitleTemplate = UI_STRINGS.infoDialogTitleSavingThrowBreakdown || "Saving Throw Breakdown ({saveTypeLabel})";
        const dialogTitle = dialogTitleTemplate.replace("{saveTypeLabel}", saveTypeLabel);


        const calculatedBaseSaves = getBaseSaves(character.classes, DND_CLASSES);
        const baseSave = calculatedBaseSaves[currentSaveType];
        const abilityKeyForSave = SAVING_THROW_ABILITIES[currentSaveType];

        const abilityMod = getAbilityModifierByName(finalAbilityScores, abilityKeyForSave);
        const magicMod = character.savingThrows?.[currentSaveType]?.magicMod || 0;
        const userTemporaryModifier = character.savingThrows?.[currentSaveType]?.miscMod || 0;

        const featComponentsForDialog: SavingThrowFeatComponent[] = [];
        let featBonusTotal = 0;

        if (aggregatedFeatEffectsProp?.savingThrowBonuses) {
          aggregatedFeatEffectsProp.savingThrowBonuses.forEach(effect => {
            if (effect.isActive && (effect.save === currentSaveType || effect.save === "all")) {
              let numericValueFromEffect = 0;
              if (typeof effect.value === 'number') {
                numericValueFromEffect = effect.value;
              } else if (effect.value === 'CHA' && detailedAbilityScoresProp) {
                numericValueFromEffect = calculateAbilityModifier(detailedAbilityScoresProp.charisma.finalScore);
              }
              featComponentsForDialog.push({
                sourceFeat: effect.sourceFeat ? getLocalizedString(effect.sourceFeat, language as LanguageCode) : (UI_STRINGS.infoDialogUnknownFeatSource || "Unknown Feat"),
                value: numericValueFromEffect,
                condition: effect.condition,
                isActive: effect.isActive,
              });
              if(effect.isActive) {
                featBonusTotal += numericValueFromEffect;
              }
            }
          });
        }

        const totalCalculatedSave = baseSave + abilityMod + magicMod + featBonusTotal + userTemporaryModifier;

        const breakdownDetails: SavingThrowBreakdownDetails = {
          saveType: currentSaveType,
          saveTypeLabel,
          baseSave,
          abilityKey: abilityKeyForSave,
          abilityMod,
          magicMod,
          userTemporaryModifier: userTemporaryModifier,
          featBonusTotal: featBonusTotal,
          featComponents: featComponentsForDialog,
          totalSave: totalCalculatedSave,
        };

        data = {
          title: dialogTitle,
          content: [SavingThrowBreakdownContentDisplay({ breakdown: breakdownDetails, uiStrings: UI_STRINGS, abilityLabels: ABILITY_LABELS })],
          iconKey: currentSaveType,
        };
        break;
      }
      case 'maxHpBreakdown': {
        iconKey = 'maxHpBreakdown';
        data = {
          title: UI_STRINGS.infoDialogTitleMaxHpBreakdown || "Max HP Breakdown",
          content: [
            <MaxHpBreakdownContentDisplay
              key="max-hp-breakdown"
              character={character}
              detailedAbilityScores={detailedAbilityScoresProp}
              aggregatedFeatEffects={aggregatedFeatEffectsProp}
              uiStrings={UI_STRINGS}
              abilityLabels={ABILITY_LABELS}
            />
          ],
        };
        break;
      }
      case 'meleeAttackBreakdown':
        iconKey = 'meleeAttackBreakdown';
        data = {
          title: UI_STRINGS.infoDialogTitleMeleeAttackBreakdown || "Melee Attack Breakdown",
          content: [<MeleeAttackBreakdownContentDisplay components={contentType.components} uiStrings={UI_STRINGS} />]
        };
        break;
      case 'meleeDamageBreakdown':
        iconKey = 'meleeDamageBreakdown';
        data = {
          title: UI_STRINGS.infoDialogTitleMeleeDamageBreakdown || "Melee Damage Breakdown",
          content: [<MeleeDamageBreakdownContentDisplay components={contentType.components} uiStrings={UI_STRINGS} />]
        };
        break;
      case 'rangedAttackBreakdown':
        iconKey = 'rangedAttackBreakdown';
        data = {
          title: UI_STRINGS.infoDialogTitleRangedAttackBreakdown || "Ranged Attack Breakdown",
          content: [<RangedAttackBreakdownContentDisplay components={contentType.components} uiStrings={UI_STRINGS} />]
        };
        break;
      case 'rangedDamageBreakdown':
        iconKey = 'rangedDamageBreakdown';
        data = {
          title: UI_STRINGS.infoDialogTitleRangedDamageBreakdown || "Ranged Damage Breakdown",
          content: [<RangedDamageBreakdownContentDisplay components={contentType.components} uiStrings={UI_STRINGS} />]
        };
        break;
      case 'genericHtml':
        iconKey = 'genericHtml';
        data = { title: contentType.title, content: [GenericHtmlContentDisplay({htmlContent: contentType.content})] };
        break;
       case 'genericNumericalBreakdown':
        iconKey = 'default'; // Or derive from titleKey if possible
        const titleForGeneric = UI_STRINGS[contentType.titleKey] || "Breakdown";
        // This case might need its own specific display component if styling for values is complex
        const contentForGeneric = [<div key="generic-num-content">{contentType.components.map((comp, idx) => (
            <div key={`${idx}-${comp.label}`} className="flex justify-between text-sm">
                <span>{comp.label}</span>
                <span>{comp.value}</span>
            </div>
        ))}</div>];
        data = { title: titleForGeneric, content: contentForGeneric };
        break;
      case 'classSpecificChoiceOptions': // Added case
        iconKey = 'classSpecificChoiceOptions';
        data = {
          title: contentType.title,
          content: [<ClassSpecificChoiceOptionsDisplay title={contentType.title} options={contentType.options} uiStrings={UI_STRINGS} />]
        };
        break;
    }
    data.iconKey = iconKey;
    return data;
  }, [isOpen, contentType, character, translationsLoading, translations, customFeatDefinitions, customSkillDefinitions, allCombinedFeatDefinitions, allCombinedSkillDefinitionsForDisplay, expandedItems, toggleExpanded, aggregatedFeatEffectsProp, detailedAbilityScoresProp, language]);


  if (translationsLoading || !translations || !isOpen || !derivedData) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center font-serif text-left">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
              {translations?.UI_STRINGS.infoDialogLoadingTitle || "Loading..."}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <p className="text-muted-foreground">{translations?.UI_STRINGS.infoDialogLoadingDescription || "Please wait while details are being loaded."}</p>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} type="button">{(translations?.UI_STRINGS.infoDialogCloseButton || "Close")}</Button>
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

