<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkJob;
use App\Services\ProfileAdvisorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileAdvisorController extends Controller
{
    public function __construct(
        private readonly ProfileAdvisorService $advisor,
    ) {}

    public function skillRecommendations(Request $request): JsonResponse
    {
        $this->ensureTalent($request);

        return response()->json([
            'data' => $this->advisor->recommendSkills($request->user()),
        ]);
    }

    public function jobMatchCoach(Request $request): JsonResponse
    {
        $this->ensureTalent($request);

        $request->validate([
            'job_id' => ['required', 'exists:work_jobs,id'],
        ]);

        $job = WorkJob::query()->with('owner')->findOrFail($request->integer('job_id'));

        return response()->json([
            'data' => $this->advisor->coachForJob($request->user(), $job),
        ]);
    }

    public function learnSkill(Request $request): JsonResponse
    {
        $this->ensureTalent($request);

        $request->validate([
            'skill' => ['required', 'string', 'max:120'],
        ]);

        return response()->json([
            'data' => $this->advisor->learnSkillIntro(
                $request->user(),
                $request->string('skill')->toString(),
            ),
        ]);
    }

    public function startSkillQuiz(Request $request): JsonResponse
    {
        $this->ensureTalent($request);

        $request->validate([
            'skill' => ['required', 'string', 'max:120'],
        ]);

        return response()->json([
            'data' => $this->advisor->startSkillQuiz(
                $request->user(),
                $request->string('skill')->toString(),
            ),
        ]);
    }

    public function submitSkillQuiz(Request $request): JsonResponse
    {
        $this->ensureTalent($request);

        $request->validate([
            'quiz_id' => ['required', 'string', 'uuid'],
            'answers' => ['required', 'array', 'min:1'],
            'answers.*.question_id' => ['required', 'string', 'max:20'],
            'answers.*.option_index' => ['required', 'integer', 'min:0', 'max:3'],
        ]);

        return response()->json([
            'data' => $this->advisor->submitSkillQuiz(
                $request->user(),
                $request->string('quiz_id')->toString(),
                $request->input('answers'),
            ),
        ]);
    }

    private function ensureTalent(Request $request): void
    {
        $user = $request->user();
        if (! in_array($user->role, ['freelancer', 'admin'], true)) {
            abort(403, 'Las recomendaciones de perfil están disponibles para talento.');
        }
    }
}
