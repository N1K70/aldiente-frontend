import React, { useEffect, useMemo, useState } from 'react';
import {
  IonButton,
  IonIcon,
  IonText,
} from '@ionic/react';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';

interface CustomDatePickerProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  isDateEnabled?: (date: string) => boolean;
  availableDates?: string[]; // Array de fechas disponibles en formato YYYY-MM-DD
  minDate?: string; // YYYY-MM-DD
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selectedDate,
  onDateChange,
  isDateEnabled = () => true,
  availableDates = [],
  minDate,
}) => {
  const baseDate = useMemo(() => {
    if (minDate) {
      const parsed = new Date(minDate);
      if (!Number.isNaN(parsed.getTime())) {
        parsed.setHours(0, 0, 0, 0);
        return parsed;
      }
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, [minDate]);

  const baseDateStr = useMemo(() => baseDate.toISOString().split('T')[0], [baseDate]);

  const [currentWeekStart, setCurrentWeekStart] = useState(baseDate);

  useEffect(() => {
    setCurrentWeekStart(baseDate);
  }, [baseDate]);

  // Auto-navegar a la primera semana con disponibilidad
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      const firstAvailable = new Date(availableDates[0]);
      firstAvailable.setHours(0, 0, 0, 0);
      setCurrentWeekStart(firstAvailable);
    }
  }, [availableDates, selectedDate]);

  // Generar los días de la semana actual
  const weekDays = useMemo(() => {
    const days = [];
    const today = new Date(baseDate);

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);

      // Solo mostrar fechas desde hoy en adelante
      if (date < today) {
        continue;
      }

      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
      const dayNumber = date.getDate();
      const isToday = date.getTime() === today.getTime();
      const isEnabled = isDateEnabled(dateStr) && (availableDates.length === 0 || availableDates.includes(dateStr));
      const isSelected = dateStr === selectedDate;

      // Verificar si hay disponibilidad para este día
      const hasAvailability = availableDates.length === 0 || availableDates.includes(dateStr);

      days.push({
        date: dateStr,
        dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        dayNumber,
        isToday,
        isEnabled,
        isSelected,
        hasAvailability,
      });
    }

    return days;
  }, [currentWeekStart, selectedDate, isDateEnabled, availableDates, baseDate]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const today = new Date(baseDate);

    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7));

    // No permitir navegar a semanas anteriores a hoy
    if (direction === 'prev' && newWeekStart < today) {
      setCurrentWeekStart(today);
      return;
    }

    setCurrentWeekStart(newWeekStart);
  };

  const canGoPrev = useMemo(() => {
    const today = new Date(baseDate);
    return currentWeekStart > today;
  }, [currentWeekStart, baseDate]);

  const monthYear = useMemo(() => {
    return currentWeekStart.toLocaleDateString('es-ES', { 
      month: 'long', 
      year: 'numeric' 
    });
  }, [currentWeekStart]);

  // Validar que la fecha seleccionada no sea anterior a hoy
  useEffect(() => {
    if (!selectedDate) return;
    const selected = new Date(selectedDate);
    if (Number.isNaN(selected.getTime())) return;
    selected.setHours(0, 0, 0, 0);
    if (selected < baseDate) {
      const fallback = availableDates.find(date => {
        const parsed = new Date(date);
        parsed.setHours(0, 0, 0, 0);
        return parsed >= baseDate;
      }) || baseDateStr;
      if (fallback !== selectedDate) {
        onDateChange(fallback);
      }
    }
  }, [selectedDate, baseDate, availableDates, baseDateStr, onDateChange]);

  return (
    <div style={{ padding: '16px 0' }}>
      {/* Header con mes/año y navegación */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '16px' 
      }}>
        <IonButton 
          fill="clear" 
          size="small" 
          onClick={() => navigateWeek('prev')}
          style={{ margin: 0 }}
          disabled={!canGoPrev}
        >
          <IonIcon icon={chevronBackOutline} />
        </IonButton>
        
        <IonText style={{ 
          fontSize: '18px', 
          fontWeight: '600',
          textTransform: 'capitalize',
          color: 'var(--ion-color-primary)'
        }}>
          {monthYear}
        </IonText>
        
        <IonButton 
          fill="clear" 
          size="small" 
          onClick={() => navigateWeek('next')}
          style={{ margin: 0 }}
        >
          <IonIcon icon={chevronForwardOutline} />
        </IonButton>
      </div>

      {/* Días de la semana */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.max(weekDays.length, 1)}, 1fr)`,
        gap: '4px',
        width: '100%',
        maxWidth: '100%',
        paddingBottom: '4px',
        overflow: 'hidden'
      }}>
        {weekDays.map((day) => (
          <div
            key={day.date}
            onClick={() => day.isEnabled ? onDateChange(day.date) : null}
            style={{
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              height: '64px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              cursor: day.isEnabled ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              backgroundColor: day.isSelected
                ? 'var(--ion-color-primary)'
                : day.isToday
                  ? 'var(--ion-color-primary-tint)'
                  : day.hasAvailability && day.isEnabled
                    ? 'var(--ion-color-light)'
                    : 'var(--ion-color-light-shade)',
              border: day.isSelected
                ? '2px solid var(--ion-color-primary)'
                : day.isToday
                  ? '2px solid var(--ion-color-primary-tint)'
                  : '1px solid var(--ion-color-medium-tint)',
              opacity: day.isEnabled ? 1 : 0.4,
              transform: day.isSelected ? 'scale(1.02)' : 'scale(1)',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}
          >
            <IonText style={{ 
              fontSize: '12px', 
              fontWeight: '500',
              color: day.isSelected 
                ? 'white' 
                : day.isToday 
                  ? 'var(--ion-color-primary)' 
                  : 'var(--ion-color-medium-shade)',
              marginBottom: '2px'
            }}>
              {day.dayName}
            </IonText>
            
            <IonText style={{ 
              fontSize: '16px', 
              fontWeight: '600',
              color: day.isSelected 
                ? 'white' 
                : day.isToday 
                  ? 'var(--ion-color-primary)' 
                  : day.isEnabled 
                    ? 'var(--ion-color-dark)' 
                    : 'var(--ion-color-medium)'
            }}>
              {day.dayNumber}
            </IonText>
            
            {/* Indicador de disponibilidad */}
            {day.hasAvailability && day.isEnabled && !day.isSelected && (
              <div style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: 'var(--ion-color-success)',
                marginTop: '2px'
              }} />
            )}
          </div>
        ))}
      </div>
      
      {/* Leyenda */}
      <div style={{ 
        marginTop: '12px', 
        display: 'flex', 
        gap: '16px', 
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--ion-color-success)'
          }} />
          <IonText style={{ fontSize: '12px', color: 'var(--ion-color-medium)' }}>
            Disponible
          </IonText>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--ion-color-primary)'
          }} />
          <IonText style={{ fontSize: '12px', color: 'var(--ion-color-medium)' }}>
            Hoy
          </IonText>
        </div>
      </div>
    </div>
  );
};

export default CustomDatePicker;
