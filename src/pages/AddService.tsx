import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonButtons,
  IonBackButton,
  IonSelect,
  IonSelectOption,
  IonLoading,
  useIonToast,
  IonNote,
  IonIcon
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useForm, Controller, SubmitHandler, FieldValues } from 'react-hook-form';
import { StudentServiceFactory } from '../services/student-service/StudentServiceFactory';
import { IStudentService } from '../models/studentService';
import { MockUser } from '../types/user'; // Importar MockUser desde el archivo compartido
import { saveOutline, pricetagOutline, medicalOutline, schoolOutline, informationCircleOutline, reorderFourOutline, calendarOutline } from 'ionicons/icons';

interface UserProfile {
  email: string;
  role: 'student' | 'patient' | string;
  displayName?: string;
  // university?: string; // No presente en el mockUser actual
}

interface ServiceFormInputs {
  serviceName: string;
  description: string;
  category: string;
  price?: number;
  duration?: string;
}

const AddService: React.FC = () => {
  const history = useHistory();
  const [user, setUser] = useState<MockUser | null>(null); // Usar MockUser
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // Adaptado para mock
  const [loading, setLoading] = useState<boolean>(false);
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [presentToast] = useIonToast();
  
  // Obtener el gestor de servicios desde la factory
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

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ServiceFormInputs>({
    defaultValues: {
      serviceName: '',
      description: '',
      category: '',
      price: undefined,
      duration: ''
    },
  });

  useEffect(() => {
    const loadUser = () => {
      setProfileLoading(true); // Indicar que la carga ha comenzado
      const storedUser = localStorage.getItem('mockUser');
      
      if (storedUser) {
        try {
          const parsedUser: MockUser = JSON.parse(storedUser);
          const ensuredUser: MockUser = { ...parsedUser };
          if (!ensuredUser.id) {
            const idFromToken = getUserIdFromToken();
            if (idFromToken) ensuredUser.id = idFromToken;
          }
          setUser(ensuredUser);
          setUserProfile({
            email: ensuredUser.email,
            role: ensuredUser.role,
            displayName: ensuredUser.displayName
          });

          if (parsedUser.role !== 'student') {
            presentToast('Acceso denegado. Solo los estudiantes pueden añadir servicios.', 3000);
            history.replace('/home');
            // setProfileLoading(false) se llamará en el finally
          } else {
            // No es necesario setProfileLoading(false) aquí, se hará en el finally
          }
        } catch (error) {
          console.error("Error parsing mockUser from localStorage or processing user data:", error);
          presentToast('Error al cargar datos de usuario. Serás redirigido.', 3000);
          localStorage.removeItem('mockUser'); // Limpiar mockUser potencialmente corrupto
          history.replace('/login');
        } finally {
          // Este bloque se ejecuta después del try o catch, independientemente de si hubo error o redirección.
          // Si el componente aún está montado, ocultará el spinner.
          setProfileLoading(false);
        }
      } else {
        presentToast('Debes iniciar sesión para añadir servicios.', 3000);
        history.replace('/login');
        setProfileLoading(false); // Asegurar que se oculta si no hay usuario y se redirige
      }
    };

    loadUser();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'mockUser') {
        loadUser(); // Recargar datos del usuario si mockUser cambia en otra pestaña
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [history, presentToast]);

  const onSubmit: SubmitHandler<ServiceFormInputs> = async (data: ServiceFormInputs) => {
    if (!user || user.role !== 'student') { // Simplificado con user directamente
      presentToast('No autorizado o rol no válido para añadir servicios.', 3000);
      return;
    }

    setLoading(true);
    try {
      const serviceData: Omit<IStudentService, 'id' | 'studentId' | 'createdAt' | 'updatedAt'> = {
        serviceName: data.serviceName,
        description: data.description,
        category: data.category,
        price: data.price ? Number(data.price) : undefined,
        duration: data.duration,
        studentName: userProfile?.displayName || 'Estudiante',
        studentUniversity: 'Universidad' // Idealmente obtenerlo del perfil del usuario
      };

      // Usar serviceManager desde la factory en lugar del mock directo
      const studentId = user.id || getUserIdFromToken();
      if (!studentId) {
        presentToast('No se pudo determinar tu ID de usuario. Inicia sesión nuevamente.', 3000);
        history.replace('/login');
        return;
      }
      await serviceManager.addService(studentId, serviceData);
      
      presentToast('Servicio añadido con éxito.', 2000);
      reset(); 
      history.goBack(); 
    } catch (error) {
      console.error('Error al añadir el servicio:', error);
      presentToast('Error al guardar el servicio. Inténtalo de nuevo.', 3000);
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <IonPage>
        <IonContent>
          <IonLoading isOpen={true} message="Cargando..." />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/services" />
          </IonButtons>
          <IonTitle>Añadir Nuevo Servicio</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding add-service-content">
        <form onSubmit={handleSubmit(onSubmit)}>
          <IonList className="add-service-form">
            <IonItem className={errors.serviceName ? 'ion-invalid' : 'ion-valid'}>
              <IonIcon icon={medicalOutline} slot="start" className="form-icon" />
              <IonLabel position="floating">Nombre del Servicio *</IonLabel>
              <Controller
                control={control}
                name="serviceName"
                rules={{ required: 'El nombre del servicio es obligatorio' }}
                render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
                  <>
                    <IonInput 
                      value={value} 
                      onIonChange={onChange} 
                      onIonBlur={onBlur}
                      required 
                    />
                    {error && <IonNote color="danger">{error.message}</IonNote>}
                  </>
                )}
              />
            </IonItem>

            <IonItem className={errors.category ? 'ion-invalid' : 'ion-valid'}>
              <IonIcon icon={reorderFourOutline} slot="start" className="form-icon" />
              <IonLabel position="floating">Categoría *</IonLabel>
              <Controller
                control={control}
                name="category"
                rules={{ required: 'La categoría es obligatoria' }}
                render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
                  <>
                    <IonSelect 
                      value={value} 
                      placeholder="Selecciona una categoría" 
                      onIonChange={onChange} 
                      onIonBlur={onBlur}
                      interface="action-sheet"
                      required
                    >
                      <IonSelectOption value="limpieza">Limpieza Dental</IonSelectOption>
                      <IonSelectOption value="blanqueamiento">Blanqueamiento</IonSelectOption>
                      <IonSelectOption value="extraccion">Extracción Simple</IonSelectOption>
                      <IonSelectOption value="ortodoncia">Consulta de Ortodoncia</IonSelectOption>
                      <IonSelectOption value="endodoncia">Consulta de Endodoncia</IonSelectOption>
                      <IonSelectOption value="revision">Revisión General</IonSelectOption>
                      <IonSelectOption value="otro">Otro</IonSelectOption>
                    </IonSelect>
                    {error && <IonNote color="danger">{error.message}</IonNote>}
                  </>
                )}
              />
            </IonItem>

            <IonItem className={errors.description ? 'ion-invalid' : 'ion-valid'}>
              <IonIcon icon={informationCircleOutline} slot="start" className="form-icon" />
              <IonLabel position="floating">Descripción Detallada *</IonLabel>
              <Controller
                control={control}
                name="description"
                rules={{ required: 'La descripción es obligatoria' }}
                render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
                  <>
                    <IonTextarea 
                      value={value} 
                      onIonChange={onChange} 
                      onIonBlur={onBlur}
                      rows={4} 
                      required 
                    />
                    {error && <IonNote color="danger">{error.message}</IonNote>}
                  </>
                )}
              />
            </IonItem>

            <IonItem>
              <IonIcon icon={pricetagOutline} slot="start" className="form-icon" />
              <IonLabel position="floating">Precio (opcional, ej: 50.00)</IonLabel>
              <Controller
                control={control}
                name="price"
                render={({ field: { onChange, value, onBlur } }) => (
                  <IonInput 
                    type="number" 
                    value={value}
                    placeholder="0.00" 
                    onIonChange={onChange} 
                    onIonBlur={onBlur}
                  />
                )}
              />
            </IonItem>

            <IonItem>
              <IonIcon icon={calendarOutline} slot="start" className="form-icon" /> 
              <IonLabel position="floating">Duración Estimada (ej: 1 hora)</IonLabel>
              <Controller
                control={control}
                name="duration"
                render={({ field: { onChange, value, onBlur } }) => (
                  <IonInput 
                    value={value} 
                    onIonChange={onChange} 
                    onIonBlur={onBlur}
                  />
                )}
              />
            </IonItem>

          </IonList>
          <IonButton 
            type="submit" 
            expand="block" 
            className="ion-margin-top save-button"
            color="primary"
            disabled={loading || profileLoading} 
          >
            <IonIcon icon={saveOutline} slot="start" />
            Guardar Servicio
          </IonButton>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default AddService;
