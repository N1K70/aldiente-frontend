import React from 'react';
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle,
  IonButton,
  IonButtons,
  IonMenuButton,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  homeOutline,
  personOutline,
  calendarOutline,
  schoolOutline,
  chatbubbleOutline,
  documentOutline,
  starOutline,
  shieldCheckmarkOutline,
  settingsOutline,
  logOutOutline,
} from 'ionicons/icons';

interface NavigationMenuProps {
  user?: any;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({ user }) => {
  const history = useHistory();

  const handleLogout = () => {
    localStorage.removeItem('mockUser');
    localStorage.removeItem('authToken');
    window.location.reload();
  };

  const navigationItems = [
    {
      title: 'Inicio',
      icon: homeOutline,
      path: '/home',
      roles: ['student', 'patient'],
    },
    {
      title: 'Perfil',
      icon: personOutline,
      path: '/profile',
      roles: ['student', 'patient'],
    },
    {
      title: 'Citas',
      icon: calendarOutline,
      path: '/appointments',
      roles: ['student', 'patient'],
    },
    {
      title: 'Servicios',
      icon: schoolOutline,
      path: '/services',
      roles: ['student', 'patient'],
    },
    {
      title: 'Mis Servicios',
      icon: documentOutline,
      path: '/my-services',
      roles: ['student'],
    },
    {
      title: 'Chat',
      icon: chatbubbleOutline,
      path: '/chat',
      roles: ['student', 'patient'],
    },
    {
      title: 'Documentos',
      icon: documentOutline,
      path: '/documents',
      roles: ['student', 'patient'],
    },
    {
      title: 'Calificaciones',
      icon: starOutline,
      path: '/reviews',
      roles: ['student', 'patient'],
    },
    {
      title: 'Términos y Condiciones',
      icon: shieldCheckmarkOutline,
      path: '/terms',
      roles: ['student', 'patient'],
    },
    {
      title: 'Configuración',
      icon: settingsOutline,
      path: '/settings',
      roles: ['student', 'patient'],
    },
  ];

  const filteredItems = user 
    ? navigationItems.filter(item => item.roles.includes(user.role))
    : navigationItems.filter(item => item.path === '/home' || item.path === '/terms');

  return (
    <>
      {/* Botón de menú para dispositivos móviles */}
      <IonButtons slot="start">
        <IonMenuButton />
      </IonButtons>

      {/* Menú lateral */}
      <IonMenu side="start" menuId="main-menu" contentId="main-content">
        <IonHeader>
          <IonToolbar style={{ '--background': '#D40710' }}>
            <IonTitle style={{ color: '#fff' }}>
              {user ? `Menú - ${user.role}` : 'Menú'}
            </IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <IonList>
            {filteredItems.map((item, index) => (
              <IonMenuToggle key={index} autoHide={false}>
                <IonItem
                  button
                  onClick={() => history.push(item.path)}
                  style={{
                    '--border-radius': '12px',
                    '--margin': '8px',
                    '--padding': '12px',
                  }}
                >
                  <IonIcon
                    icon={item.icon}
                    slot="start"
                    style={{ color: '#D40710' }}
                  />
                  <IonLabel>{item.title}</IonLabel>
                </IonItem>
              </IonMenuToggle>
            ))}

            {user && (
              <>
                <IonItem
                  button
                  onClick={handleLogout}
                  style={{
                    '--border-radius': '12px',
                    '--margin': '8px',
                    '--padding': '12px',
                    '--background': '#ffebee',
                  }}
                >
                  <IonIcon
                    icon={logOutOutline}
                    slot="start"
                    style={{ color: '#f44336' }}
                  />
                  <IonLabel>Cerrar Sesión</IonLabel>
                </IonItem>
              </>
            )}
          </IonList>
        </IonContent>
      </IonMenu>
    </>
  );
};

export default NavigationMenu;
