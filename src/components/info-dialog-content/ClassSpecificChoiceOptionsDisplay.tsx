
'use client';

import React from 'react';
import { Separator } from '@/components/ui/separator';
import { sectionHeadingClass } from './dialog-utils'; // Assuming this utility class exists

interface ClassSpecificChoiceOptionsDisplayProps {
  title: string; // The title is already localized and passed from the parent
  options: Array<{ id: string; label: string; description?: string }>;
  uiStrings: Record<string, string>;
}

export const ClassSpecificChoiceOptionsDisplay: React.FC<ClassSpecificChoiceOptionsDisplayProps> = ({
  title, // This component doesn't need to localize the title again
  options,
  uiStrings,
}) => {
  if (!options || options.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {uiStrings.infoDialogNoOptionsAvailable || "No options available for this choice."}
      </p>
    );
  }

  // The main dialog title is handled by InfoDisplayDialog.tsx
  // This component focuses on rendering the list of options.

  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <React.Fragment key={option.id}>
          <div>
            {/* Option Label as a sub-heading if needed, or directly in description */}
            <h3 className={sectionHeadingClass} style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}> {/* Slightly smaller heading for options */}
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
