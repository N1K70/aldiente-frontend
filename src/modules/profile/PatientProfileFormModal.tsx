import React, { useCallback, useEffect, useState } from 'react';
import {
  IonInput,
  IonDatetime,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonToast,
} from '@ionic/react';
import CentralModal from '../../components/CentralModal';
import { getPatientProfile, upsertPatientProfile, PatientProfile, UpsertPatientProfilePayload } from './patient.api';

interface Props {
  isOpen: boolean;
  onDismiss: () => void;
  originElement?: HTMLElement | null;
}

const PatientProfileFormModal: React.FC<Props> = ({ isOpen, onDismiss, originElement }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  // Success toast on save
  const [successToastOpen, setSuccessToastOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!isOpen) return;
      setError('');
      setLoading(true);
      try {
        const p: PatientProfile = await getPatientProfile();
        if (!mounted) return;
        setName((p?.name as any) || '');
        setBirthDate((p?.birth_date as any) || '');
        setGender((p?.gender as any) || '');
        setLocation((p?.location as any) || '');
      } catch (e: any) {
        // Si 404, el usuario aún no tiene perfil: mantener campos vacíos
        const status = e?.response?.status;
        if (status !== 404) {
          setError(e?.message || 'No se pudo cargar el perfil');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [isOpen]);

  const reset = () => {
    setError('');
    setLoading(false);
    setSaving(false);
  };

  const handleClose = useCallback(() => {
    if (saving) return;
    reset();
    onDismiss();
  }, [onDismiss, saving]);

  const onSubmit = useCallback(async () => {
    setError('');
    if (!name) {
      setError('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      const payload: UpsertPatientProfilePayload = {
        name,
        birthDate: birthDate ? birthDate.substring(0, 10) : null,
        gender: gender || null,
        location: location || null,
      };
      await upsertPatientProfile(payload);
      setSuccessToastOpen(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'No se pudo guardar el perfil');
    } finally {
      setSaving(false);
    }
  }, [name, birthDate, gender, location, handleClose]);

  return (
    <CentralModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar perfil de paciente"
      size="medium"
      closeOnBackdrop={!saving}
      originElement={originElement}
    >
      <div style={{ padding: '24px' }}>
        {error && <p style={{ color: 'var(--color-error)', marginBottom: '16px' }}>{error}</p>}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Nombre*</label>
            <IonInput 
              value={name} 
              onIonChange={e => setName(e.detail.value || '')} 
              placeholder="Tu nombre"
              style={{
                '--background': '#f5f5f5',
                '--border-radius': '12px',
                '--padding-start': '16px',
                '--padding-end': '16px',
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Fecha de nacimiento</label>
            <IonDatetime
              presentation="date"
              value={birthDate}
              onIonChange={e => setBirthDate((e.detail.value as string) || '')}
              style={{ background: '#f5f5f5', borderRadius: '12px', padding: '8px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Género</label>
            <IonSelect 
              interface="popover" 
              value={gender} 
              onIonChange={e => setGender(e.detail.value)}
              style={{
                '--background': '#f5f5f5',
                '--border-radius': '12px',
                '--padding-start': '16px',
                '--padding-end': '16px',
              }}
            >
              <IonSelectOption value="">No especificar</IonSelectOption>
              <IonSelectOption value="female">Femenino</IonSelectOption>
              <IonSelectOption value="male">Masculino</IonSelectOption>
              <IonSelectOption value="other">Otro</IonSelectOption>
            </IonSelect>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Ubicación</label>
            <IonInput 
              value={location} 
              onIonChange={e => setLocation(e.detail.value || '')} 
              placeholder="Ciudad, País"
              style={{
                '--background': '#f5f5f5',
                '--border-radius': '12px',
                '--padding-start': '16px',
                '--padding-end': '16px',
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Footer con botón */}
      <div style={{ borderTop: '1px solid #e5e7eb', padding: '16px', background: 'white' }}>
        <button
          className="btn-modern-primary"
          style={{ width: '100%' }}
          onClick={onSubmit}
          disabled={saving}
        >
          {saving ? (
            <>
              <IonSpinner name="dots" style={{ width: 20, height: 20 }} />
              <span>Guardando...</span>
            </>
          ) : (
            'Guardar'
          )}
        </button>
      </div>
      <IonToast
        isOpen={successToastOpen}
        color="success"
        message="Perfil actualizado"
        duration={1200}
        onDidDismiss={() => { setSuccessToastOpen(false); handleClose(); }}
      />
    </CentralModal>
  );
};

export default PatientProfileFormModal;
