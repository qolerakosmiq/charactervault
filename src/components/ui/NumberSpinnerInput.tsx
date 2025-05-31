
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
  readOnly?: boolean; // New prop
  isIncrementDisabled?: boolean; // New prop
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
  readOnly = false, // Default to false
  isIncrementDisabled = false, // Default to false
}: NumberSpinnerInputProps) {
  const [internalDisplayValue, setInternalDisplayValue] = React.useState(String(value));

  React.useEffect(() => {
    // Only update internal display if not focused or if it's readOnly (to reflect external changes)
    if (readOnly || document.activeElement !== document.getElementById(id || '')) {
      setInternalDisplayValue(String(value));
    }
  }, [value, id, readOnly]);

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

    num = Math.max(min === -Infinity ? -Infinity : (Number.isFinite(min) ? min! : 0), Math.min(max === Infinity ? Infinity : (Number.isFinite(max) ? max! : Infinity), num));
    const finalNum = parseFloat(num.toFixed(precision)); 
    
    if (finalNum !== value || String(finalNum) !== String(value)) {
        onChange(finalNum);
    }
    // Always update display to reflect committed value, especially if it was clamped or corrected
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
    if (disabled || isIncrementDisabled) return; // Check external disable
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
        // Allow arrows for accessibility if buttons are focused, but not direct input change
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

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <Button
        type="button"
        variant="ghost"
        size={buttonSize}
        className={cn("p-0", buttonClassName)}
        onClick={handleDecrement}
        disabled={disabled || Number(value) <= (min === -Infinity ? -Infinity : (Number.isFinite(min) ? min! : -Infinity))}
        aria-label="Decrement"
      >
        <MinusCircle className="h-4 w-4" />
      </Button>
      <Input
        id={id}
        type="text" 
        inputMode="decimal" 
        value={internalDisplayValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        disabled={disabled}
        readOnly={readOnly} // Apply readOnly here
        className={cn(
            "w-12 h-8 text-center appearance-none", 
            inputClassName
        )}
        style={{ MozAppearance: 'textfield' }} 
        aria-live="polite"
      />
      <Button
        type="button"
        variant="ghost"
        size={buttonSize}
        className={cn("p-0", buttonClassName)}
        onClick={handleIncrement}
        disabled={disabled || Number(value) >= (max === Infinity ? Infinity : (Number.isFinite(max) ? max! : Infinity)) || isIncrementDisabled} // Use isIncrementDisabled
        aria-label="Increment"
      >
        <PlusCircle className="h-4 w-4" />
      </Button>
    </div>
  );
}
