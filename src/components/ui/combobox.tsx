
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
      // If somehow a label is selected that's not in options (e.g., if Command allows creating new items on enter)
      // and it's editable, we pass the raw label. However, cmdk's default CommandItem onSelect provides the `value` prop of CommandItem.
      // This branch might be less relevant if CommandInput `onValueChange` handles all typed input.
      onChange(currentLabel);
    }
    setOpen(false);
  };

  // Handles direct input typing in editable mode
  const handleInputChange = (inputValue: string) => {
    if (isEditable) {
      onChange(inputValue);
    }
  };
  
  const foundOption = options.find((option) => option.value.toLowerCase() === (value ?? '').toLowerCase());
  // For editable combobox, if the current value isn't among the option *values*,
  // it means it's a custom typed value. Display it as is.
  // If it *is* among option values, display its corresponding label.
  const displayLabel = foundOption ? foundOption.label : (isEditable && value ? value : placeholder);


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", !value && "text-muted-foreground", triggerClassName)}
        >
          {displayLabel}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[--radix-popover-trigger-width] p-0", popoverContentClassName)}>
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            // In editable mode, the CommandInput's value should reflect the current field value directly to allow editing it.
            // In non-editable mode, cmdk handles its internal search state.
            value={isEditable ? (value || '') : undefined} 
            onValueChange={isEditable ? handleInputChange : undefined} // If editable, typing directly updates the external state.
          />
          <CommandList>
            <CommandEmpty>{emptyPlaceholder}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label} // CMDK uses this for filtering/matching against its input.
                  onSelect={handleSelect} // This is called when an item is clicked or selected via keyboard.
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      // Checkmark logic: if current `value` matches this `option.value`
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
