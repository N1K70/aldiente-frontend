import React, { useState } from 'react';
import { IonContent, IonPage, IonButton, IonImg, IonText, IonGrid, IonRow, IonCol } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './WelcomePage.css';

const WelcomePage: React.FC = () => {
  const history = useHistory();
  const [language, setLanguage] = useState<'es' | 'en'>('es');

  const texts = {
    es: {
      subtitle: "Conecta con estudiantes de odontología fácilmente",
      studentButton: "Soy Estudiante",
      patientButton: "Soy Paciente",
      alreadyAccount: "¿Ya tienes una cuenta?",
      login: "Inicia Sesión",
      languageButton: "Switch to English"
    },
    en: {
      subtitle: "Connect with dental students easily",
      studentButton: "I'm a Student",
      patientButton: "I'm a Patient",
      alreadyAccount: "Already have an account?",
      login: "Log In",
      languageButton: "Cambiar a Español"
    }
  };

  const currentTexts = texts[language];

  const toggleLanguage = () => {
    setLanguage(prevLang => prevLang === 'es' ? 'en' : 'es');
  };

  const goToRegister = () => {
    history.push('/login');
  };

  const goToLogin = () => {
    history.push('/login');
  }

  return (
    <IonPage>
      <IonContent className="ion-padding welcome-page">
        <div className="welcome-container">
          <IonImg 
            src="/assets/images/LOGO_ALDIENTE_SINFONDO.png" 
            alt="ALDIENTE Logo" 
            className="welcome-logo-main"
          />
          <h1 className="welcome-title">ALDIENTE</h1>
          <p className="welcome-subtitle">{currentTexts.subtitle}</p>
          
          <div className="welcome-buttons ion-margin-top">
            <IonButton 
              expand="block" 
              className="welcome-button student-button ion-margin-bottom"
              onClick={goToRegister}
            >
              {currentTexts.studentButton}
            </IonButton>
            <IonButton 
              expand="block" 
              className="welcome-button patient-button"
              onClick={goToRegister}
              color="secondary" 
            >
              {currentTexts.patientButton}
            </IonButton>

            <div className="login-prompt ion-text-center ion-margin-top">
              <IonText color="medium">
                {currentTexts.alreadyAccount} 
              </IonText>
              <IonButton fill="clear" onClick={goToLogin} className="login-link-button">
                {currentTexts.login}
              </IonButton>
            </div>
            
            <div className="smile-icon ion-margin-top">
              <span role="img" aria-label="smile">😊</span>
            </div>

            <IonButton 
              fill="outline" 
              expand="block" 
              onClick={toggleLanguage} 
              className="ion-margin-top language-button"
            >
              {currentTexts.languageButton}
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default WelcomePage;
