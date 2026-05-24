<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkJob;
use App\Http\Requests\StructureProjectRequest;
use App\Services\AIService;
use App\Services\ProjectBriefService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIController extends Controller
{
    public function __construct(
        private readonly AIService $ai,
        private readonly ProjectBriefService $projectBrief,
    ) {}

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

    public function structureProject(StructureProjectRequest $request): JsonResponse
    {
        $data = $this->projectBrief->structure(
            $request->input('raw_need'),
            strtoupper($request->input('currency')),
            (float) $request->input('budget_amount'),
            $request->input('business_context'),
        );

        return response()->json(['data' => $data]);
    }

    public function improveBio(Request $request): JsonResponse
    {
        $request->validate([
            'bio' => ['required', 'string', 'min:10', 'max:2000'],
        ]);

        $user = $request->user();
        $user->loadMissing('skills');
        $improved = $this->ai->improveBio($user, $request->string('bio')->toString());

        return response()->json(['data' => ['bio' => $improved]]);
    }

    public function generateGithubProfile(Request $request): JsonResponse
    {
        $request->validate([
            'repos'               => ['required', 'array', 'min:1', 'max:15'],
            'repos.*.name'        => ['required', 'string', 'max:100'],
            'repos.*.language'    => ['nullable', 'string', 'max:50'],
            'repos.*.topics'      => ['nullable', 'array'],
            'repos.*.topics.*'    => ['string', 'max:50'],
            'repos.*.description' => ['nullable', 'string', 'max:500'],
            'current_bio'         => ['nullable', 'string', 'max:2000'],
        ]);

        $result = $this->ai->generateProfileFromGithub(
            $request->input('repos'),
            $request->input('current_bio'),
        );

        return response()->json(['data' => $result]);
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
