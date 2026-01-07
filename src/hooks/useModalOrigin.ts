import { useRef, useCallback } from 'react';

/**
 * Hook para capturar el elemento de origen de un modal
 * Retorna una ref y un callback para asignar al botón que abre el modal
 */
export const useModalOrigin = () => {
  const originRef = useRef<HTMLElement | null>(null);

  const setOriginRef = useCallback((element: HTMLElement | null) => {
    originRef.current = element;
  }, []);

  return { originElement: originRef.current, setOriginRef };
};

export default useModalOrigin;
