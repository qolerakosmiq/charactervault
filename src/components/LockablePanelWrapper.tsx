
'use client';

import *as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nProvider';

interface LockablePanelWrapperProps {
  title: string;
  description?: string; // Make description optional
  icon: React.ElementType;
  children: React.ReactNode | (({ isLocked }: { isLocked: boolean }) => React.ReactNode);
  initialLockedState?: boolean;
  onLockChange?: (isLocked: boolean) => void;
  cardClassName?: string;
  cardContentClassName?: string;
  headerActions?: React.ReactNode; // For extra buttons like "Roll Scores"
}

export function LockablePanelWrapper({
  title,
  description,
  icon: Icon,
  children,
  initialLockedState = false, // Default to unlocked for character creation
  onLockChange,
  cardClassName,
  cardContentClassName,
  headerActions,
}: LockablePanelWrapperProps) {
  const [isLocked, setIsLocked] = React.useState(initialLockedState);
  const { translations } = useI18n();

  const toggleLock = () => {
    const newLockState = !isLocked;
    setIsLocked(newLockState);
    if (onLockChange) {
      onLockChange(newLockState);
    }
  };

  const uiStrings = translations?.UI_STRINGS;
  const lockAriaLabel = isLocked
    ? (uiStrings?.lockButtonAriaLabelUnlocked || "Section is locked. Click to unlock.")
    : (uiStrings?.lockButtonAriaLabelLocked || "Section is unlocked. Click to lock.");

  return (
    <Card className={cardClassName}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            {Icon && <Icon className="h-8 w-8 text-primary" />}
            <div>
              <CardTitle className="text-2xl font-serif">{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
          </div>
          <div className="flex items-center gap-x-1">
            {headerActions}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleLock}
              aria-label={lockAriaLabel}
              aria-pressed={!isLocked}
              className={cn(
                "h-7 w-7 shrink-0 p-1.5",
                isLocked
                  ? "text-muted-foreground hover:text-foreground"
                  : "bg-accent text-accent-foreground hover:bg-accent/90"
              )}
            >
              {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cardContentClassName}>
        {typeof children === 'function' ? children({ isLocked }) : children}
      </CardContent>
    </Card>
  );
}
