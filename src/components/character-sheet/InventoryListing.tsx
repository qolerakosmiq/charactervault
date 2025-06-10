
'use client';

import type { Item as ItemType, ItemBaseType, WeaponStyleType, WeaponProficiencyCategory } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Backpack, PlusCircle, Trash2, Edit3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { NumberSpinnerInput } from '@/components/ui/NumberSpinnerInput';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/context/I18nProvider';
import { Skeleton } from '@/components/ui/skeleton';

interface InventoryListingProps {
  inventory: ItemType[];
  onItemAdd: (item: ItemType) => void;
  onItemRemove: (itemId: string) => void;
  onItemUpdate: (item: ItemType) => void;
}

const ITEM_BASE_TYPES: Array<{value: ItemBaseType, labelKey: keyof NonNullable<NonNullable<ReturnType<typeof useI18n>['translations']>['UI_STRINGS']>}> = [
  { value: 'weapon', labelKey: 'itemTypeWeapon' },
  { value: 'armor', labelKey: 'itemTypeArmor' },
  { value: 'shield', labelKey: 'itemTypeShield' },
  { value: 'potion', labelKey: 'itemTypePotion' },
  { value: 'scroll', labelKey: 'itemTypeScroll' },
  { value: 'wand', labelKey: 'itemTypeWand' },
  { value: 'ring', labelKey: 'itemTypeRing' },
  { value: 'amulet', labelKey: 'itemTypeAmulet' },
  { value: 'boots', labelKey: 'itemTypeBoots' },
  { value: 'belt', labelKey: 'itemTypeBelt' },
  { value: 'bracers', labelKey: 'itemTypeBracers' },
  { value: 'cloak', labelKey: 'itemTypeCloak' },
  { value: 'gloves', labelKey: 'itemTypeGloves' },
  { value: 'headband', labelKey: 'itemTypeHeadband' },
  { value: 'robe', labelKey: 'itemTypeRobe' },
  { value: 'rod', labelKey: 'itemTypeRod' },
  { value: 'staff', labelKey: 'itemTypeStaff' },
  { value: 'wondrous', labelKey: 'itemTypeWondrous' },
  { value: 'other', labelKey: 'itemTypeOther' },
];

const WEAPON_STYLE_TYPES: Array<{value: WeaponStyleType, labelKey: keyof NonNullable<NonNullable<ReturnType<typeof useI18n>['translations']>['UI_STRINGS']>}> = [
  { value: 'melee', labelKey: 'weaponTypeMelee' },
  { value: 'ranged', labelKey: 'weaponTypeRanged' },
  { value: 'melee-or-ranged', labelKey: 'weaponTypeMeleeOrRanged' },
];

const WEAPON_PROFICIENCY_CATEGORIES: Array<{value: WeaponProficiencyCategory, labelKey: keyof NonNullable<NonNullable<ReturnType<typeof useI18n>['translations']>['UI_STRINGS']>}> = [
    { value: 'simple', labelKey: 'weaponProficiencySimple' },
    { value: 'martial', labelKey: 'weaponProficiencyMartial' },
    { value: 'exotic', labelKey: 'weaponProficiencyExotic' },
];

export function InventoryListing({ inventory, onItemAdd, onItemRemove, onItemUpdate }: InventoryListingProps) {
  const { translations, isLoading: translationsLoading } = useI18n();
  const UI_STRINGS = translations?.UI_STRINGS;

  const [newItem, setNewItem] = useState<Partial<ItemType>>({ name: '', quantity: 1, itemType: 'other' });
  const [editingItem, setEditingItem] = useState<ItemType | null>(null);

  const handleInputChange = (field: keyof ItemType, value: string | number | boolean | undefined) => {
    if (editingItem) {
      setEditingItem(prev => prev ? { ...prev, [field]: value } : null);
    } else {
      setNewItem(prev => ({ ...prev, [field]: value }));
    }
  };

  const resetNewItemForm = () => {
    setNewItem({ name: '', quantity: 1, itemType: 'other', description: '' });
  };

  const handleAddItem = () => {
    if (!newItem.name?.trim() || (newItem.quantity ?? 0) < 1) return;
    onItemAdd({ ...newItem, id: crypto.randomUUID() } as ItemType);
    resetNewItemForm();
  };

  const handleStartEdit = (item: ItemType) => {
    setEditingItem({ ...item }); // Clone to edit
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

  if (translationsLoading || !UI_STRINGS) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-8 w-32" /></CardHeader>
        <CardContent><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></CardContent>
      </Card>
    );
  }
  
  const currentFields = editingItem || newItem;
  const isWeapon = currentFields.itemType === 'weapon';

  const renderItemFields = (isEditing: boolean) => (
    <div className="space-y-3 p-3 border rounded-md bg-background">
      <h4 className="text-md font-semibold">{isEditing ? UI_STRINGS.inventoryEditItemTitle : UI_STRINGS.inventoryAddNewItemTitle}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label htmlFor={isEditing ? `edit-item-name-${editingItem?.id}` : "new-item-name"}>{UI_STRINGS.inventoryItemNameLabel}</Label>
          <Input
            id={isEditing ? `edit-item-name-${editingItem?.id}` : "new-item-name"}
            value={currentFields.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder={UI_STRINGS.inventoryItemNamePlaceholder}
          />
        </div>
        <div>
          <Label htmlFor={isEditing ? `edit-item-quantity-${editingItem?.id}` : "new-item-quantity"}>{UI_STRINGS.inventoryItemQuantityLabel}</Label>
          <NumberSpinnerInput
            id={isEditing ? `edit-item-quantity-${editingItem?.id}` : "new-item-quantity"}
            value={currentFields.quantity || 1}
            onChange={(val) => handleInputChange('quantity', val)}
            min={1}
            inputClassName="w-full h-10 text-base"
            buttonClassName="h-10 w-10"
          />
        </div>
        <div>
          <Label htmlFor={isEditing ? `edit-item-type-${editingItem?.id}` : "new-item-type"}>{UI_STRINGS.inventoryItemTypeLabel}</Label>
          <Select value={currentFields.itemType || 'other'} onValueChange={(val) => handleInputChange('itemType', val as ItemBaseType)}>
            <SelectTrigger id={isEditing ? `edit-item-type-${editingItem?.id}` : "new-item-type"}><SelectValue /></SelectTrigger>
            <SelectContent>
              {ITEM_BASE_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>{UI_STRINGS[type.labelKey] || type.value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
         <div>
          <Label htmlFor={isEditing ? `edit-item-weight-${editingItem?.id}` : "new-item-weight"}>{UI_STRINGS.inventoryItemWeightLabel}</Label>
          <NumberSpinnerInput
            id={isEditing ? `edit-item-weight-${editingItem?.id}` : "new-item-weight"}
            value={currentFields.weight || 0}
            onChange={(val) => handleInputChange('weight', val)}
            min={0}
            step={0.1}
            inputClassName="w-full h-10 text-base"
            buttonClassName="h-10 w-10"
          />
        </div>
      </div>

      {isWeapon && (
        <>
          <Separator className="my-3" />
          <h5 className="text-sm font-medium text-muted-foreground">{UI_STRINGS.inventoryWeaponDetailsTitle}</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <Label htmlFor={isEditing ? `edit-weapon-type-${editingItem?.id}` : "new-weapon-type"}>{UI_STRINGS.inventoryWeaponTypeLabel}</Label>
              <Select value={currentFields.weaponType || 'melee'} onValueChange={(val) => handleInputChange('weaponType', val as WeaponStyleType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WEAPON_STYLE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{UI_STRINGS[type.labelKey] || type.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor={isEditing ? `edit-weapon-damage-${editingItem?.id}` : "new-weapon-damage"}>{UI_STRINGS.inventoryWeaponDamageLabel}</Label>
              <Input value={currentFields.damage || ''} onChange={(e) => handleInputChange('damage', e.target.value)} placeholder="e.g., 1d8" />
            </div>
            <div>
              <Label htmlFor={isEditing ? `edit-weapon-crit-range-${editingItem?.id}` : "new-weapon-crit-range"}>{UI_STRINGS.inventoryWeaponCritRangeLabel}</Label>
              <Input value={currentFields.criticalRange || ''} onChange={(e) => handleInputChange('criticalRange', e.target.value)} placeholder="e.g., 19-20" />
            </div>
            <div>
              <Label htmlFor={isEditing ? `edit-weapon-crit-mult-${editingItem?.id}` : "new-weapon-crit-mult"}>{UI_STRINGS.inventoryWeaponCritMultLabel}</Label>
              <Input value={currentFields.criticalMultiplier || ''} onChange={(e) => handleInputChange('criticalMultiplier', e.target.value)} placeholder="e.g., x2" />
            </div>
            <div>
              <Label htmlFor={isEditing ? `edit-weapon-range-${editingItem?.id}` : "new-weapon-range"}>{UI_STRINGS.inventoryWeaponRangeIncrementLabel}</Label>
              <NumberSpinnerInput value={currentFields.rangeIncrement || 0} onChange={(val) => handleInputChange('rangeIncrement', val)} min={0} inputClassName="w-full h-10" buttonClassName="h-10 w-10" />
            </div>
            <div>
              <Label htmlFor={isEditing ? `edit-weapon-damage-type-${editingItem?.id}` : "new-weapon-damage-type"}>{UI_STRINGS.inventoryWeaponDamageTypeLabel}</Label>
              <Input value={currentFields.damageType || ''} onChange={(e) => handleInputChange('damageType', e.target.value)} placeholder="Ex: Perforant" />
            </div>
             <div>
              <Label htmlFor={isEditing ? `edit-weapon-prof-cat-${editingItem?.id}` : "new-weapon-prof-cat"}>{UI_STRINGS.inventoryWeaponProficiencyCategoryLabel}</Label>
              <Select value={currentFields.proficiencyCategory || 'simple'} onValueChange={(val) => handleInputChange('proficiencyCategory', val as WeaponProficiencyCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WEAPON_PROFICIENCY_CATEGORIES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{UI_STRINGS[type.labelKey] || type.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox id={isEditing ? `edit-weapon-finesse-${editingItem?.id}` : "new-weapon-finesse"} checked={currentFields.isFinesseWeapon || false} onCheckedChange={(checked) => handleInputChange('isFinesseWeapon', !!checked)} />
                <Label htmlFor={isEditing ? `edit-weapon-finesse-${editingItem?.id}` : "new-weapon-finesse"} className="text-sm font-normal">{UI_STRINGS.inventoryWeaponIsFinesseLabel}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id={isEditing ? `edit-weapon-light-${editingItem?.id}` : "new-weapon-light"} checked={currentFields.isLightWeapon || false} onCheckedChange={(checked) => handleInputChange('isLightWeapon', !!checked)} />
                <Label htmlFor={isEditing ? `edit-weapon-light-${editingItem?.id}` : "new-weapon-light"} className="text-sm font-normal">{UI_STRINGS.inventoryWeaponIsLightLabel}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id={isEditing ? `edit-weapon-twohanded-${editingItem?.id}` : "new-weapon-twohanded"} checked={currentFields.isTwoHandedWeapon || false} onCheckedChange={(checked) => handleInputChange('isTwoHandedWeapon', !!checked)} />
                <Label htmlFor={isEditing ? `edit-weapon-twohanded-${editingItem?.id}` : "new-weapon-twohanded"} className="text-sm font-normal">{UI_STRINGS.inventoryWeaponIsTwoHandedLabel}</Label>
              </div>
          </div>
          <div className="pt-1">
             <Label htmlFor={isEditing ? `edit-weapon-special-${editingItem?.id}` : "new-weapon-special"}>{UI_STRINGS.inventoryWeaponSpecialPropertiesLabel}</Label>
             <Textarea
                id={isEditing ? `edit-weapon-special-${editingItem?.id}` : "new-weapon-special"}
                value={currentFields.specialProperties || ''}
                onChange={(e) => handleInputChange('specialProperties', e.target.value)}
                placeholder={UI_STRINGS.inventoryWeaponSpecialPropertiesPlaceholder}
                rows={2}
             />
          </div>
        </>
      )}
      
      <div className="mt-2">
        <Label htmlFor={isEditing ? `edit-item-desc-${editingItem?.id}` : "new-item-desc"}>{UI_STRINGS.inventoryItemDescriptionLabel}</Label>
        <Textarea
          id={isEditing ? `edit-item-desc-${editingItem?.id}` : "new-item-desc"}
          value={currentFields.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder={UI_STRINGS.inventoryItemDescriptionPlaceholder}
          rows={2}
        />
      </div>
      <div className="flex justify-end space-x-2 mt-3">
        {isEditing ? (
          <>
            <Button size="sm" variant="ghost" onClick={handleCancelEdit} type="button">{UI_STRINGS.formButtonCancel}</Button>
            <Button size="sm" onClick={handleSaveEdit} type="button">{UI_STRINGS.formButtonSaveChanges}</Button>
          </>
        ) : (
          <Button onClick={handleAddItem} size="sm" type="button" disabled={!newItem.name?.trim() || (newItem.quantity ?? 0) < 1}>
            <PlusCircle className="mr-2 h-4 w-4" /> {UI_STRINGS.inventoryAddItemButton}
          </Button>
        )}
      </div>
    </div>
  );


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Backpack className="h-6 w-6 text-primary" />
          <CardTitle className="font-serif">{UI_STRINGS.inventoryPanelTitle}</CardTitle>
        </div>
        <CardDescription>{UI_STRINGS.inventoryPanelDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {editingItem ? (
          renderItemFields(true)
        ) : (
          <>
            <div className="space-y-4">
              {inventory.length > 0 ? (
                inventory.map(item => (
                  <div key={item.id} className="p-3 border rounded-md bg-muted/10 group">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{item.name} (x{item.quantity})</h4>
                        {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                        {item.itemType === 'weapon' && (
                           <p className="text-xs text-muted-foreground mt-0.5">
                              Dmg: {item.damage || 'N/A'}, Crit: {item.criticalRange || 'N/A'} {item.criticalMultiplier || ''}
                           </p>
                        )}
                      </div>
                      <div className="flex space-x-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-50 group-hover:opacity-100" onClick={() => handleStartEdit(item)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-50 group-hover:opacity-100" onClick={() => onItemRemove(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{UI_STRINGS.inventoryEmptyMessage}</p>
              )}
            </div>
            <div className="mt-6 pt-4 border-t">
              {renderItemFields(false)}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

```