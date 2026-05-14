# ALDIENTE - Monitoreo de Errores Frontend

Fecha base: 2026-05-13

## Objetivo

Tener un proceso operativo para detectar, clasificar y reaccionar a errores frontend durante desarrollo y post-release.

## Fuente actual de errores

El proyecto reporta errores con `reportFrontendError(...)` y los emite en consola como:

- prefijo: `[frontend-error]`
- campos clave: `timestamp`, `severity`, `module`, `action`, `route`, `userId`, `role`, `message`, `details`

Archivo base: `src/lib/frontend-observability.ts`.

Adicionalmente, los eventos se envian via `sendTelemetry(...)` a:

- `NEXT_PUBLIC_FRONTEND_EVENTS_ENDPOINT` (si esta definido), o
- fallback interno `/api/telemetry` (desarrollo/QA).

Archivos relacionados:

- `src/lib/frontend-telemetry.ts`
- `src/app/api/telemetry/route.ts`
- `src/app/telemetry-qa/page.tsx`

## Flujo operativo (desarrollo y QA)

1. Reproducir flujo impactado en navegador.
2. Abrir DevTools Console y filtrar por `[frontend-error]`.
3. Abrir `/telemetry-qa` para confirmar recepcion centralizada.
4. Copiar el evento con mayor severidad.
5. Clasificar severidad:
- `error`: flujo bloqueado o inconsistente.
- `warning`: fallback activado o degradacion parcial.
- `info`: senal diagnostica sin impacto funcional.
6. Registrar en `docs/qa-evidence-log.md`:
- ruta afectada
- modulo/accion
- severidad
- pasos de reproduccion
- estado (abierto/corregido)

## SLA sugerido

- `error`: atencion inmediata (mismo dia).
- `warning`: priorizar en siguiente bloque de desarrollo.
- `info`: agrupar y revisar en grooming tecnico.

## Checklist post-release (primeros 30 minutos)

- Revisar flujos: login, explorar, reservar, pago, chat, documentos.
- Confirmar ausencia de nuevos `[frontend-error]` severidad `error`.
- Si hay `error` repetido en flujo critico: ejecutar rollback segun `docs/rollback-vercel-railway.md`.

## Operacion de endpoint externo

Cuando se use un endpoint externo (Sentry/Datadog/propio):

1. Configurar `NEXT_PUBLIC_FRONTEND_EVENTS_ENDPOINT`.
2. Validar recepcion de `kind=frontend_error` y `kind=funnel_event`.
3. Confirmar redaccion de campos sensibles (`email`, `phone`, `rut`, `token`, `password`, `authorization`, `cookie`).
4. Mantener `/api/telemetry` y `/telemetry-qa` como canal de QA local.
