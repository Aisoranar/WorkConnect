<?php

namespace App\Services;

use Illuminate\Support\Str;

/**
 * Convierte la idea cruda del empresario en un requerimiento claro para jóvenes freelancers.
 */
class ProjectBriefService
{
    public function __construct(private readonly AIService $ai) {}

    /**
     * @return array{
     *   title: string,
     *   description: string,
     *   category: string,
     *   skills: array<int, string>,
     *   deliverables: array<int, string>,
     *   budget: string,
     *   currency: string,
     *   budget_amount: float,
     *   recommended_technologies: array<int, string>,
     *   estimated_time: string,
     *   difficulty_level: string,
     *   solution_type: string,
     *   remote: bool,
     *   summary: string,
     *   source: string
     * }
     */
    public function structure(
        string $rawNeed,
        string $currency,
        float $budgetAmount,
        ?string $businessContext = null,
    ): array {
        $budgetLabel = $this->formatBudgetFromCurrency($budgetAmount, $currency);

        $structured = $this->ai->structureProjectBrief($rawNeed, $currency, $budgetAmount, $businessContext);

        if ($structured === null) {
            $structured = $this->structureLocally($rawNeed, $currency, $budgetAmount, $businessContext);
        }

        return $this->enrichWithTechnologies($structured, $rawNeed, $currency, $budgetAmount, $budgetLabel);
    }

    /**
     * @param  array<string, mixed>  $structured
     * @return array<string, mixed>
     */
    private function enrichWithTechnologies(
        array $structured,
        string $rawNeed,
        string $currency,
        float $budgetAmount,
        string $budgetLabel,
    ): array {
        $category = (string) ($structured['category'] ?? 'General');
        $fromAi = array_map('strval', $structured['recommended_technologies'] ?? []);
        $recommended = $fromAi !== []
            ? array_values(array_unique($fromAi))
            : $this->inferRecommendedTechnologies($category, $rawNeed);

        $skills = array_values(array_unique(array_merge(
            array_map('strval', $structured['skills'] ?? []),
            $recommended,
        )));

        $description = (string) ($structured['description'] ?? $rawNeed);
        $description = $this->appendTechnologyBlock($description, $recommended);
        $solutionType = (string) ($structured['solution_type'] ?? $this->inferSolutionType($rawNeed, $category));
        $estimatedTime = (string) ($structured['estimated_time'] ?? $this->inferEstimatedTime($category, $budgetAmount, $currency));
        $difficulty = (string) ($structured['difficulty_level'] ?? $this->inferDifficulty($category, $rawNeed));

        return [
            'title' => (string) ($structured['title'] ?? 'Proyecto para PYME'),
            'description' => $description,
            'category' => $category,
            'skills' => $skills,
            'deliverables' => array_values($structured['deliverables'] ?? []),
            'budget' => $budgetLabel,
            'currency' => strtoupper($currency),
            'budget_amount' => $budgetAmount,
            'recommended_technologies' => $recommended,
            'estimated_time' => $estimatedTime,
            'difficulty_level' => $difficulty,
            'solution_type' => $solutionType,
            'remote' => (bool) ($structured['remote'] ?? true),
            'summary' => (string) ($structured['summary'] ?? 'Requerimiento listo con stack sugerido para el alcance.'),
            'source' => (string) ($structured['source'] ?? 'local'),
        ];
    }

    /**
     * @return array{
     *   title: string,
     *   description: string,
     *   category: string,
     *   skills: array<int, string>,
     *   deliverables: array<int, string>,
     *   budget: string,
     *   remote: bool,
     *   summary: string,
     *   source: string
     * }
     */
    private function structureLocally(
        string $rawNeed,
        string $currency,
        float $budgetAmount,
        ?string $businessContext,
    ): array {
        $text = Str::lower($rawNeed.' '.($businessContext ?? ''));
        $category = $this->inferCategory($text);
        $skills = $this->inferSkillsForCategory($category);

        $title = $this->inferTitle($rawNeed, $businessContext, $category);
        $deliverables = $this->inferDeliverables($category);

        return [
            'title' => $title,
            'description' => $this->buildDescription($rawNeed, $businessContext, $deliverables),
            'category' => $category,
            'skills' => $skills,
            'deliverables' => $deliverables,
            'budget' => $this->formatBudgetFromCurrency($budgetAmount, $currency),
            'remote' => ! Str::contains($text, ['presencial', 'oficina']),
            'summary' => 'Requerimiento estructurado con tecnologías sugeridas según tu necesidad.',
            'source' => 'local',
        ];
    }

    private function inferCategory(string $text): string
    {
        if (Str::contains($text, ['diseño', 'figma', 'logo', 'ui', 'marca', 'identidad'])) {
            return 'Diseño';
        }
        if (Str::contains($text, ['video', 'reel', 'editar', 'tiktok'])) {
            return 'Video';
        }
        if (Str::contains($text, ['redes', 'community', 'marketing', 'instagram', 'facebook ads'])) {
            return 'Marketing';
        }
        if (Str::contains($text, ['web', 'página', 'pagina', 'pag web', 'sitio', 'whatsapp', 'app', 'sistema', 'tienda'])) {
            return 'Desarrollo';
        }

        return 'General';
    }

    /**
     * @return array<int, string>
     */
    private function inferSkillsForCategory(string $category): array
    {
        return match ($category) {
            'Diseño' => ['Figma', 'UI Design'],
            'Video' => ['Premiere Pro', 'After Effects'],
            'Marketing' => ['Copywriting', 'Meta Ads'],
            'Desarrollo' => ['HTML', 'CSS', 'JavaScript'],
            default => ['Comunicación', 'Entrega documentada'],
        };
    }

    /**
     * Stack sugerido según necesidad (WordPress, Laravel, React, PHP, etc.).
     *
     * @return array<int, string>
     */
    public function inferRecommendedTechnologies(string $category, string $rawNeed): array
    {
        $text = Str::lower($rawNeed);
        $tech = [];

        if ($category === 'Diseño') {
            return ['Figma', 'Adobe Illustrator', 'Canva'];
        }

        if ($category === 'Video') {
            return ['Adobe Premiere Pro', 'CapCut', 'After Effects'];
        }

        if ($category === 'Marketing') {
            return ['Meta Business Suite', 'Canva', 'Google Analytics'];
        }

        if ($category === 'Desarrollo' || $category === 'General') {
            $isSimpleSite = Str::contains($text, [
                'sencill', 'simple', 'básic', 'basico', 'pan', 'papa', 'negocio local',
                'pyme', 'whatsapp', 'catálogo', 'catalogo', 'vendo', 'landing',
            ]);

            $needsApp = Str::contains($text, [
                'app', 'aplicación', 'aplicacion', 'sistema', 'dashboard', 'panel',
                'inventario', 'login', 'usuarios', 'api', 'e-commerce', 'tienda online',
            ]);

            $needsModernFrontend = Str::contains($text, [
                'react', 'interactiv', 'animacion', 'animación', 'spa', 'saas',
            ]);

            if ($needsApp) {
                $tech = ['Laravel', 'PHP', 'MySQL', 'React', 'REST API'];
            } elseif ($needsModernFrontend) {
                $tech = ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'Laravel'];
            } elseif ($isSimpleSite) {
                $tech = ['WordPress', 'HTML', 'CSS', 'JavaScript', 'WhatsApp Business API'];
            } else {
                $tech = ['WordPress', 'Laravel', 'PHP', 'React', 'MySQL'];
            }

            if (Str::contains($text, ['wordpress', 'wp'])) {
                $tech = array_merge(['WordPress', 'Elementor'], $tech);
            }
            if (Str::contains($text, ['laravel', 'php'])) {
                $tech = array_merge(['Laravel', 'PHP'], $tech);
            }
            if (Str::contains($text, ['react'])) {
                $tech = array_merge(['React'], $tech);
            }
        }

        return array_values(array_unique($tech));
    }

    /**
     * @param  array<int, string>  $technologies
     */
    private function appendTechnologyBlock(string $description, array $technologies): string
    {
        if ($technologies === []) {
            return $description;
        }

        if (Str::contains($description, 'Tecnologías recomendadas')) {
            return $description;
        }

        $list = implode("\n- ", $technologies);

        return $description."\n\nStack tecnológico recomendado para este proyecto:\n- {$list}\n\n".
            'El talento puede proponer tecnologías equivalentes siempre que justifique el enfoque y cumpla los entregables.';
    }

    public function formatBudgetFromCurrency(float $amount, string $currency): string
    {
        $currency = strtoupper($currency);

        if ($amount <= 0) {
            return 'A convenir';
        }

        if ($currency === 'COP') {
            return number_format($amount, 0, ',', '.').' COP';
        }

        return '$'.number_format($amount, 0, '.', ',').' USD';
    }

    private function inferTitle(string $rawNeed, ?string $context, string $category): string
    {
        $lower = Str::lower($rawNeed);

        if (Str::contains($lower, ['pag web', 'página', 'pagina', 'sitio web', 'landing'])) {
            return 'Sitio web para '.Str::limit($context ?: 'mi negocio', 40);
        }

        if (Str::contains($lower, ['logo'])) {
            return 'Diseño de logo y marca';
        }

        return match ($category) {
            'Diseño' => 'Proyecto de diseño — '.Str::limit($context ?: Str::limit($rawNeed, 40), 50),
            'Video' => 'Producción de contenido en video',
            'Marketing' => 'Gestión de redes y contenido',
            'Desarrollo' => 'Desarrollo web para '.Str::limit($context ?: 'negocio local', 40),
            default => Str::limit($rawNeed, 60),
        };
    }

    /**
     * @return array<int, string>
     */
    private function inferDeliverables(string $category): array
    {
        return match ($category) {
            'Diseño' => ['Propuesta visual en Figma', 'Versión final exportada', '1 ronda de ajustes'],
            'Video' => ['3–5 piezas editadas', 'Formato vertical para redes', 'Entrega en 7–10 días'],
            'Marketing' => ['Calendario de contenido', 'Copys por publicación', 'Reporte básico de métricas'],
            'Desarrollo' => ['Sitio o módulo funcional', 'Código en repositorio', 'Instrucciones de despliegue'],
            default => ['Alcance acordado por chat', 'Entrega documentada', 'Soporte breve post-entrega'],
        };
    }

    private function buildDescription(string $rawNeed, ?string $context, array $deliverables): string
    {
        $list = implode("\n- ", $deliverables);
        $biz  = $context ?: 'negocio local';

        return "Me dedico a {$biz} y necesito apoyo para: {$rawNeed}\n\n".
            "Lo que espero recibir:\n- {$list}\n\n".
            'Busco talento joven con ganas de aprender y entregar resultados reales. Trabajamos 100 % remoto y con comunicación abierta.';
    }

    private function inferSolutionType(string $rawNeed, string $category): string
    {
        $text = Str::lower($rawNeed);

        if (Str::contains($text, ['tienda online', 'e-commerce', 'ecommerce', 'carrito', 'pago en línea'])) {
            return 'Tienda virtual / e-commerce';
        }
        if (Str::contains($text, ['automatiz', 'bot', 'pedido automático', 'whatsapp api'])) {
            return 'Automatización de pedidos / mensajería';
        }
        if (Str::contains($text, ['landing', 'una página', 'pag web', 'página sencilla', 'sitio web'])) {
            return 'Landing page / sitio web informativo';
        }
        if (Str::contains($text, ['redes', 'instagram', 'marketing'])) {
            return 'Presencia digital y contenido';
        }

        return match ($category) {
            'Diseño' => 'Identidad visual / piezas gráficas',
            'Video' => 'Contenido audiovisual',
            'Marketing' => 'Estrategia y contenido digital',
            'Desarrollo' => 'Solución web a medida',
            default => 'Proyecto digital acotado',
        };
    }

    private function inferEstimatedTime(string $category, float $budgetAmount, string $currency): string
    {
        $usd = $currency === 'USD' ? $budgetAmount : $budgetAmount / 4000;

        if ($usd < 150) {
            return '3–7 días';
        }
        if ($usd < 400) {
            return '1–2 semanas';
        }
        if ($usd < 1000) {
            return '2–4 semanas';
        }

        return match ($category) {
            'Video' => '2–3 semanas',
            'Diseño' => '1–2 semanas',
            default => '3–6 semanas',
        };
    }

    private function inferDifficulty(string $category, string $rawNeed): string
    {
        $text = Str::lower($rawNeed);

        if (Str::contains($text, ['app', 'sistema', 'inventario', 'api', 'login', 'e-commerce'])) {
            return 'Intermedio–alto';
        }
        if (Str::contains($text, ['sencill', 'simple', 'básic', 'landing', 'página'])) {
            return 'Básico (ideal para talento junior)';
        }

        return match ($category) {
            'Diseño', 'Marketing' => 'Básico–intermedio',
            'Video' => 'Intermedio',
            'Desarrollo' => 'Intermedio',
            default => 'Básico',
        };
    }
}
