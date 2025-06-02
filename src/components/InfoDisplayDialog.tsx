
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
  Character, AbilityName, AbilityScoreBreakdown, RaceSpecialQualities, SkillModifierBreakdownDetails,
  InfoDialogContentType, ResistanceFieldKeySheet, DndRaceOption, DndClassOption, CharacterAlignmentObject, DndDeityOption,
  FeatDefinitionJsonData, SkillDefinitionForDisplay,
  BabBreakdownDetails as BabBreakdownDetailsType,
  InitiativeBreakdownDetails as InitiativeBreakdownDetailsType,
  GrappleModifierBreakdownDetails as GrappleModifierBreakdownDetailsType,
  GrappleDamageBreakdownDetails as GrappleDamageBreakdownDetailsType,
  ResistanceValue
} from '@/types/character';
import { DND_RACES, DND_CLASSES, DND_DEITIES, ALIGNMENTS, SKILL_DEFINITIONS, SIZES, DND_FEATS_DEFINITIONS, getRaceSpecialQualities, getRaceSkillPointsBonusPerLevel, calculateDetailedAbilityScores, calculateTotalSynergyBonus, calculateFeatBonusesForSkill, calculateRacialSkillBonus, SKILL_SYNERGIES, CLASS_SKILLS, calculateSizeSpecificSkillBonus } from '@/types/character';
import { useDefinitionsStore } from '@/lib/definitions-store';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
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

type DerivedDialogData = {
  title: string;
  htmlContent?: string;
  abilityModifiers?: Array<{ ability: Exclude<AbilityName, 'none'>; change: number }>;
  skillBonuses?: Array<{ skillName: string; bonus: number }>;
  grantedFeats?: Array<{ featId: string; name: string; note?: string; levelAcquired?: number }>;
  bonusFeatSlots?: number | undefined;
  abilityScoreBreakdown?: AbilityScoreBreakdown;
  skillModifierBreakdown?: SkillModifierBreakdownDetails;
  resistanceBreakdown?: ResistanceBreakdownDetails;
  detailsList?: Array<{ label: string; value: string | number; isBold?: boolean }>;
  babBreakdown?: BabBreakdownDetails;
  initiativeBreakdown?: InitiativeBreakdownDetails;
  grappleModifierBreakdown?: GrappleModifierBreakdownDetails;
  grappleDamageBreakdown?: GrappleDamageBreakdownDetails;
};

const ABILITY_DISPLAY_NAMES: Record<Exclude<AbilityName, 'none'>, { abbr: string; full: string }> = {
  strength: { abbr: 'STR', full: 'Strength' },
  dexterity: { abbr: 'DEX', full: 'Dexterity' },
  constitution: { abbr: 'CON', full: 'Constitution' },
  intelligence: { abbr: 'INT', full: 'Intelligence' },
  wisdom: { abbr: 'WIS', full: 'Wisdom' },
  charisma: { abbr: 'CHA', full: 'Charisma' },
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
        const raceBonusFeatSlots = qualities.bonusFeatSlots;

        data = {
          title: raceData?.label || 'Race Information',
          htmlContent: raceData?.description || '<p>No description available.</p>',
          abilityModifiers: qualities.abilityEffects,
          skillBonuses: qualities.skillBonuses,
          bonusFeatSlots: (raceBonusFeatSlots && raceBonusFeatSlots > 0) ? raceBonusFeatSlots : undefined,
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
          title: `${displayNameForTitle.abbr}\u00A0(${displayNameForTitle.full}) Score Calculation`,
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
    const prefix = numValue > 0 ? '+' : (numValue === 0 ? '' : ''); // No plus for zero unless it's a specific case
    if (value === 0 && !isTotal) return <span className={cn("font-bold", colorClass)}>0</span>; // Display 0 plainly if not total
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
  
  const sectionHeadingBaseClass = "text-md font-semibold mb-2";
  const sectionHeadingClass = `${sectionHeadingBaseClass} text-primary`;

  const sectionHeading = abilityScoreBreakdown || skillModifierBreakdown || resistanceBreakdown || babBreakdown || initiativeBreakdown || grappleModifierBreakdown || grappleDamageBreakdown || (detailsList && (contentType?.type === 'acBreakdown' || contentType?.type === 'class')) ? "Calculation:" : "Details:";
  const hasAnyBonusSection = abilityModifiers?.length || skillBonuses?.length || grantedFeats?.length || bonusFeatSlots !== undefined;


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif">
            <Info className="mr-2 h-6 w-6 text-primary" />
            {finalTitle}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4 my-2">
          {htmlContent && (
             <div
              className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          )}

          {babBreakdown && (
            <>
            {(htmlContent) && <Separator className="my-3"/>}
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
            </>
          )}

          {initiativeBreakdown && (
             <>
            {(htmlContent || babBreakdown) && <Separator className="my-3"/>}
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
            </>
          )}

          {grappleModifierBreakdown && (
            <>
            {(htmlContent || babBreakdown || initiativeBreakdown) && <Separator className="my-3"/>}
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
            </>
          )}
          
          {grappleDamageBreakdown && (
            <>
            {(htmlContent || babBreakdown || initiativeBreakdown || grappleModifierBreakdown) && <Separator className="my-3"/>}
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
            </>
          )}


          {abilityScoreBreakdown && (
            <>
            {(htmlContent || babBreakdown || initiativeBreakdown || grappleModifierBreakdown || grappleDamageBreakdown) && <Separator className="my-3"/>}
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
            </>
          )}

          {skillModifierBreakdown && (
            <>
            {(htmlContent || babBreakdown || initiativeBreakdown || grappleModifierBreakdown || grappleDamageBreakdown || abilityScoreBreakdown) && <Separator className="my-3"/>}
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
                          <span className="text-xs text-muted-foreground">({displayName.full})</span>):
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
            </>
          )}
          
          {resistanceBreakdown && (
            <>
              {(htmlContent || babBreakdown || initiativeBreakdown || grappleModifierBreakdown || grappleDamageBreakdown || abilityScoreBreakdown || skillModifierBreakdown) && <Separator className="my-3"/>}
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
            </>
          )}

          {/* Race Info: Racial Feat Adjustments */}
          {!abilityScoreBreakdown && !skillModifierBreakdown && !resistanceBreakdown && !babBreakdown && !initiativeBreakdown && !grappleModifierBreakdown && !grappleDamageBreakdown && contentType?.type === 'race' && (
            <>
              {(htmlContent || (abilityModifiers && abilityModifiers.length > 0) || (skillBonuses && skillBonuses.length > 0)) && <Separator className="my-4" />}
              <div>
                <h3 className={sectionHeadingClass}>Racial Feat Adjustments:</h3>
                <div className="text-sm space-y-1">
                  {bonusFeatSlots && bonusFeatSlots > 0 && ( 
                    <div className="flex justify-between">
                      <span>Bonus Feat Slots:</span>
                      {renderModifierValue(bonusFeatSlots)}
                    </div>
                  )}
                  {grantedFeats && grantedFeats.length > 0 && (
                    <div>
                      <span className="text-primary">Granted Feats: </span>
                      <span className="text-foreground">
                        {grantedFeats.map(feat => `${feat.name}${feat.note ? ` ${feat.note}` : ''}`).join(', ')}
                      </span>
                    </div>
                  )}
                  {bonusFeatSlots === undefined && (!grantedFeats || grantedFeats.length === 0) && (
                    <p className="text-foreground">None</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Class Info: Granted Feats & DetailsList*/}
           {!abilityScoreBreakdown && !skillModifierBreakdown && !resistanceBreakdown && !babBreakdown && !initiativeBreakdown && !grappleModifierBreakdown && !grappleDamageBreakdown && contentType?.type === 'class' && (
             <>
              {(htmlContent) && <Separator className="my-3" />}
              {detailsList && detailsList.length > 0 && (
                <div className="mb-3">
                  <h3 className={sectionHeadingClass}>Details:</h3>
                  {detailsList!.map((detail, index) => (
                      <div key={index} className="flex justify-between text-sm mb-0.5">
                      <span className="text-muted-foreground">{detail.label}:</span>
                      <span className={cn(detail.isBold && "font-bold", "text-foreground")}>{detail.value}</span>
                      </div>
                  ))}
                </div>
              )}
              {grantedFeats && grantedFeats.length > 0 && (
                <div>
                <h3 className={sectionHeadingClass}>Class Features & Granted Feats:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {grantedFeats.map(({ featId, name, note, levelAcquired }, index) => (
                    <li key={`${featId}-${index}`}>
                      <span>{name}</span>
                      {note && <span className="text-muted-foreground text-xs ml-1">{note}</span>}
                      {levelAcquired !== undefined && <span className="text-muted-foreground text-xs ml-1">(Lvl {levelAcquired})</span>}
                    </li>
                  ))}
                </ul>
              </div>
              )}
            </>
          )}

          {!abilityScoreBreakdown && !skillModifierBreakdown && !resistanceBreakdown && !babBreakdown && !initiativeBreakdown && !grappleModifierBreakdown && !grappleDamageBreakdown && abilityModifiers && abilityModifiers.length > 0 && contentType?.type === 'race' && (
            <>
              {(htmlContent) && <Separator className="my-4" />}
              <div>
                <h3 className={sectionHeadingClass}>Ability Score Adjustments:</h3>
                <ul className="space-y-1 text-sm">
                  {abilityModifiers!.map(({ ability, change }) => {
                    const displayName = ABILITY_DISPLAY_NAMES[ability];
                    return (
                      <li key={ability} className="flex justify-between">
                        <span>
                          {displayName.abbr}{'\u00A0'}
                          <span className="text-xs text-muted-foreground">({displayName.full})</span>:
                        </span>
                        {renderModifierValue(change)}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}

          {!abilityScoreBreakdown && !skillModifierBreakdown && !resistanceBreakdown && !babBreakdown && !initiativeBreakdown && !grappleModifierBreakdown && !grappleDamageBreakdown && skillBonuses && skillBonuses.length > 0 && contentType?.type === 'race' && (
            <>
              {(htmlContent || (abilityModifiers && abilityModifiers.length > 0)) && <Separator className="my-4" />}
              <div>
                <h3 className={sectionHeadingClass}>Racial Skill Bonuses:</h3>
                <ul className="space-y-1 text-sm">
                  {skillBonuses!.map(({ skillName, bonus }) => (
                    <li key={skillName} className="flex justify-between">
                      <span>{skillName}:</span>
                      {renderModifierValue(bonus)}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}


          {!abilityScoreBreakdown && !skillModifierBreakdown && !resistanceBreakdown && !babBreakdown && !initiativeBreakdown && !grappleModifierBreakdown && !grappleDamageBreakdown && detailsList && detailsList.length > 0 && (contentType?.type !== 'class') && (
             <>
              {(htmlContent || hasAnyBonusSection) && (contentType?.type !== 'acBreakdown') && <Separator className="my-4" />}
              {(htmlContent && (contentType?.type === 'acBreakdown')) && <Separator className="my-3" />}
              <div>
                <h3 className={sectionHeadingClass}>{sectionHeading}</h3>
                {detailsList!.filter(detail => detail.label.toLowerCase() !== 'total').map((detail, index) => {
                    const valueToRender = (typeof detail.value === 'number' || (typeof detail.value === 'string' && !isNaN(parseFloat(detail.value))))
                        ? renderModifierValue(detail.value, undefined, undefined, undefined, (detail.label.toLowerCase() === "total" ? "text-accent" : undefined), detail.label.toLowerCase() === "total")
                        : detail.value;
                    let labelContent = <span className="text-muted-foreground">{detail.label}:</span>;
                    if (detail.label.toLowerCase() === "dexterity modifier") {
                        const displayName = ABILITY_DISPLAY_NAMES.dexterity;
                        labelContent = (
                            <span className="text-muted-foreground">
                                {displayName.abbr}{'\u00A0'}
                                <span className="text-xs text-muted-foreground">({displayName.full})</span> Modifier:
                            </span>
                        );
                    } else if (detail.label.toLowerCase() === "strength modifier") {
                         const displayName = ABILITY_DISPLAY_NAMES.strength;
                        labelContent = (
                            <span className="text-muted-foreground">
                                {displayName.abbr}{'\u00A0'}
                                <span className="text-xs text-muted-foreground">({displayName.full})</span> Modifier:
                            </span>
                        );
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
                      <span className="font-semibold">Total:</span>
                      {renderModifierValue(detailsList!.find(detail => detail.label.toLowerCase() === 'total')!.value, undefined, undefined, undefined, "text-accent", true)}
                    </div>
                  </>
                )}
              </div>
            </>
          )}

        </ScrollArea>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
