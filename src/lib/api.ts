const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5132";
const TOKEN_KEY = "galva_access_token";

let accessToken: string | null = (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null);

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return false;
    const data = await res.json();
    accessToken = data.accessToken;
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  isRetry = false
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (
    !headers.has("Content-Type") &&
    options.body &&
    typeof options.body === "string"
  ) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && !isRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch(path, options, true);
    }
  }

  return res;
}

export const api = {
  get: (path: string) => apiFetch(path),
  post: (path: string, body?: unknown) => {
    const headers = new Headers();
    headers.set("Idempotency-Key", crypto.randomUUID());
    return apiFetch(path, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  put: (path: string, body?: unknown, options?: { ifMatch?: string }) => {
    const headers = new Headers();
    if (options?.ifMatch) {
      headers.set("If-Match", `"${options.ifMatch}"`);
    }
    return apiFetch(path, {
      method: "PUT",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  del: (path: string, options?: { ifMatch?: string }) => {
    const headers = new Headers();
    if (options?.ifMatch) {
      headers.set("If-Match", `"${options.ifMatch}"`);
    }
    return apiFetch(path, { method: "DELETE", headers });
  },
};
