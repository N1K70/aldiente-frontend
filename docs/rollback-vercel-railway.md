# ALDIENTE - Rollback Vercel/Railway

Fecha base: 2026-04-29

## Objetivo

Restaurar servicio estable rapidamente cuando un release frontend o dependencia backend/chat rompe flujos criticos.

## A) Rollback frontend (Vercel)

1. Identificar ultimo deploy estable en Vercel (timestamp + commit).
2. Promover redeploy del build estable anterior.
3. Confirmar que el dominio principal apunta al deploy restaurado.
4. Validar smoke minimo:
- `/login`
- `/home` o `/dashboard`
- `/explorar`
- `/reservar`
- `/chat`
5. Comunicar estado en canal interno (causa, impacto, hora, estado actual).

## B) Rollback backend/chat (Railway)

1. Identificar servicio afectado (`backend` o `chat`).
2. Restaurar version previa estable (deploy anterior o rollback de release).
3. Confirmar healthcheck del servicio.
4. Verificar integracion desde frontend:
- Auth responde.
- Carga de servicios responde.
- Chat conecta o entra a fallback HTTP sin bloqueo.

## C) Verificaciones posteriores

- Revisar logs de frontend (`[frontend-error]`) y backend.
- Confirmar normalizacion de flujo critico reportado.
- Crear ticket postmortem con:
- causa raiz
- accion correctiva
- accion preventiva

## D) Comunicacion minima

- Inicio de incidente: hora exacta y alcance.
- Rollback ejecutado: hora exacta y version restaurada.
- Cierre: estado estable confirmado y proximos pasos.
