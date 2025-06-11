
'use client';

import React from 'react';
import { Separator } from '@/components/ui/separator'; // Though we are removing, keep import for now if other parts might use it
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

  const modifiedFullNameHeadingClass = cn(sectionHeadingClass, "mb-0"); // Ensure fullName heading has no bottom margin

  return (
    <div>
      {deityData.fullName && (
        <h3 className={modifiedFullNameHeadingClass}>{deityData.fullName}</h3>
      )}

      {deityData.attributes && deityData.attributes.length > 0 ? (
        <div className={cn(deityData.fullName && "mt-3")}> {/* Add top margin only if fullName was present */}
          {deityData.attributes.map((attr, index) => (
            <React.Fragment key={index}>
              {/* No separator here */}
              <div className={cn(index > 0 && "mt-3")}> {/* Add top margin to subsequent attribute blocks */}
                <h4 className="text-sm font-medium text-muted-foreground mb-0.5">{attr.key}</h4>
                <p className="text-sm text-foreground">{attr.value}</p>
              </div>
            </React.Fragment>
          ))}
        </div>
      ) : (
         !deityData.fullName && (
            <p className="text-sm text-muted-foreground mt-3"> {/* Add margin if only this placeholder shows */}
                {uiStrings.infoDialogDeityPlaceholder || "Select or type a deity to see more information."}
            </p>
         )
      )}
    </div>
  );
};
