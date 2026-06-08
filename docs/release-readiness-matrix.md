# ALDIENTE - Release Readiness Matrix

Fecha base: 2026-06-07

## Objetivo

Guiar el trabajo restante hacia produccion con una matriz basada en riesgo. Notion es la fuente principal del backlog; este documento versiona la ruta operativa para desarrollo y QA.

## Carriles del backlog

1. `P0 Produccion`: depende de deploy, variables reales, backend productivo o credenciales reales.
2. `P0 Codigo`: se puede resolver localmente y validar con gates/smokes/QA visual.
3. `P1 UX/Confianza`: mejora conversion, claridad, soporte o percepcion de seguridad.
4. `P2 Operacion`: CI, monitoreo, rollback, documentacion y herramientas.

## Flujos criticos

| Flujo | Riesgo principal | Validacion local | Validacion produccion | Estado objetivo |
| --- | --- | --- | --- | --- |
| Signup/Login paciente | Bloquea entrada al producto | `qa:gate`, `qa:smoke:roles`, QA visual login/signup | Cuenta paciente real: signup, login, persistencia, logout | PASS prod |
| Signup/Login estudiante | Redireccion/rol incorrecto | `qa:smoke:roles` | Cuenta estudiante real: signup, login, dashboard, logout | PASS prod |
| Explorar -> reservar -> confirmar | Bloquea core booking | QA visual explorar/reservar + smoke rutas | Reserva real contra backend productivo | PASS prod |
| Pago/Webpay retorno | Bloquea revenue | Build + contrato de retorno | Pago sandbox/productivo controlado + retorno | PASS prod |
| Chat por cita | Bloquea continuidad de atencion | Contrato adjuntos + QA visual chat | Mensaje real, historial, realtime/fallback | PASS prod |
| Documentos | Riesgo de permisos y archivos | Upload/delete defensivo + QA visual | Subir/listar/borrar documento real | PASS prod |
| Reagendar | Riesgo agenda/estado de cita | Build + QA visual flujo | Reagendar cita real y confirmar detalle | PASS prod |
| Routing directo/aliases | 404 en navegacion directa | `qa:smoke:routes` | Probar aliases en dominio productivo | PASS prod |
| Observabilidad | No detectar fallas | `qa:funnel:event-contract`, `/api/telemetry` | Confirmar destino eventos/errores | PASS prod |

## Orden recomendado

1. Recuperar QA visual local con Docker/hot-reload.
2. Cerrar P0 Codigo restantes con `qa:release:local`.
3. Preparar release candidate desde `dev`.
4. Verificar variables productivas en Vercel.
5. Ejecutar matriz E2E en produccion.
6. Registrar evidencia en `docs/qa-evidence-log.md` y Notion.

## Definition of Done para release candidate

- `npm run qa:mock-guard`: PASS.
- `npm run qa:encoding-guard`: PASS.
- `npm run qa:gate`: PASS.
- `npm run qa:smoke:routes`: PASS.
- `npm run qa:smoke:roles`: PASS.
- `npm run qa:visual:snapshots`: PASS.
- Variables productivas verificadas: `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_CHAT_URL`, `NEXT_PUBLIC_FRONTEND_EVENTS_ENDPOINT`.
- Matriz E2E productiva ejecutada con evidencia.

## Regla de decision

No seguimos agregando features si existe un P0 de produccion sin estado claro. Si un P0 depende de credenciales/deploy, se mantiene como `P0 Produccion`; si se puede corregir localmente, se mueve o marca como `P0 Codigo`.
