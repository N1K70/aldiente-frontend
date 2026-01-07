import React, { useState, useEffect, useCallback } from 'react';
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
import { useParams, useHistory } from 'react-router-dom';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { StudentServiceFactory } from '../services/student-service/StudentServiceFactory';
import { IStudentService } from '../models/studentService';
import { saveOutline, pricetagOutline, medicalOutline, informationCircleOutline, reorderFourOutline, calendarOutline } from 'ionicons/icons';
import { MockUser } from '../types/user'; // Importar tipo centralizado

interface ServiceFormInputs {
  serviceName: string;
  description: string;
  category: string;
  price?: number;
  duration?: string;
}

interface EditServiceParams {
  serviceId: string;
}

// Interface MockUser ahora está definida en src/types/user.ts

const EditService: React.FC = () => {
  const history = useHistory();
  const { serviceId } = useParams<EditServiceParams>();
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [pageLoading, setPageLoading] = useState<boolean>(true);
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
    reset,
  } = useForm<ServiceFormInputs>({
    defaultValues: {
      serviceName: '',
      description: '',
      category: '',
      price: undefined,
      duration: ''
    },
  });

  const loadServiceData = useCallback(async (studentId: string, sid: string) => {
    setPageLoading(true);
    try {
      const service = await serviceManager.getServiceById(studentId, sid);
      if (service) {
        reset({
          serviceName: service.serviceName,
          description: service.description,
          category: service.category,
          price: service.price,
          duration: service.duration
        });
      } else {
        presentToast('Servicio no encontrado o no te pertenece.', 3000);
        history.replace('/my-services');
      }
    } catch (error) {
      console.error('Error cargando el servicio:', error);
      presentToast('Error al cargar los datos del servicio.', 3000);
      history.replace('/my-services');
    } finally {
      setPageLoading(false);
    }
  }, [reset, presentToast, history, serviceManager]);

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
        setUser(ensuredUser);
        if (ensuredUser.role === 'student') {
          const studentId = ensuredUser.id || getUserIdFromToken();
          if (!studentId) {
            presentToast('No se pudo determinar tu ID de usuario. Inicia sesión nuevamente.', 3000);
            history.replace('/login');
            return;
          }
          loadServiceData(studentId, serviceId);
        } else {
          presentToast('Acceso denegado. Debes ser estudiante para editar servicios.', 3000);
          history.replace('/home');
        }
      } catch (e) {
        console.error("Error parsing mockUser from localStorage", e);
        presentToast('Error de autenticación. Intenta iniciar sesión de nuevo.', 3000);
        history.replace('/login');
      }
    } else {
      presentToast('No estás autenticado. Por favor, inicia sesión.', 3000);
      history.replace('/login');
    }
  }, [history, presentToast, serviceId, loadServiceData]);

  const onSubmit: SubmitHandler<ServiceFormInputs> = async (data) => {
    if (!user || user.role !== 'student') {
      presentToast('No autorizado para realizar esta acción.', 3000);
      return;
    }

    setLoading(true);
    try {
      const serviceToUpdate: Partial<Omit<IStudentService, 'id' | 'studentId' | 'createdAt' | 'updatedAt'>> = {
        serviceName: data.serviceName,
        description: data.description,
        category: data.category,
        price: data.price ? Number(data.price) : undefined,
        duration: data.duration
      };

      const studentId = user.id || getUserIdFromToken();
      if (!studentId) {
        presentToast('No se pudo determinar tu ID de usuario. Inicia sesión nuevamente.', 3000);
        history.replace('/login');
        setLoading(false);
        return;
      }
      const updatedService = await serviceManager.updateService(studentId, serviceId, serviceToUpdate);
      
      if (updatedService) {
        presentToast('Servicio actualizado con éxito.', 2000);
        history.goBack();
      } else {
        presentToast('No se pudo actualizar el servicio. Verifica que el servicio exista y te pertenezca.', 3000);
      }
    } catch (error) {
      console.error('Error al actualizar el servicio:', error);
      presentToast('Error al guardar los cambios.', 3000);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/my-services" />
            </IonButtons>
            <IonTitle>Editar Servicio</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonLoading isOpen={true} message="Cargando datos del servicio..." />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/my-services" />
          </IonButtons>
          <IonTitle>Editar Servicio</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <form onSubmit={handleSubmit(onSubmit)}>
          <IonList>
            <IonItem className={errors.serviceName ? 'ion-invalid' : 'ion-valid'}>
              <IonIcon icon={medicalOutline} slot="start" />
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
              <IonIcon icon={reorderFourOutline} slot="start" />
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
              <IonIcon icon={informationCircleOutline} slot="start" />
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
              <IonIcon icon={pricetagOutline} slot="start" />
              <IonLabel position="floating">Precio (opcional)</IonLabel>
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
              <IonIcon icon={calendarOutline} slot="start" /> 
              <IonLabel position="floating">Duración Estimada</IonLabel>
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
            className="ion-margin-top"
            color="primary"
            disabled={loading || pageLoading}
          >
            <IonIcon icon={saveOutline} slot="start" />
            Guardar Cambios
          </IonButton>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default EditService;
