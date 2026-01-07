import React, { useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCheckbox,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonProgressBar,
  IonText,
  IonToast,
} from '@ionic/react';
import { 
  cloudUploadOutline, 
  documentOutline, 
  imageOutline, 
  trashOutline,
  downloadOutline,
  eyeOutline 
} from 'ionicons/icons';
import { FILES_URL } from '../../config';
import { AppointmentAttachment, addAppointmentAttachment, deleteAppointmentAttachment } from './appointments.api';

interface FileUploadComponentProps {
  appointmentId: string;
  attachments: AppointmentAttachment[];
  onAttachmentsChange: (attachments: AppointmentAttachment[]) => void;
  canUpload?: boolean;
  canDelete?: boolean;
  showStudentAccess?: boolean;
}

const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  appointmentId,
  attachments,
  onAttachmentsChange,
  canUpload = true,
  canDelete = true,
  showStudentAccess = true
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [allowStudent, setAllowStudent] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; color: string } | null>(null);

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return documentOutline;
    if (mimeType.startsWith('image/')) return imageOutline;
    return documentOutline;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    const mb = kb / 1024;
    return `${Math.round(mb * 10) / 10} MB`;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamaño de archivo (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setToast({ show: true, message: 'El archivo es demasiado grande (máximo 10MB)', color: 'danger' });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
      const formData = new FormData();
      formData.append('file', file);

      // Simular progreso de carga
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const uploadResponse = await fetch(`${FILES_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!uploadResponse.ok) {
        throw new Error('Error al subir archivo');
      }

      const uploadResult = await uploadResponse.json();

      // Crear el adjunto en el backend
      const attachment = await addAppointmentAttachment(appointmentId, {
        file_url: uploadResult.file_url,
        file_name: uploadResult.file_name || file.name,
        file_mime: uploadResult.file_mime || file.type,
        file_size: uploadResult.file_size || file.size,
        allow_student: allowStudent
      });

      onAttachmentsChange([attachment, ...attachments]);
      setToast({ show: true, message: 'Archivo subido exitosamente', color: 'success' });

      // Limpiar el input
      event.target.value = '';
      setAllowStudent(false);

    } catch (error: any) {
      console.error('Error uploading file:', error);
      setToast({ 
        show: true, 
        message: error.message || 'Error al subir archivo', 
        color: 'danger' 
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteAttachment = async (attachment: AppointmentAttachment) => {
    try {
      await deleteAppointmentAttachment(appointmentId, attachment.id);
      onAttachmentsChange(attachments.filter(a => a.id !== attachment.id));
      setToast({ show: true, message: 'Archivo eliminado', color: 'success' });
    } catch (error: any) {
      console.error('Error deleting attachment:', error);
      setToast({ show: true, message: 'Error al eliminar archivo', color: 'danger' });
    }
  };

  return (
    <>
      <IonCard style={{ borderRadius: '12px' }}>
        <IonCardHeader>
          <IonCardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IonIcon icon={cloudUploadOutline} />
            Archivos Adjuntos
          </IonCardTitle>
        </IonCardHeader>
        
        <IonCardContent>
          {/* Upload Section */}
          {!canUpload && (
            <div style={{ marginBottom: '20px' }}>
              <IonNote color="medium" style={{ display: 'block', textAlign: 'center', padding: '16px' }}>
                No se pueden subir archivos en citas canceladas o completadas
              </IonNote>
            </div>
          )}
          {canUpload && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                border: '2px dashed #ccc', 
                borderRadius: '12px', 
                padding: '20px', 
                textAlign: 'center',
                backgroundColor: '#fafafa'
              }}>
                <IonIcon 
                  icon={cloudUploadOutline} 
                  style={{ fontSize: '48px', color: '#666', marginBottom: '10px' }} 
                />
                <IonText style={{ display: 'block', marginBottom: '10px' }}>
                  Arrastra archivos aquí o haz clic para seleccionar
                </IonText>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  style={{ 
                    width: '100%', 
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    marginBottom: '10px'
                  }}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                {showStudentAccess && (
                  <IonItem lines="none" style={{ '--background': 'transparent' }}>
                    <IonCheckbox
                      checked={allowStudent}
                      onIonChange={(e) => setAllowStudent(e.detail.checked)}
                      slot="start"
                    />
                    <IonLabel>
                      <IonText style={{ fontSize: '14px' }}>
                        Permitir acceso al estudiante
                      </IonText>
                    </IonLabel>
                  </IonItem>
                )}
              </div>
              
              {uploading && (
                <div style={{ marginTop: '10px' }}>
                  <IonText color="medium" style={{ fontSize: '14px' }}>
                    Subiendo archivo... {uploadProgress}%
                  </IonText>
                  <IonProgressBar value={uploadProgress / 100} />
                </div>
              )}
            </div>
          )}

          {/* Files List */}
          <IonList>
            {attachments.length === 0 ? (
              <IonItem>
                <IonLabel>
                  <IonText color="medium">No hay archivos adjuntos</IonText>
                </IonLabel>
              </IonItem>
            ) : (
              attachments.map((attachment) => (
                <IonItem key={attachment.id}>
                  <IonIcon 
                    icon={getFileIcon(attachment.file_mime)} 
                    slot="start" 
                    style={{ color: '#D40710' }}
                  />
                  <IonLabel>
                    <h3>{attachment.file_name || 'Archivo'}</h3>
                    <p style={{ color: '#666', fontSize: '12px' }}>
                      {attachment.file_mime} • {formatFileSize(attachment.file_size)}
                    </p>
                    <IonNote style={{ fontSize: '11px' }}>
                      {attachment.allow_student ? (
                        <span style={{ color: '#28a745' }}>
                          <IonIcon icon={eyeOutline} style={{ fontSize: '12px' }} /> 
                          Visible para estudiante
                        </span>
                      ) : (
                        <span style={{ color: '#666' }}>
                          Solo visible para ti
                        </span>
                      )}
                    </IonNote>
                  </IonLabel>
                  
                  <div slot="end" style={{ display: 'flex', gap: '8px' }}>
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={() => window.open(attachment.file_url, '_blank')}
                    >
                      <IonIcon icon={downloadOutline} />
                    </IonButton>
                    {canDelete && (
                      <IonButton
                        fill="clear"
                        size="small"
                        color="danger"
                        onClick={() => handleDeleteAttachment(attachment)}
                      >
                        <IonIcon icon={trashOutline} />
                      </IonButton>
                    )}
                  </div>
                </IonItem>
              ))
            )}
          </IonList>
        </IonCardContent>
      </IonCard>

      <IonToast
        isOpen={!!toast?.show}
        message={toast?.message}
        color={toast?.color}
        duration={3000}
        onDidDismiss={() => setToast(null)}
      />
    </>
  );
};

export default FileUploadComponent;
