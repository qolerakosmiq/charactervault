

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
  race: string;
  alignment: string;
  deity?: string;
  size: string; // e.g., 'Medium', 'Small'
  age: number;
  gender: string;
  
  // Basic Stats
  abilityScores: AbilityScores;

  // Combat Stats
  hp: number; // Current Hit Points
  maxHp: number; // Max Hit Points
  
  // AC Components
  armorBonus: number;
  shieldBonus: number;
  sizeModifierAC: number; // Based on 'size'
  naturalArmor: number;
  deflectionBonus: number;
  dodgeBonus: number;
  acMiscModifier: number;

  // Initiative
  initiativeMiscModifier: number;

  // Base Attack Bonus - array for multiple attacks if needed by class/level prog.
  // For simplicity, classes will define this. Let's assume it's calculated and not stored directly on character model,
  // but derived from classes. Or, if we must store it, it needs to be updated when class/level changes.
  // For now, this will be dynamically calculated.
  
  // Saving throws - base saves are often from class/level
  savingThrows: SavingThrows;

  // Relations
  classes: CharacterClass[];
  skills: Skill[];
  feats: Feat[];
  inventory: Item[];
  // Spells - Placeholder for future
  // spells: any[]; 
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

export const SIZES = ['Fine', 'Diminutive', 'Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan', 'Colossal'] as const;
export type CharacterSize = typeof SIZES[number];

export const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'
] as const;
export type CharacterAlignment = typeof ALIGNMENTS[number];

export const DND_RACES = [
  { value: 'human', label: 'Human' },
  { value: 'elf', label: 'Elf' },
  { value: 'dwarf', label: 'Dwarf' },
  { value: 'halfling', label: 'Halfling' },
  { value: 'gnome', label: 'Gnome' },
  { value: 'half-elf', label: 'Half-Elf' },
  { value: 'half-orc', label: 'Half-Orc' },
] as const;
export type DndRace = typeof DND_RACES[number]['value'];

export const DND_CLASSES = [
  { value: 'barbarian', label: 'Barbarian', hitDice: 'd12' },
  { value: 'bard', label: 'Bard', hitDice: 'd6' },
  { value: 'cleric', label: 'Cleric', hitDice: 'd8' },
  { value: 'druid', label: 'Druid', hitDice: 'd8' },
  { value: 'fighter', label: 'Fighter', hitDice: 'd10' },
  { value: 'monk', label: 'Monk', hitDice: 'd8' },
  { value: 'paladin', label: 'Paladin', hitDice: 'd10' },
  { value: 'ranger', label: 'Ranger', hitDice: 'd8' },
  { value: 'rogue', label: 'Rogue', hitDice: 'd6' },
  { value: 'sorcerer', label: 'Sorcerer', hitDice: 'd4' },
  { value: 'wizard', label: 'Wizard', hitDice: 'd4' },
] as const;
export type DndClass = typeof DND_CLASSES[number]['value'];


// Add default D&D 3.5 skills
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
  // Add other craft specializations as needed
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
  // Add other perform specializations
  { name: "Profession (Herbalist)", keyAbility: "wisdom" },
  // Add other profession specializations
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

// D&D 3.5 Aging Effects

export type RaceCategory = 'human' | 'dwarf' | 'elf' | 'gnome' | 'halfling' | 'orc';

export const DND_RACE_BASE_MAX_AGE: Record<DndRace, number> = {
  'human': 70,    // Venerable age for Human (max age 70 + 2d20)
  'elf': 350,     // Venerable age for Elf (max age 350 + 4d%)
  'dwarf': 250,   // Venerable age for Dwarf (max age 250 + 2d%)
  'halfling': 100, // Venerable age for Halfling (max age 100 + 2d20)
  'gnome': 200,   // Venerable age for Gnome (max age 200 + 3d%)
  'half-elf': 125,// Venerable age for Half-Elf (max age 125 + 3d20)
  'half-orc': 60, // Venerable age for Half-Orc (max age 60 + 2d10)
};

export const RACE_TO_AGING_CATEGORY_MAP: Record<DndRace, RaceCategory> = {
  'human': 'human',
  'elf': 'elf',
  'dwarf': 'dwarf',
  'halfling': 'halfling',
  'gnome': 'gnome',
  'half-elf': 'elf',   // Half-elves use elf aging pattern (effects), but with their own baseMaxAge and ageFactors derived from it
  'half-orc': 'orc',   // Half-orcs use orc aging pattern (effects), with their own baseMaxAge and ageFactors
};

interface AgeCategoryEffect {
  categoryName: 'Middle Age' | 'Old' | 'Venerable';
  ageFactor: number; // Factor of the race's venerable age (from DND_RACE_BASE_MAX_AGE) to determine threshold
  effects: Partial<Record<AbilityName, number>>; // Total ability adjustments for this category
}

interface RaceAgingInfo {
  categories: AgeCategoryEffect[];
}

// --- Effects for Standard Humanoids (Human, Dwarf, Gnome, Halfling, Orc, Half-Orc based on PHB p.109) ---
// These are TOTAL adjustments for reaching this age category.
const HUMANOID_MIDDLE_EFFECTS: Partial<Record<AbilityName, number>> = { strength: -1, dexterity: -1, constitution: -1, intelligence: 1, wisdom: 1, charisma: 1 };
const HUMANOID_OLD_EFFECTS: Partial<Record<AbilityName, number>> =    { strength: -2, dexterity: -2, constitution: -2, intelligence: 1, wisdom: 1, charisma: 1 };
const HUMANOID_VENERABLE_EFFECTS: Partial<Record<AbilityName, number>> = { strength: -3, dexterity: -3, constitution: -3, intelligence: 1, wisdom: 1, charisma: 1 };

// --- Effects for Elves (and Half-Elves, based on PHB p.109) ---
// These are TOTAL adjustments for reaching this age category.
const ELF_MIDDLE_EFFECTS: Partial<Record<AbilityName, number>> = { intelligence: 1, wisdom: 1, charisma: 1 }; // No physical penalty
const ELF_OLD_EFFECTS: Partial<Record<AbilityName, number>> =    { strength: -1, dexterity: -1, constitution: -1, intelligence: 2, wisdom: 2, charisma: 2 };
const ELF_VENERABLE_EFFECTS: Partial<Record<AbilityName, number>> = { strength: -2, dexterity: -2, constitution: -2, intelligence: 3, wisdom: 3, charisma: 3 };


export const DND_RACE_AGING_EFFECTS: Record<RaceCategory, RaceAgingInfo> = {
  human: { // Used for Human
    categories: [ // Age thresholds derived from Human venerable age (70)
      { categoryName: 'Middle Age', ageFactor: 35/70, effects: HUMANOID_MIDDLE_EFFECTS },
      { categoryName: 'Old', ageFactor: 53/70, effects: HUMANOID_OLD_EFFECTS },
      { categoryName: 'Venerable', ageFactor: 70/70, effects: HUMANOID_VENERABLE_EFFECTS },
    ],
  },
  elf: { // Used for Elf, Half-Elf
    categories: [ // Age thresholds derived from Elf/Half-Elf venerable age (e.g., Elf 350, Half-Elf 125)
      { categoryName: 'Middle Age', ageFactor: 175/350, effects: ELF_MIDDLE_EFFECTS }, // Elf: 175. Half-Elf: 125* (175/350) = 62.5
      { categoryName: 'Old', ageFactor: 263/350, effects: ELF_OLD_EFFECTS },       // Elf: 263. Half-Elf: 125* (263/350) = 93.9
      { categoryName: 'Venerable', ageFactor: 350/350, effects: ELF_VENERABLE_EFFECTS }, // Elf: 350. Half-Elf: 125* (350/350) = 125
    ],
  },
  dwarf: {
    categories: [ // Age thresholds derived from Dwarf venerable age (250)
      { categoryName: 'Middle Age', ageFactor: 125/250, effects: HUMANOID_MIDDLE_EFFECTS },
      { categoryName: 'Old', ageFactor: 188/250, effects: HUMANOID_OLD_EFFECTS },
      { categoryName: 'Venerable', ageFactor: 250/250, effects: HUMANOID_VENERABLE_EFFECTS },
    ],
  },
  gnome: {
     categories: [ // Age thresholds derived from Gnome venerable age (200)
      { categoryName: 'Middle Age', ageFactor: 100/200, effects: HUMANOID_MIDDLE_EFFECTS },
      { categoryName: 'Old', ageFactor: 150/200, effects: HUMANOID_OLD_EFFECTS },
      { categoryName: 'Venerable', ageFactor: 200/200, effects: HUMANOID_VENERABLE_EFFECTS },
    ],
  },
  halfling: {
     categories: [ // Age thresholds derived from Halfling venerable age (100)
      { categoryName: 'Middle Age', ageFactor: 50/100, effects: HUMANOID_MIDDLE_EFFECTS },
      { categoryName: 'Old', ageFactor: 75/100, effects: HUMANOID_OLD_EFFECTS },
      { categoryName: 'Venerable', ageFactor: 100/100, effects: HUMANOID_VENERABLE_EFFECTS },
    ],
  },
  orc: { // Used for Orc, Half-Orc
    categories: [ // Age thresholds derived from Orc/Half-Orc venerable age (e.g. Half-Orc 60)
      { categoryName: 'Middle Age', ageFactor: 30/60, effects: HUMANOID_MIDDLE_EFFECTS },
      { categoryName: 'Old', ageFactor: 45/60, effects: HUMANOID_OLD_EFFECTS },
      { categoryName: 'Venerable', ageFactor: 60/60, effects: HUMANOID_VENERABLE_EFFECTS },
    ],
  }
};

export function getNetAgingEffects(race: DndRace, age: number): { netEffects: Partial<AbilityScores>, description: string } {
  const raceVenerableAge = DND_RACE_BASE_MAX_AGE[race];
  if (raceVenerableAge === undefined) return { netEffects: {}, description: "Unknown race for max age." };

  const agingCategoryKey = RACE_TO_AGING_CATEGORY_MAP[race];
  if (!agingCategoryKey) return { netEffects: {}, description: "Unknown race for aging category map." };

  const raceAgingPattern = DND_RACE_AGING_EFFECTS[agingCategoryKey];
  if (!raceAgingPattern) return { netEffects: {}, description: "No aging data pattern for this race category." };

  let netEffects: Partial<AbilityScores> = {};
  let currentCategoryName: string = "Adult"; // Default if no category met or below first threshold
  let highestAttainedCategoryEffects: Partial<AbilityScores> | null = null;

  // Iterate through categories (assuming they are ordered: Middle, Old, Venerable)
  for (const category of raceAgingPattern.categories) {
    const ageThresholdForCategory = Math.floor(category.ageFactor * raceVenerableAge);
    if (age >= ageThresholdForCategory) {
      currentCategoryName = category.categoryName;
      highestAttainedCategoryEffects = category.effects; // Overwrite with effects of the latest met category
    } else {
      // Since categories are ordered, if this one isn't met, subsequent (older) ones won't be.
      break; 
    }
  }

  if (highestAttainedCategoryEffects) {
    netEffects = { ...highestAttainedCategoryEffects };
  }

  let effectDescriptions: string[] = [];
  (Object.keys(netEffects) as AbilityName[]).forEach(ability => {
    const val = netEffects[ability];
    if (val !== 0 && val !== undefined) {
      effectDescriptions.push(`${ability.substring(0,3).toUpperCase()} ${val! > 0 ? '+' : ''}${val}`);
    }
  });
  
  const baseDescription = currentCategoryName === "Adult" && effectDescriptions.length === 0 
    ? "" // No effects, still considered adult for description purposes unless a category is hit.
    : `${currentCategoryName}.`;

  if (effectDescriptions.length === 0 && currentCategoryName !== "Adult") {
     return { netEffects, description: `${currentCategoryName}. No ability score changes.` };
  }
  if (effectDescriptions.length === 0) { // Covers adult with no effects, or category with no effects
     return { netEffects, description: baseDescription.trim() };
  }

  return {
    netEffects,
    description: `${baseDescription} Effects: ${effectDescriptions.join(', ')}.`
  };
}
