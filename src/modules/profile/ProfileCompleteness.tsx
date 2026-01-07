import React, { useMemo } from 'react';
import { IonIcon, IonProgressBar } from '@ionic/react';
import { 
  checkmarkCircle, 
  alertCircle, 
  schoolOutline, 
  locationOutline, 
  ribbonOutline, 
  documentTextOutline,
  cloudUploadOutline,
  calendarOutline
} from 'ionicons/icons';
import { motion } from 'framer-motion';
import { StudentProfile } from './types';
import { fadeInUp } from '../../utils/animations';

interface ProfileCompletenessProps {
  profile: StudentProfile | null;
  documentsCount: number;
  onEditProfile: () => void;
}

interface CompletenessItem {
  id: string;
  label: string;
  icon: string;
  completed: boolean;
  description: string;
  optional?: boolean;
}

const ProfileCompleteness: React.FC<ProfileCompletenessProps> = ({ 
  profile, 
  documentsCount,
  onEditProfile 
}) => {
  const items = useMemo<CompletenessItem[]>(() => {
    if (!profile) return [];

    return [
      {
        id: 'university',
        label: 'Universidad',
        icon: schoolOutline,
        completed: !!profile.university,
        description: 'Nombre de tu universidad'
      },
      {
        id: 'universityLocation',
        label: 'Ubicación de Universidad',
        icon: locationOutline,
        completed: !!profile.location && profile.location.includes(' | ') 
          ? !!profile.location.split(' | ')[0].trim()
          : !!profile.location,
        description: 'Dirección exacta de tu universidad'
      },
      {
        id: 'alternativeLocation',
        label: 'Ubicación Alternativa',
        icon: locationOutline,
        completed: !!profile.location && profile.location.includes(' | '),
        description: 'Consulta particular u otra ubicación (opcional)',
        optional: true // No cuenta para el 100%
      },
      {
        id: 'careerYear',
        label: 'Año de Carrera',
        icon: calendarOutline,
        completed: profile.careerYear !== null && profile.careerYear !== undefined,
        description: 'Tu año actual en la carrera'
      },
      {
        id: 'certifications',
        label: 'Certificaciones',
        icon: ribbonOutline,
        completed: !!profile.certifications && profile.certifications.trim().length > 0,
        description: 'Certificados o cursos adicionales'
      },
      {
        id: 'bio',
        label: 'Biografía',
        icon: documentTextOutline,
        completed: !!profile.bio && profile.bio.trim().length > 20,
        description: 'Descripción profesional (mínimo 20 caracteres)'
      },
      {
        id: 'documents',
        label: 'Documentos Acreditativos',
        icon: cloudUploadOutline,
        completed: documentsCount > 0,
        description: 'Certificados, títulos o documentos que validen tu perfil'
      }
    ];
  }, [profile, documentsCount]);

  const completedCount = useMemo(() => {
    return items.filter(item => !item.optional && item.completed).length;
  }, [items]);

  const totalCount = items.filter(item => !item.optional).length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  const getStatusColor = () => {
    if (percentage >= 80) return 'var(--color-success)';
    if (percentage >= 50) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  const getStatusMessage = () => {
    if (percentage === 100) return '¡Perfil completo! 🎉';
    if (percentage >= 80) return 'Casi completo';
    if (percentage >= 50) return 'Buen progreso';
    return 'Completa tu perfil';
  };

  if (!profile) return null;

  return (
    <motion.div variants={fadeInUp}>
      <div className="floating-card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 'var(--space-4)'
        }}>
          <div>
            <h3 className="heading-md" style={{ marginBottom: 'var(--space-1)' }}>
              Completitud del Perfil
            </h3>
            <p className="body-sm" style={{ color: 'var(--text-secondary)', margin: 0 }}>
              {getStatusMessage()}
            </p>
          </div>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: getStatusColor(),
            lineHeight: 1
          }}>
            {percentage}%
          </div>
        </div>

        {/* Barra de progreso */}
        <div style={{ 
          background: 'var(--color-gray-200)', 
          borderRadius: '12px', 
          height: '12px',
          overflow: 'hidden',
          marginBottom: 'var(--space-5)',
          position: 'relative'
        }}>
          <div style={{
            background: getStatusColor(),
            height: '100%',
            width: `${percentage}%`,
            borderRadius: '12px',
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: `0 0 12px ${getStatusColor()}40`
          }} />
        </div>

        {/* Lista de items */}
        <div className="stack-modern" style={{ gap: 'var(--space-3)' }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-3)',
                padding: 'var(--space-3)',
                background: item.completed 
                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(22, 163, 74, 0.05) 100%)'
                  : 'var(--bg-secondary)',
                borderRadius: '12px',
                border: item.completed 
                  ? '1px solid var(--color-success-200)'
                  : '1px solid var(--color-gray-200)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: item.completed 
                  ? 'var(--color-success-100)'
                  : 'var(--color-gray-100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <IonIcon 
                  icon={item.icon} 
                  style={{ 
                    fontSize: '20px', 
                    color: item.completed 
                      ? 'var(--color-success-600)'
                      : 'var(--color-gray-500)'
                  }} 
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--space-2)',
                  marginBottom: 'var(--space-1)'
                }}>
                  <p className="body-md" style={{ 
                    fontWeight: 600, 
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>
                    {item.label}
                  </p>
                  <IonIcon 
                    icon={item.completed ? checkmarkCircle : alertCircle} 
                    style={{ 
                      fontSize: '18px', 
                      color: item.completed 
                        ? 'var(--color-success)'
                        : 'var(--color-warning)'
                    }} 
                  />
                </div>
                <p className="caption" style={{ 
                  color: 'var(--text-secondary)', 
                  margin: 0 
                }}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Botón de acción */}
        {percentage < 100 && (
          <button
            className="btn-modern-primary"
            style={{ width: '100%', marginTop: 'var(--space-5)' }}
            onClick={onEditProfile}
          >
            Completar perfil
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ProfileCompleteness;
