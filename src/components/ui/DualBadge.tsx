
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge, type BadgeProps } from "@/components/ui/badge";

interface DualBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  leftLabel: React.ReactNode;
  rightLabel: React.ReactNode;
  leftVariant?: BadgeProps['variant'];
  rightVariant?: BadgeProps['variant'];
  leftClassName?: string;
  rightClassName?: string;
  separatorClassName?: string;
}

export function DualBadge({
  leftLabel,
  rightLabel,
  leftVariant = "outline",
  rightVariant = "default",
  className,
  leftClassName,
  rightClassName,
  separatorClassName,
  ...props
}: DualBadgeProps) {
  return (
    <div className={cn("inline-flex items-stretch rounded-full border overflow-hidden shadow-sm", className)} {...props}>
      <Badge
        variant={leftVariant}
        className={cn(
          "rounded-none border-0 border-r", // Left part has a right border to act as separator if right is not filled
          separatorClassName,
          leftClassName
        )}
      >
        {leftLabel}
      </Badge>
      <Badge
        variant={rightVariant}
        className={cn(
          "rounded-none border-0",
          rightClassName
        )}
      >
        {rightLabel}
      </Badge>
    </div>
  );
}

DualBadge.displayName = "DualBadge";

    