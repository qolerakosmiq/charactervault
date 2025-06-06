
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
import { Info, Wind, Waves, MoveVertical, Shell, Feather, Loader2, SparklesIcon, Square, CheckSquare } from 'lucide-react';
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
    <div className="px-3 py-1 rounded-md bg-muted/20 border border-border/30">
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

  const prereqMessages = checkFeatPrerequisites(featDef, character, allFeats, allPredefinedSkills, allCustomSkills, allClasses, allRaces, abilityLabels, alignmentPrereqOptions, uiStrings);

  return (
    <>
      {featDef.description && <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: featDef.description }} />}
      {prereqMessages.length > 0 && (
        <div className="mt-3">
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
        <div className="mt-3">
          <p className="text-sm font-medium text-muted-foreground">{uiStrings.featEffectsLabel || "Effects:"}</p>
          <p className="text-sm">{featDef.effectsText}</p>
        </div>
      )}
    </>
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


  const renderModifierValue = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return <span className="font-bold">{value}</span>;
    if (numValue === 0) return <span className="font-bold text-muted-foreground">+0</span>;
    if (numValue > 0) return <span className="font-bold text-emerald-500">+{numValue}</span>;
    return <span className="font-bold text-destructive">{numValue}</span>;
  };


  const derivedData = React.useMemo((): DerivedDialogData | null => {
    if (!isOpen || !contentType || !character || translationsLoading || !translations) {
      return null;
    }

    const {
      DND_RACES, DND_CLASSES, DND_DEITIES, ALIGNMENTS, SKILL_DEFINITIONS, SIZES,
      DND_FEATS_DEFINITIONS: PREDEFINED_FEATS, ABILITY_LABELS, SAVING_THROW_LABELS,
      DND_RACE_ABILITY_MODIFIERS_DATA, DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA,
      SKILL_SYNERGIES: SKILL_SYNERGIES_DATA, CLASS_SKILLS: CLASS_SKILLS_DATA,
      ALIGNMENT_PREREQUISITE_OPTIONS, DND_RACE_BASE_MAX_AGE_DATA, RACE_TO_AGING_CATEGORY_MAP_DATA, DND_RACE_AGING_EFFECTS_DATA, UI_STRINGS
    } = translations;

    let data: DerivedDialogData = { title: UI_STRINGS.infoDialogDefaultTitle || 'Information' };
    const speedUnit = UI_STRINGS.speedUnit || "ft.";

    switch (contentType.type) {
      case 'race': {
        const raceId = character.race;
        const raceData = DND_RACES.find(r => r.value === raceId);
        const qualities = getRaceSpecialQualities(raceId, DND_RACES, DND_RACE_ABILITY_MODIFIERS_DATA, SKILL_DEFINITIONS, PREDEFINED_FEATS, ABILITY_LABELS);
        const racialSkillPointBonus = getRaceSkillPointsBonusPerLevel(raceId, DND_RACE_SKILL_POINTS_BONUS_PER_LEVEL_DATA);
        const details: Array<{ label: string; value: string | number | React.ReactNode; isBold?: boolean }> = [];
        
        if (racialSkillPointBonus > 0) {
          details.push({ label: UI_STRINGS.infoDialogRacialSkillPointBonusLabel || "Bonus Skill Points/Level", value: renderModifierValue(racialSkillPointBonus) });
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
            data = { title: deityData.label, htmlContent: deityData.description || `<p>${(UI_STRINGS.infoDialogNoSkillDescription || 'No detailed description available for').replace('{itemName}', deityData.label)}</p>` };
        } else if (deityId && deityId.trim() !== '') {
            data = { title: deityId, htmlContent: `<p>${UI_STRINGS.infoDialogDeityPlaceholder || 'Custom deity. No predefined information available.'}</p>` };
        } else {
            data = { title: UI_STRINGS.infoDialogDeityDefaultTitle || "Deity Information", htmlContent: `<p>${UI_STRINGS.infoDialogDeityPlaceholder || "Select or type a deity to see more information."}</p>`};
        }
        break;
      case 'abilityScoreBreakdown': {
        const detailedScores = calculateDetailedAbilityScores(character, customFeatDefinitions, DND_RACES, DND_RACE_ABILITY_MODIFIERS_DATA, DND_RACE_BASE_MAX_AGE_DATA, RACE_TO_AGING_CATEGORY_MAP_DATA, DND_RACE_AGING_EFFECTS_DATA, PREDEFINED_FEATS, ABILITY_LABELS);
        const abilityKeyForTitle = contentType.abilityName as Exclude<AbilityName, 'none'>;
        const abilityLabelForTitle = ABILITY_LABELS.find(al => al.value === abilityKeyForTitle);
        const abilityNameString = abilityLabelForTitle?.label || abilityKeyForTitle;
        data = {
          title: (UI_STRINGS.infoDialogTitleScoreCalculation || "{abilityName} Score Calculation").replace("{abilityName}", abilityNameString),
          abilityScoreBreakdown: detailedScores[contentType.abilityName],
        };
        break;
      }
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

          const currentSkillId = contentType.skillId;
          const synergyItems: SynergyInfoItem[] = [];
          const badgeClass = "text-xs font-normal h-5 mx-0.5 px-1.5 py-0.5 align-baseline";

          allCombinedSkillDefinitionsForDisplay.forEach(providingSkillDef => {
              const providingSkillName = <strong>{providingSkillDef.name}</strong>;
              const providingSkillInstance = character.skills.find(s => s.id === providingSkillDef.id);
              const providingSkillRanks = providingSkillInstance?.ranks || 0;

              if (providingSkillDef.id === currentSkillId) { // Synergies *provided by* this skill
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
              } else { // Synergies *received by* this skill from other skills
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

          data = {
            title: (UI_STRINGS.infoDialogTitleModifierBreakdown || "{skillName} Modifier Breakdown").replace("{skillName}", skillDef.name),
            htmlContent: skillDef.description,
            synergyInfoList: synergyItems.length > 0 ? synergyItems : undefined,
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
        const resistanceFieldLabelKey = `resistanceLabel${contentType.resistanceField.charAt(0).toUpperCase() + contentType.resistanceField.slice(1).replace('Resistance', '')}` as keyof typeof UI_STRINGS;
        const resistanceLabel = UI_STRINGS[resistanceFieldLabelKey] || contentType.resistanceField.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(' Resistance', '');

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
        const details: Array<{ label: string; value: string | number | React.ReactNode; isBold?: boolean }> = [];
        let totalCalculated = 10; 
        
        details.push({ label: UI_STRINGS.acBreakdownBaseLabel || 'Base', value: 10 });

        if (contentType.acType === 'Normal' || contentType.acType === 'Touch') {
          details.push({ label: (UI_STRINGS.infoDialogInitiativeAbilityModLabel || "{abilityAbbr} ({abilityFull}) Modifier:").replace("{abilityAbbr}", ABILITY_LABELS.find(al => al.value === 'dexterity')?.abbr || 'DEX').replace("{abilityFull}", ABILITY_LABELS.find(al => al.value === 'dexterity')?.label || 'Dexterity'), value: dexMod });
        }
        details.push({ label: `${(UI_STRINGS.infoDialogSizeModifierLabel || "Size Modifier")} (${sizeLabel})`, value: sizeModACVal });

        if (contentType.acType === 'Normal' || contentType.acType === 'Flat-Footed') {
          if (character.armorBonus) details.push({ label: UI_STRINGS.acBreakdownArmorBonusLabel || 'Armor Bonus', value: character.armorBonus });
          if (character.shieldBonus) details.push({ label: UI_STRINGS.acBreakdownShieldBonusLabel || 'Shield Bonus', value: character.shieldBonus });
          if (character.naturalArmor) details.push({ label: UI_STRINGS.acBreakdownNaturalArmorLabel || 'Natural Armor', value: character.naturalArmor });
        }
        if (character.deflectionBonus) details.push({ label: UI_STRINGS.acBreakdownDeflectionBonusLabel || 'Deflection Bonus', value: character.deflectionBonus });
        if ((contentType.acType === 'Normal' || contentType.acType === 'Touch') && character.dodgeBonus) {
          details.push({ label: UI_STRINGS.acBreakdownDodgeBonusLabel || 'Dodge Bonus', value: character.dodgeBonus });
        }
        
        if (character.acMiscModifier) details.push({ label: UI_STRINGS.infoDialogCustomModifierLabel || 'Custom Modifier', value: character.acMiscModifier });

        if (contentType.acType === 'Normal') totalCalculated = 10 + (character.armorBonus || 0) + (character.shieldBonus || 0) + dexMod + sizeModACVal + (character.naturalArmor || 0) + (character.deflectionBonus || 0) + (character.dodgeBonus || 0) + (character.acMiscModifier || 0);
        else if (contentType.acType === 'Touch') totalCalculated = 10 + dexMod + sizeModACVal + (character.deflectionBonus || 0) + (character.dodgeBonus || 0) + (character.acMiscModifier || 0);
        else if (contentType.acType === 'Flat-Footed') totalCalculated = 10 + (character.armorBonus || 0) + (character.shieldBonus || 0) + sizeModACVal + (character.naturalArmor || 0) + (character.deflectionBonus || 0) + (character.acMiscModifier || 0);
        
        data = { title: (UI_STRINGS.infoDialogTitleAcBreakdown || "{acType} AC Breakdown").replace("{acType}", contentType.acType), detailsList: details, totalACValue: totalCalculated };
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
        const speedBreakdownDetails = calculateSpeedBreakdown(contentType.speedType, character, DND_RACES, DND_CLASSES, SIZES, UI_STRINGS);
        const speedNameString = speedBreakdownDetails.name;
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
  const speedUnit = UI_STRINGS.speedUnit || "ft.";

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
    synergyInfoList,
    totalACValue,
  } = derivedData;
  
  const sectionHeadingClass = "text-md font-semibold mb-2 text-primary";

  let detailsListHeading = UI_STRINGS.infoDialogSectionHeadingDetails || "Details"; 
  if (contentType?.type === 'race') {
    detailsListHeading = UI_STRINGS.infoDialogRaceSpecificsListHeading || "Racial Specifics";
  } else if (contentType?.type === 'class') {
    detailsListHeading = UI_STRINGS.infoDialogClassSpecificsListHeading || "Class Specifics";
  } else if (abilityScoreBreakdown || skillModifierBreakdown || resistanceBreakdown || babBreakdown || initiativeBreakdown || grappleModifierBreakdown || grappleDamageBreakdown || speedBreakdown || (detailsList && (contentType?.type === 'acBreakdown'))) {
    detailsListHeading = UI_STRINGS.infoDialogSectionHeadingCalculation || "Calculation";
  }
  
  const hasAnyBonusSection = abilityModifiers?.length || skillBonuses?.length || grantedFeats?.length || bonusFeatSlots !== undefined || speeds;
  
  let hasRenderedContentBlock = false;
  const renderSeparatorIfNeeded = () => {
    if (hasRenderedContentBlock && ( contentType?.type === 'skillModifierBreakdown' || contentType?.type === 'abilityScoreBreakdown' || contentType?.type === 'resistanceBreakdown' ||contentType?.type === 'babBreakdown' || contentType?.type === 'initiativeBreakdown' || contentType?.type === 'grappleModifierBreakdown' || contentType?.type === 'grappleDamageBreakdown' || contentType?.type === 'speedBreakdown' || (contentType?.type === 'acBreakdown' && totalACValue !== undefined) || contentType?.type === 'race' || contentType?.type === 'class')) {
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
            { contentType?.type === 'skillModifierBreakdown' && <SparklesIcon className="mr-2 h-6 w-6 text-primary" /> }
            { contentType?.type !== 'speedBreakdown' && contentType?.type !== 'skillModifierBreakdown' && <Info className="mr-2 h-6 w-6 text-primary" /> }
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
            
            {contentType?.type === 'skillModifierBreakdown' && synergyInfoList && synergyInfoList.length > 0 && (
              <>
                {renderSeparatorIfNeeded()}
                <h3 className={sectionHeadingClass}>{UI_STRINGS.infoDialogSynergiesSectionTitle || "Synergies"}</h3>
                <ul className="space-y-0.5">
                  {synergyInfoList.map((synergyItem) => {
                    const IconComponent = synergyItem.isActive ? CheckSquare : Square;
                    return (
                      <li key={synergyItem.id} className="flex items-start text-sm">
                        <IconComponent className={cn("h-4 w-4 mr-2 shrink-0 mt-1", synergyItem.isActive ? "text-emerald-500" : "text-muted-foreground")} />
                        <span className={cn(synergyItem.isActive ? "text-emerald-500" : "text-muted-foreground")}>
                          {synergyItem.text}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {markContentRendered()}
              </>
            )}

            {hasAnyBonusSection && (contentType?.type === 'race' || contentType?.type === 'class') && (
                 <>
                    {renderSeparatorIfNeeded()}
                    <h3 className={sectionHeadingClass}>{UI_STRINGS.infoDialogGeneralTraitsHeading || "General Traits"}</h3>
                    {markContentRendered()}
                 </>
            )}

            {abilityModifiers && abilityModifiers.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-1">{UI_STRINGS.infoDialogAbilityScoreAdjustments}</h4>
                <div className="space-y-0.5 text-sm mb-2">
                  {abilityModifiers.map(mod => (
                    <div key={mod.ability} className="flex justify-between">
                      <span className="text-foreground">{translations.ABILITY_LABELS.find(al => al.value === mod.ability)?.label || mod.ability}</span>
                      {renderModifierValue(mod.change)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {skillBonuses && skillBonuses.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-1">{UI_STRINGS.infoDialogRacialSkillBonuses}</h4>
                <div className="space-y-0.5 text-sm mb-2">
                  {skillBonuses.map(bonus => (
                    <div key={bonus.skillId} className="flex justify-between">
                      <span className="text-foreground">{bonus.skillName}</span>
                      {renderModifierValue(bonus.bonus)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {speeds && Object.keys(speeds).filter(k => (speeds as any)[k] !== undefined && (speeds as any)[k] > 0).length > 0 && (
               <div className="mt-2">
                <p className="text-sm text-muted-foreground font-medium mb-1">{UI_STRINGS.infoDialogBaseSpeeds}</p>
                 <div className="ml-4 space-y-0.5 text-sm mb-2">
                  {Object.entries(speeds).filter(([, speedVal]) => speedVal !== undefined && speedVal > 0)
                    .map(([type, speedVal]) => {
                    const speedTypeKey = `speedLabel${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof UI_STRINGS;
                    const speedName = UI_STRINGS[speedTypeKey] || type;
                    return (
                      <div key={type} className="flex justify-between">
                        <span className="text-foreground">{speedName}</span>
                        <span className="font-semibold text-foreground">{speedVal} {speedUnit}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {bonusFeatSlots !== undefined && bonusFeatSlots > 0 && (
               <div className="flex justify-between text-sm mt-2">
                <span className="text-sm text-foreground font-medium">{UI_STRINGS.infoDialogBonusFeatSlots}</span>
                {renderModifierValue(bonusFeatSlots)}
              </div>
            )}
            {grantedFeats && grantedFeats.length > 0 && (
               <div className="mt-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-1">{UI_STRINGS.infoDialogGrantedFeaturesAndFeats}</h4>
                <ul className="list-none space-y-0.5 text-sm">
                  {grantedFeats.map(feat => {
                    const uniqueKey = feat.featId + (feat.note || '') + (feat.levelAcquired || '');
                    return (
                       <li key={uniqueKey} className="group">
                          <div
                            className="flex items-baseline gap-2 p-1 -mx-1 rounded transition-colors cursor-pointer"
                            onClick={() => toggleExpanded(uniqueKey)}
                            role="button"
                            aria-expanded={expandedItems.has(uniqueKey)}
                            aria-controls={`feat-details-${uniqueKey}`}
                          >
                            {feat.levelAcquired !== undefined && (
                              <Badge
                                variant="outline"
                                className="text-xs font-normal h-5 whitespace-nowrap"
                              >
                                {(UI_STRINGS.levelLabel || "Level")} {feat.levelAcquired}
                              </Badge>
                            )}
                             <div className="flex-grow">
                                <strong className="text-foreground leading-tight transition-colors">{feat.name}</strong>
                                {feat.note && (
                                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                                    {feat.note}
                                  </p>
                                )}
                             </div>
                          </div>
                          {expandedItems.has(uniqueKey) && (
                           <div id={`feat-details-${uniqueKey}`} className="my-1 mb-1">
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
                           </div>
                          )}
                        </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {babBreakdown && (
              <>
              {renderSeparatorIfNeeded()}
              <div>
                  <h3 className={sectionHeadingClass}>{UI_STRINGS.infoDialogSectionHeadingCalculation}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{(UI_STRINGS.infoDialogBabClassLabel || "{classLabel} Base Attack Bonus:").replace("{classLabel}", babBreakdown.characterClassLabel || 'Class')}</span>
                      <span className="font-bold">{babBreakdown.baseBabFromClasses.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/')}</span>
                    </div>
                    {babBreakdown.miscModifier !== 0 && (
                      <div className="flex justify-between">
                          <span>{UI_STRINGS.infoDialogCustomModifierLabel}</span>
                          {renderModifierValue(babBreakdown.miscModifier)}
                      </div>
                    )}
                    <Separator className="mt-2 mb-2" />
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
                  <h3 className={sectionHeadingClass}>{UI_STRINGS.infoDialogSectionHeadingCalculation}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>
                         {(UI_STRINGS.infoDialogInitiativeAbilityModLabel).replace("{abilityAbbr}", translations.ABILITY_LABELS.find(al => al.value === 'dexterity')?.abbr || 'DEX').replace("{abilityFull}", translations.ABILITY_LABELS.find(al => al.value === 'dexterity')?.label || 'Dexterity')}
                      </span>
                      {renderModifierValue(initiativeBreakdown.dexModifier)}
                    </div>
                    {initiativeBreakdown.miscModifier !== 0 && (
                      <div className="flex justify-between">
                          <span>{UI_STRINGS.infoDialogCustomModifierLabel}</span>
                          {renderModifierValue(initiativeBreakdown.miscModifier)}
                      </div>
                    )}
                    <Separator className="mt-2 mb-2" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">{UI_STRINGS.infoDialogInitiativeTotalLabel}</span>
                      <span className="font-bold text-accent">{renderModifierValue(initiativeBreakdown.totalInitiative)}</span>
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
                  <h3 className={sectionHeadingClass}>{UI_STRINGS.infoDialogSectionHeadingCalculation}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{UI_STRINGS.infoDialogGrappleModBabLabel}</span>
                      {renderModifierValue(grappleModifierBreakdown.baseAttackBonus)}
                    </div>
                    <div className="flex justify-between">
                      <span>
                         {(UI_STRINGS.infoDialogGrappleModAbilityLabel).replace("{abilityAbbr}", translations.ABILITY_LABELS.find(al => al.value === 'strength')?.abbr || 'STR').replace("{abilityFull}", translations.ABILITY_LABELS.find(al => al.value === 'strength')?.label || 'Strength')}
                      </span>
                      {renderModifierValue(grappleModifierBreakdown.strengthModifier)}
                    </div>
                    <div className="flex justify-between">
                      <span>{UI_STRINGS.infoDialogGrappleModSizeLabel}</span>
                      {renderModifierValue(grappleModifierBreakdown.sizeModifierGrapple)}
                    </div>
                    {grappleModifierBreakdown.miscModifier !== 0 && (
                      <div className="flex justify-between">
                          <span>{UI_STRINGS.infoDialogCustomModifierLabel}</span>
                          {renderModifierValue(grappleModifierBreakdown.miscModifier)}
                      </div>
                    )}
                    <Separator className="mt-2 mb-2" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">{UI_STRINGS.infoDialogGrappleModTotalLabel}</span>
                      <span className="font-bold text-accent">{renderModifierValue(grappleModifierBreakdown.totalGrappleModifier)}</span>
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
                  <h3 className={sectionHeadingClass}>{UI_STRINGS.infoDialogSectionHeadingCalculation}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{UI_STRINGS.infoDialogGrappleDmgBaseLabel}</span>
                      <span className="font-bold">
                        {grappleDamageBreakdown.baseDamage.split(' ')[0] || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{UI_STRINGS.infoDialogGrappleDmgWeaponLabel}</span>
                      {grappleDamageBreakdown.baseDamage.toLowerCase().includes('unarmed') ? (
                          <span className="font-semibold text-muted-foreground">{UI_STRINGS.infoDialogGrappleDmgUnarmedLabel || "Unarmed"}</span>
                      ) : (
                          renderModifierValue(0) 
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span>
                        {(UI_STRINGS.infoDialogGrappleDmgAbilityLabel).replace("{abilityAbbr}", translations.ABILITY_LABELS.find(al => al.value === 'strength')?.abbr || 'STR').replace("{abilityFull}", translations.ABILITY_LABELS.find(al => al.value === 'strength')?.label || 'Strength')}
                      </span>
                      {renderModifierValue(grappleDamageBreakdown.strengthModifier)}
                    </div>
                    {grappleDamageBreakdown.bonus !== 0 && (
                      <div className="flex justify-between">
                          <span>{UI_STRINGS.infoDialogCustomModifierLabel}</span>
                          {renderModifierValue(grappleDamageBreakdown.bonus)}
                      </div>
                    )}
                    <Separator className="mt-2 mb-2" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">{UI_STRINGS.infoDialogGrappleDmgTotalLabel}</span>
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
                  <h3 className={sectionHeadingClass}>{UI_STRINGS.infoDialogSectionHeadingCalculation}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{UI_STRINGS.infoDialogBaseScoreLabel}</span>
                      <span className="font-bold">{abilityScoreBreakdown.base}</span>
                    </div>
                    {abilityScoreBreakdown.components.map((comp, index) => {
                       let displaySource = comp.source;
                       if (comp.source === "tempMod" && UI_STRINGS.abilityScoreSourceTempMod) { displaySource = UI_STRINGS.abilityScoreSourceTempMod; }
                       else if (comp.source === "feats" && UI_STRINGS.abilityScoreSourceFeats) { displaySource = UI_STRINGS.abilityScoreSourceFeats; }
                       else if (comp.source.startsWith("Race (") && UI_STRINGS.abilityScoreSourceRace) { displaySource = (UI_STRINGS.abilityScoreSourceRace).replace("{raceLabel}", comp.source.match(/Race \((.*?)\)/)?.[1] || ''); }
                       else if (comp.source.startsWith("Aging (") && UI_STRINGS.abilityScoreSourceAging) { displaySource = (UI_STRINGS.abilityScoreSourceAging).replace("{categoryName}", comp.source.match(/Aging \((.*?)\)/)?.[1] || '');}


                      return comp.value !== 0 && (
                        <div key={index} className="flex justify-between">
                          <span>{displaySource}</span>
                          {renderModifierValue(comp.value)}
                        </div>
                      );
                    })}
                    <Separator className="mt-2 mb-2" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">{UI_STRINGS.infoDialogFinalScoreLabel}</span>
                      <span className="font-bold text-accent">{abilityScoreBreakdown.finalScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">{UI_STRINGS.infoDialogFinalModifierLabel}</span>
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
                  <h3 className={sectionHeadingClass}>{UI_STRINGS.infoDialogSectionHeadingCalculation}</h3>
                  <div className="space-y-1 text-sm">
                    {skillModifierBreakdown.keyAbilityName && (
                        <div className="flex justify-between">
                          <span>
                            {UI_STRINGS.infoDialogKeyAbilityLabel}
                            {" "}
                            <span className="text-muted-foreground">({skillModifierBreakdown.keyAbilityName})</span>
                          </span>
                          {renderModifierValue(skillModifierBreakdown.keyAbilityModifier)}
                        </div>
                    )}
                    <div className="flex justify-between">
                      <span>{UI_STRINGS.infoDialogRanksLabel}</span>
                      {renderModifierValue(skillModifierBreakdown.ranks)}
                    </div>
                    {skillModifierBreakdown.sizeSpecificBonus !== 0 && (
                      <div className="flex justify-between">
                        <span>{UI_STRINGS.infoDialogSizeModifierLabel}</span>
                        {renderModifierValue(skillModifierBreakdown.sizeSpecificBonus)}
                      </div>
                    )}
                    {skillModifierBreakdown.synergyBonus !== 0 && (
                      <div className="flex justify-between">
                        <span>{UI_STRINGS.infoDialogSynergyBonusLabel}</span>
                        {renderModifierValue(skillModifierBreakdown.synergyBonus)}
                      </div>
                    )}
                    {skillModifierBreakdown.featBonus !== 0 && (
                      <div className="flex justify-between">
                        <span>{UI_STRINGS.infoDialogFeatBonusLabel}</span>
                        {renderModifierValue(skillModifierBreakdown.featBonus)}
                      </div>
                    )}
                    {skillModifierBreakdown.racialBonus !== 0 && (
                      <div className="flex justify-between">
                        <span>{UI_STRINGS.infoDialogRacialBonusLabel}</span>
                        {renderModifierValue(skillModifierBreakdown.racialBonus)}
                      </div>
                    )}
                    {skillModifierBreakdown.miscModifier !== 0 && (
                      <div className="flex justify-between">
                        <span>{UI_STRINGS.infoDialogMiscModifierLabel}</span>
                        {renderModifierValue(skillModifierBreakdown.miscModifier)}
                      </div>
                    )}
                    <Separator className="mt-2 mb-2" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">{UI_STRINGS.infoDialogTotalBonusLabel}</span>
                      <span className="font-bold text-accent">{renderModifierValue(skillModifierBreakdown.totalBonus)}</span>
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
                  <h3 className={sectionHeadingClass}>{UI_STRINGS.infoDialogSectionHeadingCalculation}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{UI_STRINGS.infoDialogBaseValueLabel}</span>
                      <span className="font-bold">{resistanceBreakdown.base}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{UI_STRINGS.infoDialogCustomModifierLabel}</span>
                      {renderModifierValue(resistanceBreakdown.customMod)}
                    </div>
                    <Separator className="mt-2 mb-2" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">{UI_STRINGS.infoDialogTotalResistanceLabel}</span>
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
                  <h3 className={sectionHeadingClass}>{UI_STRINGS.infoDialogSectionHeadingCalculation}</h3>
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
                          <span>{label}</span>
                          {renderModifierValue(comp.value)}
                        </div>
                      );
                    })}
                    <Separator className="mt-2 mb-2" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">{(UI_STRINGS.infoDialogSpeedTotalPrefixLabel || "Total")} {speedBreakdown.name}</span>
                      <span className="font-bold text-accent">{speedBreakdown.total} {speedUnit}</span>
                    </div>
                  </div>
                </div>
                {markContentRendered()}
              </>
            )}


            {!abilityScoreBreakdown && !skillModifierBreakdown && !resistanceBreakdown && !babBreakdown && !initiativeBreakdown && !grappleModifierBreakdown && !grappleDamageBreakdown && !speedBreakdown && detailsList && detailsList.length > 0 && (
              <>
                {renderSeparatorIfNeeded()}
                <div>
                  <h3 className={sectionHeadingClass}>
                    {detailsListHeading}
                  </h3>
                  {detailsList!.map((detail, index) => {
                      const valueToRender = (typeof detail.value === 'number' || (typeof detail.value === 'string' && !isNaN(parseFloat(detail.value as string)))) && !detail.label.toLowerCase().includes('base attack bonus') 
                          ? renderModifierValue(detail.value as number | string)
                          : detail.value;
                      
                      let labelContent: React.ReactNode = <span className="text-foreground">{detail.label}</span>;
                      if (typeof detail.label === 'string') {
                        const abilityMatch = (detail.label as string).match(/{abilityAbbr}\s\({abilityFull}\)\sModifier:/);
                        if (abilityMatch) {
                            const abilityKey = (detail.label as string).toLowerCase().includes("dexterity") ? 'dexterity' : 'strength'; 
                            const abilityLabelInfo = translations.ABILITY_LABELS.find(al => al.value === abilityKey);
                            const abbr = abilityLabelInfo?.abbr || abilityKey.substring(0,3).toUpperCase();
                            const full = abilityLabelInfo?.label || abilityKey.charAt(0).toUpperCase() + abilityKey.slice(1);
                            labelContent = (
                                <span className="text-foreground">
                                    {(UI_STRINGS.infoDialogInitiativeAbilityModLabel).replace("{abilityAbbr}", abbr).replace("{abilityFull}", full)}
                                </span>
                            );
                        }
                      }

                      return (
                          <div key={index} className="flex justify-between text-sm mb-0.5">
                          {labelContent}
                          <span className={cn(detail.isBold && "font-bold", "text-foreground")}>{valueToRender as React.ReactNode}</span>
                          </div>
                      );
                  })}
                  
                  {contentType?.type === 'acBreakdown' && totalACValue !== undefined && ( 
                        <>
                          <Separator className="mt-2 mb-2" />
                          <div className="flex justify-between text-base">
                            <span className="font-semibold">{UI_STRINGS.infoDialogTotalLabel || 'Total'}</span>
                            <span className="font-bold text-accent">{renderModifierValue(totalACValue)}</span>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">{UI_STRINGS.infoDialogCloseButton}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SynergyInfoItem {
  id: string;
  text: React.ReactNode;
  isActive: boolean;
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
  synergyInfoList?: SynergyInfoItem[];
  resistanceBreakdown?: ResistanceBreakdownDetails;
  detailsList?: Array<{ label: string; value: string | number | React.ReactNode; isBold?: boolean }>;
  totalACValue?: number; 
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

    
