
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DualBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  leftLabel: React.ReactNode;
  rightLabel: React.ReactNode;
  leftClassName?: string;
  rightClassName?: string;
  // separatorClassName prop is no longer needed with this border approach
}

export function DualBadge({
  leftLabel,
  rightLabel,
  className, // For positioning/margins, not for border styling of the DualBadge itself
  leftClassName,
  rightClassName,
  ...props
}: DualBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-stretch rounded-full overflow-hidden shadow-sm text-xs font-medium",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "px-2 py-0.5 border-2", // Each part has a 2px border
          leftClassName // Will receive border-color, bg-color, text-color
        )}
      >
        {leftLabel}
      </span>
      <span
        className={cn(
          "px-2 py-0.5 border-2 -ml-[2px]", // Overlap borders by 2px (the border width)
          rightClassName // Will receive border-color, bg-color, text-color
        )}
      >
        {rightLabel}
      </span>
    </div>
  );
}

DualBadge.displayName = "DualBadge";
