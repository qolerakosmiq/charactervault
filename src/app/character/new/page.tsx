
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
      title: translations?.UI_STRINGS.toastCharacterForgedTitle || "Character Forged!",
      description: (translations?.UI_STRINGS.toastCharacterForgedDescription || "{characterName} has been successfully created.").replace("{characterName}", newCharacter.name),
    });
    router.push(`/character/${newCharacter.id}`);
  };
  
  // Show a basic loading state if translations are not ready yet for critical UI elements (like CharacterFormCore)
  if (translationsLoading) {
      return (
          <div className="container mx-auto px-4 py-8 text-center">
              <p className="text-lg text-muted-foreground">Loading form...</p>
          </div>
      );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CharacterFormCore onSave={handleSaveCharacter} isCreating={true} />
    </div>
  );
}

    