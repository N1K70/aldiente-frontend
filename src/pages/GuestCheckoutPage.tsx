import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  IonPage,
  IonContent,
  IonIcon,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  calendarOutline,
  timeOutline,
  personOutline,
  mailOutline,
  callOutline,
  checkmarkCircleOutline,
  arrowBackOutline,
  arrowForwardOutline,
  locationOutline,
  pricetagOutline,
  schoolOutline,
  sparklesOutline,
  medkitOutline,
  flashOutline,
  searchOutline,
  navigateOutline,
} from 'ionicons/icons';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import CustomDatePicker from '../components/CustomDatePicker';
import TimeSlotPicker from '../components/TimeSlotPicker';
import './GuestCheckoutPage.css';

interface University {
  id: string;
  name: string;
  city?: string;
}

interface StudentService {
  id: string;
  student_id: string;
  service_name: string;
  student_name: string;
  student_university?: string;
  university_name?: string;
  price: number;
  duration?: number;
  description?: string;
  location?: string;
  estimated_duration?: number;
}

interface AvailabilityItem {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

// Servicios gancho predefinidos
const HOOK_SERVICES = [
  { key: 'limpieza', name: 'Limpieza Dental', icon: sparklesOutline, description: 'Limpieza profesional para una sonrisa brillante' },
  { key: 'revision', name: 'Revisión General', icon: searchOutline, description: 'Chequeo completo de tu salud bucal' },
  { key: 'urgencia', name: 'Urgencia Dental', icon: flashOutline, description: 'Atención rápida para molestias o dolor' },
];

type Step = 'location' | 'service' | 'datetime' | 'checkout' | 'success';

const GuestCheckoutPage: React.FC = () => {
  // Estado del wizard
  const [currentStep, setCurrentStep] = useState<Step>('location');
  
  // Universidad seleccionada
  const [universities, setUniversities] = useState<University[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(true);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  
  // Servicio gancho seleccionado
  const [selectedHookService, setSelectedHookService] = useState<string | null>(null);
  
  // Datos de servicios
  const [services, setServices] = useState<StudentService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedService, setSelectedService] = useState<StudentService | null>(null);
  
  // Disponibilidad y fecha/hora
  const [availability, setAvailability] = useState<AvailabilityItem[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  // Datos del checkout
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  
  // Estado de envío
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  // Cargar universidades
  useEffect(() => {
    const loadUniversities = async () => {
      try {
        setLoadingUniversities(true);
        const res = await axios.get(`${BACKEND_URL}/api/universities`);
        setUniversities(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error cargando universidades:', err);
        setUniversities([]);
      } finally {
        setLoadingUniversities(false);
      }
    };
    loadUniversities();
  }, []);

  // Cargar servicios cuando se selecciona universidad y servicio gancho
  useEffect(() => {
    if (!selectedUniversity || !selectedHookService) {
      setServices([]);
      return;
    }
    
    const loadServices = async () => {
      try {
        setLoadingServices(true);
        const res = await axios.get(`${BACKEND_URL}/api/public/services`, {
          params: { university: selectedUniversity.name }
        });
        const allServices = Array.isArray(res.data) ? res.data : [];
        
        // Filtrar servicios que coincidan con el tipo seleccionado
        const filtered = allServices.filter((s: StudentService) => {
          const serviceName = s.service_name?.toLowerCase() || '';
          if (selectedHookService === 'limpieza') {
            return serviceName.includes('limpieza') || serviceName.includes('profilaxis') || serviceName.includes('destartraje');
          } else if (selectedHookService === 'revision') {
            return serviceName.includes('revision') || serviceName.includes('examen') || serviceName.includes('diagnóstico') || serviceName.includes('diagnostico') || serviceName.includes('ingreso');
          } else if (selectedHookService === 'urgencia') {
            return serviceName.includes('urgencia') || serviceName.includes('emergencia') || serviceName.includes('dolor') || serviceName.includes('extracción') || serviceName.includes('extraccion');
          }
          return false;
        });
        
        // Si no hay servicios filtrados, mostrar todos los disponibles
        setServices(filtered.length > 0 ? filtered : allServices);
      } catch (err) {
        console.error('Error cargando servicios:', err);
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    };
    loadServices();
  }, [selectedUniversity, selectedHookService]);

  // Cargar disponibilidad cuando se selecciona un servicio
  useEffect(() => {
    if (!selectedService) {
      setAvailability([]);
      return;
    }
    
    const loadAvailability = async () => {
      try {
        setLoadingAvailability(true);
        const res = await axios.get(
          `${BACKEND_URL}/api/student-services/${selectedService.id}/availabilities`
        );
        const responseData = res.data as AvailabilityItem[] | { availabilities?: AvailabilityItem[] };
        const data: AvailabilityItem[] = Array.isArray(responseData) ? responseData : (responseData?.availabilities ?? []);
        setAvailability(data);
      } catch (err) {
        console.error('Error cargando disponibilidad:', err);
        setAvailability([]);
      } finally {
        setLoadingAvailability(false);
      }
    };
    loadAvailability();
  }, [selectedService]);

  // Días permitidos según disponibilidad
  const allowedWeekdays = useMemo<Set<number>>(() => {
    return new Set((availability || []).map(a => a.day_of_week));
  }, [availability]);

  const isDateEnabled = useCallback((iso: string) => {
    try {
      const d = new Date(`${iso}T12:00:00`);
      const w = d.getDay();
      if (w === 0) return false;
      return allowedWeekdays.has(w);
    } catch {
      return true;
    }
  }, [allowedWeekdays]);

  // Fechas disponibles para el picker
  const availableDatesArray = useMemo((): string[] => {
    if (!availability?.length) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates: string[] = [];
    
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

  // Horarios disponibles para la fecha seleccionada
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

  // Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    const date = new Date(`${dateStr}T12:00:00`);
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  // Validar email
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Manejar selección de universidad
  const handleSelectUniversity = (university: University) => {
    setSelectedUniversity(university);
    setCurrentStep('service');
  };

  // Manejar selección de servicio gancho
  const handleSelectHookService = (hookKey: string) => {
    setSelectedHookService(hookKey);
  };

  // Manejar selección de servicio específico
  const handleSelectService = (service: StudentService) => {
    setSelectedService(service);
    setSelectedDate('');
    setSelectedTime('');
    setCurrentStep('datetime');
  };

  // Manejar siguiente paso desde datetime
  const handleDateTimeNext = () => {
    if (selectedDate && selectedTime) {
      setCurrentStep('checkout');
    }
  };

  // Manejar envío del checkout
  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !name || !email) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Por favor ingresa un email válido.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const scheduledAt = `${selectedDate}T${selectedTime}:00`;
      
      const res = await axios.post(`${BACKEND_URL}/api/guest-checkout`, {
        student_service_id: selectedService.id,
        scheduled_at: scheduledAt,
        notes: notes || null,
        name,
        email,
        phone: phone || null,
      });

      setSuccessData(res.data);
      setCurrentStep('success');
    } catch (err: any) {
      console.error('Error en checkout:', err);
      setError(err.response?.data?.message || 'Error al procesar la reserva. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Volver al paso anterior
  const goBack = () => {
    if (currentStep === 'service') {
      setCurrentStep('location');
      setSelectedUniversity(null);
      setSelectedHookService(null);
    } else if (currentStep === 'datetime') {
      setCurrentStep('service');
      setSelectedService(null);
    } else if (currentStep === 'checkout') {
      setCurrentStep('datetime');
    }
  };

  // Reiniciar flujo
  const resetFlow = () => {
    setCurrentStep('location');
    setSelectedUniversity(null);
    setSelectedHookService(null);
    setSelectedService(null);
    setSelectedDate('');
    setSelectedTime('');
    setName('');
    setEmail('');
    setPhone('');
    setNotes('');
    setSuccessData(null);
    setError(null);
  };

  // Agrupar servicios por tipo
  const groupedServices = useMemo(() => {
    const groups: Record<string, StudentService[]> = {};
    services.forEach(s => {
      const key = s.service_name || 'Otros';
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return groups;
  }, [services]);

  return (
    <IonPage>
      <IonContent className="guest-checkout-content">
        {/* Header */}
        <div className="guest-checkout-header">
          <div className="header-container">
            <div className="header-logo">
              <img src="/assets/images/LOGO_ALDIENTE_SINFONDO.png" alt="ALDIENTE" />
              <span>ALDIENTE</span>
            </div>
            
            {/* Progress Steps */}
            {currentStep !== 'success' && (
              <div className="progress-steps">
                <div className={`step ${currentStep === 'location' ? 'active' : ''} ${['service', 'datetime', 'checkout'].includes(currentStep) ? 'completed' : ''}`}>
                  <div className="step-number">1</div>
                  <span>Ubicación</span>
                </div>
                <div className="step-line"></div>
                <div className={`step ${currentStep === 'service' ? 'active' : ''} ${['datetime', 'checkout'].includes(currentStep) ? 'completed' : ''}`}>
                  <div className="step-number">2</div>
                  <span>Servicio</span>
                </div>
                <div className="step-line"></div>
                <div className={`step ${currentStep === 'datetime' ? 'active' : ''} ${currentStep === 'checkout' ? 'completed' : ''}`}>
                  <div className="step-number">3</div>
                  <span>Fecha</span>
                </div>
                <div className="step-line"></div>
                <div className={`step ${currentStep === 'checkout' ? 'active' : ''}`}>
                  <div className="step-number">4</div>
                  <span>Datos</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="guest-checkout-body">
          <AnimatePresence mode="wait">
            {/* PASO 1: Selección de ubicación/universidad */}
            {currentStep === 'location' && (
              <motion.div
                key="location"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="step-container"
              >
                <div className="step-header">
                  <h1>¿De dónde eres?</h1>
                  <p>Selecciona la universidad más cercana a ti</p>
                </div>

                {loadingUniversities ? (
                  <div className="loading-container">
                    <IonSpinner color="primary" />
                    <p>Cargando universidades...</p>
                  </div>
                ) : universities.length === 0 ? (
                  <div className="empty-state">
                    <IonIcon icon={schoolOutline} />
                    <h3>No hay universidades disponibles</h3>
                    <p>Por el momento no hay universidades registradas.</p>
                  </div>
                ) : (
                  <div className="university-grid">
                    {universities.map((university) => (
                      <motion.div
                        key={university.id}
                        className="university-card"
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectUniversity(university)}
                      >
                        <div className="university-icon">
                          <IonIcon icon={schoolOutline} />
                        </div>
                        <div className="university-info">
                          <h4>{university.name}</h4>
                          {university.city && <p>{university.city}</p>}
                        </div>
                        <IonIcon icon={arrowForwardOutline} className="university-arrow" />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* PASO 2: Selección de servicio */}
            {currentStep === 'service' && selectedUniversity && (
              <motion.div
                key="service"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="step-container"
              >
                <button className="back-button" onClick={goBack}>
                  <IonIcon icon={arrowBackOutline} />
                  <span>Volver</span>
                </button>

                <div className="step-header">
                  <h1>¿Qué necesitas?</h1>
                  <p>Selecciona el tipo de atención que buscas</p>
                </div>

                {/* Universidad seleccionada */}
                <div className="selected-university-badge">
                  <IonIcon icon={locationOutline} />
                  <span>{selectedUniversity.name}</span>
                </div>

                {/* Servicios gancho */}
                <div className="hook-services-grid">
                  {HOOK_SERVICES.map((hook) => (
                    <motion.div
                      key={hook.key}
                      className={`hook-service-card ${selectedHookService === hook.key ? 'selected' : ''}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectHookService(hook.key)}
                    >
                      <div className="hook-icon">
                        <IonIcon icon={hook.icon} />
                      </div>
                      <h4>{hook.name}</h4>
                      <p>{hook.description}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Lista de profesionales disponibles */}
                {selectedHookService && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="professionals-section"
                  >
                    <h3>Profesionales disponibles</h3>
                    
                    {loadingServices ? (
                      <div className="loading-container small">
                        <IonSpinner color="primary" />
                        <p>Buscando profesionales...</p>
                      </div>
                    ) : services.length === 0 ? (
                      <div className="empty-state small">
                        <p>No hay profesionales disponibles para este servicio en esta universidad.</p>
                      </div>
                    ) : (
                      <div className="professionals-list">
                        {services.map((service) => (
                          <motion.div
                            key={service.id}
                            className="professional-card"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => handleSelectService(service)}
                          >
                            <div className="professional-avatar">
                              {service.student_name?.charAt(0) || 'P'}
                            </div>
                            <div className="professional-info">
                              <h4>{service.student_name}</h4>
                              <p className="service-type">{service.service_name}</p>
                              <p className="university-name">
                                <IonIcon icon={schoolOutline} />
                                {service.student_university || selectedUniversity.name}
                              </p>
                            </div>
                            <div className="professional-price">
                              <span className="price">{service.price ? formatPrice(service.price) : 'Consultar'}</span>
                              <IonIcon icon={arrowForwardOutline} />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* PASO 2: Selección de fecha y hora */}
            {currentStep === 'datetime' && selectedService && (
              <motion.div
                key="datetime"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="step-container"
              >
                <button className="back-button" onClick={goBack}>
                  <IonIcon icon={arrowBackOutline} />
                  <span>Volver</span>
                </button>

                <div className="step-header">
                  <h1>Elige fecha y hora</h1>
                  <p>Selecciona cuándo te gustaría agendar tu cita</p>
                </div>

                {/* Resumen del servicio seleccionado */}
                <div className="selected-service-summary">
                  <div className="summary-icon">
                    <IonIcon icon={pricetagOutline} />
                  </div>
                  <div className="summary-info">
                    <h4>{selectedService.service_name}</h4>
                    <p>con {selectedService.student_name}</p>
                  </div>
                  <div className="summary-price">
                    {selectedService.price ? formatPrice(selectedService.price) : 'Consultar'}
                  </div>
                </div>

                <div className="datetime-container">
                  <div className="date-section">
                    <h3>
                      <IonIcon icon={calendarOutline} />
                      Fecha
                    </h3>
                    {loadingAvailability ? (
                      <div className="loading-container small">
                        <IonSpinner color="primary" />
                        <p>Cargando disponibilidad...</p>
                      </div>
                    ) : availability.length === 0 ? (
                      <div className="empty-state small">
                        <p>Este servicio no tiene horarios configurados.</p>
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
                        minDate={new Date().toISOString().split('T')[0]}
                      />
                    )}
                  </div>

                  {selectedDate && (
                    <motion.div 
                      className="time-section"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <h3>
                        <IonIcon icon={timeOutline} />
                        Hora
                      </h3>
                      <TimeSlotPicker
                        availableTimes={availableTimesForSelectedDate}
                        selectedTime={selectedTime}
                        onTimeChange={setSelectedTime}
                        loading={loadingAvailability}
                      />
                    </motion.div>
                  )}
                </div>

                {selectedDate && selectedTime && (
                  <motion.div 
                    className="datetime-footer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="selection-summary">
                      <IonIcon icon={checkmarkCircleOutline} />
                      <span>{formatDate(selectedDate)} a las {selectedTime}</span>
                    </div>
                    <button className="primary-button" onClick={handleDateTimeNext}>
                      Continuar
                      <IonIcon icon={arrowForwardOutline} />
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* PASO 3: Checkout - Datos del usuario */}
            {currentStep === 'checkout' && selectedService && (
              <motion.div
                key="checkout"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="step-container checkout-step"
              >
                <button className="back-button" onClick={goBack}>
                  <IonIcon icon={arrowBackOutline} />
                  <span>Volver</span>
                </button>

                <div className="step-header">
                  <h1>Completa tu reserva</h1>
                  <p>Solo necesitamos algunos datos para confirmar tu cita</p>
                </div>

                <div className="checkout-layout">
                  {/* Formulario */}
                  <div className="checkout-form">
                    <div className="form-group">
                      <label>
                        <IonIcon icon={personOutline} />
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu nombre"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <IonIcon icon={mailOutline} />
                        Email *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        required
                      />
                      <span className="form-hint">Te enviaremos la confirmación aquí</span>
                    </div>

                    <div className="form-group">
                      <label>
                        <IonIcon icon={callOutline} />
                        WhatsApp (opcional)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+56 9 1234 5678"
                      />
                      <span className="form-hint">Para recordatorios y coordinación</span>
                    </div>

                    <div className="form-group">
                      <label>Notas adicionales (opcional)</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="¿Algo que debamos saber?"
                        rows={3}
                      />
                    </div>

                    {error && (
                      <div className="error-message">
                        <IonText color="danger">{error}</IonText>
                      </div>
                    )}

                    <button 
                      className="submit-button"
                      onClick={handleSubmit}
                      disabled={submitting || !name || !email}
                    >
                      {submitting ? (
                        <>
                          <IonSpinner name="crescent" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          Confirmar reserva
                          <IonIcon icon={checkmarkCircleOutline} />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Resumen de la reserva */}
                  <div className="checkout-summary">
                    <h3>Resumen de tu cita</h3>
                    
                    <div className="summary-card">
                      <div className="summary-item">
                        <span className="label">Servicio</span>
                        <span className="value">{selectedService.service_name}</span>
                      </div>
                      
                      <div className="summary-item">
                        <span className="label">Profesional</span>
                        <span className="value">{selectedService.student_name}</span>
                      </div>
                      
                      <div className="summary-item">
                        <span className="label">Fecha</span>
                        <span className="value">{formatDate(selectedDate)}</span>
                      </div>
                      
                      <div className="summary-item">
                        <span className="label">Hora</span>
                        <span className="value">{selectedTime}</span>
                      </div>
                      
                      {selectedService.location && (
                        <div className="summary-item">
                          <span className="label">Ubicación</span>
                          <span className="value">{selectedService.location}</span>
                        </div>
                      )}
                      
                      <div className="summary-divider"></div>
                      
                      <div className="summary-item total">
                        <span className="label">Total</span>
                        <span className="value">
                          {selectedService.price ? formatPrice(selectedService.price) : 'A convenir'}
                        </span>
                      </div>
                    </div>

                    <p className="summary-note">
                      El pago se realiza directamente con el profesional el día de la cita.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PASO 4: Éxito */}
            {currentStep === 'success' && successData && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="step-container success-step"
              >
                <div className="success-content">
                  <motion.div 
                    className="success-icon"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                  >
                    <IonIcon icon={checkmarkCircleOutline} />
                  </motion.div>

                  <h1>¡Reserva confirmada!</h1>
                  <p>Tu cita ha sido agendada exitosamente</p>

                  <div className="success-details">
                    <div className="detail-item">
                      <span className="label">Servicio</span>
                      <span className="value">{successData.appointment?.service_name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Fecha y hora</span>
                      <span className="value">
                        {successData.appointment?.scheduled_at && 
                          new Date(successData.appointment.scheduled_at).toLocaleString('es-CL', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        }
                      </span>
                    </div>
                    {successData.appointment?.price && (
                      <div className="detail-item">
                        <span className="label">Precio</span>
                        <span className="value">{formatPrice(successData.appointment.price)}</span>
                      </div>
                    )}
                  </div>

                  <div className="success-message">
                    <IonIcon icon={mailOutline} />
                    <p>
                      Hemos enviado los detalles de tu cita a <strong>{successData.user?.email}</strong>.
                      {successData.user?.is_new && (
                        <> También recibirás un enlace para crear tu contraseña y acceder a tu cuenta.</>
                      )}
                    </p>
                  </div>

                  <div className="success-actions">
                    <button className="secondary-button" onClick={resetFlow}>
                      Hacer otra reserva
                    </button>
                    <a href="/login" className="primary-button">
                      Ir a mi cuenta
                      <IonIcon icon={arrowForwardOutline} />
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default GuestCheckoutPage;
