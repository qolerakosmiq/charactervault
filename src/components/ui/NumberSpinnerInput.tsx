
'use client';

import *as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MinusCircle, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Thresholds in REM units for hysteresis.
const MIN_INPUT_WIDTH_REM_FOR_BUTTONS_TO_HIDE = 3.75; // Approx 60px. If input field (with buttons visible) is narrower, hide buttons.
const MIN_INPUT_WIDTH_REM_FOR_BUTTONS_TO_SHOW = 5.0;  // Approx 80px. If input field (full width, buttons hidden) is wider, show buttons.
const OBSERVER_DEBOUNCE_MS = 100;
const INITIAL_CHECK_DELAY_MS = 100;

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
  // Using a ref for the debounce timer to avoid including it in useEffect dependencies
  const observerDebounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);


  React.useEffect(() => {
    if (readOnly || document.activeElement !== inputRef.current) {
      setInternalDisplayValue(String(value));
    }
  }, [value, readOnly]);

  React.useEffect(() => {
    const inputElement = inputRef.current;
    if (!inputElement) return;

    const calculateAndSetVisibility = (currentWidthPx: number) => {
        if (!document.documentElement) return;
        const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        const thresholdHidePx = MIN_INPUT_WIDTH_REM_FOR_BUTTONS_TO_HIDE * rootFontSize;
        const thresholdShowPx = MIN_INPUT_WIDTH_REM_FOR_BUTTONS_TO_SHOW * rootFontSize;

        setShowButtons((prevShowButtons) => {
            let newShouldShow = prevShowButtons;
            if (prevShowButtons) { // If buttons are currently shown
                if (currentWidthPx < thresholdHidePx) newShouldShow = false;
            } else { // If buttons are currently hidden
                if (currentWidthPx > thresholdShowPx) newShouldShow = true;
            }
            return newShouldShow; // React only re-renders if newShouldShow is different
        });
    };
    
    const observer = new ResizeObserver((entries) => {
        if (!entries || entries.length === 0) return;
        const currentWidthPx = entries[0].contentRect.width;

        if (observerDebounceTimerRef.current) clearTimeout(observerDebounceTimerRef.current);
        observerDebounceTimerRef.current = setTimeout(() => {
            calculateAndSetVisibility(currentWidthPx);
        }, OBSERVER_DEBOUNCE_MS);
    });

    observer.observe(inputElement);

    const initialCheckTimeoutId = setTimeout(() => {
        if (inputElement) {
            calculateAndSetVisibility(inputElement.offsetWidth);
        }
    }, INITIAL_CHECK_DELAY_MS);

    return () => {
        if (observerDebounceTimerRef.current) clearTimeout(observerDebounceTimerRef.current);
        clearTimeout(initialCheckTimeoutId);
        observer.disconnect();
    };
  }, [inputClassName]); // Re-run if inputClassName changes, which can affect initial width/styling.

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
            !shouldRenderButtons && "w-full" // Input takes full width if buttons are hidden
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
    
