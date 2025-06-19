
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DualBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  leftLabel: React.ReactNode;
  rightLabel: React.ReactNode;
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
          "px-2 py-0.5 border-2 rounded-l-full", // Added rounded-l-full
          leftClassName
        )}
      >
        {leftLabel}
      </span>
      <span
        className={cn(
          "px-2 py-0.5 border-2 -ml-[2px] rounded-r-full", // Added rounded-r-full
          rightClassName
        )}
      >
        {rightLabel}
      </span>
    </div>
  );
}

DualBadge.displayName = "DualBadge";
