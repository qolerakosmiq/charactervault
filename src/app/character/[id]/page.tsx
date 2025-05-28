'use client';

import { CharacterSheetTabs } from '@/components/character-sheet/CharacterSheetTabs';
import { useCharacterStore } from '@/lib/character-store';
import { useParams, useRouter } from 'next/navigation'; // Corrected import for App Router
import type { Character } from '@/types/character';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function CharacterSheetPage() {
  const params = useParams();
  const router = useRouter();
  const { getCharacterById, updateCharacter, deleteCharacter, isLoading: isStoreLoading } = useCharacterStore();
  
  const [character, setCharacter] = useState<Character | null | undefined>(undefined); // undefined for initial, null if not found

  const characterId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    if (characterId && !isStoreLoading) {
      const foundCharacter = getCharacterById(characterId);
      setCharacter(foundCharacter || null); // Set to null if not found after loading
    }
  }, [characterId, getCharacterById, isStoreLoading]);

  const handleSave = (updatedChar: Character) => {
    updateCharacter(updatedChar);
    setCharacter(updatedChar); // Update local state to reflect save immediately
  };

  const handleDelete = (id: string) => {
    deleteCharacter(id);
    router.push('/');
  };

  if (isStoreLoading || character === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-full" /> {/* Tabs List */}
        <Skeleton className="h-96 w-full" /> {/* Tab Content Area */}
      </div>
    );
  }

  if (character === null) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-serif font-bold text-destructive mb-4">Character Not Found</h1>
        <p className="text-muted-foreground">The requested character does not exist or could not be loaded.</p>
        <Button onClick={() => router.push('/')} className="mt-6">
          Back to Dashboard
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
