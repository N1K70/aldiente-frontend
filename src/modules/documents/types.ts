export interface UserDocument {
  id: string;
  user_id: string;
  role: 'patient' | 'student' | 'admin' | string;
  title: string;
  description?: string | null;
  category: string;
  file_name: string;
  file_mime?: string | null;
  file_size?: number | null;
  file_url: string; // relativo al backend, ej: /uploads/abc.pdf
  year?: number | null;
  created_at?: string;
}

export type DocumentCategoryPatient = 'receta' | 'solicitud' | 'otros';
export type DocumentCategoryStudent = 'alumno_regular' | 'plan_semestre' | 'syllabus' | 'otros';

export type UploadDocumentInput = {
  title: string;
  description?: string;
  category: string;
  file: File;
  year?: number;
};
