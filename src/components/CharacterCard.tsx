
'use client';

import type { Character } from '@/types/character-core'; // Use character-core
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePenLine, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';

interface CharacterCardProps {
  character: Character;
  onDelete: (id: string) => void;
}

export function CharacterCard({ character, onDelete }: CharacterCardProps) {
  const { translations, isLoading: translationsLoading } = useI18n();

  const primaryClass = character.classes[0] ? `${character.classes[0].className} ${character.classes[0].level}` : 'N/A';
  const totalLevel = character.classes.reduce((sum, c) => sum + c.level, 0) || 1;

  const alignmentLabel = translations && !translationsLoading && character.alignment
    ? translations.ALIGNMENTS.find(a => a.value === character.alignment)?.label || character.alignment
    : character.alignment;
  const sizeLabel = translations && !translationsLoading && character.size
    ? translations.SIZES.find(s => s.value === character.size)?.label || character.size
    : character.size;
  
  const characterClassName = translations && !translationsLoading && character.classes[0]?.className
    ? translations.DND_CLASSES.find(c => c.value === character.classes[0].className)?.label || character.classes[0].className
    : character.classes[0]?.className;
  
  const raceLabel = translations && !translationsLoading && character.race
    ? translations.DND_RACES.find(r => r.value === character.race)?.label || character.race
    : character.race;


  if (translationsLoading || !translations?.UI_STRINGS) {
    return (
      <Card className="flex flex-col overflow-hidden shadow-lg">
        <CardHeader className="bg-muted/30 p-4">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <Skeleton className="h-6 w-32 mb-1" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <div className="space-y-2 text-sm">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </CardContent>
        <CardFooter className="p-4 bg-muted/30 border-t">
          <div className="flex w-full justify-end space-x-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </CardFooter>
      </Card>
    );
  }
  const { UI_STRINGS } = translations;


  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
      <CardHeader className="bg-muted/30 p-4">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-xl font-serif">{character.name}</CardTitle>
            <CardDescription className="text-sm">
              {raceLabel} - {UI_STRINGS.levelLabel || "Level"} {totalLevel} {characterClassName} {character.classes[0]?.level}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="space-y-1 text-sm">
          <p><span className="font-semibold">{UI_STRINGS.alignmentLabel || "Alignment"}:</span> {alignmentLabel}</p>
          {character.deity && <p><span className="font-semibold">{UI_STRINGS.deityLabel || "Deity"}:</span> {character.deity}</p>}
          <p><span className="font-semibold">{UI_STRINGS.sizeLabel || "Size"}:</span> {sizeLabel}</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-muted/30 border-t">
        <div className="flex w-full justify-end space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/character/${character.id}`}>
              <FilePenLine className="mr-2 h-4 w-4" /> {UI_STRINGS.characterCardViewEditButton || "View/Edit"}
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" /> {UI_STRINGS.characterCardDeleteButton || "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{UI_STRINGS.alertDialogDeleteCharacterTitle || "Are you sure?"}</AlertDialogTitle>
                <AlertDialogDescription>
                  {(UI_STRINGS.alertDialogDeleteCharacterDescription || "This action cannot be undone. This will permanently delete the character \"{characterName}\".").replace("{characterName}", character.name)}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{UI_STRINGS.alertDialogDeleteCharacterCancelButton || "Cancel"}</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(character.id)}>
                  {UI_STRINGS.alertDialogDeleteCharacterConfirmButton || "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}
