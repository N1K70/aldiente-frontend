import React, { useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonText,
  IonTextarea,
  IonItem,
  IonLabel,
  IonToast,
} from '@ionic/react';
import { star, starOutline } from 'ionicons/icons';
import { createRating } from './ratings.api';
import { CreateRatingRequest } from './types';

interface RatingFormProps {
  appointmentId: string;
  toUserId: string;
  toUserName: string;
  onRatingCreated?: () => void;
  onCancel?: () => void;
}

const RatingForm: React.FC<RatingFormProps> = ({ 
  appointmentId, 
  toUserId, 
  toUserName, 
  onRatingCreated,
  onCancel 
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; color: string } | null>(null);

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setToast({ show: true, message: 'Por favor selecciona una calificación', color: 'warning' });
      return;
    }

    try {
      setLoading(true);
      const request: CreateRatingRequest = {
        appointmentId,
        toUserId,
        rating,
        comment: comment.trim() || undefined
      };

      await createRating(request);
      setToast({ show: true, message: 'Calificación enviada exitosamente', color: 'success' });
      
      if (onRatingCreated) {
        onRatingCreated();
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Error al enviar calificación';
      setToast({ show: true, message, color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <IonIcon
          key={i}
          icon={i <= rating ? star : starOutline}
          style={{ 
            color: i <= rating ? '#FFD700' : '#E0E0E0',
            fontSize: '32px',
            margin: '0 4px',
            cursor: 'pointer'
          }}
          onClick={() => handleStarClick(i)}
        />
      );
    }
    return stars;
  };

  const getRatingText = () => {
    switch (rating) {
      case 1: return 'Muy malo';
      case 2: return 'Malo';
      case 3: return 'Regular';
      case 4: return 'Bueno';
      case 5: return 'Excelente';
      default: return 'Selecciona una calificación';
    }
  };

  return (
    <>
      <IonCard style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <IonCardHeader>
          <IonCardTitle style={{ fontSize: '20px', textAlign: 'center' }}>
            Calificar Atención
          </IonCardTitle>
          <IonText color="medium" style={{ textAlign: 'center', display: 'block' }}>
            ¿Cómo fue tu experiencia con {toUserName}?
          </IonText>
        </IonCardHeader>
        
        <IonCardContent style={{ textAlign: 'center' }}>
          {/* Estrellas */}
          <div style={{ margin: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
              {renderStars()}
            </div>
            <IonText style={{ 
              fontSize: '16px', 
              fontWeight: '600',
              color: rating > 0 ? '#D40710' : '#666'
            }}>
              {getRatingText()}
            </IonText>
          </div>

          {/* Comentario */}
          <IonItem lines="none" style={{ margin: '20px 0' }}>
            <IonLabel position="stacked">
              Comentario (opcional)
            </IonLabel>
            <IonTextarea
              value={comment}
              onIonChange={(e) => setComment(e.detail.value!)}
              placeholder="Comparte tu experiencia..."
              rows={3}
              maxlength={500}
              style={{
                '--padding-start': '0',
                '--padding-end': '0',
              }}
            />
          </IonItem>

          {/* Botones */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            {onCancel && (
              <IonButton
                expand="block"
                fill="outline"
                onClick={onCancel}
                disabled={loading}
                style={{ flex: 1 }}
              >
                Cancelar
              </IonButton>
            )}
            <IonButton
              expand="block"
              onClick={handleSubmit}
              disabled={loading || rating === 0}
              style={{
                flex: 1,
                background: rating > 0 ? 'linear-gradient(135deg, #D40710, #FF5252)' : undefined
              }}
            >
              {loading ? 'Enviando...' : 'Enviar Calificación'}
            </IonButton>
          </div>
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

export default RatingForm;
