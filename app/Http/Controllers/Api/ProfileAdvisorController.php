<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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

    private function ensureTalent(Request $request): void
    {
        $user = $request->user();
        if (! in_array($user->role, ['freelancer', 'admin'], true)) {
            abort(403, 'Las recomendaciones de perfil están disponibles para talento.');
        }
    }
}
