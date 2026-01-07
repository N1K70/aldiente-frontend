export interface StudentProfile {
  id: number | string;
  fullName: string | null;
  university: string | null;
  careerYear: number | null;
  location: string | null;
  certifications?: string | null;
  bio?: string | null;
}

export type UpsertStudentProfilePayload = {
  fullName?: string | null;
  university?: string | null;
  careerYear?: number | null;
  location?: string | null;
  certifications?: string | null;
  bio?: string | null;
};
