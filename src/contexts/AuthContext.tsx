'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { isLikelyMockName } from '@/lib/user-display';

export type User = {
  id: string;
  email: string;
  role?: 'student' | 'patient' | 'admin';
  name?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<{ role?: User['role']; authenticated: boolean }>;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
};

type RegisterData = {
  name: string;
  lastname: string;
  email: string;
  password: string;
  role?: 'patient' | 'student';
  rut?: string;
  birthDate?: string;
  gender?: string;
  location?: string;
  fullName?: string;
  university?: string;
  careerYear?: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const PATIENT_ONBOARDING_KEY = 'aldiente_patient_onboarding_completed';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadFromStorage = useCallback(() => {
    try {
      const token = localStorage.getItem('authToken');
      const stored = localStorage.getItem('authUser');
      if (token && stored) {
        setUser(JSON.parse(stored));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFromStorage();
    const onChanged = () => loadFromStorage();
    window.addEventListener('auth:changed', onChanged);
    return () => window.removeEventListener('auth:changed', onChanged);
  }, [loadFromStorage]);

  useEffect(() => {
    if (!user?.id || !user?.role || user.role === 'admin') return;

    const token = localStorage.getItem('authToken');
    if (!token) return;

    let cancelled = false;
    const endpoint = user.role === 'student' ? '/api/students/profile' : '/api/patients/profile';

    api.get(endpoint)
      .then(({ data }) => {
        if (cancelled) return;
        const raw = data?.profile ?? data ?? {};
        const profileName = [raw?.name, raw?.full_name, raw?.fullName]
          .find((value: unknown) => typeof value === 'string' && value.trim().length > 0) as string | undefined;
        if (profileName && !isLikelyMockName(profileName) && profileName !== user.name) {
          setUser(prev => {
            if (!prev) return prev;
            const updated = { ...prev, name: profileName };
            localStorage.setItem('authUser', JSON.stringify(updated));
            return updated;
          });
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [user?.id, user?.role, user?.name]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/login', { email, password });
      const token = data.token || data.accessToken || data.jwt;
      if (!token) throw new Error('No se recibio token');
      localStorage.setItem('authToken', token);
      document.cookie = `authToken=${token}; path=/; SameSite=Lax`;
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);

      const u: User = {
        id: String(data?.user?.id ?? data?.userId ?? data?.id ?? ''),
        email: data?.user?.email ?? data?.email ?? email,
        role: data?.user?.role ?? data?.role,
        name: data?.user?.name ?? data?.user?.fullName ?? data?.user?.full_name ?? data?.name ?? data?.fullName ?? data?.full_name,
      };
      localStorage.setItem('authUser', JSON.stringify(u));
      if (u.role) document.cookie = `authRole=${u.role}; path=/; SameSite=Lax`;
      if (u.role === 'patient') {
        localStorage.setItem(`${PATIENT_ONBOARDING_KEY}:${u.id || u.email}`, 'true');
      }
      setUser(u);
      window.dispatchEvent(new Event('auth:changed'));
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (registerData: RegisterData) => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/register', {
        email: registerData.email,
        password: registerData.password,
        name: `${registerData.name} ${registerData.lastname}`.trim(),
        fullName: registerData.fullName,
        role: registerData.role ?? 'patient',
        rut: registerData.rut,
        birthDate: registerData.birthDate,
        gender: registerData.gender,
        location: registerData.location,
        university: registerData.university,
        careerYear: registerData.careerYear,
      });

      let token = data.token || data.accessToken || data.jwt;
      if (!token) {
        const loginRes = await api.post('/api/login', {
          email: registerData.email,
          password: registerData.password,
        });
        token = loginRes.data.token || loginRes.data.accessToken || loginRes.data.jwt;
        if (!token) throw new Error('No se recibio token');
        Object.assign(data, loginRes.data);
      }

      localStorage.setItem('authToken', token);
      document.cookie = `authToken=${token}; path=/; SameSite=Lax`;
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);

      const u: User = {
        id: String(data?.user?.id ?? data?.id ?? ''),
        email: data?.user?.email ?? registerData.email,
        role: data?.user?.role ?? registerData.role ?? 'patient',
        name: data?.user?.name ?? registerData.fullName ?? `${registerData.name} ${registerData.lastname}`.trim(),
      };

      localStorage.setItem('authUser', JSON.stringify(u));
      if (u.role) document.cookie = `authRole=${u.role}; path=/; SameSite=Lax`;
      setUser(u);
      window.dispatchEvent(new Event('auth:changed'));
      return { role: u.role, authenticated: Boolean(token) };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      localStorage.setItem('authUser', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authUser');
    document.cookie = 'authToken=; path=/; max-age=0';
    document.cookie = 'authRole=; path=/; max-age=0';
    setUser(null);
    window.dispatchEvent(new Event('auth:changed'));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
