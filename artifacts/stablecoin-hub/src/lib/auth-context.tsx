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
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<{ email: string; message: string }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<{ message: string }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL).replace(/\/$/, '');

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

  useEffect(() => {
    const storedToken = localStorage.getItem('auth-token');
    const storedUser = localStorage.getItem('auth-user');
    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as AuthUser;
        // Back-fill role for tokens issued before the role field existed
        if (!parsed.role) parsed.role = 'user';
        setToken(storedToken);
        setUser(parsed);
      } catch {}
    }
    setIsLoading(false);
  }, []);

  const persist = (t: string, u: AuthUser) => {
    setToken(t);
    setUser(u);
    localStorage.setItem('auth-token', t);
    localStorage.setItem('auth-user', JSON.stringify(u));
  };

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
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user');
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    return apiPost('/auth/forgot-password', { email });
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    await apiPost('/auth/reset-password', { token, password });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, verifyEmail, resendVerification, logout, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
