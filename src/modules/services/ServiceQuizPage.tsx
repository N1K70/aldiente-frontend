import React, { useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton } from '@ionic/react';
import ServiceQuiz from './ServiceQuiz';
import ServiceQuizResults from './ServiceQuizResults';

const ServiceQuizPage: React.FC = () => {
  const [answers, setAnswers] = useState<Record<string, string[]> | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleQuizComplete = (quizAnswers: Record<string, string[]>) => {
    setAnswers(quizAnswers);
    setShowResults(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/home" />
          </IonButtons>
          <IonTitle>
            {showResults ? 'Resultados' : 'Encuentra tu servicio ideal'}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {!showResults ? (
          <ServiceQuiz onComplete={handleQuizComplete} />
        ) : (
          answers && <ServiceQuizResults answers={answers} />
        )}
      </IonContent>
    </IonPage>
  );
};

export default ServiceQuizPage;
