/**
 * Utilidades para manejo de subdominios
 * 
 * Estructura de dominios:
 * - home.aldiente.app → Landing page (marketing)
 * - aldiente.app → App principal (login, register, dashboard)
 * 
 * En desarrollo local:
 * - localhost:3002 → App principal
 * - home.localhost:3002 → Landing (requiere configuración de hosts)
 */

// Dominios configurados
export const DOMAINS = {
  LANDING: 'home.aldiente.app',
  APP: 'aldiente.app',
  // Para desarrollo local
  LOCAL_APP: 'localhost',
  LOCAL_LANDING: 'home.localhost',
} as const;

/**
 * Detecta si estamos en el subdominio del landing
 */
export const isLandingDomain = (): boolean => {
  const hostname = window.location.hostname;
  
  // En producción
  if (hostname === DOMAINS.LANDING) return true;
  if (hostname.startsWith('home.')) return true;
  
  // En desarrollo, si no hay subdominio "home", no es landing
  return false;
};

/**
 * Detecta si estamos en el dominio principal de la app
 */
export const isAppDomain = (): boolean => {
  const hostname = window.location.hostname;
  
  // En producción
  if (hostname === DOMAINS.APP) return true;
  
  // En desarrollo local (localhost sin subdominio)
  if (hostname === DOMAINS.LOCAL_APP || hostname === '127.0.0.1') return true;
  
  // Si no es landing, asumimos que es app
  return !isLandingDomain();
};

/**
 * Obtiene la URL base del landing
 */
export const getLandingUrl = (): string => {
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  // En producción
  if (window.location.hostname === DOMAINS.APP) {
    return `${protocol}//${DOMAINS.LANDING}`;
  }
  
  // En desarrollo
  const portSuffix = port ? `:${port}` : '';
  return `${protocol}//home.localhost${portSuffix}`;
};

/**
 * Obtiene la URL base de la app principal
 */
export const getAppUrl = (): string => {
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  // En producción
  if (window.location.hostname === DOMAINS.LANDING) {
    return `${protocol}//${DOMAINS.APP}`;
  }
  
  // En desarrollo
  const portSuffix = port ? `:${port}` : '';
  return `${protocol}//localhost${portSuffix}`;
};

/**
 * Redirige al dominio correcto según el contexto
 */
export const redirectToCorrectDomain = (targetPath: string, isLanding: boolean): void => {
  const currentIsLanding = isLandingDomain();
  
  if (isLanding && !currentIsLanding) {
    // Necesitamos ir al landing pero estamos en app
    window.location.href = `${getLandingUrl()}${targetPath}`;
  } else if (!isLanding && currentIsLanding) {
    // Necesitamos ir a la app pero estamos en landing
    window.location.href = `${getAppUrl()}${targetPath}`;
  }
};

/**
 * Genera un link al login en el dominio de la app
 */
export const getLoginUrl = (): string => {
  return `${getAppUrl()}/login`;
};

/**
 * Genera un link al registro en el dominio de la app
 */
export const getRegisterUrl = (): string => {
  return `${getAppUrl()}/login?register=true`;
};
