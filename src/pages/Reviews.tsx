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
  IonTextarea,
  IonItem,
  IonLabel,
  IonAvatar,
  IonChip,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  starOutline,
  star,
  arrowBackOutline,
  personOutline,
  calendarOutline,
  heartOutline,
  checkmarkOutline,
} from 'ionicons/icons';

interface Review {
  id: string;
  studentName: string;
  patientName: string;
  appointmentDate: string;
  rating: number;
  comment: string;
  procedure: string;
  verified: boolean;
}

interface ReviewFormProps {
  appointmentId?: string;
  studentId?: string;
  onSubmit?: (review: Omit<Review, 'id'>) => void;
}

const Reviews: React.FC<ReviewFormProps> = ({ 
  appointmentId = '123', 
  studentId = 'student123',
  onSubmit 
}) => {
  const displayStudentName = 'Estudiante Actual';
  const displayProcedure = 'Procedimiento Actual';
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [existingReviews, setExistingReviews] = useState<Review[]>([
    {
      id: '1',
      studentName: 'María García',
      patientName: 'Juan Pérez',
      appointmentDate: '2024-01-15',
      rating: 5,
      comment: 'Excelente atención, muy profesional y cuidadosa. Explicó todo el procedimiento detalladamente.',
      procedure: 'Limpieza Dental',
      verified: true,
    },
    {
      id: '2',
      studentName: 'María García',
      patientName: 'Ana López',
      appointmentDate: '2024-01-10',
      rating: 4,
      comment: 'Muy buena experiencia. El estudiante fue amable y el procedimiento fue cómodo.',
      procedure: 'Blanqueamiento',
      verified: true,
    },
  ]);
  const history = useHistory();

  const handleSubmit = () => {
    if (rating > 0 && comment.trim()) {
      const newReview: Omit<Review, 'id'> = {
        studentName: 'Estudiante Actual',
        patientName: 'Tú',
        appointmentDate: new Date().toISOString().split('T')[0],
        rating,
        comment,
        procedure: 'Procedimiento Actual',
        verified: true,
      };
      
      if (onSubmit) {
        onSubmit(newReview);
      } else {
        setExistingReviews([...existingReviews, { ...newReview, id: Date.now().toString() }]);
        alert('¡Gracias por tu reseña!');
        setRating(0);
        setComment('');
      }
    }
  };

  const StarRating = ({ value, onChange, interactive = true }: {
    value: number;
    onChange?: (rating: number) => void;
    interactive?: boolean;
  }) => (
    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <IonIcon
          key={star}
          icon={(interactive ? hoveredRating : value) >= star ? star : starOutline}
          style={{
            fontSize: '24px',
            color: (interactive ? hoveredRating : value) >= star ? '#FFD700' : '#ddd',
            cursor: interactive ? 'pointer' : 'default',
          }}
          onClick={() => interactive && onChange && onChange(star)}
          onMouseEnter={() => interactive && setHoveredRating(star)}
          onMouseLeave={() => interactive && setHoveredRating(0)}
        />
      ))}
    </div>
  );

  const ReviewCard = ({ review }: { review: Review }) => (
    <IonCard style={{
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      margin: '0 0 15px 0',
    }}>
      <IonCardContent>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <IonAvatar style={{
            width: '40px',
            height: '40px',
            background: '#D40710',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '10px',
            fontSize: '14px',
            color: '#fff',
          }}>
            {review.patientName.charAt(0)}
          </IonAvatar>
          <div>
            <div style={{ fontWeight: '600', fontSize: '16px' }}>
              {review.patientName}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {review.appointmentDate} - {review.procedure}
            </div>
          </div>
          {review.verified && (
            <IonChip color="success" style={{ marginLeft: 'auto', fontSize: '12px' }}>
              <IonIcon icon={checkmarkOutline} />
              Verificado
            </IonChip>
          )}
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <StarRating value={review.rating} interactive={false} />
        </div>
        
        <IonText color="medium" style={{ fontSize: '14px', lineHeight: '1.5' }}>
          {review.comment}
        </IonText>
      </IonCardContent>
    </IonCard>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#FFFFFF' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/appointments" />
          </IonButtons>
          <IonTitle>Calificaciones y Reseñas</IonTitle>
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
              <IonIcon icon={starOutline} style={{ fontSize: '40px', color: '#fff' }} />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 10px 0' }}>
              Califica tu Experiencia
            </h1>
            <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
              Tu opinión nos ayuda a mejorar nuestros servicios
            </p>
          </div>

          {/* Existing Reviews */}
          <IonCard style={{
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            margin: '0 0 20px 0',
          }}>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={heartOutline} style={{ marginRight: '8px' }} />
                Reseñas Anteriores
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {existingReviews.map(review => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </IonCardContent>
          </IonCard>

          {/* New Review Form */}
          <IonCard style={{
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            margin: '0 0 20px 0',
          }}>
            <IonCardHeader>
              <IonCardTitle>Escribe tu Reseña</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <IonLabel style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
                    Calificación General
                  </IonLabel>
                  <StarRating value={rating} onChange={setRating} />
                </div>

                <IonItem>
                  <IonLabel position="stacked">Comentario</IonLabel>
                  <IonTextarea
                    value={comment}
                    onIonChange={(e) => setComment(e.detail.value!)}
                    placeholder="Comparte tu experiencia... ¿Qué te gustó? ¿Qué podría mejorarse?"
                    rows={4}
                    style={{ '--padding-start': '0' }}
                  />
                </IonItem>

                <IonGrid>
                  <IonRow>
                    <IonCol size="6">
                      <IonItem>
                        <IonLabel position="stacked">Estudiante</IonLabel>
                        <IonText color="medium">{displayStudentName}</IonText>
                      </IonItem>
                    </IonCol>
                    <IonCol size="6">
                      <IonItem>
                        <IonLabel position="stacked">Procedimiento</IonLabel>
                        <IonText color="medium">{displayProcedure}</IonText>
                      </IonItem>
                    </IonCol>
                  </IonRow>
                  <IonRow>
                    <IonCol size="12">
                      <IonItem>
                        <IonLabel position="stacked">Fecha de Cita</IonLabel>
                        <IonText color="medium">
                          <IonIcon icon={calendarOutline} style={{ marginRight: '5px' }} />
                          {new Date().toLocaleDateString('es-ES')}
                        </IonText>
                      </IonItem>
                    </IonCol>
                  </IonRow>
                </IonGrid>

                <IonButton
                  expand="block"
                  disabled={rating === 0 || !comment.trim()}
                  onClick={handleSubmit}
                  style={{
                    height: '50px',
                    borderRadius: '12px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #D40710, #FF5252)',
                  }}
                >
                  <IonIcon icon={checkmarkOutline} slot="start" />
                  Enviar Reseña
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>

          <IonCard style={{
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            margin: '0 0 20px 0',
          }}>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={personOutline} style={{ marginRight: '8px' }} />
                Guía de Calificación
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#666' }}>
                <p><strong>⭐⭐⭐⭐⭐ Excelente:</strong> Servicio excepcional, superó expectativas</p>
                <p><strong>⭐⭐⭐⭐ Muy Bueno:</strong> Buena experiencia, cumplió expectativas</p>
                <p><strong>⭐⭐⭐ Bueno:</strong> Experiencia satisfactoria</p>
                <p><strong>⭐⭐ Regular:</strong> Experiencia aceptable pero puede mejorar</p>
                <p><strong>⭐ Necesita Mejorar:</strong> Experiencia insatisfactoria</p>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Reviews;
