
import constantsData from '@/data/dnd-constants.json';

export interface CharacterClass {
  id: string;
  className: string;
  level: number;
}

export interface Skill {
  id: string;
  name: string;
  ranks: number; // Allows for 0.5 ranks for cross-class
  miscModifier: number;
  abilityModifier?: number; // Calculated, not stored directly if always derived
  totalBonus?: number; // Calculated
  keyAbility?: AbilityName; // e.g. 'STR', 'DEX'
  isClassSkill?: boolean; // To determine max ranks
}

export interface Feat {
  id: string;
  name: string;
  description?: string;
}

export interface Item {
  id: string;
  name: string;
  quantity: number;
  description?: string;
  weight?: number;
}

export type AbilityName = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';
const ABILITY_ORDER: AbilityName[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];


export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface SavingThrows {
  fortitude: { base: number; magicMod: number; miscMod: number; total?: number, abilityMod?: number };
  reflex: { base: number; magicMod: number; miscMod: number; total?: number, abilityMod?: number };
  will: { base: number; magicMod: number; miscMod: number; total?: number, abilityMod?: number };
}

export interface Character {
  id: string;
  name: string;
  race: string; // This will correspond to DndRace values
  alignment: string; // This will correspond to CharacterAlignment values
  deity?: string;
  size: string; // This will correspond to CharacterSize values
  age: number;
  gender: string;
  
  abilityScores: AbilityScores;
  hp: number;
  maxHp: number;
  
  armorBonus: number;
  shieldBonus: number;
  sizeModifierAC: number;
  naturalArmor: number;
  deflectionBonus: number;
  dodgeBonus: number;
  acMiscModifier: number;

  initiativeMiscModifier: number;
  savingThrows: SavingThrows;

  classes: CharacterClass[];
  skills: Skill[];
  feats: Feat[];
  inventory: Item[];
  personalStory?: string;
  portraitDataUrl?: string;
}

export const DEFAULT_ABILITIES: AbilityScores = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
};

export const DEFAULT_SAVING_THROWS: SavingThrows = {
  fortitude: { base: 0, magicMod: 0, miscMod: 0 },
  reflex: { base: 0, magicMod: 0, miscMod: 0 },
  will: { base: 0, magicMod: 0, miscMod: 0 },
};

// --- Types derived from JSON structure (or strongly typed if possible) ---
export type CharacterSize = typeof constantsData.SIZES_DATA[number];
export const SIZES: readonly CharacterSize[] = constantsData.SIZES_DATA;

export type CharacterAlignment = typeof constantsData.ALIGNMENTS_DATA[number];
export const ALIGNMENTS: readonly CharacterAlignment[] = constantsData.ALIGNMENTS_DATA;

export type DndRace = typeof constantsData.DND_RACES_DATA[number]['value'];
export const DND_RACES: ReadonlyArray<{value: DndRace, label: string}> = constantsData.DND_RACES_DATA as ReadonlyArray<{value: DndRace, label: string}>;

export type DndClass = typeof constantsData.DND_CLASSES_DATA[number]['value'];
export const DND_CLASSES: ReadonlyArray<{value: DndClass, label: string, hitDice: string}> = constantsData.DND_CLASSES_DATA as ReadonlyArray<{value: DndClass, label: string, hitDice: string}>;

export const GENDERS: ReadonlyArray<{value: string, label: string}> = constantsData.GENDERS_DATA;
export const DND_DEITIES: ReadonlyArray<{value: string, label: string}> = constantsData.DND_DEITIES_DATA;


// --- Skills (Remains in TS for now) ---
export const ALL_SKILLS_3_5: Omit<Skill, 'id' | 'ranks' | 'miscModifier' | 'totalBonus' | 'abilityModifier' | 'isClassSkill'>[] = [
  { name: "Appraise", keyAbility: "intelligence" },
  { name: "Balance", keyAbility: "dexterity" },
  { name: "Bluff", keyAbility: "charisma" },
  { name: "Climb", keyAbility: "strength" },
  { name: "Concentration", keyAbility: "constitution" },
  { name: "Craft (Alchemy)", keyAbility: "intelligence" },
  { name: "Craft (Armorsmithing)", keyAbility: "intelligence" },
  { name: "Craft (Bowmaking)", keyAbility: "intelligence" },
  { name: "Craft (Weaponsmithing)", keyAbility: "intelligence" },
  { name: "Craft (Trapmaking)", keyAbility: "intelligence" },
  { name: "Decipher Script", keyAbility: "intelligence" },
  { name: "Diplomacy", keyAbility: "charisma" },
  { name: "Disable Device", keyAbility: "intelligence" },
  { name: "Disguise", keyAbility: "charisma" },
  { name: "Escape Artist", keyAbility: "dexterity" },
  { name: "Forgery", keyAbility: "intelligence" },
  { name: "Gather Information", keyAbility: "charisma" },
  { name: "Handle Animal", keyAbility: "charisma" },
  { name: "Heal", keyAbility: "wisdom" },
  { name: "Hide", keyAbility: "dexterity" },
  { name: "Intimidate", keyAbility: "charisma" },
  { name: "Jump", keyAbility: "strength" },
  { name: "Knowledge (Arcana)", keyAbility: "intelligence" },
  { name: "Knowledge (Architecture & Engineering)", keyAbility: "intelligence" },
  { name: "Knowledge (Dungeoneering)", keyAbility: "intelligence" },
  { name: "Knowledge (Geography)", keyAbility: "intelligence" },
  { name: "Knowledge (History)", keyAbility: "intelligence" },
  { name: "Knowledge (Local)", keyAbility: "intelligence" },
  { name: "Knowledge (Nature)", keyAbility: "intelligence" },
  { name: "Knowledge (Nobility & Royalty)", keyAbility: "intelligence" },
  { name: "Knowledge (Religion)", keyAbility: "intelligence" },
  { name: "Knowledge (The Planes)", keyAbility: "intelligence" },
  { name: "Listen", keyAbility: "wisdom" },
  { name: "Move Silently", keyAbility: "dexterity" },
  { name: "Open Lock", keyAbility: "dexterity" },
  { name: "Perform (Act)", keyAbility: "charisma" },
  { name: "Perform (Sing)", keyAbility: "charisma" },
  { name: "Perform (Dance)", keyAbility: "charisma" },
  { name: "Profession (Herbalist)", keyAbility: "wisdom" },
  { name: "Ride", keyAbility: "dexterity" },
  { name: "Search", keyAbility: "intelligence" },
  { name: "Sense Motive", keyAbility: "wisdom" },
  { name: "Sleight of Hand", keyAbility: "dexterity" },
  { name: "Spellcraft", keyAbility: "intelligence" },
  { name: "Spot", keyAbility: "wisdom" },
  { name: "Survival", keyAbility: "wisdom" },
  { name: "Swim", keyAbility: "strength" },
  { name: "Tumble", keyAbility: "dexterity" },
  { name: "Use Magic Device", keyAbility: "charisma" },
  { name: "Use Rope", keyAbility: "dexterity" },
];

// --- Aging Effects ---
export type RaceCategory = keyof typeof constantsData.DND_RACE_AGING_EFFECTS_DATA;

interface AgeCategoryEffectData {
  categoryName: string;
  ageFactor: number;
  effects: Partial<Record<AbilityName, number>>;
}

interface RaceAgingInfoData {
  categories: AgeCategoryEffectData[];
}

export interface AgingEffectsDetails {
  categoryName: string;
  effects: Array<{ ability: AbilityName; change: number }>;
}

export function getNetAgingEffects(raceValue: DndRace, age: number): AgingEffectsDetails {
  const raceVenerableAge = (constantsData.DND_RACE_BASE_MAX_AGE_DATA as Record<DndRace, number>)[raceValue];
  if (raceVenerableAge === undefined) return { categoryName: "Adult", effects: [] };

  const agingCategoryKey = (constantsData.RACE_TO_AGING_CATEGORY_MAP_DATA as Record<DndRace, RaceCategory>)[raceValue];
  if (!agingCategoryKey) return { categoryName: "Adult", effects: [] };
  
  const raceAgingPattern = (constantsData.DND_RACE_AGING_EFFECTS_DATA as Record<RaceCategory, RaceAgingInfoData>)[agingCategoryKey];
  if (!raceAgingPattern) return { categoryName: "Adult", effects: [] };

  let currentCategoryName: string = "Adult";
  let highestAttainedCategoryEffects: Partial<Record<AbilityName, number>> | null = null;

  const sortedCategories = [...raceAgingPattern.categories].sort((a, b) => a.ageFactor - b.ageFactor);


  for (const category of sortedCategories) {
    const ageThresholdForCategory = Math.floor(category.ageFactor * raceVenerableAge);
    if (age >= ageThresholdForCategory) {
      currentCategoryName = category.categoryName;
      highestAttainedCategoryEffects = category.effects; 
    } else {
      break;
    }
  }
  
  if (!highestAttainedCategoryEffects && age < Math.floor(sortedCategories[0].ageFactor * raceVenerableAge)) {
     currentCategoryName = "Adult";
     highestAttainedCategoryEffects = {}; 
  }


  const appliedEffects: Array<{ ability: AbilityName; change: number }> = [];
  if (highestAttainedCategoryEffects) {
    const abilitiesToProcess = (Object.keys(highestAttainedCategoryEffects) as AbilityName[])
      .filter(ability => highestAttainedCategoryEffects && highestAttainedCategoryEffects[ability] !== undefined && highestAttainedCategoryEffects[ability] !== 0);

    abilitiesToProcess.sort((aAbility, bAbility) => {
        const changeA = highestAttainedCategoryEffects![aAbility]!;
        const changeB = highestAttainedCategoryEffects![bAbility]!;
        const signA = Math.sign(changeA);
        const signB = Math.sign(changeB);

        if (signA !== signB) {
            return signA - signB; // Negative changes come before positive.
        }

        const indexA = ABILITY_ORDER.indexOf(aAbility);
        const indexB = ABILITY_ORDER.indexOf(bAbility);
        return indexA - indexB;
    });
    
    for (const ability of abilitiesToProcess) {
        appliedEffects.push({ ability, change: highestAttainedCategoryEffects![ability]! });
    }
  }

  return {
    categoryName: currentCategoryName,
    effects: appliedEffects,
  };
}


// --- Size Ability Score Modifiers ---
export interface SizeAbilityEffectsDetails {
  effects: Array<{ ability: AbilityName; change: number }>;
}

export function getSizeAbilityEffects(size: CharacterSize): SizeAbilityEffectsDetails {
  const mods = (constantsData.DND_SIZE_ABILITY_MODIFIERS_DATA as Record<CharacterSize, Partial<Record<AbilityName, number>>>)[size];
  const appliedEffects: Array<{ ability: AbilityName; change: number }> = [];

  if (mods) {
    const abilitiesToProcess = (Object.keys(mods) as AbilityName[])
      .filter(ability => mods[ability] !== undefined && mods[ability] !== 0);

    abilitiesToProcess.sort((aAbility, bAbility) => {
        const changeA = mods![aAbility]!;
        const changeB = mods![bAbility]!;
        const signA = Math.sign(changeA);
        const signB = Math.sign(changeB);

        if (signA !== signB) {
            return signA - signB;
        }

        const indexA = ABILITY_ORDER.indexOf(aAbility);
        const indexB = ABILITY_ORDER.indexOf(bAbility);
        return indexA - indexB;
    });

    for (const ability of abilitiesToProcess) {
      appliedEffects.push({ ability, change: mods[ability]! });
    }
  }
  return { effects: appliedEffects };
}

// --- Race Ability Score Modifiers ---
export interface RaceAbilityEffectsDetails {
  effects: Array<{ ability: AbilityName; change: number }>;
}

export function getRaceAbilityEffects(raceValue: DndRace): RaceAbilityEffectsDetails {
  const modifiers = (constantsData.DND_RACE_ABILITY_MODIFIERS_DATA as Record<DndRace, Partial<Record<AbilityName, number>>>)[raceValue];
  const appliedEffects: Array<{ ability: AbilityName; change: number }> = [];

  if (modifiers) {
    const abilitiesToProcess = (Object.keys(modifiers) as AbilityName[])
      .filter(ability => modifiers[ability] !== undefined && modifiers[ability] !== 0);
    
    abilitiesToProcess.sort((aAbility, bAbility) => {
        const changeA = modifiers![aAbility]!;
        const changeB = modifiers![bAbility]!;
        const signA = Math.sign(changeA);
        const signB = Math.sign(changeB);

        if (signA !== signB) {
            return signA - signB;
        }

        const indexA = ABILITY_ORDER.indexOf(aAbility);
        const indexB = ABILITY_ORDER.indexOf(bAbility);
        return indexA - indexB;
    });

    for (const ability of abilitiesToProcess) {
      appliedEffects.push({ ability, change: modifiers[ability]! });
    }
  }
  return { effects: appliedEffects };
}
