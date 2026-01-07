import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonButton,
  IonText,
  IonChip,
  IonSpinner,
} from '@ionic/react';
import {
  searchOutline,
  colorWandOutline,
  leafOutline,
  sparklesOutline,
  heartOutline,
  timeOutline,
  peopleOutline,
  starOutline,
  locationOutline,
  schoolOutline,
  closeCircle,
  navigateOutline,
} from 'ionicons/icons';
import { motion } from 'framer-motion';
import { useHistory, useLocation } from 'react-router-dom';
import { api } from '../../shared/api/ApiClient';
import UniversitySelector, { University } from '../../shared/components/UniversitySelector';
import { useGeolocation } from '../../shared/hooks/useGeolocation';
import { usePatientOnboarding } from '../onboarding/PatientOnboarding';

interface PublicServiceItem {
  id: string;
  name: string;
  category: string;
  categoria_general?: string;
  categoria_tecnica?: string;
  description?: string;
  price?: number;
  duration?: string;
  providers?: number; // cuántos estudiantes lo ofrecen
  rating?: number;
  reviews?: number;
  student_university?: string;
  student_full_name?: string;
}

const ExploreServicesPage: React.FC = () => {
  const [q, setQ] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const history = useHistory();
  const location = useLocation();

  // Obtener universidad del onboarding
  const { selectedUniversity: savedUniversity, updateUniversity } = usePatientOnboarding();

  // Estado para filtro de universidad
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [showUniversitySelector, setShowUniversitySelector] = useState(false);

  // Cargar universidad guardada del onboarding al iniciar
  useEffect(() => {
    if (savedUniversity && !selectedUniversity) {
      setSelectedUniversity(savedUniversity);
    }
  }, [savedUniversity]);

  // Actualizar universidad guardada cuando cambia
  const handleUniversitySelect = useCallback((uni: University) => {
    setSelectedUniversity(uni);
    updateUniversity(uni);
  }, [updateUniversity]);

  const {
    latitude,
    longitude,
    loading: geoLoading,
    hasLocation,
    requestLocation,
  } = useGeolocation();

  const categories = [
    { title: 'Blanqueamiento', icon: colorWandOutline, color: '#a11b21', id: 'blanqueamiento' },
    { title: 'Limpieza', icon: leafOutline, color: '#e04a4f', id: 'limpieza' },
    { title: 'Ortodoncia', icon: sparklesOutline, color: '#b70a11', id: 'ortodoncia' },
    { title: 'Estética', icon: heartOutline, color: '#d4373f', id: 'estetica' },
  ];
  const [items, setItems] = useState<PublicServiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar servicios filtrados por universidad
  const loadServices = useCallback(async () => {
    if (!selectedUniversity) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Usar endpoint de servicios por universidad
      const res = await api.get(`/api/universities/${selectedUniversity.id}/services`);
      const raw: any = res.data;
      const rows: any[] = raw?.services || [];
      
      const mapped: PublicServiceItem[] = rows.map((r: any) => ({
        id: String(r.id),
        name: r.service_name || r.name || 'Servicio',
        category: r.categoria_general || '',
        categoria_general: r.categoria_general || '',
        categoria_tecnica: r.categoria_tecnica || '',
        description: r.description || '',
        price: r.price ? Number(r.price) : undefined,
        duration: r.duration ? `${r.duration} min` : (r.estimated_duration ? `${r.estimated_duration} min` : undefined),
        providers: 1,
        student_university: r.student_university,
        student_full_name: r.student_full_name,
      }));
      
      setItems(mapped);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudieron cargar los servicios');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [selectedUniversity]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Lee la categoría desde la query (?category=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = (params.get('category') || '').trim().toLowerCase();
    setCategoryFilter(cat);
  }, [location.search]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    let base = items;
    if (t) {
      base = base.filter((it: PublicServiceItem) =>
        it.name.toLowerCase().includes(t) ||
        it.category.toLowerCase().includes(t) ||
        (it.description || '').toLowerCase().includes(t)
      );
    }
    if (categoryFilter) {
      base = base.filter((it: PublicServiceItem) => it.category.toLowerCase() === categoryFilter);
    }
    return base;
  }, [q, items, categoryFilter]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Servicios</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* Hero / búsqueda (misma estética que Home) */}
        <motion.div
          className="home-hero"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="hero-title">Explora servicios</h2>
          <p className="hero-sub">Encuentra tratamientos ofrecidos por estudiantes verificados.</p>

          {/* Selector de Universidad - OBLIGATORIO */}
          <div
            style={{
              background: selectedUniversity 
                ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'
                : 'linear-gradient(135deg, #a11b21 0%, #d4373f 100%)',
              borderRadius: 12,
              padding: 16,
              marginTop: 16,
              marginBottom: 8,
            }}
          >
            {!selectedUniversity ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, color: 'white' }}>
                  <IonIcon icon={locationOutline} style={{ fontSize: 28 }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                      Selecciona una universidad
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.9 }}>
                      Para ver servicios disponibles, primero elige la universidad más cercana
                    </p>
                  </div>
                </div>
                <IonButton
                  expand="block"
                  fill="solid"
                  color="light"
                  onClick={() => setShowUniversitySelector(true)}
                >
                  <IonIcon icon={navigateOutline} slot="start" />
                  Buscar universidad cercana
                </IonButton>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <IonIcon icon={schoolOutline} style={{ fontSize: 24, color: '#2e7d32' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1b5e20' }}>
                      {selectedUniversity.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: '#388e3c' }}>
                      {selectedUniversity.city}
                      {selectedUniversity.distance !== undefined && (
                        <span> • {selectedUniversity.distance < 1 
                          ? `${Math.round(selectedUniversity.distance * 1000)} m` 
                          : `${selectedUniversity.distance.toFixed(1)} km`}</span>
                      )}
                    </p>
                  </div>
                </div>
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={() => setShowUniversitySelector(true)}
                  style={{ color: '#2e7d32' }}
                >
                  Cambiar
                </IonButton>
              </div>
            )}
          </div>

          {/* Búsqueda - solo visible si hay universidad seleccionada */}
          {selectedUniversity && (
            <div style={{ marginTop: 12 }}>
              <IonSearchbar
                value={q}
                placeholder="Buscar (ej. limpieza, blanqueamiento)"
                onIonInput={(e: any) => setQ(e.detail.value)}
                inputmode="search"
              />
            </div>
          )}

          {categoryFilter && selectedUniversity && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <IonText color="primary">Filtro activo: <b>{categoryFilter}</b></IonText>
              <IonButton size="small" fill="clear" onClick={() => { setCategoryFilter(''); history.replace('/tabs/servicios'); }}>
                Quitar filtro
              </IonButton>
            </div>
          )}

          {/* Categorías destacadas */}
          <IonText color="medium" style={{ display: 'block', marginTop: 18, marginBottom: 8 }}>Categorías</IonText>
          <IonGrid>
            <IonRow>
              {categories.map((c, idx) => (
                <IonCol size="6" key={c.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: 0.05 * idx }}
                  >
                    <IonCard className="home-card" onClick={() => history.push(`/tabs/servicios?category=${encodeURIComponent(c.id)}`)}>
                      <IonCardHeader>
                        <IonCardTitle style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <IonIcon icon={c.icon} style={{ color: c.color }} /> {c.title}
                        </IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent>
                        <span className="category-badge">
                          <IonIcon icon={searchOutline} /> Ver opciones
                        </span>
                      </IonCardContent>
                    </IonCard>
                  </motion.div>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </motion.div>

        {/* Lista de servicios - solo si hay universidad seleccionada */}
        {selectedUniversity && (
          <>
            <IonText color="medium" style={{ display: 'block', marginTop: 18, marginBottom: 8 }}>
              Servicios en {selectedUniversity.short_name || selectedUniversity.name}
            </IonText>
            
            {loading && (
              <div className="ion-text-center" style={{ marginTop: 24, padding: 20 }}>
                <IonSpinner color="primary" />
                <p style={{ marginTop: 12, color: '#666' }}>Cargando servicios...</p>
              </div>
            )}
            
            {error && !loading && (
              <div className="ion-text-center" style={{ marginTop: 12 }}>
                <IonText color="danger">{error}</IonText>
              </div>
            )}
            
            {filtered.map((s: PublicServiceItem) => (
              <IonCard key={s.id} className="service-card">
                <IonCardHeader>
                  <IonCardTitle style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span>{s.name}</span>
                    {typeof s.price === 'number' && (
                      <span className="price-chip">{s.price > 0 ? `$${s.price.toLocaleString('es-CL')}` : 'Gratis'}</span>
                    )}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {s.description && (
                    <p style={{ marginTop: 0, marginBottom: 10, color: '#475569' }}>{s.description}</p>
                  )}

                  {/* Info del estudiante */}
                  {s.student_full_name && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      marginBottom: 10,
                      padding: '8px 12px',
                      background: '#f8fafc',
                      borderRadius: 8,
                    }}>
                      <IonIcon icon={schoolOutline} style={{ color: '#a11b21' }} />
                      <span style={{ fontSize: 13, color: '#475569' }}>
                        <strong>{s.student_full_name}</strong>
                      </span>
                    </div>
                  )}

                  <div className="service-meta">
                    <div className="meta-item">
                      <IonIcon icon={timeOutline} />
                      <span>{s.duration || 'N/E'}</span>
                    </div>
                    <div className="meta-item">
                      <IonIcon icon={starOutline} style={{ color: '#f59e0b' }} />
                      <span>{(s.rating ?? 0).toFixed(1)} ({s.reviews ?? 0})</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                    <IonButton 
                      className="primary-gradient-btn" 
                      expand="block" 
                      onClick={() => history.push(`/tabs/servicio/${s.id}`, { 
                        service: { 
                          id: s.id, 
                          name: s.name, 
                          category: s.category, 
                          description: s.description,
                          student_name: s.student_full_name,
                          university: selectedUniversity.name,
                        } 
                      })}
                    >
                      Reservar
                    </IonButton>
                    <IonButton 
                      fill="outline" 
                      color="primary" 
                      expand="block" 
                      onClick={() => history.push(`/tabs/servicio/${s.id}`, { 
                        service: { 
                          id: s.id, 
                          name: s.name, 
                          category: s.category, 
                          description: s.description,
                          student_name: s.student_full_name,
                          university: selectedUniversity.name,
                        } 
                      })}
                    >
                      Ver detalles
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}

            {filtered.length === 0 && !loading && (
              <div className="ion-text-center" style={{ marginTop: 24, padding: 20 }}>
                <IonIcon icon={schoolOutline} style={{ fontSize: 48, color: '#ccc' }} />
                <IonText style={{ display: 'block', marginTop: 12 }}>
                  {q.trim()
                    ? `No se encontraron servicios para "${q.trim()}"`
                    : 'No hay servicios disponibles en esta universidad'}
                </IonText>
                <p style={{ color: '#888', fontSize: 13, marginTop: 8 }}>
                  Los estudiantes aún no han publicado servicios
                </p>
              </div>
            )}
          </>
        )}

        {/* Mensaje cuando no hay universidad seleccionada */}
        {!selectedUniversity && (
          <div className="ion-text-center" style={{ marginTop: 40, padding: 20 }}>
            <IonIcon icon={locationOutline} style={{ fontSize: 64, color: '#ccc' }} />
            <h3 style={{ color: '#666', marginTop: 16 }}>Selecciona una universidad</h3>
            <p style={{ color: '#888', fontSize: 14 }}>
              Para ver los servicios disponibles, primero debes elegir la universidad donde deseas atenderte.
            </p>
            <IonButton
              style={{ marginTop: 16 }}
              onClick={() => setShowUniversitySelector(true)}
            >
              <IonIcon icon={navigateOutline} slot="start" />
              Buscar universidad
            </IonButton>
          </div>
        )}

        {/* Modal selector de universidad */}
        <UniversitySelector
          isOpen={showUniversitySelector}
          onDismiss={() => setShowUniversitySelector(false)}
          onSelect={handleUniversitySelect}
          selectedUniversityId={selectedUniversity?.id}
        />
      </IonContent>
    </IonPage>
  );
};

export default ExploreServicesPage;
