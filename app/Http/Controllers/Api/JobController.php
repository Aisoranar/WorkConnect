<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobListing;
use Illuminate\Http\JsonResponse;

class JobController extends Controller
{
    public function index(): JsonResponse
    {
        $jobs = JobListing::query()
            ->orderByDesc('match')
            ->get()
            ->map(fn (JobListing $job) => [
                'id' => $job->id,
                'title' => $job->title,
                'company' => $job->company,
                'budget' => $job->budget,
                'location' => $job->location,
                'remote' => $job->remote,
                'category' => $job->category,
                'description' => $job->description,
                'skills' => $job->skills,
                'match' => $job->match,
                'postedAgo' => $job->posted_ago,
                'applicants' => $job->applicants,
            ]);

        return response()->json(['data' => $jobs]);
    }
}
