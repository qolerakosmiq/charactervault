
'use client';

import type { Character, AbilityScores, SavingThrows, ResistanceValue, SpeedDetails, CharacterClass, Skill, CharacterFeatInstance, Item, DamageReductionInstance, LanguageId } from '@/types/character';
import { useState, useEffect, useCallback } from 'react';

const CHARACTERS_STORAGE_KEY = 'dnd35_characters_adventurers_armory';

// Define a comprehensive default for a Character object
const FULL_CHARACTER_DEFAULTS: Omit<Character, 'id'> = {
  name: 'New Character',
  playerName: '',
  campaign: '',
  homeland: '',
  race: '',
  alignment: 'true-neutral',
  deity: '',
  size: 'medium',
  age: 20,
  gender: '',
  height: '',
  weight: '',
  eyes: '',
  hair: '',
  skin: '',
  languages: [], // Added languages default
  abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
  abilityScoreTempCustomModifiers: { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 },
  hp: 10,
  maxHp: 10,
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
  grappleDamage_baseNotes: '1d3', // Generic default, UI should update based on actual size
  grappleDamage_bonus: 0,
  savingThrows: {
    fortitude: { base: 0, magicMod: 0, miscMod: 0 },
    reflex: { base: 0, magicMod: 0, miscMod: 0 },
    will: { base: 0, magicMod: 0, miscMod: 0 },
  },
  classes: [], // Will be populated with at least one class entry
  skills: [],
  feats: [],
  inventory: [],
  personalStory: '',
  portraitDataUrl: undefined,
  fireResistance: { base: 0, customMod: 0 },
  coldResistance: { base: 0, customMod: 0 },
  acidResistance: { base: 0, customMod: 0 },
  electricityResistance: { base: 0, customMod: 0 },
  sonicResistance: { base: 0, customMod: 0 },
  spellResistance: { base: 0, customMod: 0 },
  powerResistance: { base: 0, customMod: 0 },
  damageReduction: [],
  fortification: { base: 0, customMod: 0 },
  landSpeed: { base: 30, miscModifier: 0 },
  burrowSpeed: { base: 0, miscModifier: 0 },
  climbSpeed: { base: 0, miscModifier: 0 },
  flySpeed: { base: 0, miscModifier: 0 },
  swimSpeed: { base: 0, miscModifier: 0 },
  armorSpeedPenalty_base: 0,
  armorSpeedPenalty_miscModifier: 0,
  loadSpeedPenalty_base: 0,
  loadSpeedPenalty_miscModifier: 0,
};

function ensureCharacterDefaults(character: Partial<Character>): Character {
  const hydratedCharacter = { ...FULL_CHARACTER_DEFAULTS, ...character } as Character;

  // Ensure nested objects are also correctly defaulted or merged
  hydratedCharacter.abilityScores = { ...FULL_CHARACTER_DEFAULTS.abilityScores, ...(character.abilityScores || {}) };
  hydratedCharacter.abilityScoreTempCustomModifiers = { ...FULL_CHARACTER_DEFAULTS.abilityScoreTempCustomModifiers, ...(character.abilityScoreTempCustomModifiers || {}) };
  hydratedCharacter.savingThrows = {
    fortitude: { ...FULL_CHARACTER_DEFAULTS.savingThrows.fortitude, ...(character.savingThrows?.fortitude || {}) },
    reflex: { ...FULL_CHARACTER_DEFAULTS.savingThrows.reflex, ...(character.savingThrows?.reflex || {}) },
    will: { ...FULL_CHARACTER_DEFAULTS.savingThrows.will, ...(character.savingThrows?.will || {}) },
  };

  // Ensure nested objects for resistances and speeds
  const resistanceKeys: Array<keyof Pick<Character, 'fireResistance' | 'coldResistance' | 'acidResistance' | 'electricityResistance' | 'sonicResistance' | 'spellResistance' | 'powerResistance' | 'fortification'>> = ['fireResistance', 'coldResistance', 'acidResistance', 'electricityResistance', 'sonicResistance', 'spellResistance', 'powerResistance', 'fortification'];
  resistanceKeys.forEach(key => {
    hydratedCharacter[key] = { ...FULL_CHARACTER_DEFAULTS[key], ...(character[key] || {}) };
  });

  const speedKeys: Array<keyof Pick<Character, 'landSpeed' | 'burrowSpeed' | 'climbSpeed' | 'flySpeed' | 'swimSpeed'>> = ['landSpeed', 'burrowSpeed', 'climbSpeed', 'flySpeed', 'swimSpeed'];
  speedKeys.forEach(key => {
    hydratedCharacter[key] = { ...FULL_CHARACTER_DEFAULTS[key], ...(character[key] || {}) };
  });

  // Ensure arrays are at least empty arrays
  hydratedCharacter.classes = character.classes && character.classes.length > 0 ? character.classes : [{ id: crypto.randomUUID(), className: '', level: 1 }];
  hydratedCharacter.skills = character.skills || [];
  hydratedCharacter.feats = character.feats || [];
  hydratedCharacter.inventory = character.inventory || [];
  hydratedCharacter.damageReduction = character.damageReduction || [];
  hydratedCharacter.languages = character.languages || []; // Ensure languages is an array

  // Ensure all top-level keys from defaults are present
  for (const key of Object.keys(FULL_CHARACTER_DEFAULTS) as Array<keyof typeof FULL_CHARACTER_DEFAULTS>) {
    if (hydratedCharacter[key] === undefined) {
      (hydratedCharacter as any)[key] = FULL_CHARACTER_DEFAULTS[key];
    }
  }
  if (!hydratedCharacter.id) { // if a new partial object was passed without an id
    hydratedCharacter.id = crypto.randomUUID();
  }

  return hydratedCharacter;
}


function getCharactersFromStorage(): Character[] {
  if (typeof window === 'undefined') {
    return [];
  }
  const storedCharacters = localStorage.getItem(CHARACTERS_STORAGE_KEY);
  const parsedCharacters = storedCharacters ? JSON.parse(storedCharacters) : [];
  return parsedCharacters.map((char: Partial<Character>) => ensureCharacterDefaults(char));
}

function saveCharactersToStorage(characters: Character[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(CHARACTERS_STORAGE_KEY, JSON.stringify(characters.map(ensureCharacterDefaults)));
}

export function useCharacterStore() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setCharacters(getCharactersFromStorage());
    setIsLoading(false);
  }, []);

  const addCharacter = useCallback((character: Character) => {
    const hydratedCharacter = ensureCharacterDefaults(character);
    const newCharacters = [...characters, hydratedCharacter];
    setCharacters(newCharacters);
    saveCharactersToStorage(newCharacters);
  }, [characters]);

  const updateCharacter = useCallback((updatedCharacter: Character) => {
    const hydratedCharacter = ensureCharacterDefaults(updatedCharacter);
    const newCharacters = characters.map(char =>
      char.id === hydratedCharacter.id ? hydratedCharacter : char
    );
    setCharacters(newCharacters);
    saveCharactersToStorage(newCharacters);
  }, [characters]);

  const deleteCharacter = useCallback((characterId: string) => {
    const newCharacters = characters.filter(char => char.id !== characterId);
    setCharacters(newCharacters);
    saveCharactersToStorage(newCharacters);
  }, [characters]);

  const getCharacterById = useCallback((id: string): Character | undefined => {
    const found = characters.find(char => char.id === id);
    return found ? ensureCharacterDefaults(found) : undefined;
  }, [characters]);

  return {
    characters,
    isLoading,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    getCharacterById,
  };
}

// Non-hook versions
export function getAllCharacters(): Character[] {
  return getCharactersFromStorage();
}

export function getCharacter(id: string): Character | undefined {
  const characters = getCharactersFromStorage();
  const found = characters.find(char => char.id === id);
  return found ? ensureCharacterDefaults(found) : undefined;
}

export function saveCharacter(character: Character): void {
  let characters = getCharactersFromStorage();
  const hydratedCharacter = ensureCharacterDefaults(character);
  const existingIndex = characters.findIndex(c => c.id === hydratedCharacter.id);
  if (existingIndex > -1) {
    characters[existingIndex] = hydratedCharacter;
  } else {
    characters.push(hydratedCharacter);
  }
  saveCharactersToStorage(characters);
}

export function removeCharacter(id: string): void {
  let characters = getCharactersFromStorage();
  characters = characters.filter(c => c.id !== id);
  saveCharactersToStorage(characters);
}
