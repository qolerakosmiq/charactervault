
'use client';

import { CharacterCard } from '@/components/CharacterCard';
import { Button } from '@/components/ui/button';
import { useCharacterStore } from '@/lib/character-store';
import { PlusCircle, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';

export default function CharacterDashboardPage() {
  const { characters, deleteCharacter, isLoading: isStoreLoading } = useCharacterStore();
  const { translations, isLoading: translationsLoading } = useI18n();

  const handleDeleteCharacter = (id: string) => {
    deleteCharacter(id);
  };

  const isLoading = isStoreLoading || translationsLoading;

  if (isLoading || !translations) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-border">
          <div className="flex items-center space-x-3 mb-4 sm:mb-0">
            <Users className="h-10 w-10 text-primary" />
            <Skeleton className="h-10 w-64" /> {/* Title Placeholder */}
          </div>
          <Skeleton className="h-12 w-56 rounded-md" /> {/* Button Placeholder */}
        </div>
        <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">
              {translations?.UI_STRINGS.dashboardLoadingCharacters || "Loading characters..."}
            </p>
        </div>
      </div>
    );
  }

  const { UI_STRINGS } = translations;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-border">
        <div className="flex items-center space-x-3 mb-4 sm:mb-0">
          <Users className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-serif font-bold">{UI_STRINGS.dashboardTitle}</h1>
        </div>
        <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
          <Link href="/character/new">
            <PlusCircle className="mr-2 h-5 w-5" /> {UI_STRINGS.dashboardButtonCreateNew}
          </Link>
        </Button>
      </div>

      {characters.length === 0 ? (
        <div className="text-center py-12">
          <Image 
            src="https://placehold.co/300x200.png" 
            alt={UI_STRINGS.dashboardImageAltEmptyScroll} 
            width={300} 
            height={200} 
            className="mx-auto mb-6 rounded-lg shadow-md"
            data-ai-hint="scroll map" 
          />
          <h2 className="text-2xl font-serif mb-2">{UI_STRINGS.dashboardEmptyStateTitle}</h2>
          <p className="text-muted-foreground mb-6">
            {UI_STRINGS.dashboardEmptyStateDescription}
          </p>
          <Button asChild size="lg">
            <Link href="/character/new">
              <PlusCircle className="mr-2 h-5 w-5" /> {UI_STRINGS.dashboardEmptyStateButtonStart}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map(character => (
            <CharacterCard
              key={character.id}
              character={character}
              onDelete={handleDeleteCharacter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

    