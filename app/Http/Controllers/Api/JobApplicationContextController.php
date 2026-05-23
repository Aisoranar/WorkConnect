<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkJob;
use App\Services\MatchingService;
use App\Services\ProfileScoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobApplicationContextController extends Controller
{
    public function __construct(
        private readonly MatchingService $matching,
        private readonly ProfileScoreService $profileScore,
    ) {}

    public function show(Request $request, WorkJob $job): JsonResponse
    {
        $user = $request->user();
        $user->load(['skills', 'portfolioProjects']);

        $profile = $this->profileScore->analyze($user);
        $match = $this->matching->scoreJobForUser($user, $job);
        $company = $job->company ?? $job->owner?->name ?? 'el cliente';
        $skillNames = $user->skills->pluck('name')->take(5)->implode(', ');

        $headline = $this->buildHeadline($user);

        return response()->json([
            'data' => [
                'job' => [
                    'id' => $job->id,
                    'title' => $job->title,
                    'company' => $company,
                    'budget' => $job->budget,
                ],
                'proposal' => [
                    'message' => "Hola {$company}, tras revisar \"{$job->title}\" creo que soy una excelente opción. ".
                        ($skillNames
                            ? "He trabajado con {$skillNames} en proyectos similares y puedo entregar en el plazo estimado."
                            : 'Puedo entregar en el plazo estimado con alta calidad.'),
                    'price' => $this->suggestPrice($job->budget),
                    'delivery_time' => '2 semanas',
                ],
                'cv' => [
                    'name' => $user->name,
                    'initials' => $this->initials($user->name),
                    'headline' => $headline,
                    'city' => $user->city,
                    'bio' => $user->bio,
                    'verified' => $user->verified,
                    'trust_score' => $profile['score'],
                    'professional_score' => min(100, (int) round(($user->rating ?: 4.5) * 18)),
                    'trust_label' => $this->trustLabel($profile['score']),
                    'skills' => $user->skills->map(fn ($skill) => [
                        'name' => $skill->name,
                        'level' => $this->skillLevelToScore($skill->pivot->level ?? 'intermedio'),
                        'level_label' => $skill->pivot->level ?? 'intermedio',
                    ])->values(),
                    'match' => $match,
                ],
            ],
        ]);
    }

    private function buildHeadline($user): string
    {
        if ($user->experience) {
            $first = strtok($user->experience, "\n");

            return strlen($first) > 80 ? substr($first, 0, 77).'…' : $first;
        }

        $role = $user->role === 'client' ? 'Cliente' : 'Freelancer';

        $topSkills = $user->skills->take(2)->pluck('name')->implode(' · ');

        return $topSkills ? "{$role} · {$topSkills}" : $role;
    }

    private function initials(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];

        return strtoupper(collect($parts)->map(fn ($w) => mb_substr($w, 0, 1))->take(2)->implode(''));
    }

    private function trustLabel(int $score): string
    {
        return match (true) {
            $score >= 85 => 'Profesional',
            $score >= 70 => 'Confiable',
            default => 'En crecimiento',
        };
    }

    private function skillLevelToScore(?string $level): int
    {
        return match (strtolower((string) $level)) {
            'experto', 'avanzado' => 5,
            'intermedio' => 4,
            'basico', 'principiante' => 3,
            default => 4,
        };
    }

    private function suggestPrice(string $budget): string
    {
        if (preg_match('/[\d.,]+/', $budget, $m)) {
            return preg_replace('/[^\d.]/', '', str_replace(',', '', $m[0])) ?: '500';
        }

        return '500';
    }
}
