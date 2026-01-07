import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonToast,
  IonAlert,
  IonRefresher,
  IonRefresherContent,
  IonChip,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSkeletonText,
  IonSegment,
  IonSegmentButton,
} from '@ionic/react';
import { calendarOutline, createOutline, checkboxOutline, closeOutline, refreshOutline, peopleOutline, locationOutline, timeOutline, checkmarkDoneOutline, timeSharp, eyeOutline, chatbubblesOutline, listOutline } from 'ionicons/icons';
import { useAuth } from '../../shared/context/AuthContext';
import { useLocation, useHistory } from 'react-router-dom';
import { Appointment, AppointmentStatus } from './types';
import { getAppointmentsForStudent, updateAppointmentStatus } from './appointments.api';
import { api } from '../../shared/api/ApiClient';
import RescheduleAppointmentModal from './RescheduleAppointmentModal';
import { motion } from 'framer-motion';
import CalendarView from '../../components/CalendarView';
import { fadeInUp, staggerContainer, listItem, pageTransition } from '../../utils/animations';
import { formatDateTime as formatDateTimeUtil } from '../../utils/dateFormat';
import '../../theme/modern-design.css';

function formatDateTime(iso: string) {
  try {
    return formatDateTimeUtil(iso);
  } catch {
    return iso;
  }
}

function statusColor(s?: string): 'success' | 'warning' | 'medium' | 'danger' | 'primary' {
  switch (s) {
    case 'confirmed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'completed':
      return 'medium';
    case 'cancelled':
      return 'danger';
    default:
      return 'primary';
  }
}

function statusLabel(s?: string): string {
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
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const history = useHistory();
  const isStudent = user?.role === 'student';
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Appointment[]>([]);
  const [error, setError] = useState('');
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    status: AppointmentStatus;
  } | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!isStudent) return;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const list = await getAppointmentsForStudent();
        
        // Obtener nombres de pacientes que faltan
        const enrichedList = await Promise.all(
          list.map(async (appointment) => {
            if (!appointment.patient_name && appointment.patient_id) {
              try {
                // Intentar primero con el endpoint directo
                const patientRes = await api.get(`/api/patients/${appointment.patient_id}`);
                const patientData: any = patientRes.data;
                const name = patientData?.name || patientData?.full_name || patientData?.fullName;
                
                if (name) {
                  appointment.patient_name = name;
                } else {
                  // Si no hay nombre, intentar con el endpoint de usuarios
                  try {
                    const userRes = await api.get(`/api/users/${appointment.patient_id}`);
                    const userData: any = userRes.data;
                    appointment.patient_name = userData?.name || userData?.email?.split('@')[0] || null;
                  } catch (userErr) {
                    console.warn(`No se pudo obtener usuario ${appointment.patient_id}`);
                  }
                }
              } catch (err) {
                console.warn(`No se pudo obtener nombre del paciente ${appointment.patient_id}:`, err);
              }
            }
            return appointment;
          })
        );
        
        if (mounted) setItems(enrichedList);
      } catch (e: any) {
        if (mounted) {
          const status = e?.response?.status;
          const msg = status === 401
            ? 'Sesión expirada o inválida. Inicia sesión nuevamente.'
            : status === 403
              ? 'No autorizado. Ingresa con una cuenta de estudiante o verifica permisos.'
              : (e?.message || 'No se pudieron cargar las citas');
          setError(msg);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [isStudent, reloadKey]);

  const requestStatusChange = useCallback((id: string, status: AppointmentStatus) => {
    setConfirmAction({ id, status });
  }, []);

  const loadAppointments = useCallback(async () => {
    if (!isStudent) return;
    setLoading(true);
    setError('');
    try {
      const list = await getAppointmentsForStudent();
      
      // Obtener nombres de pacientes que faltan
      const enrichedList = await Promise.all(
        list.map(async (appointment) => {
          if (!appointment.patient_name && appointment.patient_id) {
            try {
              // Intentar primero con el endpoint directo
              const patientRes = await api.get(`/api/patients/${appointment.patient_id}`);
              const patientData: any = patientRes.data;
              const name = patientData?.name || patientData?.full_name || patientData?.fullName;
              
              if (name) {
                appointment.patient_name = name;
              } else {
                // Si no hay nombre, intentar con el endpoint de usuarios
                try {
                  const userRes = await api.get(`/api/users/${appointment.patient_id}`);
                  const userData: any = userRes.data;
                  appointment.patient_name = userData?.name || userData?.email?.split('@')[0] || null;
                } catch (userErr) {
                  console.warn(`No se pudo obtener usuario ${appointment.patient_id}`);
                }
              }
            } catch (err) {
              console.warn(`No se pudo obtener nombre del paciente ${appointment.patient_id}:`, err);
            }
          }
          return appointment;
        })
      );
      
      setItems(enrichedList);
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = status === 401
        ? 'Sesión expirada o inválida. Inicia sesión nuevamente.'
        : status === 403
          ? 'No autorizado. Ingresa con una cuenta de estudiante o verifica permisos.'
          : (e?.message || 'No se pudieron cargar las citas');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isStudent]);

  const doChangeStatus = useCallback(async () => {
    if (!confirmAction) return;
    setActing(true);
    try {
      const updated = await updateAppointmentStatus(confirmAction.id, confirmAction.status);
      setItems(prev => prev.map(it => (it.id === updated.id ? updated : it)));
      setToastMsg('Cita actualizada');
      setToastOpen(true);
    } catch (e) {
      // Optional: show error toast
    } finally {
      setActing(false);
      setConfirmAction(null);
    }
  }, [confirmAction]);

  const location = useLocation();
  const isHistoryMode = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const byQuery = params.get('scope') === 'past';
    const byPath = (location.pathname || '').includes('/appointments/history');
    return byQuery || byPath;
  }, [location.search, location.pathname]);

  const calendarItems = useMemo<Appointment[]>(() => {
    let base: Appointment[] = items;
    if (isHistoryMode) {
      const now = Date.now();
      base = base.filter((appointment: Appointment) => new Date(appointment.scheduled_at).getTime() < now);
    }
    if (statusFilter !== 'all') {
      base = base.filter((appointment: Appointment) => appointment.status === statusFilter);
    }
    return base;
  }, [items, isHistoryMode, statusFilter]);

  const upcomingItems = useMemo<Appointment[]>(() => {
    if (isHistoryMode) return [];
    const now = Date.now();
    const base = items.filter((appointment: Appointment) => {
      const time = new Date(appointment.scheduled_at).getTime();
      const isFuture = time > now;
      const isOpen = appointment.status !== 'completed' && appointment.status !== 'cancelled';
      return isFuture && isOpen;
    });
    if (statusFilter !== 'all') {
      return base
        .filter((appointment: Appointment) => appointment.status === statusFilter)
        .slice()
        .sort((a: Appointment, b: Appointment) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    }
    return base
      .slice()
      .sort((a: Appointment, b: Appointment) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  }, [items, statusFilter, isHistoryMode]);

  const historyItems = useMemo<Appointment[]>(() => {
    const now = Date.now();
    const base = items.filter((appointment: Appointment) => {
      const time = new Date(appointment.scheduled_at).getTime();
      const isPast = time > 0 && time < now;
      const isClosed = appointment.status === 'completed' || appointment.status === 'cancelled';
      return isPast || isClosed;
    });
    if (statusFilter !== 'all') {
      return base
        .filter((appointment: Appointment) => appointment.status === statusFilter)
        .slice()
        .sort((a: Appointment, b: Appointment) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
    }
    return base
      .slice()
      .sort((a: Appointment, b: Appointment) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
  }, [items, statusFilter]);

  const statusIcon = useCallback((s?: AppointmentStatus) => {
    switch (s) {
      case 'pending':
        return timeOutline;
      case 'confirmed':
        return checkboxOutline;
      case 'completed':
        return checkmarkDoneOutline;
      case 'cancelled':
        return closeOutline;
      default:
        return timeOutline;
    }
  }, []);

  // Convertir citas a eventos del calendario
  const calendarEvents = useMemo(() => {
    return calendarItems.map((appointment: Appointment) => ({
      id: appointment.id,
      title: appointment.patient_name || `Paciente #${appointment.patient_id}`,
      start: new Date(appointment.scheduled_at),
      end: new Date(appointment.scheduled_at),
      status: appointment.status,
      color: statusColor(appointment.status)
    }));
  }, [calendarItems]);

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': 'var(--bg-primary)' }}>
          <IonTitle className="heading-md">{isHistoryMode ? 'Historial de citas' : 'Mis Citas'}</IonTitle>
          <IonButtons slot="end">
            <button 
              onClick={() => setReloadKey(k => k + 1)} 
              aria-label="Refrescar"
              style={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: '2px solid var(--color-gray-300)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: 'var(--color-primary-600)',
                marginRight: 8
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-primary-50)';
                e.currentTarget.style.borderColor = 'var(--color-primary-500)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'var(--color-gray-300)';
              }}
            >
              <IonIcon icon={refreshOutline} style={{ fontSize: 20 }} />
            </button>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ '--background': 'var(--bg-secondary)' }}>
        <IonRefresher slot="fixed" onIonRefresh={(e) => { setReloadKey(k => k + 1); setTimeout(() => e.detail.complete(), 350); }}>
          <IonRefresherContent pullingText="Desliza para refrescar" refreshingSpinner="circles" />
        </IonRefresher>

        <IonToast isOpen={toastOpen} message={toastMsg} duration={1800} color="success" onDidDismiss={() => setToastOpen(false)} />

        <motion.div
          variants={pageTransition}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ padding: 'var(--space-6)' }}
        >
          {/* Selector de vista */}
          <motion.div variants={fadeInUp} style={{ marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                className={viewMode === 'calendar' ? 'btn-modern-primary' : 'btn-modern-secondary'}
                onClick={() => setViewMode('calendar')}
                style={{ flex: 1 }}
              >
                <IonIcon icon={calendarOutline} />
                Calendario
              </button>
              <button
                className={viewMode === 'list' ? 'btn-modern-primary' : 'btn-modern-secondary'}
                onClick={() => setViewMode('list')}
                style={{ flex: 1 }}
              >
                <IonIcon icon={listOutline} />
                Lista
              </button>
            </div>
          </motion.div>

          {/* Vista de Calendario */}
          {viewMode === 'calendar' && !loading && !error && (
            <motion.div variants={fadeInUp}>
              <CalendarView
                events={calendarEvents}
                onEventClick={(event) => {
                  const appointment = items.find(a => a.id === event.id);
                  if (appointment) {
                    history.push(`/tabs/appointments/${appointment.id}`);
                  }
                }}
                onDateClick={(date) => {
                  console.log('Fecha seleccionada:', date);
                }}
              />
            </motion.div>
          )}

          {/* Vista de Lista */}
          {viewMode === 'list' && (
            <>
              {loading && (
                <div className="stack-modern">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 150, borderRadius: 20 }} />
                  ))}
                </div>
              )}

              {!loading && error && (
                <div className="floating-card" style={{ background: 'var(--gradient-primary-soft)', border: '1px solid var(--color-error)' }}>
                  <h3 className="heading-md" style={{ color: 'var(--color-error)', marginBottom: 'var(--space-2)' }}>Error</h3>
                  <p className="body-md" style={{ color: 'var(--color-error)' }}>{error}</p>
                </div>
              )}

              {!loading && !error && items.length === 0 && (
                <div className="empty-state-modern">
                  <IonIcon icon={calendarOutline} className="empty-state-icon" />
                  <h3 className="empty-state-title">Sin citas</h3>
                  <p className="empty-state-description">
                    Aún no tienes citas. Cuando agendes, aparecerán aquí.
                  </p>
                </div>
              )}

              {!loading && !error && items.length > 0 && (
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
                  <button
                    className={statusFilter === 'all' ? 'badge-primary' : 'badge-modern'}
                    onClick={() => setStatusFilter('all')}
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
                  {(['pending','confirmed','completed','cancelled'] as AppointmentStatus[]).map((s) => {
                    const isActive = statusFilter === s;
                    const badgeClass = isActive ? `badge-${s}` : 'badge-modern';
                    return (
                      <button
                        key={s}
                        className={badgeClass}
                        onClick={() => setStatusFilter(s)}
                        style={{ 
                          cursor: 'pointer',
                          border: !isActive ? '2px solid var(--color-gray-300)' : 'none',
                          background: !isActive ? 'transparent' : undefined,
                          color: !isActive ? 'var(--text-secondary)' : undefined,
                          padding: '10px 20px',
                          lineHeight: 1
                        }}
                      >
                        <IonIcon icon={statusIcon(s)} style={{ fontSize: '16px' }} />
                        <span>{statusLabel(s)}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {!loading && !error && items.length > 0 && upcomingItems.length === 0 && historyItems.length === 0 && (
                <div className="empty-state-modern">
                  <IonIcon icon={calendarOutline} className="empty-state-icon" />
                  <h3 className="empty-state-title">No hay resultados</h3>
                  <p className="empty-state-description">
                    No se encontraron citas con el filtro "{statusFilter === 'all' ? 'Todos' : statusLabel(statusFilter)}".
                  </p>
                </div>
              )}

              {!loading && !error && upcomingItems.length > 0 && (
                <>
                  <h3 className="heading-md" style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
                    Próximas Citas ({upcomingItems.length})
                  </h3>
                  <motion.div variants={staggerContainer} className="stack-modern">
                    {upcomingItems.map((a: Appointment) => {
                      const professional = a.patient_name || `Paciente #${a.patient_id}`;
                      const service = a.service_name || `Servicio`;
                      const when = formatDateTime(a.scheduled_at);
                      const place = (a as any).location || 'Clínica Odontológica';
                      const label = statusLabel(a.status);
                      return (
                        <motion.div key={a.id} variants={listItem}>
                          <div className="service-card-modern">
                            <div className="service-card-header">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                  <IonIcon icon={peopleOutline} style={{ fontSize: 24, color: 'var(--color-primary-600)' }} />
                                  <h3 className="heading-md" style={{ margin: 0 }}>{professional}</h3>
                                </div>
                                <span className={`badge-${a.status}`} style={{ fontSize: '0.75rem', padding: '8px 16px', lineHeight: 1 }}>
                                  <IonIcon icon={statusIcon(a.status)} style={{ fontSize: '14px' }} />
                                  <span>{label}</span>
                                </span>
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
                              <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                                <button
                                  className="btn-modern-secondary"
                                  style={{ flex: 1 }}
                                  onClick={() => history.push(`/tabs/appointments/${a.id}`)}
                                >
                                  <IonIcon icon={eyeOutline} />
                                  Detalles
                                </button>
                                {(a.status === 'confirmed' || a.status === 'completed') && (
                                  <button
                                    className="btn-modern-primary"
                                    style={{ flex: 1 }}
                                    onClick={() => history.push(`/tabs/appointments/${a.id}`)}
                                  >
                                    <IonIcon icon={chatbubblesOutline} />
                                    Chat
                                  </button>
                                )}
                              </div>

                              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                                {a.status === 'pending' && (
                                  <button className="btn-icon" onClick={() => requestStatusChange(a.id, 'confirmed')} style={{ background: 'var(--color-success)' }}>
                                    <IonIcon icon={checkboxOutline} style={{ fontSize: 20, color: 'white' }} />
                                  </button>
                                )}
                                {(a.status === 'pending' || a.status === 'confirmed') && (
                                  <button className="btn-icon" onClick={() => requestStatusChange(a.id, 'cancelled')} style={{ background: 'var(--color-error)' }}>
                                    <IonIcon icon={closeOutline} style={{ fontSize: 20, color: 'white' }} />
                                  </button>
                                )}
                                {a.status === 'confirmed' && (
                                  <button className="btn-icon" onClick={() => requestStatusChange(a.id, 'completed')} style={{ background: 'var(--color-primary-600)' }}>
                                    <IonIcon icon={createOutline} style={{ fontSize: 20, color: 'white' }} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </>
              )}

              {!loading && !error && historyItems.length > 0 && (
                <>
                  <h3 className="heading-md" style={{ marginTop: 'var(--space-8)', marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
                    Historial ({historyItems.length})
                  </h3>
                  <motion.div variants={staggerContainer} className="stack-modern">
                    {historyItems.map((a: Appointment) => {
                      const professional = a.patient_name || `Paciente #${a.patient_id}`;
                      const service = a.service_name || `Servicio`;
                      const when = formatDateTime(a.scheduled_at);
                      const place = (a as any).location || 'Clínica Odontológica';
                      const label = statusLabel(a.status);
                      return (
                        <motion.div key={a.id} variants={listItem}>
                          <div className="service-card-modern" style={{ opacity: 0.8 }}>
                            <div className="service-card-header">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                  <IonIcon icon={peopleOutline} style={{ fontSize: 24, color: 'var(--color-gray-500)' }} />
                                  <h3 className="heading-md" style={{ margin: 0, color: 'var(--text-secondary)' }}>{professional}</h3>
                                </div>
                                <span className={`badge-${a.status}`} style={{ fontSize: '0.75rem', padding: '8px 16px', lineHeight: 1 }}>
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
                              <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                                <button
                                  className="btn-modern-ghost"
                                  style={{ flex: 1 }}
                                  onClick={() => history.push(`/tabs/appointments/${a.id}`)}
                                >
                                  <IonIcon icon={eyeOutline} />
                                  Ver detalles
                                </button>
                                {(a.status === 'confirmed' || a.status === 'completed') && (
                                  <button
                                    className="btn-modern-primary"
                                    style={{ flex: 1 }}
                                    onClick={() => history.push(`/tabs/appointments/${a.id}`)}
                                  >
                                    <IonIcon icon={chatbubblesOutline} />
                                    Chat
                                  </button>
                                )}
                              </div>

                              {(a.status === 'pending' || a.status === 'confirmed') && (
                                <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                                  {a.status === 'pending' && (
                                    <button className="btn-icon" onClick={() => requestStatusChange(a.id, 'confirmed')} style={{ background: 'var(--color-success)' }}>
                                      <IonIcon icon={checkboxOutline} style={{ fontSize: 20, color: 'white' }} />
                                    </button>
                                  )}
                                  {(a.status === 'pending' || a.status === 'confirmed') && (
                                    <button className="btn-icon" onClick={() => requestStatusChange(a.id, 'cancelled')} style={{ background: 'var(--color-error)' }}>
                                      <IonIcon icon={closeOutline} style={{ fontSize: 20, color: 'white' }} />
                                    </button>
                                  )}
                                  {a.status === 'confirmed' && (
                                    <button className="btn-icon" onClick={() => requestStatusChange(a.id, 'completed')} style={{ background: 'var(--color-primary-600)' }}>
                                      <IonIcon icon={createOutline} style={{ fontSize: 20, color: 'white' }} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </>
          )}
        </motion.div>

        <IonAlert
          isOpen={!!confirmAction}
          header="Actualizar cita"
          message={confirmAction ? `¿Deseas marcar esta cita como "${confirmAction.status}"?` : ''}
          onDidDismiss={() => setConfirmAction(null)}
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            {
              text: acting ? 'Actualizando...' : 'Confirmar',
              role: 'confirm',
              handler: () => {
                void doChangeStatus();
                return true;
              }
            }
          ]}
        />

      </IonContent>
    </IonPage>
  );
}
