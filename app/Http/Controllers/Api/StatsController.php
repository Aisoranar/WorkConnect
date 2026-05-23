<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    /** Compatibilidad dashboard (GET /api/stats). */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');

        if ($user) {
            return response()->json([
                'data' => [
                    'rating' => (float) ($user->rating ?: 4.5),
                    'projectsDone' => $user->applications()->where('status', 'aceptada')->count(),
                    'earnings' => '$'.number_format($user->applications()->where('status', 'aceptada')->count() * 350),
                    'responseRate' => 98,
                ],
                'platform' => $this->platformMetrics(),
            ]);
        }

        return response()->json([
            'data' => [
                'rating' => 4.9,
                'projectsDone' => JobApplication::query()->where('status', 'aceptada')->count() ?: 23,
                'earnings' => '$8,420',
                'responseRate' => 98,
            ],
            'platform' => $this->platformMetrics(),
        ]);
    }

    private function platformMetrics(): array
    {
        return [
            'users' => User::query()->count(),
            'jobs' => WorkJob::query()->count(),
            'completed_projects' => 120,
            'satisfaction' => '95%',
        ];
    }
}
