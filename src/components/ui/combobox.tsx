
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X as ClearIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandItem, // Added CommandItem here
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean;
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
  disabled?: boolean;
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
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("") // Used for non-editable display/filtering

  // Determine what the CommandInput should display and how it behaves
  const currentCommandInputValue = isEditable ? (value || "") : inputValue;
  const onCommandInputChange = isEditable ? onChange : setInputValue;

  const handleSelect = (currentLabel: string) => {
    const selectedOption = options.find(opt => (opt.label ?? '').toLowerCase() === (currentLabel ?? '').toLowerCase());
    if (selectedOption) {
      onChange(selectedOption.value);
      if (!isEditable) setInputValue(""); // Clear search term for non-editable
    } else if (isEditable) {
      // If editable and no option matches, the typed text becomes the value
      onChange(currentLabel);
    }
    setOpen(false);
  };
  
  const foundOption = options.find((option) => (option.value ?? '').toLowerCase() === (value ?? '').toLowerCase());
  const displayLabel = foundOption ? foundOption.label : (isEditable && value ? value : placeholder);

  const handleClear = (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.stopPropagation();
    onChange(''); // Clear the actual value
    if (!isEditable) setInputValue(""); // Clear search input if not editable
    setOpen(false); // Close popover
  };


  return (
    <Popover open={open && !disabled} onOpenChange={(isOpen) => {
      if (disabled) return;
      setOpen(isOpen);
      if (!isOpen && !isEditable) {
        setInputValue(""); // Reset input on close if not editable
      }
    }}>
      <PopoverTrigger
        asChild
        disabled={disabled}
      >
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal relative",
            !value && "text-muted-foreground",
            triggerClassName
          )}
        >
          <span className="truncate pr-6">{displayLabel}</span>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            {value && !disabled && (
              <div
                role="button"
                tabIndex={0} 
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleClear(e);
                    e.preventDefault();
                  }
                }}
                className={cn(
                  "h-6 w-6 p-0 mr-1 flex items-center justify-center rounded-sm text-muted-foreground hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                )}
                aria-label="Clear selection"
              >
                <ClearIcon className="h-4 w-4" />
              </div>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      {!disabled && (
        <PopoverContent className={cn("w-[--radix-popover-trigger-width] p-0", popoverContentClassName)}>
          <Command shouldFilter={!isEditable}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={currentCommandInputValue}
              onValueChange={onCommandInputChange}
              disabled={disabled}
            />
            <CommandList>
              <CommandEmpty>{emptyPlaceholder}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={handleSelect}
                    disabled={option.disabled}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        (value || '').toLowerCase() === (option.value ?? '').toLowerCase() ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  )
}
