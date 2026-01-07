import React, { lazy, Suspense, useEffect, useState } from 'react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route, useLocation } from 'react-router-dom';
import { IonRouterOutlet, IonToast, IonSpinner } from '@ionic/react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../shared/context/AuthContext';
import CustomTabBar from '../shared/components/CustomTabBar';
import PageTransition from '../components/PageTransition';
import { isLandingDomain, getAppUrl, getLandingUrl } from '../shared/utils/domainUtils';

// Importaciones críticas (carga inmediata)
import LoginPage from '../modules/auth/LoginPage';
import HomePage from '../modules/home/HomePage';
import LandingPage from '../pages/LandingPage';

// Lazy loading de páginas no críticas
const MyServicesPage = lazy(() => import('../modules/services/MyServicesPage'));
const ProfilePage = lazy(() => import('../modules/profile/ProfilePage'));
const ExploreServicesPage = lazy(() => import('../modules/services/ExploreServicesPage'));
const ExploreProfessionalsPage = lazy(() => import('../modules/professionals/ExploreProfessionalsPage'));
const ProfessionalDetailPage = lazy(() => import('../modules/professionals/ProfessionalDetailPage'));
const ServiceDetailPage = lazy(() => import('../modules/services/ServiceDetailPage'));
const ReservationPage = lazy(() => import('../modules/reservations/ReservationPage'));
const AppointmentsPage = lazy(() => import('../modules/appointments/AppointmentsPage'));
const AppointmentDetailPage = lazy(() => import('../modules/appointments/AppointmentDetailPage'));
const PatientReservationsPage = lazy(() => import('../modules/profile/PatientReservationsPage'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));
const EmailVerification = lazy(() => import('../pages/EmailVerification'));
const ServiceQuizPage = lazy(() => import('../modules/services/ServiceQuizPage'));
const WebpayReturnPage = lazy(() => import('../modules/webpay/WebpayReturnPage'));
const GuestCheckoutPage = lazy(() => import('../pages/GuestCheckoutPage'));

// Loading fallback
const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'var(--bg-secondary, #f8fafc)'
  }}>
    <IonSpinner name="crescent" color="primary" />
  </div>
);

// Perfil movido a componente dedicado con UI moderna

const PrivateRoute: React.FC<
  { path: string; component: React.FC; allowedRoles?: Array<'student' | 'patient' | 'admin'>; animate?: boolean } & any
> = ({ component: Comp, allowedRoles, animate = false, ...rest }) => {
  const { user } = useAuth();
  return (
    <Route
      {...rest}
      render={() =>
        user ? (
          !allowedRoles || (user.role && allowedRoles.includes(user.role)) ? (
            <Suspense fallback={<PageLoader />}>
              {animate ? (
                <PageTransition>
                  <Comp />
                </PageTransition>
              ) : (
                <Comp />
              )}
            </Suspense>
          ) : (
            <Redirect to="/tabs/home" />
          )
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

// Componente wrapper para rutas animadas
const TabRoutesWrapper: React.FC = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <IonRouterOutlet key={location.pathname} style={{ position: 'relative', overflow: 'hidden' }}>
        <PrivateRoute path="/tabs/home" exact component={HomePage} animate />
        <PrivateRoute path="/tabs/service-quiz" exact component={ServiceQuizPage} allowedRoles={['patient']} />
        <PrivateRoute path="/tabs/servicios" exact component={ExploreServicesPage} allowedRoles={['patient']} />
        <PrivateRoute path="/tabs/profesionales" exact component={ExploreProfessionalsPage} allowedRoles={['patient']} />
        <PrivateRoute path="/tabs/profesionales/:id" exact component={ProfessionalDetailPage} allowedRoles={['patient']} />
        <PrivateRoute path="/tabs/servicio/:id" exact component={ServiceDetailPage} allowedRoles={['patient']} />
        <PrivateRoute path="/tabs/reservar/:studentId/:serviceId" exact component={ReservationPage} allowedRoles={['patient']} />
        <PrivateRoute path="/tabs/profile/reservas" exact component={PatientReservationsPage} allowedRoles={['patient']} animate />
        <PrivateRoute path="/tabs/services" exact component={MyServicesPage} allowedRoles={['student']} />
        <PrivateRoute path="/tabs/appointments/history" exact component={AppointmentsPage} allowedRoles={['student']} />
        <PrivateRoute path="/tabs/appointments/:appointmentId" exact component={AppointmentDetailPage} allowedRoles={['student','patient']} />
        <PrivateRoute path="/tabs/appointments" exact component={AppointmentsPage} allowedRoles={['student']} animate />
        <PrivateRoute path="/tabs/profile" exact component={ProfilePage} animate />
        <Route exact path="/tabs" render={() => <Redirect to="/tabs/home" />} />
      </IonRouterOutlet>
    </AnimatePresence>
  );
};

const Routes: React.FC = () => {
  const { user } = useAuth();
  const startPath = '/tabs/home';
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  
  // Detectar si estamos en el subdominio del landing
  const onLandingDomain = isLandingDomain();

  useEffect(() => {
    const handler = (e: any) => {
      const expected = e?.detail?.expected;
      const actual = e?.detail?.actual;
      setToastMsg(
        actual
          ? `Tu rol real es "${actual}". Te dirigimos a la experiencia adecuada.`
          : 'Tu rol ha sido ajustado automáticamente.'
      );
      setToastOpen(true);
    };
    window.addEventListener('auth:role-mismatch' as any, handler as any);
    return () => window.removeEventListener('auth:role-mismatch' as any, handler as any);
  }, []);

  useEffect(() => {
    const onExpired = () => {
      setToastMsg('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      setToastOpen(true);
    };
    window.addEventListener('auth:expired' as any, onExpired as any);
    return () => window.removeEventListener('auth:expired' as any, onExpired as any);
  }, []);

  // Si estamos en home.aldiente.app, solo mostrar el landing
  if (onLandingDomain) {
    return (
      <IonReactRouter>
        <Route path="/" component={LandingPage} />
      </IonReactRouter>
    );
  }

  // Dominio principal (aldiente.app): app completa sin landing
  return (
    <IonReactRouter>
      <IonToast
        isOpen={toastOpen}
        duration={2200}
        color="warning"
        message={toastMsg}
        onDidDismiss={() => setToastOpen(false)}
      />
      {/* Redirigir /landing al subdominio home.aldiente.app */}
      <Route 
        path="/landing" 
        exact 
        render={() => {
          window.location.href = getLandingUrl();
          return null;
        }} 
      />
      <Route
        path="/login"
        exact
        component={LoginPage}
      />
      <Route path="/forgot-password" exact component={ForgotPassword} />
      <Route path="/reset-password" exact component={ResetPassword} />
      <Route path="/email-verification" exact component={EmailVerification} />
      <Route path="/webpay/return" exact component={WebpayReturnPage} />
      {/* Guest Checkout - Reserva sin login */}
      <Route path="/reservar" exact component={GuestCheckoutPage} />
      {/* En el dominio principal, "/" va directo a login o home */}
      <Route path="/" exact render={() => (user ? <Redirect to={startPath} /> : <Redirect to="/login" />)} />
      <Route path="/tabs">
        <>
          <IonRouterOutlet>
            <PrivateRoute path="/tabs/home" exact component={HomePage} />
            <PrivateRoute path="/tabs/service-quiz" exact component={ServiceQuizPage} allowedRoles={['patient']} />
            <PrivateRoute path="/tabs/servicios" exact component={ExploreServicesPage} allowedRoles={['patient']} />
            <PrivateRoute path="/tabs/profesionales" exact component={ExploreProfessionalsPage} allowedRoles={['patient']} />
            <PrivateRoute path="/tabs/profesionales/:id" exact component={ProfessionalDetailPage} allowedRoles={['patient']} />
            <PrivateRoute path="/tabs/servicio/:id" exact component={ServiceDetailPage} allowedRoles={['patient']} />
            <PrivateRoute path="/tabs/reservar/:studentId/:serviceId" exact component={ReservationPage} allowedRoles={['patient']} />
            <PrivateRoute path="/tabs/profile/reservas" exact component={PatientReservationsPage} allowedRoles={['patient']} />
            <PrivateRoute path="/tabs/services" exact component={MyServicesPage} allowedRoles={['student']} />
            <PrivateRoute path="/tabs/appointments/history" exact component={AppointmentsPage} allowedRoles={['student']} />
            <PrivateRoute path="/tabs/appointments/:appointmentId" exact component={AppointmentDetailPage} allowedRoles={['student','patient']} />
            <PrivateRoute path="/tabs/appointments" exact component={AppointmentsPage} allowedRoles={['student']} />
            <PrivateRoute path="/tabs/profile" exact component={ProfilePage} />
            <Route exact path="/tabs" render={() => <Redirect to={startPath} />} />
          </IonRouterOutlet>
          {user && <CustomTabBar userRole={user.role} />}
        </>
      </Route>
    </IonReactRouter>
  );
};

export default Routes;
