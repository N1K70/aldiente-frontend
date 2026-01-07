import { BACKEND_URL as API_BASE_URL } from '../../config';

export interface CreateWebpayPaymentRequest {
  price: number;
  email: string;
  name: string;
  description?: string;
}

export interface CreateWebpayPaymentResponse {
  success: boolean;
  token: string;
  url: string;
  buyOrder: string;
  sessionId: string;
  amount: number;
  redirectUrl: string;
  message: string;
}

export interface CommitWebpayPaymentRequest {
  token_ws: string;
}

export interface CommitWebpayPaymentResponse {
  status: 'approved' | 'rejected';
  buyOrder: string;
  sessionId: string;
  amount: number;
  authorizationCode?: string;
  paymentTypeCode?: string;
  responseCode: number;
  cardNumber?: string;
  accountingDate?: string;
  transactionDate?: string;
  vci?: string;
}

export interface AvailablePrice {
  value: number;
  label: string;
  link: string;
}

export interface AvailablePricesResponse {
  prices: number[];
  currency: string;
  formatted: AvailablePrice[];
}

/**
 * Crear un pago público con Webpay
 */
export async function createWebpayPayment(
  data: CreateWebpayPaymentRequest
): Promise<CreateWebpayPaymentResponse> {
  const response = await fetch(`${API_BASE_URL}/api/webpay/create-by-price-public`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error al crear pago' }));
    throw new Error(error.message || 'Error al crear pago con Webpay');
  }

  return response.json();
}

/**
 * Confirmar un pago de Webpay después de que el usuario complete el pago
 */
export async function commitWebpayPayment(
  data: CommitWebpayPaymentRequest
): Promise<CommitWebpayPaymentResponse> {
  const response = await fetch(`${API_BASE_URL}/api/webpay/commit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error al confirmar pago' }));
    throw new Error(error.message || 'Error al confirmar pago con Webpay');
  }

  return response.json();
}

/**
 * Obtener precios disponibles desde el backend
 */
export async function getAvailablePrices(): Promise<AvailablePricesResponse> {
  const response = await fetch(`${API_BASE_URL}/api/webpay/available-prices`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener precios disponibles');
  }

  return response.json();
}

/**
 * Cancelar una transacción de Webpay
 */
export async function cancelWebpayPayment(data: {
  TBK_TOKEN: string;
  TBK_ID_SESION: string;
  TBK_ORDEN_COMPRA: string;
}): Promise<{ status: string; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/webpay/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Error al cancelar transacción');
  }

  return response.json();
}

/**
 * Iniciar pago para una reserva existente
 */
export async function initiateAppointmentPayment(
  appointmentId: string,
  token: string
): Promise<CreateWebpayPaymentResponse> {
  const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error al iniciar pago' }));
    throw new Error(error.message || 'Error al iniciar pago');
  }

  return response.json();
}

/**
 * Verificar estado de pago de una reserva
 */
export async function getAppointmentPaymentStatus(
  appointmentId: string,
  token: string
): Promise<{
  payment_status: string;
  payment_method: string;
  webpay_token: string;
  webpay_buy_order: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/payment-status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al verificar estado de pago');
  }

  return response.json();
}
