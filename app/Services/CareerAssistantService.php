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

        // Una sola llamada IA (modelo rápido) en lugar de analyzeProfile + promptJson.
        $raw = $this->careerPromptJson($this->profileDeepPrompt($user, $base), 1100);

        $result = $raw ? $this->normalizeProfileDeep($raw, $base) : $this->fallbackProfileDeep($user, $base);

        return $this->persist($user, 'profile_analysis', [], $result);
    }

    public function discoverAchievements(User $user, ?string $rawNotes = null): array
    {
        $user->loadMissing(['skills', 'portfolioProjects']);
        $notes = $rawNotes ?: ($user->experience ?? '')."\n".($user->bio ?? '');

        $raw = $this->careerPromptJson($this->achievementsPrompt($user, $notes), 900);

        $result = $raw ?: $this->fallbackAchievements($user, $notes);

        return $this->persist($user, 'achievements', ['notes' => $notes], $result);
    }

    public function improveCv(
        User $user,
        ?string $targetRole = null,
        ?string $offerText = null,
        ?string $cvDraft = null,
    ): array {
        $user->loadMissing(['skills', 'portfolioProjects']);

        if ($targetRole) {
            $user->update(['target_role' => $targetRole]);
        }

        $raw = $this->careerPromptJson(
            $this->cvPrompt($user, $targetRole, $offerText, $cvDraft),
            2200,
        );

        $result = $raw ? $this->normalizeCvResult($raw) : $this->fallbackCv($user, $targetRole);

        if (! empty($result['cv_text'])) {
            $user->update(['cv_text' => $result['cv_text']]);
        }

        return $this->persist($user, 'cv_improve', [
            'target_role' => $targetRole,
            'has_offer' => filled($offerText),
            'has_draft' => filled($cvDraft),
        ], $result);
    }

    public function improveLinkedIn(User $user, ?string $cvText = null, ?string $targetRole = null): array
    {
        $user->loadMissing(['skills', 'portfolioProjects']);

        if ($targetRole) {
            $user->update(['target_role' => $targetRole]);
        }

        $raw = $this->careerPromptJson($this->linkedinPrompt($user, $cvText), 1400);

        $result = $raw ? $this->normalizeLinkedInResult($raw) : $this->fallbackLinkedIn($user);

        if (! empty($result['headline'])) {
            $user->update(['linkedin_headline' => $result['headline']]);
        }

        return $this->persist($user, 'linkedin_improve', [
            'has_cv_sync' => filled($cvText),
            'target_role' => $targetRole,
        ], $result);
    }

    public function analyzeJobOffer(User $user, string $offerText): array
    {
        $user->loadMissing('skills');
        $raw = $this->careerPromptJson($this->offerPrompt($user, $offerText), 1200);

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

        $raw = $this->careerPromptJson($this->studyPlanPrompt($user, $offerText, $targetRole, $gaps), 1800);

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

        $raw = $this->careerPromptJson($this->targetRolePrompt($user, $targetRole), 1500);

        $roleKeywords = preg_split('/[\s,\-\/]+/', mb_strtolower($targetRole));
        $gapSkills = $raw['skills_to_learn'] ?? $raw['current_gap_analysis'] ?? $roleKeywords;
        $courses = $this->matchFreeCourses(is_array($gapSkills) ? $gapSkills : [$targetRole]);
        $result = $raw
            ? array_merge($this->normalizeTargetRole($raw), ['free_courses' => $courses])
            : $this->fallbackTargetRole($user, $targetRole, $courses);

        return $this->persist($user, 'target_role_path', ['target_role' => $targetRole], $result);
    }

    public function evaluateReadiness(User $user, string $offerText): array
    {
        $user->loadMissing('skills');
        $raw = $this->careerPromptJson($this->readinessPrompt($user, $offerText), 800);

        $result = $raw ?: $this->fallbackReadiness($user, $offerText);

        return $this->persist($user, 'readiness', ['offer_text' => mb_substr($offerText, 0, 4000)], $result);
    }

    /**
     * @param  array<int, array{name: string, type: string, excerpt: string}>  $fileSummaries
     */
    public function resolveInterviewContext(
        User $user,
        ?string $offerText,
        ?string $targetRole,
        ?string $notes,
        ?string $explicitContext,
        string $attachmentsText = '',
    ): string {
        $user->loadMissing('skills');
        $parts = [];

        if ($targetRole && trim($targetRole) !== '') {
            $parts[] = 'Puesto objetivo: '.trim($targetRole);
        }
        if ($offerText && trim($offerText) !== '') {
            $parts[] = "Oferta / vacante:\n".trim($offerText);
        }
        if ($notes && trim($notes) !== '') {
            $parts[] = "Notas del candidato:\n".trim($notes);
        }
        if ($attachmentsText !== '') {
            $parts[] = "Material adjunto (texto o análisis de imagen):\n".$attachmentsText;
        }
        if ($explicitContext && trim($explicitContext) !== '') {
            $parts[] = trim($explicitContext);
        }

        if ($parts === []) {
            $parts[] = $this->userContext($user);
            $parts[] = 'Práctica general de entrevista técnica y comportamental para talento joven freelancer en LATAM.';
        }

        return mb_substr(implode("\n\n", $parts), 0, 18000);
    }

    public function startInterview(User $user, string $context, string $mode = 'offer'): array
    {
        $user->loadMissing('skills');
        $materialsRaw = $this->careerPromptJson($this->interviewMaterialsPrompt($user, $context), 700);
        $materials = $this->normalizeInterviewMaterials($materialsRaw);

        $raw = $this->careerPromptJson(
            $this->interviewStartPrompt($user, $context, $mode, $materials),
            1100,
        );

        $result = $this->normalizeInterviewStart($raw ?: $this->fallbackInterviewStart($user, $context), $materials);

        return $this->persist($user, 'interview_start', [
            'context' => mb_substr($context, 0, 2000),
            'mode' => $mode,
        ], $result);
    }

    public function evaluateInterviewAnswer(User $user, string $question, string $answer, string $context): array
    {
        $raw = $this->careerPromptJson($this->interviewAnswerPrompt($user, $question, $answer, $context), 1100);

        $result = $this->normalizeInterviewAnswer($raw ?: $this->fallbackInterviewAnswer($question, $answer));

        return $this->persist($user, 'interview_answer', [
            'question' => $question,
            'answer' => mb_substr($answer, 0, 3000),
            'context' => mb_substr($context, 0, 500),
        ], $result);
    }

    public function projectCoachingTips(User $user, WorkJob $job): array
    {
        $user->loadMissing('skills');
        $match = $this->matching->scoreJobForUser($user, $job);
        $raw = $this->careerPromptJson($this->projectTipsPrompt($user, $job, $match), 700);

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

    /**
     * IA de carrera: modelo rápido (NVIDIA fast / cadena de fallback).
     *
     * @return array<string, mixed>|null
     */
    private function careerPromptJson(string $prompt, int $maxTokens = 1200): ?array
    {
        return $this->ai->promptJson($prompt, $this->ai->fastModel(), $maxTokens, fast: true);
    }

    // ─── Prompts ─────────────────────────────────────────────────────────────────

    private function profileDeepPrompt(User $user, array $base): string
    {
        $ctx = $this->userContext($user);
        $score = (int) $base['score'];

        return <<<PROMPT
Mentor laboral tech LATAM. Analiza perfil WorkConnect. JSON compacto, español, sin markdown:
{
  "score": {$score},
  "summary": "2 oraciones ejecutivas",
  "ai_summary": "2 oraciones para perfil público (valor + por qué contratarlo)",
  "strengths": ["máx 4"],
  "weaknesses": ["máx 3"],
  "hidden_potential": ["máx 3"],
  "ats_tips": ["máx 3 cortos"],
  "linkedin_tips": ["máx 3 cortos"],
  "priority_actions": ["3 acciones esta semana"],
  "source": "nvidia"
}
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

    private function cvPrompt(User $user, ?string $targetRole, ?string $offerText, ?string $cvDraft): string
    {
        $extra = '';
        if ($targetRole) {
            $extra .= "\nRol objetivo: {$targetRole}";
        }
        if ($offerText) {
            $extra .= "\n\nVacante (adapta palabras clave y enfoque del CV):\n".mb_substr($offerText, 0, 6000);
        }
        if ($cvDraft) {
            $extra .= "\n\nCV actual del usuario (mejóralo, no lo acortes sin motivo):\n".mb_substr($cvDraft, 0, 8000);
        }

        $mode = $cvDraft ? 'Mejora el CV existente' : 'Genera un CV completo desde el perfil';

        return <<<PROMPT
Eres experto en CVs ATS y reclutamiento tech en LATAM. {$mode} en español profesional.
Responde SOLO JSON válido:
{
  "cv_text": "texto completo del CV listo para copiar (nombre, contacto, resumen, skills, experiencia, proyectos, educación si aplica)",
  "sections": {"summary": "", "skills": "", "experience": "", "projects": "", "education": ""},
  "ats_score": 0,
  "ats_keywords": ["keywords ya presentes o recomendadas"],
  "keywords_to_add": ["keywords que faltan para el rol/vacante"],
  "improvements": ["cambios clave realizados"],
  "format_tips": ["consejos de formato ATS: fuentes, longitud, secciones"],
  "bullet_upgrades": [{"before": "bullet débil", "after": "bullet con impacto y métrica", "section": "experience|projects"}],
  "red_flags": ["errores a corregir: fechas, huecos, clichés"],
  "role_fit_summary": "2-3 oraciones sobre encaje con el rol/vacante",
  "source": "nvidia"
}
{$extra}
{$this->userContext($user)}
PROMPT;
    }

    private function normalizeCvResult(array $raw): array
    {
        $bullets = [];
        foreach ($raw['bullet_upgrades'] ?? [] as $item) {
            if (! is_array($item)) {
                continue;
            }
            $bullets[] = [
                'before' => (string) ($item['before'] ?? ''),
                'after' => (string) ($item['after'] ?? ''),
                'section' => (string) ($item['section'] ?? 'experience'),
            ];
        }

        return [
            'cv_text' => (string) ($raw['cv_text'] ?? ''),
            'sections' => is_array($raw['sections'] ?? null) ? $raw['sections'] : [],
            'ats_score' => min(100, max(0, (int) ($raw['ats_score'] ?? 72))),
            'ats_keywords' => array_values(array_filter($raw['ats_keywords'] ?? [], 'is_string')),
            'keywords_to_add' => array_values(array_filter($raw['keywords_to_add'] ?? [], 'is_string')),
            'improvements' => array_values(array_filter($raw['improvements'] ?? [], 'is_string')),
            'format_tips' => array_values(array_filter($raw['format_tips'] ?? [], 'is_string')),
            'bullet_upgrades' => $bullets,
            'red_flags' => array_values(array_filter($raw['red_flags'] ?? [], 'is_string')),
            'role_fit_summary' => (string) ($raw['role_fit_summary'] ?? ''),
            'source' => (string) ($raw['source'] ?? 'nvidia'),
        ];
    }

    private function linkedinPrompt(User $user, ?string $cvText): string
    {
        $cvBlock = $cvText
            ? "\n\nCV generado (alinea headline, about y bullets con este contenido, sin contradecirlo):\n".mb_substr($cvText, 0, 7000)
            : '';

        return <<<PROMPT
Optimiza perfil LinkedIn (headline + about + bullets) alineado al CV y al mercado laboral tech LATAM.
Sin markdown (#, **). Texto listo para pegar en LinkedIn.
Responde SOLO JSON:
{
  "headline": "máx 220 caracteres, keywords del rol",
  "about": "sección Acerca de 2-3 párrafos",
  "experience_bullets": ["bullets para experiencia en LinkedIn"],
  "featured_suggestions": ["qué destacar en proyectos o featured"],
  "upload_tips": ["2-3 pasos para subir el PDF en LinkedIn y completar el perfil"],
  "source": "nvidia"
}
{$cvBlock}
{$this->userContext($user)}
PROMPT;
    }

    private function normalizeLinkedInResult(array $raw): array
    {
        return [
            'headline' => (string) ($raw['headline'] ?? ''),
            'about' => (string) ($raw['about'] ?? ''),
            'experience_bullets' => array_values(array_filter($raw['experience_bullets'] ?? [], 'is_string')),
            'featured_suggestions' => array_values(array_filter($raw['featured_suggestions'] ?? [], 'is_string')),
            'upload_tips' => array_values(array_filter($raw['upload_tips'] ?? [], 'is_string')),
            'source' => (string) ($raw['source'] ?? 'nvidia'),
        ];
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

    private function interviewMaterialsPrompt(User $user, string $context): string
    {
        return <<<PROMPT
Analiza el material del candidato para preparar una entrevista. Responde SOLO JSON en español:
{
  "materials_summary": "2-4 oraciones: qué rol practica y qué pide el material",
  "prep_tips": ["5 consejos concretos antes de la entrevista"],
  "practice_focus": ["3 temas a repasar hoy"],
  "likely_question_types": ["técnica", "comportamental", "sobre el CV"],
  "source": "nvidia"
}
{$this->userContext($user)}
Material y contexto:
{$context}
PROMPT;
    }

    /**
     * @param  array<string, mixed>  $materials
     */
    private function interviewStartPrompt(User $user, string $context, string $mode, array $materials): string
    {
        $prep = json_encode($materials, JSON_UNESCAPED_UNICODE);

        return <<<PROMPT
Genera la primera pregunta de una simulación de entrevista en español (técnica o mixta según el rol).
Modo: {$mode}. Responde SOLO JSON:
{
  "question": "pregunta clara y realista",
  "topic": "área evaluada",
  "difficulty": "junior|mid",
  "interview_type": "técnica|comportamental|mixta",
  "tips": ["2 pistas para responder sin revelar la respuesta"],
  "prep_tips": ["reutiliza o complementa los del análisis"],
  "source": "nvidia"
}
Análisis previo del material:
{$prep}
{$this->userContext($user)}
Contexto completo:
{$context}
PROMPT;
    }

    /**
     * @return array<string, mixed>
     */
    private function normalizeInterviewMaterials(?array $raw): array
    {
        if (! is_array($raw)) {
            return [
                'materials_summary' => '',
                'prep_tips' => [],
                'practice_focus' => [],
                'likely_question_types' => [],
            ];
        }

        return [
            'materials_summary' => (string) ($raw['materials_summary'] ?? ''),
            'prep_tips' => array_values($raw['prep_tips'] ?? []),
            'practice_focus' => array_values($raw['practice_focus'] ?? []),
            'likely_question_types' => array_values($raw['likely_question_types'] ?? []),
        ];
    }

    /**
     * @param  array<string, mixed>  $materials
     * @return array<string, mixed>
     */
    private function normalizeInterviewStart(array $raw, array $materials): array
    {
        $prep = array_values(array_unique(array_merge(
            $materials['prep_tips'] ?? [],
            $raw['prep_tips'] ?? [],
        )));

        return [
            'question' => (string) ($raw['question'] ?? 'Cuéntame un proyecto reciente y el impacto que tuvo.'),
            'topic' => (string) ($raw['topic'] ?? 'experiencia'),
            'difficulty' => (string) ($raw['difficulty'] ?? 'junior'),
            'interview_type' => (string) ($raw['interview_type'] ?? 'mixta'),
            'tips' => array_values($raw['tips'] ?? ['Usa método STAR']),
            'prep_tips' => array_slice($prep, 0, 8),
            'materials_summary' => (string) ($materials['materials_summary'] ?? $raw['materials_summary'] ?? ''),
            'practice_focus' => array_values($materials['practice_focus'] ?? []),
            'likely_question_types' => array_values($materials['likely_question_types'] ?? []),
            'source' => (string) ($raw['_ai_provider'] ?? $raw['source'] ?? 'local'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function normalizeInterviewAnswer(array $raw): array
    {
        return [
            'score' => (int) ($raw['score'] ?? 0),
            'feedback' => (string) ($raw['feedback'] ?? ''),
            'strengths' => array_values($raw['strengths'] ?? []),
            'improvements' => array_values($raw['improvements'] ?? []),
            'model_answer_hint' => (string) ($raw['model_answer_hint'] ?? ''),
            'follow_up_question' => (string) ($raw['follow_up_question'] ?? ''),
            'answer_tips' => array_values($raw['answer_tips'] ?? []),
            'source' => (string) ($raw['_ai_provider'] ?? $raw['source'] ?? 'local'),
        ];
    }

    private function interviewAnswerPrompt(User $user, string $question, string $answer, string $context): string
    {
        return <<<PROMPT
Evalúa la respuesta de entrevista. Responde SOLO JSON en español:
{
  "score": 0,
  "feedback": "2-3 oraciones constructivas y cercanas",
  "strengths": ["qué hizo bien"],
  "improvements": ["qué mejorar concretamente"],
  "model_answer_hint": "orientación STAR sin dar respuesta memorizada",
  "follow_up_question": "siguiente pregunta relacionada",
  "answer_tips": ["1 tip para la siguiente respuesta"],
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

    private function normalizeProfileDeep(array $raw, array $base): array
    {
        $summary = (string) ($raw['summary'] ?? $base['summary']);

        return [
            'score' => (int) ($raw['score'] ?? $base['score']),
            'summary' => $summary,
            'strengths' => array_values($raw['strengths'] ?? $base['strengths']),
            'weaknesses' => array_values($raw['weaknesses'] ?? []),
            'hidden_potential' => array_values($raw['hidden_potential'] ?? []),
            'ats_tips' => array_values($raw['ats_tips'] ?? []),
            'linkedin_tips' => array_values($raw['linkedin_tips'] ?? []),
            'priority_actions' => array_values($raw['priority_actions'] ?? $base['tips']),
            'tips' => array_values($base['tips']),
            'ai_summary' => (string) ($raw['ai_summary'] ?? $summary),
            'source' => (string) ($raw['_ai_provider'] ?? $raw['source'] ?? 'local'),
        ];
    }

    private function fallbackProfileDeep(User $user, array $base): array
    {
        return [
            ...$this->normalizeProfileDeep([
                'weaknesses' => $base['score'] < 70 ? ['Completa portfolio y experiencia detallada'] : [],
                'hidden_potential' => ['Proyectos en WorkConnect como experiencia verificable'],
                'ats_tips' => ['Usa verbos de acción', 'Incluye skills del job description', 'Una página si eres junior'],
                'linkedin_tips' => ['Headline con rol + stack', 'About con resultados', 'Añade proyectos con enlace'],
            ], $base),
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

    private function fallbackCv(User $user, ?string $targetRole = null): array
    {
        $skills = $user->skills->pluck('name')->implode(' · ');
        $role = $targetRole ?: $user->target_role ?: 'Talento digital';
        $cv = "{$user->name}\n{$user->city}\n\nRESUMEN\n{$user->bio}\n\nOBJETIVO\n{$role}\n\nSKILLS\n{$skills}\n\nEXPERIENCIA\n{$user->experience}\n\nPROYECTOS\n".
            $user->portfolioProjects->map(fn ($p) => "- {$p->title}: {$p->description}")->implode("\n");

        return [
            'cv_text' => $cv,
            'sections' => [
                'summary' => (string) $user->bio,
                'skills' => $skills,
                'experience' => (string) $user->experience,
                'projects' => $user->portfolioProjects->map(fn ($p) => $p->title)->implode(', '),
                'education' => '',
            ],
            'ats_score' => 68,
            'ats_keywords' => $user->skills->pluck('name')->take(8)->all(),
            'keywords_to_add' => ['Resultados medibles', 'Stack tecnológico explícito'],
            'improvements' => ['Formato ATS con secciones claras', 'Verbos de acción al inicio de cada bullet'],
            'format_tips' => ['Una columna, sin tablas complejas', 'PDF con texto seleccionable'],
            'bullet_upgrades' => [],
            'red_flags' => ['Completa fechas y enlaces a portfolio'],
            'role_fit_summary' => "Perfil orientado a {$role} con proyectos demostrables en WorkConnect.",
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
            'upload_tips' => [
                'Perfil → Añadir sección → Recomendado → Añadir currículum (PDF)',
                'Copia headline y Acerca de desde WorkConnect al perfil',
            ],
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

        return $this->normalizeInterviewStart([
            'question' => "Cuéntame un proyecto reciente donde usaste {$skill} y qué resultado obtuvo el cliente o usuario.",
            'topic' => $skill,
            'difficulty' => 'junior',
            'interview_type' => 'mixta',
            'tips' => ['Usa método STAR: situación, tarea, acción, resultado'],
            'prep_tips' => ['Repasa tu CV y 2 proyectos del portafolio', 'Prepara 3 preguntas para el entrevistador'],
            'source' => 'local',
        ], [
            'materials_summary' => mb_substr($context, 0, 280) ?: 'Práctica basada en tu perfil WorkConnect.',
            'prep_tips' => [],
            'practice_focus' => ['Proyectos del portafolio', 'Skills del rol'],
            'likely_question_types' => ['experiencia', 'motivación'],
        ]);
    }

    private function fallbackInterviewAnswer(string $question, string $answer): array
    {
        $len = strlen(trim($answer));

        return $this->normalizeInterviewAnswer([
            'score' => $len > 120 ? 75 : 45,
            'feedback' => $len > 120
                ? 'Buena extensión. Intenta cuantificar el impacto (%, tiempo, usuarios).'
                : 'Amplía tu respuesta con un ejemplo concreto y resultado medible.',
            'strengths' => $len > 80 ? ['Respondiste con contexto'] : [],
            'improvements' => ['Añade métricas', 'Menciona tu rol específico'],
            'model_answer_hint' => 'Estructura: contexto → qué hiciste tú → resultado medible',
            'follow_up_question' => '¿Qué harías diferente si tuvieras una semana más en ese proyecto?',
            'answer_tips' => ['Cierra con un resultado numérico si puedes'],
            'source' => 'local',
        ]);
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
