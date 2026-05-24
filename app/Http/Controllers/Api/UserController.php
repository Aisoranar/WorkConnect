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
    public function index(Request $request): JsonResponse
    {
        $query = User::query()->with('skills')->withCount('applications');

        if ($role = $request->string('role')->toString()) {
            $query->where('role', $role);
        }

        if ($search = $request->string('q')->trim()->toString()) {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('bio', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%");
            });
        }

        $users = $query->orderByDesc('rating')->paginate(min(30, $request->integer('per_page', 20)));

        return UserResource::collection($users)->response();
    }

    public function show(User $user): JsonResponse
    {
        $user->load(['skills', 'portfolioProjects']);

        return response()->json(['data' => new UserResource($user)]);
    }

    /** M13 — Perfil público por username (ferias / QR). */
    public function showByUsername(string $username): JsonResponse
    {
        $user = User::query()
            ->where('username', $username)
            ->whereIn('role', ['freelancer', 'admin'])
            ->withCount([
                'applications as projects_completed_count' => fn ($q) => $q->where('status', 'aceptada'),
                'reviewsReceived',
            ])
            ->firstOrFail();

        $user->load(['skills', 'portfolioProjects']);

        return response()->json([
            'data' => new UserResource($user),
            'meta' => [
                'projects_completed' => (int) $user->projects_completed_count,
                'reviews_count' => (int) $user->reviews_received_count,
            ],
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $user->update($request->only([
            'name', 'username', 'city', 'bio', 'github', 'linkedin', 'experience',
        ]));

        if ($request->has('skill_names')) {
            // Crea skills que no existen y sincroniza por nombre
            $sync = collect($request->input('skill_names', []))
                ->filter()
                ->map(fn (string $name) => \App\Models\Skill::firstOrCreate(
                    ['name' => trim($name)],
                    ['category' => null],
                )->id)
                ->mapWithKeys(fn ($id) => [$id => ['level' => 'intermedio']])
                ->all();
            $user->skills()->sync($sync);
        } elseif ($request->has('skill_ids')) {
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
