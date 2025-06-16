
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

  const totalLevel = character.classes.reduce((sum, c) => sum + c.level, 0) || 1;

  let alignmentLabelForDisplay: string;
  let sizeLabelForDisplay: string;
  let characterClassNameForDisplay: string;
  let raceLabelForDisplay: string;

  if (translationsLoading || !translations?.UI_STRINGS || !translations.ALIGNMENTS || !translations.SIZES || !translations.DND_CLASSES || !translations.DND_RACES) {
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

  const alignmentData = translations.ALIGNMENTS.find(a => a.id === character.alignment);
  if (character.alignment && !alignmentData) {
    throw new Error(`[DATA_ERROR] Alignment definition not found for ID: ${character.alignment} on character ${character.id}`);
  }
  alignmentLabelForDisplay = alignmentData ? alignmentData.label : UI_STRINGS.alignmentNotSet;

  const sizeData = translations.SIZES.find(s => s.id === character.size);
   if (character.size && !sizeData) {
    throw new Error(`[DATA_ERROR] Size definition not found for ID: ${character.size} on character ${character.id}`);
  }
  sizeLabelForDisplay = sizeData ? sizeData.label : UI_STRINGS.sizeNotSet;

  if (character.classes[0]?.className) {
    const classDef = translations.DND_CLASSES.find(c => c.id === character.classes[0].className);
    if (!classDef) {
        throw new Error(`[DATA_ERROR] Class definition not found for ID: ${character.classes[0].className} on character ${character.id}`);
    }
    characterClassNameForDisplay = classDef.label;
  } else {
    characterClassNameForDisplay = UI_STRINGS.classNotSet;
  }

  const raceData = translations.DND_RACES.find(r => r.id === character.race);
  if (character.race && !raceData) {
    throw new Error(`[DATA_ERROR] Race definition not found for ID: ${character.race} on character ${character.id}`);
  }
  raceLabelForDisplay = raceData ? raceData.label : UI_STRINGS.raceNotSet;


  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
      <CardHeader className="bg-muted/30 p-4">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-xl font-serif">{character.name}</CardTitle>
            <CardDescription className="text-sm">
              {raceLabelForDisplay} - {UI_STRINGS.levelLabel} {totalLevel} {characterClassNameForDisplay} {character.classes[0]?.level}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="space-y-1 text-sm">
          <p><span className="font-semibold">{UI_STRINGS.alignmentLabel}:</span> {alignmentLabelForDisplay}</p>
          {character.deity && <p><span className="font-semibold">{UI_STRINGS.deityLabel}:</span> {character.deity}</p>}
          <p><span className="font-semibold">{UI_STRINGS.sizeLabel}:</span> {sizeLabelForDisplay}</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-muted/30 border-t">
        <div className="flex w-full justify-end space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/character/${character.id}`}>
              <FilePenLine className="mr-2 h-4 w-4" /> {UI_STRINGS.characterCardViewEditButton}
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" /> {UI_STRINGS.characterCardDeleteButton}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{UI_STRINGS.alertDialogDeleteCharacterTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                  {(UI_STRINGS.alertDialogDeleteCharacterDescription).replace("{characterName}", character.name)}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{UI_STRINGS.alertDialogDeleteCharacterCancelButton}</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(character.id)}>
                  {UI_STRINGS.alertDialogDeleteCharacterConfirmButton}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}
