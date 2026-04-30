# ALDIENTE - Readiness Frontend

Fecha base: 2026-04-29

## Decision de repositorio

`aldiente-web` es el frontend productivo. `aldiente-frontend` queda como legacy y no debe guiar nuevas decisiones de salida a mercado salvo como referencia historica.

## P0 - Bloqueantes de salida a mercado

- [ ] Confirmar deploy Vercel desde `aldiente-web`.
- [ ] Configurar `NEXT_PUBLIC_BACKEND_URL` en Vercel.
- [ ] Configurar `NEXT_PUBLIC_CHAT_URL` en Vercel.
- [ ] Ejecutar `npm run build` en entorno compatible o CI.
- [ ] Probar signup y login.
- [ ] Probar perfil paciente y perfil estudiante.
- [ ] Probar explorar servicios/profesionales.
- [ ] Probar reserva.
- [ ] Probar pago y retorno Webpay.
- [ ] Probar confirmacion de cita.
- [ ] Probar chat por cita.
- [ ] Probar documentos.
- [ ] Probar reagendar.
- [ ] Revisar fallbacks mock en produccion.

## P1 - Confianza y conversion

- [ ] Revisar copy de landing/home.
- [ ] Agregar FAQ orientada a pacientes y estudiantes.
- [ ] Agregar senales de confianza: universidades, condiciones de atencion, soporte y seguridad de pagos.
- [ ] Definir eventos de funnel: visita, registro, servicio visto, reserva iniciada, pago iniciado y pago completado.
- [x] Instrumentar errores criticos: auth, pagos, chat, documentos.

## P2 - Operacion

- [x] Agregar CI minimo: install, build y typecheck/lint.
- [x] Definir checklist de release.
- [x] Definir monitoreo de errores frontend.
- [x] Documentar rollback de Vercel/Railway.

## Notas de validacion

No se debe subir documentacion ni cambios al frontend legacy para nuevas decisiones de producto. Cualquier tarea nueva de frontend debe referenciar `aldiente-web`.
