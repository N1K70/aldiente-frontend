import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

interface TransitionOrigin {
  x: number;
  y: number;
}

type NavigationDirection = 'left' | 'right' | 'none';

interface PageTransitionContextType {
  origin: TransitionOrigin | null;
  lastPointer: TransitionOrigin | null;
  direction: NavigationDirection;
  setOrigin: (origin: TransitionOrigin | null) => void;
  captureOrigin: (element: HTMLElement | null) => void;
  setDirection: (direction: NavigationDirection) => void;
}

const PageTransitionContext = createContext<PageTransitionContextType | undefined>(undefined);

export const PageTransitionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [origin, setOrigin] = useState<TransitionOrigin | null>(null);
  const [lastPointer, setLastPointer] = useState<TransitionOrigin | null>(null);
  const [direction, setDirection] = useState<NavigationDirection>('none');

  const captureOrigin = useCallback((element: HTMLElement | null) => {
    if (element) {
      const rect = element.getBoundingClientRect();
      setOrigin({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
    } else {
      setOrigin(null);
    }
  }, []);

  // Registrar el último punto de interacción del usuario
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      setLastPointer({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  return (
    <PageTransitionContext.Provider value={{ origin, lastPointer, direction, setOrigin, captureOrigin, setDirection }}>
      {children}
    </PageTransitionContext.Provider>
  );
};

export const usePageTransition = () => {
  const context = useContext(PageTransitionContext);
  if (!context) {
    throw new Error('usePageTransition must be used within PageTransitionProvider');
  }
  return context;
};
