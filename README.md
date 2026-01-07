# Aldiente Frontend

Frontend de Aldiente - Plataforma de citas dentales para estudiantes de odontología.

## Stack Tecnológico

- **React 19** + **TypeScript**
- **Ionic Framework** - UI móvil
- **Vite** - Build tool
- **Framer Motion** - Animaciones
- **Socket.io Client** - Chat en tiempo real

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## Variables de Entorno

Crea un archivo `.env.local` basado en `.env.example`:

```env
VITE_BACKEND_URL=http://localhost:3001
VITE_FILES_URL=http://localhost:3004
VITE_CHAT_URL=http://localhost:3005
```

## Despliegue en Vercel

### 1. Conectar Repositorio
1. Ve a [vercel.com](https://vercel.com)
2. Importa este repositorio desde GitHub

### 2. Configuración Automática
Vercel detectará automáticamente:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 3. Variables de Entorno
Configura en **Settings → Environment Variables**:

| Variable | Valor (Producción) |
|----------|-------------------|
| `VITE_BACKEND_URL` | `https://aldiente-backend.up.railway.app` |
| `VITE_FILES_URL` | `https://aldiente-filesvc.up.railway.app` |
| `VITE_CHAT_URL` | `https://aldiente-chatsvc.up.railway.app` |

### 4. Deploy
El proyecto se desplegará automáticamente en cada push a `main`.

## Estructura del Proyecto

```
src/
├── app/           # Rutas y configuración de la app
├── components/    # Componentes reutilizables
├── modules/       # Módulos por funcionalidad
├── pages/         # Páginas principales
├── services/      # Servicios y APIs
├── shared/        # Utilidades compartidas
└── config.ts      # Configuración de URLs
```

## Licencia

Propiedad de NIKTO.
