import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import {
  defaultCategoryRecords,
  defaultRoleRecords,
  defaultShiftRecords,
} from "../../src/lib/defaults";
import { ref, set } from "firebase/database";

export const ADMIN_EMAIL = "admin@e2e.test";
export const ADMIN_PASSWORD = "Admin12345!";

const AUTH_REST = "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1";
const API_KEY = "demo-key";
const PROJECT_ID = "demo-blasting-e2e";

async function authRequest(route: string, body: Record<string, unknown>) {
  const res = await fetch(`${AUTH_REST}/${route}?key=${API_KEY}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as {
    localId?: string;
    error?: { message?: string };
  };
  return { ok: res.ok, json };
}

/**
 * Creates the admin account in the Auth emulator and seeds roles, categories,
 * shifts and its master profile with rules disabled, mirroring first-time bootstrap.
 */
export default async function globalSetup(): Promise<void> {
  const signUp = await authRequest("accounts:signUp", {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    returnSecureToken: true,
  });
  let uid = signUp.json.localId;
  if (!signUp.ok) {
    const signIn = await authRequest("accounts:signInWithPassword", {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      returnSecureToken: true,
    });
    if (!signIn.ok) {
      throw new Error(
        `Auth emulator error: ${JSON.stringify(signIn.json.error)}`,
      );
    }
    uid = signIn.json.localId;
  }
  if (!uid)
    throw new Error("Could not obtain admin uid from the Auth emulator");

  const env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    database: { host: "127.0.0.1", port: 9000 },
  });
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.database();
    const now = Date.now();
    const roles = Object.fromEntries(
      defaultRoleRecords(now, uid).map(({ id, ...role }) => [id, role]),
    );
    const categories = Object.fromEntries(
      defaultCategoryRecords(now, uid).map(({ id, ...category }) => [
        id,
        category,
      ]),
    );
    const shifts = Object.fromEntries(
      defaultShiftRecords(now, uid).map(({ id, ...shift }) => [id, shift]),
    );
    await set(ref(db, "roles"), roles);
    await set(ref(db, "categories"), categories);
    await set(ref(db, "shifts"), shifts);
    await set(ref(db, `profiles/${uid}`), {
      uid,
      email: ADMIN_EMAIL,
      displayName: "E2E Admin",
      role: "admin",
      active: true,
      createdAt: now,
      lastLogin: now,
      updatedAt: now,
    });
  });
  await env.cleanup();
}
