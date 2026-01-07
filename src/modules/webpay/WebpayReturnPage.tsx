import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonSpinner,
  IonIcon,
  IonText,
} from '@ionic/react';
import { checkmarkCircle, closeCircle, warningOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { commitWebpayPayment, cancelWebpayPayment } from './webpay.api';

const WebpayReturnPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'cancelled'>('loading');
  const [message, setMessage] = useState<string>('Procesando pago...');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Obtener parámetros de la URL
        const params = new URLSearchParams(location.search);
        const token_ws = params.get('token_ws');
        const TBK_TOKEN = params.get('TBK_TOKEN');
        const TBK_ID_SESION = params.get('TBK_ID_SESION');
        const TBK_ORDEN_COMPRA = params.get('TBK_ORDEN_COMPRA');

        // Verificar si es una cancelación
        if (TBK_TOKEN && TBK_ORDEN_COMPRA) {
          console.log('[Webpay] Transacción cancelada por el usuario');
          
          await cancelWebpayPayment({
            TBK_TOKEN,
            TBK_ID_SESION: TBK_ID_SESION || '',
            TBK_ORDEN_COMPRA,
          });

          setStatus('cancelled');
          setMessage('Has cancelado el pago');
          return;
        }

        // Verificar si hay token de pago normal
        if (!token_ws) {
          setStatus('error');
          setMessage('No se recibió información del pago');
          return;
        }

        // Confirmar el pago
        console.log('[Webpay] Confirmando pago con token:', token_ws);
        const result = await commitWebpayPayment({ token_ws });

        console.log('[Webpay] Resultado:', result);

        if (result.status === 'approved') {
          setStatus('success');
          setMessage('¡Pago aprobado exitosamente!');
          setPaymentDetails(result);
        } else {
          setStatus('error');
          setMessage('El pago fue rechazado');
          setPaymentDetails(result);
        }
      } catch (error: any) {
        console.error('[Webpay] Error al procesar pago:', error);
        setStatus('error');
        setMessage(error.message || 'Error al procesar el pago');
      }
    };

    processPayment();
  }, [location.search]);

  const handleContinue = () => {
    if (status === 'success') {
      history.replace('/tabs/profile/reservas');
    } else {
      history.replace('/tabs/home');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Resultado del Pago</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '20px'
        }}>
          {status === 'loading' && (
            <>
              <IonSpinner name="crescent" style={{ width: '60px', height: '60px' }} />
              <IonText>
                <h2>{message}</h2>
              </IonText>
            </>
          )}

          {status === 'success' && (
            <>
              <IonIcon 
                icon={checkmarkCircle} 
                style={{ fontSize: '80px', color: 'var(--ion-color-success)' }}
              />
              <IonCard style={{ width: '100%', maxWidth: '500px' }}>
                <IonCardHeader>
                  <IonCardTitle style={{ color: 'var(--ion-color-success)' }}>
                    {message}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {paymentDetails && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div><strong>Orden:</strong> {paymentDetails.buyOrder}</div>
                      <div><strong>Monto:</strong> ${paymentDetails.amount?.toLocaleString('es-CL')} CLP</div>
                      {paymentDetails.authorizationCode && (
                        <div><strong>Código de autorización:</strong> {paymentDetails.authorizationCode}</div>
                      )}
                      {paymentDetails.cardNumber && (
                        <div><strong>Tarjeta:</strong> **** **** **** {paymentDetails.cardNumber}</div>
                      )}
                      <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
                        <IonText color="primary">
                          <p style={{ margin: 0, fontSize: '14px' }}>
                            Tu reserva ha sido confirmada. Puedes verla en la sección "Mis Reservas".
                          </p>
                        </IonText>
                      </div>
                    </div>
                  )}
                  <IonButton 
                    expand="block" 
                    onClick={handleContinue}
                    style={{ marginTop: '20px' }}
                  >
                    Ver mis reservas
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </>
          )}

          {status === 'error' && (
            <>
              <IonIcon 
                icon={closeCircle} 
                style={{ fontSize: '80px', color: 'var(--ion-color-danger)' }}
              />
              <IonCard style={{ width: '100%', maxWidth: '500px' }}>
                <IonCardHeader>
                  <IonCardTitle style={{ color: 'var(--ion-color-danger)' }}>
                    {message}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {paymentDetails && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div><strong>Orden:</strong> {paymentDetails.buyOrder}</div>
                      <div><strong>Código de respuesta:</strong> {paymentDetails.responseCode}</div>
                    </div>
                  )}
                  <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
                    <IonText color="danger">
                      <p style={{ margin: 0, fontSize: '14px' }}>
                        El pago no pudo ser procesado. Por favor, intenta nuevamente o usa otro método de pago.
                      </p>
                    </IonText>
                  </div>
                  <IonButton 
                    expand="block" 
                    onClick={handleContinue}
                    style={{ marginTop: '20px' }}
                  >
                    Volver al inicio
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </>
          )}

          {status === 'cancelled' && (
            <>
              <IonIcon 
                icon={warningOutline} 
                style={{ fontSize: '80px', color: 'var(--ion-color-warning)' }}
              />
              <IonCard style={{ width: '100%', maxWidth: '500px' }}>
                <IonCardHeader>
                  <IonCardTitle style={{ color: 'var(--ion-color-warning)' }}>
                    {message}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div style={{ padding: '12px', backgroundColor: '#fffbeb', borderRadius: '8px' }}>
                    <IonText color="warning">
                      <p style={{ margin: 0, fontSize: '14px' }}>
                        Has cancelado el proceso de pago. Tu reserva no ha sido confirmada.
                      </p>
                    </IonText>
                  </div>
                  <IonButton 
                    expand="block" 
                    onClick={handleContinue}
                    style={{ marginTop: '20px' }}
                  >
                    Volver al inicio
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default WebpayReturnPage;
