
'use client';

import React from 'react';
import { Separator } from '@/components/ui/separator';
import { sectionHeadingClass } from './dialog-utils';
import type { DndDeityOption } from '@/types/character-core';

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

  return (
    <div className="space-y-1">
      {deityData.fullName && (
        <>
          <h3 className={sectionHeadingClass}>
            {deityData.fullName}
          </h3>
          {deityData.attributes && deityData.attributes.length > 0 && <Separator className="my-3" />}
        </>
      )}
      
      {deityData.attributes && deityData.attributes.length > 0 ? (
        deityData.attributes.map((attr, index) => (
          <React.Fragment key={index}>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mt-2 mb-0.5">{attr.key}</h4>
              <p className="text-sm text-foreground">{attr.value}</p>
            </div>
            {index < deityData.attributes.length - 1 && <Separator className="my-2" />}
          </React.Fragment>
        ))
      ) : (
         !deityData.fullName && <p className="text-sm text-muted-foreground">{uiStrings.infoDialogDeityPlaceholder || "Detailed information not available."}</p>
      )}
    </div>
  );
};

