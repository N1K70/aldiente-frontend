import React from 'react';
import {
  IonButton,
  IonText,
  IonChip,
  IonIcon,
} from '@ionic/react';
import { timeOutline, sunnyOutline, partlySunnyOutline, moonOutline } from 'ionicons/icons';

interface TimeSlotPickerProps {
  availableTimes: string[]; // Array de horarios en formato "HH:mm"
  selectedTime: string;
  onTimeChange: (time: string) => void;
  loading?: boolean;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  availableTimes,
  selectedTime,
  onTimeChange,
  loading = false,
}) => {
  // Categorizar horarios por período del día
  const categorizeTime = (time: string) => {
    const [hours] = time.split(':').map(Number);
    if (hours >= 6 && hours < 12) return 'morning';
    if (hours >= 12 && hours < 18) return 'afternoon';
    return 'night';
  };

  const timeCategories = {
    morning: availableTimes.filter(time => categorizeTime(time) === 'morning'),
    afternoon: availableTimes.filter(time => categorizeTime(time) === 'afternoon'),
    night: availableTimes.filter(time => categorizeTime(time) === 'night'),
  };

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'morning':
        return { label: 'MAÑANA', icon: sunnyOutline, color: 'warning' };
      case 'afternoon':
        return { label: 'TARDE', icon: partlySunnyOutline, color: 'primary' };
      case 'night':
        return { label: 'NOCHE', icon: moonOutline, color: 'dark' };
      default:
        return { label: '', icon: timeOutline, color: 'medium' };
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <IonText color="medium">Cargando horarios disponibles...</IonText>
      </div>
    );
  }

  if (availableTimes.length === 0) {
    return (
      <div style={{ 
        padding: '24px', 
        textAlign: 'center',
        backgroundColor: 'var(--ion-color-light)',
        borderRadius: '12px',
        margin: '16px 0'
      }}>
        <IonIcon 
          icon={timeOutline} 
          style={{ 
            fontSize: '48px', 
            color: 'var(--ion-color-medium)',
            marginBottom: '8px'
          }} 
        />
        <IonText color="medium" style={{ display: 'block', fontSize: '16px' }}>
          No hay horarios disponibles para este día
        </IonText>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 0' }}>
      <IonText style={{ 
        fontSize: '16px', 
        fontWeight: '600', 
        color: 'var(--ion-color-dark)',
        marginBottom: '16px',
        display: 'block'
      }}>
        Horarios disponibles:
      </IonText>

      {Object.entries(timeCategories).map(([category, times]) => {
        if (times.length === 0) return null;
        
        const categoryInfo = getCategoryInfo(category);
        
        return (
          <div key={category} style={{ marginBottom: '24px' }}>
            {/* Header de categoría */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '12px' 
            }}>
              <IonChip color={categoryInfo.color} style={{ margin: 0 }}>
                <IonIcon icon={categoryInfo.icon} />
                <IonText style={{ marginLeft: '4px', fontWeight: '600' }}>
                  {categoryInfo.label}
                </IonText>
              </IonChip>
              
              {times.length === 0 && (
                <IonText color="medium" style={{ fontSize: '14px' }}>
                  No hay horarios disponibles
                </IonText>
              )}
            </div>

            {/* Grid de horarios */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', 
              gap: '8px',
              maxWidth: '100%'
            }}>
              {times.map((time) => (
                <IonButton
                  key={time}
                  fill={selectedTime === time ? 'solid' : 'outline'}
                  color={selectedTime === time ? 'primary' : 'medium'}
                  size="small"
                  onClick={() => onTimeChange(time)}
                  style={{
                    '--border-radius': '8px',
                    '--padding-start': '12px',
                    '--padding-end': '12px',
                    height: '36px',
                    fontSize: '14px',
                    fontWeight: '500',
                    margin: 0,
                    transition: 'all 0.2s ease',
                    transform: selectedTime === time ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  {time}
                </IonButton>
              ))}
            </div>
          </div>
        );
      })}

      {/* Resumen de selección */}
      {selectedTime && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: 'var(--ion-color-primary-tint)',
          borderRadius: '8px',
          border: '1px solid var(--ion-color-primary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IonIcon 
              icon={timeOutline} 
              style={{ color: 'var(--ion-color-primary)' }} 
            />
            <IonText style={{ 
              color: 'var(--ion-color-primary)', 
              fontWeight: '600' 
            }}>
              Hora seleccionada: {selectedTime}
            </IonText>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSlotPicker;
