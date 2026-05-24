<?php

namespace App\Services;

use App\Models\SkillCertification;
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

        $cacheKey = "skill_recommendations:{$user->id}";
        $cached = Cache::get($cacheKey);
        if (is_array($cached) && ! empty($cached['recommendations'])) {
            return $cached;
        }

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

        $result = [
            'profile_score' => $profile['score'],
            'profile_tips' => $profile['tips'],
            'your_skills' => $user->skills->pluck('name')->values()->all(),
            'market_summary' => $enriched['market_summary'] ?? $this->fallbackMarketSummary($demand, $totalJobs),
            'top_demanded' => $topDemanded,
            'recommendations' => $enriched['recommendations'] ?? $this->fallbackRecommendations($topGaps),
            'source' => $enriched['source'] ?? 'local',
        ];

        Cache::put($cacheKey, $result, now()->addMinutes(15));

        return $result;
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
Eres un career coach técnico de WorkConnect que asesora freelancers en Latinoamérica para mejorar su empleabilidad.

SITUACIÓN: El freelancer quiere postular al proyecto «{$job->title}» de {$base['company']}, pero su compatibilidad es solo {$match}%.

DATOS DEL ANÁLISIS:
- Skills que pide el proyecto: {$jobSkills}
- Skills que el freelancer YA tiene: {$matchedJson}
- Skills que LE FALTAN: {$missingJson}
- Score de su perfil: {$profile['score']}/100
- Tips de perfil actuales: {$tipsJson}
- Todas sus skills: {$skillsList}

TU OBJETIVO: Dar un diagnóstico profesional honesto pero constructivo. No endulces la realidad ni desanimes — ofrece un plan de acción claro.

CRITERIOS:
- "alert_message": diagnóstico directo y específico. NO genérico. Ejemplo bueno: "Tu perfil no incluye React ni Tailwind, que son el 60% de este proyecto". Ejemplo malo: "Te faltan algunas skills".
- "summary": plan de acción en 2 oraciones. Qué hacer primero y qué resultado esperar.
- "missing_skills": ordena por impacto real en ESTE proyecto. "why_learn" debe explicar QUÉ haría con esa skill en este proyecto específico, no una descripción genérica.
- "apply_advice": consejo realista y temporalizado sobre cuándo volver a intentar.

JSON español, sin markdown ni comentarios:
{{
  "alert_level": "low|medium",
  "alert_message": "diagnóstico específico del gap entre perfil y proyecto",
  "summary": "plan de acción concreto en 2 oraciones",
  "missing_skills": [
    {{"skill": "nombre exacto para perfil", "display_name": "Nombre", "why_learn": "qué harías con esta skill EN ESTE proyecto específico", "priority": "alta|media|baja"}}
  ],
  "estimated_match_after": 0,
  "ready_to_apply": false,
  "apply_advice": "cuándo y cómo volver a postular (con timeline realista)",
  "source": "nvidia"
}}
estimated_match_after: entero realista si aprende las skills clave. Máximo 5 missing_skills.
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

        $fullCacheKey = "skill_intro_full:{$user->id}:".$this->normalizeSkill($skill);
        $cached = Cache::get($fullCacheKey);
        if (is_array($cached) && ! empty($cached['overview'])) {
            return $cached;
        }

        $demand = $this->aggregateMarketDemand();
        $key = $this->normalizeSkill($skill);
        $jobsCount = $demand[$key] ?? 0;

        $ctx = $this->userContext($user);
        $prompt = <<<PROMPT
Eres un senior developer/diseñador con 8+ años de experiencia que hace mentoría a freelancers juniors en Latinoamérica a través de la plataforma WorkConnect.

CONTEXTO: El usuario quiere aprender "{$display}" para mejorar su perfil y postular a proyectos reales. Hay {$jobsCount} proyecto(s) abierto(s) en la plataforma que mencionan esta habilidad.

TU MISIÓN: Crear una lección introductoria que le dé al freelancer los FUNDAMENTOS PRÁCTICOS que necesita para:
1. Entender qué hace "{$display}" y dónde encaja en un proyecto real
2. Hablar con propiedad al postular (no hacer el ridículo con el cliente)
3. Empezar a producir entregables básicos con esta habilidad
4. Aprobar la evaluación de certificación básica de WorkConnect

PRINCIPIOS PEDAGÓGICOS:
- Explica como le explicarías a un colega nuevo en tu equipo, no como Wikipedia
- Cada concepto debe conectar con un ENTREGABLE o DECISIÓN que haría en un proyecto freelance
- Los ejemplos deben ser de proyectos reales (landing page para PYME, dashboard, app móvil, catálogo) — no ejemplos académicos genéricos
- Incluye el "por qué importa" en cada concepto, no solo el "qué es"

Responde SOLO JSON válido en español, sin markdown ni comentarios:
{{
  "skill": "{$display}",
  "overview": "3 oraciones: qué es, para qué lo usan equipos/freelancers profesionalmente, y qué tipo de entregables produces con esta skill",
  "why_for_you": "2 oraciones personalizadas según el perfil del usuario — conecta con lo que ya sabe y lo que podría lograr",
  "basics": [
    {{
      "concept": "nombre técnico del concepto",
      "explanation": "2-3 oraciones que expliquen el concepto Y por qué importa en un proyecto real. Usa analogías si ayudan.",
      "example": "Escenario concreto: 'En un proyecto para una PYME de comida, usarías [concepto] para [resultado]. Por ejemplo: [detalle técnico específico]'"
    }}
  ],
  "first_steps": ["3-4 pasos concretos y accionables para hoy. Incluye herramientas, tiempos estimados y un entregable mínimo por paso"],
  "practice_idea": "Un mini proyecto de 2-4 horas que simule un entregable real para un cliente ficticio. Sé específico: qué construir, con qué datos, qué resultado visual/funcional esperar.",
  "add_to_profile_tip": "Frase que motive a tomar la evaluación: qué demuestra aprobarla y cómo impacta su perfil profesional",
  "source": "nvidia"
}}
Máximo 5 items en basics. Cada basic DEBE tener un "example" situado en un proyecto freelance real. Evita jerga innecesaria pero usa terminología profesional correcta.
{$ctx}
PROMPT;

        $raw = $this->ai->promptJson($prompt, $this->ai->fastModel(), 1400, fast: true);

        if (is_array($raw) && ! empty($raw['overview'])) {
            $raw['skill'] = $display;
            $this->cacheLessonContext($user->id, $skill, $raw);
            Cache::put($fullCacheKey, $raw, now()->addMinutes(30));

            return $raw;
        }

        $fallback = $this->fallbackLearnIntro($display, $jobsCount);
        $this->cacheLessonContext($user->id, $skill, $fallback);
        Cache::put($fullCacheKey, $fallback, now()->addMinutes(30));

        return $fallback;
    }

    /**
     * @return array<string, mixed>
     */
    public function startSkillQuiz(User $user, string $skill): array
    {
        $display = $this->displayName($this->normalizeSkill(trim($skill)));
        $quizId = Str::uuid()->toString();

        // Preguntas cacheadas por usuario+skill (20 min): evita llamadas repetidas a la IA.
        // El set de subtemas se elige aleatoriamente al generar, así cada caducidad produce preguntas distintas.
        $qCacheKey = "skill_quiz_qs:{$user->id}:".$this->normalizeSkill($skill);
        $cachedQuestions = Cache::get($qCacheKey);
        $source = 'cache';

        if (! is_array($cachedQuestions) || count($cachedQuestions) < self::SKILL_QUIZ_QUESTIONS) {
            $lessonCtx = $this->lessonContextForQuiz($user->id, $skill);
            $focusAreas = $this->randomQuizFocusAreas($display);

            $prompt = <<<PROMPT
Eres un evaluador técnico senior especializado en "{$display}" con experiencia contratando freelancers en Latinoamérica.

OBJETIVO: Crear una evaluación de 5 preguntas que determine si un candidato tiene conocimiento PRÁCTICO para trabajar con "{$display}" en proyectos freelance reales.

SUBTEMAS A EVALUAR EN ESTA SESIÓN (genera exactamente una pregunta por subtema, en este orden):
{$focusAreas}

REGLAS ESTRICTAS:
1. Cada pregunta plantea un ESCENARIO LABORAL CONCRETO del subtema asignado (cliente pide algo, surge problema, hay que decidir).
2. Las 4 opciones son TÉCNICAMENTE PLAUSIBLES — un junior podría dudar entre ellas. PROHIBIDAS: opciones de otro dominio, respuestas absurdas o trivialmente incorrectas.
3. La correcta refleja la MEJOR PRÁCTICA, no solo "lo que funciona".
4. Dificultad: nivel junior-intermedio. Criterio profesional, no definiciones de Wikipedia.

CAMPOS OBLIGATORIOS POR PREGUNTA:
- "id": "q1"…"q5"
- "concept": nombre corto del subtema (exactamente el que se te asignó)
- "question": escenario + pregunta (mín. 2 oraciones con contexto real)
- "options": 4 strings del mismo nivel técnico
- "correct_index": 0-3
- "explanation": 2-3 oraciones — POR QUÉ esa práctica y qué problema evita
- "example": escenario concreto de proyecto freelance real donde aplicarías esta decisión
- "option_feedback": 4 strings; el índice correcto = ""; cada incorrecto = 1 oración técnica sobre su limitación

RESPONDE SOLO JSON válido en español, sin markdown:
{
  "questions": [
    {
      "id": "q1",
      "concept": "subtema exacto",
      "question": "escenario + pregunta",
      "options": ["A técnico", "B técnico", "C técnico", "D técnico"],
      "correct_index": 0,
      "explanation": "por qué es mejor práctica",
      "example": "caso real freelance",
      "option_feedback": ["", "limitación B", "limitación C", "limitación D"]
    }
  ]
}
{$lessonCtx}
PROMPT;

            $raw = $this->ai->promptJson($prompt, $this->ai->fastModel(), 1600, fast: true);
            $cachedQuestions = $this->normalizeQuizQuestions($raw['questions'] ?? [], $display);

            if (count($cachedQuestions) >= self::SKILL_QUIZ_QUESTIONS) {
                Cache::put($qCacheKey, $cachedQuestions, now()->addMinutes(20));
            }

            $source = is_array($raw) ? ($raw['source'] ?? 'nvidia') : 'local';
        }

        Cache::put($this->quizCacheKey($user->id, $quizId), [
            'skill' => $display,
            'questions' => $cachedQuestions,
        ], now()->addHours(2));

        return [
            'quiz_id' => $quizId,
            'skill' => $display,
            'passing_score' => self::SKILL_QUIZ_PASSING_SCORE,
            'questions' => $this->publicQuizQuestions($cachedQuestions),
            'source' => $source,
        ];
    }

    /**
     * Devuelve 5 subtemas aleatorios para variar las preguntas de la evaluación entre sesiones.
     */
    private function randomQuizFocusAreas(string $display): string
    {
        $key = $this->normalizeSkill($display);

        $pools = match ($key) {
            'figma' => [
                ['Frames y auto-layout', 'Componentes maestros', 'Variantes de componentes', 'Design tokens y estilos', 'Handoff al desarrollador'],
                ['Grids y guías', 'Prototipado e interacciones', 'Librería de componentes', 'Inspection mode', 'Exportación de assets'],
                ['Auto-layout avanzado', 'Gestión de capas', 'Design system', 'Flujos de usuario', 'Colaboración en equipo'],
            ],
            'react' => [
                ['useState y re-render', 'Props y comunicación entre componentes', 'useEffect y efectos secundarios', 'Renderizado de listas y keys', 'Manejo de formularios controlados'],
                ['Elevación de estado', 'useCallback y useMemo', 'Context API', 'Renderizado condicional', 'Composición de componentes'],
                ['Ciclo de vida con hooks', 'useRef y acceso al DOM', 'Lazy loading y Suspense', 'Error boundaries', 'Patrones de custom hooks'],
            ],
            'typescript' => [
                ['Tipos primitivos y union types', 'Interfaces y type aliases', 'Genéricos básicos', 'Type guards y narrowing', 'Tipos en funciones'],
                ['Utility types (Partial, Pick, Omit)', 'Tipos en React (FC, eventos)', 'Enums vs const objects', 'Mapped types', 'Template literal types'],
                ['Tipos de retorno explícitos', 'Readonly y mutabilidad', 'Intersection types', 'Módulos y namespaces', 'Strict mode y sus implicaciones'],
            ],
            'laravel' => [
                ['Routing y middleware', 'Eloquent básico y relaciones', 'Migraciones y seeders', 'Validación de requests', 'Autenticación con Sanctum'],
                ['API Resources y transformaciones', 'Colas y jobs', 'Policies y gates', 'Cache con Redis', 'Testing con PHPUnit'],
                ['Service container e inyección', 'Observer y eventos', 'Scopes en Eloquent', 'Rate limiting', 'Gestión de archivos con Storage'],
            ],
            'tailwind', 'tailwind css' => [
                ['Clases de espaciado y sizing', 'Flexbox y Grid con Tailwind', 'Responsive design y breakpoints', 'Hover y focus states', 'Dark mode'],
                ['Customización en tailwind.config', 'Componentes con @apply', 'Tipografía y colores', 'Animaciones y transiciones', 'Formularios y inputs'],
                ['JIT mode y arbitrary values', 'Variantes de estado avanzadas', 'Container queries', 'Composición de clases', 'Purge y optimización'],
            ],
            'vue', 'vue.js' => [
                ['Options API vs Composition API', 'Props y emits', 'Reactive y ref', 'Computed properties', 'Watchers'],
                ['Directivas (v-if, v-for, v-model)', 'Ciclo de vida del componente', 'Provide/inject', 'Slots y scoped slots', 'Pinia para estado global'],
                ['Transiciones y animaciones', 'Vue Router básico', 'Composables', 'Async components', 'SSR con Nuxt'],
            ],
            'php' => [
                ['Variables y tipos', 'Funciones y scope', 'Arrays y funciones de array', 'OOP básico: clases y objetos', 'Manejo de errores y excepciones'],
                ['Traits y interfaces', 'Namespaces y autoload', 'PDO y bases de datos', 'Sesiones y cookies', 'Composer y dependencias'],
                ['PSR-4 y buenas prácticas', 'Closures y callbacks', 'Generators', 'Tipos de retorno y tipado estricto', 'Testing con PHPUnit'],
            ],
            default => [
                ['Configuración inicial y entorno de trabajo', 'Flujo de trabajo profesional básico', 'Mejores prácticas de la industria', 'Resolución de problemas comunes', 'Entrega y documentación de resultados'],
                ['Principios fundamentales del dominio', 'Integración con herramientas del ecosistema', 'Optimización y rendimiento', 'Patrones de diseño aplicados', 'Debugging y troubleshooting'],
                ['Casos de uso frecuentes en proyectos LATAM', 'Control de calidad y testing', 'Mantenibilidad y refactorización', 'Seguridad aplicada al dominio', 'Colaboración y entrega continua'],
            ],
        };

        $set = $pools[array_rand($pools)];

        return implode("\n", array_map(
            fn (int $i, string $area) => ($i + 1).'. '.$area,
            array_keys($set),
            $set,
        ));
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
                $yourAnswer = ($selected >= 0 && isset($options[$selected]))
                    ? $options[$selected]
                    : 'Sin respuesta';
                $review[] = $this->buildQuizReviewItem($q, $yourAnswer, $options[$correctIndex] ?? '', $selected);
            }
        }

        $total = max(1, count($questions));
        $score = (int) round(($correct / $total) * 100);
        $passed = $score >= self::SKILL_QUIZ_PASSING_SCORE;

        if ($passed) {
            Cache::forget($this->quizCacheKey($user->id, $quizId));
        }

        $certificateId = $passed ? 'WC-'.strtoupper(Str::random(10)) : null;

        SkillCertification::create([
            'user_id' => $user->id,
            'skill_name' => $skill,
            'score' => $score,
            'passed' => $passed,
            'correct_count' => $correct,
            'total' => $total,
            'certificate_id' => $certificateId,
            'attempted_at' => now(),
        ]);

        $needed = self::SKILL_QUIZ_PASSING_SCORE - $score;

        return [
            'passed' => $passed,
            'score' => $score,
            'correct_count' => $correct,
            'total' => $total,
            'passing_score' => self::SKILL_QUIZ_PASSING_SCORE,
            'skill' => $skill,
            'message' => $passed
                ? "¡Aprobaste con {$score}%! Demuestras conocimiento básico de {$skill}. Ya puedes añadirla a tu perfil."
                : "Obtuviste {$score}% ({$correct}/{$total}). Te faltan ".max(1, (int) ceil($needed / 20))." acierto(s) más para llegar al ".self::SKILL_QUIZ_PASSING_SCORE.'% y certificar la skill.',
            'review' => $review,
            'can_add_to_profile' => $passed,
            'certificate_id' => $certificateId,
            'study_tip' => $passed
                ? null
                : 'Lee otra vez los conceptos con su ejemplo, repasa «Primeros pasos» y vuelve a la evaluación cuando puedas explicar cada respuesta con tus palabras.',
        ];
    }

    /**
     * @param  array<string, mixed>  $question
     * @return array<string, string>
     */
    private function buildQuizReviewItem(array $question, string $yourAnswer, string $correctAnswer, int $selectedIndex): array
    {
        $feedback = (array) ($question['option_feedback'] ?? []);
        $whyYours = '';
        if ($selectedIndex >= 0 && isset($feedback[$selectedIndex]) && trim((string) $feedback[$selectedIndex]) !== '') {
            $whyYours = (string) $feedback[$selectedIndex];
        }

        return [
            'concept' => (string) ($question['concept'] ?? ''),
            'question' => (string) $question['question'],
            'your_answer' => $yourAnswer,
            'correct_answer' => $correctAnswer,
            'why_yours_was_wrong' => $whyYours,
            'explanation' => (string) ($question['explanation'] ?? ''),
            'example' => (string) ($question['example'] ?? ''),
        ];
    }

    /**
     * @param  array<string, mixed>  $intro
     */
    private function cacheLessonContext(int $userId, string $skill, array $intro): void
    {
        $key = $this->normalizeSkill($skill);
        if ($key === '') {
            return;
        }

        Cache::put("skill_lesson:{$userId}:{$key}", [
            'skill' => $intro['skill'] ?? $skill,
            'overview' => $intro['overview'] ?? '',
            'basics' => $intro['basics'] ?? [],
        ], now()->addHours(2));
    }

    private function lessonContextForQuiz(int $userId, string $skill): string
    {
        $stored = Cache::get("skill_lesson:{$userId}:".$this->normalizeSkill($skill));
        if (! is_array($stored)) {
            return '';
        }

        $basics = collect($stored['basics'] ?? [])
            ->map(function ($b) {
                if (! is_array($b)) {
                    return '';
                }
                $ex = $b['explanation'] ?? '';
                $exm = $b['example'] ?? '';

                return ($b['concept'] ?? '').': '.$ex.($exm ? " Ej: {$exm}" : '');
            })
            ->filter()
            ->take(5)
            ->implode(' | ');

        $overview = (string) ($stored['overview'] ?? '');

        return "\nContexto de la lección que acaba de estudiar (alinea preguntas y ejemplos):\n{$overview}\nConceptos: {$basics}\n";
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

            $feedback = $this->normalizeOptionFeedback(
                (array) ($item['option_feedback'] ?? []),
                $correct,
                $options,
            );

            $questions[] = [
                'id' => (string) ($item['id'] ?? 'q'.($i + 1)),
                'concept' => (string) ($item['concept'] ?? ''),
                'question' => (string) ($item['question'] ?? "Pregunta sobre {$display}"),
                'options' => $options,
                'correct_index' => $correct,
                'explanation' => (string) ($item['explanation'] ?? ''),
                'example' => (string) ($item['example'] ?? ''),
                'option_feedback' => $feedback,
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
    /**
     * @param  array<int, mixed>  $rawFeedback
     * @param  array<int, string>  $options
     * @return array<int, string>
     */
    private function normalizeOptionFeedback(array $rawFeedback, int $correctIndex, array $options): array
    {
        $feedback = array_pad(array_values($rawFeedback), 4, '');
        $out = [];
        foreach ($options as $i => $opt) {
            $text = isset($feedback[$i]) ? trim((string) $feedback[$i]) : '';
            if ($i === $correctIndex) {
                $out[$i] = '';

                continue;
            }
            if ($text === '') {
                $text = "«{$opt}» no es la mejor respuesta aquí; repasa el concepto en la lección.";
            }
            $out[$i] = $text;
        }

        return $out;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function fallbackQuizQuestions(string $display): array
    {
        $skill = $this->normalizeSkill($display);

        if ($skill === 'figma') {
            return $this->figmaFallbackQuiz();
        }

        if ($skill === 'react') {
            return $this->reactFallbackQuiz();
        }

        return $this->genericFallbackQuiz($display);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function figmaFallbackQuiz(): array
    {
        return [
            $this->makeQuizQuestion(
                'q1',
                'Qué es Figma',
                'En un proyecto freelance, ¿para qué usarías Figma principalmente?',
                [
                    'Diseñar pantallas y prototipos de interfaz',
                    'Desplegar la app en producción',
                    'Administrar la base de datos del cliente',
                    'Escribir el backend en PHP',
                ],
                0,
                'Figma es una herramienta de diseño de interfaces: maquetas, flujos y prototipos que el equipo (o tú como diseñador) valida antes de desarrollar.',
                'Ejemplo: diseñar el login, el dashboard y el flujo «olvidé mi contraseña» antes de que el dev abra el editor de código.',
                [
                    1 => 'El deploy lo haces con hosting, CI/CD o el stack del proyecto — no dentro de Figma.',
                    2 => 'Las bases de datos se modelan con herramientas de datos o código, no con frames de UI.',
                    3 => 'El backend se programa en editores/IDE; Figma no ejecuta lógica de servidor.',
                ],
            ),
            $this->makeQuizQuestion(
                'q2',
                'Frames',
                'Tu cliente pide una pantalla de «Mis proyectos» con header, lista y footer. ¿Qué creas primero en Figma?',
                [
                    'Un frame que agrupa esa pantalla completa',
                    'Una regla CSS en el archivo global',
                    'Un commit en Git con el título de la tarea',
                    'Una tabla SQL con columnas de la lista',
                ],
                0,
                'Un frame es el lienzo/contenedor de una pantalla o estado (móvil, tablet, desktop). Organiza capas, espaciado y componentes de esa vista.',
                'Ejemplo: frame «Dashboard — Desktop 1440» que contiene header, cards de proyectos y barra lateral.',
                [
                    1 => 'CSS se escribe al desarrollar; en Figma defines layout visual y tokens.',
                    2 => 'Git versiona código; en Figma versionas diseño (historial, ramas de equipo).',
                    3 => 'SQL modela datos; el frame modela la interfaz que el usuario verá.',
                ],
            ),
            $this->makeQuizQuestion(
                'q3',
                'Componentes',
                'Tienes el mismo botón «Publicar» en 8 pantallas. ¿Qué te ahorra tiempo en Figma?',
                [
                    'Un componente maestro que actualizas una vez y se refleja en instancias',
                    'Copiar y pegar manualmente y cambiar color en cada pantalla',
                    'Exportar solo un PNG y olvidar el resto de pantallas',
                    'Pedir al cliente que rediseñe cada botón distinto',
                ],
                0,
                'Los componentes (y variantes) permiten reutilizar UI: cambias el maestro y todas las instancias coherentes se actualizan.',
                'Ejemplo: componente «Button/Primary» con estados default, hover y disabled usado en formularios de toda la app.',
                [
                    1 => 'Copiar/pegar sin componente genera inconsistencias y retrabajo cuando cambia la marca.',
                    2 => 'Un PNG no mantiene espaciados, tipografías ni medidas para el desarrollador.',
                    3 => 'La consistencia es responsabilidad del diseño; no se delega al cliente por pantalla.',
                ],
            ),
            $this->makeQuizQuestion(
                'q4',
                'Design system',
                '¿Qué es un design system en el contexto de Figma + desarrollo?',
                [
                    'Conjunto de reglas y piezas UI reutilizables (colores, tipografía, componentes)',
                    'Un plan de hosting compartido para varios clientes',
                    'El manual de estilo solo en PDF sin componentes digitales',
                    'Una librería de iconos suelta sin guía de uso',
                ],
                0,
                'Un design system unifica decisiones visuales y de UX para que diseño y código hablen el mismo idioma.',
                'Ejemplo: tokens «primary-500», «radius-md» y componentes «Input», «Card» usados igual en Figma y en React.',
                [
                    1 => 'Hosting no define cómo se ven botones, inputs ni espaciados.',
                    2 => 'Un PDF ayuda, pero sin componentes en Figma el dev no tiene piezas listas para inspeccionar.',
                    3 => 'Iconos sueltos no bastan: hacen falta reglas de espaciado, estados y patrones.',
                ],
            ),
            $this->makeQuizQuestion(
                'q5',
                'Handoff al dev',
                '¿Qué suele necesitar un desarrollador front al recibir tu archivo de Figma?',
                [
                    'Medidas, colores, tipografías, assets y estados de componentes',
                    'El código PHP del controlador ya escrito',
                    'Credenciales SSH del servidor del cliente',
                    'Solo una captura en baja resolución sin capas',
                ],
                0,
                'El handoff incluye especificaciones inspectables: padding, grid, variables y export de iconos/imágenes.',
                'Ejemplo: el dev copia «16px padding», hex del botón y exporta el logo en SVG desde el mismo frame.',
                [
                    1 => 'PHP/backend es otra capa; Figma entrega especificación visual, no lógica de servidor.',
                    2 => 'Las credenciales se gestionan por canales seguros, no como entregable de diseño.',
                    3 => 'Una captura plana obliga a adivinar medidas y rompe el flujo de implementación.',
                ],
            ),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function reactFallbackQuiz(): array
    {
        return [
            $this->makeQuizQuestion(
                'q1',
                'Qué es React',
                '¿Qué describe mejor a React en un proyecto front?',
                ['Librería para construir interfaces con componentes', 'Motor de base de datos relacional', 'Servidor de correo', 'Sistema operativo'],
                0,
                'React organiza la UI en piezas reutilizables que reaccionan a datos y estado.',
                'Ejemplo: un componente `<JobCard />` que recibe título y match y se repite en una lista.',
                [1 => 'Las bases de datos no viven dentro de React.', 2 => 'El correo lo gestionan APIs/servicios aparte.', 3 => 'React corre en el navegador o SSR, no es un SO.'],
            ),
            $this->makeQuizQuestion(
                'q2',
                'Componentes',
                '¿Qué es un componente en React?',
                ['Función o clase que devuelve UI reutilizable', 'Archivo .css global obligatorio', 'Tabla de MySQL', 'Plugin de WordPress'],
                0,
                'Un componente encapsula estructura, estilo y comportamiento de una parte de pantalla.',
                'Ejemplo: `<Avatar name="Ana" size="sm" />` usado en navbar y en mensajes.',
                [1 => 'CSS puede acompañar al componente, pero no define qué es un componente.', 2 => 'MySQL almacena datos, no JSX.', 3 => 'WordPress es otro ecosistema.'],
            ),
            $this->makeQuizQuestion(
                'q3',
                'Estado',
                '¿Para qué sirve `useState` en un componente funcional?',
                ['Guardar datos que cambian y vuelven a renderizar la UI', 'Crear rutas del servidor Laravel', 'Compilar Tailwind a mano', 'Conectar FTP'],
                0,
                '`useState` mantiene estado local: al actualizarlo, React vuelve a pintar lo necesario.',
                'Ejemplo: contador de notificaciones o toggle «modo oscuro» en el header.',
                [1 => 'Las rutas de API/backend no se definen con useState.', 2 => 'Tailwind se compila en build, no con un hook.', 3 => 'FTP no tiene relación con estado de UI.'],
            ),
            $this->makeQuizQuestion(
                'q4',
                'Lenguaje',
                '¿Con qué lenguajes suele escribirse React en la industria?',
                ['JavaScript o TypeScript', 'Solo HTML sin lógica', 'Solo SQL', 'Solo Bash'],
                0,
                'La lógica va en JS/TS; JSX mezcla marcado declarativo con expresiones.',
                'Ejemplo: `const [open, setOpen] = useState(false)` en TypeScript con tipos en props.',
                [1 => 'HTML solo no basta para estado, efectos ni composición.', 2 => 'SQL consulta datos, no componentes.', 3 => 'Bash es scripting de sistema.'],
            ),
            $this->makeQuizQuestion(
                'q5',
                'JSX',
                '¿Qué aporta JSX al desarrollar en React?',
                ['Escribir UI de forma declarativa mezclando etiquetas y lógica', 'Reemplazar npm por completo', 'Eliminar la necesidad de Git', 'Convertir PHP en componentes'],
                0,
                'JSX hace legible el árbol de elementos y permite expresiones `{variable}` dentro del markup.',
                'Ejemplo: `{jobs.map(j => <JobRow key={j.id} job={j} />)}` en una lista.',
                [1 => 'npm sigue gestionando paquetes.', 2 => 'Git sigue versionando el repo.', 3 => 'PHP y React son capas distintas.'],
            ),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function genericFallbackQuiz(string $display): array
    {
        return [
            $this->makeQuizQuestion(
                'q1',
                'Contexto profesional',
                "Un cliente te contacta para un proyecto que requiere {$display}. En la primera reunión te pregunta qué experiencia tienes. ¿Cuál es la respuesta más profesional si estás comenzando?",
                [
                    "Mostrar un mini proyecto o ejercicio práctico que demuestre comprensión de los fundamentos de {$display}",
                    'Decir que tienes 5 años de experiencia aunque no sea cierto para ganar el proyecto',
                    "Admitir que nunca has usado {$display} y pedir que te enseñen durante el proyecto",
                    'Enviar solo un PDF con certificados de cursos online sin código ni entregables',
                ],
                0,
                "Un entregable práctico — aunque sea pequeño — demuestra competencia real mejor que teoría o credenciales infladas. Los clientes valoran evidencia concreta de que puedes producir resultados con {$display}.",
                "Ejemplo: mostrar un repositorio con un componente funcional, una maqueta interactiva o un script que resuelva un problema similar al del proyecto del cliente.",
                [
                    1 => 'Mentir sobre experiencia destruye tu reputación cuando el cliente descubre la realidad durante el proyecto.',
                    2 => 'El cliente busca autonomía básica; esperar que te enseñen es un red flag para un freelancer.',
                    3 => 'Los certificados sin código no demuestran que puedas producir entregables reales.',
                ],
            ),
            $this->makeQuizQuestion(
                'q2',
                'Metodología de aprendizaje',
                "Necesitas aprender {$display} en 2 semanas para un proyecto. ¿Cuál es el enfoque más efectivo para un freelancer con tiempo limitado?",
                [
                    'Documentación oficial + tutorial práctico + replicar un entregable similar al del proyecto',
                    'Leer toda la documentación de principio a fin antes de escribir una sola línea',
                    'Ver 40 horas de tutoriales en YouTube sin abrir el editor',
                    'Copiar código de Stack Overflow sin entender qué hace cada parte',
                ],
                0,
                "El aprendizaje más eficiente combina referencia oficial (para no aprender malas prácticas), práctica guiada (para fijar conceptos) y un entregable alineado al proyecto real (para validar que puedes producir).",
                "Ejemplo: para una landing page, harías: 1) tutorial de 2h, 2) replica la estructura del brief, 3) iteras hasta que funcione como el cliente espera.",
                [
                    1 => 'Leer toda la documentación sin practicar es ineficiente; se olvida lo que no se aplica.',
                    2 => 'Los videos pasivos dan falsa sensación de aprendizaje; necesitas escribir código tú mismo.',
                    3 => 'Copiar sin entender genera deuda técnica y te deja sin capacidad de resolver bugs.',
                ],
            ),
            $this->makeQuizQuestion(
                'q3',
                'Calidad de entregables',
                "Estás trabajando en un proyecto con {$display} y tu código funciona pero está desorganizado. El cliente dice que otro developer lo va a mantener después. ¿Qué priorizas?",
                [
                    'Refactorizar con nombres claros, estructura consistente y documentación mínima del flujo principal',
                    'Entregar tal cual porque ya funciona y el plazo está encima',
                    'Reescribir todo desde cero con un framework diferente que conoces mejor',
                    'Agregar comentarios en cada línea explicando qué hace para compensar la falta de estructura',
                ],
                0,
                'Código mantenible es parte del entregable profesional. Un freelancer responsable entrega código que otro desarrollador pueda entender y extender sin necesitar una sesión explicativa.',
                "Ejemplo: renombrar variables como 'd' a 'deliveryDate', separar lógica en funciones con nombres descriptivos, y agregar un README con las decisiones de arquitectura.",
                [
                    1 => 'Entregar código desordenado genera mala reseña y el siguiente dev culpará al freelancer anterior.',
                    2 => 'Reescribir con otro framework rompe el stack acordado y agrega riesgo innecesario.',
                    3 => 'Comentar cada línea no reemplaza buena estructura; genera ruido y los comentarios se desactualizan.',
                ],
            ),
            $this->makeQuizQuestion(
                'q4',
                'Resolución de problemas',
                "Durante un proyecto con {$display}, encuentras un bug que no puedes resolver tras 2 horas de investigación. ¿Cuál es la acción más profesional?",
                [
                    'Documentar el problema con detalle, buscar en la comunidad oficial, y si persiste comunicar al cliente el bloqueo con opciones',
                    'Ignorar el bug esperando que el cliente no lo note en producción',
                    'Abandonar el proyecto sin avisar porque no es tu área de expertise',
                    'Reescribir la funcionalidad completa con otra tecnología sin consultar al cliente',
                ],
                0,
                'La transparencia profesional con el cliente genera más confianza que ocultar problemas. Un buen freelancer comunica bloqueos proactivamente y propone alternativas o ajustes de plazo.',
                'Ejemplo: "Encontré un problema con [X]. Investigué en [fuentes]. Tengo 2 opciones: [A] con este tradeoff o [B] que toma 1 día más. ¿Cuál prefieres?"',
                [
                    1 => 'Ocultar bugs es la forma más rápida de perder un cliente y obtener una reseña negativa.',
                    2 => 'Abandonar destruye tu reputación en la plataforma y afecta a futuros freelancers.',
                    3 => 'Cambiar la tecnología sin consultar viola el acuerdo original y puede causar problemas de compatibilidad.',
                ],
            ),
            $this->makeQuizQuestion(
                'q5',
                'Portfolio y credibilidad',
                "Aprobaste la evaluación de {$display} en WorkConnect. ¿Cuál es la mejor forma de aprovechar esta certificación para conseguir más proyectos?",
                [
                    'Complementarla con un mini proyecto en tu portfolio que demuestre la skill aplicada a un caso real',
                    'Solo añadir la skill al perfil y esperar que los clientes te contacten automáticamente',
                    'Postular a todos los proyectos que mencionen la skill sin leer los requisitos completos',
                    'Publicar en redes que eres experto senior certificado en la skill',
                ],
                0,
                'La certificación valida conocimiento básico; el portfolio demuestra capacidad de ejecución. La combinación de ambos maximiza tu credibilidad ante el cliente y tu porcentaje de match.',
                "Ejemplo: creas una demo de 4 horas (landing page, componente, script) usando {$display}, la subes a tu portfolio con screenshot y enlace al repo.",
                [
                    1 => 'El perfil pasivo genera pocas oportunidades; los clientes buscan evidencia activa.',
                    2 => 'Postular masivamente sin leer briefs genera rechazos y baja tu tasa de aceptación.',
                    3 => 'Inflarse como senior con una certificación básica es deshonesto y se descubre rápido.',
                ],
            ),
        ];
    }

    /**
     * @param  array<int, string>  $options
     * @param  array<int, string>  $wrongByIndex
     * @return array<string, mixed>
     */
    private function makeQuizQuestion(
        string $id,
        string $concept,
        string $question,
        array $options,
        int $correctIndex,
        string $explanation,
        string $example,
        array $wrongByIndex,
    ): array {
        $feedback = [];
        foreach ($options as $i => $opt) {
            $feedback[$i] = $i === $correctIndex
                ? ''
                : ($wrongByIndex[$i] ?? "«{$opt}» no es la respuesta esperada en este contexto.");
        }

        return [
            'id' => $id,
            'concept' => $concept,
            'question' => $question,
            'options' => $options,
            'correct_index' => $correctIndex,
            'explanation' => $explanation,
            'example' => $example,
            'option_feedback' => $feedback,
        ];
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
Eres un analista de mercado laboral tech especializado en freelancing en Latinoamérica. Trabajas para WorkConnect analizando qué habilidades necesitan los freelancers para ser más competitivos.

DATOS ACTUALES DEL MARKETPLACE:
- Score del perfil del usuario: {$profile['score']}/100
- Skills más demandadas en proyectos abiertos: {$demandJson}
- Habilidades que el usuario NO tiene pero el mercado pide: {$gapsJson}

TU OBJETIVO: Analizar la brecha entre el perfil del usuario y la demanda real del marketplace, y recomendar qué aprender para maximizar oportunidades.

CRITERIOS PROFESIONALES:
- "market_summary": análisis ejecutivo del mercado actual. Qué tipo de proyectos dominan, qué stack piden más, y una tendencia observable. NO genérico — usa los datos reales.
- "recommendations": máximo 5, ordenadas por RETORNO DE INVERSIÓN (impacto en match × demanda × facilidad de aprender). Para cada una:
  - "why_learn": oración que conecte la skill con proyectos REALES del marketplace. Ejemplo bueno: "El 40% de los proyectos abiertos piden React para dashboards y landing pages — aprenderla te abre esas 6 oportunidades". Ejemplo malo: "React es popular".
  - "impact_on_match": cuantifica el impacto. Ejemplo: "Tu match promedio subiría ~15-20% en proyectos de desarrollo web".

JSON español, sin markdown ni comentarios:
{{
  "market_summary": "análisis de mercado en 2-3 oraciones con datos específicos",
  "recommendations": [
    {{
      "skill": "nombre exacto para el perfil",
      "display_name": "Nombre para mostrar",
      "demand_percent": 0,
      "open_jobs": 0,
      "why_learn": "justificación basada en datos del marketplace",
      "impact_on_match": "impacto estimado en compatibilidad",
      "priority": "alta|media|baja"
    }}
  ],
  "source": "nvidia"
}}
Copia open_jobs y demand_percent de los datos proporcionados. Sé específico, no genérico.
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
        if ($this->normalizeSkill($display) === 'figma') {
            return [
                'skill' => 'Figma',
                'overview' => 'Figma es la herramienta estándar para diseñar interfaces web y móviles en equipo. En freelance la usarás para prototipos, design systems y entregar especificaciones claras al desarrollo.',
                'why_for_you' => "Hay {$jobsCount} proyecto(s) en WorkConnect que mencionan diseño UI/UX o Figma. Certificarla mejora tu match cuando el cliente pide maquetas o handoff.",
                'basics' => [
                    [
                        'concept' => 'Frames y capas',
                        'explanation' => 'Un frame representa una pantalla o estado (login, listado, modal). Dentro organizas capas: textos, botones, imágenes.',
                        'example' => 'Frame «Explorar proyectos — Mobile 390» con header, buscador y cards apiladas.',
                    ],
                    [
                        'concept' => 'Componentes',
                        'explanation' => 'Los componentes son piezas reutilizables. Cambias el maestro y las instancias se actualizan en todas las pantallas.',
                        'example' => 'Botón «Postular» con variantes primary/disabled usado en 6 vistas.',
                    ],
                    [
                        'concept' => 'Design system',
                        'explanation' => 'Reúne colores, tipografías, espaciados y patrones para que diseño y código se vean iguales.',
                        'example' => 'Variables color/primary y componente Input compartidos con el dev en React.',
                    ],
                ],
                'first_steps' => [
                    'Crea un archivo y un frame móvil de una pantalla que ya conozcas (15 min).',
                    'Convierte un botón en componente y úsalo dos veces.',
                    'Usa Inspect para copiar un padding y un color hex.',
                ],
                'practice_idea' => 'Rediseña la pantalla de login de WorkConnect con auto-layout y exporta el logo en SVG.',
                'add_to_profile_tip' => 'Aprueba la evaluación básica antes de añadir Figma a tu perfil.',
                'source' => 'local',
            ];
        }

        return [
            'skill' => $display,
            'overview' => "{$display} es una habilidad con demanda activa en proyectos freelance de la plataforma. Los clientes la solicitan para construir entregables específicos dentro de sus proyectos digitales. Dominar los fundamentos te permite postular con evidencia concreta y mejorar tu porcentaje de compatibilidad.",
            'why_for_you' => "Hay {$jobsCount} proyecto(s) abierto(s) en WorkConnect que mencionan {$display}. Certificar esta skill con la evaluación básica te posiciona para postular a esas oportunidades con un match más alto.",
            'basics' => [
                [
                    'concept' => 'Qué problema resuelve',
                    'explanation' => "{$display} existe para resolver un tipo específico de necesidad en proyectos digitales. Antes de estudiar la herramienta, entiende QUÉ necesidad cubre y POR QUÉ un cliente la pediría en su brief.",
                    'example' => "Un cliente publica un proyecto que incluye {$display} en los requisitos. Al postular, necesitas explicar cómo usarías esta skill para resolver su necesidad concreta — no solo que la «conoces».",
                ],
                [
                    'concept' => 'Flujo de trabajo profesional',
                    'explanation' => "En un proyecto real, {$display} se usa dentro de un flujo: recibes un brief, planificas el entregable, lo construyes, lo iteras con feedback del cliente y lo entregas con documentación mínima.",
                    'example' => 'Un freelancer profesional no solo «sabe usar la herramienta» — sabe integrarla en un proceso de entrega: estima tiempos, comunica progreso, y entrega algo que otro profesional pueda mantener.',
                ],
                [
                    'concept' => 'Entregable mínimo viable',
                    'explanation' => "Para demostrar competencia básica en {$display}, necesitas poder producir un entregable concreto: una pantalla, un componente, un script funcional, o una pieza de diseño que resuelva un problema real.",
                    'example' => "Construye algo pequeño pero completo: no una línea de código, sino un mini proyecto que un cliente pueda ver y decir «esto es lo que necesito, pero más grande».",
                ],
            ],
            'first_steps' => [
                "Busca la documentación oficial de {$display} y lee la sección «Getting Started» o «Quick Start» (30-45 minutos).",
                "Sigue un tutorial práctico que termine en un entregable visible (no solo teoría). Busca uno de 1-2 horas máximo.",
                "Replica un entregable similar al que pedirían los proyectos abiertos en WorkConnect que mencionan {$display}.",
                'Sube tu resultado a tu portfolio de WorkConnect: screenshot + descripción de qué resuelve + tecnologías usadas.',
            ],
            'practice_idea' => "Construye una versión simplificada de un proyecto real: una landing page para una PYME ficticia, un dashboard con datos de ejemplo, o un componente interactivo que demuestre los fundamentos de {$display}. Tiempo estimado: 2-4 horas.",
            'add_to_profile_tip' => "Aprueba la evaluación básica (70% mínimo) para certificar {$display} en tu perfil. Esto demuestra a los clientes que tienes los fundamentos y mejora tu match automáticamente en proyectos que la requieran.",
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
        $skills = $user->skills->pluck('name')->join(', ') ?: 'ninguna registrada';
        $bio = Str::limit((string) ($user->bio ?? ''), 300);
        $experience = Str::limit((string) ($user->experience ?? ''), 200);
        $github = $user->github ?? '';
        $rating = $user->rating > 0 ? "Rating: {$user->rating}/5" : '';

        return <<<CTX
=== PERFIL REAL DEL USUARIO (fuente de verdad) ===
Nombre: {$user->name}
Ciudad: {$user->city}
Bio: {$bio}
Experiencia: {$experience}
SKILLS REALES DEL USUARIO (basa TODA tu respuesta en estas habilidades): {$skills}
{$github}
{$rating}
=== FIN PERFIL ===
IMPORTANTE: Tu respuesta DEBE ser específica para las skills listadas arriba. No inventes skills que el usuario no tiene. No uses skills genéricas si el usuario tiene skills concretas.
CTX;
    }
}
