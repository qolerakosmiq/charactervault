
'use client';

import *as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nProvider';

interface LockablePanelWrapperProps {
  title: string;
  description?: string; 
  icon: React.ElementType;
  children: React.ReactNode | (({ isLocked }: { isLocked: boolean }) => React.ReactNode);
  initialLockedState?: boolean;
  onLockChange?: (isLocked: boolean) => void;
  cardClassName?: string;
  cardContentClassName?: string;
  headerClassName?: string;
  headerActions?: ((isPanelLocked: boolean) => React.ReactNode) | React.ReactNode;
}

const LockablePanelWrapperComponent = ({
  title,
  description,
  icon: Icon,
  children,
  initialLockedState = false,
  onLockChange,
  cardClassName,
  cardContentClassName,
  headerClassName,
  headerActions,
}: LockablePanelWrapperProps) => {
  const [isLocked, setIsLocked] = React.useState(initialLockedState);
  const { translations } = useI18n();

  const toggleLock = React.useCallback(() => {
    setIsLocked(prev => {
      const newLockState = !prev;
      if (onLockChange) {
        onLockChange(newLockState);
      }
      return newLockState;
    });
  }, [onLockChange]);

  const uiStrings = translations?.UI_STRINGS;
  const lockAriaLabel = isLocked
    ? uiStrings?.lockButtonAriaLabelUnlocked
    : uiStrings?.lockButtonAriaLabelLocked;

  return (
    <Card className={cardClassName}>
      <CardHeader className={cn("relative p-4 bg-muted/20", headerClassName)}>
        <div className="flex items-start gap-3 pr-10">
          {Icon && <Icon className="text-primary h-7 w-7" />}
          <div>
            <CardTitle className="font-serif text-xl">{title}</CardTitle>
            {description && <CardDescription className="text-base">{description}</CardDescription>}
          </div>
        </div>
        <div className="absolute top-4 right-4 flex">
          {typeof headerActions === 'function' ? headerActions(isLocked) : headerActions}
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
      </CardHeader>
      <CardContent className={cardContentClassName}>
        {typeof children === 'function' ? children({ isLocked }) : children}
      </CardContent>
    </Card>
  );
};

LockablePanelWrapperComponent.displayName = "LockablePanelWrapperComponent";
export const LockablePanelWrapper = React.memo(LockablePanelWrapperComponent);
