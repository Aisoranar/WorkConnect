<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SkillResource;
use App\Models\Skill;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SkillController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => SkillResource::collection(Skill::query()->orderBy('name')->get()),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:skills,name'],
            'category' => ['nullable', 'string', 'max:100'],
        ]);

        $skill = Skill::query()->create($data);

        return response()->json([
            'message' => 'Skill creada.',
            'data' => new SkillResource($skill),
        ], 201);
    }
}
