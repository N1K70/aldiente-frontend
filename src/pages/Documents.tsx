import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonBackButton,
  IonButtons,
  IonList,
  IonItem,
  IonLabel,
  IonChip,
  IonProgressBar,
  IonModal,
  IonThumbnail,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  documentOutline,
  cloudUploadOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  eyeOutline,
  downloadOutline,
  timeOutline,
  schoolOutline,
  personOutline,
  calendarOutline,
  refreshOutline,
  closeOutline,
} from 'ionicons/icons';

interface Document {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadDate: string;
  fileUrl?: string;
  description?: string;
  category: string;
}

interface DocumentsProps {
  studentId?: string;
  isStudent?: boolean;
}

const Documents: React.FC<DocumentsProps> = ({ 
  studentId = 'current', 
  isStudent = true 
}) => {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'Certificado de Matrícula',
      type: 'application/pdf',
      status: 'approved',
      uploadDate: '2024-01-15',
      description: 'Certificado oficial de matrícula vigente',
      category: 'academic',
    },
    {
      id: '2',
      name: 'Carnet de Estudiante',
      type: 'image/jpeg',
      status: 'approved',
      uploadDate: '2024-01-10',
      description: 'Fotografía del carnet de estudiante',
      category: 'identification',
    },
    {
      id: '3',
      name: 'Certificado de Prácticas',
      type: 'application/pdf',
      status: 'pending',
      uploadDate: '2024-01-20',
      description: 'Certificado de prácticas clínicas completadas',
      category: 'clinical',
    },
    {
      id: '4',
      name: 'Carta de Recomendación',
      type: 'application/pdf',
      status: 'rejected',
      uploadDate: '2024-01-18',
      description: 'Carta de recomendación del supervisor',
      category: 'recommendation',
    },
  ]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const history = useHistory();

  const handleFileUpload = (file: File) => {
    // Simular proceso de carga
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          const newDocument: Document = {
            id: Date.now().toString(),
            name: file.name,
            type: file.type,
            status: 'pending',
            uploadDate: new Date().toISOString().split('T')[0],
            description: 'Documento recién subido',
            category: 'general',
          };
          setDocuments([...documents, newDocument]);
          setShowUploadModal(false);
          setUploadProgress(0);
          return 0;
        }
        return prev + 10;
      });
    }, 200);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'medium';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return checkmarkCircleOutline;
      case 'pending': return timeOutline;
      case 'rejected': return closeCircleOutline;
      default: return documentOutline;
    }
  };

  const DocumentCard = ({ document }: { document: Document }) => (
    <IonCard style={{
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      margin: '0 0 15px 0',
    }}>
      <IonCardContent>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <IonThumbnail style={{
            width: '60px',
            height: '60px',
            borderRadius: '12px',
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <IonIcon 
              icon={getStatusIcon(document.status)} 
              style={{ 
                fontSize: '24px',
                color: document.status === 'approved' ? '#4CAF50' : 
                       document.status === 'pending' ? '#FF9800' : '#F44336'
              }} 
            />
          </IonThumbnail>
          
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: '600' }}>
                  {document.name}
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  {document.description}
                </p>
              </div>
              
              <IonChip color={getStatusColor(document.status)} style={{ fontSize: '12px' }}>
                {document.status === 'approved' ? 'Aprobado' : 
                 document.status === 'pending' ? 'Pendiente' : 'Rechazado'}
              </IonChip>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <IonText color="medium" style={{ fontSize: '12px' }}>
                <IonIcon icon={calendarOutline} style={{ marginRight: '5px' }} />
                {document.uploadDate}
              </IonText>
              
              <IonText color="medium" style={{ fontSize: '12px' }}>
                <IonIcon icon={documentOutline} style={{ marginRight: '5px' }} />
                {document.type.split('/')[1]}
              </IonText>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <IonButton
                fill="clear"
                size="small"
                style={{ color: '#2196F3' }}
                onClick={() => alert('Visualizando documento...')}
              >
                <IonIcon icon={eyeOutline} slot="start" />
                Ver
              </IonButton>
              
              <IonButton
                fill="clear"
                size="small"
                style={{ color: '#4CAF50' }}
                onClick={() => alert('Descargando documento...')}
              >
                <IonIcon icon={downloadOutline} slot="start" />
                Descargar
              </IonButton>
              
              {document.status === 'rejected' && (
                <IonButton
                  fill="clear"
                  size="small"
                  style={{ color: '#FF9800' }}
                  onClick={() => alert('Re-subiendo documento...')}
                >
                  <IonIcon icon={refreshOutline} slot="start" />
                  Re-subir
                </IonButton>
              )}
            </div>
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );

  const requiredDocuments = [
    { name: 'Certificado de Matrícula', category: 'academic', description: 'Certificado vigente de la universidad' },
    { name: 'Carnet de Estudiante', category: 'identification', description: 'Identificación oficial del estudiante' },
    { name: 'Certificado de Prácticas', category: 'clinical', description: 'Certificado de prácticas clínicas' },
    { name: 'Carta de Recomendación', category: 'recommendation', description: 'Carta del supervisor clínico' },
    { name: 'Certificado de Salud', category: 'health', description: 'Certificado médico vigente' },
    { name: 'Seguro Médico', category: 'insurance', description: 'Póliza de seguro médico' },
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#FFFFFF' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonTitle>Documentos y Certificados</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#FAFAFA' }}>
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', margin: '40px 0' }}>
            <div style={{
              background: 'linear-gradient(135deg, #D40710, #FF5252)',
              borderRadius: '50%',
              width: '80px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <IonIcon icon={documentOutline} style={{ fontSize: '40px', color: '#fff' }} />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 10px 0' }}>
              Documentos y Certificados
            </h1>
            <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
              {isStudent ? 'Gestiona tus documentos de validación' : 'Verifica la documentación del estudiante'}
            </p>
          </div>

          {/* Progress Overview */}
          <IonCard style={{
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            margin: '0 0 20px 0',
          }}>
            <IonCardHeader>
              <IonCardTitle>Progreso de Validación</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <IonText>Documentos Completados</IonText>
                  <IonText color="success" style={{ fontWeight: '600' }}>
                    {documents.filter(d => d.status === 'approved').length}/{documents.length}
                  </IonText>
                </div>
                <IonProgressBar 
                  value={documents.filter(d => d.status === 'approved').length / documents.length} 
                  color="success"
                />
              </div>
            </IonCardContent>
          </IonCard>

          {/* Required Documents */}
          <IonCard style={{
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            margin: '0 0 20px 0',
          }}>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={schoolOutline} style={{ marginRight: '8px' }} />
                Documentos Requeridos
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                {requiredDocuments.map((doc, index) => {
                  const uploadedDoc = documents.find(d => d.category === doc.category);
                  return (
                    <IonItem key={index} lines="full">
                      <IonIcon 
                        icon={uploadedDoc ? getStatusIcon(uploadedDoc.status) : documentOutline} 
                        slot="start" 
                        style={{ 
                          color: uploadedDoc ? 
                            (uploadedDoc.status === 'approved' ? '#4CAF50' : 
                             uploadedDoc.status === 'pending' ? '#FF9800' : '#F44336') : '#666'
                        }} 
                      />
                      <IonLabel>
                        <h3>{doc.name}</h3>
                        <p style={{ fontSize: '14px', color: '#666' }}>{doc.description}</p>
                      </IonLabel>
                      {uploadedDoc && (
                        <IonChip color={getStatusColor(uploadedDoc.status)} style={{ fontSize: '12px' }}>
                          {uploadedDoc.status === 'approved' ? 'Aprobado' : 
                           uploadedDoc.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                        </IonChip>
                      )}
                    </IonItem>
                  );
                })}
              </IonList>
            </IonCardContent>
          </IonCard>

          {/* Uploaded Documents */}
          <IonCard style={{
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            margin: '0 0 20px 0',
          }}>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={cloudUploadOutline} style={{ marginRight: '8px' }} />
                Documentos Subidos
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {documents.length === 0 ? (
                <IonText color="medium" style={{ textAlign: 'center', display: 'block' }}>
                  No hay documentos subidos aún
                </IonText>
              ) : (
                documents.map(doc => <DocumentCard key={doc.id} document={doc} />)
              )}
            </IonCardContent>
          </IonCard>

          {/* Upload Button */}
          <IonButton
            expand="block"
            onClick={() => setShowUploadModal(true)}
            style={{
              height: '50px',
              borderRadius: '12px',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #D40710, #FF5252)',
            }}
          >
            <IonIcon icon={cloudUploadOutline} slot="start" />
            Subir Nuevo Documento
          </IonButton>
        </div>

        {/* Upload Modal */}
        <IonModal
          isOpen={showUploadModal}
          onDidDismiss={() => setShowUploadModal(false)}
          style={{ '--border-radius': '16px' }}
        >
          <IonContent style={{ '--background': '#fff' }}>
            <div style={{ padding: '20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                  Subir Documento
                </h2>
                <IonButton
                  fill="clear"
                  onClick={() => setShowUploadModal(false)}
                >
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </div>
              
              {uploadProgress > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <IonProgressBar value={uploadProgress / 100} />
                  <IonText color="medium" style={{ marginTop: '10px', display: 'block' }}>
                    Subiendo... {uploadProgress}%
                  </IonText>
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  style={{
                    padding: '20px',
                    border: '2px dashed #ddd',
                    borderRadius: '12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                />
                
                <IonText color="medium" style={{ fontSize: '14px', textAlign: 'center' }}>
                  Formatos aceptados: PDF, JPG, PNG, DOC, DOCX
                </IonText>
              </div>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Documents;
