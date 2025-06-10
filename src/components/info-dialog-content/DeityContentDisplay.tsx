
'use client';

import React from 'react';
import { Separator } from '@/components/ui/separator';
import { sectionHeadingClass } from './dialog-utils';
import type { DndDeityOption } from '@/types/character-core';
import { cn } from '@/lib/utils';

interface DeityContentDisplayProps {
  deityData?: DndDeityOption;
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

  // Local override for the main heading's bottom margin for this specific layout
  const modifiedFullNameHeadingClass = "text-lg font-semibold text-primary mb-0";

  return (
    <div>
      {deityData.fullName && (
        // The h3 itself will have no bottom margin; separator below handles spacing.
        <h3 className={modifiedFullNameHeadingClass}>{deityData.fullName}</h3>
      )}

      {deityData.attributes && deityData.attributes.length > 0 ? (
        // This div doesn't need extra top margin if deityData.fullName was rendered,
        // as the separator after fullName will provide the space.
        // If no fullName, then no top margin is needed before the first separator.
        <div>
          {deityData.attributes.map((attr, index) => (
            <React.Fragment key={index}>
              {/* Add separator before each attribute block.
                  If fullName exists, the first separator effectively comes after it.
                  If no fullName, the first attribute block won't have a separator before it.
                  If index > 0, it's always separating from a previous attribute block.
              */}
              {(index > 0 || deityData.fullName) && <Separator className="my-2" />}
              
              {/* Attribute block: key and value. No inherent top/bottom margins on this div. */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-0.5">{attr.key}</h4>
                <p className="text-sm text-foreground leading-snug">{attr.value}</p>
              </div>
            </React.Fragment>
          ))}
        </div>
      ) : (
         !deityData.fullName && ( // Only show placeholder if there's no fullName and no attributes
            <p className="text-sm text-muted-foreground">
                {uiStrings.infoDialogDeityPlaceholder || "Select or type a deity to see more information."}
            </p>
         )
      )}
    </div>
  );
};
