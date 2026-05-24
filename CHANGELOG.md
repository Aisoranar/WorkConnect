# Cambios realizados — 2026-05-24

## Bugs corregidos

| Archivo | Problema | Fix |
|---------|----------|-----|
| `FrontWorkConnect/src/routes/dashboard.publish.tsx` | `getStoredUser()` no importado, página crasheaba | Import agregado desde `@/lib/auth` |
| `app/Http/Controllers/Api/CareerController.php` | PDF se extraía con regex sobre binario crudo (fallaba 90%+) | Reemplazado por `smalot/pdfparser` |
| `app/Http/Controllers/Api/CareerController.php` | Imágenes de ofertas se descartaban sin analizar | OCR real con Gemini Vision API |
| `app/Services/CareerAssistantService.php` | `matchFreeCourses([])` siempre devolvía los mismos 4 cursos | Ahora usa skills del gap analysis del rol |
| `FrontWorkConnect/src/routes/dashboard.career.tsx` | `targetRoleResult` era `Record<string, unknown>` con castings inseguros | Tipo `CareerTargetRolePath` con campos tipados |
| `routes/api.php` | `/applications` y `/messages` legacy fuera de `auth:sanctum` | Movidos dentro del middleware auth |

## Features nuevos

| Feature | Archivos | Descripción |
|---------|----------|-------------|
| Scraper de empleos | `app/Console/Commands/ScrapeExternalJobs.php` | Comando `php artisan jobs:scrape` que obtiene ofertas de Remotive + Arbeitnow |
| OCR de imágenes | `app/Services/AIService.php` | `extractTextFromImage()` envía imagen a Gemini Vision para extraer texto |
| Cambio de contraseña | `app/Http/Controllers/Api/AuthController.php`, `routes/api.php` | Endpoint `POST /change-password` |
| Cambio de contraseña UI | `FrontWorkConnect/src/routes/dashboard.settings.tsx` | Formulario con show/hide y validación |
| Mensajería real | `FrontWorkConnect/src/routes/dashboard.messages.tsx` | Chat conectado al backend, envío real, polling 5s |
| Rate limiting IA | `routes/api.php` | 30 req/min en `/ai/*`, 20 req/min en `/career/*` |
| Flujo guiado carrera | `FrontWorkConnect/src/routes/dashboard.career.tsx` | Plan de estudio → "¿Estoy preparado?" → Simular entrevista |
| Target role mejorado | `FrontWorkConnect/src/routes/dashboard.career.tsx` | Muestra salary, skills, roadmap y cursos relevantes |
| API chat frontend | `FrontWorkConnect/src/lib/api.ts` | `changePassword()`, `fetchChatMessages()`, `sendChatMessage()`, tipo `CareerTargetRolePath` |

## Dependencia agregada

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `smalot/pdfparser` | ^2.12 | Extracción real de texto desde PDF |

## Comando post-deploy

```bash
composer install
php artisan migrate
php artisan jobs:scrape
```
