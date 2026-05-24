<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GithubController extends Controller
{
    public function repos(Request $request): JsonResponse
    {
        $request->validate([
            'username' => ['required', 'string', 'max:100'],
        ]);

        $username = $request->string('username')->trim()->toString();

        $headers = [
            'Accept'     => 'application/vnd.github.v3+json',
            'User-Agent' => 'WorkConnect/1.0',
        ];

        // Usa token de GitHub si está configurado para mayor cuota (60 → 5000 req/hora)
        if ($token = config('services.github.token')) {
            $headers['Authorization'] = "Bearer {$token}";
        }

        $response = Http::withHeaders($headers)
            ->timeout(15)
            ->get("https://api.github.com/users/{$username}/repos", [
                'sort'     => 'updated',
                'per_page' => 30,
                'type'     => 'owner',
            ]);

        if ($response->status() === 404) {
            return response()->json(['message' => 'Usuario de GitHub no encontrado.'], 404);
        }

        if ($response->status() === 403) {
            return response()->json(['message' => 'Límite de GitHub alcanzado. Intenta en unos minutos.'], 429);
        }

        if (! $response->successful()) {
            return response()->json(['message' => 'No se pudo conectar con GitHub. Intenta más tarde.'], 502);
        }

        $repos = collect($response->json())
            ->filter(fn ($r) => ! ($r['fork'] ?? false))
            ->map(fn ($r) => [
                'name'        => $r['name'],
                'description' => $r['description'],
                'language'    => $r['language'],
                'topics'      => $r['topics'] ?? [],
                'html_url'    => $r['html_url'],
                'stars'       => $r['stargazers_count'] ?? 0,
                'updated_at'  => $r['updated_at'],
            ])
            ->values();

        return response()->json(['data' => $repos]);
    }
}
