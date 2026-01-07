export interface Service { 
  id: string;
  serviceName: string;
  studentName: string;
  university: string;
  description: string;
  icon?: string; // Opcional: para un icono específico del servicio
  image?: string; // Opcional: para una imagen del estudiante o servicio
  location?: string; // Opcional: si queremos simular ubicación
}

export const mockServices: Service[] = [
  {
    id: '1',
    serviceName: 'Limpieza Dental',
    studentName: 'Ana Pérez',
    university: 'Universidad Central',
    description: 'Limpieza profunda y pulido dental para eliminar placa y sarro.',
    icon: 'waterOutline', // Usaremos nombres de iconos de Ionicons
    location: 'Clínica Dental Universitaria A'
  },
  {
    id: '2',
    serviceName: 'Empaste Simple',
    studentName: 'Carlos López',
    university: 'Universidad de la Salud',
    description: 'Restauración de caries pequeñas con resina compuesta.',
    icon: 'colorFillOutline',
    location: 'Consultorio Dental Estudiantil B'
  },
  {
    id: '3',
    serviceName: 'Blanqueamiento Dental',
    studentName: 'Laura Gómez',
    university: 'Universidad Central',
    description: 'Tratamiento para aclarar el tono de los dientes.',
    icon: 'brushOutline',
    location: 'Clínica Estética Dental C'
  },
  {
    id: '4',
    serviceName: 'Extracción Simple',
    studentName: 'Juan Rodríguez',
    university: 'Universidad de la Salud',
    description: 'Extracción de dientes con indicación simple, sin cirugía.',
    icon: 'flaskOutline',
    location: 'Clínica Dental Universitaria A'
  },
  {
    id: '5',
    serviceName: 'Revisión y Diagnóstico',
    studentName: 'Sofía Martínez',
    university: 'Universidad Central',
    description: 'Examen bucal completo para diagnóstico y plan de tratamiento.',
    icon: 'pulseOutline',
    location: 'Consultorio Dental Estudiantil B'
  },
  {
    id: '6',
    serviceName: 'Selladores de Fisuras',
    studentName: 'Miguel Ángel Torres',
    university: 'Universidad de Odontología Avanzada',
    description: 'Aplicación de selladores para prevenir caries en molares.',
    icon: 'medkitOutline', 
    location: 'Clínica Pediátrica Dental D'
  },
  {
    id: '7',
    serviceName: 'Tratamiento de Encías (Fase Inicial)',
    studentName: 'Valentina Rojas',
    university: 'Universidad Central',
    description: 'Tratamiento periodontal inicial para gingivitis.',
    icon: 'colorPaletteOutline', 
    location: 'Clínica Dental Universitaria A'
  }
];
