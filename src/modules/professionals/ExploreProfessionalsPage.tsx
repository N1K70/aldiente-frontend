import React, { useEffect, useMemo, useState } from 'react';
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
  IonImg,
  IonIcon,
  IonText,
  IonSelect,
  IonSelectOption,
  IonSkeletonText,
  IonChip,
} from '@ionic/react';
import { peopleOutline, starOutline, searchOutline } from 'ionicons/icons';
import { motion } from 'framer-motion';
import { useHistory, useLocation } from 'react-router-dom';
import { api } from '../../shared/api/ApiClient';

export interface PublicProfessional {
  id: string;
  name: string;
  avatarUrl?: string;
  rating?: number;
  reviews?: number;
  servicesCount?: number;
  specialty?: string;
  serviceNames?: string[];
  categories?: string[];
}

type StudentServiceItem = {
  id: string;
  student_id: string;
  service_name?: string;
  category?: string;
  student_name?: string;
  student_university?: string;
  student_email?: string;
  [key: string]: any;
};

// Normalizador para búsquedas: minúsculas + remover acentos
const norm = (s?: string) => (s || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const ExploreProfessionalsPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [q, setQ] = useState('');
  const [serviceItems, setServiceItems] = useState<StudentServiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceFilter, setServiceFilter] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // Consumir catálogo de ofertas de estudiantes
        const res = await api.get('/api/student-services');
        if (!mounted) return;
        const raw: any = res.data as any;
        const data = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
        setServiceItems((data || []) as StudentServiceItem[]);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.response?.data?.message || 'No se pudieron cargar los servicios');
        setServiceItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Leer filtro desde query (?service=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sv = (params.get('service') || '').trim();
    if (sv) setServiceFilter(sv);
  }, [location.search]);

  const uniqueServiceNames = useMemo(() => {
    const set = new Set<string>();
    for (const it of serviceItems) {
      const n = (it.service_name || '').trim();
      if (n) set.add(n);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [serviceItems]);

  const pros = useMemo<PublicProfessional[]>(() => {
    const map = new Map<string, PublicProfessional & { _serviceSet: Set<string>, _catSet: Set<string> }>();
    for (const it of serviceItems) {
      const sid = String(it.student_id);
      if (!map.has(sid)) {
        // Intentar obtener nombre del estudiante de varias fuentes
        let name = it.student_name || (it as any).studentName || it.student_email;
        // Si no hay nombre, usar "Estudiante" sin mostrar el UUID
        if (!name) {
          name = 'Estudiante';
        }
        map.set(sid, {
          id: sid,
          name,
          avatarUrl: undefined,
          rating: undefined,
          reviews: undefined,
          servicesCount: 0,
          specialty: it.category || undefined,
          serviceNames: [],
          categories: [],
          _serviceSet: new Set<string>(),
          _catSet: new Set<string>(),
        });
      }
      const pro = map.get(sid)!;
      if (it.service_name) pro._serviceSet.add(it.service_name);
      if (it.category) pro._catSet.add(it.category);
    }
    // Convertir sets a arrays y completar contadores
    const list: PublicProfessional[] = [];
    for (const v of map.values()) {
      const serviceNames = Array.from(v._serviceSet);
      const categories = Array.from(v._catSet);
      list.push({
        id: v.id,
        name: v.name,
        avatarUrl: v.avatarUrl,
        rating: v.rating,
        reviews: v.reviews,
        servicesCount: serviceNames.length,
        specialty: categories[0],
        serviceNames,
        categories,
      });
    }
    return list;
  }, [serviceItems]);

  const filtered = useMemo(() => {
    const t = norm(q.trim());
    let list = pros;
    if (t) {
      list = list.filter((p: PublicProfessional) =>
        norm(p.name).includes(t) || norm(p.specialty || '').includes(t)
      );
    }
    if (serviceFilter) {
      const sfN = norm(serviceFilter);
      const tokens = sfN.split(/\s+/).filter(Boolean);
      list = list.filter((p) => {
        const names = (p.serviceNames || []).map(norm);
        const cats = (p.categories || []).map(norm);
        // Coincidencia directa completa
        const direct = names.some(n => n.includes(sfN)) || cats.some(c => c.includes(sfN));
        if (direct) return true;
        // Fallback: que al menos un token del filtro aparezca en algún nombre/categoría
        if (tokens.length === 0) return true;
        const anyToken = names.some(n => tokens.some(tok => n.includes(tok))) || cats.some(c => tokens.some(tok => c.includes(tok)));
        return anyToken;
      });
    }
    return list;
  }, [q, pros, serviceFilter]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profesionales</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <motion.div
          className="home-hero"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="hero-title">Encuentra profesionales</h2>
          <p className="hero-sub">Explora estudiantes verificados por especialidad y valoración.</p>

          <div style={{ marginTop: 12 }}>
            <IonSearchbar
              value={q}
              placeholder="Buscar por nombre o especialidad"
              onIonChange={(e: any) => setQ(e.detail.value)}
              inputmode="search"
            />
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <IonSelect
              interface="popover"
              value={serviceFilter}
              placeholder="Filtrar por servicio"
              onIonChange={(e: any) => setServiceFilter(e.detail.value)}
            >
              <IonSelectOption value="">Todos los servicios</IonSelectOption>
              {uniqueServiceNames.map((n) => (
                <IonSelectOption key={n} value={n}>{n}</IonSelectOption>
              ))}
            </IonSelect>
            {serviceFilter && (
              <IonChip color="medium" outline onClick={() => setServiceFilter('')}>Limpiar filtro</IonChip>
            )}
          </div>
        </motion.div>

        {error && (
          <IonText color="danger" style={{ display: 'block', marginTop: 18 }}>{error}</IonText>
        )}
        <IonText color="medium" style={{ display: 'block', marginTop: 18, marginBottom: 8 }}>Estudiantes</IonText>

        {loading ? (
          <IonGrid>
            <IonRow>
              {[...Array(6)].map((_, i) => (
                <IonCol size="6" key={i}>
                  <IonCard className="professional-card">
                    <IonCardHeader>
                      <IonCardTitle><IonSkeletonText animated style={{ width: '70%' }} /></IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <IonSkeletonText animated style={{ width: '90%', height: '12px' }} />
                      <div style={{ height: 8 }} />
                      <IonSkeletonText animated style={{ width: '60%', height: '12px' }} />
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        ) : (
          <IonGrid>
            <IonRow>
              {filtered.map((p: PublicProfessional, idx: number) => (
                <IonCol size="6" key={p.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: 0.05 * idx }}
                  >
                    <IonCard
                      className="professional-card"
                      onClick={() => history.push(`/tabs/profesionales/${p.id}`, { professional: p })}
                    >
                      <div className="pro-img-wrap">
                        <IonImg className="pro-img" src={p.avatarUrl} alt={p.name} />
                      </div>

                      <IonCardHeader>
                        <IonCardTitle className="pro-title">{p.name}</IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent>
                        <div className="pro-meta">
                          <span className="pro-chip">
                            <IonIcon icon={starOutline} style={{ color: '#f59e0b' }} /> { (p.rating ?? 0).toFixed(1) }
                          </span>
                          <span className="pro-chip muted">
                            <IonIcon icon={peopleOutline} /> { p.servicesCount ?? 0 } servicios
                          </span>
                        </div>
                        {p.specialty && (
                          <div className="pro-specialty">
                            <IonIcon icon={searchOutline} /> {p.specialty}
                          </div>
                        )}
                        {(p.serviceNames && p.serviceNames.length > 0) && (
                          <div className="pro-services" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                            {p.serviceNames.slice(0, 3).map((sn) => (
                              <IonChip key={sn} color="light" outline onClick={(e)=>{ e.stopPropagation(); setServiceFilter(sn); }}>
                                {sn}
                              </IonChip>
                            ))}
                            {p.serviceNames.length > 3 && (
                              <IonChip color="light" outline>+{p.serviceNames.length - 3}</IonChip>
                            )}
                          </div>
                        )}
                      </IonCardContent>
                    </IonCard>
                  </motion.div>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="ion-text-center" style={{ marginTop: 24 }}>
            <IonText color="medium">
              {serviceFilter
                ? `No hay profesionales que ofrezcan "${serviceFilter}"`
                : 'No se encontraron profesionales'}
            </IonText>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ExploreProfessionalsPage;
