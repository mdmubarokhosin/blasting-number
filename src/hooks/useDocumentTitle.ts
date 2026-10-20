import { useEffect } from "react";
import { useSite } from "../i18n/SiteProvider";

export function useDocumentTitle(title?: string, brand?: string): void {
  const { settings, ui } = useSite();
  const resolvedBrand = brand || settings.brandName;
  const resolvedTitle = title ? ui(title) : "";
  useEffect(() => {
    const previous = document.title;
    document.title = resolvedTitle ? `${resolvedTitle} — ${resolvedBrand}` : resolvedBrand;
    return () => {
      document.title = previous;
    };
  }, [resolvedTitle, resolvedBrand]);
}
