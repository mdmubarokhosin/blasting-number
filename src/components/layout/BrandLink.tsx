import { Flame } from "../icons";
import { type ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSite } from "../../i18n/SiteProvider";

export function BrandMark({ className }: { className?: string }): ReactNode {
  const { settings } = useSite();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [settings.logoUrl]);

  const classes = `inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-accent to-accent-hover text-accent-foreground shadow-sm ${className ?? ""}`;

  if (settings.logoUrl && !failed) {
    return (
      <span className={classes} aria-hidden="true">
        <img
          src={settings.logoUrl}
          alt=""
          className="size-full object-contain"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  return (
    <span className={classes} aria-hidden="true">
      <Flame className="size-5" />
    </span>
  );
}

export function BrandLink({ to = "/", compact = false }: { to?: string; compact?: boolean }): ReactNode {
  const { settings } = useSite();
  return (
    <Link to={to} className="inline-flex min-w-0 items-center gap-2" aria-label={settings.brandName}>
      <BrandMark />
      <span
        className={`truncate font-bold tracking-tight ${
          compact ? "hidden text-base sm:inline" : "text-base sm:text-lg"
        }`}
      >
        {settings.brandName}
      </span>
    </Link>
  );
}
