import { Button, Input, Label, TextField } from "@heroui/react";
import { CalendarDays } from "../icons";
import { type ReactNode } from "react";
import { addDays, todayISO } from "../../utils/format";

export type RangePreset = "7" | "30" | "90" | "all" | "custom";

export interface DateRangeValue {
  preset: RangePreset;
  from: string | null;
  to: string | null;
}

export function presetRange(preset: RangePreset): DateRangeValue {
  const today = todayISO();
  if (preset === "all") return { preset, from: null, to: null };
  if (preset === "custom") return { preset, from: null, to: null };
  const days = Number(preset);
  return { preset, from: addDays(today, -(days - 1)), to: today };
}

export function DateRangeFilter({
  value,
  onChange,
  className,
}: {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  className?: string;
}): ReactNode {
  const presets: { key: RangePreset; label: string }[] = [
    { key: "7", label: "৭ দিন" },
    { key: "30", label: "৩০ দিন" },
    { key: "90", label: "৯০ দিন" },
    { key: "all", label: "সব" },
  ];

  return (
    <div className={`flex flex-col gap-3 ${className ?? ""}`}>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="তারিখ পরিসীমা">
        <CalendarDays className="text-muted size-4" aria-hidden="true" />
        {presets.map((preset) => (
          <Button
            key={preset.key}
            size="sm"
            variant={value.preset === preset.key ? "primary" : "secondary"}
            onPress={() => onChange(presetRange(preset.key))}
          >
            {preset.label}
          </Button>
        ))}
        <Button
          size="sm"
          variant={value.preset === "custom" ? "primary" : "secondary"}
          onPress={() => onChange({ preset: "custom", from: value.from, to: value.to })}
        >
          কাস্টম
        </Button>
      </div>
      {value.preset === "custom" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField
            name="range-from"
            type="date"
            value={value.from ?? ""}
            onChange={(from) => onChange({ ...value, from: from || null })}
          >
            <Label>শুরুর তারিখ</Label>
            <Input />
          </TextField>
          <TextField
            name="range-to"
            type="date"
            value={value.to ?? ""}
            onChange={(to) => onChange({ ...value, to: to || null })}
          >
            <Label>শেষ তারিখ</Label>
            <Input />
          </TextField>
        </div>
      ) : null}
    </div>
  );
}
