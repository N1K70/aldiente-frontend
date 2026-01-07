import axios from 'axios';
import { IStudentService } from '../../models/studentService';
import { IStudentServiceManager } from './IStudentServiceManager';
import { BACKEND_URL } from '../../config';

/**
 * Implementación del gestor de servicios de estudiantes usando una API real.
 * Esta clase se comunica con el backend a través de llamadas HTTP.
 */
export class StudentServiceManagerAPI implements IStudentServiceManager {
  private api: any; // Usar 'any' temporalmente para evitar problemas de tipado
  // URL base del backend - Usa variable de entorno si está disponible o una URL que funciona tanto en Docker como en desarrollo local
  private apiUrl: string = BACKEND_URL;

  constructor() {
    this.api = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 8000
    });

    // Interceptor para añadir el token JWT a cada petición
    this.api.interceptors.request.use((config: any) => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Obtiene todos los servicios ofrecidos por un estudiante específico.
   * @param studentId El ID del estudiante.
   * @returns Una promesa que resuelve a un array de IStudentService.
   */
  async getServicesByStudent(studentId: string): Promise<IStudentService[]> {
    try {
      const response = await this.api.get(`/api/students/${studentId}/services`);
      // Debug: log shape briefly
      try { console.debug('getServicesByStudent response keys:', Object.keys(response.data || {})); } catch {}
      const raw = response.data;
      const rows: any[] = Array.isArray(raw)
        ? raw
        : (raw?.services ?? raw?.data ?? raw?.items ?? []);
      return this.mapServicesResponse(rows);
    } catch (error) {
      console.error('Error al obtener servicios del estudiante:', error);
      throw error;
    }
  }

  /**
   * Obtiene un servicio específico por su ID.
   * @param studentId El ID del estudiante (para asegurar la pertenencia).
   * @param serviceId El ID del servicio.
   * @returns Una promesa que resuelve al IStudentService o null si no se encuentra.
   */
  async getServiceById(studentId: string, serviceId: string): Promise<IStudentService | null> {
    try {
      const response = await this.api.get(`/api/student-services/${serviceId}`);
      return this.mapServiceResponse(response.data);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      console.error('Error al obtener el servicio por ID:', error);
      throw error;
    }
  }

  /**
   * Añade un nuevo servicio para un estudiante.
   * @param studentId El ID del estudiante.
   * @param serviceData Los datos del servicio a añadir.
   * @returns Una promesa que resuelve al IStudentService recién creado.
   */
  async addService(
    studentId: string, 
    serviceData: Omit<IStudentService, 'id' | 'studentId' | 'createdAt' | 'updatedAt'>
  ): Promise<IStudentService> {
    try {
      const response = await this.api.post(`/api/students/${studentId}/services`, serviceData);
      return this.mapServiceResponse(response.data);
    } catch (error) {
      console.error('Error al añadir servicio:', error);
      throw error;
    }
  }

  /**
   * Actualiza un servicio existente.
   * @param studentId El ID del estudiante.
   * @param serviceId El ID del servicio a actualizar.
   * @param serviceData Un objeto con los campos del servicio a actualizar.
   * @returns Una promesa que resuelve al IStudentService actualizado o null si no se encontró.
   */
  async updateService(
    studentId: string, 
    serviceId: string, 
    serviceData: Partial<Omit<IStudentService, 'id' | 'studentId' | 'createdAt' | 'updatedAt'>>
  ): Promise<IStudentService | null> {
    try {
      const response = await this.api.put(`/api/students/${studentId}/services/${serviceId}`, serviceData);
      return this.mapServiceResponse(response.data);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      console.error('Error al actualizar el servicio:', error);
      throw error;
    }
  }

  /**
   * Elimina un servicio.
   * @param studentId El ID del estudiante.
   * @param serviceId El ID del servicio a eliminar.
   * @returns Una promesa que resuelve cuando la eliminación se completa.
   */
  async deleteService(studentId: string, serviceId: string): Promise<void> {
    try {
      await this.api.delete(`/api/students/${studentId}/services/${serviceId}`);
    } catch (error) {
      console.error('Error al eliminar el servicio:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los servicios de todos los estudiantes.
   * @returns Una promesa que resuelve a un array con todos los IStudentService.
   */
  async getAllServices(): Promise<IStudentService[]> {
    try {
      const response = await this.api.get('/api/student-services');
      return this.mapServicesResponse(response.data);
    } catch (error) {
      console.error('Error al obtener todos los servicios:', error);
      throw error;
    }
  }

  /**
   * Mapea la respuesta de la API a un objeto IStudentService.
   * @param data Datos del servicio provenientes de la API.
   * @returns Un objeto IStudentService.
   */
  private mapServiceResponse(data: any): IStudentService {
    const row = data?.service ?? data;
    return {
      id: String(row?.id ?? ''),
      studentId: String(row?.student_id ?? ''),
      serviceName: String(row?.base_name ?? row?.service_name ?? row?.name ?? ''),
      description: row?.description ?? '',
      category: row?.category ?? '',
      price: row?.price ?? 0,
      duration: row?.duration ?? (row?.base_estimated_duration ?? ''),
      availability: row?.availability,
      createdAt: row?.created_at ? new Date(row.created_at) : (row?.createdAt ? new Date(row.createdAt) : new Date()),
      updatedAt: row?.updated_at ? new Date(row.updated_at) : (row?.updatedAt ? new Date(row.updatedAt) : new Date()),
      studentName: row?.student_full_name ?? row?.student_name ?? row?.student_email ?? '',
      studentUniversity: row?.student_university ?? row?.studentUniversity ?? ''
    } as IStudentService;
  }

  /**
   * Mapea un array de respuestas de la API a objetos IStudentService.
   * @param data Array de datos de servicios provenientes de la API.
   * @returns Un array de objetos IStudentService.
   */
  private mapServicesResponse(data: any[]): IStudentService[] {
    const rows = Array.isArray(data) ? data : [];
    return rows.map(item => this.mapServiceResponse(item));
  }
}
