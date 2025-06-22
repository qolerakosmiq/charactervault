
'use client';

import { CharacterSheetTabs } from '@/components/character-sheet/CharacterSheetTabs';
import { useCharacterStore } from '@/lib/character-store';
import { useParams, useRouter } from 'next/navigation';
import type { Character } from '@/types/character';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nProvider';

export default function CharacterSheetPage() {
  const params = useParams();
  const router = useRouter();
  const { getCharacterById, updateCharacter, deleteCharacter, isLoading: isStoreLoading } = useCharacterStore();
  const { translations, isLoading: translationsLoading } = useI18n();
  
  const [character, setCharacter] = useState<Character | null | undefined>(undefined); // undefined for initial, null if not found

  const characterId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    if (characterId && !isStoreLoading && !translationsLoading) { // Wait for translations too
      const foundCharacter = getCharacterById(characterId);
      setCharacter(foundCharacter || null); 
    }
  }, [characterId, getCharacterById, isStoreLoading, translationsLoading]);

  const handleSave = (updatedChar: Character) => {
    updateCharacter(updatedChar);
    setCharacter(updatedChar); 
  };

  const handleDelete = (id: string) => {
    deleteCharacter(id);
    router.push('/');
  };

  if (!character || !translations) {
    return null;
  }
  const { UI_STRINGS } = translations;

  if (character === null) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-serif font-bold text-destructive mb-4">{UI_STRINGS.characterSheetNotFoundTitle}</h1>
        <p className="text-muted-foreground">{UI_STRINGS.characterSheetNotFoundDescription}</p>
        <Button onClick={() => router.push('/')} className="mt-6">
          {UI_STRINGS.characterSheetNotFoundBackButton}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CharacterSheetTabs 
        initialCharacter={character} 
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
