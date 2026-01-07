import React, { useEffect, useMemo, useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonText,
  IonProgressBar,
} from '@ionic/react';
import { useAuth } from '../../shared/context/AuthContext';
import { listDocuments, uploadDocument } from './documents.api';
import { DocumentCategoryPatient, DocumentCategoryStudent, UploadDocumentInput } from './types';

export type UploadDocumentModalProps = {
  isOpen: boolean;
  onDismiss: () => void;
  onUploaded?: () => void;
};

const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({ isOpen, onDismiss, onUploaded }) => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('');
  const [year, setYear] = useState<number | undefined>(undefined);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedBytes, setUsedBytes] = useState<number>(0);

  const categories = useMemo(() => {
    return isStudent
      ? [
          { value: 'alumno_regular', label: 'Cert. Alumno Regular (año vigente)' },
          { value: 'plan_semestre', label: 'Plan Semestral' },
          { value: 'syllabus', label: 'Syllabus / Detalle de ramos' },
          { value: 'otros', label: 'Otros' },
        ]
      : [
          { value: 'receta', label: 'Receta / Indicación' },
          { value: 'solicitud', label: 'Solicitud / Orden' },
          { value: 'otros', label: 'Otros' },
        ];
  }, [isStudent]);

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const quotaBytes = 30 * 1024 * 1024;
  const usedPct = Math.min(1, usedBytes / quotaBytes);

  useEffect(() => {
    let mounted = true;
    const loadUsage = async () => {
      if (!isOpen) return;
      try {
        const docs = await listDocuments();
        if (!mounted) return;
        const sum = (docs || []).reduce((acc, d) => acc + (Number(d.file_size || 0)), 0);
        setUsedBytes(sum);
      } catch {
        if (!mounted) return;
        setUsedBytes(0);
      }
    };
    loadUsage();
    return () => { mounted = false; };
  }, [isOpen]);

  const canSubmit = useMemo(() => {
    if (!title || !category || !file) return false;
    if (file.size > 10 * 1024 * 1024) return false; // 10MB
    if (isStudent && category === 'alumno_regular') {
      return year === currentYear;
    }
    return true;
  }, [title, category, file, isStudent, year, currentYear]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (!f) {
      setFile(null);
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('El archivo excede el tamaño máximo permitido de 10MB.');
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const input: UploadDocumentInput = {
        title,
        description: description || undefined,
        category,
        file: file!,
        year,
      };
      await uploadDocument(input);
      // Actualizar uso tras subida
      try {
        const docs = await listDocuments();
        const sum = (docs || []).reduce((acc, d) => acc + (Number(d.file_size || 0)), 0);
        setUsedBytes(sum);
      } catch {}
      onUploaded?.();
      onDismiss();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'No se pudo subir el documento');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Subir documento</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ marginBottom: 10 }}>
          <IonText style={{ display: 'block', marginBottom: 6 }}>
            Uso de almacenamiento: {(usedBytes / (1024*1024)).toFixed(2)} MB / 30.00 MB ({Math.round(usedPct * 100)}%)
          </IonText>
          <IonProgressBar value={usedPct} color={usedPct >= 1 ? 'danger' : usedPct > 0.85 ? 'warning' : 'primary'}></IonProgressBar>
        </div>
        <IonItem>
          <IonLabel position="stacked">Título</IonLabel>
          <IonInput value={title} placeholder="Ej: Certificado Alumno Regular" onIonChange={(e) => setTitle(e.detail.value || '')} />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Descripción</IonLabel>
          <IonTextarea autoGrow value={description} onIonChange={(e) => setDescription(e.detail.value || '')} />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Categoría</IonLabel>
          <IonSelect value={category} placeholder="Selecciona" onIonChange={(e) => setCategory(e.detail.value)} interface="popover">
            {categories.map(c => (
              <IonSelectOption key={c.value} value={c.value}>{c.label}</IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
        {isStudent && category === 'alumno_regular' && (
          <IonItem>
            <IonLabel position="stacked">Año</IonLabel>
            <IonInput type="number" value={year as any} placeholder={String(currentYear)} onIonChange={(e) => setYear(Number(e.detail.value))} />
          </IonItem>
        )}
        <IonItem>
          <IonLabel position="stacked">Archivo</IonLabel>
          <input type="file" onChange={onFileChange} />
        </IonItem>
        {file && (
          <IonText color={file.size > 10 * 1024 * 1024 ? 'danger' : 'medium'} style={{ display: 'block', marginTop: 6 }}>
            Archivo: {file.name} · {(file.size / (1024*1024)).toFixed(2)} MB (máx. 10MB)
          </IonText>
        )}
        <IonText color="medium" style={{ display: 'block', marginTop: 6 }}>
          Límite por archivo: 10MB · Cuota por usuario: 30MB.
        </IonText>
        {error && (
          <IonText color="danger" style={{ display: 'block', marginTop: 8 }}>{error}</IonText>
        )}
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          <IonButton onClick={handleSubmit} disabled={!canSubmit || submitting} className="primary-gradient-btn">{submitting ? 'Subiendo...' : 'Subir'}</IonButton>
          <IonButton fill="outline" color="medium" onClick={onDismiss}>Cancelar</IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default UploadDocumentModal;
