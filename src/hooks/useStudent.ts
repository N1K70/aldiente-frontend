import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface StudentDetail {
  id: string;
  name: string;
  university?: string;
  year?: string;
  supervisorName?: string;
  supervisorTitle?: string;
  rating?: number;
  reviewCount?: number;
  bio?: string;
  patientCount?: number;
  attendanceRate?: number;
  yearsOnPlatform?: number;
  services: { id: string; name: string; price: number; duration?: number }[];
  reviews: { name: string; rating: number; text: string; date: string }[];
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const nested = record.services ?? record.ratings ?? record.reviews ?? record.data ?? [];
    return Array.isArray(nested) ? (nested as T[]) : [];
  }
  return [];
}

function normalizeServices(value: unknown) {
  return asArray<Record<string, unknown>>(value)
    .map(service => ({
      id: String(service.id ?? ''),
      name: String(service.serviceName ?? service.service_name ?? service.base_name ?? service.name ?? ''),
      price: Number(service.price ?? 0),
      duration: toNumber(service.duration ?? service.base_estimated_duration),
    }))
    .filter(service => service.id || service.name);
}

function normalizeReviews(value: unknown) {
  return asArray<Record<string, unknown>>(value).map(review => ({
    name: String(review.patientName ?? review.patient_name ?? review.name ?? 'Paciente'),
    rating: Number(review.score ?? review.rating ?? 5),
    text: String(review.comment ?? review.text ?? ''),
    date: String(review.createdAt ?? review.created_at ?? review.date ?? ''),
  }));
}

function buildStudentDetail(params: {
  id: string;
  profile: Record<string, unknown>;
  services: Record<string, unknown>[];
  reviews: Record<string, unknown>[];
  stats: Record<string, unknown>;
}) {
  const { id, profile, services, reviews, stats } = params;
  const normalizedServices = normalizeServices(profile.services ?? profile.studentServices ?? services);
  const normalizedReviews = normalizeReviews(profile.ratings ?? profile.reviews ?? reviews);

  const fallbackName = String(
    services[0]?.student_full_name
    ?? services[0]?.student_name
    ?? profile.full_name
    ?? '',
  ).trim();

  return {
    id,
    name: String(profile.name ?? profile.fullName ?? profile.full_name ?? fallbackName).trim(),
    university: String(profile.university ?? profile.institution ?? services[0]?.student_university ?? ''),
    year: String(profile.year ?? profile.academicYear ?? profile.careerYear ?? profile.career_year ?? ''),
    supervisorName: String(profile.supervisorName ?? profile.supervisor_name ?? ''),
    supervisorTitle: String(profile.supervisorTitle ?? profile.supervisor_title ?? ''),
    rating: toNumber(profile.rating ?? profile.averageRating ?? stats.average_rating),
    reviewCount: toNumber(profile.reviewCount ?? profile.review_count ?? stats.total_ratings ?? normalizedReviews.length),
    bio: String(profile.bio ?? profile.description ?? ''),
    patientCount: toNumber(profile.patientCount ?? profile.patient_count),
    attendanceRate: toNumber(profile.attendanceRate ?? profile.attendance_rate),
    yearsOnPlatform: toNumber(profile.yearsOnPlatform ?? profile.years_on_platform),
    services: normalizedServices,
    reviews: normalizedReviews,
  } as StudentDetail;
}

export function useStudent(id: string | null) {
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setStudent(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    Promise.all([
      api.get(`/api/students/${id}`).catch(() => ({ data: {} })),
      api.get(`/api/students/${id}/services`).catch(() => ({ data: [] })),
      api.get(`/api/users/${id}/rating-average`).catch(() => ({ data: {} })),
      api.get(`/api/users/${id}/ratings`).catch(() => ({ data: [] })),
    ])
      .then(([profileRes, servicesRes, statsRes, reviewsRes]) => {
        if (!mounted) return;

        const profile = (profileRes.data?.student ?? profileRes.data?.profile ?? profileRes.data ?? {}) as Record<string, unknown>;
        const services = asArray<Record<string, unknown>>(servicesRes.data);
        const reviews = asArray<Record<string, unknown>>(reviewsRes.data);
        const stats = (statsRes.data ?? {}) as Record<string, unknown>;

        const detail = buildStudentDetail({
          id,
          profile,
          services,
          reviews,
          stats,
        });

        const hasContent = detail.name || detail.university || detail.services.length > 0 || detail.reviews.length > 0;
        setStudent(hasContent ? detail : null);
      })
      .catch(() => {
        if (mounted) setStudent(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  return { student, loading };
}
