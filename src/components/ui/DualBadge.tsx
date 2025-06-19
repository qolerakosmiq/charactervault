
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
// Removed: import { Badge, type BadgeProps } from "@/components/ui/badge"; // No longer using internal Badges

interface DualBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  leftLabel: React.ReactNode;
  rightLabel: React.ReactNode;
  leftClassName?: string;
  rightClassName?: string;
  // Removed: leftVariant, rightVariant, separatorClassName
}

export function DualBadge({
  leftLabel,
  rightLabel,
  className,
  leftClassName,
  rightClassName,
  ...props
}: DualBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-stretch rounded-full overflow-hidden shadow-sm text-xs font-medium", // Base badge-like text styling
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "px-2 py-0.5", // Consistent padding like a badge
          leftClassName
        )}
      >
        {leftLabel}
      </span>
      <span
        className={cn(
          "px-2 py-0.5", // Consistent padding like a badge
          rightClassName
        )}
      >
        {rightLabel}
      </span>
    </div>
  );
}

DualBadge.displayName = "DualBadge";
