import React, { useState } from 'react';
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
  IonBackButton,
  IonButtons,
  IonCheckbox,
  IonItem,
  IonLabel,
  IonTextarea,
  IonInput,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  documentTextOutline,
  checkmarkOutline,
  closeOutline,
  alertCircleOutline,
} from 'ionicons/icons';

interface ConsentProps {
  appointmentId?: string;
  studentName?: string;
  procedure?: string;
}

const Consent: React.FC<ConsentProps> = ({ 
  appointmentId = '123', 
  studentName = 'Estudiante de Odontología', 
  procedure = 'Limpieza Dental' 
}) => {
  const [consents, setConsents] = useState({
    procedure: false,
    risks: false,
    alternatives: false,
    questions: false,
    voluntariness: false,
  });
  const [signature, setSignature] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const history = useHistory();

  const allConsentsAccepted = Object.values(consents).every(Boolean) && signature.trim();

  const handleConsentChange = (field: keyof typeof consents) => {
    setConsents(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleAccept = () => {
    // Aquí se guardaría el consentimiento
    alert('Consentimiento informado guardado exitosamente');
    history.goBack();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#FFFFFF' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/appointments" />
          </IonButtons>
          <IonTitle>Consentimiento Informado</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#FAFAFA' }}>
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
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
              <IonIcon icon={documentTextOutline} style={{ fontSize: '40px', color: '#fff' }} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 10px 0' }}>
              Consentimiento Informado
            </h1>
            <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
              Procedimiento: {procedure}
            </p>
            <p style={{ fontSize: '14px', color: '#666', margin: '5px 0 0 0' }}>
              Estudiante: {studentName}
            </p>
          </div>

          <IonCard style={{
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            margin: '0 0 20px 0',
          }}>
            <IonCardHeader>
              <IonCardTitle style={{ color: '#D40710' }}>
                <IonIcon icon={alertCircleOutline} style={{ marginRight: '8px' }} />
                Información Importante
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText color="medium" style={{ lineHeight: '1.6' }}>
                <p>
                  Este consentimiento informado describe el procedimiento dental que se realizará, 
                  sus riesgos, beneficios y alternativas. Tu participación es voluntaria y puedes 
                  retirar tu consentimiento en cualquier momento.
                </p>
              </IonText>
            </IonCardContent>
          </IonCard>

          <IonCard style={{
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            margin: '0 0 20px 0',
          }}>
            <IonCardHeader>
              <IonCardTitle>Consentimientos Requeridos</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <IonItem lines="none">
                  <IonCheckbox
                    checked={consents.procedure}
                    onIonChange={() => handleConsentChange('procedure')}
                    slot="start"
                  />
                  <IonLabel>
                    <h3>Procedimiento</h3>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                      Entiendo que se realizará {procedure} y acepto los riesgos asociados
                    </p>
                  </IonLabel>
                </IonItem>

                <IonItem lines="none">
                  <IonCheckbox
                    checked={consents.risks}
                    onIonChange={() => handleConsentChange('risks')}
                    slot="start"
                  />
                  <IonLabel>
                    <h3>Riesgos y Complicaciones</h3>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                      He sido informado sobre los posibles riesgos, complicaciones y efectos secundarios
                    </p>
                  </IonLabel>
                </IonItem>

                <IonItem lines="none">
                  <IonCheckbox
                    checked={consents.alternatives}
                    onIonChange={() => handleConsentChange('alternatives')}
                    slot="start"
                  />
                  <IonLabel>
                    <h3>Alternativas</h3>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                      He sido informado sobre las alternativas disponibles y sus riesgos/beneficios
                    </p>
                  </IonLabel>
                </IonItem>

                <IonItem lines="none">
                  <IonCheckbox
                    checked={consents.questions}
                    onIonChange={() => handleConsentChange('questions')}
                    slot="start"
                  />
                  <IonLabel>
                    <h3>Preguntas Respondidas</h3>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                      Todas mis preguntas han sido respondidas satisfactoriamente
                    </p>
                  </IonLabel>
                </IonItem>

                <IonItem lines="none">
                  <IonCheckbox
                    checked={consents.voluntariness}
                    onIonChange={() => handleConsentChange('voluntariness')}
                    slot="start"
                  />
                  <IonLabel>
                    <h3>Voluntariedad</h3>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                      Mi participación es voluntaria y puedo retirar mi consentimiento en cualquier momento
                    </p>
                  </IonLabel>
                </IonItem>
              </div>
            </IonCardContent>
          </IonCard>

          <IonCard style={{
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            margin: '0 0 20px 0',
          }}>
            <IonCardHeader>
              <IonCardTitle>Firma Digital</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <IonItem>
                  <IonLabel position="stacked">Nombre Completo</IonLabel>
                  <IonInput
                    value={signature}
                    onIonChange={(e: any) => setSignature(e.detail.value!)}
                    placeholder="Tu nombre completo"
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Fecha</IonLabel>
                  <IonInput
                    type="date"
                    value={date}
                    onIonChange={(e: any) => setDate(e.detail.value!)}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Comentarios Adicionales (opcional)</IonLabel>
                  <IonTextarea
                    placeholder="Cualquier comentario o pregunta adicional"
                    rows={3}
                  />
                </IonItem>
              </div>
            </IonCardContent>
          </IonCard>

          <div style={{
            background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
            borderRadius: '12px',
            padding: '20px',
            margin: '20px 0',
            borderLeft: '4px solid #FF9800',
          }}>
            <h4 style={{ color: '#FF9800', margin: '0 0 10px 0' }}>
              Información sobre el Procedimiento
            </h4>
            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
              <p><strong>Procedimiento:</strong> {procedure}</p>
              <p><strong>Estudiante:</strong> {studentName}</p>
              <p><strong>Supervisor:</strong> Dr. Supervisor (odontólogo licenciado)</p>
              <p><strong>Duración estimada:</strong> 45-60 minutos</p>
              <p><strong>Riesgos potenciales:</strong> Malestar temporal, sensibilidad</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <IonButton
              expand="block"
              disabled={!allConsentsAccepted}
              onClick={handleAccept}
              style={{
                height: '50px',
                borderRadius: '12px',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #4CAF50, #66BB6A)',
              }}
            >
              <IonIcon icon={checkmarkOutline} slot="start" />
              Aceptar y Firmar
            </IonButton>
            
            <IonButton
              expand="block"
              fill="outline"
              onClick={() => history.goBack()}
              style={{
                height: '50px',
                borderRadius: '12px',
                fontWeight: '600',
              }}
            >
              <IonIcon icon={closeOutline} slot="start" />
              Rechazar
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Consent;
