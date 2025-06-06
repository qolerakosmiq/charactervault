
'use client';

import *as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { UserSquare2, Palette, Loader2 } from 'lucide-react';
import type { Character } from '@/types/character';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';

const DEBOUNCE_DELAY = 400; // ms

interface CharacterFormStoryPortraitSectionProps {
  character: Pick<Character, 'campaign' | 'personalStory' | 'portraitDataUrl' | 'height' | 'weight' | 'eyes' | 'hair' | 'skin'>;
  onFieldChange: (field: keyof Character, value: string) => void;
  onPortraitChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CharacterFormStoryPortraitSection({
  character,
  onFieldChange,
  onPortraitChange,
}: CharacterFormStoryPortraitSectionProps) {
  const { translations, isLoading: translationsLoading } = useI18n();

  // Local states for debounced text inputs
  const [localCampaign, setLocalCampaign] = React.useState(character.campaign);
  const [localPersonalStory, setLocalPersonalStory] = React.useState(character.personalStory);
  const [localHeight, setLocalHeight] = React.useState(character.height);
  const [localWeight, setLocalWeight] = React.useState(character.weight);
  const [localEyes, setLocalEyes] = React.useState(character.eyes);
  const [localHair, setLocalHair] = React.useState(character.hair);
  const [localSkin, setLocalSkin] = React.useState(character.skin);

  // Sync local states with props
  React.useEffect(() => { setLocalCampaign(character.campaign); }, [character.campaign]);
  React.useEffect(() => { setLocalPersonalStory(character.personalStory); }, [character.personalStory]);
  React.useEffect(() => { setLocalHeight(character.height); }, [character.height]);
  React.useEffect(() => { setLocalWeight(character.weight); }, [character.weight]);
  React.useEffect(() => { setLocalEyes(character.eyes); }, [character.eyes]);
  React.useEffect(() => { setLocalHair(character.hair); }, [character.hair]);
  React.useEffect(() => { setLocalSkin(character.skin); }, [character.skin]);

  // Debounce effects
  const useDebounceEffect = (localValue: string | undefined, propValue: string | undefined, fieldName: keyof Character) => {
    React.useEffect(() => {
      const handler = setTimeout(() => {
        if (localValue !== propValue) {
          onFieldChange(fieldName, localValue || '');
        }
      }, DEBOUNCE_DELAY);
      return () => clearTimeout(handler);
    }, [localValue, propValue, fieldName, onFieldChange]);
  };

  useDebounceEffect(localCampaign, character.campaign, 'campaign');
  useDebounceEffect(localPersonalStory, character.personalStory, 'personalStory');
  useDebounceEffect(localHeight, character.height, 'height');
  useDebounceEffect(localWeight, character.weight, 'weight');
  useDebounceEffect(localEyes, character.eyes, 'eyes');
  useDebounceEffect(localHair, character.hair, 'hair');
  useDebounceEffect(localSkin, character.skin, 'skin');


  if (translationsLoading || !translations) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <UserSquare2 className="h-8 w-8 text-primary" />
            <div>
              <Skeleton className="h-7 w-64 mb-1" />
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="space-y-1.5 mb-4">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:items-stretch">
            <div className="md:col-span-1 space-y-2 flex flex-col">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="aspect-square w-full rounded-md" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="md:col-span-2 space-y-2 flex flex-col">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="min-h-[260px] md:flex-grow md:min-h-0 rounded-md" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border/40">
            <Skeleton className="h-6 w-40 mb-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  const { UI_STRINGS } = translations;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <UserSquare2 className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-serif">
              {UI_STRINGS.storyPortraitPanelTitle || "Personal Story & Appearance"}
            </CardTitle>
            <CardDescription>
              {UI_STRINGS.storyPortraitPanelDescription || "Flesh out your character's background and physical details."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="space-y-1.5 mb-4">
            <Label htmlFor="campaign">{UI_STRINGS.campaignLabel || "Campaign"}</Label>
            <Input
              id="campaign"
              name="campaign"
              value={localCampaign || ''}
              onChange={(e) => setLocalCampaign(e.target.value)}
              placeholder={UI_STRINGS.campaignPlaceholder || "e.g., The Sunless Citadel, A Homebrewed Adventure"}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:items-stretch">
          <div className="md:col-span-1 space-y-2 flex flex-col">
            <Label htmlFor="portraitUpload">{UI_STRINGS.characterPortraitLabel || "Character Portrait"}</Label>
            <div className="aspect-square w-full bg-muted rounded-md flex items-center justify-center relative overflow-hidden border border-border shadow-sm">
              {character.portraitDataUrl ? (
                <Image src={character.portraitDataUrl} alt="Character Portrait" fill style={{ objectFit: 'cover' }} />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Palette size={48} className="mb-2" />
                  <span className="text-sm">{UI_STRINGS.noPortraitUploadedText || "No portrait uploaded"}</span>
                </div>
              )}
            </div>
            <Input
              id="portraitUpload"
              type="file"
              accept="image/*"
              onChange={onPortraitChange} // Direct update for file input
              className="text-sm file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {!character.portraitDataUrl && (
              <div className="hidden">
                <Image src="https://placehold.co/300x300.png" alt="Portrait Placeholder" width={300} height={300} data-ai-hint="fantasy portrait" />
              </div>
            )}
          </div>

          <div className="md:col-span-2 space-y-2 flex flex-col">
            <Label htmlFor="personalStory">{UI_STRINGS.personalStoryLabel || "Personal Story"}</Label>
            <Textarea
              id="personalStory"
              name="personalStory"
              value={localPersonalStory || ''}
              onChange={(e) => setLocalPersonalStory(e.target.value)}
              placeholder={UI_STRINGS.personalStoryPlaceholder || "Describe your character's history, motivations, personality, and defining moments..."}
              className="min-h-[260px] md:flex-grow md:min-h-0"
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border/40">
            <h3 className="text-lg font-semibold mb-3 text-foreground/90">{UI_STRINGS.physicalAppearanceHeading || "Physical Appearance"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="height">{UI_STRINGS.heightLabel || "Height"}</Label>
                    <Input id="height" name="height" value={localHeight || ''} onChange={(e) => setLocalHeight(e.target.value)} placeholder={UI_STRINGS.heightPlaceholder || "e.g., 5'10\""}/>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="weight">{UI_STRINGS.weightLabel || "Weight"}</Label>
                    <Input id="weight" name="weight" value={localWeight || ''} onChange={(e) => setLocalWeight(e.target.value)} placeholder={UI_STRINGS.weightPlaceholder || "e.g., 160 lbs"}/>
                </div>
                 <div className="space-y-1.5">
                    <Label htmlFor="eyes">{UI_STRINGS.eyesLabel || "Eyes"}</Label>
                    <Input id="eyes" name="eyes" value={localEyes || ''} onChange={(e) => setLocalEyes(e.target.value)} placeholder={UI_STRINGS.eyesPlaceholder || "e.g., Hazel"}/>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="hair">{UI_STRINGS.hairLabel || "Hair"}</Label>
                    <Input id="hair" name="hair" value={localHair || ''} onChange={(e) => setLocalHair(e.target.value)} placeholder={UI_STRINGS.hairPlaceholder || "e.g., Raven Black, Tousled"}/>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="skin">{UI_STRINGS.skinLabel || "Skin"}</Label>
                    <Input id="skin" name="skin" value={localSkin || ''} onChange={(e) => setLocalSkin(e.target.value)} placeholder={UI_STRINGS.skinPlaceholder || "e.g., Fair, Tanned"}/>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

    