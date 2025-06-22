
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { suggestFeatsSkills, type SuggestFeatsSkillsOutput, type SuggestFeatsSkillsInput } from '@/ai/flows/suggest-feats-skills';
import { Loader2, Sparkles, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/context/I18nProvider';
import { parseAndRenderUIString } from '@/lib/utils';

interface FeatSkillSuggesterDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  characterClass: string;
  level: number;
  suggestionType: 'feats' | 'skills'; 
  onAddSuggested: (name: string, description: string) => void;
}

export function FeatSkillSuggesterDialog({
  isOpen,
  onOpenChange,
  characterClass,
  level,
  suggestionType,
  onAddSuggested,
}: FeatSkillSuggesterDialogProps) {
  const { translations, isLoading: translationsLoading } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestFeatsSkillsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    if (!translations) return;
    if (!characterClass || level <= 0) {
      toast({
        title: translations.UI_STRINGS.toastAISuggestionMissingInfoTitle,
        description: translations.UI_STRINGS.toastAISuggestionMissingInfoDesc,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestions(null);

    try {
      const input: SuggestFeatsSkillsInput = { characterClass, level };
      const result = await suggestFeatsSkills(input);
      setSuggestions(result);
    } catch (e) {
      console.error('Error fetching suggestions:', e);
      const errorMessage = translations.UI_STRINGS.toastAISuggestionErrorDesc;
      setError(errorMessage);
      toast({
        title: translations.UI_STRINGS.toastAISuggestionErrorTitle,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = (name: string, description: string) => {
    if (!translations?.UI_STRINGS) return;
    onAddSuggested(name, description);
    const titleKey = suggestionType === 'feats' ? translations.UI_STRINGS.toastFeatAddedFromAISuggestionTitle : translations.UI_STRINGS.toastSkillAddedFromAISuggestionTitle;
    const descKey = suggestionType === 'feats' ? translations.UI_STRINGS.toastFeatAddedFromAISuggestionDesc : translations.UI_STRINGS.toastSkillAddedFromAISuggestionDesc;
    toast({
      title: titleKey,
      description: parseAndRenderUIString(descKey, {itemName: name}),
    });
  };
  
  if (translationsLoading || !translations) {
      return null;
  }
  const UI_STRINGS = translations.UI_STRINGS;


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif">
            <Sparkles className="h-6 w-6 mr-2 text-primary" />
            {parseAndRenderUIString(UI_STRINGS.aiSuggestionsDialogTitle, {suggestionType: suggestionType === 'feats' ? UI_STRINGS.featsPanelTitle : UI_STRINGS.skillsPanelTitle})}
          </DialogTitle>
          <DialogDescription>
            {parseAndRenderUIString(UI_STRINGS.aiSuggestionsDialogDescription, {suggestionType: suggestionType, characterClass: characterClass, level: level.toString()})}
          </DialogDescription>
        </DialogHeader>
        
        {!suggestions && !isLoading && (
            <div className="py-8 text-center">
                <Button onClick={fetchSuggestions} disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {UI_STRINGS.aiSuggestionsGenerateButton}
                </Button>
            </div>
        )}


        {isLoading && (
          <div className="py-10 text-center text-muted-foreground">{UI_STRINGS.aiSuggestionsLoadingText}</div>
        )}

        {error && (
          <div className="py-10 text-center text-destructive">
            <p>{error}</p>
          </div>
        )}

        {suggestions && (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 py-4">
              {suggestionType === 'feats' && suggestions.suggestedFeats.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-primary">{UI_STRINGS.aiSuggestionsFeatsHeading}</h3>
                  <ul className="space-y-3">
                    {suggestions.suggestedFeats.map((feat, index) => (
                      <li key={`feat-${index}`} className="p-3 border rounded-md bg-muted/20">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-medium">{feat.name}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{feat.description}</p>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => handleAdd(feat.name, feat.description)} className="shrink-0 ml-2">
                                <PlusCircle className="h-4 w-4 mr-1"/> {UI_STRINGS.aiSuggestionsAddButton}
                            </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {suggestionType === 'skills' && suggestions.suggestedSkills.length > 0 && (
                 <div>
                  <h3 className="text-lg font-semibold mb-2 text-primary">{UI_STRINGS.aiSuggestionsSkillsHeading}</h3>
                  <ul className="space-y-3">
                    {suggestions.suggestedSkills.map((skill, index) => (
                       <li key={`skill-${index}`} className="p-3 border rounded-md bg-muted/20">
                         <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-medium">{skill.name}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{skill.description}</p>
                            </div>
                         </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {(suggestionType === 'feats' && suggestions.suggestedFeats.length === 0) &&
               (suggestionType === 'skills' && suggestions.suggestedSkills.length === 0) &&
                <p className="text-muted-foreground text-center py-4">{UI_STRINGS.aiSuggestionsNoResults}</p>
              }
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {UI_STRINGS.formButtonClose}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
