<?php

namespace App\Services;

use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Support\Facades\Http;
class AIService
{
    public function __construct(
        private readonly MatchingService $matchingService,
        private readonly ProfileScoreService $profileScoreService,
    ) {}

    public function matchJob(User $user, WorkJob $job): array
    {
        $localScore = $this->matchingService->scoreJobForUser($user, $job);
        $aiText = $this->askAi($this->matchPrompt($user, $job), $localScore);

        return [
            'job_id' => $job->id,
            'compatibility' => $localScore,
            'analysis' => $aiText,
            'source' => $this->hasAiKey() ? 'ai' : 'local',
        ];
    }

    public function analyzeProfile(User $user): array
    {
        $profile = $this->profileScoreService->analyze($user);
        $aiSummary = $this->askAi(
            "Resume en 2 frases el perfil profesional: {$user->name}, skills: ".
            $user->skills->pluck('name')->implode(', '),
            $profile['score'],
        );

        return array_merge($profile, [
            'ai_summary' => $aiSummary,
            'source' => $this->hasAiKey() ? 'ai' : 'local',
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function improveProposal(User $user, WorkJob $job, string $message): string
    {
        $skills = $user->skills->pluck('name')->implode(', ');
        $company = $job->company ?? 'el cliente';

        $prompt = "Mejora esta propuesta freelance en español (máximo 3 oraciones, tono profesional y cercano). ".
            "Proyecto: {$job->title}. Cliente: {$company}. Skills: {$skills}.\n\nPropuesta:\n{$message}";

        $improved = trim($this->askAi($prompt, 0));

        if ($improved === 'Compatibilidad estimada: 0%.' || str_starts_with($improved, 'Compatibilidad estimada:')) {
            return $this->improveProposalLocally($message, $job, $skills);
        }

        return $improved;
    }

    private function improveProposalLocally(string $message, WorkJob $job, string $skills): string
    {
        $company = $job->company ?? 'el cliente';

        return "Hola {$company}, me entusiasma \"{$job->title}\". {$message} ".
            "Cuento con experiencia en {$skills} y me comprometo a entregar con comunicación clara y calidad profesional.";
    }

    public function recommendJobs(User $user, int $limit = 6): array
    {
        return $this->matchingService
            ->recommendJobsForUser($user, $limit)
            ->map(fn (array $item) => [
                'job_id' => $item['job']->id,
                'title' => $item['job']->title,
                'compatibility' => $item['match'],
            ])
            ->all();
    }

    private function matchPrompt(User $user, WorkJob $job): string
    {
        $skills = $user->skills->pluck('name')->implode(', ');

        return "Perfil freelancer: {$skills}. Trabajo: {$job->title}. {$job->description}. Explica compatibilidad brevemente.";
    }

    private function askAi(string $prompt, int $fallbackScore): string
    {
        if (! $this->hasAiKey()) {
            return "Compatibilidad estimada: {$fallbackScore}%. Basado en habilidades, reputación y ubicación.";
        }

        $key = config('services.gemini.key') ?: config('services.openai.key');
        $provider = config('services.gemini.key') ? 'gemini' : 'openai';

        try {
            if ($provider === 'gemini') {
                $response = Http::timeout(15)->post(
                    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key='.$key,
                    [
                        'contents' => [['parts' => [['text' => $prompt]]]],
                    ],
                );

                if ($response->successful()) {
                    return $response->json('candidates.0.content.parts.0.text')
                        ?? "Compatibilidad: {$fallbackScore}%";
                }
            }

            $response = Http::withToken($key)->timeout(15)->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-4o-mini',
                'messages' => [
                    ['role' => 'user', 'content' => $prompt],
                ],
                'max_tokens' => 120,
            ]);

            if ($response->successful()) {
                return $response->json('choices.0.message.content')
                    ?? "Compatibilidad: {$fallbackScore}%";
            }
        } catch (\Throwable) {
            // fallback local
        }

        return "Compatibilidad estimada: {$fallbackScore}%.";
    }

    private function hasAiKey(): bool
    {
        return (bool) (config('services.gemini.key') || config('services.openai.key'));
    }
}
