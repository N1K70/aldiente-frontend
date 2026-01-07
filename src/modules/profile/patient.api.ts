import { api } from '../../shared/api/ApiClient';

export type UpsertPatientProfilePayload = {
  name?: string | null;
  birthDate?: string | null; // ISO date (YYYY-MM-DD)
  gender?: string | null;
  location?: string | null;
};

export type PatientProfile = {
  id?: string | number;
  email?: string;
  name?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  location?: string | null;
};

export async function getPatientProfile(): Promise<PatientProfile> {
  const res = await api.get('/api/patients/profile');
  return res.data as PatientProfile;
}

export async function upsertPatientProfile(payload: UpsertPatientProfilePayload): Promise<PatientProfile> {
  try {
    const res = await api.put('/api/patients/profile', payload);
    const data: any = res.data;
    return data?.profile ?? (data as PatientProfile);
  } catch (e: any) {
    const status = e?.response?.status;
    if (status === 404) {
      const res = await api.post('/api/patients/profile', payload);
      const data: any = res.data;
      return data?.profile ?? (data as PatientProfile);
    }
    throw e;
  }
}
