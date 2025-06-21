
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
      <CardHeader className={cn("flex justify-between items-start p-4", headerClassName)}>
        <div className="flex items-center space-x-3">
          {Icon && <Icon className="text-primary" />}
          <div>
            <CardTitle className="font-serif">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
        <div className="flex">
          {typeof headerActions === 'function' ? headerActions(isLocked) : headerActions}
          <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleLock}
              aria-label={lockAriaLabel}
              aria-pressed={!isLocked}
              className={cn(
                "shrink-0", 
                isLocked
                  ? "text-muted-foreground hover:text-foreground"
                  : "bg-accent text-accent-foreground hover:bg-accent/90"
              )}
            >
              {isLocked ? <Lock /> : <Unlock />}
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
