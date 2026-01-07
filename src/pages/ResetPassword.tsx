import React, { useMemo, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonIcon,
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { lockClosedOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { api } from '../shared/api/ApiClient';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const ResetPassword: React.FC = () => {
  const q = useQuery();
  const history = useHistory();
  const token = q.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('Token inválido');
      return;
    }
    if (!newPassword || !confirmPassword) {
      setError('Completa ambos campos');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/password/reset', { token, newPassword, confirmPassword });
      setDone(true);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'No se pudo restablecer la contraseña';
      setError(msg);
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
          <IonTitle>Restablecer Contraseña</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ '--background': '#FAFAFA' }}>
        <div style={{ padding: '20px', maxWidth: 420, margin: '0 auto' }}>
          {!done ? (
            <IonCard style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <IonCardContent style={{ padding: 24 }}>
                <form onSubmit={onSubmit}>
                  {error ? (
                    <IonText color="danger"><p>{error}</p></IonText>
                  ) : null}
                  <IonItem lines="none" style={{ marginBottom: 16 }}>
                    <IonLabel position="stacked">Nueva contraseña</IonLabel>
                    <IonInput
                      type="password"
                      value={newPassword}
                      onIonChange={(e) => setNewPassword(e.detail.value as string)}
                      placeholder="Mínimo 6 caracteres"
                    >
                      <IonIcon slot="start" icon={lockClosedOutline} />
                    </IonInput>
                  </IonItem>
                  <IonItem lines="none" style={{ marginBottom: 20 }}>
                    <IonLabel position="stacked">Confirmar contraseña</IonLabel>
                    <IonInput
                      type="password"
                      value={confirmPassword}
                      onIonChange={(e) => setConfirmPassword(e.detail.value as string)}
                    >
                      <IonIcon slot="start" icon={lockClosedOutline} />
                    </IonInput>
                  </IonItem>
                  <IonButton expand="block" type="submit" disabled={loading} style={{ height: 50, borderRadius: 12, fontWeight: 600 }}>
                    {loading ? 'Guardando...' : 'Restablecer'}
                  </IonButton>
                </form>
              </IonCardContent>
            </IonCard>
          ) : (
            <IonCard style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center' }}>
              <IonCardContent style={{ padding: 24 }}>
                <div style={{
                  background: 'linear-gradient(135deg, #4CAF50, #66BB6A)',
                  borderRadius: '50%', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
                }}>
                  <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 40, color: '#fff' }} />
                </div>
                <IonCardTitle style={{ marginBottom: 10 }}>¡Contraseña actualizada!</IonCardTitle>
                <IonText color="medium"><p>Ya puedes iniciar sesión con tu nueva contraseña.</p></IonText>
                <IonButton expand="block" onClick={() => history.push('/login')} style={{ marginTop: 14 }}>
                  Ir al login
                </IonButton>
              </IonCardContent>
            </IonCard>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ResetPassword;
