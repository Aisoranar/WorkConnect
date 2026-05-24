<?php

namespace App\Services;

use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Support\Str;

class ProfileAdvisorService
{
    public function __construct(
        private readonly AIService $ai,
        private readonly ProfileScoreService $profileScore,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function recommendSkills(User $user): array
    {
        $user->loadMissing('skills');
        $profile = $this->profileScore->analyze($user);

        $demand = $this->aggregateMarketDemand();
        $totalJobs = max(1, WorkJob::query()->where('status', 'open')->count());
        $userSkillKeys = $user->skills->pluck('name')->map(fn ($s) => $this->normalizeSkill($s))->all();

        $gaps = [];
        foreach ($demand as $skillKey => $count) {
            if ($this->userHasSkill($userSkillKeys, $skillKey)) {
                continue;
            }
            $gaps[] = [
                'skill' => $skillKey,
                'display_name' => $this->displayName($skillKey),
                'open_jobs' => $count,
                'demand_percent' => (int) round(($count / $totalJobs) * 100),
            ];
        }

        usort($gaps, fn ($a, $b) => $b['open_jobs'] <=> $a['open_jobs']);
        $topGaps = array_slice($gaps, 0, 8);

        $topDemanded = array_slice(
            collect($demand)->sortDesc()->map(fn ($c, $k) => [
                'skill' => $this->displayName((string) $k),
                'count' => $c,
            ])->values()->all(),
            0,
            6,
        );

        $enriched = $this->enrichWithAi($user, $topGaps, $topDemanded, $profile);

        return [
            'profile_score' => $profile['score'],
            'profile_tips' => $profile['tips'],
            'your_skills' => $user->skills->pluck('name')->values()->all(),
            'market_summary' => $enriched['market_summary'] ?? $this->fallbackMarketSummary($demand, $totalJobs),
            'top_demanded' => $topDemanded,
            'recommendations' => $enriched['recommendations'] ?? $this->fallbackRecommendations($topGaps),
            'source' => $enriched['source'] ?? 'local',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function learnSkillIntro(User $user, string $skill): array
    {
        $user->loadMissing('skills');
        $skill = trim($skill);
        $display = $this->displayName($this->normalizeSkill($skill));

        $demand = $this->aggregateMarketDemand();
        $key = $this->normalizeSkill($skill);
        $jobsCount = $demand[$key] ?? 0;

        $ctx = $this->userContext($user);
        $prompt = <<<PROMPT
Eres mentor tech para talento joven en LATAM (WorkConnect). Explica conceptos básicos de la habilidad "{$display}".
Aparece en {$jobsCount} proyecto(s) abierto(s) en la plataforma.
Responde SOLO JSON válido en español, sin markdown:
{
  "skill": "{$display}",
  "overview": "2-3 oraciones qué es y para qué sirve en freelancing",
  "why_for_you": "2 oraciones personalizadas según su perfil",
  "basics": [
    {"concept": "nombre", "explanation": "1-2 oraciones simples"}
  ],
  "first_steps": ["3 pasos concretos para empezar hoy"],
  "practice_idea": "1 mini proyecto de práctica en 1 oración",
  "add_to_profile_tip": "1 frase: cómo añadirla al perfil y mejorar matching",
  "source": "nvidia"
}
Máximo 5 items en basics. Tono cercano, práctico.
{$ctx}
PROMPT;

        $raw = $this->ai->promptJson($prompt, $this->ai->fastModel(), 1100, fast: true);

        if (is_array($raw) && ! empty($raw['overview'])) {
            $raw['skill'] = $display;

            return $raw;
        }

        return $this->fallbackLearnIntro($display, $jobsCount);
    }

    /**
     * @return array<string, int>
     */
    private function aggregateMarketDemand(): array
    {
        $demand = [];

        WorkJob::query()
            ->where('status', 'open')
            ->get(['skills', 'description', 'category'])
            ->each(function (WorkJob $job) use (&$demand) {
                foreach ($job->skills ?? [] as $skill) {
                    $key = $this->normalizeSkill((string) $skill);
                    if ($key !== '') {
                        $demand[$key] = ($demand[$key] ?? 0) + 1;
                    }
                }

                $desc = Str::lower((string) $job->description);
                foreach (['react', 'tailwind', 'figma', 'typescript', 'laravel', 'php', 'vue', 'node', 'ui', 'ux'] as $kw) {
                    if (Str::contains($desc, $kw)) {
                        $demand[$kw] = ($demand[$kw] ?? 0) + 1;
                    }
                }
            });

        arsort($demand);

        return $demand;
    }

    /**
     * @param  array<int, string>  $userSkillKeys
     */
    private function userHasSkill(array $userSkillKeys, string $skillKey): bool
    {
        foreach ($userSkillKeys as $us) {
            if ($this->skillsMatch($us, $skillKey)) {
                return true;
            }
        }

        return false;
    }

    private function skillsMatch(string $a, string $b): bool
    {
        $a = $this->normalizeSkill($a);
        $b = $this->normalizeSkill($b);

        if ($a === $b || Str::contains($a, $b) || Str::contains($b, $a)) {
            return true;
        }

        $compact = fn (string $s) => preg_replace('/[\s.\-_]+/', '', $s) ?? $s;

        return $compact($a) === $compact($b);
    }

    private function normalizeSkill(string $skill): string
    {
        return Str::lower(trim(preg_replace('/\s+/', ' ', $skill) ?? $skill));
    }

    private function displayName(string $key): string
    {
        return match ($key) {
            'react' => 'React',
            'tailwind' => 'Tailwind CSS',
            'typescript' => 'TypeScript',
            'figma' => 'Figma',
            'laravel' => 'Laravel',
            'php' => 'PHP',
            'vue' => 'Vue.js',
            'node' => 'Node.js',
            default => Str::title($key),
        };
    }

    /**
     * @param  array<int, array<string, mixed>>  $gaps
     * @param  array<int, array<string, mixed>>  $topDemanded
     * @param  array<string, mixed>  $profile
     * @return array<string, mixed>
     */
    private function enrichWithAi(User $user, array $gaps, array $topDemanded, array $profile): array
    {
        if ($gaps === []) {
            return [
                'market_summary' => 'Ya cubres las habilidades más demandadas en proyectos abiertos. Refina tu portfolio y bio para destacar.',
                'recommendations' => [],
                'source' => 'local',
            ];
        }

        $gapsJson = json_encode(array_slice($gaps, 0, 6), JSON_UNESCAPED_UNICODE);
        $demandJson = json_encode($topDemanded, JSON_UNESCAPED_UNICODE);
        $ctx = $this->userContext($user);

        $prompt = <<<PROMPT
Mentor WorkConnect LATAM. Analiza demanda de skills en proyectos abiertos y recomienda qué aprender.
Perfil score: {$profile['score']}/100.
Demanda top: {$demandJson}
Habilidades que le faltan (con % demanda): {$gapsJson}
JSON español, sin markdown:
{
  "market_summary": "2 oraciones sobre qué buscan los clientes ahora",
  "recommendations": [
    {
      "skill": "nombre exacto para perfil",
      "display_name": "Nombre bonito",
      "demand_percent": 0,
      "open_jobs": 0,
      "why_learn": "1 oración: «Te recomendamos aprender X porque…»",
      "impact_on_match": "cómo sube su % de match al añadirla al perfil",
      "priority": "alta|media|baja"
    }
  ],
  "source": "nvidia"
}
Máximo 5 recommendations, ordenadas por impacto. Copia open_jobs y demand_percent de los datos si existen.
{$ctx}
PROMPT;

        $raw = $this->ai->promptJson($prompt, $this->ai->fastModel(), 1000, fast: true);

        if (! is_array($raw) || empty($raw['recommendations'])) {
            return ['source' => 'local'];
        }

        $raw['source'] = $raw['source'] ?? 'nvidia';

        return $raw;
    }

    /**
     * @param  array<int, array<string, mixed>>  $gaps
     * @return array<int, array<string, mixed>>
     */
    private function fallbackRecommendations(array $gaps): array
    {
        return array_map(function (array $gap) {
            $name = $gap['display_name'];
            $pct = $gap['demand_percent'];
            $jobs = $gap['open_jobs'];

            return [
                'skill' => $name,
                'display_name' => $name,
                'demand_percent' => $pct,
                'open_jobs' => $jobs,
                'why_learn' => "Aparece en {$jobs} proyecto(s) abierto(s) ({$pct}% de la demanda). Completar tu perfil con esta skill te acerca a esas oportunidades.",
                'impact_on_match' => 'Puede subir tu compatibilidad en ofertas que la requieren.',
                'priority' => $pct >= 50 ? 'alta' : ($pct >= 25 ? 'media' : 'baja'),
            ];
        }, array_slice($gaps, 0, 5));
    }

    /**
     * @param  array<string, int>  $demand
     */
    private function fallbackMarketSummary(array $demand, int $totalJobs): string
    {
        $top = array_key_first($demand);

        if ($top === null) {
            return 'Aún no hay suficientes proyectos abiertos para analizar demanda. Publica tu perfil y revisa pronto.';
        }

        $name = $this->displayName($top);
        $count = $demand[$top];

        return "En {$totalJobs} proyecto(s) abierto(s), «{$name}» es la habilidad más pedida ({$count} menciones). Añadir skills alineadas mejora tu % de match en el dashboard.";
    }

    /**
     * @return array<string, mixed>
     */
    private function fallbackLearnIntro(string $display, int $jobsCount): array
    {
        return [
            'skill' => $display,
            'overview' => "{$display} es una habilidad muy solicitada en proyectos freelance tech. Dominarla te permite postular con más confianza.",
            'why_for_you' => "Hay {$jobsCount} proyecto(s) en WorkConnect que la mencionan. Aprenderla cierra brechas con el mercado actual.",
            'basics' => [
                ['concept' => 'Fundamentos', 'explanation' => 'Empieza por la documentación oficial y un tutorial de 2–3 horas.'],
                ['concept' => 'Práctica', 'explanation' => 'Construye un componente o pantalla pequeña usando solo esa tecnología.'],
            ],
            'first_steps' => [
                'Lee la guía «getting started» oficial (30 min).',
                'Sigue un tutorial corto en video o documentación.',
                'Añade la skill a tu perfil cuando completes un mini ejercicio.',
            ],
            'practice_idea' => "Clona una sección simple de un dashboard usando {$display}.",
            'add_to_profile_tip' => 'Cuando la domines al nivel básico, agrégala en Skills de tu perfil para recalcular tu matching.',
            'source' => 'local',
        ];
    }

    private function userContext(User $user): string
    {
        $user->loadMissing('skills');
        $skills = $user->skills->pluck('name')->join(', ') ?: 'ninguna';
        $bio = Str::limit((string) ($user->bio ?? ''), 200);

        return <<<CTX
Usuario: {$user->name}
Bio: {$bio}
Skills actuales: {$skills}
Ciudad: {$user->city}
CTX;
    }
}
