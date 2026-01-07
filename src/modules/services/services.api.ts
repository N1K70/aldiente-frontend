import { api } from '../../shared/api/ApiClient';
import { CreateServicePayload, StudentService, UpdateServicePayload } from './types';

export async function getStudentServices(studentId: string): Promise<StudentService[]> {
  const res = await api.get(`/api/students/${studentId}/services`);
  const data: any = res.data;
  return Array.isArray(data) ? (data as StudentService[]) : ((data?.services ?? []) as StudentService[]);
}

export async function createStudentService(studentId: string, payload: CreateServicePayload): Promise<StudentService> {
  const res = await api.post(`/api/students/${studentId}/services`, payload);
  return res.data as StudentService;
}

export async function updateStudentService(
  studentId: string,
  serviceId: string,
  payload: UpdateServicePayload
): Promise<StudentService> {
  const res = await api.put(`/api/students/${studentId}/services/${serviceId}`, payload);
  return res.data as StudentService;
}

export async function deleteStudentService(studentId: string, serviceId: string): Promise<void> {
  await api.delete(`/api/students/${studentId}/services/${serviceId}`);
}

// Service Availability API functions
export async function getAvailabilityForService(serviceId: string): Promise<any[]> {
  const res = await api.get(`/api/student-services/${serviceId}/availabilities`);
  const data: any = res.data;
  return Array.isArray(data) ? data : (data?.availabilities ?? []);
}

export async function createServiceAvailability(serviceId: string, payload: any): Promise<any> {
  const res = await api.post(`/api/student-services/${serviceId}/availabilities`, payload);
  const data: any = res.data;
  return data?.availability || data;
}

export async function updateServiceAvailability(availabilityId: string, payload: any): Promise<any> {
  const res = await api.put(`/api/service-availabilities/${availabilityId}`, payload);
  return res.data;
}

export async function deleteServiceAvailability(availabilityId: string): Promise<void> {
  await api.delete(`/api/service-availabilities/${availabilityId}`);
}

// Get all available services (for quiz)
export async function getAllAvailableServices(): Promise<any[]> {
  const res = await api.get('/api/student-services');
  const data: any = res.data;
  return Array.isArray(data) ? data : (data?.services ?? []);
}
