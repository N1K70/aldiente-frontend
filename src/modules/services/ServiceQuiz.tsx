import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IonButton, IonIcon } from '@ionic/react';
import { arrowForwardOutline, arrowBackOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './ServiceQuiz.css';

interface QuizQuestion {
  id: string;
  question: string;
  type: 'single' | 'multiple';
  options: {
    value: string;
    label: string;
    icon?: string;
    keywords: string[]; // Para matching con servicios
  }[];
}

interface ServiceQuizProps {
  onComplete: (answers: Record<string, string[]>) => void;
}

const questions: QuizQuestion[] = [
  {
    id: 'reason',
    question: '¿Qué te trae hoy?',
    type: 'single',
    options: [
      {
        value: 'pain',
        label: 'Tengo dolor o molestia',
        icon: '😣',
        keywords: ['emergencia', 'dolor', 'extracción', 'endodoncia']
      },
      {
        value: 'checkup',
        label: 'Quiero un chequeo general',
        icon: '🦷',
        keywords: ['limpieza', 'revisión', 'diagnóstico', 'control']
      },
      {
        value: 'aesthetic',
        label: 'Mejorar mi sonrisa',
        icon: '✨',
        keywords: ['blanqueamiento', 'ortodoncia', 'estética', 'carillas']
      },
      {
        value: 'prevention',
        label: 'Prevención y cuidado',
        icon: '🛡️',
        keywords: ['limpieza', 'fluorización', 'sellantes', 'profilaxis']
      }
    ]
  },
  {
    id: 'urgency',
    question: '¿Qué tan urgente es?',
    type: 'single',
    options: [
      {
        value: 'urgent',
        label: 'Urgente (necesito atención pronto)',
        icon: '🚨',
        keywords: ['emergencia', 'urgencia']
      },
      {
        value: 'soon',
        label: 'En los próximos días',
        icon: '📅',
        keywords: []
      },
      {
        value: 'flexible',
        label: 'Puedo esperar, busco la mejor opción',
        icon: '⏰',
        keywords: []
      }
    ]
  },
  {
    id: 'budget',
    question: '¿Cuál es tu presupuesto aproximado?',
    type: 'single',
    options: [
      {
        value: 'low',
        label: 'Hasta $50.000',
        icon: '💵',
        keywords: []
      },
      {
        value: 'medium',
        label: '$50.000 - $100.000',
        icon: '💰',
        keywords: []
      },
      {
        value: 'high',
        label: 'Más de $100.000',
        icon: '💎',
        keywords: []
      },
      {
        value: 'flexible',
        label: 'Flexible según calidad',
        icon: '🎯',
        keywords: []
      }
    ]
  },
  {
    id: 'location',
    question: '¿Dónde prefieres atenderte?',
    type: 'single',
    options: [
      {
        value: 'near',
        label: 'Cerca de mi ubicación',
        icon: '📍',
        keywords: []
      },
      {
        value: 'campus',
        label: 'En el campus universitario',
        icon: '🏫',
        keywords: []
      },
      {
        value: 'any',
        label: 'No importa la ubicación',
        icon: '🌍',
        keywords: []
      }
    ]
  }
];

const ServiceQuiz: React.FC<ServiceQuizProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const history = useHistory();

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleAnswer = (questionId: string, value: string) => {
    const question = questions.find(q => q.id === questionId);
    
    if (question?.type === 'single') {
      setAnswers(prev => ({ ...prev, [questionId]: [value] }));
    } else {
      // Multiple choice
      setAnswers(prev => {
        const current = prev[questionId] || [];
        const newAnswers = current.includes(value)
          ? current.filter(v => v !== value)
          : [...current, value];
        return { ...prev, [questionId]: newAnswers };
      });
    }
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setDirection('forward');
      setCurrentStep(prev => prev + 1);
    } else {
      // Completar quiz
      onComplete(answers);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection('backward');
      setCurrentStep(prev => prev - 1);
    }
  };

  const isAnswered = answers[currentQuestion.id]?.length > 0;
  const isLastStep = currentStep === questions.length - 1;

  const slideVariants = {
    enter: (direction: 'forward' | 'backward') => ({
      x: direction === 'forward' ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: 'forward' | 'backward') => ({
      x: direction === 'forward' ? -300 : 300,
      opacity: 0
    })
  };

  return (
    <div className="service-quiz">
      {/* Intro message */}
      {currentStep === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="service-quiz__intro"
        >
          <h1 className="service-quiz__intro-title">
            🦷 Encuentra tu servicio ideal
          </h1>
          <p className="service-quiz__intro-text">
            Responde estas breves preguntas y te recomendaremos los mejores servicios para ti
          </p>
        </motion.div>
      )}

      {/* Progress bar */}
      <div className="service-quiz__progress-container">
        <motion.div
          className="service-quiz__progress-bar"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {/* Step indicator */}
      <div className="service-quiz__step-indicator">
        <span className="service-quiz__step-current">{currentStep + 1}</span>
        <span className="service-quiz__step-divider">/</span>
        <span className="service-quiz__step-total">{questions.length}</span>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="service-quiz__question-container"
        >
          <h2 className="service-quiz__question">{currentQuestion.question}</h2>

          <div className="service-quiz__options">
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.id]?.includes(option.value);
              
              return (
                <motion.button
                  key={option.value}
                  className={`service-quiz__option ${isSelected ? 'service-quiz__option--selected' : ''}`}
                  onClick={() => handleAnswer(currentQuestion.id, option.value)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {option.icon && (
                    <span className="service-quiz__option-icon">{option.icon}</span>
                  )}
                  <span className="service-quiz__option-label">{option.label}</span>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="service-quiz__option-check"
                    >
                      <IonIcon icon={checkmarkCircleOutline} />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="service-quiz__navigation">
        <IonButton
          fill="clear"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="service-quiz__nav-button"
        >
          <IonIcon icon={arrowBackOutline} slot="start" />
          Anterior
        </IonButton>

        <IonButton
          onClick={handleNext}
          disabled={!isAnswered}
          className="service-quiz__nav-button service-quiz__nav-button--primary"
        >
          {isLastStep ? 'Ver resultados' : 'Siguiente'}
          <IonIcon icon={arrowForwardOutline} slot="end" />
        </IonButton>
      </div>

      {/* Skip option */}
      <button
        className="service-quiz__skip"
        onClick={() => history.push('/tabs/servicios')}
      >
        Saltar y ver todos los servicios
      </button>
    </div>
  );
};

export default ServiceQuiz;
