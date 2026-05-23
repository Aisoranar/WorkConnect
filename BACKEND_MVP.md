# WorkConnect — Backend MVP (Hackatón)

## Credenciales demo

| Rol | Email | Password |
|-----|-------|----------|
| Freelancer | maria@workconnect.test | password |
| Cliente | cliente@workconnect.test | password |

## Endpoints

Ver rutas: `php artisan route:list --path=api`

## IA

Sin `GEMINI_API_KEY` ni `OPENAI_API_KEY` → matching y análisis **locales** (MatchingService + ProfileScoreService).

## MySQL (producción / Laragon)

En `.env`:

```
DB_CONNECTION=mysql
DB_DATABASE=workconnect
```

Luego: `php artisan migrate:fresh --seed`
