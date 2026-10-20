import { useEffect, useState } from "react";
import { dbErrorMessage } from "../lib/validation";
import { subscribeAllProfiles } from "../services/profiles";
import type { UserProfile } from "../types";

export function useProfiles(enabled = true): {
  profiles: UserProfile[];
  loading: boolean;
  error: string | null;
} {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    const unsub = subscribeAllProfiles(
      (list) => {
        if (!active) return;
        setProfiles(list);
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

  return { profiles, loading, error };
}
