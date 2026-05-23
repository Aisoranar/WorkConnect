<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use Illuminate\Http\JsonResponse;

class ApplicationController extends Controller
{
    public function index(): JsonResponse
    {
        $applications = Application::query()
            ->orderBy('created_at')
            ->get()
            ->map(fn (Application $application) => [
                'id' => $application->id,
                'jobTitle' => $application->job_title,
                'company' => $application->company,
                'price' => $application->price,
                'status' => $application->status,
                'sentAgo' => $application->sent_ago,
            ]);

        return response()->json(['data' => $applications]);
    }
}
