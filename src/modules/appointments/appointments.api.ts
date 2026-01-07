import { api } from '../../shared/api/ApiClient';
import { Appointment, AppointmentStatus, CreateAppointmentPayload } from './types';

export interface AppointmentAttachment {
  id: string;
  appointment_id: string;
  file_url: string;
  file_name?: string;
  file_mime?: string;
  file_size?: number;
  allow_student: boolean;
  created_at: string;
}

export async function getAppointmentsForStudent(): Promise<Appointment[]> {
  const res = await api.get('/api/appointments', { params: { role: 'student' } });
  const data: any = res.data;
  return Array.isArray(data) ? (data as Appointment[]) : ((data?.appointments ?? []) as Appointment[]);
}

export async function getAppointmentsForPatient(): Promise<Appointment[]> {
  const res = await api.get('/api/appointments', { params: { role: 'patient' } });
  const data: any = res.data;
  return Array.isArray(data) ? (data as Appointment[]) : ((data?.appointments ?? []) as Appointment[]);
}

export async function getAppointmentById(appointmentId: string): Promise<Appointment> {
  const res = await api.get(`/api/appointments/${appointmentId}`);
  return res.data as Appointment;
}

export async function createAppointment(payload: CreateAppointmentPayload): Promise<Appointment> {
  const res = await api.post('/api/appointments', payload);
  return res.data as Appointment;
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus
): Promise<Appointment> {
  const res = await api.put(`/api/appointments/${appointmentId}/status`, { status });
  return res.data as Appointment;
}

export async function deleteAppointment(appointmentId: string): Promise<void> {
  await api.delete(`/api/appointments/${appointmentId}`);
}

// Actualizar campos de una cita (fecha/hora, notas, servicio)
export async function updateAppointment(
  appointmentId: string,
  payload: { scheduled_at?: string; notes?: string; student_service_id?: string }
): Promise<Appointment> {
  const res = await api.put(`/api/appointments/${appointmentId}`, payload);
  return res.data as Appointment;
}

// Adjuntos
export async function listAppointmentAttachments(appointmentId: string): Promise<AppointmentAttachment[]> {
  const res = await api.get(`/api/appointments/${appointmentId}/attachments`);
  return res.data as AppointmentAttachment[];
}

export async function addAppointmentAttachment(
  appointmentId: string,
  payload: { file_url: string; file_name?: string; file_mime?: string; file_size?: number; allow_student?: boolean }
): Promise<AppointmentAttachment> {
  const res = await api.post(`/api/appointments/${appointmentId}/attachments`, payload);
  return res.data as AppointmentAttachment;
}

export async function deleteAppointmentAttachment(
  appointmentId: string,
  attachmentId: string
): Promise<void> {
  await api.delete(`/api/appointments/${appointmentId}/attachments/${attachmentId}`);
}
