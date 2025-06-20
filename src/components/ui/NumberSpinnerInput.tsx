
'use client';

import *as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MinusCircle, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Thresholds in REM units for hysteresis.
const MIN_INPUT_WIDTH_REM_FOR_BUTTONS_TO_HIDE = 3.75; // Approx 60px. Buttons hide if width < this.
const MIN_INPUT_WIDTH_REM_FOR_BUTTONS_TO_SHOW = 3.85; // Approx 61.6px. Buttons show if width > this (when already hidden).

interface NumberSpinnerInputProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  id?: string;
  readOnly?: boolean;
  isIncrementDisabled?: boolean;
}

export function NumberSpinnerInput({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  disabled = false,
  className,
  inputClassName,
  buttonClassName,
  buttonSize = 'icon',
  id,
  readOnly = false,
  isIncrementDisabled = false,
}: NumberSpinnerInputProps) {
  const [internalDisplayValue, setInternalDisplayValue] = React.useState(String(value));
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [showButtons, setShowButtons] = React.useState(true);
  const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (readOnly || document.activeElement !== inputRef.current) {
      setInternalDisplayValue(String(value));
    }
  }, [value, readOnly]);

  React.useEffect(() => {
    const inputElement = inputRef.current;
    if (!inputElement) return;

    let debounceTimer: NodeJS.Timeout | null = null;

    const resizeObserverCallback = (entries: ResizeObserverEntry[]) => {
      if (!entries || entries.length === 0) return;
      const currentWidth = entries[0].contentRect.width;

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!document.documentElement) return; // Guard against null documentElement
        const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        const thresholdHidePx = MIN_INPUT_WIDTH_REM_FOR_BUTTONS_TO_HIDE * rootFontSize;
        const thresholdShowPx = MIN_INPUT_WIDTH_REM_FOR_BUTTONS_TO_SHOW * rootFontSize;

        setShowButtons(prevShowButtons => {
          let newShouldShow = prevShowButtons;
          if (prevShowButtons) { // If buttons are currently shown
            if (currentWidth < thresholdHidePx) newShouldShow = false;
          } else { // If buttons are currently hidden
            if (currentWidth > thresholdShowPx) newShouldShow = true;
          }
          // Only return a new value if it's different, to prevent unnecessary re-renders
          return prevShowButtons === newShouldShow ? prevShowButtons : newShouldShow;
        });
      }, 50); // Debounce for 50ms
    };

    const observer = new ResizeObserver(resizeObserverCallback);
    observer.observe(inputElement);

    // Perform an initial check manually after a very short delay for initial layout
    const initialCheckTimeoutId = setTimeout(() => {
        if (inputElement) { // Check if element still exists
            resizeObserverCallback([{ contentRect: inputElement.getBoundingClientRect() } as ResizeObserverEntry]);
        }
    }, 10);


    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      clearTimeout(initialCheckTimeoutId);
      observer.disconnect();
    };
  }, [inputClassName]); // Re-run if inputClassName changes, which can affect initial width

  const getPrecision = (s: number) => {
    const stepStr = String(s);
    if (stepStr.includes('.')) {
      return stepStr.split('.')[1].length;
    }
    return 0;
  };

  const precision = getPrecision(step);

  const handleCommit = (valToCommit: number | string) => {
    let num = typeof valToCommit === 'string' ? parseFloat(valToCommit) : valToCommit;
    
    if (isNaN(num)) {
      num = Number.isFinite(value) ? value : (min !== -Infinity && Number.isFinite(min) ? min : 0);
    }

    const minBound = Number.isFinite(min) ? min! : -Infinity;
    const maxBound = Number.isFinite(max) ? max! : Infinity;
    num = Math.max(minBound, Math.min(maxBound, num));
    const finalNum = parseFloat(num.toFixed(precision)); 
    
    if (finalNum !== value || String(finalNum) !== String(value)) {
        onChange(finalNum);
    }
    setInternalDisplayValue(String(finalNum));
  };

  const handleDecrement = () => {
    if (disabled) return;
    const currentNumericValue = Number(value); 
    if (isNaN(currentNumericValue)) {
        handleCommit(min !== -Infinity && Number.isFinite(min) ? min : 0);
        return;
    }
    handleCommit(currentNumericValue - step);
  };

  const handleIncrement = () => {
    if (disabled || isIncrementDisabled) return;
    const currentNumericValue = Number(value); 
    if (isNaN(currentNumericValue)) {
        handleCommit(min !== -Infinity && Number.isFinite(min) ? min : 0);
        return;
    }
    handleCommit(currentNumericValue + step);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    setInternalDisplayValue(e.target.value); 
  };

  const handleInputBlur = () => {
    if (readOnly) return;
    handleCommit(internalDisplayValue); 
  };
  
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (readOnly) {
        if (e.key === 'ArrowUp') { e.preventDefault(); handleIncrement(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); handleDecrement(); }
        return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit(internalDisplayValue);
      (e.target as HTMLInputElement).blur(); 
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrement();
    }
  };

  const minBoundCheck = Number.isFinite(min) ? min! : -Infinity;
  const maxBoundCheck = Number.isFinite(max) ? max! : Infinity;
  
  const shouldRenderButtons = !disabled && showButtons;

  return (
    <div className={cn(
      "flex items-center",
      shouldRenderButtons && "space-x-1", 
      className
    )}>
      {shouldRenderButtons && (
        <Button
          type="button"
          variant="ghost"
          size={buttonSize}
          className={cn("p-0 aspect-square flex-none", buttonClassName)}
          onClick={handleDecrement}
          disabled={Number(value) <= minBoundCheck}
          aria-label="Decrement"
        >
          <MinusCircle className="h-4 w-4" />
        </Button>
      )}
      <Input
        ref={inputRef}
        id={id}
        type="text" 
        inputMode="decimal" 
        value={internalDisplayValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        disabled={disabled}
        readOnly={readOnly}
        className={cn(
            "text-center appearance-none", 
            inputClassName,
            !shouldRenderButtons && "w-full"
        )}
        style={{ MozAppearance: 'textfield' }} 
        aria-live="polite"
      />
      {shouldRenderButtons && (
        <Button
          type="button"
          variant="ghost"
          size={buttonSize}
          className={cn("p-0 aspect-square flex-none", buttonClassName)}
          onClick={handleIncrement}
          disabled={Number(value) >= maxBoundCheck || isIncrementDisabled}
          aria-label="Increment"
        >
          <PlusCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

NumberSpinnerInput.displayName = "NumberSpinnerInput";
    
