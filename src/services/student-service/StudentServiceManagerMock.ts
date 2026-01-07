import { IStudentService } from '../../models/studentService';
import { IStudentServiceManager } from './IStudentServiceManager';

/**
 * Implementación Mock (en memoria) de IStudentServiceManager.
 * Simula la persistencia de datos sin una base de datos real.
 */
export class StudentServiceManagerMock implements IStudentServiceManager {
  private services: IStudentService[] = [];
  private nextId = 1;

  constructor() {
    this.seed();
  }

  // Helper para simular la latencia de red
  private async delay(ms: number = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getServicesByStudent(studentId: string): Promise<IStudentService[]> {
    await this.delay();
    return this.services.filter(service => service.studentId === studentId);
  }

  async getServiceById(studentId: string, serviceId: string): Promise<IStudentService | null> {
    await this.delay();
    const service = this.services.find(s => s.id === serviceId && s.studentId === studentId);
    return service || null;
  }

  async addService(
    studentId: string,
    serviceData: Omit<IStudentService, 'id' | 'studentId' | 'createdAt' | 'updatedAt'>
  ): Promise<IStudentService> {
    await this.delay();
    const newService: IStudentService = {
      ...serviceData,
      id: (this.nextId++).toString(),
      studentId: studentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.services.push(newService);
    return newService;
  }

  async updateService(
    studentId: string,
    serviceId: string,
    serviceData: Partial<Omit<IStudentService, 'id' | 'studentId' | 'createdAt' | 'updatedAt'>>
  ): Promise<IStudentService | null> {
    await this.delay();
    const serviceIndex = this.services.findIndex(s => s.id === serviceId && s.studentId === studentId);
    if (serviceIndex === -1) {
      return null;
    }
    const updatedService = {
      ...this.services[serviceIndex],
      ...serviceData,
      updatedAt: new Date(),
    };
    this.services[serviceIndex] = updatedService;
    return updatedService;
  }

  async deleteService(studentId: string, serviceId: string): Promise<void> {
    await this.delay();
    this.services = this.services.filter(s => !(s.id === serviceId && s.studentId === studentId));
  }

  async getAllServices(): Promise<IStudentService[]> {
    await this.delay();
    return [...this.services];
  }

  // Método adicional para limpiar los servicios (útil para pruebas)
  public clearAllServices(): void {
    this.services = [];
    this.nextId = 1;
  }

  // Método para poblar con datos de prueba
  private seed(): void {
    if (this.services.length > 0) return; // No poblar si ya hay datos

    const student1Id = 'estudiante1@test.com'; // Usar emails como IDs temporales
    const student2Id = 'estudiante2@test.com';

    this.addService(student1Id, {
      serviceName: 'Limpieza Dental',
      description: 'Limpieza profunda con ultrasonido.',
      category: 'Prevención',
      price: 50,
      duration: '45 minutos',
      studentName: 'Ana García',
      studentUniversity: 'Universidad Complutense',
    });
    this.addService(student1Id, {
      serviceName: 'Blanqueamiento Dental',
      description: 'Blanqueamiento con luz LED de última generación.',
      category: 'Estética',
      price: 150,
      duration: '60 minutos',
      studentName: 'Ana García',
      studentUniversity: 'Universidad Complutense',
    });

    this.addService(student2Id, {
      serviceName: 'Revisión y Diagnóstico',
      description: 'Revisión completa y plan de tratamiento.',
      category: 'Diagnóstico',
      price: 20,
      duration: '30 minutos',
      studentName: 'Carlos Pérez',
      studentUniversity: 'Universidad de Barcelona',
    });
  }
}

// Exportar una instancia singleton para facilitar su uso en la aplicación (opcional)
export const studentServiceManagerMock = new StudentServiceManagerMock();
