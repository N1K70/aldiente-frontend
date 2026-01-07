import React, { useState, useEffect } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonText,
  IonSpinner,
  IonItem,
  IonLabel,
  IonNote,
} from '@ionic/react';
import { star, starOutline } from 'ionicons/icons';
import { getUserRatings, getUserRatingStats } from './ratings.api';
import { Rating, RatingStats } from './types';

interface RatingDisplayProps {
  userId: string;
  showDetails?: boolean;
}

const RatingDisplay: React.FC<RatingDisplayProps> = ({ userId, showDetails = false }) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRatings();
  }, [userId]);

  const loadRatings = async () => {
    try {
      setLoading(true);
      const [ratingsData, statsData] = await Promise.all([
        showDetails ? getUserRatings(userId) : Promise.resolve([]),
        getUserRatingStats(userId)
      ]);
      setRatings(ratingsData);
      setStats(statsData);
      setError('');
    } catch (err: any) {
      console.error('Error loading ratings:', err);
      setError('Error al cargar calificaciones');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, size: 'small' | 'medium' = 'small') => {
    const stars = [];
    const iconSize = size === 'small' ? '16px' : '20px';
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <IonIcon
          key={i}
          icon={i <= rating ? star : starOutline}
          style={{ 
            color: i <= rating ? '#FFD700' : '#E0E0E0',
            fontSize: iconSize,
            marginRight: '2px'
          }}
        />
      );
    }
    return stars;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <IonSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <IonText color="danger" style={{ padding: '20px', display: 'block', textAlign: 'center' }}>
        {error}
      </IonText>
    );
  }

  if (!stats || stats.total_ratings === 0) {
    return (
      <IonText color="medium" style={{ padding: '20px', display: 'block', textAlign: 'center' }}>
        Sin calificaciones aún
      </IonText>
    );
  }

  return (
    <div>
      {/* Resumen de calificaciones */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        padding: showDetails ? '0 0 16px 0' : '0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {renderStars(Math.round(Number(stats.average_rating) || 0), 'medium')}
        </div>
        <IonText style={{ fontWeight: '600', fontSize: '18px' }}>
          {(Number(stats.average_rating) || 0).toFixed(1)}
        </IonText>
        <IonText color="medium" style={{ fontSize: '14px' }}>
          ({Number(stats.total_ratings) || 0} {Number(stats.total_ratings) === 1 ? 'calificación' : 'calificaciones'})
        </IonText>
      </div>

      {/* Detalles de calificaciones */}
      {showDetails && ratings.length > 0 && (
        <IonCard style={{ margin: '16px 0', borderRadius: '12px' }}>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: '18px' }}>
              Calificaciones Recibidas
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent style={{ padding: '0' }}>
            {ratings.map((rating, index) => (
              <IonItem key={rating.id} lines={index === ratings.length - 1 ? 'none' : 'inset'}>
                <IonLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ display: 'flex' }}>
                      {renderStars(rating.rating)}
                    </div>
                    <IonText style={{ fontWeight: '600' }}>
                      {rating.rating}/5
                    </IonText>
                  </div>
                  {rating.comment && (
                    <IonText color="dark" style={{ display: 'block', marginBottom: '4px' }}>
                      "{rating.comment}"
                    </IonText>
                  )}
                  <IonNote style={{ fontSize: '12px' }}>
                    {formatDate(rating.created_at)}
                  </IonNote>
                </IonLabel>
              </IonItem>
            ))}
          </IonCardContent>
        </IonCard>
      )}
    </div>
  );
};

export default RatingDisplay;
