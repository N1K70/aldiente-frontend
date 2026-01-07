import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonSpinner,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import { Appointment } from './types';
import { updateAppointment } from './appointments.api';
import { getAvailabilityForService } from '../services/services.api';
import { AvailabilityItem } from '../reservations/ReservationPage';
import CustomDatePicker from '../../components/CustomDatePicker';
import TimeSlotPicker from '../../components/TimeSlotPicker';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../../utils/animations';
import { calendarOutline, timeOutline, peopleOutline } from 'ionicons/icons';
import '../../theme/modern-design.css';

interface RescheduleAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess: () => void;
}

const RescheduleAppointmentModal: React.FC<RescheduleAppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; msg: string; color?: string }>({ open: false, msg: '' });
  const [availability, setAvailability] = useState<AvailabilityItem[]>([]);
  const [loadingAvail, setLoadingAvail] = useState(false);

  const minDateStr = useMemo(() => `${new Date().toISOString().split('T')[0]}T00:00:00`, []);

  // Días permitidos según disponibilidad del estudiante
  const allowedWeekdays = useMemo<Set<number>>(() => {
    return new Set((availability || []).map(a => a.day_of_week));
  }, [availability]);

  const isDateEnabled = useCallback((iso: string) => {
    try {
      const d = new Date(iso);
      const w = d.getDay();
      if (w === 0) return false; // deshabilitar domingo
      return allowedWeekdays.has(w);
    } catch {
      return true;
    }
  }, [allowedWeekdays]);


  // Array de fechas disponibles para el CustomDatePicker
  const availableDatesArray = useMemo((): string[] => {
    if (!availability?.length) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates: string[] = [];
    
    // Generar próximos 60 días con disponibilidad
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const w = d.getDay();
      if (w === 0 || !allowedWeekdays.has(w)) continue;
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dates.push(iso);
    }
    return dates;
  }, [availability, allowedWeekdays]);

  // Generar slots de tiempo disponibles para la fecha seleccionada
  const availableTimesForSelectedDate = useMemo((): string[] => {
    if (!selectedDate) return [];
    const d = new Date(`${selectedDate}T00:00:00`);
    const w = d.getDay();
    const blocks = availability.filter(a => a.day_of_week === w);
    const slots: string[] = [];
    const now = new Date();
    const isToday = selectedDate === `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    for (const b of blocks) {
      const start = (b.start_time || '00:00').slice(0,5);
      const end = (b.end_time || '00:00').slice(0,5);
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      let minutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;
      
      while (minutes <= endMinutes - 30) {
        const hh = Math.floor(minutes / 60).toString().padStart(2, '0');
        const mm = (minutes % 60).toString().padStart(2, '0');
        if (!isToday || (minutes + 5) >= currentMinutes) {
          slots.push(`${hh}:${mm}`);
        }
        minutes += 30;
      }
    }
    return Array.from(new Set(slots)).sort((a, b) => a.localeCompare(b));
  }, [selectedDate, availability]);

  // Cargar disponibilidad del servicio de estudiante cuando se abre el modal
  useEffect(() => {
    if (!isOpen || !appointment?.student_service_id) return;
    
    let mounted = true;
    (async () => {
      try {
        setLoadingAvail(true);
        const rows = await getAvailabilityForService(appointment.student_service_id);
        if (!mounted) return;
        setAvailability(rows || []);
      } catch (e) {
        if (!mounted) return;
        setAvailability([]);
      } finally {
        if (mounted) setLoadingAvail(false);
      }
    })();
    return () => { mounted = false; };
  }, [isOpen, appointment?.student_service_id]);

  // Inicializar con la fecha/hora actual de la cita
  useEffect(() => {
    if (!isOpen || !appointment) {
      setSelectedDate('');
      setSelectedTime('');
      return;
    }

    try {
      const currentDate = new Date(appointment.scheduled_at);
      const isoDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(currentDate.getDate()).padStart(2,'0')}`;
      const timeStr = `${String(currentDate.getHours()).padStart(2,'0')}:${String(currentDate.getMinutes()).padStart(2,'0')}`;
      
      setSelectedDate(isoDate);
      setSelectedTime(timeStr);
    } catch {
      setSelectedDate('');
      setSelectedTime('');
    }
  }, [isOpen, appointment]);

  const handleSubmit = async () => {
    if (!appointment || !selectedDate || !selectedTime) {
      setToast({ open: true, msg: 'Selecciona fecha y hora', color: 'warning' });
      return;
    }

    try {
      setSubmitting(true);
      const scheduledLocalStr = `${selectedDate}T${selectedTime}:00`;

      await updateAppointment(appointment.id, {
        scheduled_at: scheduledLocalStr,
      });

      setToast({ open: true, msg: 'Cita reagendada exitosamente', color: 'success' });
      setTimeout(() => {
        onSuccess();
        onClose();
        // Liberar foc o para evitar warning de aria-hidden si el contenedor se oculta
        const el = document.activeElement as HTMLElement | null;
        if (el && typeof el.blur === 'function') el.blur();
      }, 1000);
    } catch (e: any) {
      const backendMsg = e?.response?.data?.message || 'Error al reagendar la cita';
      setToast({ open: true, msg: backendMsg, color: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedDate('');
    setSelectedTime('');
    onClose();
    // Liberar foco para evitar warning de aria-hidden si el contenedor se oculta
    const el = document.activeElement as HTMLElement | null;
    if (el && typeof el.blur === 'function') el.blur();
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={handleCancel}
      backdropDismiss={!submitting}
      breakpoints={[0, 0.65, 0.95]}
      initialBreakpoint={0.9}
    >
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': 'var(--bg-primary)' }}>
          <IonButtons slot="start">
            <IonButton onClick={handleCancel} fill="clear" className="btn-modern-ghost">
              Cancelar
            </IonButton>
          </IonButtons>
          <IonTitle className="heading-md">Reagendar cita</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ '--background': 'var(--bg-secondary)' }}>
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          style={{ padding: 'var(--space-6)', paddingBottom: 'var(--space-10)' }}
        >
          <IonToast
            isOpen={toast.open}
            onDidDismiss={() => setToast({ ...toast, open: false })}
            message={toast.msg}
            color={toast.color}
            duration={2200}
          />

          {appointment && (
            <motion.div variants={fadeInUp}>
              <IonCard className="floating-card" style={{ marginBottom: 'var(--space-6)' }}>
                <IonCardHeader>
                  <IonCardTitle className="heading-md" style={{ marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <IonIcon icon={peopleOutline} style={{ fontSize: 26, color: 'var(--color-primary-600)' }} />
                    Resumen de la cita
                  </IonCardTitle>
                  <IonLabel className="caption" style={{ color: 'var(--text-secondary)' }}>Verifica los datos antes de reagendar</IonLabel>
                </IonCardHeader>
                <IonCardContent>
                  <IonList lines="none" className="stack-modern" style={{ gap: 'var(--space-3)' }}>
                    <IonItem className="meta-item-modern" style={{ '--padding-start': '0', '--inner-padding-end': '0' }}>
                      <IonIcon icon={peopleOutline} slot="start" />
                      <IonLabel>{appointment.patient_name || 'Paciente'}</IonLabel>
                    </IonItem>
                    <IonItem className="meta-item-modern" style={{ '--padding-start': '0', '--inner-padding-end': '0' }}>
                      <IonIcon icon={calendarOutline} slot="start" />
                      <IonLabel>
                        {appointment.scheduled_at
                          ? new Date(appointment.scheduled_at).toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'short' })
                          : 'Sin programación actual'}
                      </IonLabel>
                    </IonItem>
                    <IonItem className="meta-item-modern" style={{ '--padding-start': '0', '--inner-padding-end': '0' }}>
                      <IonIcon icon={timeOutline} slot="start" />
                      <IonLabel>{appointment.service_name || 'Servicio odontológico'}</IonLabel>
                    </IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>
            </motion.div>
          )}

          <motion.div variants={fadeInUp}>
            <IonCard className="floating-card" style={{ marginBottom: 'var(--space-6)' }}>
              <IonCardHeader>
                <IonCardTitle className="heading-md" style={{ marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <IonIcon icon={calendarOutline} style={{ fontSize: 26, color: 'var(--color-primary-600)' }} />
                  Nueva fecha y hora
                </IonCardTitle>
                <IonLabel className="caption" style={{ color: 'var(--text-secondary)' }}>
                  Selecciona una fecha disponible y luego un horario.
                </IonLabel>
              </IonCardHeader>
              <IonCardContent>
                {loadingAvail ? (
                  <div className="stack-modern" style={{ gap: 'var(--space-3)', textAlign: 'center', padding: 'var(--space-4)' }}>
                    <IonSpinner name="crescent" style={{ margin: '0 auto' }} />
                    <span className="caption" style={{ color: 'var(--text-secondary)' }}>Cargando disponibilidad…</span>
                  </div>
                ) : (
                  <div className="stack-modern" style={{ gap: 'var(--space-5)' }}>
                    <div>
                      <IonLabel className="caption" style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                        Fecha disponible*
                      </IonLabel>
                      <CustomDatePicker
                        selectedDate={selectedDate}
                        onDateChange={(date: string) => {
                          setSelectedDate(date);
                          setSelectedTime('');
                        }}
                        isDateEnabled={isDateEnabled}
                        availableDates={availableDatesArray}
                        minDate={minDateStr.split('T')[0]}
                      />
                      {!availability.length && (
                        <IonLabel className="caption" style={{ marginTop: 'var(--space-2)', color: 'var(--text-secondary)', display: 'block' }}>
                          No hay disponibilidad configurada para este servicio todavía.
                        </IonLabel>
                      )}
                    </div>

                    <div>
                      <IonLabel className="caption" style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                        Horario disponible*
                      </IonLabel>
                      <TimeSlotPicker
                        availableTimes={availableTimesForSelectedDate}
                        selectedTime={selectedTime}
                        onTimeChange={setSelectedTime}
                        loading={loadingAvail}
                      />
                      {!selectedDate && (
                        <IonLabel className="caption" style={{ marginTop: 'var(--space-2)', color: 'var(--text-secondary)', display: 'block' }}>
                          Selecciona primero una fecha para ver los horarios disponibles.
                        </IonLabel>
                      )}
                    </div>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          </motion.div>
        </motion.div>
      </IonContent>

      <IonFooter style={{ '--background': 'var(--bg-primary)', boxShadow: '0 -6px 18px rgba(15, 23, 42, 0.15)' }}>
        <div style={{ padding: 'var(--space-5)' }}>
          <button
            className="btn-modern-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
            onClick={handleSubmit}
            disabled={submitting || !selectedDate || !selectedTime}
          >
            {submitting ? (
              <>
                <IonSpinner name="dots" style={{ width: 20, height: 20 }} />
                <span>Reagendando…</span>
              </>
            ) : (
              <span>Confirmar reagendamiento</span>
            )}
          </button>
        </div>
      </IonFooter>
    </IonModal>
  );
};

export default RescheduleAppointmentModal;
