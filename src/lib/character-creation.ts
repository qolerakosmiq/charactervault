
import type {
  Character,
  Skill,
  AbilityScores,
  SavingThrows,
  ResistanceValue,
  SpeedDetails,
} from '@/types/character';
import {
  DEFAULT_ABILITIES_DATA,
  DEFAULT_SAVING_THROWS_DATA,
  DEFAULT_RESISTANCE_VALUE_DATA,
  DEFAULT_SPEED_DETAILS_DATA,
  DEFAULT_SPEED_PENALTIES_DATA,
} from '@/types/character-core';
import type { ProcessedSiteData } from '@/i18n/i18n-data';
import type { CustomSkillDefinition } from '@/lib/definitions-store';

export function createBaseCharacterData(
  translations: ProcessedSiteData,
  customSkillDefinitions: CustomSkillDefinition[]
): Character {
  if (!translations || !translations.SKILL_DEFINITIONS) {
    throw new Error("Translations or skill definitions not available for character creation.");
  }

  const allSkillDefs = [...translations.SKILL_DEFINITIONS, ...customSkillDefinitions];

  const initialSkills: Skill[] = allSkillDefs.map(def => ({
    id: def.id,
    ranks: 0,
    miscModifier: 0,
    isClassSkill: false,
  }));

  const initialCharacterData: Character = {
    id: crypto.randomUUID(),
    name: translations.UI_STRINGS.newCharacterDefaultName || 'New Adventurer',
    playerName: '',
    campaign: '',
    homeland: '',
    race: '',
    alignment: 'true-neutral',
    deity: '',
    size: 'medium',
    age: 20,
    gender: 'unspecified',
    height: '',
    weight: '',
    eyes: '',
    hair: '',
    skin: '',
    languages: [],
    experiencePoints: 0,
    abilityScores: { ...DEFAULT_ABILITIES_DATA },
    abilityScoreTempCustomModifiers: { ...DEFAULT_ABILITIES_DATA, strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 },
    hp: 1,
    maxHp: 1,
    baseMaxHp: 1,
    customMaxHpModifier: 0,
    nonlethalDamage: 0,
    temporaryHp: 0,
    numberOfWounds: 0,
    armorBonus: 0,
    shieldBonus: 0,
    sizeModifierAC: 0,
    naturalArmor: 0,
    deflectionBonus: 0,
    dodgeBonus: 0,
    acMiscModifier: 0,
    babMiscModifier: 0,
    initiativeMiscModifier: 0,
    grappleMiscModifier: 0,
    grappleWeaponChoice: 'unarmed',
    grappleDamage_baseNotes: '1d3',
    grappleDamage_bonus: 0,
    savingThrows: JSON.parse(JSON.stringify(DEFAULT_SAVING_THROWS_DATA)),
    classes: [{ id: crypto.randomUUID(), className: '', level: 1 }],
    skills: initialSkills,
    feats: [],
    inventory: [],
    equippedGear: {},
    personalStory: '',
    portraitDataUrl: undefined,
    fireResistance: { ...DEFAULT_RESISTANCE_VALUE_DATA },
    coldResistance: { ...DEFAULT_RESISTANCE_VALUE_DATA },
    acidResistance: { ...DEFAULT_RESISTANCE_VALUE_DATA },
    electricityResistance: { ...DEFAULT_RESISTANCE_VALUE_DATA },
    sonicResistance: { ...DEFAULT_RESISTANCE_VALUE_DATA },
    spellResistance: { ...DEFAULT_RESISTANCE_VALUE_DATA },
    powerResistance: { ...DEFAULT_RESISTANCE_VALUE_DATA },
    damageReduction: [],
    fortification: { ...DEFAULT_RESISTANCE_VALUE_DATA },
    landSpeed: { ...DEFAULT_SPEED_DETAILS_DATA, base: 30 },
    burrowSpeed: { ...DEFAULT_SPEED_DETAILS_DATA },
    climbSpeed: { ...DEFAULT_SPEED_DETAILS_DATA },
    flySpeed: { ...DEFAULT_SPEED_DETAILS_DATA },
    swimSpeed: { ...DEFAULT_SPEED_DETAILS_DATA },
    armorSpeedPenalty_base: 0,
    armorSpeedPenalty_miscModifier: 0,
    loadSpeedPenalty_base: 0,
    loadSpeedPenalty_miscModifier: 0,
    classSpecificChoices: [],
    powerAttackValue: 0,
    combatExpertiseValue: 0,
  };

  return initialCharacterData;
}
