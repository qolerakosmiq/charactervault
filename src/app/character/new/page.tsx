
'use client';

import { CharacterFormCore } from '@/components/CharacterFormCore';
import type { Character } from '@/types/character';
import { useCharacterStore } from '@/lib/character-store';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useI18n } from '@/context/I18nProvider';

export default function NewCharacterPage() {
  const { addCharacter } = useCharacterStore();
  const router = useRouter();
  const { toast } = useToast();
  const { translations, isLoading: translationsLoading } = useI18n();

  const handleSaveCharacter = (newCharacter: Character) => {
    addCharacter(newCharacter);
    toast({
      title: translations?.UI_STRINGS.toastCharacterForgedTitle,
      description: (translations?.UI_STRINGS.toastCharacterForgedDescription).replace("{characterName}", newCharacter.name),
    });
    router.push(`/character/${newCharacter.id}`);
  };
  
  if (translationsLoading || !translations) {
      return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CharacterFormCore onSave={handleSaveCharacter} />
    </div>
  );
}
