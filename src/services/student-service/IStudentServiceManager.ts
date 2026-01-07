import { IStudentService } from '../../models/studentService';

/**
 * Interfaz para la gestión de servicios ofrecidos por estudiantes.
 */
export interface IStudentServiceManager {
  /**
   * Obtiene todos los servicios ofrecidos por un estudiante específico.
   * @param studentId El ID del estudiante.
   * @returns Una promesa que resuelve a un array de IStudentService.
   */
  getServicesByStudent(studentId: string): Promise<IStudentService[]>;

  /**
   * Obtiene un servicio específico por su ID.
   * @param studentId El ID del estudiante (para asegurar la pertenencia).
   * @param serviceId El ID del servicio.
   * @returns Una promesa que resuelve al IStudentService o null si no se encuentra.
   */
  getServiceById(studentId: string, serviceId: string): Promise<IStudentService | null>;

  /**
   * Añade un nuevo servicio para un estudiante.
   * @param studentId El ID del estudiante.
   * @param serviceData Los datos del servicio a añadir (sin incluir 'id', 'studentId', 'createdAt', 'updatedAt').
   * @returns Una promesa que resuelve al IStudentService recién creado.
   */
  addService(studentId: string, serviceData: Omit<IStudentService, 'id' | 'studentId' | 'createdAt' | 'updatedAt'>): Promise<IStudentService>;

  /**
   * Actualiza un servicio existente.
   * @param studentId El ID del estudiante.
   * @param serviceId El ID del servicio a actualizar.
   * @param serviceData Un objeto con los campos del servicio a actualizar.
   * @returns Una promesa que resuelve al IStudentService actualizado o null si no se encontró.
   */
  updateService(studentId: string, serviceId: string, serviceData: Partial<Omit<IStudentService, 'id' | 'studentId' | 'createdAt' | 'updatedAt'>>): Promise<IStudentService | null>;

  /**
   * Elimina un servicio.
   * @param studentId El ID del estudiante.
   * @param serviceId El ID del servicio a eliminar.
   * @returns Una promesa que resuelve cuando la eliminación se completa.
   */
  deleteService(studentId: string, serviceId: string): Promise<void>;

  /**
   * Obtiene todos los servicios de todos los estudiantes.
   * @returns Una promesa que resuelve a un array con todos los IStudentService.
   */
  getAllServices(): Promise<IStudentService[]>;

}
