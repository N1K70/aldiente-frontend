import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSearchbar,
  IonChip,
  IonLabel,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonList,
  IonItem,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonToast,
  IonButtons,
  IonBackButton,
  IonLoading,
  IonGrid,
  IonRow,
  IonCol,
  IonAvatar
} from '@ionic/react';
import { 
  searchOutline, 
  filterOutline, 
  starOutline, 
  schoolOutline, 
  cashOutline, 
  timeOutline,
  refreshCircleOutline,
  gridOutline,
  sparklesOutline,
  resizeOutline,
  sunnyOutline,
  constructOutline,
  heartOutline
} from 'ionicons/icons';
import { IStudentService } from '../models/studentService';
import { MockUser } from '../types/user';
import { useHistory } from 'react-router-dom';
import './Services.css';



interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
}

const Services: React.FC = () => {
  const history = useHistory();
  const [services, setServices] = useState<IStudentService[]>([]);
  const [filteredServices, setFilteredServices] = useState<IStudentService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Filtros
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Categorías de servicios dentales
  const categories: ServiceCategory[] = [
    { id: 'all', name: 'Todos', icon: 'grid-outline' },
    { id: 'limpieza', name: 'Limpieza', icon: 'sparkles-outline' },
    { id: 'ortodoncia', name: 'Ortodoncia', icon: 'resize-outline' },
    { id: 'blanqueamiento', name: 'Blanqueamiento', icon: 'sunny-outline' },
    { id: 'implantes', name: 'Implantes', icon: 'construct-outline' },
    { id: 'endodoncia', name: 'Endodoncia', icon: 'heart-outline' }
  ];

  const loadAllServices = async () => {
    setLoading(true);
    try {
      // Simulación de servicios para demostración
      const mockServices: IStudentService[] = [
        {
          id: '1',
          serviceName: 'Limpieza Dental Profesional',
          category: 'limpieza',
          description: 'Limpieza completa con eliminación de placa y sarro. Incluye pulido y aplicación de flúor.',
          price: 45.99,
          duration: '45 min',
          studentName: 'María González',
          studentUniversity: 'Universidad Dental Chile',
          studentId: 'student1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          serviceName: 'Ortodoncia Invisalign',
          category: 'ortodoncia',
          description: 'Tratamiento con alineadores transparentes personalizados. Seguimiento mensual incluido.',
          price: 2450.00,
          duration: '18 meses',
          studentName: 'Carlos Rodríguez',
          studentUniversity: 'Universidad Mayor',
          studentId: 'student2',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          serviceName: 'Blanqueamiento Dental',
          category: 'blanqueamiento',
          description: 'Tratamiento profesional de blanqueamiento con lámpara LED. Resultados visibles en 1 sesión.',
          price: 120.00,
          duration: '60 min',
          studentName: 'Ana Pérez',
          studentUniversity: 'Universidad de Chile',
          studentId: 'student3',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '4',
          serviceName: 'Implante Dental',
          category: 'implantes',
          description: 'Colocación de implante de titanio con corona cerámica. Incluye estudio radiológico.',
          price: 850.00,
          duration: '3 meses',
          studentName: 'Diego Silva',
          studentUniversity: 'Universidad Austral',
          studentId: 'student4',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      setServices(mockServices);
      setFilteredServices(mockServices);
    } catch (error) {
      console.error('Error al cargar todos los servicios:', error);
      // En caso de error, mostrar servicios de ejemplo
      const mockServices: IStudentService[] = [
        {
          id: '1',
          serviceName: 'Limpieza Dental Profesional',
          category: 'limpieza',
          description: 'Limpieza completa con eliminación de placa y sarro. Incluye pulido y aplicación de flúor.',
          price: 45.99,
          duration: '45 min',
          studentName: 'María González',
          studentUniversity: 'Universidad Dental Chile',
          studentId: 'student1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      setServices(mockServices);
      setFilteredServices(mockServices);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar servicios según búsqueda y categoría
  useEffect(() => {
    let result = services;
    
    // Filtrar por búsqueda
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(service => 
        service.serviceName.toLowerCase().includes(searchLower) ||
        service.description.toLowerCase().includes(searchLower) ||
        (service.studentName && service.studentName.toLowerCase().includes(searchLower))
      );
    }
    
    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      result = result.filter(service => service.category === selectedCategory);
    }
    
    setFilteredServices(result);
  }, [searchText, selectedCategory, services]);

  useEffect(() => {
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      try {
        loadAllServices();
      } catch (e) {
        console.error("Error parsing mockUser from localStorage on Services page", e);
        localStorage.removeItem('mockUser');
        history.replace('/login');
      }
    } else {
      history.replace('/login');
    }

    // Listener para cambios en localStorage (ej. logout)
    const handleStorageChange = () => {
      const updatedStoredUser = localStorage.getItem('mockUser');
      if (!updatedStoredUser) {
        history.replace('/login');
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [history]);

  const doRefresh = async (event: CustomEvent) => {
    await loadAllServices();
    event.detail.complete();
  };

  // Función para reservar un servicio
  const handleBookService = (serviceId: string) => {
    console.log('Reservando servicio:', serviceId);
    // Navegar a la página de reserva de citas
    history.push(`/services/book/${serviceId}`);
  };

  return (
    <IonPage className="services-page">
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Explorar Servicios</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen className="services-content">
        <IonRefresher slot="fixed" onIonRefresh={doRefresh}>
          <IonRefresherContent pullingIcon={refreshCircleOutline}></IonRefresherContent>
        </IonRefresher>
        
        {loading && <IonLoading isOpen={true} message="Buscando servicios disponibles..." />}

        {/* Barra de búsqueda */}
        <div className="search-container ion-padding">
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value || '')}
            placeholder="Buscar servicios, profesionales..."
            className="custom-searchbar"
            searchIcon={searchOutline}
          />
        </div>

        {/* Categorías */}
        <div className="categories-container ion-padding-horizontal">
          <h3 className="section-title">Categorías</h3>
          <IonGrid className="categories-grid">
            <IonRow>
              {categories.map((category) => (
                <IonCol size="4" key={category.id}>
                  <IonChip 
                    className={`category-chip ${selectedCategory === category.id ? 'selected' : ''}`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <IonAvatar>
                      <IonIcon icon={category.icon} />
                    </IonAvatar>
                    <span>{category.name}</span>
                  </IonChip>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </div>

        {/* Servicios disponibles */}
        <div className="services-container ion-padding">
          <div className="section-header">
            <h3 className="section-title">Servicios Disponibles</h3>
            <IonButton fill="clear" size="small" className="filter-button">
              <IonIcon icon={filterOutline} slot="start" />
              Filtrar
            </IonButton>
          </div>

          {filteredServices.length === 0 && !loading && (
            <div className="empty-services-message ion-text-center ion-padding">
              <IonText>
                <h2>No hay servicios disponibles</h2>
                <p>{searchText ? 'No se encontraron resultados para tu búsqueda' : 'Vuelve a intentarlo más tarde'}</p>
              </IonText>
            </div>
          )}

          <IonList className="services-list">
            {filteredServices.map(service => (
              <IonCard key={service.id} className="service-card modern-card">
                <IonCardHeader className="service-card-header">
                  <div className="service-header-content">
                    <IonCardTitle className="service-title">{service.serviceName}</IonCardTitle>
                    <IonCardSubtitle className="service-category">
                      {categories.find(cat => cat.id === service.category)?.name || service.category}
                    </IonCardSubtitle>
                  </div>
                  <div className="service-rating">
                    <IonIcon icon={starOutline} className="rating-icon" />
                    <span className="rating-value">N/A</span>
                    <span className="rating-count">(0 reseñas)</span>
                  </div>
                </IonCardHeader>
                
                <IonCardContent className="service-card-content">
                  <p className="service-description">{service.description}</p>
                  
                  <div className="service-details">
                    <IonItem lines="none" className="detail-item">
                      <IonIcon icon={schoolOutline} slot="start" className="detail-icon student-icon" />
                      <IonLabel>
                        <h3 className="detail-title">Profesional</h3>
                        <p className="detail-value">{service.studentName}</p>
                        <p className="detail-subtitle">{service.studentUniversity}</p>
                      </IonLabel>
                    </IonItem>
                    
                    <IonItem lines="none" className="detail-item">
                      <IonIcon icon={cashOutline} slot="start" className="detail-icon price-icon" />
                      <IonLabel>
                        <h3 className="detail-title">Precio</h3>
                        <p className="detail-value price-value">{service.price ? `$${service.price.toFixed(2)}` : 'Precio no especificado'}</p>
                      </IonLabel>
                    </IonItem>
                    
                    <IonItem lines="none" className="detail-item">
                      <IonIcon icon={timeOutline} slot="start" className="detail-icon time-icon" />
                      <IonLabel>
                        <h3 className="detail-title">Duración</h3>
                        <p className="detail-value">{service.duration || 'No especificada'}</p>
                      </IonLabel>
                    </IonItem>
                  </div>
                  
                  <IonButton 
                    expand="block" 
                    className="book-button primary-button"
                    onClick={() => handleBookService(service.id)}
                  >
                    Reservar Servicio
                  </IonButton>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Services;
