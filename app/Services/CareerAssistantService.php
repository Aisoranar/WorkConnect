<?php

namespace App\Services;

use App\Models\CareerSession;
use App\Models\User;
use App\Models\WorkJob;

class CareerAssistantService
{
    /** @var array<int, array{title: string, url: string, provider: string, skills: array<string>}> */
    private const FREE_COURSES = [
        ['title' => 'CS50 Introduction to Computer Science', 'url' => 'https://www.edx.org/learn/computer-science/harvard-university-cs50-s-introduction-to-computer-science', 'provider' => 'edX / Harvard', 'skills' => ['programación', 'lógica', 'C']],
        ['title' => 'Responsive Web Design', 'url' => 'https://www.freecodecamp.org/learn/2022/responsive-web-design/', 'provider' => 'freeCodeCamp', 'skills' => ['HTML', 'CSS', 'responsive']],
        ['title' => 'JavaScript Algorithms and Data Structures', 'url' => 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/', 'provider' => 'freeCodeCamp', 'skills' => ['JavaScript', 'algoritmos']],
        ['title' => 'Laravel desde cero', 'url' => 'https://laravel.com/docs', 'provider' => 'Laravel Docs', 'skills' => ['Laravel', 'PHP']],
        ['title' => 'React - Documentación oficial', 'url' => 'https://react.dev/learn', 'provider' => 'React', 'skills' => ['React', 'frontend']],
        ['title' => 'Git y GitHub', 'url' => 'https://www.youtube.com/watch?v=VdGzPZ31ts8', 'provider' => 'YouTube', 'skills' => ['Git', 'control de versiones']],
        ['title' => 'Figma para principiantes', 'url' => 'https://www.youtube.com/results?search_query=figma+tutorial+español', 'provider' => 'YouTube', 'skills' => ['Figma', 'UI', 'diseño']],
        ['title' => 'Google Digital Garage - Marketing', 'url' => 'https://learndigital.withgoogle.com/digitalgarage', 'provider' => 'Google', 'skills' => ['marketing digital', 'SEO']],
        ['title' => 'SQL para analistas', 'url' => 'https://www.kaggle.com/learn/intro-to-sql', 'provider' => 'Kaggle', 'skills' => ['SQL', 'bases de datos']],
        ['title' => 'Introducción a la IA', 'url' => 'https://www.deeplearning.ai/short-courses/', 'provider' => 'DeepLearning.AI', 'skills' => ['IA', 'machine learning']],
    ];

    public function __construct(
        private readonly AIService $ai,
        private readonly ProfileScoreService $profileScore,
        private readonly MatchingService $matching,
    ) {}

    public function analyzeProfileDeep(User $user): array
    {
        $user->loadMissing(['skills', 'portfolioProjects']);
        $base = $this->profileScore->analyze($user);
        $ai = $this->ai->analyzeProfile($user);

        $raw = $this->ai->promptJson($this->profileDeepPrompt($user, $base));

        $result = $raw ? $this->normalizeProfileDeep($raw, $base, $ai) : $this->fallbackProfileDeep($user, $base, $ai);

        return $this->persist($user, 'profile_analysis', [], $result);
    }

    public function discoverAchievements(User $user, ?string $rawNotes = null): array
    {
        $user->loadMissing(['skills', 'portfolioProjects']);
        $notes = $rawNotes ?: ($user->experience ?? '')."\n".($user->bio ?? '');

        $raw = $this->ai->promptJson($this->achievementsPrompt($user, $notes));

        $result = $raw ?: $this->fallbackAchievements($user, $notes);

        return $this->persist($user, 'achievements', ['notes' => $notes], $result);
    }

    public function improveCv(User $user): array
    {
        $user->loadMissing(['skills', 'portfolioProjects']);
        $raw = $this->ai->promptJson($this->cvPrompt($user));

        $result = $raw ?: $this->fallbackCv($user);

        if (! empty($result['cv_text'])) {
            $user->update(['cv_text' => $result['cv_text']]);
        }

        return $this->persist($user, 'cv_improve', [], $result);
    }

    public function improveLinkedIn(User $user): array
    {
        $user->loadMissing(['skills', 'portfolioProjects']);
        $raw = $this->ai->promptJson($this->linkedinPrompt($user));

        $result = $raw ?: $this->fallbackLinkedIn($user);

        if (! empty($result['headline'])) {
            $user->update(['linkedin_headline' => $result['headline']]);
        }

        return $this->persist($user, 'linkedin_improve', [], $result);
    }

    public function analyzeJobOffer(User $user, string $offerText): array
    {
        $user->loadMissing('skills');
        $raw = $this->ai->promptJson($this->offerPrompt($user, $offerText), maxTokens: 2500);

        $result = $raw ?: $this->fallbackOfferAnalysis($user, $offerText);

        return $this->persist($user, 'offer_analysis', ['offer_text' => mb_substr($offerText, 0, 8000)], $result);
    }

    public function buildStudyPlan(User $user, string $offerText, ?string $targetRole = null): array
    {
        $user->loadMissing('skills');
        if ($targetRole) {
            $user->update(['target_role' => $targetRole]);
        }

        $offerAnalysis = $this->analyzeJobOffer($user, $offerText);
        $gaps = $offerAnalysis['missing_skills'] ?? [];

        $raw = $this->ai->promptJson($this->studyPlanPrompt($user, $offerText, $targetRole, $gaps), maxTokens: 3000);

        $courses = $this->matchFreeCourses(is_array($gaps) ? $gaps : []);
        $result = $raw
            ? array_merge($this->normalizeStudyPlan($raw), ['free_courses' => $courses])
            : $this->fallbackStudyPlan($user, $offerText, $targetRole, $courses);

        return $this->persist($user, 'study_plan', [
            'offer_text' => mb_substr($offerText, 0, 4000),
            'target_role' => $targetRole,
        ], $result);
    }

    public function targetRolePath(User $user, string $targetRole): array
    {
        $user->update(['target_role' => $targetRole]);
        $user->loadMissing('skills');

        $raw = $this->ai->promptJson($this->targetRolePrompt($user, $targetRole), maxTokens: 2800);

        $courses = $this->matchFreeCourses([]);
        $result = $raw
            ? array_merge($this->normalizeTargetRole($raw), ['free_courses' => $courses])
            : $this->fallbackTargetRole($user, $targetRole, $courses);

        return $this->persist($user, 'target_role_path', ['target_role' => $targetRole], $result);
    }

    public function evaluateReadiness(User $user, string $offerText): array
    {
        $user->loadMissing('skills');
        $raw = $this->ai->promptJson($this->readinessPrompt($user, $offerText));

        $result = $raw ?: $this->fallbackReadiness($user, $offerText);

        return $this->persist($user, 'readiness', ['offer_text' => mb_substr($offerText, 0, 4000)], $result);
    }

    public function startInterview(User $user, string $context, string $mode = 'offer'): array
    {
        $user->loadMissing('skills');
        $raw = $this->ai->promptJson($this->interviewStartPrompt($user, $context, $mode));

        $result = $raw ?: $this->fallbackInterviewStart($user, $context);

        return $this->persist($user, 'interview_start', ['context' => mb_substr($context, 0, 2000), 'mode' => $mode], $result);
    }

    public function evaluateInterviewAnswer(User $user, string $question, string $answer, string $context): array
    {
        $raw = $this->ai->promptJson($this->interviewAnswerPrompt($user, $question, $answer, $context));

        $result = $raw ?: $this->fallbackInterviewAnswer($question, $answer);

        return $this->persist($user, 'interview_answer', [
            'question' => $question,
            'answer' => mb_substr($answer, 0, 3000),
        ], $result);
    }

    public function projectCoachingTips(User $user, WorkJob $job): array
    {
        $user->loadMissing('skills');
        $match = $this->matching->scoreJobForUser($user, $job);
        $raw = $this->ai->promptJson($this->projectTipsPrompt($user, $job, $match));

        $result = $raw ?: $this->fallbackProjectTips($user, $job, $match);

        return $this->persist($user, 'project_coaching', ['job_id' => $job->id], $result);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function matchFreeCourses(array $skills): array
    {
        $needles = array_map('mb_strtolower', $skills);
        $matched = [];

        foreach (self::FREE_COURSES as $course) {
            foreach ($course['skills'] as $skill) {
                $s = mb_strtolower($skill);
                foreach ($needles as $needle) {
                    if ($needle === '' || str_contains($s, $needle) || str_contains($needle, $s)) {
                        $matched[] = $course;
                        break 2;
                    }
                }
            }
        }

        if ($matched === []) {
            $matched = array_slice(self::FREE_COURSES, 0, 4);
        }

        return array_values(array_slice($matched, 0, 6));
    }

    // ─── Persistencia ───────────────────────────────────────────────────────────

  /**
   * @param  array<string, mixed>  $input
   * @param  array<string, mixed>  $output
   * @return array<string, mixed>
   */
    private function persist(User $user, string $type, array $input, array $output): array
    {
        if (isset($output['_ai_provider'])) {
            $output['source'] = (string) $output['_ai_provider'];
            unset($output['_ai_provider']);
        }

        $source = (string) ($output['source'] ?? 'local');
        $output['source'] = $source;

        CareerSession::query()->create([
            'user_id' => $user->id,
            'type' => $type,
            'input' => $input ?: null,
            'output' => $output,
            'source' => $source,
        ]);

        return $output;
    }

    private function userContext(User $user): string
    {
        $skills = $user->skills->pluck('name')->implode(', ') ?: 'sin skills registradas';
        $portfolio = $user->portfolioProjects->pluck('title')->implode(', ') ?: 'sin portfolio';

        return <<<CTX
Nombre: {$user->name}
Rol objetivo: {$user->target_role}
Ciudad: {$user->city}
Bio: {$user->bio}
Experiencia declarada: {$user->experience}
Skills: {$skills}
Portfolio: {$portfolio}
CTX;
    }

    // ─── Prompts ─────────────────────────────────────────────────────────────────

    private function profileDeepPrompt(User $user, array $base): string
    {
        $ctx = $this->userContext($user);

        return <<<PROMPT
Eres mentor laboral y recruiter tech. Analiza este perfil de freelancer latinoamericano en WorkConnect.
Responde SOLO JSON válido:
{
  "score": {$base['score']},
  "summary": "resumen ejecutivo 2-3 oraciones",
  "strengths": ["fortalezas técnicas detectadas"],
  "weaknesses": ["debilidades o gaps"],
  "hidden_potential": ["logros o ángulos que el usuario podría no estar comunicando"],
  "ats_tips": ["consejos para CV ATS-friendly"],
  "linkedin_tips": ["consejos para perfil LinkedIn"],
  "priority_actions": ["3 acciones concretas esta semana"],
  "source": "nvidia"
}
Perfil:
{$ctx}
PROMPT;
    }

    private function achievementsPrompt(User $user, string $notes): string
    {
        $ctx = $this->userContext($user);

        return <<<PROMPT
Eres coach de carrera. El usuario no sabe identificar sus logros profesionales.
Convierte frases débiles en bullets de impacto para CV/LinkedIn (formato ATS, verbos de acción, métricas si se infieren).
Responde SOLO JSON:
{
  "achievements": [
    {"weak": "frase original débil", "strong": "versión profesional con impacto", "category": "técnico|operaciones|liderazgo"}
  ],
  "tips": ["cómo encontrar más logros en su día a día"],
  "source": "nvidia"
}
Perfil:
{$ctx}
Notas del usuario:
{$notes}
PROMPT;
    }

    private function cvPrompt(User $user): string
    {
        return <<<PROMPT
Genera un CV ATS-friendly en español para este perfil. Responde SOLO JSON:
{
  "cv_text": "texto completo del CV listo para copiar (secciones: resumen, skills, experiencia, proyectos, educación si aplica)",
  "sections": {"summary": "", "skills": "", "experience": "", "projects": ""},
  "ats_keywords": ["palabras clave para ATS"],
  "improvements": ["qué mejoró respecto a un CV genérico"],
  "source": "nvidia"
}
{$this->userContext($user)}
PROMPT;
    }

    private function linkedinPrompt(User $user): string
    {
        return <<<PROMPT
Optimiza perfil LinkedIn (headline + about + bullets de experiencia). Formato compatible con LinkedIn, no markdown excesivo.
Responde SOLO JSON:
{
  "headline": "máx 220 caracteres",
  "about": "sección Acerca de 2-3 párrafos",
  "experience_bullets": ["bullets de logros para experiencia"],
  "featured_suggestions": ["qué destacar en proyectos"],
  "source": "nvidia"
}
{$this->userContext($user)}
PROMPT;
    }

    private function offerPrompt(User $user, string $offer): string
    {
        return <<<PROMPT
Analiza esta oferta laboral y compárala con el perfil del candidato.
Responde SOLO JSON:
{
  "role_title": "",
  "company": "",
  "required_skills": [],
  "nice_to_have": [],
  "matched_skills": [],
  "missing_skills": [],
  "compatibility_percent": 0,
  "summary": "análisis en 3-4 oraciones",
  "apply_recommendation": "aplicar ahora|prepararse primero|no recomendado",
  "source": "nvidia"
}
Perfil candidato:
{$this->userContext($user)}
Oferta:
{$offer}
PROMPT;
    }

    private function studyPlanPrompt(User $user, string $offer, ?string $role, array $gaps): string
    {
        $gapsStr = implode(', ', $gaps);

        return <<<PROMPT
Crea un plan de estudio personalizado de 2-4 semanas para prepararse a esta vacante o rol.
Responde SOLO JSON:
{
  "weeks": [
    {"week": 1, "focus": "", "tasks": ["tareas diarias"], "resources": ["recursos"]}
  ],
  "milestones": ["hitos medibles"],
  "practice_projects": ["mini proyectos para portafolio"],
  "interview_prep": ["temas para entrevista técnica"],
  "source": "nvidia"
}
Rol objetivo: {$role}
Skills a reforzar: {$gapsStr}
Perfil:
{$this->userContext($user)}
Oferta/contexto:
{$offer}
PROMPT;
    }

    private function targetRolePrompt(User $user, string $role): string
    {
        return <<<PROMPT
El usuario aspira a este puesto: {$role}
Genera ruta de preparación: cómo aplicar, qué estudiar, evaluación final sugerida.
Responde SOLO JSON:
{
  "role": "{$role}",
  "market_summary": "qué buscan empresas para este rol en LATAM",
  "current_gap_analysis": ["gaps vs perfil actual"],
  "how_to_apply": ["pasos para postular con éxito"],
  "study_roadmap": [{"phase": "1", "title": "", "topics": [], "duration_days": 7}],
  "portfolio_suggestions": ["proyectos demo recomendados"],
  "evaluation_criteria": ["cómo saber si está listo"],
  "source": "nvidia"
}
{$this->userContext($user)}
PROMPT;
    }

    private function readinessPrompt(User $user, string $offer): string
    {
        return <<<PROMPT
Evalúa si el candidato está listo para aplicar a esta oferta. Responde SOLO JSON:
{
  "ready": true,
  "confidence_percent": 0,
  "verdict": "preparado|parcialmente preparado|no preparado",
  "strengths_for_role": [],
  "gaps_to_close": [],
  "improve_before_apply": ["acciones antes de aplicar"],
  "can_apply_now": true,
  "source": "nvidia"
}
{$this->userContext($user)}
Oferta:
{$offer}
PROMPT;
    }

    private function interviewStartPrompt(User $user, string $context, string $mode): string
    {
        return <<<PROMPT
Genera la primera pregunta de una simulación de entrevista técnica en español.
Modo: {$mode}. Responde SOLO JSON:
{
  "question": "pregunta clara",
  "topic": "área evaluada",
  "difficulty": "junior|mid",
  "tips": ["pista breve sin dar la respuesta"],
  "source": "nvidia"
}
{$this->userContext($user)}
Contexto vacante:
{$context}
PROMPT;
    }

    private function interviewAnswerPrompt(User $user, string $question, string $answer, string $context): string
    {
        return <<<PROMPT
Evalúa la respuesta de entrevista técnica. Responde SOLO JSON:
{
  "score": 0,
  "feedback": "feedback constructivo",
  "strengths": [],
  "improvements": [],
  "model_answer_hint": "orientación sin respuesta completa",
  "follow_up_question": "siguiente pregunta opcional",
  "source": "nvidia"
}
Pregunta: {$question}
Respuesta candidato: {$answer}
Contexto: {$context}
Perfil: {$this->userContext($user)}
PROMPT;
    }

    private function projectTipsPrompt(User $user, WorkJob $job, int $match): string
    {
        $skills = $user->skills->pluck('name')->implode(', ');

        return <<<PROMPT
El freelancer fue aceptado en un micro-proyecto WorkConnect. Da coaching práctico.
Responde SOLO JSON:
{
  "match_percent": {$match},
  "strengths_to_leverage": ["ej: React y Laravel — úsalos así..."],
  "delivery_tips": ["consejos de entrega al cliente PYME"],
  "communication_tips": ["cómo hablar con el empresario"],
  "risk_warnings": ["riesgos a evitar"],
  "source": "nvidia"
}
Proyecto: {$job->title} — {$job->description}
Skills freelancer: {$skills}
PROMPT;
    }

    // ─── Normalizers & fallbacks ─────────────────────────────────────────────────

    private function normalizeProfileDeep(array $raw, array $base, array $ai): array
    {
        return [
            'score' => (int) ($raw['score'] ?? $base['score']),
            'summary' => (string) ($raw['summary'] ?? $ai['ai_summary'] ?? $base['summary']),
            'strengths' => array_values($raw['strengths'] ?? $base['strengths']),
            'weaknesses' => array_values($raw['weaknesses'] ?? []),
            'hidden_potential' => array_values($raw['hidden_potential'] ?? []),
            'ats_tips' => array_values($raw['ats_tips'] ?? []),
            'linkedin_tips' => array_values($raw['linkedin_tips'] ?? []),
            'priority_actions' => array_values($raw['priority_actions'] ?? $base['tips']),
            'tips' => array_values($base['tips']),
            'ai_summary' => (string) ($ai['ai_summary'] ?? ''),
            'source' => (string) ($raw['_ai_provider'] ?? $raw['source'] ?? $ai['source'] ?? 'local'),
        ];
    }

    private function fallbackProfileDeep(User $user, array $base, array $ai): array
    {
        $user->loadMissing('skills');

        return [
            ...$this->normalizeProfileDeep([
                'weaknesses' => $base['score'] < 70 ? ['Completa portfolio y experiencia detallada'] : [],
                'hidden_potential' => ['Proyectos en WorkConnect como experiencia verificable'],
                'ats_tips' => ['Usa verbos de acción', 'Incluye skills del job description', 'Una página si eres junior'],
                'linkedin_tips' => ['Headline con rol + stack', 'About con resultados', 'Añade proyectos con enlace'],
            ], $base, $ai),
            'source' => 'local',
        ];
    }

    private function fallbackAchievements(User $user, string $notes): array
    {
        $samples = [];
        if (trim($notes) !== '') {
            foreach (preg_split('/[.\n;]+/', $notes) as $line) {
                $line = trim($line);
                if (strlen($line) < 8) {
                    continue;
                }
                $samples[] = [
                    'weak' => $line,
                    'strong' => 'Ejecuté y documenté: '.ucfirst($line).' con entregables medibles para el negocio.',
                    'category' => 'técnico',
                ];
                if (count($samples) >= 5) {
                    break;
                }
            }
        }

        if ($samples === []) {
            $samples[] = [
                'weak' => 'Hice proyectos personales',
                'strong' => 'Desarrollé y desplegué proyectos propios con stack moderno, documentados en portafolio público.',
                'category' => 'técnico',
            ];
        }

        return [
            'achievements' => $samples,
            'tips' => ['Anota cada tarea que resolvió un problema real', 'Incluye números: tiempo, usuarios, % mejora'],
            'source' => 'local',
        ];
    }

    private function fallbackCv(User $user): array
    {
        $skills = $user->skills->pluck('name')->implode(' · ');
        $cv = "{$user->name}\n{$user->city}\n\nRESUMEN\n{$user->bio}\n\nSKILLS\n{$skills}\n\nEXPERIENCIA\n{$user->experience}\n\nPROYECTOS\n".
            $user->portfolioProjects->map(fn ($p) => "- {$p->title}: {$p->description}")->implode("\n");

        return [
            'cv_text' => $cv,
            'sections' => ['summary' => (string) $user->bio, 'skills' => $skills, 'experience' => (string) $user->experience, 'projects' => ''],
            'ats_keywords' => $user->skills->pluck('name')->take(8)->all(),
            'improvements' => ['Formato ATS con secciones claras', 'Verbos de acción al inicio de cada bullet'],
            'source' => 'local',
        ];
    }

    private function fallbackLinkedIn(User $user): array
    {
        $skills = $user->skills->take(4)->pluck('name')->implode(' · ');

        return [
            'headline' => ($user->target_role ?: 'Talento digital').' | '.$skills.' | Proyectos reales en WorkConnect',
            'about' => (string) $user->bio,
            'experience_bullets' => ['Entregué soluciones digitales a PYMEs con alcance definido y comunicación continua'],
            'featured_suggestions' => ['Enlaza tu perfil público WorkConnect con QR'],
            'source' => 'local',
        ];
    }

    private function fallbackOfferAnalysis(User $user, string $offer): array
    {
        $userSkills = $user->skills->pluck('name')->map(fn ($s) => mb_strtolower($s))->all();
        $offerLower = mb_strtolower($offer);
        $matched = [];
        foreach ($user->skills as $skill) {
            if (str_contains($offerLower, mb_strtolower($skill->name))) {
                $matched[] = $skill->name;
            }
        }
        $missing = $user->skills->pluck('name')->diff($matched)->take(5)->values()->all();
        $compat = count($userSkills) > 0 ? (int) round((count($matched) / max(1, count($userSkills))) * 100) : 40;

        return [
            'role_title' => 'Vacante analizada',
            'company' => 'Por confirmar',
            'required_skills' => array_slice($matched, 0, 8),
            'nice_to_have' => [],
            'matched_skills' => $matched,
            'missing_skills' => $missing ?: ['Completar skills en perfil'],
            'compatibility_percent' => min(95, $compat),
            'summary' => 'Análisis local basado en coincidencia de palabras clave entre tu perfil y la oferta.',
            'apply_recommendation' => $compat >= 60 ? 'prepararse primero' : 'prepararse primero',
            'source' => 'local',
        ];
    }

    private function normalizeStudyPlan(array $raw): array
    {
        return [
            'weeks' => array_values($raw['weeks'] ?? []),
            'milestones' => array_values($raw['milestones'] ?? []),
            'practice_projects' => array_values($raw['practice_projects'] ?? []),
            'interview_prep' => array_values($raw['interview_prep'] ?? []),
            'source' => (string) ($raw['_ai_provider'] ?? $raw['source'] ?? 'local'),
        ];
    }

    private function fallbackStudyPlan(User $user, string $offer, ?string $role, array $courses): array
    {
        return [
            'weeks' => [
                ['week' => 1, 'focus' => 'Fundamentos del rol', 'tasks' => ['Revisar requisitos de la oferta', 'Completar 1 curso clave'], 'resources' => ['Documentación oficial']],
                ['week' => 2, 'focus' => 'Práctica', 'tasks' => ['Mini proyecto para portafolio', 'Actualizar CV y LinkedIn'], 'resources' => ['WorkConnect proyectos']],
            ],
            'milestones' => ['Perfil al 80%', '1 proyecto demo publicado'],
            'practice_projects' => ['Clonar funcionalidad core de la oferta en repo GitHub'],
            'interview_prep' => ['Explica tu experiencia con STAR', 'Prepara 3 preguntas para el empleador'],
            'free_courses' => $courses,
            'target_role' => $role,
            'source' => 'local',
        ];
    }

    private function normalizeTargetRole(array $raw): array
    {
        return [
            'role' => (string) ($raw['role'] ?? ''),
            'market_summary' => (string) ($raw['market_summary'] ?? ''),
            'current_gap_analysis' => array_values($raw['current_gap_analysis'] ?? []),
            'how_to_apply' => array_values($raw['how_to_apply'] ?? []),
            'study_roadmap' => array_values($raw['study_roadmap'] ?? []),
            'portfolio_suggestions' => array_values($raw['portfolio_suggestions'] ?? []),
            'evaluation_criteria' => array_values($raw['evaluation_criteria'] ?? []),
            'source' => (string) ($raw['_ai_provider'] ?? $raw['source'] ?? 'local'),
        ];
    }

    private function fallbackTargetRole(User $user, string $role, array $courses): array
    {
        return [
            'role' => $role,
            'market_summary' => "Empresas buscan {$role} con proyectos demostrables y comunicación clara con stakeholders.",
            'current_gap_analysis' => $user->skills->count() < 4 ? ['Añadir más skills al perfil'] : ['Profundizar en entregables medibles'],
            'how_to_apply' => ['Adapta CV con palabras de la vacante', 'Postula con carta personalizada', 'Usa tu QR WorkConnect en entrevista'],
            'study_roadmap' => [
                ['phase' => '1', 'title' => 'Base', 'topics' => ['Requisitos del rol', 'Stack principal'], 'duration_days' => 7],
                ['phase' => '2', 'title' => 'Práctica', 'topics' => ['Proyecto demo', 'Simulación entrevista'], 'duration_days' => 14],
            ],
            'portfolio_suggestions' => ["Proyecto tipo {$role} publicado en WorkConnect"],
            'evaluation_criteria' => ['Puedes explicar 3 proyectos con impacto', 'Completaste plan de estudio'],
            'free_courses' => $courses,
            'source' => 'local',
        ];
    }

    private function fallbackReadiness(User $user, string $offer): array
    {
        $analysis = $this->fallbackOfferAnalysis($user, $offer);
        $pct = (int) ($analysis['compatibility_percent'] ?? 50);

        return [
            'ready' => $pct >= 65,
            'confidence_percent' => $pct,
            'verdict' => $pct >= 70 ? 'parcialmente preparado' : 'no preparado',
            'strengths_for_role' => $analysis['matched_skills'],
            'gaps_to_close' => $analysis['missing_skills'],
            'improve_before_apply' => ['Completa plan de estudio', 'Haz simulación de entrevista'],
            'can_apply_now' => $pct >= 80,
            'source' => 'local',
        ];
    }

    private function fallbackInterviewStart(User $user, string $context): array
    {
        $skill = $user->skills->first()?->name ?? 'desarrollo web';

        return [
            'question' => "Cuéntame un proyecto reciente donde usaste {$skill} y qué resultado obtuvo el cliente o usuario.",
            'topic' => $skill,
            'difficulty' => 'junior',
            'tips' => ['Usa método STAR: situación, tarea, acción, resultado'],
            'source' => 'local',
        ];
    }

    private function fallbackInterviewAnswer(string $question, string $answer): array
    {
        $len = strlen(trim($answer));

        return [
            'score' => $len > 120 ? 75 : 45,
            'feedback' => $len > 120
                ? 'Buena extensión. Intenta cuantificar el impacto (%, tiempo, usuarios).'
                : 'Amplía tu respuesta con un ejemplo concreto y resultado medible.',
            'strengths' => $len > 80 ? ['Respondiste con contexto'] : [],
            'improvements' => ['Añade métricas', 'Menciona tu rol específico'],
            'model_answer_hint' => 'Estructura: contexto → qué hiciste tú → resultado medible',
            'follow_up_question' => '¿Qué harías diferente si tuvieras una semana más en ese proyecto?',
            'source' => 'local',
        ];
    }

    private function fallbackProjectTips(User $user, WorkJob $job, int $match): array
    {
        $top = $user->skills->take(2)->pluck('name')->all();
        $stack = implode(' y ', $top) ?: 'tu stack';

        return [
            'match_percent' => $match,
            'strengths_to_leverage' => ["Tu fuerte es {$stack}: úsalo para acotar entregables y comunicar límites al cliente"],
            'delivery_tips' => ['Define entregables por escrito en mensajes', 'Entrega MVP antes de extras'],
            'communication_tips' => ['Responde en 24h', 'Confirma presupuesto y plazo por escrito'],
            'risk_warnings' => ['No ampliar alcance sin ajustar precio o plazo'],
            'source' => 'local',
        ];
    }
}
