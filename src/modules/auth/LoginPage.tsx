import React, { useCallback, useState, useEffect } from 'react';
import { IonPage, IonContent, IonInput, IonText, IonImg, IonToast, IonLoading, IonCheckbox } from '@ionic/react';
import { IonIcon } from '@ionic/react';
import { useAuth } from '../../shared/context/AuthContext';
import { useHistory } from 'react-router-dom';
import { 
  mailOutline, 
  lockClosedOutline, 
  eyeOutline, 
  eyeOffOutline, 
  cardOutline,
  personOutline,
  schoolOutline,
  calendarOutline,
  locationOutline,
  shieldCheckmarkOutline,
  checkmarkCircleOutline,
  peopleOutline,
  starOutline,
  alertCircleOutline,
  arrowForwardOutline
} from 'ionicons/icons';
import { motion } from 'framer-motion';
import { api } from '../../shared/api/ApiClient';
import TermsModal from './TermsModal';
import { validateAndFormatRut, formatRutOnInput } from '../../shared/utils/rutValidator';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const { login, loading, user } = useAuth();
  const history = useHistory();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [toastOpen, setToastOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'student' | 'patient'>('patient');
  
  // Campos de registro
  const [rut, setRut] = useState('');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('');
  const [careerYear, setCareerYear] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    if (user) {
      history.replace('/tabs/home');
    }
  }, [user, history]);

  const onSubmit = useCallback(async () => {
    setError('');
    if (!email || !password) {
      setError('Completa correo y contraseña');
      setToastOpen(true);
      return;
    }
    try {
      await login(email, password);
    } catch (e: any) {
      setError(e?.message || 'No se pudo iniciar sesión');
      setToastOpen(true);
    }
  }, [email, password, login]);

  const onRegister = useCallback(async () => {
    setError('');
    if (!email || !password) {
      setError('Completa correo y contraseña');
      setToastOpen(true);
      return;
    }
    if (!rut) {
      setError('El RUT es requerido');
      setToastOpen(true);
      return;
    }
    const rutValidation = validateAndFormatRut(rut);
    if (!rutValidation.valid) {
      setError(`RUT inválido: ${rutValidation.message}`);
      setToastOpen(true);
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setToastOpen(true);
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setToastOpen(true);
      return;
    }
    if (!acceptTerms) {
      setError('Debes aceptar los términos y condiciones.');
      setToastOpen(true);
      return;
    }
    if (role === 'patient') {
      if (!name || !birthDate || !location) {
        setError('Completa nombre, fecha de nacimiento y ubicación');
        setToastOpen(true);
        return;
      }
    }
    if (role === 'student') {
      if (!fullName || !university || !careerYear) {
        setError('Completa nombre completo, universidad y año de carrera');
        setToastOpen(true);
        return;
      }
    }
    setRegLoading(true);
    try {
      const payload: any = { email, password, rut: rutValidation.formatted, role };
      if (role === 'patient') {
        Object.assign(payload, { name, birthDate, gender: gender || undefined, location });
      } else {
        Object.assign(payload, { fullName, university, careerYear, location });
      }
      await api.post('/api/register', payload);
      await login(email, password, role);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'No se pudo registrar';
      setError(msg);
      setToastOpen(true);
    } finally {
      setRegLoading(false);
    }
  }, [email, password, confirmPassword, role, name, birthDate, gender, location, fullName, university, careerYear, rut, acceptTerms, login]);

  const features = [
    { icon: checkmarkCircleOutline, text: 'Tratamientos supervisados por profesionales' },
    { icon: peopleOutline, text: 'Estudiantes certificados y capacitados' },
    { icon: starOutline, text: 'Calificaciones y reseñas verificadas' },
    { icon: shieldCheckmarkOutline, text: 'Pagos seguros con Webpay' },
  ];

  return (
    <IonPage>
      <IonContent scrollY={true} className="auth-page-content">
        <div className="auth-page-container">
          {/* Left Panel - Branding (Desktop only) */}
          <div className="auth-branding-panel">
            <div className="auth-branding-shapes">
              <div className="auth-shape auth-shape-1"></div>
              <div className="auth-shape auth-shape-2"></div>
              <div className="auth-shape auth-shape-3"></div>
            </div>
            
            <div className="auth-branding-content">
              <div className="auth-branding-logo">
                <IonImg src="/assets/images/LOGO_ALDIENTE_SINFONDO.png" alt="ALDIENTE" />
                <span>ALDIENTE</span>
              </div>
              
              <h1 className="auth-branding-title">
                Tu sonrisa en las mejores manos
              </h1>
              
              <p className="auth-branding-subtitle">
                Conectamos pacientes con estudiantes de odontología certificados. 
                Tratamientos de calidad a precios accesibles.
              </p>
              
              <div className="auth-branding-features">
                {features.map((feature, index) => (
                  <motion.div 
                    key={index}
                    className="auth-feature-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <div className="auth-feature-icon">
                      <IonIcon icon={feature.icon} />
                    </div>
                    <span className="auth-feature-text">{feature.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="auth-form-panel">
            <div className="auth-mobile-bg">
              <div className="auth-mobile-blob blob-1"></div>
              <div className="auth-mobile-blob blob-2"></div>
            </div>

            <motion.div 
              className="auth-form-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="auth-form-card">
                {/* Header */}
                <div className="auth-form-header">
                  <div className="auth-form-logo">
                    <IonImg src="/assets/images/LOGO_ALDIENTE_SINFONDO.png" alt="ALDIENTE" />
                  </div>
                  <h1 className="auth-form-title">
                    {mode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
                  </h1>
                  <p className="auth-form-subtitle">
                    {mode === 'login' 
                      ? 'Ingresa tus credenciales para continuar' 
                      : 'Únete a la comunidad ALDIENTE'}
                  </p>
                </div>

                {/* Tabs */}
                <div className="auth-tabs">
                  <button 
                    className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                    onClick={() => setMode('login')}
                  >
                    Iniciar sesión
                  </button>
                  <button 
                    className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                    onClick={() => setMode('register')}
                  >
                    Crear cuenta
                  </button>
                </div>

                {/* Role Selector (Register only) */}
                {mode === 'register' && (
                  <div className="auth-role-selector">
                    <span className="auth-role-label">Soy:</span>
                    <div className="auth-role-options">
                      <button 
                        className={`auth-role-option ${role === 'patient' ? 'active' : ''}`}
                        onClick={() => setRole('patient')}
                      >
                        <IonIcon icon={personOutline} />
                        Paciente
                      </button>
                      <button 
                        className={`auth-role-option ${role === 'student' ? 'active' : ''}`}
                        onClick={() => setRole('student')}
                      >
                        <IonIcon icon={schoolOutline} />
                        Estudiante
                      </button>
                    </div>
                  </div>
                )}

                {/* Form Fields */}
                <div className="auth-form-fields">
                  {/* Email */}
                  <div className="auth-input-group">
                    <div className="auth-input-wrapper">
                      <IonIcon icon={mailOutline} />
                      <IonInput
                        type="email"
                        value={email}
                        placeholder={mode === 'login' ? 'Correo electrónico' : (role === 'student' ? 'Correo institucional' : 'Correo electrónico')}
                        onIonInput={(e: any) => setEmail(e.detail.value)}
                        onKeyDown={(e: any) => { if (e.key === 'Enter' && mode === 'login') onSubmit(); }}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="auth-input-group">
                    <div className="auth-input-wrapper">
                      <IonIcon icon={lockClosedOutline} />
                      <IonInput
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        placeholder="Contraseña"
                        onIonInput={(e: any) => setPassword(e.detail.value)}
                        onKeyDown={(e: any) => { if (e.key === 'Enter') { mode === 'login' ? onSubmit() : onRegister(); } }}
                      />
                      <button className="auth-password-toggle" onClick={() => setShowPassword(v => !v)}>
                        <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} />
                      </button>
                    </div>
                  </div>

                  {/* Register Fields */}
                  {mode === 'register' && (
                    <>
                      {/* Confirm Password */}
                      <div className="auth-input-group">
                        <div className="auth-input-wrapper">
                          <IonIcon icon={lockClosedOutline} />
                          <IonInput
                            type="password"
                            value={confirmPassword}
                            placeholder="Confirmar contraseña"
                            onIonInput={(e: any) => setConfirmPassword(e.detail.value)}
                          />
                        </div>
                      </div>

                      {/* RUT */}
                      <div className="auth-input-group">
                        <div className="auth-input-wrapper">
                          <IonIcon icon={cardOutline} />
                          <IonInput
                            type="text"
                            value={rut}
                            placeholder="RUT (12.345.678-9)"
                            onIonInput={(e: any) => {
                              const formatted = formatRutOnInput(e.detail.value || '');
                              setRut(formatted);
                            }}
                            maxlength={12}
                          />
                        </div>
                      </div>

                      {/* Patient Fields */}
                      {role === 'patient' && (
                        <>
                          <div className="auth-input-group">
                            <div className="auth-input-wrapper">
                              <IonIcon icon={personOutline} />
                              <IonInput
                                value={name}
                                placeholder="Nombre y apellido"
                                onIonInput={(e: any) => setName(e.detail.value)}
                              />
                            </div>
                          </div>
                          <div className="auth-input-group">
                            <div className="auth-input-wrapper">
                              <IonIcon icon={calendarOutline} />
                              <IonInput
                                type="date"
                                value={birthDate}
                                placeholder="Fecha de nacimiento"
                                onIonInput={(e: any) => setBirthDate(e.detail.value)}
                              />
                            </div>
                          </div>
                          <div className="auth-input-group">
                            <div className="auth-input-wrapper">
                              <IonIcon icon={locationOutline} />
                              <IonInput
                                value={location}
                                placeholder="Ciudad"
                                onIonInput={(e: any) => setLocation(e.detail.value)}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Student Fields */}
                      {role === 'student' && (
                        <>
                          <div className="auth-input-group">
                            <div className="auth-input-wrapper">
                              <IonIcon icon={personOutline} />
                              <IonInput
                                value={fullName}
                                placeholder="Nombre completo"
                                onIonInput={(e: any) => setFullName(e.detail.value)}
                              />
                            </div>
                          </div>
                          <div className="auth-input-group">
                            <div className="auth-input-wrapper">
                              <IonIcon icon={schoolOutline} />
                              <IonInput
                                value={university}
                                placeholder="Universidad"
                                onIonInput={(e: any) => setUniversity(e.detail.value)}
                              />
                            </div>
                          </div>
                          <div className="auth-input-group">
                            <div className="auth-input-wrapper">
                              <IonIcon icon={calendarOutline} />
                              <IonInput
                                type="number"
                                value={careerYear}
                                placeholder="Año de carrera"
                                onIonInput={(e: any) => setCareerYear(e.detail.value)}
                              />
                            </div>
                          </div>
                          <div className="auth-input-group">
                            <div className="auth-input-wrapper">
                              <IonIcon icon={locationOutline} />
                              <IonInput
                                value={location}
                                placeholder="Ubicación (opcional)"
                                onIonInput={(e: any) => setLocation(e.detail.value)}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Terms */}
                      <div className="auth-terms">
                        <IonCheckbox 
                          checked={acceptTerms} 
                          onIonChange={(e: any) => setAcceptTerms(!!e.detail.checked)} 
                        />
                        <span className="auth-terms-text">
                          He leído y acepto los{' '}
                          <a href="#" onClick={(e) => { e.preventDefault(); setShowTerms(true); }}>
                            Términos y Condiciones
                          </a>{' '}
                          y la Política de Privacidad
                        </span>
                      </div>
                    </>
                  )}

                  {/* Error Message */}
                  {error && (
                    <motion.div 
                      className="auth-error"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <IonIcon icon={alertCircleOutline} />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    className="auth-submit-btn"
                    onClick={mode === 'login' ? onSubmit : onRegister}
                    disabled={loading || regLoading || (mode === 'register' && !acceptTerms)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                    <IonIcon icon={arrowForwardOutline} />
                  </motion.button>

                  {/* Footer Links */}
                  <div className="auth-footer-links">
                    {mode === 'login' ? (
                      <>
                        <a href="/forgot-password" className="auth-footer-link">
                          ¿Olvidaste tu contraseña?
                        </a>
                        <a href="#" className="auth-footer-link" onClick={(e) => { e.preventDefault(); setMode('register'); }}>
                          Crear cuenta
                        </a>
                      </>
                    ) : (
                      <>
                        <span></span>
                        <a href="#" className="auth-footer-link" onClick={(e) => { e.preventDefault(); setMode('login'); }}>
                          Ya tengo cuenta
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {/* Security Note */}
                <div className="auth-security-note">
                  <IonIcon icon={shieldCheckmarkOutline} />
                  <span>Tus datos están protegidos con los más altos estándares de seguridad.</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <IonLoading isOpen={loading} message="Iniciando sesión..." />
        <IonLoading isOpen={regLoading} message="Creando cuenta..." />
        <IonToast isOpen={toastOpen} message={error} duration={2200} color="danger" onDidDismiss={() => setToastOpen(false)} />
        <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;
