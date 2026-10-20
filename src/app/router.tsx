import { Suspense, lazy, type ReactNode } from "react";
import { createBrowserRouter } from "react-router-dom";
import { InlineLoader } from "../components/common/LoadingScreen";
import { AdminLayout } from "../components/layout/AdminLayout";
import { AppShell } from "../components/layout/AppShell";
import {
  RequireAdmin,
  RequireAuth,
  RequirePermission,
} from "../components/layout/RequireAuth";
import { AddListPage } from "../pages/AddListPage";
import { EditListPage } from "../pages/EditListPage";
import { LandingPage } from "../pages/LandingPage";
import { ListDetailsPage } from "../pages/ListDetailsPage";
import { ListsPage } from "../pages/ListsPage";
import { ProfilePage } from "../pages/ProfilePage";
import { NotFoundPage, UnauthorizedPage } from "../pages/UnauthorizedPage";

const AdminDashboardPage = lazy(() =>
  import("../pages/admin/AdminDashboardPage").then((m) => ({
    default: m.AdminDashboardPage,
  })),
);
const AdminRolesPage = lazy(() =>
  import("../pages/admin/AdminRolesPage").then((m) => ({
    default: m.AdminRolesPage,
  })),
);
const AdminCategoriesPage = lazy(() =>
  import("../pages/admin/AdminCategoriesPage").then((m) => ({
    default: m.AdminCategoriesPage,
  })),
);
const AdminShiftsPage = lazy(() =>
  import("../pages/admin/AdminShiftsPage").then((m) => ({
    default: m.AdminShiftsPage,
  })),
);
const AdminUsersPage = lazy(() =>
  import("../pages/admin/AdminUsersPage").then((m) => ({
    default: m.AdminUsersPage,
  })),
);
const AdminListsPage = lazy(() =>
  import("../pages/admin/AdminListsPage").then((m) => ({
    default: m.AdminListsPage,
  })),
);
const AdminAnalyticsPage = lazy(() =>
  import("../pages/admin/AdminAnalyticsPage").then((m) => ({
    default: m.AdminAnalyticsPage,
  })),
);
const AdminLogsPage = lazy(() =>
  import("../pages/admin/AdminLogsPage").then((m) => ({
    default: m.AdminLogsPage,
  })),
);
const AdminSettingsPage = lazy(() =>
  import("../pages/admin/AdminSettingsPage").then((m) => ({
    default: m.AdminSettingsPage,
  })),
);
const AdminLanguagesPage = lazy(() =>
  import("../pages/admin/AdminLanguagesPage").then((m) => ({
    default: m.AdminLanguagesPage,
  })),
);

function withSuspense(node: ReactNode): ReactNode {
  return (
    <Suspense fallback={<InlineLoader label="লোড হচ্ছে..." />}>{node}</Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: "/lists",
            element: (
              <RequirePermission permission="lists.view">
                <ListsPage />
              </RequirePermission>
            ),
          },
          {
            path: "/lists/new",
            element: (
              <RequirePermission permission="lists.create">
                <AddListPage />
              </RequirePermission>
            ),
          },
          {
            path: "/lists/:listId",
            element: (
              <RequirePermission permission="lists.view">
                <ListDetailsPage />
              </RequirePermission>
            ),
          },
          {
            path: "/lists/:listId/edit",
            element: (
              <RequirePermission permission="lists.view">
                <EditListPage />
              </RequirePermission>
            ),
          },
          { path: "/profile", element: <ProfilePage /> },
        ],
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: "/admin",
        element: <RequireAdmin />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              {
                index: true,
                element: withSuspense(
                  <RequirePermission permission="dashboard.view">
                    <AdminDashboardPage />
                  </RequirePermission>,
                ),
              },
              {
                path: "users",
                element: withSuspense(
                  <RequirePermission permission="users.view">
                    <AdminUsersPage />
                  </RequirePermission>,
                ),
              },
              {
                path: "roles",
                element: withSuspense(
                  <RequirePermission permission="roles.view">
                    <AdminRolesPage />
                  </RequirePermission>,
                ),
              },
              {
                path: "categories",
                element: withSuspense(
                  <RequirePermission permission="categories.view">
                    <AdminCategoriesPage />
                  </RequirePermission>,
                ),
              },
              {
                path: "shifts",
                element: withSuspense(
                  <RequirePermission permission="shifts.view">
                    <AdminShiftsPage />
                  </RequirePermission>,
                ),
              },
              {
                path: "lists",
                element: withSuspense(
                  <RequirePermission permission="lists.manage">
                    <AdminListsPage />
                  </RequirePermission>,
                ),
              },
              {
                path: "analytics",
                element: withSuspense(
                  <RequirePermission permission="dashboard.view">
                    <AdminAnalyticsPage />
                  </RequirePermission>,
                ),
              },
              {
                path: "logs",
                element: withSuspense(
                  <RequirePermission permission="audit.view">
                    <AdminLogsPage />
                  </RequirePermission>,
                ),
              },
              {
                path: "languages",
                element: withSuspense(
                  <RequirePermission permission="settings.view">
                    <AdminLanguagesPage />
                  </RequirePermission>,
                ),
              },
              {
                path: "settings",
                element: withSuspense(
                  <RequirePermission permission="settings.view">
                    <AdminSettingsPage />
                  </RequirePermission>,
                ),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
