import React, { useMemo, useState } from 'react';
import { IonIcon, IonButton } from '@ionic/react';
import { chevronBackOutline, chevronForwardOutline, todayOutline, calendarOutline, timeOutline } from 'ionicons/icons';
import { motion } from 'framer-motion';

// Animaciones locales para evitar problemas de import
const fadeInUp = {
  initial: { 
    opacity: 0, 
    y: 24,
    scale: 0.96
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: { 
    opacity: 0, 
    y: -24,
    scale: 0.96,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const listItem = {
  initial: { 
    opacity: 0, 
    x: -20,
    scale: 0.95
  },
  animate: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};
import '../theme/modern-design.css';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  status?: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ events, onEventClick, onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Días del mes anterior
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push(prevMonthDay);
    }
    
    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Días del mes siguiente para completar la última semana
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };

  const days = useMemo(() => getDaysInMonth(currentDate), [currentDate]);

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toDateString();
    return events.filter(event => {
      const eventDate = new Date(event.start).toDateString();
      // Excluir citas canceladas
      return eventDate === dateStr && event.status !== 'cancelled';
    });
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date | null) => {
    if (!date) return false;
    return date.getMonth() === currentDate.getMonth();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const previousPeriod = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (view === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 1);
      setCurrentDate(newDate);
    }
  };

  const nextPeriod = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (view === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      setCurrentDate(newDate);
    }
  };

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getWeekRange = () => {
    const weekDays = getWeekDays();
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.getDate()} ${monthNames[start.getMonth()]} - ${end.getDate()} ${monthNames[end.getMonth()]} ${end.getFullYear()}`;
  };

  const getTitle = () => {
    if (view === 'month') {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (view === 'week') {
      return getWeekRange();
    } else {
      return `${currentDate.getDate()} ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return 'var(--color-primary-500)';
      case 'pending':
        return 'var(--color-warning)';
      case 'completed':
        return 'var(--color-success)';
      case 'cancelled':
        return 'var(--color-gray-400)';
      default:
        return 'var(--color-primary-500)';
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Header del calendario */}
      <div className="floating-card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)' }}>
        {/* Selector de vista */}
        <div
          className="calendar-view-toggle-group"
          style={{ marginBottom: 'var(--space-4)' }}
        >
          <button
            className={`calendar-view-toggle ${view === 'month' ? 'active' : ''}`}
            onClick={() => setView('month')}
          >
            Mes
          </button>
          <button
            className={`calendar-view-toggle ${view === 'week' ? 'active' : ''}`}
            onClick={() => setView('week')}
          >
            Semana
          </button>
          <button
            className={`calendar-view-toggle ${view === 'day' ? 'active' : ''}`}
            onClick={() => setView('day')}
          >
            Día
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)', position: 'relative' }}>
          <button 
            onClick={previousPeriod} 
            aria-label="Anterior"
            style={{
              position: 'absolute',
              left: 0,
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: '2px solid var(--color-gray-300)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: 'var(--color-primary-600)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-primary-50)';
              e.currentTarget.style.borderColor = 'var(--color-primary-500)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--color-gray-300)';
            }}
          >
            <IonIcon icon={chevronBackOutline} style={{ fontSize: 20 }} />
          </button>
          
          <button className="btn-modern-ghost" onClick={goToToday} style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <IonIcon icon={todayOutline} />
            <span>{view === 'month' ? 'Este mes' : view === 'week' ? 'Esta semana' : 'Hoy'}</span>
          </button>
          
          <button 
            onClick={nextPeriod} 
            aria-label="Siguiente"
            style={{
              position: 'absolute',
              right: 0,
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: '2px solid var(--color-gray-300)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: 'var(--color-primary-600)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-primary-50)';
              e.currentTarget.style.borderColor = 'var(--color-primary-500)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--color-gray-300)';
            }}
          >
            <IonIcon icon={chevronForwardOutline} style={{ fontSize: 20 }} />
          </button>
        </div>
        
        <h2 className="heading-lg" style={{ margin: 0, marginBottom: 'var(--space-4)', textAlign: 'center' }}>
          {getTitle()}
        </h2>

        {/* Vista Mes */}
        {view === 'month' && (
          <>
            {/* Días de la semana */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px',
          marginBottom: 'var(--space-3)',
          paddingBottom: 'var(--space-2)',
          borderBottom: '1px solid var(--color-gray-200)'
        }}>
          {dayNames.map((day) => (
            <div
              key={day}
              style={{
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '0.75rem',
                padding: 'var(--space-2)',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid de días */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px',
          background: 'var(--color-gray-100)',
          padding: '1px'
        }}>
          {days.map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const isCurrentDay = isToday(date);
            const isInCurrentMonth = isCurrentMonth(date);

            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => date && onDateClick?.(date)}
                style={{
                  minHeight: '70px',
                  padding: 'var(--space-2)',
                  background: isCurrentDay 
                    ? 'var(--bg-elevated)' 
                    : isInCurrentMonth 
                      ? 'var(--bg-elevated)' 
                      : 'var(--color-gray-50)',
                  border: 'none',
                  borderRadius: '0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isInCurrentMonth ? 1 : 0.5,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: isCurrentDay ? 700 : 500,
                    color: isCurrentDay ? 'white' : isInCurrentMonth ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    marginBottom: 'var(--space-1)',
                    textAlign: 'center',
                    width: isCurrentDay ? '28px' : 'auto',
                    height: isCurrentDay ? '28px' : 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: isCurrentDay ? '50%' : '0',
                    background: isCurrentDay ? 'var(--color-primary-500)' : 'transparent',
                    margin: isCurrentDay ? '0 auto' : '0',
                    lineHeight: 1
                  }}
                >
                  {date?.getDate()}
                </div>
                
                {/* Eventos del día */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '2px', 
                  width: '100%', 
                  flex: 1,
                  overflow: 'hidden'
                }}>
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      style={{
                        padding: '2px 4px',
                        background: getStatusColor(event.status),
                        color: 'white',
                        borderRadius: '3px',
                        fontSize: '0.6rem',
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                        lineHeight: 1.2,
                        flexShrink: 0
                      }}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div
                      style={{
                        fontSize: '0.6rem',
                        color: 'var(--text-tertiary)',
                        fontWeight: 500,
                        marginTop: '1px',
                        textAlign: 'center'
                      }}
                    >
                      +{dayEvents.length - 2}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
          </>
        )}

        {/* Vista Semana */}
        {view === 'week' && (
          <div>
            {/* Días de la semana */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '2px',
              marginBottom: 'var(--space-3)',
              paddingBottom: 'var(--space-2)',
              borderBottom: '1px solid var(--color-gray-200)'
            }}>
              {dayNames.map((day) => (
                <div
                  key={day}
                  style={{
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    padding: 'var(--space-2)',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grid de días de la semana */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '2px',
              background: 'var(--color-gray-100)',
              padding: '1px'
            }}>
              {getWeekDays().map((date, index) => {
                const dayEvents = getEventsForDate(date);
                const isCurrentDay = isToday(date);

                return (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onDateClick?.(date)}
                    style={{
                      minHeight: '140px',
                      padding: 'var(--space-3)',
                      background: 'var(--bg-elevated)',
                      border: 'none',
                      borderRadius: '0',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: isCurrentDay ? 700 : 500,
                        color: isCurrentDay ? 'white' : 'var(--text-primary)',
                        marginBottom: 'var(--space-2)',
                        textAlign: 'center',
                        width: isCurrentDay ? '36px' : 'auto',
                        height: isCurrentDay ? '36px' : 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: isCurrentDay ? '50%' : '0',
                        background: isCurrentDay ? 'var(--color-primary-500)' : 'transparent',
                        margin: isCurrentDay ? '0 auto' : '0',
                        lineHeight: 1
                      }}
                    >
                      {date.getDate()}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', flex: 1, overflow: 'auto' }}>
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(event);
                          }}
                          style={{
                            padding: '6px 8px',
                            background: getStatusColor(event.status),
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            maxWidth: '100%',
                            boxSizing: 'border-box',
                            lineHeight: 1.3
                          }}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Vista Día */}
        {view === 'day' && (
          <div>
            <div style={{ padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: '16px' }}>
              <h3 className="heading-md" style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
                {dayNames[currentDate.getDay()]}, {currentDate.getDate()} de {monthNames[currentDate.getMonth()]}
              </h3>
              
              {getEventsForDate(currentDate).length === 0 ? (
                <div className="empty-state-modern">
                  <IonIcon icon={calendarOutline} className="empty-state-icon" />
                  <h3 className="empty-state-title">Sin citas</h3>
                  <p className="empty-state-description">
                    No tienes citas programadas para este día.
                  </p>
                </div>
              ) : (
                <div className="stack-modern" style={{ gap: 'var(--space-3)' }}>
                  {getEventsForDate(currentDate).map((event) => (
                    <motion.div 
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div 
                        className="service-card-modern"
                        onClick={() => onEventClick?.(event)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="service-card-header">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 className="heading-md" style={{ margin: 0 }}>{event.title}</h3>
                            <span 
                              className={`badge-${event.status}`} 
                              style={{ fontSize: '0.75rem', padding: '8px 16px', lineHeight: 1 }}
                            >
                              {event.status === 'confirmed' ? 'Confirmada' : event.status === 'pending' ? 'Pendiente' : 'Completada'}
                            </span>
                          </div>
                        </div>
                        <div className="service-card-content">
                          <div className="meta-item-modern">
                            <IonIcon icon={timeOutline} />
                            <span>{new Date(event.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Leyenda de estados */}
      <div className="floating-card" style={{ padding: 'var(--space-4)' }}>
        <h3 className="heading-md" style={{ marginBottom: 'var(--space-3)' }}>Leyenda</h3>
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          {[
            { label: 'Confirmada', status: 'confirmed' },
            { label: 'Pendiente', status: 'pending' },
            { label: 'Completada', status: 'completed' }
          ].map(({ label, status }) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '4px',
                  background: getStatusColor(status)
                }}
              />
              <span className="body-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
