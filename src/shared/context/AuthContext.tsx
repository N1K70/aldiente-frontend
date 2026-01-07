import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/ApiClient';

export type User = {
  id: string;
  email: string;
  role?: 'student' | 'patient' | 'admin';
  name?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, roleHint?: 'student' | 'patient') => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const loadFromStorage = useCallback(() => {
    try {
      const token = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('mockUser');
      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    loadFromStorage();
    const onAuthChanged = () => loadFromStorage();
    window.addEventListener('auth:changed', onAuthChanged as EventListener);
    return () => window.removeEventListener('auth:changed', onAuthChanged as EventListener);
  }, [loadFromStorage]);

  const login = useCallback(async (email: string, password: string, roleHint?: 'student' | 'patient') => {
    setLoading(true);
    try {
      const res = await api.post('/api/login', { email, password });
      const data: any = res.data || {};
      // Soportar múltiples formatos de token
      const token = data.token || data.accessToken || data.jwt || data.jwtToken;
      if (!token) throw new Error('No se recibió token del servidor');
      localStorage.setItem('authToken', token);
      if (data.refreshToken) {
        try { localStorage.setItem('refreshToken', String(data.refreshToken)); } catch {}
      }

      // Mapear usuario de respuesta flexible
      const idCandidate = data?.user?.id ?? data?.userId ?? data?.id;
      const u: User = {
        id: String(idCandidate ?? ''),
        email: data?.user?.email ?? data?.email ?? email,
        role: data?.user?.role ?? data?.role,
        name: data?.user?.name ?? data?.name,
      };
      // Intentar resolver el rol real si no vino en el login
      let resolvedUser: User = { ...u };
      let resolvedRole: User['role'] | undefined = u.role;
      if (!resolvedRole) {
        try {
          // Si existe perfil de paciente, el rol es 'patient'
          const pr = await api.get(`/api/patients/${resolvedUser.id}`);
          const prData: any = pr?.data;
          if (prData) {
            resolvedRole = 'patient';
            resolvedUser = {
              ...resolvedUser,
              role: 'patient',
              name: prData?.name || resolvedUser.name,
            };
          }
        } catch (e: any) {
          const status = e?.response?.status;
          if (status === 404 && resolvedUser.id) {
            // No es paciente; verificar si es estudiante
            try {
              const sr = await api.get(`/api/students/${resolvedUser.id}`);
              const srData: any = sr?.data;
              if (srData) {
                resolvedRole = 'student';
                resolvedUser = {
                  ...resolvedUser,
                  role: 'student',
                  name: srData?.full_name || resolvedUser.name,
                };
              }
            } catch {}
          }
        }
      }
      // Si aún no hay rol, usar sugerencia de UI como hint
      if (!resolvedUser.role && roleHint) {
        resolvedUser.role = roleHint;
      }

      // Notificar si el rol elegido por UI difiere del rol real resuelto
      if (roleHint && resolvedUser.role && roleHint !== resolvedUser.role) {
        try {
          window.dispatchEvent(
            new CustomEvent('auth:role-mismatch', {
              detail: { expected: roleHint, actual: resolvedUser.role },
            })
          );
        } catch {}
      }

      localStorage.setItem('mockUser', JSON.stringify(resolvedUser));
      setUser(resolvedUser);
      try { window.dispatchEvent(new Event('auth:changed')); } catch {}
    } catch (err: any) {
      // Extraer mensaje útil
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
      const code = err?.code;
      const isTimeout = code === 'ECONNABORTED' || /timeout/i.test(err?.message || '');
      const isNetwork = code === 'ERR_NETWORK';
      const msg = isTimeout
        ? 'Tiempo de espera agotado. Intenta nuevamente.'
        : isNetwork
          ? 'No hay conexión con el servidor.'
          : status === 401
            ? (serverMsg || 'Credenciales inválidas')
            : (serverMsg || 'Error al iniciar sesión');
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    try { localStorage.removeItem('refreshToken'); } catch {}
    localStorage.removeItem('mockUser');
    setUser(null);
    try { window.dispatchEvent(new Event('auth:changed')); } catch {}
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
