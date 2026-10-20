import { useMemo } from "react";
import { useSite } from "../i18n/SiteProvider";
import { formatDate, formatDateFull, formatTimestamp } from "../utils/format";

export function useFormat() {
  const { languageCode } = useSite();
  return useMemo(
    () => ({
      date: (iso: string) => formatDate(iso, languageCode),
      timestamp: (ts: number | null | undefined) => formatTimestamp(ts, languageCode),
      dateFull: (ts: number | null | undefined) => formatDateFull(ts, languageCode),
    }),
    [languageCode],
  );
}
