import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonPage,
  IonButton,
  IonToast,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  personCircleOutline,
  mailOutline,
  briefcaseOutline,
  schoolOutline,
  calendarOutline,
  listOutline,
  homeOutline,
  logOutOutline,
  heartOutline,
  starOutline,
  documentTextOutline
} from 'ionicons/icons';
import { MockUser } from '../types/user';
import './Profile.css';

interface ProfileStats {
  appointments: number;
  services: number;
  reviews: number;
}

const Profile: React.FC = () => {
  const [mockUser, setMockUser] = useState<MockUser | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');
  const [stats, setStats] = useState<ProfileStats>({
    appointments: 0,
    services: 0,
    reviews: 0
  });
  const history = useHistory();

  useEffect(() => {
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      try {
        const parsedUser: MockUser = JSON.parse(storedUser);
        setMockUser(parsedUser);
        // Simular estadísticas
        setStats({
          appointments: Math.floor(Math.random() * 10) + 1,
          services: parsedUser.role === 'student' ? Math.floor(Math.random() * 5) + 1 : 0,
          reviews: Math.floor(Math.random() * 20) + 5
        });
      } catch (e) {
        console.error("Error parsing mockUser from localStorage on Profile page", e);
        localStorage.removeItem('mockUser');
        history.push('/login');
      }
    } else {
      history.push('/login');
    }

    const handleStorageChange = () => {
      const updatedStoredUser = localStorage.getItem('mockUser');
      if (!updatedStoredUser) {
        history.push('/login');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };

  }, [history]);

  const handleLogout = () => {
    localStorage.removeItem('mockUser');
    setToastMessage('Sesión cerrada exitosamente');
    setToastColor('success');
    setShowToast(true);
    setTimeout(() => {
      history.push('/welcome');
    }, 1500);
  };

  const getRoleDisplay = (role: string) => {
    return role === 'student' ? 'Estudiante' : 'Paciente';
  };

  const getRoleIcon = (role: string) => {
    return role === 'student' ? schoolOutline : personCircleOutline;
  };

  return (
    <IonPage>
      <IonContent className="profile-container">
        {/* Header con gradiente */}
        <div className="profile-header">
          <div className="profile-header-content">
            <div className="profile-avatar">
              <IonIcon icon={getRoleIcon(mockUser?.role || 'patient')} size="large" color="primary" />
            </div>
            <h1 className="profile-name">
              {mockUser?.email?.split('@')[0] || 'Usuario'}
            </h1>
            <p className="profile-email">{mockUser?.email}</p>
            <div className="profile-role">
              {getRoleDisplay(mockUser?.role || '')}
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="profile-content">
          {/* Estadísticas */}
          <div className="profile-section">
            <div className="profile-section-header">
              <h2 className="profile-section-title">Resumen de Actividad</h2>
              <p className="profile-section-subtitle">Tu actividad en aldiente</p>
            </div>
            <div className="profile-stats">
              <div className="profile-stat">
                <div className="profile-stat-value">{stats.appointments}</div>
                <div className="profile-stat-label">Citas</div>
              </div>
              {mockUser?.role === 'student' && (
                <div className="profile-stat">
                  <div className="profile-stat-value">{stats.services}</div>
                  <div className="profile-stat-label">Servicios</div>
                </div>
              )}
              <div className="profile-stat">
                <div className="profile-stat-value">{stats.reviews}</div>
                <div className="profile-stat-label">Reseñas</div>
              </div>
            </div>
          </div>

          {/* Información del usuario */}
          <div className="profile-section">
            <div className="profile-section-header">
              <h2 className="profile-section-title">Información Personal</h2>
              <p className="profile-section-subtitle">Detalles de tu cuenta</p>
            </div>
            <div className="profile-info">
              <div className="profile-info-item">
                <div className="profile-info-icon">
                  <IonIcon icon={mailOutline} color="primary" />
                </div>
                <div className="profile-info-content">
                  <div className="profile-info-label">Correo Electrónico</div>
                  <div className="profile-info-value">{mockUser?.email}</div>
                </div>
              </div>
              
              <div className="profile-info-item">
                <div className="profile-info-icon">
                  <IonIcon icon={getRoleIcon(mockUser?.role || 'patient')} color="primary" />
                </div>
                <div className="profile-info-content">
                  <div className="profile-info-label">Tipo de Usuario</div>
                  <div className="profile-info-value">{getRoleDisplay(mockUser?.role || '')}</div>
                </div>
              </div>

              {mockUser?.role === 'student' && (
                <>
                  <div className="profile-info-item">
                    <div className="profile-info-icon">
                      <IonIcon icon={briefcaseOutline} color="primary" />
                    </div>
                    <div className="profile-info-content">
                      <div className="profile-info-label">Especialidad</div>
                      <div className="profile-info-value">Odontología General</div>
                    </div>
                  </div>

                  <div className="profile-info-item">
                    <div className="profile-info-icon">
                      <IonIcon icon={schoolOutline} color="primary" />
                    </div>
                    <div className="profile-info-content">
                      <div className="profile-info-label">Universidad</div>
                      <div className="profile-info-value">UCV - Caracas</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="profile-section">
            <div className="profile-section-header">
              <h2 className="profile-section-title">Acciones Rápidas</h2>
              <p className="profile-section-subtitle">Gestiona tu experiencia en aldiente</p>
            </div>
            <div className="profile-actions">
              <div className="profile-actions-grid">
                <IonButton 
                  expand="block" 
                  className="profile-action-button"
                  onClick={() => history.push('/appointments')}
                >
                  <IonIcon icon={calendarOutline} slot="start" />
                  Mis Citas
                </IonButton>

                <IonButton 
                  expand="block" 
                  className="profile-action-button"
                  onClick={() => history.push('/services')}
                >
                  <IonIcon icon={listOutline} slot="start" />
                  Ver Servicios
                </IonButton>

                {mockUser?.role === 'student' && (
                  <>
                    <IonButton 
                      expand="block" 
                      className="profile-action-button primary"
                      onClick={() => history.push('/services/add')}
                    >
                      <IonIcon icon={documentTextOutline} slot="start" />
                      Agregar Servicio
                    </IonButton>
                  </>
                )}

                <IonButton 
                  expand="block" 
                  className="profile-action-button"
                  onClick={() => history.push('/home')}
                >
                  <IonIcon icon={homeOutline} slot="start" />
                  Inicio
                </IonButton>
              </div>
            </div>
          </div>

          {/* Botón de cerrar sesión */}
          <div className="profile-section">
            <IonButton 
              expand="block" 
              color="danger"
              onClick={handleLogout}
              className="ion-margin-top"
            >
              <IonIcon icon={logOutOutline} slot="start" />
              Cerrar Sesión
            </IonButton>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={4000}
          color={toastColor}
        />
      </IonContent>
    </IonPage>
  );
};

export default Profile;
