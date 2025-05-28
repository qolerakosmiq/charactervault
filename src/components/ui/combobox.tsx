
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
  isEditable?: boolean; // New prop
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
  isEditable = false, // Default to false
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (currentLabel: string) => {
    const selectedOption = options.find(opt => opt.label.toLowerCase() === currentLabel.toLowerCase());
    if (selectedOption) {
      onChange(selectedOption.value);
    }
    setOpen(false);
  };

  const handleInputChange = (inputValue: string) => {
    if (isEditable) {
      onChange(inputValue);
    }
    // If not editable, cmdk handles filtering internally with its input.
    // For this component, we'll let cmdk manage its search state if not editable.
  };
  
  const foundOption = options.find((option) => option.value.toLowerCase() === (value ?? '').toLowerCase());
  const triggerText = foundOption ? foundOption.label : (isEditable && value ? value : placeholder);


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", !value && "text-muted-foreground", triggerClassName)}
        >
          {triggerText}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[--radix-popover-trigger-width] p-0", popoverContentClassName)}>
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={isEditable ? (value || '') : undefined} // Control input value if editable for typing
            onValueChange={isEditable ? handleInputChange : undefined} // If editable, typing updates the bound value
          />
          <CommandList>
            <CommandEmpty>{emptyPlaceholder}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label} // cmdk uses this for filtering/matching
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
