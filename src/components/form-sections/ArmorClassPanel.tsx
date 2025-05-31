
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input'; // For potential future editability

export function ArmorClassPanel() {
  // For now, these are static. They will be calculated later.
  const normalAC = 0;
  const touchAC = 0;
  const flatFootedAC = 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl font-serif">Armor Class</CardTitle>
        </div>
        <CardDescription>Details about your character's defenses.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
          <Label htmlFor="normal-ac" className="text-lg font-medium">Normal AC</Label>
          <p id="normal-ac" className="text-3xl font-bold text-accent">{normalAC}</p>
        </div>
        <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
          <Label htmlFor="touch-ac" className="text-lg font-medium">Touch AC</Label>
          <p id="touch-ac" className="text-3xl font-bold text-accent">{touchAC}</p>
        </div>
        <div className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
          <Label htmlFor="flat-footed-ac" className="text-lg font-medium">Flat-Footed AC</Label>
          <p id="flat-footed-ac" className="text-3xl font-bold text-accent">{flatFootedAC}</p>
        </div>
         {/* Placeholder for future detailed breakdown or inputs */}
      </CardContent>
    </Card>
  );
}
