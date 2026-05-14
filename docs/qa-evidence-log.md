# ALDIENTE - QA Evidence Log

## Registro

Usa este bloque por cada ronda de validación.

### Fecha
- `YYYY-MM-DD`

### Branch / Commit
- Branch:
- Commit:

### Scope del cambio
- 

### Gate técnico
- `npm run typecheck`: `PASS | FAIL`
- `npm run build`: `PASS | FAIL`

### QA funcional ejecutado
1. Flujo:
   - Resultado: `PASS | FAIL`
   - Evidencia:
   - Notas:
2. Flujo:
   - Resultado: `PASS | FAIL`
   - Evidencia:
   - Notas:

### Hallazgos
- Severidad:
- Descripción:
- Ticket Notion:

### Decisión
- `MERGE | NO MERGE`
- Motivo:

---

### Fecha
- `2026-04-29`

### Branch / Commit
- Branch: `dev`
- Commit: `3d72e92` (HEAD actual)

### Scope del cambio
- Fix de validación en signup (`normalizedEmail` fuera de scope en catch).
- Observabilidad de errores en flujo de documentos (carga, subida, eliminación).
- Observabilidad de errores en retorno Webpay (cancel/commit).
- Observabilidad de errores en chat (historial, conexión socket fallback, envío HTTP fallback).

### Gate técnico
- `npm run typecheck`: `PASS`
- `npm run build`: `PASS`

### QA funcional ejecutado
1. Flujo: Smoke de rutas críticas
   - Resultado: `PASS`
   - Evidencia: `npm run qa:smoke:routes`
   - Notas: Rutas públicas/protegidas responden según esperado.
2. Flujo: Redirecciones por rol (middleware)
   - Resultado: `PASS`
   - Evidencia: `npm run qa:smoke:roles`
   - Notas: Reglas `/login`, `/home`, `/dashboard` consistentes por rol.

### Hallazgos
- Severidad: `N/A`
- Descripción: Sin bloqueantes técnicos posteriores a los cambios.
- Ticket Notion: `[P1] Instrumentar errores críticos frontend: auth, pagos, chat, documentos`

### Decisión
- `MERGE`
- Motivo: Gate técnico en verde y cobertura incremental de observabilidad en flujos críticos.

---

### Fecha
- `2026-04-29`

### Branch / Commit
- Branch: `dev`
- Commit: `working tree (sin commit todavía)`

### Scope del cambio
- Eliminación de fallbacks mock en catálogo de servicios.
- Estados explícitos de error/fallback en `explorar` y `home`.
- Reserva autenticada sin servicio ficticio.
- Instrumentación de observabilidad local con `reportFrontendError(...)`.

### Gate técnico
- `npm run typecheck`: `PASS`
- `npm run build`: `PASS`

### QA funcional ejecutado
1. Flujo: Carga de servicios en `explorar` con universidad seleccionada
   - Resultado: `PASS`
   - Evidencia: Build exitoso + revisión de estados UI en código
   - Notas: Se muestran avisos explícitos en fallback y error total.
2. Flujo: Reserva autenticada sin servicios publicados
   - Resultado: `PASS`
   - Evidencia: Revisión de condición `hasServices` y bloqueo de avance
   - Notas: Se removió fallback hardcodeado.
3. Flujo: Home con fallo de highlights por universidad
   - Resultado: `PASS`
   - Evidencia: Hook `useUniversityHighlights` con `loadError` + banner UI
   - Notas: Se reporta error y no se muestran datos ficticios.

### Hallazgos
- Severidad: `N/A`
- Descripción: Sin bloqueantes técnicos en gate.
- Ticket Notion: `[P0] Hardening: reemplazar fallbacks mock por estados de error explícitos`

### Decisión
- `MERGE`
- Motivo: cambios alineados a P0, gate técnico en verde y manejo de errores más robusto.

---

## Checklist E2E - Adjuntos Chat (Contrato Backend)

Usar este checklist cuando se valide el item `[P1] Validar contrato backend de adjuntos en chat`.

1. Subir archivo en `/chat` (pdf o imagen <= 10MB).
2. Confirmar que frontend envia `content` + `attachment` con:
- `file_url`
- `file_name`
- `file_size`
- `file_mime` (opcional)
3. Confirmar persistencia en historial (`GET /api/appointments/:id/messages`).
4. Confirmar evento realtime con el mismo contrato (socket `chat:message`).
5. Verificar render en chat:
- Link de descarga visible.
- Nombre de archivo correcto.
6. Verificar fallback seguro:
- Si backend devuelve adjunto incompleto, frontend no rompe UI.
- Se reporta warning `mapMsgAttachmentContractValidation`.
7. Registrar evidencia:
- request/response (Network o logs)
- appointmentId usado
- commit validado

### Fecha
- `2026-05-13`

### Branch / Commit
- Branch: `dev`
- Commit: `c19ec70` (base de la ronda)

### Scope del cambio
- Verificacion funcional de rutas y redirecciones por rol despues de integrar smoke tests en CI.

### Gate tecnico
- `npm run typecheck`: `PASS`
- `npm run build`: `PASS`

### QA funcional ejecutado
1. Flujo: Smoke de rutas criticas
   - Resultado: `PASS`
   - Evidencia: `npm run qa:smoke:routes`
   - Notas: Rutas publicas/protegidas respondieron con redirects esperados en `http://localhost:3000`.
2. Flujo: Redirecciones por rol
   - Resultado: `PASS`
   - Evidencia: `npm run qa:smoke:roles`
   - Notas: Reglas student/patient/unauthenticated consistentes con middleware actual.

### Hallazgos
- Severidad: `N/A`
- Descripcion: Sin bloqueantes funcionales en smokes.
- Ticket Notion: `[P1] QA funcional del funnel completo con evidencia`

### Decision
- `MERGE`
- Motivo: Evidencia funcional en verde para rutas y role redirects.

---

## Evidencia E2E lista para completar - Adjuntos chat (backend real)

### Fecha
- `YYYY-MM-DD`

### Branch / Commit
- Branch: `dev`
- Commit:

### Scope del cambio
- Validacion E2E de contrato de adjuntos chat con backend real (historial + realtime).

### Casos
1. Envio de adjunto desde chat
- Resultado: `PASS | FAIL`
- Evidencia (Network/log):
- Payload enviado contiene: `content`, `attachment.file_url`, `attachment.file_name`, `attachment.file_size`, `attachment.file_mime`.

2. Persistencia en historial (`GET /api/appointments/:id/messages`)
- Resultado: `PASS | FAIL`
- Evidencia (response):
- Attachment recibido cumple contrato: `file_url` + `file_name`.

3. Realtime (`chat:message`)
- Resultado: `PASS | FAIL`
- Evidencia (socket/log):
- Attachment recibido cumple contrato: `file_url` + `file_name`.

4. Render frontend
- Resultado: `PASS | FAIL`
- Evidencia (UI):
- Link y nombre de adjunto visibles y descargables.

5. Fallback defensivo
- Resultado: `PASS | FAIL`
- Evidencia:
- Si llega adjunto invalido, UI no rompe y se reporta warning `mapMsgAttachmentContractValidation`.

### Decision
- `DONE | FOLLOW-UP`
- Notas:
