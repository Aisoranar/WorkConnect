<?php

namespace Database\Seeders;

use App\Models\ExternalJobListing;
use Illuminate\Database\Seeder;

/**
 * Ofertas externas para el módulo Carrera (scraping semanal simulado).
 */
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
                'apply_url' => 'https://www.linkedin.com/jobs/search/?keywords=frontend%20junior%20remoto',
                'skills' => ['React', 'JavaScript', 'Tailwind CSS', 'Git'],
                'summary' => 'Interfaces para SaaS B2B. Mentoría y código en inglés/español.',
            ],
            [
                'title' => 'Practicante Desarrollo Web',
                'company' => 'Agencia Digital Norte',
                'location' => 'Barranquilla · Híbrido',
                'apply_url' => 'https://www.computrabajo.com.co/trabajo-de-desarrollador-junior',
                'skills' => ['PHP', 'Laravel', 'HTML', 'MySQL'],
                'summary' => 'Landings y mantenimiento para PYMEs de la costa Caribe.',
            ],
            [
                'title' => 'Diseñador UI Junior',
                'company' => 'Studio Creativo',
                'location' => 'Remoto · Perú',
                'apply_url' => 'https://www.behance.net/joblist',
                'skills' => ['Figma', 'UI Design', 'Design systems'],
                'summary' => 'Pantallas mobile-first para startups en pre-seed.',
            ],
            [
                'title' => 'Analista QA Manual',
                'company' => 'Product Labs',
                'location' => 'Lima · Híbrido',
                'apply_url' => 'https://www.linkedin.com/jobs/search/?keywords=qa%20junior%20lima',
                'skills' => ['JavaScript', 'React', 'Git'],
                'summary' => 'Pruebas funcionales en apps web. Documentación de bugs en Notion.',
            ],
            [
                'title' => 'Community Manager Junior',
                'company' => 'Growth PYME',
                'location' => 'Remoto · LATAM',
                'apply_url' => 'https://www.google.com/search?q=community+manager+junior+remoto',
                'skills' => ['Copywriting', 'Meta Ads', 'SEO'],
                'summary' => 'Redes para ecommerce locales. Reportes semanales y calendario editorial.',
            ],
            [
                'title' => 'Editor de video redes sociales',
                'company' => 'Contenido Co.',
                'location' => 'Remoto',
                'apply_url' => 'https://www.linkedin.com/jobs/search/?keywords=editor%20video%20reels',
                'skills' => ['Premiere', 'After Effects'],
                'summary' => 'Reels verticales para marcas de consumo. 15–30 seg, subtítulos incluidos.',
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
