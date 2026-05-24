<?php

use App\Http\Controllers\Api\AIController;
use App\Http\Controllers\Api\CareerController;
use App\Http\Controllers\Api\ProfileAdvisorController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GithubController;
use App\Http\Controllers\Api\PortfolioController;
use App\Http\Controllers\Api\JobApplicationContextController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SkillController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WorkspaceController;
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
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Público
Route::get('/skills', [SkillController::class, 'index']);
Route::get('/users', [UserController::class, 'index']);
Route::get('/talent/{username}', [UserController::class, 'showByUsername']);
Route::get('/users/{user}', [UserController::class, 'show']);
Route::get('/users/{user}/reviews', [UserController::class, 'reviews']);
Route::get('/jobs', [JobController::class, 'index']);
Route::get('/jobs/{job}', [JobController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::get('/stats', [StatsController::class, 'show']);

    // Legacy (front actual)
    Route::get('/applications', [ApplicationController::class, 'legacyIndex']);
    Route::get('/messages', [MessageController::class, 'legacyInbox']);

    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::post('/users/avatar', [UserController::class, 'uploadAvatar']);

    Route::post('/skills', [SkillController::class, 'store']);

    Route::get('/my-jobs', [JobController::class, 'myJobs']);
    Route::get('/my-jobs/{job}/applications', [ApplicationController::class, 'forJob']);
    Route::post('/jobs', [JobController::class, 'store']);
    Route::put('/jobs/{job}', [JobController::class, 'update']);
    Route::delete('/jobs/{job}', [JobController::class, 'destroy']);

    Route::get('/jobs/{job}/apply-context', [JobApplicationContextController::class, 'show']);
    Route::post('/jobs/{job}/apply', [ApplicationController::class, 'apply']);
    Route::get('/my-applications', [ApplicationController::class, 'myApplications']);
    Route::patch('/applications/{application}', [ApplicationController::class, 'updateStatus']);

    Route::post('/reviews', [ReviewController::class, 'store']);

    Route::get('/chat/messages', [MessageController::class, 'index']);
    Route::post('/messages', [MessageController::class, 'store']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);

    // Portfolio CRUD
    Route::post('/portfolio', [PortfolioController::class, 'store']);
    Route::put('/portfolio/{project}', [PortfolioController::class, 'update']);
    Route::delete('/portfolio/{project}', [PortfolioController::class, 'destroy']);
    Route::post('/portfolio/{project}/image', [PortfolioController::class, 'uploadImage']);

    // GitHub proxy
    Route::get('/github/repos', [GithubController::class, 'repos']);

    // Admin
    Route::get('/admin/stats', [StatsController::class, 'adminStats']);

    // Workspace
    Route::get('/workspace/job/{jobId}', [WorkspaceController::class, 'findByJob']);
    Route::get('/workspace/{workspace}', [WorkspaceController::class, 'show']);
    Route::patch('/workspace/{workspace}/status', [WorkspaceController::class, 'updateStatus']);
    Route::post('/workspace/{workspace}/tasks', [WorkspaceController::class, 'addTask']);
    Route::patch('/workspace/tasks/{task}/toggle', [WorkspaceController::class, 'toggleTask']);
    Route::post('/workspace/{workspace}/deliverables', [WorkspaceController::class, 'addDeliverable']);
    Route::delete('/workspace/deliverables/{deliverable}', [WorkspaceController::class, 'deleteDeliverable']);
    Route::post('/workspace/{workspace}/payments', [WorkspaceController::class, 'registerPayment']);
    Route::get('/workspace/{workspace}/payments', [WorkspaceController::class, 'payments']);

    // IA (throttle: 30 requests / minuto por usuario)
    Route::middleware('throttle:30,1')->group(function () {
        Route::post('/ai/structure-project', [AIController::class, 'structureProject']);
        Route::post('/ai/match-job', [AIController::class, 'matchJob']);
        Route::post('/ai/analyze-profile', [AIController::class, 'analyzeProfile']);
        Route::post('/ai/recommend-jobs', [AIController::class, 'recommendJobs']);
        Route::post('/ai/improve-proposal', [AIController::class, 'improveProposal']);
        Route::post('/ai/improve-bio', [AIController::class, 'improveBio']);
        Route::post('/ai/github-profile', [AIController::class, 'generateGithubProfile']);
    });

    // Asesor de perfil y skills (IA + demanda del mercado)
    Route::prefix('profile')->group(function () {
        Route::post('/skill-recommendations', [ProfileAdvisorController::class, 'skillRecommendations']);
        Route::post('/job-match-coach', [ProfileAdvisorController::class, 'jobMatchCoach']);
        Route::post('/learn-skill', [ProfileAdvisorController::class, 'learnSkill']);
        Route::post('/skill-quiz/start', [ProfileAdvisorController::class, 'startSkillQuiz']);
        Route::post('/skill-quiz/submit', [ProfileAdvisorController::class, 'submitSkillQuiz']);
        Route::get('/skill-certifications', [ProfileAdvisorController::class, 'listSkillCertifications']);
    });

    // Asistente de carrera (talento joven, throttle: 20 requests / minuto)
    Route::prefix('career')->middleware('throttle:20,1')->group(function () {
        Route::get('/external-jobs', [CareerController::class, 'externalJobs']);
        Route::get('/history', [CareerController::class, 'history']);
        Route::post('/analyze-profile', [CareerController::class, 'analyzeProfile']);
        Route::post('/achievements', [CareerController::class, 'discoverAchievements']);
        Route::post('/improve-cv', [CareerController::class, 'improveCv']);
        Route::post('/improve-linkedin', [CareerController::class, 'improveLinkedin']);
        Route::post('/analyze-offer', [CareerController::class, 'analyzeOffer']);
        Route::post('/study-plan', [CareerController::class, 'studyPlan']);
        Route::post('/target-role', [CareerController::class, 'targetRole']);
        Route::post('/readiness', [CareerController::class, 'readiness']);
        Route::post('/interview/start', [CareerController::class, 'interviewStart']);
        Route::post('/interview/evaluate', [CareerController::class, 'interviewEvaluate']);
        Route::post('/project-tips', [CareerController::class, 'projectTips']);
    });
});
