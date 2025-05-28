'use client';

import type { Character } from '@/types/character';
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

interface CharacterCardProps {
  character: Character;
  onDelete: (id: string) => void;
}

export function CharacterCard({ character, onDelete }: CharacterCardProps) {
  const primaryClass = character.classes[0] ? `${character.classes[0].className} ${character.classes[0].level}` : 'N/A';
  const totalLevel = character.classes.reduce((sum, c) => sum + c.level, 0) || 1;

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
      <CardHeader className="bg-muted/30 p-4">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-xl font-serif">{character.name}</CardTitle>
            <CardDescription className="text-sm">
              {character.race} - Level {totalLevel} {primaryClass}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="space-y-1 text-sm">
          <p><span className="font-semibold">Alignment:</span> {character.alignment}</p>
          {character.deity && <p><span className="font-semibold">Deity:</span> {character.deity}</p>}
          <p><span className="font-semibold">Size:</span> {character.size}</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-muted/30 border-t">
        <div className="flex w-full justify-end space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/character/${character.id}`}>
              <FilePenLine className="mr-2 h-4 w-4" /> View/Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the character "{character.name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(character.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}
