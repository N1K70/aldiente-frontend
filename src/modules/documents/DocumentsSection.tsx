import React, { useEffect, useMemo, useState } from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonText,
  IonSpinner,
} from '@ionic/react';
import { trashOutline, cloudDownloadOutline, documentAttachOutline, addOutline } from 'ionicons/icons';
import { useAuth } from '../../shared/context/AuthContext';
import { FILES_URL } from '../../config';
import { deleteDocument, listDocuments } from './documents.api';
import UploadDocumentModal from './UploadDocumentModal';
import { UserDocument } from './types';

interface DocumentsSectionProps {
  onDocumentsChange?: (count: number) => void;
}

const DocumentsSection: React.FC<DocumentsSectionProps> = ({ onDocumentsChange }) => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  const categories = useMemo(() => (
    isStudent
      ? [
          { value: '', label: 'Todas' },
          { value: 'alumno_regular', label: 'Alumno Regular' },
          { value: 'plan_semestre', label: 'Plan Semestral' },
          { value: 'syllabus', label: 'Syllabus' },
          { value: 'otros', label: 'Otros' },
        ]
      : [
          { value: '', label: 'Todas' },
          { value: 'receta', label: 'Recetas' },
          { value: 'solicitud', label: 'Solicitudes' },
          { value: 'otros', label: 'Otros' },
        ]
  ), [isStudent]);

  const [filter, setFilter] = useState<string>('');
  const [docs, setDocs] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // La barra de cuota se muestra únicamente dentro del modal de subida

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listDocuments(filter || undefined);
      setDocs(res);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudieron cargar los documentos');
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    if (onDocumentsChange) {
      onDocumentsChange(docs.length);
    }
  }, [docs.length, onDocumentsChange]);

  const onDelete = async (d: UserDocument) => {
    const ok = window.confirm(`¿Eliminar el documento "${d.title}"?`);
    if (!ok) return;
    await deleteDocument(d.id);
    await load();
  };

  return (
    <>
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Certificados y documentos</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          
          {isStudent && !loading && !error && (
            (() => {
              const hasAlumnoRegular = docs.some(d => d.category === 'alumno_regular' && d.year === currentYear);
              if (!hasAlumnoRegular) {
                return (
                  <IonCard color="warning" style={{ marginBottom: 10 }}>
                    <IonCardHeader>
                      <IonCardTitle>Documento obligatorio faltante</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <IonText>Debes subir tu Certificado de Alumno Regular del año {currentYear}. Opcionalmente, también puedes subir tu Plan Semestral y Syllabus.</IonText>
                      <div style={{ marginTop: 8 }}>
                        <IonButton size="small" onClick={() => setModalOpen(true)}>Subir ahora</IonButton>
                      </div>
                    </IonCardContent>
                  </IonCard>
                );
              }
              return null;
            })()
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
            <IonSelect value={filter} placeholder="Filtrar por categoría" onIonChange={(e) => setFilter(e.detail.value)} interface="popover">
              {categories.map(c => (
                <IonSelectOption key={c.value} value={c.value}>{c.label}</IonSelectOption>
              ))}
            </IonSelect>
            <IonButton onClick={() => setModalOpen(true)} className="primary-gradient-btn">
              <IonIcon slot="start" icon={addOutline} /> Subir documento
            </IonButton>
          </div>

          {loading && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <IonSpinner name="crescent" />
              <IonText>Cargando...</IonText>
            </div>
          )}

          {error && !loading && (
            <IonText color="danger" style={{ display: 'block' }}>{error}</IonText>
          )}

          {!loading && !error && docs.length === 0 && (
            <IonText color="medium" style={{ display: 'block' }}>Aún no hay documentos.</IonText>
          )}

          {!loading && !error && docs.length > 0 && (
            <IonList lines="full">
              {docs.map((d) => (
                <IonItem key={d.id}>
                  <IonIcon slot="start" icon={documentAttachOutline} />
                  <IonLabel>
                    <h3>{d.title}</h3>
                    <p>
                      {d.category} · {d.year ? `Año ${d.year} · ` : ''}
                      {d.created_at ? new Date(d.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                    </p>
                    {d.description ? <p>{d.description}</p> : null}
                  </IonLabel>
                  <IonButton fill="clear" onClick={() => window.open(`${FILES_URL}${d.file_url}`, '_blank')}>
                    <IonIcon icon={cloudDownloadOutline} />
                  </IonButton>
                  <IonButton color="danger" fill="clear" onClick={() => onDelete(d)}>
                    <IonIcon icon={trashOutline} />
                  </IonButton>
                </IonItem>
              ))}
            </IonList>
          )}
        </IonCardContent>
      </IonCard>

      <UploadDocumentModal
        isOpen={modalOpen}
        onDismiss={() => setModalOpen(false)}
        onUploaded={() => load()}
      />
    </>
  );
};

export default DocumentsSection;
