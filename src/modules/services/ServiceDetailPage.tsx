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
import { peopleOutline, starOutline, timeOutline, locationOutline } from 'ionicons/icons';
import { motion } from 'framer-motion';
import { api } from '../../shared/api/ApiClient';
import { fadeInUp, staggerContainer, listItem, pageTransition } from '../../utils/animations';
import '../../theme/modern-design.css';

interface RouteParams { id: string }

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

const norm = (s?: string) => (s || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

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

          <h3 className="heading-md" style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
            Profesionales disponibles ({providers.length})
          </h3>

          <motion.div
            variants={staggerContainer}
            className="grid-modern"
          >
            {providers.map((p) => (
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
                      <h3 className="heading-md" style={{ margin: 0 }}>{p.name}</h3>
                      {typeof p.price === 'number' && (
                        <span className="badge-primary" style={{ fontSize: '0.875rem' }}>
                          {p.price > 0 ? `$${p.price.toFixed(0)}` : 'Gratis'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="service-card-content">
                    <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
                      <div className="meta-item-modern">
                        <IonIcon icon={starOutline} style={{ color: '#f59e0b' }} />
                        <span>{(p.rating ?? 4.5).toFixed(1)}</span>
                      </div>
                      <div className="meta-item-modern">
                        <IonIcon icon={peopleOutline} />
                        <span>{p.reviews ?? 0} reseñas</span>
                      </div>
                      <div className="meta-item-modern">
                        <IonIcon icon={timeOutline} />
                        <span>{p.waitMins ?? 45} min</span>
                      </div>
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
            ))}
          </motion.div>
        </motion.div>
      </IonContent>
    </IonPage>
  );
};

export default ServiceDetailPage;
