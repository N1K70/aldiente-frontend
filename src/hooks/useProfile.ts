import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { reportFrontendError } from '@/lib/frontend-observability';

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

  const normalizedName = getString(data.full_name ?? data.name);
  if (normalizedName != null) {
    payload.name = normalizedName;
    payload.full_name = normalizedName;
    payload.fullName = normalizedName;
  }

  const normalizedBirthdate = data.birthdate;
  if (normalizedBirthdate != null) {
    payload.birthdate = normalizedBirthdate;
    payload.birth_date = normalizedBirthdate;
    payload.birthDate = normalizedBirthdate;
  }

  const normalizedAddress = getString(data.address ?? data.university_location);
  if (normalizedAddress != null) {
    payload.address = normalizedAddress;
    payload.location = normalizedAddress;
    payload.university_location = normalizedAddress;
  }

  const normalizedYear = getString(data.career_year);
  if (normalizedYear != null) {
    payload.career_year = normalizedYear;
    payload.year = normalizedYear;
    payload.careerYear = normalizedYear;
  }

  const normalizedUniversity = getString(data.university_id);
  if (normalizedUniversity != null) {
    payload.university_id = normalizedUniversity;
    payload.university = normalizedUniversity;
  }

  return payload;
}

function normalizeProfileResponse(raw: Record<string, unknown>): Profile {
  const normalized: Profile = { ...(raw as Profile) };

  normalized.birthdate = (raw.birthdate ?? raw.birth_date ?? '') as string;
  normalized.full_name = (raw.full_name ?? raw.fullName ?? raw.name ?? '') as string;
  normalized.name = (raw.name ?? raw.full_name ?? raw.fullName ?? '') as string;
  normalized.career_year = (raw.career_year ?? raw.careerYear ?? raw.year ?? '') as string;
  normalized.university_id = (raw.university_id ?? raw.university ?? '') as string;
  normalized.university_location = (raw.university_location ?? raw.location ?? '') as string;
  normalized.alternative_location = (raw.alternative_location ?? '') as string;
  normalized.address = (raw.address ?? raw.location ?? '') as string;

  return normalized;
}

export function useProfile(role?: 'patient' | 'student') {
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { updateUser } = useAuth();

  const endpoint = role === 'student' ? '/api/students/profile' : '/api/patients/profile';

  const load = useCallback(() => {
    setLoading(true);
    api.get(endpoint)
      .then(res => {
        const raw = res.data?.profile ?? res.data ?? {};
        const normalized = normalizeProfileResponse(raw);
        setProfile(normalized);
        setError(null);
        setLoaded(true);
        // Sync name to AuthContext so greeting shows correct name
        const name = normalized.name ?? normalized.full_name;
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
      // Optimistic update so UI reflects persisted changes even if reload fails.
      setProfile(prev => ({ ...prev, ...data }));
      const optimisticName = (data.name ?? data.full_name ?? '').trim();
      if (optimisticName) updateUser({ name: optimisticName });
      try {
        const res = await api.get(endpoint);
        const raw = res.data?.profile ?? res.data ?? {};
        const normalized = normalizeProfileResponse(raw);
        setProfile(normalized);
        setLoaded(true);
        const name = normalized.name ?? normalized.full_name;
        if (name) updateUser({ name });
      } catch (reloadErr: unknown) {
        reportFrontendError({
          module: 'profile',
          action: 'reloadAfterSave',
          severity: 'warning',
          message: 'Perfil guardado, pero fallo la recarga posterior',
          details: {
            endpoint,
            status: (reloadErr as { response?: { status?: number } })?.response?.status ?? null,
          },
        });
      }
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

  return { profile, loading, saving, loaded, error, save, reload: load };
}
