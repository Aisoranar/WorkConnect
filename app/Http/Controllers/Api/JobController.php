<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreJobRequest;
use App\Http\Resources\JobResource;
use App\Models\WorkJob;
use App\Services\MatchingService;
use App\Support\LegacyApiFormatter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobController extends Controller
{
    public function __construct(
        private readonly LegacyApiFormatter $legacy,
        private readonly MatchingService $matching,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');

        $jobs = WorkJob::query()
            ->with('owner')
            ->withCount('applications')
            ->where('status', 'open')
            ->latest()
            ->get();

        if ($request->boolean('legacy', true)) {
            $data = $jobs
                ->sortByDesc(fn (WorkJob $job) => $user ? $this->matching->scoreJobForUser($user, $job) : 0)
                ->values()
                ->map(fn (WorkJob $job) => $this->legacy->job($job, $user));

            return response()->json(['data' => $data]);
        }

        return response()->json([
            'data' => JobResource::collection($jobs),
        ]);
    }

    public function show(WorkJob $job): JsonResponse
    {
        $job->load(['owner'])->loadCount('applications');

        return response()->json(['data' => new JobResource($job)]);
    }

    public function store(StoreJobRequest $request): JsonResponse
    {
        $job = WorkJob::query()->create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
            'status' => 'open',
        ]);

        return response()->json([
            'message' => 'Proyecto publicado.',
            'data' => new JobResource($job->load('owner')),
        ], 201);
    }

    public function update(StoreJobRequest $request, WorkJob $job): JsonResponse
    {
        if ($request->user()->id !== $job->user_id && ! $request->user()->isAdmin()) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $job->update($request->validated());

        return response()->json([
            'message' => 'Proyecto actualizado.',
            'data' => new JobResource($job->fresh('owner')),
        ]);
    }

    public function destroy(Request $request, WorkJob $job): JsonResponse
    {
        if ($request->user()->id !== $job->user_id && ! $request->user()->isAdmin()) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $job->delete();

        return response()->json(['message' => 'Proyecto eliminado.']);
    }
}
