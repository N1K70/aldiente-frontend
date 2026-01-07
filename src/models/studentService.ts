/**
 * Interfaz que representa un servicio ofrecido por un estudiante.
 */
export interface IStudentService {
  id: string;             // Identificador único del servicio, generado automáticamente
  studentId: string;      // ID del estudiante que ofrece el servicio
  serviceName: string;    // Nombre del servicio (ej. "Limpieza Dental")
  description: string;    // Descripción detallada del servicio
  category: string;       // Categoría del servicio (ej. "Preventiva", "Restaurativa")
  price?: number;         // Precio del servicio (opcional)
  duration?: string;      // Duración estimada del servicio (ej. "30 minutos", "1 hora")
  availability?: string;  // Notas sobre disponibilidad (ej. "Lunes y Miércoles por la tarde")
  createdAt: Date;        // Fecha de creación del registro del servicio
  updatedAt: Date;        // Fecha de la última actualización del registro del servicio
  studentName?: string;   // Nombre del estudiante que ofrece el servicio
  studentUniversity?: string; // Universidad del estudiante
}
