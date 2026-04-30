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
