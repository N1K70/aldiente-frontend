import { describe, it, expect } from 'vitest';
import { validateRut, formatRut, cleanRut } from '../rutValidator';

describe('rutValidator', () => {
  describe('validateRut', () => {
    it('debe validar un RUT correcto con formato', () => {
      expect(validateRut('12.345.678-5')).toBe(true);
      expect(validateRut('11.111.111-1')).toBe(true);
    });

    it('debe validar un RUT correcto sin formato', () => {
      expect(validateRut('123456785')).toBe(true);
      expect(validateRut('111111111')).toBe(true);
    });

    it('debe rechazar un RUT con dígito verificador incorrecto', () => {
      expect(validateRut('12.345.678-0')).toBe(false);
      expect(validateRut('11.111.111-2')).toBe(false);
    });

    it('debe rechazar RUT vacío o undefined', () => {
      expect(validateRut('')).toBe(false);
      expect(validateRut(null as any)).toBe(false);
      expect(validateRut(undefined as any)).toBe(false);
    });

    it('debe rechazar RUT con caracteres inválidos', () => {
      expect(validateRut('abc.def.ghi-j')).toBe(false);
      expect(validateRut('12-345-678-5')).toBe(false);
    });

    it('debe manejar RUT con K como dígito verificador', () => {
      // Buscar un RUT válido con K
      expect(validateRut('11.111.111-K')).toBe(true);
      expect(validateRut('11111111K')).toBe(true);
    });
  });

  describe('formatRut', () => {
    it('debe formatear RUT sin formato', () => {
      expect(formatRut('123456785')).toBe('12.345.678-5');
      expect(formatRut('111111111')).toBe('11.111.111-1');
    });

    it('debe mantener formato si ya está formateado', () => {
      expect(formatRut('12.345.678-5')).toBe('12.345.678-5');
    });

    it('debe formatear RUT con K', () => {
      expect(formatRut('11111111K')).toBe('11.111.111-K');
    });

    it('debe retornar string vacío para input inválido', () => {
      expect(formatRut('')).toBe('');
      expect(formatRut(null as any)).toBe('');
    });
  });

  describe('cleanRut', () => {
    it('debe limpiar RUT formateado', () => {
      expect(cleanRut('12.345.678-5')).toBe('123456785');
      expect(cleanRut('11.111.111-1')).toBe('111111111');
    });

    it('debe mantener RUT sin formato', () => {
      expect(cleanRut('123456785')).toBe('123456785');
    });

    it('debe convertir k minúscula a mayúscula', () => {
      expect(cleanRut('11.111.111-k')).toBe('11111111K');
    });
  });
});
