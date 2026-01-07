import React, { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonList, IonItem, IonLabel, IonFab, IonFabButton, IonIcon, IonItemSliding, IonItemOptions, IonItemOption, useIonAlert, IonSpinner, IonText, IonLoading } from '@ionic/react';
import { add, createOutline, trashOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { IStudentService } from '../../models/studentService';
import { MockUser } from '../../types/user';
import { StudentServiceFactory } from '../../services/student-service/StudentServiceFactory';
import { useCallback } from 'react'; // Import useCallback



const MyServices: React.FC = () => {
  const history = useHistory();
  const [services, setServices] = useState<IStudentService[]>([]);
  const [loading, setLoading] = useState(true);
  const [mockUser, setMockUser] = useState<MockUser | null>(null);
  const [presentAlert] = useIonAlert();
  // const auth = getAuth(); // Firebase no se usa
  // const user = auth.currentUser; // Firebase no se usa

  const serviceManager = StudentServiceFactory.getServiceManager();

  const getUserIdFromToken = (): string | undefined => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return undefined;
      const base64Url = token.split('.')[1];
      if (!base64Url) return undefined;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      return payload?.userId !== undefined ? String(payload.userId) : undefined;
    } catch {
      return undefined;
    }
  };

  const fetchServices = useCallback(async (studentId: string) => {
    if (!studentId) return;
    try {
      setLoading(true);
      const studentServices = await serviceManager.getServicesByStudent(studentId);
      setServices(studentServices);
    } catch (error) {
      console.error("Error al obtener los servicios:", error);
      setServices([]); // Limpiar servicios en caso de error
    } finally {
      setLoading(false);
    }
  }, [serviceManager]); // Dependencia en serviceManager

  useEffect(() => {
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      try {
        const parsedUser: MockUser = JSON.parse(storedUser);
        const ensuredUser: MockUser = { ...parsedUser };
        if (!ensuredUser.id) {
          const idFromToken = getUserIdFromToken();
          if (idFromToken) ensuredUser.id = idFromToken;
        }
        if (ensuredUser.role === 'student') {
          setMockUser(ensuredUser);
          const studentId = ensuredUser.id || getUserIdFromToken();
          if (!studentId) {
            console.warn('No se pudo determinar el ID del usuario. Redirigiendo a login.');
            history.replace('/login');
            setLoading(false);
            return;
          }
          fetchServices(studentId);
        } else {
          // Rol no es estudiante, redirigir o mostrar mensaje
          console.warn('Acceso a Mis Servicios denegado: Rol no es estudiante.');
          history.replace('/home'); // O a una página de acceso denegado
          setLoading(false);
        }
      } catch (e) {
        console.error("Error parsing mockUser from localStorage on MyServices page", e);
        localStorage.removeItem('mockUser');
        history.replace('/login');
        setLoading(false);
      }
    } else {
      // No hay usuario logueado
      history.replace('/login');
      setLoading(false);
    }

    const handleStorageChange = () => {
      const updatedStoredUser = localStorage.getItem('mockUser');
      if (updatedStoredUser) {
        try {
          const parsedUser: MockUser = JSON.parse(updatedStoredUser);
          const ensuredUser: MockUser = { ...parsedUser };
          if (!ensuredUser.id) {
            const idFromToken = getUserIdFromToken();
            if (idFromToken) ensuredUser.id = idFromToken;
          }
          if (ensuredUser.role === 'student') {
            setMockUser(ensuredUser);
            // Opcional: Volver a cargar servicios si el id cambia, aunque es poco probable
            if (mockUser && ensuredUser.id && ensuredUser.id !== mockUser.id) {
                fetchServices(ensuredUser.id);
            }
          } else {
            history.replace('/home');
          }
        } catch (e) {
          history.replace('/login');
        }
      } else {
        history.replace('/login');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [history, fetchServices, mockUser]); // mockUser en dependencias por si se usa en el listener

  // Fallback de seguridad: si por alguna razón el loading queda atascado, lo desactivamos tras 10s
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 10000);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleDelete = useCallback((serviceId: string) => {
    if (!mockUser || mockUser.role !== 'student') return;

    presentAlert({
      header: 'Confirmar Eliminación',
      message: '¿Estás seguro de que quieres eliminar este servicio?',
      buttons: [
        'Cancelar',
        {
          text: 'Eliminar',
          handler: async () => {
            if (mockUser) { // Asegurar que mockUser existe
              const studentId = mockUser.id || getUserIdFromToken();
              if (!studentId) { history.replace('/login'); return; }
              await serviceManager.deleteService(studentId, serviceId);
              fetchServices(studentId); // Recargar la lista de servicios
            }
          },
        },
      ],
    });
  }, [mockUser, presentAlert, fetchServices]); // fetchServices y mockUser como dependencias


  const handleEdit = (serviceId: string) => {
    history.push(`/my-services/edit/${serviceId}`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Mis Servicios</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonLoading isOpen={loading} message="Buscando servicios disponibles..." />
        {!loading && services.length > 0 ? (
          <IonList>
            {services.map((service) => (
              <IonItemSliding key={service.id}>
                <IonItem>
                  <IonLabel>
                    <h2>{service.serviceName}</h2>
                    <p>{service.category} - {service.price}€</p>
                  </IonLabel>
                </IonItem>
                <IonItemOptions side="end">
                  <IonItemOption color="primary" onClick={() => handleEdit(service.id)}>
                    <IonIcon slot="icon-only" icon={createOutline}></IonIcon>
                  </IonItemOption>
                  <IonItemOption color="danger" onClick={() => handleDelete(service.id)}>
                    <IonIcon slot="icon-only" icon={trashOutline}></IonIcon>
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
            ))}
          </IonList>
        ) : (
          !loading && <IonText className="ion-text-center"><p>No tienes servicios registrados.</p></IonText>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push('/services/add')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default MyServices;
