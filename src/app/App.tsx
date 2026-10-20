import { Toast } from "@heroui/react";
import type { ReactNode } from "react";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "../features/auth/AuthProvider";
import { SiteProvider } from "../i18n/SiteProvider";
import { ErrorBoundary } from "./ErrorBoundary";
import { router } from "./router";

export function App(): ReactNode {
  return (
    <ErrorBoundary>
      {/* Toast.Provider renders the toast region; it must NOT wrap the app. */}
      <Toast.Provider placement="top" />
      <SiteProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </SiteProvider>
    </ErrorBoundary>
  );
}
