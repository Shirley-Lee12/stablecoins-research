import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export class VerificationRequiredError extends Error {
  email: string;
  constructor(email: string) {
    super('Please verify your email before signing in');
    this.email = email;
  }
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  sessionExpired: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<{ email: string; message: string }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<{ message: string }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL).replace(/\/$/, '');
const AUTH_SESSION_EXPIRED_EVENT = 'stablecoin:auth-session-expired';

function tokenExpiresAt(token: string): number | null {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function removeStoredSession() {
  localStorage.removeItem('auth-token');
  localStorage.removeItem('auth-user');
}

export async function authenticatedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
  const response = await fetch(input, init);
  if (!headers.has('Authorization')) return response;
  if (response.status === 403) {
    const body = await response.clone().json().catch(() => null) as { code?: string } | null;
    if (body?.code === 'ACCOUNT_SUSPENDED') window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
    return response;
  }
  if (response.status !== 401) return response;

  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
  return new Response(JSON.stringify({
    error: '登录已过期，请重新登录。 / Your session has expired. Please sign in again.',
    code: 'AUTH_SESSION_EXPIRED',
  }), {
    status: 401,
    statusText: response.statusText,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function apiPost(path: string, body: unknown, token?: string | null) {
  const res = await fetch(`${BASE}/api${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 403 && data.requiresVerification) {
      throw new VerificationRequiredError(data.email);
    }
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const expireSession = useCallback(() => {
    setToken(null);
    setUser(null);
    setSessionExpired(true);
    removeStoredSession();
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth-token');
    const storedUser = localStorage.getItem('auth-user');
    if (storedToken && storedUser) {
      try {
        const expiresAt = tokenExpiresAt(storedToken);
        if (expiresAt !== null && expiresAt <= Date.now()) {
          expireSession();
          setIsLoading(false);
          return;
        }
        const parsed = JSON.parse(storedUser) as AuthUser;
        // Back-fill role for tokens issued before the role field existed
        if (!parsed.role) parsed.role = 'user';
        setToken(storedToken);
        setUser(parsed);
      } catch {}
    }
    setIsLoading(false);
  }, [expireSession]);

  useEffect(() => {
    if (!token) return;
    const expiresAt = tokenExpiresAt(token);
    if (expiresAt === null) return;
    const remainingMs = expiresAt - Date.now();
    if (remainingMs <= 0) {
      expireSession();
      return;
    }
    const timer = window.setTimeout(expireSession, Math.min(remainingMs, 2_147_483_647));
    return () => window.clearTimeout(timer);
  }, [expireSession, token]);

  useEffect(() => {
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, expireSession);
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, expireSession);
  }, [expireSession]);

  const persist = (t: string, u: AuthUser) => {
    setToken(t);
    setUser(u);
    setSessionExpired(false);
    localStorage.setItem('auth-token', t);
    localStorage.setItem('auth-user', JSON.stringify(u));
  };

  const updateUser = useCallback((nextUser: AuthUser) => {
    setUser(nextUser);
    localStorage.setItem('auth-user', JSON.stringify(nextUser));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiPost('/auth/login', { email, password });
    persist(data.token, data.user);
  }, []);

  const register = useCallback(async (email: string, name: string, password: string) => {
    const data = await apiPost('/auth/register', { email, name, password });
    return { email: data.email as string, message: data.message as string };
  }, []);

  const verifyEmail = useCallback(async (email: string, code: string) => {
    const data = await apiPost('/auth/verify-email', { email, code });
    persist(data.token, data.user);
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    return apiPost('/auth/resend-verification', { email });
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setSessionExpired(false);
    removeStoredSession();
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    return apiPost('/auth/forgot-password', { email });
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    await apiPost('/auth/reset-password', { token, password });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, sessionExpired, login, register, verifyEmail, resendVerification, logout, forgotPassword, resetPassword, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
