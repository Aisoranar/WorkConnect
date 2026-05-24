<?php

namespace App\Services;

use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class ProfileAdvisorService
{
    public const SKILL_QUIZ_PASSING_SCORE = 70;

    public const SKILL_QUIZ_QUESTIONS = 5;

    public function __construct(
        private readonly AIService $ai,
        private readonly ProfileScoreService $profileScore,
        private readonly MatchingService $matching,
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
    public function coachForJob(User $user, WorkJob $job): array
    {
        $user->loadMissing('skills');
        $gaps = $this->matching->analyzeJobGaps($user, $job);
        $profile = $this->profileScore->analyze($user);
        $match = (int) $gaps['match'];

        $base = [
            'job_id' => $job->id,
            'job_title' => $job->title,
            'company' => $job->company ?? $job->owner?->name ?? 'Cliente',
            'current_match' => $match,
            'matched_skills' => $gaps['matched_skills'],
            'missing_skills' => [],
            'profile_tips' => $profile['tips'],
            'profile_score' => $profile['score'],
        ];

        if ($match >= 65) {
            return array_merge($base, [
                'alert_level' => 'ok',
                'alert_message' => '¡Buen match! Tu perfil encaja bien con este proyecto.',
                'summary' => 'Tienes varias habilidades que el cliente busca. Refina tu propuesta y postula.',
                'missing_skills' => $this->mapMissingForCoach($gaps['missing_skills'], $job->title),
                'estimated_match_after' => $match,
                'ready_to_apply' => true,
                'apply_advice' => 'Destaca en tu propuesta las skills que ya coinciden y un ejemplo de tu portfolio.',
                'source' => 'local',
            ]);
        }

        $missing = $gaps['missing_skills'];
        $skillsList = $user->skills->pluck('name')->join(', ') ?: 'ninguna';
        $jobSkills = json_encode($job->skills ?? [], JSON_UNESCAPED_UNICODE);
        $missingJson = json_encode($missing, JSON_UNESCAPED_UNICODE);
        $matchedJson = json_encode($gaps['matched_skills'], JSON_UNESCAPED_UNICODE);
        $tipsJson = json_encode($profile['tips'], JSON_UNESCAPED_UNICODE);

        $prompt = <<<PROMPT
Mentor WorkConnect. El freelancer quiere postular pero tiene match bajo ({$match}%).
Proyecto: «{$job->title}» · {$base['company']}
Skills del proyecto: {$jobSkills}
Skills que YA tiene: {$matchedJson}
Skills que LE FALTAN: {$missingJson}
Perfil score: {$profile['score']}/100. Tips perfil: {$tipsJson}
Sus skills actuales: {$skillsList}
JSON español, sin markdown:
{
  "alert_level": "low|medium",
  "alert_message": "1 frase tipo alerta: por qué el % es bajo (ej: te faltan X skills)",
  "summary": "2 oraciones qué debe hacer para poder postular",
  "missing_skills": [
    {"skill": "nombre para perfil", "display_name": "Nombre", "why_learn": "por qué para ESTE proyecto", "priority": "alta|media|baja"}
  ],
  "estimated_match_after": 0,
  "ready_to_apply": false,
  "apply_advice": "cuándo volver a postular",
  "source": "nvidia"
}
estimated_match_after: entero realista si aprende las skills clave. Máx 5 missing_skills.
PROMPT;

        $raw = $this->ai->promptJson($prompt, $this->ai->fastModel(), 900, fast: true);

        if (is_array($raw) && ! empty($raw['alert_message'])) {
            $raw['job_id'] = $job->id;
            $raw['job_title'] = $job->title;
            $raw['company'] = $base['company'];
            $raw['current_match'] = $match;
            $raw['matched_skills'] = $gaps['matched_skills'];
            $raw['profile_tips'] = $profile['tips'];
            $raw['profile_score'] = $profile['score'];

            return $raw;
        }

        return array_merge($base, $this->fallbackJobCoach($job, $gaps, $profile, $match));
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
  "add_to_profile_tip": "1 frase: que debe aprobar la evaluación básica antes de añadirla al perfil",
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
     * @return array<string, mixed>
     */
    public function startSkillQuiz(User $user, string $skill): array
    {
        $display = $this->displayName($this->normalizeSkill(trim($skill)));
        $quizId = Str::uuid()->toString();
        $ctx = $this->userContext($user);

        $prompt = <<<PROMPT
Crea evaluación básica de "{$display}" para talento joven freelancer LATAM.
JSON español, sin markdown:
{
  "questions": [
    {
      "id": "q1",
      "question": "pregunta clara nivel básico",
      "options": ["A", "B", "C", "D"],
      "correct_index": 0,
      "explanation": "por qué es correcta en 1 frase"
    }
  ]
}
Exactamente 5 preguntas, correct_index 0-3, opciones distintas y no ambiguas.
{$ctx}
PROMPT;

        $raw = $this->ai->promptJson($prompt, $this->ai->fastModel(), 1200, fast: true);
        $questions = $this->normalizeQuizQuestions($raw['questions'] ?? [], $display);

        Cache::put($this->quizCacheKey($user->id, $quizId), [
            'skill' => $display,
            'questions' => $questions,
        ], now()->addHours(2));

        return [
            'quiz_id' => $quizId,
            'skill' => $display,
            'passing_score' => self::SKILL_QUIZ_PASSING_SCORE,
            'questions' => $this->publicQuizQuestions($questions),
            'source' => is_array($raw) ? ($raw['source'] ?? 'nvidia') : 'local',
        ];
    }

    /**
     * @param  array<int, array{question_id: string, option_index: int}>  $answers
     * @return array<string, mixed>
     */
    public function submitSkillQuiz(User $user, string $quizId, array $answers): array
    {
        $stored = Cache::get($this->quizCacheKey($user->id, $quizId));

        if (! is_array($stored)) {
            abort(422, 'La evaluación expiró. Repasa la lección e inicia la prueba de nuevo.');
        }

        /** @var array<int, array<string, mixed>> $questions */
        $questions = $stored['questions'];
        $skill = (string) $stored['skill'];
        $answerMap = collect($answers)->keyBy('question_id');

        $correct = 0;
        $review = [];

        foreach ($questions as $q) {
            $qid = (string) $q['id'];
            $selected = $answerMap->has($qid)
                ? (int) $answerMap->get($qid)['option_index']
                : -1;
            $correctIndex = (int) $q['correct_index'];
            $options = $q['options'];

            if ($selected === $correctIndex) {
                $correct++;
            } else {
                $review[] = [
                    'question' => $q['question'],
                    'your_answer' => ($selected >= 0 && isset($options[$selected]))
                        ? $options[$selected]
                        : 'Sin respuesta',
                    'correct_answer' => $options[$correctIndex] ?? '',
                    'explanation' => (string) ($q['explanation'] ?? ''),
                ];
            }
        }

        $total = max(1, count($questions));
        $score = (int) round(($correct / $total) * 100);
        $passed = $score >= self::SKILL_QUIZ_PASSING_SCORE;

        if ($passed) {
            Cache::forget($this->quizCacheKey($user->id, $quizId));
        }

        return [
            'passed' => $passed,
            'score' => $score,
            'correct_count' => $correct,
            'total' => $total,
            'passing_score' => self::SKILL_QUIZ_PASSING_SCORE,
            'skill' => $skill,
            'message' => $passed
                ? "¡Aprobaste! Demuestras conocimiento básico de {$skill}. Ya puedes añadirla a tu perfil."
                : 'Necesitas '.self::SKILL_QUIZ_PASSING_SCORE.'% para certificar la skill. Sigue estudiando la lección y vuelve a intentar.',
            'review' => $review,
            'can_add_to_profile' => $passed,
            'study_tip' => $passed
                ? null
                : 'Repasa los conceptos básicos y los primeros pasos de la lección antes de reintentar.',
        ];
    }

    private function quizCacheKey(int $userId, string $quizId): string
    {
        return "skill_quiz:{$userId}:{$quizId}";
    }

    /**
     * @param  array<int, array<string, mixed>>  $raw
     * @return array<int, array<string, mixed>>
     */
    private function normalizeQuizQuestions(array $raw, string $display): array
    {
        $questions = [];

        foreach (array_slice($raw, 0, self::SKILL_QUIZ_QUESTIONS) as $i => $item) {
            if (! is_array($item)) {
                continue;
            }
            $options = array_values(array_filter(
                (array) ($item['options'] ?? []),
                fn ($o) => is_string($o) && trim($o) !== '',
            ));
            if (count($options) < 4) {
                continue;
            }
            $options = array_slice($options, 0, 4);
            $correct = (int) ($item['correct_index'] ?? 0);
            if ($correct < 0 || $correct > 3) {
                $correct = 0;
            }

            $questions[] = [
                'id' => (string) ($item['id'] ?? 'q'.($i + 1)),
                'question' => (string) ($item['question'] ?? "Pregunta sobre {$display}"),
                'options' => $options,
                'correct_index' => $correct,
                'explanation' => (string) ($item['explanation'] ?? ''),
            ];
        }

        if (count($questions) >= self::SKILL_QUIZ_QUESTIONS) {
            return $questions;
        }

        return $this->fallbackQuizQuestions($display);
    }

    /**
     * @param  array<int, array<string, mixed>>  $questions
     * @return array<int, array<string, mixed>>
     */
    private function publicQuizQuestions(array $questions): array
    {
        return array_map(fn (array $q) => [
            'id' => $q['id'],
            'question' => $q['question'],
            'options' => $q['options'],
        ], $questions);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function fallbackQuizQuestions(string $display): array
    {
        $templates = match ($this->normalizeSkill($display)) {
            'react' => [
                ['q1', '¿Qué es React principalmente?', ['Una librería UI', 'Una base de datos', 'Un servidor web', 'Un lenguaje nuevo'], 0],
                ['q2', '¿Qué es un componente en React?', ['Una pieza reutilizable de interfaz', 'Un archivo CSS', 'Un tipo de API', 'Un plugin de PHP'], 0],
                ['q3', '¿Para qué sirve useState?', ['Manejar estado en componentes', 'Crear rutas', 'Conectar MySQL', 'Compilar Tailwind'], 0],
                ['q4', '¿Qué lenguaje usa React habitualmente?', ['JavaScript o TypeScript', 'Solo Python', 'Solo PHP', 'Solo HTML'], 0],
                ['q5', '¿Qué hace JSX?', ['Permite mezclar HTML-like en JS', 'Instala npm', 'Reemplaza Git', 'Es un framework CSS'], 0],
            ],
            'figma' => [
                ['q1', '¿Qué es Figma?', ['Herramienta de diseño UI', 'Framework frontend', 'Base de datos', 'Servidor'], 0],
                ['q2', '¿Qué es un frame en Figma?', ['Contenedor de diseño', 'Un filtro CSS', 'Un componente React', 'Un tipo de letra'], 0],
                ['q3', '¿Para qué sirven los componentes en Figma?', ['Reutilizar elementos de UI', 'Enviar emails', 'Escribir SQL', 'Deploy'], 0],
                ['q4', '¿Qué es un design system?', ['Biblioteca visual coherente', 'Un hosting', 'Un lenguaje', 'Un CRM'], 0],
                ['q5', '¿Qué entrega Figma al desarrollador?', ['Medidas, colores y assets', 'Código PHP listo', 'Base de datos', 'Dominio web'], 0],
            ],
            default => [
                ['q1', "¿Para qué se usa {$display} en proyectos freelance?", ['Resolver tareas del stack del proyecto', 'Solo marketing', 'Solo contabilidad', 'No se usa en tech'], 0],
                ['q2', "Un buen primer paso con {$display} es…", ['Documentación oficial y práctica corta', 'Postular sin estudiar', 'Copiar sin entender', 'Ignorar el cliente'], 0],
                ['q3', '¿Por qué certificar una skill en tu perfil?', ['Mejora tu match con proyectos reales', 'Baja tu rating', 'Oculta tu portfolio', 'Elimina postulaciones'], 0],
                ['q4', 'Si no entiendes un concepto básico, debes…', ['Seguir estudiando antes de certificar', 'Añadirla igual al perfil', 'Dejar la plataforma', 'Spam postular'], 0],
                ['q5', '¿Qué demuestra aprobar esta evaluación?', ['Conocimiento mínimo verificable', 'Experiencia de 10 años', 'Ser cliente', 'Tener GitHub Pro'], 0],
            ],
        };

        return array_map(fn (array $t) => [
            'id' => $t[0],
            'question' => $t[1],
            'options' => $t[2],
            'correct_index' => $t[3],
            'explanation' => 'Repasa la lección si fallaste esta pregunta.',
        ], $templates);
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

    /**
     * @param  array<int, string>  $missing
     * @return array<int, array<string, string>>
     */
    private function mapMissingForCoach(array $missing, string $jobTitle): array
    {
        return array_map(fn (string $name) => [
            'skill' => $name,
            'display_name' => $name,
            'why_learn' => "Refuerza «{$name}» para destacar en «{$jobTitle}».",
            'priority' => 'media',
        ], array_slice($missing, 0, 5));
    }

    /**
     * @param  array<string, mixed>  $gaps
     * @param  array<string, mixed>  $profile
     * @return array<string, mixed>
     */
    private function fallbackJobCoach(WorkJob $job, array $gaps, array $profile, int $match): array
    {
        $missing = $gaps['missing_skills'];
        $hasNoSkills = $profile['score'] < 30 || count($missing) >= 2;

        $alert = $hasNoSkills
            ? 'Match bajo: tu perfil aún no tiene las habilidades que pide este proyecto.'
            : 'Match mejorable: te faltan algunas habilidades clave para este proyecto.';

        $estimated = min(85, $match + count($missing) * 18);

        return [
            'alert_level' => $match < 25 ? 'low' : 'medium',
            'alert_message' => $alert,
            'summary' => count($missing) > 0
                ? 'Añade las skills indicadas a tu perfil y practica lo básico con la guía IA. Luego tu % de match subirá y podrás postular con más chances.'
                : 'Completa tu bio y portfolio; eso también sube tu compatibilidad.',
            'missing_skills' => $this->mapMissingForCoach($missing, $job->title),
            'estimated_match_after' => $estimated,
            'ready_to_apply' => false,
            'apply_advice' => 'Cuando tengas al menos 2 skills del proyecto en tu perfil, vuelve a revisar el match antes de postular.',
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
