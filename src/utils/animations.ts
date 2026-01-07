import { Variants } from 'framer-motion';

// Configuración de easing moderna
export const modernEasing = [0.4, 0, 0.2, 1]; // cubic-bezier

export const springConfig = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 20
};

// Fade in con movimiento sutil
export const fadeInUp: Variants = {
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
      ease: modernEasing
    }
  },
  exit: { 
    opacity: 0, 
    y: -24,
    scale: 0.96,
    transition: {
      duration: 0.3,
      ease: modernEasing
    }
  }
};

// Fade in simple
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

// Scale in suave
export const scaleIn: Variants = {
  initial: { 
    opacity: 0, 
    scale: 0.92
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.4,
      ease: modernEasing
    }
  }
};

// Slide in desde la derecha
export const slideInRight: Variants = {
  initial: { 
    opacity: 0, 
    x: 60
  },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.5,
      ease: modernEasing
    }
  }
};

// Stagger para listas
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

// Item de lista con efecto
export const listItem: Variants = {
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
      ease: modernEasing
    }
  }
};

// Hover para tarjetas
export const cardHover = {
  rest: { 
    scale: 1,
    y: 0
  },
  hover: { 
    scale: 1.02,
    y: -8,
    transition: {
      duration: 0.3,
      ease: modernEasing
    }
  },
  tap: { 
    scale: 0.98,
    y: 0
  }
};

// Animación de entrada de página
export const pageTransition: Variants = {
  initial: { 
    opacity: 0,
    y: 20
  },
  animate: { 
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: modernEasing,
      when: 'beforeChildren',
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: modernEasing
    }
  }
};

// Configuraciones de transición
export const springTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30
};

export const smoothTransition = {
  duration: 0.3,
  ease: modernEasing
};
