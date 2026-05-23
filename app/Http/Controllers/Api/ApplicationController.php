<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ApplyJobRequest;
use App\Http\Resources\ApplicationResource;
use App\Models\JobApplication;
use App\Models\WorkJob;
use App\Services\NotificationService;
use App\Support\LegacyApiFormatter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    public function __construct(
        private readonly LegacyApiFormatter $legacy,
        private readonly NotificationService $notifications,
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
}
