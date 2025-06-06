
'use client';

import React from 'react';

interface DeityContentDisplayProps {
  htmlContent?: string;
}

export const DeityContentDisplay: React.FC<DeityContentDisplayProps> = ({
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
