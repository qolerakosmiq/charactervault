

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

interface AgeCategoryEffect {
  categoryName: 'Middle Age' | 'Old' | 'Venerable';
  ageAtCategory: (baseMaxAge: number) => number; // Function to calculate age threshold
  effects: Partial<Record<AbilityName, number>>;
}

interface RaceAgingInfo {
  baseMaxAge: number; // Approximate, as 3.5 uses random rolls for max age
  categories: AgeCategoryEffect[];
}

export const DND_RACE_AGING_EFFECTS: Record<RaceCategory, RaceAgingInfo> = {
  human: { // Also applies to Half-Elf, Half-Orc with human progression
    baseMaxAge: 70, // Example base for calculations, SRD uses 2d20+starting for max
    categories: [
      { categoryName: 'Middle Age', ageAtCategory: (base) => 35, effects: { strength: -1, dexterity: -1, constitution: -1, intelligence: 1, wisdom: 1, charisma: 1 } },
      { categoryName: 'Old', ageAtCategory: (base) => 53, effects: { strength: -2, dexterity: -2, constitution: -2, intelligence: 1, wisdom: 1, charisma: 1 } }, // Cumulative: total -3 phys, +2 mental
      { categoryName: 'Venerable', ageAtCategory: (base) => 70, effects: { strength: -3, dexterity: -3, constitution: -3, intelligence: 1, wisdom: 1, charisma: 1 } }, // Cumulative: total -6 phys, +3 mental
    ],
  },
  dwarf: {
    baseMaxAge: 250,
    categories: [
      { categoryName: 'Middle Age', ageAtCategory: (base) => 125, effects: { strength: -1, dexterity: -1, constitution: -1, intelligence: 1, wisdom: 1, charisma: 1 } },
      { categoryName: 'Old', ageAtCategory: (base) => 188, effects: { strength: -2, dexterity: -2, constitution: -2, intelligence: 1, wisdom: 1, charisma: 1 } },
      { categoryName: 'Venerable', ageAtCategory: (base) => 250, effects: { strength: -3, dexterity: -3, constitution: -3, intelligence: 1, wisdom: 1, charisma: 1 } },
    ],
  },
  elf: { // Elves are a bit different, they don't take physical penalties until very late
    baseMaxAge: 700, // Elves have very long lifespans
    categories: [
      // Elves reach middle age at 175, but don't suffer penalties. Old at 263, Venerable at 350.
      // For simplicity, we'll model that they just get mental bonuses for a long time, then penalties kick in.
      // This is a simplification of SRD rules where penalties kick in later.
      { categoryName: 'Middle Age', ageAtCategory: (base) => 175, effects: { intelligence: 1, wisdom: 1, charisma: 1 } }, // No physical penalty
      { categoryName: 'Old', ageAtCategory: (base) => 263, effects: { strength: -1, dexterity: -1, constitution: -1, intelligence: 2, wisdom: 2, charisma: 2 } }, // Now apply physical, mental are cumulative
      { categoryName: 'Venerable', ageAtCategory: (base) => 350, effects: { strength: -2, dexterity: -2, constitution: -2, intelligence: 3, wisdom: 3, charisma: 3 } }, // Cumulative
    ],
  },
  gnome: {
    baseMaxAge: 350,
    categories: [
      { categoryName: 'Middle Age', ageAtCategory: (base) => 100, effects: { strength: -1, dexterity: -1, constitution: -1, intelligence: 1, wisdom: 1, charisma: 1 } },
      { categoryName: 'Old', ageAtCategory: (base) => 150, effects: { strength: -2, dexterity: -2, constitution: -2, intelligence: 1, wisdom: 1, charisma: 1 } },
      { categoryName: 'Venerable', ageAtCategory: (base) => 200, effects: { strength: -3, dexterity: -3, constitution: -3, intelligence: 1, wisdom: 1, charisma: 1 } },
    ],
  },
  halfling: {
    baseMaxAge: 100,
    categories: [
      { categoryName: 'Middle Age', ageAtCategory: (base) => 50, effects: { strength: -1, dexterity: -1, constitution: -1, intelligence: 1, wisdom: 1, charisma: 1 } },
      { categoryName: 'Old', ageAtCategory: (base) => 75, effects: { strength: -2, dexterity: -2, constitution: -2, intelligence: 1, wisdom: 1, charisma: 1 } },
      { categoryName: 'Venerable', ageAtCategory: (base) => 100, effects: { strength: -3, dexterity: -3, constitution: -3, intelligence: 1, wisdom: 1, charisma: 1 } },
    ],
  },
  'half-orc': { // Uses Human aging table
    baseMaxAge: 60, // Shorter than human
    categories: DND_RACE_AGING_EFFECTS.human?.categories || [], // Reference Human if defined
  },
  // Note: Half-Elf typically uses Human aging table. This structure means 'human' is the default for them if mapped.
};

// Map specific races to broader aging categories
export const RACE_TO_AGING_CATEGORY_MAP: Record<DndRace, RaceCategory> = {
  'human': 'human',
  'elf': 'elf',
  'dwarf': 'dwarf',
  'halfling': 'halfling',
  'gnome': 'gnome',
  'half-elf': 'human', // Half-elves age like humans
  'half-orc': 'human', // Half-orcs age like humans (though often die earlier due to lifestyle)
};

export function getNetAgingEffects(race: DndRace, age: number): { netEffects: Partial<AbilityScores>, description: string } {
  const agingCategory = RACE_TO_AGING_CATEGORY_MAP[race];
  if (!agingCategory) return { netEffects: {}, description: "Unknown race for aging." };

  const raceAgingInfo = DND_RACE_AGING_EFFECTS[agingCategory];
  if (!raceAgingInfo) return { netEffects: {}, description: "No aging data for this race category." };

  const netEffects: Partial<AbilityScores> = {};
  let currentCategoryName: string = "Adult"; // Default if no category met

  // Iterate through categories and sum up effects if age threshold is met
  // D&D 3.5 rules state penalties are cumulative, bonuses are not (unless stated otherwise).
  // For simplicity in this model, we'll make the listed effects per category cumulative for penalties, and take the highest for bonuses.
  // More accurate 3.5: Physical penalties accumulate. Mental bonuses are fixed per category (e.g., Old gives +1 Int, not +1 on top of Middle Age's +1).
  // Let's adjust: physical penalties accumulate. Mental bonuses are the *highest value met*.

  let highestMentalBonuses: Partial<AbilityScores> = {};
  let cumulativePhysicalPenalties: Partial<AbilityScores> = {};

  for (const category of raceAgingInfo.categories) {
    if (age >= category.ageAtCategory(raceAgingInfo.baseMaxAge)) {
      currentCategoryName = category.categoryName;
      for (const [ability, change] of Object.entries(category.effects)) {
        const abilityKey = ability as AbilityName;
        if (change < 0) { // Physical penalty
          cumulativePhysicalPenalties[abilityKey] = (cumulativePhysicalPenalties[abilityKey] || 0) + change;
        } else if (change > 0) { // Mental bonus
          highestMentalBonuses[abilityKey] = Math.max(highestMentalBonuses[abilityKey] || 0, change);
        }
      }
    }
  }
  
  // Combine physical penalties and highest mental bonuses
  (Object.keys(cumulativePhysicalPenalties) as AbilityName[]).forEach(key => {
    netEffects[key] = (netEffects[key] || 0) + cumulativePhysicalPenalties[key]!;
  });
  (Object.keys(highestMentalBonuses) as AbilityName[]).forEach(key => {
    netEffects[key] = (netEffects[key] || 0) + highestMentalBonuses[key]!;
  });


  let effectDescriptions: string[] = [];
  (Object.keys(netEffects) as AbilityName[]).forEach(ability => {
    const val = netEffects[ability];
    if (val !== 0 && val !== undefined) {
      effectDescriptions.push(`${ability.substring(0,3).toUpperCase()} ${val! > 0 ? '+' : ''}${val}`);
    }
  });

  if (effectDescriptions.length === 0 && currentCategoryName !== "Adult") {
     return { netEffects, description: `${currentCategoryName}. No ability score changes.` };
  }
  if (effectDescriptions.length === 0) {
     return { netEffects, description: "" };
  }

  return {
    netEffects,
    description: `${currentCategoryName}. Effects: ${effectDescriptions.join(', ')}.`
  };
}

// Ensure 'half-orc' entry references human after DND_RACE_AGING_EFFECTS.human is defined
if (DND_RACE_AGING_EFFECTS.human) {
  DND_RACE_AGING_EFFECTS['half-orc'] = {
    ...DND_RACE_AGING_EFFECTS.human,
     baseMaxAge: 60, // Half-orcs have a shorter max age typically
  };
}

