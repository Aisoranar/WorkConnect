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
     *   remote: bool,
     *   summary: string,
     *   source: string
     * }
     */
    public function structure(string $rawNeed, string $budget, ?string $businessContext = null): array
    {
        $structured = $this->ai->structureProjectBrief($rawNeed, $budget, $businessContext);

        if ($structured !== null) {
            return $structured;
        }

        return $this->structureLocally($rawNeed, $budget, $businessContext);
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
    private function structureLocally(string $rawNeed, string $budget, ?string $businessContext): array
    {
        $text = Str::lower($rawNeed.' '.($businessContext ?? ''));
        $category = 'General';
        $skills = [];

        if (Str::contains($text, ['diseño', 'figma', 'logo', 'ui', 'landing'])) {
            $category = 'Diseño';
            $skills = ['Figma', 'UI Design'];
        } elseif (Str::contains($text, ['video', 'reel', 'editar'])) {
            $category = 'Video';
            $skills = ['Premiere'];
        } elseif (Str::contains($text, ['redes', 'community', 'marketing', 'instagram'])) {
            $category = 'Marketing';
            $skills = ['Copywriting', 'Meta Ads'];
        } elseif (Str::contains($text, ['web', 'página', 'pagina', 'react', 'laravel', 'app', 'sistema'])) {
            $category = 'Desarrollo';
            $skills = ['React', 'Laravel', 'Tailwind CSS'];
        }

        $title = $this->inferTitle($rawNeed, $businessContext, $category);
        $budgetFormatted = $this->formatBudget($budget);

        return [
            'title' => $title,
            'description' => $this->buildDescription($rawNeed, $businessContext, $deliverables = $this->inferDeliverables($category)),
            'category' => $category,
            'skills' => $skills,
            'deliverables' => $deliverables,
            'budget' => $budgetFormatted,
            'remote' => ! Str::contains($text, ['presencial', 'oficina']),
            'summary' => 'Requerimiento estructurado para que un joven con talento pueda postular con claridad.',
            'source' => 'local',
        ];
    }

    private function inferTitle(string $rawNeed, ?string $context, string $category): string
    {
        if (Str::contains(Str::lower($rawNeed), ['landing', 'página', 'pagina web'])) {
            return 'Landing page para '.($context ?: 'mi negocio');
        }

        if (Str::contains(Str::lower($rawNeed), ['logo'])) {
            return 'Diseño de logo y marca';
        }

        return match ($category) {
            'Diseño' => 'Proyecto de diseño — '.Str::limit($context ?: Str::limit($rawNeed, 40), 50),
            'Video' => 'Producción de contenido en video',
            'Marketing' => 'Gestión de redes y contenido',
            'Desarrollo' => 'Desarrollo web para '.($context ?: 'negocio local'),
            default => Str::limit($rawNeed, 60),
        };
    }

    private function formatBudget(string $budget): string
    {
        $clean = preg_replace('/[^\d.]/', '', $budget);
        if ($clean && ! str_starts_with($budget, '$')) {
            return '$'.number_format((float) $clean, 0, '.', ',');
        }

        return $budget ?: '$500';
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

        return "Contexto del negocio: ".($context ?: 'Empresa local que necesita apoyo digital con presupuesto acotado.')."\n\n".
            "Necesidad expresada por el cliente:\n{$rawNeed}\n\n".
            "Entregables esperados:\n- {$list}\n\n".
            'Ideal para talento joven que busca ganar experiencia con proyectos acotados y reales.';
    }
}
