import React, { useEffect, useState, useCallback } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonSpinner,
  IonText,
  IonRadioGroup,
  IonRadio,
  IonButtons,
  IonSearchbar,
} from '@ionic/react';
import {
  locationOutline,
  schoolOutline,
  navigateOutline,
  closeOutline,
  checkmarkCircle,
} from 'ionicons/icons';
import { api } from '../api/ApiClient';
import { useGeolocation } from '../hooks/useGeolocation';
import './UniversitySelector.css';

export interface University {
  id: string;
  name: string;
  short_name?: string;
  address?: string;
  city: string;
  latitude: number;
  longitude: number;
  distance?: number; // en km
}

interface UniversitySelectorProps {
  isOpen: boolean;
  onDismiss: () => void;
  onSelect: (university: University) => void;
  selectedUniversityId?: string | null;
}

const UniversitySelector: React.FC<UniversitySelectorProps> = ({
  isOpen,
  onDismiss,
  onSelect,
  selectedUniversityId,
}) => {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selected, setSelected] = useState<string | null>(selectedUniversityId || null);

  const {
    latitude,
    longitude,
    loading: geoLoading,
    error: geoError,
    permissionDenied,
    hasLocation,
    requestLocation,
  } = useGeolocation();

  // Cargar universidades cercanas cuando tenemos ubicación
  const loadNearbyUniversities = useCallback(async () => {
    if (!latitude || !longitude) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.get<University[]>('/api/universities/nearby', {
        params: { lat: latitude, lng: longitude, limit: 15 },
      });
      setUniversities(res.data);
    } catch (e: any) {
      setError('No se pudieron cargar las universidades cercanas.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude]);

  // Cargar todas las universidades (fallback)
  const loadAllUniversities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get<University[]>('/api/universities');
      setUniversities(res.data);
    } catch (e: any) {
      setError('No se pudieron cargar las universidades.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (hasLocation) {
        loadNearbyUniversities();
      } else {
        loadAllUniversities();
      }
    }
  }, [isOpen, hasLocation, loadNearbyUniversities, loadAllUniversities]);

  useEffect(() => {
    if (hasLocation) {
      loadNearbyUniversities();
    }
  }, [hasLocation, loadNearbyUniversities]);

  const filteredUniversities = universities.filter((uni) =>
    uni.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (uni.short_name && uni.short_name.toLowerCase().includes(searchText.toLowerCase())) ||
    uni.city.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleConfirm = () => {
    const uni = universities.find((u) => u.id === selected);
    if (uni) {
      onSelect(uni);
      onDismiss();
    }
  };

  const formatDistance = (distance?: number) => {
    if (distance === undefined) return null;
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss} className="university-selector-modal">
      <IonHeader className="university-modal-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onDismiss} color="medium">
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Seleccionar Universidad</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding university-modal-content">
        {/* Solicitar ubicación */}
        {!hasLocation && !geoLoading && (
          <div className="university-location-card">
            <div className="university-location-card-inner">
              <IonIcon icon={locationOutline} className="university-location-icon" />
              <div>
                <h3 className="university-location-title">
                  Encuentra la universidad más cercana
                </h3>
                <p className="university-location-subtitle">
                  Permite el acceso a tu ubicación para ordenar por distancia
                </p>
              </div>
            </div>
            <IonButton
              expand="block"
              fill="solid"
              color="light"
              onClick={requestLocation}
              disabled={geoLoading}
            >
              <IonIcon icon={navigateOutline} slot="start" />
              {permissionDenied ? 'Reintentar ubicación' : 'Usar mi ubicación'}
            </IonButton>
            {geoError && (
              <IonText color="warning" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                {geoError}
              </IonText>
            )}
          </div>
        )}

        {geoLoading && (
          <div className="university-loading">
            <IonSpinner color="primary" className="university-loading-spinner" />
            <p className="university-loading-text">Obteniendo tu ubicación...</p>
          </div>
        )}

        {hasLocation && (
          <div className="university-location-success">
            <IonIcon icon={checkmarkCircle} className="university-location-success-icon" />
            <span className="university-location-success-text">
              Universidades ordenadas por cercanía
            </span>
          </div>
        )}

        {/* Búsqueda */}
        <IonSearchbar
          value={searchText}
          placeholder="Buscar universidad..."
          onIonInput={(e: any) => setSearchText(e.detail.value || '')}
          className="university-searchbar"
        />

        {/* Lista de universidades */}
        {loading && (
          <div className="university-loading">
            <IonSpinner color="primary" className="university-loading-spinner" />
            <p className="university-loading-text">Cargando universidades...</p>
          </div>
        )}

        {error && !loading && (
          <div className="university-empty">
            <IonText color="danger">{error}</IonText>
            <IonButton fill="clear" onClick={loadAllUniversities} style={{ marginTop: 8 }}>
              Reintentar
            </IonButton>
          </div>
        )}

        {!loading && !error && (
          <IonRadioGroup value={selected} onIonChange={(e) => setSelected(e.detail.value)}>
            <IonList className="university-list">
              {filteredUniversities.map((uni, index) => (
                <IonItem key={uni.id} button onClick={() => setSelected(uni.id)}>
                  <IonIcon
                    icon={schoolOutline}
                    slot="start"
                    className={`university-item-icon ${index === 0 && hasLocation ? 'highlighted' : ''}`}
                  />
                  <IonLabel>
                    <h2 className={`university-item-name ${index === 0 && hasLocation ? 'highlighted' : ''}`}>
                      {uni.name}
                    </h2>
                    <p className="university-item-city">
                      {uni.city}
                      {uni.distance !== undefined && (
                        <span className="university-item-distance">
                          • {formatDistance(uni.distance)}
                        </span>
                      )}
                    </p>
                    {uni.address && (
                      <p className="university-item-address">{uni.address}</p>
                    )}
                  </IonLabel>
                  <IonRadio slot="end" value={uni.id} />
                </IonItem>
              ))}
            </IonList>
          </IonRadioGroup>
        )}

        {!loading && !error && filteredUniversities.length === 0 && (
          <div className="university-empty">
            <IonIcon icon={schoolOutline} className="university-empty-icon" />
            <p className="university-empty-text">
              {searchText
                ? 'No se encontraron universidades con ese nombre'
                : 'No hay universidades disponibles'}
            </p>
          </div>
        )}

        {/* Botón de confirmar fijo en la parte inferior */}
        <IonButton
          expand="block"
          className="university-confirm-btn"
          onClick={handleConfirm}
          disabled={!selected}
        >
          Comenzar a explorar
        </IonButton>
      </IonContent>
    </IonModal>
  );
};

export default UniversitySelector;
