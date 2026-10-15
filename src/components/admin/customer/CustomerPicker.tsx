// src/components/admin/customer/CustomerPicker.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Plus, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCustomerSuggest } from "@/hooks/admin";
import type { CustomerResponse } from "@/lib/validations/customer.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type CustomerPickerValue = {
  customerId?: string;
  /** Snapshot fields used when no customer is selected. */
  name?: string;
  phone?: string;
  email?: string;
};

export type CustomerPickerProps = {
  value: CustomerPickerValue;
  onChange: (value: CustomerPickerValue) => void;
  /** Show the inline "walk-in customer" hint when empty. */
  allowWalkIn?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function CustomerPicker({
  value,
  onChange,
  allowWalkIn = true,
  placeholder = "Search customers…",
  disabled = false,
  className,
}: CustomerPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const suggest = useCustomerSuggest(debouncedQuery, 10);

  const options = useMemo<CustomerResponse[]>(
    () => suggest.data ?? [],
    [suggest.data],
  );

  const hasExactMatch = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return options.some(
      (o) =>
        o.name.toLowerCase() === needle ||
        o.phone?.toLowerCase() === needle ||
        o.email?.toLowerCase() === needle,
    );
  }, [options, query]);

  const handleSelect = (customer: CustomerResponse) => {
    onChange({
      customerId: customer._id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
    });
    setOpen(false);
    setQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({});
  };

  const handleCreateInline = () => {
    const name = query.trim();
    if (!name) return;

    // Determine if the query looks like a phone number
    const digitsOnly = name.replace(/\D/g, "");
    const looksLikePhone = digitsOnly.length >= 8;

    onChange({
      name,
      phone: looksLikePhone ? name : undefined,
    });
    setOpen(false);
    setQuery("");
  };

  const display = value.name || value.phone || null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            disabled={disabled}
            className={cn(
              "h-9 w-full justify-between font-normal",
              !display && "text-brand-text-secondary",
              className,
            )}
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          {display ? (
            <>
              <User
                className="h-3.5 w-3.5 shrink-0 text-brand-text-secondary"
                aria-hidden="true"
              />
              <span className="truncate">{display}</span>
              {value.phone && value.name !== value.phone && (
                <span className="truncate text-xs text-brand-text-secondary">
                  · {value.phone}
                </span>
              )}
            </>
          ) : (
            placeholder
          )}
        </span>

        <span className="ml-2 flex shrink-0 items-center gap-1">
          {display && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChange({});
                }
              }}
              className="grid h-4 w-4 place-items-center rounded-full text-brand-text-secondary hover:bg-muted hover:text-brand-primary"
              aria-label="Clear customer"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </span>
          )}
          <ChevronsUpDown
            className="h-4 w-4 shrink-0 opacity-50"
            aria-hidden="true"
          />
        </span>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] min-w-[320px] p-0"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name, phone, or email…"
            value={query}
            onValueChange={setQuery}
          />

          <CommandList>
            {suggest.isLoading && (
              <div className="flex items-center gap-2 px-3 py-4 text-xs text-brand-text-secondary">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                Searching…
              </div>
            )}

            {!suggest.isLoading && options.length === 0 && !query.trim() && (
              <div className="px-3 py-4 text-center text-xs text-brand-text-secondary">
                {allowWalkIn
                  ? "Type a name or phone to search, or leave blank for walk-in."
                  : "Type to search customers."}
              </div>
            )}

            {options.length > 0 && (
              <CommandGroup heading="Customers">
                {options.map((customer) => (
                  <CommandItem
                    key={customer._id}
                    value={customer._id}
                    onSelect={() => handleSelect(customer)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm text-brand-primary">
                        {customer.name}
                      </span>
                      {(customer.phone || customer.email) && (
                        <span className="truncate text-[11px] text-brand-text-secondary">
                          {customer.phone ?? customer.email}
                        </span>
                      )}
                    </div>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4 shrink-0",
                        value.customerId === customer._id
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                      aria-hidden="true"
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {query.trim().length >= 2 && !hasExactMatch && (
              <>
                {options.length > 0 && <CommandSeparator />}
                <CommandGroup>
                  <CommandItem
                    value={`__create__${query}`}
                    onSelect={handleCreateInline}
                    className="text-brand-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Use &quot;{query.trim()}&quot; as new customer
                  </CommandItem>
                </CommandGroup>
              </>
            )}

            {allowWalkIn && !query.trim() && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value="__walkin__"
                    onSelect={() => {
                      onChange({ name: "Walk-in customer" });
                      setOpen(false);
                    }}
                    className="text-brand-text-secondary"
                  >
                    <User className="mr-2 h-4 w-4" aria-hidden="true" />
                    Walk-in customer (no details)
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default CustomerPicker;
