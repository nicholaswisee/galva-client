import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { api, apiFetch, getAccessToken, setAccessToken } from "./api";

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => getAccessToken() !== null
  );

  useEffect(() => {
    const trySilentRefresh = async () => {
      const res = await apiFetch("/api/auth/refresh", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.accessToken);
        setIsAuthenticated(true);
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
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
