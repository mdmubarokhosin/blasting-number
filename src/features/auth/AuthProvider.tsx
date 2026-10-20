import { toast } from "@heroui/react";
import type { User } from "firebase/auth";
import type { Unsubscribe } from "firebase/database";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { auth } from "../../lib/firebase";
import { useSite } from "../../i18n/SiteProvider";
import {
  ALL_PERMISSION_IDS,
  PERMISSION_BY_ID,
  isStaffPermissionSet,
  rolePermissionIds,
} from "../../lib/permissions";
import { effectiveRoleKey, isMasterRoleKey } from "../../lib/defaults";
import { authErrorMessage, dbErrorMessage } from "../../lib/validation";
import { logActivity } from "../../services/activityLogs";
import {
  deleteCurrentAuthUser,
  fetchProfile,
  loginWithEmail,
  logout as authLogout,
  registerWithEmail,
  resetPassword,
  sendVerificationEmail as sendVerification,
  touchLastLogin,
  updateDisplayName,
  watchAuth,
} from "../../services/auth";
import { ensureProfile, subscribeProfile } from "../../services/profiles";
import { subscribeRoles } from "../../services/roles";
import { subscribeCategories } from "../../services/categories";
import { subscribeShifts } from "../../services/shifts";
import type {
  AppSettings,
  CategoryRecord,
  RoleRecord,
  ShiftRecord,
  UserProfile,
} from "../../types";

type Status = "loading" | "authenticated" | "unauthenticated";
export type AccessState =
  | "loading"
  | "ready"
  | "unauthenticated"
  | "disabled"
  | "role-inactive"
  | "profile-missing";

interface AuthContextValue {
  status: Status;
  user: User | null;
  profile: UserProfile | null;
  profileReady: boolean;
  profileError: string | null;
  roles: RoleRecord[];
  rolesReady: boolean;
  rolesError: string | null;
  categories: CategoryRecord[];
  categoriesReady: boolean;
  categoriesError: string | null;
  shifts: ShiftRecord[];
  shiftsReady: boolean;
  shiftsError: string | null;
  role: RoleRecord | null;
  roleKey: string;
  permissions: string[];
  can: (permissionId: string) => boolean;
  isMaster: boolean;
  isStaff: boolean;
  /** @deprecated use isMaster or can(permission). */
  isAdmin: boolean;
  accessState: AccessState;
  settings: AppSettings;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function errorCode(err: unknown): string {
  return typeof err === "object" && err !== null && "code" in err
    ? String((err as { code: unknown }).code)
    : "";
}

function profileErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message === "profile-missing") {
    return "আপনার প্রোফাইল পাওয়া যায়নি। অ্যাডমিনের সাথে যোগাযোগ করুন";
  }
  const code = errorCode(err);
  if (code) return authErrorMessage(code);
  if (err instanceof Error && err.message === "not-authenticated") {
    return "আপনি লগইন করা নেই";
  }
  return dbErrorMessage(err);
}

/** Maps an effective role + loaded roles to concrete permission ids. */
export function resolvePermissions(args: {
  rawRole: string | null | undefined;
  roles: RoleRecord[];
}): { role: RoleRecord | null; roleKey: string; permissionIds: string[]; master: boolean } {
  const rawRole = args.rawRole ?? "";
  const roleKey = effectiveRoleKey(rawRole);
  const master = isMasterRoleKey(rawRole) || roleKey === "master-admin";
  if (!rawRole) {
    return { role: null, roleKey, permissionIds: [], master: false };
  }
  if (master) {
    return {
      role: args.roles.find((role) => role.id === roleKey) ?? null,
      roleKey,
      permissionIds: [...ALL_PERMISSION_IDS],
      master: true,
    };
  }
  const role = args.roles.find((entry) => entry.id === roleKey) ?? null;
  if (role && role.status === "active") {
    return { role, roleKey, permissionIds: rolePermissionIds(role), master: false };
  }
  if (role) {
    return { role, roleKey, permissionIds: [], master: false };
  }
  return { role: null, roleKey, permissionIds: [], master: false };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { settings } = useSite();
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [rolesReady, setRolesReady] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [categoriesReady, setCategoriesReady] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [shiftsReady, setShiftsReady] = useState(false);
  const [shiftsError, setShiftsError] = useState<string | null>(null);
  const [sessionNonce, setSessionNonce] = useState(0);
  const signedOutForDisabled = useRef(false);
  const registrationRef = useRef<Promise<void> | null>(null);

  const refreshProfile = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) return;
    try {
      const p = await fetchProfile(u.uid);
      setProfile(p);
      setProfileError(p ? null : "আপনার প্রোফাইল পাওয়া যায়নি");
      setProfileReady(true);
    } catch (err) {
      setProfileError(dbErrorMessage(err));
      setProfileReady(true);
    }
  }, []);

  useEffect(() => {
    let unsubProfile: Unsubscribe | undefined;
    let unsubRoles: Unsubscribe | undefined;
    let unsubCategories: Unsubscribe | undefined;
    let unsubShifts: Unsubscribe | undefined;
    let disposed = false;

    const unsubAuth = watchAuth((u) => {
      if (disposed) return;
      unsubProfile?.();
      unsubRoles?.();
      unsubCategories?.();
      unsubShifts?.();
      unsubProfile = undefined;
      unsubRoles = undefined;
      unsubCategories = undefined;
      unsubShifts = undefined;

      setUser(u);
      setStatus(u ? "authenticated" : "unauthenticated");
      setProfile(null);
      setProfileReady(false);
      setProfileError(null);
      setRoles([]);
      setRolesReady(false);
      setRolesError(null);
      setCategories([]);
      setCategoriesReady(false);
      setCategoriesError(null);
      setShifts([]);
      setShiftsReady(false);
      setShiftsError(null);

      if (!u) {
        signedOutForDisabled.current = false;
        setProfileReady(true);
        setRolesReady(true);
        setCategoriesReady(true);
        setShiftsReady(true);
        return;
      }

      unsubRoles = subscribeRoles(
        (list) => {
          if (disposed) return;
          setRoles(list);
          setRolesError(null);
          setRolesReady(true);
        },
        (err) => {
          if (disposed) return;
          setRolesError(dbErrorMessage(err));
          setRolesReady(true);
        },
      );

      unsubCategories = subscribeCategories(
        (list) => {
          if (disposed) return;
          setCategories(list);
          setCategoriesError(null);
          setCategoriesReady(true);
        },
        (err) => {
          if (disposed) return;
          setCategoriesError(dbErrorMessage(err));
          setCategoriesReady(true);
        },
      );

      unsubShifts = subscribeShifts(
        (list) => {
          if (disposed) return;
          setShifts(list);
          setShiftsError(null);
          setShiftsReady(true);
        },
        (err) => {
          if (disposed) return;
          setShiftsError(dbErrorMessage(err));
          setShiftsReady(true);
        },
      );

      unsubProfile = subscribeProfile(
        u.uid,
        (p) => {
          if (disposed) return;
          setProfile(p);
          setProfileReady(true);
          if (!p) {
            setProfileError("আপনার প্রোফাইল পাওয়া যায়নি। অ্যাডমিনের সাথে যোগাযোগ করুন");
            return;
          }
          setProfileError(null);
          if (p.active === false && !signedOutForDisabled.current) {
            signedOutForDisabled.current = true;
            void authLogout();
            toast("আপনার অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে", { variant: "danger" });
          }
        },
        (err) => {
          if (disposed) return;
          setProfileError(dbErrorMessage(err));
          setProfileReady(true);
        },
      );
    });

    return () => {
      disposed = true;
      unsubAuth();
      unsubProfile?.();
      unsubRoles?.();
      unsubCategories?.();
      unsubShifts?.();
    };
  }, [sessionNonce]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const u = await loginWithEmail(email, password);
      const p = await fetchProfile(u.uid);
      if (!p) {
        await authLogout();
        throw new Error("profile-missing");
      }
      if (p.active === false) {
        await authLogout();
        throw new Error("auth/user-disabled");
      }
      await touchLastLogin(u.uid);
      await logActivity("login", `${p.displayName || u.email} লগইন করেছেন`);
      toast(`স্বাগতম, ${p.displayName || u.email}!`, { variant: "success" });
    } catch (err) {
      toast(profileErrorMessage(err), { variant: "danger" });
      throw err;
    }
  }, []);

  const register = useCallback((email: string, password: string, displayName: string) => {
    // Coalesce duplicate/concurrent submissions so only one Auth account and
    // one profile can be created for the same dialog interaction.
    if (registrationRef.current) return registrationRef.current;

    const task = (async () => {
      try {
        const u = await registerWithEmail(email, password, displayName);
        try {
          await ensureProfile(u.uid, { email: u.email ?? email, displayName });
        } catch (err) {
          // Roll back the freshly created Auth account so a retry with the same
          // email remains possible. Never leave an orphaned half-registration.
          try {
            await deleteCurrentAuthUser();
          } catch {
            await authLogout();
          }
          throw err;
        }
        // The auth listener may have subscribed before the profile existed. Re-run
        // it now so role/shift/category/settings listeners start with a profile.
        setSessionNonce((value) => value + 1);
        await logActivity("user_create", `${displayName || email} নতুন অ্যাকাউন্ট তৈরি করেছেন`);
        try {
          await sendVerification();
        } catch {
          // Email verification is optional and must not block registration.
        }
        toast("অ্যাকাউন্ট তৈরি হয়েছে! ডিফল্ট Viewer অ্যাক্সেসসহ ইমেইল যাচাইয়ের লিংক পাঠানো হয়েছে", {
          variant: "success",
        });
      } catch (err) {
        const code = errorCode(err);
        toast(code ? authErrorMessage(code) : "রেজিস্ট্রেশন করা যায়নি", {
          variant: "danger",
        });
        throw err;
      } finally {
        registrationRef.current = null;
      }
    })();

    registrationRef.current = task;
    return task;
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    try {
      await resetPassword(email);
      toast("পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে", { variant: "success" });
    } catch (err) {
      const code = errorCode(err);
      toast(code ? authErrorMessage(code) : "রিসেট লিংক পাঠানো যায়নি", { variant: "danger" });
      throw err;
    }
  }, []);

  const sendVerificationEmail = useCallback(async () => {
    try {
      await sendVerification();
      toast("ইমেইল যাচাইয়ের লিংক পাঠানো হয়েছে", { variant: "success" });
    } catch (err) {
      const code = errorCode(err);
      toast(code ? authErrorMessage(code) : "যাচাইয়ের লিংক পাঠানো যায়নি", { variant: "danger" });
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const name = profile?.displayName || user?.email || "";
      if (name) await logActivity("logout", `${name} লগআউট করেছেন`);
      await authLogout();
      toast("লগআউট হয়েছে", { variant: "default" });
    } catch {
      toast("লগআউট করা যায়নি", { variant: "danger" });
    }
  }, [profile, user]);

  const updateName = useCallback(async (name: string) => {
    await updateDisplayName(name);
    setProfile((prev) => (prev ? { ...prev, displayName: name.trim() } : prev));
  }, []);

  const resolved = useMemo(
    () => resolvePermissions({ rawRole: profile?.role, roles }),
    [profile?.role, roles],
  );

  const permissionSet = useMemo(() => new Set(resolved.permissionIds), [resolved.permissionIds]);

  const can = useCallback(
    (permissionId: string) => {
      if (!profile || profile.active === false) return false;
      const permission = PERMISSION_BY_ID.get(permissionId);
      if (permission?.protected && !resolved.master) return false;
      return permissionSet.has(permissionId);
    },
    [permissionSet, resolved.master, profile],
  );

  const accessState = useMemo<AccessState>(() => {
    if (status === "loading") return "loading";
    if (status === "unauthenticated") return "unauthenticated";
    if (profileReady && !profile) return "profile-missing";
    if (profile && profile.active === false) return "disabled";
    if (profile && rolesReady && !resolved.master && !resolved.role) {
      return "role-inactive";
    }
    if (profile && resolved.role && resolved.role.status !== "active") return "role-inactive";
    return "ready";
  }, [status, profile, profileReady, rolesReady, resolved]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      profile,
      profileReady,
      profileError,
      roles,
      rolesReady,
      rolesError,
      categories,
      categoriesReady,
      categoriesError,
      shifts,
      shiftsReady,
      shiftsError,
      role: resolved.role,
      roleKey: resolved.roleKey,
      permissions: resolved.permissionIds,
      can,
      isMaster: resolved.master,
      isStaff: isStaffPermissionSet(resolved.permissionIds),
      isAdmin: resolved.master,
      accessState,
      settings,
      login,
      register,
      sendPasswordReset,
      sendVerificationEmail,
      logout,
      refreshProfile,
      updateName,
    }),
    [
      status,
      user,
      profile,
      profileReady,
      profileError,
      roles,
      rolesReady,
      rolesError,
      categories,
      categoriesReady,
      categoriesError,
      shifts,
      shiftsReady,
      shiftsError,
      resolved,
      can,
      accessState,
      settings,
      login,
      register,
      sendPasswordReset,
      sendVerificationEmail,
      logout,
      refreshProfile,
      updateName,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
