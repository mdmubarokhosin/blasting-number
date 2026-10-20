import { type ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  align = "start",
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  align?: "start" | "center";
}): ReactNode {
  return (
    <div className={`bn-page-header${align === "center" ? " bn-page-header--center" : ""}`}>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description ? (
          <p className="text-muted mt-1 max-w-2xl text-sm sm:text-base">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="bn-page-header__actions">{actions}</div> : null}
    </div>
  );
}
