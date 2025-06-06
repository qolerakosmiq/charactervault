
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export const renderModifierValue = (value: number | string): React.ReactNode => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return <span className="font-bold">{value}</span>;
  if (numValue === 0) return <span className="font-bold text-muted-foreground">+0</span>;
  if (numValue > 0) return <span className="font-bold text-emerald-500">+{numValue}</span>;
  return <span className="font-bold text-destructive">{numValue}</span>;
};

export const ExpandableDetailWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="px-3 py-1 rounded-md bg-muted/20 border border-border/30">
      {children}
    </div>
  );
};

export const sectionHeadingClass = "text-md font-semibold mb-2 text-primary";
