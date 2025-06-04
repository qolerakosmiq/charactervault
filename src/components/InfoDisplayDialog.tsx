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
import { Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type {
  Character, AbilityName, AbilityScoreBreakdown, RaceSpecialQualities,
  InfoDialogContentType, ResistanceFieldKeySheet, DndRaceOption, DndClassOption, CharacterAlignmentObject, DndDeityOption,
  FeatDefinitionJsonData, SkillDefinitionForDisplay, SkillDefinitionJsonData,
  BabBreakdownDetails as BabBreakdownDetailsType,
  InitiativeBreakdownDetails as InitiativeBreakdownDetailsType,
  GrappleModifierBreakdownDetails as GrappleModifierBreakdownDetailsType,
  GrappleDamageBreakdownDetails as GrappleDamageBreakdownDetailsType,
  ResistanceValue,
  PrerequisiteMessage
} from '@/types/character';
import { DND_RACES, DND_CLASSES, DND_DEITIES, ALIGNMENTS, SKILL_DEFINITIONS, SIZES, DND_FEATS_DEFINITIONS, getRaceSpecialQualities, getRaceSkillPointsBonusPerLevel, calculateDetailedAbilityScores, calculateTotalSynergyBonus, calculateFeatBonusesForSkill, calculateRacialSkillBonus, SKILL_SYNERGIES, CLASS_SKILLS, calculateSizeSpecificSkillBonus, checkFeatPrerequisites } from '@/types/character';
import { useDefinitionsStore, type CustomSkillDefinition } from '@/lib/definitions-store';
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


interface InfoDisplayDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  character: Character;
  contentType: InfoDialogContentType | null;
}

const ABILITY_DISPLAY_NAMES: Record<Exclude<AbilityName, 'none'>, { abbr: string; full: string }> = {
  strength: { abbr: 'STR', full: 'Strength' },
  dexterity: { abbr: 'DEX', full: 'Dexterity' },
  constitution: { abbr: 'CON', full: 'Constitution' },
  intelligence: { abbr: 'INT', full: 'Intelligence' },
  wisdom: { abbr: 'WIS', full: 'Wisdom' },
  charisma: { abbr: 'CHA', full: 'Charisma' },
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
  allSkills: readonly SkillDefinitionJsonData[];
  customSkills: readonly CustomSkillDefinition[];
}> = ({ featId, character, allFeats, allSkills, customSkills }) => {
  const featDef = allFeats.find(f => f.value === featId);
  if (!featDef) return <p className="text-sm text-muted-foreground">Feat details not found.</p>;

  const prereqMessages = checkFeatPrerequisites(featDef, character, allFeats, allSkills, customSkills);

  return (
    <div className="space-y-2 text-sm">
      {featDef.description && <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: featDef.description }} />}
      {prereqMessages.length > 0 && (
        <div className="mt-2">
          <p className="text-sm font-medium text-muted-foreground">Prerequisites:</p>
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
          <p className="text-sm font-medium text-muted-foreground">Effects:</p>
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


  const allCombinedFeatDefinitions = React.useMemo(() => [
    ...DND_FEATS_DEFINITIONS.map(def => ({ ...def, isCustom: false as const })),
    ...customFeatDefinitions,
  ], [customFeatDefinitions]);

  const allCombinedSkillDefinitionsForDisplay = React.useMemo((): SkillDefinitionForDisplay[] => {
    const predefined = SKILL_DEFINITIONS.map(sd => ({
      id: sd.value,
      name: sd.label,
      keyAbility: sd.keyAbility as AbilityName,
      description: sd.description,
      isCustom: false,
      providesSynergies: (SKILL_SYNERGIES as Record<string, any>)[sd.value] || [],
    }));
    const custom = customSkillDefinitions.map(csd => ({
      ...csd,
      isCustom: true,
    }));
    return [...predefined, ...custom].sort((a, b) => a.name.localeCompare(b.name));
  }, [customSkillDefinitions]);


  const derivedData = React.useMemo((): DerivedDialogData | null => {
    if (!isOpen || !contentType || !character) {
      return null;
    }

    let data: DerivedDialogData = { title: 'Information' };

    switch (contentType.type) {
      case 'race': {
        const raceId = character.race;
        const raceData = DND_RACES.find(r => r.value === raceId);
        const qualities = getRaceSpecialQualities(raceId);
        const racialSkillPointBonus = getRaceSkillPointsBonusPerLevel(raceId);
        const details: Array<{ label: string; value: string | number; isBold?: boolean }> = [];
        if (racialSkillPointBonus > 0) {
          details.push({ label: "Bonus Skill Points/Level", value: `+${racialSkillPointBonus}`, isBold: true });
        }
        
        let raceBonusFeatSlotsValue = qualities.bonusFeatSlots;
        if (raceBonusFeatSlotsValue !== undefined && raceBonusFeatSlotsValue <= 0) {
            raceBonusFeatSlotsValue = undefined;
        }

        data = {
          title: raceData?.label || 'Race Information',
          htmlContent: raceData?.description || '<p>No description available.</p>',
          abilityModifiers: qualities.abilityEffects,
          skillBonuses: qualities.skillBonuses,
          bonusFeatSlots: raceBonusFeatSlotsValue,
          grantedFeats: qualities.grantedFeats,
          detailsList: details.length > 0 ? details : undefined,
        };
        break;
      }
      case 'class': {
        const classId = character.classes[0]?.className;
        const classData = DND_CLASSES.find(c => c.value === classId);
        const classSpecificDetails: Array<{ label: string; value: string | number; isBold?: boolean }> = [];
        if (classData?.hitDice) classSpecificDetails.push({ label: "Hit Dice", value: classData.hitDice, isBold: true });
        if (classData?.saves) {
          classSpecificDetails.push({ label: "Fortitude Save", value: classData.saves.fortitude.charAt(0).toUpperCase() + classData.saves.fortitude.slice(1) });
          classSpecificDetails.push({ label: "Reflex Save", value: classData.saves.reflex.charAt(0).toUpperCase() + classData.saves.reflex.slice(1) });
          classSpecificDetails.push({ label: "Will Save", value: classData.saves.will.charAt(0).toUpperCase() + classData.saves.will.slice(1) });
        }
        
        const grantedFeatsFormatted = classData?.grantedFeats?.map(gf => ({
            ...gf, name: allCombinedFeatDefinitions.find(f => f.value === gf.featId)?.label || gf.featId
        }));

        data = {
          title: classData?.label || 'Class Information',
          htmlContent: classData?.description || '<p>No description available.</p>',
          grantedFeats: grantedFeatsFormatted,
          detailsList: classSpecificDetails,
        };
        break;
      }
      case 'alignmentSummary':
        data = {
          title: 'Alignments',
          htmlContent: ALIGNMENTS.map(a => `<p><b>${a.label}:</b><br />${a.description}</p>`).join(''),
        };
        break;
      case 'deity':
        const deityId = character.deity;
        const deityData = DND_DEITIES.find(d => d.value === deityId);
        if (deityData) {
            data = { title: deityData.label, htmlContent: deityData.description || `<p>No detailed description available for ${deityData.label}.</p>` };
        } else if (deityId && deityId.trim() !== '') {
            data = { title: deityId, htmlContent: `<p>Custom deity. No predefined information available.</p>` };
        } else {
            data = { title: "Deity Information", htmlContent: "<p>Select or type a deity to see more information.</p>"};
        }
        break;
      case 'abilityScoreBreakdown':
        const detailedScores = calculateDetailedAbilityScores(character, customFeatDefinitions);
        const abilityKeyForTitle = contentType.abilityName as Exclude<AbilityName, 'none'>;
        const displayNameForTitle = ABILITY_DISPLAY_NAMES[abilityKeyForTitle];
        data = {
          title: `${displayNameForTitle.abbr} (${displayNameForTitle.full}) Score Calculation`,
          abilityScoreBreakdown: detailedScores[contentType.abilityName],
        };
        break;
      case 'skillModifierBreakdown': {
        const skillInstance = character.skills.find(s => s.id === contentType.skillId);
        const skillDef = allCombinedSkillDefinitionsForDisplay.find(sd => sd.id === contentType.skillId);
        if (skillInstance && skillDef) {
          const actualAbilityScores = calculateDetailedAbilityScores(character, customFeatDefinitions);
          const finalAbilityScores: AbilityScores = (['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as Exclude<AbilityName, 'none'>[]).reduce((acc, ability) => {
              acc[ability] = actualAbilityScores[ability].finalScore;
              return acc;
          }, {} as AbilityScores);

          const keyAbilityMod = skillDef.keyAbility && skillDef.keyAbility !== 'none' ? getAbilityModifierByName(finalAbilityScores, skillDef.keyAbility) : 0;
          const synergyBonus = calculateTotalSynergyBonus(skillDef.id, character.skills, SKILL_DEFINITIONS, customSkillDefinitions);
          const featBonus = calculateFeatBonusesForSkill(skillDef.id, character.feats, allCombinedFeatDefinitions);
          const racialBonus = calculateRacialSkillBonus(skillDef.id, character.race, DND_RACES, SKILL_DEFINITIONS);
          const sizeBonus = calculateSizeSpecificSkillBonus(skillDef.id, character.size);
          const totalMod = keyAbilityMod + synergyBonus + featBonus + racialBonus + sizeBonus;
          const totalSkillBonus = (skillInstance.ranks || 0) + totalMod + (skillInstance.miscModifier || 0);
          data = {
            title: `${skillDef.name} Modifier Breakdown`,
            htmlContent: skillDef.description,
            skillModifierBreakdown: {
              skillName: skillDef.name,
              keyAbilityName: skillDef.keyAbility !== 'none' ? skillDef.keyAbility : undefined,
              keyAbilityModifier: keyAbilityMod,
              ranks: skillInstance.ranks || 0,
              synergyBonus, featBonus, racialBonus, sizeSpecificBonus: sizeBonus,
              miscModifier: skillInstance.miscModifier || 0,
              totalBonus: totalSkillBonus,
            },
          };
        } else {
            data = { title: "Skill Information", htmlContent: "<p>Skill details not found.</p>"};
        }
        break;
      }
      case 'resistanceBreakdown':
        const resistanceValue = character[contentType.resistanceField] as ResistanceValue;
        const resistanceLabel = contentType.resistanceField.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(' Resistance', '');
        data = {
          title: `${resistanceLabel} Resistance Breakdown`,
          resistanceBreakdown: {
            name: resistanceLabel,
            base: resistanceValue.base || 0,
            customMod: resistanceValue.customMod || 0,
            total: (resistanceValue.base || 0) + (resistanceValue.customMod || 0),
          },
        };
        break;
      case 'acBreakdown': {
        const detailedCharScores = calculateDetailedAbilityScores(character, customFeatDefinitions);
        const dexMod = calculateAbilityModifier(detailedCharScores.dexterity.finalScore);
        const sizeModAC = getSizeModifierAC(character.size);
        const sizeLabel = SIZES.find(s => s.value === character.size)?.label || character.size;
        const details: Array<{ label: string; value: string | number; isBold?: boolean }> = [{ label: 'Base', value: 10 }];
        let totalCalculated = 10;

        if (contentType.acType === 'Normal' || contentType.acType === 'Touch') details.push({ label: 'Dexterity Modifier', value: dexMod });
        details.push({ label: `Size Modifier (${sizeLabel})`, value: sizeModAC });

        if (contentType.acType === 'Normal' || contentType.acType === 'Flat-Footed') {
          if (character.armorBonus) details.push({ label: 'Armor Bonus', value: character.armorBonus });
          if (character.shieldBonus) details.push({ label: 'Shield Bonus', value: character.shieldBonus });
          if (character.naturalArmor) details.push({ label: 'Natural Armor', value: character.naturalArmor });
        }
        if (character.deflectionBonus) details.push({ label: 'Deflection Bonus', value: character.deflectionBonus });
        if ((contentType.acType === 'Normal' || contentType.acType === 'Touch') && character.dodgeBonus) {
          details.push({ label: 'Dodge Bonus', value: character.dodgeBonus });
        }
        
        if (character.acMiscModifier) details.push({ label: 'Custom Modifier', value: character.acMiscModifier });


        if (contentType.acType === 'Normal') totalCalculated = 10 + (character.armorBonus || 0) + (character.shieldBonus || 0) + dexMod + sizeModAC + (character.naturalArmor || 0) + (character.deflectionBonus || 0) + (character.dodgeBonus || 0) + (character.acMiscModifier || 0);
        else if (contentType.acType === 'Touch') totalCalculated = 10 + dexMod + sizeModAC + (character.deflectionBonus || 0) + (character.dodgeBonus || 0) + (character.acMiscModifier || 0);
        else if (contentType.acType === 'Flat-Footed') totalCalculated = 10 + (character.armorBonus || 0) + (character.shieldBonus || 0) + sizeModAC + (character.naturalArmor || 0) + (character.deflectionBonus || 0) + (character.acMiscModifier || 0);
        
        details.push({ label: 'Total', value: totalCalculated, isBold: true });
        data = { title: `${contentType.acType} AC Breakdown`, detailsList: details };
        break;
      }
      case 'babBreakdown': {
        const baseBabArray = getBab(character.classes);
        data = {
          title: 'Base Attack Bonus Breakdown',
          babBreakdown: {
            baseBabFromClasses: baseBabArray,
            miscModifier: character.babMiscModifier || 0,
            totalBab: baseBabArray.map(b => b + (character.babMiscModifier || 0)),
            characterClassLabel: DND_CLASSES.find(c => c.value === character.classes[0]?.className)?.label || character.classes[0]?.className
          },
        };
        break;
      }
      case 'initiativeBreakdown': {
        const detailedCharScores = calculateDetailedAbilityScores(character, customFeatDefinitions);
        const dexMod = calculateAbilityModifier(detailedCharScores.dexterity.finalScore);
        data = {
          title: 'Initiative Breakdown',
          initiativeBreakdown: {
            dexModifier: dexMod,
            miscModifier: character.initiativeMiscModifier || 0,
            totalInitiative: calculateInitiative(dexMod, character.initiativeMiscModifier || 0),
          },
        };
        break;
      }
      case 'grappleModifierBreakdown': {
        const detailedCharScores = calculateDetailedAbilityScores(character, customFeatDefinitions);
        const strMod = calculateAbilityModifier(detailedCharScores.strength.finalScore);
        const baseBabArray = getBab(character.classes);
        const sizeModGrapple = getSizeModifierGrapple(character.size);
        data = {
          title: 'Grapple Modifier Breakdown',
          grappleModifierBreakdown: {
            baseAttackBonus: baseBabArray[0] || 0,
            strengthModifier: strMod,
            sizeModifierGrapple: sizeModGrapple,
            miscModifier: character.grappleMiscModifier || 0,
            totalGrappleModifier: calculateGrapple(baseBabArray, strMod, sizeModGrapple) + (character.grappleMiscModifier || 0),
          },
        };
        break;
      }
       case 'grappleDamageBreakdown': {
        const detailedCharScores = calculateDetailedAbilityScores(character, customFeatDefinitions);
        const strMod = calculateAbilityModifier(detailedCharScores.strength.finalScore);
        data = {
          title: 'Grapple Damage Breakdown',
          grappleDamageBreakdown: {
            baseDamage: character.grappleDamage_baseNotes || getUnarmedGrappleDamage(character.size),
            bonus: character.grappleDamage_bonus || 0,
            strengthModifier: strMod,
          },
        };
        break;
      }
      case 'genericHtml':
        data = { title: contentType.title, htmlContent: contentType.content };
        break;
    }
    return data;
  }, [isOpen, contentType, character, customFeatDefinitions, customSkillDefinitions, allCombinedFeatDefinitions, allCombinedSkillDefinitionsForDisplay]);


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
    const prefix = numValue > 0 ? '+' : (numValue === 0 ? '' : '');
    if (value === 0 && !isTotal) return <span className={cn("font-bold", colorClass)}>0</span>;
    return <span className={cn("font-bold", colorClass)}>{prefix}{numValue}</span>;
  };

  if (!isOpen || !derivedData) return null;

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
  } = derivedData;
  
  const sectionHeadingClass = "text-md font-semibold mb-2 text-primary";

  const sectionHeading = abilityScoreBreakdown || skillModifierBreakdown || resistanceBreakdown || babBreakdown || initiativeBreakdown || grappleModifierBreakdown || grappleDamageBreakdown || (detailsList && (contentType?.type === 'acBreakdown' || contentType?.type === 'class')) ? "Calculation:" : "Details:";
  const hasAnyBonusSection = abilityModifiers?.length || skillBonuses?.length || grantedFeats?.length || bonusFeatSlots !== undefined;
  
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
          <DialogTitle className="flex items-center font-serif">
            <Info className="mr-2 h-6 w-6 text-primary" />
            {finalTitle}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4 my-2">
          <div className="pb-4"> {/* Wrapper for bottom padding */}
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
                      <span>{babBreakdown.characterClassLabel || 'Class'} Base Attack Bonus:</span>
                      <span className="font-bold">{babBreakdown.baseBabFromClasses.map(b => `${b >= 0 ? '+' : ''}${b}`).join('/')}</span>
                    </div>
                    {babBreakdown.miscModifier !== 0 && (
                      <div className="flex justify-between">
                          <span>Custom Modifier:</span>
                          {renderModifierValue(babBreakdown.miscModifier)}
                      </div>
                    )}
                    <Separator className="my-3" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Total Base Attack Bonus:</span>
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
                        {ABILITY_DISPLAY_NAMES.dexterity.abbr}{'\u00A0'}
                        <span className="text-xs text-muted-foreground">({ABILITY_DISPLAY_NAMES.dexterity.full})</span> Modifier:
                      </span>
                      {renderModifierValue(initiativeBreakdown.dexModifier)}
                    </div>
                    {initiativeBreakdown.miscModifier !== 0 && (
                      <div className="flex justify-between">
                          <span>Custom Modifier:</span>
                          {renderModifierValue(initiativeBreakdown.miscModifier)}
                      </div>
                    )}
                    <Separator className="my-3" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Total Initiative:</span>
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
                      <span>Base Attack Bonus:</span>
                      {renderModifierValue(grappleModifierBreakdown.baseAttackBonus)}
                    </div>
                    <div className="flex justify-between">
                      <span>
                        {ABILITY_DISPLAY_NAMES.strength.abbr}{'\u00A0'}
                        <span className="text-xs text-muted-foreground">({ABILITY_DISPLAY_NAMES.strength.full})</span> Modifier:
                      </span>
                      {renderModifierValue(grappleModifierBreakdown.strengthModifier)}
                    </div>
                    <div className="flex justify-between">
                      <span>Size Modifier:</span>
                      {renderModifierValue(grappleModifierBreakdown.sizeModifierGrapple)}
                    </div>
                    {grappleModifierBreakdown.miscModifier !== 0 && (
                      <div className="flex justify-between">
                          <span>Custom Modifier:</span>
                          {renderModifierValue(grappleModifierBreakdown.miscModifier)}
                      </div>
                    )}
                    <Separator className="my-3" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Total Grapple Modifier:</span>
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
                      <span>Base Damage:</span>
                      <span className="font-bold">
                        {grappleDamageBreakdown.baseDamage.split(' ')[0] || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Weapon Damage:</span>
                      {grappleDamageBreakdown.baseDamage.toLowerCase().includes('unarmed') ? (
                          <span className="font-semibold text-muted-foreground">Unarmed</span>
                      ) : (
                          renderModifierValue(0) 
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span>
                        {ABILITY_DISPLAY_NAMES.strength.abbr}{'\u00A0'}
                        <span className="text-xs text-muted-foreground">({ABILITY_DISPLAY_NAMES.strength.full})</span> Modifier:
                      </span>
                      {renderModifierValue(grappleDamageBreakdown.strengthModifier)}
                    </div>
                    {grappleDamageBreakdown.bonus !== 0 && (
                      <div className="flex justify-between">
                          <span>Custom Modifier:</span>
                          {renderModifierValue(grappleDamageBreakdown.bonus)}
                      </div>
                    )}
                    <Separator className="my-3" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Total:</span>
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
                      <span>Base Score:</span>
                      <span className="font-bold">{abilityScoreBreakdown.base}</span>
                    </div>
                    {abilityScoreBreakdown.components.map((comp, index) => (
                      comp.value !== 0 && (
                        <div key={index} className="flex justify-between">
                          <span>{comp.source}:</span>
                          {renderModifierValue(comp.value)}
                        </div>
                      )
                    ))}
                    <Separator className="my-3" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Final Score:</span>
                      <span className="font-bold text-accent">{abilityScoreBreakdown.finalScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Final Modifier:</span>
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
                    {skillModifierBreakdown.keyAbilityName && (() => {
                      const keyAbility = skillModifierBreakdown.keyAbilityName as Exclude<AbilityName, 'none'>;
                      const displayName = ABILITY_DISPLAY_NAMES[keyAbility];
                      return (
                        <div className="flex justify-between">
                          <span>
                            Key Ability ({displayName.abbr}{'\u00A0'}
                            <span className="text-xs text-muted-foreground">({displayName.full})</span>)
                          </span>
                          {renderModifierValue(skillModifierBreakdown.keyAbilityModifier)}
                        </div>
                      );
                    })()}
                    <div className="flex justify-between">
                      <span>Ranks:</span>
                      {renderModifierValue(skillModifierBreakdown.ranks)}
                    </div>
                    {skillModifierBreakdown.sizeSpecificBonus !== 0 && (
                      <div className="flex justify-between">
                        <span>Size Modifier:</span>
                        {renderModifierValue(skillModifierBreakdown.sizeSpecificBonus)}
                      </div>
                    )}
                    {skillModifierBreakdown.synergyBonus !== 0 && (
                      <div className="flex justify-between">
                        <span>Synergy Bonus:</span>
                        {renderModifierValue(skillModifierBreakdown.synergyBonus)}
                      </div>
                    )}
                    {skillModifierBreakdown.featBonus !== 0 && (
                      <div className="flex justify-between">
                        <span>Feat Bonus:</span>
                        {renderModifierValue(skillModifierBreakdown.featBonus)}
                      </div>
                    )}
                    {skillModifierBreakdown.racialBonus !== 0 && (
                      <div className="flex justify-between">
                        <span>Racial Bonus:</span>
                        {renderModifierValue(skillModifierBreakdown.racialBonus)}
                      </div>
                    )}
                    {skillModifierBreakdown.miscModifier !== 0 && (
                      <div className="flex justify-between">
                        <span>Misc Modifier:</span>
                        {renderModifierValue(skillModifierBreakdown.miscModifier)}
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Total Bonus:</span>
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
                      <span>Base Value:</span>
                      <span className="font-bold">{resistanceBreakdown.base}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Custom Modifier:</span>
                      {renderModifierValue(resistanceBreakdown.customMod)}
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Total Resistance:</span>
                      <span className="font-bold text-accent">{resistanceBreakdown.total}</span>
                    </div>
                  </div>
                </div>
                {markContentRendered()}
              </>
            )}

            {/* Race Info: Details */}
            {!abilityScoreBreakdown && !skillModifierBreakdown && !resistanceBreakdown && !babBreakdown && !initiativeBreakdown && !grappleModifierBreakdown && !grappleDamageBreakdown && contentType?.type === 'race' && (
              <>
              {detailsList && detailsList.length > 0 && (
                  <>
                    {renderSeparatorIfNeeded()}
                    <div>
                      <h3 className={sectionHeadingClass}>Details</h3>
                      {detailsList!.map((detail, index) => (
                        <div key={index} className="flex justify-between text-sm mb-0.5">
                        <span className="text-foreground">{detail.label}</span>
                        <span className={cn(detail.isBold && "font-bold", "text-foreground")}>{detail.value}</span>
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
                    <h3 className={sectionHeadingClass}>Ability Score Adjustments</h3>
                    <ul className="space-y-1 text-sm">
                      {abilityModifiers!.map(({ ability, change }) => {
                        const displayName = ABILITY_DISPLAY_NAMES[ability];
                        return (
                          <li key={ability} className="flex justify-between text-foreground">
                            <span>
                              {displayName.abbr}{'\u00A0'}
                              <span className="text-xs text-muted-foreground">({displayName.full})</span>
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
                    <h3 className={sectionHeadingClass}>Racial Skill Bonuses</h3>
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
                                    No description available for this skill.
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

                {(grantedFeats && grantedFeats.length > 0) || (bonusFeatSlots !== undefined) ? (
                  <>
                  {renderSeparatorIfNeeded()}
                  <div>
                    <h3 className={sectionHeadingClass}>Racial Feat Adjustments</h3>
                    <div className="text-sm space-y-1">
                      {bonusFeatSlots !== undefined && bonusFeatSlots > 0 && ( 
                        <div className="flex justify-between">
                          <span className="text-foreground">Bonus Feat Slots</span>
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
                                  {feat.note && (<span className="text-xs text-muted-foreground inline-block !no-underline hover:!no-underline ml-[0.2em]">{feat.note}</span>)}
                                </Button>
                              {isExpanded && (
                                <ExpandableDetailWrapper>
                                  <FeatDetailContent
                                    featId={feat.featId}
                                    character={character}
                                    allFeats={allCombinedFeatDefinitions}
                                    allSkills={SKILL_DEFINITIONS}
                                    customSkills={customSkillDefinitions}
                                  />
                                </ExpandableDetailWrapper>
                              )}
                            </li>
                          )})}
                        </ul>
                      ) : (
                        (bonusFeatSlots === undefined || bonusFeatSlots <= 0) && <p className="text-foreground">None</p>
                      )}
                    </div>
                  </div>
                  {markContentRendered()}
                  </>
                ) : null}
              </>
            )}

            {/* Class Info: Granted Feats & DetailsList*/}
            {!abilityScoreBreakdown && !skillModifierBreakdown && !resistanceBreakdown && !babBreakdown && !initiativeBreakdown && !grappleModifierBreakdown && !grappleDamageBreakdown && contentType?.type === 'class' && (
              <>
                {detailsList && detailsList.length > 0 && (
                  <>
                  {renderSeparatorIfNeeded()}
                  <div className="mb-3">
                    <h3 className={sectionHeadingClass}>Details</h3>
                    {detailsList!.map((detail, index) => (
                        <div key={index} className="flex justify-between text-sm mb-0.5">
                        <span className="text-foreground">{detail.label}</span>
                        <span className={cn(detail.isBold && "font-bold", "text-foreground")}>{detail.value}</span>
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
                    <h3 className={sectionHeadingClass}>Class Features & Granted Feats</h3>
                    <ul className="space-y-2 text-sm">
                      {grantedFeats.map(({ featId, name, note, levelAcquired }, index) => {
                        const uniqueKey = `classfeat-${featId}-${index}`;
                        const isExpanded = expandedItems.has(uniqueKey);
                        return (
                        <li key={uniqueKey}>
                          <div className="flex items-baseline gap-x-2 text-foreground">
                            {levelAcquired !== undefined && (
                              <Badge variant="outline" className="text-xs font-normal h-5 whitespace-nowrap">
                                Level {levelAcquired}
                              </Badge>
                            )}
                            <Button
                                variant="link"
                                size="sm"
                                onClick={() => toggleExpanded(uniqueKey)}
                                className={cn(
                                  "p-0 h-auto text-sm font-normal text-left justify-start text-foreground flex-grow no-underline hover:no-underline items-baseline",
                                  { "flex-1": !levelAcquired } 
                                )}
                                aria-expanded={isExpanded}
                              >
                                {name}
                                {note && <span className="text-xs text-muted-foreground inline-block !no-underline hover:!no-underline">{note}</span>}
                              </Button>
                          </div>
                          {isExpanded && (
                            <ExpandableDetailWrapper>
                              <FeatDetailContent
                                featId={featId}
                                character={character}
                                allFeats={allCombinedFeatDefinitions}
                                allSkills={SKILL_DEFINITIONS}
                                customSkills={customSkillDefinitions}
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
            
            {/* AC Breakdown and Generic DetailsList */}
            {!abilityScoreBreakdown && !skillModifierBreakdown && !resistanceBreakdown && !babBreakdown && !initiativeBreakdown && !grappleModifierBreakdown && !grappleDamageBreakdown && detailsList && detailsList.length > 0 && (contentType?.type !== 'class' && contentType?.type !== 'race') && (
              <>
                {renderSeparatorIfNeeded()}
                <div>
                  <h3 className={sectionHeadingClass}>{sectionHeading}</h3>
                  {detailsList!.filter(detail => detail.label.toLowerCase() !== 'total').map((detail, index) => {
                      const valueToRender = (typeof detail.value === 'number' || (typeof detail.value === 'string' && !isNaN(parseFloat(detail.value))))
                          ? renderModifierValue(detail.value, undefined, undefined, undefined, (detail.label.toLowerCase() === "total" ? "text-accent" : undefined), detail.label.toLowerCase() === "total")
                          : detail.value;
                      
                      let labelContent: React.ReactNode;
                      const defaultLabelClass = "text-foreground"; 

                      if (detail.label.toLowerCase().includes("modifier") && (detail.label.toLowerCase().includes("dexterity") || detail.label.toLowerCase().includes("strength"))) {
                          const ability = detail.label.toLowerCase().includes("dexterity") ? 'dexterity' : 'strength';
                          const displayName = ABILITY_DISPLAY_NAMES[ability as Exclude<AbilityName, 'none'>];
                          labelContent = (
                              <span className={defaultLabelClass}>
                                  {displayName.abbr}{'\u00A0'}
                                  <span className="text-xs text-muted-foreground">({displayName.full})</span> Modifier
                              </span>
                          );
                      } else {
                          labelContent = <span className={defaultLabelClass}>{detail.label}</span>;
                      }

                      return (
                          <div key={index} className="flex justify-between text-sm mb-0.5">
                          {labelContent}
                          <span className={cn(detail.isBold && "font-bold", "text-foreground")}>{valueToRender}</span>
                          </div>
                      );
                  })}
                  
                  {detailsList!.find(detail => detail.label.toLowerCase() === 'total') && (
                    <>
                      <Separator className="my-2" />
                      <div className="flex justify-between text-base">
                        <span className="font-semibold">Total</span>
                        {renderModifierValue(detailsList!.find(detail => detail.label.toLowerCase() === 'total')!.value, undefined, undefined, undefined, "text-accent", true)}
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
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper type for derivedData structure
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
  detailsList?: Array<{ label: string; value: string | number; isBold?: boolean }>;
  babBreakdown?: BabBreakdownDetails;
  initiativeBreakdown?: InitiativeBreakdownDetails;
  grappleModifierBreakdown?: GrappleModifierBreakdownDetails;
  grappleDamageBreakdown?: GrappleDamageBreakdownDetails;
}

