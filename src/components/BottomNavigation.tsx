import React from 'react';
import { IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import { 
  homeOutline, 
  personOutline, 
  calendarOutline,
  briefcaseOutline 
} from 'ionicons/icons';
import { useLocation, useHistory } from 'react-router-dom';
import { MockUser } from '../types/user';
import { usePageTransition } from '../shared/context/PageTransitionContext';

interface BottomNavigationProps {
  user: MockUser | null;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ user }) => {
  const location = useLocation();
  const history = useHistory();
  const { captureOrigin } = usePageTransition();

  const getUserRole = (user: MockUser | null): 'student' | 'patient' | null => {
    if (!user || !user.email) {
      return null;
    }
    if (user.email.startsWith('estudiante')) {
      return 'student';
    }
    if (user.email.startsWith('paciente')) {
      return 'patient';
    }
    return 'patient';
  };

  const userRole = getUserRole(user);

  const handleTabClick = (path: string, event: any) => {
    captureOrigin(event.currentTarget as HTMLElement);
    history.push(path);
  };

  if (!user) {
    return null; // No mostrar navegación si no está logueado
  }

  return (
    <IonTabBar slot="bottom" className="bottom-nav">
      <IonTabButton 
        onClick={(e: any) => handleTabClick('/tabs/home', e)}
        selected={location.pathname === '/tabs/home'}
        className={location.pathname === '/tabs/home' ? 'active-tab' : ''}
      >
        <IonIcon icon={homeOutline} />
        <IonLabel>Inicio</IonLabel>
      </IonTabButton>

      {userRole === 'student' && (
        <IonTabButton 
          onClick={(e: any) => handleTabClick('/tabs/services', e)}
          selected={location.pathname === '/tabs/services'}
          className={location.pathname === '/tabs/services' ? 'active-tab' : ''}
        >
          <IonIcon icon={briefcaseOutline} />
          <IonLabel>Mis Servicios</IonLabel>
        </IonTabButton>
      )}

      <IonTabButton 
        onClick={(e: any) => handleTabClick('/tabs/appointments', e)}
        selected={location.pathname === '/tabs/appointments'}
        className={location.pathname === '/tabs/appointments' ? 'active-tab' : ''}
      >
        <IonIcon icon={calendarOutline} />
        <IonLabel>Citas</IonLabel>
      </IonTabButton>

      <IonTabButton 
        onClick={(e: any) => handleTabClick('/tabs/profile', e)}
        selected={location.pathname === '/tabs/profile'}
        className={location.pathname === '/tabs/profile' ? 'active-tab' : ''}
      >
        <IonIcon icon={personOutline} />
        <IonLabel>Perfil</IonLabel>
      </IonTabButton>
    </IonTabBar>
  );
};

export default BottomNavigation;
