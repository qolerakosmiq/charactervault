
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
  { value: 'barbarian', label: 'Barbarian' },
  { value: 'bard', label: 'Bard' },
  { value: 'cleric', label: 'Cleric' },
  { value: 'druid', label: 'Druid' },
  { value: 'fighter', label: 'Fighter' },
  { value: 'monk', label: 'Monk' },
  { value: 'paladin', label: 'Paladin' },
  { value: 'ranger', label: 'Ranger' },
  { value: 'rogue', label: 'Rogue' },
  { value: 'sorcerer', label: 'Sorcerer' },
  { value: 'wizard', label: 'Wizard' },
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

