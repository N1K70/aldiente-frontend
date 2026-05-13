import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

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

function normalizeProfilePayload(data: Partial<Profile>): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...data };
  const getString = (value: unknown) => (typeof value === 'string' ? value.trim() : value);

  if (data.full_name != null) payload.name = getString(data.full_name);
  if (data.name != null) payload.full_name = getString(data.name);
  if (data.birthdate != null) payload.birth_date = data.birthdate;
  if (data.career_year != null) payload.year = data.career_year;
  if (data.university_id != null) payload.university = data.university_id;

  return payload;
}

export function useProfile(role?: 'patient' | 'student') {
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateUser } = useAuth();

  const endpoint = role === 'student' ? '/api/students/profile' : '/api/patients/profile';

  const load = useCallback(() => {
    setLoading(true);
    api.get(endpoint)
      .then(res => {
        const raw = res.data?.profile ?? res.data ?? {};
        setProfile(raw);
        setError(null);
        // Sync name to AuthContext so greeting shows correct name
        const name = raw.name ?? raw.full_name ?? raw.fullName;
        if (name) updateUser({ name });
      })
      .catch(err => setError(err?.response?.data?.message ?? err.message))
      .finally(() => setLoading(false));
  }, [endpoint, updateUser]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (data: Partial<Profile>) => {
    setSaving(true);
    try {
      const payload = normalizeProfilePayload(data);
      await api.put(endpoint, payload);
      await api.get(endpoint).then(res => {
        const raw = res.data?.profile ?? res.data ?? {};
        setProfile(raw);
        const name = raw.name ?? raw.full_name ?? raw.fullName;
        if (name) updateUser({ name });
      });
      setError(null);
      return true;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as { message?: string })?.message ?? 'Error al guardar';
      setError(msg);
      return false;
    } finally {
      setSaving(false);
    }
  }, [endpoint, updateUser]);

  return { profile, loading, saving, error, save, reload: load };
}
