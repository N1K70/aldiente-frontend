import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  IonItem,
  IonLabel,
  IonRadioGroup,
  IonRadio,
  IonDatetime,
  IonTextarea,
  IonButton,
  IonToast,
  IonText,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { createAppointment } from '../appointments/appointments.api';
import { CreateAppointmentPayload } from '../appointments/types';
import { getAvailabilityForService } from '../services/services.api';

export interface AvailabilityItem {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}
import CustomDatePicker from '../../components/CustomDatePicker';
import TimeSlotPicker from '../../components/TimeSlotPicker';
import { getWebpayLinkByPrice } from '../../utils/webpayPrices';
import { createWebpayPayment } from '../webpay/webpay.api';

interface Params { studentId: string; serviceId: string }

const ReservationPage: React.FC = () => {
  const history = useHistory();
  const { studentId, serviceId } = useParams<Params>();
  const location = useLocation<{ professional?: any; service?: any }>();
  const professional = location.state?.professional;
  const service = location.state?.service;
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [selectedTime, setSelectedTime] = useState<string>(''); // HH:mm
  const [payment, setPayment] = useState<'efectivo' | 'tarjeta' | 'transferencia' | 'webpay'>('efectivo');
  const [format, setFormat] = useState<'clinica' | 'online'>('clinica');
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState<{ open: boolean; msg: string; color?: string }>({ open: false, msg: '' });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [availability, setAvailability] = useState<AvailabilityItem[]>([]);
  const [loadingAvail, setLoadingAvail] = useState<boolean>(false);
  const [webpayLink, setWebpayLink] = useState<string | null>(null);
  const [loadingWebpay, setLoadingWebpay] = useState<boolean>(false);
  const minDateStr = useMemo(() => `${new Date().toISOString().split('T')[0]}T00:00:00`, []);

  // Colores de paleta Ionic (con fallback)
  const [palette, setPalette] = useState<{ primary: string; secondary: string; tertiary: string; success: string }>(
    { primary: '#3880ff', secondary: '#3dc2ff', tertiary: '#5260ff', success: '#2dd36f' }
  );
  useEffect(() => {
    try {
      const cs = getComputedStyle(document.documentElement);
      const pv = (name: string, fallback: string) => (cs.getPropertyValue(name)?.trim() || fallback);
      setPalette({
        primary: pv('--ion-color-primary', '#3880ff'),
        secondary: pv('--ion-color-secondary', '#3dc2ff'),
        tertiary: pv('--ion-color-tertiary', '#5260ff'),
        success: pv('--ion-color-success', '#2dd36f'),
      });
    } catch {}
  }, []);

  // Utilidad: parsear color (#rrggbb o rgb/rgba) a {r,g,b}
  const parseRGB = (c: string): { r: number; g: number; b: number } => {
    const s = c.replace(/\s+/g, '');
    if (s.startsWith('#')) {
      const hex = s.slice(1);
      const n = parseInt(hex.length === 3 ? hex.split('').map(ch => ch + ch).join('') : hex, 16);
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }
    const m = s.match(/^rgba?\((\d+),(\d+),(\d+)/i);
    if (m) return { r: +m[1], g: +m[2], b: +m[3] };
    // fallback azul
    return { r: 56, g: 128, b: 255 };
  };

  // Días permitidos según disponibilidad del estudiante
  const allowedWeekdays = useMemo<Set<number>>(() => {
    return new Set((availability || []).map(a => a.day_of_week));
  }, [availability]);

  const isDateEnabled = useCallback((iso: string) => {
    // Habilitar solo días de la semana que tengan disponibilidad
    try {
      // Usar formato ISO con hora para evitar problemas de zona horaria
      const d = new Date(`${iso}T12:00:00`);
      const w = d.getDay();
      if (w === 0) return false; // deshabilitar domingo siempre
      return allowedWeekdays.has(w);
    } catch {
      return true;
    }
  }, [allowedWeekdays]);

  // Calcular slots por día (30m) para un ISO date (YYYY-MM-DD)
  const countSlotsForIso = useCallback((isoDate: string): number => {
    const d = new Date(`${isoDate}T00:00:00`);
    const w = d.getDay();
    const blocks = availability.filter(a => a.day_of_week === w);
    let total = 0;
    for (const b of blocks) {
      const start = (b.start_time || '00:00').slice(0,5);
      const end = (b.end_time || '00:00').slice(0,5);
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const mins = (eh*60 + em) - (sh*60 + sm);
      if (mins > 0) total += Math.floor(mins / 30);
    }
    return total;
  }, [availability]);

  // Fechas resaltadas en el calendario (próximos 60 días con disponibilidad)
  const highlightedDates = useMemo<any[]>(() => {
    if (!availability?.length) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const out: any[] = [];
    // Precalcular slots máximos para normalizar intensidad
    let maxSlots = 1;
    const isoList: string[] = [];
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const w = d.getDay();
      if (w === 0 || !allowedWeekdays.has(w)) continue;
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      isoList.push(iso);
      const slots = countSlotsForIso(iso);
      if (slots > maxSlots) maxSlots = slots;
    }

    for (let i = 0; i < isoList.length; i++) {
      const iso = isoList[i];
      const d = new Date(`${iso}T00:00:00`);
      const diffDays = Math.round((d.getTime() - today.getTime()) / (1000*60*60*24));
      const slots = countSlotsForIso(iso);
      const density = Math.max(0.25, Math.min(1, slots / maxSlots)); // 0.25..1
      // Elegir color base por cercanía usando paleta
      let base = palette.success;        // 0-3 días: éxito (pronto)
      if (diffDays >= 4 && diffDays <= 7) base = palette.primary;      // 4–7 días: primario
      else if (diffDays >= 8 && diffDays <= 14) base = palette.secondary; // 8–14: secundario
      else if (diffDays > 14) base = palette.tertiary;                    // >14: terciario
      const { r, g, b } = parseRGB(base);
      const alpha = 0.35 + density * 0.55; // 0.35..0.9 según cantidad de slots
      out.push({ date: iso, textColor: '#ffffff', backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})` });
    }
    
    return out;
  }, [availability, allowedWeekdays, palette, countSlotsForIso]);

  const title = useMemo(() => {
    const sname = service?.name || `Servicio ${serviceId}`;
    const pname = professional?.name || `Estudiante ${studentId}`;
    return `Reservar ${sname}`;
  }, [service, serviceId, professional, studentId]);

  const handleSubmit = async () => {
    try {
      // Validaciones simples
      if (!selectedDate || !selectedTime) {
        setToast({ open: true, msg: 'Selecciona fecha y hora', color: 'warning' });
        return;
      }
      if (!user?.id) {
        setToast({ open: true, msg: 'Debes iniciar sesión para reservar.', color: 'warning' });
        return;
      }

      // Validar que los IDs sean UUID (evitar mocks como "stu1"/"svc2")
      const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidV4.test(studentId) || !uuidV4.test(serviceId) || !uuidV4.test(String(user.id))) {
        setToast({
          open: true,
          msg: 'IDs inválidos. Navega desde un servicio/profesional real para reservar.',
          color: 'warning',
        });
        return;
      }


      setSubmitting(true);

      // Crear la reserva primero
      const scheduledLocalStr = `${selectedDate}T${selectedTime}:00`;
      const payload: CreateAppointmentPayload = {
        patient_id: String(user.id),
        student_service_id: serviceId,
        scheduled_at: scheduledLocalStr,
        notes: [notes?.trim() || '', `(pago: ${payment})`, `(formato: ${format})`]
          .filter(Boolean)
          .join(' '),
      };

      const newAppointment = await createAppointment(payload);
      
      // Si el pago es con Webpay, redirigir a la página de reservas donde podrá pagar
      if (payment === 'webpay') {
        setToast({ open: true, msg: 'Reserva creada. Ahora puedes proceder al pago.', color: 'success' });
        setTimeout(() => history.replace('/tabs/profile/reservas'), 1000);
      } else {
        setToast({ open: true, msg: 'Reserva creada con éxito', color: 'success' });
        setTimeout(() => history.replace('/tabs/profile/reservas'), 700);
      }
    } catch (e: any) {
      console.error('[Reservation] Error:', e);
      setToast({ open: true, msg: e.message || 'No se pudo crear la reserva', color: 'danger' });
      setSubmitting(false);
    }
  };

  // Cargar disponibilidad del servicio de estudiante (student_service_id)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingAvail(true);
        const rows = await getAvailabilityForService(serviceId);
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
  }, [serviceId]);

  // Cargar link de Webpay basado en el precio del servicio
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!service?.price) {
        setWebpayLink(null);
        return;
      }
      
      try {
        setLoadingWebpay(true);
        const link = await getWebpayLinkByPrice(service.price);
        if (!mounted) return;
        setWebpayLink(link);
      } catch (e) {
        console.error('Error al cargar link de Webpay:', e);
        if (!mounted) return;
        setWebpayLink(null);
      } finally {
        if (mounted) setLoadingWebpay(false);
      }
    })();
    return () => { mounted = false; };
  }, [service?.price]);

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

  // Generar slots de 30 minutos para la fecha seleccionada
  const availableTimesForSelectedDate = useMemo((): string[] => {
    if (!selectedDate) return [];
    const d = new Date(`${selectedDate}T00:00:00`);
    const w = d.getDay(); // 0..6
    const blocks = availability.filter(a => a.day_of_week === w);
    const slots: string[] = [];
    const now = new Date();
    const isToday = selectedDate === `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    for (const b of blocks) {
      const start = (b.start_time || '00:00').slice(0,5); // HH:MM
      const end = (b.end_time || '00:00').slice(0,5);
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      let minutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;
      while (minutes <= endMinutes - 30) {
        const hh = Math.floor(minutes / 60).toString().padStart(2, '0');
        const mm = (minutes % 60).toString().padStart(2, '0');
        // Si es hoy, ocultar horas pasadas (tolerancia 5 minutos)
        if (!isToday || (minutes + 5) >= currentMinutes) {
          slots.push(`${hh}:${mm}`);
        }
        minutes += 30;
      }
    }
    return Array.from(new Set(slots)).sort((a, b) => a.localeCompare(b));
  }, [selectedDate, availability]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={`/tabs/servicio/${serviceId}`} />
          </IonButtons>
          <IonTitle>{title}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* Resumen */}
        <IonCard className="pro-header-card">
          <IonCardHeader>
            <IonCardTitle>Resumen</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText style={{ display: 'block', color: '#475569' }}>
              {service?.name || 'Servicio'} con {professional?.name || 'Estudiante'}.
            </IonText>
          </IonCardContent>
        </IonCard>

        {/* Formulario */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Detalles de la reserva</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList lines="full">
              <div style={{ padding: '0 16px' }}>
                <IonLabel style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: 'var(--ion-color-dark)',
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  Seleccionar fecha:
                </IonLabel>
                {loadingAvail ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <IonText color="medium">Cargando disponibilidad...</IonText>
                  </div>
                ) : (
                  <CustomDatePicker
                    selectedDate={selectedDate}
                    onDateChange={(date) => {
                      setSelectedDate(date);
                      setSelectedTime('');
                    }}
                    isDateEnabled={isDateEnabled}
                    availableDates={availableDatesArray}
                    minDate={minDateStr.split('T')[0]}
                  />
                )}
              </div>

              <div style={{ padding: '0 16px' }}>
                <TimeSlotPicker
                  availableTimes={availableTimesForSelectedDate}
                  selectedTime={selectedTime}
                  onTimeChange={setSelectedTime}
                  loading={loadingAvail}
                />
              </div>

              <IonItem>
                <IonLabel position="stacked">¿Cómo pagas?</IonLabel>
                <IonRadioGroup value={payment} onIonChange={(e) => setPayment(e.detail.value)}>
                  <IonItem><IonLabel>Efectivo</IonLabel><IonRadio slot="end" value="efectivo" /></IonItem>
                  <IonItem><IonLabel>Tarjeta</IonLabel><IonRadio slot="end" value="tarjeta" /></IonItem>
                  <IonItem><IonLabel>Transferencia</IonLabel><IonRadio slot="end" value="transferencia" /></IonItem>
                  {webpayLink && (
                    <IonItem>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img 
                          src="/assets/images/webpay_logo.svg" 
                          alt="Webpay" 
                          style={{ height: '24px', width: 'auto' }}
                        />
                        <IonLabel>Webpay</IonLabel>
                      </div>
                      <IonRadio slot="end" value="webpay" />
                    </IonItem>
                  )}
                  {loadingWebpay && (
                    <IonItem>
                      <IonLabel>Cargando opciones de pago...</IonLabel>
                    </IonItem>
                  )}
                </IonRadioGroup>
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Formato</IonLabel>
                <IonRadioGroup value={format} onIonChange={(e) => setFormat(e.detail.value)}>
                  <IonItem><IonLabel>Clínica</IonLabel><IonRadio slot="end" value="clinica" /></IonItem>
                  <IonItem><IonLabel>Consulta online</IonLabel><IonRadio slot="end" value="online" /></IonItem>
                </IonRadioGroup>
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Notas</IonLabel>
                <IonTextarea value={notes} onIonChange={(e) => setNotes(e.detail.value!)} placeholder="Información adicional (opcional)" />
              </IonItem>
            </IonList>

            <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
              <IonButton className="primary-gradient-btn" expand="block" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Creando...' : 'Confirmar reserva'}
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        <IonToast isOpen={toast.open} onDidDismiss={() => setToast({ ...toast, open: false })} message={toast.msg} color={toast.color} duration={1800} />
      </IonContent>
    </IonPage>
  );
};

export default ReservationPage;
