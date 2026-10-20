import { Button, Card } from "@heroui/react";
import { LogOut, RefreshCw, ShieldAlert, ShieldOff } from "../icons";
import { type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider";
import { LoadingScreen } from "../common/LoadingScreen";

function ProblemCard({
  icon,
  title,
  message,
  children,
}: {
  icon: ReactNode;
  title: string;
  message: string;
  children?: ReactNode;
}): ReactNode {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4">
      <Card className="w-full">
        <Card.Header className="items-center text-center">
          <span className="bg-danger/10 text-danger mx-auto inline-flex size-14 items-center justify-center rounded-2xl">
            {icon}
          </span>
          <Card.Title className="mt-2">{title}</Card.Title>
          <Card.Description>{message}</Card.Description>
        </Card.Header>
        <Card.Footer className="flex-col gap-2 sm:flex-row">{children}</Card.Footer>
      </Card>
    </div>
  );
}

function ProfileProblem({ message }: { message: string }): ReactNode {
  const { refreshProfile, logout } = useAuth();
  return (
    <ProblemCard
      icon={<ShieldAlert className="size-7" />}
      title="প্রোফাইল লোড করা যায়নি"
      message={message}
    >
      <Button variant="secondary" className="w-full sm:w-auto" onPress={() => void refreshProfile()}>
        <RefreshCw className="size-4" />
        আবার চেষ্টা করুন
      </Button>
      <Button variant="danger-soft" className="w-full sm:w-auto" onPress={() => void logout()}>
        <LogOut className="size-4" />
        লগআউট
      </Button>
    </ProblemCard>
  );
}

export function RoleInactiveProblem(): ReactNode {
  const { roleKey, logout } = useAuth();
  return (
    <ProblemCard
      icon={<ShieldOff className="size-7" />}
      title="আপনার রোল সক্রিয় নেই"
      message={`রোল "${roleKey}" নিষ্ক্রিয় অথবা মুছে ফেলা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।`}
    >
      <Button variant="danger-soft" className="w-full sm:w-auto" onPress={() => void logout()}>
        <LogOut className="size-4" />
        লগআউট
      </Button>
    </ProblemCard>
  );
}

export function RequireAuth({ children }: { children?: ReactNode }): ReactNode {
  const { status, profileReady, profile, profileError, accessState } = useAuth();
  const location = useLocation();

  if (status === "loading") return <LoadingScreen />;

  if (status === "unauthenticated") {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/?auth=login&next=${next}`} replace />;
  }

  if (!profileReady) return <LoadingScreen label="প্রোফাইল লোড হচ্ছে..." />;

  if (!profile) return <ProfileProblem message={profileError ?? "প্রোফাইল পাওয়া যায়নি"} />;

  if (accessState === "role-inactive") return <RoleInactiveProblem />;

  return children ?? <Outlet />;
}

/** Any permission from the list grants access. */
export function RequireAnyPermission({
  permissions,
  children,
}: {
  permissions: string[];
  children?: ReactNode;
}): ReactNode {
  const { can, rolesReady } = useAuth();
  if (!rolesReady) return <LoadingScreen label="অনুমতি লোড হচ্ছে..." />;
  if (!permissions.some((permission) => can(permission))) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children ?? <Outlet />;
}

export function RequirePermission({
  permission,
  children,
}: {
  permission: string;
  children?: ReactNode;
}): ReactNode {
  const { can, rolesReady } = useAuth();
  if (!rolesReady) return <LoadingScreen label="অনুমতি লোড হচ্ছে..." />;
  if (!can(permission)) return <Navigate to="/unauthorized" replace />;
  return children ?? <Outlet />;
}

export function RequireStaff(): ReactNode {
  const { isStaff, rolesReady } = useAuth();
  if (!rolesReady) return <LoadingScreen label="অনুমতি লোড হচ্ছে..." />;
  if (!isStaff) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}

/** Legacy alias kept for imports; staff/permission checks are now authoritative. */
export function RequireAdmin(): ReactNode {
  return <RequireStaff />;
}
