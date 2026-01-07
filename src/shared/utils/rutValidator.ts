/**
 * Validador de RUT chileno para el frontend
 * Formato aceptado: 12345678-9 o 12.345.678-9
 */

/**
 * Limpia el RUT eliminando puntos y guiones
 */
export function cleanRut(rut: string): string {
  return rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
}

/**
 * Formatea un RUT limpio al formato 12.345.678-9
 */
export function formatRut(rut: string): string {
  const cleaned = cleanRut(rut);
  if (cleaned.length < 2) return cleaned;
  
  const dv = cleaned.slice(-1);
  const number = cleaned.slice(0, -1);
  
  // Agregar puntos cada 3 dígitos
  const formatted = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${formatted}-${dv}`;
}

/**
 * Calcula el dígito verificador de un RUT
 */
function calculateDV(rut: string): string {
  let sum = 0;
  let multiplier = 2;
  
  // Recorrer el RUT de derecha a izquierda
  for (let i = rut.length - 1; i >= 0; i--) {
    sum += parseInt(rut[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const dv = 11 - remainder;
  
  if (dv === 11) return '0';
  if (dv === 10) return 'K';
  return dv.toString();
}

/**
 * Valida un RUT chileno
 */
export function validateRut(rut: string): boolean {
  if (!rut || typeof rut !== 'string') {
    return false;
  }
  
  // Limpiar el RUT
  const cleaned = cleanRut(rut);
  
  // Verificar que tenga al menos 2 caracteres (número + DV)
  if (cleaned.length < 2) {
    return false;
  }
  
  // Verificar que solo contenga números y opcionalmente K al final
  if (!/^\d+[0-9K]$/.test(cleaned)) {
    return false;
  }
  
  // Separar número y dígito verificador
  const number = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  
  // Verificar que el número tenga entre 7 y 8 dígitos
  if (number.length < 7 || number.length > 8) {
    return false;
  }
  
  // Calcular y comparar el dígito verificador
  const calculatedDV = calculateDV(number);
  
  return dv === calculatedDV;
}

/**
 * Valida y formatea un RUT
 */
export function validateAndFormatRut(rut: string): {
  valid: boolean;
  formatted: string | null;
  message: string;
} {
  if (!rut || typeof rut !== 'string') {
    return {
      valid: false,
      formatted: null,
      message: 'RUT inválido'
    };
  }
  
  const cleaned = cleanRut(rut);
  
  if (cleaned.length < 2) {
    return {
      valid: false,
      formatted: null,
      message: 'RUT muy corto'
    };
  }
  
  if (!/^\d+[0-9K]$/.test(cleaned)) {
    return {
      valid: false,
      formatted: null,
      message: 'RUT contiene caracteres inválidos'
    };
  }
  
  const number = cleaned.slice(0, -1);
  
  if (number.length < 7 || number.length > 8) {
    return {
      valid: false,
      formatted: null,
      message: 'RUT debe tener entre 7 y 8 dígitos'
    };
  }
  
  const isValid = validateRut(rut);
  
  if (!isValid) {
    return {
      valid: false,
      formatted: null,
      message: 'Dígito verificador inválido'
    };
  }
  
  return {
    valid: true,
    formatted: formatRut(cleaned),
    message: 'RUT válido'
  };
}

/**
 * Formatea el RUT mientras el usuario escribe
 * Útil para inputs en tiempo real
 */
export function formatRutOnInput(value: string): string {
  // Eliminar todo excepto números y K
  let cleaned = value.replace(/[^0-9kK]/g, '').toUpperCase();
  
  // Limitar a 9 caracteres (8 dígitos + 1 DV)
  if (cleaned.length > 9) {
    cleaned = cleaned.slice(0, 9);
  }
  
  // Si tiene más de 1 carácter, formatear
  if (cleaned.length > 1) {
    const dv = cleaned.slice(-1);
    const number = cleaned.slice(0, -1);
    
    // Agregar puntos cada 3 dígitos
    const formatted = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${formatted}-${dv}`;
  }
  
  return cleaned;
}
