import React, { useCallback, useState } from 'react';
import {
  IonInput,
  IonSpinner,
  IonToast,
} from '@ionic/react';
import CentralModal from '../../components/CentralModal';
import { changePassword } from './account.api';

interface Props {
  isOpen: boolean;
  onDismiss: () => void;
  originElement?: HTMLElement | null;
}

const ChangePasswordModal: React.FC<Props> = ({ isOpen, onDismiss, originElement }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Success toast on save
  const [successToastOpen, setSuccessToastOpen] = useState(false);

  const reset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setSubmitting(false);
  };

  const handleClose = useCallback(() => {
    if (submitting) return;
    reset();
    onDismiss();
  }, [onDismiss, submitting]);

  const onSubmit = useCallback(async () => {
    setError('');
    setSuccess('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Completa todos los campos');
      return;
    }
    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('La confirmación no coincide');
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess('Contraseña actualizada correctamente');
      setSuccessToastOpen(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'No se pudo actualizar la contraseña');
    } finally {
      setSubmitting(false);
    }
  }, [currentPassword, newPassword, confirmPassword, handleClose]);

  return (
    <CentralModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Cambiar contraseña"
      size="small"
      closeOnBackdrop={!submitting}
      originElement={originElement}
    >
      <div style={{ padding: '24px' }}>
        {error && <p style={{ color: 'var(--color-error)', marginBottom: '16px' }}>{error}</p>}
        {success && <p style={{ color: 'var(--color-success)', marginBottom: '16px' }}>{success}</p>}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Contraseña actual</label>
            <IonInput 
              type="password" 
              value={currentPassword} 
              onIonInput={e => setCurrentPassword(e.detail.value || '')}
              style={{
                '--background': '#f5f5f5',
                '--border-radius': '12px',
                '--padding-start': '16px',
                '--padding-end': '16px',
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Nueva contraseña</label>
            <IonInput 
              type="password" 
              value={newPassword} 
              onIonInput={e => setNewPassword(e.detail.value || '')}
              style={{
                '--background': '#f5f5f5',
                '--border-radius': '12px',
                '--padding-start': '16px',
                '--padding-end': '16px',
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Confirmar nueva contraseña</label>
            <IonInput 
              type="password" 
              value={confirmPassword} 
              onIonInput={e => setConfirmPassword(e.detail.value || '')}
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
          disabled={submitting}
        >
          {submitting ? (
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
        message="Contraseña actualizada"
        duration={1200}
        onDidDismiss={() => { setSuccessToastOpen(false); handleClose(); }}
      />
    </CentralModal>
  );
};

export default ChangePasswordModal;
