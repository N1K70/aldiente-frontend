/**
 * Utilidades para formateo de fechas con formato chileno (dd-mm-aaaa)
 */

/**
 * Formatea una fecha en formato dd-mm-aaaa
 * @param date - Fecha a formatear (Date, string ISO, o timestamp)
 * @returns Fecha formateada como string dd-mm-aaaa
 */
export function formatDate(date: Date | string | number): string {
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return d.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return '';
  }
}

/**
 * Formatea una fecha en formato dd-mm-aaaa HH:mm
 * @param date - Fecha a formatear (Date, string ISO, o timestamp)
 * @returns Fecha formateada como string dd-mm-aaaa HH:mm
 */
export function formatDateTime(date: Date | string | number): string {
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const dateStr = d.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeStr = d.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${dateStr} ${timeStr}`;
  } catch {
    return '';
  }
}

/**
 * Formatea solo la hora en formato HH:mm
 * @param date - Fecha a formatear (Date, string ISO, o timestamp)
 * @returns Hora formateada como string HH:mm
 */
export function formatTime(date: Date | string | number): string {
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return d.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
}
