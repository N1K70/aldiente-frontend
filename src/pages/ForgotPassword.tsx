import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonBackButton,
  IonButtons,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { api } from '../shared/api/ApiClient';
import {
  mailOutline,
  arrowBackOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const history = useHistory();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await api.post('/api/auth/password/forgot', { email });
      // En entorno local, el backend devuelve devResetLink para pruebas sin SMTP
      const link = (res?.data as any)?.devResetLink || null;
      if (link) setDevLink(link);
      setSent(true);
    } catch (err) {
      // por seguridad, no revelamos existencia de correo; mostramos éxito igualmente
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#FFFFFF' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/login" />
          </IonButtons>
          <IonTitle>Recuperar Contraseña</IonTitle>
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
              <IonIcon icon={mailOutline} style={{ fontSize: '40px', color: '#fff' }} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 10px 0' }}>
              ¿Olvidaste tu contraseña?
            </h1>
            <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
              Te enviaremos un enlace para restablecer tu contraseña
            </p>
          </div>

          {!sent ? (
            <IonCard style={{
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              margin: 0,
            }}>
              <IonCardContent style={{ padding: '24px' }}>
                <form onSubmit={handleResetPassword} autoComplete="off">
                  <IonItem lines="none" style={{ marginBottom: '20px' }}>
                    <IonLabel position="stacked">Correo Electrónico</IonLabel>
                    <IonInput
                      type="email"
                      value={email}
                      onIonChange={(e) => setEmail(e.detail.value!)}
                      placeholder="tu@email.com"
                      required
                      style={{
                        '--padding-start': '0',
                        '--padding-end': '0',
                      }}
                      autocomplete="off"
                      autocapitalize="off"
                      autocorrect="off"
                      spellcheck={false}
                      inputmode="email"
                    />
                  </IonItem>

                  <IonButton
                    expand="block"
                    type="submit"
                    disabled={loading}
                    style={{
                      height: '50px',
                      borderRadius: '12px',
                      fontWeight: '600',
                      background: 'linear-gradient(135deg, #D40710, #FF5252)',
                    }}
                  >
                    {loading ? 'Enviando...' : 'Enviar Enlace'}
                  </IonButton>
                </form>
              </IonCardContent>
            </IonCard>
          ) : (
            <IonCard style={{
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              margin: 0,
            }}>
              <IonCardContent style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #4CAF50, #66BB6A)',
                  borderRadius: '50%',
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}>
                  <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: '40px', color: '#fff' }} />
                </div>
                <IonCardTitle style={{ marginBottom: '10px' }}>
                  ¡Correo Enviado!
                </IonCardTitle>
                <IonText color="medium">
                  <p>Hemos enviado un enlace de recuperación a {email}. Por favor revisa tu bandeja de entrada.</p>
                </IonText>
                {devLink && (
                  <div style={{ marginTop: 12 }}>
                    <IonText color="medium">
                      <p>
                        Modo local: también puedes usar este enlace directo de prueba:
                      </p>
                    </IonText>
                    <div style={{ wordBreak: 'break-all', fontSize: 13, marginBottom: 8 }}>
                      {devLink}
                    </div>
                    <IonButton size="small" onClick={() => window.open(devLink!, '_blank')}>Abrir enlace</IonButton>
                  </div>
                )}
                <IonButton
                  expand="block"
                  fill="clear"
                  onClick={() => history.push('/login')}
                  style={{ marginTop: '20px' }}
                >
                  Volver al Login
                </IonButton>
              </IonCardContent>
            </IonCard>
          )}

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <IonButton
              fill="clear"
              onClick={() => history.push('/login')}
              style={{ color: '#666' }}
            >
              <IonIcon icon={arrowBackOutline} slot="start" />
              Volver al Login
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ForgotPassword;
