'use client';

import { CharacterFormCore } from '@/components/CharacterFormCore';
import type { Character } from '@/types/character';
import { useCharacterStore } from '@/lib/character-store';
import { useRouter } from 'next/navigation'; // Corrected import for App Router
import { useToast } from "@/hooks/use-toast";

export default function NewCharacterPage() {
  const { addCharacter } = useCharacterStore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSaveCharacter = (newCharacter: Character) => {
    addCharacter(newCharacter);
    toast({
      title: "Character Forged!",
      description: `${newCharacter.name} has been successfully created.`,
    });
    router.push(`/character/${newCharacter.id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <CharacterFormCore onSave={handleSaveCharacter} isCreating={true} />
    </div>
  );
}
