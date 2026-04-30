# ALDIENTE - Release Checklist (Frontend)

Fecha base: 2026-04-29

## Objetivo

Estandarizar cada salida a produccion de frontend para reducir regresiones y acelerar rollback si algo falla.

## 1) Pre-release (obligatorio)

- [ ] Branch objetivo confirmada (`dev` -> `master/main` segun estrategia activa).
- [ ] PR con descripcion de alcance, riesgo y plan de validacion.
- [ ] CI en verde (`typecheck` + `build`).
- [ ] `npm run qa:gate` en verde local.
- [ ] Smoke rutas en verde (`npm run qa:smoke:routes`).
- [ ] Smoke roles en verde (`npm run qa:smoke:roles`) si hubo cambios en auth/proxy.
- [ ] Variables de entorno verificadas en Vercel (`NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_CHAT_URL`).
- [ ] No hay fallbacks mock activos en flujos criticos.
- [ ] Evidencia QA agregada en `docs/qa-evidence-log.md`.

## 2) Release (ventana de salida)

- [ ] Confirmar merge a rama de deploy.
- [ ] Verificar deploy completado en Vercel sin errores.
- [ ] Ejecutar smoke manual de produccion:
- Signup/login (paciente y estudiante).
- Explorar y reserva.
- Pago y retorno Webpay.
- Chat en cita activa.
- Documentos (carga/listado).

## 3) Post-release (primeros 30 minutos)

- [ ] Revisar consola frontend para errores criticos (`[frontend-error]`).
- [ ] Verificar paginas principales: `/home`, `/dashboard`, `/explorar`, `/reservar`, `/chat`.
- [ ] Confirmar no hay picos de error reportados por usuarios o soporte.
- [ ] Si hay incidencia `Blocker`, ejecutar rollback inmediato.

## 4) Criterio de rollback inmediato

Aplicar rollback si ocurre alguno:

- Login o signup inutilizable.
- Reserva/pago no completan.
- Chat/documentos caidos para la mayoria.
- Error generalizado en rutas principales o pantalla en blanco.

Ver guia: `docs/rollback-vercel-railway.md`.
