export function cleanRut(rut: string): string {
  return rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
}

export function formatRut(rut: string): string {
  const cleaned = cleanRut(rut);
  if (cleaned.length < 2) return cleaned;

  const dv = cleaned.slice(-1);
  const number = cleaned.slice(0, -1);
  const formatted = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${formatted}-${dv}`;
}

function calculateDV(rut: string): string {
  let sum = 0;
  let multiplier = 2;

  for (let i = rut.length - 1; i >= 0; i -= 1) {
    sum += Number.parseInt(rut[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const dv = 11 - (sum % 11);
  if (dv === 11) return '0';
  if (dv === 10) return 'K';
  return dv.toString();
}

export function validateRut(rut: string): boolean {
  if (!rut) return false;
  const cleaned = cleanRut(rut);
  if (cleaned.length < 2) return false;
  if (!/^\d+[0-9K]$/.test(cleaned)) return false;

  const number = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  if (number.length < 7 || number.length > 8) return false;

  return calculateDV(number) === dv;
}

export function validateAndFormatRut(rut: string) {
  if (!rut) {
    return { valid: false, formatted: null, message: 'RUT invalido' };
  }

  const cleaned = cleanRut(rut);
  if (cleaned.length < 2) {
    return { valid: false, formatted: null, message: 'RUT muy corto' };
  }

  if (!/^\d+[0-9K]$/.test(cleaned)) {
    return { valid: false, formatted: null, message: 'RUT con caracteres invalidos' };
  }

  const number = cleaned.slice(0, -1);
  if (number.length < 7 || number.length > 8) {
    return { valid: false, formatted: null, message: 'RUT debe tener entre 7 y 8 digitos' };
  }

  if (!validateRut(cleaned)) {
    return { valid: false, formatted: null, message: 'Digito verificador invalido' };
  }

  return { valid: true, formatted: formatRut(cleaned), message: 'RUT valido' };
}

export function formatRutOnInput(value: string): string {
  let cleaned = value.replace(/[^0-9kK]/g, '').toUpperCase();
  if (cleaned.length > 9) cleaned = cleaned.slice(0, 9);

  if (cleaned.length <= 1) return cleaned;

  const dv = cleaned.slice(-1);
  const number = cleaned.slice(0, -1);
  const formatted = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${dv}`;
}
