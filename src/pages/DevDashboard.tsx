import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonButton, IonLabel, IonRouterLink } from '@ionic/react';
import './DevDashboard.css';

const DevDashboard: React.FC = () => {
  const pages = [
    { title: 'Welcome', path: '/welcome' },
    { title: 'Login', path: '/login' },
    { title: 'Register (Unified)', path: '/register' },
    { title: 'Home', path: '/home' },
    { title: 'Profile', path: '/profile' },
    { title: 'Appointments', path: '/appointments' },
    { title: 'Services', path: '/services' },
    // { title: 'Register Patient (Old)', path: '/register-patient' }, // Eliminado
    // { title: 'Register Student (Old)', path: '/register-student' }, // Eliminado
    // Agrega más páginas aquí a medida que se creen
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Dev Dashboard (aldiente)</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding dev-dashboard-content">
        <IonList>
          {
            pages.map(page => (
              <IonItem key={page.path}>
                <IonRouterLink routerDirection="forward" href={page.path} style={{ width: '100%' }}>
                  <IonButton expand="block" fill="outline">
                    {page.title}
                  </IonButton>
                </IonRouterLink>
              </IonItem>
            ))
          }
        </IonList>
        <div className="ion-padding-top ion-text-center">
            <IonLabel color="medium">
                <p>Use this page to quickly navigate during development.</p>
            </IonLabel>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DevDashboard;
