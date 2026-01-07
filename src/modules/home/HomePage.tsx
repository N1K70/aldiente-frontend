import React, { useMemo, useState, useCallback } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonText,
  IonButtons,
  IonToast,
  IonAlert,
} from '@ionic/react';
import {
  addOutline,
  timeOutline,
  peopleOutline,
  starOutline,
  briefcaseOutline,
  chatbubblesOutline,
  sparklesOutline,
  alertCircleOutline,
  searchOutline,
  calendarOutline,
  createOutline,
  trashOutline,
  pricetagOutline,
} from 'ionicons/icons';
import { motion } from 'framer-motion';
import { useAuth } from '../../shared/context/AuthContext';
import { useHistory } from 'react-router-dom';
import { useEffect } from 'react';
import { api } from '../../shared/api/ApiClient';
import NotificationCenter from '../notifications/NotificationCenter';
import { fadeInUp, staggerContainer, listItem, pageTransition } from '../../utils/animations';
import { useDebounce } from '../../shared/hooks/useDebounce';
import { getStudentServices, deleteStudentService } from '../services/services.api';
import ServiceFormModal from '../services/ServiceFormModal';
import PatientOnboarding, { usePatientOnboarding, University } from '../onboarding/PatientOnboarding';
import '../../theme/modern-design.css';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  const studentId = useMemo(() => user?.id ?? localStorage.getItem('userId') ?? '', [user]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editInitial, setEditInitial] = useState<any | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Onboarding para pacientes
  const { 
    needsOnboarding, 
    selectedUniversity, 
    completeOnboarding 
  } = usePatientOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Mostrar onboarding si es paciente y no lo ha completado
  useEffect(() => {
    if (user?.role === 'patient' && needsOnboarding) {
      setShowOnboarding(true);
    }
  }, [user?.role, needsOnboarding]);

  const handleOnboardingComplete = useCallback((university: University) => {
    completeOnboarding(university);
    setShowOnboarding(false);
    setToastMsg(`¡Bienvenido! Ahora verás servicios de ${university.short_name || university.name}`);
    setToastOpen(true);
  }, [completeOnboarding]);
  const [reloadKey, setReloadKey] = useState(0);

  const displayName = useMemo(() => {
    if (user?.name && user.name.trim().length) return user.name.split(' ')[0];
    return 'bienvenido';
  }, [user]);

  const onSearch = () => {
    // Búsqueda en la lista local (sin navegación) para todos los roles.
  };

  // Lista pública de servicios (placeholder por ahora)
  type PublicServiceItem = {
    id: string;
    name: string;
    category: string;
    description?: string;
    price?: number;
    duration?: string;
    providers?: number;
    rating?: number;
    reviews?: number;
  };
  const [items, setItems] = useState<PublicServiceItem[]>([]);
  // Lista de servicios del estudiante
  const [studentServices, setStudentServices] = useState<any[]>([]);

  // Cargar servicios del estudiante
  useEffect(() => {
    if (user?.role !== 'student' || !studentId) return;
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await getStudentServices(studentId);
        if (alive) setStudentServices(list);
      } catch (e: any) {
        if (alive) setError('No se pudieron cargar tus servicios');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [user?.role, studentId, reloadKey]);

  useEffect(() => {
    if (user?.role !== 'patient') return;
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Usar Promise.race para timeout de 5 segundos
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );

        const fetchPromise = api.get('/api/services');
        const res = await Promise.race([fetchPromise, timeoutPromise]) as any;

        const data: any[] = Array.isArray(res.data) ? res.data : [];
        const mapped: PublicServiceItem[] = data
          .map((s: any) => ({
            id: String(s.id),
            name: s?.name ?? 'Servicio',
            category: s?.categoria_general || '',
            description: s?.description ?? '',
            price: undefined,
            duration: typeof s?.estimated_duration === 'number' ? `${s.estimated_duration} min` : undefined,
            providers: typeof s?.providers_count === 'number' ? s.providers_count : 0,
            rating: undefined,
            reviews: undefined,
          }))
          .filter(s => s.providers && s.providers > 0)
          .sort((a, b) => (b.providers || 0) - (a.providers || 0))
          .slice(0, 6); // Mostrar solo los primeros 6 para mejorar rendimiento
        if (alive) setItems(mapped);
      } catch (e: any) {
        console.error('Error cargando servicios públicos:', e);
        if (alive) setError('No pudimos cargar los servicios.');
      } finally {
        if (alive) setLoading(false);
      }
    };

    // Cargar servicios después de un pequeño delay para priorizar el render inicial
    const timer = setTimeout(load, 100);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [user?.role]);
  // Debounce de búsqueda para optimizar rendimiento
  const debouncedQuery = useDebounce(q, 300);
  
  const filtered = useMemo(() => {
    const t = debouncedQuery.trim().toLowerCase();
    let base = items;
    if (t) {
      base = base.filter((it: PublicServiceItem) =>
        it.name.toLowerCase().includes(t) ||
        it.category.toLowerCase().includes(t) ||
        (it.description || '').toLowerCase().includes(t)
      );
    }
    return base;
  }, [debouncedQuery, items]);

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': 'var(--bg-primary)' }}>
          <IonTitle className="heading-md">ALDIENTE</IonTitle>
          <IonButtons slot="end">
            <NotificationCenter className="toolbar-icon-button" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ '--background': 'var(--bg-secondary)' }}>
        <motion.div
          variants={pageTransition}
          initial={false}
          animate="animate"
          exit="exit"
          style={{ padding: 'var(--space-6)' }}
        >
          {/* Hero Section Moderna */}
          <motion.div
            variants={fadeInUp}
            className="hero-modern"
            style={{ marginTop: 'var(--space-4)' }}
          >
            <h1 className="hero-title-modern">
              Hola, {displayName} 👋
            </h1>
            <p className="hero-subtitle-modern">
              {user?.role === 'student' 
                ? 'Gestiona tus servicios y conecta con pacientes' 
                : 'Encuentra servicios odontológicos de calidad con estudiantes certificados'}
            </p>
          </motion.div>

          {/* Sección para estudiantes: Tarjetas de acción modernas */}
          {user?.role === 'student' && (
            <motion.div
              variants={staggerContainer}
              className="grid-modern"
              style={{ marginBottom: 'var(--space-8)' }}
            >
              <motion.div variants={listItem}>
                <div className="floating-card">
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <div style={{
                      width: 56,
                      height: 56,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--gradient-primary-soft)',
                      borderRadius: 14,
                      marginBottom: 'var(--space-4)'
                    }}>
                      <IonIcon icon={briefcaseOutline} style={{ fontSize: 28, color: 'var(--color-primary-600)' }} />
                    </div>
                    <h3 className="heading-md" style={{ marginBottom: 'var(--space-2)' }}>
                      Mis Servicios
                    </h3>
                    <p className="body-sm" style={{ marginBottom: 'var(--space-5)' }}>
                      Administra los servicios que ofreces a tus pacientes
                    </p>
                  </div>
                  <button
                    className="btn-modern-primary"
                    style={{ width: '100%' }}
                    onClick={() => history.push('/tabs/services')}
                  >
                    <IonIcon icon={briefcaseOutline} />
                    Ver servicios
                  </button>
                </div>
              </motion.div>

              <motion.div variants={listItem}>
                <div className="floating-card">
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <div style={{
                      width: 56,
                      height: 56,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--gradient-primary-soft)',
                      borderRadius: 14,
                      marginBottom: 'var(--space-4)'
                    }}>
                      <IonIcon icon={calendarOutline} style={{ fontSize: 28, color: 'var(--color-primary-600)' }} />
                    </div>
                    <h3 className="heading-md" style={{ marginBottom: 'var(--space-2)' }}>
                      Mis Citas
                    </h3>
                    <p className="body-sm" style={{ marginBottom: 'var(--space-5)' }}>
                      Gestiona tus citas con pacientes
                    </p>
                  </div>
                  <button
                    className="btn-modern-secondary"
                    style={{ width: '100%' }}
                    onClick={() => history.push('/tabs/appointments')}
                  >
                    <IonIcon icon={calendarOutline} />
                    Ver calendario
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Tarjeta promocional moderna (solo pacientes) */}
          {user?.role === 'patient' && (
            <motion.div variants={fadeInUp} style={{ marginBottom: 'var(--space-6)' }}>
              <div className="floating-card" style={{ 
                background: 'var(--gradient-primary-soft)',
                border: '1px solid var(--color-primary-200)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <IonIcon icon={sparklesOutline} style={{ fontSize: 32, color: 'var(--color-primary-700)' }} />
                  <h3 className="heading-md" style={{ color: 'var(--color-primary-900)' }}>
                    Promoción del mes
                  </h3>
                </div>
                <p className="body-md" style={{ color: 'var(--color-primary-800)' }}>
                  Aprovecha descuentos especiales en tratamientos seleccionados. ¡Cupos limitados!
                </p>
              </div>
            </motion.div>
          )}

          {/* Botón Quiz + Búsqueda (solo pacientes) */}
          {user?.role === 'patient' && (
            <motion.div variants={fadeInUp} style={{ marginBottom: 'var(--space-6)' }}>
              {/* Botón destacado para el quiz */}
              <motion.button
                onClick={() => history.push('/tabs/service-quiz')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  marginBottom: '16px',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                  border: 'none',
                  borderRadius: '16px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(6, 182, 212, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}
              >
                <span style={{ fontSize: '24px' }}>🎯</span>
                <span>Encuentra tu servicio ideal</span>
              </motion.button>

              {/* Búsqueda tradicional */}
              <IonSearchbar
                value={q}
                placeholder="O busca servicios manualmente..."
                onIonChange={(e: any) => setQ(e.detail.value)}
                onKeyDown={(e: any) => { if (e.key === 'Enter') onSearch(); }}
                inputmode="search"
                className="searchbar-modern"
                style={{
                  '--background': 'var(--bg-elevated)',
                  '--border-radius': '16px',
                  '--box-shadow': 'var(--shadow-md)',
                  '--icon-color': 'var(--color-primary-500)'
                }}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Lista de servicios en Inicio (solo para pacientes) */}
        {user?.role === 'patient' && (
          <div style={{ padding: '0 var(--space-6)' }}>
            <h3 className="heading-md" style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
              Servicios disponibles
            </h3>
            
            {loading && (
              <div className="empty-state-modern">
                <div className="skeleton" style={{ height: 200, marginBottom: 'var(--space-4)' }} />
                <div className="skeleton" style={{ height: 200 }} />
              </div>
            )}
            
            {error && !loading && (
              <div className="empty-state-modern">
                <IonIcon icon={alertCircleOutline} className="empty-state-icon" style={{ color: 'var(--color-error)' }} />
                <p className="body-lg" style={{ color: 'var(--color-error)' }}>{error}</p>
              </div>
            )}
            
            <motion.div
              variants={staggerContainer}
              className="grid-modern"
            >
              {filtered.map((s) => (
                <motion.div key={s.id} variants={listItem}>
                  <div className="service-card-modern">
                    <div className="service-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                        <h3 className="heading-md" style={{ margin: 0 }}>{s.name}</h3>
                        {typeof s.price === 'number' && (
                          <span className="badge-primary" style={{ fontSize: '0.875rem' }}>
                            {s.price > 0 ? `$${s.price.toFixed(0)}` : 'Gratis'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="service-card-content">
                      {s.description && (
                        <p className="body-sm" style={{ marginBottom: 'var(--space-5)', color: 'var(--text-secondary)' }}>
                          {s.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
                        <div className="meta-item-modern">
                          <IonIcon icon={timeOutline} />
                          <span>{s.duration || 'N/E'}</span>
                        </div>
                        <div className="meta-item-modern">
                          <IonIcon icon={peopleOutline} />
                          <span>{s.providers || 0} estudiantes</span>
                        </div>
                        <div className="meta-item-modern">
                          <IonIcon icon={starOutline} style={{ color: '#f59e0b' }} />
                          <span>{(s.rating ?? 4.5).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="service-card-footer">
                      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                        <button
                          className="btn-modern-primary"
                          style={{ flex: 1 }}
                          onClick={() => history.push(`/tabs/servicio/${s.id}`, { service: { id: s.id, name: s.name, category: s.category, description: s.description } })}
                        >
                          Reservar
                        </button>
                        <button
                          className="btn-modern-ghost"
                          onClick={() => history.push(`/tabs/servicio/${s.id}`, { service: { id: s.id, name: s.name, category: s.category, description: s.description } })}
                        >
                          Detalles
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {filtered.length === 0 && !loading && (
              <div className="empty-state-modern">
                <IonIcon icon={searchOutline} className="empty-state-icon" />
                <h3 className="empty-state-title">
                  {q.trim() ? 'No encontramos resultados' : 'No hay servicios disponibles'}
                </h3>
                <p className="empty-state-description">
                  {q.trim()
                    ? `No se encontraron servicios para "${q.trim()}". Intenta con otros términos.`
                    : 'Actualmente no hay servicios disponibles. Vuelve pronto.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Onboarding para pacientes */}
        {user?.role === 'patient' && (
          <PatientOnboarding
            isOpen={showOnboarding}
            onComplete={handleOnboardingComplete}
          />
        )}

        {/* Toast de bienvenida */}
        <IonToast
          isOpen={toastOpen}
          onDidDismiss={() => setToastOpen(false)}
          message={toastMsg}
          duration={3000}
          position="top"
          color="success"
        />
      </IonContent>
    </IonPage>
  );
}

export default HomePage;
