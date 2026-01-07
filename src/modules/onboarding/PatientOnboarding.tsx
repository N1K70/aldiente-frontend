import React, { useState, useEffect, useCallback } from 'react';
import {
  IonModal,
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
} from '@ionic/react';
import {
  locationOutline,
  navigateOutline,
  schoolOutline,
  checkmarkCircle,
  arrowForwardOutline,
  sparklesOutline,
  heartOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../shared/api/ApiClient';
import { useGeolocation } from '../../shared/hooks/useGeolocation';

export interface University {
  id: string;
  name: string;
  short_name?: string;
  address?: string;
  city: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

interface PatientOnboardingProps {
  isOpen: boolean;
  onComplete: (university: University) => void;
  onSkip?: () => void;
}

const ONBOARDING_KEY = 'aldiente_patient_onboarding_completed';
const SELECTED_UNIVERSITY_KEY = 'aldiente_selected_university';

// Hook para verificar si el onboarding fue completado
export function usePatientOnboarding() {
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    const savedUni = localStorage.getItem(SELECTED_UNIVERSITY_KEY);
    
    if (!completed) {
      setNeedsOnboarding(true);
    } else if (savedUni) {
      try {
        setSelectedUniversity(JSON.parse(savedUni));
      } catch {}
    }
  }, []);

  const completeOnboarding = useCallback((university: University) => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    localStorage.setItem(SELECTED_UNIVERSITY_KEY, JSON.stringify(university));
    setSelectedUniversity(university);
    setNeedsOnboarding(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    localStorage.removeItem(SELECTED_UNIVERSITY_KEY);
    setSelectedUniversity(null);
    setNeedsOnboarding(true);
  }, []);

  const updateUniversity = useCallback((university: University) => {
    localStorage.setItem(SELECTED_UNIVERSITY_KEY, JSON.stringify(university));
    setSelectedUniversity(university);
  }, []);

  return {
    needsOnboarding,
    selectedUniversity,
    completeOnboarding,
    resetOnboarding,
    updateUniversity,
  };
}

const PatientOnboarding: React.FC<PatientOnboardingProps> = ({
  isOpen,
  onComplete,
}) => {
  const [step, setStep] = useState(0);
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    latitude,
    longitude,
    loading: geoLoading,
    error: geoError,
    permissionDenied,
    hasLocation,
    requestLocation,
  } = useGeolocation();

  // Cargar universidades cercanas
  const loadNearbyUniversities = useCallback(async () => {
    if (!latitude || !longitude) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.get<University[]>('/api/universities/nearby', {
        params: { lat: latitude, lng: longitude, limit: 10 },
      });
      setUniversities(res.data);
    } catch (e: any) {
      setError('No se pudieron cargar las universidades.');
      // Fallback: cargar todas
      loadAllUniversities();
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude]);

  // Cargar todas las universidades
  const loadAllUniversities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get<University[]>('/api/universities');
      setUniversities(res.data);
    } catch (e: any) {
      setError('No se pudieron cargar las universidades.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (step === 2) {
      if (hasLocation) {
        loadNearbyUniversities();
      } else {
        loadAllUniversities();
      }
    }
  }, [step, hasLocation, loadNearbyUniversities, loadAllUniversities]);

  useEffect(() => {
    if (hasLocation && step === 2) {
      loadNearbyUniversities();
    }
  }, [hasLocation, step, loadNearbyUniversities]);

  const formatDistance = (distance?: number) => {
    if (distance === undefined) return null;
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  };

  const handleComplete = () => {
    if (selectedUniversity) {
      onComplete(selectedUniversity);
    }
  };

  const steps = [
    // Paso 0: Bienvenida
    {
      title: '¡Bienvenido a ALDIENTE!',
      subtitle: 'Tu plataforma para encontrar servicios odontológicos de calidad',
      content: (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            style={{
              width: 120,
              height: 120,
              margin: '0 auto 24px',
              background: 'linear-gradient(135deg, #a11b21 0%, #d4373f 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IonIcon icon={sparklesOutline} style={{ fontSize: 56, color: 'white' }} />
          </motion.div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
              <div style={{
                width: 48,
                height: 48,
                background: '#e8f5e9',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <IonIcon icon={shieldCheckmarkOutline} style={{ fontSize: 24, color: '#2e7d32' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>Estudiantes verificados</p>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Todos nuestros profesionales son estudiantes certificados</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
              <div style={{
                width: 48,
                height: 48,
                background: '#fce4ec',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <IonIcon icon={heartOutline} style={{ fontSize: 24, color: '#c2185b' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>Precios accesibles</p>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Tratamientos de calidad a precios justos</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    // Paso 1: Solicitar ubicación
    {
      title: 'Encuentra tu universidad cercana',
      subtitle: 'Permite el acceso a tu ubicación para mostrarte las opciones más cercanas',
      content: (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            style={{
              width: 120,
              height: 120,
              margin: '0 auto 24px',
              background: hasLocation 
                ? 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)'
                : 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IonIcon 
              icon={hasLocation ? checkmarkCircle : locationOutline} 
              style={{ fontSize: 56, color: 'white' }} 
            />
          </motion.div>

          {!hasLocation && !geoLoading && (
            <>
              <p style={{ color: '#64748b', marginBottom: 24 }}>
                Tu ubicación nos ayuda a encontrar la universidad más cercana donde puedes atenderte.
              </p>
              <IonButton
                expand="block"
                onClick={requestLocation}
                style={{
                  '--background': 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                  '--border-radius': '12px',
                  height: 52,
                }}
              >
                <IonIcon icon={navigateOutline} slot="start" />
                Permitir acceso a ubicación
              </IonButton>
              {permissionDenied && (
                <IonText color="warning" style={{ display: 'block', marginTop: 12, fontSize: 13 }}>
                  {geoError}
                </IonText>
              )}
              <IonButton
                fill="clear"
                expand="block"
                onClick={() => setStep(2)}
                style={{ marginTop: 12 }}
              >
                Continuar sin ubicación
              </IonButton>
            </>
          )}

          {geoLoading && (
            <div style={{ padding: 20 }}>
              <IonSpinner color="primary" />
              <p style={{ marginTop: 12, color: '#666' }}>Obteniendo tu ubicación...</p>
            </div>
          )}

          {hasLocation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div style={{
                background: '#e8f5e9',
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
              }}>
                <IonIcon icon={checkmarkCircle} style={{ color: '#4caf50', fontSize: 24 }} />
                <p style={{ margin: '8px 0 0', color: '#2e7d32', fontWeight: 500 }}>
                  ¡Ubicación obtenida correctamente!
                </p>
              </div>
            </motion.div>
          )}
        </div>
      ),
    },
    // Paso 2: Seleccionar universidad
    {
      title: 'Selecciona tu universidad',
      subtitle: hasLocation 
        ? 'Ordenadas por cercanía a tu ubicación' 
        : 'Elige donde deseas atenderte',
      content: (
        <div style={{ padding: '10px 0' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <IonSpinner color="primary" />
              <p style={{ marginTop: 12, color: '#666' }}>Cargando universidades...</p>
            </div>
          )}

          {error && !loading && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <IonText color="danger">{error}</IonText>
              <IonButton fill="clear" onClick={loadAllUniversities} style={{ marginTop: 8 }}>
                Reintentar
              </IonButton>
            </div>
          )}

          {!loading && !error && (
            <div style={{ maxHeight: 350, overflowY: 'auto' }}>
              {universities.map((uni, index) => (
                <motion.div
                  key={uni.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedUniversity(uni)}
                  style={{
                    padding: 16,
                    marginBottom: 8,
                    borderRadius: 12,
                    border: selectedUniversity?.id === uni.id 
                      ? '2px solid #a11b21' 
                      : '1px solid #e2e8f0',
                    background: selectedUniversity?.id === uni.id 
                      ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
                      : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      background: selectedUniversity?.id === uni.id 
                        ? 'linear-gradient(135deg, #a11b21 0%, #d4373f 100%)'
                        : '#f1f5f9',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <IonIcon 
                        icon={schoolOutline} 
                        style={{ 
                          fontSize: 22, 
                          color: selectedUniversity?.id === uni.id ? 'white' : '#64748b' 
                        }} 
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        margin: 0, 
                        fontWeight: 600, 
                        color: '#1e293b',
                        fontSize: 15,
                      }}>
                        {uni.name}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
                        {uni.city}
                        {uni.distance !== undefined && (
                          <span style={{ 
                            marginLeft: 8, 
                            color: '#a11b21', 
                            fontWeight: 500 
                          }}>
                            • {formatDistance(uni.distance)}
                          </span>
                        )}
                      </p>
                    </div>
                    {selectedUniversity?.id === uni.id && (
                      <IonIcon 
                        icon={checkmarkCircle} 
                        style={{ fontSize: 24, color: '#a11b21' }} 
                      />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ),
    },
  ];

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;
  const canProceed = step === 0 || step === 1 || (step === 2 && selectedUniversity);

  return (
    <IonModal isOpen={isOpen} backdropDismiss={false}>
      <IonContent className="ion-padding">
        <div style={{ 
          minHeight: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          paddingTop: 20,
        }}>
          {/* Progress indicator */}
          <div style={{ 
            display: 'flex', 
            gap: 8, 
            justifyContent: 'center', 
            marginBottom: 32 
          }}>
            {steps.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: idx === step ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: idx <= step 
                    ? 'linear-gradient(135deg, #a11b21 0%, #d4373f 100%)'
                    : '#e2e8f0',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              style={{ flex: 1 }}
            >
              <h2 style={{ 
                textAlign: 'center', 
                margin: '0 0 8px', 
                fontSize: 24, 
                fontWeight: 700,
                color: '#1e293b',
              }}>
                {currentStep.title}
              </h2>
              <p style={{ 
                textAlign: 'center', 
                margin: '0 0 24px', 
                color: '#64748b',
                fontSize: 15,
              }}>
                {currentStep.subtitle}
              </p>
              
              {currentStep.content}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div style={{ marginTop: 'auto', paddingTop: 24 }}>
            {step === 1 && hasLocation && (
              <IonButton
                expand="block"
                onClick={() => setStep(2)}
                style={{
                  '--background': 'linear-gradient(135deg, #a11b21 0%, #d4373f 100%)',
                  '--border-radius': '12px',
                  height: 52,
                }}
              >
                Continuar
                <IonIcon icon={arrowForwardOutline} slot="end" />
              </IonButton>
            )}

            {step === 0 && (
              <IonButton
                expand="block"
                onClick={() => setStep(1)}
                style={{
                  '--background': 'linear-gradient(135deg, #a11b21 0%, #d4373f 100%)',
                  '--border-radius': '12px',
                  height: 52,
                }}
              >
                Comenzar
                <IonIcon icon={arrowForwardOutline} slot="end" />
              </IonButton>
            )}

            {isLastStep && (
              <IonButton
                expand="block"
                onClick={handleComplete}
                disabled={!selectedUniversity}
                style={{
                  '--background': selectedUniversity 
                    ? 'linear-gradient(135deg, #a11b21 0%, #d4373f 100%)'
                    : '#cbd5e1',
                  '--border-radius': '12px',
                  height: 52,
                }}
              >
                <IonIcon icon={checkmarkCircle} slot="start" />
                Comenzar a explorar
              </IonButton>
            )}
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default PatientOnboarding;
