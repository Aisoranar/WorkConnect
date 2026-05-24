<?php

namespace Database\Seeders;

use App\Models\ExternalJobListing;
use Illuminate\Database\Seeder;

class ExternalJobListingSeeder extends Seeder
{
    public function run(): void
    {
        $week = now()->format('o-\WW');

        $listings = [
            [
                'title' => 'Desarrollador Frontend Junior',
                'company' => 'TechStart LATAM',
                'location' => 'Remoto · Colombia',
                'apply_url' => 'https://www.linkedin.com/jobs/search/?keywords=frontend%20junior',
                'skills' => ['React', 'JavaScript', 'CSS', 'Git'],
                'summary' => 'Construye interfaces para producto SaaS B2B. Equipo remoto, mentoría incluida.',
            ],
            [
                'title' => 'Practicante Desarrollo Web',
                'company' => 'Agencia Digital Norte',
                'location' => 'Barranquilla · Híbrido',
                'apply_url' => 'https://www.computrabajo.com.co/trabajo-de-desarrollador-junior',
                'skills' => ['PHP', 'Laravel', 'HTML', 'MySQL'],
                'summary' => 'Apoyo en landing pages y mantenimiento WordPress para clientes PYME.',
            ],
            [
                'title' => 'Diseñador UI Junior',
                'company' => 'Studio Creativo',
                'location' => 'Remoto',
                'apply_url' => 'https://www.behance.net/joblist',
                'skills' => ['Figma', 'UI', 'Design systems'],
                'summary' => 'Diseño de pantallas mobile-first para startups en etapa temprana.',
            ],
            [
                'title' => 'Soporte N1 / Monitoreo Linux',
                'company' => 'InfraCloud',
                'location' => 'Medellín',
                'apply_url' => 'https://www.linkedin.com/jobs/search/?keywords=linux%20junior',
                'skills' => ['Linux', 'monitoreo', 'tickets', 'bash'],
                'summary' => 'Gestión de alertas, documentación de incidentes y escalamiento L2.',
            ],
            [
                'title' => 'Marketing Digital Junior',
                'company' => 'Growth PYME',
                'location' => 'Remoto · LATAM',
                'apply_url' => 'https://www.google.com/search?q=empleo+marketing+digital+junior',
                'skills' => ['SEO', 'redes sociales', 'copy', 'métricas'],
                'summary' => 'Campañas para ecommerce locales. Reportes semanales y A/B tests básicos.',
            ],
        ];

        foreach ($listings as $i => $row) {
            ExternalJobListing::query()->updateOrCreate(
                [
                    'title' => $row['title'],
                    'company' => $row['company'],
                    'week_key' => $week,
                ],
                [
                    ...$row,
                    'source' => 'weekly_scrape',
                    'week_key' => $week,
                    'posted_at' => now()->subDays($i),
                ],
            );
        }
    }
}
