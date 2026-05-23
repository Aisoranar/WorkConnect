<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class ReviewController extends Controller
{
    public function store(StoreReviewRequest $request): JsonResponse
    {
        $review = Review::query()->create([
            ...$request->validated(),
            'reviewer_id' => $request->user()->id,
        ]);

        $reviewed = User::query()->findOrFail($request->integer('reviewed_id'));
        $avg = Review::query()->where('reviewed_id', $reviewed->id)->avg('rating');
        $reviewed->update(['rating' => round((float) $avg, 1)]);

        return response()->json([
            'message' => 'Reseña publicada.',
            'data' => new ReviewResource($review->load('reviewer')),
        ], 201);
    }
}
