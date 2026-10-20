import { type ReactNode } from "react";
import { useSite } from "../../i18n/SiteProvider";
import { Globe } from "../icons";

export function LanguageSelect({ compact = false }: { compact?: boolean }): ReactNode {
  const { activeLanguages, languageCode, setLanguage } = useSite();
  if (activeLanguages.length <= 1) return null;

  return (
    <label className="border-border bg-surface text-foreground inline-flex h-9 items-center gap-1.5 rounded-xl border px-2 text-sm shadow-xs">
      <Globe className="text-muted size-4 shrink-0" aria-hidden="true" />
      <span className="sr-only">ভাষা</span>
      <select
        value={languageCode}
        onChange={(event) => setLanguage(event.target.value)}
        className="max-w-28 cursor-pointer appearance-none bg-transparent py-1 pr-0.5 font-medium outline-none"
        aria-label="ভাষা"
      >
        {activeLanguages.map((language) => (
          <option key={language.code} value={language.code}>
            {compact ? language.code.toUpperCase() : language.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}
