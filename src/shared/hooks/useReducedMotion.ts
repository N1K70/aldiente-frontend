import { useEffect, useState } from 'react';

/**
 * Hook para detectar si el usuario prefiere movimiento reducido
 * Útil para optimizar animaciones y mejorar rendimiento
 */
export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Soporte para navegadores modernos
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback para navegadores antiguos
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
};

/**
 * Hook para obtener variantes de animación optimizadas
 */
export const useOptimizedAnimation = () => {
  const prefersReducedMotion = useReducedMotion();

  return {
    prefersReducedMotion,
    // Variantes optimizadas que respetan las preferencias del usuario
    fadeIn: prefersReducedMotion
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : { initial: { opacity: 0 }, animate: { opacity: 1 } },
    slideUp: prefersReducedMotion
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
    scale: prefersReducedMotion
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } },
  };
};
