"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const selectedLabel = options.find((option) => option.value === value)?.label ?? value;

  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <Select value={value} onValueChange={(next) => onChange(next ?? "")}>
        <SelectTrigger className="w-full font-semibold">
          <SelectValue>{selectedLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value || "__all"} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
