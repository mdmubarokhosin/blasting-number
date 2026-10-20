import { get, onValue, ref, set, update, type Unsubscribe } from "firebase/database";
import { auth, db } from "../lib/firebase";
import { DEFAULT_REGISTRATION_ROLE_KEY } from "../lib/defaults";
import type { UserProfile } from "../types";

export function emptyProfile(uid: string): UserProfile {
  return {
    uid,
    email: auth.currentUser?.email ?? "",
    displayName: auth.currentUser?.displayName ?? "",
    role: DEFAULT_REGISTRATION_ROLE_KEY,
    active: true,
    createdAt: auth.currentUser?.metadata?.creationTime
      ? new Date(auth.currentUser.metadata.creationTime).getTime()
      : 0,
    lastLogin: null,
  };
}

function coerceProfile(uid: string, v: Partial<UserProfile>): UserProfile {
  return {
    uid,
    email: String(v.email ?? ""),
    displayName: String(v.displayName ?? ""),
    role: typeof v.role === "string" && v.role.trim() ? v.role : DEFAULT_REGISTRATION_ROLE_KEY,
    active: v.active !== false,
    createdAt: typeof v.createdAt === "number" ? v.createdAt : 0,
    lastLogin: typeof v.lastLogin === "number" ? v.lastLogin : null,
  };
}

/**
 * Creates the profile for the signed-in user. Firebase rules only allow a user
 * to create their own profile with role "viewer" / active true; promotions are
 * admin-only and never trusted from the client.
 */
export async function ensureProfile(
  uid: string,
  data: { email: string; displayName: string },
): Promise<void> {
  const snap = await get(ref(db, `profiles/${uid}`));
  if (snap.exists()) return;

  const now = Date.now();
  await set(ref(db, `profiles/${uid}`), {
    uid,
    email: data.email,
    displayName: data.displayName.trim() || data.email,
    role: DEFAULT_REGISTRATION_ROLE_KEY,
    active: true,
    createdAt: now,
    lastLogin: now,
    updatedAt: now,
  });
}

export function subscribeProfile(
  uid: string,
  cb: (p: UserProfile | null) => void,
  onError?: (e: unknown) => void,
): Unsubscribe {
  return onValue(
    ref(db, `profiles/${uid}`),
    (snap) => {
      const v = snap.val() as Partial<UserProfile> | null;
      cb(v ? coerceProfile(uid, v) : null);
    },
    (e) => onError?.(e),
  );
}

export function subscribeAllProfiles(
  cb: (list: UserProfile[]) => void,
  onError?: (e: unknown) => void,
): Unsubscribe {
  return onValue(
    ref(db, "profiles"),
    (snap) => {
      const val = snap.val() as Record<string, Partial<UserProfile>> | null;
      if (!val) {
        cb([]);
        return;
      }
      const out: UserProfile[] = [];
      for (const [uid, v] of Object.entries(val)) {
        if (v) out.push(coerceProfile(uid, v));
      }
      out.sort((a, b) => b.createdAt - a.createdAt);
      cb(out);
    },
    (e) => onError?.(e),
  );
}

/**
 * Admin-only (enforced by RTDB rules): update role/status/display name.
 * An admin cannot change their own role or active flag — the UI also guards this.
 */
export async function adminUpdateUser(
  uid: string,
  patch: { displayName?: string; role?: string; active?: boolean },
): Promise<void> {
  const payload: Record<string, unknown> = { updatedAt: Date.now() };
  if (patch.displayName !== undefined) payload.displayName = patch.displayName;
  if (patch.role !== undefined) payload.role = patch.role;
  if (patch.active !== undefined) payload.active = patch.active;
  await update(ref(db, `profiles/${uid}`), payload);
}
