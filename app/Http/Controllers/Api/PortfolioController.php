<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PortfolioProjectResource;
use App\Models\PortfolioProject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PortfolioController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'          => ['required', 'string', 'max:150'],
            'description'    => ['nullable', 'string', 'max:1000'],
            'url'            => ['nullable', 'url', 'max:255'],
            'technologies'   => ['nullable', 'array'],
            'technologies.*' => ['string', 'max:50'],
        ]);

        $project = $request->user()->portfolioProjects()->create($data);

        return response()->json(['data' => new PortfolioProjectResource($project)], 201);
    }

    public function update(Request $request, PortfolioProject $project): JsonResponse
    {
        $this->ensureOwner($request, $project);

        $data = $request->validate([
            'title'          => ['sometimes', 'string', 'max:150'],
            'description'    => ['nullable', 'string', 'max:1000'],
            'url'            => ['nullable', 'url', 'max:255'],
            'technologies'   => ['nullable', 'array'],
            'technologies.*' => ['string', 'max:50'],
        ]);

        $project->update($data);

        return response()->json(['data' => new PortfolioProjectResource($project)]);
    }

    public function destroy(Request $request, PortfolioProject $project): JsonResponse
    {
        $this->ensureOwner($request, $project);

        if ($project->image) {
            Storage::disk('public')->delete($project->image);
        }

        $project->delete();

        return response()->json(['message' => 'Proyecto eliminado.']);
    }

    public function uploadImage(Request $request, PortfolioProject $project): JsonResponse
    {
        $this->ensureOwner($request, $project);
        $request->validate(['image' => ['required', 'image', 'max:2048']]);

        if ($project->image) {
            Storage::disk('public')->delete($project->image);
        }

        $path = $request->file('image')->store('portfolio', 'public');
        $project->update(['image' => $path]);

        return response()->json([
            'message' => 'Imagen actualizada.',
            'image'   => url('storage/'.$path),
        ]);
    }

    private function ensureOwner(Request $request, PortfolioProject $project): void
    {
        if ($project->user_id !== $request->user()->id && ! $request->user()->isAdmin()) {
            abort(403, 'No tienes permiso para modificar este proyecto.');
        }
    }
}
