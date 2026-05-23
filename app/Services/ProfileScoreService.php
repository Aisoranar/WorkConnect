<?php

namespace App\Services;

use App\Models\User;

class ProfileScoreService
{
    public function analyze(User $user): array
    {
        $user->loadMissing(['skills', 'portfolioProjects']);

        $score = 0;
        $tips = [];

        if ($user->bio) {
            $score += 15;
        } else {
            $tips[] = 'Añade una bio profesional.';
        }

        if ($user->city) {
            $score += 10;
        }

        if ($user->avatar) {
            $score += 10;
        }

        $skillCount = $user->skills->count();
        $score += min(25, $skillCount * 5);
        if ($skillCount < 3) {
            $tips[] = 'Agrega al menos 3 habilidades.';
        }

        $portfolioCount = $user->portfolioProjects->count();
        $score += min(20, $portfolioCount * 7);
        if ($portfolioCount < 2) {
            $tips[] = 'Sube proyectos a tu portfolio.';
        }

        if ($user->github || $user->linkedin) {
            $score += 10;
        }

        if ($user->experience) {
            $score += 10;
        }

        $score = min(100, $score);

        return [
            'score' => $score,
            'summary' => $this->buildSummary($score),
            'tips' => $tips,
            'strengths' => $user->skills->pluck('name')->take(5)->values()->all(),
        ];
    }

    private function buildSummary(int $score): string
    {
        return match (true) {
            $score >= 90 => 'Perfil excelente. Listo para destacar en proyectos premium.',
            $score >= 75 => 'Buen perfil. Pequeños ajustes te llevarán al top.',
            $score >= 50 => 'Perfil en progreso. Completa bio, skills y portfolio.',
            default => 'Perfil inicial. Completa los datos clave para mejorar tu matching.',
        };
    }
}
