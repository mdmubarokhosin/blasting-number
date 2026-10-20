import { useEffect, useState } from "react";
import { dbErrorMessage } from "../lib/validation";
import { subscribeLogs } from "../services/activityLogs";
import type { ActivityLog } from "../types";

export function useLogs(enabled = true): {
  logs: ActivityLog[];
  loading: boolean;
  error: string | null;
} {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    const unsub = subscribeLogs(
      (list) => {
        if (!active) return;
        setLogs(list);
        setError(null);
        setLoading(false);
      },
      (err) => {
        if (!active) return;
        setError(dbErrorMessage(err));
        setLoading(false);
      },
    );
    return () => {
      active = false;
      unsub();
    };
  }, [enabled]);

  return { logs, loading, error };
}
