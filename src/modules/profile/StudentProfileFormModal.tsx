import React, { useCallback, useEffect, useState } from 'react';
import {
  IonInput,
  IonTextarea,
  IonSpinner,
  IonToast,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
} from '@ionic/react';
import { personOutline, schoolOutline, calendarOutline, locationOutline, ribbonOutline, documentTextOutline } from 'ionicons/icons';
import { motion } from 'framer-motion';
import { StudentProfile } from './types';
import { updateStudentProfile } from './profile.api';
import { fadeInUp, staggerContainer } from '../../utils/animations';
import '../../theme/modern-design.css';

interface Props {
  isOpen: boolean;
  studentId: string | number;
  onDismiss: () => void;
  onSaved: (profile: StudentProfile) => void;
  mode?: 'create' | 'edit';
  initial?: Partial<StudentProfile> | null;
  originElement?: HTMLElement | null;
}

export default function StudentProfileFormModal({ isOpen, studentId, onDismiss, onSaved, mode = 'create', initial = null, originElement }: Props) {
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('');
  const [careerYear, setCareerYear] = useState<string>('');
  const [universityLocation, setUniversityLocation] = useState('');
  const [alternativeLocation, setAlternativeLocation] = useState('');
  const [certifications, setCertifications] = useState('');
  const [bio, setBio] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successToastOpen, setSuccessToastOpen] = useState(false);

  useEffect(() => {
    if (isOpen && initial) {
      setFullName((initial.fullName as any) || '');
      setUniversity((initial.university as any) || '');
      setCareerYear(
        initial.careerYear === 0 || initial.careerYear ? String(initial.careerYear) : ''
      );
      // Separar location en dos campos si viene con separador
      const loc = (initial.location as any) || '';
      if (loc.includes(' | ')) {
        const [uniLoc, altLoc] = loc.split(' | ');
        setUniversityLocation(uniLoc || '');
        setAlternativeLocation(altLoc || '');
      } else {
        setUniversityLocation(loc);
        setAlternativeLocation('');
      }
      setCertifications((initial.certifications as any) || '');
      setBio((initial.bio as any) || '');
      setError('');
    } else if (isOpen && mode === 'create') {
      reset();
    }
  }, [isOpen, initial, mode]);

  const reset = () => {
    setFullName('');
    setUniversity('');
    setCareerYear('');
    setUniversityLocation('');
    setAlternativeLocation('');
    setCertifications('');
    setBio('');
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
    // Validación simple
    if (!fullName || !university) {
      setError('Completa nombre completo y universidad');
      return;
    }
    const cy = careerYear ? Number(careerYear) : undefined;
    if (careerYear && (isNaN(cy as number) || (cy as number) < 0)) {
      setError('Año de carrera inválido');
      return;
    }

    setSubmitting(true);
    try {
      // Combinar las ubicaciones en un solo campo separado por " | "
      let combinedLocation = universityLocation.trim();
      if (alternativeLocation.trim()) {
        combinedLocation += ` | ${alternativeLocation.trim()}`;
      }
      
      const payload = {
        fullName,
        university,
        careerYear: cy as any,
        location: combinedLocation || undefined,
        certifications: certifications || undefined,
        bio: bio || undefined,
      };
      // El backend expone sólo PUT (upsert sobre students)
      const saved = await updateStudentProfile(studentId, payload);
      onSaved(saved);
      setSuccessToastOpen(true);
    } catch (e: any) {
      const status = e?.response?.status;
      const serverMsg = e?.response?.data?.message || e?.response?.data?.error;
      const msg = status === 401
        ? 'Sesión expirada o inválida. Inicia sesión nuevamente.'
        : status === 403
          ? 'No autorizado para actualizar este perfil.'
          : status === 400
            ? (serverMsg || 'Solicitud inválida. Revisa los campos e intenta nuevamente.')
            : (serverMsg || e?.message || 'No se pudo guardar el perfil');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [studentId, fullName, university, careerYear, universityLocation, alternativeLocation, certifications, bio, onSaved, onDismiss]);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{mode === 'edit' ? 'Editar perfil' : 'Completar perfil'}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleClose} disabled={submitting}>
              Cerrar
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
      <div style={{ background: 'var(--bg-secondary)', minHeight: '300px' }}>
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          style={{ padding: 'var(--space-6)' }}
        >
          {error && (
            <motion.div variants={fadeInUp}>
              <div className="floating-card" style={{ background: 'var(--gradient-primary-soft)', border: '1px solid var(--color-error)', marginBottom: 'var(--space-6)' }}>
                <p className="body-md" style={{ color: 'var(--color-error)', margin: 0 }}>{error}</p>
              </div>
            </motion.div>
          )}

          <motion.div variants={fadeInUp}>
            <div className="floating-card" style={{ marginBottom: 'var(--space-6)' }}>
              <h3 className="heading-md" style={{ marginBottom: 'var(--space-5)' }}>Datos del perfil</h3>
              
              <div className="stack-modern" style={{ gap: 'var(--space-5)' }}>
                {/* Nombre completo */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <IonIcon icon={personOutline} style={{ fontSize: 20, color: 'var(--color-primary-600)' }} />
                    <label className="caption" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Nombre completo*</label>
                  </div>
                  <IonInput
                    value={fullName}
                    onIonChange={e => setFullName(e.detail.value as string)}
                    placeholder="Ej. Juan Pérez"
                    className="input-modern"
                    style={{
                      '--background': 'var(--bg-elevated)',
                      '--border-radius': '14px',
                      '--padding-start': '20px',
                      '--padding-end': '20px',
                    }}
                  />
                </div>

                {/* Universidad */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <IonIcon icon={schoolOutline} style={{ fontSize: 20, color: 'var(--color-primary-600)' }} />
                    <label className="caption" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Universidad*</label>
                  </div>
                  <IonInput
                    value={university}
                    onIonChange={e => setUniversity(e.detail.value as string)}
                    placeholder="Ej. Universidad de Chile"
                    className="input-modern"
                    style={{
                      '--background': 'var(--bg-elevated)',
                      '--border-radius': '14px',
                      '--padding-start': '20px',
                      '--padding-end': '20px',
                    }}
                  />
                </div>

                {/* Año de carrera */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <IonIcon icon={calendarOutline} style={{ fontSize: 20, color: 'var(--color-primary-600)' }} />
                    <label className="caption" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Año de carrera</label>
                  </div>
                  <IonInput
                    inputmode="numeric"
                    type="number"
                    value={careerYear}
                    onIonChange={e => setCareerYear(e.detail.value as string)}
                    placeholder="Ej. 3"
                    className="input-modern"
                    style={{
                      '--background': 'var(--bg-elevated)',
                      '--border-radius': '14px',
                      '--padding-start': '20px',
                      '--padding-end': '20px',
                    }}
                  />
                </div>

                {/* Ubicación de la Universidad */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <IonIcon icon={locationOutline} style={{ fontSize: 20, color: 'var(--color-primary-600)' }} />
                    <label className="caption" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Ubicación de la Universidad</label>
                  </div>
                  <IonInput
                    value={universityLocation}
                    onIonChange={e => setUniversityLocation(e.detail.value as string)}
                    placeholder="Ej. Santiago Centro, Providencia"
                    className="input-modern"
                    style={{
                      '--background': 'var(--bg-elevated)',
                      '--border-radius': '14px',
                      '--padding-start': '20px',
                      '--padding-end': '20px',
                    }}
                  />
                </div>

                {/* Ubicación Alternativa */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <IonIcon icon={locationOutline} style={{ fontSize: 20, color: 'var(--color-primary-600)' }} />
                    <label className="caption" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Ubicación Alternativa (Opcional)</label>
                  </div>
                  <IonInput
                    value={alternativeLocation}
                    onIonChange={e => setAlternativeLocation(e.detail.value as string)}
                    placeholder="Ej. Consulta particular en Las Condes"
                    className="input-modern"
                    style={{
                      '--background': 'var(--bg-elevated)',
                      '--border-radius': '14px',
                      '--padding-start': '20px',
                      '--padding-end': '20px',
                    }}
                  />
                </div>

                {/* Certificaciones */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <IonIcon icon={ribbonOutline} style={{ fontSize: 20, color: 'var(--color-primary-600)' }} />
                    <label className="caption" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Certificaciones</label>
                  </div>
                  <IonTextarea
                    value={certifications}
                    onIonChange={e => setCertifications(e.detail.value as string)}
                    autoGrow
                    rows={2}
                    placeholder="Opcional"
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

                {/* Bio */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <IonIcon icon={documentTextOutline} style={{ fontSize: 20, color: 'var(--color-primary-600)' }} />
                    <label className="caption" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Biografía</label>
                  </div>
                  <IonTextarea
                    value={bio}
                    onIonChange={e => setBio(e.detail.value as string)}
                    autoGrow
                    rows={3}
                    placeholder="Cuéntanos sobre ti"
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
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Footer con botón */}
        <div style={{ borderTop: '1px solid #e5e7eb', padding: 'var(--space-4)', background: 'white' }}>
          <button
            className="btn-modern-primary"
            style={{ width: '100%' }}
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <IonSpinner name="dots" style={{ width: 20, height: 20 }} />
                <span>Guardando...</span>
              </>
            ) : (
              <span>{mode === 'edit' ? 'Actualizar perfil' : 'Guardar perfil'}</span>
            )}
          </button>
        </div>
      </div>
      <IonToast
        isOpen={successToastOpen}
        color="success"
        message={mode === 'edit' ? 'Perfil actualizado' : 'Perfil guardado'}
        duration={1200}
        onDidDismiss={() => { setSuccessToastOpen(false); reset(); onDismiss(); }}
      />
      </IonContent>
    </IonModal>
  );
}
