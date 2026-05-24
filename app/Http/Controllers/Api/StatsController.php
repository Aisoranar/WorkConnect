<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\Review;
use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        $data = $user->isClient()
            ? $this->clientStats($user)
            : $this->freelancerStats($user);

        return response()->json([
            'data' => $data,
            'platform' => $this->platformMetrics(),
        ]);
    }

    private function freelancerStats(User $user): array
    {
        $applications = JobApplication::query()->where('user_id', $user->id);
        $total = (clone $applications)->count();
        $accepted = (clone $applications)->where('status', 'aceptada')->count();
        $pending = (clone $applications)->where('status', 'pendiente')->count();
        $rejected = (clone $applications)->where('status', 'rechazada')->count();

        $earnings = JobApplication::query()
            ->where('user_id', $user->id)
            ->where('status', 'aceptada')
            ->get()
            ->sum(fn (JobApplication $a) => $this->parseMoney($a->price));

        $openJobs = WorkJob::query()
            ->where('status', 'open')
            ->where('user_id', '!=', $user->id)
            ->count();

        $reviewed = $accepted + $rejected;
        $responseRate = $total > 0 ? (int) round(($reviewed / $total) * 100) : 0;

        $rating = $user->rating ? round((float) $user->rating, 1) : null;

        return [
            'role' => 'freelancer',
            'rating' => $rating ?? 0,
            'hasRating' => $rating !== null,
            'projectsDone' => $accepted,
            'earnings' => $this->formatMoney($earnings),
            'responseRate' => $responseRate,
            'applicationsPending' => $pending,
            'applicationsTotal' => $total,
            'openJobs' => $openJobs,
            'hints' => [
                'rating' => $rating !== null
                    ? ($user->verified ? 'Perfil verificado en WorkConnect' : 'Basado en valoraciones de clientes')
                    : 'Completa proyectos para recibir valoraciones',
                'projects' => $accepted > 0
                    ? ($pending > 0 ? "{$accepted} completados · {$pending} en espera" : "{$accepted} proyecto(s) aceptado(s)")
                    : ($total > 0 ? "{$total} postulación(es) enviada(s)" : ($openJobs > 0 ? "{$openJobs} proyectos abiertos para ti" : 'Explora y postula a tu primer proyecto')),
                'earnings' => $earnings > 0
                    ? 'Suma de propuestas aceptadas'
                    : ($accepted > 0 ? 'Actualiza precios en postulaciones aceptadas' : 'Sin ingresos registrados aún'),
                'response' => $total > 0
                    ? ($reviewed > 0 ? "{$reviewed} de {$total} con respuesta del cliente" : "{$pending} esperando respuesta")
                    : 'Envía tu primera postulación',
            ],
        ];
    }

    private function clientStats(User $user): array
    {
        if (! $user->isClient() && ! $user->isAdmin()) {
            return $this->freelancerStats($user);
        }

        $jobs = WorkJob::query()->where('user_id', $user->id);
        $activeJobs = (clone $jobs)->where('status', 'open')->count();
        $totalJobs = (clone $jobs)->count();
        $jobIds = (clone $jobs)->pluck('id');

        $apps = JobApplication::query()->whereIn('job_id', $jobIds);
        $received = $jobIds->isEmpty() ? 0 : (clone $apps)->count();
        $pendingReview = $jobIds->isEmpty() ? 0 : (clone $apps)->where('status', 'pendiente')->count();
        $accepted = $jobIds->isEmpty() ? 0 : (clone $apps)->where('status', 'aceptada')->count();

        $freelancers = User::query()->where('role', 'freelancer')->count();

        return [
            'role' => 'client',
            'rating' => 0,
            'hasRating' => false,
            'projectsDone' => $activeJobs,
            'earnings' => (string) $received,
            'responseRate' => $received > 0 ? (int) round(($accepted / max(1, $received)) * 100) : 0,
            'activeJobs' => $activeJobs,
            'totalJobs' => $totalJobs,
            'applicationsReceived' => $received,
            'applicationsPendingReview' => $pendingReview,
            'talentPool' => $freelancers,
            'hints' => [
                'rating' => $totalJobs > 0 ? "{$totalJobs} proyecto(s) publicados" : 'Publica tu primer micro-proyecto',
                'projects' => $activeJobs > 0
                    ? "{$activeJobs} proyecto(s) recibiendo postulaciones"
                    : 'No hay proyectos abiertos ahora',
                'earnings' => $received > 0
                    ? "{$received} postulación(es) de talento joven"
                    : 'Las postulaciones aparecerán aquí',
                'response' => $pendingReview > 0
                    ? "{$pendingReview} pendiente(s) de revisar"
                    : ($received > 0 ? 'Revisa postulaciones en Mis proyectos' : 'Sin postulaciones aún'),
            ],
        ];
    }

    public function adminStats(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $user->isAdmin()) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $totalUsers = User::query()->count();
        $freelancers = User::query()->where('role', 'freelancer')->count();
        $clients = User::query()->where('role', 'client')->count();
        $admins = User::query()->where('role', 'admin')->count();

        $totalJobs = WorkJob::query()->count();
        $openJobs = WorkJob::query()->where('status', 'open')->count();

        $totalApplications = JobApplication::query()->count();
        $accepted = JobApplication::query()->where('status', 'aceptada')->count();
        $pending = JobApplication::query()->where('status', 'pendiente')->count();
        $rejected = JobApplication::query()->where('status', 'rechazada')->count();

        $recentUsers = User::query()
            ->latest()
            ->take(10)
            ->get(['id', 'name', 'email', 'role', 'city', 'rating', 'created_at']);

        $recentJobs = WorkJob::query()
            ->with('owner:id,name')
            ->latest()
            ->take(10)
            ->get(['id', 'title', 'budget', 'status', 'category', 'company', 'user_id', 'created_at']);

        $avgRating = (float) User::query()->where('role', 'freelancer')->where('rating', '>', 0)->avg('rating');
        $totalReviews = Review::query()->count();
        $skillsCount = \App\Models\Skill::query()->count();

        $topSkills = \DB::table('user_skill')
            ->join('skills', 'skills.id', '=', 'user_skill.skill_id')
            ->select('skills.name', \DB::raw('COUNT(*) as users_count'))
            ->groupBy('skills.name')
            ->orderByDesc('users_count')
            ->limit(10)
            ->get();

        return response()->json([
            'data' => [
                'users' => [
                    'total' => $totalUsers,
                    'freelancers' => $freelancers,
                    'clients' => $clients,
                    'admins' => $admins,
                ],
                'jobs' => [
                    'total' => $totalJobs,
                    'open' => $openJobs,
                    'closed' => $totalJobs - $openJobs,
                ],
                'applications' => [
                    'total' => $totalApplications,
                    'accepted' => $accepted,
                    'pending' => $pending,
                    'rejected' => $rejected,
                ],
                'metrics' => [
                    'avg_rating' => round($avgRating, 1),
                    'total_reviews' => $totalReviews,
                    'skills_registered' => $skillsCount,
                    'top_skills' => $topSkills,
                    'acceptance_rate' => $totalApplications > 0 ? round(($accepted / $totalApplications) * 100, 1) : 0,
                    'completion_rate' => $totalJobs > 0 ? round((($totalJobs - $openJobs) / $totalJobs) * 100, 1) : 0,
                ],
                'recent_users' => $recentUsers,
                'recent_jobs' => $recentJobs,
            ],
        ]);
    }

    private function parseMoney(?string $value): int
    {
        if (! $value) {
            return 0;
        }

        return (int) preg_replace('/\D/', '', $value);
    }

    private function formatMoney(int $amount): string
    {
        return '$'.number_format($amount, 0, '.', ',');
    }

    private function platformMetrics(): array
    {
        return [
            'users' => User::query()->count(),
            'jobs' => WorkJob::query()->where('status', 'open')->count(),
            'completed_projects' => JobApplication::query()->where('status', 'aceptada')->count(),
            'satisfaction' => '95%',
        ];
    }
}
