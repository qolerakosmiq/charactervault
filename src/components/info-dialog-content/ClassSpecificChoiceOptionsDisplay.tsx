
'use client';

import React from 'react';
import { Separator } from '@/components/ui/separator';
import { sectionHeadingClass } from './dialog-utils'; // Assuming this utility class exists

interface ClassSpecificChoiceOptionsDisplayProps {
  title: string; 
  introductoryContentHtml?: string; // Added prop for general description
  options: Array<{ id: string; label: string; description?: string }>;
  uiStrings: Record<string, string>;
}

export const ClassSpecificChoiceOptionsDisplay: React.FC<ClassSpecificChoiceOptionsDisplayProps> = ({
  title, 
  introductoryContentHtml, // Destructure new prop
  options,
  uiStrings,
}) => {

  // The main dialog title is handled by InfoDisplayDialog.tsx.
  // This component focuses on rendering the introductory content and the list of options.

  return (
    <div className="space-y-3">
      {introductoryContentHtml && (
        <>
          <div
            className="text-sm prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: introductoryContentHtml }}
          />
          {options && options.length > 0 && <Separator className="my-3" />}
        </>
      )}

      {(!options || options.length === 0) && !introductoryContentHtml && (
         <p className="text-sm text-muted-foreground">
            {uiStrings.infoDialogNoOptionsAvailable || "No options available for this choice."}
         </p>
      )}

      {options && options.length > 0 && options.map((option, index) => (
        <React.Fragment key={option.id}>
          <div>
            <h3 className={sectionHeadingClass} style={{ fontSize: '1.0rem', marginBottom: '0.25rem', marginTop: index > 0 || introductoryContentHtml ? '0.75rem' : '0' }}>
              {option.label}
            </h3>
            {option.description && (
              <div
                className="text-sm prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: option.description }}
              />
            )}
            {!option.description && (
              <p className="text-sm text-muted-foreground italic">
                {uiStrings.infoDialogNoDescriptionAvailable || "No description available."}
              </p>
            )}
          </div>
          {index < options.length - 1 && <Separator className="my-3" />}
        </React.Fragment>
      ))}
    </div>
  );
};
