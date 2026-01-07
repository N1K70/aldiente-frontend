import React, { useState } from 'react';
import { 
  IonContent, 
  IonPage, 
  IonInput, 
  IonButton, 
  IonText, 
  IonIcon, 
  IonGrid, 
  IonRow, 
  IonCol,
  IonSpinner,
  IonImg,
  IonAlert
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { 
  eye, 
  eyeOff, 
  logInOutline, 
  mailOutline, 
  lockClosedOutline,
  personCircleOutline, // Icono para estudiante
  bodyOutline, // Icono para paciente
  alertCircleOutline // Para mensajes de error
} from 'ionicons/icons';
import axios from 'axios';

// Importar tipos centralizados
import { MockUser, LoginResponse } from '../types/user';

import { BACKEND_URL } from '../config';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor ingresa correo y contraseña');
      return;
    }
    setLoading(true);
    setError('');
    
    // Configuramos un timeout para evitar carga infinita
    const loginTimeout = setTimeout(() => {
      setLoading(false);
      setError('Tiempo de espera agotado. Verifica tu conexión o inténtalo más tarde.');
    }, 10000); // 10 segundos máximo de espera
    
    try {
      // Petición real al backend
      const response = await axios.post(`${BACKEND_URL}/api/login`, {
        email,
        password,
      });

      console.log('Respuesta del servidor:', response.data);
      
      // Extraer token y datos del usuario usando la interfaz LoginResponse
      const responseData = response.data;
      
      if (responseData && responseData.token) {
        // Guardar token
        localStorage.setItem('authToken', responseData.token);
        
        // Crear usuario simulado con los datos de la respuesta
        const userData = responseData.user || {};
        const mockUser: MockUser = {
          id: userData.id !== undefined ? String(userData.id) : undefined,
          email: userData.email || email,
          role: userData.role || 'student', // Valor por defecto si no hay rol
          displayName: userData.name || email.split('@')[0] // Usar nombre o parte del email como nombre por defecto
        };
        
        // Guardar usuario simulado
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
        
        // Notificar cambio de sesión y redirigir
        try { window.dispatchEvent(new Event('auth:changed')); } catch {}
        history.push('/home');
        
        // Limpiar el timeout ya que la operación fue exitosa
        clearTimeout(loginTimeout);
      } else {
        // En caso de que la respuesta no contenga token
        setError('Respuesta del servidor incompleta. Por favor, intenta de nuevo.');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      // Solución para el error con axios.isAxiosError
      if (error && error.response) {
        // Error con respuesta del servidor
        if (error.response.status === 401) {
          setError('Credenciales incorrectas. Por favor, verifica tu correo y contraseña.');
        } else {
          setError(`Error del servidor: ${error.response?.data?.message || 'Desconocido'}`);
        }
      } else {
        setError('Error de conexión. Por favor, verifica tu conexión a internet.');
      }
      
      // Limpiar el timeout ya que la operación falló
      clearTimeout(loginTimeout);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: 'student' | 'patient') => {
    // Configuramos el email y password para el acceso rápido según el rol
    const testEmail = role === 'student' ? 'estudiante@test.com' : 'paciente@test.com';
    const testPassword = 'password123'; // Contraseña predefinida para cuentas de prueba
    
    setLoading(true);
    setError('');
    
    // Configuramos un timeout para evitar carga infinita
    const loginTimeout = setTimeout(() => {
      setLoading(false);
      setError('Tiempo de espera agotado. Verifica tu conexión o inténtalo más tarde.');
    }, 10000); // 10 segundos máximo de espera
    
    try {
      // Petición real al backend con credenciales predefinidas
      const response = await axios.post(`${BACKEND_URL}/api/login`, {
        email: testEmail,
        password: testPassword,
      });

      console.log(`Login rápido como ${role}:`, response.data);
      
      // Usar la interfaz LoginResponse definida globalmente
      const responseData = response.data;
      if (responseData && responseData.token) {
        // Guardar el token
        localStorage.setItem('authToken', responseData.token);
        
        // Crear mockUser para compatibilidad
        const userData = responseData.user || {};
        const mockUser: MockUser = {
          id: userData.id !== undefined ? String(userData.id) : undefined,
          email: testEmail,
          role: role,
          displayName: userData.name || (role === 'student' ? 'Estudiante Prueba' : 'Paciente Prueba')
        };
        
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
        try { window.dispatchEvent(new Event('auth:changed')); } catch {}
        history.push('/home');
      } else {
        // Fallback a simulación si la API no responde como esperamos
        console.warn('API no devolvió token. Usando simulación local.');
        const mockUser: MockUser = {
          email: testEmail,
          role: role
        };
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
        history.push('/home');
      }
      // Limpiar el timeout ya que la operación fue exitosa
      clearTimeout(loginTimeout);
    } catch (error) {
      console.error(`Error en login rápido como ${role}:`, error);
      
      // Si falla, usamos la simulación como fallback
      console.warn('Fallando a simulación local para login rápido');
      const mockUser: MockUser = {
        email: testEmail,
        role: role
      };
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
      try { window.dispatchEvent(new Event('auth:changed')); } catch {}
      history.push('/home');
      
      // Limpiar el timeout ya que la operación fue manejada
      clearTimeout(loginTimeout);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="login-page">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <div className="login-logo">
                <IonImg src="/assets/images/LOGO_ALDIENTE_SINFONDO.png" alt="ALDIENTE Logo" className="logo-image" />
              </div>
              <h1 className="login-title">Iniciar sesión</h1>
              <p className="login-subtitle">Ingresa tus credenciales para acceder a tu cuenta</p>
            </div>
            
            <div className="login-form">
              <div className="form-group">
                <IonInput 
                  type="email" 
                  value={email} 
                  label="Correo electrónico" 
                  labelPlacement="floating"
                  onIonChange={(e) => setEmail(e.detail.value!)}
                  className="custom-input"
                  clearOnEdit={false}
                  autocomplete="off"
                >
                  <IonIcon slot="start" icon={mailOutline} />
                </IonInput>
              </div>
              
              <div className="form-group">
                <IonInput 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  label="Contraseña"
                  labelPlacement="floating"
                  onIonChange={(e) => setPassword(e.detail.value!)}
                  className="custom-input"
                  clearOnEdit={false}
                  autocomplete="new-password" 
                >
                  <IonIcon slot="start" icon={lockClosedOutline} />
                  <IonIcon 
                    slot="end"
                    icon={showPassword ? eyeOff : eye} 
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                  />
                </IonInput>
              </div>
            
              {error && (
                <div className="error-message">
                  <IonIcon icon={alertCircleOutline} />
                  <span>{error}</span>
                </div>
              )}
              
              <IonButton 
                expand="block" 
                onClick={handleLogin} 
                className={`login-button ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <IonSpinner name="crescent" />
                    <span style={{ marginLeft: '8px' }}>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <IonIcon icon={logInOutline} />
                    Iniciar sesión
                  </>
                )}
              </IonButton>
              
              <div className="divider">
                <span>o continúa con</span>
              </div>
              
              <div className="social-buttons">
                <IonButton 
                  expand="block" 
                  fill="outline" 
                  className="social-button student-button"
                  onClick={() => handleQuickLogin('student')}
                >
                  <IonIcon icon={personCircleOutline} />
                  Entrar como Estudiante
                </IonButton>
                
                <IonButton 
                  expand="block" 
                  fill="outline" 
                  className="social-button patient-button"
                  onClick={() => handleQuickLogin('patient')}
                >
                  <IonIcon icon={bodyOutline} />
                  Entrar como Paciente
                </IonButton>
              </div>
              
              <div className="auth-links">
                <p className="signup-text">
                  ¿No tienes una cuenta?{' '}
                  <a href="/login" className="signup-link">Regístrate</a>
                </p>
                <p className="forgot-password-text">
                  <a href="/forgot-password" className="forgot-password-link">
                    ¿Olvidaste tu contraseña?
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
