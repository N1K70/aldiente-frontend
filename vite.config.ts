/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
  // Cargar variables de entorno según el modo (development, production, etc.)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    define: {
      'process.env': {}
    },
    plugins: [
      react(),
      legacy()
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
    },
    // Servidor de desarrollo
    server: {
      host: true, // 0.0.0.0 para exponer en LAN
      port: 3000,
      open: true,
      // Importante: solo indicamos clientPort para que el navegador use el puerto mapeado del host
      // y evitamos que el servidor HMR intente bindearse a la IP del host dentro del contenedor (EADDRNOTAVAIL)
      hmr: {
        clientPort: env.VITE_HMR_PORT ? Number(env.VITE_HMR_PORT) : 3002
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false, // Deshabilitar sourcemaps en producción para reducir tamaño
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // Eliminar console.logs en producción
          drop_debugger: true
        }
      },
      rollupOptions: {
        output: {
          manualChunks: {
            // Separar vendors grandes para mejor caching
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ionic-vendor': ['@ionic/react', '@ionic/react-router'],
            'animation-vendor': ['framer-motion'],
          }
        }
      },
      chunkSizeWarningLimit: 1000, // Aumentar límite de advertencia
      cssCodeSplit: true, // Dividir CSS en chunks
      assetsInlineLimit: 4096, // Inline assets menores a 4kb
    },
    // Exponer las variables de entorno que comienzan con VITE_ a la aplicación
    envPrefix: 'VITE_'
  }
})
