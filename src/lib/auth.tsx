import { useState, useEffect, type ReactNode } from "react";
import { api, apiFetch, getAccessToken, setAccessToken } from "./api";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => getAccessToken() !== null
  );
  // Start as loading so the AuthGuard waits for the silent refresh
  // before deciding whether to redirect to the login page.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const trySilentRefresh = async () => {
      try {
        const res = await apiFetch("/api/auth/refresh", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.accessToken);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    trySilentRefresh();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const res = await api.post("/api/auth/login", { username, password });
    if (!res.ok) return false;
    const data = await res.json();
    setAccessToken(data.accessToken);
    setIsAuthenticated(true);
    return true;
  };

  const logout = async (): Promise<void> => {
    await api.post("/api/auth/logout");
    setAccessToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
