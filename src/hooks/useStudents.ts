import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

export interface StudentProfile {
  id: string;
  name: string;
  university?: string;
  year?: string;
  supervisorName?: string;
  rating?: number;
  reviewCount?: number;
  bio?: string;
  distance?: string;
  availability?: string;
  services: ServiceItem[];
  initials: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  duration?: number;
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const nested = record.services ?? record.data ?? [];
    return Array.isArray(nested) ? (nested as T[]) : [];
  }
  return [];
}

export function useStudents(serviceFilter?: string) {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    api.get('/api/student-services')
      .then(res => {
        if (!mounted) return;

        const list = asArray<Record<string, unknown>>(res.data);
        const mapped = new Map<string, StudentProfile>();

        for (const item of list) {
          const student = (item.student ?? item.studentProfile ?? {}) as Record<string, unknown>;
          const studentId = String(item.studentId ?? item.student_id ?? student.id ?? '');
          if (!studentId) continue;

          const studentName = String(
            student.name
            ?? student.full_name
            ?? student.fullName
            ?? item.studentName
            ?? item.student_name
            ?? item.student_full_name
            ?? '',
          ).trim();

          if (!mapped.has(studentId)) {
            mapped.set(studentId, {
              id: studentId,
              name: studentName,
              university: String(student.university ?? item.university ?? item.student_university ?? ''),
              year: String(student.year ?? student.career_year ?? student.careerYear ?? item.year ?? ''),
              supervisorName: String(student.supervisorName ?? student.supervisor_name ?? item.supervisorName ?? ''),
              rating: toNumber(student.rating ?? item.avg_rating ?? item.rating),
              reviewCount: toNumber(student.reviewCount ?? student.review_count ?? item.review_count ?? item.reviews),
              bio: String(student.bio ?? item.bio ?? ''),
              distance: String(item.distance ?? ''),
              availability: String(item.nextAvailability ?? item.availability ?? ''),
              services: [],
              initials: studentName ? initials(studentName) : '?',
            });
          }

          mapped.get(studentId)!.services.push({
            id: String(item.id ?? ''),
            name: String(item.serviceName ?? item.service_name ?? item.base_name ?? item.name ?? ''),
            price: Number(item.price ?? 0),
            duration: toNumber(item.duration ?? item.base_estimated_duration),
          });
        }

        setStudents(Array.from(mapped.values()).filter(student => student.name || student.services.length > 0));
        setError(null);
      })
      .catch(err => {
        if (!mounted) return;
        setStudents([]);
        setError(err?.response?.data?.message ?? err?.message ?? 'No se pudieron cargar los estudiantes.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!serviceFilter) return students;
    const needle = serviceFilter.toLowerCase();
    return students.filter(student =>
      student.services.some(service => service.name.toLowerCase().includes(needle)),
    );
  }, [serviceFilter, students]);

  return { students: filtered, loading, error };
}
