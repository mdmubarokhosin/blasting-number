import { Card } from "@heroui/react";
import { type IconComponent } from "../icons";
import { type ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: IconComponent;
  tone?: "default" | "accent" | "success" | "warning" | "danger";
}): ReactNode {
  const toneClass: Record<string, string> = {
    default: "bg-default text-default-foreground",
    accent: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
  };
  return (
    <Card className="bn-card bn-card-center bn-stat-card">
      <Card.Content className="p-4 sm:p-5">
        <span
          className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl ${toneClass[tone]}`}
          aria-hidden="true"
        >
          <Icon className="size-5" />
        </span>
        <p className="bn-stat-value">{value}</p>
        <p className="bn-stat-label">{label}</p>
        {hint ? <p className="bn-stat-hint">{hint}</p> : null}
      </Card.Content>
    </Card>
  );
}
