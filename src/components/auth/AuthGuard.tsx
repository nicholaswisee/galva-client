import { Navigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { location } = useRouterState();

  // Wait for the silent refresh to complete before deciding auth state.
  // Without this, the guard would redirect to /in immediately because
  // the access token hasn't been restored yet.
  if (isLoading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/in" search={{ redirect: location.pathname }} />;
  }
  return <>{children}</>;
}
