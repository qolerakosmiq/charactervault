
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MinusCircle, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Threshold: approx width of "9999" at text-sm (14px font) which is ~28px,
// plus typical padding (12px L + 12px R = 24px) and border (1px L + 1px R = 2px).
// Total ~54px. Using 60px (3.75rem) for a bit of buffer.
const MIN_INPUT_WIDTH_FOR_BUTTONS_PX = 60;

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

  React.useEffect(() => {
    if (readOnly || document.activeElement !== inputRef.current) {
      setInternalDisplayValue(String(value));
    }
  }, [value, readOnly]);

  React.useEffect(() => {
    const checkWidths = () => {
      const inputEl = inputRef.current;
      if (!inputEl) {
        setShowButtons(true); // Default to showing if no element yet
        return;
      }
      if (inputEl.offsetWidth < MIN_INPUT_WIDTH_FOR_BUTTONS_PX) {
        setShowButtons(false);
      } else {
        setShowButtons(true);
      }
    };

    // Initial check
    checkWidths();

    const inputElForObserver = inputRef.current;
    if (!inputElForObserver) return;

    const resizeObserver = new ResizeObserver(() => {
      checkWidths();
    });

    resizeObserver.observe(inputElForObserver);

    return () => {
      resizeObserver.unobserve(inputElForObserver);
    };
  }, [inputClassName]); // Re-check if inputClassName changes, as it might affect width

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
  const shouldDisplayButtons = !disabled && showButtons;

  return (
    <div className={cn(
      "flex items-center",
      shouldDisplayButtons && "space-x-1", 
      className
    )}>
      {shouldDisplayButtons && (
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
            !shouldDisplayButtons && "w-full" 
        )}
        style={{ MozAppearance: 'textfield' }} 
        aria-live="polite"
      />
      {shouldDisplayButtons && (
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
