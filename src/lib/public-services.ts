import { api } from '@/lib/api';

export interface UniversityOption {
  id: string;
  name: string;
  shortName?: string;
  city?: string;
  distance?: number;
}

export interface PublicServiceItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  price?: number;
  duration?: number;
  studentName?: string;
  studentId?: string;
  studentUniversity?: string;
}

export interface ProviderItem {
  id: string;
  serviceId: string;
  name: string;
  university?: string;
  price?: number;
  duration?: number;
  rating?: number;
  reviews?: number;
}

export interface ServiceRecommendation {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  studentCount: number;
  avgRating: number;
  matchScore: number;
  matchReasons: string[];
}

export type QuizAnswers = {
  reason?: string;
  budget?: string;
  urgency?: string;
};

export function normalizeText(value?: string) {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function toNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function fetchUniversities(params?: { lat?: number; lng?: number }) {
  const query = params?.lat != null && params?.lng != null ? { lat: params.lat, lng: params.lng, limit: 10 } : undefined;
  const path = params?.lat != null && params?.lng != null ? '/api/universities/nearby' : '/api/universities';

  try {
    const res = await api.get(path, { params: query });
    const list = Array.isArray(res.data) ? res.data : [];
    return list.map((item: Record<string, unknown>) => ({
      id: String(item.id ?? ''),
      name: String(item.name ?? ''),
      shortName: String(item.short_name ?? item.shortName ?? ''),
      city: String(item.city ?? ''),
      distance: toNumber(item.distance),
    })) as UniversityOption[];
  } catch {
    const res = await api.get('/api/universities');
    const list = Array.isArray(res.data) ? res.data : [];
    return list.map((item: Record<string, unknown>) => ({
      id: String(item.id ?? ''),
      name: String(item.name ?? ''),
      shortName: String(item.short_name ?? item.shortName ?? ''),
      city: String(item.city ?? ''),
      distance: toNumber(item.distance),
    })) as UniversityOption[];
  }
}

function mapServiceRow(row: Record<string, unknown>): PublicServiceItem {
  return {
    id: String(row.id ?? ''),
    name: String(row.service_name ?? row.name ?? 'Servicio'),
    category: String(row.categoria_general ?? row.category ?? row.base_name ?? ''),
    description: String(row.description ?? ''),
    price: toNumber(row.price),
    duration: toNumber(row.duration ?? row.estimated_duration),
    studentName: String(row.student_full_name ?? row.student_name ?? ''),
    studentId: String(row.student_id ?? ''),
    studentUniversity: String(row.student_university ?? row.university_name ?? ''),
  };
}

export async function fetchUniversityServices(universityId: string) {
  const res = await api.get(`/api/universities/${universityId}/services`);
  const raw = res.data as { services?: Record<string, unknown>[]; data?: Record<string, unknown>[] } | Record<string, unknown>[];
  const rows = Array.isArray(raw) ? raw : (raw.services ?? raw.data ?? []);
  return rows.map(mapServiceRow);
}

export async function fetchPublicServicesByUniversityName(universityName: string) {
  const res = await api.get('/api/public/services', { params: { university: universityName } });
  const rows = Array.isArray(res.data) ? res.data : [];
  return rows.map((row: Record<string, unknown>) => ({
    id: String(row.id ?? ''),
    name: String(row.service_name ?? row.name ?? 'Servicio'),
    category: String(row.categoria_general ?? row.category ?? ''),
    description: String(row.description ?? ''),
    price: toNumber(row.price),
    duration: toNumber(row.duration ?? row.estimated_duration),
    studentName: String(row.student_name ?? row.student_full_name ?? ''),
    studentId: String(row.student_id ?? ''),
    studentUniversity: String(row.student_university ?? row.university_name ?? ''),
  })) as PublicServiceItem[];
}

export async function fetchServiceById(serviceId: string) {
  const res = await api.get(`/api/services/${serviceId}`);
  const row = Array.isArray(res.data) ? res.data[0] : res.data;
  return row ? mapServiceRow(row as Record<string, unknown>) : null;
}

export async function fetchAllStudentServices() {
  const res = await api.get('/api/student-services');
  const raw = res.data as { services?: Record<string, unknown>[]; data?: Record<string, unknown>[] } | Record<string, unknown>[];
  return Array.isArray(raw) ? raw : (raw.services ?? raw.data ?? []);
}

export async function fetchAllServices(): Promise<PublicServiceItem[]> {
  const rows = await fetchAllStudentServices();
  return (rows as Record<string, unknown>[]).map(mapServiceRow);
}

export async function fetchProvidersForServiceName(serviceName: string) {
  const rows = await fetchAllStudentServices();
  const target = normalizeText(serviceName);
  const seen = new Set<string>();
  const providers: ProviderItem[] = [];

  for (const row of rows) {
    const name = normalizeText(String(row.base_name ?? row.service_name ?? row.name ?? ''));
    if (name !== target) continue;

    const studentId = String(row.student_id ?? row.studentId ?? '');
    if (!studentId || seen.has(studentId)) continue;
    seen.add(studentId);

    providers.push({
      id: studentId,
      serviceId: String(row.id ?? ''),
      name: String(row.student_full_name ?? row.student_name ?? row.student_email ?? `Estudiante ${studentId}`),
      university: String(row.student_university ?? row.university ?? ''),
      price: toNumber(row.price),
      duration: toNumber(row.duration ?? row.base_estimated_duration),
      rating: toNumber(row.avg_rating ?? row.rating),
      reviews: toNumber(row.review_count ?? row.reviews),
    });
  }

  return providers;
}

export function filterHookServices(services: PublicServiceItem[], hookKey: string) {
  return services.filter(service => {
    const value = normalizeText(`${service.name} ${service.description ?? ''}`);
    if (hookKey === 'limpieza') return value.includes('limpieza') || value.includes('profilaxis') || value.includes('destartraje');
    if (hookKey === 'revision') return value.includes('revision') || value.includes('control') || value.includes('diagnostico') || value.includes('examen') || value.includes('ingreso');
    if (hookKey === 'urgencia') return value.includes('urgencia') || value.includes('emergencia') || value.includes('dolor') || value.includes('extraccion');
    return true;
  });
}

function aggregateServices(rows: Record<string, unknown>[]) {
  const grouped = new Map<string, ServiceRecommendation>();

  for (const row of rows) {
    const name = String(row.base_name ?? row.service_name ?? row.name ?? 'Servicio').trim();
    const key = normalizeText(name);
    const price = toNumber(row.price) ?? 0;
    const duration = toNumber(row.duration ?? row.base_estimated_duration) ?? 30;
    const rating = toNumber(row.avg_rating ?? row.rating) ?? 4;
    const description = String(row.description ?? '');

    if (!grouped.has(key)) {
      grouped.set(key, {
        id: String(row.service_id ?? row.base_service_id ?? row.id ?? key),
        name,
        description,
        price,
        duration,
        studentCount: 0,
        avgRating: rating,
        matchScore: 0,
        matchReasons: [],
      });
    }

    const current = grouped.get(key)!;
    current.studentCount += 1;
    current.price = current.price === 0 ? price : Math.min(current.price, price || current.price);
    current.duration = current.duration || duration;
    current.avgRating = Number(((current.avgRating + rating) / 2).toFixed(1));
    if (!current.description && description) current.description = description;
  }

  return Array.from(grouped.values());
}

function getReasonKeywords(reason: string) {
  const keywordMap: Record<string, string[]> = {
    pain: ['dolor', 'extraccion', 'endodoncia', 'emergencia', 'urgencia'],
    checkup: ['limpieza', 'revision', 'diagnostico', 'control', 'chequeo'],
    aesthetic: ['blanqueamiento', 'ortodoncia', 'estetica', 'carillas', 'sonrisa'],
    prevention: ['limpieza', 'fluorizacion', 'sellantes', 'profilaxis', 'prevencion'],
  };
  return keywordMap[reason] ?? [];
}

function getReasonLabel(reason: string) {
  const labelMap: Record<string, string> = {
    pain: 'Ideal para dolor o molestias',
    checkup: 'Perfecto para chequeo general',
    aesthetic: 'Mejora tu sonrisa',
    prevention: 'Cuidado preventivo',
  };
  return labelMap[reason] ?? 'Recomendado para ti';
}

function checkBudgetMatch(budget: string, price: number) {
  const ranges: Record<string, [number, number]> = {
    low: [0, 20000],
    medium: [20001, 50000],
    high: [50001, Number.POSITIVE_INFINITY],
    flexible: [0, Number.POSITIVE_INFINITY],
  };

  const [min, max] = ranges[budget] ?? [0, Number.POSITIVE_INFINITY];
  const matches = price >= min && price <= max;
  return { matches, reason: matches ? 'Dentro de tu presupuesto' : '' };
}

function calculateMatch(service: ServiceRecommendation, answers: QuizAnswers) {
  let score = 0;
  const reasons: string[] = [];

  const reason = answers.reason;
  if (reason) {
    const keywords = getReasonKeywords(reason);
    const corpus = normalizeText(`${service.name} ${service.description}`);
    const matched = keywords.some(keyword => corpus.includes(keyword));
    if (matched) {
      score += 40;
      reasons.push(getReasonLabel(reason));
    } else {
      score += 10;
    }
  }

  const budget = answers.budget;
  if (budget) {
    const budgetMatch = checkBudgetMatch(budget, service.price);
    if (budgetMatch.matches) {
      score += 30;
      reasons.push(budgetMatch.reason);
    } else {
      score += 10;
    }
  }

  const urgency = answers.urgency;
  if (urgency === 'urgent') {
    if (service.studentCount > 1) {
      score += 15;
      reasons.push('Mas de un estudiante disponible');
    } else {
      score += 5;
    }
  } else {
    score += 10;
  }

  if (service.avgRating >= 4.5) {
    score += 15;
    reasons.push('Excelente calificacion');
  } else if (service.avgRating >= 4) {
    score += 10;
  } else {
    score += 5;
  }

  return { score: Math.min(score, 100), reasons };
}

export async function recommendServices(answers: QuizAnswers) {
  const rows = await fetchAllStudentServices();
  const services = aggregateServices(rows);
  return services
    .map(service => {
      const match = calculateMatch(service, answers);
      return { ...service, matchScore: match.score, matchReasons: match.reasons };
    })
    .sort((left, right) => right.matchScore - left.matchScore)
    .slice(0, 6);
}

