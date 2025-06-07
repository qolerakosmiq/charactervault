
'use client';

import React from 'react';

interface GenericHtmlContentDisplayProps {
  htmlContent?: string;
}

export const GenericHtmlContentDisplay = ({
  htmlContent,
}: GenericHtmlContentDisplayProps) => {
  if (!htmlContent) return null;

  return (
    <div
      className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
// GenericHtmlContentDisplay.displayName = 'GenericHtmlContentDisplayComponent';
