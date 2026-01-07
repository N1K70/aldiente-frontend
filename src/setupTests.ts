// Configuración del entorno de testing para Vitest
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Limpia el DOM después de cada test
afterEach(() => {
  cleanup();
});

// Mock de ResizeObserver (usado por Ionic)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock de IntersectionObserver (usado por Ionic)
global.IntersectionObserver = class IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
} as any;

// Mock de matchMedia (para responsive design)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

// Mock de HTMLElement.scrollIntoView (usado por Ionic)
HTMLElement.prototype.scrollIntoView = () => {};

// Mock de window.CSS.supports (usado por algunos componentes)
if (typeof window.CSS === 'undefined') {
  (window as any).CSS = {
    supports: () => false,
  };
}
