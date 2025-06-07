
'use client';

import type { CharacterFeatInstance as FeatType, CharacterClass } from '@/types/character-core'; // Updated to CharacterFeatInstance
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, PlusCircle, Trash2, Sparkles, Edit3, Loader2 } from 'lucide-react'; // Added Edit3
import { useState, useEffect } from 'react';
import { FeatSkillSuggesterDialog } from '@/components/FeatSkillSuggesterDialog';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';
import type { FeatDefinitionJsonData } from '@/types/character-core';

interface FeatsListingProps {
  feats: FeatType[];
  characterClasses: CharacterClass[];
  onFeatAdd: (feat: FeatType) => void;
  onFeatRemove: (instanceId: string) => void;
  onFeatUpdate: (feat: FeatType) => void;
}

export function FeatsListing({ feats, characterClasses, onFeatAdd, onFeatRemove, onFeatUpdate }: FeatsListingProps) {
  const { translations, isLoading: translationsLoading } = useI18n();
  
  // const [newFeatName, setNewFeatName] = useState(''); // Commented out for now
  // const [newFeatDescription, setNewFeatDescription] = useState(''); // Commented out for now
  
  const [editingFeat, setEditingFeat] = useState<FeatType | null>(null);
  const [editingSpecializationDetail, setEditingSpecializationDetail] = useState<string>('');
  const [isSuggesterOpen, setIsSuggesterOpen] = useState(false);

  const allFeatDefinitions = translations?.DND_FEATS_DEFINITIONS || [];
  const UI_STRINGS = translations?.UI_STRINGS;


  // Commented out manual add feat functionality as it's not compatible with CharacterFeatInstance directly
  /*
  const handleAddFeat = () => {
    if (!newFeatName.trim()) return;
    // This needs to create a CharacterFeatInstance, which requires a definitionId.
    // The current setup is for a simpler {id, name, description} model.
    // For now, this functionality is disabled.
    // const featToAdd: FeatType = {
    //   id: crypto.randomUUID(), // This would be instanceId
    //   name: newFeatName.trim(),
    //   description: newFeatDescription.trim() || undefined,
    // };
    // onFeatAdd(featToAdd);
    // setNewFeatName('');
    // setNewFeatDescription('');
  };
  */

  const handleStartEdit = (feat: FeatType) => {
    setEditingFeat(feat);
    setEditingSpecializationDetail(feat.specializationDetail || '');
  };

  const handleSaveEdit = () => {
    if (editingFeat) {
      onFeatUpdate({ ...editingFeat, specializationDetail: editingSpecializationDetail.trim() || undefined });
      setEditingFeat(null);
      setEditingSpecializationDetail('');
    }
  };
  
  const handleCancelEdit = () => {
    setEditingFeat(null);
    setEditingSpecializationDetail('');
  };

  const getFeatDefinition = (definitionId: string): FeatDefinitionJsonData | undefined => {
    return allFeatDefinitions.find(def => def.value === definitionId);
  };
  
  if (translationsLoading || !UI_STRINGS) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className="h-6 w-6 text-primary" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-4 w-3/4 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle className="font-serif">{UI_STRINGS.featsPanelTitle || "Feats"}</CardTitle>
          </div>
          {characterClasses.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setIsSuggesterOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" /> {UI_STRINGS.aiSuggestionsButton || "AI Suggestions"}
            </Button>
          )}
        </div>
        <CardDescription>{UI_STRINGS.featsPanelSheetDescription || "Manage your character's special abilities and advantages."}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {feats.length > 0 ? (
            feats.map(featInstance => {
              const definition = getFeatDefinition(featInstance.definitionId);
              const featName = definition?.label || featInstance.definitionId;
              const featDescription = definition?.description;
              const featRequiresSpecialization = !!definition?.requiresSpecialization;

              return (
                <div key={featInstance.instanceId} className="p-3 border rounded-md bg-muted/10 group">
                  {editingFeat?.instanceId === featInstance.instanceId ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground">{featName}</p>
                      {featRequiresSpecialization && (
                        <div>
                          <Label htmlFor={`feat-spec-${featInstance.instanceId}`} className="text-xs text-muted-foreground">
                            {UI_STRINGS.featSpecializationLabel || "Specialization"} ({definition?.requiresSpecialization})
                          </Label>
                          <Input
                            id={`feat-spec-${featInstance.instanceId}`}
                            value={editingSpecializationDetail}
                            onChange={(e) => setEditingSpecializationDetail(e.target.value)}
                            placeholder={UI_STRINGS.featSpecializationPlaceholder || "Enter specialization detail"}
                          />
                        </div>
                      )}
                       {!featRequiresSpecialization && <p className="text-sm text-muted-foreground italic">{UI_STRINGS.featNoSpecializationNeeded || "This feat does not require specialization."}</p>}
                      <div className="flex justify-end space-x-2">
                        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>{UI_STRINGS.formButtonCancel || "Cancel"}</Button>
                        <Button size="sm" onClick={handleSaveEdit}>{UI_STRINGS.formButtonSaveChanges || "Save"}</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{featName}</h4>
                        {featInstance.specializationDetail && (
                          <p className="text-sm text-muted-foreground italic">({featInstance.specializationDetail})</p>
                        )}
                        {featDescription && !featInstance.isGranted && (
                           <div className="text-sm text-muted-foreground mt-1" dangerouslySetInnerHTML={{ __html: featDescription }} />
                        )}
                        {featInstance.isGranted && featInstance.grantedNote && (
                            <p className="text-xs text-muted-foreground italic mt-0.5">{featInstance.grantedNote}</p>
                        )}
                      </div>
                      <div className="flex space-x-1 shrink-0">
                        {featRequiresSpecialization && !featInstance.isGranted && (
                           <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEdit(featInstance)} aria-label={UI_STRINGS.featEditSpecializationAriaLabel || "Edit Specialization"}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                        {!featInstance.isGranted && (
                           <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onFeatRemove(featInstance.instanceId)} aria-label={UI_STRINGS.featInstanceRemoveAriaLabel || "Remove Feat"}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">{UI_STRINGS.featsPanelNoFeatsYet || "No feats added yet."}</p>
          )}
        </div>

        {/* 
        // Temporarily commented out manual "Add New Feat" section
        // This needs to be re-integrated with a proper feat selection/definition mechanism
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-md font-semibold mb-2">Add New Feat (Manual - Disabled)</h4>
          <div className="space-y-2">
            <Input
              placeholder="Feat Name"
              value={newFeatName}
              onChange={(e) => setNewFeatName(e.target.value)}
              disabled
            />
            <Textarea
              placeholder="Feat Description (Optional)"
              value={newFeatDescription}
              onChange={(e) => setNewFeatDescription(e.target.value)}
              rows={2}
              disabled
            />
            <Button onClick={handleAddFeat} size="sm" disabled>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Feat
            </Button>
          </div>
        </div>
        */}
      </CardContent>
      {characterClasses.length > 0 && translations && (
        <FeatSkillSuggesterDialog
          isOpen={isSuggesterOpen}
          onOpenChange={setIsSuggesterOpen}
          characterClass={characterClasses[0].className}
          level={characterClasses[0].level}
          suggestionType="feats"
          onAddSuggested={(name, description) => {
            const slugifiedDefId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-ai-suggested';
            const newFeatInstance: FeatType = {
              definitionId: slugifiedDefId,
              instanceId: crypto.randomUUID(),
              specializationDetail: `${UI_STRINGS.aiSuggestedFeatLabel || "AI Suggested"}: ${name} - ${description}`,
              isGranted: false,
            };
            onFeatAdd(newFeatInstance);
          }}
        />
      )}
    </Card>
  );
}
