import React, { useEffect, useState } from 'react';
import { 
  IonContent, 
  IonPage, 
  IonButton, 
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonFab,
  IonFabButton,
  IonRippleEffect
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { MockUser } from '../types/user';
import { 
  homeOutline,
  personOutline,
  calendarOutline,
  schoolOutline,
  heartOutline,
  starOutline,
  logInOutline,
  personAddOutline,
  shieldCheckmarkOutline,
  settingsOutline,
  chatbubbleEllipsesOutline,
  documentTextOutline,
  shieldCheckmarkOutline as shieldIcon,
  searchOutline, 
  listOutline, 
  buildOutline,
  medicalOutline,
  peopleOutline,
  timeOutline,
  locationOutline,
  cashOutline,
  chatbubbleOutline,
  documentOutline
} from 'ionicons/icons';

const Home: React.FC = () => {
  const [mockUser, setMockUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const history = useHistory();

  useEffect(() => {
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      try {
        setMockUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing mockUser from localStorage on Home page", e);
        localStorage.removeItem('mockUser'); // Limpiar si está corrupto
        setMockUser(null);
      }
    }
    setLoading(false);

    // Listener para cambios en localStorage (ej. logout desde otra pestaña o Menu.tsx)
    const handleStorageChange = () => {
      const updatedStoredUser = localStorage.getItem('mockUser');
      if (updatedStoredUser) {
        try {
          setMockUser(JSON.parse(updatedStoredUser));
        } catch (e) {
          setMockUser(null);
        }
      } else {
        setMockUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('mockUser');
    window.dispatchEvent(new Event('storage')); // Notificar a otros componentes como App.tsx
    history.push('/welcome'); // O '/login'
  };

  if (loading) { 
    return (
      <IonPage className="aldiente-page">
        <IonContent className="aldiente-content ion-padding">
          <div className="aldiente-loading">
            <div className="aldiente-spinner"></div>
            <p className="aldiente-body">Cargando aldiente...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="ion-padding" style={{
        '--background': '#FAFAFA',
        minHeight: '100vh'
      }}>
        {/* Hero Section - Material Design 3 */}
        <div style={{
          background: 'linear-gradient(135deg, #D40710 0%, #FF5252 100%)',
          borderRadius: '0 0 32px 32px',
          padding: '48px 24px',
          marginBottom: '24px',
          boxShadow: '0 8px 32px rgba(212, 7, 16, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            textAlign: 'center',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '50%',
              width: '80px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <IonIcon 
                icon={medicalOutline} 
                style={{ 
                  fontSize: '40px', 
                  color: '#FFFFFF',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                }} 
              />
            </div>
            
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700',
              color: '#FFFFFF',
              margin: '0 0 8px 0',
              letterSpacing: '-0.02em',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              aldiente
            </h1>
            
            <p style={{ 
              fontSize: '1.125rem', 
              color: '#FFFFFF',
              opacity: '0.9',
              fontWeight: '400',
              maxWidth: '280px',
              margin: '0 auto'
            }}>
              {mockUser ? `Bienvenido/a, ${mockUser.email}` : 'Conectando sonrisas, creando futuros'}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          padding: '0 20px 100px 20px',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          {mockUser ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Welcome Card */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                border: '1px solid #F0F0F0'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #D40710, #FF5252)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IonIcon icon={peopleOutline} style={{ fontSize: '24px', color: '#FFFFFF' }} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: '#1A1A1A',
                      margin: '0 0 4px 0'
                    }}>
                      ¡Bienvenido/a!
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#666',
                      margin: 0
                    }}>
                      {mockUser.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Cards */}
              {mockUser.role === 'student' && (
                <>
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #F0F0F0',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'pointer'
                  }} onClick={() => history.push('/services')}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #D40710, #FF5252)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <IonIcon icon={buildOutline} style={{ fontSize: '20px', color: '#FFFFFF' }} />
                      </div>
                      <div>
                        <h4 style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: '#1A1A1A',
                          margin: '0 0 4px 0'
                        }}>
                          Mis Servicios
                        </h4>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#666',
                          margin: 0
                        }}>
                          Administra tus tratamientos
                        </p>
                      </div>
                    </div>
                    <IonButton 
                      expand="block" 
                      style={{
                        '--background': '#D40710',
                        '--border-radius': '12px',
                        '--box-shadow': '0 2px 8px rgba(212, 7, 16, 0.3)',
                        height: '44px',
                        fontWeight: '600',
                        fontSize: '0.875rem'
                      }}
                    >
                      Gestionar
                    </IonButton>
                  </div>

                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #F0F0F0',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'pointer'
                  }} onClick={() => history.push('/appointments')}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #FF5252, #FF7B7B)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <IonIcon icon={listOutline} style={{ fontSize: '20px', color: '#FFFFFF' }} />
                      </div>
                      <div>
                        <h4 style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: '#1A1A1A',
                          margin: '0 0 4px 0'
                        }}>
                          Solicitudes
                        </h4>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#666',
                          margin: 0
                        }}>
                          Citas pendientes
                        </p>
                      </div>
                    </div>
                    <IonButton 
                      expand="block" 
                      fill="outline"
                      style={{
                        '--border-color': '#FF5252',
                        '--color': '#FF5252',
                        '--border-radius': '12px',
                        height: '44px',
                        fontWeight: '600',
                        fontSize: '0.875rem'
                      }}
                    >
                      Ver solicitudes
                    </IonButton>
                  </div>
                </>
              )}

              {mockUser.role === 'patient' && (
                <>
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #F0F0F0',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'pointer'
                  }} onClick={() => history.push('/services')}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #4CAF50, #66BB6A)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <IonIcon icon={searchOutline} style={{ fontSize: '20px', color: '#FFFFFF' }} />
                      </div>
                      <div>
                        <h4 style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: '#1A1A1A',
                          margin: '0 0 4px 0'
                        }}>
                          Buscar Servicios
                        </h4>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#666',
                          margin: 0
                        }}>
                          Encuentra tratamientos disponibles
                        </p>
                      </div>
                    </div>
                    <IonButton 
                      expand="block" 
                      style={{
                        '--background': '#4CAF50',
                        '--border-radius': '12px',
                        '--box-shadow': '0 2px 8px rgba(76, 175, 80, 0.3)',
                        height: '44px',
                        fontWeight: '600',
                        fontSize: '0.875rem'
                      }}
                    >
                      Explorar
                    </IonButton>
                  </div>

                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #F0F0F0',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'pointer'
                  }} onClick={() => history.push('/appointments')}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #9C27B0, #BA68C8)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <IonIcon icon={calendarOutline} style={{ fontSize: '20px', color: '#FFFFFF' }} />
                      </div>
                      <div>
                        <h4 style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: '#1A1A1A',
                          margin: '0 0 4px 0'
                        }}>
                          Mis Citas
                        </h4>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#666',
                          margin: 0
                        }}>
                          Gestiona tus citas
                        </p>
                      </div>
                    </div>
                    <IonButton 
                      expand="block" 
                      fill="outline"
                      style={{
                        '--border-color': '#9C27B0',
                        '--color': '#9C27B0',
                        '--border-radius': '12px',
                        height: '44px',
                        fontWeight: '600',
                        fontSize: '0.875rem'
                      }}
                    >
                      Ver citas
                    </IonButton>
                  </div>
                </>
              )}

              <div style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                border: '1px solid #F0F0F0',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer'
              }} onClick={() => history.push('/profile')}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #FF9800, #FFB74D)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IonIcon icon={personAddOutline} style={{ fontSize: '20px', color: '#FFFFFF' }} />
                  </div>
                  <div>
                    <h4 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#1A1A1A',
                      margin: '0 0 4px 0'
                    }}>
                      Mi Perfil
                    </h4>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#666',
                      margin: 0
                    }}>
                      Actualiza tu información
                    </p>
                  </div>
                </div>
                <IonButton 
                  expand="block" 
                  fill="outline"
                  style={{
                    '--border-color': '#FF9800',
                    '--color': '#FF9800',
                    '--border-radius': '12px',
                    height: '44px',
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}
                >
                  Editar
                </IonButton>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              alignItems: 'center',
              padding: '20px 0'
            }}>
              {/* Hero Illustration */}
              <div style={{
                width: '120px',
                height: '120px',
                margin: '0 auto 32px'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #D40710, #FF5252)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 32px rgba(212, 7, 16, 0.3)'
                }}>
                  <IonIcon 
                    icon={medicalOutline} 
                    style={{ 
                      fontSize: '48px', 
                      color: '#FFFFFF',
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                    }} 
                  />
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#1A1A1A',
                  margin: '0 0 8px 0',
                  letterSpacing: '-0.02em'
                }}>
                  aldiente
                </h1>
                
                <p style={{
                  fontSize: '1.125rem',
                  color: '#666',
                  margin: '0 0 32px 0',
                  lineHeight: '1.5',
                  maxWidth: '280px'
                }}>
                  Conectamos estudiantes de odontología con pacientes que necesitan servicios dentales accesibles y de calidad
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                width: '100%'
              }}>
                <IonButton 
                  expand="block" 
                  style={{
                    '--background': '#D40710',
                    '--border-radius': '16px',
                    '--box-shadow': '0 4px 16px rgba(212, 7, 16, 0.3)',
                    height: '56px',
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}
                  onClick={() => history.push('/login')}
                >
                  <IonIcon slot="start" icon={logInOutline} />
                  Iniciar Sesión
                </IonButton>

                <IonButton 
                  expand="block" 
                  style={{
                    '--background': '#FFFFFF',
                    '--color': '#D40710',
                    '--border-radius': '16px',
                    '--border-color': '#D40710',
                    '--border-width': '2px',
                    height: '56px',
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}
                  onClick={() => history.push('/login')}
                >
                  <IonIcon slot="start" icon={personAddOutline} />
                  Crear Cuenta
                </IonButton>

                <IonButton 
                  expand="block" 
                  fill="clear"
                  style={{
                    '--color': '#666',
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}
                  onClick={() => history.push('/services')}
                >
                  <IonIcon slot="start" icon={schoolOutline} />
                  Explorar Servicios
                </IonButton>
              </div>

              {/* Quick Actions */}
              <div style={{ marginTop: '32px' }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  color: '#1A1A1A', 
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  Acceso Rápido
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  marginTop: '16px'
                }}>
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #F0F0F0',
                    cursor: 'pointer'
                  }} onClick={() => history.push('/chat')}>
                    <IonIcon icon={chatbubbleOutline} style={{ fontSize: '24px', color: '#D40710', marginBottom: '8px' }} />
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1A1A1A', margin: '0 0 4px 0' }}>
                      Chat
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>
                      Comunicación directa
                    </p>
                  </div>

                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #F0F0F0',
                    cursor: 'pointer'
                  }} onClick={() => history.push('/documents')}>
                    <IonIcon icon={documentOutline} style={{ fontSize: '24px', color: '#4CAF50', marginBottom: '8px' }} />
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1A1A1A', margin: '0 0 4px 0' }}>
                      Documentos
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>
                      Gestión de archivos
                    </p>
                  </div>

                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #F0F0F0',
                    cursor: 'pointer'
                  }} onClick={() => history.push('/reviews')}>
                    <IonIcon icon={starOutline} style={{ fontSize: '24px', color: '#FF9800', marginBottom: '8px' }} />
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1A1A1A', margin: '0 0 4px 0' }}>
                      Calificaciones
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>
                      Evaluar servicios
                    </p>
                  </div>

                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #F0F0F0',
                    cursor: 'pointer'
                  }} onClick={() => history.push('/terms')}>
                    <IonIcon icon={shieldCheckmarkOutline} style={{ fontSize: '24px', color: '#9C27B0', marginBottom: '8px' }} />
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1A1A1A', margin: '0 0 4px 0' }}>
                      Términos
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>
                      Condiciones de uso
                    </p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                marginTop: '32px'
              }}>
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  border: '1px solid #F0F0F0'
                }}>
                  <IonIcon icon={heartOutline} style={{ fontSize: '24px', color: '#4CAF50', marginBottom: '8px' }} />
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1A1A1A', margin: '0 0 4px 0' }}>
                    Calidad
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>
                    Supervisión profesional
                  </p>
                </div>

                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  border: '1px solid #F0F0F0'
                }}>
                  <IonIcon icon={starOutline} style={{ fontSize: '24px', color: '#FF9800', marginBottom: '8px' }} />
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1A1A1A', margin: '0 0 4px 0' }}>
                    Confianza
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>
                    Estudiantes verificados
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
