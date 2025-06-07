
'use client';

import React from 'react';

interface DeityContentDisplayProps {
  htmlContent?: string;
}

export const DeityContentDisplay = React.memo(function DeityContentDisplayComponent({
  htmlContent,
}: DeityContentDisplayProps) {
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
});
DeityContentDisplay.displayName = 'DeityContentDisplay';
