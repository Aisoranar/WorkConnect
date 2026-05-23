<?php

use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\StatsController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));

Route::get('/jobs', [JobController::class, 'index']);
Route::get('/applications', [ApplicationController::class, 'index']);
Route::get('/messages', [MessageController::class, 'index']);
Route::get('/stats', [StatsController::class, 'show']);
