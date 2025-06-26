
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type DualBadgeColor = 'primary' | 'secondary' | 'accent' | 'destructive' | 'emerald' | 'default';

export interface DualBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  leftLabel?: React.ReactNode;
  rightLabel?: React.ReactNode;
  color?: DualBadgeColor;
}

const colorStyles: Record<DualBadgeColor, {
  borderColor: string;
  bgColor: string;
  textColor: string;
}> = {
  primary: { borderColor: "border-primary", bgColor: "bg-primary", textColor: "text-primary-foreground" },
  secondary: { borderColor: "border-secondary", bgColor: "bg-secondary", textColor: "text-secondary-foreground" },
  accent: { borderColor: "border-accent", bgColor: "bg-accent", textColor: "text-accent-foreground" },
  destructive: { borderColor: "border-destructive", bgColor: "bg-destructive", textColor: "text-destructive-foreground" },
  emerald: { borderColor: "border-emerald-600", bgColor: "bg-emerald-600", textColor: "text-emerald-50" },
  default: { borderColor: "border-border", bgColor: "bg-muted", textColor: "text-muted-foreground" },
};

export function DualBadge({
  leftLabel,
  rightLabel,
  color = 'default',
  className,
  ...props
}: DualBadgeProps) {
  const hasLeft = leftLabel !== undefined && leftLabel !== null && leftLabel !== '';
  const hasRight = rightLabel !== undefined && rightLabel !== null && rightLabel !== '';

  if (!hasLeft && !hasRight) {
    return null;
  }

  const styles = colorStyles[color];

  return (
    <div
      className={cn(
        "inline-flex items-stretch rounded-full overflow-hidden shadow-sm text-sm font-medium whitespace-nowrap shrink-0",
        className
      )}
      {...props}
    >
      {hasLeft && (
        <span
          className={cn(
            "bg-transparent text-foreground border-2 rounded-l-full border-r-0",
            "px-2.5 py-0.5",
            styles.borderColor,
            !hasRight && "rounded-r-full border-r-2"
          )}
        >
          {leftLabel}
        </span>
      )}
      {hasRight && (
        <span
          className={cn(
            "border-2 rounded-r-full",
            "px-2.5 py-0.5",
            styles.borderColor,
            styles.bgColor,
            styles.textColor,
            hasLeft && "border-l-0 -ml-[2px]"
          )}
        >
          {rightLabel}
        </span>
      )}
    </div>
  );
}

DualBadge.displayName = "DualBadge";
