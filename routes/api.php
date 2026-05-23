<?php

use App\Http\Controllers\Api\AIController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\JobApplicationContextController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SkillController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json([
    'status' => 'ok',
    'app' => config('app.name'),
    'version' => 'mvp-1.0',
]));

// Auth público
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);

// Público
Route::get('/skills', [SkillController::class, 'index']);
Route::get('/users', [UserController::class, 'index']);
Route::get('/users/{user}', [UserController::class, 'show']);
Route::get('/users/{user}/reviews', [UserController::class, 'reviews']);
Route::get('/jobs', [JobController::class, 'index']);
Route::get('/jobs/{job}', [JobController::class, 'show']);

// Legacy / demo (front actual)
Route::get('/applications', [ApplicationController::class, 'legacyIndex']);
Route::get('/messages', [MessageController::class, 'legacyInbox']);
Route::get('/stats', [StatsController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::post('/users/avatar', [UserController::class, 'uploadAvatar']);

    Route::post('/skills', [SkillController::class, 'store']);

    Route::post('/jobs', [JobController::class, 'store']);
    Route::put('/jobs/{job}', [JobController::class, 'update']);
    Route::delete('/jobs/{job}', [JobController::class, 'destroy']);

    Route::get('/jobs/{job}/apply-context', [JobApplicationContextController::class, 'show']);
    Route::post('/jobs/{job}/apply', [ApplicationController::class, 'apply']);
    Route::get('/my-applications', [ApplicationController::class, 'myApplications']);

    Route::post('/reviews', [ReviewController::class, 'store']);

    Route::get('/chat/messages', [MessageController::class, 'index']);
    Route::post('/messages', [MessageController::class, 'store']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);

    Route::post('/ai/match-job', [AIController::class, 'matchJob']);
    Route::post('/ai/analyze-profile', [AIController::class, 'analyzeProfile']);
    Route::post('/ai/recommend-jobs', [AIController::class, 'recommendJobs']);
    Route::post('/ai/improve-proposal', [AIController::class, 'improveProposal']);
});
