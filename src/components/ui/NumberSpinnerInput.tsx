
'use client';

import *as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MinusCircle, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Thresholds in REM units for hysteresis, now based on TOTAL COMPONENT WIDTH.
// If total component width is less than HIDE_THRESHOLD, hide buttons.
const MIN_TOTAL_WIDTH_FOR_BUTTONS_TO_HIDE_REM = 7.5; // Approx 120px. (e.g., 2rem input + 5rem buttons + 0.5rem space)
// If total component width is more than SHOW_THRESHOLD (and buttons are hidden), show them.
const MIN_TOTAL_WIDTH_FOR_BUTTONS_TO_SHOW_REM = 8.0; // Approx 128px.

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
  const wrapperRef = React.useRef<HTMLDivElement>(null); // Ref for the root div
  const [showButtons, setShowButtons] = React.useState(true);
  const observerDebounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);


  React.useEffect(() => {
    if (readOnly || document.activeElement !== wrapperRef.current?.querySelector('input')) {
      setInternalDisplayValue(String(value));
    }
  }, [value, readOnly]);

  const calculateAndSetVisibility = React.useCallback((componentTotalWidthPx: number) => {
    if (!document.documentElement) return;
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    
    const thresholdHidePx = MIN_TOTAL_WIDTH_FOR_BUTTONS_TO_HIDE_REM * rootFontSize;
    const thresholdShowPx = MIN_TOTAL_WIDTH_FOR_BUTTONS_TO_SHOW_REM * rootFontSize;

    setShowButtons(prevShowButtons => {
      let newShouldShow = prevShowButtons;
      if (prevShowButtons) { // If buttons are currently shown
        if (componentTotalWidthPx < thresholdHidePx) newShouldShow = false;
      } else { // If buttons are currently hidden
        if (componentTotalWidthPx > thresholdShowPx) newShouldShow = true;
      }
      return newShouldShow === prevShowButtons ? prevShowButtons : newShouldShow;
    });
  }, []);

  React.useEffect(() => {
    const wrapperElement = wrapperRef.current;
    if (!wrapperElement) return;

    let debounceTimer: NodeJS.Timeout;
    const debouncedCalculate = (width: number) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        calculateAndSetVisibility(width);
      }, OBSERVER_DEBOUNCE_MS);
    };

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      debouncedCalculate(entries[0].contentRect.width);
    });

    observer.observe(wrapperElement);

    const initialCheckTimeoutId = setTimeout(() => {
      if (wrapperElement) {
        calculateAndSetVisibility(wrapperElement.offsetWidth);
      }
    }, INITIAL_CHECK_DELAY_MS);

    return () => {
      clearTimeout(debounceTimer);
      clearTimeout(initialCheckTimeoutId);
      observer.disconnect();
    };
  }, [calculateAndSetVisibility]);


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
    <div ref={wrapperRef} className={cn("flex items-center", className, shouldRenderButtons && "space-x-1")}>
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
            shouldRenderButtons ? "flex-shrink min-w-[2rem]" : "flex-grow w-full" 
            // If buttons show, input can shrink but has a min-width.
            // If buttons hidden, input takes full available space.
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
    
