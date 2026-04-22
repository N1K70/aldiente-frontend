'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

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
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
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

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/login', { email, password });
      const token = data.token || data.accessToken || data.jwt;
      if (!token) throw new Error('No se recibió token');
      localStorage.setItem('authToken', token);
      document.cookie = `authToken=${token}; path=/; SameSite=Lax`;
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);

      const u: User = {
        id: String(data?.user?.id ?? data?.userId ?? data?.id ?? ''),
        email: data?.user?.email ?? data?.email ?? email,
        role: data?.user?.role ?? data?.role,
        name: data?.user?.name ?? data?.name,
      };
      localStorage.setItem('authUser', JSON.stringify(u));
      setUser(u);
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
      const token = data.token || data.accessToken || data.jwt;
      if (!token) throw new Error('No se recibió token');
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
      setUser(u);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authUser');
    document.cookie = 'authToken=; path=/; max-age=0';
    setUser(null);
    window.dispatchEvent(new Event('auth:changed'));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
