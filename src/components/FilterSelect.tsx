"use client";

import { useState } from "react";

type FilterSelectOption = {
  value: string;
  label: string;
};

export function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: FilterSelectOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className="relative">
      <span className="ld-filter-label">{label}</span>
      <button
        type="button"
        className="ld-input mt-2 flex items-center justify-between text-left font-semibold"
        onClick={() => setOpen((current) => !current)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{selected.label}</span>
        <span className="ml-3 text-[var(--muted)]">⌄</span>
      </button>

      {open && (
        <div
          className="absolute z-30 mt-2 max-h-56 w-full overflow-y-auto rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] p-1 shadow-[var(--shadow-soft)]"
          role="listbox"
        >
          {options.map((option) => {
            const active = option.value === value;

            return (
              <button
                key={option.value || "__all"}
                type="button"
                className={
                  active
                    ? "flex min-h-10 w-full items-center rounded-md bg-[var(--surface-card)] px-3 text-left text-sm font-semibold text-[var(--ink)]"
                    : "flex min-h-10 w-full items-center rounded-md px-3 text-left text-sm font-semibold text-[var(--body-strong)] hover:bg-[var(--surface-card)]"
                }
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                role="option"
                aria-selected={active}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
