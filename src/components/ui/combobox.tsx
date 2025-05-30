
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X as ClearIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button" // Import buttonVariants
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: readonly ComboboxOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyPlaceholder?: string
  className?: string
  triggerClassName?: string
  popoverContentClassName?: string
  isEditable?: boolean;
}

export function ComboboxPrimitive({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyPlaceholder = "No option found.",
  triggerClassName,
  popoverContentClassName,
  isEditable = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (currentLabel: string) => {
    const selectedOption = options.find(opt => opt.label.toLowerCase() === currentLabel.toLowerCase());
    if (selectedOption) {
      onChange(selectedOption.value);
    } else if (isEditable) {
      onChange(currentLabel); // Allow setting custom typed value
    }
    setOpen(false);
  };

  const handleInputChange = (inputValue: string) => {
    if (isEditable) {
      onChange(inputValue);
    }
    // If not editable, CommandInput's value is not directly tied to form state,
    // so this function might only be used for filtering by cmdk.
    // For editable, this directly updates the form state.
  };

  const foundOption = options.find((option) => option.value.toLowerCase() === (value ?? '').toLowerCase());
  const displayLabel = foundOption ? foundOption.label : (isEditable && value ? value : placeholder);

  const handleClear = (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation(); // Prevent popover from opening/toggling due to click on trigger
    onChange('');
    setOpen(false); // Close popover if it was open
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline" }), // Apply button styles
          "w-full justify-between font-normal relative", // Existing styles from Button
          !value && "text-muted-foreground",
          triggerClassName
        )}
        role="combobox"
        aria-expanded={open}
        // type="button" // PopoverTrigger renders a button by default
      >
        <span className="truncate pr-6">{displayLabel}</span>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
          {value && (
            <div
              role="button"
              tabIndex={0} // Make it focusable
              onClick={handleClear}
              onKeyDown={(e) => { // Basic keyboard accessibility for the clear "button"
                if (e.key === 'Enter' || e.key === ' ') {
                  handleClear(e);
                }
              }}
              className="h-6 w-6 p-0 mr-1 flex items-center justify-center rounded-sm text-muted-foreground hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Clear selection"
            >
              <ClearIcon className="h-4 w-4" />
            </div>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[--radix-popover-trigger-width] p-0", popoverContentClassName)}>
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={isEditable && value !== undefined ? value : undefined} // Controlled if editable
            onValueChange={isEditable ? handleInputChange : undefined} // Direct update if editable
          />
          <CommandList>
            <CommandEmpty>{emptyPlaceholder}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      (value || '').toLowerCase() === option.value.toLowerCase() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
