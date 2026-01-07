import React from 'react';
import { IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonIcon, IonLabel, IonMenuToggle, IonButton, IonImg } from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { homeOutline, personOutline, listOutline, calendarOutline, logOutOutline, logInOutline, briefcaseOutline } from 'ionicons/icons';
import { MockUser } from '../types/user'; // Importar MockUser desde el archivo compartido

interface AppPage {
  url: string;
  iosIcon: string;
  mdIcon: string;
  title: string;
  roles: Array<'student' | 'patient' | 'all'>; // Roles que pueden ver esta página
}

const allAppPages: AppPage[] = [
  { title: 'Home', url: '/home', iosIcon: homeOutline, mdIcon: homeOutline, roles: ['all'] },
  { title: 'Perfil', url: '/profile', iosIcon: personOutline, mdIcon: personOutline, roles: ['all'] },
  // Para pacientes
  { title: 'Explorar Servicios', url: '/services', iosIcon: listOutline, mdIcon: listOutline, roles: ['patient'] },
  // Para estudiantes
  { title: 'Mis Servicios', url: '/my-services', iosIcon: briefcaseOutline, mdIcon: briefcaseOutline, roles: ['student'] },
  { title: 'Citas', url: '/appointments', iosIcon: calendarOutline, mdIcon: calendarOutline, roles: ['all'] },
];

interface MenuProps {
  user: MockUser | null; // Usar MockUser aquí
}

// TEMPORAL: Determina el rol del usuario basado en el email y rol del mockUser.
// Esto debe ser reemplazado con una solución real que obtenga el rol desde la base de datos.
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
  return 'patient'; // Rol por defecto si no coincide
};

const Menu: React.FC<MenuProps> = ({ user }) => {
  const location = useLocation();
  const history = useHistory();
  // const auth = getAuth(); // Firebase ya no se usa aquí
  const userRole = getUserRole(user);

  const handleLogout = () => { // Ya no necesita ser async
    try {
      localStorage.removeItem('mockUser');
      // Opcionalmente, se puede forzar un evento para que App.tsx reaccione si es necesario,
      // pero la redirección y la recarga de App.tsx al navegar a /login deberían ser suficientes.
      window.dispatchEvent(new Event('storage')); // Para notificar a App.tsx inmediatamente
      history.push('/login'); // Redirigir a login después de cerrar sesión
    } catch (error) {
      console.error('Error al cerrar sesión simulado:', error);
      // Considerar mostrar un toast al usuario si algo falla aquí, aunque es menos probable
    }
  };

  // Filtrar páginas basadas en el rol del usuario
  const appPages = allAppPages.filter(page => {
    if (!user) return false; // No mostrar nada si no está logueado
    return page.roles.includes('all') || (userRole && page.roles.includes(userRole));
  });

  return (
    <IonMenu contentId="main-content" type="overlay">
      <IonHeader>
        <IonToolbar color="primary">
          <IonImg 
            src="/assets/images/LOGO_ALDIENTE_SINFONDO.png" 
            alt="ALDIENTE Logo" 
            style={{ height: '40px', margin: '5px 10px 5px 16px', verticalAlign: 'middle' }} 
          />
          <IonTitle style={{ verticalAlign: 'middle' }}>{user ? user.email : 'Menu'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList id="menu-list">
          {appPages.map((appPage, index) => (
            <IonMenuToggle key={index} autoHide={false}>
              <IonItem 
                className={location.pathname === appPage.url ? 'selected' : ''} 
                routerLink={appPage.url} 
                routerDirection="none" 
                lines="none" 
                detail={false}
              >
                <IonIcon slot="start" ios={appPage.iosIcon} md={appPage.mdIcon} />
                <IonLabel>{appPage.title}</IonLabel>
              </IonItem>
            </IonMenuToggle>
          ))}
        </IonList>

        {user ? (
          <IonButton expand="full" onClick={handleLogout} color="danger" className="ion-margin-top ion-margin-start ion-margin-end">
            <IonIcon slot="start" icon={logOutOutline} />
            Cerrar Sesión
          </IonButton>
        ) : (
          <IonButton expand="full" routerLink="/login" color="primary" className="ion-margin-top ion-margin-start ion-margin-end">
            <IonIcon slot="start" icon={logInOutline} />
            Iniciar Sesión
          </IonButton>
        )}
      </IonContent>
    </IonMenu>
  );
};

export default Menu;
