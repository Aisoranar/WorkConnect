<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\ReviewResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::query()
            ->with('skills')
            ->latest()
            ->paginate(20);

        return UserResource::collection($users)->response();
    }

    public function show(User $user): JsonResponse
    {
        $user->load(['skills', 'portfolioProjects']);

        return response()->json(['data' => new UserResource($user)]);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $user->update($request->only([
            'name', 'username', 'city', 'bio', 'github', 'linkedin', 'experience',
        ]));

        if ($request->has('skill_ids')) {
            $sync = collect($request->input('skill_ids', []))
                ->mapWithKeys(fn ($id) => [$id => ['level' => 'intermedio']])
                ->all();
            $user->skills()->sync($sync);
        }

        $user->load(['skills', 'portfolioProjects']);

        return response()->json([
            'message' => 'Perfil actualizado.',
            'data' => new UserResource($user),
        ]);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:2048'],
        ]);

        $user = $request->user();
        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        return response()->json([
            'message' => 'Avatar actualizado.',
            'avatar' => url('storage/'.$path),
        ]);
    }

    public function reviews(User $user): JsonResponse
    {
        $reviews = $user->reviewsReceived()
            ->with('reviewer')
            ->latest()
            ->get();

        return response()->json(['data' => ReviewResource::collection($reviews)]);
    }
}
