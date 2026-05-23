# WorkConnect

Marketplace de **micro-proyectos** que une dos mundos: **jóvenes que necesitan experiencia** y **empresas que necesitan soluciones a bajo costo** pero no saben plantearlas como requerimientos técnicos.

La IA convierte la necesidad del empresario (en sus palabras) en un brief claro; el talento joven postula, entrega y construye reputación para el mercado laboral.

> MVP para hackatón / piloto. Visión y problemática detallada en [VISION.md](./VISION.md).

---

## Stack

| Capa | Tecnología |
|------|------------|
| Backend | Laravel 13 · API REST · Sanctum |
| Frontend | React 19 · TanStack Start/Router · Query · Tailwind CSS 4 |
| Base de datos | MySQL (recomendado) o SQLite |
| IA (opcional) | Gemini u OpenAI; sin API key usa matching local |

---

## Estructura del repositorio

```
WorkConnect/
├── app/                    # Backend Laravel (modelos, API, servicios)
├── database/               # Migraciones y seeders
├── routes/api.php          # Rutas REST
├── FrontWorkConnect/       # Frontend React (Vite, puerto 8080)
└── README.md
```

---

## Requisitos

- PHP 8.3+
- Composer 2
- Node.js 20+ y npm
- MySQL 8+ (Laragon) o SQLite para pruebas rápidas

---

## Inicio rápido

### 1. Backend

```bash
cd WorkConnect
composer install
cp .env.example .env   # si no tienes .env
php artisan key:generate
```

Configura la base de datos en `.env` (ejemplo MySQL en Laragon):

```env
APP_URL=http://172.20.10.14:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=workconnect
DB_USERNAME=root
DB_PASSWORD=
```

```bash
php artisan migrate:fresh --seed
php artisan storage:link
php artisan serve --host=172.20.10.14 --port=8000
```

Comprueba: [http://172.20.10.14:8000/api/health](http://172.20.10.14:8000/api/health)

### 2. Frontend

```bash
cd FrontWorkConnect
npm install
cp .env.example .env   # si no tienes .env
npm run dev
```

Abre: [http://localhost:8080](http://localhost:8080)

---

## Variables de entorno

### Backend (`.env` en la raíz)

| Variable | Descripción |
|----------|-------------|
| `APP_URL` | URL pública del API (ej. `http://172.20.10.14:8000`) |
| `FRONTEND_URL` | Orígenes del front para CORS (ej. `http://localhost:8080`) |
| `DB_*` | Conexión MySQL |
| `GEMINI_API_KEY` | Opcional — enriquece textos de IA |
| `OPENAI_API_KEY` | Opcional — alternativa a Gemini |
| `MAIL_*` | SMTP (Gmail) — bienvenida al registrarse y reset de contraseña |
| `FRONTEND_URL` | Primera URL usada en enlaces de correo (ej. `http://localhost:8080`) |

### Frontend (`FrontWorkConnect/.env`)

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | Base del API, con `/api` al final (ej. `http://172.20.10.14:8000/api`) |
| `VITE_SITE_URL` | URL pública del front para SEO y redes (ej. `http://localhost:8080`) |

> Tras cambiar `.env` del front, reinicia `npm run dev`.

---

## Credenciales de demo

Contraseña de **todas** las cuentas: `password`

### Freelancers (postulan a proyectos)

| Email | Perfil |
|-------|--------|
| `maria@workconnect.test` | Diseñadora UI / Frontend |
| `alex@workconnect.test` | Fullstack + IA |
| `sofia@workconnect.test` | Estudiante · Video |
| `carlos@workconnect.test` | Dev junior |

### Empresas (publican proyectos)

| Email | Empresa |
|-------|---------|
| `nimbus@workconnect.test` | Nimbus Studio |
| `flux@workconnect.test` | Flux Labs |
| `fintech@workconnect.test` | Fintech Co. |
| `brava@workconnect.test` | Brava Co. |
| `orbit@workconnect.test` | Orbit Agency |

### Superadmin

| Email | Rol |
|-------|-----|
| `admin@workconnect.test` | Administrador total |
| `soporte@workconnect.test` | Soporte |

Detalle de seeders: [`database/seeders/README.md`](database/seeders/README.md)

---

## Funcionalidades MVP

- Registro por rol: **freelancer** (talento joven) o **client** (empresa)
- **Publicar proyecto con IA** (`/dashboard/publish`): necesidad en lenguaje natural → requerimiento estructurado → `POST /api/jobs`
- Explorar proyectos, matching y postulación con propuesta asistida por IA
- Perfil, skills, mensajes, reseñas y reputación
- Dashboard con menú distinto según rol (explorar vs. publicar)

Flujo de producto: [VISION.md](./VISION.md)

---

## API

Prefijo base: `/api`

### Público

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado del servidor |
| POST | `/register` | Registro |
| POST | `/login` | Login (devuelve `token`) |
| POST | `/forgot-password` | Envía enlace de recuperación al correo |
| POST | `/reset-password` | Restablece contraseña (`token`, `email`, `password`) |
| GET | `/jobs` | Listado de trabajos |
| GET | `/skills` | Habilidades |
| GET | `/users`, `/users/{id}` | Perfiles |

### Con autenticación (`Authorization: Bearer {token}`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/me` | Usuario actual |
| POST | `/logout` | Cerrar sesión |
| POST | `/jobs` | Publicar proyecto |
| POST | `/jobs/{id}/apply` | Postularse |
| GET | `/my-applications` | Mis postulaciones |
| POST | `/messages` | Enviar mensaje |
| POST | `/ai/structure-project` | Necesidad cruda → requerimiento (solo `client` / `admin`) |
| POST | `/ai/improve-proposal` | Mejora carta de postulación |
| POST | `/ai/match-job` | Matching IA con un trabajo |
| POST | `/ai/analyze-profile` | Análisis de perfil |
| POST | `/ai/recommend-jobs` | Trabajos recomendados |

Listado completo:

```bash
php artisan route:list --path=api
```

---

## Servicios del backend

| Servicio | Rol |
|----------|-----|
| `MatchingService` | Score de compatibilidad por skills, rating, ciudad |
| `ProfileScoreService` | Puntuación y tips del perfil |
| `AIService` | Capa IA (API externa o fallback local) |
| `ProjectBriefService` | Estructura brief de empresa → proyecto publicable |
| `NotificationService` | Avisos in-app |

---

## Comandos útiles

```bash
# Backend
php artisan migrate:fresh --seed   # Reset BD + datos demo
php artisan route:list --path=api
php artisan test

# Frontend
cd FrontWorkConnect
npm run dev
npm run build
npm run lint
```

---

## Despliegue (referencia)

| Componente | Sugerencia |
|------------|------------|
| Backend | Hostinger / VPS — apuntar document root o proxy a `public/` |
| Frontend | Build estático o Node — `npm run build` en `FrontWorkConnect/` |
| BD | MySQL en producción |

En producción actualiza:

- `APP_URL` y `VITE_API_URL` con dominios reales
- `VITE_SITE_URL` con la URL del front (WhatsApp, Facebook y X usan `og:image` desde ahí)

---

## Pitch (una línea)

*Infraestructura digital para el empleo juvenil basada en reputación y habilidades reales — no solo “otra app de freelancers”.*

---

## Licencia

Proyecto académico / hackatón. El framework Laravel se distribuye bajo [MIT](https://opensource.org/licenses/MIT).
