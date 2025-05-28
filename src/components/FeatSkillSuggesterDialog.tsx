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

interface FeatSkillSuggesterDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  characterClass: string;
  level: number;
  suggestionType: 'feats' | 'skills'; // To control what is primarily displayed or focused on
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
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestFeatsSkillsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    if (!characterClass || level <= 0) {
      toast({
        title: 'Missing Information',
        description: 'Please ensure character class and level are set.',
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
      setError('Failed to get suggestions from AI. Please try again.');
      toast({
        title: 'AI Suggestion Error',
        description: 'Could not fetch suggestions. Check console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = (name: string, description: string) => {
    onAddSuggested(name, description);
    toast({
      title: `${suggestionType === 'feats' ? 'Feat' : 'Skill'} Added`,
      description: `${name} has been added to your character.`,
    });
  };
  
  // Trigger fetch when dialog opens, if not already loaded
  // This happens in an effect that watches isOpen in the parent, or manually via a button
  // For now, let's add a button inside the dialog to trigger it.

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif">
            <Sparkles className="h-6 w-6 mr-2 text-primary" />
            AI {suggestionType === 'feats' ? 'Feat' : 'Skill'} Suggestions
          </DialogTitle>
          <DialogDescription>
            Get AI-powered suggestions for {suggestionType} based on {characterClass} (Level {level}).
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
                    Generate Suggestions
                </Button>
            </div>
        )}


        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Conjuring suggestions...</p>
          </div>
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
                  <h3 className="text-lg font-semibold mb-2 text-primary">Suggested Feats</h3>
                  <ul className="space-y-3">
                    {suggestions.suggestedFeats.map((feat, index) => (
                      <li key={`feat-${index}`} className="p-3 border rounded-md bg-muted/20">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-medium">{feat.name}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{feat.description}</p>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => handleAdd(feat.name, feat.description)} className="shrink-0 ml-2">
                                <PlusCircle className="h-4 w-4 mr-1"/> Add
                            </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {suggestionType === 'skills' && suggestions.suggestedSkills.length > 0 && (
                 <div>
                  <h3 className="text-lg font-semibold mb-2 text-primary">Suggested Skills to Focus On</h3>
                  <ul className="space-y-3">
                    {suggestions.suggestedSkills.map((skill, index) => (
                       <li key={`skill-${index}`} className="p-3 border rounded-md bg-muted/20">
                         <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-medium">{skill.name}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{skill.description}</p>
                            </div>
                            {/* Adding skills from AI might be different from feats, as skills already exist.
                                This might just be advice. For now, no "Add" button for skills. */}
                         </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {(suggestionType === 'feats' && suggestions.suggestedFeats.length === 0) &&
               (suggestionType === 'skills' && suggestions.suggestedSkills.length === 0) &&
                <p className="text-muted-foreground text-center py-4">No specific suggestions found for this combination.</p>
              }
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
