import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectDatabaseEmulator, getDatabase, type Database } from "firebase/database";

/** Treat empty env values (common when copying .env.example) as missing. */
function envOf(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

/**
 * Firebase configuration.
 *
 * Values are read from VITE_* environment variables when present and fall back to the
 * project defaults below so the app also runs without a local `.env` file.
 *
 * IMPORTANT: the fallback values below target the `servicebd` project config supplied by
 * the project owner. Override them with `.env` for another project.
 *
 * Web API keys in this file are public client identifiers, not secrets. Never put
 * service-account keys, private tokens or other server-only secrets in this bundle.
 */
const firebaseConfig = {
  apiKey: envOf(import.meta.env.VITE_FIREBASE_API_KEY, "AIzaSyBoeqjFBDWnPyknat0u-ZjNB-pMO5iiG8Q"),
  authDomain: envOf(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, "servicebd.firebaseapp.com"),
  databaseURL: envOf(
    import.meta.env.VITE_FIREBASE_DATABASE_URL,
    "https://servicebd-default-rtdb.firebaseio.com",
  ),
  projectId: envOf(import.meta.env.VITE_FIREBASE_PROJECT_ID, "servicebd"),
  storageBucket: envOf(
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    "servicebd.firebasestorage.app",
  ),
  messagingSenderId: envOf(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, "388701749883"),
  appId: envOf(import.meta.env.VITE_FIREBASE_APP_ID, "1:388701749883:web:6a396e03e769db0a0fd8de"),
  measurementId: envOf(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, "G-E09L9Z3SMR"),
};

let app: FirebaseApp;

if (getApps().length > 0) {
  // Never initialize a second default app — duplicate initialization is a known
  // source of "Firebase App named '[DEFAULT]' already exists" runtime failures.
  app = getApp();
} else {
  app = initializeApp(firebaseConfig);
}

export const auth: Auth = getAuth(app);
export const db: Database = getDatabase(app);
export const firebaseApp = app;

/**
 * Optional local development / E2E mode. Never enabled by default and has no
 * effect in production builds unless the env flag is explicitly set.
 */
if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true") {
  connectAuthEmulator(
    auth,
    envOf(import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL, "http://127.0.0.1:9099"),
    { disableWarnings: true },
  );
  connectDatabaseEmulator(
    db,
    envOf(import.meta.env.VITE_FIREBASE_DB_EMULATOR_HOST, "127.0.0.1"),
    Number(envOf(import.meta.env.VITE_FIREBASE_DB_EMULATOR_PORT, "9000")),
  );
}

export { firebaseConfig };
