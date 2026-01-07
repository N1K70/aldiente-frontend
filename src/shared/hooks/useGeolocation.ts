import { useState, useEffect, useCallback } from 'react';

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  permissionDenied: boolean;
}

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  autoRequest?: boolean;
}

const defaultOptions: UseGeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000, // 1 minuto de cache
  autoRequest: false,
};

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const opts = { ...defaultOptions, ...options };
  
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
    permissionDenied: false,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'La geolocalización no está soportada en este navegador.',
        loading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
          permissionDenied: false,
        });
      },
      (error) => {
        let errorMessage = 'Error al obtener la ubicación.';
        let permissionDenied = false;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de ubicación denegado. Por favor, habilita el acceso a tu ubicación.';
            permissionDenied = true;
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'La información de ubicación no está disponible.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Se agotó el tiempo de espera para obtener la ubicación.';
            break;
        }

        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false,
          permissionDenied,
        }));
      },
      {
        enableHighAccuracy: opts.enableHighAccuracy,
        timeout: opts.timeout,
        maximumAge: opts.maximumAge,
      }
    );
  }, [opts.enableHighAccuracy, opts.timeout, opts.maximumAge]);

  useEffect(() => {
    if (opts.autoRequest) {
      requestLocation();
    }
  }, [opts.autoRequest, requestLocation]);

  return {
    ...state,
    requestLocation,
    hasLocation: state.latitude !== null && state.longitude !== null,
  };
}

export default useGeolocation;
