'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import Image from 'next/image';

export function SpellsListing() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <CardTitle className="font-serif">Spells</CardTitle>
        </div>
        <CardDescription>Manage your character's arcane and divine abilities.</CardDescription>
      </CardHeader>
      <CardContent className="text-center py-10">
        <Image 
          src="https://placehold.co/200x150.png" 
          alt="Spellbook" 
          width={200} 
          height={150} 
          className="mx-auto mb-4 rounded-md shadow-sm"
          data-ai-hint="spellbook magic" 
        />
        <h3 className="text-xl font-semibold text-muted-foreground">Spell Management Coming Soon!</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Soon you'll be able to track your known spells, prepared spells, and spell slots here.
        </p>
      </CardContent>
    </Card>
  );
}
