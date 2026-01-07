export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string; // UUID
  patient_id: string; // UUID
  student_id: string; // UUID
  student_service_id: string; // UUID (student_services.id)
  scheduled_at: string; // ISO datetime
  status: AppointmentStatus;
  notes?: string | null;
  // Joined/derived fields that backend may include
  service_name?: string | null;
  student_name?: string | null;
  patient_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAppointmentPayload {
  patient_id: string; // UUID
  student_service_id: string; // UUID (student_services.id)
  scheduled_at: string; // ISO datetime
  notes?: string | null;
}
