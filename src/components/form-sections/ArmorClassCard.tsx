'use client';

import *as React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  panelContentPadding,
  panelFieldHorizontalGap,
  panelFieldVerticalGap,
  textStyleCardTitle,
  textStyleValueBig,
} from '@/config/layout';

interface ArmorClassCardProps {
  label: string;
  value: number;
  onOpenInfoDialog: () => void;
}

export const ArmorClassCard = React.memo(({
  label,
  value,
  onOpenInfoDialog,
}: ArmorClassCardProps) => {
  return (
    <div className={cn("flex flex-col border rounded-md bg-card items-center text-center", panelContentPadding, panelFieldVerticalGap)}>
      <Label htmlFor={`${label.toLowerCase().replace(' ', '-')}-ac-display`} className={textStyleCardTitle}>{label}</Label>
      <div className={cn("flex items-center justify-center", panelFieldHorizontalGap)}>
        <p id={`${label.toLowerCase().replace(' ', '-')}-ac-display`} className={textStyleValueBig}>{Math.max(0, value)}</p>
        <Button type="button" variant="ghost" size="icon-xs" onClick={onOpenInfoDialog}><Info /></Button>
      </div>
    </div>
  );
});

ArmorClassCard.displayName = 'ArmorClassCard';
