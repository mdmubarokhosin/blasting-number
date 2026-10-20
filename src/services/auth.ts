import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as fbUpdateProfile,
  type User,
} from "firebase/auth";
import { deleteApp, initializeApp } from "firebase/app";
import { get, ref, set, update } from "firebase/database";
import { auth, db, firebaseConfig } from "../lib/firebase";
import { DEFAULT_REGISTRATION_ROLE_KEY } from "../lib/defaults";
import type { UserProfile } from "../types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

/** Resolves when Firebase has restored (or failed to restore) the persisted session. */
export function watchAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, cb);
}

/**
 * Session persistence is configured explicitly in `main.tsx` using
 * `browserLocalPersistence` before React renders. We never store credentials
 * ourselves (no localStorage passwords, no plaintext cookies).
 */
export async function loginWithEmail(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    try {
      await fbUpdateProfile(cred.user, { displayName });
    } catch {
      // The RTDB profile display name is authoritative; this is best-effort.
    }
  }
  return cred.user;
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function sendVerificationEmail(): Promise<void> {
  if (!auth.currentUser) throw new Error("not-authenticated");
  await sendEmailVerification(auth.currentUser);
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

/**
 * Best-effort rollback for an interrupted self-registration. Only called when
 * the Auth account was just created by this flow and its profile could not be
 * written, so a retry with the same email remains possible.
 */
export async function deleteCurrentAuthUser(): Promise<void> {
  if (!auth.currentUser) return;
  await deleteUser(auth.currentUser);
}

export async function updateDisplayName(name: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("not-authenticated");
  await fbUpdateProfile(user, { displayName: name.trim() });
  await update(ref(db, `profiles/${user.uid}`), {
    displayName: name.trim(),
    updatedAt: Date.now(),
  });
}

export async function touchLastLogin(uid: string): Promise<void> {
  await update(ref(db, `profiles/${uid}`), { lastLogin: Date.now() });
}

/**
 * Reads the RTDB profile for a uid.
 * Returns `null` when the profile does not exist; throws on permission/network errors.
 */
export async function fetchProfile(uid: string): Promise<UserProfile | null> {
  const snap = await get(ref(db, `profiles/${uid}`));
  if (!snap.exists()) return null;
  const v = snap.val() as Partial<UserProfile>;
  return {
    uid,
    email: String(v.email ?? auth.currentUser?.email ?? ""),
    displayName: String(v.displayName ?? auth.currentUser?.displayName ?? ""),
    role: typeof v.role === "string" && v.role.trim() ? v.role : DEFAULT_REGISTRATION_ROLE_KEY,
    active: v.active !== false,
    createdAt: typeof v.createdAt === "number" ? v.createdAt : 0,
    lastLogin: typeof v.lastLogin === "number" ? v.lastLogin : null,
  };
}


export interface ManagedUserInput {
  email: string;
  password: string;
  displayName: string;
  role: string;
}

/**
 * Creates an Auth user on a SECONDARY Firebase app so the administrator's own
 * session is never replaced. The password is sent only to Firebase Auth and is
 * never persisted in RTDB or logs. If the profile write fails, the Auth user is
 * rolled back.
 */
export async function createManagedUser(
  input: ManagedUserInput,
  writeProfile: (uid: string, email: string, displayName: string, role: string) => Promise<void>,
): Promise<string> {
  const appName = `managed-user-${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, appName);
  const secondaryAuth = getAuth(secondaryApp);
  if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true") {
    connectAuthEmulator(
      secondaryAuth,
      import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL || "http://127.0.0.1:9099",
      { disableWarnings: true },
    );
  }

  let createdUid: string | null = null;
  try {
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      input.email.trim(),
      input.password,
    );
    createdUid = cred.user.uid;
    await fbUpdateProfile(cred.user, { displayName: input.displayName.trim() });
    await writeProfile(createdUid, input.email.trim(), input.displayName.trim(), input.role);
    try {
      await sendEmailVerification(cred.user);
    } catch {
      // Verification mail failure must not roll back a valid account.
    }
    return createdUid;
  } catch (err) {
    if (createdUid && secondaryAuth.currentUser) {
      try {
        await deleteUser(secondaryAuth.currentUser);
      } catch {
        // Best-effort rollback; surfaced to the caller via the original error.
      }
    }
    throw err;
  } finally {
    try {
      await signOut(secondaryAuth);
    } catch {
      // ignore
    }
    try {
      await deleteApp(secondaryApp);
    } catch {
      // ignore
    }
  }
}

export async function createProfileForUid(input: {
  uid: string;
  email: string;
  displayName: string;
  role: string;
}): Promise<void> {
  const now = Date.now();
  await set(ref(db, `profiles/${input.uid}`), {
    uid: input.uid,
    email: input.email,
    displayName: input.displayName,
    role: input.role,
    active: true,
    createdAt: now,
    lastLogin: null,
    updatedAt: now,
  });
}
