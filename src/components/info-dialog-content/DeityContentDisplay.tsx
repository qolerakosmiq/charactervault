
'use client';

import React from 'react';
import { Separator } from '@/components/ui/separator';
import { sectionHeadingClass } from './dialog-utils';
import type { DndDeityOption } from '@/types/character-core'; // Use DndDeityOption from core

interface DeityContentDisplayProps {
  deityData?: DndDeityOption; // Changed to accept DndDeityOption
  uiStrings: Record<string, string>;
}

export const DeityContentDisplay = ({
  deityData,
  uiStrings,
}: DeityContentDisplayProps) => {
  if (!deityData) {
    return (
      <p className="text-sm text-muted-foreground">
        {uiStrings.infoDialogDeityPlaceholder || "Select or type a deity to see more information."}
      </p>
    );
  }

  // Fallback for older data structure or if attributes are missing
  if (!deityData.attributes || deityData.attributes.length === 0) {
    const fallbackDescription = (deityData as any).description; // Access potentially old description
    if (fallbackDescription && typeof fallbackDescription === 'string') {
       return (
        <div
          className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: fallbackDescription }}
        />
      );
    }
    return <p className="text-sm text-muted-foreground">{uiStrings.infoDialogDeityPlaceholder || "Detailed information not available."}</p>;
  }


  return (
    <div className="space-y-3">
      {deityData.fullName && (
        <h3 className={sectionHeadingClass}>
          {deityData.fullName}
        </h3>
      )}
      
      {deityData.attributes.map((attr, index) => (
        <div key={index} className="flex justify-between text-sm">
          <span className="text-foreground font-semibold">{attr.key}</span>
          <span className="text-foreground text-right">{attr.value}</span>
        </div>
      ))}
    </div>
  );
};
