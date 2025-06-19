
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DualBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  leftLabel?: React.ReactNode;
  rightLabel?: React.ReactNode;
  leftClassName?: string;
  rightClassName?: string;
}

export function DualBadge({
  leftLabel,
  rightLabel,
  className,
  leftClassName,
  rightClassName,
  ...props
}: DualBadgeProps) {
  const hasLeft = leftLabel !== undefined && leftLabel !== null && leftLabel !== '';
  const hasRight = rightLabel !== undefined && rightLabel !== null && rightLabel !== '';

  if (!hasLeft && !hasRight) {
    return null;
  }

  return (
    <div
      className={cn(
        "inline-flex items-stretch rounded-full overflow-hidden shadow-sm text-xs font-medium",
        className
      )}
      {...props}
    >
      {hasLeft && (
        <span
          className={cn(
            "px-2.5 py-0.5 border-2",
            hasRight ? "rounded-l-full border-r-0" : "rounded-full", // If no right, it's fully rounded
            leftClassName
          )}
        >
          {leftLabel}
        </span>
      )}
      {hasRight && (
        <span
          className={cn(
            "px-2.5 py-0.5 border-2",
            hasLeft ? "rounded-r-full border-l-0 -ml-[2px]" : "rounded-full", // If no left, it's fully rounded. Negative margin if left exists
            rightClassName
          )}
        >
          {rightLabel}
        </span>
      )}
    </div>
  );
}

DualBadge.displayName = "DualBadge";
