
'use client';

import { useState, useEffect, useRef }  from 'react';

/**
 * Custom hook to manage a debounced form field.
 * It synchronizes with a prop value from the parent, updates a local value immediately for responsiveness,
 * and then calls a debounced callback to update the parent state.
 *
 * @param propValue The value of the field passed from the parent component.
 * @param onDebouncedChange The function to call with the new value after the debounce delay.
 * @param debounceDelay The delay in milliseconds.
 * @returns A tuple: [localValue, setLocalValueCallback]
 *          - localValue: The current value of the field to be used by the input.
 *          - setLocalValueCallback: A function to update the localValue. Inputs should call this.
 */
export function useDebouncedFormField<T>(
  propValue: T,
  onDebouncedChange: (value: T) => void,
  debounceDelay: number
): [T, (newValue: T) => void] {
  const [localValue, setLocalValue] = useState<T>(propValue);
  const isInitialMountRef = useRef(true); // To prevent firing debounce on initial mount if values are same
  const onDebouncedChangeRef = useRef(onDebouncedChange);

  // Keep the callback ref updated if it changes, to avoid stale closures in setTimeout
  useEffect(() => {
    onDebouncedChangeRef.current = onDebouncedChange;
  }, [onDebouncedChange]);

  // Update localValue if propValue changes from parent
  useEffect(() => {
    if (JSON.stringify(propValue) !== JSON.stringify(localValue)) {
      setLocalValue(propValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propValue]); // Only run when propValue changes explicitly.

  // Debounce the call to onDebouncedChange when localValue changes (due to user input)
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      // If on initial mount, localValue started as propValue, don't trigger debounce.
      // This handles the very first render.
      if (JSON.stringify(localValue) === JSON.stringify(propValue)) {
        return;
      }
    }
    
    // If localValue is the same as propValue, it implies the change was synced from prop,
    // or a previous debounce has already updated the parent to this value.
    // Avoids redundant calls or loops.
    if (JSON.stringify(localValue) === JSON.stringify(propValue)) {
        return;
    }

    const handler = setTimeout(() => {
      // Final check: only call if localValue is still different from what propValue became.
      // This protects against race conditions if propValue was updated by something else
      // very close to when the timeout fires.
      if (JSON.stringify(localValue) !== JSON.stringify(propValue)) {
        onDebouncedChangeRef.current(localValue);
      }
    }, debounceDelay);

    return () => {
      clearTimeout(handler);
    };
  }, [localValue, debounceDelay, propValue]); // propValue is included for the comparison inside useEffect and timeout

  return [localValue, setLocalValue];
}
