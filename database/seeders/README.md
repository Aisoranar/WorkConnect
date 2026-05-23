# Seeders WorkConnect

Contraseña por defecto de todas las cuentas demo: **`password`**

## Ejecutar

```bash
php artisan migrate:fresh --seed
```

## Roles

| Rol | Descripción | Seeder |
|-----|-------------|--------|
| `freelancer` | Estudiante o profesional que postula a proyectos | `FreelancerSeeder` |
| `client` | Empresa que publica proyectos | `ClientSeeder` |
| `admin` | Superadmin / soporte (acceso total) | `AdminSeeder` |

## Cuentas freelancer (postulan + hoja de vida)

| Email | Nombre |
|-------|--------|
| maria@workconnect.test | María Álvarez — UI/Frontend |
| alex@workconnect.test | Alex Romero — Fullstack + IA |
| sofia@workconnect.test | Sofía Mendoza — Video (estudiante) |
| carlos@workconnect.test | Carlos Vega — Dev junior |

## Cuentas client (publican proyectos)

| Email | Empresa |
|-------|---------|
| nimbus@workconnect.test | Nimbus Studio |
| flux@workconnect.test | Flux Labs |
| fintech@workconnect.test | Fintech Co. |
| brava@workconnect.test | Brava Co. |
| orbit@workconnect.test | Orbit Agency |

## Cuentas admin

| Email | Uso |
|-------|-----|
| admin@workconnect.test | Superadmin principal |
| soporte@workconnect.test | Soporte / moderación |

## Orden de ejecución

1. `SkillsSeeder` — habilidades globales  
2. `AdminSeeder`  
3. `FreelancerSeeder`  
4. `ClientSeeder` — incluye proyectos abiertos  
5. `DemoRelationsSeeder` — postulaciones, chat, reseñas, notificaciones  
