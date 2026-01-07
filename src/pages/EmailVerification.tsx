import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonSpinner,
  IonInput,
  IonItem,
  IonLabel,
  IonToast,
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  mailOutline,
  checkmarkCircleOutline,
  refreshOutline,
  arrowForwardOutline,
  closeCircleOutline,
} from 'ionicons/icons';
import { api } from '../shared/api/ApiClient';

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

const EmailVerification: React.FC = () => {
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; color: string } | null>(null);
  const history = useHistory();
  const query = useQuery();

  useEffect(() => {
    const token = query.get('token');
    if (token) {
      verifyEmailToken(token);
    } else {
      setLoading(false);
    }
  }, [query]);

  const verifyEmailToken = async (token: string) => {
    try {
      setLoading(true);
      await api.post('/api/auth/email/verify', { token });
      setVerified(true);
      setError('');
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Error al verificar el email';
      setError(message);
      setVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setToast({ show: true, message: 'Por favor ingresa tu email', color: 'warning' });
      return;
    }
    
    try {
      setResendLoading(true);
      const res = await api.post('/api/auth/email/send-verification', { email });
      setToast({ show: true, message: 'Email de verificación enviado', color: 'success' });
      
      // En desarrollo, mostrar el enlace directo si está disponible
      const devLink = (res?.data as any)?.devVerificationLink;
      if (devLink) {
        console.log('Development verification link:', devLink);
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Error al enviar email';
      setToast({ show: true, message, color: 'danger' });
    } finally {
      setResendLoading(false);
    }
  };

  const handleContinue = () => {
    history.push('/login');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#FFFFFF' }}>
          <IonTitle>Verificación de Email</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent style={{ '--background': '#FAFAFA' }}>
        <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', margin: '40px 0' }}>
            <div style={{
              background: 'linear-gradient(135deg, #D40710, #FF5252)',
              borderRadius: '50%',
              width: '80px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              {loading ? (
                <IonSpinner name="crescent" style={{ color: '#fff' }} />
              ) : (
                <IonIcon 
                  icon={verified ? checkmarkCircleOutline : mailOutline} 
                  style={{ fontSize: '40px', color: '#fff' }} 
                />
              )}
            </div>
            
            {loading ? (
              <>
                <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 10px 0' }}>
                  Verificando Email
                </h1>
                <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
                  Estamos verificando tu dirección de email...
                </p>
              </>
            ) : verified ? (
              <>
                <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 10px 0' }}>
                  ¡Email Verificado!
                </h1>
                <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
                  Tu dirección de email ha sido verificada exitosamente.
                </p>
              </>
            ) : (
              <>
                <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 10px 0' }}>
                  Verifica tu Email
                </h1>
                <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
                  Por favor verifica tu dirección de email para continuar.
                </p>
              </>
            )}
          </div>

          <IonCard style={{
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            margin: 0,
          }}>
            <IonCardContent style={{ padding: '24px' }}>
              {loading ? (
                <div style={{ textAlign: 'center' }}>
                  <IonSpinner name="crescent" />
                  <IonText color="medium" style={{ display: 'block', marginTop: '10px' }}>
                    Procesando verificación...
                  </IonText>
                </div>
              ) : verified ? (
                <div style={{ textAlign: 'center' }}>
                  <IonCardTitle style={{ marginBottom: '20px', color: '#4CAF50' }}>
                    Verificación Completa
                  </IonCardTitle>
                  <IonText color="medium" style={{ marginBottom: '20px', display: 'block' }}>
                    Ahora puedes acceder a todas las funciones de aldiente.
                  </IonText>
                  <IonButton
                    expand="block"
                    onClick={handleContinue}
                    style={{
                      height: '50px',
                      borderRadius: '12px',
                      fontWeight: '600',
                      background: 'linear-gradient(135deg, #D40710, #FF5252)',
                    }}
                  >
                    Continuar
                  </IonButton>
                </div>
              ) : (
                <div>
                  <IonCardTitle style={{ marginBottom: '20px', color: error ? '#f44336' : '#666' }}>
                    {error ? 'Error de Verificación' : 'Reenviar Verificación'}
                  </IonCardTitle>
                  
                  {error && (
                    <IonText color="danger" style={{ marginBottom: '20px', display: 'block' }}>
                      {error}
                    </IonText>
                  )}
                  
                  <IonText color="medium" style={{ marginBottom: '20px', display: 'block' }}>
                    Si no recibiste el email de verificación, ingresa tu dirección de email para reenviarlo.
                  </IonText>
                  
                  <IonItem lines="none" style={{ marginBottom: '20px' }}>
                    <IonLabel position="stacked">Correo Electrónico</IonLabel>
                    <IonInput
                      type="email"
                      value={email}
                      onIonChange={(e) => setEmail(e.detail.value!)}
                      placeholder="tu@email.com"
                      style={{
                        '--padding-start': '0',
                        '--padding-end': '0',
                      }}
                      autocomplete="email"
                      autocapitalize="off"
                      autocorrect="off"
                      spellcheck={false}
                      inputmode="email"
                    />
                  </IonItem>
                  
                  <IonButton
                    expand="block"
                    onClick={handleResendEmail}
                    disabled={resendLoading}
                    style={{
                      height: '50px',
                      borderRadius: '12px',
                      fontWeight: '600',
                      background: 'linear-gradient(135deg, #D40710, #FF5252)',
                      marginBottom: '10px'
                    }}
                  >
                    {resendLoading ? 'Enviando...' : 'Reenviar Email'}
                  </IonButton>
                  
                  <IonButton
                    expand="block"
                    fill="clear"
                    onClick={handleContinue}
                    style={{ color: '#666' }}
                  >
                    Volver al Login
                  </IonButton>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
      
      <IonToast
        isOpen={!!toast?.show}
        message={toast?.message}
        color={toast?.color}
        duration={3000}
        onDidDismiss={() => setToast(null)}
      />
    </IonPage>
  );
};

export default EmailVerification;
