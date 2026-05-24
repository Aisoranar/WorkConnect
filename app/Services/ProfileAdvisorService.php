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
    {
      "concept": "nombre del concepto",
      "explanation": "2 oraciones claras, sin jerga innecesaria",
      "example": "1 ejemplo concreto del mundo real (proyecto, pantalla, flujo)"
    }
  ],
  "first_steps": ["3 pasos concretos para empezar hoy"],
  "practice_idea": "1 mini proyecto de práctica en 1 oración",
  "add_to_profile_tip": "1 frase: que debe aprobar la evaluación básica antes de añadirla al perfil",
  "source": "nvidia"
}
Máximo 5 items en basics. Cada basic DEBE tener "example". Tono cercano, práctico, como un senior explicando a un junior.
{$ctx}
PROMPT;

        $raw = $this->ai->promptJson($prompt, $this->ai->fastModel(), 1400, fast: true);

        if (is_array($raw) && ! empty($raw['overview'])) {
            $raw['skill'] = $display;
            $this->cacheLessonContext($user->id, $skill, $raw);

            return $raw;
        }

        $fallback = $this->fallbackLearnIntro($display, $jobsCount);
        $this->cacheLessonContext($user->id, $skill, $fallback);

        return $fallback;
    }

    /**
     * @return array<string, mixed>
     */
    public function startSkillQuiz(User $user, string $skill): array
    {
        $display = $this->displayName($this->normalizeSkill(trim($skill)));
        $quizId = Str::uuid()->toString();
        $ctx = $this->userContext($user);
        $lessonCtx = $this->lessonContextForQuiz($user->id, $skill);

        $prompt = <<<PROMPT
Crea evaluación básica SOBRE "{$display}" (no genérica) para talento joven freelancer LATAM.
Todas las preguntas deben ser específicas de {$display} en trabajo real (diseño, dev o el área que corresponda).

REGLAS OBLIGATORIAS:
- Exactamente 5 preguntas, correct_index entre 0 y 3.
- 4 opciones por pregunta; todas deben sonar PLAUSIBLES (mismo dominio). PROHIBIDO distractores absurdos (ej: "enviar emails", "escribir SQL" si no aplica).
- "explanation": 2-3 oraciones explicando por qué la respuesta correcta es la mejor.
- "example": 1-2 oraciones con caso concreto (pantalla, flujo, entregable).
- "concept": etiqueta corta del tema (ej: "Componentes", "Design system").
- "option_feedback": array de 4 strings. En el índice de la respuesta CORRECTA deja "". En cada índice INCORRECTO escribe 1 frase amable de por qué esa opción no aplica (sin humillar).

JSON español, sin markdown:
{
  "questions": [
    {
      "id": "q1",
      "concept": "tema",
      "question": "pregunta situada en contexto real",
      "options": ["opción A", "opción B", "opción C", "opción D"],
      "correct_index": 0,
      "explanation": "por qué la correcta",
      "example": "ejemplo concreto",
      "option_feedback": ["", "por qué B falla", "por qué C falla", "por qué D falla"]
    }
  ]
}
{$lessonCtx}
{$ctx}
PROMPT;

        $raw = $this->ai->promptJson($prompt, $this->ai->fastModel(), 2000, fast: true);
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
                'Uso en freelance',
                "En un proyecto real, ¿para qué encaja mejor dominar {$display}?",
                ['Cubrir entregables del stack que el cliente pidió', 'Sustituir siempre la comunicación con el cliente', 'Evitar documentar tu trabajo', 'No aporta al match en WorkConnect'],
                0,
                "Las skills del perfil se comparan con las del proyecto; {$display} debe reflejar trabajo que sí harías.",
                "Ejemplo: si el brief pide {$display}, tu portfolio o mini demo debe mostrar un entregable concreto.",
                [1 => 'La comunicación sigue siendo clave aunque domines la herramienta.', 2 => 'Documentar entregables genera confianza.', 3 => 'Sí aporta al match cuando el proyecto la menciona.'],
            ),
            $this->makeQuizQuestion(
                'q2',
                'Primeros pasos',
                "¿Cuál es un primer paso sensato para aprender {$display}?",
                ['Guía oficial + ejercicio corto aplicado a un caso real', 'Postular a 20 proyectos sin practicar', 'Memorizar definiciones sin practicar', 'Esperar que el cliente enseñe todo'],
                0,
                'Aprender haciendo un entregable pequeño fija conceptos mejor que solo teoría.',
                "Ejemplo: replica una pantalla o script mínimo del brief usando solo {$display}.",
                [1 => 'Postular sin base baja tu reputación y el match real.', 2 => 'Sin práctica no certificas con criterio.', 3 => 'El cliente espera autonomía básica.'],
            ),
            $this->makeQuizQuestion(
                'q3',
                'Certificación',
                '¿Por qué WorkConnect pide aprobar la evaluación antes de añadir la skill?',
                ['Verificar conocimiento mínimo y mejorar match con proyectos', 'Cobrar una tasa extra', 'Ocultar tu perfil público', 'Eliminar otras skills del perfil'],
                0,
                'La certificación básica protege la calidad del marketplace y tu porcentaje de compatibilidad.',
                'Ejemplo: con 70% demuestras que entiendes fundamentos antes de aparecer como experto en {$display}.',
                [1 => 'No hay tasa por certificar en esta evaluación.', 2 => 'Tu perfil sigue visible.', 3 => 'No quita otras skills.'],
            ),
            $this->makeQuizQuestion(
                'q4',
                'Si fallas',
                'Si fallas varias preguntas, ¿qué conviene hacer?',
                ['Repasar la lección con ejemplos y reintentar', 'Añadir la skill igual al perfil', 'Abandonar el proyecto sin leer', 'Copiar respuestas de otro usuario'],
                0,
                'El repaso con feedback concreto cierra brechas antes de volver a certificar.',
                'Ejemplo: lee el «Por qué» de cada error y practica el mini ejercio de la lección.',
                [1 => 'Sin aprobar no deberías certificar: baja la confianza del cliente.', 2 => 'Abandonar sin estudiar no mejora tu match.', 3 => 'Copiar no demuestra competencia real.'],
            ),
            $this->makeQuizQuestion(
                'q5',
                'Qué demuestra aprobar',
                '¿Qué demuestra aprobar esta evaluación con al menos 70%?',
                ['Comprensión básica verificable de la skill', '10 años de experiencia senior', 'Que eres el cliente del proyecto', 'Que tienes cuenta premium de GitHub'],
                0,
                'Es un piso de conocimiento para postular con coherencia, no un título senior.',
                'Ejemplo: entiendes conceptos clave y puedes empezar un entregable guiado en {$display}.',
                [1 => 'La seniority se demuestra con portfolio y proyectos.', 2 => 'El cliente es otra persona.', 3 => 'GitHub Pro no es requisito de la evaluación.'],
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
            'overview' => "{$display} es una habilidad muy solicitada en proyectos freelance tech. Dominarla te permite postular con más confianza.",
            'why_for_you' => "Hay {$jobsCount} proyecto(s) en WorkConnect que la mencionan. Aprenderla cierra brechas con el mercado actual.",
            'basics' => [
                [
                    'concept' => 'Fundamentos',
                    'explanation' => 'Empieza por la documentación oficial y un tutorial de 2–3 horas.',
                    'example' => "Replica un entregable pequeño del tipo de proyectos que buscas con {$display}.",
                ],
                [
                    'concept' => 'Práctica',
                    'explanation' => 'Construye un componente o pantalla pequeña usando solo esa tecnología.',
                    'example' => 'Sube captura o enlace al repo en tu portfolio para demostrarlo al cliente.',
                ],
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
