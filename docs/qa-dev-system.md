# ALDIENTE - Sistema QA + Desarrollo

Fecha base: 2026-05-13

## Objetivo

Integrar QA al flujo de desarrollo para detectar regresiones antes de merge.

## Regla de trabajo (Definition of Done)

Cada cambio que se quiera fusionar a `dev` debe cumplir:

1. Gate tecnico local en verde:
- `npm run typecheck`
- `npm run build`
- O el comando unico: `npm run qa:gate`
2. Smoke automatico de rutas criticas (con app levantada):
- `npm run qa:smoke:routes`
- Opcional base URL distinta: `QA_BASE_URL=http://localhost:3000 npm run qa:smoke:routes`
3. Smoke de redireccion por rol (middleware):
- `npm run qa:smoke:roles`
- Valida redirecciones esperadas entre `/login`, `/home` y `/dashboard`.
4. QA funcional minimo del flujo impactado.
5. Evidencia registrada en `docs/qa-evidence-log.md`.

## Flujos criticos minimos

Si el cambio toca autenticacion, navegacion o reservas, validar al menos:

1. Signup/Login paciente.
2. Signup/Login estudiante.
3. Explorar -> Reserva -> Confirmacion.
4. Acceso a chat segun estado de cita.
5. Documentos y reagendamiento (si el cambio afecta citas/perfil).
6. Funnel QA: revisar `/funnel-qa` y confirmar eventos esperados (`visit`, `signup_completed`, `service_viewed`, `booking_started`, `payment_started`, `payment_completed`).

## Politica de severidad

1. `Blocker`: rompe login, routing critico, reserva, chat o build. No merge.
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
7. Accion siguiente

## Helper Windows

Para ejecutar smokes locales con app auto-levantada en Windows:

`powershell -ExecutionPolicy Bypass -File scripts/qa-smoke-local.ps1`

Tambien disponible como script npm:

`npm run qa:smoke:local`

## Comando consolidado

Si la app ya esta levantada, puedes ejecutar ambos smokes con:

`npm run qa:smoke:all`

Para corrida local de pre-release en un solo paso:

`npm run qa:release:local`

## Guardrail anti-mock en produccion

Para auditar que el codigo productivo no reintroduzca datos ficticios en `src`:

`npm run qa:mock-guard`

El comando falla si encuentra marcadores como `mock`, `dummy`, `fake`, `sample`, `fixture`, `demo` o nombres de fixtures visuales dentro de codigo productivo. Los fixtures en `scripts` y `docs` siguen permitidos para QA.

## QA visual con Playwright

Para cambios visuales o de UX, ejecutar la app local con Docker/hot reload y luego:

`npm run qa:visual:snapshots`

El comando captura pantallas desktop/mobile de rutas criticas, valida que no haya overflow horizontal y reporta redirecciones inesperadas. Las evidencias se guardan localmente en `tmp/visual-qa` y no se versionan.

## Contrato de adjuntos (chat)

Para validar contrato de payload de adjuntos en chat antes de E2E backend:

`npm run qa:chat:attachment-contract`

Uso con fixture backend real:

`npm run qa:chat:attachment-contract -- path/to/messages.json`

El fixture debe ser un array JSON de mensajes con campo `attachment`.

Fixture versionado para pruebas tipo backend real:

`npm run qa:chat:attachment-contract:fixture`

## Contrato de eventos de funnel

Para validar estructura base de eventos de funnel:

`npm run qa:funnel:event-contract`

Chequea que cada evento tenga:
- `name` dentro del set permitido de funnel.
- `timestamp` no vacio.
- `payload` como objeto.
