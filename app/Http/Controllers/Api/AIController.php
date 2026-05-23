<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkJob;
use App\Services\AIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIController extends Controller
{
    public function __construct(private readonly AIService $ai) {}

    public function matchJob(Request $request): JsonResponse
    {
        $request->validate(['job_id' => ['required', 'exists:work_jobs,id']]);

        $job = WorkJob::query()->findOrFail($request->integer('job_id'));

        return response()->json([
            'data' => $this->ai->matchJob($request->user(), $job),
        ]);
    }

    public function analyzeProfile(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->ai->analyzeProfile($request->user()),
        ]);
    }

    public function recommendJobs(Request $request): JsonResponse
    {
        $limit = min(20, $request->integer('limit', 6));

        return response()->json([
            'data' => $this->ai->recommendJobs($request->user(), $limit),
        ]);
    }

    public function improveProposal(Request $request): JsonResponse
    {
        $request->validate([
            'job_id' => ['required', 'exists:work_jobs,id'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $job = WorkJob::query()->findOrFail($request->integer('job_id'));
        $request->user()->load('skills');

        $improved = $this->ai->improveProposal(
            $request->user(),
            $job,
            $request->input('message'),
        );

        return response()->json([
            'data' => ['message' => $improved],
        ]);
    }
}
