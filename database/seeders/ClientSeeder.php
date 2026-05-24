<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\WorkJob;
use Database\Seeders\Concerns\SeedsDemoAccounts;
use Illuminate\Database\Seeder;

/**
 * Clientes (empresas / PYMEs) y proyectos abiertos realistas para explorar y postular.
 */
class ClientSeeder extends Seeder
{
    use SeedsDemoAccounts;

    public function run(): void
    {
        $clients = [
            [
                'email' => 'nimbus@workconnect.test',
                'name' => 'Nimbus Studio',
                'username' => 'nimbus-studio',
                'city' => 'Lima, Perú',
                'bio' => 'Agencia boutique de producto digital. SaaS, fintech y landings de alto impacto.',
                'company' => 'Nimbus Studio',
                'jobs' => [
                    [
                        'title' => 'Diseñador UI para landing SaaS',
                        'budget' => '$450',
                        'location' => 'Lima, PE',
                        'remote' => true,
                        'category' => 'Diseño',
                        'description' => <<<'DESC'
Buscamos diseñador/a con Figma para una landing B2B estilo glassmorphism.

Entregables:
- Desktop + mobile (frame 1440 y 390).
- Componentes reutilizables (botón, input, card).
- Handoff con medidas y export SVG de iconos.

Duración estimada: 1–2 semanas. 2 rondas de revisión incluidas.
DESC,
                        'skills' => ['Figma', 'UI Design', 'Design systems'],
                    ],
                    [
                        'title' => 'Landing page para SaaS de finanzas',
                        'budget' => '$1,200',
                        'location' => 'Remoto',
                        'remote' => true,
                        'category' => 'Desarrollo',
                        'description' => <<<'DESC'
Landing de conversión para producto fintech en etapa seed.

Stack deseado: React, Tailwind, animaciones suaves (Framer Motion o CSS).
Secciones: hero, features, pricing, FAQ, CTA demo.

Publicamos diseño en Figma; necesitamos implementación pixel-perfect y responsive.
DESC,
                        'skills' => ['React', 'Tailwind CSS', 'Framer Motion', 'TypeScript'],
                    ],
                ],
            ],
            [
                'email' => 'flux@workconnect.test',
                'name' => 'Flux Labs',
                'username' => 'flux-labs',
                'city' => 'Remoto',
                'bio' => 'Startup de analytics B2B. Dashboards en tiempo real para equipos de ventas.',
                'company' => 'Flux Labs',
                'jobs' => [
                    [
                        'title' => 'Desarrollador React + Tailwind',
                        'budget' => '$1,200',
                        'location' => 'Remoto',
                        'remote' => true,
                        'category' => 'Desarrollo',
                        'description' => <<<'DESC'
Dashboard interactivo: gráficos, tablas filtrables y dark mode.

Requisitos:
- React 18+ y TypeScript.
- Tailwind para estilos; preferible experiencia con charts (Recharts o similar).
- Buenas prácticas de accesibilidad y estados de carga.

Plazo: 2–3 semanas. Sync semanal por videollamada.
DESC,
                        'skills' => ['React', 'Tailwind CSS', 'TypeScript'],
                    ],
                ],
            ],
            [
                'email' => 'fintech@workconnect.test',
                'name' => 'Fintech Co.',
                'username' => 'fintech-co',
                'city' => 'Ciudad de México, MX',
                'bio' => 'Fintech regional. APIs, cumplimiento y producto digital.',
                'company' => 'Fintech Co.',
                'jobs' => [
                    [
                        'title' => 'Backend Laravel + API REST',
                        'budget' => '$2,000',
                        'location' => 'CDMX, MX',
                        'remote' => false,
                        'category' => 'Desarrollo',
                        'description' => <<<'DESC'
API de e-commerce B2B: catálogo, carrito, órdenes y roles.

Stack: Laravel 11+, Sanctum, MySQL o PostgreSQL, documentación OpenAPI.
Tests básicos en endpoints críticos.

Modalidad híbrida: 1 día/semana en oficina CDMX opcional.
DESC,
                        'skills' => ['Laravel', 'MySQL', 'PostgreSQL', 'PHP'],
                    ],
                ],
            ],
            [
                'email' => 'brava@workconnect.test',
                'name' => 'Brava Co.',
                'username' => 'brava-co',
                'city' => 'Bogotá, CO',
                'bio' => 'Marca lifestyle. Contenido para Instagram y campañas locales.',
                'company' => 'Brava Co.',
                'jobs' => [
                    [
                        'title' => 'Editor de video para reels de marca',
                        'budget' => '$300',
                        'location' => 'Bogotá, CO',
                        'remote' => true,
                        'category' => 'Video',
                        'description' => '10 reels/mes estilo cinematográfico. Material bruto en Drive. Música libre de derechos.',
                        'skills' => ['Premiere', 'After Effects'],
                    ],
                ],
            ],
            [
                'email' => 'pyme@workconnect.test',
                'name' => 'Distribuidora La Canasta',
                'username' => 'la-canasta',
                'city' => 'Barranquilla, CO',
                'bio' => 'Distribución de víveres a barrios. Presupuesto acotado, proyectos claros para talento junior.',
                'company' => 'La Canasta',
                'jobs' => [
                    [
                        'title' => 'Catálogo digital y contacto por WhatsApp',
                        'budget' => '500.000 COP',
                        'location' => 'Barranquilla, CO',
                        'remote' => true,
                        'category' => 'Desarrollo',
                        'description' => <<<'DESC'
Página sencilla: lista de productos, precios referenciales y botón a WhatsApp.
Sin pasarela de pago. Hosting compartido o Vercel.

Ideal estudiante o junior con React o HTML/CSS.
DESC,
                        'skills' => ['React', 'Tailwind CSS', 'JavaScript'],
                    ],
                    [
                        'title' => 'Logo y piezas para redes (PYME barrio)',
                        'budget' => '350.000 COP',
                        'location' => 'Barranquilla, CO',
                        'remote' => true,
                        'category' => 'Diseño',
                        'description' => 'Logo, paleta de 3 colores y 3 plantillas Instagram (1080×1080). Archivos editables en Figma.',
                        'skills' => ['Figma', 'UI Design', 'Illustrator'],
                    ],
                ],
            ],
            [
                'email' => 'orbit@workconnect.test',
                'name' => 'Orbit Agency',
                'username' => 'orbit-agency',
                'city' => 'Remoto',
                'bio' => 'Agencia B2B: contenido, paid media y community para fintechs.',
                'company' => 'Orbit Agency',
                'jobs' => [
                    [
                        'title' => 'Community manager bilingüe',
                        'budget' => '$600/mes',
                        'location' => 'Remoto',
                        'remote' => true,
                        'category' => 'Marketing',
                        'description' => 'LinkedIn + X en inglés y español. 12 posts/mes, reporte de métricas y respuesta a comentarios.',
                        'skills' => ['Copywriting', 'Meta Ads', 'SEO'],
                    ],
                ],
            ],
        ];

        foreach ($clients as $data) {
            $jobs = $data['jobs'];
            $company = $data['company'];
            unset($data['jobs'], $data['company']);

            $user = User::query()->updateOrCreate(
                ['email' => $data['email']],
                [
                    ...$data,
                    'password' => $this->demoPassword(),
                    'role' => 'client',
                    'verified' => true,
                    'rating' => 4.6,
                ],
            );

            foreach ($jobs as $job) {
                WorkJob::query()->updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'title' => $job['title'],
                    ],
                    [
                        ...$job,
                        'company' => $company,
                        'status' => 'open',
                    ],
                );
            }
        }
    }
}
