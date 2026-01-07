import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButtons, IonButton, IonIcon, IonLoading, IonSpinner, IonText, IonToast, IonItemSliding, IonItemOptions, IonItemOption, IonAlert, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import { addOutline, createOutline, trashOutline, timeOutline, pricetagOutline, briefcaseOutline, alertCircleOutline } from 'ionicons/icons';
import { motion } from 'framer-motion';
import { useAuth } from '../../shared/context/AuthContext';
import { getStudentServices, deleteStudentService } from './services.api';
import ServiceFormModal from './ServiceFormModal';
import { fadeInUp, staggerContainer, listItem, pageTransition } from '../../utils/animations';
import { useModalOrigin } from '../../hooks/useModalOrigin';
import '../../theme/modern-design.css';

export default function MyServicesPage() {
  const { user } = useAuth();
  const studentId = useMemo(() => user?.id ?? localStorage.getItem('userId') ?? '', [user]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editInitial, setEditInitial] = useState<any | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const fetchStartedRef = useRef(false);
  
  // Hook para capturar el origen del modal
  const { originElement: createOrigin, setOriginRef: setCreateOrigin } = useModalOrigin();
  const { originElement: editOrigin, setOriginRef: setEditOrigin } = useModalOrigin();

  useEffect(() => {
    let mounted = true;
    if (!studentId) return;
    console.debug('[MyServicesPage] start load');
    setLoading(true);
    setError('');
    const controller = new AbortController();
    const abortTimeout = setTimeout(() => controller.abort(), 15000);
    // Fallback adicional para que nunca quede pegado el loader
    const safetyTimeout = setTimeout(() => { if (mounted) { console.debug('[MyServicesPage] safety timeout -> setLoading(false)'); setLoading(false); } }, 16000);

    (async () => {
      try {
        if (!studentId) throw new Error('Sin ID de estudiante');
        console.debug('[MyServicesPage] fetching services for studentId=', studentId);
        fetchStartedRef.current = true;
        const list = await getStudentServices(studentId);
        console.debug('[MyServicesPage] services loaded:', Array.isArray(list) ? list.length : typeof list);
        if (mounted) setItems(list);
      } catch (e: any) {
        if (mounted) {
          const status = e?.response?.status;
          const msg = status === 401
            ? 'Sesión expirada o inválida. Inicia sesión nuevamente.'
            : status === 403
              ? 'No autorizado. Ingresa con una cuenta de estudiante o verifica permisos.'
              : (e?.message || 'No se pudo cargar servicios');
          console.error('[MyServicesPage] error loading services:', msg, e);
          setError(msg);
        }
      } finally {
        if (mounted) { console.debug('[MyServicesPage] finally -> setLoading(false)'); setLoading(false); }
        clearTimeout(abortTimeout);
        clearTimeout(safetyTimeout);
      }
    })();

    return () => { mounted = false; controller.abort(); clearTimeout(abortTimeout); clearTimeout(safetyTimeout); };
  }, [studentId, reloadKey]);

  // Cierra el loader en cuanto llegue respuesta (éxito o error)
  useEffect(() => {
    if (fetchStartedRef.current) {
      console.debug('[MyServicesPage] items/error change -> setLoading(false)');
      setLoading(false);
    }
  }, [items, error]);

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': 'var(--bg-primary)' }}>
          <IonTitle className="heading-md">Mis Servicios</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ '--background': 'var(--bg-secondary)' }}>
        <IonToast isOpen={toastOpen} message={toastMsg} duration={1800} color="success" onDidDismiss={() => setToastOpen(false)} />
        
        <motion.div
          variants={pageTransition}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ padding: 'var(--space-6)' }}
        >
          {loading && (
            <div className="stack-modern">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 200, borderRadius: 20 }} />
              ))}
            </div>
          )}
          
          {!loading && error && (
            <motion.div variants={fadeInUp}>
              <div className="floating-card" style={{ background: 'var(--gradient-primary-soft)', border: '1px solid var(--color-error)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                  <IonIcon icon={alertCircleOutline} style={{ fontSize: 32, color: 'var(--color-error)' }} />
                  <h3 className="heading-md" style={{ color: 'var(--color-error)', margin: 0 }}>Error</h3>
                </div>
                <p className="body-md" style={{ color: 'var(--color-error)', marginBottom: 'var(--space-4)' }}>{error}</p>
                <button
                  className="btn-modern-secondary"
                  onClick={() => setReloadKey((k) => k + 1)}
                >
                  Reintentar
                </button>
              </div>
            </motion.div>
          )}
          
          {!loading && !error && items.length === 0 && (
            <div className="empty-state-modern">
              <IonIcon icon={briefcaseOutline} className="empty-state-icon" />
              <h3 className="empty-state-title">Sin servicios todavía</h3>
              <p className="empty-state-description">
                Comienza agregando tu primer servicio odontológico para que los pacientes puedan reservar contigo.
              </p>
              <button
                className="btn-modern-primary"
                onClick={() => setCreateOpen(true)}
                style={{ marginTop: 'var(--space-4)' }}
              >
                <IonIcon icon={addOutline} />
                Agregar servicio
              </button>
            </div>
          )}
          {!loading && !error && items.length > 0 && (
            <>
              <motion.div variants={fadeInUp} style={{ marginBottom: 'var(--space-6)' }}>
                <h3 className="heading-md" style={{ color: 'var(--text-primary)' }}>
                  Mis servicios publicados ({items.length})
                </h3>
                <p className="body-sm" style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                  Gestiona los servicios que ofreces a tus pacientes
                </p>
              </motion.div>
              
              <motion.div variants={staggerContainer} className="stack-modern">
                {items.map((s:any, idx:number) => {
                  const name = s.base_name || s.service_name || s.serviceName || s.name || 'Servicio';
                  const description = s.description || s.base_description || '';
                  const category = s.category || '';
                  const price: number | undefined = typeof s.price === 'number' ? s.price : (s?.price ? Number(s.price) : undefined);
                  const rawDuration: any = s.duration ?? s.base_estimated_duration;
                  const duration = typeof rawDuration === 'number' ? `${rawDuration} min` : (rawDuration || '');
                  return (
                    <motion.div key={String(s.id ?? s.student_service_id ?? idx)} variants={listItem}>
                      <div className="service-card-modern">
                        <div className="service-card-header">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                            <h3 className="heading-md" style={{ margin: 0 }}>{name}</h3>
                            {typeof price === 'number' && (
                              <span className="badge-primary" style={{ fontSize: '0.875rem', padding: '8px 16px', lineHeight: 1 }}>
                                <IonIcon icon={pricetagOutline} style={{ fontSize: '14px' }} />
                                <span>{price > 0 ? `$${price.toFixed(0)}` : 'Gratis'}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="service-card-content">
                          {description && (
                            <p className="body-md" style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>
                              {description}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
                            {category && (
                              <div className="meta-item-modern">
                                <IonIcon icon={briefcaseOutline} />
                                <span>{category}</span>
                              </div>
                            )}
                            {duration && (
                              <div className="meta-item-modern">
                                <IonIcon icon={timeOutline} />
                                <span>{duration}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="service-card-footer">
                          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                            <button
                              className="btn-modern-primary"
                              style={{ flex: 1 }}
                              onClick={() => { setEditInitial(s); setEditOpen(true); }}
                            >
                              <IonIcon icon={createOutline} />
                              Editar
                            </button>
                            <button
                              className="btn-modern-ghost"
                              style={{ flex: 1, color: 'var(--color-error)' }}
                              onClick={() => setConfirmDeleteId(String(s.id))}
                            >
                              <IonIcon icon={trashOutline} />
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </>
          )}
        </motion.div>
      </IonContent>
      
      {/* FAB para agregar servicio */}
      {!loading && items.length > 0 && (
        <button
          ref={(el) => setCreateOrigin(el)}
          className="fab-modern"
          onClick={() => setCreateOpen(true)}
          aria-label="Agregar servicio"
        >
          <IonIcon icon={addOutline} style={{ fontSize: 28, color: 'white' }} />
        </button>
      )}
      <ServiceFormModal
        isOpen={createOpen}
        studentId={studentId}
        onDismiss={() => setCreateOpen(false)}
        onSaved={(svc:any) => { setItems(prev => [svc, ...prev]); setToastMsg('Servicio creado'); setToastOpen(true); }}
        originElement={createOrigin}
      />
      <ServiceFormModal
        isOpen={editOpen}
        studentId={studentId}
        mode="edit"
        initial={editInitial}
        onDismiss={() => { setEditOpen(false); setEditInitial(null); }}
        onSaved={(svc:any) => {
          setItems(prev => prev.map(it => (String(it.id) === String(svc.id) ? svc : it)));
          setToastMsg('Servicio actualizado');
          setToastOpen(true);
        }}
        onDeleted={(id:any) => {
          setItems(prev => prev.filter(it => String(it.id) !== String(id)));
          setToastMsg('Servicio eliminado');
          setToastOpen(true);
        }}
      />
      <IonAlert
        isOpen={!!confirmDeleteId}
        header="Eliminar servicio"
        message="¿Estás seguro de eliminar este servicio? Esta acción no se puede deshacer."
        onDidDismiss={() => setConfirmDeleteId(null)}
        buttons={[
          { text: 'Cancelar', role: 'cancel' },
          {
            text: deleting ? 'Eliminando...' : 'Eliminar',
            role: 'destructive',
            handler: async () => {
              if (!confirmDeleteId) return;
              try {
                setDeleting(true);
                await deleteStudentService(studentId, confirmDeleteId);
                setItems(prev => prev.filter(it => String(it.id) !== String(confirmDeleteId)));
                setToastMsg('Servicio eliminado');
                setToastOpen(true);
              } catch (e: any) {
                setToastMsg(e?.message || 'No se pudo eliminar el servicio');
                setToastOpen(true);
              } finally {
                setDeleting(false);
                setConfirmDeleteId(null);
              }
            }
          }
        ]}
      />
    </IonPage>
  );
}
