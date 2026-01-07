import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { sparklesOutline, searchOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { getAllAvailableServices } from './services.api';
import './ServiceQuizResults.css';

interface ServiceQuizResultsProps {
  answers: Record<string, string[]>;
}

interface MatchedService {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  student_count: number;
  avg_rating: number;
  matchScore: number; // 0-100
  matchReasons: string[];
}

const ServiceQuizResults: React.FC<ServiceQuizResultsProps> = ({ answers }) => {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<MatchedService[]>([]);
  const history = useHistory();

  useEffect(() => {
    loadAndMatchServices();
  }, [answers]);

  const loadAndMatchServices = async () => {
    try {
      setLoading(true);
      const allServices: any[] = await getAllAvailableServices();
      
      // Algoritmo de matching
      const matchedServices: MatchedService[] = allServices.map(service => {
        const matchData = calculateMatch(service, answers);
        return {
          id: service.id,
          name: service.service_name || service.name || 'Servicio',
          description: service.description || '',
          price: Number(service.price) || 0,
          duration: service.duration || 30,
          student_count: service.student_count || 1,
          avg_rating: service.avg_rating || 4.0,
          matchScore: matchData.score,
          matchReasons: matchData.reasons
        };
      });

      // Ordenar por score y tomar top 6
      const topMatches = matchedServices
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 6);

      setServices(topMatches);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMatch = (service: any, answers: Record<string, string[]>) => {
    let score = 0;
    const reasons: string[] = [];
    const maxScore = 100;

    // Razón de visita (40 puntos)
    const reason = answers.reason?.[0];
    if (reason) {
      const reasonKeywords = getReasonKeywords(reason);
      const serviceName = service.name.toLowerCase();
      const serviceDesc = service.description?.toLowerCase() || '';
      
      const keywordMatch = reasonKeywords.some(keyword => 
        serviceName.includes(keyword) || serviceDesc.includes(keyword)
      );
      
      if (keywordMatch) {
        score += 40;
        reasons.push(getReasonLabel(reason));
      } else {
        score += 10; // Puntos base
      }
    }

    // Presupuesto (30 puntos)
    const budget = answers.budget?.[0];
    if (budget && service.price) {
      const budgetMatch = checkBudgetMatch(budget, service.price);
      if (budgetMatch.matches) {
        score += 30;
        reasons.push(budgetMatch.reason);
      } else {
        score += 10;
      }
    }

    // Urgencia (15 puntos)
    const urgency = answers.urgency?.[0];
    if (urgency === 'urgent') {
      // Priorizar servicios con más disponibilidad
      if (service.student_count > 2) {
        score += 15;
        reasons.push('Múltiples estudiantes disponibles');
      } else {
        score += 5;
      }
    } else {
      score += 10;
    }

    // Rating (15 puntos)
    if (service.avg_rating >= 4.5) {
      score += 15;
      reasons.push('Excelente calificación');
    } else if (service.avg_rating >= 4.0) {
      score += 10;
    } else {
      score += 5;
    }

    return {
      score: Math.min(score, maxScore),
      reasons
    };
  };

  const getReasonKeywords = (reason: string): string[] => {
    const keywordMap: Record<string, string[]> = {
      pain: ['dolor', 'extracción', 'endodoncia', 'emergencia', 'urgencia'],
      checkup: ['limpieza', 'revisión', 'diagnóstico', 'control', 'chequeo'],
      aesthetic: ['blanqueamiento', 'ortodoncia', 'estética', 'carillas', 'sonrisa'],
      prevention: ['limpieza', 'fluorización', 'sellantes', 'profilaxis', 'prevención']
    };
    return keywordMap[reason] || [];
  };

  const getReasonLabel = (reason: string): string => {
    const labelMap: Record<string, string> = {
      pain: 'Ideal para dolor o molestias',
      checkup: 'Perfecto para chequeo general',
      aesthetic: 'Mejora tu sonrisa',
      prevention: 'Cuidado preventivo'
    };
    return labelMap[reason] || 'Recomendado para ti';
  };

  const checkBudgetMatch = (budget: string, price: number): { matches: boolean; reason: string } => {
    const budgetRanges: Record<string, [number, number]> = {
      low: [0, 50000],
      medium: [50000, 100000],
      high: [100000, Infinity],
      flexible: [0, Infinity]
    };

    const [min, max] = budgetRanges[budget] || [0, Infinity];
    const matches = price >= min && price <= max;

    return {
      matches,
      reason: matches ? 'Dentro de tu presupuesto' : ''
    };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="service-quiz-results service-quiz-results--loading">
        <IonSpinner name="crescent" color="primary" />
        <p>Buscando los mejores servicios para ti...</p>
      </div>
    );
  }

  return (
    <div className="service-quiz-results">
      {/* Header */}
      <motion.div
        className="service-quiz-results__header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="service-quiz-results__icon">
          <IonIcon icon={sparklesOutline} />
        </div>
        <h1 className="service-quiz-results__title">
          Servicios perfectos para ti
        </h1>
        <p className="service-quiz-results__subtitle">
          Basado en tus respuestas, estos son los servicios que mejor se ajustan a tus necesidades
        </p>
      </motion.div>

      {/* Services grid */}
      <div className="service-quiz-results__grid">
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            className="service-result-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Match badge */}
            <div className="service-result-card__badge">
              <span className="service-result-card__match-score">
                {service.matchScore}% match
              </span>
            </div>

            {/* Content */}
            <div className="service-result-card__content">
              <h3 className="service-result-card__title">{service.name}</h3>
              <p className="service-result-card__description">
                {service.description}
              </p>

              {/* Match reasons */}
              {service.matchReasons.length > 0 && (
                <div className="service-result-card__reasons">
                  {service.matchReasons.slice(0, 2).map((reason, idx) => (
                    <span key={idx} className="service-result-card__reason">
                      ✓ {reason}
                    </span>
                  ))}
                </div>
              )}

              {/* Info */}
              <div className="service-result-card__info">
                <div className="service-result-card__info-item">
                  <span className="service-result-card__info-label">Precio:</span>
                  <span className="service-result-card__info-value">
                    {formatPrice(service.price)}
                  </span>
                </div>
                <div className="service-result-card__info-item">
                  <span className="service-result-card__info-label">Duración:</span>
                  <span className="service-result-card__info-value">
                    {service.duration} min
                  </span>
                </div>
                <div className="service-result-card__info-item">
                  <span className="service-result-card__info-label">Rating:</span>
                  <span className="service-result-card__info-value">
                    ⭐ {service.avg_rating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="service-result-card__actions">
              <IonButton
                expand="block"
                onClick={() => history.push(`/tabs/servicio/${service.id}`)}
              >
                Ver detalles
              </IonButton>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer actions */}
      <div className="service-quiz-results__footer">
        <IonButton
          fill="outline"
          onClick={() => history.push('/tabs/servicios')}
        >
          <IonIcon icon={searchOutline} slot="start" />
          Ver todos los servicios
        </IonButton>
      </div>
    </div>
  );
};

export default ServiceQuizResults;
