import React, { useEffect, useMemo, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonIcon,
  IonButton,
  IonText,
} from '@ionic/react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { peopleOutline, starOutline, timeOutline, locationOutline, calendarOutline, shieldCheckmarkOutline, checkmarkCircle, flashOutline } from 'ionicons/icons';
import { motion } from 'framer-motion';
import { api } from '../../shared/api/ApiClient';
import { getAvailabilityForService } from './services.api';
import { getUserRatingStats } from '../ratings/ratings.api';
import { fadeInUp, staggerContainer, listItem, pageTransition } from '../../utils/animations';
import '../../theme/modern-design.css';

interface RouteParams { id: string }

interface AvailabilityItem {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface ServiceSummary {
  id: string;
  name: string;
  category?: string;
  description?: string;
}

interface ProviderItem {
  id: string; // student_id
  serviceId: string; // id del student_services
  name: string;
  avatarUrl?: string;
  rating?: number;
  reviews?: number;
  waitMins?: number; // tiempo estimado de espera o duración
  price?: number | null;
}

type AvailabilityPreview = {
  label: string;
  hasAvailability: boolean;
};

const norm = (s?: string) => (s || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const weekdayLabels = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const buildAvailabilityPreview = (rows: AvailabilityItem[]): AvailabilityPreview => {
  if (!rows.length) {
    return { label: 'Sin disponibilidad publicada', hasAvailability: false };
  }

  const sorted = rows
    .filter((row) => typeof row.day_of_week === 'number' && !!row.start_time)
    .slice()
    .sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
      return String(a.start_time).localeCompare(String(b.start_time));
    });

  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let best: AvailabilityItem | null = null;
  let bestDelta = Number.POSITIVE_INFINITY;

  for (const row of sorted) {
    const start = String(row.start_time).slice(0, 5);
    const [hours, minutes] = start.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) continue;

    let dayDelta = row.day_of_week - currentDay;
    const startMinutes = hours * 60 + minutes;

    if (dayDelta < 0 || (dayDelta === 0 && startMinutes < currentMinutes)) {
      dayDelta += 7;
    }

    if (dayDelta < bestDelta || (dayDelta === bestDelta && best && start < String(best.start_time).slice(0, 5))) {
      best = row;
      bestDelta = dayDelta;
    }
  }

  if (!best) {
    const fallback = sorted[0];
    return {
      label: `${weekdayLabels[fallback.day_of_week] || 'Próximo día'} • ${String(fallback.start_time).slice(0, 5)} h`,
      hasAvailability: true,
    };
  }

  const dayLabel = bestDelta === 0 ? 'Hoy' : bestDelta === 1 ? 'Mañana' : weekdayLabels[best.day_of_week] || 'Próximo día';
  return {
    label: `${dayLabel} • ${String(best.start_time).slice(0, 5)} h`,
    hasAvailability: true,
  };
};

const ServiceDetailPage: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<RouteParams>();
  const location = useLocation<{ service?: ServiceSummary }>();
  const s = location.state?.service as ServiceSummary | undefined;

  // Detalle real del servicio seleccionado
  const [service, setService] = useState<ServiceSummary | undefined>(s);

  // Proveedores reales filtrados por tokens del nombre/categoría
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [availabilityByService, setAvailabilityByService] = useState<Record<string, AvailabilityPreview>>({});
  const [ratingByStudent, setRatingByStudent] = useState<Record<string, { avg: number; total: number }>>({});

  // Cargar el servicio por ID si no vino en el estado de navegación
  useEffect(() => {
    let mounted = true;
    if (service?.id === id && service?.name) return; // ya tenemos el servicio
    (async () => {
      try {
        const res = await api.get(`/api/services/${id}`);
        const row = Array.isArray(res.data) ? res.data[0] : res.data;
        if (row && mounted) {
          setService({
            id: String(row.id),
            name: row.name || 'Servicio',
            category: undefined,
            description: row.description || undefined,
          });
        }
      } catch (e) {
        // Si falla, mantener cualquier info pasada por state como fallback mínimo
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // Consumir catálogo de ofertas reales de student_services y filtrar por nombre base
        const res = await api.get('/api/student-services');
        const raw: any = res.data;
        const rows: any[] = Array.isArray(raw) ? raw : (raw?.data || raw?.items || []);
        const targetName = norm(service?.name);
        const filtered = rows.filter((r) => norm(r?.base_name || r?.name) === targetName);
        const seen = new Set<string>();
        const mapped: ProviderItem[] = [];
        for (const r of filtered) {
          const sid = String(r.student_id);
          if (seen.has(sid)) continue;
          seen.add(sid);
          mapped.push({
            id: String(r.student_id),
            serviceId: String(r.id),
            name: r.student_full_name || r.student_name || r.student_email || `Estudiante #${r.student_id}`,
            avatarUrl: undefined,
            rating: undefined,
            reviews: undefined,
            waitMins: typeof r.duration === 'number' ? r.duration : (typeof r.base_estimated_duration === 'number' ? r.base_estimated_duration : undefined),
            price: typeof r.price === 'number' ? r.price : (r?.price ? Number(r.price) : null),
          });
        }
        if (mounted) setProviders(mapped);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.response?.data?.message || 'No se pudieron cargar los proveedores');
        setProviders([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [service?.name]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!providers.length) {
        if (mounted) setAvailabilityByService({});
        return;
      }

      const entries = await Promise.all(
        providers.map(async (provider) => {
          try {
            const rows = await getAvailabilityForService(provider.serviceId);
            return [provider.serviceId, buildAvailabilityPreview(rows as AvailabilityItem[])] as const;
          } catch {
            return [provider.serviceId, { label: 'Sin disponibilidad publicada', hasAvailability: false }] as const;
          }
        })
      );

      if (!mounted) return;
      setAvailabilityByService(Object.fromEntries(entries));
    })();

    return () => { mounted = false; };
  }, [providers]);

  // Cargar ratings reales por estudiante para mostrar señales de confianza
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!providers.length) {
        if (mounted) setRatingByStudent({});
        return;
      }
      const uniqueIds: string[] = Array.from(new Set(providers.map((p) => p.id)));
      const entries = await Promise.all(
        uniqueIds.map(async (sid: string) => {
          try {
            const stats = await getUserRatingStats(sid);
            const avg = Number((stats as any)?.average ?? (stats as any)?.avg ?? 0) || 0;
            const total = Number((stats as any)?.total ?? (stats as any)?.count ?? 0) || 0;
            return [sid, { avg, total }] as const;
          } catch {
            return [sid, { avg: 0, total: 0 }] as const;
          }
        })
      );
      if (!mounted) return;
      setRatingByStudent(Object.fromEntries(entries));
    })();
    return () => { mounted = false; };
  }, [providers]);

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': 'var(--bg-primary)' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/servicios" />
          </IonButtons>
          <IonTitle className="heading-md">{service ? service.name : 'Servicio'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ '--background': 'var(--bg-secondary)' }}>
        <motion.div
          variants={pageTransition}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ padding: 'var(--space-6)' }}
        >
          {!service && (
            <div className="floating-card">
              <div className="skeleton" style={{ height: 100 }} />
            </div>
          )}
          
          {service && (
            <motion.div variants={fadeInUp}>
              <div className="floating-card" style={{ marginBottom: 'var(--space-6)' }}>
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <h2 className="heading-lg" style={{ marginBottom: 'var(--space-3)' }}>
                    {service.name}
                  </h2>
                  <p className="body-md" style={{ color: 'var(--text-secondary)' }}>
                    {service?.description || 'Selecciona un profesional para este servicio.'}
                  </p>
                </div>
                <button
                  className="btn-modern-secondary"
                  style={{ width: '100%' }}
                  onClick={() => history.push(`/tabs/profesionales?service=${encodeURIComponent(service?.name || '')}`)}
                >
                  Ver todos los profesionales
                </button>
              </div>
            </motion.div>
          )}

          <motion.div variants={fadeInUp}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-4)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                marginBottom: 'var(--space-6)'
              }}
            >
              <div
                style={{
                  background: 'var(--color-primary-100)',
                  color: 'var(--color-primary-600)',
                  padding: '10px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <IonIcon icon={shieldCheckmarkOutline} style={{ fontSize: '1.5rem' }} />
              </div>
              <div>
                <h4 className="body-md" style={{ fontWeight: 600, margin: '0 0 2px 0', color: 'var(--text-primary)' }}>Tratamientos Seguros</h4>
                <p className="body-sm" style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  Todo servicio es realizado por estudiantes y <strong>supervisado por docentes</strong>.
                </p>
              </div>
            </div>
          </motion.div>

          <h3 className="heading-md" style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
            Profesionales disponibles ({providers.length})
          </h3>

          <motion.div
            variants={staggerContainer}
            className="grid-modern"
          >
            {providers.map((p) => {
              const availability = availabilityByService[p.serviceId];
              const rating = ratingByStudent[p.id];
              const hasRating = !!rating && rating.total > 0;
              const isTopRated = hasRating && rating.avg >= 4.5;
              return (
              <motion.div key={p.id} variants={listItem}>
                <div 
                  className="service-card-modern hover-lift" 
                  onClick={() => history.push(`/tabs/reservar/${p.id}/${p.serviceId}`, { professional: p, service })}
                >
                  <div className="service-card-header">
                    <div style={{ 
                      width: '100%', 
                      height: 120, 
                      background: 'var(--gradient-primary-soft)', 
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 'var(--space-4)'
                    }}>
                      {p.avatarUrl ? (
                        <IonImg src={p.avatarUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                      ) : (
                        <IonIcon icon={peopleOutline} style={{ fontSize: 48, color: 'var(--color-primary-600)' }} />
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                      <h3 className="heading-md" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {p.name}
                        <IonIcon icon={checkmarkCircle} style={{ color: '#10b981', fontSize: '1.05rem' }} />
                      </h3>
                      {typeof p.price === 'number' && (
                        <span className="badge-primary" style={{ fontSize: '0.875rem' }}>
                          {p.price > 0 ? `$${p.price.toFixed(0)}` : 'Gratis'}
                        </span>
                      )}
                    </div>

                    {/* Señales de confianza */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
                      <span
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '4px 8px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                          background: '#ecfdf5', color: '#059669', border: '1px solid #34d399'
                        }}
                      >
                        <IonIcon icon={shieldCheckmarkOutline} /> Verificado
                      </span>
                      {isTopRated && (
                        <span
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '4px 8px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                            background: '#fff7ed', color: '#b45309', border: '1px solid #fdba74'
                          }}
                        >
                          <IonIcon icon={starOutline} /> Alta calificación
                        </span>
                      )}
                      {availability?.hasAvailability && (
                        <span
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '4px 8px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                            background: '#eff6ff', color: '#1d4ed8', border: '1px solid #93c5fd'
                          }}
                        >
                          <IonIcon icon={flashOutline} /> Disponible pronto
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="service-card-content">
                    <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
                      <div className="meta-item-modern">
                        <IonIcon icon={starOutline} style={{ color: '#f59e0b' }} />
                        <span>{hasRating ? rating!.avg.toFixed(1) : 'Nuevo'}</span>
                      </div>
                      <div className="meta-item-modern">
                        <IonIcon icon={peopleOutline} />
                        <span>{hasRating ? `${rating!.total} reseñas` : 'Sin reseñas aún'}</span>
                      </div>
                      <div className="meta-item-modern">
                        <IonIcon icon={timeOutline} />
                        <span>{p.waitMins ?? 45} min</span>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: 12,
                        background: availability?.hasAvailability ? 'var(--gradient-primary-soft)' : 'var(--bg-elevated)',
                        border: availability?.hasAvailability ? '1px solid var(--color-primary-200)' : '1px solid var(--color-gray-200)',
                        marginBottom: 'var(--space-4)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 4 }}>
                        <IonIcon icon={calendarOutline} style={{ color: availability?.hasAvailability ? 'var(--color-primary-600)' : 'var(--text-secondary)' }} />
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Próxima disponibilidad</span>
                      </div>
                      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                        {availability?.label || 'Cargando disponibilidad...'}
                      </p>
                    </div>
                  </div>

                  <div className="service-card-footer">
                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                      <button
                        className="btn-modern-primary"
                        style={{ flex: 1 }}
                        onClick={(e) => { e.stopPropagation(); history.push(`/tabs/reservar/${p.id}/${p.serviceId}`, { professional: p, service }); }}
                      >
                        Reservar
                      </button>
                      <button
                        className="btn-modern-ghost"
                        onClick={(e) => { e.stopPropagation(); history.push(`/tabs/profesionales/${p.id}`, { professional: p }); }}
                      >
                        Perfil
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </IonContent>
    </IonPage>
  );
};

export default ServiceDetailPage;
