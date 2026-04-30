# ALDIENTE - Sistema QA + Desarrollo

Fecha base: 2026-04-29

## Objetivo

Integrar QA al flujo de desarrollo para detectar regresiones antes de merge.

## Regla de trabajo (Definition of Done)

Cada cambio que se quiera fusionar a `dev` debe cumplir:

1. Gate técnico local en verde:
   - `npm run typecheck`
   - `npm run build`
   - O el comando único: `npm run qa:gate`
2. Smoke automático de rutas críticas (con app levantada):
   - `npm run qa:smoke:routes`
   - Opcional base URL distinta: `QA_BASE_URL=http://localhost:3000 npm run qa:smoke:routes`
3. Smoke de redirección por rol (middleware):
   - `npm run qa:smoke:roles`
   - Valida redirecciones esperadas entre `/login`, `/home` y `/dashboard`.
4. QA funcional mínimo del flujo impactado.
5. Evidencia registrada en `docs/qa-evidence-log.md`.

## Flujos críticos mínimos

Si el cambio toca autenticación, navegación o reservas, validar al menos:

1. Signup/Login paciente.
2. Signup/Login estudiante.
3. Explorar -> Reserva -> Confirmación.
4. Acceso a chat según estado de cita.
5. Documentos y reagendamiento (si el cambio afecta citas/perfil).

## Política de severidad

1. `Blocker`: rompe login, routing crítico, reserva, chat o build. No merge.
2. `Major`: flujo principal degradado con workaround limitado. Evaluar hotfix antes de merge.
3. `Minor`: detalle visual/copy sin impacto funcional. Puede mergear con ticket creado.

## Plantilla de evidencia

Usar `docs/qa-evidence-log.md` para registrar:

1. Fecha
2. Branch/commit
3. Flujo probado
4. Resultado
5. Evidencia (captura/video/log)
6. Severidad si aplica
7. Acción siguiente
