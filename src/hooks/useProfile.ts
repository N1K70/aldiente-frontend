import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

export interface Profile {
  name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  rut?: string;
  birthdate?: string;
  gender?: string;
  address?: string;
  allergies?: string;
  medications?: string;
  // student-specific
  university_id?: string | number;
  career_year?: string | number;
  university_location?: string;
  alternative_location?: string;
  certifications?: string;
  bio?: string;
  supervisor_name?: string;
  supervisor_title?: string;
}

export function useProfile(role?: 'patient' | 'student') {
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint = role === 'student' ? '/api/students/profile' : '/api/patients/profile';

  const load = useCallback(() => {
    setLoading(true);
    api.get(endpoint)
      .then(res => {
        const raw = res.data?.profile ?? res.data ?? {};
        setProfile(raw);
        setError(null);
      })
      .catch(err => setError(err?.response?.data?.message ?? err.message))
      .finally(() => setLoading(false));
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (data: Partial<Profile>) => {
    setSaving(true);
    try {
      const res = await api.put(endpoint, data);
      // Always apply what was sent; additionally merge any profile fields from the API response
      const fromApi = res.data?.profile ?? (
        res.data && typeof res.data === 'object' && !('message' in res.data) ? res.data : null
      );
      setProfile(prev => ({ ...prev, ...data, ...(fromApi ?? {}) }));
      setError(null);
      return true;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as { message?: string })?.message ?? 'Error al guardar';
      setError(msg);
      return false;
    } finally {
      setSaving(false);
    }
  }, [endpoint]);

  return { profile, loading, saving, error, save, reload: load };
}
