'use client';

import type { Feat as FeatType, CharacterClass } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, PlusCircle, Trash2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { FeatSkillSuggesterDialog } from '@/components/FeatSkillSuggesterDialog'; // To be created

interface FeatsListingProps {
  feats: FeatType[];
  characterClasses: CharacterClass[]; // For AI suggestions
  onFeatAdd: (feat: FeatType) => void;
  onFeatRemove: (featId: string) => void;
  onFeatUpdate: (feat: FeatType) => void;
}

export function FeatsListing({ feats, characterClasses, onFeatAdd, onFeatRemove, onFeatUpdate }: FeatsListingProps) {
  const [newFeatName, setNewFeatName] = useState('');
  const [newFeatDescription, setNewFeatDescription] = useState('');
  const [editingFeat, setEditingFeat] = useState<FeatType | null>(null);
  const [isSuggesterOpen, setIsSuggesterOpen] = useState(false);


  const handleAddFeat = () => {
    if (!newFeatName.trim()) return;
    const featToAdd: FeatType = {
      id: crypto.randomUUID(),
      name: newFeatName.trim(),
      description: newFeatDescription.trim() || undefined,
    };
    onFeatAdd(featToAdd);
    setNewFeatName('');
    setNewFeatDescription('');
  };

  const handleStartEdit = (feat: FeatType) => {
    setEditingFeat(feat);
  };

  const handleSaveEdit = () => {
    if (editingFeat) {
      onFeatUpdate(editingFeat);
      setEditingFeat(null);
    }
  };
  
  const handleCancelEdit = () => {
    setEditingFeat(null);
  };

  const handleEditChange = (field: 'name' | 'description', value: string) => {
    if (editingFeat) {
      setEditingFeat({ ...editingFeat, [field]: value });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle className="font-serif">Feats</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsSuggesterOpen(true)}>
            <Sparkles className="mr-2 h-4 w-4" /> AI Suggestions
          </Button>
        </div>
        <CardDescription>Manage your character's special abilities and advantages.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {feats.length > 0 ? (
            feats.map(feat => (
              <div key={feat.id} className="p-3 border rounded-md bg-muted/10">
                {editingFeat?.id === feat.id ? (
                  <div className="space-y-2">
                    <Input 
                      value={editingFeat.name} 
                      onChange={(e) => handleEditChange('name', e.target.value)}
                      placeholder="Feat Name"
                    />
                    <Textarea 
                      value={editingFeat.description || ''} 
                      onChange={(e) => handleEditChange('description', e.target.value)}
                      placeholder="Feat Description (Optional)"
                      rows={2}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
                      <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{feat.name}</h4>
                      {feat.description && <p className="text-sm text-muted-foreground mt-1">{feat.description}</p>}
                    </div>
                    <div className="flex space-x-1 shrink-0">
                       <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEdit(feat)}>
                        <PlusCircle className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-1"/>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onFeatRemove(feat.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No feats added yet.</p>
          )}
        </div>

        <div className="mt-6 pt-4 border-t">
          <h4 className="text-md font-semibold mb-2">Add New Feat</h4>
          <div className="space-y-2">
            <Input
              placeholder="Feat Name"
              value={newFeatName}
              onChange={(e) => setNewFeatName(e.target.value)}
            />
            <Textarea
              placeholder="Feat Description (Optional)"
              value={newFeatDescription}
              onChange={(e) => setNewFeatDescription(e.target.value)}
              rows={2}
            />
            <Button onClick={handleAddFeat} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Feat
            </Button>
          </div>
        </div>
      </CardContent>
      {characterClasses.length > 0 && (
        <FeatSkillSuggesterDialog
          isOpen={isSuggesterOpen}
          onOpenChange={setIsSuggesterOpen}
          characterClass={characterClasses[0].className} // Simplified: uses first class
          level={characterClasses[0].level} // Simplified: uses first class level
          suggestionType="feats"
          onAddSuggested={(name, description) => onFeatAdd({ id: crypto.randomUUID(), name, description })}
        />
      )}
    </Card>
  );
}
