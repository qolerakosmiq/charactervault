
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { UserSquare2, Palette } from 'lucide-react';

interface CharacterFormStoryPortraitSectionProps {
  personalStory: string | undefined;
  portraitDataUrl: string | undefined;
  onPersonalStoryChange: (story: string) => void;
  onPortraitChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CharacterFormStoryPortraitSection({
  personalStory,
  portraitDataUrl,
  onPersonalStoryChange,
  onPortraitChange,
}: CharacterFormStoryPortraitSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <UserSquare2 className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-serif">
              Personal Story & Portrait
            </CardTitle>
            <CardDescription>
              Flesh out your character's background and appearance.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:items-stretch">
          <div className="md:col-span-1 space-y-2 flex flex-col">
            <Label htmlFor="portraitUpload">Character Portrait</Label>
            <div className="aspect-square w-full bg-muted rounded-md flex items-center justify-center relative overflow-hidden border border-border shadow-sm">
              {portraitDataUrl ? (
                <Image src={portraitDataUrl} alt="Character Portrait" fill style={{ objectFit: 'cover' }} />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Palette size={48} className="mb-2" />
                  <span className="text-sm">No portrait uploaded</span>
                </div>
              )}
            </div>
            <Input
              id="portraitUpload"
              type="file"
              accept="image/*"
              onChange={onPortraitChange}
              className="text-sm file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {!portraitDataUrl && (
              <div className="hidden">
                <Image src="https://placehold.co/300x300.png" alt="Portrait Placeholder" width={300} height={300} data-ai-hint="fantasy portrait" />
              </div>
            )}
          </div>

          <div className="md:col-span-2 space-y-2 flex flex-col">
            <Label htmlFor="personalStory">Personal Story</Label>
            <Textarea
              id="personalStory"
              name="personalStory"
              value={personalStory || ''}
              onChange={(e) => onPersonalStoryChange(e.target.value)}
              placeholder="Describe your character's history, motivations, personality, and defining moments..."
              className="min-h-[260px] md:flex-grow md:min-h-0"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
