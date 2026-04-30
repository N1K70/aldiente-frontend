# ALDIENTE - Monitoreo de Errores Frontend

Fecha base: 2026-04-29

## Objetivo

Tener un proceso operativo para detectar, clasificar y reaccionar a errores frontend durante desarrollo y post-release.

## Fuente actual de errores

El proyecto reporta errores con `reportFrontendError(...)` y los emite en consola como:

- prefijo: `[frontend-error]`
- campos clave: `timestamp`, `severity`, `module`, `action`, `route`, `userId`, `role`, `message`, `details`

Archivo base: `src/lib/frontend-observability.ts`.

## Flujo operativo (sin backend)

1. Reproducir flujo impactado en navegador.
2. Abrir DevTools Console y filtrar por `[frontend-error]`.
3. Copiar el evento con mayor severidad.
4. Clasificar severidad:
- `error`: flujo bloqueado o inconsistente.
- `warning`: fallback activado o degradación parcial.
- `info`: señal diagnóstica sin impacto funcional.
5. Registrar en `docs/qa-evidence-log.md`:
- ruta afectada
- módulo/acción
- severidad
- pasos de reproducción
- estado (abierto/corregido)

## SLA sugerido

- `error`: atención inmediata (mismo día).
- `warning`: priorizar en siguiente bloque de desarrollo.
- `info`: agrupar y revisar en grooming técnico.

## Checklist post-release (primeros 30 minutos)

- Revisar flujos: login, explorar, reservar, pago, chat, documentos.
- Confirmar ausencia de nuevos `[frontend-error]` severidad `error`.
- Si hay `error` repetido en flujo crítico: ejecutar rollback según `docs/rollback-vercel-railway.md`.

## Próximo paso recomendado

Cuando se habilite integración backend/tercero, reenviar este payload a un endpoint de ingesta (Sentry/Datadog/propio) sin cambiar la interfaz pública de `reportFrontendError(...)`.
