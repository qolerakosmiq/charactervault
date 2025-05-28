'use client';

import type { Item as ItemType } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Backpack, PlusCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface InventoryListingProps {
  inventory: ItemType[];
  onItemAdd: (item: ItemType) => void;
  onItemRemove: (itemId: string) => void;
  onItemUpdate: (item: ItemType) => void;
}

export function InventoryListing({ inventory, onItemAdd, onItemRemove, onItemUpdate }: InventoryListingProps) {
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemDescription, setNewItemDescription] = useState('');
  const [editingItem, setEditingItem] = useState<ItemType | null>(null);

  const handleAddItem = () => {
    if (!newItemName.trim() || newItemQuantity < 1) return;
    const itemToAdd: ItemType = {
      id: crypto.randomUUID(),
      name: newItemName.trim(),
      quantity: newItemQuantity,
      description: newItemDescription.trim() || undefined,
    };
    onItemAdd(itemToAdd);
    setNewItemName('');
    setNewItemQuantity(1);
    setNewItemDescription('');
  };

  const handleStartEdit = (item: ItemType) => {
    setEditingItem(item);
  };

  const handleSaveEdit = () => {
    if (editingItem) {
      onItemUpdate(editingItem);
      setEditingItem(null);
    }
  };
  
  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleEditChange = (field: keyof ItemType, value: string | number) => {
     if (editingItem) {
      setEditingItem({ ...editingItem, [field]: value });
    }
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Backpack className="h-6 w-6 text-primary" />
          <CardTitle className="font-serif">Inventory</CardTitle>
        </div>
        <CardDescription>Manage your character's equipment and possessions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {inventory.length > 0 ? (
            inventory.map(item => (
               <div key={item.id} className="p-3 border rounded-md bg-muted/10">
                {editingItem?.id === item.id ? (
                  <div className="space-y-2">
                    <Input 
                      value={editingItem.name} 
                      onChange={(e) => handleEditChange('name', e.target.value)}
                      placeholder="Item Name"
                    />
                    <Input 
                      type="number"
                      value={editingItem.quantity} 
                      onChange={(e) => handleEditChange('quantity', parseInt(e.target.value, 10) || 1)}
                      placeholder="Quantity"
                      min="1"
                    />
                    <Textarea 
                      value={editingItem.description || ''} 
                      onChange={(e) => handleEditChange('description', e.target.value)}
                      placeholder="Item Description (Optional)"
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
                      <h4 className="font-semibold">{item.name} (x{item.quantity})</h4>
                      {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                    </div>
                     <div className="flex space-x-1 shrink-0">
                       <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEdit(item)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onItemRemove(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Inventory is empty.</p>
          )}
        </div>

        <div className="mt-6 pt-4 border-t">
          <h4 className="text-md font-semibold mb-2">Add New Item</h4>
          <div className="space-y-2">
            <Input
              placeholder="Item Name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Quantity"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(parseInt(e.target.value, 10) || 1)}
              min="1"
            />
            <Textarea
              placeholder="Item Description (Optional)"
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              rows={2}
            />
            <Button onClick={handleAddItem} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
