import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { usePageTransition } from '../shared/context/PageTransitionContext';

interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const { direction } = usePageTransition();

  // Calcular la posición inicial basada en la dirección
  const getInitialX = () => {
    if (direction === 'left') return -100; // Viene desde la izquierda
    if (direction === 'right') return 100; // Viene desde la derecha
    return 0; // Sin dirección, fade simple
  };

  const getExitX = () => {
    if (direction === 'left') return 100; // Sale hacia la derecha
    if (direction === 'right') return -100; // Sale hacia la izquierda
    return 0;
  };

  return (
    <motion.div
      initial={{
        opacity: direction === 'none' ? 0 : 1,
        x: `${getInitialX()}%`,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      exit={{
        opacity: direction === 'none' ? 0 : 1,
        x: `${getExitX()}%`,
      }}
      transition={{
        type: 'tween',
        ease: [0.4, 0, 0.2, 1], // cubic-bezier suave
        duration: 0.3,
      }}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
