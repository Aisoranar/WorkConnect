<?php

namespace App\Console\Commands;

use App\Models\ExternalJobListing;
use App\Models\Skill;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ScrapeExternalJobs extends Command
{
    protected $signature = 'jobs:scrape {--limit=15 : Máximo de empleos a guardar}';

    protected $description = 'Obtiene ofertas laborales tech desde APIs públicas y las guarda en external_job_listings';

    public function handle(): int
    {
        $limit = (int) $this->option('limit');
        $weekKey = now()->format('o-\WW');

        $this->info("Buscando empleos para la semana {$weekKey}...");

        $jobs = [];

        $jobs = array_merge($jobs, $this->fetchRemotive());
        $jobs = array_merge($jobs, $this->fetchArbeitnow());

        if (empty($jobs)) {
            $jobs = $this->generateAiFallbackJobs();
        }

        $saved = 0;
        foreach (array_slice($jobs, 0, $limit) as $job) {
            $exists = ExternalJobListing::query()
                ->where('apply_url', $job['apply_url'])
                ->where('week_key', $weekKey)
                ->exists();

            if ($exists) {
                continue;
            }

            ExternalJobListing::query()->create(array_merge($job, [
                'week_key' => $weekKey,
            ]));
            $saved++;
        }

        $this->info("Guardados {$saved} empleos nuevos.");

        return self::SUCCESS;
    }

    private function fetchRemotive(): array
    {
        $this->line('  > Consultando Remotive API...');

        try {
            $response = Http::timeout(20)
                ->get('https://remotive.com/api/remote-jobs', [
                    'category' => 'software-dev',
                    'limit' => 20,
                ]);

            if (! $response->successful()) {
                $this->warn('    Remotive no respondió correctamente.');

                return [];
            }

            $listings = $response->json('jobs', []);
            $results = [];

            foreach ($listings as $item) {
                $rawTags = $item['tags'] ?? [];
            $tags = is_array($rawTags)
                ? array_filter(array_map('trim', $rawTags))
                : array_filter(array_map('trim', explode(',', (string) $rawTags)));

                $results[] = [
                    'title' => $item['title'] ?? 'Sin título',
                    'company' => $item['company_name'] ?? 'Empresa',
                    'location' => $item['candidate_required_location'] ?? 'Remoto',
                    'apply_url' => $item['url'] ?? '#',
                    'source' => 'remotive',
                    'skills' => array_slice($tags, 0, 8) ?: null,
                    'summary' => mb_substr(strip_tags($item['description'] ?? ''), 0, 300),
                    'posted_at' => isset($item['publication_date'])
                        ? date('Y-m-d H:i:s', strtotime($item['publication_date']))
                        : now(),
                ];
            }

            $this->info("    Remotive: " . count($results) . " empleos encontrados.");

            return $results;
        } catch (\Throwable $e) {
            $this->warn("    Remotive error: {$e->getMessage()}");
            Log::warning('jobs:scrape Remotive error', ['error' => $e->getMessage()]);

            return [];
        }
    }

    private function fetchArbeitnow(): array
    {
        $this->line('  > Consultando Arbeitnow API...');

        try {
            $response = Http::timeout(20)
                ->get('https://www.arbeitnow.com/api/job-board-api');

            if (! $response->successful()) {
                $this->warn('    Arbeitnow no respondió correctamente.');

                return [];
            }

            $listings = $response->json('data', []);
            $results = [];

            foreach (array_slice($listings, 0, 15) as $item) {
                $tags = is_array($item['tags'] ?? null) ? $item['tags'] : [];

                $results[] = [
                    'title' => $item['title'] ?? 'Sin título',
                    'company' => $item['company_name'] ?? 'Empresa',
                    'location' => $item['location'] ?? 'Remoto',
                    'apply_url' => $item['url'] ?? '#',
                    'source' => 'arbeitnow',
                    'skills' => array_slice($tags, 0, 8) ?: null,
                    'summary' => mb_substr(strip_tags($item['description'] ?? ''), 0, 300),
                    'posted_at' => isset($item['created_at'])
                        ? date('Y-m-d H:i:s', (int) $item['created_at'])
                        : now(),
                ];
            }

            $this->info("    Arbeitnow: " . count($results) . " empleos encontrados.");

            return $results;
        } catch (\Throwable $e) {
            $this->warn("    Arbeitnow error: {$e->getMessage()}");

            return [];
        }
    }

    private function generateAiFallbackJobs(): array
    {
        $this->line('  > APIs externas fallaron, generando desde skills del mercado local...');

        $topSkills = Skill::query()
            ->withCount('users')
            ->orderByDesc('users_count')
            ->limit(5)
            ->pluck('name')
            ->toArray();

        if (empty($topSkills)) {
            $topSkills = ['React', 'Laravel', 'PHP', 'JavaScript', 'Python'];
        }

        $jobs = [];
        $companies = ['TechCo Colombia', 'Digital LATAM', 'CodeFactory', 'DataSoft', 'CloudBridge'];
        $cities = ['Remoto', 'Bogotá', 'Medellín', 'Barranquilla', 'LATAM'];

        foreach ($topSkills as $i => $skill) {
            $jobs[] = [
                'title' => "Desarrollador {$skill} Junior/Mid",
                'company' => $companies[$i % count($companies)],
                'location' => $cities[$i % count($cities)],
                'apply_url' => 'https://www.linkedin.com/jobs/search/?keywords=' . urlencode($skill),
                'source' => 'generated',
                'skills' => [$skill],
                'summary' => "Buscamos talento con conocimiento en {$skill} para proyectos digitales. Experiencia mínima de 6 meses. Modalidad flexible.",
                'posted_at' => now(),
            ];
        }

        return $jobs;
    }
}
