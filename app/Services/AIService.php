<?php

namespace App\Services;

use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Support\Facades\Http;

class AIService
{
    /** Fallback si no hay variables en .env */
    public const MODEL_POWERFUL = 'meta/llama-3.3-70b-instruct';

    public const MODEL_FAST = 'meta/llama-3.1-8b-instruct';

    public function __construct(
        private readonly MatchingService $matchingService,
        private readonly ProfileScoreService $profileScoreService,
    ) {}

    // ─── Funciones públicas ───────────────────────────────────────────────────────

    public function matchJob(User $user, WorkJob $job): array
    {
        $localScore = $this->matchingService->scoreJobForUser($user, $job);
        $completion = $this->complete($this->buildMatchPrompt($user, $job), fast: true);

        if ($completion) {
            return [
                'job_id'        => $job->id,
                'compatibility' => $localScore,
                'analysis'      => $completion['text'],
                'source'        => $completion['source'],
            ];
        }

        return [
            'job_id'        => $job->id,
            'compatibility' => $localScore,
            'analysis'      => $this->fallbackMatchAnalysis($user, $job, $localScore),
            'source'        => 'local',
        ];
    }

    public function analyzeProfile(User $user): array
    {
        $profile    = $this->profileScoreService->analyze($user);
        $completion = $this->complete($this->buildProfilePrompt($user, $profile['score']));

        return array_merge($profile, [
            'ai_summary' => $completion['text'] ?? $this->fallbackProfileSummary($user, $profile['score']),
            'source'     => $completion['source'] ?? 'local',
        ]);
    }

    public function improveProposal(User $user, WorkJob $job, string $message): string
    {
        $completion = $this->complete($this->buildProposalPrompt($user, $job, $message));

        return $completion['text'] ?? $this->fallbackProposal($user, $job, $message);
    }

    /**
     * Estructura la solicitud cruda del cliente en un proyecto publicable.
     * Retorna null cuando NVIDIA no está disponible → ProjectBriefService usa fallback local.
     *
     * @return array<string, mixed>|null
     */
    public function structureProjectBrief(
        string $rawNeed,
        string $currency,
        float $budgetAmount,
        ?string $businessContext = null,
    ): ?array {
        $currency    = strtoupper($currency);
        $budgetLabel = $currency === 'COP'
            ? number_format($budgetAmount, 0, ',', '.').' COP'
            : '$'.number_format($budgetAmount, 2, '.', ',').' USD';

        $parsed = $this->completeJson(
            $this->buildBriefPrompt($rawNeed, $currency, $budgetLabel, $businessContext),
            maxTokens: 2048,
        );

        if (! $parsed) {
            return null;
        }

        $raw    = $parsed['parsed'];
        $source = $parsed['source'];

        return [
            'title'                    => (string) ($raw['title'] ?? 'Proyecto para empresa'),
            'description'              => (string) ($raw['description'] ?? $rawNeed),
            'category'                 => (string) ($raw['category'] ?? 'General'),
            'skills'                   => array_values($raw['skills'] ?? []),
            'deliverables'             => array_values($raw['deliverables'] ?? []),
            'recommended_technologies' => array_values($raw['recommended_technologies'] ?? []),
            'solution_type'            => (string) ($raw['solution_type'] ?? 'Solución digital'),
            'estimated_time'           => (string) ($raw['estimated_time'] ?? '2-4 semanas'),
            'difficulty_level'         => (string) ($raw['difficulty_level'] ?? 'Intermedio'),
            'budget'                   => $budgetLabel,
            'remote'                   => (bool) ($raw['remote'] ?? true),
            'summary'                  => (string) ($raw['summary'] ?? 'Proyecto estructurado por IA.'),
            'source'                   => $source,
        ];
    }

    public function recommendJobs(User $user, int $limit = 6): array
    {
        return $this->matchingService
            ->recommendJobsForUser($user, $limit)
            ->map(fn (array $item) => [
                'job_id'        => $item['job']->id,
                'title'         => $item['job']->title,
                'compatibility' => $item['match'],
            ])
            ->all();
    }

    // ─── Prompts ─────────────────────────────────────────────────────────────────

    private function buildBriefPrompt(
        string $rawNeed,
        string $currency,
        string $budgetLabel,
        ?string $businessContext,
    ): string {
        $context = $businessContext ?: 'No especificado';

        return <<<PROMPT
Eres un consultor senior de proyectos digitales en WorkConnect, plataforma que conecta empresas latinoamericanas con talento freelance. Tu misión es redactar un requerimiento de proyecto claro y atractivo que genere postulaciones de calidad.

Responde EXCLUSIVAMENTE con un objeto JSON válido. Sin markdown, sin texto adicional, sin comentarios.

ESTRUCTURA DEL JSON (usa exactamente estas keys):
{
  "title": "Título específico y accionable, máx 65 caracteres. Ej: Tienda online con pagos PSE para tienda de ropa",
  "description": "4-5 oraciones en PRIMERA PERSONA, como si el dueño del negocio hablara directamente a los freelancers. Estructura: (1) Me dedico a [negocio] y necesito [qué resolver], (2) Busco que construyan [solución concreta], (3) Lo que espero lograr con esto es [impacto real para mi negocio], (4) Busco talento que [perfil ideal]. Tono directo, cercano y confiante. Usar 'yo', 'mi negocio', 'necesito', 'busco'.",
  "category": "Diseño | Desarrollo | Video | Marketing | General",
  "skills": ["5 a 8 habilidades técnicas específicas y buscables"],
  "deliverables": ["4 a 6 entregables concretos y verificables con criterio de aceptación implícito"],
  "recommended_technologies": ["3 a 6 tecnologías del stack óptimo para el presupuesto y tiempo disponible"],
  "solution_type": "Nombre comercial del tipo de solución. Ej: Tienda virtual, Landing page, Sistema de gestión",
  "estimated_time": "Rango realista según presupuesto. Ej: 2-3 semanas",
  "difficulty_level": "Básico | Intermedio | Avanzado",
  "remote": true,
  "summary": "Una frase en primera persona que resuma el proyecto. Ej: Quiero vender en línea y necesito a alguien que lo haga realidad."
}

DATOS DEL PROYECTO:
- Moneda de pago: {$currency}
- Presupuesto disponible: {$budgetLabel}
- Contexto del negocio: {$context}

CRITERIOS DE STACK SEGÚN ALCANCE:
- Sitio informativo o catálogo sencillo → WordPress + Elementor + CSS
- Tienda con pagos online → WooCommerce o Laravel + MySQL + Wompi/PSE (COP) o Stripe (USD)
- Sistema con lógica de negocio → Laravel + PHP + MySQL + REST API
- Frontend moderno o panel de control → React + TypeScript + Tailwind CSS
- App móvil → React Native o Flutter
- Prioriza tecnologías que un talento junior pueda entregar dentro del tiempo y presupuesto estimados.

NECESIDAD DEL NEGOCIO:
{$rawNeed}
PROMPT;
    }

    private function buildMatchPrompt(User $user, WorkJob $job): string
    {
        $user->loadMissing('skills');
        $skills      = $user->skills->pluck('name')->implode(', ') ?: 'Sin habilidades registradas';
        $description = \Illuminate\Support\Str::limit($job->description ?? '', 300);

        return <<<PROMPT
Eres un reclutador tech de WorkConnect. Evalúa si este freelancer es compatible con el proyecto en 2 oraciones en español.

FREELANCER:
- Habilidades: {$skills}

PROYECTO:
- Título: {$job->title}
- Descripción: {$description}

FORMATO OBLIGATORIO (exactamente 2 oraciones):
1. Veredicto claro (compatible / parcialmente compatible / no compatible) con la razón técnica principal.
2. Acción concreta para el freelancer: postularse ahora, fortalecer un skill específico, o buscar otro proyecto.

Sin encabezados, sin listas, sin markdown, sin introducciones.
PROMPT;
    }

    private function buildProfilePrompt(User $user, int $score): string
    {
        $user->loadMissing('skills');
        $skills = $user->skills->pluck('name')->implode(', ') ?: 'Sin habilidades registradas';

        return <<<PROMPT
Eres un headhunter digital especializado en talento tech latinoamericano. Redacta el resumen profesional del perfil público de este freelancer en WorkConnect.

REGLAS:
- Exactamente 2 oraciones
- Oracion 1: Propuesta de valor concreta (qué hace + en qué se especializa)
- Oracion 2: Por qué las empresas deberían contratarlo (resultado que genera, no solo sus tecnologías)
- Tono: Confiado, directo, orientado al cliente empresarial
- Idioma: Español
- Sin saludos, sin asteriscos, sin introducciones

DATOS DEL FREELANCER:
- Nombre: {$user->name}
- Habilidades: {$skills}
- Puntuación de perfil: {$score}/100

Devuelve SOLO las 2 oraciones, sin ningún texto adicional.
PROMPT;
    }

    private function buildProposalPrompt(User $user, WorkJob $job, string $message): string
    {
        $user->loadMissing('skills');
        $skills  = $user->skills->pluck('name')->implode(', ') ?: 'desarrollo web';
        $company = $job->company ?? 'el cliente';

        return <<<PROMPT
Eres un coach de ventas para freelancers en WorkConnect. Reescribe esta propuesta para que sea más convincente y aumente las probabilidades de ser seleccionado.

REGLAS ESTRICTAS:
- Exactamente 3 oraciones
- Oracion 1: Demuestra que entiendes el problema del cliente (sin parafrasear textualmente su anuncio)
- Oracion 2: Explica cómo lo vas a resolver usando tus habilidades más relevantes para este proyecto
- Oracion 3: Genera confianza con un diferenciador real o un llamado a la acción concreto
- Tono: Profesional, seguro y cercano (de persona a persona, no corporativo)
- Sin saludos genéricos, sin "espero poder ayudarte", sin firmas
- Idioma: Español

CONTEXTO:
- Proyecto: {$job->title}
- Empresa: {$company}
- Mis habilidades: {$skills}

PROPUESTA ORIGINAL:
{$message}

Devuelve ÚNICAMENTE las 3 oraciones mejoradas, sin etiquetas ni explicaciones adicionales.
PROMPT;
    }

    // ─── Modelos desde .env ───────────────────────────────────────────────────────

    public function powerfulModel(): string
    {
        return (string) config('services.nvidia.model', self::MODEL_POWERFUL);
    }

    public function fastModel(): string
    {
        return (string) config('services.nvidia.fast_model', self::MODEL_FAST);
    }

    // ─── Cadena IA: nvidia → gemini → openai → (null = local en el caller) ─────

    /**
     * @return array{text: string, source: string}|null
     */
    private function complete(string $prompt, ?string $model = null, int $maxTokens = 512, bool $fast = false): ?array
    {
        $model = $model ?? ($fast ? $this->fastModel() : $this->powerfulModel());

        if ($text = $this->askNvidia($prompt, $model, $maxTokens)) {
            return ['text' => $text, 'source' => 'nvidia'];
        }

        if ($text = $this->askGemini($prompt, $maxTokens)) {
            return ['text' => $text, 'source' => 'gemini'];
        }

        if ($text = $this->askOpenAi($prompt, $maxTokens)) {
            return ['text' => $text, 'source' => 'openai'];
        }

        return null;
    }

    /**
     * @return array{parsed: array<string, mixed>, source: string}|null
     */
    private function completeJson(string $prompt, ?string $model = null, int $maxTokens = 2048, bool $fast = false): ?array
    {
        $completion = $this->complete($prompt, $model, $maxTokens, $fast);

        if (! $completion) {
            return null;
        }

        $parsed = $this->parseJsonFromText($completion['text']);

        if (! $parsed) {
            return null;
        }

        return ['parsed' => $parsed, 'source' => $completion['source']];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function parseJsonFromText(string $text): ?array
    {
        if (preg_match('/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i', $text, $m)) {
            $text = $m[1];
        } elseif (preg_match('/\{[\s\S]*\}/s', $text, $m)) {
            $text = $m[0];
        }

        $decoded = json_decode(trim($text), true);

        return is_array($decoded) ? $decoded : null;
    }

    private function askNvidia(string $prompt, string $model, int $maxTokens = 512): ?string
    {
        if (! config('services.nvidia.key')) {
            return null;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.config('services.nvidia.key'),
                'Accept'        => 'application/json',
            ])->timeout(45)->post(rtrim((string) config('services.nvidia.url'), '/').'/chat/completions', [
                'model'       => $model,
                'messages'    => [['role' => 'user', 'content' => $prompt]],
                'max_tokens'  => $maxTokens,
                'temperature' => 0.65,
                'top_p'       => 0.9,
                'stream'      => false,
            ]);

            if ($response->successful()) {
                $text = trim((string) $response->json('choices.0.message.content'));

                return $text !== '' ? $text : null;
            }
        } catch (\Throwable) {
            // siguiente proveedor en la cadena
        }

        return null;
    }

    private function askGemini(string $prompt, int $maxTokens = 2048): ?string
    {
        $key = config('services.gemini.key');
        if (! $key) {
            return null;
        }

        $model = (string) config('services.gemini.model', 'gemini-2.0-flash');
        $url   = rtrim((string) config('services.gemini.url'), '/').'/models/'.$model.':generateContent';

        try {
            $response = Http::withHeaders(['Content-Type' => 'application/json'])
                ->timeout(45)
                ->post($url.'?key='.$key, [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]],
                    ],
                    'generationConfig' => [
                        'maxOutputTokens' => $maxTokens,
                        'temperature'     => 0.65,
                    ],
                ]);

            if ($response->successful()) {
                $text = trim((string) $response->json('candidates.0.content.parts.0.text'));

                return $text !== '' ? $text : null;
            }
        } catch (\Throwable) {
            // siguiente proveedor
        }

        return null;
    }

    private function askOpenAi(string $prompt, int $maxTokens = 2048): ?string
    {
        if (! config('services.openai.key')) {
            return null;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.config('services.openai.key'),
                'Accept'        => 'application/json',
            ])->timeout(45)->post(rtrim((string) config('services.openai.url'), '/').'/chat/completions', [
                'model'       => (string) config('services.openai.model', 'gpt-4o-mini'),
                'messages'    => [['role' => 'user', 'content' => $prompt]],
                'max_tokens'  => $maxTokens,
                'temperature' => 0.65,
            ]);

            if ($response->successful()) {
                $text = trim((string) $response->json('choices.0.message.content'));

                return $text !== '' ? $text : null;
            }
        } catch (\Throwable) {
            // fallback local en el caller
        }

        return null;
    }

    // ─── Bio e IA de GitHub ───────────────────────────────────────────────────────

    public function improveBio(User $user, string $bio): string
    {
        $user->loadMissing('skills');
        $skills = $user->skills->pluck('name')->implode(', ') ?: 'desarrollo digital';

        $completion = $this->complete($this->buildImproveBioPrompt($user->name, $skills, $bio));

        return $completion['text'] ?? $bio;
    }

    /**
     * @param  array<int, array{name: string, language?: string|null, topics?: array<string>, description?: string|null}>  $repos
     * @return array{bio: string, skills: array<string>, summary: string, source: string}
     */
    public function generateProfileFromGithub(array $repos, ?string $currentBio = null): array
    {
        $parsed = $this->completeJson($this->buildGithubProfilePrompt($repos, $currentBio), maxTokens: 1500);

        if (! $parsed) {
            return $this->fallbackGithubProfile($repos);
        }

        $raw = $parsed['parsed'];

        return [
            'bio'     => (string) ($raw['bio'] ?? ''),
            'skills'  => array_values(array_filter((array) ($raw['skills'] ?? []))),
            'summary' => (string) ($raw['summary'] ?? ''),
            'source'  => $parsed['source'],
        ];
    }

    private function buildImproveBioPrompt(string $name, string $skills, string $bio): string
    {
        return <<<PROMPT
Eres un coach de carrera especializado en freelancers latinoamericanos. Reescribe esta bio de perfil para que sea más profesional, atractiva y orientada a conseguir proyectos en WorkConnect.

REGLAS ESTRICTAS:
- 2 a 3 oraciones
- Oracion 1: Quién soy y en qué me especializo (tecnologías principales)
- Oracion 2: Qué tipo de proyectos o problemas resuelvo
- Oracion 3 (opcional): Qué me diferencia o por qué contratarme
- Primera persona, tono profesional pero cercano
- Sin clichés: "apasionado por", "comprometido con", "orientado a resultados"
- Idioma: Español

DATOS:
- Nombre: {$name}
- Habilidades: {$skills}

BIO ACTUAL:
{$bio}

Devuelve SOLO la bio mejorada, sin etiquetas ni explicaciones.
PROMPT;
    }

    /**
     * @param  array<int, array{name: string, language?: string|null, topics?: array<string>, description?: string|null}>  $repos
     */
    private function buildGithubProfilePrompt(array $repos, ?string $currentBio): string
    {
        $repoCount    = count($repos);
        $reposSummary = collect($repos)->map(function (array $r): string {
            $lang   = $r['language'] ?? null;
            $topics = implode(', ', $r['topics'] ?? []);

            return '- '.($r['name'] ?? 'repo').
                ($lang ? " [{$lang}]" : '').
                (! empty($r['description']) ? ": {$r['description']}" : '').
                ($topics ? " | Topics: {$topics}" : '');
        })->implode("\n");

        $bioContext = $currentBio
            ? "Bio actual del usuario (toma como referencia para mantener coherencia): {$currentBio}"
            : 'El usuario no tiene bio aún. Crea una desde cero basándote en los repos.';

        return <<<PROMPT
Eres un recruiter tech especializado en talento latinoamericano. Analiza estos {$repoCount} repositorios públicos de GitHub y genera un perfil profesional completo para un freelancer en WorkConnect.

Responde EXCLUSIVAMENTE con un objeto JSON válido. Sin markdown, sin texto extra.

{
  "bio": "2-3 oraciones en primera persona: quién soy, qué construyo, por qué contratarme. Basado en los repos. Sin clichés.",
  "skills": ["8 a 12 tecnologías/habilidades con evidencia en los repos: lenguajes, frameworks, herramientas. Solo las que aparecen."],
  "summary": "Una frase vendedora para el perfil público. Directa y específica. En primera persona."
}

CRITERIOS PARA INFERIR SKILLS:
- Lenguaje del repo → incluir directamente
- Topics del repo → extraer frameworks y herramientas mencionados
- Prioriza tecnologías que aparecen en múltiples repos (mayor confianza)
- Incluye: lenguajes (PHP, JS, Python), frameworks (Laravel, React, Django), bases de datos y herramientas si hay evidencia

{$bioContext}

REPOSITORIOS ({$repoCount}):
{$reposSummary}
PROMPT;
    }

    /**
     * @param  array<int, array<string, mixed>>  $repos
     * @return array{bio: string, skills: array<string>, summary: string, source: string}
     */
    private function fallbackGithubProfile(array $repos): array
    {
        $languages = collect($repos)->pluck('language')->filter()->unique()->values()->all();
        $topics    = collect($repos)->pluck('topics')->flatten()->unique()->take(6)->values()->all();

        return [
            'bio'     => '',
            'skills'  => array_values(array_unique(array_merge($languages, $topics))),
            'summary' => 'Perfil generado desde repositorios públicos de GitHub.',
            'source'  => 'local',
        ];
    }

    // ─── Fallbacks locales ────────────────────────────────────────────────────────

    private function fallbackMatchAnalysis(User $user, WorkJob $job, int $score): string
    {
        $level = match (true) {
            $score >= 80 => 'Alta compatibilidad',
            $score >= 60 => 'Compatibilidad moderada',
            default      => 'Compatibilidad parcial',
        };

        return "{$level} ({$score}%) basada en habilidades registradas. ".
            'Revisa los entregables del proyecto antes de postularte para alinear tu propuesta al alcance real.';
    }

    private function fallbackProfileSummary(User $user, int $score): string
    {
        $user->loadMissing('skills');
        $skills = $user->skills->take(3)->pluck('name')->implode(', ') ?: 'desarrollo digital';

        return "Freelancer especializado en {$skills} con perfil calificado en WorkConnect. ".
            'Disponible para proyectos remotos con entrega documentada y comunicación clara.';
    }

    private function fallbackProposal(User $user, WorkJob $job, string $message): string
    {
        $user->loadMissing('skills');
        $company = $job->company ?? 'tu empresa';
        $skills  = $user->skills->take(3)->pluck('name')->implode(', ') ?: 'desarrollo web';

        return "Entiendo que {$company} necesita {$job->title} y tengo experiencia directa en ese tipo de proyectos. ".
            "{$message} ".
            "Cuento con habilidades en {$skills} y me comprometo a entregar con comunicación continua y calidad verificable.";
    }

    /**
     * Texto libre con cadena nvidia → gemini → openai.
     *
     * @return array{text: string, source: string}|null
     */
    public function promptText(string $prompt, ?string $model = null, int $maxTokens = 1024): ?array
    {
        return $this->complete($prompt, $model, $maxTokens);
    }

    /**
     * JSON con cadena nvidia → gemini → openai.
     * El array devuelto incluye `_ai_provider` con el proveedor real.
     *
     * @return array<string, mixed>|null
     */
    public function promptJson(string $prompt, ?string $model = null, int $maxTokens = 2048): ?array
    {
        $result = $this->completeJson($prompt, $model, $maxTokens);

        if (! $result) {
            return null;
        }

        $result['parsed']['_ai_provider'] = $result['source'];

        return $result['parsed'];
    }
}
