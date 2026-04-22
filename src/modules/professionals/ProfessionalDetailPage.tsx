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
  IonList,
  IonIcon,
  IonSpinner,
  IonText,
  IonImg,
  IonButton,
} from '@ionic/react';
import { useLocation, useParams, useHistory } from 'react-router-dom';
import { peopleOutline, starOutline, timeOutline, calendarOutline, checkmarkCircle, shieldCheckmarkOutline } from 'ionicons/icons';
import { getStudentServices, getAvailabilityForService } from '../services/services.api';
import { StudentService } from '../services/types';
import RatingDisplay from '../ratings/RatingDisplay';

interface RouteParams { id: string }

interface AvailabilityItem {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

type AvailabilityPreview = {
  label: string;
  hasAvailability: boolean;
};

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

const ProfessionalDetailPage: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<RouteParams>();
  const location = useLocation<{ professional?: any }>();
  const p = location.state?.professional as { name?: string; avatarUrl?: string; rating?: number; reviews?: number } | undefined;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<StudentService[]>([]);
  const [availabilityByService, setAvailabilityByService] = useState<Record<string, AvailabilityPreview>>({});

  const serviceNames = useMemo(() => {
    const set = new Set<string>();
    for (const s of services) {
      if (s?.service_name) set.add(s.service_name);
    }
    return Array.from(set).sort((a,b)=> a.localeCompare(b));
  }, [services]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const list = await getStudentServices(id);
        if (!mounted) return;
        setServices(list);
        setError(null);
      } catch (e: any) {
        if (!mounted) return;
        // Sin fallback a mocks: dejar vacío para pruebas sin datos
        setServices([]);
        setError(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [id]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!services.length) {
        if (mounted) setAvailabilityByService({});
        return;
      }
      const entries = await Promise.all(
        services.map(async (s) => {
          try {
            const rows = await getAvailabilityForService(s.id);
            return [s.id, buildAvailabilityPreview(rows as AvailabilityItem[])] as const;
          } catch {
            return [s.id, { label: 'Sin disponibilidad publicada', hasAvailability: false }] as const;
          }
        })
      );
      if (!mounted) return;
      setAvailabilityByService(Object.fromEntries(entries));
    })();
    return () => { mounted = false; };
  }, [services]);

  const title = useMemo(() => p?.name || `Estudiante ${id}`, [p, id]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/profesionales" />
          </IonButtons>
          <IonTitle>{title}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* Header del profesional */}
        <IonCard className="pro-header-card">
          <IonCardContent>
            <div className="pro-header">
              <div className="pro-header-avatar">
                {p?.avatarUrl ? (
                  <IonImg className="pro-header-img" src={p.avatarUrl} alt={title} />
                ) : (
                  <div className="pro-header-placeholder">
                    <IonIcon icon={peopleOutline} />
                  </div>
                )}
              </div>
              <div className="pro-header-info">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {title}
                  <IonIcon icon={checkmarkCircle} style={{ color: '#10b981', fontSize: '1.1rem' }} />
                </h3>
                <div className="pro-meta" style={{ marginBottom: '8px' }}>
                  <span className="pro-chip" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #34d399' }}>
                    Estudiante Verificado
                  </span>
                </div>
                <div className="pro-meta">
                  <span className="pro-chip">
                    <IonIcon icon={starOutline} style={{ color: '#f59e0b' }} /> {(p?.rating ?? 0).toFixed(1)}
                  </span>
                  {typeof p?.reviews === 'number' && (
                    <span className="pro-chip muted">{p.reviews} reseñas</span>
                  )}
                </div>
              </div>
            </div>

            {serviceNames.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {serviceNames.slice(0, 6).map((sn) => (
                  <div
                    key={sn}
                    className="pro-chip"
                    style={{ cursor: 'pointer' }}
                    onClick={() => history.push(`/tabs/profesionales?service=${encodeURIComponent(sn)}`)}
                  >
                    {sn}
                  </div>
                ))}
                {serviceNames.length > 6 && (
                  <div className="pro-chip muted">+{serviceNames.length - 6}</div>
                )}
              </div>
            )}
          </IonCardContent>
        </IonCard>

        {/* Banner de confianza */}
        <IonCard color="light" style={{ margin: '16px 0', border: '1px solid #cbd5e1', boxShadow: 'none' }}>
          <IonCardContent style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px' }}>
            <IonIcon icon={shieldCheckmarkOutline} style={{ color: '#0ea5e9', fontSize: '1.8rem', marginTop: '2px' }} />
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#334155' }}>Tratamientos Seguros</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
                Todos los servicios son realizados por estudiantes y <strong>supervisados por docentes odontólogos</strong> certificados.
              </p>
            </div>
          </IonCardContent>
        </IonCard>

        <IonText color="medium" style={{ display: 'block', marginTop: 8, marginBottom: 8 }}>Servicios ofrecidos</IonText>

        {loading && (
          <div className="ion-text-center" style={{ marginTop: 24 }}>
            <IonSpinner name="crescent" />
          </div>
        )}

        {error && !loading && (
          <IonCard color="light">
            <IonCardContent>
              <IonText color="danger">{error}</IonText>
            </IonCardContent>
          </IonCard>
        )}

        {!loading && !error && services.length === 0 && (
          <IonCard>
            <IonCardContent>
              <IonText>Este estudiante aún no tiene servicios publicados.</IonText>
            </IonCardContent>
          </IonCard>
        )}

        {!loading && !error && services.length > 0 && (
          <IonList lines="none">
            {services.map((s) => (
              <IonCard
                key={s.id}
                className="service-card"
                onClick={() => history.push(`/tabs/reservar/${id}/${s.id}` as string, { professional: p, service: { id: s.id, name: s.service_name, description: s.description, category: s.category, price: s.price, duration: s.duration } })}
              >
                <IonCardHeader>
                  <IonCardTitle style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span>{s.service_name}</span>
                    {typeof s.price === 'number' && (
                      <span className="price-chip">{s.price > 0 ? `$${s.price.toFixed(0)}` : 'Gratis'}</span>
                    )}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {s.description && (
                    <p style={{ marginTop: 0, marginBottom: 10, color: '#475569' }}>{s.description}</p>
                  )}
                  <div className="service-meta">
                    <div className="meta-item">
                      <IonIcon icon={timeOutline} />
                      <span>{typeof s.duration === 'number' ? `${s.duration} min` : 'N/E'}</span>
                    </div>
                  </div>

                  {/* Disponibilidad */}
                  {(() => {
                    const availability = availabilityByService[s.id];
                    return (
                      <div
                        style={{
                          marginTop: 12,
                          padding: '12px 14px',
                          borderRadius: 12,
                          background: availability?.hasAvailability ? 'var(--gradient-primary-soft, #f0fdf4)' : 'var(--bg-elevated, #f8fafc)',
                          border: availability?.hasAvailability ? '1px solid var(--color-primary-200, #bbf7d0)' : '1px solid var(--color-gray-200, #e2e8f0)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 4 }}>
                          <IonIcon icon={calendarOutline} style={{ color: availability?.hasAvailability ? 'var(--color-primary-600, #16a34a)' : 'var(--text-secondary, #64748b)' }} />
                          <span style={{ fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>Próxima disponibilidad</span>
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-secondary, #64748b)', fontSize: '0.9rem' }}>
                          {availability?.label || 'Cargando disponibilidad...'}
                        </p>
                      </div>
                    );
                  })()}

                  <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
                    <IonButton
                      className="primary-gradient-btn"
                      expand="block"
                      onClick={(e) => {
                        e.stopPropagation();
                        history.push(`/tabs/reservar/${id}/${s.id}` as string, { professional: p, service: { id: s.id, name: s.service_name, description: s.description, category: s.category, price: s.price, duration: s.duration } });
                      }}
                    >
                      Reservar
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        )}

        {/* Calificaciones del profesional */}
        <IonCard style={{ margin: '16px 0' }}>
          <IonCardHeader>
            <IonCardTitle>Calificaciones y Reseñas</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <RatingDisplay userId={id} showDetails={true} />
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default ProfessionalDetailPage;
