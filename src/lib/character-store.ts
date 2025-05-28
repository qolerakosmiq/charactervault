'use client';

import type { Character } from '@/types/character';
import { useState, useEffect, useCallback } from 'react';

const CHARACTERS_STORAGE_KEY = 'dnd35_characters_adventurers_armory';

function getCharactersFromStorage(): Character[] {
  if (typeof window === 'undefined') {
    return [];
  }
  const storedCharacters = localStorage.getItem(CHARACTERS_STORAGE_KEY);
  return storedCharacters ? JSON.parse(storedCharacters) : [];
}

function saveCharactersToStorage(characters: Character[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(CHARACTERS_STORAGE_KEY, JSON.stringify(characters));
}

export function useCharacterStore() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setCharacters(getCharactersFromStorage());
    setIsLoading(false);
  }, []);

  const addCharacter = useCallback((character: Character) => {
    const newCharacters = [...characters, character];
    setCharacters(newCharacters);
    saveCharactersToStorage(newCharacters);
  }, [characters]);

  const updateCharacter = useCallback((updatedCharacter: Character) => {
    const newCharacters = characters.map(char =>
      char.id === updatedCharacter.id ? updatedCharacter : char
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
    return characters.find(char => char.id === id);
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

// Non-hook versions for potential use where hooks are not suitable (e.g. server actions if we had them)
// These would require manual revalidation/refresh if used directly from client components expecting reactivity.
export function getAllCharacters(): Character[] {
  return getCharactersFromStorage();
}

export function getCharacter(id: string): Character | undefined {
  const characters = getCharactersFromStorage();
  return characters.find(char => char.id === id);
}

export function saveCharacter(character: Character): void {
  let characters = getCharactersFromStorage();
  const existingIndex = characters.findIndex(c => c.id === character.id);
  if (existingIndex > -1) {
    characters[existingIndex] = character;
  } else {
    characters.push(character);
  }
  saveCharactersToStorage(characters);
}

export function removeCharacter(id: string): void {
  let characters = getCharactersFromStorage();
  characters = characters.filter(c => c.id !== id);
  saveCharactersToStorage(characters);
}
