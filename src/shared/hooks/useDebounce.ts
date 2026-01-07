import { useEffect, useState } from 'react';

/**
 * Hook para debounce de valores
 * Útil para optimizar búsquedas y reducir llamadas a API
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para throttle de funciones
 * Limita la frecuencia de ejecución de una función
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const [lastRun, setLastRun] = useState(Date.now());

  return ((...args: any[]) => {
    const now = Date.now();
    if (now - lastRun >= delay) {
      callback(...args);
      setLastRun(now);
    }
  }) as T;
}
