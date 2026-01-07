import { api } from '../../shared/api/ApiClient';
import { StudentProfile, UpsertStudentProfilePayload } from './types';

function mapStudentProfile(row: any): StudentProfile {
  if (!row) {
    return {
      id: '',
      fullName: null,
      university: null,
      careerYear: null,
      location: null,
      certifications: null,
      bio: null,
    };
  }
  const certs = Array.isArray(row.certifications)
    ? row.certifications.join(', ')
    : (row.certifications ?? null);
  return {
    id: row.id ?? row.user_id ?? row.student_id,
    fullName: row.fullName ?? row.full_name ?? null,
    university: row.university ?? null,
    careerYear: row.careerYear ?? row.career_year ?? null,
    location: row.location ?? null,
    certifications: certs,
    bio: row.bio ?? null,
  } as StudentProfile;
}

export async function getStudentProfile(studentId: number | string): Promise<StudentProfile> {
  const res = await api.get(`/api/students/${studentId}`);
  const data: any = res.data;
  // Backend puede devolver plano o envuelto
  const row = (data?.profile ?? data) || {};
  return mapStudentProfile(row);
}

export async function updateStudentProfile(studentId: number | string, payload: UpsertStudentProfilePayload): Promise<StudentProfile> {
  const body = normalizeUpdatePayload(payload);
  const res = await api.put(`/api/students/${studentId}`, body);
  const data: any = res.data;
  return mapStudentProfile(data?.profile ?? data);
}
 
// Helper to ensure backend receives array for certifications when user entered comma-separated text
function normalizeUpdatePayload(payload: UpsertStudentProfilePayload): any {
  const out: any = { ...payload };
  if (typeof payload.certifications === 'string') {
    const arr = payload.certifications
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (arr.length > 0) out.certifications = arr; else out.certifications = undefined;
  }
  return out;
}

// Overload with normalized sending (preserve above export for references)
export async function updateStudentProfileNormalized(studentId: number | string, payload: UpsertStudentProfilePayload): Promise<StudentProfile> {
  const body = normalizeUpdatePayload(payload);
  const res = await api.put(`/api/students/${studentId}`, body);
  const data: any = res.data;
  return mapStudentProfile(data?.profile ?? data);
}
