export interface StudentService {
  id: string; // UUID
  student_id: string; // UUID
  service_id?: string; // UUID del servicio base
  service_name: string;
  description: string;
  category: string;
  price?: number | string | null;
  duration?: number | string | null;
  availability?: string | null;
  student_name?: string | null;
  student_university?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateServicePayload {
  service_id?: string; // requerido por backend al crear
  serviceName: string;
  description: string;
  category: string;
  price?: number | string;
  duration?: number | string;
  availability?: string;
  studentName?: string;
  studentUniversity?: string;
}

export type UpdateServicePayload = Partial<CreateServicePayload>;
