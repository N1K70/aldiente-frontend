import React, { Suspense } from 'react';
import { IonApp, IonSpinner, setupIonicReact } from '@ionic/react';
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import './theme/variables.css';
import './theme/global.css';
import './theme/modern-design.css';
import './App.css';
import Routes from './app/Routes';
import { AuthProvider } from './shared/context/AuthContext';
import { PageTransitionProvider } from './shared/context/PageTransitionContext';

setupIonicReact({ mode: 'md' });

// Componente de loading fallback
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'linear-gradient(180deg, #f8fafc 0%, #e0f2fe 100%)'
  }}>
    <IonSpinner name="crescent" color="primary" />
  </div>
);

const App: React.FC = () => {
  return (
    <IonApp>
      <Suspense fallback={<LoadingFallback />}>
        <AuthProvider>
          <PageTransitionProvider>
            <Routes />
          </PageTransitionProvider>
        </AuthProvider>
      </Suspense>
    </IonApp>
  );
};

export default App;
