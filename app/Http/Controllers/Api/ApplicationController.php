<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ApplyJobRequest;
use App\Http\Requests\UpdateApplicationStatusRequest;
use App\Http\Resources\ApplicationResource;
use App\Models\JobApplication;
use App\Models\Workspace;
use App\Models\WorkJob;
use App\Services\CareerAssistantService;
use App\Services\MatchingService;
use App\Services\NotificationService;
use App\Support\LegacyApiFormatter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    public function __construct(
        private readonly LegacyApiFormatter $legacy,
        private readonly NotificationService $notifications,
        private readonly CareerAssistantService $career,
        private readonly MatchingService $matching,
    ) {}

    /** Compatibilidad con el front actual (GET /api/applications). */
    public function legacyIndex(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');

        $query = JobApplication::query()->with(['job.owner'])->latest();

        if ($user) {
            $query->where('user_id', $user->id);
        }

        $data = $query->get()->map(fn (JobApplication $a) => $this->legacy->application($a));

        return response()->json(['data' => $data]);
    }

    public function apply(ApplyJobRequest $request, WorkJob $job): JsonResponse
    {
        if ($job->status !== 'open') {
            return response()->json(['message' => 'Este proyecto no acepta postulaciones.'], 422);
        }

        if ($job->user_id === $request->user()->id) {
            return response()->json(['message' => 'No puedes postular a tu propio proyecto.'], 422);
        }

        $application = JobApplication::query()->updateOrCreate(
            ['job_id' => $job->id, 'user_id' => $request->user()->id],
            [
                ...$request->validated(),
                'status' => 'pendiente',
            ],
        );

        $this->notifications->notify(
            $job->owner,
            'Nueva postulación',
            "{$request->user()->name} postuló a «{$job->title}».",
        );

        return response()->json([
            'message' => 'Postulación enviada.',
            'data' => new ApplicationResource($application->load(['job', 'user'])),
        ], 201);
    }

    public function myApplications(Request $request): JsonResponse
    {
        $applications = $request->user()
            ->applications()
            ->with(['job.owner'])
            ->latest()
            ->get();

        return response()->json([
            'data' => ApplicationResource::collection($applications),
        ]);
    }

    /** Postulaciones recibidas en un proyecto de la empresa. */
    public function forJob(Request $request, WorkJob $job): JsonResponse
    {
        if ($job->user_id !== $request->user()->id && ! $request->user()->isAdmin()) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $applications = $job->applications()
            ->with(['user.skills'])
            ->latest()
            ->get();

        $withMatch = $applications->map(function (JobApplication $app) use ($job) {
            $match = $this->matching->scoreJobForUser($app->user, $job);
            $app->setAttribute('match_score', $match);

            return $app;
        })->sortByDesc('match_score')->values();

        $bestMatchId = $withMatch->first()?->id;

        return response()->json([
            'data' => ApplicationResource::collection($withMatch),
            'best_match_id' => $bestMatchId,
        ]);
    }

    public function updateStatus(UpdateApplicationStatusRequest $request, JobApplication $application): JsonResponse
    {
        $application->load('job', 'user');
        $job = $application->job;

        if ($job->user_id !== $request->user()->id && ! $request->user()->isAdmin()) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $application->update(['status' => $request->input('status')]);

        $coaching = null;

        if ($request->input('status') === 'aceptada') {
            $this->notifications->notify(
                $application->user,
                '¡Postulación aceptada!',
                "Tu propuesta para «{$job->title}» fue aceptada. Coordina la entrega por mensajes.",
            );

            Workspace::query()->firstOrCreate(
                ['job_id' => $job->id],
                [
                    'freelancer_id' => $application->user_id,
                    'client_id' => $job->user_id,
                    'status' => 'in_progress',
                ],
            );

            $application->user->load('skills');
            $coaching = $this->career->projectCoachingTips($application->user, $job);
        }

        return response()->json([
            'message' => 'Estado actualizado.',
            'data' => new ApplicationResource($application->fresh(['job', 'user.skills'])),
            'coaching' => $coaching,
        ]);
    }
}
