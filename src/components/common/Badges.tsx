import { Chip } from "@heroui/react";
import { type CSSProperties, type ReactNode } from "react";
import type { CategoryRecord, RoleRecord, Shift, ShiftRecord } from "../../types";
import { IconRenderer } from "../../lib/iconRegistry";
import { readableTextColor, tint } from "../../utils/colors";
import { resolveShift } from "../../utils/shifts";

function softStyle(color: string): CSSProperties {
  return {
    backgroundColor: tint(color, 0.14),
    color: readableTextColor(color) === "#ffffff" ? color : "#0f172a",
    border: `1px solid ${tint(color, 0.3)}`,
  };
}

export function CategoryBadge({
  category,
  color,
  icon,
  className,
}: {
  category?: CategoryRecord;
  color?: string;
  icon?: string;
  className?: string;
}): ReactNode {
  const badgeColor = category?.color ?? color ?? "#64748b";
  const badgeIcon = category?.icon ?? icon ?? "tag";
  const label = category?.name ?? "—";
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium ${className ?? ""}`}
      style={softStyle(badgeColor)}
      title={label}
    >
      <IconRenderer name={badgeIcon} className="size-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}

export function ShiftBadge({
  shift,
  shifts = [],
}: {
  shift: Shift;
  shifts?: ShiftRecord[];
}): ReactNode {
  const record = resolveShift(shift, shifts);
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium"
      style={softStyle(record.color)}
      title={
        record.status === "inactive"
          ? `${record.name} (নিষ্ক্রিয়)`
          : record.description || record.name
      }
    >
      <IconRenderer name={record.icon} className="size-3.5 shrink-0" />
      <span className="truncate">
        {record.name}
        {record.status === "inactive" ? " · নিষ্ক্রিয়" : ""}
      </span>
    </span>
  );
}

export function RoleBadge({ role }: { role: RoleRecord }): ReactNode {
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium"
      style={softStyle(role.color)}
      title={role.description || role.name}
    >
      <IconRenderer name={role.icon} className="size-3.5 shrink-0" />
      <span className="truncate">{role.name}</span>
      {role.protected ? <span aria-label="protected">•</span> : null}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }): ReactNode {
  return (
    <Chip size="sm" variant="soft" color={active ? "success" : "danger"}>
      <Chip.Label>{active ? "সক্রিয়" : "নিষ্ক্রিয়"}</Chip.Label>
    </Chip>
  );
}
