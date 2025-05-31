
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MinusCircle, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}: NumberSpinnerInputProps) {
  const [internalDisplayValue, setInternalDisplayValue] = React.useState(String(value));

  React.useEffect(() => {
    // Sync display when the external value prop changes,
    // but only if the input is not currently focused to avoid disrupting typing.
    if (document.activeElement !== document.getElementById(id || '')) {
      setInternalDisplayValue(String(value));
    }
  }, [value, id]);

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
      // If parsing fails, revert to the current prop value or min if prop value is also bad
      num = Number.isFinite(value) ? value : (min !== -Infinity ? min : 0);
    }

    num = Math.max(min, Math.min(max, num)); // Clamp
    const finalNum = parseFloat(num.toFixed(precision)); // Apply precision
    
    // Only call onChange if the value has effectively changed
    // This prevents potential loops if parent re-renders with the exact same numeric value
    if (finalNum !== value || String(finalNum) !== String(value)) {
        onChange(finalNum);
    }
    // Always update display to the cleaned/committed value
    setInternalDisplayValue(String(finalNum));
  };

  const handleDecrement = () => {
    if (disabled) return;
    const currentNumericValue = Number(value); // Use the committed prop value for calculation
    if (isNaN(currentNumericValue)) {
        handleCommit(min !== -Infinity ? min : 0); // If current value is bad, commit min
        return;
    }
    handleCommit(currentNumericValue - step);
  };

  const handleIncrement = () => {
    if (disabled) return;
    const currentNumericValue = Number(value); // Use the committed prop value for calculation
    if (isNaN(currentNumericValue)) {
        handleCommit(min !== -Infinity ? min : 0); // If current value is bad, commit min
        return;
    }
    handleCommit(currentNumericValue + step);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalDisplayValue(e.target.value); // Allow any typing for immediate feedback
  };

  const handleInputBlur = () => {
    handleCommit(internalDisplayValue); // Validate, clamp, format, and call onChange on blur
  };
  
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit(internalDisplayValue);
      (e.target as HTMLInputElement).blur(); // Optional: blur on enter
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrement();
    }
  };

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <Button
        type="button"
        variant="ghost" // Changed from "outline"
        size={buttonSize}
        className={cn("p-0", buttonClassName)}
        onClick={handleDecrement}
        disabled={disabled || Number(value) <= min}
        aria-label="Decrement"
      >
        <MinusCircle className="h-4 w-4" />
      </Button>
      <Input
        id={id}
        type="text" // Use text for more flexible input
        inputMode="decimal" // Hint for mobile keyboards
        value={internalDisplayValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        disabled={disabled}
        className={cn(
            "w-12 h-8 text-center appearance-none", // Default width, can be overridden by inputClassName
            inputClassName
        )}
        style={{ MozAppearance: 'textfield' }} // For Firefox to hide native spinners
        aria-live="polite"
      />
      <Button
        type="button"
        variant="ghost" // Changed from "outline"
        size={buttonSize}
        className={cn("p-0", buttonClassName)}
        onClick={handleIncrement}
        disabled={disabled || Number(value) >= max}
        aria-label="Increment"
      >
        <PlusCircle className="h-4 w-4" />
      </Button>
    </div>
  );
}
