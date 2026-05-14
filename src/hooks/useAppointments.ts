import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

export interface Appointment {
  id: string;
  date: string;
  time?: string;
  scheduledAt?: string;
  service?: string;
  serviceName?: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  student?: { id?: string; name?: string; university?: string; supervisorName?: string };
  patient?: { id?: string; name?: string };
  clinic?: { name?: string; box?: string };
  price?: number;
}

function normalize(raw: Record<string, unknown>): Appointment {
  const scheduledAt = (raw.scheduledAt ?? raw.scheduled_at ?? '') as string;
  let date = (raw.date ?? '') as string;
  let time = (raw.time ?? '') as string;
  if (!date && scheduledAt) {
    const d = new Date(scheduledAt);
    date = d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }).toUpperCase();
    time = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  const rawStudent = (raw.student ?? raw.studentProfile ?? {}) as Record<string, unknown>;
  const rawPatient = (raw.patient ?? raw.patientProfile ?? {}) as Record<string, unknown>;
  const studentName = (raw.student_name ?? raw.studentName ?? rawStudent.name ?? rawStudent.full_name ?? '') as string;
  const patientName = (raw.patient_name ?? raw.patientName ?? rawPatient.name ?? rawPatient.full_name ?? '') as string;

  return {
    id: String(raw.id ?? ''),
    date,
    time,
    scheduledAt: scheduledAt,
    service: (raw.serviceName ?? raw.service ?? raw.service_name ?? '') as string,
    serviceName: (raw.serviceName ?? raw.service_name ?? raw.service ?? '') as string,
    status: (raw.status ?? 'pending') as Appointment['status'],
    student: studentName || rawStudent.id ? {
      ...(rawStudent as Appointment['student']),
      id: String(raw.student_id ?? rawStudent.id ?? ''),
      name: studentName || undefined,
    } : undefined,
    patient: patientName || rawPatient.id ? {
      ...(rawPatient as Appointment['patient']),
      id: String(raw.patient_id ?? rawPatient.id ?? ''),
      name: patientName || undefined,
    } : undefined,
    clinic: (raw.clinic ?? undefined) as Appointment['clinic'],
    price: (raw.price ?? raw.totalPrice ?? undefined) as number | undefined,
  };
}

export function useAppointments(role?: 'patient' | 'student') {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    const params = role ? { role } : {};
    api.get('/api/appointments', { params })
      .then(res => {
        const raw = res.data;
        const list: Record<string, unknown>[] = Array.isArray(raw) ? raw : (raw?.appointments ?? raw?.data ?? []);
        setAppointments(list.map(normalize));
        setError(null);
      })
      .catch(err => setError(err?.response?.data?.message ?? err.message))
      .finally(() => setLoading(false));
  }, [role]);

  useEffect(() => { refresh(); }, [refresh]);

  const upcoming = appointments.filter(a => a.status === 'confirmed' || a.status === 'pending');
  const past = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled');
  const next = upcoming[0] ?? null;

  return { appointments, upcoming, past, next, loading, error, refresh };
}
