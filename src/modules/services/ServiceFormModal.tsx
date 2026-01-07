import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonText,
  IonSpinner,
  IonIcon,
  IonToggle,
  IonAlert,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent
} from '@ionic/react';
import { motion } from 'framer-motion';
import { 
  createStudentService, 
  updateStudentService, 
  deleteStudentService,
  getAvailabilityForService,
  createServiceAvailability,
  updateServiceAvailability,
  deleteServiceAvailability
} from './services.api';
import { StudentService } from './types';
import { api } from '../../shared/api/ApiClient';
import {
  documentTextOutline,
  cashOutline,
  timeOutline,
  calendarOutline,
  trashOutline,
  locationOutline,
  listOutline,
  checkmarkCircleOutline,
  closeCircleOutline
} from 'ionicons/icons';
import { fadeInUp, staggerContainer } from '../../utils/animations';
import '../../theme/modern-design.css';

interface Props {
  isOpen: boolean;
  studentId: string;
  onDismiss: () => void;
  onSaved: (service: StudentService) => void;
  mode?: 'create' | 'edit';
  initial?: Partial<StudentService> | null;
  onDeleted?: (serviceId: string) => void;
  originElement?: HTMLElement | null;
}

const categories = [
  'Limpieza',
  'Extracción',
  'Ortodoncia',
  'Endodoncia',
  'Blanqueamiento',
  'Otro'
];

export default function ServiceFormModal({ isOpen, studentId, onDismiss, onSaved, mode = 'create', initial = null, onDeleted, originElement }: Props) {
  const [baseServices, setBaseServices] = useState<Array<{ id: string; name: string; categoria_general?: string; categoria_tecnica?: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [baseServiceId, setBaseServiceId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [location, setLocation] = useState<string>('Universidad');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // --- Disponibilidad (1 rango por día) ---
  const WEEKDAYS = useMemo(() => ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'], []);
  type DayState = { enabled: boolean; start: string; end: string; availabilityId?: string };
  const [days, setDays] = useState<Record<number, DayState>>({});
  const [savingDay, setSavingDay] = useState<number | null>(null);
  const [dayErrors, setDayErrors] = useState<Record<number, string>>({});
  const timersRef = useRef<Record<number, any>>({});

  // Obtener categorías únicas
  const availableCategories = useMemo(() => {
    const cats = new Set(baseServices.map(s => s.categoria_general || 'Otro'));
    return Array.from(cats).sort();
  }, [baseServices]);

  // Filtrar servicios por categoría seleccionada
  const filteredServices = useMemo(() => {
    if (!selectedCategory) return [];
    return baseServices.filter(s => (s.categoria_general || 'Otro') === selectedCategory);
  }, [baseServices, selectedCategory]);

  function hhmmToHms(v: string) { if (!v) return ''; const [h,m] = v.split(':'); return `${h || '00'}:${m || '00'}:00`; }
  function timeToHHmm(v?: string) { if (!v) return ''; const [h,m] = v.split(':'); return `${h}:${m}`; }

  const autoSaveServiceIfNeeded = useCallback(async () => {
    if (initial?.id) return String(initial.id); // Ya existe
    if (!baseServiceId) {
      // No mostrar error, solo retornar null para que se pueda configurar disponibilidad localmente
      return null;
    }
    // Autoguardar el servicio
    setSubmitting(true);
    try {
      const priceNum = price ? Number(price) : undefined;
      const durationNum = duration ? Number(duration) : undefined;
      const payloadCreate: any = {
        service_id: baseServiceId,
        description,
        price: priceNum,
        duration: durationNum,
        location,
      };
      const res = await createStudentService(studentId, payloadCreate);
      // Actualizar el initial para que tenga el id
      onSaved(res);
      return String(res.id);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'No se pudo guardar el servicio');
      throw e;
    } finally {
      setSubmitting(false);
    }
  }, [initial, baseServiceId, description, price, duration, studentId, onSaved]);


  const toggleDayEnabled = useCallback(async (idx: number, enabled: boolean) => {
    const st = days[idx] || { enabled: false, start: '09:00', end: '17:00' };
    
    // En cualquier modo, solo guardar localmente
    if (enabled) {
      setDays(prev => ({ ...prev, [idx]: { ...st, enabled: true } }));
    } else {
      setDays(prev => ({ ...prev, [idx]: { enabled: false, start: st.start, end: st.end, availabilityId: st.availabilityId } }));
    }
  }, [days]);

  // Cargar lista de servicios base cuando el modal se abre
  useEffect(() => {
    let mounted = true;
    if (!isOpen) return;
    (async () => {
      try {
        const res = await api.get('/api/services');
        const raw: any = res.data;
        const rows: any[] = Array.isArray(raw) ? raw : (raw?.services || raw?.data || []);
        if (mounted) {
          setBaseServices(rows.map(r => ({ 
            id: String(r.id), 
            name: r.name || 'Servicio',
            categoria_general: r.categoria_general || '',
            categoria_tecnica: r.categoria_tecnica || ''
          })));
        }
      } catch (e) {
        // silencioso
      }
    })();
    return () => { mounted = false; };
  }, [isOpen]);

  // Cargar valores iniciales en modo edición
  React.useEffect(() => {
    if (isOpen && mode === 'edit' && initial) {
      const serviceId = String((initial as any)?.service_id || '');
      setBaseServiceId(serviceId);
      
      // Buscar la categoría del servicio seleccionado
      if (serviceId && baseServices.length > 0) {
        const service = baseServices.find(s => String(s.id) === serviceId);
        if (service) {
          setSelectedCategory(service.categoria_general || 'Otro');
        }
      }
      
      setDescription((initial as any)?.description || '');
      const p = (initial as any)?.price;
      setPrice(p === 0 || p ? String(p) : '');
      const d = (initial as any)?.duration;
      setDuration(d === 0 || d ? String(d) : '');
      setLocation((initial as any)?.location || 'Universidad');
    } else if (isOpen && mode === 'create') {
      reset();
    }
  }, [isOpen, mode, initial, baseServices]);

  // Cargar disponibilidad actual del servicio (solo en edición, requiere id de student_service)
  useEffect(() => {
    const load = async () => {
      if (!isOpen || mode !== 'edit' || !initial?.id) return;
      try {
        const data = await getAvailabilityForService(String(initial.id));
        const init: Record<number, DayState> = {};
        for (let i=0;i<7;i++) init[i] = { enabled: false, start: '09:00', end: '17:00' };
        data.forEach(a => {
          const dayOfWeek = a.day_of_week ?? a.weekday;
          if (dayOfWeek !== null && dayOfWeek !== undefined) {
            init[dayOfWeek] = {
              enabled: true,
              start: timeToHHmm(a.start_time) || '09:00',
              end: timeToHHmm(a.end_time) || '17:00',
              availabilityId: a.id,
            };
          }
        });
        setDays(init);
      } catch (e) {
        // Silencioso
      }
    };
    load();
  }, [isOpen, mode, initial]);

  const reset = () => {
    setSelectedCategory('');
    setBaseServiceId('');
    setDescription('');
    setPrice('');
    setDuration('');
    setLocation('Universidad');
    setError('');
    setSubmitting(false);
  };

  const handleClose = useCallback(() => {
    if (submitting) return;
    reset();
    onDismiss();
  }, [onDismiss, submitting]);

  const onSubmit = useCallback(async () => {
    setError('');
    if (mode === 'create' && !baseServiceId) {
      setError('Debes seleccionar un servicio base');
      return;
    }
    
    // Validar rangos de horarios de disponibilidad
    const enabledDays = Object.entries(days).filter(([_, st]) => (st as DayState).enabled);
    for (const [dayIdx, st] of enabledDays) {
      const idx = Number(dayIdx);
      const dayState = st as DayState;
      const startHms = hhmmToHms(dayState.start);
      const endHms = hhmmToHms(dayState.end);
      
      if (!startHms || !endHms) {
        setError(`${WEEKDAYS[idx]}: Debes especificar hora de inicio y fin`);
        setDayErrors(prev => ({ ...prev, [idx]: 'Hora inválida' }));
        return;
      }
      
      if (startHms >= endHms) {
        setError(`${WEEKDAYS[idx]}: La hora de inicio debe ser menor que la hora de fin`);
        setDayErrors(prev => ({ ...prev, [idx]: 'Rango inválido (desde debe ser menor que hasta)' }));
        return;
      }
    }
    
    // Limpiar todos los errores de días
    setDayErrors({});
    
    setSubmitting(true);
    try {
      const priceNum = price ? Number(price) : undefined;
      const durationNum = duration ? Number(duration) : undefined;
      if (mode === 'edit' && (initial as any)?.id) {
        const payloadUpdate: any = {};
        if (baseServiceId && String(baseServiceId) !== String((initial as any)?.service_id || '')) payloadUpdate.service_id = baseServiceId;
        if (description !== undefined) payloadUpdate.description = description;
        if (priceNum !== undefined) payloadUpdate.price = priceNum;
        if (durationNum !== undefined) payloadUpdate.duration = durationNum;
        if (location !== undefined) payloadUpdate.location = location;
        const res = await updateStudentService(studentId, String((initial as any).id), payloadUpdate);
        
        // Actualizar disponibilidad
        const serviceId = String((initial as any).id);
        
        // Primero, eliminar TODAS las disponibilidades existentes para evitar duplicados
        const allCurrentAvailability = await getAvailabilityForService(serviceId);
        for (const avail of allCurrentAvailability) {
          try {
            await deleteServiceAvailability(avail.id);
          } catch (e) {
            // Continuar aunque falle
          }
        }
        
        // Luego, crear las nuevas disponibilidades desde cero
        const enabledDays = Object.entries(days).filter(([_, st]) => (st as DayState).enabled);
        for (const [dayIdx, st] of enabledDays) {
          const idx = Number(dayIdx);
          const dayState = st as DayState;
          const startHms = hhmmToHms(dayState.start);
          const endHms = hhmmToHms(dayState.end);
          
          if (startHms && endHms && startHms < endHms) {
            try {
              await createServiceAvailability(serviceId, {
                dayOfWeek: idx,
                startTime: startHms,
                endTime: endHms,
                isRecurring: true,
              });
            } catch (availError: any) {
              // Continuar guardando otros días aunque uno falle
            }
          }
        }
        
        onSaved(res);
      } else {
        // Preparar disponibilidades para el payload de creación
        const enabledDays = Object.entries(days).filter(([_, st]) => (st as DayState).enabled);
        const availabilities = enabledDays.map(([dayIdx, st]) => {
          const idx = Number(dayIdx);
          const dayState = st as DayState;
          // Convertir índice del array (0=Domingo, 1=Lunes, ..., 6=Sábado)
          // al formato del backend (1=Lunes, 2=Martes, ..., 7=Domingo)
          const backendDayOfWeek = idx === 0 ? 7 : idx;
          return {
            day_of_week: backendDayOfWeek,
            start_time: hhmmToHms(dayState.start),
            end_time: hhmmToHms(dayState.end),
          };
        }).filter(a => a.start_time && a.end_time && a.start_time < a.end_time);
        
        // Validar que haya al menos una disponibilidad
        if (availabilities.length === 0) {
          setError('Debe proporcionar al menos una disponibilidad para el servicio.');
          return;
        }
        
        const payloadCreate: any = {
          service_id: baseServiceId,
          description,
          price: priceNum,
          duration: durationNum,
          location,
          availabilities, // Incluir disponibilidades en el payload de creación
        };
        const res = await createStudentService(studentId, payloadCreate);
        
        onSaved(res);
      }
      reset();
      onDismiss();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'No se pudo guardar el servicio');
    } finally {
      setSubmitting(false);
    }
  }, [studentId, baseServiceId, description, price, duration, location, days, onSaved, onDismiss, mode, initial]);

  const onDelete = useCallback(async () => {
    if (!initial || !(initial as any).id) return;
    setError('');
    setDeleting(true);
    try {
      await deleteStudentService(studentId, String((initial as any).id));
      onDeleted?.(String((initial as any).id));
      reset();
      onDismiss();
    } catch (e: any) {
      setError(e?.message || 'No se pudo eliminar el servicio');
    } finally {
      setDeleting(false);
    }
  }, [studentId, initial, onDeleted, onDismiss]);

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={handleClose}
      presentingElement={document.querySelector('ion-router-outlet') || undefined}
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>{mode === 'edit' ? 'Editar Servicio' : 'Nuevo Servicio'}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleClose} disabled={submitting || deleting}>
              Cerrar
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
      <div style={{ background: 'var(--bg-secondary)', minHeight: '400px', maxHeight: 'calc(90vh - 174px)', overflowY: 'auto' }}>
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          style={{ padding: 'var(--space-6)' }}
        >
          {error && (
            <motion.div variants={fadeInUp}>
              <div className="floating-card" style={{ background: 'var(--gradient-primary-soft)', border: '1px solid var(--color-error)', marginBottom: 'var(--space-6)' }}>
                <p className="body-md" style={{ color: 'var(--color-error)', margin: 0 }}><strong>{error}</strong></p>
              </div>
            </motion.div>
          )}
          
          <motion.div variants={fadeInUp}>
            <div className="floating-card" style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <IonIcon icon={listOutline} style={{ fontSize: 24, color: 'var(--color-primary-600)' }} />
                <h3 className="heading-md" style={{ margin: 0 }}>Selección de servicio</h3>
              </div>
              
              <div className="stack-modern" style={{ gap: 'var(--space-5)' }}>
                <div>
                  <label className="caption" style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 'var(--space-2)', display: 'block' }}>
                    1. Categoría*
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={e => {
                      setSelectedCategory(e.target.value);
                      setBaseServiceId('');
                    }}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      fontSize: '16px',
                      border: '1px solid var(--color-gray-300)',
                      borderRadius: '14px',
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary-500)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--color-gray-300)'}
                  >
                    <option value="">Selecciona una categoría</option>
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {selectedCategory && (
                  <div>
                    <label className="caption" style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 'var(--space-2)', display: 'block' }}>
                      2. Servicio específico*
                    </label>
                    <select
                      value={baseServiceId}
                      onChange={e => setBaseServiceId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '14px 20px',
                        fontSize: '16px',
                        border: '1px solid var(--color-gray-300)',
                        borderRadius: '14px',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        outline: 'none',
                        transition: 'all 0.2s',
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--color-primary-500)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--color-gray-300)'}
                    >
                      <option value="">Selecciona un servicio</option>
                      {filteredServices.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <p className="caption" style={{ marginTop: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                      {filteredServices.length} servicio{filteredServices.length !== 1 ? 's' : ''} en {selectedCategory}
                    </p>
                  </div>
                )}
                
                {!selectedCategory && (
                  <div style={{ padding: 'var(--space-3)', background: 'var(--gradient-primary-soft)', borderRadius: '12px', fontSize: '13px', color: 'var(--color-primary-700)' }}>
                    💡 Selecciona una categoría para ver los servicios disponibles
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <div className="floating-card" style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <IonIcon icon={documentTextOutline} style={{ fontSize: 24, color: 'var(--color-primary-600)' }} />
                <h3 className="heading-md" style={{ margin: 0 }}>Detalles personalizados</h3>
              </div>
              
              <div className="stack-modern" style={{ gap: 'var(--space-5)' }}>
                <div>
                  <label className="caption" style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 'var(--space-2)', display: 'block' }}>
                    Descripción*
                  </label>
                  <IonTextarea 
                    value={description} 
                    onIonChange={e => setDescription(e.detail.value as string)} 
                    autoGrow 
                    rows={3} 
                    placeholder="Describe el servicio y qué incluye"
                    className="textarea-modern"
                    style={{
                      '--background': 'var(--bg-elevated)',
                      '--border-radius': '14px',
                      '--padding-start': '20px',
                      '--padding-end': '20px',
                      '--padding-top': '16px',
                      '--padding-bottom': '16px',
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <IonIcon icon={cashOutline} style={{ fontSize: 20, color: 'var(--color-primary-600)' }} />
                    <label className="caption" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      Precio (CLP)
                    </label>
                  </div>
                  <IonInput 
                    inputmode="decimal" 
                    type="number" 
                    value={price} 
                    onIonChange={e => setPrice(e.detail.value as string)} 
                    placeholder="Ej: 15000"
                    className="input-modern"
                    style={{
                      '--background': 'var(--bg-elevated)',
                      '--border-radius': '14px',
                      '--padding-start': '20px',
                      '--padding-end': '20px',
                    }}
                  />
                  <p className="caption" style={{ marginTop: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                    Opcional. Puedes dejarlo vacío si se acuerda luego.
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <IonIcon icon={timeOutline} style={{ fontSize: 20, color: 'var(--color-primary-600)' }} />
                    <label className="caption" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      Duración (minutos)
                    </label>
                  </div>
                  <IonInput 
                    inputmode="numeric" 
                    type="number" 
                    value={duration} 
                    onIonChange={e => setDuration(e.detail.value as string)} 
                    placeholder="Ej: 60"
                    className="input-modern"
                    style={{
                      '--background': 'var(--bg-elevated)',
                      '--border-radius': '14px',
                      '--padding-start': '20px',
                      '--padding-end': '20px',
                    }}
                  />
                  <p className="caption" style={{ marginTop: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                    Opcional. Si no lo especificas, se usa la duración del servicio base.
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <IonIcon icon={locationOutline} style={{ fontSize: 20, color: 'var(--color-primary-600)' }} />
                    <label className="caption" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      Ubicación*
                    </label>
                  </div>
                  <select
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      fontSize: '16px',
                      border: '1px solid var(--color-gray-300)',
                      borderRadius: '14px',
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary-500)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--color-gray-300)'}
                  >
                    <option value="Universidad">Universidad</option>
                    <option value="Laboratorio">Laboratorio</option>
                  </select>
                  <p className="caption" style={{ marginTop: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                    Indica dónde se realizará el servicio.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sección interactiva: disponibilidad por día (1 rango) */}
          <motion.div variants={fadeInUp}>
            <div className="floating-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <IonIcon icon={calendarOutline} style={{ fontSize: 24, color: 'var(--color-primary-600)' }} />
                <h3 className="heading-md" style={{ margin: 0 }}>Disponibilidad por día</h3>
              </div>
              <div className="stack-modern" style={{ gap: 'var(--space-3)' }}>
                {Array.from({ length: 7 }).map((_, idx) => idx).filter((d) => d !== 0).map((idx) => { // ocultar Domingo (0)
                  const st = days[idx] || { enabled: false, start: '09:00', end: '17:00' };
                  const enabled = !!st.enabled;
                  const bgColor = enabled ? 'var(--gradient-primary-soft)' : 'var(--bg-tertiary)';
                  const borderColor = enabled ? 'var(--color-primary-300)' : 'var(--color-gray-300)';
                  const textColor = enabled ? 'var(--color-primary-700)' : 'var(--text-secondary)';
                  return (
                    <div key={idx} style={{ border: `2px solid ${borderColor}`, background: bgColor, borderRadius: 14, padding: 'var(--space-4)', transition: 'all 0.3s ease' }}>
                      <div
                        role="button"
                        onClick={() => toggleDayEnabled(idx, !enabled)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 'var(--space-3)',
                          width: '100%',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <IonIcon icon={enabled ? checkmarkCircleOutline : closeCircleOutline} style={{ fontSize: 24, color: textColor }} />
                          <strong className="body-md" style={{ color: textColor }}>{WEEKDAYS[idx]}</strong>
                        </div>
                        <span className="caption" style={{ color: textColor, fontWeight: 500 }}>{enabled ? 'Habilitado' : 'Deshabilitado'}</span>
                      </div>
                      {enabled && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                          <span className="caption" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Desde</span>
                          <input 
                            style={{ 
                              height: 40, 
                              width: 110, 
                              padding: '8px 12px', 
                              borderRadius: '12px', 
                              border: '2px solid var(--color-gray-300)', 
                              fontSize: '14px',
                              fontFamily: 'var(--font-primary)'
                            }} 
                            type="time" 
                            value={st.start} 
                            onChange={(ev) => {
                            const val = (ev.target as HTMLInputElement).value;
                            setDays(prev => ({ ...prev, [idx]: { ...st, start: val, enabled: true } }));
                            setDayErrors(prev => ({ ...prev, [idx]: '' }));
                          }} 
                          />
                          <span className="body-md" style={{ color: 'var(--text-secondary)' }}>–</span>
                          <span className="caption" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Hasta</span>
                          <input 
                            style={{ 
                              height: 40, 
                              width: 110, 
                              padding: '8px 12px', 
                              borderRadius: '12px', 
                              border: '2px solid var(--color-gray-300)', 
                              fontSize: '14px',
                              fontFamily: 'var(--font-primary)'
                            }} 
                            type="time" 
                            value={st.end} 
                            onChange={(ev) => {
                            const val = (ev.target as HTMLInputElement).value;
                            setDays(prev => ({ ...prev, [idx]: { ...st, end: val, enabled: true } }));
                            setDayErrors(prev => ({ ...prev, [idx]: '' }));
                          }} 
                          />
                        </div>
                      )}
                      {savingDay === idx && <div className="caption" style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>Guardando…</div>}
                      {!!dayErrors[idx] && <div className="caption" style={{ color: 'var(--color-error)', marginTop: 'var(--space-2)' }}>{dayErrors[idx]}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Footer con botones */}
      <div style={{ borderTop: '1px solid #e5e7eb', padding: 'var(--space-4)', background: 'white', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        {mode === 'edit' && (
          <button
            className="btn-modern-secondary"
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={submitting || deleting}
            style={{ flex: '0 0 auto', background: 'var(--color-error)', color: 'white' }}
          >
            <IonIcon icon={trashOutline} style={{ marginRight: 8 }} />
            Eliminar
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button
          className="btn-modern-primary"
          style={{ flex: '1 1 200px' }}
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <IonSpinner name="dots" style={{ width: 20, height: 20 }} />
              <span>Guardando...</span>
            </>
          ) : (
            <span>{mode === 'edit' ? 'Actualizar servicio' : 'Guardar servicio'}</span>
          )}
        </button>
      </div>
      <IonAlert
        isOpen={deleteConfirmOpen}
        header="Eliminar servicio"
        message="¿Deseas eliminar este servicio? Esta acción no se puede deshacer."
        onDidDismiss={() => setDeleteConfirmOpen(false)}
        buttons={[
          { text: 'Cancelar', role: 'cancel' },
          {
            text: deleting ? 'Eliminando...' : 'Eliminar',
            role: 'destructive',
            handler: () => onDelete()
          }
        ]}
      />
      </IonContent>
    </IonModal>
  );
}
