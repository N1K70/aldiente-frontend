# ALDIENTE Web

Frontend productivo de ALDIENTE. Este proyecto reemplaza al frontend legacy `aldiente-frontend`.

## Estado del repositorio

- Aplicacion actual: `aldiente-web`
- Stack: Next.js, React, TypeScript, Tailwind CSS
- Deploy frontend: Vercel
- Servicios backend: Railway
- Base de datos: Supabase/PostgreSQL
- Frontend legacy: `aldiente-frontend` queda solo como referencia historica

## Desarrollo local

```bash
npm install
npm run dev
```

La aplicacion queda disponible en:

```text
http://localhost:3000
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm run qa:gate
```

## Variables de entorno

Crear `.env.local` a partir de `.env.example`.

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_CHAT_URL=http://localhost:3005
```

En Vercel, confirmar estas variables para produccion:

```env
NEXT_PUBLIC_BACKEND_URL=https://<backend-railway>
NEXT_PUBLIC_CHAT_URL=https://<chat-railway>
```

## Servicios externos

- Backend API: Railway
- Chat realtime: Railway + Socket.IO
- Archivos: Railway, consumido por backend/API
- Base de datos: Supabase/PostgreSQL
- Hosting frontend: Vercel

## Checklist antes de salir a mercado

- Confirmar que Vercel despliega desde `aldiente-web`.
- Validar que `NEXT_PUBLIC_BACKEND_URL` apunta al backend productivo.
- Validar que `NEXT_PUBLIC_CHAT_URL` apunta al servicio productivo de chat.
- Ejecutar build de produccion en CI o entorno compatible.
- Probar flujos criticos: signup, login, perfil, explorar, reservar, pago, confirmacion, chat, documentos y reagendar.
- Revisar que no aparezcan datos mock en produccion cuando falla la API.
- Confirmar copy comercial, FAQ, senales de confianza y eventos de conversion.

## Documentacion de salida a mercado

- [Readiness frontend](docs/launch-readiness.md)
- [Prompt agente investigador mercado](docs/market-research-prompt.md)
- [Sistema QA + Desarrollo](docs/qa-dev-system.md)
- [QA Evidence Log](docs/qa-evidence-log.md)
- [Entorno Dev con Docker](docs/docker-dev.md)
