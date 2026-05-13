# ALDIENTE - Modelo Operativo de Archivos y Adjuntos

Fecha base: 2026-05-13

## Objetivo

Definir como se deben tratar los archivos en frontend/producto antes de expandir adjuntos en chat, documentos y citas.

## Principio base

El archivo binario es un recurso tecnico. El significado del archivo lo define el dominio que lo usa.

Flujo recomendado:

1. Subir binario a `/api/files/upload`.
2. Recibir `file_url` o `url`.
3. Crear el registro de dominio con metadata y permisos.

## Dominios

### File

Recurso tecnico subido a storage.

Responsabilidades:

- Guardar binario.
- Retornar URL o identificador.
- No decidir reglas de negocio por si solo.

Campos esperados:

- `file_url`
- `file_name`
- `file_size`
- `file_mime`

### Document

Archivo permanente o semi-permanente asociado al usuario.

Ejemplos:

- Certificado alumno regular.
- Receta.
- Solicitud.
- Documento administrativo.

Reglas:

- Vive en `/documentos`.
- Debe tener `title` y `category`.
- Puede tener `year` si aplica.
- No debe mezclarse con mensajes de chat.

### AppointmentAttachment

Archivo asociado a una cita.

Ejemplos:

- Imagen clinica.
- Consentimiento.
- Archivo de apoyo para una atencion.

Reglas:

- Debe pertenecer a un `appointmentId`.
- Debe heredar permisos de la cita.
- Puede tener reglas como `allow_student`.

### ChatAttachment

Archivo enviado dentro de una conversacion.

Ejemplos:

- Foto enviada por paciente.
- Documento enviado por estudiante durante coordinacion.

Reglas:

- Debe pertenecer a un `appointmentId`.
- Idealmente debe pertenecer tambien a un `messageId`.
- Debe mostrarse como mensaje de tipo archivo o adjunto de mensaje.
- No debe aparecer automaticamente en `/documentos`.

## Permisos

Ningun archivo deberia depender solo de conocer una URL publica.

Regla minima:

- Paciente puede ver archivos de sus citas y documentos propios.
- Estudiante puede ver archivos de citas donde participa.
- Admin puede auditar segun permisos internos.
- Archivos de chat siguen permisos de la cita/conversacion.

## Lifecycle

Casos a cubrir:

- Si `/api/files/upload` funciona pero el registro de dominio falla, el archivo queda huerfano.
- Backend debe tener estrategia de limpieza de huerfanos.
- Eliminacion de documento/adjunto debe eliminar o desreferenciar el archivo segun politica backend.

## Criterio para chat

Antes de implementar adjuntos en chat:

- Confirmar endpoint para crear mensaje con adjunto.
- Definir si el archivo se registra como `ChatAttachment` o como metadata dentro del mensaje.
- Validar que el mensaje incluya `type: file` o equivalente.
- Confirmar permisos por `appointmentId`.

## Definition of Done

- Documentos usa `/api/files/upload` + metadata de dominio.
- Citas usa `/api/files/upload` + metadata de adjunto.
- Chat no reutiliza `Document` para archivos conversacionales.
- Existe QA manual para subir PDF/imagen en documentos y adjuntos de cita.
- Existe tarea separada para chat attachments antes de implementarlos.
