/**
 * Tipos relacionados con usuarios y autenticación
 */

/**
 * Interfaz que define un usuario simulado para autenticación en frontend
 * @interface MockUser
 */
export interface MockUser {
  /** Identificador del usuario (ID numérico del backend como string). Opcional para compatibilidad */
  id?: string;
  
  /** Correo electrónico del usuario */
  email: string;
  
  /** Rol del usuario: 'student', 'patient' u otro */
  role: 'student' | 'patient' | string;
  
  /** Nombre para mostrar (opcional) */
  displayName?: string;
}

/**
 * Interfaz para la respuesta de login desde el backend
 * @interface LoginResponse
 */
export interface LoginResponse {
  /** Token JWT de autenticación */
  token: string;
  
  /** Datos del usuario autenticado (opcional) */
  user?: {
    email?: string;
    role?: string;
    name?: string;
  };
}
