import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { authApi, usersApi, type AuthUser, type LoginPayload, type RegisterPayload } from './api';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  // Step 1: password only. Returns the email to carry into the 2FA step
  // (the caller — LoginPage — then shows the code-entry screen).
  login: (payload: LoginPayload) => Promise<{ email: string }>;
  // Step 2: the emailed code. Completes the session.
  verifyTwoFactor: (email: string, code: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<{ message: string; status: string }>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'studenthub_token';
const REFRESH_KEY = 'studenthub_refresh_token';

// Access tokens are short-lived JWTs; decoding the payload client-side
// (no signature check needed — we're only reading `exp` to decide when to
// silently refresh, the actual verification happens server-side on every
// request) lets us schedule a refresh a bit before it actually expires,
// instead of waiting for a request to fail first.
function decodeExpiry(jwt: string): number | null {
  try {
    const payload = jwt.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed = JSON.parse(json);
    return typeof parsed.exp === 'number' ? parsed.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [refreshToken, setRefreshTokenState] = useState<string | null>(() => localStorage.getItem(REFRESH_KEY));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setSession = (accessToken: string, newRefreshToken: string, authUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, newRefreshToken);
    setTokenState(accessToken);
    setRefreshTokenState(newRefreshToken);
    setUser(authUser);
  };

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setTokenState(null);
    setRefreshTokenState(null);
    setUser(null);
  };

  const logout = () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    clearSession();
  };

  // Silently exchange the refresh token for a new access token a few
  // minutes before the current one expires, so a session someone left
  // open all day doesn't just die mid-use. If the refresh token itself is
  // gone/invalid (e.g. password was reset elsewhere — see tokenVersion on
  // the backend), fall back to logging out.
  const scheduleRefresh = (accessToken: string, currentRefreshToken: string) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    const expiry = decodeExpiry(accessToken);
    if (!expiry) return;
    const refreshInMs = Math.max(expiry - Date.now() - 5 * 60 * 1000, 10_000);
    refreshTimer.current = setTimeout(async () => {
      try {
        const res = await authApi.refresh(currentRefreshToken);
        setSession(res.accessToken, res.refreshToken, res.user);
        scheduleRefresh(res.accessToken, res.refreshToken);
      } catch {
        clearSession();
      }
    }, refreshInMs);
  };

  useEffect(() => {
    if (!token || !refreshToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    usersApi
      .me(token)
      .then((me) => {
        setUser({ id: me.id, email: me.email, firstName: me.firstName, lastName: me.lastName, role: me.role, status: me.status, bio: me.bio, profileImageUrl: me.profileImageUrl });
        scheduleRefresh(token, refreshToken);
      })
      .catch(async () => {
        // Access token might just be stale (tab was closed for a while) —
        // try one refresh before giving up and logging out.
        try {
          const res = await authApi.refresh(refreshToken);
          setSession(res.accessToken, res.refreshToken, res.user);
          scheduleRefresh(res.accessToken, res.refreshToken);
        } catch {
          clearSession();
        }
      })
      .finally(() => setLoading(false));

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (payload: LoginPayload) => {
    const res = await authApi.login(payload);
    return { email: res.email };
  };

  const verifyTwoFactor = async (email: string, code: string) => {
    const res = await authApi.verifyTwoFactor(email, code);
    setSession(res.accessToken, res.refreshToken, res.user);
    scheduleRefresh(res.accessToken, res.refreshToken);
  };

  const register = async (payload: RegisterPayload) => {
    return authApi.register(payload);
  };

  const refreshMe = async () => {
    if (!token) return;
    const me = await usersApi.me(token);
    setUser({ id: me.id, email: me.email, firstName: me.firstName, lastName: me.lastName, role: me.role, status: me.status, bio: me.bio, profileImageUrl: me.profileImageUrl });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, verifyTwoFactor, register, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
