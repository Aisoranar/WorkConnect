# WorkConnect

Plataforma de empleo juvenil que conecta freelancers con proyectos reales usando **reputación, habilidades y matching por IA**.

> MVP pensado para hackatón: pocas funciones, bien hechas, listas para demo y pitch.

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

### Frontend (`FrontWorkConnect/.env`)

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | Base del API, con `/api` al final (ej. `http://172.20.10.14:8000/api`) |
| `VITE_SITE_URL` | URL pública del front para SEO y redes (ej. `http://localhost:8080`) |

> Tras cambiar `.env` del front, reinicia `npm run dev`.

---

## Credenciales de demo

| Rol | Email | Contraseña |
|-----|-------|------------|
| Freelancer | `maria@workconnect.test` | `password` |
| Cliente | `cliente@workconnect.test` | `password` |

---

## Funcionalidades MVP

- Registro e inicio de sesión (Sanctum, token Bearer)
- Perfil profesional (skills, portfolio, bio)
- Publicar y explorar proyectos
- Postularse a trabajos
- Mensajes tipo inbox (sin WebSockets)
- Reseñas y reputación
- Notificaciones
- **IA:** matching de trabajos, análisis de perfil, recomendaciones
- Dashboard con exploración, postulaciones, mensajes y estadísticas

---

## API

Prefijo base: `/api`

### Público

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado del servidor |
| POST | `/register` | Registro |
| POST | `/login` | Login (devuelve `token`) |
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
