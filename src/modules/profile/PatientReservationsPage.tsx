import React, { useEffect, useMemo, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonText,
  IonChip,
  IonBadge,
  IonSkeletonText,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/react';
import { locationOutline, peopleOutline, calendarOutline, timeOutline, checkboxOutline, checkmarkDoneOutline, closeOutline, chatbubblesOutline, eyeOutline, alertCircleOutline, card, cashOutline } from 'ionicons/icons';
import { motion } from 'framer-motion';
import { Appointment } from '../appointments/types';
import { getAppointmentsForPatient } from '../appointments/appointments.api';
import { useHistory } from 'react-router-dom';
import { IonButton, IonToast, IonSpinner } from '@ionic/react';
import { fadeInUp, staggerContainer, listItem, pageTransition } from '../../utils/animations';
import '../../theme/modern-design.css';
import { initiateAppointmentPayment } from '../webpay/webpay.api';

const fmtDateTime = (iso?: string) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('es-CL');
  } catch {
    return iso;
  }
};

const statusColor = (s?: string): 'success' | 'warning' | 'medium' | 'danger' => {
  switch (s) {
    case 'confirmed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'completed':
      return 'medium';
    case 'cancelled':
    default:
      return 'danger';
  }
};

const statusLabel = (s?: string): string => {
  switch (s) {
    case 'confirmed':
      return 'Confirmada';
    case 'pending':
      return 'Pendiente';
    case 'completed':
      return 'Completada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return '—';
  }
};

const PatientReservationsPage: React.FC = () => {
  const router = useHistory();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [payingAppointmentId, setPayingAppointmentId] = useState<string | null>(null);
  const [toast, setToast] = useState({ open: false, msg: '', color: 'success' as 'success' | 'danger' | 'warning' });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getAppointmentsForPatient();
        if (!mounted) return;
        setRows(res || []);
        setError(null);
      } catch (e: any) {
        console.error(e);
        if (!mounted) return;
        // Si hay respuesta del servidor (p.ej., 4xx/5xx), tratamos como lista vacía sin error visual
        if (e && e.response) {
          setRows([]);
          setError(null);
        } else {
          // Sin respuesta (network error / CORS / servidor caído)
          setRows([]);
          setError('No se pudo conectar al servidor');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const now = Date.now();
  const upcoming = useMemo(() => {
    let base = (rows || [])
      .filter((a) => {
        const t = a?.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
        const isFuture = t > now;
        const isOpen = a?.status !== 'completed' && a?.status !== 'cancelled';
        return isOpen && isFuture;
      });
    if (statusFilter !== 'all') base = base.filter(a => a.status === statusFilter);
    return base.sort((a, b) => {
      const ta = a?.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
      const tb = b?.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
      return ta - tb; // ascendente (más próximas primero)
    });
  }, [rows, now, statusFilter]);

  const history = useMemo(() => {
    let base = (rows || [])
      .filter((a) => {
        const t = a?.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
        const isPast = t > 0 && t < now;
        const isClosed = a?.status === 'completed' || a?.status === 'cancelled';
        return isPast || isClosed;
      });
    if (statusFilter !== 'all') base = base.filter(a => a.status === statusFilter);
    return base.sort((a, b) => {
      const ta = a?.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
      const tb = b?.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
      return tb - ta; // descendente (más recientes primero)
    });
  }, [rows, now, statusFilter]);

  const empty = !loading && !error && upcoming.length === 0 && history.length === 0;

  const handlePayment = async (appointmentId: string) => {
    try {
      setPayingAppointmentId(appointmentId);
      const token = localStorage.getItem('token');
      if (!token) {
        setToast({ open: true, msg: 'No se encontró token de autenticación', color: 'danger' });
        setPayingAppointmentId(null);
        return;
      }

      const response = await initiateAppointmentPayment(appointmentId, token);
      console.log('[Webpay] Pago iniciado:', response);

      // Redirigir a Webpay
      window.location.href = response.redirectUrl;
    } catch (error: any) {
      console.error('[Webpay] Error al iniciar pago:', error);
      setToast({ 
        open: true, 
        msg: error.message || 'Error al iniciar pago con Webpay', 
        color: 'danger' 
      });
      setPayingAppointmentId(null);
    }
  };

  const getPaymentStatusBadge = (appointment: any) => {
    const paymentStatus = appointment.payment_status;
    const paymentMethod = appointment.payment_method;

    if (paymentStatus === 'approved') {
      return (
        <span className="badge-success" style={{ fontSize: '0.7rem', padding: '6px 12px', lineHeight: 1 }}>
          <IonIcon icon={checkmarkDoneOutline} style={{ fontSize: '12px' }} />
          <span>Pagado</span>
        </span>
      );
    }

    if (paymentStatus === 'pending_payment') {
      return (
        <span className="badge-warning" style={{ fontSize: '0.7rem', padding: '6px 12px', lineHeight: 1 }}>
          <IonIcon icon={timeOutline} style={{ fontSize: '12px' }} />
          <span>Pago pendiente</span>
        </span>
      );
    }

    if (paymentStatus === 'rejected') {
      return (
        <span className="badge-danger" style={{ fontSize: '0.7rem', padding: '6px 12px', lineHeight: 1 }}>
          <IonIcon icon={closeOutline} style={{ fontSize: '12px' }} />
          <span>Pago rechazado</span>
        </span>
      );
    }

    return null;
  };

  const needsPayment = (appointment: any) => {
    const notes = appointment.notes || '';
    const hasWebpayInNotes = notes.toLowerCase().includes('pago: webpay');
    const paymentStatus = appointment.payment_status;
    
    return hasWebpayInNotes && (!paymentStatus || paymentStatus === 'pending' || paymentStatus === 'rejected');
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': 'var(--bg-primary)' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/profile" />
          </IonButtons>
          <IonTitle className="heading-md">Mis Reservas</IonTitle>
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
        {loading && (
          <div className="stack-modern">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 150, borderRadius: 20 }} />
            ))}
          </div>
        )}

        {error && (
          <div className="floating-card" style={{ background: 'var(--gradient-primary-soft)', border: '1px solid var(--color-error)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <IonIcon icon={alertCircleOutline} style={{ fontSize: 32, color: 'var(--color-error)' }} />
              <h3 className="heading-md" style={{ color: 'var(--color-error)', margin: 0 }}>Error</h3>
            </div>
            <p className="body-md" style={{ color: 'var(--color-error)' }}>{error}</p>
          </div>
        )}

        {/* Filtros siempre visibles */}
        {!loading && !error && rows.length > 0 && (
          <motion.div variants={fadeInUp} style={{ marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <button
                className={statusFilter === 'all' ? 'badge-primary' : 'badge-modern'}
                onClick={(e) => { e.preventDefault(); setStatusFilter('all'); }}
                style={{ 
                  cursor: 'pointer', 
                  border: statusFilter !== 'all' ? '2px solid var(--color-gray-300)' : 'none', 
                  background: statusFilter !== 'all' ? 'transparent' : undefined, 
                  color: statusFilter !== 'all' ? 'var(--text-secondary)' : undefined,
                  padding: '10px 20px',
                  lineHeight: 1
                }}
              >
                Todos
              </button>
              {(['pending','confirmed','completed','cancelled'] as const).map((s) => {
                const isActive = statusFilter === s;
                const badgeClass = isActive ? `badge-${s}` : 'badge-modern';
                return (
                  <button
                    key={s}
                    className={badgeClass}
                    onClick={(e) => { e.preventDefault(); setStatusFilter(s); }}
                    style={{ 
                      cursor: 'pointer',
                      border: !isActive ? '2px solid var(--color-gray-300)' : 'none',
                      background: !isActive ? 'transparent' : undefined,
                      color: !isActive ? 'var(--text-secondary)' : undefined,
                      padding: '10px 20px',
                      lineHeight: 1
                    }}
                  >
                    <IonIcon icon={s === 'pending' ? timeOutline : s === 'confirmed' ? checkboxOutline : s === 'completed' ? checkmarkDoneOutline : closeOutline} style={{ fontSize: '16px' }} />
                    <span>{statusLabel(s)}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Empty state cuando no hay reservas en absoluto */}
        {!loading && !error && rows.length === 0 && (
          <div className="empty-state-modern">
            <IonIcon icon={calendarOutline} className="empty-state-icon" />
            <h3 className="empty-state-title">Sin reservas</h3>
            <p className="empty-state-description">
              Aún no tienes historial. Cuando completes o canceles citas, aparecerán aquí.
            </p>
          </div>
        )}

        {/* Empty state cuando el filtro no tiene resultados */}
        {!loading && !error && rows.length > 0 && upcoming.length === 0 && history.length === 0 && (
          <div className="empty-state-modern">
            <IonIcon icon={calendarOutline} className="empty-state-icon" />
            <h3 className="empty-state-title">No hay resultados</h3>
            <p className="empty-state-description">
              No se encontraron reservas con el filtro "{statusLabel(statusFilter)}". Intenta con otro filtro.
            </p>
          </div>
        )}

        {!loading && !error && upcoming.length > 0 && (
          <>
            <h3 className="heading-md" style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
              Próximas Citas ({upcoming.length})
            </h3>
            <motion.div variants={staggerContainer} className="stack-modern">
              {upcoming.map((a) => {
                const professional = a.student_name || `Estudiante #${a.student_id}`;
                const service = a.service_name || `Servicio`;
                const when = fmtDateTime(a.scheduled_at);
                const place = (a as any).location || 'Clínica Odontológica';
                const label = statusLabel(a.status);
                const badgeClass = `badge-${a.status}`;
                return (
                  <motion.div key={a.id} variants={listItem}>
                    <div className="service-card-modern">
                      <div className="service-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <IonIcon icon={peopleOutline} style={{ fontSize: 24, color: 'var(--color-primary-600)' }} />
                            <h3 className="heading-md" style={{ margin: 0 }}>{professional}</h3>
                          </div>
                          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                            {getPaymentStatusBadge(a)}
                            <span className={badgeClass} style={{ fontSize: '0.75rem', padding: '8px 16px', lineHeight: 1 }}>
                              <IonIcon icon={a.status === 'pending' ? timeOutline : a.status === 'confirmed' ? checkboxOutline : a.status === 'completed' ? checkmarkDoneOutline : closeOutline} style={{ fontSize: '14px' }} />
                              <span>{label}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="service-card-content">
                        <p className="body-md" style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)', fontWeight: 500 }}>
                          {service}
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
                          <div className="meta-item-modern">
                            <IonIcon icon={calendarOutline} />
                            <span>{when}</span>
                          </div>
                          <div className="meta-item-modern">
                            <IonIcon icon={locationOutline} />
                            <span>{place}</span>
                          </div>
                        </div>
                      </div>

                      <div className="service-card-footer">
                        <div style={{ display: 'flex', gap: 'var(--space-3)', flexDirection: 'column' }}>
                          {needsPayment(a) && (
                            <button
                              className="btn-modern-primary"
                              style={{ width: '100%' }}
                              onClick={() => handlePayment(a.id)}
                              disabled={payingAppointmentId === a.id}
                            >
                              {payingAppointmentId === a.id ? (
                                <>
                                  <IonSpinner name="crescent" style={{ width: 16, height: 16 }} />
                                  <span>Procesando...</span>
                                </>
                              ) : (
                                <>
                                  <IonIcon icon={card} />
                                  <span>Pagar con Webpay</span>
                                </>
                              )}
                            </button>
                          )}
                          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                            <button
                              className="btn-modern-secondary"
                              style={{ flex: 1 }}
                              onClick={() => router.push(`/tabs/appointments/${a.id}`)}
                            >
                              <IonIcon icon={eyeOutline} />
                              Detalles
                            </button>
                            {(a.status === 'confirmed' || a.status === 'completed') && (
                              <button
                                className="btn-modern-primary"
                                style={{ flex: 1 }}
                                onClick={() => router.push(`/tabs/appointments/${a.id}`)}
                              >
                                <IonIcon icon={chatbubblesOutline} />
                                Chat
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </>
        )}

        {!loading && !error && history.length > 0 && (
          <>
            <h3 className="heading-md" style={{ marginTop: 'var(--space-8)', marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
              Historial ({history.length})
            </h3>
            <motion.div variants={staggerContainer} className="stack-modern">
              {history.map((a) => {
                const professional = a.student_name || `Estudiante #${a.student_id}`;
                const service = a.service_name || `Servicio`;
                const when = fmtDateTime(a.scheduled_at);
                const place = (a as any).location || 'Clínica Odontológica';
                const label = statusLabel(a.status);
                const badgeClass = `badge-${a.status}`;
                return (
                  <motion.div key={a.id} variants={listItem}>
                    <div className="service-card-modern" style={{ opacity: 0.8 }}>
                      <div className="service-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <IonIcon icon={peopleOutline} style={{ fontSize: 24, color: 'var(--color-gray-500)' }} />
                            <h3 className="heading-md" style={{ margin: 0, color: 'var(--text-secondary)' }}>{professional}</h3>
                          </div>
                          <span className={badgeClass} style={{ fontSize: '0.75rem', padding: '8px 16px', lineHeight: 1 }}>
                            <span>{label}</span>
                          </span>
                        </div>
                      </div>

                      <div className="service-card-content">
                        <p className="body-md" style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>
                          {service}
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
                          <div className="meta-item-modern">
                            <IonIcon icon={calendarOutline} />
                            <span>{when}</span>
                          </div>
                          <div className="meta-item-modern">
                            <IonIcon icon={locationOutline} />
                            <span>{place}</span>
                          </div>
                        </div>
                      </div>

                      <div className="service-card-footer">
                        <button
                          className="btn-modern-ghost"
                          style={{ width: '100%' }}
                          onClick={() => router.push(`/tabs/appointments/${a.id}`)}
                        >
                          <IonIcon icon={eyeOutline} />
                          Ver detalles
                        </button>
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
      <IonToast
        isOpen={toast.open}
        message={toast.msg}
        duration={3000}
        color={toast.color}
        onDidDismiss={() => setToast({ ...toast, open: false })}
      />
    </IonPage>
  );
};

export default PatientReservationsPage;
