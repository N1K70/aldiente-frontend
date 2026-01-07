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
import { peopleOutline, starOutline, timeOutline } from 'ionicons/icons';
import { getStudentServices } from '../services/services.api';
import { StudentService } from '../services/types';
import RatingDisplay from '../ratings/RatingDisplay';

interface RouteParams { id: string }

const ProfessionalDetailPage: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<RouteParams>();
  const location = useLocation<{ professional?: any }>();
  const p = location.state?.professional as { name?: string; avatarUrl?: string; rating?: number; reviews?: number } | undefined;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<StudentService[]>([]);

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
                <h3>{title}</h3>
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
                  <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
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
