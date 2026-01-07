import React, { useEffect, useMemo, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonText,
} from '@ionic/react';
import { personCircleOutline, mailOutline, logOutOutline, schoolOutline, calendarOutline, keyOutline, locationOutline, heartOutline, documentTextOutline } from 'ionicons/icons';
import { motion } from 'framer-motion';
import { useAuth } from '../../shared/context/AuthContext';
import { useHistory } from 'react-router-dom';
import { api } from '../../shared/api/ApiClient';
import { getStudentProfile } from './profile.api';
import { StudentProfile } from './types';
import StudentProfileFormModal from './StudentProfileFormModal';
import DocumentsSection from '../documents/DocumentsSection';
import PatientProfileFormModal from './PatientProfileFormModal';
import ChangePasswordModal from '../auth/ChangePasswordModal';
import ProfileCompleteness from './ProfileCompleteness';
import { fadeInUp, staggerContainer, listItem, pageTransition } from '../../utils/animations';
import { useModalOrigin } from '../../hooks/useModalOrigin';
import '../../theme/modern-design.css';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const history = useHistory();
  const [fullName, setFullName] = useState<string | null>(null);
  const [details, setDetails] = useState<any>(null);

  const isStudent = user?.role === 'student';

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [documentsCount, setDocumentsCount] = useState(0);
  // Toasts deshabilitados por preferencia UX
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);
  
  // Hooks para capturar el origen de los modales
  const { originElement: studentModalOrigin, setOriginRef: setStudentModalOrigin } = useModalOrigin();
  const { originElement: patientModalOrigin, setOriginRef: setPatientModalOrigin } = useModalOrigin();
  const { originElement: changePassOrigin, setOriginRef: setChangePassOrigin } = useModalOrigin();

  const displayName = useMemo(
    () => fullName || (isStudent ? profile?.fullName : undefined) || user?.name || user?.email?.split('@')[0] || 'Usuario',
    [fullName, profile, user, isStudent]
  );
  const initials = useMemo(() => {
    const n = displayName || '';
    const s = n.trim().split(' ').filter(Boolean);
    const letters = (s[0]?.[0] || '').toUpperCase() + (s[1]?.[0] || '').toUpperCase();
    return letters || 'SL';
  }, [displayName]);

  

  useEffect(() => {
    let mounted = true;
    const loadName = async () => {
      try {
        if (!user?.id) return;
        if (user?.role === 'patient') {
          try {
            // 1) Intentar primero endpoint basado en token
            const r = await api.get('/api/patients/profile');
            const data: any = r?.data;
            if (!mounted) return;
            const name = data?.name || data?.full_name || data?.fullName;
            if (name) setFullName(String(name));
            setDetails({
              location: data?.location ?? null,
              gender: data?.gender ?? null,
              birth_date: data?.birth_date ?? null,
            });
          } catch (e: any) {
            const status = e?.response?.status;
            if (status === 404) {
              // 2) Si no existe perfil aún, intentar por :id como alternativa
              const r2 = await api.get(`/api/patients/${user.id}`);
              const d2: any = r2?.data;
              if (!mounted) return;
              const name2 = d2?.name || d2?.full_name || d2?.fullName;
              if (name2) setFullName(String(name2));
              setDetails({
                location: d2?.location ?? null,
                gender: d2?.gender ?? null,
                birth_date: d2?.birth_date ?? null,
              });
            } else if (status === 403) {
              // Token inválido/expirado: no podemos continuar
              return;
            } else {
              throw e;
            }
          }
        } else if (user?.role === 'student') {
          try {
            const r = await api.get('/api/students/profile');
            const data: any = r?.data;
            if (!mounted) return;
            const name = data?.full_name || data?.name || data?.fullName;
            if (name) setFullName(String(name));
            setDetails({
              location: data?.location ?? null,
              university: data?.university ?? null,
              career_year: data?.career_year ?? null,
              bio: data?.bio ?? null,
            });
          } catch (e: any) {
            const status = e?.response?.status;
            if (status === 404) {
              const r2 = await api.get(`/api/students/${user.id}`);
              const d2: any = r2?.data;
              if (!mounted) return;
              const name2 = d2?.full_name || d2?.name || d2?.fullName;
              if (name2) setFullName(String(name2));
              setDetails({
                location: d2?.location ?? null,
                university: d2?.university ?? null,
                career_year: d2?.career_year ?? null,
                bio: d2?.bio ?? null,
              });
            } else if (status === 403) {
              return;
            } else {
              throw e;
            }
          }
        }
      } catch {
        // Silenciar errores: mantenemos fallback a email
      }
    };
    loadName();
    return () => { mounted = false };
  }, [user?.id, user?.role]);

  const onLogout = () => {
    logout();
    // Usar setTimeout para asegurar que el logout se procese antes de la redirección
    setTimeout(() => {
      history.replace('/login');
    }, 100);
  };

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      if (!isStudent) return;
      setLoading(true);
      setError('');
      try {
        const p = await getStudentProfile(user!.id);
        if (mounted) {
          setProfile(p);
          setModalMode('edit');
        }
      } catch (e: any) {
        const status = e?.response?.status;
        if (mounted) {
          if (status === 404) {
            setProfile(null);
            setModalMode('create');
          } else {
            setError(e?.message || 'No se pudo cargar el perfil');
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => { mounted = false; };
  }, [isStudent]);

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': 'var(--bg-primary)' }}>
          <IonTitle className="heading-md">Mi Perfil</IonTitle>
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
          {/* Avatar y nombre moderno */}
          <motion.div variants={fadeInUp} style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <div style={{
              width: 120,
              height: 120,
              margin: '0 auto var(--space-4)',
              background: 'var(--gradient-primary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-primary)',
              position: 'relative'
            }}>
              <span style={{ fontSize: '3rem', fontWeight: 700, color: 'white' }}>{initials}</span>
            </div>
            <h2 className="heading-lg" style={{ marginBottom: 'var(--space-2)' }}>{displayName}</h2>
            <span className="badge-primary" style={{ 
              fontSize: '0.875rem',
              padding: '10px 20px',
              lineHeight: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)'
            }}>
              {user?.role === 'student' ? '🎓 Estudiante' : '👤 Paciente'}
            </span>
          </motion.div>

          {/* Información básica */}
          <motion.div variants={fadeInUp}>
            <div className="floating-card" style={{ marginBottom: 'var(--space-6)' }}>
              <h3 className="heading-md" style={{ marginBottom: 'var(--space-4)' }}>Información Personal</h3>
              
              <div className="stack-modern" style={{ gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    background: 'var(--gradient-primary-soft)',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IonIcon icon={mailOutline} style={{ fontSize: 24, color: 'var(--color-primary-600)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="caption" style={{ marginBottom: 'var(--space-1)' }}>Correo electrónico</p>
                    <p className="body-md" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{user?.email || '—'}</p>
                  </div>
                </div>
                {details?.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      background: 'var(--gradient-primary-soft)',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IonIcon icon={locationOutline} style={{ fontSize: 24, color: 'var(--color-primary-600)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="caption" style={{ marginBottom: 'var(--space-1)' }}>Ubicación</p>
                      <p className="body-md" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{details.location}</p>
                    </div>
                  </div>
                )}
                {details?.gender && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      background: 'var(--gradient-primary-soft)',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IonIcon icon={heartOutline} style={{ fontSize: 24, color: 'var(--color-primary-600)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="caption" style={{ marginBottom: 'var(--space-1)' }}>Género</p>
                      <p className="body-md" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{details.gender}</p>
                    </div>
                  </div>
                )}
                {details?.birth_date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      background: 'var(--gradient-primary-soft)',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IonIcon icon={calendarOutline} style={{ fontSize: 24, color: 'var(--color-primary-600)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="caption" style={{ marginBottom: 'var(--space-1)' }}>Fecha de nacimiento</p>
                      <p className="body-md" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{new Date(details.birth_date).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                    </div>
                  </div>
                )}
                {isStudent && profile?.university && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      background: 'var(--gradient-primary-soft)',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IonIcon icon={schoolOutline} style={{ fontSize: 24, color: 'var(--color-primary-600)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="caption" style={{ marginBottom: 'var(--space-1)' }}>Universidad</p>
                      <p className="body-md" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{profile.university}</p>
                    </div>
                  </div>
                )}
                {isStudent && profile?.careerYear != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      background: 'var(--gradient-primary-soft)',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IonIcon icon={calendarOutline} style={{ fontSize: 24, color: 'var(--color-primary-600)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="caption" style={{ marginBottom: 'var(--space-1)' }}>Año de carrera</p>
                      <p className="body-md" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{profile.careerYear}</p>
                    </div>
                  </div>
                )}
                {isStudent && profile?.bio && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      background: 'var(--gradient-primary-soft)',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <IonIcon icon={documentTextOutline} style={{ fontSize: 24, color: 'var(--color-primary-600)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="caption" style={{ marginBottom: 'var(--space-1)' }}>Biografía</p>
                      <p className="body-sm" style={{ color: 'var(--text-secondary)' }}>{profile.bio}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Completitud del perfil - solo para estudiantes */}
          {isStudent && profile && (
            <ProfileCompleteness
              profile={profile}
              documentsCount={documentsCount}
              onEditProfile={() => {
                setModalMode('edit');
                setModalOpen(true);
              }}
            />
          )}

          {/* Sección de certificados y documentos - solo para estudiantes */}
          {isStudent && <DocumentsSection onDocumentsChange={(count) => setDocumentsCount(count)} />}

          {/* Acciones modernas */}
          <motion.div variants={fadeInUp} className="stack-modern">
            {user?.role === 'patient' && (
              <button
                className="btn-modern-primary"
                style={{ width: '100%' }}
                onClick={() => history.push('/tabs/profile/reservas')}
              >
                <IonIcon icon={calendarOutline} />
                Mis reservas
              </button>
            )}
            {user?.role === 'student' && (
              <button
                className="btn-modern-primary"
                style={{ width: '100%' }}
                onClick={() => history.push('/tabs/services')}
              >
                <IonIcon icon={schoolOutline} />
                Ir a mis servicios
              </button>
            )}
            {user?.role === 'patient' && (
              <button
                ref={(el) => setPatientModalOrigin(el)}
                className="btn-modern-secondary"
                style={{ width: '100%' }}
                onClick={() => setPatientModalOpen(true)}
              >
                <IonIcon icon={personCircleOutline} />
                Editar perfil
              </button>
            )}
            {isStudent && (
              <button
                ref={(el) => setStudentModalOrigin(el)}
                className="btn-modern-secondary"
                style={{ width: '100%' }}
                onClick={() => { setModalMode(profile ? 'edit' : 'create'); setModalOpen(true); }}
                disabled={loading}
              >
                <IonIcon icon={personCircleOutline} />
                {profile ? 'Editar perfil' : 'Completar perfil'}
              </button>
            )}
            <button
              ref={(el) => setChangePassOrigin(el)}
              className="btn-modern-ghost"
              style={{ width: '100%' }}
              onClick={() => setChangePassOpen(true)}
            >
              <IonIcon icon={keyOutline} />
              Cambiar contraseña
            </button>
            <button
              className="btn-modern-ghost"
              style={{ width: '100%', color: 'var(--color-error)' }}
              onClick={onLogout}
            >
              <IonIcon icon={logOutOutline} />
              Cerrar sesión
            </button>
          </motion.div>
        </motion.div>

        <StudentProfileFormModal
          isOpen={modalOpen}
          mode={modalMode}
          initial={profile || undefined}
          studentId={user?.id as any}
          onDismiss={() => setModalOpen(false)}
          onSaved={(p) => { setProfile(p); }}
          originElement={studentModalOrigin}
        />
        <PatientProfileFormModal
          isOpen={patientModalOpen}
          onDismiss={() => { setPatientModalOpen(false); }}
          originElement={patientModalOrigin}
        />
        <ChangePasswordModal
          isOpen={changePassOpen}
          onDismiss={() => { setChangePassOpen(false); }}
          originElement={changePassOrigin}
        />
      </IonContent>
    </IonPage>
  );
};

export default ProfilePage;
