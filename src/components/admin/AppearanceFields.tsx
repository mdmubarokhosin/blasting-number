import { Input, Label, TextField } from "@heroui/react";
import { Check } from "../icons";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { ICON_OPTIONS, IconRenderer } from "../../lib/iconRegistry";
import { COLOR_PRESETS, contrastWarning, normalizeHex } from "../../utils/colors";

export function ColorField({
  color,
  onChange,
  isDisabled,
}: {
  color: string;
  onChange: (color: string) => void;
  isDisabled?: boolean;
}): ReactNode {
  const [draft, setDraft] = useState(color);
  useEffect(() => setDraft(color), [color]);
  const warning = useMemo(() => contrastWarning(draft), [draft]);
  const normalized = normalizeHex(draft, "");

  return (
    <div className="flex flex-col gap-2">
      <Label>রঙ</Label>
      <div className="flex flex-wrap gap-2">
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-label={`রঙ ${preset}`}
            aria-pressed={normalizeHex(color) === preset}
            disabled={isDisabled}
            className="relative size-8 rounded-full border-2 border-white/60 shadow-sm ring-1 ring-black/10 transition-transform hover:scale-105 disabled:opacity-40"
            style={{ backgroundColor: preset }}
            onClick={() => {
              setDraft(preset);
              onChange(preset);
            }}
          >
            {normalizeHex(color) === preset ? (
              <Check className="mx-auto size-4 text-white drop-shadow" />
            ) : null}
          </button>
        ))}
      </div>
      <div className="flex items-start gap-2">
        <input
          type="color"
          aria-label="কাস্টম রঙ"
          value={normalized || "#64748b"}
          disabled={isDisabled}
          onChange={(event) => {
            setDraft(event.target.value);
            onChange(event.target.value);
          }}
          className="h-9 w-12 cursor-pointer rounded-lg border bg-transparent p-1 disabled:opacity-40"
        />
        <TextField
          name="hex-color"
          value={draft}
          isDisabled={isDisabled}
          onChange={(value) => {
            setDraft(value);
            const next = normalizeHex(value, "");
            if (next) onChange(next);
          }}
          isInvalid={Boolean(warning)}
          className="flex-1"
        >
          <Input placeholder="#2563eb" />
        </TextField>
      </div>
      {warning ? <p className="text-warning text-xs">{warning}</p> : null}
    </div>
  );
}

export function IconField({
  icon,
  onChange,
  isDisabled,
}: {
  icon: string;
  onChange: (icon: string) => void;
  isDisabled?: boolean;
}): ReactNode {
  return (
    <div className="flex flex-col gap-2">
      <Label>আইকন</Label>
      <div className="grid max-h-44 grid-cols-8 gap-1 overflow-y-auto rounded-xl border p-2">
        {ICON_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            title={option.label}
            aria-label={option.label}
            aria-pressed={icon === option.key}
            disabled={isDisabled}
            className={`flex size-8 items-center justify-center rounded-lg transition-colors ${
              icon === option.key
                ? "bg-accent text-accent-foreground"
                : "hover:bg-default text-muted"
            } disabled:opacity-40`}
            onClick={() => onChange(option.key)}
          >
            <IconRenderer name={option.key} className="size-4" />
          </button>
        ))}
      </div>
      <p className="text-muted text-xs">
        নির্বাচিত: <span className="text-foreground font-medium">{icon}</span>
      </p>
    </div>
  );
}
