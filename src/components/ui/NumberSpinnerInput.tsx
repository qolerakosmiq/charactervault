
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
  readOnly?: boolean;
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
  readOnly = false,
  className,
  inputClassName,
  buttonClassName,
  buttonSize = 'icon',
  id,
}: NumberSpinnerInputProps) {
  const handleDecrement = () => {
    if (readOnly || disabled) return;
    
    const numericValue = Number(value);
    if (isNaN(numericValue)) return;

    const newValue = Math.max(min, numericValue - step);
    
    const stepStr = String(step);
    const decimalPart = stepStr.split('.')[1];
    const precision = decimalPart ? decimalPart.length : 0;
    
    const numericNewValue = Number(newValue);
    if (isNaN(numericNewValue)) return;

    onChange(parseFloat(numericNewValue.toFixed(precision)));
  };

  const handleIncrement = () => {
    if (readOnly || disabled) return;

    const numericValue = Number(value);
    if (isNaN(numericValue)) return;

    const newValue = Math.min(max, numericValue + step);

    const stepStr = String(step);
    const decimalPart = stepStr.split('.')[1];
    const precision = decimalPart ? decimalPart.length : 0;
    
    const numericNewValue = Number(newValue);
    if (isNaN(numericNewValue)) return;

    onChange(parseFloat(numericNewValue.toFixed(precision)));
  };

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <Button
        type="button"
        variant="outline"
        size={buttonSize}
        className={cn("p-0", buttonClassName)} // Ensured p-0 for consistent icon sizing
        onClick={handleDecrement}
        disabled={disabled || readOnly || Number(value) <= min}
        aria-label="Decrement"
      >
        <MinusCircle className="h-4 w-4" />
      </Button>
      <Input
        id={id}
        type="number" // Still good for semantics, even though readOnly
        value={Number.isFinite(value) ? value : ''} // Handle NaN or Infinity for display
        readOnly
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
        variant="outline"
        size={buttonSize}
        className={cn("p-0", buttonClassName)} // Ensured p-0 for consistent icon sizing
        onClick={handleIncrement}
        disabled={disabled || readOnly || Number(value) >= max}
        aria-label="Increment"
      >
        <PlusCircle className="h-4 w-4" />
      </Button>
    </div>
  );
}
