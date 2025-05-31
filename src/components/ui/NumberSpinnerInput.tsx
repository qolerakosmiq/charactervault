
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
    const newValue = Math.max(min, value - step);
    // Handle floating point precision issues for non-integer steps
    const precision = (step.toString().split('.')[1] || '').length;
    onChange(parseFloat(newValue.toFixed(precision)));
  };

  const handleIncrement = () => {
    if (readOnly || disabled) return;
    const newValue = Math.min(max, value + step);
    const precision = (step.toString().split('.')[1] || '').length;
    onChange(parseFloat(newValue.toFixed(precision)));
  };

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <Button
        type="button"
        variant="outline"
        size={buttonSize}
        className={cn("h-8 w-8 p-0", buttonClassName)}
        onClick={handleDecrement}
        disabled={disabled || readOnly || value <= min}
        aria-label="Decrement"
      >
        <MinusCircle className="h-4 w-4" />
      </Button>
      <Input
        id={id}
        type="number"
        value={value}
        readOnly
        disabled={disabled}
        className={cn("w-16 h-8 text-center appearance-none", inputClassName)}
        aria-live="polite"
      />
      <Button
        type="button"
        variant="outline"
        size={buttonSize}
        className={cn("h-8 w-8 p-0", buttonClassName)}
        onClick={handleIncrement}
        disabled={disabled || readOnly || value >= max}
        aria-label="Increment"
      >
        <PlusCircle className="h-4 w-4" />
      </Button>
    </div>
  );
}
