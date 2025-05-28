'use client';

import { CharacterCard } from '@/components/CharacterCard';
import { Button } from '@/components/ui/button';
import { useCharacterStore } from '@/lib/character-store';
import { PlusCircle, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function CharacterDashboardPage() {
  const { characters, deleteCharacter, isLoading } = useCharacterStore();

  const handleDeleteCharacter = (id: string) => {
    deleteCharacter(id);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-lg text-muted-foreground">Loading characters...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-border">
        <div className="flex items-center space-x-3 mb-4 sm:mb-0">
          <Users className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-serif font-bold">Your Adventurers</h1>
        </div>
        <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
          <Link href="/character/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Character
          </Link>
        </Button>
      </div>

      {characters.length === 0 ? (
        <div className="text-center py-12">
          <Image 
            src="https://placehold.co/300x200.png" 
            alt="Empty scroll" 
            width={300} 
            height={200} 
            className="mx-auto mb-6 rounded-lg shadow-md"
            data-ai-hint="scroll map" 
          />
          <h2 className="text-2xl font-serif mb-2">No adventurers yet!</h2>
          <p className="text-muted-foreground mb-6">
            Your saga awaits. Click "Create New Character" to begin an epic journey.
          </p>
          <Button asChild size="lg">
            <Link href="/character/new">
              <PlusCircle className="mr-2 h-5 w-5" /> Start Your First Adventure
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
