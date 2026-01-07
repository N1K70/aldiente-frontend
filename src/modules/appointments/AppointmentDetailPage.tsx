import React, { useEffect, useMemo, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonList,
  IonText,
  IonToast,
  IonCheckbox,
  IonSpinner,
  IonChip,
  IonIcon,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { api } from '../../shared/api/ApiClient';
import { FILES_URL } from '../../config';
import {
  getAppointmentById,
  updateAppointment,
  listAppointmentAttachments,
  addAppointmentAttachment,
  deleteAppointmentAttachment,
  type AppointmentAttachment,
} from './appointments.api';
import { calendarOutline, timeOutline, personOutline, documentTextOutline, checkmarkCircleOutline } from 'ionicons/icons';
import RatingForm from '../ratings/RatingForm';
import RatingDisplay from '../ratings/RatingDisplay';
import { useAuth } from '../../shared/context/AuthContext';
import FileUploadComponent from './FileUploadComponent';
import ChatPopup from '../chat/ChatPopup';

interface RouteParams { appointmentId: string }

interface Appointment {
  id: string;
  student_service_id?: string;
  scheduled_at?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  student_id: string;
  patient_id: string;
  service_name?: string;
  student_name?: string;
  patient_name?: string;
}

const AppointmentDetailPage: React.FC = () => {
  const { appointmentId } = useParams<RouteParams>();
  const history = useHistory();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<AppointmentAttachment[]>([]);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [form, setForm] = useState({
    scheduled_at: '',
    notes: '',
    student_service_id: ''
  });
  const [toast, setToast] = useState<{ show: boolean; message: string; color: string } | null>(null);

  const token = useMemo(() => localStorage.getItem('authToken') || localStorage.getItem('token') || '', []);
  const chatEnabled = useMemo(() => {
    if (!appointment) return false;
    return appointment.status === 'confirmed' || appointment.status === 'completed';
  }, [appointment]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const a = await getAppointmentById(appointmentId);
        
        // Si no viene el nombre del paciente, obtenerlo del API
        if (!a.patient_name && a.patient_id) {
          try {
            const patientRes = await api.get(`/api/patients/${a.patient_id}`);
            const patientData: any = patientRes.data;
            const name = patientData?.name || patientData?.full_name || patientData?.fullName;
            
            if (name) {
              a.patient_name = name;
            } else {
              // Si no hay nombre, intentar con el endpoint de usuarios
              try {
                const userRes = await api.get(`/api/users/${a.patient_id}`);
                const userData: any = userRes.data;
                a.patient_name = userData?.name || userData?.email?.split('@')[0] || null;
              } catch (userErr) {
                console.warn('No se pudo obtener usuario del paciente');
              }
            }
          } catch (err) {
            console.warn('No se pudo obtener el nombre del paciente:', err);
          }
        }
        
        // Si no viene el nombre del estudiante, obtenerlo del API
        if (!a.student_name && a.student_id) {
          try {
            const studentRes = await api.get(`/api/students/${a.student_id}`);
            const studentData: any = studentRes.data;
            a.student_name = studentData?.full_name || studentData?.name || studentData?.fullName || null;
          } catch (err) {
            console.warn('No se pudo obtener el nombre del estudiante:', err);
          }
        }
        
        setAppointment(a as any);
        setForm({
          scheduled_at: (a as any)?.scheduled_at || '',
          notes: (a as any)?.notes || '',
          student_service_id: (a as any)?.student_service_id || '',
        });
        const atts = await listAppointmentAttachments(appointmentId);
        setAttachments(atts);
      } catch (e) {
        console.error('Error cargando cita:', e);
        setToast({ show: true, message: 'No se pudo cargar la cita', color: 'danger' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [appointmentId]);

  const onSave = async () => {
    try {
      setSaving(true);
      const payload: any = {};
      if (form.scheduled_at) payload.scheduled_at = form.scheduled_at;
      if (form.notes !== undefined) payload.notes = form.notes;
      if (form.student_service_id) payload.student_service_id = form.student_service_id;
      const updated = await updateAppointment(appointmentId, payload);
      setAppointment(updated as any);
      setToast({ show: true, message: 'Cita actualizada', color: 'success' });
    } catch (e) {
      console.error('Error al actualizar cita:', e);
      setToast({ show: true, message: 'Error al actualizar cita', color: 'danger' });
    } finally {
      setSaving(false);
    }
  };


  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start"><IonBackButton defaultHref="/tabs/appointments" /></IonButtons>
          <IonTitle>Detalle de Cita</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <IonSpinner name="crescent" />
          </div>
        ) : !appointment ? (
          <IonText color="danger"><p>No se encontró la cita.</p></IonText>
        ) : (
          <>
            <IonCard>
              <IonCardHeader>
                <IonCardTitle style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  Información de la Cita
                  <IonChip color={appointment.status === 'confirmed' ? 'success' : appointment.status === 'completed' ? 'medium' : appointment.status === 'pending' ? 'warning' : 'danger'}>
                    <IonIcon icon={checkmarkCircleOutline} />
                    <IonLabel style={{ textTransform: 'capitalize' }}>{appointment.status === 'confirmed' ? 'Confirmada' : appointment.status === 'completed' ? 'Completada' : appointment.status === 'pending' ? 'Pendiente' : 'Cancelada'}</IonLabel>
                  </IonChip>
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList lines="none">
                  <IonItem>
                    <IonIcon icon={documentTextOutline} slot="start" color="primary" />
                    <IonLabel>
                      <h3>Servicio</h3>
                      <p>{appointment.service_name || 'No especificado'}</p>
                    </IonLabel>
                  </IonItem>
                  
                  <IonItem>
                    <IonIcon icon={personOutline} slot="start" color="primary" />
                    <IonLabel>
                      <h3>{user?.role === 'patient' ? 'Estudiante' : 'Paciente'}</h3>
                      <p>{user?.role === 'patient' ? (appointment.student_name || `ID: ${appointment.student_id}`) : (appointment.patient_name || `ID: ${appointment.patient_id}`)}</p>
                    </IonLabel>
                  </IonItem>
                  
                  <IonItem>
                    <IonIcon icon={calendarOutline} slot="start" color="primary" />
                    <IonLabel>
                      <h3>Fecha y Hora</h3>
                      <p>{appointment.scheduled_at ? new Date(appointment.scheduled_at).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' }) : 'No programada'}</p>
                    </IonLabel>
                  </IonItem>
                  
                  {appointment.notes && (
                    <IonItem>
                      <IonIcon icon={documentTextOutline} slot="start" color="primary" />
                      <IonLabel className="ion-text-wrap">
                        <h3>Notas</h3>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{appointment.notes}</p>
                      </IonLabel>
                    </IonItem>
                  )}
                </IonList>
              </IonCardContent>
            </IonCard>

            <FileUploadComponent
              appointmentId={appointmentId}
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              canUpload={user?.role === 'patient' && appointment.status !== 'cancelled' && appointment.status !== 'completed'}
              canDelete={user?.role === 'patient' && appointment.status !== 'cancelled' && appointment.status !== 'completed'}
              showStudentAccess={user?.role === 'patient'}
            />

            {/* Chat en tiempo real */}
            {user?.id && token && (
              <ChatPopup
                appointmentId={appointmentId}
                token={token}
                currentUserId={user.id}
                enabled={chatEnabled}
                otherParticipantName={
                  user.role === 'patient' 
                    ? appointment.student_name || 'Estudiante'
                    : appointment.patient_name || 'Paciente'
                }
              />
            )}

            {/* Sistema de Calificaciones */}
            {appointment.status === 'completed' && user?.role === 'patient' && (
              <IonCard style={{ marginTop: '16px' }}>
                <IonCardHeader>
                  <IonCardTitle>Calificación</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {showRatingForm ? (
                    <RatingForm
                      appointmentId={appointmentId}
                      toUserId={appointment.student_id}
                      toUserName={appointment.student_name || 'Estudiante'}
                      onRatingCreated={() => {
                        setShowRatingForm(false);
                        setToast({ show: true, message: 'Calificación enviada exitosamente', color: 'success' });
                      }}
                      onCancel={() => setShowRatingForm(false)}
                    />
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <IonText color="medium" style={{ display: 'block', marginBottom: '16px' }}>
                        ¿Cómo fue tu experiencia con {appointment.student_name || 'el estudiante'}?
                      </IonText>
                      <IonButton
                        expand="block"
                        onClick={() => setShowRatingForm(true)}
                        style={{
                          background: 'linear-gradient(135deg, #D40710, #FF5252)',
                          borderRadius: '12px'
                        }}
                      >
                        Calificar Atención
                      </IonButton>
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            )}

            {/* Mostrar calificaciones del estudiante */}
            {appointment.student_id && (
              <IonCard style={{ marginTop: '16px' }}>
                <IonCardHeader>
                  <IonCardTitle>Calificaciones del Estudiante</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <RatingDisplay userId={appointment.student_id} showDetails={false} />
                </IonCardContent>
              </IonCard>
            )}
          </>
        )}
        <IonToast isOpen={!!toast?.show} message={toast?.message} color={toast?.color} duration={2200} onDidDismiss={() => setToast(null)} />
      </IonContent>
    </IonPage>
  );
};

export default AppointmentDetailPage;
