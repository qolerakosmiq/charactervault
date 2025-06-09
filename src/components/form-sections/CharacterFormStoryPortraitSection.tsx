
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
import { useDebouncedFormField } from '@/hooks/useDebouncedFormField';

const DEBOUNCE_DELAY = 400; // ms

export interface CharacterFormStoryPortraitSectionProps {
  storyAndAppearanceData: Pick<Character, 'campaign' | 'personalStory' | 'portraitDataUrl' | 'height' | 'weight' | 'eyes' | 'hair' | 'skin' | 'homeland'>;
  onFieldChange: (field: keyof Pick<Character, 'campaign' | 'personalStory' | 'height' | 'weight' | 'eyes' | 'hair' | 'skin' | 'homeland'>, value: string) => void;
  onPortraitChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const CharacterFormStoryPortraitSectionComponent = ({
  storyAndAppearanceData,
  onFieldChange,
  onPortraitChange,
}: CharacterFormStoryPortraitSectionProps) => {
  const { translations, isLoading: translationsLoading } = useI18n();

  const [localCampaign, setLocalCampaign] = useDebouncedFormField(
    storyAndAppearanceData.campaign || '', (value) => onFieldChange('campaign', value), DEBOUNCE_DELAY
  );
  const [localPersonalStory, setLocalPersonalStory] = useDebouncedFormField(
    storyAndAppearanceData.personalStory || '', (value) => onFieldChange('personalStory', value), DEBOUNCE_DELAY
  );
  const [localHomeland, setLocalHomeland] = useDebouncedFormField(
    storyAndAppearanceData.homeland || '', (value) => onFieldChange('homeland', value), DEBOUNCE_DELAY
  );
  const [localHeight, setLocalHeight] = useDebouncedFormField(
    storyAndAppearanceData.height || '', (value) => onFieldChange('height', value), DEBOUNCE_DELAY
  );
  const [localWeight, setLocalWeight] = useDebouncedFormField(
    storyAndAppearanceData.weight || '', (value) => onFieldChange('weight', value), DEBOUNCE_DELAY
  );
  const [localEyes, setLocalEyes] = useDebouncedFormField(
    storyAndAppearanceData.eyes || '', (value) => onFieldChange('eyes', value), DEBOUNCE_DELAY
  );
  const [localHair, setLocalHair] = useDebouncedFormField(
    storyAndAppearanceData.hair || '', (value) => onFieldChange('hair', value), DEBOUNCE_DELAY
  );
  const [localSkin, setLocalSkin] = useDebouncedFormField(
    storyAndAppearanceData.skin || '', (value) => onFieldChange('skin', value), DEBOUNCE_DELAY
  );

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
              <Skeleton className="min-h-[160px] md:flex-grow md:min-h-0 rounded-md" /> 
              <Skeleton className="h-5 w-24 mt-4" />
              <Skeleton className="h-10 w-full" />
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
              value={localCampaign}
              onChange={(e) => setLocalCampaign(e.target.value)}
              placeholder={UI_STRINGS.campaignPlaceholder || "e.g., The Sunless Citadel, A Homebrewed Adventure"}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:items-stretch">
          <div className="md:col-span-1 space-y-2 flex flex-col">
            <Label htmlFor="portraitUpload">{UI_STRINGS.characterPortraitLabel || "Character Portrait"}</Label>
            <div className="aspect-square w-full bg-muted rounded-md flex items-center justify-center relative overflow-hidden border border-border shadow-sm">
              {storyAndAppearanceData.portraitDataUrl ? (
                <Image src={storyAndAppearanceData.portraitDataUrl} alt="Character Portrait" fill style={{ objectFit: 'cover' }} />
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
              onChange={onPortraitChange} 
              className="text-sm file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {!storyAndAppearanceData.portraitDataUrl && (
              <div className="hidden">
                <Image src="https://placehold.co/300x300.png" alt="Portrait Placeholder" width={300} height={300} data-ai-hint="fantasy portrait" />
              </div>
            )}
          </div>

          <div className="md:col-span-2 space-y-4 flex flex-col"> 
            <div className="space-y-1.5 flex-grow flex flex-col">
              <Label htmlFor="personalStory">{UI_STRINGS.personalStoryLabel || "Personal Story"}</Label>
              <Textarea
                id="personalStory"
                name="personalStory"
                value={localPersonalStory}
                onChange={(e) => setLocalPersonalStory(e.target.value)}
                placeholder={UI_STRINGS.personalStoryPlaceholder || "Describe your character's history, motivations, personality, and defining moments..."}
                className="min-h-[160px] md:flex-grow md:min-h-0" 
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="homeland">{UI_STRINGS.homelandLabel || "Homeland"}</Label>
              <Input
                id="homeland"
                name="homeland"
                value={localHomeland}
                onChange={(e) => setLocalHomeland(e.target.value)}
                placeholder={UI_STRINGS.homelandPlaceholder || "e.g., The Northern Wastes, Aerie Peak"}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border/40">
            <h3 className="text-lg font-semibold mb-3 text-foreground/90">{UI_STRINGS.physicalAppearanceHeading || "Physical Appearance"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="height">{UI_STRINGS.heightLabel || "Height"}</Label>
                    <Input id="height" name="height" value={localHeight} onChange={(e) => setLocalHeight(e.target.value)} placeholder={UI_STRINGS.heightPlaceholder || "e.g., 5'10\""}/>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="weight">{UI_STRINGS.weightLabel || "Weight"}</Label>
                    <Input id="weight" name="weight" value={localWeight} onChange={(e) => setLocalWeight(e.target.value)} placeholder={UI_STRINGS.weightPlaceholder || "e.g., 160 lbs"}/>
                </div>
                 <div className="space-y-1.5">
                    <Label htmlFor="eyes">{UI_STRINGS.eyesLabel || "Eyes"}</Label>
                    <Input id="eyes" name="eyes" value={localEyes} onChange={(e) => setLocalEyes(e.target.value)} placeholder={UI_STRINGS.eyesPlaceholder || "e.g., Hazel"}/>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="hair">{UI_STRINGS.hairLabel || "Hair"}</Label>
                    <Input id="hair" name="hair" value={localHair} onChange={(e) => setLocalHair(e.target.value)} placeholder={UI_STRINGS.hairPlaceholder || "e.g., Raven Black, Tousled"}/>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="skin">{UI_STRINGS.skinLabel || "Skin"}</Label>
                    <Input id="skin" name="skin" value={localSkin} onChange={(e) => setLocalSkin(e.target.value)} placeholder={UI_STRINGS.skinPlaceholder || "e.g., Fair, Tanned"}/>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};
CharacterFormStoryPortraitSectionComponent.displayName = 'CharacterFormStoryPortraitSectionComponent';
export const CharacterFormStoryPortraitSection = React.memo(CharacterFormStoryPortraitSectionComponent);
