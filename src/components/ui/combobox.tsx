
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
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string // This remains 'value' as it's the prop for the underlying CMDK CommandItem
  label: string
}

interface ComboboxProps {
  options: readonly ComboboxOption[]
  value?: string // This is the currently selected 'value' (which would correspond to an 'id' from our data)
  onChange: (value: string) => void // Callback receives the 'id'
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
  value, // This 'value' is the ID of the selected item
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyPlaceholder = "No option found.",
  triggerClassName,
  popoverContentClassName,
  isEditable = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("") // For CommandInput when not editable

  const handleSelect = (currentLabel: string) => {
    // CommandItem's onSelect provides the label (its 'value' prop)
    const selectedOption = options.find(opt => opt.label.toLowerCase() === currentLabel.toLowerCase());
    if (selectedOption) {
      onChange(selectedOption.value); // Pass the actual ID back
      if (!isEditable) setInputValue(""); // Clear search if not editable
    } else if (isEditable) {
      onChange(currentLabel); // Pass typed value if editable
    }
    setOpen(false);
  };

  // For editable combobox, we directly bind the CommandInput to the external 'value' (which is an ID)
  // For non-editable, inputValue is used for search filtering within CommandInput.
  const currentCommandInputValue = isEditable ? value : inputValue;
  const onCommandInputChange = isEditable ? onChange : setInputValue;


  const foundOption = options.find((option) => (option.value ?? '').toLowerCase() === (value ?? '').toLowerCase());
  const displayLabel = foundOption ? foundOption.label : (isEditable && value ? value : placeholder);

  const handleClear = (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onChange('');
    if (!isEditable) setInputValue("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen && !isEditable) {
        setInputValue(""); // Clear search on close if not editable
      }
    }}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-between font-normal relative",
          !value && "text-muted-foreground",
          triggerClassName
        )}
        role="combobox"
        aria-expanded={open}
      >
        <span className="truncate pr-6">{displayLabel}</span>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
          {value && (
            <div
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleClear(e);
                  e.preventDefault(); // Prevent PopoverTrigger's default behavior
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
        <Command shouldFilter={!isEditable}> {/* CMDK handles filtering if not editable */}
          <CommandInput
            placeholder={searchPlaceholder}
            value={currentCommandInputValue}
            onValueChange={onCommandInputChange}
          />
          <CommandList>
            <CommandEmpty>{emptyPlaceholder}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value} // Use the ID as key
                  value={option.label} // CMDK filters based on this 'value' prop, so use label for search
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
