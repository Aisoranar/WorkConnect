<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreJobRequest;
use App\Http\Resources\JobResource;
use App\Models\JobApplication;
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

        $query = WorkJob::query()
            ->with('owner')
            ->withCount('applications')
            ->where('status', 'open');

        if ($user) {
            $query->where('user_id', '!=', $user->id);
        }

        $category = $request->string('category')->toString();
        if ($category !== '' && $category !== 'Todos') {
            $query->where('category', $category);
        }

        if ($search = $request->string('q')->trim()->toString()) {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('company', 'like', "%{$search}%");
            });
        }

        $jobs = $query->get();

        $sort = $request->input('sort', 'match');
        if ($sort === 'recent') {
            $jobs = $jobs->sortByDesc('created_at')->values();
        } elseif ($sort === 'budget') {
            $jobs = $jobs->sortByDesc(fn (WorkJob $job) => (int) preg_replace('/\D/', '', $job->budget))->values();
        } else {
            $jobs = $jobs
                ->sortByDesc(fn (WorkJob $job) => $user ? $this->matching->scoreJobForUser($user, $job) : 0)
                ->values();
        }

        $applicationsByJob = collect();
        if ($user) {
            $applicationsByJob = JobApplication::query()
                ->where('user_id', $user->id)
                ->whereIn('job_id', $jobs->pluck('id'))
                ->get()
                ->keyBy('job_id');
        }

        if ($request->boolean('legacy', true)) {
            $data = $jobs->map(
                fn (WorkJob $job) => $this->legacy->job($job, $user, $applicationsByJob->get($job->id)),
            );

            $categories = WorkJob::query()
                ->where('status', 'open')
                ->whereNotNull('category')
                ->distinct()
                ->orderBy('category')
                ->pluck('category')
                ->values();

            return response()->json([
                'data' => $data,
                'meta' => [
                    'total' => $data->count(),
                    'categories' => $categories,
                ],
            ]);
        }

        return response()->json([
            'data' => JobResource::collection($jobs),
        ]);
    }

    public function show(Request $request, WorkJob $job): JsonResponse
    {
        $job->load(['owner'])->loadCount('applications');

        if ($request->boolean('legacy', false)) {
            return response()->json([
                'data' => $this->legacy->job($job, $request->user('sanctum')),
            ]);
        }

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

    /** M17 — Proyectos publicados por la empresa autenticada. */
    public function myJobs(Request $request): JsonResponse
    {
        $jobs = WorkJob::query()
            ->where('user_id', $request->user()->id)
            ->with('owner')
            ->withCount('applications')
            ->latest()
            ->get();

        if ($request->boolean('legacy', true)) {
            $data = $jobs->map(fn (WorkJob $job) => $this->legacy->job($job, $request->user(), null));

            return response()->json(['data' => $data]);
        }

        return response()->json(['data' => JobResource::collection($jobs)]);
    }
}
