# Demo Admin Provisioning Guide

This guide is for a development/demo environment only. Do not reuse demo
credentials in production, and never store the demo password in source control,
the ZIP archive, `.env.example`, browser code, logs, or screenshots.

## Preconditions

1. `firebase/database.rules.json` has been deployed to the target project.
2. Email/Password authentication is enabled.
3. A trusted owner-controlled account exists for the one-time bootstrap.
4. Default roles, categories, shifts, languages and translations have been seeded by a master account.

If the deployed rules still allow anonymous database access, stop. Provisioning
an administrator before deploying the rules does not make the project secure.

## Safe provisioning sequence

1. Create the demo Auth account in Firebase Console → Authentication, or with a
   trusted Admin SDK script. Set the password out-of-band; do not commit it.
2. Sign in once so the application creates `profiles/<uid>` with the default
   `viewer` role, or create that profile through the trusted Admin SDK. A new
   public registration intentionally starts read-only and must be promoted to
   `operator` or another approved role after review.
3. Use only the owner-controlled one-time bootstrap path when no master exists:
   set the controlled bootstrap profile's role to the legacy `admin` value (or
   the current architecture's equivalent trusted assignment) from Firebase
   Console/Admin SDK. Never allow a client to promote itself and never bake this
   step into application code.
4. Sign in as the bootstrap master, open `/admin/roles`, and seed default roles.
5. Open `/admin/categories` and seed default categories.
6. Open `/admin/shifts` and seed the default day/night shifts before creating
   lists. Public sign-up should not go live until the viewer role exists.
7. Open `/admin/languages` and run **Seed defaults**. Confirm English and
   Bengali appear, English remains the active protected default, and the
   interface catalog/website content are editable per language.
8. For later accounts, assign roles through `/admin/users` as a master. Do not
   edit arbitrary profiles directly.
9. Verify the account's Auth UID, active profile, effective master permissions,
   admin routes, session refresh, logout, language switching, and temporary CRUD
   cleanup.

## Verification checklist

- Auth sign-in succeeds and the profile UID matches the Auth UID.
- Profile is active and the effective role is trusted master-equivalent.
- Eight default roles, four legacy categories, two legacy shifts and `en`/`bn` languages load from the database.
- `/admin`, `/admin/roles`, `/admin/categories`, `/admin/shifts`, `/admin/users`, `/admin/languages` and `/admin/settings` load.
- A temporary category/role/shift can be created, reloaded, edited where applicable,
  and deleted without touching production records.
- A temporary list with a leading-zero code such as `0001` can be created,
  updated, and deleted; no pre-existing list is modified.
- Refresh preserves the session; logout followed by `/admin` returns to login.
- Temporary records are removed after verification.

## Current demo record

The current environment has a verified demo Auth account with an active profile
and the legacy `admin` role, which the application maps to master-equivalent
permissions. The plaintext password is intentionally not recorded here. Rotate
or disable this account before any production launch. New public accounts are
Viewer-only by default and are not demo administrators.
