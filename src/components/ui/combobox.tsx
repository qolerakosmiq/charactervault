
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X as ClearIcon } from "lucide-react"

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
      onChange(currentLabel);
    }
    setOpen(false);
  };

  const handleInputChange = (inputValue: string) => {
    if (isEditable) {
      onChange(inputValue);
    }
  };
  
  const foundOption = options.find((option) => option.value.toLowerCase() === (value ?? '').toLowerCase());
  const displayLabel = foundOption ? foundOption.label : (isEditable && value ? value : placeholder);

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent popover from opening
    onChange('');
    setOpen(false); // Close popover if it was open
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
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
          <span className="truncate pr-6">{displayLabel}</span> {/* Added pr-6 to avoid overlap with icons */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            {value && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="h-6 w-6 p-0 mr-1 text-muted-foreground hover:text-destructive"
                aria-label="Clear selection"
              >
                <ClearIcon className="h-4 w-4" />
              </Button>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[--radix-popover-trigger-width] p-0", popoverContentClassName)}>
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={isEditable ? (value || '') : undefined} 
            onValueChange={isEditable ? handleInputChange : undefined}
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
