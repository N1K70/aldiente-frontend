import { IStudentServiceManager } from './IStudentServiceManager';
import { StudentServiceManagerMock } from './StudentServiceManagerMock';
import { StudentServiceManagerAPI } from './StudentServiceManagerAPI';

/**
 * Factory para obtener la implementación apropiada del gestor de servicios de estudiantes.
 * Permite alternar fácilmente entre la implementación mock y la implementación real de API.
 */
export class StudentServiceFactory {
  // Constante para determinar si se usa la API real o el mock
  private static readonly USE_API = true; // Cambiar a false para usar datos simulados
  
  // Instancias singleton de las implementaciones
  private static mockInstance: StudentServiceManagerMock | null = null;
  private static apiInstance: StudentServiceManagerAPI | null = null;

  /**
   * Obtiene una instancia del gestor de servicios de estudiantes.
   * @returns Una instancia que implementa IStudentServiceManager.
   */
  public static getServiceManager(): IStudentServiceManager {
    if (this.USE_API) {
      if (!this.apiInstance) {
        this.apiInstance = new StudentServiceManagerAPI();
      }
      return this.apiInstance;
    } else {
      if (!this.mockInstance) {
        this.mockInstance = new StudentServiceManagerMock();
      }
      return this.mockInstance;
    }
  }
}
