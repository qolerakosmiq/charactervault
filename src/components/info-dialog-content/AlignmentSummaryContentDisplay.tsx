
'use client';

import React from 'react';

interface AlignmentSummaryContentDisplayProps {
  htmlContent?: string;
}

export const AlignmentSummaryContentDisplay: React.FC<AlignmentSummaryContentDisplayProps> = ({
  htmlContent,
}) => {
  return (
    <>
      {htmlContent && (
        <div
          className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      )}
    </>
  );
};
