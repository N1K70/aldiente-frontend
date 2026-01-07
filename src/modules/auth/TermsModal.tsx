import React from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent } from '@ionic/react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} initialBreakpoint={0.95} breakpoints={[0, 0.5, 0.95]}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Términos y Condiciones</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>Cerrar</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <p>
            Bienvenido a aldiente. Al utilizar esta aplicación, aceptas los siguientes términos y condiciones. 
            Este texto es de ejemplo; reemplázalo por tu contenido legal definitivo.
          </p>
          <h3>Uso del Servicio</h3>
          <p>
            - La plataforma conecta pacientes con estudiantes para la provisión de servicios odontológicos bajo supervisión.
          </p>
          <h3>Privacidad</h3>
          <p>
            - Tratamos tus datos conforme a la Política de Privacidad. Revisa detalles sobre almacenamiento, fines y derechos.
          </p>
          <h3>Responsabilidades</h3>
          <p>
            - aldiente no garantiza resultados clínicos y actúa como intermediario tecnológico.
          </p>
          <h3>Contacto</h3>
          <p>
            - Para consultas legales, contáctanos en soporte@aldiente.test.
          </p>
          <p>
            Fecha de actualización: 2025-09-11
          </p>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default TermsModal;
