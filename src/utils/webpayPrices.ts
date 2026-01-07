/**
 * Utilidad para manejar precios y links de Webpay
 */

export interface WebpayPrice {
  price: number;
  link: string;
}

let cachedPrices: WebpayPrice[] | null = null;

/**
 * Carga y parsea el archivo CSV de precios de Webpay
 */
export async function loadWebpayPrices(): Promise<WebpayPrice[]> {
  if (cachedPrices) {
    return cachedPrices;
  }

  try {
    const response = await fetch('/assets/data/webpay_prices.csv');
    if (!response.ok) {
      throw new Error(`Error al cargar precios: ${response.statusText}`);
    }

    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    
    // Saltar la primera línea (encabezados)
    const dataLines = lines.slice(1);
    
    cachedPrices = dataLines
      .map(line => {
        const [priceStr, link] = line.split(',');
        const price = parseInt(priceStr.trim(), 10);
        
        if (isNaN(price) || !link) {
          return null;
        }
        
        return {
          price,
          link: link.trim()
        };
      })
      .filter((item): item is WebpayPrice => item !== null)
      .sort((a, b) => a.price - b.price);

    return cachedPrices;
  } catch (error) {
    console.error('Error al cargar precios de Webpay:', error);
    return [];
  }
}

/**
 * Obtiene el link de Webpay para un precio específico
 * Si no hay coincidencia exacta, retorna null
 */
export async function getWebpayLinkByPrice(targetPrice: number): Promise<string | null> {
  const prices = await loadWebpayPrices();
  
  if (prices.length === 0) {
    return null;
  }

  // Buscar coincidencia exacta
  const exactMatch = prices.find(item => item.price === targetPrice);
  if (exactMatch) {
    return exactMatch.link;
  }

  // Si no hay coincidencia exacta, buscar el precio más cercano
  const closest = prices.reduce((prev, curr) => {
    return Math.abs(curr.price - targetPrice) < Math.abs(prev.price - targetPrice) 
      ? curr 
      : prev;
  });

  // Solo retornar si la diferencia es menor al 5%
  const difference = Math.abs(closest.price - targetPrice);
  const percentDifference = (difference / targetPrice) * 100;
  
  if (percentDifference <= 5) {
    return closest.link;
  }

  return null;
}

/**
 * Obtiene todos los precios disponibles
 */
export async function getAllWebpayPrices(): Promise<WebpayPrice[]> {
  return loadWebpayPrices();
}

/**
 * Limpia el caché de precios (útil para testing)
 */
export function clearPricesCache(): void {
  cachedPrices = null;
}
