<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DashboardStat;
use Illuminate\Http\JsonResponse;

class StatsController extends Controller
{
    public function show(): JsonResponse
    {
        $stats = DashboardStat::query()->first();

        if (! $stats) {
            return response()->json([
                'data' => [
                    'rating' => 0,
                    'projectsDone' => 0,
                    'earnings' => '$0',
                    'responseRate' => 0,
                ],
            ]);
        }

        return response()->json([
            'data' => [
                'rating' => $stats->rating,
                'projectsDone' => $stats->projects_done,
                'earnings' => $stats->earnings,
                'responseRate' => $stats->response_rate,
            ],
        ]);
    }
}
