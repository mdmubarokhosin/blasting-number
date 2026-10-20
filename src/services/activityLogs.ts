import {
  get,
  limitToLast,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  update,
  type Unsubscribe,
} from "firebase/database";
import { auth, db } from "../lib/firebase";
import type { ActivityAction, ActivityLog } from "../types";

export const LOG_RETENTION = 500;

/**
 * Appends an activity log entry.
 * Security rules require actorUid === auth.uid and actorName === auth display
 * name, so entries cannot be forged by other users. Only the protected master
 * role can clear the audit trail.
 */
export interface ActivityMeta {
  targetType?: string;
  targetId?: string;
  actorRole?: string;
  outcome?: "success" | "failure";
}

export async function logActivity(
  action: ActivityAction | string,
  details: string,
  meta: ActivityMeta = {},
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const payload: Record<string, unknown> = {
      action,
      details,
      actorUid: user.uid,
      actorName: user.displayName || user.email || "unknown",
      timestamp: Date.now(),
    };
    if (meta.targetType) payload.targetType = meta.targetType;
    if (meta.targetId) payload.targetId = meta.targetId;
    if (meta.actorRole) payload.actorRole = meta.actorRole;
    if (meta.outcome) payload.outcome = meta.outcome;
    await push(ref(db, "activityLogs"), payload);
  } catch {
    // Logging must never break the primary operation.
  }
}

export function subscribeLogs(
  cb: (logs: ActivityLog[]) => void,
  onError?: (e: unknown) => void,
): Unsubscribe {
  const q = query(ref(db, "activityLogs"), orderByChild("timestamp"), limitToLast(LOG_RETENTION));
  return onValue(
    q,
    (snap) => {
      const val = snap.val() as Record<string, Partial<ActivityLog>> | null;
      if (!val) {
        cb([]);
        return;
      }
      const out: ActivityLog[] = [];
      for (const [id, v] of Object.entries(val)) {
        if (!v) continue;
        out.push({
          id,
          action: String(v.action ?? "unknown"),
          details: String(v.details ?? ""),
          actorUid: String(v.actorUid ?? ""),
          actorName: String(v.actorName ?? ""),
          timestamp: typeof v.timestamp === "number" ? v.timestamp : 0,
          targetType: typeof v.targetType === "string" ? v.targetType : undefined,
          targetId: typeof v.targetId === "string" ? v.targetId : undefined,
          actorRole: typeof v.actorRole === "string" ? v.actorRole : undefined,
          outcome: v.outcome === "failure" ? "failure" : v.outcome === "success" ? "success" : undefined,
        });
      }
      out.sort((a, b) => b.timestamp - a.timestamp);
      cb(out);
    },
    (e) => onError?.(e),
  );
}

/**
 * Master-only (enforced by rules): wipe all activity logs.
 *
 * Rules intentionally grant no write at the `activityLogs` root (so no one can
 * rewrite an existing entry). Deletion is therefore done child-by-child, which
 * the rules allow only for an active master.
 */
export async function clearLogs(): Promise<void> {
  const snap = await get(ref(db, "activityLogs"));
  if (!snap.exists()) return;
  const updates: Record<string, null> = {};
  snap.forEach((child) => {
    updates[`activityLogs/${child.key}`] = null;
  });
  await update(ref(db), updates);
}
