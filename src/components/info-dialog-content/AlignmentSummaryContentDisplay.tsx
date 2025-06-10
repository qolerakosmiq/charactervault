
'use client';

import React from 'react';
import { Separator } from '@/components/ui/separator';
import { sectionHeadingClass } from './dialog-utils';
import type { CharacterAlignmentObject } from '@/types/character';

interface AlignmentSummaryContentDisplayProps {
  alignments?: readonly CharacterAlignmentObject[];
  uiStrings?: Record<string, string>;
}

export const AlignmentSummaryContentDisplay = ({
  alignments,
  uiStrings,
}: AlignmentSummaryContentDisplayProps) => {
  if (!alignments || alignments.length === 0 || !uiStrings) return null;

  return (
    <div className="space-y-3">
      {alignments.map((alignment, index) => (
        <React.Fragment key={alignment.value}>
          <div>
            <h3 className={sectionHeadingClass}>
              {alignment.label}
            </h3>
            <div
              className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: alignment.description }}
            />
          </div>
          {index < alignments.length - 1 && <Separator className="my-3" />}
        </React.Fragment>
      ))}
    </div>
  );
};
