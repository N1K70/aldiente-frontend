import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
// Firebase deshabilitado temporalmente para build
// import { getAuth, onAuthStateChanged } from 'firebase/auth';

interface AuthRedirectControllerProps {
  setUser: (user: any | null) => void;
  setLoading: (loading: boolean) => void;
  bypassAuth: boolean;
}

const AuthRedirectController: React.FC<AuthRedirectControllerProps> = ({ setUser, setLoading, bypassAuth }) => {
  const history = useHistory();
  // Firebase deshabilitado temporalmente
  // let authInstance;
  // try {
  //   authInstance = getAuth();
  //   console.log('AuthRedirectController: getAuth() successful');
  // } catch (e) {
  //   console.error('AuthRedirectController: Error en getAuth()', e);
  //   setLoading(false);
  //   return null;
  // }

  useEffect(() => {
    console.log('AuthRedirectController: useEffect triggered. bypassAuth:', bypassAuth);
    if (bypassAuth) {
      console.warn('AuthRedirectController: MODO BYPASS DE AUTENTICACIÓN ACTIVO');
      setUser({
        uid: 'bypass-user-001',
        email: 'bypass@aldiente.com',
        displayName: 'Usuario Bypass',
      });
      setLoading(false);
      console.log('AuthRedirectController: Bypass user set, loading false.');
    } else {
      // Firebase deshabilitado - modo bypass por defecto
      console.warn('AuthRedirectController: Firebase deshabilitado, usando modo bypass');
      setUser(null);
      setLoading(false);
      // Redirigir a welcome si no está autenticado
      const allowedPublicPaths = ['/', '/welcome', '/login', '/forgot-password', '/reset-password', '/email-verification', '/reservar'];
      if (!allowedPublicPaths.includes(window.location.pathname)) {
        history.push('/welcome');
      }
    }
  }, [history, bypassAuth, setUser, setLoading]);

  console.log('AuthRedirectController: Component rendered.');
  return null; 
};

export default AuthRedirectController;
